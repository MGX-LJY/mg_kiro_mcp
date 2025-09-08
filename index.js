#!/usr/bin/env node

/**
 * mg_kiro MCP Server Entry Point
 * Smart Project Documentation Management System
 * 完全集成的Express+WebSocket MCP协议服务器
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 服务组件导入
import ConfigService from './server/services/config-service.js';
import { PromptManager } from './server/prompt-manager.js';
import { ProjectScanner } from './server/analyzers/project-scanner.js';
import { WorkflowState } from './server/services/workflow-state-service.js';
import WorkflowService from './server/services/workflow-service.js';
import { EnhancedLanguageDetector } from './server/analyzers/enhanced-language-detector.js';
import { FileContentAnalyzer } from './server/analyzers/file-content-analyzer.js';
import UnifiedTemplateService from './server/services/unified-template-service.js';
import { createAppRoutes } from './server/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load configuration using unified ConfigService
 */
function loadConfig() {
  const configService = new ConfigService(join(__dirname, 'config'));
  const validation = configService.validate();
  
  if (!validation.valid) {
    console.error('❌ 配置验证失败:', validation.errors);
    process.exit(1);
  }
  
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => console.warn('⚠️', warning));
  }
  
  console.log('✅ 统一配置服务已加载');
  return {
    server: configService.getServerConfig(),
    mcp: configService.getMCPConfig(),
    prompt: configService.getPromptConfig(),
    workflow: configService.getWorkflowConfig(),
    analyzers: configService.getAnalyzersConfig(),
    configService // 传递完整服务实例
  };
}

/**
 * Create and configure Express app
 */
