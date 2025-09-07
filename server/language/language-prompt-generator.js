/**
 * 语言特定提示词生成器
 * 基于检测的项目语言生成专业的提示词，涵盖最佳实践、常见模式、框架约定
 */

import LanguageDetector from './detector.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LanguagePromptGenerator {
    constructor() {
        this.detector = new LanguageDetector();
        this.promptTemplates = this.initializePromptTemplates();
        this.bestPractices = this.initializeBestPractices();
        this.frameworkGuidelines = this.initializeFrameworkGuidelines();
    }

    /**
     * 基于项目路径生成语言特定的专业提示词
     * @param {string} projectPath - 项目根目录路径
     * @param {Object} options - 生成选项
     * @returns {Object} 生成的提示词和元信息
     */
    async generatePrompts(projectPath, options = {}) {
        try {
            // 1. 检测项目语言
            const detection = await this.detector.detectLanguage(projectPath);
            
            if (detection.language === 'unknown') {
                return this.generateFallbackPrompts(detection);
            }

            // 2. 获取语言特定的提示词模板
            const prompts = this.buildLanguagePrompts(detection);
            
            return {
                success: true,
                language: detection.language,
                confidence: detection.confidence,
                frameworks: detection.frameworks,
                prompts: prompts,
                metadata: {
                    detectedLanguage: detection.language,
                    confidence: detection.confidence,
                    primaryFramework: detection.frameworks[0]?.name || 'None',
                    generatedAt: new Date().toISOString(),
                    suggestions: detection.suggestions
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackPrompts()
            };
        }
    }

    /**
     * 构建语言特定的提示词集合
     * @param {Object} detection - 语言检测结果
     * @returns {Object} 构建的提示词
     */
    buildLanguagePrompts(detection) {
        const { language, frameworks } = detection;
        const primaryFramework = frameworks[0]?.name || null;
        
        return {
            // 核心开发提示词
            development: this.generateDevelopmentPrompt(language, primaryFramework),
            
            // 最佳实践提示词
            bestPractices: this.generateBestPracticesPrompt(language),
            
            // 代码审查提示词
            codeReview: this.generateCodeReviewPrompt(language, primaryFramework),
            
            // 调试和问题解决提示词
            debugging: this.generateDebuggingPrompt(language),
            
            // 性能优化提示词
            performance: this.generatePerformancePrompt(language, primaryFramework),
            
            // 测试策略提示词
            testing: this.generateTestingPrompt(language, primaryFramework),
            
            // 文档编写提示词
            documentation: this.generateDocumentationPrompt(language),
            
            // 安全实践提示词
            security: this.generateSecurityPrompt(language, primaryFramework)
        };
    }

    /**
     * 生成开发提示词
     */
    generateDevelopmentPrompt(language, framework) {
        const base = this.promptTemplates[language]?.development || this.promptTemplates.common.development;
        const frameworkSpecific = framework ? this.frameworkGuidelines[framework]?.development || '' : '';
        
        return {
            title: `${this.getLanguageDisplayName(language)} 开发专家提示词`,
            content: this.mergePromptContent(base, frameworkSpecific),
            keywords: this.getLanguageKeywords(language),
            patterns: this.getCommonPatterns(language, framework),
            examples: this.getCodeExamples(language, framework, 'development')
        };
    }

    /**
     * 生成最佳实践提示词
     */
    generateBestPracticesPrompt(language) {
        const practices = this.bestPractices[language] || this.bestPractices.common;
        
        return {
            title: `${this.getLanguageDisplayName(language)} 最佳实践指南`,
            content: `# ${this.getLanguageDisplayName(language)} 最佳实践

你是一位资深的${this.getLanguageDisplayName(language)}开发专家，请严格遵循以下最佳实践：

## 代码质量标准
${practices.codeQuality.map(item => `- ${item}`).join('\n')}

## 项目结构规范
${practices.projectStructure.map(item => `- ${item}`).join('\n')}

## 命名约定
${practices.naming.map(item => `- ${item}`).join('\n')}

## 性能考量
${practices.performance.map(item => `- ${item}`).join('\n')}

## 安全实践
${practices.security.map(item => `- ${item}`).join('\n')}

请在所有代码生成和建议中严格遵循这些原则。`,
            practices: practices,
            checklist: this.generateBestPracticesChecklist(language)
        };
    }

    /**
     * 生成代码审查提示词
     */
    generateCodeReviewPrompt(language, framework) {
        const reviewCriteria = this.getCodeReviewCriteria(language, framework);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 代码审查专家`,
            content: `# 代码审查专家 - ${this.getLanguageDisplayName(language)}

作为${this.getLanguageDisplayName(language)}代码审查专家，请按照以下标准审查代码：

## 审查重点
${reviewCriteria.focus.map(item => `- ${item}`).join('\n')}

## 常见问题检查
${reviewCriteria.commonIssues.map(item => `- ${item}`).join('\n')}

## 质量评估标准
${reviewCriteria.qualityMetrics.map(item => `- ${item}`).join('\n')}

请提供具体、可操作的改进建议，并解释为什么这样做更好。`,
            criteria: reviewCriteria,
            templates: this.getReviewTemplates(language)
        };
    }

    /**
     * 生成调试提示词
     */
    generateDebuggingPrompt(language) {
        const debuggingStrategies = this.getDebuggingStrategies(language);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 调试专家`,
            content: `# 调试专家 - ${this.getLanguageDisplayName(language)}

作为${this.getLanguageDisplayName(language)}调试专家，使用以下系统化的调试方法：

## 调试策略
${debuggingStrategies.strategies.map(item => `- ${item}`).join('\n')}

## 常用工具
${debuggingStrategies.tools.map(item => `- ${item}`).join('\n')}

## 典型错误模式
${debuggingStrategies.commonErrors.map(item => `- ${item}`).join('\n')}

## 调试流程
1. 重现问题
2. 缩小范围
3. 添加日志/断点
4. 分析数据
5. 假设验证
6. 修复验证

请提供详细的调试步骤和工具使用建议。`,
            strategies: debuggingStrategies,
            tools: this.getDebuggingTools(language)
        };
    }

    /**
     * 生成性能优化提示词
     */
    generatePerformancePrompt(language, framework) {
        const perfGuidelines = this.getPerformanceGuidelines(language, framework);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 性能优化专家`,
            content: `# 性能优化专家 - ${this.getLanguageDisplayName(language)}

专注于${this.getLanguageDisplayName(language)}应用性能优化：

## 性能优化原则
${perfGuidelines.principles.map(item => `- ${item}`).join('\n')}

## 常见性能瓶颈
${perfGuidelines.bottlenecks.map(item => `- ${item}`).join('\n')}

## 优化策略
${perfGuidelines.strategies.map(item => `- ${item}`).join('\n')}

## 性能监控
${perfGuidelines.monitoring.map(item => `- ${item}`).join('\n')}

请始终考虑性能影响，提供可测量的优化建议。`,
            guidelines: perfGuidelines,
            benchmarks: this.getPerformanceBenchmarks(language)
        };
    }

    /**
     * 生成测试策略提示词
     */
    generateTestingPrompt(language, framework) {
        const testingStrategy = this.getTestingStrategy(language, framework);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 测试专家`,
            content: `# 测试专家 - ${this.getLanguageDisplayName(language)}

制定全面的${this.getLanguageDisplayName(language)}测试策略：

## 测试金字塔
${testingStrategy.pyramid.map(item => `- ${item}`).join('\n')}

## 测试类型
${testingStrategy.types.map(item => `- ${item}`).join('\n')}

## 测试工具
${testingStrategy.tools.map(item => `- ${item}`).join('\n')}

## 测试最佳实践
${testingStrategy.bestPractices.map(item => `- ${item}`).join('\n')}

请确保测试覆盖率达到80%以上，重点关注边界条件和错误处理。`,
            strategy: testingStrategy,
            examples: this.getTestExamples(language, framework)
        };
    }

    /**
     * 生成文档编写提示词
     */
    generateDocumentationPrompt(language) {
        const docGuidelines = this.getDocumentationGuidelines(language);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 文档专家`,
            content: `# 技术文档专家 - ${this.getLanguageDisplayName(language)}

创建高质量的${this.getLanguageDisplayName(language)}项目文档：

## 文档标准
${docGuidelines.standards.map(item => `- ${item}`).join('\n')}

## 文档类型
${docGuidelines.types.map(item => `- ${item}`).join('\n')}

## 编写原则
${docGuidelines.principles.map(item => `- ${item}`).join('\n')}

## 维护策略
${docGuidelines.maintenance.map(item => `- ${item}`).join('\n')}

请确保文档准确、简洁、易于理解，包含必要的代码示例。`,
            guidelines: docGuidelines,
            templates: this.getDocumentationTemplates(language)
        };
    }

    /**
     * 生成安全实践提示词
     */
    generateSecurityPrompt(language, framework) {
        const securityGuidelines = this.getSecurityGuidelines(language, framework);
        
        return {
            title: `${this.getLanguageDisplayName(language)} 安全专家`,
            content: `# 安全专家 - ${this.getLanguageDisplayName(language)}

实施${this.getLanguageDisplayName(language)}应用安全最佳实践：

## 安全原则
${securityGuidelines.principles.map(item => `- ${item}`).join('\n')}

## 常见漏洞
${securityGuidelines.vulnerabilities.map(item => `- ${item}`).join('\n')}

## 防护措施
${securityGuidelines.protections.map(item => `- ${item}`).join('\n')}

## 安全工具
${securityGuidelines.tools.map(item => `- ${item}`).join('\n')}

请始终考虑安全影响，不要暴露敏感信息，实施纵深防御策略。`,
            guidelines: securityGuidelines,
            checklist: this.getSecurityChecklist(language)
        };
    }

    /**
     * 初始化提示词模板
     */
    initializePromptTemplates() {
        return {
            javascript: {
                development: `你是一位资深的JavaScript/Node.js开发专家。请遵循现代ES6+语法，优先使用函数式编程风格，确保代码的可读性和可维护性。始终考虑异步编程最佳实践，合理使用async/await和Promise。注重模块化设计，采用MVC或类似的架构模式。`
            },
            python: {
                development: `你是一位资深的Python开发专家。请严格遵循PEP 8代码规范，优先使用类型提示(Type Hints)，遵循"明确胜过隐含"的Python哲学。注重代码的可读性和Pythonic风格，合理使用生成器、装饰器等Python特性。推荐使用虚拟环境和现代包管理工具。`
            },
            java: {
                development: `你是一位资深的Java开发专家。请遵循Java代码规范和面向对象设计原则(SOLID)。优先使用Java 8+的现代特性，如Lambda表达式、Stream API、Optional等。注重异常处理、线程安全和性能优化。推荐使用Spring框架生态系统。`
            },
            go: {
                development: `你是一位资深的Go开发专家。请遵循Go的简洁哲学，优先使用组合而非继承，注重接口设计。严格处理错误，合理使用goroutines和channels。遵循Go的命名约定和代码格式化标准，使用go fmt和go vet工具。`
            },
            rust: {
                development: `你是一位资深的Rust开发专家。请充分利用Rust的所有权系统和类型系统，确保内存安全。优先使用函数式编程范式，合理使用模式匹配。注重错误处理，使用Result和Option类型。遵循Rust的命名约定和最佳实践。`
            },
            csharp: {
                development: `你是一位资深的C#/.NET开发专家。请遵循.NET编码约定和最佳实践，充分利用.NET框架的功能。注重面向对象设计，合理使用LINQ、async/await、泛型等特性。推荐使用Entity Framework、ASP.NET等成熟框架。`
            },
            common: {
                development: `你是一位资深的软件开发专家。请遵循通用的编程最佳实践，注重代码质量、可读性和可维护性。采用测试驱动开发(TDD)，确保充分的单元测试覆盖。遵循SOLID原则和设计模式，编写清晰的技术文档。`
            }
        };
    }

    /**
     * 初始化最佳实践
     */
    initializeBestPractices() {
        return {
            javascript: {
                codeQuality: [
                    '使用ESLint和Prettier进行代码质量控制',
                    '优先使用const和let，避免var',
                    '使用模板字符串而非字符串拼接',
                    '合理使用解构赋值和扩展运算符',
                    '避免回调地狱，使用async/await'
                ],
                projectStructure: [
                    '按功能模块组织目录结构',
                    '分离业务逻辑和UI逻辑',
                    '使用index.js作为模块入口',
                    '配置合适的.gitignore和.nvmrc',
                    '使用package-lock.json锁定依赖版本'
                ],
                naming: [
                    '使用camelCase命名变量和函数',
                    '使用PascalCase命名类和构造函数',
                    '使用UPPER_CASE命名常量',
                    '使用有意义的变量和函数名',
                    '避免单字母变量名(除了循环计数器)'
                ],
                performance: [
                    '避免不必要的重渲染和重计算',
                    '使用适当的数据结构(Map vs Object)',
                    '合理使用缓存和memoization',
                    '优化循环和条件语句',
                    '避免内存泄漏，及时清理事件监听器'
                ],
                security: [
                    '验证和清理用户输入',
                    '使用HTTPS和安全的认证机制',
                    '避免XSS和CSRF攻击',
                    '不在客户端存储敏感信息',
                    '使用环境变量管理配置'
                ]
            },
            python: {
                codeQuality: [
                    '严格遵循PEP 8代码规范',
                    '使用类型提示提高代码可读性',
                    '使用Black进行代码格式化',
                    '使用pylint/flake8进行静态代码分析',
                    '编写详细的docstring文档'
                ],
                projectStructure: [
                    '使用虚拟环境隔离依赖',
                    '按功能模块组织包结构',
                    '使用__init__.py控制包的导入',
                    '分离配置、测试和源代码',
                    '使用requirements.txt或pyproject.toml管理依赖'
                ],
                naming: [
                    '使用snake_case命名变量和函数',
                    '使用PascalCase命名类',
                    '使用UPPER_CASE命名常量',
                    '使用有意义的变量和函数名',
                    '私有属性以单下划线开头'
                ],
                performance: [
                    '使用生成器处理大数据集',
                    '选择合适的数据结构(list vs set vs dict)',
                    '使用列表推导式和生成器表达式',
                    '避免过度使用全局变量',
                    '使用cProfile进行性能分析'
                ],
                security: [
                    '验证和清理用户输入',
                    '使用参数化查询防止SQL注入',
                    '使用secrets模块生成安全的随机数',
                    '不在代码中硬编码敏感信息',
                    '使用虚拟环境和依赖扫描'
                ]
            },
            common: {
                codeQuality: [
                    '编写清晰、可读的代码',
                    '遵循一致的代码风格',
                    '使用有意义的变量和函数名',
                    '编写单元测试',
                    '定期进行代码审查'
                ],
                projectStructure: [
                    '组织清晰的目录结构',
                    '分离关注点',
                    '使用版本控制',
                    '编写README和文档',
                    '配置持续集成'
                ],
                naming: [
                    '使用一致的命名约定',
                    '选择有意义的名称',
                    '避免缩写和简写',
                    '遵循语言惯例',
                    '使用动词命名函数，名词命名变量'
                ],
                performance: [
                    '选择合适的算法和数据结构',
                    '避免过早优化',
                    '监控关键性能指标',
                    '使用性能分析工具',
                    '考虑缓存策略'
                ],
                security: [
                    '输入验证和清理',
                    '最小权限原则',
                    '定期更新依赖',
                    '使用安全的认证和授权',
                    '记录和监控安全事件'
                ]
            }
        };
    }

    /**
     * 初始化框架指导原则
     */
    initializeFrameworkGuidelines() {
        return {
            react: {
                development: `专注于React组件化开发，使用函数组件和Hooks，遵循React最佳实践。注重组件的可重用性和性能优化，合理使用Context和状态管理库。`
            },
            vue: {
                development: `遵循Vue.js渐进式框架理念，使用组合式API，注重模板语法和响应式数据。合理使用Vue Router和Vuex/Pinia进行状态管理。`
            },
            angular: {
                development: `采用Angular的企业级架构，使用TypeScript和依赖注入。遵循Angular风格指南，合理使用服务、指令和管道。`
            },
            express: {
                development: `构建RESTful API，使用中间件模式，注重错误处理和安全性。合理使用路由、模板引擎和数据库连接。`
            },
            django: {
                development: `遵循Django的MVT架构，使用ORM进行数据库操作。注重安全性、可扩展性和Django最佳实践。`
            },
            flask: {
                development: `采用Flask的轻量级设计，使用蓝图组织代码。注重扩展的选择和配置，保持代码简洁。`
            },
            spring: {
                development: `使用Spring Boot的约定优于配置，采用依赖注入和面向切面编程。注重分层架构和事务管理。`
            }
        };
    }

    /**
     * 获取语言显示名称
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
     * 获取语言关键词
     */
    getLanguageKeywords(language) {
        const keywords = {
            javascript: ['async', 'await', 'Promise', 'module', 'import', 'export', 'class', 'const', 'let', 'arrow function'],
            python: ['def', 'class', 'import', 'from', 'async', 'await', 'lambda', 'generator', 'decorator', 'context manager'],
            java: ['class', 'interface', 'extends', 'implements', 'static', 'final', 'abstract', 'synchronized', 'generic'],
            go: ['func', 'struct', 'interface', 'goroutine', 'channel', 'defer', 'panic', 'recover', 'package'],
            rust: ['fn', 'struct', 'enum', 'trait', 'impl', 'match', 'ownership', 'borrowing', 'lifetime'],
            csharp: ['class', 'interface', 'namespace', 'using', 'async', 'await', 'LINQ', 'generic', 'delegate']
        };
        return keywords[language] || [];
    }

    /**
     * 获取常见模式
     */
    getCommonPatterns(language, framework) {
        // 简化实现，实际可以更详细
        const patterns = {
            javascript: ['Module Pattern', 'Observer Pattern', 'Promise Chain', 'Async/Await', 'Factory Pattern'],
            python: ['Context Manager', 'Decorator Pattern', 'Generator Pattern', 'Singleton Pattern', 'MVC Pattern'],
            java: ['Singleton', 'Factory', 'Observer', 'MVC', 'Dependency Injection'],
            go: ['Interface Composition', 'Error Handling', 'Concurrency Pattern', 'Factory Pattern'],
            rust: ['RAII', 'Builder Pattern', 'Result Pattern', 'Iterator Pattern', 'Ownership Pattern'],
            csharp: ['Repository Pattern', 'Unit of Work', 'Dependency Injection', 'MVVM', 'Factory Pattern']
        };
        return patterns[language] || [];
    }

    /**
     * 获取代码示例
     */
    getCodeExamples(language, framework, category) {
        // 这里可以返回特定语言和框架的代码示例
        return {
            basic: `// ${language} ${category} example`,
            advanced: `// Advanced ${language} ${category} with ${framework || 'standard library'}`
        };
    }

    /**
     * 生成最佳实践检查清单
     */
    generateBestPracticesChecklist(language) {
        const practices = this.bestPractices[language] || this.bestPractices.common;
        return [
            '代码风格一致性检查',
            '命名约定遵循检查',
            '错误处理完整性检查',
            '性能优化检查',
            '安全性检查',
            '测试覆盖率检查',
            '文档完整性检查'
        ];
    }

    /**
     * 获取代码审查标准
     */
    getCodeReviewCriteria(language, framework) {
        return {
            focus: [
                '代码逻辑正确性',
                '性能和安全性',
                '可读性和可维护性',
                '遵循语言和框架约定',
                '错误处理完整性'
            ],
            commonIssues: [
                '命名不规范',
                '缺少错误处理',
                '性能问题',
                '安全漏洞',
                '逻辑错误'
            ],
            qualityMetrics: [
                '代码复杂度',
                '测试覆盖率',
                '代码重复率',
                '依赖管理',
                '文档完整性'
            ]
        };
    }

    /**
     * 获取调试策略
     */
    getDebuggingStrategies(language) {
        return {
            strategies: [
                '使用调试器进行断点调试',
                '添加日志和打印语句',
                '单元测试验证',
                '代码审查',
                '使用性能分析工具'
            ],
            tools: this.getDebuggingTools(language),
            commonErrors: [
                '空指针/未定义引用',
                '类型错误',
                '逻辑错误',
                '性能问题',
                '内存泄漏'
            ]
        };
    }

    /**
     * 获取调试工具
     */
    getDebuggingTools(language) {
        const tools = {
            javascript: ['Chrome DevTools', 'Node.js Inspector', 'VS Code Debugger', 'console.log'],
            python: ['pdb', 'PyCharm Debugger', 'VS Code Debugger', 'print statements'],
            java: ['IntelliJ Debugger', 'Eclipse Debugger', 'jdb', 'System.out.println'],
            go: ['Delve', 'VS Code Debugger', 'fmt.Println', 'Go runtime profiler'],
            rust: ['rust-gdb', 'VS Code Debugger', 'println! macro', 'cargo test'],
            csharp: ['Visual Studio Debugger', 'VS Code Debugger', 'Console.WriteLine', '.NET Diagnostics']
        };
        return tools[language] || ['Generic debugger', 'Print statements', 'Unit tests'];
    }

    // 其他辅助方法的实现...
    getPerformanceGuidelines(language, framework) {
        return {
            principles: ['测量后优化', '选择合适的算法', '避免不必要的计算', '合理使用缓存'],
            bottlenecks: ['数据库查询', 'I/O操作', '循环效率', '内存使用'],
            strategies: ['缓存策略', '异步处理', '批量操作', '代码分割'],
            monitoring: ['性能指标监控', '内存使用监控', '错误率跟踪', '用户体验指标']
        };
    }

    getTestingStrategy(language, framework) {
        return {
            pyramid: ['单元测试(70%)', '集成测试(20%)', 'E2E测试(10%)'],
            types: ['单元测试', '集成测试', '功能测试', '性能测试', '安全测试'],
            tools: this.getTestingTools(language, framework),
            bestPractices: ['AAA模式', '测试隔离', '可重复测试', '有意义的测试名', '充分的边界测试']
        };
    }

    getTestingTools(language, framework) {
        const tools = {
            javascript: ['Jest', 'Mocha', 'Cypress', 'Testing Library'],
            python: ['pytest', 'unittest', 'pytest-cov', 'Selenium'],
            java: ['JUnit', 'Mockito', 'TestNG', 'Spring Test'],
            go: ['go test', 'testify', 'GoConvey', 'httptest'],
            rust: ['cargo test', 'proptest', 'criterion', 'mockall'],
            csharp: ['xUnit', 'NUnit', 'MSTest', 'Moq']
        };
        return tools[language] || ['Language built-in', 'Mock framework', 'Test runner'];
    }

    getDocumentationGuidelines(language) {
        return {
            standards: ['README必须完整', 'API文档清晰', '代码注释适量', '示例代码可运行'],
            types: ['API文档', '用户指南', '开发者文档', '架构文档'],
            principles: ['简洁明了', '及时更新', '包含示例', '结构清晰'],
            maintenance: ['随代码更新', '版本化管理', '定期审查', '用户反馈收集']
        };
    }

    getDocumentationTemplates(language) {
        return {
            readme: 'README.md模板',
            api: 'API文档模板',
            contributing: '贡献指南模板',
            changelog: '变更日志模板'
        };
    }

    getSecurityGuidelines(language, framework) {
        return {
            principles: ['最小权限原则', '深度防御', '输入验证', '加密敏感数据'],
            vulnerabilities: ['注入攻击', 'XSS', 'CSRF', '认证绕过', '敏感数据暴露'],
            protections: ['输入验证', 'HTTPS使用', '安全头设置', '依赖更新'],
            tools: this.getSecurityTools(language)
        };
    }

    getSecurityTools(language) {
        const tools = {
            javascript: ['npm audit', 'ESLint Security', 'Helmet.js', 'OWASP ZAP'],
            python: ['bandit', 'safety', 'pip-audit', 'semgrep'],
            java: ['OWASP Dependency Check', 'SpotBugs', 'SonarQube'],
            go: ['gosec', 'go mod tidy', 'nancy'],
            rust: ['cargo audit', 'cargo deny'],
            csharp: ['Security Code Scan', 'SonarQube', 'OWASP ZAP']
        };
        return tools[language] || ['Security scanner', 'Dependency checker'];
    }

    getSecurityChecklist(language) {
        return [
            '输入验证检查',
            '输出编码检查',
            '认证机制检查',
            '授权控制检查',
            '敏感数据处理检查',
            '错误处理检查',
            '依赖安全检查'
        ];
    }

    getPerformanceBenchmarks(language) {
        return {
            responseTime: '<200ms',
            throughput: '>1000 requests/sec',
            memoryUsage: '<500MB',
            cpuUsage: '<80%'
        };
    }

    getTestExamples(language, framework) {
        return {
            unit: `// ${language} unit test example`,
            integration: `// ${language} integration test example`,
            e2e: `// ${language} E2E test example`
        };
    }

    getReviewTemplates(language) {
        return {
            checklist: '代码审查检查清单',
            feedback: '反馈模板',
            approval: '批准标准'
        };
    }

    /**
     * 合并提示词内容
     */
    mergePromptContent(base, additional) {
        return additional ? `${base}\n\n${additional}` : base;
    }

    /**
     * 生成回退提示词（当语言检测失败时）
     */
    generateFallbackPrompts(detection = {}) {
        return {
            success: false,
            language: 'unknown',
            prompts: {
                development: {
                    title: '通用开发提示词',
                    content: this.promptTemplates.common.development,
                    keywords: ['programming', 'development', 'best practices'],
                    patterns: ['Design Patterns', 'Clean Code', 'SOLID Principles']
                }
            },
            metadata: {
                detectedLanguage: 'unknown',
                confidence: 0,
                generatedAt: new Date().toISOString(),
                fallback: true
            }
        };
    }

    /**
     * 获取特定语言的提示词
     * @param {string} language - 语言类型
     * @returns {Object} 语言特定的提示词
     */
    getLanguageSpecificPrompts(language) {
        if (!this.promptTemplates[language]) {
            return this.generateFallbackPrompts();
        }

        const prompts = this.buildLanguagePrompts({
            language,
            frameworks: [],
            suggestions: []
        });

        return {
            success: true,
            language,
            prompts,
            metadata: {
                detectedLanguage: language,
                staticGeneration: true,
                generatedAt: new Date().toISOString()
            }
        };
    }
}

export default LanguagePromptGenerator;