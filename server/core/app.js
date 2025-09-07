/**
 * Express应用程序配置文件
 * 处理中间件设置和路由注册
 */

import express from 'express';
import { setupSecurity, setupCORS, setupParsers, setupRateLimit } from '../middleware/index.js';
import { createAppRoutes } from '../routes/index.js';

/**
 * 创建和配置Express应用程序
 * @param {Object} config - 应用配置
 * @param {Object} services - 服务依赖
 * @param {Object} server - 服务器实例
 * @returns {express.Application} 配置好的Express应用
 */
export function createApp(config, services, server) {
    const app = express();

    // ========== 中间件设置 ==========
    
    // 安全中间件
    setupSecurity(app);
    
    // CORS配置
    setupCORS(app, config.cors);
    
    // 请求解析中间件
    setupParsers(app);
    
    // 速率限制
    setupRateLimit(app, config.rateLimit);

    // 请求日志中间件
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });

    // ========== 路由设置 ==========
    
    // 注册所有应用路由
    const appRoutes = createAppRoutes(services, server);
    app.use('/', appRoutes);

    // ========== Init模式特殊路由 (临时保留) ==========
    
    // TODO: 将这些路由迁移到routes/init目录
    registerInitRoutes(app, services, server);

    return app;
}

/**
 * 注册Init模式特殊路由
 * 临时保留现有的mcp-server.js中的路由逻辑
 * @param {express.Application} app - Express应用
 * @param {Object} services - 服务依赖
 * @param {Object} server - 服务器实例
 */
