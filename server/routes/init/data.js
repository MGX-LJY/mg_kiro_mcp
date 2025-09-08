/**
 * Init模式 - 数据提供路由模块
 * 重构架构：MCP提供原始扫描数据和模板，AI主导分析
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建Init模式数据提供路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createInitDataRoutes(services) {
    const router = express.Router();
    const { workflowService, server, promptService } = services;

    /**
     * 获取项目扫描原始数据和分析模板
     * POST /get-project-scan-data
     */
    router.post('/get-project-scan-data', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径不能为空', 400);
            }

            console.log(`[InitData] 获取项目扫描数据: ${projectPath}`);
            
            const startTime = Date.now();
            
            // 创建工作流会话
            const workflowId = workflowService.createWorkflow(projectPath, 'init');
            
            // 执行基础项目扫描 - 仅获取原始数据
            const rawScanData = await _performBasicScan(projectPath, server);
            
            // 获取分析模板 (通过统一模板服务)
            const analysisTemplates = await _loadInitAnalysisTemplates(services.unifiedTemplateService, {
                projectPath,
                mode: 'init',
                language: 'auto'
            });
            
            // 获取参考数据
            const referenceData = await _loadInitReferenceData();
            
            // 构建响应数据 - 仅提供原始数据和模板
            const responseData = {
                // 原始扫描数据
                rawScanData,
                
                // 分析模板 - AI用于分析的结构化提示
                analysisTemplates,
                
                // 参考数据 - 辅助AI做出更好的分析
                referenceData,
                
                // 分析配置
                analysisConfig: _getInitAnalysisConfig(),
                
                // 元数据
                metadata: {
                    workflowId,
                    projectPath,
                    scanTimestamp: new Date().toISOString(),
                    templateVersion: '1.0.0',
                    analysisCapabilities: [
                        'language-detection',
                        'framework-identification',
                        'structure-analysis',
                        'module-mapping',
                        'dependency-analysis',
                        'documentation-generation'
                    ]
                }
            };

            const executionTime = Date.now() - startTime;
            
            // 更新工作流状态 (步骤0 = scan_structure，对应项目扫描数据准备)
            if (workflowId) {
                try {
                    workflowService.updateStep(workflowId, 0, 'completed', responseData);
                } catch (error) {
                    console.warn('[InitData] 工作流更新警告:', error.message);
                }
            }

            console.log(`[InitData] 项目扫描数据准备完成: ${projectPath} (${executionTime}ms)`);

            workflowSuccess(res, 1, 'get_project_scan_data', workflowId, {
                ...responseData,
                generation: {
                    executionTime,
                    dataProvider: 'mcp-server',
                    analysisMode: 'ai-driven',
                    timestamp: new Date().toISOString()
                }
            }, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[InitData] 项目扫描数据准备失败:', err);
            error(res, err.message, 500, {
                action: 'get_project_scan_data'
            });
        }
    });

    /**
     * 获取语言检测数据和模板
     * POST /get-language-detection-data
     */
    router.post('/get-language-detection-data', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[InitData] 获取语言检测数据: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const startTime = Date.now();

            // 获取项目扫描数据
            const scanData = workflow.results.project_scan_data_prepared || workflow.results.step_1;
            if (!scanData) {
                return error(res, '项目扫描数据不存在，请先执行项目扫描', 404);
            }

            // 获取语言检测模板 (通过统一模板服务)
            const languageTemplates = await _loadLanguageDetectionTemplates(services.unifiedTemplateService, {
                projectPath: workflow.projectPath,
                mode: 'analyze',
                step: 'detect_language',
                language: 'auto'
            });
            
            // 获取语言特定参考数据
            const languageReferences = _getLanguageReferences();

            const responseData = {
                // 原始扫描数据（文件扩展名、配置文件等）
                rawData: {
                    fileExtensions: scanData.rawScanData?.fileExtensions || [],
                    configFiles: scanData.rawScanData?.configFiles || [],
                    packageFiles: scanData.rawScanData?.packageFiles || [],
                    directoryStructure: scanData.rawScanData?.directoryStructure || {},
                    projectStats: scanData.rawScanData?.projectStats || {}
                },
                
                // 语言检测模板
                languageTemplates,
                
                // 语言参考数据
                languageReferences,
                
                // 检测配置
                detectionConfig: {
                    supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust', 'csharp'],
                    confidenceThreshold: 0.7,
                    frameworkDetection: true,
                    versionDetection: true
                },
                
                metadata: {
                    workflowId,
                    stage: 'language_detection',
                    timestamp: new Date().toISOString()
                }
            };

            const executionTime = Date.now() - startTime;

            console.log(`[InitData] 语言检测数据准备完成: ${executionTime}ms`);

            success(res, {
                ...responseData,
                generation: {
                    executionTime,
                    dataProvider: 'mcp-server',
                    analysisMode: 'ai-driven',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('[InitData] 语言检测数据准备失败:', err);
            error(res, err.message, 500, {
                action: 'get_language_detection_data'
            });
        }
    });

    /**
     * 获取模块分析数据和模板
     * POST /get-module-analysis-data
     */
    router.post('/get-module-analysis-data', async (req, res) => {
        try {
            const { workflowId, language } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[InitData] 获取模块分析数据: ${workflowId}, 语言: ${language || '未指定'}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const startTime = Date.now();

            // 获取文件分析数据
            const fileAnalysisData = workflow.results.step_3 || {};
            const detectedLanguage = language || workflow.results.step_2?.detection?.primaryLanguage || 'javascript';

            // 获取模块分析模板
            const moduleTemplates = await _loadModuleAnalysisTemplates(services.unifiedTemplateService, detectedLanguage);
            
            // 获取语言特定的模块参考数据
            const moduleReferences = _getModuleReferences(detectedLanguage);

            const responseData = {
                // 原始文件分析数据
                rawData: {
                    files: fileAnalysisData.files || [],
                    dependencies: fileAnalysisData.dependencies || {},
                    language: detectedLanguage,
                    projectStructure: fileAnalysisData.structure || {}
                },
                
                // 模块分析模板
                moduleTemplates,
                
                // 模块参考数据
                moduleReferences,
                
                // 分析配置
                analysisConfig: {
                    language: detectedLanguage,
                    analyzeComplexity: true,
                    analyzeDependencies: true,
                    generateInterfaces: true,
                    identifyPatterns: true
                },
                
                metadata: {
                    workflowId,
                    stage: 'module_analysis',
                    language: detectedLanguage,
                    timestamp: new Date().toISOString()
                }
            };

            const executionTime = Date.now() - startTime;

            console.log(`[InitData] 模块分析数据准备完成: ${executionTime}ms`);

            success(res, {
                ...responseData,
                generation: {
                    executionTime,
                    dataProvider: 'mcp-server',
                    analysisMode: 'ai-driven',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('[InitData] 模块分析数据准备失败:', err);
            error(res, err.message, 500, {
                action: 'get_module_analysis_data'
            });
        }
    });

    /**
     * 保存AI分析结果
     * POST /save-init-analysis-result
     */
    router.post('/save-init-analysis-result', async (req, res) => {
        try {
            const { 
                workflowId,
                analysisType,
                analysisResult,
                stepNumber,
                metadata = {}
            } = req.body;
            
            if (!workflowId || !analysisType || !analysisResult) {
                return error(res, '工作流ID、分析类型和结果不能为空', 400);
            }

            console.log(`[InitData] 保存AI分析结果: ${analysisType} for ${workflowId}`);

            const saveData = {
                type: analysisType,
                result: analysisResult,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    source: 'claude-code-ai'
                }
            };

            // 保存到工作流中
            const stepName = `ai_analysis_${analysisType}`;
            workflowService.updateStep(workflowId, stepName, 'completed', saveData);

            // 如果指定了步骤号，也更新对应步骤
            if (stepNumber) {
                workflowService.updateStep(workflowId, stepNumber, 'completed', saveData);
            }

            console.log(`[InitData] 分析结果已保存: ${analysisType}`);

            success(res, {
                saved: true,
                analysisType,
                workflowId,
                stepName,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error('[InitData] 保存分析结果失败:', err);
            error(res, err.message, 500, {
                action: 'save_init_analysis_result'
            });
        }
    });

    return router;
}

// ========== 辅助函数 ==========

/**
 * 执行基础项目扫描
 * @param {string} projectPath - 项目路径
 * @param {Object} server - 服务器实例
 * @returns {Object} 原始扫描数据
 */
async function _performBasicScan(projectPath, server) {
    try {
        // 如果有项目扫描器，使用它获取原始数据
        if (server.projectScanner) {
            return await server.projectScanner.scanProject(projectPath);
        }
        
        // 否则返回基础扫描数据结构
        return {
            projectPath,
            scannedAt: new Date().toISOString(),
            structure: { totalFiles: 0, totalDirectories: 0 },
            fileExtensions: {},
            configFiles: [],
            packageFiles: [],
            readmeFiles: [],
            projectStats: { lines: 0, files: 0 }
        };
    } catch (error) {
        console.error('基础扫描失败:', error);
        throw new Error(`项目扫描失败: ${error.message}`);
    }
}

/**
 * 加载Init分析模板 (重构为统一模板服务调用)
 * @param {Object} unifiedTemplateService - 统一模板服务
 * @param {Object} contextData - 上下文数据
 * @returns {Object} 分析模板
 */
async function _loadInitAnalysisTemplates(unifiedTemplateService, contextData) {
    try {
        const templates = {};
        const templateConfigs = [
            { key: 'projectStructureAnalysis', name: 'project-structure-analysis', category: 'analysis-templates' },
            { key: 'languageDetection', name: 'language-detection', category: 'analysis-templates' },
            { key: 'frameworkIdentification', name: 'framework-identification', category: 'analysis-templates' },
            { key: 'moduleMapping', name: 'module-mapping', category: 'analysis-templates' },
            { key: 'dependencyAnalysis', name: 'dependency-analysis', category: 'analysis-templates' },
            { key: 'documentationGeneration', name: 'documentation-generation', category: 'document-templates' }
        ];

        for (const config of templateConfigs) {
            try {
                const result = await unifiedTemplateService.getTemplateByContext({
                    ...contextData,
                    mode: 'init',
                    templateType: config.name
                }, {
                    category: config.category,
                    name: config.name
                });
                templates[config.key] = result;
            } catch (error) {
                console.warn(`加载模板失败 ${config.name}:`, error.message);
                templates[config.key] = _getDefaultTemplate(config.name);
            }
        }

        return templates;
    } catch (error) {
        console.error('加载Init分析模板失败:', error);
        return _getDefaultInitTemplates();
    }
}

/**
 * 加载语言检测模板 (重构为统一模板服务调用)
 * @param {Object} unifiedTemplateService - 统一模板服务
 * @param {Object} contextData - 上下文数据 
 * @returns {Object} 语言检测模板
 */
async function _loadLanguageDetectionTemplates(unifiedTemplateService, contextData) {
    try {
        const templates = {};
        const templateConfigs = [
            { key: 'primaryLanguage', name: 'primary-language-detection', category: 'analysis-templates' },
            { key: 'frameworkDetection', name: 'framework-detection', category: 'analysis-templates' },
            { key: 'versionDetection', name: 'version-detection', category: 'analysis-templates' }
        ];

        for (const config of templateConfigs) {
            try {
                const result = await unifiedTemplateService.getTemplateByContext({
                    ...contextData,
                    mode: 'analyze',
                    step: 'detect_language',
                    templateType: config.name
                }, {
                    category: config.category,
                    name: config.name
                });
                templates[config.key] = result;
            } catch (error) {
                console.warn(`加载语言检测模板失败 ${config.name}:`, error.message);
                templates[config.key] = _getDefaultTemplate(config.name);
            }
        }

        return templates;
    } catch (error) {
        console.error('加载语言检测模板失败:', error);
        return _getDefaultLanguageTemplates();
    }
}

/**
 * 加载模块分析模板
 * @param {Object} promptService - 提示词服务
 * @param {string} language - 编程语言
 * @returns {Object} 模块分析模板
 */
async function _loadModuleAnalysisTemplates(unifiedTemplateService, language) {
    try {
        const templates = {};
        const templateConfigs = [
            { key: 'moduleIdentification', name: 'module-identification', category: 'analysis-templates' },
            { key: 'complexityAnalysis', name: 'complexity-analysis', category: 'analysis-templates' },
            { key: 'interfaceExtraction', name: 'interface-extraction', category: 'analysis-templates' },
            { key: 'dependencyMapping', name: 'dependency-mapping', category: 'analysis-templates' }
        ];

        for (const config of templateConfigs) {
            try {
                const result = await unifiedTemplateService.getTemplateByContext({
                    mode: 'analyze',
                    step: 'analyze_modules',
                    templateType: config.name,
                    language
                }, {
                    category: config.category,
                    name: config.name,
                    variables: { language }
                });
                templates[config.key] = result;
            } catch (error) {
                console.warn(`加载模块分析模板失败 ${config.name}:`, error.message);
                templates[config.key] = _getDefaultTemplate(config.name);
            }
        }

        return templates;
    } catch (error) {
        return _getDefaultModuleTemplates(language);
    }
}

/**
 * 获取Init参考数据
 * @returns {Object} 参考数据
 */
async function _loadInitReferenceData() {
    return {
        languageIndicators: {
            javascript: { extensions: ['.js', '.jsx', '.ts', '.tsx'], configs: ['package.json', '.eslintrc'] },
            python: { extensions: ['.py', '.pyx'], configs: ['requirements.txt', 'setup.py', 'pyproject.toml'] },
            java: { extensions: ['.java'], configs: ['pom.xml', 'build.gradle', 'gradle.properties'] },
            go: { extensions: ['.go'], configs: ['go.mod', 'go.sum'] }
        },
        frameworkPatterns: {
            javascript: ['react', 'vue', 'angular', 'express', 'next.js'],
            python: ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
            java: ['spring', 'hibernate', 'junit', 'maven', 'gradle'],
            go: ['gin', 'echo', 'fiber', 'gorilla', 'chi']
        },
        architecturePatterns: ['mvc', 'mvvm', 'microservices', 'layered', 'hexagonal'],
        complexityMetrics: {
            low: { files: '<50', functions: '<100', complexity: '<10' },
            medium: { files: '50-200', functions: '100-500', complexity: '10-30' },
            high: { files: '>200', functions: '>500', complexity: '>30' }
        }
    };
}

/**
 * 获取语言参考数据
 * @returns {Object} 语言参考数据
 */
function _getLanguageReferences() {
    return {
        confidenceWeights: {
            fileExtensions: 0.4,
            configFiles: 0.3,
            dependencies: 0.2,
            directoryStructure: 0.1
        },
        frameworkIndicators: {
            javascript: {
                react: ['src/App.js', 'public/index.html', 'package.json'],
                vue: ['src/main.js', 'vue.config.js', 'package.json'],
                angular: ['angular.json', 'src/app', 'package.json'],
                express: ['app.js', 'server.js', 'package.json']
            },
            python: {
                django: ['manage.py', 'settings.py', 'urls.py'],
                flask: ['app.py', 'requirements.txt'],
                fastapi: ['main.py', 'requirements.txt']
            }
        }
    };
}

/**
 * 获取模块参考数据
 * @param {string} language - 编程语言
 * @returns {Object} 模块参考数据
 */
function _getModuleReferences(language) {
    const references = {
        javascript: {
            modulePatterns: ['CommonJS', 'ES6 Modules', 'AMD'],
            complexityIndicators: ['nested callbacks', 'large functions', 'high cyclomatic complexity'],
            bestPractices: ['single responsibility', 'dependency injection', 'error handling']
        },
        python: {
            modulePatterns: ['packages', 'modules', 'classes'],
            complexityIndicators: ['deeply nested code', 'long functions', 'high coupling'],
            bestPractices: ['PEP8 compliance', 'docstrings', 'type hints']
        },
        java: {
            modulePatterns: ['packages', 'classes', 'interfaces'],
            complexityIndicators: ['long methods', 'large classes', 'tight coupling'],
            bestPractices: ['SOLID principles', 'design patterns', 'clean code']
        }
    };
    
    return references[language] || references.javascript;
}

/**
 * 获取Init分析配置
 * @returns {Object} 分析配置
 */
function _getInitAnalysisConfig() {
    return {
        scanDepth: 4,
        maxFiles: 1000,
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        includeHiddenFiles: false,
        analyzeCodeQuality: true,
        generateSuggestions: true,
        createDocumentation: true
    };
}

// 默认模板函数
function _getDefaultInitTemplates() {
    return {
        projectStructureAnalysis: { content: '# 项目结构分析模板\n分析项目目录结构和文件组织方式...' },
        languageDetection: { content: '# 语言检测模板\n基于文件扩展名和配置文件检测项目主要语言...' },
        frameworkIdentification: { content: '# 框架识别模板\n识别项目使用的主要框架和库...' }
    };
}

function _getDefaultLanguageTemplates() {
    return {
        primaryLanguage: { content: '# 主要语言检测\n基于文件扩展名统计确定项目主要编程语言...' },
        frameworkDetection: { content: '# 框架检测\n基于配置文件和依赖分析项目使用的框架...' }
    };
}

/**
 * 获取默认模板 (兼容统一模板服务格式)
 * @param {string} templateName - 模板名称
 * @returns {Object} 默认模板
 */
function _getDefaultTemplate(templateName) {
    return {
        template: {
            content: `# ${templateName}\n\n默认${templateName}模板内容。`,
            type: 'fallback',
            source: 'default'
        },
        intelligence: {
            confidence: 0.1,
            reasoning: '使用默认模板回退',
            alternatives: [],
            suggestions: []
        },
        metadata: {
            fallback: true,
            templateName
        }
    };
}

function _getDefaultModuleTemplates(language) {
    return {
        moduleIdentification: _getDefaultTemplate(`${language} 模块识别`),
        complexityAnalysis: _getDefaultTemplate(`${language} 复杂度分析`),
        interfaceExtraction: _getDefaultTemplate(`${language} 接口提取`),
        dependencyMapping: _getDefaultTemplate(`${language} 依赖映射`)
    };
}

export default createInitDataRoutes;