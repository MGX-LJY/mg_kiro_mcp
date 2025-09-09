/**
 * Claude Code Init路由
 * 专为配合Claude Code工作流设计的Init API
 * 
 * 新的5步流程API：
 * 1. POST /init/step1-data-collection - 数据收集（合并1-3步）
 * 2. POST /init/step2-architecture - 架构文档生成数据准备
 * 3. POST /init/step3-deep-analysis - 深度分析（合并5-6步）
 * 4. POST /init/step4-module-docs - 模块文档生成数据准备
 * 5. POST /init/step5-contracts - 集成契约生成数据准备
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';
import { ClaudeCodeInitService } from '../../services/claude-code-init-service.js';

/**
 * 创建Claude Code Init路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createClaudeCodeInitRoutes(services) {
    const router = express.Router();
    const initService = new ClaudeCodeInitService();

    /**
     * 初始化Init流程
     * POST /init/initialize
     */
    router.post('/initialize', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径不能为空', 400);
            }

            const state = initService.initialize(projectPath);
            
            return success(res, {
                message: 'Init流程已初始化',
                state,
                nextStep: {
                    step: 1,
                    name: 'data-collection',
                    api: 'POST /init/step1-data-collection',
                    description: '数据收集（项目结构+语言检测+文件分析）'
                }
            }, 'Init流程初始化成功');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 初始化失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 步骤1: 数据收集（合并1-3步）
     * POST /init/step1-data-collection
     */
    router.post('/step1-data-collection', async (req, res) => {
        try {
            console.log('[ClaudeCodeInit] 执行步骤1: 数据收集');
            
            // 检查是否已初始化项目路径
            const currentState = initService.getState();
            if (!currentState.projectPath) {
                return error(res, '请先调用 POST /init/initialize 初始化项目路径', 400);
            }
            
            const results = await initService.executeStep1_DataCollection();
            
            return success(res, {
                step: 1,
                stepName: 'data-collection',
                results,
                nextStep: {
                    step: 2,
                    name: 'architecture-generation',
                    api: 'POST /init/step2-architecture',
                    description: '架构文档生成（AI驱动）'
                },
                progress: initService.getProgress()
            }, '数据收集完成');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 步骤1失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 步骤2: 架构文档生成数据准备
     * POST /init/step2-architecture
     */
    router.post('/step2-architecture', async (req, res) => {
        try {
            console.log('[ClaudeCodeInit] 准备步骤2: 架构文档生成');
            
            // 检查是否已完成步骤1
            const currentState = initService.getState();
            if (!currentState.results.step1) {
                return error(res, '请先完成步骤1数据收集', 400);
            }
            
            const aiDataPackage = await initService.prepareStep2_ArchitectureGeneration();
            
            return success(res, {
                step: 2,
                stepName: 'architecture-generation',
                aiDataPackage,
                instructions: {
                    message: '请使用以下数据包让Claude Code生成system-architecture.md文档',
                    targetFile: 'mg_kiro/architecture/system-architecture.md',
                    template: 'architecture-document-template',
                    action: '将aiDataPackage提供给Claude Code进行文档生成'
                },
                nextStep: {
                    step: 3,
                    name: 'deep-analysis', 
                    api: 'POST /init/step3-deep-analysis',
                    description: '深度分析（模块分析+提示词生成）'
                },
                markComplete: 'POST /init/mark-step2-complete',
                progress: initService.getProgress()
            }, '架构文档生成数据已准备');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 步骤2准备失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 标记步骤2完成（当Claude Code生成文档后调用）
     * POST /init/mark-step2-complete
     */
    router.post('/mark-step2-complete', async (req, res) => {
        try {
            const { filePath } = req.body;
            
            initService.markDocumentSaved(2, filePath || 'system-architecture.md');
            
            return success(res, {
                step: 2,
                status: 'completed',
                progress: initService.getProgress()
            }, '步骤2已标记为完成');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 标记步骤2完成失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 步骤3: 深度分析（合并5-6步）
     * POST /init/step3-deep-analysis
     */
    router.post('/step3-deep-analysis', async (req, res) => {
        try {
            console.log('[ClaudeCodeInit] 执行步骤3: 深度分析');
            
            const results = await initService.executeStep3_DeepAnalysis();
            
            return success(res, {
                step: 3,
                stepName: 'deep-analysis',
                results,
                nextStep: {
                    step: 4,
                    name: 'module-docs-generation',
                    api: 'POST /init/step4-module-docs',
                    description: '模块文档生成（AI驱动）'
                },
                progress: initService.getProgress()
            }, '深度分析完成');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 步骤3失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 步骤4: 模块文档生成数据准备
     * POST /init/step4-module-docs
     */
    router.post('/step4-module-docs', async (req, res) => {
        try {
            console.log('[ClaudeCodeInit] 准备步骤4: 模块文档生成');
            
            const aiDataPackage = await initService.prepareStep4_ModuleDocGeneration();
            
            return success(res, {
                step: 4,
                stepName: 'module-docs-generation',
                aiDataPackage,
                instructions: {
                    message: '请使用以下数据包让Claude Code生成模块文档',
                    targetDirectory: 'mg_kiro/modules/',
                    filePattern: 'module-{moduleName}.md',
                    template: 'module-document-template',
                    action: '将aiDataPackage提供给Claude Code进行模块文档生成'
                },
                nextStep: {
                    step: 5,
                    name: 'integration-contracts',
                    api: 'POST /init/step5-contracts',
                    description: '集成契约生成（AI驱动）'
                },
                markComplete: 'POST /init/mark-step4-complete',
                progress: initService.getProgress()
            }, '模块文档生成数据已准备');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 步骤4准备失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 标记步骤4完成
     * POST /init/mark-step4-complete
     */
    router.post('/mark-step4-complete', async (req, res) => {
        try {
            const { savedFiles } = req.body;
            
            initService.markDocumentSaved(4, savedFiles || []);
            
            return success(res, {
                step: 4,
                status: 'completed',
                progress: initService.getProgress()
            }, '步骤4已标记为完成');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 标记步骤4完成失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 步骤5: 集成契约生成数据准备
     * POST /init/step5-contracts
     */
    router.post('/step5-contracts', async (req, res) => {
        try {
            console.log('[ClaudeCodeInit] 准备步骤5: 集成契约生成');
            
            const aiDataPackage = await initService.prepareStep5_IntegrationContracts();
            
            return success(res, {
                step: 5,
                stepName: 'integration-contracts',
                aiDataPackage,
                instructions: {
                    message: '请使用以下数据包让Claude Code生成集成契约文档',
                    targetFile: 'mg_kiro/contracts/integration-contracts.md',
                    template: 'integration-contracts-template',
                    action: '将aiDataPackage提供给Claude Code进行契约文档生成'
                },
                markComplete: 'POST /init/mark-step5-complete',
                progress: initService.getProgress(),
                finalStep: true
            }, '集成契约生成数据已准备');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 步骤5准备失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 标记步骤5完成（最终步骤）
     * POST /init/mark-step5-complete
     */
    router.post('/mark-step5-complete', async (req, res) => {
        try {
            const { filePath } = req.body;
            
            initService.markDocumentSaved(5, filePath || 'integration-contracts.md');
            
            const finalProgress = initService.getProgress();
            
            return success(res, {
                step: 5,
                status: 'completed',
                progress: finalProgress,
                message: '🎉 Init流程全部完成！',
                summary: {
                    totalSteps: 5,
                    completedSteps: finalProgress.completedSteps,
                    projectPath: finalProgress.projectPath,
                    documentsGenerated: [
                        'system-architecture.md',
                        'module-*.md (multiple files)',
                        'integration-contracts.md'
                    ]
                }
            }, 'Init流程全部完成');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 标记步骤5完成失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 获取当前状态
     * GET /init/status
     */
    router.get('/status', async (req, res) => {
        try {
            const state = initService.getState();
            const progress = initService.getProgress();
            
            return success(res, {
                state,
                progress,
                availableSteps: [
                    { step: 1, name: 'data-collection', api: 'POST /init/step1-data-collection' },
                    { step: 2, name: 'architecture-generation', api: 'POST /init/step2-architecture' },
                    { step: 3, name: 'deep-analysis', api: 'POST /init/step3-deep-analysis' },
                    { step: 4, name: 'module-docs-generation', api: 'POST /init/step4-module-docs' },
                    { step: 5, name: 'integration-contracts', api: 'POST /init/step5-contracts' }
                ]
            }, 'Init状态');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 获取状态失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 重置Init流程
     * POST /init/reset
     */
    router.post('/reset', async (req, res) => {
        try {
            initService.reset();
            
            return success(res, {
                message: 'Init流程已重置',
                nextAction: 'POST /init/initialize'
            }, 'Init流程重置成功');
            
        } catch (err) {
            console.error('[ClaudeCodeInit] 重置失败:', err);
            return error(res, err.message, 500);
        }
    });

    return router;
}

export default createClaudeCodeInitRoutes;