function registerInitRoutes(app, services, server) {
    const { workflowService, languageService, fileContentService } = services;

    // ========== Init模式工作流API - 第1步：项目结构分析 ==========
    
    // 第1步-A: 扫描项目结构
    app.post('/mode/init/scan-structure', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return res.status(400).json({
                    success: false,
                    error: '项目路径不能为空'
                });
            }

            console.log(`[MCP-API] 开始项目结构扫描: ${projectPath}`);
            
            // 创建工作流会话
            const workflowId = workflowService.createWorkflow(projectPath, 'init');
            
            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 0, 'running');
            
            // 执行项目扫描
            const scanResult = await server.projectScanner.scanProject(projectPath);
            
            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 0, 'completed', scanResult);
            
            res.json({
                success: true,
                step: 1,
                stepName: 'scan_structure',
                data: scanResult,
                workflowId,
                workflowProgress: workflowService.getProgress(workflowId),
                nextStep: workflowService.getNextStep(workflowService.getWorkflow(workflowId))
            });

            console.log(`[MCP-API] 项目结构扫描完成: ${projectPath} (${scanResult.scanDuration}ms)`);
            
        } catch (error) {
            console.error('[MCP-API] 项目结构扫描失败:', error);
            
            // 更新步骤状态为失败
            if (req.workflowId) {
                workflowService.updateStep(req.workflowId, 0, 'failed', null, error.message);
            }
            
            res.status(500).json({
                success: false,
                error: error.message,
                step: 1,
                stepName: 'scan_structure'
            });
        }
    });

    // 第1步-B: 获取项目结构分析摘要
    app.get('/mode/init/structure-summary', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    error: '工作流ID不能为空'
                });
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    error: `工作流不存在: ${workflowId}`
                });
            }

            const scanResult = workflow.results.step_1;
            if (!scanResult) {
                return res.status(404).json({
                    success: false,
                    error: '项目结构扫描结果不存在，请先执行 POST /mode/init/scan-structure'
                });
            }

            // 生成摘要信息
            const summary = server._generateStructureSummary(scanResult);

            res.json({
                success: true,
                step: 1,
                stepName: 'structure_summary',
                workflowId,
                summary,
                workflowProgress: workflowService.getProgress(workflowId)
            });

        } catch (error) {
            console.error('[MCP-API] 获取项目结构摘要失败:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ========== Init模式工作流API - 第2步：智能语言识别 ==========
    
    // 第2步-A: 启动语言检测引擎
    app.post('/mode/init/detect-language', async (req, res) => {
        try {
            const { workflowId, projectPath } = req.body;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    error: '工作流ID不能为空'
                });
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || workflow.currentStep < 1) {
                return res.status(400).json({
                    success: false,
                    error: '请先完成第1步项目结构分析'
                });
            }

            const step1Results = workflow.results.step_1;
            const projectPathToUse = projectPath || workflow.projectPath;

            console.log(`[MCP-API] 开始智能语言检测: ${projectPathToUse}`);
            
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
            
            res.json({
                success: true,
                step: 2,
                stepName: 'detect_language',
                data: detectionResult,
                workflowId,
                workflowProgress: workflowService.getProgress(workflowId),
                nextStep: workflowService.getNextStep(workflowService.getWorkflow(workflowId))
            });

            console.log(`[MCP-API] 智能语言检测完成: ${projectPathToUse} (${detectionResult.analysisDuration}ms)`);
            
        } catch (error) {
            console.error('[MCP-API] 智能语言检测失败:', error);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 1, 'failed', null, error.message);
            }
            
            res.status(500).json({
                success: false,
                error: error.message,
                step: 2,
                stepName: 'detect_language'
            });
        }
    });

    // 第2步-B: 获取语言检测报告
    app.get('/mode/init/language-report', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    error: '工作流ID不能为空'
                });
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    error: `工作流不存在: ${workflowId}`
                });
            }

            const detectionResult = workflow.results.step_2;
            if (!detectionResult) {
                return res.status(404).json({
                    success: false,
                    error: '语言检测结果不存在，请先执行 POST /mode/init/detect-language'
                });
            }

            // 生成详细报告
            const report = server._generateLanguageReport(detectionResult);

            res.json({
                success: true,
                step: 2,
                stepName: 'language_report',
                workflowId,
                report,
                workflowProgress: workflowService.getProgress(workflowId)
            });

        } catch (error) {
            console.error('[MCP-API] 获取语言检测报告失败:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ========== Init模式工作流API - 第3步：文件内容通读 ==========
    
    // 第3步-A: 智能文件内容分析
    app.post('/mode/init/scan-files', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    error: '工作流ID不能为空'
                });
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || workflow.currentStep < 2) {
                return res.status(400).json({
                    success: false,
                    error: '请先完成第1步(项目结构分析)和第2步(语言检测)'
                });
            }

            const step1Results = workflow.results.step_1;
            const step2Results = workflow.results.step_2;

            console.log(`[MCP-API] 开始文件内容分析: ${workflow.projectPath}`);
            
            // 更新步骤状态为运行中 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'running');
            
            // 准备项目数据
            const projectData = {
                projectPath: workflow.projectPath,
                structure: step1Results,
                languageData: {
                    primaryLanguage: step2Results.detection.primaryLanguage,
                    confidence: step2Results.workflowIntegration.confidenceScore,
                    frameworks: step2Results.detection.techStack.frameworks,
                    techStack: step2Results.detection.techStack
                }
            };
            
            // 执行文件内容分析
            const analysisResult = await server.fileContentAnalyzer.analyzeFiles(projectData);
            
            // 更新步骤状态为已完成 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'completed', analysisResult);
            
            res.json({
                success: true,
                step: 3,
                stepName: 'scan_files',
                data: analysisResult,
                workflowId,
                workflowProgress: workflowService.getProgress(workflowId),
                nextStep: workflowService.getNextStep(workflowService.getWorkflow(workflowId))
            });

            console.log(`[MCP-API] 文件内容分析完成: ${workflow.projectPath} (${analysisResult.analysis.analysisTime}ms)`);
            
        } catch (error) {
            console.error('[MCP-API] 文件内容分析失败:', error);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 3, 'failed', null, error.message);
            }
            
            res.status(500).json({
                success: false,
                error: error.message,
                step: 3,
                stepName: 'scan_files'
            });
        }
    });

    // 第3步-B: 获取文件内容概览
    app.get('/mode/init/files-overview', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    error: '工作流ID不能为空'
                });
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return res.status(404).json({
                    success: false,
                    error: `工作流不存在: ${workflowId}`
                });
            }

            const analysisResult = workflow.results.step_3;
            if (!analysisResult) {
                return res.status(404).json({
                    success: false,
                    error: '文件内容分析结果不存在，请先执行 POST /mode/init/scan-files'
                });
            }

            // 生成详细概览
            const overview = server._generateFilesOverview(analysisResult, workflowId);

            res.json({
                success: true,
                step: 3,
                stepName: 'files_overview',
                workflowId,
                overview,
                workflowProgress: workflowService.getProgress(workflowId)
            });

        } catch (error) {
            console.error('[MCP-API] 获取文件概览失败:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

export default createApp;