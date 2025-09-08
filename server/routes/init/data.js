/**
 * Init模式 - 数据提供服务路由模块
 * AI主导分析的数据服务端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建Init数据服务路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createInitDataRoutes(services) {
    const router = express.Router();
    const { workflowService, server } = services;

    /**
     * 获取项目基础数据
     * GET /project-data/:workflowId
     */
    router.get('/project-data/:workflowId', async (req, res) => {
        try {
            const { workflowId } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Data] 获取项目基础数据: ${workflowId}`);
            
            // 获取工作流进度
            const progress = workflowService.getProgress(workflowId);
            
            if (!progress) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 收集已完成步骤的数据
            const projectData = {
                workflowId,
                projectPath: progress.projectPath,
                completedSteps: progress.steps.filter(step => step.status === 'completed'),
                currentStep: progress.steps.findIndex(step => step.status === 'running') + 1 || 1,
                totalSteps: progress.steps.length,
                progress: progress.overallProgress
            };
            
            return success(res, projectData, '项目基础数据');
            
        } catch (err) {
            console.error(`[Data] 获取项目数据失败:`, err);
            return error(res, `获取项目数据失败: ${err.message}`, 500);
        }
    });

    /**
     * 获取项目文件树数据
     * GET /file-tree/:workflowId
     */
    router.get('/file-tree/:workflowId', async (req, res) => {
        try {
            const { workflowId } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Data] 获取项目文件树: ${workflowId}`);
            
            // 获取工作流信息
            const progress = workflowService.getProgress(workflowId);
            
            if (!progress) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 扫描项目文件树
            const scanResult = await server.projectScanner.scanProject(progress.projectPath);
            
            const fileTreeData = {
                projectPath: progress.projectPath,
                structure: scanResult.structure,
                fileCount: scanResult.stats?.totalFiles || 0,
                dirCount: scanResult.stats?.totalDirs || 0,
                language: scanResult.detectedLanguage,
                timestamp: new Date().toISOString()
            };
            
            return success(res, fileTreeData, '项目文件树数据');
            
        } catch (err) {
            console.error(`[Data] 获取文件树失败:`, err);
            return error(res, `获取文件树失败: ${err.message}`, 500);
        }
    });

    /**
     * 获取工作流状态数据
     * GET /workflow-status/:workflowId
     */
    router.get('/workflow-status/:workflowId', async (req, res) => {
        try {
            const { workflowId } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Data] 获取工作流状态: ${workflowId}`);
            
            // 获取工作流详细状态
            const progress = workflowService.getProgress(workflowId);
            
            if (!progress) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }
            
            return success(res, progress, '工作流状态数据');
            
        } catch (err) {
            console.error(`[Data] 获取工作流状态失败:`, err);
            return error(res, `获取工作流状态失败: ${err.message}`, 500);
        }
    });

    /**
     * 启动完整的Init模式分析流程
     * POST /start-analysis
     */
    router.post('/start-analysis', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径不能为空', 400);
            }

            console.log(`[Data] 启动Init模式完整分析: ${projectPath}`);
            
            // 创建工作流
            const workflowId = workflowService.createWorkflow(projectPath, 'init');
            
            // 返回工作流ID，客户端可以用来跟踪进度
            const analysisData = {
                workflowId,
                projectPath,
                mode: 'init',
                status: 'started',
                nextStep: 'scan-structure',
                message: 'Init模式分析流程已启动'
            };
            
            return success(res, analysisData, 'Init分析流程启动成功');
            
        } catch (err) {
            console.error(`[Data] 启动分析流程失败:`, err);
            return error(res, `启动分析流程失败: ${err.message}`, 500);
        }
    });

    /**
     * 获取所有活跃的工作流
     * GET /active-workflows
     */
    router.get('/active-workflows', async (req, res) => {
        try {
            console.log(`[Data] 获取活跃工作流列表`);
            
            // 获取所有活跃工作流（这里需要workflowService支持）
            const activeWorkflows = workflowService.getActiveWorkflows ? 
                workflowService.getActiveWorkflows() : 
                [];
            
            return success(res, { workflows: activeWorkflows }, '活跃工作流列表');
            
        } catch (err) {
            console.error(`[Data] 获取活跃工作流失败:`, err);
            return error(res, `获取活跃工作流失败: ${err.message}`, 500);
        }
    });

    return router;
}

// 默认导出兼容性
export default function(services) {
    return createInitDataRoutes(services);
}