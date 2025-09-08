/**
 * 智能模板生成器
 * 基于语言检测结果生成项目特定的文档模板
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import LanguageDetector from './detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LanguageTemplateGenerator {
    constructor() {
        this.detector = new LanguageDetector();
        this.templatesPath = path.join(__dirname, '../../prompts/templates');
        this.languagesPath = path.join(__dirname, '../../prompts/languages');
    }

    /**
     * 为项目生成语言特定的模板
     * @param {string} projectPath - 项目路径
     * @param {string} templateName - 模板名称
     * @returns {Object} 生成的模板内容和元信息
     */
    async generateTemplate(projectPath, templateName) {
        try {
            // 1. 检测项目语言
            const detection = await this.detector.detectLanguage(projectPath);
            
            // 2. 加载语言配置和默认值
            const languageConfig = await this.loadLanguageConfig(detection.language);
            const defaults = await this.loadLanguageDefaults(detection.language);
            
            // 3. 加载基础模板
            const baseTemplate = await this.loadBaseTemplate(templateName);
            
            // 4. 检查是否有语言特定的模板变体
            const languageTemplate = await this.loadLanguageTemplate(detection.language, templateName);
            
            // 5. 生成最终模板
            const finalTemplate = languageTemplate || baseTemplate;
            
            // 6. 替换模板变量
            const renderedTemplate = this.renderTemplate(
                finalTemplate, 
                defaults,
                detection,
                languageConfig
            );
            
            return {
                success: true,
                language: detection.language,
                confidence: detection.confidence,
                frameworks: detection.frameworks,
                template: renderedTemplate,
                metadata: {
                    templateName,
                    language: detection.language,
                    hasLanguageVariant: !!languageTemplate,
                    generatedAt: new Date().toISOString(),
                    suggestions: detection.suggestions
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallback: await this.generateFallbackTemplate(templateName)
            };
        }
    }

    /**
     * 加载语言配置文件
     * @param {string} language - 语言类型
     * @returns {Object} 语言配置
     */
    async loadLanguageConfig(language) {
        const configPath = path.join(this.languagesPath, language, 'config.json');
        
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
        }
        
        // 回退到通用配置
        const commonConfigPath = path.join(this.languagesPath, 'common', 'config.json');
        if (fs.existsSync(commonConfigPath)) {
            const configContent = fs.readFileSync(commonConfigPath, 'utf8');
            return JSON.parse(configContent);
        }
        
        return {};
    }

    /**
     * 加载语言默认变量
     * @param {string} language - 语言类型
     * @returns {Object} 默认变量
     */
    async loadLanguageDefaults(language) {
        const defaultsPath = path.join(this.languagesPath, language, 'defaults.json');
        
        if (fs.existsSync(defaultsPath)) {
            const defaultsContent = fs.readFileSync(defaultsPath, 'utf8');
            return JSON.parse(defaultsContent);
        }
        
        // 回退到通用默认值
        const commonDefaultsPath = path.join(this.languagesPath, 'common', 'defaults.json');
        if (fs.existsSync(commonDefaultsPath)) {
            const defaultsContent = fs.readFileSync(commonDefaultsPath, 'utf8');
            return JSON.parse(defaultsContent);
        }
        
        return { template_variables: {} };
    }

    /**
     * 加载基础模板
     * @param {string} templateName - 模板名称
     * @returns {string} 模板内容
     */
    async loadBaseTemplate(templateName) {
        const templatePath = path.join(this.templatesPath, `${templateName}.md`);
        
        if (fs.existsSync(templatePath)) {
            return fs.readFileSync(templatePath, 'utf8');
        }
        
        throw new Error(`模板不存在: ${templateName}`);
    }

    /**
     * 加载语言特定的模板变体
     * @param {string} language - 语言类型
     * @param {string} templateName - 模板名称
     * @returns {string|null} 语言特定模板内容
     */
    async loadLanguageTemplate(language, templateName) {
        const variantPath = path.join(this.templatesPath, 'language-variants', language, `${templateName}.md`);
        
        if (fs.existsSync(variantPath)) {
            return fs.readFileSync(variantPath, 'utf8');
        }
        
        return null;
    }

    /**
     * 渲染模板，替换变量占位符
     * @param {string} template - 模板内容
     * @param {Object} defaults - 默认变量
     * @param {Object} detection - 检测结果
     * @param {Object} config - 语言配置
     * @returns {string} 渲染后的模板
     */
    renderTemplate(template, defaults, detection, config) {
        let rendered = template;
        
        // 基础项目信息
        const projectInfo = {
            project_name: path.basename(process.cwd()),
            version: '1.0.0',
            timestamp: new Date().toLocaleDateString('zh-CN'),
            author: 'mg_kiro系统',
            language: detection.language,
            confidence: detection.confidence
        };

        // 合并所有变量来源
        const allVariables = {
            ...projectInfo,
            ...defaults.template_variables,
            ...this.extractFrameworkVariables(detection.frameworks, config),
            ...this.extractProjectVariables(detection)
        };

        // 替换模板变量
        rendered = this.replaceTemplateVariables(rendered, allVariables);
        
        // 添加语言特定的注释和说明
        rendered = this.addLanguageSpecificNotes(rendered, detection.language, detection.suggestions);
        
        return rendered;
    }

    /**
     * 从框架信息中提取变量
     * @param {Array} frameworks - 检测到的框架
     * @param {Object} config - 语言配置
     * @returns {Object} 框架变量
     */
    extractFrameworkVariables(frameworks, config) {
        const variables = {};
        
        if (frameworks && frameworks.length > 0) {
            const primaryFramework = frameworks[0];
            variables.primary_framework = primaryFramework.name;
            variables.framework_confidence = primaryFramework.confidence;
            
            // 根据框架类型设置技术栈变量
            if (config.frameworks) {
                const frameworkConfig = config.frameworks.find(f => 
                    f.name.toLowerCase() === primaryFramework.name.toLowerCase()
                );
                
                if (frameworkConfig) {
                    if (frameworkConfig.category === 'frontend') {
                        variables.frontend_stack = frameworkConfig.name;
                    } else if (frameworkConfig.category === 'backend') {
                        variables.backend_stack = frameworkConfig.name;
                    }
                }
            }
        }
        
        return variables;
    }

    /**
     * 从项目检测结果中提取变量
     * @param {Object} detection - 检测结果
     * @returns {Object} 项目变量
     */
    extractProjectVariables(detection) {
        return {
            detected_language: detection.language,
            language_confidence: `${detection.confidence}%`,
            language_name: detection.details?.name || detection.language,
            alternative_languages: detection.alternatives?.map(a => a.language).join(', ') || '无'
        };
    }

    /**
     * 替换模板中的变量占位符
     * @param {string} template - 模板内容
     * @param {Object} variables - 变量对象
     * @returns {string} 替换后的模板
     */
    replaceTemplateVariables(template, variables) {
        let result = template;
        
        // 替换 {{variable}} 格式的占位符
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const value = variables[key] || `待配置_${key}`;
            result = result.replace(regex, value);
        });
        
        // 处理嵌套的模板变量（如果某个模板变量的值包含其他变量的引用）
        const nestedRegex = /{{(\w+)}}/g;
        let matches = result.match(nestedRegex);
        let iterations = 0;
        const maxIterations = 5; // 防止无限循环
        
        while (matches && iterations < maxIterations) {
            matches.forEach(match => {
                const key = match.replace('{{', '').replace('}}', '');
                const value = variables[key] || `[${key}]`;
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });
            matches = result.match(nestedRegex);
            iterations++;
        }
        
        return result;
    }

    /**
     * 添加语言特定的注释和说明
     * @param {string} template - 模板内容
     * @param {string} language - 语言类型
     * @param {Array} suggestions - 建议列表
     * @returns {string} 添加注释后的模板
     */
    addLanguageSpecificNotes(template, language, suggestions) {
        let enhanced = template;
        
        // 在文档末尾添加语言特定的注释
        const languageNotes = `

## 🔧 ${language}项目特定说明

### 检测信息
- **语言**: ${language}
- **检测时间**: ${new Date().toLocaleString('zh-CN')}
- **生成工具**: mg_kiro MCP 语言模块

### 建议和优化
${suggestions.map(s => `- ${s}`).join('\n')}

### 相关资源
- [${language}官方文档](${this.getLanguageDocUrl(language)})
- [最佳实践指南](${this.getBestPracticesUrl(language)})
- [社区资源](${this.getCommunityUrl(language)})

---
*本文档由 mg_kiro MCP 系统根据${language}项目特征自动生成*`;

        enhanced += languageNotes;
        
        return enhanced;
    }

    /**
     * 生成回退模板（当语言检测失败时）
     * @param {string} templateName - 模板名称
     * @returns {string} 回退模板内容
     */
    async generateFallbackTemplate(templateName) {
        try {
            const baseTemplate = await this.loadBaseTemplate(templateName);
            const commonDefaults = await this.loadLanguageDefaults('common');
            
            return this.renderTemplate(baseTemplate, commonDefaults, {
                language: 'unknown',
                confidence: 0,
                frameworks: [],
                suggestions: ['请手动配置项目语言信息']
            }, {});
        } catch (error) {
            return `# ${templateName}

> 模板生成失败: ${error.message}
> 请手动创建此文档

## 说明

由于无法自动检测项目语言或加载模板，请根据项目实际情况手动编写此文档。

---
*本文档需要手动完成*`;
        }
    }

    /**
     * 获取语言官方文档URL
     * @param {string} language - 语言类型
     * @returns {string} 文档URL
     */
    getLanguageDocUrl(language) {
        const urls = {
            javascript: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
            python: 'https://docs.python.org/zh-cn/',
            java: 'https://docs.oracle.com/javase/',
            go: 'https://golang.org/doc/',
            rust: 'https://doc.rust-lang.org/',
            csharp: 'https://docs.microsoft.com/zh-cn/dotnet/csharp/'
        };
        
        return urls[language] || '#';
    }

    /**
     * 获取最佳实践指南URL
     * @param {string} language - 语言类型
     * @returns {string} 最佳实践URL
     */
    getBestPracticesUrl(language) {
        const urls = {
            javascript: 'https://github.com/airbnb/javascript',
            python: 'https://pep8.org/',
            java: 'https://google.github.io/styleguide/javaguide.html',
            go: 'https://golang.org/doc/effective_go.html',
            rust: 'https://doc.rust-lang.org/book/',
            csharp: 'https://docs.microsoft.com/dotnet/csharp/programming-guide/'
        };
        
        return urls[language] || '#';
    }

    /**
     * 获取社区资源URL
     * @param {string} language - 语言类型
     * @returns {string} 社区URL
     */
    getCommunityUrl(language) {
        const urls = {
            javascript: 'https://stackoverflow.com/questions/tagged/javascript',
            python: 'https://python.org/community/',
            java: 'https://stackoverflow.com/questions/tagged/java',
            go: 'https://golang.org/help/',
            rust: 'https://www.rust-lang.org/community',
            csharp: 'https://dotnet.microsoft.com/platform/community'
        };
        
        return urls[language] || '#';
    }

    /**
     * 批量生成多个模板
     * @param {string} projectPath - 项目路径
     * @param {Array} templateNames - 模板名称列表
     * @returns {Object} 批量生成结果
     */
    async generateMultipleTemplates(projectPath, templateNames) {
        const results = {};
        const detection = await this.detector.detectLanguage(projectPath);
        
        for (const templateName of templateNames) {
            try {
                results[templateName] = await this.generateTemplate(projectPath, templateName);
            } catch (error) {
                results[templateName] = {
                    success: false,
                    error: error.message,
                    templateName
                };
            }
        }
        
        return {
            language: detection.language,
            confidence: detection.confidence,
            templates: results,
            summary: {
                total: templateNames.length,
                success: Object.values(results).filter(r => r.success).length,
                failed: Object.values(results).filter(r => !r.success).length
            }
        };
    }
}

export default LanguageTemplateGenerator;