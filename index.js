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
import { initializeServices } from './server/services/service-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_DIR = join(__dirname, 'config');

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

    // 创建路由
    const routes = createAppRoutes(serviceBus, null);
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
      console.log(`\n可用的端点:`);
      console.log(`  - GET  /health - 健康检查`);
      console.log(`  - POST /mcp/tools/init - 执行Init流程`);
      console.log(`  - GET  /mode/init/status - Init模式状态`);
    });
  }

  // ========== MCP服务器设置 ==========
  console.log('[Server] 启动MCP协议服务器...');
  
  const server = new Server(
    {
      name: "mg_kiro",
      version: "2.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // MCP工具：支持分步执行Init流程
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "init_step1_data_collection",
          description: "执行Init步靄1：数据收集（项目结构+语言检测+文件分析）",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "要分析的项目路径"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step2_architecture",
          description: "执行Init步靄2：准备架构文档生成数据（需要Claude Code生成文档）",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "init_step3_deep_analysis",
          description: "执行Init步靄3：深度分析（模块分析+提示词生成）",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "init_step4_module_docs",
          description: "执行Init步靄4：准备模块文档生成数据（需要Claude Code生成文档）",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "init_step5_contracts",
          description: "执行Init步靄5：准备集成契约生成数据（需要Claude Code生成文档）",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "get_init_status",
          description: "获取当前Init流程的状态和进度",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "reset_init",
          description: "重置Init流程状态",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        }
      ]
    };
  });

  // 处理工具调用
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const claudeCodeInit = serviceBus.get('claudeCodeInit');

    try {
      switch (name) {
        case "init_step1_data_collection": {
          const { projectPath } = args;
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP] 执行Init步靄1：数据收集 - ${projectPath}`);
          claudeCodeInit.initialize(resolve(projectPath));
          const results = await claudeCodeInit.executeStep1_DataCollection();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  step: 1,
                  message: "数据收集完成",
                  results: {
                    structureFiles: results.structureAnalysis?.layeredResults?.moduleAnalysis?.totalModules || 0,
                    primaryLanguage: results.languageDetection?.detection?.primaryLanguage || 'unknown',
                    totalFiles: results.fileAnalysis?.totalFiles || 0,
                    qualityScore: results.fileAnalysis?.quality?.overallScore || 0
                  },
                  nextStep: "执行 init_step2_architecture 准备架构文档生成"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step2_architecture": {
          console.log(`[MCP] 执行Init步靄2：架构文档生成准备`);
          const aiDataPackage = await claudeCodeInit.prepareStep2_ArchitectureGeneration();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  step: 2,
                  message: "架构文档生成数据已准备",
                  aiDataPackage,
                  instructions: "请使用aiDataPackage中的数据生成system-architecture.md文档，然后调用 init_step3_deep_analysis",
                  targetFile: "mg_kiro/architecture/system-architecture.md"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step3_deep_analysis": {
          console.log(`[MCP] 执行Init步靄3：深度分析`);
          const results = await claudeCodeInit.executeStep3_DeepAnalysis();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  step: 3,
                  message: "深度分析完成",
                  results: {
                    totalModules: results.moduleAnalysis?.totalModules || 0,
                    promptsGenerated: results.promptGeneration ? true : false
                  },
                  nextStep: "执行 init_step4_module_docs 准备模块文档生成"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step4_module_docs": {
          console.log(`[MCP] 执行Init步靄4：模块文档生成准备`);
          const aiDataPackage = await claudeCodeInit.prepareStep4_ModuleDocGeneration();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  step: 4,
                  message: "模块文档生成数据已准备",
                  aiDataPackage,
                  instructions: "请使用aiDataPackage中的数据为每个模块生成文档，然后调用 init_step5_contracts",
                  targetDirectory: "mg_kiro/modules/",
                  expectedFiles: aiDataPackage.metadata?.expectedFileCount || 0
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step5_contracts": {
          console.log(`[MCP] 执行Init步靄5：集成契约生成准备`);
          const aiDataPackage = await claudeCodeInit.prepareStep5_IntegrationContracts();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  step: 5,
                  message: "集成契约生成数据已准备",
                  aiDataPackage,
                  instructions: "请使用aiDataPackage中的数据生成integration-contracts.md文档",
                  targetFile: "mg_kiro/contracts/integration-contracts.md",
                  finalStep: true,
                  completion: "Init流程全部完成！"
                }, null, 2)
              }
            ]
          };
        }
        
        case "get_init_status": {
          const status = claudeCodeInit.getState();
          const progress = claudeCodeInit.getProgress();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status,
                  progress,
                  availableSteps: [
                    "init_step1_data_collection",
                    "init_step2_architecture", 
                    "init_step3_deep_analysis",
                    "init_step4_module_docs",
                    "init_step5_contracts"
                  ]
                }, null, 2)
              }
            ]
          };
        }
        
        case "reset_init": {
          claudeCodeInit.reset();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Init流程已重置",
                  nextStep: "调用 init_step1_data_collection 开始新的Init流程"
                }, null, 2)
              }
            ]
          };
        }
        
        default:
          throw new Error(`未知的工具: ${name}`);
      }
    } catch (error) {
      console.error(`[MCP] 工具执行失败: ${name}`, error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              message: error.message,
              suggestion: "请检查步骤顺序和前置条件"
            })
          }
        ]
      };
    }
  });

  // 启动MCP服务器
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("\n✅ mg_kiro MCP服务器已启动 (stdio模式)");
  console.log("📡 等待MCP客户端连接...\n");
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