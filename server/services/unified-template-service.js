/**
 * 统一模板服务
 * 中央化模板管理的核心服务，集成语言智能和现有模板系统
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import LanguageIntelligenceService from './language-intelligence-service.js';
import TemplateReader from './template-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UnifiedTemplateService {
    constructor() {
        this.languageIntelligence = new LanguageIntelligenceService();
        this.templateReader = new TemplateReader();
        
        // 模板分类映射
        this.templateCategories = {
            'analysis-templates': 'analysis',
            'document-templates': 'document', 
            'templates': 'base',
            'modes': 'mode',
            'snippets': 'snippet'
        };

        // 智能模板选择缓存
        this.templateCache = new Map();
        this.maxCacheSize = 200;
        this.cacheHitCount = 0;
        this.totalRequests = 0;
        
        // 🧠 智能选择算法配置 (Enhanced)
        this.intelligenceConfig = {
            // 语言特定权重 - 基于使用频率和稳定性
            languageWeights: {
                'javascript': 0.95,    // 最高权重：成熟生态
                'typescript': 0.92,    // 高权重：类型安全
                'python': 0.90,        // 高权重：数据科学优势
                'java': 0.85,          // 中高权重：企业级
                'go': 0.80,            // 中权重：云原生
                'rust': 0.75,          // 中权重：系统编程
                'csharp': 0.80,        // 中权重：微软生态
                'general': 0.50        // 基础权重：通用模板
            },
            // 模式权重 - 基于业务价值和使用频率
            modeWeights: {
                'create': 0.95,        // 最高：新功能开发
                'fix': 0.90,           // 高：问题修复关键
                'init': 0.85,          // 中高：项目初始化
                'analyze': 0.75        // 中：分析辅助
            },
            // 上下文因子权重
            contextFactors: {
                hasProjectPath: 0.25,    // 项目路径存在
                hasLanguage: 0.35,       // 语言信息存在
                hasStep: 0.20,           // 工作流步骤存在
                hasUserIntent: 0.20      // 用户意图存在
            },
            // 置信度阈值
            confidenceThresholds: {
                high: 0.8,      // 高置信度：直接使用
                medium: 0.6,    // 中等置信度：需要验证
                low: 0.4        // 低置信度：使用回退策略
            }
        };
        
        // 📊 性能指标追踪
        this.performanceMetrics = {
            totalSelections: 0,
            averageResponseTime: 0,
            averageConfidence: 0,
            strategyDistribution: {
                'legacy-compatible': 0,
                'intelligent-generation': 0,
                'hybrid-selection': 0,
                'fallback': 0
            },
            confidenceHistory: [],
            responseTimeHistory: [],
            languageUsage: {},
            modeUsage: {}
        };
    }

    /**
     * 🎯 核心API: 基于上下文获取模板
     * @param {Object} contextData - 项目上下文信息
     * @param {Object} templateRequest - 模板请求信息
     * @returns {Promise<Object>} 智能模板响应
     */
    async getTemplateByContext(contextData, templateRequest = {}) {
        this.totalRequests++;
        const startTime = Date.now();

        try {
            // 1. 构建缓存键
            const cacheKey = this.buildCacheKey(contextData, templateRequest);
            
            // 2. 检查缓存
            if (this.templateCache.has(cacheKey)) {
                this.cacheHitCount++;
                const cached = this.templateCache.get(cacheKey);
                return {
                    ...cached,
                    fromCache: true,
                    responseTime: Date.now() - startTime
                };
            }

            // 3. 执行智能模板选择
            const result = await this.executeIntelligentTemplateSelection(contextData, templateRequest);
            
            // 4. 缓存结果
            this.setCacheItem(cacheKey, result);

            result.responseTime = Date.now() - startTime;
            result.fromCache = false;

            return result;
        } catch (error) {
            throw new Error(`统一模板服务失败: ${error.message}`);
        }
    }

    /**
     * 执行智能模板选择逻辑
     * @private
     */
    async executeIntelligentTemplateSelection(contextData, templateRequest) {
        const { 
            projectPath, 
            mode, 
            step, 
            templateType, 
            language = 'auto',
            userIntent = ''
        } = contextData;

        const {
            category = null,
            name = null,
            variables = {}
        } = templateRequest;

        // Step 1: 语言检测（如果需要）
        let detectedLanguage = language;
        let languageInfo = null;
        
        if (language === 'auto' && projectPath) {
            try {
                languageInfo = await this.languageIntelligence.detectProjectLanguage(projectPath);
                detectedLanguage = languageInfo.language;
            } catch (error) {
                console.warn('语言检测失败，使用通用模板:', error.message);
                detectedLanguage = 'general';
            }
        }

        // Step 2: 🧠 增强智能模板选择策略
        const selectionContext = {
            category, name, variables,
            templateType, mode, step, userIntent,
            detectedLanguage, languageInfo
        };
        
        // 计算上下文置信度分数
        const contextConfidence = this._calculateContextConfidence(contextData, templateRequest);
        
        // 选择最佳策略
        const strategySelection = this._selectOptimalStrategy(selectionContext, contextConfidence);
        const selectionStrategy = strategySelection.strategy;
        
        // 记录性能指标
        this._recordSelectionMetrics(selectionStrategy, contextConfidence);
        
        let templateResult;
        
        try {
            switch (selectionStrategy) {
                case 'legacy-compatible':
                    templateResult = await this.getLegacyTemplate(category, name, variables);
                    break;
                    
                case 'intelligent-generation':
                    templateResult = await this.generateIntelligentTemplate(
                        contextData, detectedLanguage, languageInfo
                    );
                    break;
                    
                case 'hybrid-selection':
                    templateResult = await this.selectHybridTemplate(
                        userIntent, detectedLanguage, languageInfo, variables
                    );
                    break;
                    
                case 'advanced-ai':
                    templateResult = await this.generateAdvancedAITemplate(
                        contextData, selectionContext, strategySelection.confidence
                    );
                    break;
                    
                default:
                    console.warn(`[智能选择] 未知策略: ${selectionStrategy}`);
                    templateResult = await this.getFallbackTemplate(contextData);
                    break;
            }
        } catch (error) {
            console.warn(`[智能选择] 策略 ${selectionStrategy} 失败，使用回退:`, error.message);
            templateResult = await this.getFallbackTemplate(contextData);
            this.performanceMetrics.strategyDistribution.fallback++;
        }

        // Step 3: 模板后处理和增强
        const enhancedTemplate = await this.enhanceTemplate(
            templateResult, 
            contextData, 
            detectedLanguage,
            languageInfo
        );

        // Step 4: 构建响应
        return {
            template: enhancedTemplate,
            intelligence: {
                templateSource: selectionStrategy,
                language: detectedLanguage,
                confidence: languageInfo?.confidence || 1.0,
                reasoning: this.generateReasoning(selectionStrategy, contextData),
                alternatives: await this.findAlternativeTemplates(contextData, detectedLanguage),
                suggestions: this.generateSuggestions(enhancedTemplate, contextData)
            },
            metadata: {
                selectionStrategy,
                processingTime: Date.now() - Date.now(),
                cacheKey: this.buildCacheKey(contextData, templateRequest),
                version: '1.0.0'
            }
        };
    }

    /**
     * 获取旧版模板（兼容现有系统）
     * @private
     */
    async getLegacyTemplate(category, name, variables) {
        try {
            const templateData = await this.templateReader.readTemplate(category, name);
            if (!templateData) {
                throw new Error(`Template not found: ${category}/${name}`);
            }
            
            // Process template with variables
            const processedContent = this.templateReader.processTemplate(templateData.content, variables);
            
            return {
                content: processedContent,
                type: this.templateCategories[category] || 'unknown',
                source: 'template-reader',
                metadata: {
                    size: templateData.size,
                    lastModified: templateData.lastModified,
                    path: templateData.path
                }
            };
        } catch (error) {
            throw new Error(`加载模板失败: ${category}/${name} - ${error.message}`);
        }
    }

    /**
     * 智能生成模板
     * @private
     */
    async generateIntelligentTemplate(contextData, language, languageInfo) {
        const { mode, step, templateType } = contextData;

        try {
            // 使用语言智能系统生成模板
            if (language !== 'general' && languageInfo) {
                const generatedTemplate = await this.languageIntelligence.generateLanguageTemplate(
                    languageInfo,
                    {
                        templateType: templateType || 'auto',
                        includeFrameworks: true,
                        customVariables: {
                            mode,
                            step,
                            ...contextData
                        }
                    }
                );

                if (generatedTemplate.success) {
                    return {
                        content: this.extractTemplateContent(generatedTemplate.templates),
                        type: templateType || 'generated',
                        source: 'intelligent-generation',
                        metadata: generatedTemplate.metadata || {}
                    };
                }
            }

            // 回退到基于模式和步骤的模板生成
            return await this.generateTemplateByModeAndStep(mode, step, templateType, contextData);
        } catch (error) {
            throw new Error(`智能模板生成失败: ${error.message}`);
        }
    }

    /**
     * 混合选择模板
     * @private
     */
    async selectHybridTemplate(userIntent, language, languageInfo, variables) {
        try {
            // 首先尝试基于用户意图的上下文提示词生成
            if (userIntent && languageInfo) {
                const contextualPrompts = await this.languageIntelligence.generateContextualPrompts({
                    projectPath: languageInfo.analysis?.projectPath || process.cwd(),
                    currentTask: 'template-generation',
                    userIntent: userIntent
                });

                if (contextualPrompts.success) {
                    return {
                        content: this.formatContextualPromptsAsTemplate(contextualPrompts),
                        type: 'contextual',
                        source: 'hybrid-selection',
                        metadata: { userIntent, language }
                    };
                }
            }

            // 回退到默认语言特定模板
            if (language && language !== 'general') {
                const languagePrompts = await this.languageIntelligence.getLanguageSpecificPrompts(language);
                
                if (languagePrompts.success) {
                    return {
                        content: this.formatLanguagePromptsAsTemplate(languagePrompts.prompts),
                        type: 'language-specific',
                        source: 'hybrid-selection', 
                        metadata: { language }
                    };
                }
            }

            // 最终回退到通用模板
            return {
                content: this.getDefaultTemplate(variables),
                type: 'default',
                source: 'fallback',
                metadata: { fallback: true }
            };
        } catch (error) {
            throw new Error(`混合模板选择失败: ${error.message}`);
        }
    }

    /**
     * 基于模式和步骤生成模板
     * @private
     */
    async generateTemplateByModeAndStep(mode, step, templateType, contextData) {
        const templateMap = {
            'init': {
                'scan_structure': 'analysis-templates/system-architecture-analysis',
                'detect_language': 'analysis-templates/language-detection-analysis',
                'scan_files': 'analysis-templates/file-content-analysis',
                'generate_architecture': 'document-templates/system-architecture-generation',
                'analyze_modules': 'analysis-templates/module-analysis',
                'generate_prompts': 'analysis-templates/language-prompts-generation'
            },
            'create': {
                'plan_feature': 'analysis-templates/feasibility-analysis',
                'create_module': 'document-templates/module-documentation-generation',
                'create_api': 'document-templates/integration-contracts-generation'
            },
            'fix': {
                'report_issue': 'analysis-templates/impact-assessment-analysis',
                'diagnose_issue': 'analysis-templates/dependency-analysis',
                'apply_fix': 'document-templates/impact-assessment-report'
            },
            'analyze': {
                'analyze_quality': 'analysis-templates/code-quality-analysis',
                'analyze_security': 'analysis-templates/security-analysis',
                'generate_report': 'document-templates/solution-design-report'
            }
        };

        const templatePath = templateMap[mode]?.[step];
        if (templatePath) {
            const [category, name] = templatePath.split('/');
            return await this.getLegacyTemplate(category, name, contextData);
        }

        // 回退生成
        return {
            content: `# ${mode}模式 - ${step}步骤\n\n基于上下文生成的模板内容。\n\n## 任务描述\n\n${JSON.stringify(contextData, null, 2)}`,
            type: 'generated',
            source: 'fallback-generation',
            metadata: { mode, step }
        };
    }

    /**
     * 增强模板内容
     * @private
     */
    async enhanceTemplate(templateResult, contextData, language, languageInfo) {
        let enhancedContent = templateResult.content;

        // 添加语言特定的增强
        if (language && language !== 'general' && languageInfo) {
            const frameworks = languageInfo.frameworks || [];
            if (frameworks.length > 0) {
                enhancedContent += `\n\n## 🔧 ${language}项目特性\n\n`;
                enhancedContent += `- **主要语言**: ${language}\n`;
                enhancedContent += `- **检测到的框架**: ${frameworks.map(f => f.name || f).join(', ')}\n`;
            }
        }

        // 添加上下文信息
        if (contextData.mode) {
            enhancedContent += `\n\n## 📋 工作流上下文\n\n`;
            enhancedContent += `- **模式**: ${contextData.mode}\n`;
            if (contextData.step) {
                enhancedContent += `- **步骤**: ${contextData.step}\n`;
            }
        }

        return {
            ...templateResult,
            content: enhancedContent,
            enhanced: true,
            enhancementApplied: ['language-specific', 'context-aware']
        };
    }

    /**
     * 辅助方法
     */

    buildCacheKey(contextData, templateRequest) {
        const key = JSON.stringify({ contextData, templateRequest });
        return crypto.createHash('md5').update(key).digest('hex');
    }

    setCacheItem(key, value) {
        if (this.templateCache.size >= this.maxCacheSize) {
            const firstKey = this.templateCache.keys().next().value;
            this.templateCache.delete(firstKey);
        }
        this.templateCache.set(key, value);
    }

    extractTemplateContent(templates) {
        if (typeof templates === 'string') return templates;
        if (templates && typeof templates === 'object') {
            const firstTemplate = Object.values(templates)[0];
            if (firstTemplate && firstTemplate.content) {
                return firstTemplate.content;
            }
        }
        return '# 生成的模板\n\n基于语言智能系统生成的模板内容。';
    }

    formatContextualPromptsAsTemplate(contextualPrompts) {
        let content = '# 上下文感知模板\n\n';
        
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
                content += `- ${suggestion.content}\n`;
            });
        }

        return content;
    }

    formatLanguagePromptsAsTemplate(prompts) {
        let content = '# 语言特定模板\n\n';
        
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

    getDefaultTemplate(variables = {}) {
        return `# 默认模板

## 项目信息

基于提供的变量生成的默认模板。

${Object.keys(variables).length > 0 ? '## 变量\n\n' + JSON.stringify(variables, null, 2) : ''}

---
*由mg_kiro统一模板服务生成*`;
    }

    generateReasoning(strategy, contextData) {
        const reasons = {
            'legacy-compatible': '使用现有模板系统，保持向后兼容性',
            'intelligent-generation': '基于语言检测结果智能生成模板',
            'hybrid-selection': '结合用户意图和语言特性选择最适合的模板'
        };
        
        return reasons[strategy] || '基于上下文信息选择模板';
    }

    async findAlternativeTemplates(contextData, language) {
        // 简化实现：返回相关的替代模板建议
        const alternatives = [];
        
        if (contextData.mode) {
            alternatives.push({
                name: `${contextData.mode}-alternative`,
                type: 'mode-specific',
                confidence: 0.8
            });
        }
        
        if (language && language !== 'general') {
            alternatives.push({
                name: `${language}-specific`,
                type: 'language-specific',
                confidence: 0.9
            });
        }

        return alternatives;
    }

    generateSuggestions(template, contextData) {
        const suggestions = [];
        
        if (template.type === 'generated') {
            suggestions.push({
                type: 'optimization',
                content: '建议根据具体需求调整生成的模板内容',
                priority: 'medium'
            });
        }

        if (contextData.language === 'auto') {
            suggestions.push({
                type: 'language-detection', 
                content: '建议明确指定项目语言以获得更准确的模板',
                priority: 'low'
            });
        }

        return suggestions;
    }

    /**
     * 🧠 计算上下文置信度分数 (Enhanced)
     * @param {Object} contextData - 上下文数据
     * @param {Object} templateRequest - 模板请求
     * @returns {number} 置信度分数 (0-1)
     */
    _calculateContextConfidence(contextData, templateRequest) {
        let confidence = 0;
        const factors = this.intelligenceConfig.contextFactors;

        // 项目路径权重
        if (contextData.projectPath) {
            confidence += factors.hasProjectPath;
        }

        // 语言信息权重  
        if (contextData.language && contextData.language !== 'auto') {
            const langWeight = this.intelligenceConfig.languageWeights[contextData.language] || 0.5;
            confidence += factors.hasLanguage * langWeight;
        }

        // 工作流步骤权重
        if (contextData.step) {
            confidence += factors.hasStep;
        }

        // 用户意图权重
        if (contextData.userIntent) {
            confidence += factors.hasUserIntent;
        }

        // 模式权重
        if (contextData.mode) {
            const modeWeight = this.intelligenceConfig.modeWeights[contextData.mode] || 0.5;
            confidence = confidence * modeWeight;
        }

        // 明确模板请求增加置信度
        if (templateRequest.category && templateRequest.name) {
            confidence += 0.25;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * 🎯 选择最优策略 (Enhanced)
     * @param {Object} selectionContext - 选择上下文
     * @param {number} confidence - 上下文置信度
     * @returns {Object} 策略选择结果
     */
    _selectOptimalStrategy(selectionContext, confidence) {
        const { category, name, templateType, mode, userIntent, detectedLanguage } = selectionContext;
        const thresholds = this.intelligenceConfig.confidenceThresholds;

        // 策略1: 明确模板请求 - 优先级最高
        if (category && name) {
            return {
                strategy: 'legacy-compatible',
                confidence: Math.max(confidence, 0.8),
                reasoning: '明确指定模板类别和名称'
            };
        }

        // 策略2: 高置信度智能生成
        if (confidence >= thresholds.high && (templateType || mode)) {
            return {
                strategy: 'advanced-ai',
                confidence,
                reasoning: '高置信度上下文，使用高级AI生成'
            };
        }

        // 策略3: 中等置信度智能生成
        if (confidence >= thresholds.medium && (templateType || mode)) {
            return {
                strategy: 'intelligent-generation',
                confidence,
                reasoning: '中等置信度，使用标准智能生成'
            };
        }

        // 策略4: 有用户意图的混合模式
        if (userIntent && detectedLanguage && detectedLanguage !== 'general') {
            return {
                strategy: 'hybrid-selection',
                confidence: Math.max(confidence, 0.6),
                reasoning: '基于用户意图和语言检测的混合选择'
            };
        }

        // 策略5: 低置信度回退
        return {
            strategy: 'hybrid-selection',
            confidence: Math.max(confidence, 0.4),
            reasoning: '低置信度，使用保守的混合策略'
        };
    }

    /**
     * 📊 记录选择指标 (Enhanced)  
     * @param {string} strategy - 选择的策略
     * @param {number} confidence - 置信度
     */
    _recordSelectionMetrics(strategy, confidence) {
        this.performanceMetrics.totalSelections++;
        this.performanceMetrics.strategyDistribution[strategy]++;
        this.performanceMetrics.confidenceHistory.push(confidence);

        // 更新平均置信度
        const confHistory = this.performanceMetrics.confidenceHistory;
        this.performanceMetrics.averageConfidence = 
            confHistory.reduce((sum, c) => sum + c, 0) / confHistory.length;

        // 保持历史记录在合理范围内
        if (confHistory.length > 100) {
            confHistory.shift();
        }
    }

    /**
     * 🚀 高级AI模板生成 (Enhanced)
     * @param {Object} contextData - 上下文数据
     * @param {Object} selectionContext - 选择上下文
     * @param {number} confidence - 置信度
     * @returns {Promise<Object>} 生成的模板
     */
    async generateAdvancedAITemplate(contextData, selectionContext, confidence) {
        try {
            // 使用高级语言智能生成
            const result = await this.languageIntelligence.generateContextualPrompts({
                projectPath: contextData.projectPath,
                currentTask: `${contextData.mode}-${contextData.step}`,
                userIntent: contextData.userIntent,
                language: selectionContext.detectedLanguage,
                confidence: confidence
            });

            if (result && result.success) {
                return {
                    content: this.formatContextualPromptsAsTemplate(result),
                    type: 'advanced-ai-generated',
                    source: 'advanced-ai',
                    confidence,
                    metadata: { 
                        strategy: 'advanced-ai',
                        aiGenerated: true,
                        confidence
                    }
                };
            }

            throw new Error('高级AI生成失败');
        } catch (error) {
            console.warn('[高级AI模板] 生成失败，回退到标准智能生成:', error.message);
            return await this.generateIntelligentTemplate(
                contextData, 
                selectionContext.detectedLanguage, 
                selectionContext.languageInfo
            );
        }
    }

    /**
     * 🔄 回退模板生成 (Enhanced)
     * @param {Object} contextData - 上下文数据
     * @returns {Promise<Object>} 回退模板
     */
    async getFallbackTemplate(contextData) {
        const fallbackContent = `# ${contextData.mode || 'General'} 模板

## 上下文信息
- 模式: ${contextData.mode || 'unknown'}
- 步骤: ${contextData.step || 'unknown'}
- 语言: ${contextData.language || 'unknown'}
- 模板类型: ${contextData.templateType || 'unknown'}

## 自动生成说明
此模板由mg_kiro统一模板服务自动生成，因为无法找到更具体的模板。

建议：
1. 检查模板请求参数是否正确
2. 确认相关模板文件是否存在
3. 验证语言检测是否准确

---
*Generated by UnifiedTemplateService v1.0*`;

        return {
            content: fallbackContent,
            type: 'fallback',
            source: 'system-fallback',
            confidence: 0.3,
            metadata: {
                fallback: true,
                generated: true,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 获取服务统计信息 (Enhanced)
     */
    getServiceStats() {
        return {
            cache: {
                size: this.templateCache.size,
                maxSize: this.maxCacheSize,
                hitRate: this.totalRequests > 0 ? (this.cacheHitCount / this.totalRequests) : 0,
                hitCount: this.cacheHitCount,
                totalRequests: this.totalRequests
            },
            capabilities: {
                strategies: ['legacy-compatible', 'intelligent-generation', 'hybrid-selection', 'advanced-ai', 'fallback'],
                supportedCategories: Object.keys(this.templateCategories),
                integrations: ['language-intelligence', 'legacy-prompt-manager'],
                languages: Object.keys(this.intelligenceConfig.languageWeights),
                modes: Object.keys(this.intelligenceConfig.modeWeights)
            },
            // 🧠 增强性能指标
            intelligence: {
                totalSelections: this.performanceMetrics.totalSelections,
                averageConfidence: Math.round(this.performanceMetrics.averageConfidence * 100) / 100,
                averageResponseTime: Math.round(this.performanceMetrics.averageResponseTime),
                strategyDistribution: {
                    ...this.performanceMetrics.strategyDistribution,
                    percentages: this._calculateStrategyPercentages()
                },
                confidenceDistribution: this._analyzeConfidenceDistribution(),
                languageUsage: this.performanceMetrics.languageUsage,
                modeUsage: this.performanceMetrics.modeUsage
            },
            // 📊 系统健康指标
            health: {
                cacheEfficiency: this.totalRequests > 0 ? (this.cacheHitCount / this.totalRequests) : 0,
                averageConfidence: this.performanceMetrics.averageConfidence,
                fallbackRate: this._calculateFallbackRate(),
                aiSuccessRate: this._calculateAISuccessRate(),
                status: this._determineSystemHealth()
            }
        };
    }

    /**
     * 📊 计算策略百分比 (Helper)
     */
    _calculateStrategyPercentages() {
        const total = this.performanceMetrics.totalSelections;
        if (total === 0) return {};
        
        const percentages = {};
        for (const [strategy, count] of Object.entries(this.performanceMetrics.strategyDistribution)) {
            percentages[strategy] = Math.round((count / total) * 100);
        }
        return percentages;
    }

    /**
     * 📊 分析置信度分布 (Helper)
     */
    _analyzeConfidenceDistribution() {
        const history = this.performanceMetrics.confidenceHistory;
        if (history.length === 0) return { high: 0, medium: 0, low: 0 };

        let high = 0, medium = 0, low = 0;
        const thresholds = this.intelligenceConfig.confidenceThresholds;

        history.forEach(confidence => {
            if (confidence >= thresholds.high) high++;
            else if (confidence >= thresholds.medium) medium++;
            else low++;
        });

        return {
            high: Math.round((high / history.length) * 100),
            medium: Math.round((medium / history.length) * 100),
            low: Math.round((low / history.length) * 100)
        };
    }

    /**
     * 📊 计算回退率 (Helper)
     */
    _calculateFallbackRate() {
        const total = this.performanceMetrics.totalSelections;
        const fallbacks = this.performanceMetrics.strategyDistribution.fallback || 0;
        return total > 0 ? Math.round((fallbacks / total) * 100) : 0;
    }

    /**
     * 📊 计算AI成功率 (Helper)
     */
    _calculateAISuccessRate() {
        const total = this.performanceMetrics.totalSelections;
        const aiStrategies = ['intelligent-generation', 'advanced-ai', 'hybrid-selection'];
        const aiSuccesses = aiStrategies.reduce((sum, strategy) => 
            sum + (this.performanceMetrics.strategyDistribution[strategy] || 0), 0);
        return total > 0 ? Math.round((aiSuccesses / total) * 100) : 0;
    }

    /**
     * 🏥 确定系统健康状态 (Helper)
     */
    _determineSystemHealth() {
        const avgConfidence = this.performanceMetrics.averageConfidence;
        const fallbackRate = this._calculateFallbackRate();
        
        if (avgConfidence >= 0.8 && fallbackRate < 10) return '优秀';
        if (avgConfidence >= 0.6 && fallbackRate < 20) return '良好';
        if (avgConfidence >= 0.4 && fallbackRate < 40) return '一般';
        return '需要优化';
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.templateCache.clear();
        this.cacheHitCount = 0;
        this.totalRequests = 0;
    }
}

export default UnifiedTemplateService;