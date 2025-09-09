/**
 * 健康检查和监控路由模块 (简化版)
 * 专为新的Claude Code Init架构设计
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';

/**
 * 创建健康检查路由 (简化版)
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createHealthRoutes(services) {
    const router = express.Router();

    /**
     * 基础健康检查
     * GET /health
     */
    router.get('/health', (req, res) => {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.1',
            mode: 'claude-code-init',
            connections: 0,
            architecture: 'simplified'
        };

        success(res, healthData);
    });

    /**
     * 详细系统状态
     * GET /status
     */
    router.get('/status', (req, res) => {
        try {
            const statusData = {
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    version: '2.0.1',
                    mode: 'claude-code-init'
                },
                mcp: {
                    version: '1.0.0',
                    protocol: 'stdio',
                    available_tools: 7,
                    status: 'active'
                },
                services: {
                    total: services.getStats ? services.getStats().initializedServices : 10,
                    available: [
                        'claudeCodeInit',
                        'promptManager', 
                        'projectScanner',
                        'languageDetector',
                        'fileAnalyzer',
                        'configService'
                    ]
                }
            };

            success(res, statusData);
        } catch (err) {
            console.error('Failed to get status:', err);
            return error(res, 'Failed to retrieve status', 500);
        }
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
                system: {
                    version: '2.0.1',
                    mode: 'claude-code-init',
                    node_version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                services: {
                    total_services: services.getStats ? services.getStats().initializedServices : 10,
                    service_status: 'healthy'
                }
            };

            success(res, metricsData);
        } catch (err) {
            console.error('Failed to get metrics:', err);
            return error(res, 'Failed to retrieve metrics', 500);
        }
    });

    /**
     * 服务诊断信息
     * GET /diagnostic
     */
    router.get('/diagnostic', (req, res) => {
        try {
            const diagnosticData = {
                architecture: {
                    type: 'claude-code-init',
                    version: '2.0.1',
                    features: [
                        'MCP协议支持',
                        '5步Init流程',
                        '智能语言检测',
                        '项目结构分析',
                        '文档生成数据准备'
                    ]
                },
                environment: {
                    node_version: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    uptime: process.uptime()
                },
                services: {
                    registry: 'ServiceBus',
                    dependency_injection: 'enabled',
                    service_count: services.getStats ? services.getStats().initializedServices : 10
                },
                endpoints: {
                    health: 'GET /health',
                    status: 'GET /status', 
                    metrics: 'GET /metrics',
                    init: 'POST /init/*',
                    services: 'GET /services/*'
                }
            };

            success(res, diagnosticData);
        } catch (err) {
            console.error('Failed to get diagnostic:', err);
            return error(res, 'Failed to retrieve diagnostic', 500);
        }
    });

    return router;
}

/**
 * 简化版健康检查特点：
 * 
 * 1. **无依赖**: 不依赖复杂的server对象状态
 * 2. **安全**: 所有属性访问都有错误处理
 * 3. **简洁**: 专注于核心监控指标
 * 4. **兼容**: 与新的Claude Code Init架构完全兼容
 * 5. **诊断**: 提供详细的系统诊断信息
 */

export default createHealthRoutes;