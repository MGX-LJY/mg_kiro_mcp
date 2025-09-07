/**
 * 健康检查和监控路由模块
 * 系统状态、指标和诊断端点
 */

import express from 'express';
import { success, error } from '../../utils/response.js';

/**
 * 创建健康检查路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createHealthRoutes(services) {
    const router = express.Router();
    const { server, promptService } = services;

    /**
     * 基础健康检查
     * GET /health
     */
    router.get('/health', (req, res) => {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            mode: server.currentMode,
            connections: server.clients.size
        };

        success(res, healthData);
    });

    /**
     * 详细系统状态
     * GET /status
     */
    router.get('/status', (req, res) => {
        const statusData = {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            mcp: {
                version: '1.0.0',
                mode: server.currentMode,
                connections: server.mcpConnections.size,
                clients: server.clients.size
            }
        };

        success(res, statusData);
    });

    /**
     * 系统性能指标
     * GET /metrics
     */
    router.get('/metrics', (req, res) => {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            const metricsData = {
                performance: {
                    uptime: process.uptime(),
                    memory: {
                        rss: memUsage.rss,
                        heapTotal: memUsage.heapTotal,
                        heapUsed: memUsage.heapUsed,
                        external: memUsage.external,
                        arrayBuffers: memUsage.arrayBuffers,
                        usage_percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
                    },
                    cpu: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    }
                },
                connections: {
                    websocket_clients: server.clients.size,
                    mcp_connections: server.mcpConnections.size,
                    total: server.clients.size + server.mcpConnections.size
                },
                requests: {
                    rate_limit_window: server.config.rateLimit.windowMs,
                    rate_limit_max: server.config.rateLimit.max
                },
                prompt_manager: promptService ? promptService.getStatus() : null,
                server: {
                    version: '2.0.0',
                    mode: server.currentMode,
                    node_version: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            };

            success(res, metricsData);
        } catch (err) {
            console.error('Failed to get metrics:', err);
            error(res, 'Failed to retrieve metrics', 500);
        }
    });

    return router;
}

export default createHealthRoutes;