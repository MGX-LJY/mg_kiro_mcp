/**
 * Init模式 - 第4步：生成基础架构文档路由模块
 * 系统架构和模块目录文档生成端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { AIResponseHandlerService } from '../../services/ai-response-handler.js';

/**
 * 创建文档生成路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDocumentsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 第4步-A: 基于语言生成system-architecture.md
     * POST /generate-architecture
     */
    router.post('/generate-architecture', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Documents] 开始生成系统架构文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 验证前置步骤完成状态
            const structureResult = workflow.results.step_1;
            const languageResult = workflow.results.step_2;
            const filesResult = workflow.results.step_3;

            if (!structureResult) {
                return error(res, '项目结构扫描结果不存在，请先执行 POST /scan-structure', 400);
            }

            if (!languageResult) {
                return error(res, '语言检测结果不存在，请先执行 POST /detect-language', 400);
            }

            if (!filesResult) {
                return error(res, '文件内容分析结果不存在，请先执行 POST /scan-files', 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 4, 'running');

            // 提供原始数据给AI分析
            const rawAnalysisData = {
                structureData: structureResult,
                languageData: languageResult,
                filesData: filesResult,
                projectPath: workflow.projectPath,
                projectName: structureResult.projectPath.split('/').pop()
            };

            // 通过统一模板服务获取AI分析模板
            const analysisTemplate = await services.unifiedTemplateService.getTemplateByContext({
                projectPath: workflow.projectPath,
                mode: 'analyze',
                step: 'analyze_architecture',
                templateType: 'system-architecture-analysis',
                language: languageResult.detection.primaryLanguage
            }, {
                category: 'analysis-templates',
                name: 'system-architecture-analysis'
            });

            // 通过统一模板服务获取文档生成模板
            const documentTemplate = await services.unifiedTemplateService.getTemplateByContext({
                projectPath: workflow.projectPath,
                mode: 'create',
                step: 'generate_architecture', 
                templateType: 'system-architecture-generation',
                language: languageResult.detection.primaryLanguage
            }, {
                category: 'document-templates',
                name: 'system-architecture-generation'
            });

            // 构建AI驱动的分析数据包
            const aiAnalysisPackage = {
                rawData: rawAnalysisData,
                analysisTemplate: {
                    content: analysisTemplate.template.content,
                    intelligence: analysisTemplate.intelligence,
                    instructions: "使用此模板对项目数据进行系统架构分析"
                },
                documentTemplate: {
                    content: documentTemplate.template.content,
                    intelligence: documentTemplate.intelligence,
                    instructions: "基于分析结果生成系统架构文档"
                },
                processingInstructions: {
                    mode: "ai-driven-analysis",
                    steps: [
                        "1. 使用analysisTemplate分析rawData",
                        "2. 基于分析结果使用documentTemplate生成文档"
                    ],
                    expectedOutput: "完整的system-architecture.md文档内容"
                }
            };

            const executionTime = Date.now() - startTime;

            // 构建AI驱动的响应数据
            const responseData = {
                ...aiAnalysisPackage,
                generation: {
                    executionTime,
                    analysisMode: 'ai-driven',
                    dataProvider: 'mcp-server',
                    aiCapabilities: ['system-analysis', 'architecture-design', 'document-generation'],
                    language: languageResult.detection.primaryLanguage,
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 4,
                    stepName: 'generate_architecture',
                    previousStepsCompleted: ['scan_structure', 'detect_language', 'scan_files']
                },
                metadata: {
                    templateFiles: ['system-architecture-analysis.md', 'system-architecture-generation.md'],
                    tokenOptimization: 'enabled',
                    analysisComplexity: 'high'
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 4, 'completed', responseData);

            console.log(`[Documents] 系统架构文档生成完成: ${executionTime}ms`);

            workflowSuccess(res, 4, 'generate_architecture', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Documents] 生成系统架构文档失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 4, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 4,
                stepName: 'generate_architecture'
            });
        }
    });

    /**
     * 第4步-B: 基于扫描结果生成modules-catalog.md
     * POST /generate-catalog
     */
    router.post('/generate-catalog', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Documents] 开始生成模块目录文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 验证前置步骤完成状态
            const structureResult = workflow.results.step_1;
            const languageResult = workflow.results.step_2;
            const filesResult = workflow.results.step_3;

            if (!structureResult || !languageResult || !filesResult) {
                return error(res, '前置分析步骤未完成，请先完成前3步工作流', 400);
            }

            const startTime = Date.now();

            // 提供原始模块数据给AI分析
            const rawModuleData = {
                files: filesResult.files,
                dependencies: filesResult.dependencies,
                qualityIndicators: filesResult.overview.qualityIndicators,
                importance: filesResult.importance,
                projectInfo: {
                    name: structureResult.projectPath.split('/').pop(),
                    language: languageResult.detection.primaryLanguage,
                    path: structureResult.projectPath
                },
                analysisTimestamp: new Date().toISOString()
            };

            // 通过统一模板服务获取模块目录分析和生成模板
            const moduleAnalysisTemplate = await services.unifiedTemplateService.getTemplateByContext({
                projectPath: workflow.projectPath,
                mode: 'analyze',
                step: 'analyze_modules',
                templateType: 'modules-catalog-analysis',
                language: languageResult.detection.primaryLanguage
            }, {
                category: 'analysis-templates', 
                name: 'modules-catalog-analysis'
            });

            const catalogTemplate = await services.unifiedTemplateService.getTemplateByContext({
                projectPath: workflow.projectPath,
                mode: 'create',
                step: 'generate_catalog',
                templateType: 'modules-catalog-generation',
                language: languageResult.detection.primaryLanguage
            }, {
                category: 'document-templates',
                name: 'modules-catalog-generation'
            });

            // 构建AI驱动的模块分析包
            const aiModulePackage = {
                rawData: rawModuleData,
                analysisTemplate: {
                    content: moduleAnalysisTemplate.template.content,
                    intelligence: moduleAnalysisTemplate.intelligence,
                    instructions: "分析项目模块结构和依赖关系"
                },
                documentTemplate: {
                    content: catalogTemplate.template.content,
                    intelligence: catalogTemplate.intelligence,
                    instructions: "生成模块目录文档"
                },
                processingGuidance: {
                    focus: ['module-categorization', 'dependency-mapping', 'quality-assessment'],
                    outputFormat: 'modules-catalog.md'
                }
            };

            const executionTime = Date.now() - startTime;

            // 构建AI驱动的响应数据
            const responseData = {
                ...aiModulePackage,
                generation: {
                    executionTime,
                    analysisMode: 'ai-driven',
                    dataProvider: 'mcp-server',
                    modulesAnalyzed: filesResult.files.length,
                    aiCapabilities: ['module-categorization', 'dependency-analysis', 'quality-metrics'],
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 4,
                    stepName: 'generate_catalog',
                    previousStepsCompleted: ['scan_structure', 'detect_language', 'scan_files']
                },
                metadata: {
                    templateFiles: ['modules-catalog-analysis.md', 'modules-catalog-generation.md'],
                    tokenOptimization: 'enabled',
                    complexityLevel: 'medium'
                }
            };

            console.log(`[Documents] 模块目录文档生成完成: ${executionTime}ms`);

            workflowSuccess(res, 4, 'generate_catalog', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Documents] 生成模块目录文档失败:', err);
            error(res, err.message, 500, {
                step: 4,
                stepName: 'generate_catalog'
            });
        }
    });

    /**
     * 第4步-C: 保存AI生成的架构文档到mg_kiro
     * POST /save-architecture
     */
    router.post('/save-architecture', async (req, res) => {
        try {
            const { workflowId, aiGeneratedContent } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!aiGeneratedContent) {
                return error(res, 'AI生成内容不能为空', 400);
            }

            console.log(`[Documents] 保存AI生成的架构文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            const savedFiles = [];
            const errors = [];

            try {
                // 保存system-architecture.md
                if (aiGeneratedContent.architecture) {
                    const archPath = await aiHandler.saveDocument(
                        'architecture',
                        'system-architecture.md',
                        aiGeneratedContent.architecture
                    );
                    savedFiles.push(archPath);
                    console.log(`[Documents] 已保存: system-architecture.md`);
                }

                // 保存tech-stack.md
                if (aiGeneratedContent.techStack) {
                    const techPath = await aiHandler.saveDocument(
                        'architecture',
                        'tech-stack.md',
                        aiGeneratedContent.techStack
                    );
                    savedFiles.push(techPath);
                    console.log(`[Documents] 已保存: tech-stack.md`);
                }

                // 保存modules-catalog.md (如果在此步骤生成)
                if (aiGeneratedContent.catalog) {
                    const catalogPath = await aiHandler.saveDocument(
                        'modules-catalog',
                        'modules-catalog.md',
                        aiGeneratedContent.catalog
                    );
                    savedFiles.push(catalogPath);
                    console.log(`[Documents] 已保存: modules-catalog.md`);
                }

            } catch (saveError) {
                errors.push(`文档保存失败: ${saveError.message}`);
            }

            if (savedFiles.length === 0) {
                return error(res, '没有成功保存任何文档', 500, { errors });
            }

            // 更新工作流步骤状态
            const stepResult = {
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                savedAt: new Date().toISOString(),
                step: 4,
                stepName: 'save_architecture_docs'
            };

            workflowService.updateStep(workflowId, 4, 'saved', stepResult);

            console.log(`[Documents] 架构文档保存完成，共保存 ${savedFiles.length} 个文件`);

            success(res, {
                message: '架构文档已保存到mg_kiro文件夹',
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                workflow: {
                    workflowId,
                    step: 4,
                    stepName: 'save_architecture_docs',
                    status: 'saved'
                },
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, `成功保存 ${savedFiles.length} 个架构文档`);
            
        } catch (err) {
            console.error('[Documents] 保存架构文档失败:', err);
            return error(res, `保存文档失败: ${err.message}`, 500, {
                step: 4,
                stepName: 'save_architecture_docs'
            });
        }
    });

    /**
     * 第4步-D: 批量处理AI数据包并保存文档
     * POST /process-ai-package
     */
    router.post('/process-ai-package', async (req, res) => {
        try {
            const { workflowId, stepIndex, aiGeneratedContent } = req.body;
            
            if (!workflowId || stepIndex === undefined || !aiGeneratedContent) {
                return error(res, '缺少必要参数: workflowId, stepIndex, aiGeneratedContent', 400);
            }

            console.log(`[Documents] 处理AI数据包: ${workflowId}, 步骤: ${stepIndex}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            // 构建AI数据包
            const aiPackage = {
                workflowId,
                stepIndex,
                aiGeneratedContent,
                processingInstructions: {
                    expectedOutput: 'markdown',
                    saveToMgKiro: true,
                    category: stepIndex === 4 ? 'architecture' : 'modules-catalog'
                }
            };

            // 处理AI数据包
            const result = await aiHandler.processAIPackage(aiPackage);

            console.log(`[Documents] AI数据包处理完成，保存了 ${result.savedFiles.length} 个文件`);

            workflowSuccess(res, stepIndex, 'process_ai_package', workflowId, {
                ...result,
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Documents] 处理AI数据包失败:', err);
            return error(res, `处理AI数据包失败: ${err.message}`, 500, {
                step: req.body.stepIndex || 4,
                stepName: 'process_ai_package'
            });
        }
    });

    return router;
}

export default createDocumentsRoutes;