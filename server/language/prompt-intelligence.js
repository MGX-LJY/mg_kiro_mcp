/**
 * 智能提示词系统
 * 基于上下文生成动态提示词和最佳实践建议
 */

import fs from 'fs';
import path from 'path';
import LanguageDetector from './detector.js';

class PromptIntelligence {
    constructor() {
        this.detector = new LanguageDetector();
        this.promptsBaseDir = path.join(process.cwd(), 'prompts');
        this.languageVariantsDir = path.join(this.promptsBaseDir, 'language-variants');
        
        // 智能提示词类型映射
        this.promptCategories = {
            development: {
                coding: ['clean-code', 'error-handling', 'performance', 'security'],
                architecture: ['design-patterns', 'scalability', 'modularity', 'testing'],
                debugging: ['troubleshooting', 'logging', 'profiling', 'monitoring']
            },
            documentation: {
                api: ['openapi', 'endpoints', 'authentication', 'examples'],
                user: ['installation', 'configuration', 'usage', 'faq'],
                technical: ['architecture', 'deployment', 'maintenance', 'troubleshooting']
            },
            bestPractices: {
                general: ['naming-conventions', 'code-organization', 'version-control', 'collaboration'],
                language: ['idioms', 'patterns', 'libraries', 'tools'],
                project: ['structure', 'dependencies', 'build', 'deployment']
            },
            context: {
                project: ['init', 'create', 'fix', 'analyze'],
                workflow: ['planning', 'implementation', 'review', 'deployment'],
                team: ['onboarding', 'standards', 'processes', 'communication']
            }
        };

        // 语言特定提示词配置
        this.languagePrompts = {
            javascript: {
                core: {
                    syntax: 'ES6+语法，使用const/let，箭头函数，解构赋值',
                    async: 'Promise/async-await模式，错误处理，并发控制',
                    modules: 'ES模块导入导出，CommonJS兼容性考虑',
                    testing: 'Jest/Mocha单元测试，集成测试，端到端测试'
                },
                frameworks: {
                    react: {
                        components: '函数组件，Hooks使用，状态管理，性能优化',
                        patterns: 'HOC，Render Props，Context API，状态提升',
                        testing: 'React Testing Library，组件测试，快照测试'
                    },
                    vue: {
                        components: 'Composition API，响应式数据，生命周期',
                        patterns: 'Composables，Provide/Inject，状态管理',
                        testing: 'Vue Test Utils，组件测试，单元测试'
                    },
                    express: {
                        routes: 'RESTful API设计，中间件使用，错误处理',
                        middleware: '自定义中间件，第三方中间件集成',
                        security: 'CORS，CSRF，认证授权，输入验证'
                    }
                }
            },
            python: {
                core: {
                    syntax: 'PEP 8规范，类型提示，文档字符串，异常处理',
                    async: 'asyncio，异步编程模式，并发处理',
                    modules: '包管理，虚拟环境，依赖管理，模块导入',
                    testing: 'pytest框架，单元测试，覆盖率测试，Mock使用'
                },
                frameworks: {
                    django: {
                        models: 'ORM使用，数据库迁移，查询优化，关系设计',
                        views: '基于类的视图，REST API，序列化器',
                        templates: '模板系统，静态文件管理，国际化'
                    },
                    flask: {
                        routes: '蓝图使用，URL构建，请求处理',
                        extensions: 'Flask扩展，数据库集成，用户认证',
                        deployment: 'WSGI部署，容器化，生产环境配置'
                    },
                    fastapi: {
                        apis: '自动文档生成，数据验证，依赖注入',
                        async: '异步路由，后台任务，WebSocket支持',
                        deployment: 'Uvicorn部署，Docker容器，性能优化'
                    }
                }
            }
            // 其他语言配置...
        };
    }

