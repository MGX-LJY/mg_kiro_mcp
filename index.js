#!/usr/bin/env node

/**
 * mg_kiro MCP Server
 * 统一入口点 - MCP协议服务器 + Express API + WebSocket
 * 
 * 支持两种运行模式:
 * 1. MCP服务器模式: node index.js (MCP服务器运行在stdio)
 * 2. Express服务器模式: MCP_PORT=3000 node index.js (Web服务器运行在指定端口)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createAppRoutes } from './server/routes/index.js';
import { initializeServices, getServices } from './server/services/service-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_DIR = join(__dirname, 'config');

// ========== 服务容器包装器 ==========
function getServiceContainer(serviceBus) {
  return {
    // 新的统一模板系统
    masterTemplateService: serviceBus.get('masterTemplateService'),
    templateConfigManager: serviceBus.get('templateConfigManager'),
    
    // 其他核心服务
    projectScanner: serviceBus.get('projectScanner'),
    languageDetector: serviceBus.get('enhancedLanguageDetector'),
    fileAnalyzer: serviceBus.get('fileContentAnalyzer'),
    languageIntelligence: serviceBus.get('languageIntelligence'),
    configService: serviceBus.get('configService'),
    
    // Create模式所需服务
    aiTodoManager: serviceBus.get('aiTodoManager'),
    completeTaskMonitor: serviceBus.get('completeTaskMonitor'),
    
    // 向后兼容的别名（指向新服务）
    promptService: serviceBus.get('masterTemplateService'),
    unifiedTemplateService: serviceBus.get('masterTemplateService'),
    
    // ServiceBus工具方法
    getService: (name) => serviceBus.get(name),
    getServiceStatus: (name) => serviceBus.getServiceStatus(name),
    getStats: () => serviceBus.getStats(),
    getAllServices: () => serviceBus.getAllServices()
  };
}

// ========== 服务器模式 ==========
startServer();

async function startServer() {
  // 初始化服务系统
  console.log('[Server] 初始化服务系统...');
  const serviceBus = await initializeServices(CONFIG_DIR);

  // ========== Express服务器设置 ==========
  const PORT = process.env.MCP_PORT || process.env.PORT;
  
  if (PORT) {
    // Express服务器模式
    console.log('[Server] 启动Express服务器模式...');
    
    const app = express();
    const httpServer = http.createServer(app);

    // 中间件配置
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true }));

    // 请求日志
    app.use((req, res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`);
      next();
    });

    // 创建服务容器并生成路由
    const serviceContainer = getServiceContainer(serviceBus);
    const routes = createAppRoutes(serviceContainer, null);
    app.use('/', routes);

    // WebSocket服务器
    const wss = new WebSocketServer({ server: httpServer });
    
    wss.on('connection', (ws) => {
      console.log('[WebSocket] 新客户端连接');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('[WebSocket] 收到消息:', data.type || 'unknown');
          
          // 处理WebSocket消息
          handleWebSocketMessage(ws, data, serviceBus);
        } catch (error) {
          console.error('[WebSocket] 消息处理错误:', error);
          ws.send(JSON.stringify({ error: error.message }));
        }
      });
      
      ws.on('close', () => {
        console.log('[WebSocket] 客户端断开连接');
      });
    });

    // 启动HTTP服务器
    httpServer.listen(PORT, () => {
      console.log(`\n✅ mg_kiro Express服务器已启动`);
      console.log(`📡 HTTP服务: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket服务: ws://localhost:${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
      console.log(`\n可用的端点 (精简版 3.0):`);
      console.log(`  - GET  /health - 健康检查`);
      console.log(`  - POST /init/project-overview - 生成项目概览包`);
      console.log(`  - POST /init/progressive-documentation - 渐进式文档生成`);
      console.log(`  - GET  /init/status - 获取Init状态`);
      console.log(`  - GET  /init/help - API帮助信息`);
      console.log(`\nMCP工具:`);
      console.log(`  - generate_project_overview - 生成项目概览`);
      console.log(`  - progressive_documentation - 渐进式文档生成`);
    });
  }

  // ========== MCP服务器设置 ==========
  console.log('[Server] 启动MCP协议服务器...');
  
  const server = new Server(
    {
      name: "mg_kiro",
      version: "3.0.0-simplified",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // MCP工具：精简版2步Init流程
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "generate_project_overview",
          description: "生成项目概览包：语言分析+依赖分析+目录结构+README+核心文件内容，为AI提供完整项目上下文",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "要分析的项目根目录路径（绝对路径）"
              },
              maxDepth: {
                type: "number",
                description: "目录扫描最大深度，默认3层",
                default: 3
              },
              includeFiles: {
                type: "array",
                description: "额外要包含的文件模式列表",
                items: { type: "string" },
                default: []
              },
              maxKeyFileSize: {
                type: "number",
                description: "关键文件内容的最大字节数，默认50KB",
                default: 51200
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "progressive_documentation",
          description: "启动渐进式文档生成：AI协作流程，从项目概览到完整文档体系（文件文档→模块文档→集成文档→最终架构文档）",
          inputSchema: {
            type: "object",
            properties: {
              batchSize: {
                type: "string",
                description: "每批次处理的数据大小，如'80KB'，默认'80KB'",
                default: "80KB"
              },
              style: {
                type: "string",
                description: "文档风格：comprehensive(全面) | concise(简洁) | technical(技术导向)",
                enum: ["comprehensive", "concise", "technical"],
                default: "comprehensive"
              },
              focusAreas: {
                type: "array",
                description: "重点关注的领域列表",
                items: { type: "string" },
                default: []
              },
              includeTests: {
                type: "boolean",
                description: "是否包含测试文件分析，默认true",
                default: true
              }
            },
            required: []
          }
        },
        {
          name: "get_init_status",
          description: "获取当前Init流程的状态、进度和健康信息",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "reset_init",
          description: "重置Init流程，清除所有缓存状态",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        }
      ]
    };
  });

  // 处理工具调用 - 精简版
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const claudeCodeInit = serviceBus.get('claudeCodeInit');

    try {
      switch (name) {
        case "generate_project_overview": {
          const { projectPath, maxDepth, includeFiles, maxKeyFileSize } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Simplified] 生成项目概览 - ${projectPath}`);
          
          const result = await claudeCodeInit.generateProjectOverview(
            resolve(projectPath),
            {
              maxDepth: maxDepth || 3,
              includeFiles: includeFiles || [],
              maxKeyFileSize: maxKeyFileSize || 50 * 1024
            }
          );
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        
        case "progressive_documentation": {
          console.log(`[MCP-Simplified] 启动渐进式文档生成`);
          
          const { batchSize, style, focusAreas, includeTests } = args;
          
          const result = await claudeCodeInit.progressiveDocumentation({
            batchSize: batchSize || '80KB',
            style: style || 'comprehensive',
            focusAreas: focusAreas || [],
            includeTests: includeTests !== false
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        
        case "get_init_status": {
          console.log(`[MCP-Simplified] 获取状态信息`);
          
          const state = claudeCodeInit.getState();
          const progress = claudeCodeInit.getProgress();
          const health = claudeCodeInit.healthCheck();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  state,
                  progress,
                  health,
                  availableTools: [
                    "generate_project_overview",
                    "progressive_documentation"
                  ],
                  simplifiedFlow: {
                    currentVersion: "3.0-simplified",
                    totalSteps: 2,
                    description: "2步精简Init流程：项目概览 → 渐进式文档生成"
                  }
                }, null, 2)
              }
            ]
          };
        }
        
        case "reset_init": {
          console.log(`[MCP-Simplified] 重置流程状态`);
          
          const result = claudeCodeInit.reset();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ...result,
                  nextStep: "调用 generate_project_overview 开始新的Init流程",
                  simplifiedFlow: true,
                  version: "3.0-simplified"
                }, null, 2)
              }
            ]
          };
        }
        
        default:
          throw new Error(`未知的工具: ${name}. 可用工具: generate_project_overview, progressive_documentation, get_init_status, reset_init`);
      }
    } catch (error) {
      console.error(`[MCP-Simplified] 工具执行失败: ${name}`, error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              message: error.message,
              tool: name,
              version: "3.0-simplified",
              suggestion: "请检查工具名称和参数。可用工具: generate_project_overview, progressive_documentation",
              availableTools: [
                "generate_project_overview - 生成项目概览包",
                "progressive_documentation - 渐进式文档生成",
                "get_init_status - 获取状态信息", 
                "reset_init - 重置流程"
              ]
            }, null, 2)
          }
        ]
      };
    }
  });

  // 启动MCP服务器
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("\n✅ mg_kiro MCP服务器已启动 (stdio模式) - v3.0.0-simplified");
  console.log("🚀 精简版2步Init流程已就绪");
  console.log("🤖 支持工具: generate_project_overview, progressive_documentation");
  console.log("📡 等待Claude Code客户端连接...\n");
}

// WebSocket消息处理
function handleWebSocketMessage(ws, data, serviceBus) {
  const { type, payload } = data;
  
  switch (type) {
    case 'init':
      // 处理Init请求 - 使用新的MCP协议服务
      const { projectPath } = payload;
      const claudeCodeInit = serviceBus.get('claudeCodeInit');
      
      try {
        claudeCodeInit.initialize(resolve(projectPath));
        ws.send(JSON.stringify({
          type: 'init_started',
          message: 'Init流程已启动，请使用MCP工具进行分步执行',
          availableTools: [
            'init_step1_data_collection',
            'init_step2_architecture',
            'init_step3_deep_analysis',
            'init_step4_module_docs',
            'init_step5_contracts'
          ]
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
      break;
      
    case 'status':
      // 获取状态
      const initState = serviceBus.get('initState');
      const status = initState ? initState.getProgress() : { status: 'idle' };
      ws.send(JSON.stringify({
        type: 'status',
        status
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: `未知的消息类型: ${type}`
      }));
  }
}