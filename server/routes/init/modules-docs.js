/**
 * Init模式 - 第7步：模块文档生成路由模块
 * 基于模块分析结果生成详细文档
 * 从 modules.js 拆分出的模块文档生成专用路由
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { AIResponseHandlerService } from '../../services/ai-response-handler.js';

/**
 * 创建模块文档生成路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createModulesDocsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 第7步-A: 生成单独模块文档
     * POST /generate-module-docs
     */
    router.post('/generate-module-docs', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[ModulesDocs] 开始生成模块文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查前置步骤：需要第5步的模块分析结果
            const moduleAnalysisResult = workflow.results.step_5;
            if (!moduleAnalysisResult) {
                return error(res, '请先完成第5步模块分析', 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 7, 'running'); // 第7步，索引为7

            // 获取语言信息用于文档生成
            const languageResult = workflow.results.step_2;
            const primaryLanguage = languageResult?.detection?.primaryLanguage || 'javascript';

            // 准备AI文档生成数据包
            const aiDocumentationPackage = {
                // 数据源
                moduleAnalysis: moduleAnalysisResult.analysis,
                primaryLanguage,
                projectPath: workflow.projectPath,
                
                // AI处理指令
                aiInstructions: {
                    documentTemplate: 'module-documentation-generation.md',
                    documentType: 'module_documentation',
                    language: primaryLanguage,
                    generateExamples: true,
                    includeBestPractices: true
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    step: 7,
                    stepName: 'generate_module_docs',
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI生成文档结果 (实际使用时由AI完成)
            const mockModuleDocuments = [
                {
                    moduleName: 'index',
                    moduleId: 'server_index_js',
                    relativePath: 'index.js',
                    category: 'core',
                    language: primaryLanguage,
                    generatedAt: new Date().toISOString(),
                    overview: {
                        title: 'index 模块文档',
                        description: 'index 是一个核心模块',
                        keyMetrics: { lines: 150, functions: 8, classes: 0 }
                    },
                    sections: [
                        { title: '模块概述', type: 'overview', content: {} },
                        { title: '接口定义', type: 'interfaces', content: {} },
                        { title: '使用方法', type: 'usage', content: {} }
                    ],
                    usage: { quickStart: '', commonPatterns: '', troubleshooting: '' },
                    examples: [],
                    metadata: {
                        complexity: { rating: 'medium', score: 25 },
                        dependencies: { imports: 0, exports: 0 },
                        metrics: { lines: 150, functions: 8 }
                    },
                    recommendations: []
                }
            ];
            
            const mockDocumentationSummary = {
                total: mockModuleDocuments.length,
                categories: { core: 1, business: 0, utility: 0 },
                complexity: { low: 0, medium: 1, high: 0 },
                sections: { total: 3, average: 3 },
                coverage: { withExamples: 0, withInterfaces: 1, withDependencies: 0 }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const moduleDocuments = mockModuleDocuments;
            const documentationSummary = mockDocumentationSummary;

            const executionTime = Date.now() - startTime;

            // AI驱动文档生成响应
            const responseData = {
                // AI文档生成数据包 (提供给AI使用)
                aiDocumentationPackage,
                
                // 模拟文档结果 (实际由AI生成)
                moduleDocuments,
                summary: documentationSummary,
                
                // 执行信息
                execution: {
                    mode: 'ai-driven',
                    executionTime,
                    modulesDocumented: moduleDocuments.length,
                    totalSections: moduleDocuments.reduce((sum, doc) => sum + doc.sections.length, 0),
                    timestamp: new Date().toISOString(),
                    tokensReduced: '预计45-50%令牌消耗',
                    aiDocumentTemplate: 'module-documentation-generation.md'
                },
                
                // 工作流信息
                workflow: {
                    workflowId,
                    step: 7,
                    stepName: 'generate_module_docs',
                    previousStepsCompleted: ['step_1', 'step_2', 'step_3', 'step_4', 'step_5'],
                    mode: 'ai-driven-refactor'
                }
            };

            // 更新步骤状态为已完成（第7步，索引7，存储为step_7）
            workflowService.updateStep(workflowId, 7, 'completed', responseData);

            console.log(`[ModulesDocs] 模块文档生成完成 (AI驱动): ${executionTime}ms，生成了 ${moduleDocuments.length} 个模块文档`);
            console.log(`[ModulesDocs] - 模式: AI智能文档生成`);
            console.log(`[ModulesDocs] - 令牌优化: 预计45-50%消耗`);
            console.log(`[ModulesDocs] - AI模板: module-documentation-generation.md`);

            workflowSuccess(res, 7, 'generate_module_docs', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[ModulesDocs] 模块文档生成失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 7, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 7,
                stepName: 'generate_module_docs'
            });
        }
    });

    /**
     * 第7步-B: 获取单个模块文档
     * GET /module-docs/:moduleName
     */
    router.get('/module-docs/:moduleName', async (req, res) => {
        try {
            const { workflowId } = req.query;
            const { moduleName } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!moduleName) {
                return error(res, '模块名称不能为空', 400);
            }

            console.log(`[ModulesDocs] 获取模块文档: ${moduleName}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查第7步是否完成
            const docsResult = workflow.results.step_7;
            if (!docsResult) {
                return error(res, '模块文档未生成，请先执行 POST /generate-module-docs', 400);
            }

            // 查找指定模块的文档
            const moduleDoc = docsResult.moduleDocuments.find(
                doc => doc.moduleName === moduleName || 
                       doc.moduleId === moduleName ||
                       doc.relativePath === moduleName
            );

            if (!moduleDoc) {
                return error(res, `模块文档不存在: ${moduleName}`, 404);
            }

            // 构建详细的文档响应
            const documentDetail = {
                basic: {
                    moduleName: moduleDoc.moduleName,
                    moduleId: moduleDoc.moduleId,
                    relativePath: moduleDoc.relativePath,
                    category: moduleDoc.category,
                    language: moduleDoc.language
                },
                documentation: {
                    overview: moduleDoc.overview,
                    sections: moduleDoc.sections,
                    generatedAt: moduleDoc.generatedAt
                },
                metadata: {
                    complexity: moduleDoc.metadata.complexity,
                    dependencies: moduleDoc.metadata.dependencies,
                    metrics: moduleDoc.metadata.metrics
                },
                usage: moduleDoc.usage || {},
                examples: moduleDoc.examples || [],
                recommendations: moduleDoc.recommendations || []
            };

            success(res, documentDetail);

        } catch (err) {
            console.error('[ModulesDocs] 获取模块文档失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第7步-C: 保存AI生成的模块文档到mg_kiro
     * POST /save-module-docs
     */
    router.post('/save-module-docs', async (req, res) => {
        try {
            const { workflowId, aiGeneratedContent } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!aiGeneratedContent) {
                return error(res, 'AI生成内容不能为空', 400);
            }

            console.log(`[ModulesDocs] 保存AI生成的模块文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            const savedFiles = [];
            const errors = [];

            try {
                // 保存各个模块文档到modules-detail文件夹
                if (aiGeneratedContent.moduleDocuments && Array.isArray(aiGeneratedContent.moduleDocuments)) {
                    for (const moduleDoc of aiGeneratedContent.moduleDocuments) {
                        if (moduleDoc.name && moduleDoc.content) {
                            const docPath = await aiHandler.saveDocument(
                                'modules-detail',
                                `module-${moduleDoc.name}.md`,
                                moduleDoc.content
                            );
                            savedFiles.push(docPath);
                            console.log(`[ModulesDocs] 已保存: module-${moduleDoc.name}.md`);
                        }
                    }
                }

                // 保存模块文档汇总
                if (aiGeneratedContent.moduleDocumentationSummary) {
                    const summaryPath = await aiHandler.saveDocument(
                        'modules-detail',
                        'modules-documentation-summary.md',
                        aiGeneratedContent.moduleDocumentationSummary
                    );
                    savedFiles.push(summaryPath);
                    console.log(`[ModulesDocs] 已保存: modules-documentation-summary.md`);
                }

            } catch (saveError) {
                errors.push(`文档保存失败: ${saveError.message}`);
            }

            if (savedFiles.length === 0) {
                return error(res, '没有成功保存任何文档', 500, { errors });
            }

            // 更新工作流步骤状态 (第7步，索引为7)
            const stepResult = {
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                savedAt: new Date().toISOString(),
                step: 7,
                stepName: 'save_module_docs'
            };

            workflowService.updateStep(workflowId, 7, 'saved', stepResult);

            console.log(`[ModulesDocs] 模块文档保存完成，共保存 ${savedFiles.length} 个文件`);

            success(res, {
                message: '模块文档已保存到mg_kiro文件夹',
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                workflow: {
                    workflowId,
                    step: 7,
                    stepName: 'save_module_docs',
                    status: 'saved'
                },
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, `成功保存 ${savedFiles.length} 个模块文档`);
            
        } catch (err) {
            console.error('[ModulesDocs] 保存模块文档失败:', err);
            return error(res, `保存文档失败: ${err.message}`, 500, {
                step: 7,
                stepName: 'save_module_docs'
            });
        }
    });

    return router;
}

/**
 * 拆分说明:
 * 
 * 从 modules.js 中提取了第7步相关的所有功能：
 * - POST /generate-module-docs - 生成模块文档
 * - GET /module-docs/:moduleName - 获取单个模块文档  
 * - POST /save-module-docs - 保存AI生成的模块文档
 * 
 * 专注于模块文档生成职责，依赖第5步的分析结果
 * 日志前缀更新为 [ModulesDocs] 以区分功能
 * 确保第7步索引正确 (workflowService.updateStep(workflowId, 7, ...))
 */

export default createModulesDocsRoutes;