    /**
     * 获取语言特定提示词
     * @param {string} language - 编程语言
     * @param {Object} options - 获取选项
     * @returns {Promise<Object>} 语言特定提示词
     */
    async getLanguageSpecificPrompts(language, options = {}) {
        const {
            category = 'all',
            framework = null,
            context = 'general',
            includeExamples = true
        } = options;

        try {
            const languageConfig = this.languagePrompts[language];
            if (!languageConfig) {
                return {
                    success: false,
                    error: `不支持的语言: ${language}`,
                    supportedLanguages: Object.keys(this.languagePrompts)
                };
            }

            const prompts = {};

            // 获取核心语言提示词
            if (category === 'all' || category === 'core') {
                prompts.core = languageConfig.core;
            }

            // 获取框架特定提示词
            if (framework && languageConfig.frameworks && languageConfig.frameworks[framework]) {
                prompts.framework = {
                    name: framework,
                    prompts: languageConfig.frameworks[framework]
                };
            } else if ((category === 'all' || category === 'frameworks') && languageConfig.frameworks) {
                prompts.frameworks = languageConfig.frameworks;
            }

            // 添加最佳实践
            const bestPractices = await this.getBestPractices(language, context);
            if (bestPractices.length > 0) {
                prompts.bestPractices = bestPractices;
            }

            // 添加示例（如果需要）
            if (includeExamples) {
                const examples = await this.getExamples(language, framework);
                if (examples.length > 0) {
                    prompts.examples = examples;
                }
            }

            return {
                success: true,
                language,
                framework,
                context,
                prompts,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    categories: Object.keys(prompts),
                    totalPrompts: this.countPrompts(prompts)
                }
            };
        } catch (error) {
            throw new Error(`获取语言提示词失败: ${error.message}`);
        }
    }

    /**
     * 基于上下文生成智能提示词
     * @param {Object} contextData - 上下文数据
     * @returns {Promise<Object>} 生成的提示词
     */
    async generateContextualPrompts(contextData) {
        const {
            projectPath,
            currentTask,
            userIntent,
            previousActions = [],
            constraints = {}
        } = contextData;

        try {
            // 检测项目语言和框架
            const detection = await this.detector.detectLanguage(projectPath);
            
            // 分析用户意图
            const intentAnalysis = this.analyzeUserIntent(userIntent, currentTask);
            
            // 生成上下文感知的提示词
            const contextualPrompts = await this.buildContextualPrompts(
                detection,
                intentAnalysis,
                previousActions,
                constraints
            );

            // 添加智能建议
            const suggestions = await this.generateSmartSuggestions(
                detection,
                intentAnalysis,
                contextualPrompts
            );

            return {
                success: true,
                context: {
                    language: detection.language,
                    frameworks: detection.frameworks,
                    intent: intentAnalysis,
                    task: currentTask
                },
                prompts: contextualPrompts,
                suggestions,
                metadata: {
                    confidence: detection.confidence,
                    generatedAt: new Date().toISOString(),
                    promptCount: Object.keys(contextualPrompts).length
                }
            };
        } catch (error) {
            throw new Error(`上下文提示词生成失败: ${error.message}`);
        }
    }

    /**
     * 获取最佳实践提示词
     * @param {string} language - 编程语言
     * @param {string} context - 上下文类型
     * @returns {Promise<Array>} 最佳实践列表
     */
    async getBestPractices(language, context = 'general') {
        try {
            const practicesPath = path.join(this.languageVariantsDir, language, 'best-practices.json');
            
            let practices = [];
            if (fs.existsSync(practicesPath)) {
                const practicesContent = fs.readFileSync(practicesPath, 'utf-8');
                const practicesData = JSON.parse(practicesContent);
                practices = practicesData[context] || practicesData.general || [];
            }

            // 如果没有语言特定的实践，使用通用实践
            if (practices.length === 0) {
                practices = this.getDefaultBestPractices(language, context);
            }

            return practices.map(practice => ({
                title: practice.title || practice,
                description: practice.description || '',
                category: practice.category || context,
                importance: practice.importance || 'medium',
                examples: practice.examples || []
            }));
        } catch (error) {
            console.warn(`获取最佳实践失败: ${error.message}`);
            return this.getDefaultBestPractices(language, context);
        }
    }

    /**
     * 分析用户意图
     * @private
     */
    analyzeUserIntent(userIntent, currentTask) {
        const intentPatterns = {
            create: /创建|新建|添加|生成/,
            fix: /修复|解决|调试|错误/,
            optimize: /优化|改进|性能|速度/,
            refactor: /重构|重写|整理|清理/,
            test: /测试|验证|检查/,
            document: /文档|说明|注释/,
            deploy: /部署|发布|上线/,
            analyze: /分析|检查|评估/
        };

        let detectedIntents = [];
        Object.keys(intentPatterns).forEach(intent => {
            if (intentPatterns[intent].test(userIntent) || currentTask === intent) {
                detectedIntents.push(intent);
            }
        });

        return {
            primary: detectedIntents[0] || 'general',
            secondary: detectedIntents.slice(1),
            raw: userIntent,
            confidence: detectedIntents.length > 0 ? 0.8 : 0.3
        };
    }

    /**
     * 构建上下文感知提示词
     * @private
     */
    async buildContextualPrompts(detection, intentAnalysis, previousActions, constraints) {
        const prompts = {};

        // 基于意图的核心提示词
        const intentPrompts = this.getIntentPrompts(
            intentAnalysis.primary,
            detection.language,
            detection.frameworks
        );
        if (intentPrompts) {
            prompts.intent = intentPrompts;
        }

        // 基于语言的特定提示词
        const languagePrompts = await this.getLanguageSpecificPrompts(detection.language, {
            category: this.mapIntentToCategory(intentAnalysis.primary),
            framework: this.getPrimaryFramework(detection.frameworks)
        });
        if (languagePrompts.success) {
            prompts.language = languagePrompts.prompts;
        }

        // 基于历史操作的提示词
        if (previousActions.length > 0) {
            const contextualAdvice = this.generateContextualAdvice(
                previousActions,
                intentAnalysis.primary
            );
            if (contextualAdvice.length > 0) {
                prompts.contextual = contextualAdvice;
            }
        }

        // 基于约束条件的提示词
        if (Object.keys(constraints).length > 0) {
            const constraintPrompts = this.generateConstraintPrompts(constraints);
            if (constraintPrompts.length > 0) {
                prompts.constraints = constraintPrompts;
            }
        }

        return prompts;
    }

    /**
     * 生成智能建议
     * @private
     */
    async generateSmartSuggestions(detection, intentAnalysis, contextualPrompts) {
        const suggestions = [];

        // 基于语言的建议
        const languageSuggestions = detection.suggestions || [];
        suggestions.push(...languageSuggestions.map(s => ({
            type: 'language',
            content: s,
            priority: 'medium'
        })));

        // 基于意图的建议
        const intentSuggestions = this.getIntentSuggestions(
            intentAnalysis.primary,
            detection.language
        );
        suggestions.push(...intentSuggestions);

        // 基于框架的建议
        if (detection.frameworks && detection.frameworks.length > 0) {
            const frameworkSuggestions = this.getFrameworkSuggestions(
                detection.frameworks[0],
                intentAnalysis.primary
            );
            suggestions.push(...frameworkSuggestions);
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * 获取默认最佳实践
     * @private
     */
    getDefaultBestPractices(language, context) {
        const defaults = {
            javascript: [
                { title: '使用严格模式', importance: 'high' },
                { title: '避免全局变量污染', importance: 'high' },
                { title: '使用适当的命名约定', importance: 'medium' },
                { title: '处理异步操作错误', importance: 'high' }
            ],
            python: [
                { title: '遵循PEP 8代码规范', importance: 'high' },
                { title: '使用虚拟环境', importance: 'high' },
                { title: '编写文档字符串', importance: 'medium' },
                { title: '使用类型提示', importance: 'medium' }
            ]
        };

        return defaults[language] || [
            { title: '保持代码简洁明了', importance: 'high' },
            { title: '编写适当的测试', importance: 'high' },
            { title: '添加有意义的注释', importance: 'medium' }
        ];
    }

    /**
     * 获取示例代码
     * @private
     */
    async getExamples(language, framework) {
        try {
            const examplesPath = path.join(this.languageVariantsDir, language, 'examples.json');
            
            if (fs.existsSync(examplesPath)) {
                const examplesContent = fs.readFileSync(examplesPath, 'utf-8');
                const examples = JSON.parse(examplesContent);
                
                if (framework && examples[framework]) {
                    return examples[framework];
                }
                
                return examples.general || [];
            }
            
            return [];
        } catch (error) {
            console.warn(`获取示例失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 获取意图提示词
     * @private
     */
    getIntentPrompts(intent, language, frameworks) {
        const intentPromptMap = {
            create: {
                general: '创建新功能时，考虑模块化设计和可扩展性',
                specific: `在${language}项目中创建新模块，遵循语言最佳实践`
            },
            fix: {
                general: '修复问题时，先理解问题根因，再实施最小化修改',
                specific: `调试${language}代码时，利用语言特定的调试工具和技术`
            },
            optimize: {
                general: '优化代码性能，关注热点路径和资源使用',
                specific: `${language}性能优化关注点和常用优化技术`
            }
        };

        return intentPromptMap[intent] || null;
    }

    /**
     * 映射意图到类别
     * @private
     */
    mapIntentToCategory(intent) {
        const mapping = {
            create: 'development',
            fix: 'debugging',
            optimize: 'performance',
            test: 'testing',
            document: 'documentation',
            analyze: 'architecture'
        };
        return mapping[intent] || 'general';
    }

    /**
     * 获取主要框架
     * @private
     */
    getPrimaryFramework(frameworks) {
        if (!frameworks || frameworks.length === 0) {
            return null;
        }
        return frameworks[0].name || frameworks[0];
    }

    /**
     * 生成上下文建议
     * @private
     */
    generateContextualAdvice(previousActions, intent) {
        // 基于历史操作生成建议
        return previousActions.map(action => ({
            type: 'contextual',
            content: `基于之前的${action}操作，建议...`,
            priority: 'low'
        }));
    }

    /**
     * 生成约束提示词
     * @private
     */
    generateConstraintPrompts(constraints) {
        return Object.keys(constraints).map(key => ({
            type: 'constraint',
            content: `考虑约束条件: ${key} = ${constraints[key]}`,
            priority: 'high'
        }));
    }

    /**
     * 获取意图建议
     * @private
     */
    getIntentSuggestions(intent, language) {
        // 返回基于意图的建议
        return [{
            type: 'intent',
            content: `针对${intent}任务的${language}最佳实践建议`,
            priority: 'high'
        }];
    }

    /**
     * 获取框架建议
     * @private
     */
    getFrameworkSuggestions(framework, intent) {
        // 返回基于框架的建议
        return [{
            type: 'framework',
            content: `在${framework.name || framework}框架中执行${intent}任务的建议`,
            priority: 'medium'
        }];
    }

    /**
     * 统计提示词数量
     * @private
     */
    countPrompts(prompts) {
        let count = 0;
        Object.values(prompts).forEach(category => {
            if (Array.isArray(category)) {
                count += category.length;
            } else if (typeof category === 'object') {
                count += Object.keys(category).length;
            }
        });
        return count;
    }

    /**
     * 获取支持的语言列表
     * @returns {Array} 支持的语言
     */
    getSupportedLanguages() {
        return Object.keys(this.languagePrompts);
    }

    /**
     * 验证语言支持
     * @param {string} language - 语言类型
     * @returns {boolean} 是否支持
     */
    isLanguageSupported(language) {
        return this.getSupportedLanguages().includes(language.toLowerCase());
    }
}

export default PromptIntelligence;