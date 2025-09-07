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
import { PromptManager } from './prompt-manager.js';
import { ProjectScanner } from './analyzers/project-scanner.js';
import { WorkflowState } from './workflow/workflow-state.js';
import { EnhancedLanguageDetector } from './analyzers/enhanced-language-detector.js';

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
    
    // Initialize Prompt Manager
    this.promptManager = new PromptManager({
      version: '2.0.0',
      cacheEnabled: true,
      watchFiles: true
    });
    
    // Initialize Project Scanner and Workflow State
    this.projectScanner = new ProjectScanner({
      maxDepth: 4,
      enableCaching: true,
      maxFiles: 1000
    });
    
    this.workflowState = new WorkflowState();
    
    // Initialize Enhanced Language Detector
    this.enhancedLanguageDetector = new EnhancedLanguageDetector({
      enableDeepAnalysis: true,
      maxFilesToAnalyze: 15,
      confidenceThreshold: 60
    });
    
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

    this.app.get('/metrics', (req, res) => {
      try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        res.json({
          status: 'success',
          data: {
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
              websocket_clients: this.clients.size,
              mcp_connections: this.mcpConnections.size,
              total: this.clients.size + this.mcpConnections.size
            },
            requests: {
              rate_limit_window: this.config.rateLimit.windowMs,
              rate_limit_max: this.config.rateLimit.max
            },
            prompt_manager: this.promptManager ? this.promptManager.getStatus() : null,
            server: {
              version: '2.0.0',
              mode: this.currentMode,
              node_version: process.version,
              platform: process.platform,
              arch: process.arch
            }
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to get metrics:', error);
        res.status(500).json({
          status: 'error',
          error: 'Failed to retrieve metrics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // ========== Init模式工作流API - 第1步：项目结构分析 ==========
    
    // 第1步-A: 扫描项目结构
    this.app.post('/mode/init/scan-structure', async (req, res) => {
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
        const workflowId = this.workflowState.createWorkflow(projectPath, 'init');
        
        // 更新步骤状态为运行中
        this.workflowState.updateStep(workflowId, 0, 'running');
        
        // 执行项目扫描
        const scanResult = await this.projectScanner.scanProject(projectPath);
        
        // 更新步骤状态为已完成
        this.workflowState.updateStep(workflowId, 0, 'completed', scanResult);
        
        res.json({
          success: true,
          step: 1,
          stepName: 'scan_structure',
          data: scanResult,
          workflowId,
          workflowProgress: this.workflowState.getProgress(workflowId),
          nextStep: this.workflowState.getNextStep(this.workflowState.getWorkflow(workflowId))
        });

        console.log(`[MCP-API] 项目结构扫描完成: ${projectPath} (${scanResult.scanDuration}ms)`);
        
      } catch (error) {
        console.error('[MCP-API] 项目结构扫描失败:', error);
        
        // 更新步骤状态为失败
        if (req.workflowId) {
          this.workflowState.updateStep(req.workflowId, 0, 'failed', null, error.message);
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
    this.app.get('/mode/init/structure-summary', async (req, res) => {
      try {
        const { workflowId } = req.query;
        
        if (!workflowId) {
          return res.status(400).json({
            success: false,
            error: '工作流ID不能为空'
          });
        }

        const workflow = this.workflowState.getWorkflow(workflowId);
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
        const summary = {
          project: {
            path: scanResult.projectPath,
            name: scanResult.projectPath.split('/').pop(),
            scanDuration: scanResult.scanDuration,
            timestamp: scanResult.timestamp
          },
          structure: {
            totalFiles: scanResult.structure?.totalFiles || 0,
            totalDirectories: scanResult.structure?.totalDirectories || 0,
            maxDepth: this.projectScanner.getMaxDepth(scanResult.structure),
            mainDirectories: scanResult.structure?.directories || []
          },
          analysis: {
            complexity: scanResult.analysis?.complexity || 'unknown',
            scale: scanResult.analysis?.scale || 'unknown',
            maturity: scanResult.analysis?.maturity || 'unknown',
            projectType: scanResult.analysis?.projectType || 'unknown',
            developmentStage: scanResult.analysis?.developmentStage || 'unknown'
          },
          techs: {
            detectedLanguages: scanResult.configs?.detected || [],
            techStackHints: scanResult.analysis?.techStackHints || [],
            frameworks: this.extractFrameworks(scanResult)
          },
          docs: {
            hasReadme: scanResult.readme?.found || false,
            readmeAnalysis: scanResult.readme?.analysis || null
          },
          recommendations: scanResult.workflowContext?.nextStepRecommendations || []
        };

        res.json({
          success: true,
          step: 1,
          stepName: 'structure_summary',
          workflowId,
          summary,
          workflowProgress: this.workflowState.getProgress(workflowId)
        });

      } catch (error) {
        console.error('[MCP-API] 获取项目结构摘要失败:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 工作流状态管理API
    this.app.get('/workflow/status/:workflowId', async (req, res) => {
      try {
        const { workflowId } = req.params;
        const progress = this.workflowState.getProgress(workflowId);
        
        if (!progress) {
          return res.status(404).json({
            success: false,
            error: `工作流不存在: ${workflowId}`
          });
        }

        res.json({
          success: true,
          progress
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // ========== Init模式工作流API - 第2步：智能语言识别 ==========
    
    // 第2步-A: 启动语言检测引擎
    this.app.post('/mode/init/detect-language', async (req, res) => {
      try {
        const { workflowId, projectPath } = req.body;
        
        if (!workflowId) {
          return res.status(400).json({
            success: false,
            error: '工作流ID不能为空'
          });
        }

        const workflow = this.workflowState.getWorkflow(workflowId);
        if (!workflow) {
          return res.status(404).json({
            success: false,
            error: `工作流不存在: ${workflowId}`
          });
        }

        // 检查第1步是否完成
        if (workflow.currentStep < 1) {
          return res.status(400).json({
            success: false,
            error: '请先完成第1步项目结构分析'
          });
        }

        const step1Results = workflow.results.step_1;
        const projectPathToUse = projectPath || workflow.projectPath;

        console.log(`[MCP-API] 开始智能语言检测: ${projectPathToUse}`);
        
        // 更新步骤状态为运行中
        this.workflowState.updateStep(workflowId, 1, 'running');
        
        // 执行增强语言检测
        const detectionResult = await this.enhancedLanguageDetector.detectLanguageEnhanced(
          projectPathToUse,
          step1Results,
          { workflowId, mode: 'init' }
        );
        
        // 更新步骤状态为已完成
        this.workflowState.updateStep(workflowId, 1, 'completed', detectionResult);
        
        res.json({
          success: true,
          step: 2,
          stepName: 'detect_language',
          data: detectionResult,
          workflowId,
          workflowProgress: this.workflowState.getProgress(workflowId),
          nextStep: this.workflowState.getNextStep(this.workflowState.getWorkflow(workflowId))
        });

        console.log(`[MCP-API] 智能语言检测完成: ${projectPathToUse} (${detectionResult.analysisDuration}ms)`);
        
      } catch (error) {
        console.error('[MCP-API] 智能语言检测失败:', error);
        
        // 更新步骤状态为失败
        if (req.body.workflowId) {
          this.workflowState.updateStep(req.body.workflowId, 1, 'failed', null, error.message);
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
    this.app.get('/mode/init/language-report', async (req, res) => {
      try {
        const { workflowId } = req.query;
        
        if (!workflowId) {
          return res.status(400).json({
            success: false,
            error: '工作流ID不能为空'
          });
        }

        const workflow = this.workflowState.getWorkflow(workflowId);
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
        const report = {
          // 核心检测结果
          detection: {
            primaryLanguage: detectionResult.detection.primaryLanguage,
            secondaryLanguages: detectionResult.detection.secondaryLanguages,
            confidence: detectionResult.workflowIntegration.confidenceScore
          },
          
          // 技术栈生态
          techStack: {
            frameworks: detectionResult.detection.techStack.frameworks,
            buildTools: detectionResult.detection.techStack.buildTools,
            packageManagers: detectionResult.detection.techStack.packageManagers,
            testing: detectionResult.detection.techStack.testing
          },
          
          // 项目特征
          projectProfile: {
            type: detectionResult.detection.projectCharacteristics.type,
            scale: detectionResult.detection.projectCharacteristics.scale,
            maturity: detectionResult.detection.projectCharacteristics.maturity,
            complexity: detectionResult.detection.projectCharacteristics.complexity
          },
          
          // 开发环境建议
          environment: {
            recommended: detectionResult.detection.developmentEnvironment.recommended,
            currentSetup: detectionResult.detection.developmentEnvironment.currentSetup,
            missingComponents: detectionResult.detection.developmentEnvironment.missingComponents
          },
          
          // 分析质量
          analysisQuality: {
            dataQuality: detectionResult.workflowIntegration.dataQuality,
            enhancementGain: detectionResult.workflowIntegration.enhancementGain,
            step1Integration: detectionResult.workflowIntegration.step1Integration
          },
          
          // 工作流建议
          recommendations: detectionResult.detection.nextStepRecommendations,
          
          // 元信息
          metadata: {
            analysisId: detectionResult.analysisId,
            analysisDuration: detectionResult.analysisDuration,
            timestamp: detectionResult.timestamp,
            step3Readiness: detectionResult.workflowIntegration.readinessForStep3
          }
        };

        res.json({
          success: true,
          step: 2,
          stepName: 'language_report',
          workflowId,
          report,
          workflowProgress: this.workflowState.getProgress(workflowId)
        });

      } catch (error) {
        console.error('[MCP-API] 获取语言检测报告失败:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
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

    this.app.get('/prompt/system', async (req, res) => {
      try {
        const variables = {
          project_name: 'mg_kiro MCP Server',
          current_mode: this.currentMode
        };
        
        const systemPrompt = await this.promptManager.loadPrompt('modes', 'init', variables);
        
        res.json({
          status: 'success',
          data: {
            system_prompt: systemPrompt.content,
            metadata: systemPrompt.metadata,
            version: '2.0.0',
            mode: this.currentMode,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to load system prompt:', error);
        res.status(500).json({
          status: 'error',
          error: 'Failed to load system prompt',
          fallback: this._getSystemPrompt()
        });
      }
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

        // Update prompt manager's current mode
        this.promptManager.setGlobalVariable('current_mode', () => mode);

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

    this.app.get('/prompt/mode/:mode', async (req, res) => {
      try {
        const { mode } = req.params;
        
        if (!['init', 'create', 'fix', 'analyze'].includes(mode)) {
          return res.status(404).json({ error: 'Mode not found' });
        }

        const variables = {
          project_name: 'mg_kiro MCP Server',
          current_mode: mode
        };

        const modePrompt = await this.promptManager.loadPrompt('modes', mode, variables);

        res.json({
          status: 'success',
          data: {
            mode,
            prompt: modePrompt.content,
            metadata: modePrompt.metadata,
            templates: this._getModeTemplates(mode),
            version: modePrompt.version,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error(`Failed to load prompt for mode ${req.params.mode}:`, error);
        res.status(500).json({
          status: 'error',
          error: `Failed to load prompt for mode ${req.params.mode}`,
          fallback: {
            mode: req.params.mode,
            prompt: `Mode ${req.params.mode} prompt placeholder`,
            templates: this._getModeTemplates(req.params.mode)
          }
        });
      }
    });

    // Prompt management endpoints
    this.app.get('/prompts/list', async (req, res) => {
      try {
        const { category } = req.query;
        const prompts = await this.promptManager.listPrompts(category);
        
        res.json({
          status: 'success',
          data: prompts,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to list prompts:', error);
        res.status(500).json({
          status: 'error',
          error: 'Failed to list prompts'
        });
      }
    });

    this.app.get('/prompts/status', (req, res) => {
      try {
        const status = this.promptManager.getStatus();
        
        res.json({
          status: 'success',
          data: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to get prompt manager status:', error);
        res.status(500).json({
          status: 'error',
          error: 'Failed to get prompt manager status'
        });
      }
    });

    this.app.post('/prompts/cache/clear', (req, res) => {
      try {
        this.promptManager.clearCache();
        
        res.json({
          status: 'success',
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to clear cache:', error);
        res.status(500).json({
          status: 'error',
          error: 'Failed to clear cache'
        });
      }
    });

    this.app.get('/template/:name', async (req, res) => {
      try {
        const { name } = req.params;
        const { variables } = req.query;
        
        const parsedVariables = variables ? JSON.parse(variables) : {};
        const template = await this.promptManager.loadPrompt('templates', name, parsedVariables);
        
        res.json({
          status: 'success',
          data: template,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to load template ${req.params.name}:`, error);
        res.status(404).json({
          status: 'error',
          error: 'Template not found'
        });
      }
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
          console.log(`📊 Metrics: http://${this.config.host}:${this.config.port}/metrics`);
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

      // Cleanup prompt manager
      if (this.promptManager) {
        this.promptManager.destroy();
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

  /**
   * 从扫描结果中提取框架信息
   * @param {Object} scanResult - 项目扫描结果
   * @returns {Array} 检测到的框架列表
   */
  extractFrameworks(scanResult) {
    const frameworks = [];
    
    try {
      // 从配置文件中提取框架信息
      const jsConfigs = scanResult.configs?.byLanguage?.javascript;
      if (jsConfigs && jsConfigs.length > 0) {
        for (const config of jsConfigs) {
          if (config.analysis?.frameworks) {
            frameworks.push(...config.analysis.frameworks);
          }
        }
      }
      
      // 从README分析中提取技术栈信息
      const techStack = scanResult.readme?.analysis?.techStack;
      if (techStack) {
        frameworks.push(...techStack);
      }
      
      // 去重并返回
      return [...new Set(frameworks)];
    } catch (error) {
      console.error('提取框架信息失败:', error);
      return [];
    }
  }
}

export default MCPServer;