/**
 * ModeTemplateService - 按模式区分的模板管理系统 v4.0
 * 
 * 核心特性：
 * - 按工作模式(init/create/fix/analyze)组织模板
 * - 支持步骤级别的精确模板选择
 * - 语言特定的模板变体支持
 * - 智能回退机制
 * - 统一的模板API接口
 * 
 * 架构设计：
 * prompts/modes/{mode}/{step}/template.md
 * prompts/languages/{lang}/{mode}-variants/
 * prompts/shared/common/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ModeTemplateService {
    constructor(config = {}) {
        this.config = {
            version: '4.0.0',
            enableCache: config.enableCache !== false,
            cacheTTL: config.cacheTTL || 3600000,
            maxCacheSize: config.maxCacheSize || 300,
            enableIntelligence: config.enableIntelligence !== false,
            defaultLanguage: config.defaultLanguage || 'general',
            ...config
        };

        // 路径配置
        this.basePath = path.join(__dirname, '../../..');
        this.promptsPath = path.join(this.basePath, 'prompts');
        
        this.paths = {
            modes: path.join(this.promptsPath, 'modes'),
            languages: path.join(this.promptsPath, 'languages'),  
            shared: path.join(this.promptsPath, 'shared'),
            // 兼容旧路径
            legacy: {
                templates: path.join(this.promptsPath, 'templates'),
                oldModes: path.join(this.promptsPath, 'modes')
            }
        };

        // 缓存系统
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            total: 0
        };

        // 模式定义
        this.modeDefinitions = {
            init: {
                name: 'Init模式',
                description: '项目初始化和文档生成 - 6步完整流程',
                steps: ['project-analysis', 'task-creation', 'file-documentation', 'module-integration', 'relations-analysis', 'architecture-generation'],
                templatePrefix: 'init',
                priority: 100,
                multiDocumentSteps: {
                    'file-documentation': ['file-analysis.md'],
                    'module-integration': ['module-integration.md', 'module-files.md', 'module-overview.md'], 
                    'relations-analysis': ['function-calls.md', 'dependencies.md', 'data-flows.md', 'relations-overview.md', 'relations-analysis.md'],
                    'architecture-generation': ['architecture-docs.md']
                }
            },
            create: {
                name: 'Create模式',
                description: '新功能开发和模块创建',
                steps: ['feature-planning', 'module-creation', 'existing-project', 'new-project'],
                templatePrefix: 'create',
                priority: 95
            },
            fix: {
                name: 'Fix模式', 
                description: '问题修复和代码优化',
                steps: ['issue-analysis', 'diagnosis', 'resolution'],
                templatePrefix: 'fix',
                priority: 90
            },
            analyze: {
                name: 'Analyze模式',
                description: '代码分析和质量评估', 
                steps: ['quality-analysis', 'security-analysis', 'performance-analysis'],
                templatePrefix: 'analyze',
                priority: 85
            }
        };

        // 语言支持
        this.supportedLanguages = [
            'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'csharp', 'general'
        ];

        // 性能指标
        this.metrics = {
            totalRequests: 0,
            modeRequests: {},
            stepRequests: {},
            languageRequests: {},
            averageResponseTime: 0,
            successRate: 0
        };

        this._initialize();
    }

    /**
     * 初始化服务
     * @private
     */
    _initialize() {
        console.log(`[ModeTemplateService] v${this.config.version} 初始化中...`);
        
        // 初始化指标
        Object.keys(this.modeDefinitions).forEach(mode => {
            this.metrics.modeRequests[mode] = 0;
        });

        // 预热缓存（可选）
        if (this.config.enableCache) {
            this._warmupCache();
        }

        console.log(`[ModeTemplateService] 初始化完成`);
        console.log(`  - 支持模式: ${Object.keys(this.modeDefinitions).join(', ')}`);
        console.log(`  - 支持语言: ${this.supportedLanguages.join(', ')}`);
        console.log(`  - 缓存启用: ${this.config.enableCache}`);
    }

    /**
     * 🎯 主API：按模式和步骤获取模板
     * @param {Object} request - 模板请求
     * @returns {Promise<Object>} 模板结果
     */
    async getTemplateByMode(request) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        this.cacheStats.total++;

        try {
            // 标准化请求
            const normalizedRequest = this._normalizeRequest(request);
            
            // 验证请求
            const validation = this._validateRequest(normalizedRequest);
            if (!validation.valid) {
                throw new Error(`请求验证失败: ${validation.error}`);
            }

            // 检查缓存
            const cacheKey = this._generateCacheKey(normalizedRequest);
            if (this.config.enableCache && this._isValidCache(cacheKey)) {
                this.cacheStats.hits++;
                const cached = this._getCachedTemplate(cacheKey, normalizedRequest.variables);
                cached.responseTime = Date.now() - startTime;
                cached.fromCache = true;
                return cached;
            }

            this.cacheStats.misses++;

            // 选择模板获取策略
            const strategy = this._selectStrategy(normalizedRequest);
            
            // 执行模板获取
            const result = await this._executeStrategy(strategy, normalizedRequest);
            
            // 更新指标
            this._updateMetrics(normalizedRequest, Date.now() - startTime, true);
            
            // 缓存结果
            if (this.config.enableCache && result.success) {
                this._cacheTemplate(cacheKey, result);
            }

            result.responseTime = Date.now() - startTime;
            result.strategy = strategy;
            result.fromCache = false;

            return result;

        } catch (error) {
            this._updateMetrics(request, Date.now() - startTime, false);
            console.error('[ModeTemplateService] 模板获取失败:', error.message);
            
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime,
                mode: request.mode,
                step: request.step
            };
        }
    }

    /**
     * 标准化请求参数
     * @private
     */
    _normalizeRequest(request) {
        // 支持多种调用方式
        if (typeof request === 'string') {
            // 简单字符串：假设是模板名
            return {
                mode: 'general',
                step: request,
                language: this.config.defaultLanguage,
                variables: {}
            };
        }

        return {
            mode: request.mode || 'general',
            step: request.step || 'default',
            language: request.language || this.config.defaultLanguage,
            variables: request.variables || {},
            templateName: request.templateName || null,
            fallback: request.fallback !== false,
            preferLanguageVariant: request.preferLanguageVariant !== false,
            context: request.context || {}
        };
    }

    /**
     * 验证请求参数
     * @private
     */
    _validateRequest(request) {
        // 验证模式
        if (request.mode !== 'general' && !this.modeDefinitions[request.mode]) {
            return {
                valid: false,
                error: `不支持的模式: ${request.mode}. 支持的模式: ${Object.keys(this.modeDefinitions).join(', ')}`
            };
        }

        // 验证步骤（对于特定模式）
        if (request.mode !== 'general' && request.step !== 'default') {
            const modeSteps = this.modeDefinitions[request.mode].steps;
            if (!modeSteps.includes(request.step)) {
                return {
                    valid: false,
                    error: `模式 ${request.mode} 不支持步骤 ${request.step}. 支持的步骤: ${modeSteps.join(', ')}`
                };
            }
        }

        // 验证语言
        if (!this.supportedLanguages.includes(request.language)) {
            console.warn(`[ModeTemplateService] 不支持的语言: ${request.language}, 使用默认语言`);
            request.language = this.config.defaultLanguage;
        }

        return { valid: true };
    }

    /**
     * 选择获取策略
     * @private
     */
    _selectStrategy(request) {
        // 1. 精确匹配：模式+步骤+语言变体
        if (request.mode !== 'general' && 
            request.step !== 'default' && 
            request.preferLanguageVariant &&
            request.language !== 'general') {
            return 'mode-step-language';
        }

        // 2. 模式+步骤匹配
        if (request.mode !== 'general' && request.step !== 'default') {
            return 'mode-step';
        }

        // 3. 仅模式匹配
        if (request.mode !== 'general') {
            return 'mode-only';
        }

        // 4. 直接模板名匹配
        if (request.templateName) {
            return 'direct-template';
        }

        // 5. 回退策略
        return 'fallback';
    }

    /**
     * 执行模板获取策略
     * @private
     */
    async _executeStrategy(strategy, request) {
        switch (strategy) {
            case 'mode-step-language':
                return await this._getModeStepLanguageTemplate(request);
            
            case 'mode-step':
                return await this._getModeStepTemplate(request);
            
            case 'mode-only':
                return await this._getModeTemplate(request);
            
            case 'direct-template':
                return await this._getDirectTemplate(request);
            
            case 'fallback':
            default:
                return await this._getFallbackTemplate(request);
        }
    }

    /**
     * 获取模式+步骤+语言的模板
     * @private
     */
    async _getModeStepLanguageTemplate(request) {
        const { mode, step, language } = request;
        
        // 尝试语言变体路径
        const languageVariantPath = path.join(
            this.paths.languages,
            language,
            `${mode}-variants`,
            step,
            'template.md'
        );

        if (fs.existsSync(languageVariantPath)) {
            const content = await this._readTemplateFile(languageVariantPath);
            const processedContent = this._processVariables(content, request.variables);
            
            return {
                success: true,
                content: processedContent,
                metadata: {
                    mode,
                    step, 
                    language,
                    type: 'mode-step-language',
                    path: languageVariantPath,
                    source: 'language-variant'
                }
            };
        }

        // 回退到模式+步骤
        return await this._getModeStepTemplate(request);
    }

    /**
     * 获取模式+步骤的模板（支持多文档）
     * @private
     */
    async _getModeStepTemplate(request) {
        const { mode, step } = request;
        
        // 检查是否为多文档步骤
        const modeDefinition = this.modeDefinitions[mode];
        const isMultiDocStep = modeDefinition?.multiDocumentSteps?.[step];
        
        if (isMultiDocStep) {
            return await this._getMultiDocumentTemplate(request, isMultiDocStep);
        }
        
        // 单文档步骤处理（原有逻辑）
        const modeStepPath = path.join(
            this.paths.modes,
            mode,
            step,
            'template.md'
        );

        if (fs.existsSync(modeStepPath)) {
            const content = await this._readTemplateFile(modeStepPath);
            const processedContent = this._processVariables(content, request.variables);
            
            return {
                success: true,
                content: processedContent,
                metadata: {
                    mode,
                    step,
                    type: 'mode-step',
                    path: modeStepPath,
                    source: 'mode-specific'
                }
            };
        }

        // 尝试替代文件名
        const alternatives = [
            `${step}.md`,
            'default.md',
            'template.md'
        ];

        const modeStepDir = path.join(this.paths.modes, mode, step);
        
        for (const alt of alternatives) {
            const altPath = path.join(modeStepDir, alt);
            if (fs.existsSync(altPath)) {
                const content = await this._readTemplateFile(altPath);
                const processedContent = this._processVariables(content, request.variables);
                
                return {
                    success: true,
                    content: processedContent,
                    metadata: {
                        mode,
                        step,
                        type: 'mode-step-alternative',
                        path: altPath,
                        source: 'mode-specific-alt'
                    }
                };
            }
        }

        // 回退到仅模式
        return await this._getModeTemplate(request);
    }

    /**
     * 获取多文档模板
     * @private
     */
    async _getMultiDocumentTemplate(request, templateFiles) {
        const { mode, step } = request;
        const stepDir = path.join(this.paths.modes, mode, step);
        
        if (!fs.existsSync(stepDir)) {
            throw new Error(`多文档步骤目录不存在: ${stepDir}`);
        }
        
        const documents = [];
        const errors = [];
        
        // 读取所有指定的模板文件
        for (const templateFile of templateFiles) {
            const templatePath = path.join(stepDir, templateFile);
            
            try {
                if (fs.existsSync(templatePath)) {
                    const content = await this._readTemplateFile(templatePath);
                    const processedContent = this._processVariables(content, request.variables);
                    
                    documents.push({
                        filename: templateFile,
                        name: templateFile.replace(/\.md$/, ''),
                        content: processedContent,
                        path: templatePath,
                        size: content.length
                    });
                } else {
                    errors.push(`模板文件不存在: ${templateFile}`);
                }
            } catch (error) {
                errors.push(`读取模板文件失败 ${templateFile}: ${error.message}`);
            }
        }
        
        if (documents.length === 0) {
            throw new Error(`无法读取任何模板文件: ${errors.join('; ')}`);
        }
        
        return {
            success: true,
            type: 'multi-document',
            documents: documents,
            documentCount: documents.length,
            metadata: {
                mode,
                step,
                type: 'multi-document',
                source: 'mode-step-multi',
                stepDirectory: stepDir,
                totalTemplates: templateFiles.length,
                successfulTemplates: documents.length,
                errors: errors.length > 0 ? errors : undefined
            }
        };
    }

    /**
     * 获取模式级别的模板
     * @private
     */
    async _getModeTemplate(request) {
        const { mode } = request;
        
        // 模式默认模板路径
        const modeDefaultPath = path.join(
            this.paths.modes,
            mode,
            'default.md'
        );

        if (fs.existsSync(modeDefaultPath)) {
            const content = await this._readTemplateFile(modeDefaultPath);
            const processedContent = this._processVariables(content, request.variables);
            
            return {
                success: true,
                content: processedContent,
                metadata: {
                    mode,
                    type: 'mode-only',
                    path: modeDefaultPath,
                    source: 'mode-default'
                }
            };
        }

        // 尝试旧路径兼容
        const legacyPath = path.join(this.paths.legacy.oldModes, `${mode}.md`);
        if (fs.existsSync(legacyPath)) {
            const content = await this._readTemplateFile(legacyPath);
            const processedContent = this._processVariables(content, request.variables);
            
            return {
                success: true,
                content: processedContent,
                metadata: {
                    mode,
                    type: 'mode-legacy',
                    path: legacyPath,
                    source: 'legacy-mode'
                }
            };
        }

        // 回退到共享模板
        return await this._getFallbackTemplate(request);
    }

    /**
     * 获取直接指定的模板
     * @private
     */
    async _getDirectTemplate(request) {
        const { templateName, mode } = request;
        
        // 尝试多个可能的路径
        const possiblePaths = [
            // 新架构路径
            path.join(this.paths.shared, 'common', `${templateName}.md`),
            // 旧架构路径
            path.join(this.paths.legacy.templates, `${templateName}.md`),
            // 模式特定路径
            mode ? path.join(this.paths.modes, mode, `${templateName}.md`) : null
        ].filter(Boolean);

        for (const templatePath of possiblePaths) {
            if (fs.existsSync(templatePath)) {
                const content = await this._readTemplateFile(templatePath);
                const processedContent = this._processVariables(content, request.variables);
                
                return {
                    success: true,
                    content: processedContent,
                    metadata: {
                        templateName,
                        type: 'direct',
                        path: templatePath,
                        source: 'direct-template'
                    }
                };
            }
        }

        throw new Error(`模板未找到: ${templateName}`);
    }

    /**
     * 获取回退模板
     * @private
     */
    async _getFallbackTemplate(request) {
        // 尝试通用共享模板
        const sharedDefaultPath = path.join(this.paths.shared, 'common', 'default.md');
        
        if (fs.existsSync(sharedDefaultPath)) {
            const content = await this._readTemplateFile(sharedDefaultPath);
            const processedContent = this._processVariables(content, request.variables);
            
            return {
                success: true,
                content: processedContent,
                metadata: {
                    type: 'fallback-shared',
                    path: sharedDefaultPath,
                    source: 'shared-default'
                }
            };
        }

        // 生成动态回退内容
        const fallbackContent = this._generateFallbackContent(request);
        
        return {
            success: true,
            content: fallbackContent,
            metadata: {
                type: 'fallback-generated',
                source: 'dynamic-generation',
                warning: '未找到匹配模板，已生成默认内容'
            }
        };
    }

    /**
     * 读取模板文件
     * @private
     */
    async _readTemplateFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`读取模板文件失败 ${filePath}: ${error.message}`);
        }
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

        // 内置变量
        const builtInVars = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            version: this.config.version,
            service_name: 'mg_kiro MCP Server'
        };

        // 合并所有变量
        const allVars = { ...builtInVars, ...variables };

        // 替换变量 {{variable}}
        for (const [key, value] of Object.entries(allVars)) {
            const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            processed = processed.replace(pattern, String(value));
        }

        return processed;
    }

    /**
     * 生成回退内容
     * @private
     */
    _generateFallbackContent(request) {
        const { mode, step, language } = request;
        
        return `# ${mode?.toUpperCase() || 'GENERAL'} 模式模板

## 自动生成说明

此模板由ModeTemplateService自动生成，因为未找到匹配的模板文件。

## 请求信息

- **模式**: ${mode || 'general'}
- **步骤**: ${step || 'default'}
- **语言**: ${language || 'general'}
- **生成时间**: ${new Date().toISOString()}

## 建议

1. 检查模板文件是否存在于正确路径
2. 确认模式和步骤名称是否正确
3. 考虑创建对应的模板文件

## 预期路径

以下是系统查找模板的路径顺序：

1. \`prompts/modes/${mode}/${step}/template.md\`
2. \`prompts/languages/${language}/${mode}-variants/${step}/template.md\`
3. \`prompts/modes/${mode}/default.md\`
4. \`prompts/shared/common/default.md\`

---
*Generated by ModeTemplateService v${this.config.version}*
*Service: mg_kiro MCP Server*`;
    }

    /**
     * 缓存相关方法
     */

    _generateCacheKey(request) {
        return `${request.mode}:${request.step}:${request.language}:${JSON.stringify(request.variables)}`;
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
        // 重新处理变量（因为变量可能会变化）
        if (cached.rawContent) {
            cached.content = this._processVariables(cached.rawContent, variables);
        }
        return { ...cached };
    }

    _cacheTemplate(cacheKey, result) {
        // 限制缓存大小
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.cacheTimestamps.delete(firstKey);
        }

        // 存储原始内容用于变量重处理
        const cacheData = {
            ...result,
            rawContent: result.content
        };

        this.cache.set(cacheKey, cacheData);
        this.cacheTimestamps.set(cacheKey, Date.now());
    }

    /**
     * 预热缓存
     * @private
     */
    _warmupCache() {
        // 可以在这里预加载常用模板到缓存
        console.log('[ModeTemplateService] 缓存预热...');
    }

    /**
     * 更新性能指标
     * @private
     */
    _updateMetrics(request, responseTime, success) {
        if (request.mode && this.metrics.modeRequests[request.mode] !== undefined) {
            this.metrics.modeRequests[request.mode]++;
        }

        if (request.step) {
            this.metrics.stepRequests[request.step] = (this.metrics.stepRequests[request.step] || 0) + 1;
        }

        if (request.language) {
            this.metrics.languageRequests[request.language] = (this.metrics.languageRequests[request.language] || 0) + 1;
        }

        // 更新平均响应时间
        const total = this.metrics.totalRequests;
        this.metrics.averageResponseTime = (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;

        // 更新成功率
        this.metrics.successRate = success ? 
            (this.metrics.successRate * (total - 1) + 1) / total :
            (this.metrics.successRate * (total - 1)) / total;
    }

    /**
     * 公共API方法
     */

    /**
     * 获取Init模式模板（支持多文档）
     */
    async getInitTemplate(step, language = 'general', variables = {}) {
        return await this.getTemplateByMode({
            mode: 'init',
            step,
            language,
            variables
        });
    }

    /**
     * 获取特定Init步骤的所有文档模板
     */
    async getInitStepDocuments(step, language = 'general', variables = {}) {
        const result = await this.getTemplateByMode({
            mode: 'init',
            step,
            language,
            variables
        });
        
        if (result.success && result.type === 'multi-document') {
            return {
                success: true,
                step: step,
                documents: result.documents,
                metadata: result.metadata
            };
        }
        
        // 对于单文档步骤，包装为文档数组
        if (result.success) {
            return {
                success: true,
                step: step,
                documents: [{
                    filename: 'template.md',
                    name: step,
                    content: result.content,
                    path: result.metadata?.path,
                    size: result.content?.length || 0
                }],
                metadata: result.metadata
            };
        }
        
        return result;
    }

    /**
     * 获取Init工作流的所有步骤文档
     */
    async getInitWorkflowDocuments(language = 'general', variables = {}) {
        const initDefinition = this.modeDefinitions.init;
        const workflowDocuments = {};
        const errors = [];
        
        for (const step of initDefinition.steps) {
            try {
                const stepResult = await this.getInitStepDocuments(step, language, variables);
                if (stepResult.success) {
                    workflowDocuments[step] = stepResult;
                } else {
                    errors.push(`步骤 ${step}: ${stepResult.error}`);
                }
            } catch (error) {
                errors.push(`步骤 ${step}: ${error.message}`);
            }
        }
        
        const totalDocuments = Object.values(workflowDocuments)
            .reduce((total, stepData) => total + (stepData.documents?.length || 0), 0);
        
        return {
            success: Object.keys(workflowDocuments).length > 0,
            workflow: 'init',
            steps: workflowDocuments,
            summary: {
                totalSteps: initDefinition.steps.length,
                successfulSteps: Object.keys(workflowDocuments).length,
                totalDocuments: totalDocuments,
                errors: errors.length > 0 ? errors : undefined
            }
        };
    }

    /**
     * 获取Create模式模板  
     */
    async getCreateTemplate(step, language = 'general', variables = {}) {
        return await this.getTemplateByMode({
            mode: 'create',
            step,
            language,
            variables
        });
    }

    /**
     * 获取Fix模式模板
     */
    async getFixTemplate(step, language = 'general', variables = {}) {
        return await this.getTemplateByMode({
            mode: 'fix',
            step,
            language,
            variables
        });
    }

    /**
     * 获取Analyze模式模板
     */
    async getAnalyzeTemplate(step, language = 'general', variables = {}) {
        return await this.getTemplateByMode({
            mode: 'analyze',
            step,
            language,
            variables
        });
    }

    /**
     * 列出可用模式
     */
    getAvailableModes() {
        return Object.entries(this.modeDefinitions).map(([key, def]) => ({
            mode: key,
            name: def.name,
            description: def.description,
            steps: def.steps,
            priority: def.priority
        }));
    }

    /**
     * 列出模式的可用步骤
     */
    getModeSteps(mode) {
        const definition = this.modeDefinitions[mode];
        if (!definition) {
            throw new Error(`模式不存在: ${mode}`);
        }
        return definition.steps;
    }

    /**
     * 列出可用语言
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * 获取服务状态
     */
    getServiceStatus() {
        const hitRate = this.cacheStats.total > 0 
            ? (this.cacheStats.hits / this.cacheStats.total * 100).toFixed(2)
            : '0.00';

        return {
            version: this.config.version,
            type: 'ModeTemplateService',
            status: 'running',
            
            // 配置信息
            configuration: {
                enableCache: this.config.enableCache,
                cacheTTL: this.config.cacheTTL,
                maxCacheSize: this.config.maxCacheSize,
                defaultLanguage: this.config.defaultLanguage
            },

            // 支持的模式和语言
            capabilities: {
                modes: Object.keys(this.modeDefinitions),
                languages: this.supportedLanguages,
                totalSteps: Object.values(this.modeDefinitions).reduce((sum, def) => sum + def.steps.length, 0),
                multiDocumentSupport: true,
                initWorkflowSteps: this.modeDefinitions.init.steps,
                multiDocumentSteps: Object.keys(this.modeDefinitions.init.multiDocumentSteps || {})
            },

            // 缓存状态
            cache: {
                size: this.cache.size,
                maxSize: this.config.maxCacheSize,
                hitRate: `${hitRate}%`,
                stats: this.cacheStats
            },

            // 性能指标
            metrics: {
                ...this.metrics,
                averageResponseTime: `${this.metrics.averageResponseTime.toFixed(2)}ms`,
                successRate: `${(this.metrics.successRate * 100).toFixed(2)}%`
            },

            // 路径信息
            paths: {
                ...this.paths,
                basePath: this.basePath
            }
        };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        this.cacheStats = { hits: 0, misses: 0, total: 0 };
        console.log('[ModeTemplateService] 缓存已清除');
    }

    /**
     * 重新加载配置
     */
    reload() {
        this.clearCache();
        this._warmupCache();
        console.log('[ModeTemplateService] 服务已重新加载');
    }
}

export default ModeTemplateService;