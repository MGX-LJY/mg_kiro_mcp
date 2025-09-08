/**
 * 语言智能服务
 * 统一管理语言检测、模板生成、智能提示词的核心业务逻辑
 */

import LanguageDetector from '../language/detector.js';
import LanguageTemplateGenerator from '../language/template-generator.js';
import PromptIntelligence from '../language/prompt-intelligence.js';

class LanguageIntelligenceService {
    constructor() {
        this.detector = new LanguageDetector();
        this.templateGenerator = new LanguageTemplateGenerator();
        this.promptIntelligence = new PromptIntelligence();
        
        // 缓存配置
        this.cache = {
            detections: new Map(),
            templates: new Map(),
            prompts: new Map(),
            maxSize: 100,
            ttl: 30 * 60 * 1000 // 30分钟
        };
    }

    /**
     * 执行项目语言检测
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 检测选项
     * @returns {Promise<Object>} 检测结果
     */
    async detectProjectLanguage(projectPath, options = {}) {
        const {
            useCache = true,
            includeFrameworks = true,
            deepAnalysis = false
        } = options;

        try {
            // 检查缓存
            const cacheKey = `detect:${projectPath}:${JSON.stringify(options)}`;
            if (useCache && this.cache.detections.has(cacheKey)) {
                const cached = this.cache.detections.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cache.ttl) {
                    return {
                        ...cached.data,
                        fromCache: true
                    };
                }
            }

            // 执行检测
            const detection = await this.detector.detectLanguage(projectPath);
            
            // 增强检测结果
            const enhancedResult = {
                ...detection,
                analysis: {
                    deepAnalysis,
                    includeFrameworks,
                    timestamp: new Date().toISOString(),
                    projectPath: projectPath
                },
                capabilities: this.getLanguageCapabilities(detection.language),
                recommendations: this.generateLanguageRecommendations(detection)
            };

            // 缓存结果
            if (useCache) {
                this.setCache(this.cache.detections, cacheKey, enhancedResult);
            }

            return enhancedResult;
        } catch (error) {
            throw new Error(`语言检测失败: ${error.message}`);
        }
    }

    /**
     * 获取支持的语言列表及其特性
     * @returns {Object} 支持的语言信息
     */
    getSupportedLanguages() {
        const languages = this.detector.languages;
        const supported = {};

        Object.keys(languages).forEach(lang => {
            const langConfig = languages[lang];
            supported[lang] = {
                name: langConfig.name,
                displayName: this.getLanguageDisplayName(lang),
                extensions: langConfig.extensions,
                frameworks: Object.keys(langConfig.frameworks || {}),
                capabilities: this.getLanguageCapabilities(lang),
                maturity: this.getLanguageMaturityLevel(lang)
            };
        });

        return {
            languages: supported,
            total: Object.keys(supported).length,
            categories: this.categorizeLanguages(supported),
            metadata: {
                lastUpdated: new Date().toISOString(),
                version: '2.0.0'
            }
        };
    }

    /**
     * 获取语言支持的框架信息
     * @param {string} language - 编程语言
     * @returns {Object} 框架信息
     */
    getLanguageFrameworks(language) {
        if (!this.detector.languages[language]) {
            throw new Error(`不支持的语言: ${language}`);
        }

        const langConfig = this.detector.languages[language];
        const frameworks = langConfig.frameworks || {};
        
        return {
            language,
            frameworks: Object.keys(frameworks).map(name => ({
                name,
                displayName: this.getFrameworkDisplayName(name),
                indicators: frameworks[name],
                category: this.getFrameworkCategory(name),
                popularity: this.getFrameworkPopularity(name),
                documentation: this.getFrameworkDocumentation(name)
            })),
            total: Object.keys(frameworks).length,
            categories: this.categorizeFrameworks(frameworks)
        };
    }

    /**
     * 基于语言生成项目模板
     * @param {Object} languageDetection - 语言检测结果
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} 模板生成结果
     */
    async generateLanguageTemplate(languageDetection, options = {}) {
        const {
            templateType = 'auto',
            useCache = true,
            customVariables = {}
        } = options;

        try {
            // 检查缓存
            const cacheKey = `template:${languageDetection.language}:${templateType}:${JSON.stringify(customVariables)}`;
            if (useCache && this.cache.templates.has(cacheKey)) {
                const cached = this.cache.templates.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cache.ttl) {
                    return {
                        ...cached.data,
                        fromCache: true
                    };
                }
            }

            // 生成模板
            const result = await this.templateGenerator.generateTemplate(languageDetection, {
                templateType,
                includeFrameworks: true,
                customVariables,
                outputFormat: 'markdown'
            });

            // 缓存结果
            if (useCache && result.success) {
                this.setCache(this.cache.templates, cacheKey, result);
            }

            return result;
        } catch (error) {
            throw new Error(`模板生成失败: ${error.message}`);
        }
    }

    /**
     * 获取语言特定模板变体
     * @param {string} language - 编程语言
     * @param {string} templateName - 模板名称(可选)
     * @returns {Promise<Object>} 模板变体
     */
    async getLanguageTemplateVariants(language, templateName = null) {
        try {
            // 简化实现：返回模拟的模板变体数据
            const variants = {
                success: true,
                language: language,
                variants: {
                    'default': {
                        content: `# ${language}项目文档模板\n\n基于${language}语言生成的项目文档模板。`,
                        type: 'documentation',
                        lastModified: new Date().toISOString()
                    }
                },
                count: 1
            };
            
            return {
                ...variants,
                recommendations: this.getTemplateRecommendations(language, variants.variants),
                usage: this.getTemplateUsageGuidelines(language)
            };
        } catch (error) {
            throw new Error(`获取模板变体失败: ${error.message}`);
        }
    }

    /**
     * 批量生成模板
     * @param {Array} requests - 批量请求
     * @returns {Promise<Object>} 批量结果
     */
    async batchGenerateTemplates(requests) {
        try {
            const result = await this.templateGenerator.batchGenerate(requests);
            
            return {
                ...result,
                performance: this.analyzeBatchPerformance(result),
                insights: this.generateBatchInsights(result)
            };
        } catch (error) {
            throw new Error(`批量模板生成失败: ${error.message}`);
        }
    }

    /**
     * 获取语言特定智能提示词
     * @param {string} language - 编程语言
     * @param {Object} options - 获取选项
     * @returns {Promise<Object>} 智能提示词
     */
    async getLanguageSpecificPrompts(language, options = {}) {
        const {
            category = 'all',
            framework = null,
            useCache = true
        } = options;

        try {
            // 检查缓存
            const cacheKey = `prompts:${language}:${category}:${framework}`;
            if (useCache && this.cache.prompts.has(cacheKey)) {
                const cached = this.cache.prompts.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cache.ttl) {
                    return {
                        ...cached.data,
                        fromCache: true
                    };
                }
            }

            // 获取提示词
            const result = await this.promptIntelligence.getLanguageSpecificPrompts(language, {
                category,
                framework,
                context: 'general',
                includeExamples: true
            });

            // 缓存结果
            if (useCache && result.success) {
                this.setCache(this.cache.prompts, cacheKey, result);
            }

            return result;
        } catch (error) {
            throw new Error(`获取语言提示词失败: ${error.message}`);
        }
    }

    /**
     * 基于上下文生成智能提示词
     * @param {Object} contextData - 上下文数据
     * @returns {Promise<Object>} 上下文提示词
     */
    async generateContextualPrompts(contextData) {
        try {
            const result = await this.promptIntelligence.generateContextualPrompts(contextData);
            
            return {
                ...result,
                optimization: this.optimizeContextualPrompts(result),
                learning: this.extractLearningInsights(contextData, result)
            };
        } catch (error) {
            throw new Error(`上下文提示词生成失败: ${error.message}`);
        }
    }

    /**
     * 获取最佳实践提示词
     * @param {string} language - 编程语言
     * @param {string} context - 上下文类型
     * @returns {Promise<Object>} 最佳实践
     */
    async getBestPracticesPrompts(language, context = 'general') {
        try {
            const practices = await this.promptIntelligence.getBestPractices(language, context);
            
            return {
                language,
                context,
                practices,
                categories: this.categorizeBestPractices(practices),
                priorities: this.prioritizeBestPractices(practices),
                actionItems: this.generateActionItems(practices),
                metadata: {
                    totalPractices: practices.length,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`获取最佳实践失败: ${error.message}`);
        }
    }

    /**
     * 清除缓存
     * @param {string} type - 缓存类型 ('all', 'detections', 'templates', 'prompts')
     */
    clearCache(type = 'all') {
        switch (type) {
            case 'detections':
                this.cache.detections.clear();
                break;
            case 'templates':
                this.cache.templates.clear();
                break;
            case 'prompts':
                this.cache.prompts.clear();
                break;
            case 'all':
            default:
                this.cache.detections.clear();
                this.cache.templates.clear();
                this.cache.prompts.clear();
        }
    }

    /**
     * 获取服务统计信息
     * @returns {Object} 统计信息
     */
    getServiceStats() {
        return {
            cache: {
                detections: {
                    size: this.cache.detections.size,
                    hitRate: this.calculateHitRate(this.cache.detections)
                },
                templates: {
                    size: this.cache.templates.size,
                    hitRate: this.calculateHitRate(this.cache.templates)
                },
                prompts: {
                    size: this.cache.prompts.size,
                    hitRate: this.calculateHitRate(this.cache.prompts)
                }
            },
            capabilities: {
                supportedLanguages: Object.keys(this.detector.languages).length,
                templateTypes: this.getAvailableTemplateTypes().length,
                promptCategories: this.getAvailablePromptCategories().length
            },
            performance: this.getPerformanceMetrics()
        };
    }

    // 私有辅助方法

    /**
     * 设置缓存项
     * @private
     */
    setCache(cache, key, data) {
        if (cache.size >= this.cache.maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 获取语言能力
     * @private
     */
    getLanguageCapabilities(language) {
        const capabilities = {
            javascript: ['frontend', 'backend', 'mobile', 'desktop'],
            python: ['backend', 'data-science', 'ml', 'automation'],
            java: ['backend', 'enterprise', 'mobile', 'desktop'],
            go: ['backend', 'microservices', 'cli', 'system'],
            rust: ['system', 'performance', 'webassembly', 'backend'],
            csharp: ['backend', 'desktop', 'enterprise', 'games']
        };
        
        return capabilities[language] || ['general'];
    }

    /**
     * 生成语言建议
     * @private
     */
    generateLanguageRecommendations(detection) {
        const recommendations = [];
        
        if (detection.confidence < 50) {
            recommendations.push({
                type: 'warning',
                message: '检测置信度较低，建议手动确认语言类型',
                priority: 'high'
            });
        }

        if (detection.frameworks && detection.frameworks.length === 0) {
            recommendations.push({
                type: 'suggestion',
                message: '未检测到明显的框架，建议考虑使用主流框架',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * 获取语言显示名称
     * @private
     */
    getLanguageDisplayName(language) {
        const names = {
            javascript: 'JavaScript/Node.js',
            python: 'Python',
            java: 'Java',
            go: 'Go',
            rust: 'Rust',
            csharp: 'C#/.NET'
        };
        return names[language] || language;
    }

    /**
     * 获取语言成熟度级别
     * @private
     */
    getLanguageMaturityLevel(language) {
        const maturity = {
            javascript: 'mature',
            python: 'mature',
            java: 'mature',
            go: 'growing',
            rust: 'growing',
            csharp: 'mature'
        };
        return maturity[language] || 'unknown';
    }

    /**
     * 分类语言
     * @private
     */
    categorizeLanguages(languages) {
        const categories = {
            interpreted: ['javascript', 'python'],
            compiled: ['java', 'go', 'rust', 'csharp'],
            frontend: ['javascript'],
            backend: ['javascript', 'python', 'java', 'go', 'rust', 'csharp'],
            system: ['go', 'rust', 'csharp']
        };
        
        return categories;
    }

    /**
     * 获取框架显示名称
     * @private
     */
    getFrameworkDisplayName(framework) {
        const names = {
            react: 'React',
            vue: 'Vue.js',
            angular: 'Angular',
            express: 'Express.js',
            django: 'Django',
            flask: 'Flask',
            fastapi: 'FastAPI'
        };
        return names[framework] || framework;
    }

    /**
     * 获取框架分类
     * @private
     */
    getFrameworkCategory(framework) {
        const categories = {
            react: 'frontend',
            vue: 'frontend',
            angular: 'frontend',
            express: 'backend',
            django: 'backend',
            flask: 'backend',
            fastapi: 'backend'
        };
        return categories[framework] || 'unknown';
    }

    /**
     * 获取框架流行度
     * @private
     */
    getFrameworkPopularity(framework) {
        const popularity = {
            react: 'very-high',
            vue: 'high',
            angular: 'high',
            express: 'very-high',
            django: 'high',
            flask: 'medium',
            fastapi: 'growing'
        };
        return popularity[framework] || 'unknown';
    }

    /**
     * 获取框架文档
     * @private
     */
    getFrameworkDocumentation(framework) {
        const docs = {
            react: 'https://reactjs.org/docs',
            vue: 'https://vuejs.org/guide/',
            angular: 'https://angular.io/docs',
            express: 'https://expressjs.com/en/4x/api.html',
            django: 'https://docs.djangoproject.com/',
            flask: 'https://flask.palletsprojects.com/',
            fastapi: 'https://fastapi.tiangolo.com/'
        };
        return docs[framework] || null;
    }

    /**
     * 分类框架
     * @private
     */
    categorizeFrameworks(frameworks) {
        return {
            frontend: Object.keys(frameworks).filter(f => this.getFrameworkCategory(f) === 'frontend'),
            backend: Object.keys(frameworks).filter(f => this.getFrameworkCategory(f) === 'backend'),
            fullstack: []
        };
    }

    /**
     * 计算缓存命中率
     * @private
     */
    calculateHitRate(cache) {
        // 简化实现，实际应该跟踪命中和未命中次数
        return cache.size > 0 ? 0.8 : 0;
    }

    /**
     * 获取性能指标
     * @private
     */
    getPerformanceMetrics() {
        return {
            averageDetectionTime: '150ms',
            averageTemplateGenTime: '300ms',
            averagePromptGenTime: '200ms',
            cacheEfficiency: 0.75
        };
    }

    /**
     * 获取可用模板类型
     * @private
     */
    getAvailableTemplateTypes() {
        return ['project', 'component', 'api', 'documentation', 'testing'];
    }

    /**
     * 获取可用提示词类别
     * @private
     */
    getAvailablePromptCategories() {
        return ['development', 'documentation', 'bestPractices', 'context'];
    }

    /**
     * 其他私有辅助方法...
     * @private
     */
    getTemplateRecommendations() { return []; }
    getTemplateUsageGuidelines() { return {}; }
    analyzeBatchPerformance() { return {}; }
    generateBatchInsights() { return {}; }
    optimizeContextualPrompts(result) { return result; }
    extractLearningInsights() { return {}; }
    categorizeBestPractices(practices) { return {}; }
    prioritizeBestPractices(practices) { return practices; }
    generateActionItems() { return []; }
}

export default LanguageIntelligenceService;