/**
 * Init模式 - 第1步：项目结构分析路由模块
 * 项目结构扫描和分析端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建项目结构分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createStructureRoutes(services) {
    const router = express.Router();
    const { workflowService, server } = services;

    /**
     * 第1步-A: 扫描项目结构
     * POST /scan-structure
     */
    router.post('/scan-structure', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径不能为空', 400);
            }

            console.log(`[Structure] 开始项目结构扫描: ${projectPath}`);
            
            // 创建工作流会话
            const workflowId = workflowService.createWorkflow(projectPath, 'init');
            
            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 0, 'running');
            
            // 执行项目扫描
            const scanResult = await server.projectScanner.scanProject(projectPath);
            
            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 0, 'completed', scanResult);
            
            // 构建响应数据
            const responseData = {
                ...scanResult,
                metadata: {
                    workflowId,
                    step: 1,
                    stepName: 'scan_structure',
                    timestamp: new Date().toISOString()
                }
            };

            workflowSuccess(res, 1, 'scan_structure', workflowId, responseData, workflowService.getProgress(workflowId));

            console.log(`[Structure] 项目结构扫描完成: ${projectPath} (${scanResult.scanDuration}ms)`);
            
        } catch (err) {
            console.error('[Structure] 项目结构扫描失败:', err);
            
            // 更新步骤状态为失败
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 0, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 1,
                stepName: 'scan_structure'
            });
        }
    });

    /**
     * 第1步-B: 获取项目结构分析摘要
     * GET /structure-summary
     */
    router.get('/structure-summary', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const scanResult = workflow.results.step_1;
            if (!scanResult) {
                return error(res, '项目结构扫描结果不存在，请先执行 POST /scan-structure', 404);
            }

            // 生成摘要信息
            const summary = _generateStructureSummary(scanResult, server);

            workflowSuccess(res, 1, 'structure_summary', workflowId, summary, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Structure] 获取项目结构摘要失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 生成项目结构摘要
 * @param {Object} scanResult - 扫描结果
 * @param {Object} server - 服务器实例
 * @returns {Object} 结构摘要
 */
function _generateStructureSummary(scanResult, server) {
    return {
        project: {
            path: scanResult.projectPath,
            name: scanResult.projectPath.split('/').pop(),
            scanDuration: scanResult.scanDuration,
            timestamp: scanResult.timestamp
        },
        structure: {
            totalFiles: scanResult.structure?.totalFiles || 0,
            totalDirectories: scanResult.structure?.totalDirectories || 0,
            maxDepth: server.projectScanner.getMaxDepth(scanResult.structure),
            mainDirectories: scanResult.structure?.directories || []
        },
        analysis: {
            complexity: scanResult.analysis?.complexity || 'unknown',
            scale: scanResult.analysis?.scale || 'unknown',
            maturity: scanResult.analysis?.maturity || 'unknown',
            projectType: scanResult.analysis?.projectType || 'unknown',
            developmentStage: scanResult.analysis?.developmentStage || 'unknown'
        },
        techs: {
            detectedLanguages: scanResult.configs?.detected || [],
            techStackHints: scanResult.analysis?.techStackHints || [],
            frameworks: _extractFrameworks(scanResult)
        },
        docs: {
            hasReadme: scanResult.readme?.found || false,
            readmeAnalysis: scanResult.readme?.analysis || null
        },
        recommendations: scanResult.workflowContext?.nextStepRecommendations || []
    };
}

/**
 * 从扫描结果中提取框架信息
 * @param {Object} scanResult - 项目扫描结果
 * @returns {Array} 检测到的框架列表
 */
function _extractFrameworks(scanResult) {
    const frameworks = [];
    
    try {
        // 从配置文件中提取框架信息
        const jsConfigs = scanResult.configs?.byLanguage?.javascript;
        if (jsConfigs && jsConfigs.length > 0) {
            for (const config of jsConfigs) {
                if (config.analysis?.frameworks) {
                    frameworks.push(...config.analysis.frameworks);
                }
            }
        }
        
        // 从README分析中提取技术栈信息
        const techStack = scanResult.readme?.analysis?.techStack;
        if (techStack) {
            frameworks.push(...techStack);
        }
        
        // 去重并返回
        return [...new Set(frameworks)];
    } catch (error) {
        console.error('提取框架信息失败:', error);
        return [];
    }
}

export default createStructureRoutes;