/**
 * MCP协议路由模块
 * Model Context Protocol 握手和心跳端点
 */

import express from 'express';
import { success, error } from '../../utils/response.js';

/**
 * 创建MCP协议路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createMCPRoutes(services) {
    const router = express.Router();
    const { server } = services;

    /**
     * MCP握手协议
     * POST /mcp/handshake
     */
    router.post('/handshake', (req, res) => {
        try {
            const { version, clientId, capabilities } = req.body;
            
            if (!version || !_isCompatibleVersion(version)) {
                return error(res, 'Unsupported MCP version', 400, {
                    supportedVersions: ['1.0.0', '1.1.0']
                });
            }

            const connectionId = _generateConnectionId();
            const connection = {
                id: connectionId,
                clientId: clientId || `client_${Date.now()}`,
                version,
                capabilities: capabilities || {},
                createdAt: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString()
            };

            server.mcpConnections.set(connectionId, connection);
            
            const responseData = {
                connectionId,
                serverCapabilities: {
                    prompts: true,
                    templates: true,
                    modes: ['init', 'create', 'fix', 'analyze'],
                    realtime: true,
                    heartbeat: true
                },
                serverVersion: '2.0.0',
                mcpVersion: '1.0.0'
            };

            success(res, responseData);

            console.log(`MCP handshake successful: ${connectionId}`);
        } catch (err) {
            console.error('MCP handshake failed:', err);
            error(res, 'Handshake failed', 500);
        }
    });

    /**
     * MCP心跳检查
     * POST /mcp/heartbeat
     */
    router.post('/heartbeat', (req, res) => {
        const { connectionId } = req.body;
        const connection = server.mcpConnections.get(connectionId);
        
        if (!connection) {
            return error(res, 'Connection not found', 404);
        }

        connection.lastHeartbeat = new Date().toISOString();
        
        success(res, {
            status: 'ok',
            timestamp: connection.lastHeartbeat
        });
    });

    return router;
}

/**
 * 检查MCP版本兼容性
 * @param {string} version - 客户端版本
 * @returns {boolean} 是否兼容
 */
function _isCompatibleVersion(version) {
    const supportedVersions = ['1.0.0', '1.1.0'];
    return supportedVersions.includes(version);
}

/**
 * 生成MCP连接ID
 * @returns {string} 连接ID
 */
function _generateConnectionId() {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default createMCPRoutes;