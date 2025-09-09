/**
 * 主路由索引文件 (新版简化架构)
 * 只保留必要的系统路由和新的ClaudeCodeInit服务
 */

import express from 'express';

// 系统路由
import { createHealthRoutes } from './system/health.js';
import { createMCPRoutes } from './system/mcp.js';
import { createPromptsRoutes } from './system/prompts.js';
import { createClaudeCodeInitRoutes } from './system/claude-code-init.js';

/**
 * 创建应用程序主路由 (简化版)
 * @param {Object} services - 服务依赖
 * @param {Object} server - 服务器实例
 * @returns {express.Router} 主路由实例
 */
export function createAppRoutes(services, server) {
    const router = express.Router();
    const routerServices = { ...services, server };

    // ========== 核心系统路由 ==========
    
    // 健康检查和监控路由
    const healthRouter = createHealthRoutes(routerServices);
    router.use('/', healthRouter);

    // MCP协议端点
    const mcpRouter = createMCPRoutes(routerServices);
    router.use('/mcp', mcpRouter);

    // 提示词和模板管理 
    const promptsRouter = createPromptsRoutes(routerServices);
    router.use('/prompt', promptsRouter);
    router.use('/prompts', promptsRouter);
    router.use('/template', promptsRouter);

    // ========== Claude Code Init服务 (新的5步流程) ==========
    
    // Claude Code Init路由 (替代旧的workflow系统)
    const claudeCodeInitRouter = createClaudeCodeInitRoutes(routerServices);
    router.use('/init', claudeCodeInitRouter);

    // ========== 服务状态和监控 ==========
    
    // 服务状态查询
    router.get('/services/status', async (req, res) => {
        try {
            const stats = services.getStats ? services.getStats() : {};
            
            res.json({
                success: true,
                message: '服务状态',
                data: {
                    serviceStats: stats,
                    availableServices: [
                        'claudeCodeInit',
                        'promptManager', 
                        'projectScanner',
                        'languageDetector',
                        'fileAnalyzer',
                        'configService'
                    ],
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 服务信息查询
    router.get('/services/info', async (req, res) => {
        try {
            const info = {
                architecture: 'claude-code-init',
                version: '2.0.1',
                features: [
                    'MCP协议支持',
                    '5步Init流程',
                    '智能语言检测',
                    '项目结构分析',
                    '文档生成数据准备'
                ],
                endpoints: {
                    init: [
                        'POST /init/initialize',
                        'POST /init/step1-data-collection',
                        'POST /init/step2-architecture', 
                        'POST /init/step3-deep-analysis',
                        'POST /init/step4-module-docs',
                        'POST /init/step5-contracts',
                        'GET /init/status',
                        'POST /init/reset'
                    ],
                    system: [
                        'GET /health',
                        'GET /services/status',
                        'GET /services/info'
                    ]
                }
            };

            res.json({
                success: true,
                message: '服务信息',
                data: info
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ========== 错误处理和404 ==========
    
    // 全局错误处理中间件
    router.use((error, req, res, next) => {
        console.error('[Route Error]:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    });

    // 404处理
    router.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
            method: req.method,
            path: req.originalUrl,
            suggestion: 'Check /services/info for available endpoints',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

export default createAppRoutes;