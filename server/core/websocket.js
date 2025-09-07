/**
 * WebSocket服务器处理模块
 * 处理WebSocket连接、消息和心跳检测
 */

import { WebSocketServer } from 'ws';

/**
 * 创建和配置WebSocket服务器
 * @param {Object} server - HTTP服务器实例
 * @param {Object} mcpServer - MCP服务器实例
 * @returns {WebSocketServer} WebSocket服务器实例
 */
export function createWebSocketServer(server, mcpServer) {
    const wsServer = new WebSocketServer({ 
        server,
        path: '/ws',
        clientTracking: true
    });

    // 设置WebSocket事件处理
    setupWebSocketHandlers(wsServer, mcpServer);
    
    return wsServer;
}

/**
 * 设置WebSocket事件处理器
 * @param {WebSocketServer} wsServer - WebSocket服务器实例
 * @param {Object} mcpServer - MCP服务器实例
 */
function setupWebSocketHandlers(wsServer, mcpServer) {
    wsServer.on('connection', (ws, req) => {
        const clientId = generateClientId();
        
        // 注册客户端
        mcpServer.clients.set(clientId, {
            ws,
            id: clientId,
            ip: req.socket.remoteAddress,
            connectedAt: new Date().toISOString(),
            lastPing: Date.now()
        });

        console.log(`WebSocket client connected: ${clientId}`);

        // 发送欢迎消息
        ws.send(JSON.stringify({
            type: 'welcome',
            clientId,
            serverVersion: '2.0.0',
            currentMode: mcpServer.currentMode
        }));

        // 处理消息
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleWebSocketMessage(clientId, message, mcpServer);
            } catch (error) {
                console.error('WebSocket message parse error:', error);
                ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
            }
        });

        // 处理ping
        ws.on('ping', () => {
            const client = mcpServer.clients.get(clientId);
            if (client) {
                client.lastPing = Date.now();
                ws.pong();
            }
        });

        // 处理断开连接
        ws.on('close', () => {
            console.log(`WebSocket client disconnected: ${clientId}`);
            mcpServer.clients.delete(clientId);
        });

        // 处理错误
        ws.on('error', (error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
            mcpServer.clients.delete(clientId);
        });
    });
}

/**
 * 处理WebSocket消息
 * @param {string} clientId - 客户端ID
 * @param {Object} message - 消息内容
 * @param {Object} mcpServer - MCP服务器实例
 */
function handleWebSocketMessage(clientId, message, mcpServer) {
    const client = mcpServer.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
        case 'subscribe':
            client.subscriptions = client.subscriptions || new Set();
            client.subscriptions.add(message.event);
            client.ws.send(JSON.stringify({
                type: 'subscribed',
                event: message.event
            }));
            break;

        case 'unsubscribe':
            if (client.subscriptions) {
                client.subscriptions.delete(message.event);
            }
            client.ws.send(JSON.stringify({
                type: 'unsubscribed',
                event: message.event
            }));
            break;

        case 'ping':
            client.ws.send(JSON.stringify({ type: 'pong' }));
            break;

        default:
            client.ws.send(JSON.stringify({
                type: 'error',
                error: `Unknown message type: ${message.type}`
            }));
    }
}

/**
 * 广播模式变更消息
 * @param {Map} clients - 客户端映射
 * @param {string} previousMode - 前一个模式
 * @param {string} currentMode - 当前模式
 * @param {Object} context - 上下文信息
 */
export function broadcastModeChange(clients, previousMode, currentMode, context) {
    const message = JSON.stringify({
        type: 'mode_change',
        previousMode,
        currentMode,
        context,
        timestamp: new Date().toISOString()
    });

    clients.forEach((client) => {
        if (client.subscriptions && client.subscriptions.has('mode_change')) {
            try {
                client.ws.send(message);
            } catch (error) {
                console.error(`Failed to send mode change to client:`, error);
            }
        }
    });
}

/**
 * 启动心跳检测
 * @param {Map} clients - WebSocket客户端映射
 * @param {Map} mcpConnections - MCP连接映射
 * @returns {NodeJS.Timer} 心跳定时器
 */
export function startHeartbeat(clients, mcpConnections) {
    return setInterval(() => {
        const now = Date.now();
        const timeout = 30000; // 30秒超时

        // 检查MCP连接超时
        for (const [id, connection] of mcpConnections) {
            const lastHeartbeat = new Date(connection.lastHeartbeat).getTime();
            if (now - lastHeartbeat > timeout) {
                console.log(`MCP connection timeout: ${id}`);
                mcpConnections.delete(id);
            }
        }

        // 检查WebSocket客户端超时
        for (const [id, client] of clients) {
            if (now - client.lastPing > timeout) {
                console.log(`WebSocket client timeout: ${id}`);
                client.ws.terminate();
                clients.delete(id);
            }
        }
    }, 10000); // 每10秒检查一次
}

/**
 * 生成客户端ID
 * @returns {string} 客户端ID
 */
function generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default createWebSocketServer;