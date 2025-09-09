/**
 * Claude Code Init路由 - 重构版本 v3.0
 * 简化的6步流程，集成提示词管理系统
 * 
 * 🎯 新的6步简化流程：
 * Step 1: 项目分析        → 生成基础数据包和架构文档
 * Step 2: 创建To-Do      → 基于架构生成AI任务列表  
 * Step 3: 文件文档        → AI逐个查询文件生成文档 (生成到mg_kiro/)
 * Step 4: 模块整合        → 通过提示词系统提供整合指导
 * Step 5: 总览生成        → 通过提示词系统提供概览指导
 * Step 6: 连接文档        → 通过提示词系统提供连接指导
 * 
 * 核心特性：
 * - 6步简化流程：每步都有明确的输入输出
 * - AI集中协作：机器准备数据，AI生成文档  
 * - 提示词集成：Step4-6通过提示词管理系统提供指导
 * - 统一进度管理：通过step3-complete-task管理全局进度
 * - 自动文档生成：文件内容生成markdown到mg_kiro文件夹
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { success, error } from '../../services/response-service.js';
import { ProjectOverviewGenerator } from '../../services/project-overview-generator.js';
import { AITodoManager } from '../../services/ai-todo-manager.js';
import { FileQueryService } from '../../services/file-query-service.js';
import { resolve } from 'path';

/**
 * 创建Claude Code Init路由（重构版本）
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createClaudeCodeInitRoutes(services) {
    const router = express.Router();
    
    // 服务实例
    const projectOverviewGenerator = new ProjectOverviewGenerator();
    const aiTodoManager = new AITodoManager();
    const fileQueryService = new FileQueryService();
    
    // 全局状态管理 - 改为项目隔离状态
    const projectStates = new Map();
    
    // 获取或创建项目状态
    function getProjectState(projectPath) {
        const normalizedPath = resolve(projectPath);
        if (!projectStates.has(normalizedPath)) {
            projectStates.set(normalizedPath, {
                currentStep: 0,
                projectPath: normalizedPath,
                stepsCompleted: [],
                stepResults: {},
                startedAt: null,
                error: null,
                documentCount: 0,
                generatedDocs: []
            });
        }
        return projectStates.get(normalizedPath);
    }
    
    // 确保mg_kiro文档目录存在
    function ensureDocsDirectory(projectPath) {
        const docsDir = path.join(projectPath, 'mg_kiro');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        return docsDir;
    }

    /**
     * Step 1: 项目分析和数据包生成
     * POST /init/step1-project-analysis
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
            
            // 获取项目状态
            const initState = getProjectState(projectPath);
            
            // 重置状态
            initState.currentStep = 1;
            initState.startedAt = new Date().toISOString();
            initState.stepsCompleted = [];
            initState.stepResults = {};
            initState.error = null;
            initState.documentCount = 0;
            initState.generatedDocs = [];
            
            // 确保文档目录存在
            const docsDir = ensureDocsDirectory(initState.projectPath);
            
            // 生成项目概览包
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
                docsDirectory: docsDir,
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
                docsDirectory: docsDir,
                
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
                    documentationStrategy: overviewResult.aiGenerationGuide.step2Guidance.documentationStrategy
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
                    total: 6,
                    percentage: Math.round(1/6 * 100)
                }
            }, 'Step1: 项目分析完成，基础数据包和架构文档已生成');

        } catch (err) {
            const initState = getProjectState(req.body.projectPath || '');
            initState.error = err.message;
            console.error('[Init-Step1] 项目分析失败:', err);
            return error(res, `Step1失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 2: 创建AI任务列表
     * POST /init/step2-create-todo
     */
    router.post('/step2-create-todo', async (req, res) => {
        try {
            const { projectPath } = req.body;
            const initState = getProjectState(projectPath || '');
            
            if (initState.currentStep < 1 || !initState.stepResults.step1) {
                return error(res, 'Step2需要先完成Step1项目分析', 400);
            }

            const {
                batchSize = null,
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
            
            // 获取处理计划
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
                    processingMode: processingPlan.processingStrategy.processingMode
                },
                
                // 下一步指导
                nextStep: {
                    step: 3,
                    endpoint: 'POST /init/step3-file-documentation',
                    description: 'AI开始逐个处理文件生成文档'
                },
                
                // 状态信息
                progress: {
                    completed: 2,
                    total: 6,
                    percentage: Math.round(2/6 * 100)
                }
            }, 'Step2: AI任务列表创建完成，可以开始文件文档生成');

        } catch (err) {
            const initState = getProjectState(req.body.projectPath || '');
            initState.error = err.message;
            console.error('[Init-Step2] 任务列表创建失败:', err);
            return error(res, `Step2失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 3: AI文件文档生成接口
     */
    
    // 获取下一个任务
    router.get('/step3-get-next-task', async (req, res) => {
        try {
            const { projectPath } = req.query;
            const initState = getProjectState(projectPath || '');
            
            if (initState.currentStep < 2 || !initState.stepResults.step2) {
                return error(res, 'Step3需要先完成Step2任务列表创建', 400);
            }
            
            console.log('[Init-Step3] 获取下一个任务...');
            
            // 获取下一个待处理任务
            const nextTaskResult = await aiTodoManager.getNextTask(initState.projectPath);
            
            if (nextTaskResult.completed) {
                // 所有文件处理任务已完成
                initState.currentStep = 3;
                initState.stepResults.step3 = {
                    allTasksCompleted: true,
                    completedAt: new Date().toISOString(),
                    totalDocuments: initState.documentCount,
                    generatedDocs: initState.generatedDocs,
                    outputs: {
                        fileDocuments: `生成了${initState.documentCount}个文件文档`,
                        taskCompletion: '文件处理任务全部完成'
                    }
                };
                initState.stepsCompleted.push('step3');
                
                return success(res, {
                    completed: true,
                    stepTransition: true,
                    currentStep: 3,
                    message: '🎉 Step3完成！所有文件文档已生成',
                    finalSummary: {
                        totalDocuments: initState.documentCount,
                        generatedDocs: initState.generatedDocs,
                        docsLocation: path.join(initState.projectPath, 'mg_kiro')
                    },
                    
                    nextStep: {
                        step: 4,
                        endpoint: 'POST /init/step4-module-integration',
                        description: '获取模块整合提示词指导'
                    },
                    
                    progress: {
                        completed: 3,
                        total: 6,
                        percentage: Math.round(3/6 * 100)
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
    
    // 获取文件内容并自动生成markdown文档
    router.get('/step3-get-file-content', async (req, res) => {
        try {
            const { projectPath, relativePath, maxContentLength = 50000 } = req.query;
            const initState = getProjectState(projectPath || '');
            
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
            
            // 自动生成markdown文档到mg_kiro文件夹
            const docsDir = path.join(initState.projectPath, 'mg_kiro');
            const fileName = path.basename(relativePath, path.extname(relativePath));
            const docFileName = `${fileName}_analysis.md`;
            const docPath = path.join(docsDir, docFileName);
            
            // 生成文档内容
            const markdownContent = generateFileDocumentation(fileDetails, relativePath);
            
            // 保存文档
            fs.writeFileSync(docPath, markdownContent, 'utf8');
            
            // 更新状态
            initState.documentCount++;
            initState.generatedDocs.push({
                originalFile: relativePath,
                documentFile: docFileName,
                documentPath: docPath,
                generatedAt: new Date().toISOString()
            });
            
            console.log(`[Init-Step3] 已生成文档: ${docFileName}`);
            
            return success(res, {
                currentStep: 3,
                stepName: 'file-documentation',
                fileDetails: fileDetails,
                documentGenerated: {
                    fileName: docFileName,
                    path: docPath,
                    location: `mg_kiro/${docFileName}`
                },
                aiInstructions: [
                    '文档已自动生成到 mg_kiro/ 文件夹',
                    '基于文件内容分析功能并完善文档',
                    '完成分析后调用 complete-task 接口标记完成'
                ]
            }, `文件内容获取成功，文档已生成: ${docFileName}`);

        } catch (err) {
            console.error('[Init-Step3] 获取文件内容失败:', err);
            return error(res, `获取文件内容失败: ${err.message}`, 500);
        }
    });
    
    // 标记任务完成（统一进度管理）
    router.post('/step3-complete-task', async (req, res) => {
        try {
            const { projectPath, taskId, step, notes } = req.body;
            const initState = getProjectState(projectPath || '');
            
            if (!taskId) {
                return error(res, 'taskId 是必需的', 400);
            }
            
            console.log(`[Init-Step3] 标记任务完成: ${taskId}, 步骤: ${step || 'file-processing'}`);
            
            // 标记任务完成
            const completionResult = await aiTodoManager.completeTask(
                initState.projectPath,
                taskId,
                { notes, step: step || 'file-processing' }
            );
            
            // 如果是step4-6的任务，更新相应状态
            if (step && ['module-integration', 'overview-generation', 'module-connections'].includes(step)) {
                const stepMap = {
                    'module-integration': 4,
                    'overview-generation': 5, 
                    'module-connections': 6
                };
                
                const stepNumber = stepMap[step];
                if (stepNumber && !initState.stepsCompleted.includes(`step${stepNumber}`)) {
                    initState.stepsCompleted.push(`step${stepNumber}`);
                    initState.currentStep = Math.max(initState.currentStep, stepNumber);
                    
                    initState.stepResults[`step${stepNumber}`] = {
                        completedAt: new Date().toISOString(),
                        taskId: taskId,
                        notes: notes,
                        stepName: step
                    };
                }
            }
            
            // 检查是否所有步骤完成（Step1-6）
            const isAllCompleted = initState.stepsCompleted.includes('step6') || 
                                 (initState.stepsCompleted.length >= 3 && 
                                  initState.stepsCompleted.includes('step3'));
            
            return success(res, {
                currentStep: initState.currentStep,
                stepName: step || 'file-documentation',
                taskCompleted: completionResult.completedTask,
                progress: {
                    ...completionResult.progress,
                    documentsGenerated: initState.documentCount,
                    stepsCompleted: initState.stepsCompleted,
                    totalSteps: 6,
                    overallProgress: Math.round(initState.stepsCompleted.length / 6 * 100)
                },
                hasNextTask: completionResult.nextTaskAvailable && !isAllCompleted,
                allStepsCompleted: isAllCompleted,
                nextAction: isAllCompleted 
                    ? '🎉 所有步骤已完成！Init流程结束'
                    : completionResult.nextTaskAvailable 
                        ? '调用 get-next-task 获取下一个任务'
                        : '可以开始Step4-6的提示词指导流程'
            }, `任务完成: ${taskId}`);

        } catch (err) {
            console.error('[Init-Step3] 任务完成标记失败:', err);
            return error(res, `任务完成失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 4: 模块整合提示词 (简化版)
     * POST /init/step4-module-integration
     */
    router.post('/step4-module-integration', async (req, res) => {
        try {
            const { projectPath } = req.body;
            const initState = getProjectState(projectPath || '');
            
            if (initState.currentStep < 3 || !initState.stepResults.step3) {
                return error(res, 'Step4需要先完成Step3文件文档生成', 400);
            }

            console.log('[Init-Step4] 提供模块整合提示词指导...');
            
            // 通过提示词管理系统获取整合提示词
            const integrationPrompt = generateModuleIntegrationPrompt(initState);
            
            return success(res, {
                currentStep: 4,
                stepName: 'module-integration',
                promptType: 'module-integration-guidance',
                
                // 提示词内容
                prompt: integrationPrompt,
                
                // 指导信息
                guidance: {
                    task: '基于生成的文件文档进行模块化整合',
                    location: `${initState.projectPath}/mg_kiro/`,
                    documentsCount: initState.documentCount,
                    expectedOutput: '模块级别的整合文档',
                    nextStep: 'complete-task with step=module-integration'
                },
                
                // AI指令
                aiInstructions: [
                    '1. 分析mg_kiro/文件夹中的所有文档',
                    '2. 按模块分类整合相关文档',
                    '3. 生成模块级别的整合文档',
                    '4. 调用 POST /init/step3-complete-task 标记完成',
                    '   参数: { step: "module-integration" }'
                ],
                
                progress: {
                    completed: 4,
                    total: 6,
                    percentage: Math.round(4/6 * 100)
                }
            }, 'Step4: 模块整合提示词已提供');

        } catch (err) {
            console.error('[Init-Step4] 模块整合提示词失败:', err);
            return error(res, `Step4失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 5: 总览生成提示词 (简化版)
     * POST /init/step5-overview-generation
     */
    router.post('/step5-overview-generation', async (req, res) => {
        try {
            const { projectPath } = req.body;
            const initState = getProjectState(projectPath || '');
            
            if (initState.currentStep < 4) {
                return error(res, 'Step5需要先完成Step4模块整合', 400);
            }

            console.log('[Init-Step5] 提供总览生成提示词指导...');
            
            // 通过提示词管理系统获取总览提示词
            const overviewPrompt = generateOverviewGenerationPrompt(initState);
            
            return success(res, {
                currentStep: 5,
                stepName: 'overview-generation',
                promptType: 'overview-generation-guidance',
                
                // 提示词内容
                prompt: overviewPrompt,
                
                // 指导信息  
                guidance: {
                    task: '基于模块整合结果生成项目总览文档',
                    location: `${initState.projectPath}/mg_kiro/`,
                    expectedOutput: '项目整体概览文档',
                    nextStep: 'complete-task with step=overview-generation'
                },
                
                // AI指令
                aiInstructions: [
                    '1. 分析已整合的模块文档',
                    '2. 生成项目总览和导航文档',  
                    '3. 创建文档索引和结构图',
                    '4. 调用 POST /init/step3-complete-task 标记完成',
                    '   参数: { step: "overview-generation" }'
                ],
                
                progress: {
                    completed: 5,
                    total: 6,
                    percentage: Math.round(5/6 * 100)
                }
            }, 'Step5: 总览生成提示词已提供');

        } catch (err) {
            console.error('[Init-Step5] 总览生成提示词失败:', err);
            return error(res, `Step5失败: ${err.message}`, 500);
        }
    });

    /**
     * Step 6: 连接文档提示词 (简化版) - 最终步骤
     * POST /init/step6-module-connections
     */
    router.post('/step6-module-connections', async (req, res) => {
        try {
            const { projectPath } = req.body;
            const initState = getProjectState(projectPath || '');
            
            if (initState.currentStep < 5) {
                return error(res, 'Step6需要先完成Step5总览生成', 400);
            }

            console.log('[Init-Step6] 提供连接文档提示词指导...');
            
            // 通过提示词管理系统获取连接提示词
            const connectionPrompt = generateConnectionDocumentPrompt(initState);
            
            return success(res, {
                currentStep: 6,
                stepName: 'module-connections',
                promptType: 'connection-documentation-guidance',
                finalStep: true,
                
                // 提示词内容
                prompt: connectionPrompt,
                
                // 指导信息
                guidance: {
                    task: '分析并文档化模块间的连接关系',
                    location: `${initState.projectPath}/mg_kiro/`,
                    expectedOutput: '模块连接关系文档和最终架构文档更新',
                    isFinalStep: true,
                    nextStep: 'complete-task with step=module-connections (最终步骤)'
                },
                
                // AI指令
                aiInstructions: [
                    '1. 分析模块间的依赖和连接关系',
                    '2. 生成连接关系图和文档',
                    '3. 更新和完善系统架构文档',
                    '4. 调用 POST /init/step3-complete-task 标记完成',
                    '   参数: { step: "module-connections" }',
                    '5. 完成后Init流程结束'
                ],
                
                progress: {
                    completed: 6,
                    total: 6,
                    percentage: 100,
                    nearCompletion: true
                },
                
                completionInfo: {
                    message: '这是Init流程的最后一步',
                    finalOutputLocation: `${initState.projectPath}/mg_kiro/`,
                    totalDocumentsGenerated: initState.documentCount
                }
            }, 'Step6: 连接文档提示词已提供 - 最终步骤');

        } catch (err) {
            console.error('[Init-Step6] 连接文档提示词失败:', err);
            return error(res, `Step6失败: ${err.message}`, 500);
        }
    });

    /**
     * 获取当前状态和进度
     * GET /init/status
     */
    router.get('/status', async (req, res) => {
        try {
            const { projectPath } = req.query;
            
            if (!projectPath) {
                return success(res, {
                    message: 'No active project',
                    availableProjects: Array.from(projectStates.keys())
                });
            }
            
            const initState = getProjectState(projectPath);
            
            return success(res, {
                currentFlow: '6-step-simplified-flow',
                version: '3.0',
                
                // 当前状态
                currentState: {
                    step: initState.currentStep,
                    projectPath: initState.projectPath,
                    startedAt: initState.startedAt,
                    hasError: !!initState.error,
                    error: initState.error,
                    documentCount: initState.documentCount
                },
                
                // 进度信息
                progressInfo: {
                    completed: initState.stepsCompleted.length,
                    total: 6,
                    percentage: Math.round(initState.stepsCompleted.length / 6 * 100),
                    stepsCompleted: initState.stepsCompleted,
                    currentStepName: getCurrentStepName(initState.currentStep)
                },
                
                // 生成的文档
                generatedDocuments: {
                    total: initState.documentCount,
                    location: `${initState.projectPath}/mg_kiro/`,
                    documents: initState.generatedDocs
                },
                
                // 可用端点
                availableEndpoints: getAvailableEndpoints(initState.currentStep),
                
                // 流程说明
                flowDescription: {
                    step1: 'Step1: 项目分析 - 生成基础数据包和架构文档',
                    step2: 'Step2: 创建To-Do - 基于架构生成AI任务列表',
                    step3: 'Step3: 文件文档 - AI逐个查询文件生成文档到mg_kiro/',
                    step4: 'Step4: 模块整合 - 通过提示词系统提供整合指导',
                    step5: 'Step5: 总览生成 - 通过提示词系统提供概览指导',
                    step6: 'Step6: 连接文档 - 通过提示词系统提供连接指导'
                }
                
            }, '6步Init流程状态信息');

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
            const { projectPath } = req.body;
            
            if (projectPath) {
                // 重置特定项目
                const normalizedPath = resolve(projectPath);
                projectStates.delete(normalizedPath);
                console.log(`[Init-Reset] 重置项目: ${normalizedPath}`);
            } else {
                // 重置所有项目
                projectStates.clear();
                console.log('[Init-Reset] 重置所有项目状态');
            }
            
            return success(res, {
                reset: true,
                flow: '6-step-simplified-flow',
                version: '3.0',
                projectPath: projectPath,
                
                nextStep: {
                    step: 1,
                    endpoint: 'POST /init/step1-project-analysis',
                    description: '开始新的6步Init流程'
                },
                
                resetConfirmation: projectPath 
                    ? `项目 ${projectPath} 的Init流程已重置`
                    : '所有Init流程已重置'
                
            }, '6步Init流程已重置');

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
                version: '3.0',
                title: 'Claude Code Init API - 6步简化流程',
                description: '简化的6步Init流程：项目分析 → 任务创建 → 文件文档 → 模块整合 → 总览生成 → 连接文档',
                
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
                        parameters: ['projectPath (required)', 'batchSize', 'includeAnalysisTasks'],
                        output: 'AI任务列表 + 处理策略 + 批次配置'
                    },
                    step3: {
                        title: '文件文档生成',
                        description: 'AI逐个处理文件生成文档到mg_kiro文件夹',
                        endpoints: {
                            'GET /init/step3-get-next-task': '获取下一个待处理任务',
                            'GET /init/step3-get-file-content': '获取文件内容并自动生成markdown',
                            'POST /init/step3-complete-task': '标记任务完成（统一进度管理）'
                        },
                        output: '所有文件的markdown文档 (保存在mg_kiro/)'
                    },
                    step4: {
                        endpoint: 'POST /init/step4-module-integration',
                        title: '模块整合',
                        description: '通过提示词系统提供模块整合指导',
                        output: '模块整合提示词 + AI指导'
                    },
                    step5: {
                        endpoint: 'POST /init/step5-overview-generation',
                        title: '总览生成',
                        description: '通过提示词系统提供项目总览指导',
                        output: '总览生成提示词 + AI指导'
                    },
                    step6: {
                        endpoint: 'POST /init/step6-module-connections',
                        title: '连接文档',
                        description: '通过提示词系统提供模块连接指导（最终步骤）',
                        output: '连接文档提示词 + AI指导'
                    }
                },
                
                supportEndpoints: {
                    'GET /init/status': '获取当前流程状态和进度',
                    'POST /init/reset': '重置流程状态',
                    'GET /init/help': '获取API帮助信息'
                },

                keyFeatures: [
                    '🎯 6步简化流程：每步都有明确的输入输出',
                    '📁 自动文档生成：文件分析结果保存到mg_kiro文件夹',
                    '🤖 AI集中协作：机器分析 + AI文档生成',
                    '📊 统一进度管理：通过step3-complete-task管理全局进度',
                    '🔗 提示词集成：Step4-6通过提示词管理系统提供指导',
                    '📈 项目隔离：支持多项目并发处理',
                    '🎨 简化架构：删除不必要的复杂步骤'
                ],

                exampleUsage: {
                    completeFlow: [
                        'POST /init/step1-project-analysis { "projectPath": "/path/to/project" }',
                        'POST /init/step2-create-todo { "projectPath": "/path/to/project" }',
                        'GET /init/step3-get-next-task?projectPath=/path/to/project (循环)',
                        'GET /init/step3-get-file-content?projectPath=/path/to/project&relativePath=... (自动生成md)',
                        'POST /init/step3-complete-task { "projectPath": "/path/to/project", "taskId": "..." }',
                        'POST /init/step4-module-integration { "projectPath": "/path/to/project" }',
                        'POST /init/step3-complete-task { "step": "module-integration" }',
                        'POST /init/step5-overview-generation { "projectPath": "/path/to/project" }',
                        'POST /init/step3-complete-task { "step": "overview-generation" }',  
                        'POST /init/step6-module-connections { "projectPath": "/path/to/project" }',
                        'POST /init/step3-complete-task { "step": "module-connections" } (完成)'
                    ]
                }
            }, '6步Init流程API帮助信息');

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
            6: 'Module Connections'
        };
        return stepNames[stepNumber] || 'Unknown';
    }
    
    function getAvailableEndpoints(currentStep) {
        const endpoints = {
            0: ['POST /init/step1-project-analysis'],
            1: ['POST /init/step2-create-todo'],
            2: ['GET /init/step3-get-next-task'],
            3: ['POST /init/step4-module-integration', 'GET /init/step3-get-next-task'],
            4: ['POST /init/step5-overview-generation'],
            5: ['POST /init/step6-module-connections'],
            6: ['POST /init/reset', 'GET /init/help']
        };
        return endpoints[currentStep] || ['GET /init/status', 'POST /init/reset'];
    }

    // 文档生成函数
    function generateFileDocumentation(fileDetails, relativePath) {
        const now = new Date().toISOString();
        return `# ${path.basename(relativePath)} - 文件分析文档

**文件路径**: \`${relativePath}\`  
**生成时间**: ${now}  
**分析工具**: mg_kiro MCP Server

---

## 📊 文件基本信息

- **文件大小**: ${fileDetails.size || 'N/A'} bytes
- **文件类型**: ${path.extname(relativePath) || 'Unknown'}
- **编码格式**: ${fileDetails.encoding || 'UTF-8'}

---

## 📝 文件内容

\`\`\`${getLanguageFromExtension(path.extname(relativePath))}
${fileDetails.content || '// 内容为空或无法读取'}
\`\`\`

---

## 🔍 内容分析

### 文件结构
${analyzeFileStructure(fileDetails.content, relativePath)}

### 功能说明
${generateFunctionDescription(fileDetails.content, relativePath)}

### 依赖关系
${analyzeDependencies(fileDetails.content, relativePath)}

---

## 💡 建议和改进

${generateImprovementSuggestions(fileDetails.content, relativePath)}

---

*文档由 mg_kiro MCP Server 自动生成*  
*生成时间: ${now}*
`;
    }

    function getLanguageFromExtension(ext) {
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.css': 'css',
            '.html': 'html',
            '.json': 'json',
            '.md': 'markdown',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        };
        return langMap[ext] || 'text';
    }

    function analyzeFileStructure(content, relativePath) {
        if (!content) return '暂无内容分析';
        
        const lines = content.split('\n').length;
        const ext = path.extname(relativePath).toLowerCase();
        
        let analysis = `- 文件行数: ${lines}行\n`;
        
        if (ext === '.js' || ext === '.ts') {
            const functions = (content.match(/function\s+\w+|const\s+\w+\s*=.*=>/g) || []).length;
            const classes = (content.match(/class\s+\w+/g) || []).length;
            analysis += `- 函数数量: ${functions}个\n`;
            analysis += `- 类数量: ${classes}个\n`;
        }
        
        return analysis;
    }

    function generateFunctionDescription(content, relativePath) {
        if (!content) return '无法分析功能';
        
        const ext = path.extname(relativePath).toLowerCase();
        const fileName = path.basename(relativePath, ext);
        
        if (ext === '.js' || ext === '.ts') {
            if (content.includes('export') || content.includes('module.exports')) {
                return `${fileName} 是一个JavaScript模块，提供可导出的功能。`;
            }
            if (content.includes('router.') || content.includes('app.')) {
                return `${fileName} 是一个路由文件，定义了API端点。`;
            }
            if (content.includes('class ')) {
                return `${fileName} 定义了类和相关方法。`;
            }
        }
        
        return `${fileName} 是一个${ext.slice(1).toUpperCase()}文件，需要进一步分析其具体功能。`;
    }

    function analyzeDependencies(content, relativePath) {
        if (!content) return '无依赖分析';
        
        const imports = content.match(/import.*from\s+['"][^'"]*['"]/g) || 
                       content.match(/require\s*\(\s*['"][^'"]*['"]\s*\)/g) || [];
        
        if (imports.length === 0) {
            return '此文件没有外部依赖';
        }
        
        let analysis = '### 导入的模块:\n';
        imports.slice(0, 10).forEach(imp => {
            analysis += `- \`${imp}\`\n`;
        });
        
        if (imports.length > 10) {
            analysis += `- ... 还有 ${imports.length - 10} 个依赖\n`;
        }
        
        return analysis;
    }

    function generateImprovementSuggestions(content, relativePath) {
        if (!content) return '无法提供建议';
        
        const suggestions = [];
        
        // 基础检查
        if (content.length > 10000) {
            suggestions.push('文件较大，建议考虑拆分为多个模块');
        }
        
        if (!content.includes('//') && !content.includes('/*')) {
            suggestions.push('建议添加注释以提高代码可读性');
        }
        
        const ext = path.extname(relativePath).toLowerCase();
        if ((ext === '.js' || ext === '.ts') && !content.includes('export')) {
            suggestions.push('考虑将功能模块化，使用export导出');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('代码结构良好，继续保持');
        }
        
        return suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
    }

    // 提示词生成函数
    function generateModuleIntegrationPrompt(initState) {
        return `# 模块整合指导提示词

## 任务概述
基于已生成的${initState.documentCount}个文件文档，进行模块化整合分析。

## 数据源
- 文档位置: ${initState.projectPath}/mg_kiro/
- 文档数量: ${initState.documentCount}个
- 项目语言: ${initState.stepResults.step1?.projectOverview?.languageProfile?.primary || 'Unknown'}

## 整合目标
1. 按功能模块分类现有文档
2. 识别模块间的关系和依赖
3. 生成模块级别的整合文档
4. 创建模块目录和索引

## 输出要求
请在mg_kiro文件夹中生成以下整合文档：
- modules-overview.md (模块总览)
- module-{name}.md (各个模块的详细文档)
- modules-index.md (模块索引和导航)

## 完成标记
完成后请调用: POST /init/step3-complete-task 
参数: { "step": "module-integration", "taskId": "module-integration-task" }
`;
    }

    function generateOverviewGenerationPrompt(initState) {
        return `# 项目总览生成指导提示词

## 任务概述
基于模块整合结果，生成项目的整体概览和导航文档。

## 数据源
- 模块文档: ${initState.projectPath}/mg_kiro/modules-*.md
- 原始分析: ${initState.documentCount}个文件文档
- 项目信息: ${JSON.stringify(initState.stepResults.step1?.analysisResults || {})}

## 生成目标
1. 创建项目总体概览文档
2. 生成文档导航和索引
3. 提供快速开始指南
4. 总结项目特点和架构

## 输出要求
请在mg_kiro文件夹中生成：
- PROJECT-OVERVIEW.md (项目总览)
- DOCUMENTATION-INDEX.md (文档索引)
- QUICK-START.md (快速开始指南)

## 完成标记
完成后请调用: POST /init/step3-complete-task
参数: { "step": "overview-generation", "taskId": "overview-generation-task" }
`;
    }

    function generateConnectionDocumentPrompt(initState) {
        return `# 模块连接关系文档指导提示词

## 任务概述
分析和文档化模块间的连接关系，并更新系统架构文档。这是Init流程的最后一步。

## 数据源  
- 模块文档: ${initState.projectPath}/mg_kiro/module-*.md
- 项目概览: ${initState.projectPath}/mg_kiro/PROJECT-OVERVIEW.md
- 原始项目分析: ${JSON.stringify(initState.stepResults.step1?.analysisResults || {})}

## 分析目标
1. 识别模块间的依赖关系
2. 分析数据流和调用关系
3. 发现潜在的架构问题
4. 更新和完善系统架构文档

## 输出要求
请在mg_kiro文件夹中生成：
- MODULE-CONNECTIONS.md (模块连接关系)
- ARCHITECTURE-FINAL.md (最终架构文档)
- DEPENDENCIES-GRAPH.md (依赖关系图)

## 🎉 最终步骤
这是Init流程的最后一步，完成后整个初始化过程结束。

## 完成标记
完成后请调用: POST /init/step3-complete-task
参数: { "step": "module-connections", "taskId": "connection-analysis-task" }

完成后Init流程将结束，所有文档已生成到mg_kiro文件夹。
`;
    }

    return router;
}

export default createClaudeCodeInitRoutes;