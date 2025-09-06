/**
 * MCP Server Core - mg_kiro MCP Server Core
 * Model Context Protocol Server Implementation
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

/**
 * MCP Server Class
 */
export class MCPServer {
  constructor(config = {}) {
    this.config = {
      port: process.env.MCP_PORT || config.port || 3000,
      host: process.env.MCP_HOST || config.host || 'localhost',
      cors: config.cors || { enabled: true, origins: ['http://localhost:*'] },
      rateLimit: config.rateLimit || { windowMs: 60000, max: 100 },
      ...config
    };
    
    this.app = express();
    this.server = createServer(this.app);
    this.wsServer = null;
    this.clients = new Map();
    this.mcpConnections = new Map();
    this.currentMode = 'init';
    this.heartbeatInterval = null;
    
    this._setupMiddleware();
    this._setupRoutes();
    this._setupWebSocket();
  }

  /**
   * Setup middleware
   */
  _setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());
    
    if (this.config.cors.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origins || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-MCP-Version']
      }));
    }
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);
    
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  _setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        mode: this.currentMode,
        connections: this.clients.size
      });
    });

    this.app.get('/status', (req, res) => {
      res.json({
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        mcp: {
          version: '1.0.0',
          mode: this.currentMode,
          connections: this.mcpConnections.size,
          clients: this.clients.size
        }
      });
    });

    this.app.post('/mcp/handshake', (req, res) => {
      try {
        const { version, clientId, capabilities } = req.body;
        
        if (!version || !this._isCompatibleVersion(version)) {
          return res.status(400).json({
            error: 'Unsupported MCP version',
            supportedVersions: ['1.0.0', '1.1.0']
          });
        }

        const connectionId = this._generateConnectionId();
        const connection = {
          id: connectionId,
          clientId: clientId || `client_${Date.now()}`,
          version,
          capabilities: capabilities || {},
          createdAt: new Date().toISOString(),
          lastHeartbeat: new Date().toISOString()
        };

        this.mcpConnections.set(connectionId, connection);
        
        res.json({
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
        });

        console.log(`MCP handshake successful: ${connectionId}`);
      } catch (error) {
        console.error('MCP handshake failed:', error);
        res.status(500).json({ error: 'Handshake failed' });
      }
    });

    this.app.get('/prompt/system', (req, res) => {
      res.json({
        status: 'success',
        data: {
          system_prompt: this._getSystemPrompt(),
          version: '2.0.0',
          mode: this.currentMode,
          timestamp: new Date().toISOString()
        }
      });
    });

    this.app.post('/mode/switch', (req, res) => {
      try {
        const { mode, context } = req.body;
        
        if (!['init', 'create', 'fix', 'analyze'].includes(mode)) {
          return res.status(400).json({
            error: 'Invalid mode',
            availableModes: ['init', 'create', 'fix', 'analyze']
          });
        }

        const previousMode = this.currentMode;
        this.currentMode = mode;

        this._broadcastModeChange(previousMode, mode, context);

        res.json({
          status: 'success',
          previousMode,
          currentMode: mode,
          timestamp: new Date().toISOString()
        });

        console.log(`Mode switched: ${previousMode} -> ${mode}`);
      } catch (error) {
        console.error('Mode switch failed:', error);
        res.status(500).json({ error: 'Mode switch failed' });
      }
    });

    this.app.get('/prompt/mode/:mode', (req, res) => {
      const { mode } = req.params;
      
      if (!['init', 'create', 'fix', 'analyze'].includes(mode)) {
        return res.status(404).json({ error: 'Mode not found' });
      }

      res.json({
        status: 'success',
        data: {
          mode,
          prompt: `Mode ${mode} prompt placeholder`,
          templates: this._getModeTemplates(mode),
          timestamp: new Date().toISOString()
        }
      });
    });

    this.app.post('/mcp/heartbeat', (req, res) => {
      const { connectionId } = req.body;
      const connection = this.mcpConnections.get(connectionId);
      
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      connection.lastHeartbeat = new Date().toISOString();
      res.json({ status: 'ok', timestamp: connection.lastHeartbeat });
    });

    this.app.use((error, req, res, next) => {
      console.error('Express error:', error);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });

    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        method: req.method,
        path: req.originalUrl
      });
    });
  }

  /**
   * Setup WebSocket server
   */
  _setupWebSocket() {
    this.wsServer = new WebSocketServer({ 
      server: this.server,
      path: '/ws',
      clientTracking: true
    });

    this.wsServer.on('connection', (ws, req) => {
      const clientId = this._generateClientId();
      
      this.clients.set(clientId, {
        ws,
        id: clientId,
        ip: req.socket.remoteAddress,
        connectedAt: new Date().toISOString(),
        lastPing: Date.now()
      });

      console.log(`WebSocket client connected: ${clientId}`);

      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        serverVersion: '2.0.0',
        currentMode: this.currentMode
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this._handleWebSocketMessage(clientId, message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
        }
      });

      ws.on('ping', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
          ws.pong();
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  _handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
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

  _broadcastModeChange(previousMode, currentMode, context) {
    const message = JSON.stringify({
      type: 'mode_change',
      previousMode,
      currentMode,
      context,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.subscriptions && client.subscriptions.has('mode_change')) {
        try {
          client.ws.send(message);
        } catch (error) {
          console.error(`Failed to send mode change to client:`, error);
        }
      }
    });
  }

  _startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000;

      for (const [id, connection] of this.mcpConnections) {
        const lastHeartbeat = new Date(connection.lastHeartbeat).getTime();
        if (now - lastHeartbeat > timeout) {
          console.log(`MCP connection timeout: ${id}`);
          this.mcpConnections.delete(id);
        }
      }

      for (const [id, client] of this.clients) {
        if (now - client.lastPing > timeout) {
          console.log(`WebSocket client timeout: ${id}`);
          client.ws.terminate();
          this.clients.delete(id);
        }
      }
    }, 10000);
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.config.port, this.config.host, () => {
          console.log(`🚀 mg_kiro MCP Server started on ${this.config.host}:${this.config.port}`);
          console.log(`📡 WebSocket endpoint: ws://${this.config.host}:${this.config.port}/ws`);
          console.log(`🏥 Health check: http://${this.config.host}:${this.config.port}/health`);
          console.log(`🔧 Current mode: ${this.currentMode}`);
          
          this._startHeartbeat();
          resolve(this);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      if (this.wsServer) {
        this.wsServer.close();
      }

      this.server.close(() => {
        console.log('🛑 mg_kiro MCP Server stopped');
        resolve();
      });
    });
  }

  _generateConnectionId() {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _isCompatibleVersion(version) {
    const supportedVersions = ['1.0.0', '1.1.0'];
    return supportedVersions.includes(version);
  }

  _getSystemPrompt() {
    return `mg_kiro MCP Server v2.0.0 - Smart Project Documentation Management System
Current mode: ${this.currentMode}
Supported modes: init, create, fix, analyze
Timestamp: ${new Date().toISOString()}`;
  }

  _getModeTemplates(mode) {
    const templates = {
      init: ['system-architecture', 'modules-catalog', 'dependencies'],
      create: ['module-template', 'user-stories', 'technical-analysis'],
      fix: ['action-items', 'changelog', 'technical-analysis'],
      analyze: ['technical-analysis', 'dependencies', 'system-architecture']
    };
    return templates[mode] || [];
  }
}

export default MCPServer;