async function createApp(config = {}, wsManager = null) {
  const app = express();
  
  // 服务器配置
  const serverConfig = {
    port: process.env.MCP_PORT || config.port || 3000,
    host: process.env.MCP_HOST || config.host || 'localhost',
    cors: config.cors || { enabled: true, origins: ['http://localhost:*'] },
    rateLimit: config.rateLimit || { windowMs: 60000, max: 100 },
    ...config
  };

  // ========== 中间件设置 ==========
  
  app.use(helmet());
  app.use(compression());
  
  // CORS设置
  if (serverConfig.cors.enabled) {
    app.use(cors({
      origin: serverConfig.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 限流中间件
  const limiter = rateLimit({
    windowMs: serverConfig.rateLimit.windowMs,
    max: serverConfig.rateLimit.max
  });
  app.use(limiter);

  // 请求日志中间件
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ========== 服务初始化 ==========

  console.log('Initializing Prompt Manager...');
  const promptManager = new PromptManager({
    version: '2.0.0',
    cacheEnabled: true,
    watchFiles: true
  });
  console.log('Prompt Manager initialized');

  // 初始化项目扫描器和工作流状态
  const projectScanner = new ProjectScanner({
    maxDepth: 4,
    excludePatterns: ['.git', 'node_modules', '.DS_Store', '*.log']
  });

  const workflowState = new WorkflowState();
  const workflowService = new WorkflowService(workflowState);
  const enhancedLanguageDetector = new EnhancedLanguageDetector();
  const fileContentAnalyzer = new FileContentAnalyzer();
  
  // 初始化统一模板服务
  console.log('Initializing Unified Template Service...');
  const unifiedTemplateService = new UnifiedTemplateService();
  console.log('Unified Template Service initialized');

  // ========== 路由设置 ==========

  // 服务依赖注入 - 包含WebSocket管理器信息
  const services = {
    promptManager,
    workflowService,
    projectScanner,
    languageDetector: enhancedLanguageDetector,
    fileAnalyzer: fileContentAnalyzer,
    unifiedTemplateService,
    configService: { config: serverConfig }
  };

  // 创建服务器对象，包含WebSocket连接信息和分析器
  const serverObject = {
    config: serverConfig,
    currentMode: 'init',
    clients: wsManager ? wsManager.clients : new Map(),
    mcpConnections: wsManager ? wsManager.mcpConnections : new Map(),
    projectScanner,
    languageDetector: enhancedLanguageDetector,
    enhancedLanguageDetector,
    fileAnalyzer: fileContentAnalyzer,
    
    // WebSocket广播函数
    _broadcastModeChange(previousMode, newMode, context = {}) {
      const message = {
        type: 'modeChanged',
        previousMode,
        currentMode: newMode,
        context,
        timestamp: new Date().toISOString()
      };
      
      // 广播给所有WebSocket客户端
      if (this.clients) {
        this.clients.forEach((client, clientId) => {
          if (client.ws && client.ws.readyState === 1) {
            try {
              client.ws.send(JSON.stringify(message));
              console.log(`[WebSocket] Mode change broadcast sent to ${clientId}: ${previousMode} -> ${newMode}`);
            } catch (error) {
              console.error(`[WebSocket] Failed to broadcast mode change to ${clientId}:`, error);
            }
          }
        });
      }
      
      // 更新当前模式
      this.currentMode = newMode;
      console.log(`[Mode] Switched from ${previousMode} to ${newMode}`);
    }
  };

  // 集成模块化路由系统
  const appRoutes = createAppRoutes(services, serverObject);
  app.use('/', appRoutes);

  return {
    app,
    config: serverConfig,
    services,
    currentMode: 'init'
  };
}

/**
 * Setup WebSocket server
 */
function setupWebSocket(server, services) {
  const wsServer = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  const clients = new Map();
  const mcpConnections = new Map();

  wsServer.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const clientInfo = {
      id: clientId,
      ws: ws,
      connectedAt: new Date().toISOString(),
      lastPing: Date.now(),
      protocol: 'unknown',
      userAgent: req.headers['user-agent']
    };

    clients.set(clientId, clientInfo);
    
    console.log(`[WebSocket] Client connected: ${clientId} from ${req.socket.remoteAddress}`);

    // WebSocket消息处理
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(clientInfo, message, services);
      } catch (error) {
        console.error(`[WebSocket] Message handling error for ${clientId}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format'
        }));
      }
    });

    // 连接关闭处理
    ws.on('close', () => {
      clients.delete(clientId);
      mcpConnections.delete(clientId);
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
    });

    // 错误处理
    ws.on('error', (error) => {
      console.error(`[WebSocket] Connection error for ${clientId}:`, error);
      clients.delete(clientId);
      mcpConnections.delete(clientId);
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId: clientId,
      timestamp: new Date().toISOString(),
      serverInfo: {
        name: 'mg_kiro MCP Server',
        version: '2.0.0',
        protocol: 'MCP/1.0'
      }
    }));
  });

  // 心跳机制
  const heartbeatInterval = setInterval(() => {
    clients.forEach((client) => {
      if (Date.now() - client.lastPing > 60000) { // 60秒超时
        console.log(`[WebSocket] Client ${client.id} timed out, closing connection`);
        client.ws.terminate();
        clients.delete(client.id);
      } else if (client.ws.readyState === 1) {
        client.ws.ping();
      }
    });
  }, 30000); // 每30秒检查一次

  return {
    wsServer,
    clients,
    mcpConnections,
    heartbeatInterval,
    stop: () => {
      clearInterval(heartbeatInterval);
      wsServer.close();
    }
  };
}

/**
 * Handle WebSocket messages
 */
async function handleWebSocketMessage(clientInfo, message, services) {
  const { ws, id } = clientInfo;
  
  switch (message.type) {
    case 'ping':
      clientInfo.lastPing = Date.now();
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    case 'mcp_handshake':
      // MCP协议握手
      const handshakeResponse = {
        type: 'mcp_handshake_response',
        success: true,
        protocol: 'MCP/1.0',
        server: {
          name: 'mg_kiro MCP Server',
          version: '2.0.0'
        },
        capabilities: {
          prompts: true,
          resources: true,
          tools: true
        }
      };
      ws.send(JSON.stringify(handshakeResponse));
      break;

    case 'get_prompts':
      // 获取提示词列表
      try {
        const prompts = await services.promptManager.listPrompts();
        ws.send(JSON.stringify({
          type: 'prompts_response',
          prompts: prompts
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: `Unknown message type: ${message.type}`
      }));
  }
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(server, wsManager) {
  const shutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}, gracefully shutting down...`);
    try {
      // 停止WebSocket服务
      if (wsManager) {
        wsManager.stop();
      }
      
      // 关闭HTTP服务器
      await new Promise((resolve) => {
        server.close(resolve);
      });
      
      console.log('🛑 mg_kiro MCP Server stopped');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Start the MCP server
 */
async function startServer() {
  console.log('🤖 mg_kiro MCP Server Starting...\n');
  
  try {
    // Load configuration
    const config = loadConfig();
    console.log('📋 Configuration loaded');
    
    // Create HTTP server first (needed for WebSocket)
    const tempApp = express();
    const server = createServer(tempApp);
    
    // Setup WebSocket early so we have the connection managers
    const wsManager = setupWebSocket(server, {});
    
    // Now create Express app with WebSocket manager
    const { app, config: serverConfig } = await createApp(config.server, wsManager);
    
    // Replace the temp app with the real app
    server.removeAllListeners('request');
    server.on('request', app);
    
    // Setup graceful shutdown
    setupGracefulShutdown(server, wsManager);
    
    // Start listening
    await new Promise((resolve, reject) => {
      server.listen(serverConfig.port, serverConfig.host, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    console.log(`🚀 mg_kiro MCP Server started on ${serverConfig.host}:${serverConfig.port}`);
    console.log(`📡 WebSocket endpoint: ws://${serverConfig.host}:${serverConfig.port}/ws`);
    console.log(`🏥 Health check: http://${serverConfig.host}:${serverConfig.port}/health`);
    console.log(`📊 Metrics: http://${serverConfig.host}:${serverConfig.port}/metrics`);
    console.log('🔧 Current mode: init');
    
    console.log('\n✅ Server is ready and accepting connections!');
    console.log('📖 Available endpoints:');
    console.log(`   🏥 Health: http://${serverConfig.host}:${serverConfig.port}/health`);
    console.log(`   📊 Status: http://${serverConfig.host}:${serverConfig.port}/status`);
    console.log(`   🤝 Handshake: POST http://${serverConfig.host}:${serverConfig.port}/mcp/handshake`);
    console.log(`   💬 WebSocket: ws://${serverConfig.host}:${serverConfig.port}/ws`);
    console.log('\n🎯 Press Ctrl+C to stop the server\n');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  await startServer();
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { loadConfig, setupGracefulShutdown, main, createApp, setupWebSocket };