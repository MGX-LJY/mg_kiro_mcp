/**
 * MasterTemplateService - 统一模板服务
 * 整合TemplateReader、PromptManager、UnifiedTemplateService、LanguageTemplateGenerator
 * 消除代码重复，统一架构
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import LanguageIntelligenceService from '../language-intelligence-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MasterTemplateService {
    constructor(config = {}) {
        this.config = {
            cacheEnabled: config.cacheEnabled !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            maxCacheSize: config.maxCacheSize || 200,
            version: config.version || '3.0.0',
            enableIntelligence: config.enableIntelligence !== false,
            enableLanguageDetection: config.enableLanguageDetection !== false,
            ...config
        };

        this.promptsDir = path.join(__dirname, '../../..', 'prompts');
        
        // 统一缓存系统
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            totalRequests: 0
        };

        // 全局变量注册表
        this.globalVariables = new Map();
        
        // 语言智能系统（延迟注入，避免循环依赖）
        this.languageIntelligence = null;

        // 智能选择配置（简化版）
        this.intelligenceConfig = {
            languageWeights: {
                'javascript': 0.95, 'typescript': 0.92, 'python': 0.90,
                'java': 0.85, 'go': 0.80, 'rust': 0.75, 'csharp': 0.80,
                'general': 0.50
            },
            modeWeights: {
                'create': 0.95, 'fix': 0.90, 'init': 0.85, 'analyze': 0.75
            },
            confidenceThresholds: {
                high: 0.8, medium: 0.6, low: 0.4
            }
        };

        // 性能指标
        this.metrics = {
            totalSelections: 0,
            averageResponseTime: 0,
            strategyUsage: {
                'direct': 0, 'intelligent': 0, 'language-specific': 0, 'fallback': 0
            }
        };

        this._initialize();
    }

    /**
     * 初始化服务
     * @private
     */
    _initialize() {
        this._setupGlobalVariables();
        console.log(`[MasterTemplateService] v${this.config.version} initialized`);
    }

    /**
     * 设置全局变量
     * @private
     */
    _setupGlobalVariables() {
        this.globalVariables.set('timestamp', () => new Date().toISOString());
        this.globalVariables.set('version', () => this.config.version);
        this.globalVariables.set('server_name', () => 'mg_kiro MCP Server');
        this.globalVariables.set('current_mode', () => 'auto');
        this.globalVariables.set('project_name', () => path.basename(process.cwd()));
    }

    /**
     * 设置语言智能服务（用于依赖注入）
     * @param {LanguageIntelligenceService} languageIntelligence - 语言智能服务实例
     */
    setLanguageIntelligence(languageIntelligence) {
        this.languageIntelligence = languageIntelligence;
    }

    /**
     * 🎯 核心API：统一的模板获取接口
     * @param {Object} request 请求参数
     * @returns {Promise<Object>} 模板结果
     */
    async getTemplate(request) {
        const startTime = Date.now();
        this.cacheStats.totalRequests++;

        try {
            // 标准化请求参数
            const normalizedRequest = this._normalizeRequest(request);
            
            // 生成缓存键
            const cacheKey = this._generateCacheKey(normalizedRequest);
            
            // 检查缓存
            if (this.config.cacheEnabled && this._isValidCache(cacheKey)) {
                this.cacheStats.hits++;
                const cached = this._getCachedTemplate(cacheKey, normalizedRequest.variables);
                cached.responseTime = Date.now() - startTime;
                cached.fromCache = true;
                return cached;
            }

            this.cacheStats.misses++;

            // 选择处理策略
            const strategy = this._selectStrategy(normalizedRequest);
            
            // 执行策略
            let result;
            switch (strategy) {
                case 'direct':
                    result = await this._handleDirectTemplate(normalizedRequest);
                    break;
                case 'intelligent':
                    result = await this._handleIntelligentTemplate(normalizedRequest);
                    break;
                case 'language-specific':
                    result = await this._handleLanguageSpecificTemplate(normalizedRequest);
                    break;
                default:
                    result = await this._handleFallbackTemplate(normalizedRequest);
                    break;
            }

            // 记录指标
            this.metrics.totalSelections++;
            this.metrics.strategyUsage[strategy]++;
            
            // 缓存结果
            if (this.config.cacheEnabled && result.success) {
                this._cacheTemplate(cacheKey, result);
            }

            result.responseTime = Date.now() - startTime;
            result.strategy = strategy;
            result.fromCache = false;

            return result;

        } catch (error) {
            console.error('[MasterTemplateService] Template request failed:', error.message);
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime,
                strategy: 'error'
            };
        }
    }

    /**
     * 标准化请求参数
     * @private
     */
    _normalizeRequest(request) {
        // 支持多种调用方式，保持向后兼容
        if (typeof request === 'string') {
            // 简单字符串：模板名称
            return {
                name: request,
                category: 'generation',
                variables: {}
            };
        }

        if (request.category && request.name) {
            // 传统方式：{category, name, variables}
            return {
                category: request.category,
                name: request.name,
                variables: request.variables || {}
            };
        }

        // 智能方式：包含上下文信息
        return {
            category: request.category || this._inferCategory(request),
            name: request.name || this._inferTemplateName(request),
            variables: request.variables || {},
            context: {
                mode: request.mode,
                step: request.step,
                language: request.language,
                projectPath: request.projectPath,
                userIntent: request.userIntent,
                templateType: request.templateType
            }
        };
    }

    /**
     * 推断模板类别
     * @private
     */
    _inferCategory(request) {
        if (request.mode) {
            const modeCategories = {
                'init': 'generation',
                'create': 'generation', 
                'fix': 'analysis',
                'analyze': 'analysis'
            };
            return modeCategories[request.mode] || 'generation';
        }
        
        if (request.templateType) {
            const typeCategories = {
                'user-story': 'generation',
                'architecture': 'generation',
                'analysis': 'analysis'
            };
            return typeCategories[request.templateType] || 'generation';
        }

        return 'generation';
    }

    /**
     * 推断模板名称
     * @private
     */
    _inferTemplateName(request) {
        if (request.mode && request.step) {
            const modeStepMap = {
                'init': {
                    'scan_structure': 'system-architecture-analysis',
                    'generate_architecture': 'system-architecture-generation',
                    'analyze_modules': 'module-analysis'
                },
                'create': {
                    'plan_feature': 'feasibility-analysis',
                    'create_module': 'module-documentation-generation'
                }
            };
            return modeStepMap[request.mode]?.[request.step];
        }

        if (request.templateType) {
            return request.templateType;
        }

        return 'default-template';
    }

    /**
     * 选择处理策略
     * @private
     */
    _selectStrategy(request) {
        // 直接指定模板
        if (request.category && request.name) {
            return 'direct';
        }

        // 有语言信息且启用智能服务
        if (request.context?.language && 
            request.context.language !== 'auto' && 
            this.languageIntelligence) {
            return 'language-specific';
        }

        // 有足够上下文信息且启用智能服务
        if ((request.context?.mode || request.context?.templateType) && 
            this.languageIntelligence) {
            return 'intelligent';
        }

        return 'fallback';
    }

    /**
     * 处理直接模板请求
     * @private
     */
    async _handleDirectTemplate(request) {
        const templateData = await this._readTemplateFile(request.category, request.name);
        
        if (!templateData) {
            throw new Error(`Template not found: ${request.category}/${request.name}`);
        }

        const processedContent = this._processVariables(templateData.content, request.variables);

        return {
            success: true,
            content: processedContent,
            metadata: {
                category: request.category,
                name: request.name,
                type: 'direct',
                size: processedContent.length,
                lastModified: templateData.lastModified
            }
        };
    }

    /**
     * 处理智能模板请求
     * @private
     */
    async _handleIntelligentTemplate(request) {
        if (!this.languageIntelligence) {
            return await this._handleFallbackTemplate(request);
        }

        try {
            const { mode, step, templateType, projectPath } = request.context;

            // 尝试语言检测（如果有项目路径）
            let detectedLanguage = request.context.language;
            if (projectPath && (!detectedLanguage || detectedLanguage === 'auto')) {
                try {
                    const detection = await this.languageIntelligence.detectProjectLanguage(projectPath);
                    detectedLanguage = detection.language;
                } catch (error) {
                    console.warn('[MasterTemplateService] Language detection failed:', error.message);
                    detectedLanguage = 'general';
                }
            }

            // 尝试智能生成
            if (detectedLanguage && detectedLanguage !== 'general') {
                const contextualPrompts = await this.languageIntelligence.generateContextualPrompts({
                    projectPath: projectPath || process.cwd(),
                    currentTask: `${mode}-${step}`,
                    userIntent: request.context.userIntent || ''
                });

                if (contextualPrompts.success) {
                    return {
                        success: true,
                        content: this._formatContextualPrompts(contextualPrompts),
                        metadata: {
                            type: 'intelligent',
                            language: detectedLanguage,
                            source: 'language-intelligence',
                            confidence: contextualPrompts.confidence || 0.8
                        }
                    };
                }
            }

            // 回退到直接模板
            return await this._handleDirectTemplate(request);

        } catch (error) {
            console.warn('[MasterTemplateService] Intelligent processing failed:', error.message);
            return await this._handleFallbackTemplate(request);
        }
    }

    /**
     * 处理语言特定模板请求
     * @private
     */
    async _handleLanguageSpecificTemplate(request) {
        if (!this.languageIntelligence) {
            return await this._handleDirectTemplate(request);
        }

        try {
            const language = request.context.language;
            const languagePrompts = await this.languageIntelligence.getLanguageSpecificPrompts(language);

            if (languagePrompts.success) {
                return {
                    success: true,
                    content: this._formatLanguagePrompts(languagePrompts.prompts, language),
                    metadata: {
                        type: 'language-specific',
                        language: language,
                        source: 'language-intelligence'
                    }
                };
            }

            // 回退到直接模板
            return await this._handleDirectTemplate(request);

        } catch (error) {
            console.warn('[MasterTemplateService] Language-specific processing failed:', error.message);
            return await this._handleDirectTemplate(request);
        }
    }

    /**
     * 处理回退模板请求
     * @private
     */
    async _handleFallbackTemplate(request) {
        // 尝试从请求中推断的模板
        try {
            const fallbackData = await this._readTemplateFile(request.category, request.name);
            if (fallbackData) {
                const processedContent = this._processVariables(fallbackData.content, request.variables);
                return {
                    success: true,
                    content: processedContent,
                    metadata: {
                        type: 'fallback',
                        category: request.category,
                        name: request.name
                    }
                };
            }
        } catch (error) {
            // Continue to generate fallback content
        }

        // 生成默认内容
        const fallbackContent = this._generateFallbackContent(request);
        
        return {
            success: true,
            content: fallbackContent,
            metadata: {
                type: 'generated-fallback',
                warning: 'No specific template found, generated generic content'
            }
        };
    }

    /**
     * 读取模板文件
     * @private
     */
    async _readTemplateFile(category, name) {
        try {
            const filePath = this._buildTemplatePath(category, name);
            
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);

            return {
                content,
                size: content.length,
                lastModified: stats.mtime,
                path: filePath
            };

        } catch (error) {
            console.error(`[MasterTemplateService] Read template failed ${category}/${name}:`, error.message);
            return null;
        }
    }

    /**
     * 构建模板文件路径
     * @private
     */
    _buildTemplatePath(category, name) {
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        
        // 首先检查特定的模板路径映射（基于实际请求路径）
        const specificMappings = {
            'templates/architecture/system-architecture-generation': 'generation/architecture/system-architecture-generation.md',
            'templates/existing-project-requirement': 'modes/create/existing-project-requirement/template.md',
            'templates/new-project-requirement': 'modes/create/new-project-requirement/template.md'
        };
        
        const fullTemplateName = `${category}/${name}`;
        if (specificMappings[fullTemplateName]) {
            const specificPath = path.join(this.promptsDir, specificMappings[fullTemplateName]);
            if (fs.existsSync(specificPath)) {
                return specificPath;
            }
        }
        
        // 统一的类别映射
        const categoryPaths = {
            'modes': 'modes',
            'analysis': 'templates/analysis',
            'generation': 'generation',
            'snippets': 'snippets',
            'languages': 'languages',
            // 向后兼容映射
            'analysis-templates': 'templates/analysis',
            'document-templates': 'modes/create',
            'templates': 'modes/create'
        };

        const categoryDir = categoryPaths[category] || category;
        const basePath = path.join(this.promptsDir, categoryDir);
        
        // 直接路径
        const directPath = path.join(basePath, fileName);
        if (fs.existsSync(directPath)) {
            return directPath;
        }

        // 递归查找
        return this._findTemplateInSubdirs(basePath, fileName);
    }

    /**
     * 递归查找模板文件
     * @private
     */
    _findTemplateInSubdirs(baseDir, fileName) {
        try {
            if (!fs.existsSync(baseDir)) {
                return path.join(baseDir, fileName);
            }

            const items = fs.readdirSync(baseDir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory()) {
                    const subDirPath = path.join(baseDir, item.name);
                    const filePath = path.join(subDirPath, fileName);
                    
                    if (fs.existsSync(filePath)) {
                        return filePath;
                    }
                    
                    const deepPath = this._findTemplateInSubdirs(subDirPath, fileName);
                    if (fs.existsSync(deepPath)) {
                        return deepPath;
                    }
                }
            }
        } catch (error) {
            console.warn(`[MasterTemplateService] Subdirectory search failed ${baseDir}:`, error.message);
        }
        
        return path.join(baseDir, fileName);
    }

    /**
     * 处理模板变量
     * @private
     */
    _processVariables(content, variables = {}) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        let processed = content;
        
        // 合并全局变量和传入变量
        const allVariables = new Map();
        
        // 全局变量
        for (const [key, value] of this.globalVariables) {
            allVariables.set(key, typeof value === 'function' ? value() : value);
        }
        
        // 传入变量（覆盖全局变量）
        for (const [key, value] of Object.entries(variables)) {
            allVariables.set(key, value);
        }

        // 替换变量 {{variable}}
        for (const [key, value] of allVariables) {
            const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            processed = processed.replace(pattern, String(value));
        }

        return processed;
    }

    /**
     * 格式化上下文提示词
     * @private
     */
    _formatContextualPrompts(contextualPrompts) {
        let content = '# 上下文感知模板\n\n';
        content += '*由mg_kiro语言智能系统生成*\n\n';
        
        if (contextualPrompts.prompts) {
            Object.keys(contextualPrompts.prompts).forEach(category => {
                content += `## ${category}\n\n`;
                const prompts = contextualPrompts.prompts[category];
                if (typeof prompts === 'object') {
                    Object.keys(prompts).forEach(key => {
                        content += `- **${key}**: ${prompts[key]}\n`;
                    });
                }
                content += '\n';
            });
        }

        if (contextualPrompts.suggestions) {
            content += '## 建议\n\n';
            contextualPrompts.suggestions.forEach(suggestion => {
                content += `- ${suggestion.content || suggestion}\n`;
            });
        }

        return content;
    }

    /**
     * 格式化语言特定提示词
     * @private
     */
    _formatLanguagePrompts(prompts, language) {
        let content = `# ${language}专用模板\n\n`;
        content += `*针对${language}项目优化*\n\n`;
        
        Object.keys(prompts).forEach(category => {
            content += `## ${category}\n\n`;
            const categoryPrompts = prompts[category];
            if (typeof categoryPrompts === 'object') {
                Object.keys(categoryPrompts).forEach(key => {
                    content += `- **${key}**: ${categoryPrompts[key]}\n`;
                });
            }
            content += '\n';
        });

        return content;
    }

    /**
     * 生成回退内容
     * @private
     */
    _generateFallbackContent(request) {
        const context = request.context || {};
        
        return `# ${context.mode || 'General'} 模板

## 自动生成说明

此模板由MasterTemplateService自动生成。

## 请求信息

- **类别**: ${request.category || 'unknown'}
- **名称**: ${request.name || 'unknown'}
- **模式**: ${context.mode || 'unknown'}
- **步骤**: ${context.step || 'unknown'}
- **语言**: ${context.language || 'unknown'}

## 建议

1. 检查模板名称和类别是否正确
2. 确认相关模板文件是否存在
3. 验证语言检测结果

${Object.keys(request.variables).length > 0 ? 
`## 变量\n\n\`\`\`json\n${JSON.stringify(request.variables, null, 2)}\n\`\`\`` : ''}

---
*Generated by MasterTemplateService v${this.config.version}*`;
    }

    /**
     * 缓存相关方法
     */

    _generateCacheKey(request) {
        const key = JSON.stringify({
            category: request.category,
            name: request.name,
            variables: request.variables,
            context: request.context
        });
        return crypto.createHash('md5').update(key).digest('hex');
    }

    _isValidCache(cacheKey) {
        if (!this.cache.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey);
        return (Date.now() - timestamp) < this.config.cacheTTL;
    }

    _getCachedTemplate(cacheKey, variables) {
        const cached = this.cache.get(cacheKey);
        // 重新处理变量（变量可能会变化）
        if (cached.rawContent) {
            cached.content = this._processVariables(cached.rawContent, variables);
        }
        return { ...cached, cached: true };
    }

    _cacheTemplate(cacheKey, result) {
        // 限制缓存大小
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.cacheTimestamps.delete(firstKey);
        }

        // 存储原始内容用于重新处理变量
        const cacheData = {
            ...result,
            rawContent: result.content
        };

        this.cache.set(cacheKey, cacheData);
        this.cacheTimestamps.set(cacheKey, Date.now());
    }

    /**
     * 公共API方法
     */

    /**
     * 向后兼容的loadPrompt方法
     */
    async loadPrompt(category, name, variables = {}) {
        const result = await this.getTemplate({
            category,
            name,
            variables
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return {
            category,
            name,
            content: result.content,
            variables,
            cached: result.fromCache || false,
            source: result.strategy
        };
    }

    /**
     * 向后兼容的readTemplate方法
     */
    async readTemplate(category, name) {
        const templateData = await this._readTemplateFile(category, name);
        return templateData;
    }

    /**
     * 列出模板
     */
    async listTemplates(category = null) {
        try {
            const categories = category ? [category] : ['modes', 'templates', 'snippets', 'languages'];
            const allTemplates = [];

            for (const cat of categories) {
                const categoryPath = this._getCategoryPath(cat);
                if (fs.existsSync(categoryPath)) {
                    const templates = this._listTemplatesRecursive(categoryPath, cat);
                    allTemplates.push(...templates);
                }
            }

            return {
                templates: allTemplates,
                total: allTemplates.length,
                category: category || 'all'
            };
        } catch (error) {
            console.error('[MasterTemplateService] List templates failed:', error.message);
            return { templates: [], total: 0, error: error.message };
        }
    }

    _getCategoryPath(category) {
        const categoryPaths = {
            'modes': 'modes',
            'templates': 'templates',
            'snippets': 'snippets',
            'languages': 'languages',
            'analysis': 'templates/analysis',
            'generation': 'templates'
        };
        
        const categoryDir = categoryPaths[category] || category;
        return path.join(this.promptsDir, categoryDir);
    }

    _listTemplatesRecursive(dir, category, subPath = '') {
        const templates = [];
        
        try {
            if (!fs.existsSync(dir)) {
                return templates;
            }

            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    const subCategory = subPath ? `${subPath}/${item.name}` : item.name;
                    const subTemplates = this._listTemplatesRecursive(fullPath, category, subCategory);
                    templates.push(...subTemplates);
                } else if (item.name.endsWith('.md')) {
                    const templateName = item.name.replace('.md', '');
                    const displayName = subPath ? `${subPath}/${templateName}` : templateName;
                    
                    templates.push({
                        name: templateName,
                        displayName,
                        category,
                        subcategory: subPath || null,
                        path: fullPath,
                        size: fs.statSync(fullPath).size
                    });
                }
            }
        } catch (error) {
            console.warn(`[MasterTemplateService] List recursive failed ${dir}:`, error.message);
        }
        
        return templates;
    }

    /**
     * 设置全局变量
     */
    setGlobalVariable(key, value) {
        this.globalVariables.set(key, value);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        this.cacheStats = { hits: 0, misses: 0, totalRequests: 0 };
        console.log('[MasterTemplateService] Cache cleared');
    }

    /**
     * 获取服务状态
     */
    getServiceStats() {
        const hitRate = this.cacheStats.totalRequests > 0 
            ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(2)
            : '0.00';

        return {
            version: this.config.version,
            initialized: true,
            cache: {
                enabled: this.config.cacheEnabled,
                size: this.cache.size,
                maxSize: this.config.maxCacheSize,
                hitRate: `${hitRate}%`,
                stats: this.cacheStats
            },
            capabilities: {
                directTemplates: true,
                intelligentGeneration: !!this.languageIntelligence,
                languageSpecific: !!this.languageIntelligence,
                fallbackGeneration: true
            },
            metrics: {
                ...this.metrics,
                strategyPercentages: this._calculateStrategyPercentages()
            },
            globalVariables: Array.from(this.globalVariables.keys()),
            health: this._getHealthStatus()
        };
    }

    _calculateStrategyPercentages() {
        const total = this.metrics.totalSelections;
        if (total === 0) return {};
        
        const percentages = {};
        for (const [strategy, count] of Object.entries(this.metrics.strategyUsage)) {
            percentages[strategy] = ((count / total) * 100).toFixed(2) + '%';
        }
        return percentages;
    }

    _getHealthStatus() {
        const hitRate = this.cacheStats.totalRequests > 0 
            ? (this.cacheStats.hits / this.cacheStats.totalRequests)
            : 0;

        if (hitRate >= 0.8) return '优秀';
        if (hitRate >= 0.6) return '良好';
        if (hitRate >= 0.4) return '一般';
        return '需优化';
    }
}

export default MasterTemplateService;