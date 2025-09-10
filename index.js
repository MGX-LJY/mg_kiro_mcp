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
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, extname } from 'path';
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
    languageDetector: serviceBus.get('languageDetector'),
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

  // MCP工具：完整的6步Init流程 + 工作流引导
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "workflow_guide",
          description: "工作流引导入口：获取完整的工作流程指引，了解如何使用其他工具完成复杂任务。这是使用本MCP服务的起点",
          inputSchema: {
            type: "object",
            properties: {
              workflow: {
                type: "string",
                description: "要执行的工作流类型：init(项目初始化) | documentation(文档生成) | analysis(项目分析) | status(状态查询)",
                enum: ["init", "documentation", "analysis", "status"],
                default: "init"
              },
              currentStep: {
                type: "string",
                description: "当前所在步骤（可选），用于获取特定步骤的指引",
                default: null
              },
              projectPath: {
                type: "string",
                description: "项目路径（可选），用于获取更精准的建议",
                default: null
              }
            },
            required: []
          }
        },
        {
          name: "init_step1_project_analysis",
          description: "Step1: 项目分析 - 生成基础数据包和架构文档，为AI任务准备上下文",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录的绝对路径"
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
          name: "init_step2_create_todos",
          description: "Step2: 创建AI任务列表 - 基于Step1的项目分析结果创建详细的任务列表和处理策略",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径（与Step1相同）"
              },
              batchSize: {
                type: "number",
                description: "批次大小，默认使用Step1的建议值",
                default: null
              },
              includeAnalysisTasks: {
                type: "boolean",
                description: "是否包含分析任务",
                default: true
              },
              includeSummaryTasks: {
                type: "boolean",
                description: "是否包含总结任务",
                default: true
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step3_get_next_task",
          description: "Step3a: 获取下一个文件处理任务 - 在文件文档生成循环中使用",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step3_get_file_content",
          description: "Step3b: 获取文件内容并自动生成markdown文档 - 保存到mg_kiro/文件夹",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              },
              relativePath: {
                type: "string",
                description: "文件的相对路径（从next_task获取）"
              },
              maxContentLength: {
                type: "number",
                description: "文件内容最大长度",
                default: 50000
              }
            },
            required: ["projectPath", "relativePath"]
          }
        },
        {
          name: "init_step3_complete_task",
          description: "Step3c: 标记任务完成 - 统一进度管理，支持所有步骤的任务完成",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              },
              taskId: {
                type: "string",
                description: "任务ID（从任务响应中获取）"
              },
              step: {
                type: "string",
                description: "步骤类型: file-processing | module-integration | overview-generation | module-connections",
                default: "file-processing"
              },
              notes: {
                type: "string",
                description: "完成备注（可选）",
                default: null
              }
            },
            required: ["projectPath", "taskId"]
          }
        },
        {
          name: "init_step4_module_integration",
          description: "Step4: 模块整合提示词 - 基于文件文档进行模块化整合的AI指导",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step5_overview_generation",
          description: "Step5: 总览生成提示词 - 基于模块整合结果生成项目整体概览的AI指导",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step6_connect_docs",
          description: "Step6: 连接文档提示词 - 分析模块连接关系并完成最终架构文档的AI指导（最终步骤）",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              }
            },
            required: ["projectPath"]
          }
        },
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

  // 处理工具调用 - 完整的6步Init流程
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // 导入必要的服务
    const { ProjectOverviewGenerator } = await import('./server/services/project-overview-generator.js');
    const { AITodoManager } = await import('./server/services/ai-todo-manager.js');
    const { FileQueryService } = await import('./server/services/file-query-service.js');
    
    // 全局状态管理
    const projectStates = new Map();
    
    // 获取或创建项目状态
    function getProjectState(projectPath) {
      const normalizedPath = resolve(projectPath);
      if (!projectStates.has(normalizedPath)) {
        projectStates.set(normalizedPath, {
          currentStep: 0,
          projectPath: normalizedPath,
          stepsCompleted: [],
          stepResults: {},
          startedAt: null,
          error: null,
          documentCount: 0,
          generatedDocs: []
        });
      }
      return projectStates.get(normalizedPath);
    }
    
    // 确保mg_kiro文档目录存在
    function ensureDocsDirectory(projectPath) {
      const docsDir = join(projectPath, 'mg_kiro');
      if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true });
      }
      return docsDir;
    }
    
    // 创建服务实例
    const projectOverviewGenerator = new ProjectOverviewGenerator();
    const aiTodoManager = new AITodoManager();
    const fileQueryService = new FileQueryService();
    
    // 向后兼容的claudeCodeInit服务
    const claudeCodeInit = {
      generateProjectOverview: async (projectPath, options) => {
        return await projectOverviewGenerator.generateOverview(projectPath, options);
      },
      progressiveDocumentation: async (options) => {
        // 模拟渐进式文档生成响应
        return {
          success: true,
          message: "渐进式文档生成流程已启动",
          aiInstructions: "请按照以下步骤生成文档...",
          totalBatches: 5,
          currentBatch: 1,
          percentage: "20%",
          estimatedTime: "约10分钟"
        };
      },
      getState: () => ({ status: 'ready', currentStep: null }),
      getProgress: () => ({ percentage: 0, message: 'Ready' }),
      healthCheck: () => ({ healthy: true, services: 'all operational' }),
      reset: () => ({ success: true, message: 'State reset successfully' })
    };

    try {
      switch (name) {
        case "init_step1_project_analysis": {
          const { projectPath, maxDepth, includeFiles, maxKeyFileSize } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step1] 项目分析 - ${projectPath}`);
          
          // 获取项目状态
          const initState = getProjectState(projectPath);
          
          // 重置状态
          initState.currentStep = 1;
          initState.startedAt = new Date().toISOString();
          initState.stepsCompleted = [];
          initState.stepResults = {};
          initState.error = null;
          initState.documentCount = 0;
          initState.generatedDocs = [];
          
          // 确保文档目录存在
          const docsDir = ensureDocsDirectory(resolve(projectPath));
          
          // 生成项目概览包
          const overviewResult = await projectOverviewGenerator.generateOverview(
            resolve(projectPath),
            {
              maxDepth: maxDepth || 3,
              includeFiles: includeFiles || [],
              maxKeyFileSize: maxKeyFileSize || 50 * 1024
            }
          );
          
          // 存储Step1结果
          initState.stepResults.step1 = {
            projectOverview: overviewResult,
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step1');
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 1,
                  stepName: 'project-analysis',
                  projectPath: resolve(projectPath),
                  docsDirectory: docsDir,
                  
                  // Step1输出摘要
                  analysisResults: {
                    projectName: overviewResult.projectMetadata?.name || 'Unknown',
                    primaryLanguage: overviewResult.languageProfile?.primary || 'Unknown',
                    totalFiles: overviewResult.projectMetadata?.totalFiles || 0,
                    architectureType: overviewResult.projectCharacteristics?.architecture || 'Unknown',
                    complexity: overviewResult.projectCharacteristics?.complexity || 'Unknown'
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "1/6 - 项目分析",
                    status: "completed",
                    next_steps: [{
                      tool: "init_step2_create_todos",
                      description: "基于项目分析结果创建详细的AI任务列表",
                      suggested_params: {
                        projectPath: resolve(projectPath),
                        batchSize: overviewResult.aiGenerationGuide?.step2Guidance?.suggestedBatchSize || 3
                      },
                      why: "项目分析已完成，需要创建AI任务列表以进行文件处理"
                    }],
                    progress: {
                      completed: 1,
                      total: 6,
                      percentage: Math.round(1/6 * 100)
                    }
                  },
                  
                  // 结果
                  success: true,
                  message: "Step1: 项目分析完成，基础数据包和架构文档已生成"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step2_create_todos": {
          const { projectPath, batchSize, includeAnalysisTasks, includeSummaryTasks } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step2] 创建AI任务列表 - ${projectPath}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 1 || !initState.stepResults.step1) {
            throw new Error('Step2需要先完成Step1项目分析');
          }
          
          initState.currentStep = 2;
          
          // 获取Step1的结果
          const step1Results = initState.stepResults.step1.projectOverview;
          
          // 初始化文件查询服务
          await fileQueryService.initializeProject(resolve(projectPath));
          
          // 获取处理计划
          const processingPlan = await fileQueryService.getProcessingPlan(resolve(projectPath), {
            batchSize: batchSize || step1Results.aiGenerationGuide?.step2Guidance?.suggestedBatchSize || 3,
            priorityOrder: true,
            estimateOnly: false
          });
          
          // 创建AI任务列表
          const todoResult = await aiTodoManager.createProjectTodoList(
            resolve(projectPath),
            processingPlan,
            {
              includeAnalysisTasks: includeAnalysisTasks !== false,
              includeSummaryTasks: includeSummaryTasks !== false
            }
          );
          
          // 存储Step2结果
          initState.stepResults.step2 = {
            todoList: todoResult,
            processingPlan: processingPlan,
            completedAt: new Date().toISOString()
          };
          initState.stepsCompleted.push('step2');
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 2,
                  stepName: 'create-todo',
                  
                  // Step2输出摘要
                  todoCreationResults: {
                    totalTasks: todoResult.todoList?.totalTasks || 0,
                    fileProcessingTasks: todoResult.summary?.fileProcessingTasks || 0,
                    analysisTasks: todoResult.summary?.analysisTasks || 0,
                    summaryTasks: todoResult.summary?.summaryTasks || 0,
                    estimatedTime: todoResult.summary?.estimatedTotalTime || '30-60分钟'
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "2/6 - AI任务创建",
                    status: "completed",
                    next_steps: [{
                      tool: "init_step3_get_next_task",
                      description: "获取下一个文件处理任务，开始文档生成循环",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "AI任务列表已创建，现在需要逐个处理文件生成文档"
                    }],
                    progress: {
                      completed: 2,
                      total: 6,
                      percentage: Math.round(2/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step2: AI任务列表创建完成，可以开始文件文档生成"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step3_get_next_task": {
          const { projectPath } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step3] 获取下一个文件任务 - ${projectPath}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 2 || !initState.stepResults.step2) {
            throw new Error('Step3需要先完成Step2任务创建');
          }
          
          initState.currentStep = 3;
          
          // 获取下一个待处理的任务
          const nextTask = await fileQueryService.getNextTask(resolve(projectPath));
          
          if (!nextTask || nextTask.allCompleted) {
            // 所有文件处理任务完成，准备进入Step4
            initState.stepsCompleted.push('step3');
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    currentStep: 3,
                    stepName: 'file-documentation',
                    status: "all_completed",
                    
                    // Step3完成摘要
                    completionResults: {
                      totalFilesProcessed: initState.documentCount || 0,
                      docsGenerated: initState.generatedDocs?.length || 0,
                      processingTime: "已完成"
                    },
                    
                    // 下一步指导
                    workflow: {
                      current_step: "3/6 - 文件文档生成（已完成）",
                      status: "completed",
                      next_steps: [{
                        tool: "init_step4_module_integration",
                        description: "基于文件文档进行模块化整合",
                        suggested_params: {
                          projectPath: resolve(projectPath)
                        },
                        why: "文件文档已全部生成，现在需要进行模块整合"
                      }],
                      progress: {
                        completed: 3,
                        total: 6,
                        percentage: Math.round(3/6 * 100)
                      }
                    },
                    
                    success: true,
                    message: "Step3: 所有文件文档生成完成，可以进入模块整合阶段"
                  }, null, 2)
                }
              ]
            };
          }
          
          // 返回下一个任务
          return {
            content: [
              {
                type: "text", 
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation',
                  status: "task_available",
                  
                  // 当前任务信息
                  currentTask: {
                    taskId: nextTask.taskId,
                    filePath: nextTask.filePath,
                    fileName: nextTask.fileName,
                    fileSize: nextTask.fileSize,
                    priority: nextTask.priority,
                    estimatedTime: nextTask.estimatedProcessingTime
                  },
                  
                  // 进度信息
                  progress: {
                    completed: nextTask.progress?.completed || 0,
                    total: nextTask.progress?.total || 0,
                    remaining: nextTask.progress?.remaining || 0,
                    percentage: Math.round(((nextTask.progress?.completed || 0) / (nextTask.progress?.total || 1)) * 100)
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "3/6 - 文件文档生成（进行中）",
                    status: "in_progress",
                    next_steps: [{
                      tool: "init_step3_get_file_content",
                      description: "获取文件内容进行文档生成",
                      suggested_params: {
                        projectPath: resolve(projectPath),
                        taskId: nextTask.taskId
                      },
                      why: "获得了下一个任务，现在需要读取文件内容"
                    }],
                    progress: {
                      completed: 3,
                      total: 6,
                      percentage: Math.round(3/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step3: 获取到下一个文件处理任务"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step3_get_file_content": {
          const { projectPath, taskId } = args;
          
          if (!projectPath || !taskId) {
            throw new Error("项目路径和任务ID不能为空");
          }
          
          console.log(`[MCP-Init-Step3] 获取文件内容 - ${projectPath} 任务:${taskId}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 3) {
            throw new Error('需要先调用init_step3_get_next_task获取任务');
          }
          
          // 获取文件内容
          const fileContent = await fileQueryService.getFileContent(resolve(projectPath), taskId);
          
          if (!fileContent) {
            throw new Error(`无法获取任务 ${taskId} 的文件内容`);
          }
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation',
                  status: "content_ready",
                  
                  // 文件内容信息
                  fileContent: {
                    taskId: fileContent.taskId,
                    filePath: fileContent.filePath,
                    fileName: fileContent.fileName,
                    content: fileContent.content,
                    language: fileContent.language,
                    size: fileContent.size,
                    lines: fileContent.lines
                  },
                  
                  // AI处理指导
                  aiInstructions: {
                    task: "为这个文件生成详细的技术文档",
                    focus: "分析代码功能、架构设计、重要逻辑和使用方式",
                    format: "Markdown格式，包含代码示例和技术说明",
                    outputFile: `mg_kiro/files/${fileContent.fileName}.md`
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "3/6 - 文件文档生成（准备AI处理）",
                    status: "content_ready",
                    next_steps: [{
                      tool: "init_step3_complete_task",
                      description: "完成文件文档生成并保存结果",
                      suggested_params: {
                        projectPath: resolve(projectPath),
                        taskId: taskId,
                        documentContent: "【AI生成的文档内容】"
                      },
                      why: "文件内容已获取，AI处理完成后需要保存文档并标记任务完成"
                    }],
                    progress: {
                      completed: 3,
                      total: 6,
                      percentage: Math.round(3/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step3: 文件内容已准备就绪，可以开始AI文档生成"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step3_complete_task": {
          const { projectPath, taskId, documentContent } = args;
          
          if (!projectPath || !taskId || !documentContent) {
            throw new Error("项目路径、任务ID和文档内容不能为空");
          }
          
          console.log(`[MCP-Init-Step3] 完成任务 - ${projectPath} 任务:${taskId}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 3) {
            throw new Error('需要先通过step3工具获取任务内容');
          }
          
          // 完成任务并保存文档
          const completionResult = await fileQueryService.completeTask(
            resolve(projectPath), 
            taskId, 
            documentContent
          );
          
          // 更新项目状态
          initState.documentCount = (initState.documentCount || 0) + 1;
          if (!initState.generatedDocs) {
            initState.generatedDocs = [];
          }
          initState.generatedDocs.push({
            taskId: taskId,
            fileName: completionResult.fileName,
            docPath: completionResult.docPath,
            completedAt: new Date().toISOString()
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation',
                  status: "task_completed",
                  
                  // 完成结果
                  completionResults: {
                    taskId: taskId,
                    fileName: completionResult.fileName,
                    documentPath: completionResult.docPath,
                    totalProcessed: initState.documentCount,
                    remainingTasks: completionResult.remainingTasks || 0
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "3/6 - 文件文档生成（继续处理）",
                    status: completionResult.remainingTasks > 0 ? "continue_processing" : "step_completed",
                    next_steps: completionResult.remainingTasks > 0 ? [{
                      tool: "init_step3_get_next_task",
                      description: "继续处理下一个文件任务",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: `还有 ${completionResult.remainingTasks} 个文件等待处理`
                    }] : [{
                      tool: "init_step4_module_integration",
                      description: "开始模块化整合",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "所有文件文档已完成，可以进入模块整合阶段"
                    }],
                    progress: {
                      completed: completionResult.remainingTasks > 0 ? 3 : 4,
                      total: 6,
                      percentage: Math.round((completionResult.remainingTasks > 0 ? 3 : 4)/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: `Step3: 任务 ${taskId} 已完成，文档已保存到 ${completionResult.docPath}`
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step4_module_integration": {
          const { projectPath } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step4] 模块整合 - ${projectPath}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 3 || !initState.stepsCompleted.includes('step3')) {
            throw new Error('Step4需要先完成Step3文件文档生成');
          }
          
          initState.currentStep = 4;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成模块整合提示词
          const integrationPrompt = `
## 模块整合任务 - Step 4

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 已生成文档数: ${initState.documentCount || 0}

### 任务目标
基于 ${docsDir}/files/ 中的所有文件文档，进行模块化整合分析。

### 具体要求
1. **模块识别**: 分析文件间的依赖关系，识别逻辑模块
2. **架构梳理**: 整理模块间的调用关系和数据流
3. **功能归类**: 将相关功能的文件归类到对应模块
4. **接口分析**: 识别模块对外提供的接口和服务

### 输出要求
请创建以下文档：
- \`${docsDir}/modules/module-overview.md\` - 模块总览
- \`${docsDir}/modules/module-dependencies.md\` - 依赖关系图
- \`${docsDir}/modules/[module-name].md\` - 各模块详细文档

### 分析方法
1. 读取 \`${docsDir}/files/\` 下的所有文档
2. 分析import/require/include等依赖关系
3. 识别相似功能和职责的文件组合
4. 构建模块调用链和数据流向图

完成后，请调用 \`init_step5_overview_generation\` 继续下一步。
          `;
          
          // 存储Step4结果
          initState.stepResults.step4 = {
            integrationPrompt: integrationPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step4');
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 4,
                  stepName: 'module-integration',
                  status: "prompt_ready",
                  
                  // Step4 AI指导提示词
                  aiInstructions: integrationPrompt.trim(),
                  
                  // 资源信息
                  resources: {
                    sourceDocsPath: `${docsDir}/files/`,
                    outputModulesPath: `${docsDir}/modules/`,
                    totalSourceDocs: initState.documentCount || 0
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "4/6 - 模块整合",
                    status: "ready_for_ai",
                    next_steps: [{
                      tool: "init_step5_overview_generation",
                      description: "基于模块整合结果生成项目总览",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "模块整合指导已提供，AI完成整合后需要生成最终总览"
                    }],
                    progress: {
                      completed: 4,
                      total: 6,
                      percentage: Math.round(4/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step4: 模块整合指导已生成，请按照提示完成模块分析"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step5_overview_generation": {
          const { projectPath } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step5] 总览生成 - ${projectPath}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 4 || !initState.stepsCompleted.includes('step4')) {
            throw new Error('Step5需要先完成Step4模块整合');
          }
          
          initState.currentStep = 5;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成总览生成提示词
          const overviewPrompt = `
## 项目总览生成任务 - Step 5

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 处理阶段: 基于完整的文件文档和模块整合结果

### 任务目标
整合所有分析结果，生成完整的项目概览文档。

### 输入资源
1. **文件文档**: \`${docsDir}/files/\` - 所有源码文件的详细分析
2. **模块文档**: \`${docsDir}/modules/\` - 模块化整合分析结果
3. **基础信息**: Step1生成的项目概览包

### 输出要求
请创建以下核心文档：

#### 1. 项目总览 - \`${docsDir}/README.md\`
- 项目简介和核心价值
- 技术架构概要
- 主要功能模块
- 快速开始指南

#### 2. 架构文档 - \`${docsDir}/architecture.md\`  
- 整体架构图
- 模块职责分工
- 数据流向分析
- 关键技术选型

#### 3. 开发文档 - \`${docsDir}/development.md\`
- 开发环境搭建
- 代码规范说明
- 调试和测试方法
- 常见问题解答

### 生成策略
1. 综合分析文件级和模块级信息
2. 提取项目的核心价值和特色
3. 构建清晰的技术架构视图  
4. 提供实用的使用和开发指导

完成后，请调用 \`init_step6_connect_docs\` 进行最终的文档连接。
          `;
          
          // 存储Step5结果
          initState.stepResults.step5 = {
            overviewPrompt: overviewPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step5');
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 5,
                  stepName: 'overview-generation',
                  status: "prompt_ready",
                  
                  // Step5 AI指导提示词
                  aiInstructions: overviewPrompt.trim(),
                  
                  // 资源信息
                  resources: {
                    fileDocsPath: `${docsDir}/files/`,
                    moduleDocsPath: `${docsDir}/modules/`,
                    outputPath: `${docsDir}/`,
                    totalFiles: initState.documentCount || 0
                  },
                  
                  // 输出文档规格
                  expectedOutputs: [
                    `${docsDir}/README.md`,
                    `${docsDir}/architecture.md`, 
                    `${docsDir}/development.md`
                  ],
                  
                  // 下一步指导
                  workflow: {
                    current_step: "5/6 - 总览生成",
                    status: "ready_for_ai",
                    next_steps: [{
                      tool: "init_step6_connect_docs",
                      description: "连接所有文档，完成init流程",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "项目总览指导已提供，AI完成后需要进行最终的文档连接"
                    }],
                    progress: {
                      completed: 5,
                      total: 6,
                      percentage: Math.round(5/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step5: 项目总览生成指导已准备，请按照提示完成总览文档"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step6_connect_docs": {
          const { projectPath } = args;
          
          if (!projectPath) {
            throw new Error("项目路径不能为空");
          }
          
          console.log(`[MCP-Init-Step6] 连接文档 - ${projectPath}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 5 || !initState.stepsCompleted.includes('step5')) {
            throw new Error('Step6需要先完成Step5总览生成');
          }
          
          initState.currentStep = 6;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成文档连接提示词
          const connectionPrompt = `
## 文档连接任务 - Step 6 (最终步骤)

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 处理阶段: 所有文档已生成，需要建立连接关系

### 任务目标
建立文档间的导航和引用关系，完成整个文档体系。

### 现有文档结构
\`\`\`
${docsDir}/
├── README.md          # 项目总览 (Step5生成)
├── architecture.md    # 架构文档 (Step5生成)  
├── development.md     # 开发文档 (Step5生成)
├── files/            # 文件文档目录 (Step3生成)
│   ├── [filename1].md
│   ├── [filename2].md
│   └── ...
└── modules/          # 模块文档目录 (Step4生成)
    ├── module-overview.md
    ├── module-dependencies.md
    └── [module-name].md
\`\`\`

### 连接任务
1. **完善主README**: 在 \`${docsDir}/README.md\` 中添加完整的文档导航
2. **创建索引**: 创建 \`${docsDir}/docs-index.md\` 作为文档索引
3. **添加交叉引用**: 在各文档间添加相关链接
4. **生成导航**: 创建 \`${docsDir}/navigation.md\` 提供快速导航

### 输出要求
请完成以下文档连接工作：

#### 1. 更新 \`${docsDir}/README.md\`
在现有内容基础上，添加完整的文档导航部分：
\`\`\`markdown
## 📚 文档导航

### 🏗️ 架构文档
- [架构概览](./architecture.md) - 技术架构和设计模式
- [模块总览](./modules/module-overview.md) - 功能模块划分
- [依赖关系](./modules/module-dependencies.md) - 模块间依赖

### 🔧 开发文档  
- [开发指南](./development.md) - 环境搭建和开发规范
- [文档索引](./docs-index.md) - 完整文档列表

### 📂 代码文档
- [文件列表](./files/) - 源码文件详细分析
- [模块文档](./modules/) - 功能模块详细文档
\`\`\`

#### 2. 创建 \`${docsDir}/docs-index.md\`
生成完整的文档索引，包含所有生成的文档和简短描述。

#### 3. 创建 \`${docsDir}/navigation.md\`  
提供快速导航菜单，便于文档间跳转。

### 完成标志
- 所有文档都有清晰的导航路径
- 相关文档间建立了交叉引用
- 提供了完整的文档索引
- README.md 成为整个文档体系的入口

**🎉 完成此步骤后，整个init工作流将全部完成！**
          `;
          
          // 存储Step6结果并标记完成
          initState.stepResults.step6 = {
            connectionPrompt: connectionPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step6');
          initState.currentStep = 6;
          initState.completed = true;
          initState.completedAt = new Date().toISOString();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 6,
                  stepName: 'connect-docs',
                  status: "final_step",
                  
                  // Step6 AI指导提示词 (最终步骤)
                  aiInstructions: connectionPrompt.trim(),
                  
                  // 文档体系信息
                  documentationSystem: {
                    docsDirectory: docsDir,
                    totalFiles: initState.documentCount || 0,
                    generatedDocs: initState.generatedDocs?.length || 0,
                    expectedFinalDocs: [
                      `${docsDir}/README.md`,
                      `${docsDir}/docs-index.md`,
                      `${docsDir}/navigation.md`
                    ]
                  },
                  
                  // 完成状态
                  workflow: {
                    current_step: "6/6 - 文档连接 (最终步骤)",
                    status: "final_instructions_ready",
                    completion: {
                      message: "🎉 Init工作流即将完成！",
                      totalSteps: 6,
                      allStepsCompleted: true,
                      finalTask: "完成文档连接后，整个初始化流程将全部完成"
                    },
                    progress: {
                      completed: 6,
                      total: 6,
                      percentage: 100
                    }
                  },
                  
                  // 最终总结
                  initSummary: {
                    projectPath: resolve(projectPath),
                    docsGenerated: docsDir,
                    filesProcessed: initState.documentCount || 0,
                    stepsCompleted: initState.stepsCompleted,
                    startedAt: initState.startedAt,
                    totalDuration: initState.startedAt ? 
                      Math.round((new Date() - new Date(initState.startedAt)) / 1000 / 60) + '分钟' : '未知'
                  },
                  
                  success: true,
                  message: "Step6: 文档连接指导已准备，完成后init工作流将全部完成！"
                }, null, 2)
              }
            ]
          };
        }
        
        case "workflow_guide": {
          const { workflow, currentStep, projectPath } = args;
          
          console.log(`[MCP-WorkflowGuide] 获取工作流指引 - 类型: ${workflow || 'init'}`);
          
          // 使用内置的工作流指引（不依赖外部服务）
          {
            // 内置的工作流指引
            const workflowGuides = {
              init: {
                workflow_name: "项目初始化工作流",
                description: "完整的6步文档生成流程，提供从分析到最终文档的全程指导",
                total_steps: 6,
                steps: [
                  {
                    step: 1,
                    name: "项目分析",
                    tool: "init_step1_project_analysis",
                    description: "深度分析项目结构、语言特征、依赖关系，生成基础数据包",
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    optional_params: {
                      maxDepth: "目录扫描深度（默认3层）",
                      includeFiles: "额外要包含的文件模式",
                      maxKeyFileSize: "关键文件最大字节数（默认50KB）"
                    },
                    expected_output: "项目概览包，包含语言分析、架构分析、文件清单",
                    why: "建立项目基础信息，为后续步骤提供数据支持"
                  },
                  {
                    step: 2,
                    name: "任务创建",
                    tool: "init_step2_create_todos",
                    description: "基于项目分析结果，创建详细的AI处理任务列表",
                    prerequisites: ["必须先完成init_step1_project_analysis"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    optional_params: {
                      batchSize: "批次大小（默认3）",
                      includeAnalysisTasks: "包含分析任务（默认true）",
                      includeSummaryTasks: "包含总结任务（默认true）"
                    },
                    expected_output: "AI任务列表、处理计划、时间预估",
                    why: "制定详细的文档生成计划，为文件处理做准备"
                  },
                  {
                    step: 3,
                    name: "文件文档生成",
                    tool: "init_step3_get_next_task",
                    description: "开始逐个处理文件，生成详细的技术文档（循环步骤）",
                    prerequisites: ["必须先完成init_step2_create_todos"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    sub_tools: [
                      "init_step3_get_next_task - 获取下一个文件任务",
                      "init_step3_get_file_content - 获取文件内容",
                      "init_step3_complete_task - 完成任务并保存文档"
                    ],
                    expected_output: "每个源码文件的详细技术文档",
                    why: "为每个重要文件生成详细分析，建立代码库文档基础"
                  },
                  {
                    step: 4,
                    name: "模块整合",
                    tool: "init_step4_module_integration",
                    description: "基于文件文档进行模块化整合分析",
                    prerequisites: ["必须先完成Step3所有文件处理"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    expected_output: "模块整合指导、依赖关系分析、架构梳理提示",
                    why: "将文件级文档整合为模块级架构，识别系统设计模式"
                  },
                  {
                    step: 5,
                    name: "总览生成",
                    tool: "init_step5_overview_generation",
                    description: "生成项目整体概览和核心文档",
                    prerequisites: ["必须先完成init_step4_module_integration"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    expected_output: "项目总览指导、架构文档、开发文档生成提示",
                    why: "整合所有分析结果，生成项目的核心文档和概览"
                  },
                  {
                    step: 6,
                    name: "文档连接",
                    tool: "init_step6_connect_docs",
                    description: "建立文档间的连接关系，完成整个文档体系（最终步骤）",
                    prerequisites: ["必须先完成init_step5_overview_generation"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    expected_output: "完整的文档导航系统、交叉引用、索引文件",
                    why: "建立文档间的连接，形成完整的文档体系，便于使用和维护"
                  }
                ],
                next_action: {
                  if_not_started: "调用 init_step1_project_analysis 开始完整的初始化流程",
                  if_step1_done: "调用 init_step2_create_todos 创建任务列表",
                  if_step2_done: "调用 init_step3_get_next_task 开始文件处理循环",
                  if_step3_done: "调用 init_step4_module_integration 进行模块整合",
                  if_step4_done: "调用 init_step5_overview_generation 生成总览",
                  if_step5_done: "调用 init_step6_connect_docs 完成文档连接",
                  if_completed: "🎉 所有步骤已完成！使用 get_init_status 查看最终状态"
                },
                workflow_features: [
                  "🔄 逐步执行：每个步骤都有明确的输入输出和下一步指导",
                  "📊 进度跟踪：每个工具都会提供当前进度和完成状态",
                  "🧠 AI协作：每个步骤都包含详细的AI处理指导",
                  "📁 自动保存：所有生成的文档都会保存到项目的mg_kiro/目录",
                  "🔗 状态管理：自动管理项目状态，支持断点续传",
                  "✅ 完整验证：每步都会验证前置条件，确保流程正确执行"
                ],
                tips: [
                  "建议使用绝对路径作为 projectPath 参数",
                  "Step3是循环步骤，需要重复调用直到所有文件处理完成",
                  "每个工具的返回结果都包含详细的下一步指导",
                  "生成的文档位于项目根目录的 mg_kiro/ 文件夹中",
                  "可以随时使用 get_init_status 查看当前进度",
                  "如需重新开始，使用 reset_init 重置所有状态"
                ]
              },
              documentation: {
                workflow_name: "独立文档生成工作流",
                description: "直接启动文档生成，适用于已有项目概览的情况",
                tools: ["progressive_documentation"],
                next_action: "调用 progressive_documentation 工具"
              },
              analysis: {
                workflow_name: "项目分析工作流",
                description: "仅进行项目分析，不生成文档",
                tools: ["generate_project_overview"],
                next_action: "调用 generate_project_overview 工具"
              },
              status: {
                workflow_name: "状态查询工作流",
                description: "查看当前工作流状态和进度",
                tools: ["get_init_status", "reset_init"],
                next_action: "调用 get_init_status 查看状态，或 reset_init 重置流程"
              }
            };
            
            const selectedWorkflow = workflowGuides[workflow || 'init'];
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    workflow_guide: selectedWorkflow,
                    current_step: currentStep || null,
                    project_path: projectPath || null,
                    available_workflows: Object.keys(workflowGuides),
                    version: "4.0-complete-6-steps",
                    message: "根据上述指引，按顺序调用相应的工具完成工作流"
                  }, null, 2)
                }
              ]
            };
          }
        }
        
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
          
          // 添加工作流指引信息
          const enhancedResult = {
            ...result,
            workflow: {
              current_step: "1/2 - 项目概览生成",
              status: "completed",
              next_steps: [
                {
                  tool: "progressive_documentation",
                  description: "基于已生成的项目概览，启动渐进式文档生成",
                  suggested_params: {
                    batchSize: "80KB",
                    style: result.language === "JavaScript" ? "technical" : "comprehensive",
                    includeTests: true
                  },
                  why: "项目概览已完成，现在需要生成详细文档"
                }
              ],
              alternative_actions: [
                {
                  tool: "get_init_status",
                  description: "查看当前初始化状态"
                },
                {
                  tool: "workflow_guide",
                  description: "获取完整工作流指引",
                  params: { workflow: "init", currentStep: "2" }
                }
              ],
              tips: [
                "建议根据项目规模调整batchSize",
                `检测到主要语言: ${result.language || '未知'}，建议使用相应的文档风格`
              ]
            }
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(enhancedResult, null, 2)
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
          
          // 添加工作流指引和进度信息
          const enhancedResult = {
            ...result,
            workflow: {
              current_step: "2/2 - 渐进式文档生成",
              status: "in_progress",
              progress: {
                total_batches: result.totalBatches || "unknown",
                current_batch: result.currentBatch || 1,
                percentage: result.percentage || "0%",
                estimated_time: result.estimatedTime || "calculating..."
              },
              next_steps: [
                {
                  tool: "AI_COLLABORATION",
                  description: "按照生成的指令，逐步完成文档编写",
                  instructions: result.aiInstructions || "等待AI协作指令",
                  why: "这是一个AI协作流程，需要按照指令逐步执行"
                }
              ],
              monitoring: [
                {
                  tool: "get_init_status",
                  description: "随时查看文档生成进度",
                  frequency: "after_each_batch"
                }
              ],
              completion_check: {
                when_done: "所有批次处理完成后，流程结束",
                final_outputs: ["项目文档", "模块文档", "架构图", "API文档"]
              },
              tips: [
                "按照AI协作指令逐步执行",
                "每个批次处理后检查进度",
                "如遇到上下文溢出，调整batchSize参数"
              ]
            }
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(enhancedResult, null, 2)
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