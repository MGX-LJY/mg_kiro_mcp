/**
 * MCP Server 主入口文件
 * mg_kiro MCP Server v2.0.0 - 重构版启动入口
 */

import MCPServer from './mcp-server-new.js';

/**
 * 启动MCP服务器
 * @returns {Promise<void>}
 */
async function startServer() {
    try {
        console.log('🚀 启动 mg_kiro MCP Server v2.0.0 (重构版)...');
        
        // 服务器配置
        const config = {
            port: process.env.MCP_PORT || 3000,
            host: process.env.MCP_HOST || 'localhost',
            cors: { 
                enabled: true, 
                origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:*'] 
            },
            rateLimit: { 
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, 
                max: parseInt(process.env.RATE_LIMIT_MAX) || 100 
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                enabled: process.env.LOG_ENABLED !== 'false'
            }
        };

        // 创建并启动服务器
        const server = new MCPServer(config);
        await server.start();
        
        console.log('✅ mg_kiro MCP Server 启动成功!');
        console.log('📚 架构: 分层模块化设计');
        console.log('🎯 模式: Init | Create | Fix | Analyze');
        console.log('🔧 服务: 工作流 | 语言检测 | 提示词管理');
        
        // 返回服务器实例供测试使用
        return server;
        
    } catch (error) {
        console.error('❌ 启动 mg_kiro MCP Server 失败:', error);
        process.exit(1);
    }
}

// 如果作为主模块运行，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer().catch((error) => {
        console.error('💥 服务器启动异常:', error);
        process.exit(1);
    });
}

export { startServer };
export default startServer;