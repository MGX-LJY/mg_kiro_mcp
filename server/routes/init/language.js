/**
 * Init模式 - 第2步：智能语言识别路由模块
 * 语言检测和技术栈分析端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建语言识别路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createLanguageRoutes(services) {
    const router = express.Router();
    const { workflowService, languageService, server } = services;

    /**
     * 第2步-A: 启动语言检测引擎
     * POST /detect-language
     */
    router.post('/detect-language', async (req, res) => {
        try {
            const { workflowId, projectPath } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 检查第1步是否完成
            if (workflow.currentStep < 1) {
                return error(res, '请先完成第1步项目结构分析', 400);
            }

            const step1Results = workflow.results.step_1;
            const projectPathToUse = projectPath || workflow.projectPath;

            console.log(`[Language] 开始智能语言检测: ${projectPathToUse}`);
            
            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 1, 'running');
            
            // 执行增强语言检测
            const detectionResult = await server.enhancedLanguageDetector.detectLanguageEnhanced(
                projectPathToUse,
                step1Results,
                { workflowId, mode: 'init' }
            );
            
            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 1, 'completed', detectionResult);
            
            // 构建响应数据
            const responseData = {
                ...detectionResult,
                metadata: {
                    ...detectionResult.metadata,
                    workflowId,
                    step: 2,
                    stepName: 'detect_language',
                    timestamp: new Date().toISOString()
                }
            };

            workflowSuccess(res, 2, 'detect_language', workflowId, responseData, workflowService.getProgress(workflowId));

            console.log(`[Language] 智能语言检测完成: ${projectPathToUse} (${detectionResult.analysisDuration}ms)`);
            
        } catch (err) {
            console.error('[Language] 智能语言检测失败:', err);
            
            // 更新步骤状态为失败
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 1, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 2,
                stepName: 'detect_language'
            });
        }
    });

    /**
     * 第2步-B: 获取语言检测报告
     * GET /language-report
     */
    router.get('/language-report', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const detectionResult = workflow.results.step_2;
            if (!detectionResult) {
                return error(res, '语言检测结果不存在，请先执行 POST /detect-language', 404);
            }

            // 生成详细报告
            const report = _generateLanguageReport(detectionResult);

            workflowSuccess(res, 2, 'language_report', workflowId, report, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Language] 获取语言检测报告失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 生成语言检测详细报告
 * @param {Object} detectionResult - 检测结果
 * @returns {Object} 语言报告
 */
function _generateLanguageReport(detectionResult) {
    return {
        // 核心检测结果
        detection: {
            primaryLanguage: detectionResult.detection.primaryLanguage,
            secondaryLanguages: detectionResult.detection.secondaryLanguages,
            confidence: detectionResult.workflowIntegration.confidenceScore
        },
        
        // 技术栈生态
        techStack: {
            frameworks: detectionResult.detection.techStack.frameworks,
            buildTools: detectionResult.detection.techStack.buildTools,
            packageManagers: detectionResult.detection.techStack.packageManagers,
            testing: detectionResult.detection.techStack.testing
        },
        
        // 项目特征
        projectProfile: {
            type: detectionResult.detection.projectCharacteristics.type,
            scale: detectionResult.detection.projectCharacteristics.scale,
            maturity: detectionResult.detection.projectCharacteristics.maturity,
            complexity: detectionResult.detection.projectCharacteristics.complexity
        },
        
        // 开发环境建议
        environment: {
            recommended: detectionResult.detection.developmentEnvironment.recommended,
            currentSetup: detectionResult.detection.developmentEnvironment.currentSetup,
            missingComponents: detectionResult.detection.developmentEnvironment.missingComponents
        },
        
        // 分析质量
        analysisQuality: {
            dataQuality: detectionResult.workflowIntegration.dataQuality,
            enhancementGain: detectionResult.workflowIntegration.enhancementGain,
            step1Integration: detectionResult.workflowIntegration.step1Integration
        },
        
        // 工作流建议
        recommendations: detectionResult.detection.nextStepRecommendations,
        
        // 元信息
        metadata: {
            analysisId: detectionResult.analysisId,
            analysisDuration: detectionResult.analysisDuration,
            timestamp: detectionResult.timestamp,
            step3Readiness: detectionResult.workflowIntegration.readinessForStep3
        }
    };
}

export default createLanguageRoutes;