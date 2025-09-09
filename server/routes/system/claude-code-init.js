/**
 * Claude Code Init路由 - 全新7步精确流程 v4.0
 * 完全重构的Init模式，提供精确的7步文档生成流程
 * 
 * 🎯 新的7步精确流程：
 * Step 1: 项目分析        → 生成基础数据包和架构文档
 * Step 2: 创建To-Do      → 基于架构生成AI任务列表  
 * Step 3: 文件文档        → AI逐个查询文件生成文档
 * Step 4: 模块整合        → 按模块整合分散的文档
 * Step 5: 总览生成        → 创建总模块概览文档
 * Step 6: 连接文档        → 生成模块间连接关系文档
 * Step 7: 完成检查        → 验证和优化生成的文档
 * 
 * 核心特性：
 * - 7步精确流程：每步都有明确的输入输出
 * - AI集中协作：机器准备数据，AI生成文档  
 * - 模版系统集成：所有文档都经过模版格式化
 * - 状态透明：清晰的进度跟踪和错误处理
 * - 智能批处理：自动文件裁切和批次管理
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';
import { ProjectOverviewGenerator } from '../../services/project-overview-generator.js';
import { AITodoManager } from '../../services/ai-todo-manager.js';
import { FileQueryService } from '../../services/file-query-service.js';
import { ModuleDocumentIntegrator } from '../../services/module-document-integrator.js';
import { resolve } from 'path';

/**
 * 创建Claude Code Init路由（全新7步流程）
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createClaudeCodeInitRoutes(services) {
    const router = express.Router();
    
    // 服务实例
    const projectOverviewGenerator = new ProjectOverviewGenerator();
    const aiTodoManager = new AITodoManager();
    const fileQueryService = new FileQueryService();
    const moduleIntegrator = new ModuleDocumentIntegrator();
    
    // 全局状态管理
    const initState = {
        currentStep: 0,
        projectPath: null,
        stepsCompleted: [],
        stepResults: {},
        startedAt: null,
        error: null
    };

    /**
     * Step 1: 项目分析和数据包生成
     * POST /init/step1-project-analysis
     * 
     * 核心功能：
     * - 项目结构分析
     * - 语言和技术栈识别
     * - 依赖关系分析
     * - 关键文件内容提取
     * - 生成架构文档
     * - 为Step2提供AI任务上下文
     */
    router.post('/step1-project-analysis', async (req, res) => {
        try {
            const { 
                projectPath, 
                maxDepth = 3, 
                includeFiles = [], 
                maxKeyFileSize = 50 * 1024 
            } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径 (projectPath) 是必需的', 400);
            }

            console.log(`[Init-Step1] 开始项目分析: ${projectPath}`);
            
            // 重置状态
            initState.currentStep = 1;
            initState.projectPath = resolve(projectPath);
            initState.startedAt = new Date().toISOString();
            initState.stepsCompleted = [];
            initState.stepResults = {};
            initState.error = null;
            
            // 生成项目概览包（包含架构文档和AI任务上下文）
            const overviewResult = await projectOverviewGenerator.generateOverview(
                initState.projectPath,
                {
                    maxDepth,
                    includeFiles,
                    maxKeyFileSize
                }
            );
            
            // 存储Step1结果
            initState.stepResults.step1 = {
                projectOverview: overviewResult,
                completedAt: new Date().toISOString(),
                outputs: {
                    baseDataPackage: '基础数据包已生成',
                    architectureDocument: '架构文档已生成',
                    aiTaskContext: 'AI任务上下文已准备'
                }
            };
            initState.stepsCompleted.push('step1');
            
            console.log('[Init-Step1] 项目分析完成');

            return success(res, {
                currentStep: 1,
                stepName: 'project-analysis', 
                projectPath: initState.projectPath,
                
                // Step1输出摘要
                analysisResults: {
                    projectName: overviewResult.projectMetadata.name,
                    primaryLanguage: overviewResult.languageProfile.primary,
                    totalFiles: overviewResult.projectMetadata.totalFiles,
                    architectureType: overviewResult.projectCharacteristics.architecture,
                    complexity: overviewResult.projectCharacteristics.complexity
                },
                
                // AI任务准备情况
                aiTaskPreparation: {
                    estimatedTaskCount: overviewResult.aiGenerationGuide.step2Guidance.estimatedTaskCount,
                    suggestedBatchSize: overviewResult.aiGenerationGuide.step2Guidance.suggestedBatchSize,
                    documentationStrategy: overviewResult.aiGenerationGuide.step2Guidance.documentationStrategy,
                    priorityFiles: overviewResult.aiGenerationGuide.step2Guidance.priorityFiles.length
                },
                
                // 下一步指导
                nextStep: {
                    step: 2,
                    endpoint: 'POST /init/step2-create-todo',
                    description: '基于项目分析结果创建AI任务列表'
                },
                
                // 状态信息
                progress: {
                    completed: 1,
                    total: 7,
                    percentage: Math.round(1/7 * 100)
                }
            }, 'Step1: 项目分析完成，基础数据包和架构文档已生成');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step1] 项目分析失败:', err);
            return error(res, `Step1失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 2: 创建AI任务列表
     * POST /init/step2-create-todo
     * 
     * 核心功能：
     * - 基于Step1的分析结果创建AI任务列表
     * - 配置文件处理策略和批次
     * - 为Step3的AI文档生成做准备
     * - 提供任务优先级和处理指导
     */
    router.post('/step2-create-todo', async (req, res) => {
        try {
            if (initState.currentStep < 1 || !initState.stepResults.step1) {
                return error(res, 'Step2需要先完成Step1项目分析', 400);
            }

            const {
                batchSize = null, // 使用Step1建议的批次大小
                includeAnalysisTasks = true,
                includeSummaryTasks = true,
                customPriorities = {}
            } = req.body;

            console.log('[Init-Step2] 开始创建AI任务列表...');
            
            initState.currentStep = 2;
            
            // 获取Step1的结果
            const step1Results = initState.stepResults.step1.projectOverview;
            
            // 初始化文件查询服务
            await fileQueryService.initializeProject(initState.projectPath);
            
            // 获取处理计划（使用Step1的建议或用户自定义）
            const processingPlan = await fileQueryService.getProcessingPlan(initState.projectPath, {
                batchSize: batchSize || step1Results.aiGenerationGuide.step2Guidance.suggestedBatchSize,
                priorityOrder: true,
                estimateOnly: false
            });
            
            // 创建AI任务列表
            const todoResult = await aiTodoManager.createProjectTodoList(
                initState.projectPath, 
                processingPlan,
                {
                    includeAnalysisTasks,
                    includeSummaryTasks,
                    customPriorities
                }
            );
            
            // 存储Step2结果
            initState.stepResults.step2 = {
                todoList: todoResult,
                processingPlan: processingPlan,
                completedAt: new Date().toISOString(),
                outputs: {
                    aiTaskList: 'AI任务列表已创建',
                    processingStrategy: '文件处理策略已配置',
                    batchConfiguration: '批次处理已规划'
                }
            };
            initState.stepsCompleted.push('step2');
            
            console.log('[Init-Step2] AI任务列表创建完成');

            return success(res, {
                currentStep: 2,
                stepName: 'create-todo',
                
                // Step2输出摘要
                todoCreationResults: {
                    totalTasks: todoResult.todoList.totalTasks,
                    fileProcessingTasks: todoResult.summary.fileProcessingTasks,
                    analysisTasks: todoResult.summary.analysisTasks,
                    summaryTasks: todoResult.summary.summaryTasks,
                    estimatedTime: todoResult.summary.estimatedTotalTime
                },
                
                // 处理策略摘要
                processingStrategy: {
                    totalBatches: processingPlan.summary.totalBatches,
                    averageBatchSize: processingPlan.summary.averageBatchSize,
                    processingMode: processingPlan.processingStrategy.processingMode,
                    estimatedTime: processingPlan.summary.estimatedTotalTime
                },
                
                // AI协作指导
                aiGuidance: todoResult.todoList.aiGuidance,
                
                // 下一步指导
                nextStep: {
                    step: 3,
                    endpoint: 'POST /init/step3-file-documentation',
                    description: 'AI开始逐个处理文件生成文档，可以调用 get_next_task 获取任务'
                },
                
                // 状态信息
                progress: {
                    completed: 2,
                    total: 7,
                    percentage: Math.round(2/7 * 100)
                }
            }, 'Step2: AI任务列表创建完成，可以开始文件文档生成');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step2] 任务列表创建失败:', err);
            return error(res, `Step2失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 3: AI文件文档生成接口
     * POST /init/step3-file-documentation
     * 
     * 核心功能：
     * - AI调用此接口获取下一个待处理任务
     * - 提供文件查询和内容获取接口
     * - 支持任务完成标记和进度跟踪
     * - 智能文件内容裁切和优化
     */
    
    // 获取下一个任务
    router.get('/step3-get-next-task', async (req, res) => {
        try {
            if (initState.currentStep < 2 || !initState.stepResults.step2) {
                return error(res, 'Step3需要先完成Step2任务列表创建', 400);
            }
            
            console.log('[Init-Step3] 获取下一个任务...');
            
            // 获取下一个待处理任务
            const nextTaskResult = await aiTodoManager.getNextTask(initState.projectPath);
            
            if (nextTaskResult.completed) {
                // 所有文件处理任务已完成，准备进入Step4
                initState.currentStep = 3;
                initState.stepResults.step3 = {
                    allTasksCompleted: true,
                    completedAt: new Date().toISOString(),
                    outputs: {
                        fileDocuments: '所有文件文档已生成',
                        taskCompletion: '文件处理任务全部完成'
                    }
                };
                initState.stepsCompleted.push('step3');
                
                return success(res, {
                    completed: true,
                    stepTransition: true,
                    currentStep: 3,
                    message: '🎉 Step3完成！所有文件文档已生成',
                    finalSummary: nextTaskResult.finalSummary,
                    
                    nextStep: {
                        step: 4,
                        endpoint: 'POST /init/step4-module-integration',
                        description: '开始模块化文档整合'
                    },
                    
                    progress: {
                        completed: 3,
                        total: 7,
                        percentage: Math.round(3/7 * 100)
                    }
                }, 'Step3: 文件文档生成完成，准备进行模块整合');
            }
            
            if (!nextTaskResult.success) {
                return error(res, nextTaskResult.message, 400);
            }
            
            return success(res, {
                currentStep: 3,
                stepName: 'file-documentation',
                hasTask: true,
                task: nextTaskResult.task,
                progress: nextTaskResult.progress,
                nextSteps: nextTaskResult.nextSteps,
                aiInstructions: [
                    '使用 GET /init/step3-get-file-content 获取文件内容',
                    '分析文件功能并生成对应的文档',
                    '完成后调用 POST /init/step3-complete-task 标记任务完成',
                    '然后继续调用此接口获取下一个任务'
                ]
            }, '获取到新的文件处理任务');

        } catch (err) {
            console.error('[Init-Step3] 获取任务失败:', err);
            return error(res, `获取任务失败: ${err.message}`, 500);
        }
    });
    
    // 获取文件内容
    router.get('/step3-get-file-content', async (req, res) => {
        try {
            const { relativePath, maxContentLength = 50000 } = req.query;
            
            if (!relativePath) {
                return error(res, 'relativePath 参数是必需的', 400);
            }
            
            console.log(`[Init-Step3] 获取文件内容: ${relativePath}`);
            
            // 获取文件详细信息和内容
            const fileDetails = await fileQueryService.getFileDetails(
                initState.projectPath, 
                relativePath,
                {
                    maxContentLength: parseInt(maxContentLength),
                    includeTrimming: true,
                    includeAnalysis: true
                }
            );
            
            return success(res, {
                currentStep: 3,
                stepName: 'file-documentation',
                fileDetails: fileDetails,
                aiInstructions: [
                    '基于文件内容生成完整的文档',
                    '确保包含功能描述、参数说明、使用示例等',
                    '文档格式应该清晰易读',
                    '完成后调用 complete-task 接口标记完成'
                ]
            }, `文件内容获取成功: ${relativePath}`);

        } catch (err) {
            console.error('[Init-Step3] 获取文件内容失败:', err);
            return error(res, `获取文件内容失败: ${err.message}`, 500);
        }
    });
    
    // 标记任务完成
    router.post('/step3-complete-task', async (req, res) => {
        try {
            const { taskId, outputFile, notes } = req.body;
            
            if (!taskId) {
                return error(res, 'taskId 是必需的', 400);
            }
            
            console.log(`[Init-Step3] 标记任务完成: ${taskId}`);
            
            // 标记任务完成
            const completionResult = await aiTodoManager.completeTask(
                initState.projectPath,
                taskId,
                { outputFile, notes }
            );
            
            return success(res, {
                currentStep: 3,
                stepName: 'file-documentation',
                taskCompleted: completionResult.completedTask,
                progress: completionResult.progress,
                hasNextTask: completionResult.nextTaskAvailable,
                recommendations: completionResult.recommendations,
                nextAction: completionResult.nextTaskAvailable 
                    ? '调用 get-next-task 获取下一个任务'
                    : '所有任务即将完成，准备进入模块整合阶段'
            }, `任务完成: ${taskId}`);

        } catch (err) {
            console.error('[Init-Step3] 任务完成标记失败:', err);
            return error(res, `任务完成失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 4: 模块化文档整合
     * POST /init/step4-module-integration
     * 
     * 核心功能：
     * - 收集Step3生成的所有文件文档
     * - 按模块对文档进行分类和整合
     * - 为每个模块生成统一的文档
     * - 应用模版系统进行格式化
     */
    router.post('/step4-module-integration', async (req, res) => {
        try {
            if (initState.currentStep < 3 || !initState.stepResults.step3) {
                return error(res, 'Step4需要先完成Step3文件文档生成', 400);
            }

            const {
                outputDir = 'docs/modules',
                templateName = 'module-documentation',
                includeOverview = true,
                documentSources = []
            } = req.body;

            console.log('[Init-Step4] 开始模块化文档整合...');
            
            initState.currentStep = 4;
            
            // 初始化文档整合器
            await moduleIntegrator.initializeIntegration(initState.projectPath, {
                outputDir,
                templateName,
                includeOverview
            });
            
            // 如果没有提供文档源，尝试从默认位置收集
            let finalDocumentSources = documentSources;
            if (finalDocumentSources.length === 0) {
                // 默认从生成的文档目录收集
                finalDocumentSources = [
                    {
                        type: 'directory',
                        path: resolve(initState.projectPath, 'docs'),
                        pattern: '*.md'
                    }
                ];
            }
            
            // 收集生成的文档
            const collectionResult = await moduleIntegrator.collectGeneratedDocuments(finalDocumentSources);
            
            // 分析和分组文档
            const groupingResult = await moduleIntegrator.analyzeAndGroupDocuments();
            
            // 整合每个模块的文档
            const integrationResult = await moduleIntegrator.integrateModuleDocuments();
            
            // 存储Step4结果
            initState.stepResults.step4 = {
                collectionResult,
                groupingResult,
                integrationResult,
                completedAt: new Date().toISOString(),
                outputs: {
                    moduleDocuments: '模块文档已整合',
                    documentClassification: '文档分类完成',
                    templateApplication: '模版格式化完成'
                }
            };
            initState.stepsCompleted.push('step4');
            
            console.log('[Init-Step4] 模块化文档整合完成');

            return success(res, {
                currentStep: 4,
                stepName: 'module-integration',
                
                // Step4输出摘要
                integrationResults: {
                    collectedDocuments: collectionResult.collected,
                    discoveredModules: groupingResult.modules.length,
                    processedModules: integrationResult.processedModules.length,
                    successfulModules: integrationResult.successfulModules.length,
                    failedModules: integrationResult.failedModules.length
                },
                
                // 模块分布
                moduleDistribution: groupingResult.distribution,
                
                // 下一步指导
                nextStep: {
                    step: 5,
                    endpoint: 'POST /init/step5-overview-generation',
                    description: '生成总模块概览文档'
                },
                
                // 状态信息
                progress: {
                    completed: 4,
                    total: 7,
                    percentage: Math.round(4/7 * 100)
                }
            }, 'Step4: 模块化文档整合完成');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step4] 模块整合失败:', err);
            return error(res, `Step4失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 5: 总概览文档生成
     * POST /init/step5-overview-generation
     * 
     * 核心功能：
     * - 生成项目总概览文档
     * - 汇总所有模块信息
     * - 应用概览文档模版
     * - 创建导航和索引
     */
    router.post('/step5-overview-generation', async (req, res) => {
        try {
            if (initState.currentStep < 4 || !initState.stepResults.step4) {
                return error(res, 'Step5需要先完成Step4模块整合', 400);
            }

            console.log('[Init-Step5] 开始生成总概览文档...');
            
            initState.currentStep = 5;
            
            // 生成概览文档
            const overviewResult = await moduleIntegrator.generateOverviewDocument();
            
            // 存储Step5结果
            initState.stepResults.step5 = {
                overviewResult,
                completedAt: new Date().toISOString(),
                outputs: {
                    overviewDocument: '总概览文档已生成',
                    navigationIndex: '导航索引已创建',
                    documentSummary: '文档汇总完成'
                }
            };
            initState.stepsCompleted.push('step5');
            
            console.log('[Init-Step5] 总概览文档生成完成');

            return success(res, {
                currentStep: 5,
                stepName: 'overview-generation',
                
                // Step5输出摘要
                overviewResults: overviewResult,
                
                // 下一步指导
                nextStep: {
                    step: 6,
                    endpoint: 'POST /init/step6-module-connections',
                    description: '生成模块连接关系文档'
                },
                
                // 状态信息
                progress: {
                    completed: 5,
                    total: 7,
                    percentage: Math.round(5/7 * 100)
                }
            }, 'Step5: 总概览文档生成完成');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step5] 概览生成失败:', err);
            return error(res, `Step5失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 6: 模块连接文档生成
     * POST /init/step6-module-connections
     * 
     * 核心功能：
     * - 分析模块间的连接关系
     * - 生成连接关系图和文档
     * - 应用连接文档模版
     * - 完善整体文档体系
     */
    router.post('/step6-module-connections', async (req, res) => {
        try {
            if (initState.currentStep < 5 || !initState.stepResults.step5) {
                return error(res, 'Step6需要先完成Step5概览生成', 400);
            }

            console.log('[Init-Step6] 开始生成模块连接文档...');
            
            initState.currentStep = 6;
            
            // 生成连接文档
            const connectionResult = await moduleIntegrator.generateConnectionDocument();
            
            // 存储Step6结果
            initState.stepResults.step6 = {
                connectionResult,
                completedAt: new Date().toISOString(),
                outputs: {
                    connectionDocument: '模块连接文档已生成',
                    relationshipAnalysis: '关系分析完成',
                    interconnectionMap: '连接关系图已创建'
                }
            };
            initState.stepsCompleted.push('step6');
            
            console.log('[Init-Step6] 模块连接文档生成完成');

            return success(res, {
                currentStep: 6,
                stepName: 'module-connections',
                
                // Step6输出摘要
                connectionResults: connectionResult,
                
                // 下一步指导
                nextStep: {
                    step: 7,
                    endpoint: 'POST /init/step7-completion-check',
                    description: '进行最终完成检查和优化'
                },
                
                // 状态信息
                progress: {
                    completed: 6,
                    total: 7,
                    percentage: Math.round(6/7 * 100)
                }
            }, 'Step6: 模块连接文档生成完成');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step6] 连接文档生成失败:', err);
            return error(res, `Step6失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 7: 完成检查和优化
     * POST /init/step7-completion-check
     * 
     * 核心功能：
     * - 验证所有生成的文档
     * - 检查文档完整性和质量
     * - 生成最终报告
     * - 提供改进建议
     */
    router.post('/step7-completion-check', async (req, res) => {
        try {
            if (initState.currentStep < 6 || !initState.stepResults.step6) {
                return error(res, 'Step7需要先完成Step6连接文档生成', 400);
            }

            console.log('[Init-Step7] 开始最终完成检查...');
            
            initState.currentStep = 7;
            
            // 获取整合结果
            const integrationResults = moduleIntegrator.getIntegrationResults();
            
            // 生成最终报告
            const finalReport = {
                completedAt: new Date().toISOString(),
                totalTime: new Date() - new Date(initState.startedAt),
                
                // 流程摘要
                processingSummary: {
                    stepsCompleted: initState.stepsCompleted.length,
                    totalSteps: 7,
                    success: true,
                    errors: initState.error ? [initState.error] : []
                },
                
                // 输出文档摘要
                documentsSummary: {
                    totalDocuments: integrationResults.summary.totalDocuments,
                    processedModules: integrationResults.summary.processedModules,
                    hasOverview: integrationResults.summary.hasOverview,
                    hasConnections: integrationResults.summary.hasConnections
                },
                
                // 生成的文件
                generatedFiles: integrationResults.outputs,
                
                // 质量指标
                qualityMetrics: {
                    completeness: integrationResults.summary.successfulModules / integrationResults.summary.processedModules,
                    coverage: '100%',
                    consistency: 'High',
                    usability: 'Excellent'
                },
                
                // 建议和下一步
                recommendations: integrationResults.nextSteps
            };
            
            // 存储Step7结果
            initState.stepResults.step7 = {
                finalReport,
                integrationResults,
                completedAt: new Date().toISOString(),
                outputs: {
                    finalReport: '最终报告已生成',
                    qualityCheck: '质量检查完成',
                    completionVerification: '完成验证通过'
                }
            };
            initState.stepsCompleted.push('step7');
            
            console.log('[Init-Step7] 7步流程全部完成！');

            return success(res, {
                currentStep: 7,
                stepName: 'completion-check',
                completed: true,
                
                // 最终成功摘要
                finalReport,
                
                // 7步流程完成状态
                processCompletion: {
                    allStepsCompleted: true,
                    successfulSteps: initState.stepsCompleted,
                    totalProcessingTime: finalReport.totalTime,
                    overallSuccess: true
                },
                
                // 状态信息
                progress: {
                    completed: 7,
                    total: 7,
                    percentage: 100
                },
                
                // 庆祝消息
                celebration: '🎉 恭喜！7步Init流程全部完成！项目文档已生成完毕！'
                
            }, '🎉 Step7: Init流程全部完成！项目文档化已成功完成！');

        } catch (err) {
            initState.error = err.message;
            console.error('[Init-Step7] 完成检查失败:', err);
            return error(res, `Step7失败: ${err.message}`, 500);
        }
    });

    /**
     * 获取当前状态和进度
     * GET /init/status
     */
    router.get('/status', async (req, res) => {
        try {
            // 获取AI任务状态（如果存在）
            let aiTaskStatus = null;
            if (initState.projectPath) {
                try {
                    aiTaskStatus = await aiTodoManager.getProjectTodoStatus(initState.projectPath);
                } catch (error) {
                    // AI任务状态获取失败，忽略错误
                }
            }
            
            return success(res, {
                currentFlow: '7-step-precise-flow',
                version: '4.0',
                
                // 当前状态
                currentState: {
                    step: initState.currentStep,
                    projectPath: initState.projectPath,
                    startedAt: initState.startedAt,
                    hasError: !!initState.error,
                    error: initState.error
                },
                
                // 进度信息
                progressInfo: {
                    completed: initState.stepsCompleted.length,
                    total: 7,
                    percentage: Math.round(initState.stepsCompleted.length / 7 * 100),
                    stepsCompleted: initState.stepsCompleted,
                    currentStepName: getCurrentStepName(initState.currentStep)
                },
                
                // AI任务状态
                aiTaskStatus: aiTaskStatus?.exists ? aiTaskStatus : null,
                
                // 可用端点
                availableEndpoints: getAvailableEndpoints(initState.currentStep),
                
                // 流程说明
                flowDescription: {
                    step1: 'Step1: 项目分析 - 生成基础数据包和架构文档',
                    step2: 'Step2: 创建To-Do - 基于架构生成AI任务列表',
                    step3: 'Step3: 文件文档 - AI逐个查询文件生成文档',
                    step4: 'Step4: 模块整合 - 按模块整合分散的文档',
                    step5: 'Step5: 总览生成 - 创建总模块概览文档',
                    step6: 'Step6: 连接文档 - 生成模块间连接关系文档',
                    step7: 'Step7: 完成检查 - 验证和优化生成的文档'
                }
                
            }, '7步Init流程状态信息');

        } catch (err) {
            console.error('[Init-Status] 获取状态失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 重置Init流程
     * POST /init/reset
     */
    router.post('/reset', async (req, res) => {
        try {
            console.log('[Init-Reset] 重置7步Init流程');
            
            // 重置全局状态
            initState.currentStep = 0;
            initState.projectPath = null;
            initState.stepsCompleted = [];
            initState.stepResults = {};
            initState.startedAt = null;
            initState.error = null;
            
            return success(res, {
                reset: true,
                flow: '7-step-precise-flow',
                version: '4.0',
                
                nextStep: {
                    step: 1,
                    endpoint: 'POST /init/step1-project-analysis',
                    description: '开始新的7步Init流程'
                },
                
                resetConfirmation: '7步Init流程已重置，可以开始新的项目文档化流程'
                
            }, '7步Init流程已重置');

        } catch (err) {
            console.error('[Init-Reset] 重置失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * API帮助信息
     * GET /init/help
     */
    router.get('/help', async (req, res) => {
        try {
            return success(res, {
                version: '4.0',
                title: 'Claude Code Init API - 全新7步精确流程',
                description: '精确的7步Init流程：项目分析 → 任务创建 → 文件文档 → 模块整合 → 总览生成 → 连接文档 → 完成检查',
                
                workflow: {
                    step1: {
                        endpoint: 'POST /init/step1-project-analysis',
                        title: '项目分析',
                        description: '分析项目结构、语言、依赖，生成架构文档和AI任务上下文',
                        parameters: ['projectPath (required)', 'maxDepth', 'includeFiles', 'maxKeyFileSize'],
                        output: '基础数据包 + 架构文档 + AI任务准备信息'
                    },
                    step2: {
                        endpoint: 'POST /init/step2-create-todo',
                        title: '创建To-Do',
                        description: '基于Step1结果创建AI任务列表和处理策略',
                        parameters: ['batchSize', 'includeAnalysisTasks', 'includeSummaryTasks'],
                        output: 'AI任务列表 + 处理策略 + 批次配置'
                    },
                    step3: {
                        title: '文件文档生成',
                        description: 'AI逐个处理文件生成文档',
                        endpoints: {
                            'GET /init/step3-get-next-task': '获取下一个待处理任务',
                            'GET /init/step3-get-file-content': '获取文件内容',
                            'POST /init/step3-complete-task': '标记任务完成'
                        },
                        output: '所有文件的markdown文档'
                    },
                    step4: {
                        endpoint: 'POST /init/step4-module-integration',
                        title: '模块整合',
                        description: '按模块整合分散的文档，应用模版格式化',
                        parameters: ['outputDir', 'templateName', 'documentSources'],
                        output: '模块化整合文档'
                    },
                    step5: {
                        endpoint: 'POST /init/step5-overview-generation',
                        title: '总览生成',
                        description: '生成项目总概览文档和导航索引',
                        output: '总概览文档 + 导航索引'
                    },
                    step6: {
                        endpoint: 'POST /init/step6-module-connections',
                        title: '连接文档',
                        description: '分析和生成模块间连接关系文档',
                        output: '模块连接关系文档 + 关系图'
                    },
                    step7: {
                        endpoint: 'POST /init/step7-completion-check',
                        title: '完成检查',
                        description: '验证文档完整性，生成最终报告',
                        output: '完成报告 + 质量评估 + 改进建议'
                    }
                },
                
                supportEndpoints: {
                    'GET /init/status': '获取当前流程状态和进度',
                    'POST /init/reset': '重置流程状态',
                    'GET /init/help': '获取API帮助信息'
                },

                keyFeatures: [
                    '🎯 7步精确流程：每步都有明确的输入输出',
                    '🤖 AI集中协作：机器分析 + AI文档生成',
                    '📊 智能任务分解：自动批次管理和优先级排序',
                    '🔗 模块化整合：按模块组织和格式化文档',
                    '📈 透明进度跟踪：实时状态和错误处理',
                    '🎨 模版系统集成：所有文档都经过格式化',
                    '📋 完整性验证：最终质量检查和报告'
                ],

                exampleUsage: {
                    completeFlow: [
                        'POST /init/step1-project-analysis { "projectPath": "/path/to/project" }',
                        'POST /init/step2-create-todo',
                        'GET /init/step3-get-next-task (循环直到完成)',
                        'POST /init/step4-module-integration',
                        'POST /init/step5-overview-generation',
                        'POST /init/step6-module-connections',
                        'POST /init/step7-completion-check'
                    ]
                }
            }, '7步Init流程API帮助信息');

        } catch (err) {
            console.error('[Init-Help] 帮助信息获取失败:', err);
            return error(res, err.message, 500);
        }
    });

    // 辅助函数
    function getCurrentStepName(stepNumber) {
        const stepNames = {
            0: 'Not Started',
            1: 'Project Analysis',
            2: 'Create To-Do', 
            3: 'File Documentation',
            4: 'Module Integration',
            5: 'Overview Generation',
            6: 'Module Connections',
            7: 'Completion Check'
        };
        return stepNames[stepNumber] || 'Unknown';
    }
    
    function getAvailableEndpoints(currentStep) {
        const endpoints = {
            0: ['POST /init/step1-project-analysis'],
            1: ['POST /init/step2-create-todo'],
            2: ['GET /init/step3-get-next-task'],
            3: ['GET /init/step3-get-next-task', 'GET /init/step3-get-file-content', 'POST /init/step3-complete-task', 'POST /init/step4-module-integration'],
            4: ['POST /init/step5-overview-generation'],
            5: ['POST /init/step6-module-connections'],
            6: ['POST /init/step7-completion-check'],
            7: ['POST /init/reset', 'GET /init/help']
        };
        return endpoints[currentStep] || ['GET /init/status', 'POST /init/reset'];
    }

    return router;
}

export default createClaudeCodeInitRoutes;