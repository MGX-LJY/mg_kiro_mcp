/**
 * HTTP服务器核心模块
 * 处理服务器创建、启动和关闭
 */

import { createServer } from 'http';
import { createApp } from './app.js';
import { createWebSocketServer, startHeartbeat } from './websocket.js';

/**
 * 创建HTTP服务器
 * @param {Object} config - 服务器配置
 * @param {Object} services - 服务依赖
 * @param {Object} mcpServer - MCP服务器实例
 * @returns {Object} 服务器实例和控制方法
 */
export function createHTTPServer(config, services, mcpServer) {
    // 创建Express应用
    const app = createApp(config, services, mcpServer);
    
    // 创建HTTP服务器
    const server = createServer(app);
    
    // 创建WebSocket服务器
    const wsServer = createWebSocketServer(server, mcpServer);
    
    // 启动心跳检测
    let heartbeatInterval = null;
    
    return {
        server,
        wsServer,
        app,
        
        /**
         * 启动服务器
         * @returns {Promise} 启动Promise
         */
        async start() {
            return new Promise((resolve, reject) => {
                try {
                    server.listen(config.port, config.host, () => {
                        console.log(`🚀 mg_kiro MCP Server started on ${config.host}:${config.port}`);
                        console.log(`📡 WebSocket endpoint: ws://${config.host}:${config.port}/ws`);
                        console.log(`🏥 Health check: http://${config.host}:${config.port}/health`);
                        console.log(`📊 Metrics: http://${config.host}:${config.port}/metrics`);
                        console.log(`🔧 Current mode: ${mcpServer.currentMode}`);
                        
                        // 启动心跳检测
                        heartbeatInterval = startHeartbeat(mcpServer.clients, mcpServer.mcpConnections);
                        
                        resolve(this);
                    });
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        /**
         * 停止服务器
         * @returns {Promise} 停止Promise
         */
        async stop() {
            return new Promise((resolve) => {
                console.log('🛑 Shutting down mg_kiro MCP Server...');
                
                // 停止心跳检测
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }

                // 关闭WebSocket服务器
                if (wsServer) {
                    wsServer.close(() => {
                        console.log('📡 WebSocket server closed');
                    });
                }

                // 清理服务
                if (services.promptService) {
                    services.promptService.destroy();
                }

                // 关闭HTTP服务器
                server.close(() => {
                    console.log('🛑 mg_kiro MCP Server stopped');
                    resolve();
                });
            });
        },

        /**
         * 优雅关闭服务器
         * @param {number} timeout - 超时时间(毫秒)
         * @returns {Promise} 关闭Promise
         */
        async gracefulShutdown(timeout = 10000) {
            return new Promise((resolve) => {
                console.log('🔄 Starting graceful shutdown...');
                
                let completed = false;
                
                // 设置超时
                const shutdownTimeout = setTimeout(() => {
                    if (!completed) {
                        console.log('⚠️ Graceful shutdown timeout, forcing exit...');
                        process.exit(1);
                    }
                }, timeout);
                
                // 执行优雅关闭
                this.stop().then(() => {
                    completed = true;
                    clearTimeout(shutdownTimeout);
                    resolve();
                }).catch((error) => {
                    completed = true;
                    clearTimeout(shutdownTimeout);
                    console.error('❌ Error during graceful shutdown:', error);
                    resolve();
                });
            });
        }
    };
}

/**
 * 设置进程信号处理
 * @param {Object} serverInstance - 服务器实例
 */
export function setupProcessHandlers(serverInstance) {
    // 处理优雅关闭信号
    process.on('SIGTERM', async () => {
        console.log('📨 Received SIGTERM signal');
        await serverInstance.gracefulShutdown();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('📨 Received SIGINT signal');
        await serverInstance.gracefulShutdown();
        process.exit(0);
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        serverInstance.gracefulShutdown().then(() => {
            process.exit(1);
        });
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        serverInstance.gracefulShutdown().then(() => {
            process.exit(1);
        });
    });
}

export default createHTTPServer;