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
import path, { dirname, join, resolve } from 'path';
import fs, { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, unlinkSync } from 'fs';
import { createAppRoutes } from './server/routes/index.js';
import { initializeServices } from './server/services/service-registry.js';

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
    
    // 核心业务服务
    projectOverviewGenerator: serviceBus.get('projectOverviewGenerator'),
    
    // 新的文件分析模块和任务管理服务
    fileAnalysisModule: serviceBus.get('fileAnalysisModule'),
    unifiedTaskManager: serviceBus.get('unifiedTaskManager'),
    unifiedTaskValidator: serviceBus.get('unifiedTaskValidator'),
    taskStateManager: serviceBus.get('taskStateManager'),
    
    // 文件分析模块组件（可选直接访问）
    preciseTokenCalculator: serviceBus.get('preciseTokenCalculator'),
    combinedFileBatchStrategy: serviceBus.get('combinedFileBatchStrategy'),
    singleFileBatchStrategy: serviceBus.get('singleFileBatchStrategy'),
    largeFileMultiBatchStrategy: serviceBus.get('largeFileMultiBatchStrategy'),
    
    
    // ServiceBus工具方法
    getService: (name) => serviceBus.get(name),
    getServiceStatus: (name) => serviceBus.getServiceStatus(name),
    getStats: () => serviceBus.getStats(),
    getAllServices: () => serviceBus.getAllServices()
  };
}

// ========== 服务器模式 ==========
startServer().catch(console.error);

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
      version: "4.0.0-complete-6-steps",
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
          description: "工作流引导入口：获取完整的6步工作流程指引，了解如何使用其他工具完成复杂任务。这是使用本MCP服务的起点",
          inputSchema: {
            type: "object",
            properties: {
              workflow: {
                type: "string",
                description: "要执行的工作流类型：init(项目初始化) | status(状态查询)",
                enum: ["init", "status"],
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
          name: "init_step2_file_analysis", 
          description: "Step2: 文件分析模块 - 智能Token分析和批次规划，使用FileAnalysisModule作为系统大脑进行精确的文件分析和智能批次分配",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string", 
                description: "项目根目录路径（与Step1相同）"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step3_get_next_task",
          description: "🚀 [工作流入口] 启动文件处理流程 - ⚠️ 只能在完成step1+step2后调用！调用后系统进入step3状态，返回第一个文件任务(如file_1_1)。✅ 必须严格按照：此工具→get_file_content→complete_task 的顺序执行，不可跳过！",
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
          description: "📄 [必须第二步] 处理当前任务的文件内容 - ⚠️ 前置条件：必须先调用get_next_task获得任务ID！✅ 严格用法：get_next_task→[此工具]→complete_task。🚫 不能跳过顺序，否则失败！",
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
          name: "init_step3_generate_analysis",
          description: "🧠 [新增链接层] 基于文件内容生成分析文档 - ⚠️ 前置条件：必须先调用get_file_content获取文件内容！✅ 严格用法：get_next_task→get_file_content→[此工具]→complete_task。🎯 解决AI不知道生成什么文档的问题！",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              },
              taskId: {
                type: "string",
                description: "任务ID（从任务上下文自动获取，一般无需手动传入）"
              },
              analysisContent: {
                type: "string",
                description: "AI生成的分析文档内容（第二次调用时提供）"
              },
              analysisStyle: {
                type: "string",
                description: "分析风格: comprehensive | concise | technical",
                default: "comprehensive"
              },
              includeCodeExamples: {
                type: "boolean",
                description: "是否包含代码示例",
                default: true
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step3_check_task_completion",
          description: "🎯 [自动验证] 检查当前任务完成状态 - 系统自动验证文件生成并完成任务。支持分层验证策略：Step3文件夹检查、Step4模块文件夹检查、Step5/6固定文件检查。文件存在即自动完成，减少手动操作！",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目根目录路径"
              },
              taskId: {
                type: "string",
                description: "任务ID（可选，系统可自动获取）"
              },
              stepType: {
                type: "string",
                description: "步骤类型，决定验证策略：step3|step4|step5|step6",
                enum: ["step3", "step4", "step5", "step6"],
                default: "step3"
              }
            },
            required: ["projectPath"]
          }
        },
        {
          name: "init_step4_module_integration",
          description: "Step4: 模块整合 - 使用统一任务管理器创建模块整合任务，AI完成后使用 init_step3_check_task_completion 自动验证",
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
          name: "init_step5_module_relations",
          description: "Step5: 模块关联分析 - 使用统一任务管理器创建关联分析任务，AI完成后使用 init_step3_check_task_completion 自动验证",
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
          name: "init_step6_architecture_docs",
          description: "Step6: 架构文档生成 - 使用统一任务管理器创建架构文档生成任务，AI完成后使用 init_step3_check_task_completion 自动验证（最终步骤）",
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
          description: "重置Init流程，清除所有缓存状态和临时文件",
          inputSchema: {
            type: "object",
            properties: {
              projectPath: {
                type: "string",
                description: "项目路径（可选），指定则只清理该项目的状态和临时文件，不指定则清理所有",
                default: null
              }
            },
            required: []
          }
        }
      ]
    };
  });

  // 处理工具调用 - 完整的6步Init流程
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // 直接使用serviceBus获取服务实例（避免过度包装）
    
    // 全局状态管理 - 持久化到文件系统
    const projectStates = new Map();
    
    // 新增：当前任务上下文管理器 - 解决AI调用断档问题
    const currentTaskContexts = new Map(); // projectPath -> 当前活跃任务信息
    
    // 设置当前任务上下文
    function setCurrentTaskContext(projectPath, taskContext) {
      const normalizedPath = resolve(projectPath);
      const contextData = {
        ...taskContext,
        updatedAt: new Date().toISOString()
      };
      
      // 保存到内存
      currentTaskContexts.set(normalizedPath, contextData);
      
      // 同时保存到文件系统进行持久化
      try {
        const tempDir = join(projectPath, 'mg_kiro', '.tmp');
        if (!existsSync(tempDir)) {
          mkdirSync(tempDir, { recursive: true });
        }
        
        const contextFile = join(tempDir, 'current-task-context.json');
        writeFileSync(contextFile, JSON.stringify(contextData, null, 2), 'utf8');
        console.log(`[TaskContext] 设置并保存项目 ${normalizedPath} 的当前任务上下文: ${taskContext.taskId || taskContext.fileName || 'unknown'}`);
      } catch (error) {
        console.error(`[TaskContext] 保存任务上下文到文件失败: ${error.message}`);
        console.error(`[TaskContext] 尝试的路径: ${join(projectPath, 'mg_kiro', '.tmp')}`);
        // 即使文件保存失败，内存中的上下文依然可用
      }
    }
    
    // 获取当前任务上下文
    function getCurrentTaskContext(projectPath) {
      const normalizedPath = resolve(projectPath);
      
      // 首先尝试从内存获取
      let context = currentTaskContexts.get(normalizedPath);
      if (context) {
        console.log(`[TaskContext] 从内存获取项目 ${normalizedPath} 的当前任务上下文: ${context.taskId || context.fileName || 'unknown'}`);
        return context;
      }
      
      // 如果内存中没有，尝试从文件系统恢复
      try {
        const contextFile = join(projectPath, 'mg_kiro', '.tmp', 'current-task-context.json');
        if (existsSync(contextFile)) {
          const fileContent = readFileSync(contextFile, 'utf8');
          context = JSON.parse(fileContent);
          
          // 恢复到内存中
          currentTaskContexts.set(normalizedPath, context);
          console.log(`[TaskContext] 从文件恢复项目 ${normalizedPath} 的当前任务上下文: ${context.taskId || context.fileName || 'unknown'}`);
          return context;
        }
      } catch (error) {
        console.error(`[TaskContext] 从文件恢复任务上下文失败: ${error.message}`);
        console.error(`[TaskContext] 尝试的路径: ${join(projectPath, 'mg_kiro', '.tmp', 'current-task-context.json')}`);
      }
      
      console.log(`[TaskContext] 项目 ${normalizedPath} 没有找到任务上下文`);
      return null;
    }
    
    // 清除任务上下文
    function clearCurrentTaskContext(projectPath) {
      const normalizedPath = resolve(projectPath);
      
      // 从内存清除
      currentTaskContexts.delete(normalizedPath);
      
      // 同时清除文件系统中的任务上下文
      try {
        const contextFile = join(projectPath, 'mg_kiro', '.tmp', 'current-task-context.json');
        if (existsSync(contextFile)) {
          unlinkSync(contextFile);
        }
      } catch (error) {
        console.error(`[TaskContext] 删除任务上下文文件失败: ${error.message}`);
      }
      
      console.log(`[TaskContext] 清除项目 ${normalizedPath} 的任务上下文`);
    }
    
    // 状态文件路径
    function getStateFilePath(projectPath) {
      const docsDir = join(projectPath, 'mg_kiro');
      if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true });
      }
      return join(docsDir, 'init-state.json');
    }
    
    // 加载项目状态
    function loadProjectState(projectPath) {
      const normalizedPath = resolve(projectPath);
      const stateFile = getStateFilePath(normalizedPath);
      
      if (existsSync(stateFile)) {
        try {
          const stateData = readFileSync(stateFile, 'utf8');
          return JSON.parse(stateData);
        } catch (error) {
          console.log(`[State] 状态文件损坏，创建新状态: ${error.message}`);
        }
      }
      
      return {
        currentStep: 0,
        projectPath: normalizedPath,
        stepsCompleted: [],
        stepResults: {},
        startedAt: null,
        error: null,
        documentCount: 0,
        generatedDocs: []
      };
    }
    
    // 保存项目状态
    function saveProjectState(projectPath, state) {
      const normalizedPath = resolve(projectPath);
      const stateFile = getStateFilePath(normalizedPath);
      
      try {
        writeFileSync(stateFile, JSON.stringify(state, null, 2));
        console.log(`[State] 状态已保存: ${stateFile}`);
      } catch (error) {
        console.error(`[State] 保存状态失败: ${error.message}`);
      }
    }
    
    
    // 更新并保存项目状态
    function updateProjectState(projectPath, updates) {
      const normalizedPath = resolve(projectPath);
      const state = getProjectStateEnhanced(normalizedPath);
      
      Object.assign(state, updates);
      projectStates.set(normalizedPath, state);
      saveProjectState(normalizedPath, state);
      
      return state;
    }
    
    // 确保mg_kiro文档目录存在
    function ensureDocsDirectory(projectPath) {
      const docsDir = join(projectPath, 'mg_kiro');
      if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true });
      }
      return docsDir;
    }
    
    // ========== 增强的临时文件管理系统 ==========
    
    // 获取临时文件目录
    function getTempDirectory(projectPath) {
      const docsDir = ensureDocsDirectory(projectPath);
      const tempDir = join(docsDir, '.tmp');
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      return tempDir;
    }
    
    // 保存步骤结果到临时文件
    function saveStepResult(projectPath, stepName, data) {
      const tempDir = getTempDirectory(projectPath);
      const stepFile = join(tempDir, `${stepName}-result.json`);
      
      try {
        const stepData = {
          stepName,
          completedAt: new Date().toISOString(),
          data
        };
        writeFileSync(stepFile, JSON.stringify(stepData, null, 2));
        console.log(`[TempFile] Step结果已保存: ${stepFile}`);
        return stepFile;
      } catch (error) {
        console.error(`[TempFile] 保存Step结果失败: ${error.message}`);
        return null;
      }
    }
    
    
    // 检查步骤是否已完成（通过临时文件验证）
    function isStepCompleted(projectPath, stepName) {
      const tempDir = getTempDirectory(projectPath);
      const stepFile = join(tempDir, `${stepName}-result.json`);
      return existsSync(stepFile);
    }
    
    // 增强的状态验证函数
    function validateStepPrerequisites(projectPath, targetStep) {
      console.log(`[State] 验证Step${targetStep}的前置条件`);
      
      // 定义步骤依赖关系
      const stepDependencies = {
        1: [], // Step1无依赖
        2: ['step1'], // Step2依赖Step1
        3: ['step1', 'step2'], // Step3依赖Step1和Step2
        4: ['step1', 'step2', 'step3'], // Step4依赖前面所有步骤
        5: ['step1', 'step2', 'step3', 'step4'],
        6: ['step1', 'step2', 'step3', 'step4', 'step5']
      };
      
      const requiredSteps = stepDependencies[targetStep] || [];
      
      for (const requiredStep of requiredSteps) {
        // 首先检查临时文件
        if (isStepCompleted(projectPath, requiredStep)) {
          console.log(`[State] ✅ ${requiredStep} 通过临时文件验证`);
          continue;
        }
        
        // 然后检查主状态文件
        const state = loadProjectState(projectPath);
        if (state.stepsCompleted && state.stepsCompleted.includes(requiredStep)) {
          console.log(`[State] ✅ ${requiredStep} 通过主状态文件验证`);
          continue;
        }
        
        // 如果都没有找到，则前置条件不满足
        console.log(`[State] ❌ ${requiredStep} 前置条件不满足`);
        return {
          valid: false,
          missingStep: requiredStep,
          error: `Step${targetStep}需要先完成${requiredStep.toUpperCase()}，请先执行相应的步骤`
        };
      }
      
      return { valid: true };
    }
    
    // 清理临时文件
    function cleanupTempFiles(projectPath, options = {}) {
      const tempDir = getTempDirectory(projectPath);
      const { keepRecent = 0, stepPattern = null } = options;
      
      try {
        if (!existsSync(tempDir)) {
          console.log(`[Cleanup] 临时目录不存在: ${tempDir}`);
          return { cleaned: 0, kept: 0 };
        }
        
        const files = readdirSync(tempDir).filter(file => {
          return file.endsWith('-result.json') && 
                 (!stepPattern || file.includes(stepPattern));
        });
        
        let cleaned = 0;
        let kept = 0;
        
        if (keepRecent > 0) {
          // 保留最近的文件
          const filesToKeep = files.slice(-keepRecent);
          const filesToDelete = files.slice(0, -keepRecent);
          
          for (const file of filesToDelete) {
            rmSync(join(tempDir, file));
            cleaned++;
          }
          kept = filesToKeep.length;
        } else {
          // 删除所有匹配的文件
          for (const file of files) {
            rmSync(join(tempDir, file));
            cleaned++;
          }
        }
        
        console.log(`[Cleanup] 清理完成: 删除${cleaned}个文件，保留${kept}个文件`);
        return { cleaned, kept };
        
      } catch (error) {
        console.error(`[Cleanup] 清理临时文件失败: ${error.message}`);
        return { cleaned: 0, kept: 0, error: error.message };
      }
    }
    
    // 增强的getProjectState - 优先从文件系统加载
    function getProjectStateEnhanced(projectPath) {
      const normalizedPath = resolve(projectPath);
      
      // 总是从文件重新加载最新状态，而不是依赖内存缓存
      const fileState = loadProjectState(normalizedPath);
      
      // 更新内存缓存
      projectStates.set(normalizedPath, fileState);
      
      return fileState;
    }
    
    // 获取必要的服务实例
    const projectOverviewGenerator = serviceBus.get('projectOverviewGenerator');
    
    const claudeCodeInit = {
      getProgress: () => ({ percentage: 0, message: 'Ready' }),
      reset: () => ({ success: true, message: 'State reset successfully' })
    };

    try {
      switch (name) {
        case "init_step1_project_analysis": {
          const { projectPath, maxDepth, includeFiles, maxKeyFileSize } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step1] 项目分析 - ${projectPath}`);
          
          // 重置并初始化状态
          updateProjectState(projectPath, {
            currentStep: 1,
            startedAt: new Date().toISOString(),
            stepsCompleted: [],
            stepResults: {},
            error: null,
            documentCount: 0,
            generatedDocs: []
          });
          
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
          
          // 存储Step1结果到临时文件（新增）
          saveStepResult(projectPath, 'step1', {
            projectOverview: overviewResult,
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          });
          
          // 存储Step1结果到主状态文件（保持兼容）
          updateProjectState(projectPath, {
            stepResults: {
              step1: {
                projectOverview: overviewResult,
                completedAt: new Date().toISOString(),
                docsDirectory: docsDir
              }
            },
            stepsCompleted: ['step1']
          });
          
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
                    sourceCodeFiles: overviewResult.fileAnalysisInput?.fileList?.length || 0,
                    architectureType: overviewResult.projectCharacteristics?.architecture || 'Unknown',
                    complexity: overviewResult.projectCharacteristics?.complexity || 'Unknown'
                  },
                  
                  // 为Step2 FileAnalysisModule提供的数据
                  fileAnalysisInput: overviewResult.fileAnalysisInput || {
                    fileList: [],
                    projectMetadata: overviewResult.projectMetadata,
                    languageProfile: overviewResult.languageProfile
                  },
                  
                  // 下一步指导 - 更新为新的工作流程
                  workflow: {
                    current_step: "1/6 - 项目分析",
                    status: "completed",
                    next_steps: [{
                      tool: "init_step2_file_analysis",
                      description: "使用FileAnalysisModule进行智能文件分析和批次规划",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "项目基础分析已完成，现在需要FileAnalysisModule进行精确Token分析和智能批次分配"
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
          const { projectPath, batchSize, includeAnalysisTasks = true, includeSummaryTasks = true } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step2] 创建AI任务列表（新架构） - ${projectPath}`);
          
          // 使用增强的验证逻辑
          const validation = validateStepPrerequisites(projectPath, 2);
          if (!validation.valid) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: validation.error, tool: name, step: 2 }, null, 2)
              }]
            };
          }

          // 检查服务可用性
          const fileAnalysisModule = serviceBus.get('fileAnalysisModule');
          const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
          if (!fileAnalysisModule) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'FileAnalysisModule 服务未找到',
                  tool: name,
                  step: 2
                }, null, 2)
              }]
            };
          }

          if (!unifiedTaskManager) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskManager 服务未找到',
                  tool: name,
                  step: 2
                }, null, 2)
              }]
            };
          }

          const initState = getProjectStateEnhanced(projectPath);
          
          // 更新当前步骤
          updateProjectState(projectPath, { currentStep: 2 });

          // 获取Step1的结果
          const step1Results = initState.stepResults.step1.projectOverview;
          
          // 准备FileAnalysisModule所需的数据
          const analysisInput = {
            projectPath: resolve(projectPath),
            fileList: step1Results.fileAnalysisInput?.fileList || [],
            projectMetadata: step1Results.projectMetadata,
            languageProfile: step1Results.languageProfile,
            options: {
              smallFileThreshold: 15000,
              largeFileThreshold: 20000,
              batchTargetSize: batchSize ? batchSize * 6000 : 18000, // 转换批次大小为token目标
              includeAnalysisTasks,
              includeSummaryTasks
            }
          };

          try {
            // 使用FileAnalysisModule进行智能分析
            console.log(`[MCP-Init-Step2] FileAnalysisModule 分析开始:`, {
              fileCount: analysisInput.fileList.length,
              projectName: analysisInput.projectMetadata?.name,
              language: analysisInput.languageProfile?.primary,
              targetBatchSize: analysisInput.options.batchTargetSize
            });

            const analysisResult = await fileAnalysisModule.analyzeProject(
              analysisInput.projectPath,
              analysisInput.fileList,
              {
                projectMetadata: analysisInput.projectMetadata,
                languageProfile: analysisInput.languageProfile,
                options: analysisInput.options
              }
            );

            // 解构分析结果以避免IDE未解析变量警告
            const { fileAnalysis, batchStrategy, taskManagement } = analysisResult;
            const { tokenSummary } = fileAnalysis || {};
            
            // 使用UnifiedTaskManager创建批次任务
            console.log(`[MCP-Init-Step2] 使用UnifiedTaskManager创建任务...`);
            
            const batchResults = await unifiedTaskManager.createBatchTasks(
              taskManagement?.batches || [], 
              resolve(projectPath),
              'step3'
            );

            console.log(`[MCP-Init-Step2] 任务创建完成:`, {
              success: batchResults.success,
              taskCount: batchResults.count || 0,
              totalBatches: batchStrategy?.totalBatches || 0
            });

            // 存储Step2结果
            const step2Results = {
              analysisResult,
              batchResults,
              fileAnalysisInput: analysisInput,
              completedAt: new Date().toISOString(),
              // 兼容性字段
              todoList: {
                totalTasks: batchResults.count || 0,
                batchTasks: batchResults.tasks || []
              }
            };

            // 存储到临时文件和主状态
            saveStepResult(projectPath, 'step2', step2Results);
            updateProjectState(projectPath, {
              stepResults: {
                ...initState.stepResults,
                step2: step2Results
              },
              stepsCompleted: [...initState.stepsCompleted, 'step2']
            });

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  currentStep: 2,
                  stepName: 'create-todo-with-new-architecture',
                  
                  // 新架构输出摘要
                  todoCreationResults: {
                    totalTasks: batchResults.count || 0,
                    totalFiles: fileAnalysis?.totalFiles || 0,
                    analyzedFiles: fileAnalysis?.analyzedFiles || 0,
                    totalBatches: batchStrategy?.totalBatches || 0,
                    totalTokens: tokenSummary?.totalTokens || 0,
                    estimatedTime: taskManagement?.estimatedTime || '30-60分钟'
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "2/6 - AI任务创建（新架构）",
                    status: "completed",
                    architecture: "FileAnalysisModule + UnifiedTaskManager",
                    next_steps: [{
                      tool: "init_step3_get_next_task",
                      description: "开始智能批次文件处理循环，基于FileAnalysisModule的精确分析结果",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "智能任务批次已创建，现在可以开始精确的文件处理流程"
                    }],
                    progress: {
                      completed: 2,
                      total: 6,
                      percentage: Math.round(2/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step2: 智能任务列表创建完成（新架构），可以开始文档生成"
                }, null, 2)
              }]
            };

          } catch (error) {
            console.error('[MCP-Init-Step2] 新架构任务创建失败:', error);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `新架构任务创建失败: ${error.message}`,
                  tool: name,
                  step: 2,
                  architecture: "FileAnalysisModule + UnifiedTaskManager",
                  suggestion: "请检查FileAnalysisModule和UnifiedTaskManager服务状态"
                }, null, 2)
              }]
            };
          }
        }

        case "init_step2_file_analysis": {
          const { projectPath } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step2] FileAnalysisModule 文件分析 - ${projectPath}`);
          
          // 验证 Step1 是否完成
          const validation = validateStepPrerequisites(projectPath, 2);
          if (!validation.valid) {
            return {
              content: [{
                type: "text", 
                text: JSON.stringify({ error: true, message: validation.error, tool: name, step: 2 }, null, 2)
              }]
            };
          }

          // 更新当前步骤
          updateProjectState(projectPath, { currentStep: 2 });
          
          // 获取Step1的结果
          const initState = getProjectStateEnhanced(projectPath);
          const step1Results = initState.stepResults.step1.projectOverview;
          
          // 准备FileAnalysisModule所需的数据
          const analysisInput = {
            projectPath: resolve(projectPath),
            fileList: step1Results.fileAnalysisInput?.fileList || [],
            projectMetadata: step1Results.projectMetadata,
            languageProfile: step1Results.languageProfile,
            options: {
              smallFileThreshold: 15000,
              largeFileThreshold: 20000,
              batchTargetSize: 18000
            }
          };

          // 检查服务可用性
          const fileAnalysisModule = serviceBus.get('fileAnalysisModule');
          if (!fileAnalysisModule) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'FileAnalysisModule 服务未找到',
                  tool: name,
                  step: 2
                }, null, 2)
              }]
            };
          }

          try {
            // 使用真实的 FileAnalysisModule 进行分析
            console.log(`[MCP-Init-Step2] FileAnalysisModule 分析开始:`, {
              fileCount: analysisInput.fileList.length,
              projectName: analysisInput.projectMetadata?.name,
              language: analysisInput.languageProfile?.primary
            });

            // 调用 FileAnalysisModule 进行智能分析和批次规划
            const analysisResult = await fileAnalysisModule.analyzeProject(
              analysisInput.projectPath,
              analysisInput.fileList,
              {
                projectMetadata: analysisInput.projectMetadata,
                languageProfile: analysisInput.languageProfile,
                options: analysisInput.options
              }
            );

            // 解构分析结果以避免IDE未解析变量警告
            const { fileAnalysis, batchStrategy, taskManagement } = analysisResult;
            const { tokenSummary } = fileAnalysis || {};
            
            console.log(`[MCP-Init-Step2] FileAnalysisModule 分析完成:`, {
              success: analysisResult.success,
              totalFiles: fileAnalysis?.totalFiles || 0,
              totalBatches: batchStrategy?.totalBatches || 0,
              totalTasks: taskManagement?.totalTasks || 0
            });

            // 存储Step2结果
            saveStepResult(projectPath, 'step2', {
              analysisResult,
              fileAnalysisInput: analysisInput,
              completedAt: new Date().toISOString()
            });
            
            // 更新项目状态
            updateProjectState(projectPath, {
              stepResults: {
                ...initState.stepResults,
                step2: {
                  analysisResult,
                  fileAnalysisInput: analysisInput,
                  completedAt: new Date().toISOString()
                }
              },
              stepsCompleted: [...initState.stepsCompleted, 'step2']
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    currentStep: 2,
                    stepName: 'file-analysis',
                    projectPath: resolve(projectPath),
                    
                    // 分析结果摘要
                    analysisResults: {
                      totalFiles: fileAnalysis?.totalFiles || 0,
                      analyzedFiles: fileAnalysis?.analyzedFiles || 0,
                      totalTokens: tokenSummary?.totalTokens || 0,
                      totalBatches: batchStrategy?.totalBatches || 0,
                      totalTasks: taskManagement?.totalTasks || 0
                    },
                    
                    // 下一步指导
                    workflow: {
                      current_step: "2/6 - 文件分析模块",
                      status: "completed", 
                      next_steps: [{
                        tool: "init_step3_get_next_task",
                        description: "开始Step3文件文档生成循环，基于FileAnalysisModule的智能批次计划",
                        suggested_params: {
                          projectPath: resolve(projectPath)
                        },
                        why: "FileAnalysisModule已完成智能文件分析和批次规划，现在可以开始精确的文件处理流程"
                      }],
                      progress: {
                        completed: 2,
                        total: 6,
                        percentage: Math.round(2/6 * 100)
                      }
                    },
                    
                    success: true,
                    message: "Step2: FileAnalysisModule分析完成，智能批次计划已生成"
                  }, null, 2)
                }
              ]
            };

          } catch (error) {
            console.error('[MCP-Init-Step2] FileAnalysisModule分析失败:', error);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `FileAnalysisModule分析失败: ${error.message}`,
                  tool: name,
                  step: 2
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step3_get_next_task": {
          const { projectPath } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step3] 获取下一个文件任务（新架构） - ${projectPath}`);
          
          // 使用增强的验证逻辑
          const validation = validateStepPrerequisites(projectPath, 3);
          if (!validation.valid) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: validation.error, tool: name }, null, 2)
              }]
            };
          }
          
          const initState = getProjectStateEnhanced(projectPath);
          
          initState.currentStep = 3;
          
          // 检查服务可用性
          const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
          if (!unifiedTaskManager) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskManager 服务未找到',
                  tool: name,
                  step: 3
                }, null, 2)
              }]
            };
          }

          try {
            // 使用UnifiedTaskManager获取下一个任务
            const nextTask = await unifiedTaskManager.getNextTask(resolve(projectPath), 'step3');
            
            if (!nextTask) {
              // 没有更多任务，Step3完成
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
          
            // 获取任务统计信息
            const taskStats = await unifiedTaskManager.getStepStatistics('step3');
            
            // ✅ 设置增强的任务上下文，包含预分析数据
            const taskMetadata = nextTask.metadata || {};
            const contextData = {
              taskId: nextTask.id,
              relativePath: taskMetadata.relativePath || 'unknown',
              fileName: taskMetadata.fileName || path.basename(taskMetadata.relativePath || 'unknown'),
              fileSize: taskMetadata.fileSize || 0,
              priority: taskMetadata.priority || 0,
              estimatedTime: taskMetadata.estimatedTime || '未知',
              title: `处理文件: ${taskMetadata.fileName || 'unknown'}`,
              description: taskMetadata.description || '文件内容分析和文档生成',
              step: 'get_next_task_completed',
              // ✅ 新增: 传递完整的元数据（包括预分析数据）
              metadata: {
                ...taskMetadata,
                // 确保关键预分析数据存在
                chunkingAdvice: taskMetadata.chunkingAdvice,
                estimatedFileTokens: taskMetadata.estimatedFileTokens || taskMetadata.estimatedTokens,
                language: taskMetadata.language,
                strategy: taskMetadata.strategy,
                allFiles: taskMetadata.allFiles // 用于多文件批次
              }
            };
            
            setCurrentTaskContext(projectPath, contextData);
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation',
                  status: "task_available",
                  
                  // 当前任务信息（新架构格式）
                  currentTask: {
                    taskId: nextTask.id,
                    filePath: taskMetadata.relativePath || 'unknown',
                    fileName: contextData.fileName,
                    fileSize: contextData.fileSize,
                    priority: contextData.priority,
                    estimatedTime: contextData.estimatedTime,
                    title: contextData.title,
                    description: contextData.description,
                    stepType: nextTask.stepType,
                    status: nextTask.status
                  },
                  
                  // 进度信息（来自UnifiedTaskManager统计）
                  progress: {
                    completed: taskStats.statistics?.completed || 0,
                    total: taskStats.statistics?.total || 0,
                    remaining: (taskStats.statistics?.total || 0) - (taskStats.statistics?.completed || 0),
                    percentage: taskStats.statistics?.total > 0 ? 
                      Math.round((taskStats.statistics?.completed || 0) / taskStats.statistics.total * 100) : 0
                  },
                  
                  // 工作流指导
                  workflow: {
                    current_step: "3/6 - 文件文档生成（进行中）",
                    status: "in_progress",
                    next_steps: [{
                      tool: "init_step3_get_file_content",
                      description: "获取文件内容进行文档生成",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "任务已准备就绪，可以获取文件内容"
                    }],
                    progress: {
                      completed: 3,
                      total: 6,
                      percentage: 50
                    }
                  },
                  
                  // 状态可视化
                  workflow_status: {
                    current_step: 3,
                    step_name: "文件处理循环",
                    progress: `处理 ${nextTask.id} (${(taskStats.statistics?.completed || 0) + 1}/${taskStats.statistics?.total || 0})`,
                    allowed_next_tools: ["init_step3_get_file_content"],
                    forbidden_tools: ["init_step3_complete_task", "init_step4_module_integration"],
                    ai_context: "✅ 系统已进入step3，任务上下文已设置",
                    ai_instruction: "🎯 下一步：调用 init_step3_get_file_content",
                    current_task_ready: true
                  },
                  
                  success: true,
                  message: "Step3: 获取到下一个文件处理任务"
                }, null, 2)
              }]
            };
            
          } catch (error) {
            console.error('[Step3] 获取任务失败:', error.message);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `获取任务失败: ${error.message}`,
                  tool: name,
                  step: 3
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step3_get_file_content": {
          // 智能参数补全 - 支持自动从上下文获取任务信息
          let { projectPath, taskId, relativePath} = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          // 智能参数补全：从任务上下文自动获取缺失的参数
          const taskContext = getCurrentTaskContext(projectPath);
          
          if (!taskId && taskContext) {
            taskId = taskContext.taskId;
            console.log(`[Auto-Param] 从上下文自动获取 taskId: ${taskId}`);
          }
          
          if (!relativePath && taskContext) {
            relativePath = taskContext.relativePath;
            console.log(`[Auto-Param] 从上下文自动获取 relativePath: ${relativePath}`);
          }
          
          // 容错处理：如果还是缺少关键参数，尝试智能恢复
          if (!taskId || !relativePath) {
            if (taskContext) {
              console.log(`[Auto-Recovery] 任务上下文存在但参数不完整，尝试恢复...`);
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ 
                    error: true, 
                    message: `参数不完整，上下文信息: taskId=${taskContext.taskId}, relativePath=${taskContext.relativePath}`, 
                    autoRecovery: {
                      suggestion: "请先调用 init_step3_get_next_task 获取新任务，或提供 taskId 和 relativePath 参数",
                      contextAvailable: true,
                      contextData: taskContext
                    },
                    tool: name 
                  }, null, 2)
                }]
              };
            } else {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ 
                    error: true, 
                    message: "缺少任务上下文，请先调用 init_step3_get_next_task 获取任务", 
                    autoRecovery: {
                      suggestion: "调用 init_step3_get_next_task 获取下一个文件任务",
                      contextAvailable: false
                    },
                    tool: name 
                  }, null, 2)
                }]
              };
            }
          }
          
          console.log(`[MCP-Init-Step3] 获取文件内容 - ${projectPath} 任务:${taskId} 文件:${relativePath}`);
          
          // 调试：检查文件大小，确保分片逻辑会被触发
          try {
            const fs = await import('fs');
            const fullFilePath = resolve(projectPath, relativePath);
            const quickStats = fs.statSync(fullFilePath);
            console.log(`[Debug] 文件 ${relativePath} 大小: ${quickStats.size} 字节`);
            
            if (quickStats.size > 25000) {
              console.log(`[Debug] 大文件检测，强制启用超小分片模式`);
            }
          } catch (debugError) {
            console.log(`[Debug] 无法获取文件统计信息: ${debugError.message}`);
          }
          
          try {
            // 使用fileQueryService的智能分片功能
            const fileQueryService = serviceBus.get('fileQueryService');
            
            // ✅ 智能分片处理，优先使用预分析数据
            const taskContext = getCurrentTaskContext(projectPath);
            const taskMetadata = taskContext?.metadata || {};
            
            let processingOptions = {
              maxContentLength: 6000,
              includeTrimming: true,
              includeAnalysis: false,
              enableChunking: true,
              maxTokensPerChunk: 1500
            };
            
            // ✅ 智能联动：优先使用FileAnalysisModule的预分析结果
            if (taskMetadata.chunkingAdvice && taskMetadata.estimatedFileTokens) {
              const chunkingAdvice = taskMetadata.chunkingAdvice;
              const preAnalysisTokens = taskMetadata.estimatedFileTokens;
              const fileSize = taskMetadata.fileSize || 0;
              
              console.log(`[✅ Smart-Chunk] 使用预分析数据: ${relativePath}`);
              console.log(`[✅ Smart-Chunk] 预估Token: ${preAnalysisTokens}, 文件大小: ${fileSize}字节`);
              
              // 使用预分析的分片建议
              processingOptions = {
                ...processingOptions,
                enableChunking: chunkingAdvice.recommended,
                maxTokensPerChunk: chunkingAdvice.maxTokensPerChunk || 1500,
                maxContentLength: Math.min(8000, chunkingAdvice.maxTokensPerChunk * 4 || 6000),
                // ✅ 新增: 传递预分析数据
                preAnalysisData: {
                  estimatedTokens: preAnalysisTokens,
                  fileSize: fileSize,
                  chunkingAdvice: chunkingAdvice,
                  strategy: taskMetadata.strategy,
                  language: taskMetadata.language
                }
              };
              
              console.log(`[✅ Smart-Chunk] 使用智能分片: 启用=${processingOptions.enableChunking}, 每片Token=${processingOptions.maxTokensPerChunk}`);
              
            } else {
              // ☔ 降级到传统文件大小检测（用于向后兼容）
              console.log(`[☔ Fallback-Chunk] 无预分析数据，降级到文件大小检测: ${relativePath}`);
              
              try {
                const fs = await import('fs');
                const fullFilePath = resolve(projectPath, relativePath);
                const fileStats = fs.statSync(fullFilePath);
                
                console.log(`[☔ Fallback-Chunk] 检测文件 ${relativePath} 大小: ${fileStats.size}字节`);
                
                if (fileStats.size > 20000) {
                  processingOptions.maxTokensPerChunk = 1200;
                  processingOptions.maxContentLength = 4800;
                  console.log(`[☔ Fallback-Chunk] 大文件超小分片: ${processingOptions.maxTokensPerChunk} tokens/片`);
                } else if (fileStats.size > 10000) {
                  processingOptions.maxTokensPerChunk = 1500;
                  processingOptions.maxContentLength = 6000;
                  console.log(`[☔ Fallback-Chunk] 中等文件小分片: ${processingOptions.maxTokensPerChunk} tokens/片`);
                } else {
                  processingOptions.maxContentLength = 8000;
                  processingOptions.enableChunking = false;
                  console.log(`[☔ Fallback-Chunk] 小文件直接处理，限制8000字符`);
                }
              } catch (statsError) {
                processingOptions.maxTokensPerChunk = 1200;
                processingOptions.maxContentLength = 4800;
                console.log(`[☔ Fallback-Chunk] 无法检测文件，使用保守设置: ${statsError.message}`);
              }
            }
            
            // 使用fileQueryService获取文件详情
            const fileDetails = await fileQueryService.getFileDetails(
              resolve(projectPath), 
              relativePath, 
              processingOptions
            );
            
            const fileName = fileDetails.file.name;
            const fileExtension = fileDetails.file.extension.replace('.', '');
            const fileContent = fileDetails.content;
            const docsDir = ensureDocsDirectory(resolve(projectPath));
            const filesDir = join(docsDir, 'files');
            if (!fs.existsSync(filesDir)) {
              fs.mkdirSync(filesDir, { recursive: true });
            }
            
            // 更新任务上下文状态
            if (taskContext) {
              setCurrentTaskContext(projectPath, {
                ...taskContext,
                step: 'get_file_content_completed',
                content: fileContent.slice(0, 200) + '...' // 保存内容预览
              });
            }
            
            // 超精简响应结构 - 只返回核心内容，减少token消耗
            let responseData = {
              currentStep: 3,
              stepName: 'file-documentation',
              status: fileDetails.chunking ? "chunked_content_ready" : "content_ready",
              fileContent: {
                taskId: taskId,
                fileName: fileName,
                content: fileContent,
                language: fileExtension
              },
              success: true,
              
              // 🎯 AI状态可视化 - 文件内容已获取，现在需要生成分析文档
              workflow_status: {
                current_step: 3,
                step_name: "文件处理循环", 
                progress: `已获取${fileName}内容，准备生成分析`,
                allowed_next_tools: ["init_step3_generate_analysis"],
                forbidden_tools: ["init_step3_get_next_task", "init_step3_complete_task", "init_step4_module_integration"],
                
                // 🧠 AI认知提示
                ai_context: "✅ 文件内容已获取，任务上下文已更新，现在必须调用generate_analysis生成分析文档",
                ai_instruction: `🎯 下一步：调用 init_step3_generate_analysis 基于文件内容生成分析文档`,
                content_ready: true
              }
            };

            // 只在分片模式下添加必要的分片信息
            if (fileDetails.chunking) {
              responseData.chunking = {
                currentChunk: fileDetails.chunking.currentChunk || 1,
                totalChunks: fileDetails.chunking.totalChunks
              };
              
              // 只在多分片时添加导航提示
              if (fileDetails.chunking.totalChunks > 1) {
                responseData.chunking.hasMore = true;
              }
            }

            // 激进截断策略 - 确保绝对不会超过MCP限制
            const contentSize = fileContent.length;
            const maxSafeContentSize = 10000; // 10KB绝对安全限制
            
            console.log(`[MCP-SafeCheck] 内容大小: ${contentSize}字符`);
            
            if (contentSize > maxSafeContentSize) {
              console.log(`[MCP-SafeCheck] 内容超过安全限制，强制截断到${maxSafeContentSize}字符`);
              
              responseData.fileContent.content = fileContent.slice(0, maxSafeContentSize);
              responseData.fileContent.truncated = {
                original: contentSize,
                shown: maxSafeContentSize,
                reason: 'MCP安全限制',
                note: '使用chunkIndex参数获取其他部分'
              };
              responseData.status = 'content_safe_truncated';
            }
            
            // 最终安全检查 - 确保整个响应结构也不会过大
            const finalCheckJson = JSON.stringify(responseData);
            const finalTokens = finalCheckJson.length * 0.25;
            console.log(`[MCP-FinalCheck] 最终响应大小: ${finalCheckJson.length}字符, ~${Math.round(finalTokens)} tokens`);
            
            if (finalTokens > 20000) {
              console.log(`[MCP-FinalCheck] 最终响应仍然过大，进行二次截断`);
              const currentContent = responseData.fileContent.content;
              const emergencyLimit = Math.max(5000, 15000 - (finalCheckJson.length - currentContent.length));
              
              responseData.fileContent.content = currentContent.slice(0, emergencyLimit);
              responseData.fileContent.emergencyTruncation = true;
              responseData.status = 'emergency_truncated';
            }

            return {
              content: [{
                type: "text",
                text: JSON.stringify(responseData, null, 2)
              }]
            };
          } catch (error) {
            console.error(`[Smart-Processing] 智能文件处理失败: ${error.message}`);
            
            // 如果智能处理失败，尝试降级到基本处理
            try {
              console.log(`[Smart-Processing] 尝试基本文件读取作为备选方案...`);
              const fs = await import('fs');
              const fullFilePath = resolve(projectPath, relativePath);
              
              if (!fs.existsSync(fullFilePath)) {
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({ 
                      error: true, 
                      message: `文件不存在: ${relativePath}`, 
                      tool: name, 
                      step: 3 
                    }, null, 2)
                  }]
                };
              }
              
              let basicContent = fs.readFileSync(fullFilePath, 'utf8');
              const fileName = relativePath.split('/').pop();
              const originalLength = basicContent.length;
              
              // Fallback模式也需要MCP token限制检查
              let fallbackData = {
                currentStep: 3,
                stepName: 'file-documentation',
                status: "content_ready_fallback",
                fileContent: {
                  taskId: taskId,
                  relativePath: relativePath,
                  fileName: fileName,
                  content: basicContent,
                  language: fileName.includes('.') ? fileName.split('.').pop() : '',
                  size: fs.statSync(fullFilePath).size,
                  lines: basicContent.split('\n').length,
                  processing: {
                    fallbackMode: true,
                    reason: "智能处理失败，使用基本读取",
                    originalError: error.message
                  }
                },
                aiInstructions: {
                  task: "为这个文件生成详细的技术文档（基本模式）",
                  format: "Markdown格式",
                  outputFile: `mg_kiro/files/${fileName}.md`
                },
                success: true,
                message: `Step3: 文件 ${relativePath} 基本处理完成（智能处理失败后的备选方案）`,
                warning: `智能处理失败: ${error.message}，已降级到基本处理模式`
              };

              // 检查fallback模式的token限制
              const fallbackJson = JSON.stringify(fallbackData, null, 2);
              const fallbackTokens = fallbackJson.length * 0.25;
              
              if (fallbackTokens > 22000) {
                console.log(`[MCP-Fix-Fallback] 基本处理响应过大(${Math.round(fallbackTokens)} tokens)，进行内容截断`);
                
                const maxContentLength = Math.max(8000, 15000 - (fallbackJson.length - basicContent.length) * 0.25);
                const truncatedContent = basicContent.slice(0, maxContentLength);
                
                fallbackData.fileContent.content = truncatedContent;
                fallbackData.fileContent.contentTruncated = {
                  originalLength: originalLength,
                  truncatedLength: truncatedContent.length,
                  compressionRatio: Math.round((truncatedContent.length / originalLength) * 100) + '%',
                  reason: 'MCP token限制，基本模式内容已截断'
                };
                
                fallbackData.status = "content_ready_fallback_truncated";
                fallbackData.message = fallbackData.message + '（内容已截断避免MCP限制）';
              }
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(fallbackData, null, 2)
                }]
              };
              
            } catch (fallbackError) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ 
                    error: true, 
                    message: `文件处理完全失败: 智能处理错误 - ${error.message}; 基本处理错误 - ${fallbackError.message}`, 
                    tool: name,
                    autoRecovery: {
                      suggestion: "请检查文件路径是否正确，文件是否可读，或尝试重新获取任务",
                      file: relativePath,
                      projectPath: projectPath,
                      smartProcessingError: error.message,
                      basicProcessingError: fallbackError.message
                    }
                  }, null, 2)
                }]
              };
            }
          }
        }
        
        case "init_step3_generate_analysis": {
          // 🧠 新增：文档生成链接层 - 提供模板指导AI生成标准化分析文档
          let { projectPath, taskId, analysisContent, analysisStyle, includeCodeExamples } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          // 自动参数补全：从上下文获取taskId和文件信息
          const taskContext = getCurrentTaskContext(projectPath);
          if (!taskId && taskContext) {
            taskId = taskContext.taskId;
            console.log(`[Auto-Param] 从上下文自动获取 taskId: ${taskId}`);
          }
          
          if (!taskId) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ 
                  error: true, 
                  message: "任务ID不能为空。请先调用get_file_content获取任务上下文", 
                  contextAvailable: !!taskContext,
                  tool: name 
                }, null, 2)
              }]
            };
          }
          
          // 🎯 双重模式：如果AI没有提供内容，则提供模板指导；如果提供了内容，则保存
          if (!analysisContent || analysisContent.trim().length === 0) {
            // 模式1：提供模板和指导，让AI生成文档
            try {
              const templatePath = join(__dirname, 'prompts/modes/init/file-documentation/file-analysis.md');
              const template = readFileSync(templatePath, 'utf-8');
              
              const fileName = taskContext?.fileName || '未知文件';
              const fileContent = taskContext?.content || '';
              const fileSize = fileContent.length;
              const lineCount = fileContent.split('\n').length;
              
              // 新增：计算期望的文件路径和名称
              const batchStrategy = taskContext?.batchStrategy || 'Unknown';
              const { expectedFilePath, expectedFileName } = generateExpectedFilePath(
                taskId, batchStrategy, fileName, projectPath
              );
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    currentStep: 3,
                    stepName: 'file-documentation', 
                    mode: "template_provided",
                    taskId: taskId,
                    
                    // 🧠 AI指导信息 - 完整的文件创建工作流
                    ai_guidance: {
                      instruction: "请基于提供的模板和文件信息，生成详细的文件分析文档",
                      template_usage: "使用模板中的结构，替换{{变量}}为实际内容",
                      next_action: "再次调用 init_step3_generate_analysis，提供 analysisContent 参数",
                      
                      // 新增：明确的文件创建指导
                      file_creation_workflow: {
                        step1: "基于模板生成分析内容",
                        step2: "调用 init_step3_generate_analysis 提供 analysisContent",
                        step3: "使用 Write 工具创建文件",
                        step4: "调用 init_step3_check_task_completion 验证完成"
                      },
                      
                      file_creation_details: {
                        tool_required: "Write",
                        file_path: expectedFilePath,
                        relative_path: `mg_kiro/files/${expectedFileName}`,
                        file_name: expectedFileName,
                        content_source: "AI生成的分析文档内容"
                      }
                    },
                    
                    // 📋 文档生成模板
                    documentation_template: template,
                    
                    // 📊 文件基础信息
                    file_info: {
                      fileName: fileName,
                      filePath: taskContext?.relativePath || '',
                      fileType: taskContext?.fileName?.split('.').pop() || '',
                      language: taskContext?.language || 'unknown',
                      fileSize: `${Math.round(fileSize / 1024 * 10) / 10}KB`,
                      lineCount: lineCount,
                      generatedAt: new Date().toISOString()
                    },
                    
                    // 📝 文件内容摘要（用于AI参考）
                    file_content_preview: fileContent.slice(0, 1000) + (fileContent.length > 1000 ? '...' : ''),
                    
                    workflow_status: {
                      current_step: 3,
                      step_name: "文件分析指导", 
                      progress: `为${fileName}提供分析模板，等待AI生成文档`,
                      allowed_next_tools: ["init_step3_generate_analysis"],
                      forbidden_tools: ["init_step3_complete_task", "init_step3_get_next_task"],
                      
                      ai_context: "✅ 已提供文档模板和文件信息，AI需要基于模板生成分析文档",
                      ai_instruction: `🎯 请基于模板生成${fileName}的详细分析，然后再次调用 init_step3_generate_analysis 提供 analysisContent`,
                      template_ready: true
                    },
                    
                    message: "Step3: 已提供文档模板，请AI基于模板生成分析文档"
                  }, null, 2)
                }]
              };
              
            } catch (templateError) {
              console.error('[Template Error]', templateError);
              // 模板读取失败时的fallback
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    error: true,
                    message: "无法读取文档模板",
                    fallback_guidance: {
                      instruction: "请为文件生成包含以下部分的分析文档：",
                      sections: [
                        "# 文件概述",
                        "## 核心功能", 
                        "## 代码结构",
                        "## 主要组件",
                        "## 依赖关系",
                        "## 使用示例",
                        "## 注意事项"
                      ]
                    },
                    tool: name
                  }, null, 2)
                }]
              };
            }
          } else {
            // 模式2：AI提供了分析内容，保存到上下文并指导文件创建
            console.log(`[MCP-Init-Step3] 接收AI生成的分析文档 - ${projectPath} 任务:${taskId}`);
            
            // 计算文件路径信息
            const batchStrategy = taskContext?.batchStrategy || 'Unknown';
            const fileName = taskContext?.fileName || '未知文件';
            const { expectedFilePath, expectedFileName } = generateExpectedFilePath(
              taskId, batchStrategy, fileName, projectPath
            );
            
            // 保存AI生成的分析文档到任务上下文，包含文件路径信息
            if (taskContext) {
              setCurrentTaskContext(projectPath, {
                ...taskContext,
                step: 'analysis_ready_for_file_creation',
                analysisContent: analysisContent,
                analysisStyle: analysisStyle || 'comprehensive',
                includeCodeExamples: includeCodeExamples !== false,
                expectedFilePath,
                expectedFileName
              });
            }
            
            // 🎯 精简响应 - 明确告诉AI下一步要做什么
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation', 
                  mode: "analysis_content_received",
                  status: "ready_to_create_file",
                  taskId: taskId,
                  analysisReceived: {
                    length: analysisContent.length,
                    style: analysisStyle || 'comprehensive',
                    includeCodeExamples: includeCodeExamples !== false
                  },
                  success: true,
                  
                  // 🎯 AI状态可视化 - 分析内容已准备，现在必须创建文件
                  workflow_status: {
                    current_step: 3,
                    step_name: "文档文件创建", 
                    progress: `已接收${taskContext?.fileName || '文件'}分析内容，现在需要创建文档文件`,
                    
                    // 🚨 关键修正：明确下一步是创建文件，而不是直接验证
                    allowed_next_tools: ["Write"],
                    required_actions: [
                      {
                        action: "create_file",
                        tool: "Write", 
                        file_path: expectedFilePath,
                        relative_path: `mg_kiro/files/${expectedFileName}`,
                        content: "analysisContent from context",
                        description: `创建文件 ${expectedFileName}`
                      },
                      {
                        action: "verify_completion",
                        tool: "init_step3_check_task_completion",
                        condition: "after file creation",
                        description: "验证文件创建完成"
                      }
                    ],
                    forbidden_tools: ["init_step3_get_next_task", "init_step3_get_file_content", "init_step4_module_integration"],
                    
                    // 🧠 修正的AI认知提示
                    ai_context: "✅ 分析内容已准备完毕，但文件尚未创建到磁盘",
                    ai_instruction: `🎯 下一步：使用 Write 工具创建文件 ${expectedFilePath}，内容为刚才提供的 analysisContent`,
                    file_creation_pending: true
                  },
                  
                  // 新增：明确的文件创建指导
                  file_creation_required: {
                    tool: "Write",
                    file_path: expectedFilePath,
                    relative_path: `mg_kiro/files/${expectedFileName}`,
                    file_name: expectedFileName,
                    content_variable: "analysisContent",
                    why: "MCP工具只提供提示词，实际文件需要AI通过Write工具创建"
                  },
                  
                  message: `Step3: 分析内容已接收，请使用 Write 工具创建文件 ${expectedFileName}`
                }, null, 2)
              }]
            };
          }
        }
        
        
        
        case "init_step3_check_task_completion": {
          const { projectPath, taskId, stepType } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step3] 检查任务完成状态 - ${projectPath} 任务:${taskId || '自动获取'} 类型:${stepType || 'step3'}`);
          
          // 检查服务可用性
          const unifiedTaskValidator = serviceBus.get('unifiedTaskValidator');
          if (!unifiedTaskValidator) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskValidator 服务未找到',
                  tool: name,
                  step: 3
                }, null, 2)
              }]
            };
          }

          try {
            // 获取当前任务上下文，支持自动获取taskId
            const taskContext = getCurrentTaskContext(projectPath);
            const actualTaskId = taskId || taskContext?.taskId;
            const actualStepType = stepType || 'step3';
            
            if (!actualTaskId && actualStepType === 'step3') {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    error: true,
                    message: "没有找到当前任务，请先调用 get_next_task",
                    tool: name,
                    contextAvailable: !!taskContext,
                    suggestion: "请先调用 init_step3_get_next_task 获取任务"
                  }, null, 2)
                }]
              };
            }
            
            // 构造任务定义（简化版）
            const taskDefinition = {
              taskId: actualTaskId,
              step: actualStepType,
              projectPath: resolve(projectPath),
              stepType: actualStepType
            };
            
            // 执行验证
            const validation = await unifiedTaskValidator.checkTaskCompletion(taskDefinition, resolve(projectPath));
            
            console.log(`[TaskValidation] 验证结果:`, {
              success: validation.success,
              autoCompleted: validation.autoCompleted,
              strategy: validation.validationStrategy,
              message: validation.message
            });
            
            if (validation.success && validation.autoCompleted) {
              // ✅ 任务自动完成
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    taskCompleted: true,
                    taskId: actualTaskId,
                    method: 'auto',
                    stepType: actualStepType,
                    message: validation.message,
                    validationStrategy: validation.validationStrategy,
                    nextAction: validation.nextAction,
                    details: validation.details,
                    workflow: {
                      current_step: `${actualStepType}/6 - 任务自动完成`,
                      status: "auto_completed",
                      next_action: validation.nextAction
                    }
                  }, null, 2)
                }]
              };
            } else {
              // ⚠️ 任务未完成，返回缺失文件信息
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    taskCompleted: false,
                    taskId: actualTaskId,
                    stepType: actualStepType,
                    message: validation.message,
                    validationStrategy: validation.validationStrategy,
                    nextAction: validation.nextAction,
                    missingInfo: validation.details,
                    aiInstruction: `请生成缺失的文档或文件，然后再次调用此工具检查完成状态`,
                    retryAdvice: "生成文件后请再次调用 init_step3_check_task_completion"
                  }, null, 2)
                }]
              };
            }
            
          } catch (error) {
            console.error(`[TaskValidation] 验证失败: ${error.message}`);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `任务验证失败: ${error.message}`,
                  tool: name,
                  suggestion: "请检查项目状态或重试操作"
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step4_module_integration": {
          const { projectPath } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step4] 模块整合 - ${projectPath}`);
          
          // 检查服务可用性
          const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
          if (!unifiedTaskManager) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskManager 服务未找到',
                  tool: name,
                  step: 4
                }, null, 2)
              }]
            };
          }

          try {
            
            // 检查 Step3 是否完成
            const validation = validateStepPrerequisites(projectPath, 4);
            if (!validation.valid) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ error: true, message: validation.error, tool: name }, null, 2)
                }]
              };
            }
          
            const initState = getProjectStateEnhanced(projectPath);
            
            // 创建Step4任务
            const taskDefinition = {
              id: `step4_module_integration_${Date.now()}`,
              type: 'module_integration',
              description: '模块整合任务',
              files: [], // Step4不基于特定文件，而是整合已有文档
              metadata: {
                docsDirectory: join(resolve(projectPath), 'mg_kiro'),
                outputPath: join(resolve(projectPath), 'mg_kiro/modules/'),
                stepNumber: 4
              }
            };
            
            const task = await unifiedTaskManager.createTask(taskDefinition, projectPath, 'step4');
          
          initState.currentStep = 4;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成模块整合AI指导提示词
          const integrationPrompt = `
## 模块整合任务 - Step 4

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 已生成文档数: ${initState.documentCount || 0}

### 任务目标
将模块内的多个文件整合在一起，添加模块相关功能，生成模块总览文档。

### 具体要求
1. **模块识别**: 根据文件功能和依赖关系，将相关文件归类到逻辑模块
2. **模块整合**: 为每个模块创建整合文档，包含：
   - 模块职责和目标
   - 模块内文件列表和作用
   - 模块对外提供的接口
   - 模块的核心功能
3. **模块总览**: 创建所有模块的总览文档

### 输出要求
请创建以下文档结构：
- \`${docsDir}/modules/module-overview.md\` - 所有模块的总览
- \`${docsDir}/modules/[module-name]/README.md\` - 每个模块的详细文档
- \`${docsDir}/modules/[module-name]/files.md\` - 模块内文件清单和说明

### 分析步骤
1. 读取 \`${docsDir}/files/\` 下的所有文件文档
2. 根据文件路径、功能职责、依赖关系进行模块划分
3. 为每个模块创建详细的整合文档
4. 生成模块总览，说明每个模块的作用和重要性

### 模块划分建议
- **核心模块**: 主要业务逻辑和核心功能
- **服务模块**: 工具、服务、辅助功能
- **配置模块**: 配置文件、环境设置
- **接口模块**: API、路由、控制器
- **数据模块**: 数据处理、模型、存储
- **测试模块**: 测试文件和测试工具

完成后，请调用 \`init_step5_module_relations\` 继续下一步。
          `;
          
          // 存储Step4结果到临时文件
          saveStepResult(projectPath, 'step4', {
            integrationPrompt: integrationPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          });
          
          // 存储Step4结果到主状态文件
          initState.stepResults.step4 = {
            integrationPrompt: integrationPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step4');
          updateProjectState(projectPath, initState);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 4,
                  stepName: 'module-integration',
                  status: "task_created",
                  
                  // 统一任务管理器信息
                  taskManager: {
                    taskId: task.id,
                    taskStatus: task.status,
                    taskType: 'module_integration',
                    createdAt: task.createdAt,
                    validation: {
                      tool: 'init_step3_check_task_completion',
                      params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step4'
                      }
                    }
                  },
                  
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
                    status: "task_ready",
                    next_steps: [{
                      tool: "init_step3_check_task_completion",
                      description: "检查模块整合任务完成情况",
                      suggested_params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step4'
                      },
                      why: "完成模块整合后，需要验证并自动进入下一步骤"
                    }],
                    progress: {
                      completed: 4,
                      total: 6,
                      percentage: Math.round(4/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step4: 模块整合任务已创建，请按照提示完成后使用验证工具检查"
                }, null, 2)
              }
            ]
          };
          } catch (error) {
            console.error(`[Step4] UnifiedTaskManager 集成失败: ${error.message}`);
            // 回退到传统实现作为备选方案
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `Step4 统一任务管理失败: ${error.message}`,
                  fallback: "使用传统模式处理",
                  tool: name,
                  suggestion: "请检查 UnifiedTaskManager 服务状态"
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step5_module_relations": {
          const { projectPath } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step5] 模块关联分析 - ${projectPath}`);
          
          // 检查服务可用性
          const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
          if (!unifiedTaskManager) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskManager 服务未找到',
                  tool: name,
                  step: 5
                }, null, 2)
              }]
            };
          }

          try {
            
            // 使用增强的验证逻辑
            const validation = validateStepPrerequisites(projectPath, 5);
            if (!validation.valid) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ error: true, message: validation.error, tool: name }, null, 2)
                }]
              };
            }
            
            const initState = getProjectStateEnhanced(projectPath);
            
            // 创建Step5任务
            const taskDefinition = {
              id: `step5_module_relations_${Date.now()}`,
              type: 'module_relations',
              description: '模块关联分析任务',
              files: [], // Step5基于已有的文档和模块分析结果
              metadata: {
                docsDirectory: join(resolve(projectPath), 'mg_kiro'),
                outputPath: join(resolve(projectPath), 'mg_kiro/relations/'),
                stepNumber: 5,
                expectedOutputs: [
                  'function-calls.md',
                  'module-dependencies.md',
                  'data-flows.md',
                  'overview.md'
                ]
              }
            };
            
            const task = await unifiedTaskManager.createTask(taskDefinition, projectPath, 'step5');
          
          initState.currentStep = 5;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成模块关联分析提示词
          const relationsPrompt = `
## 模块关联分析任务 - Step 5

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 处理阶段: 基于完整的文件文档和模块整合结果

### 任务目标
详细阐述每个文件之间的关联，分析哪个函数被多个模块调用，生成详细的依赖关系图。

### 输入资源
1. **文件文档**: \`${docsDir}/files/\` - 所有源码文件的详细分析
2. **模块文档**: \`${docsDir}/modules/\` - 模块整合分析结果

### 分析维度

#### 1. 函数调用关系
- 识别跨模块的函数调用
- 分析高频被调用的函数
- 标记核心工具函数和接口

#### 2. 数据依赖关系
- 分析数据流向和传递链路
- 识别共享的数据结构和类型
- 标记关键数据接口

#### 3. 模块间依赖
- 分析模块之间的导入/导出关系
- 识别循环依赖和潜在问题
- 评估模块耦合程度

#### 4. 接口和服务调用
- 分析内部API调用关系
- 识别服务层的调用模式
- 标记关键的服务接口

### 输出要求
请创建以下关联分析文档：

#### 1. 函数调用关系图 - \`${docsDir}/relations/function-calls.md\`
- 跨模块函数调用的详细清单
- 高频被调用函数的分析报告
- 函数调用链路图和说明

#### 2. 模块依赖关系图 - \`${docsDir}/relations/module-dependencies.md\`
- 模块间的完整依赖关系图
- 依赖强度分析和评级
- 循环依赖检测和建议

#### 3. 数据流向分析 - \`${docsDir}/relations/data-flows.md\`
- 关键数据的流转路径
- 数据变换和处理节点
- 数据接口的使用频率

#### 4. 关联总览 - \`${docsDir}/relations/overview.md\`
- 整个项目的关联关系总结
- 关键节点和瓶颈分析
- 架构优化建议

### 分析方法
1. 解析所有文件文档中的导入/导出信息
2. 识别函数定义和调用关系
3. 构建完整的调用关系图谱
4. 分析数据传递和变换过程
5. 评估模块间的耦合度和依赖强度

### 重点关注
- **高频调用函数**: 被多个模块调用的核心函数
- **数据中心节点**: 数据汇聚和分发的关键位置
- **接口边界**: 模块间的主要交互接口
- **潜在风险点**: 过度耦合或循环依赖的位置

完成后，请调用 \`init_step6_architecture_docs\` 进行最终的架构文档生成。
          `;
          
          // 存储Step5结果到临时文件
          saveStepResult(projectPath, 'step5', {
            relationsPrompt: relationsPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          });
          
          // 存储Step5结果到主状态文件
          initState.stepResults.step5 = {
            relationsPrompt: relationsPrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step5');
          updateProjectState(projectPath, initState);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 5,
                  stepName: 'module-relations',
                  status: "task_created",
                  
                  // 统一任务管理器信息
                  taskManager: {
                    taskId: task.id,
                    taskStatus: task.status,
                    taskType: 'module_relations',
                    createdAt: task.createdAt,
                    validation: {
                      tool: 'init_step3_check_task_completion',
                      params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step5'
                      }
                    }
                  },
                  
                  // Step5 AI指导提示词
                  aiInstructions: relationsPrompt.trim(),
                  
                  // 资源信息
                  resources: {
                    fileDocsPath: `${docsDir}/files/`,
                    moduleDocsPath: `${docsDir}/modules/`,
                    outputPath: `${docsDir}/relations/`,
                    totalFiles: initState.documentCount || 0
                  },
                  
                  // 输出文档规格
                  expectedOutputs: [
                    `${docsDir}/relations/function-calls.md`,
                    `${docsDir}/relations/module-dependencies.md`, 
                    `${docsDir}/relations/data-flows.md`,
                    `${docsDir}/relations/overview.md`
                  ],
                  
                  // 下一步指导
                  workflow: {
                    current_step: "5/6 - 模块关联分析",
                    status: "task_ready",
                    next_steps: [{
                      tool: "init_step3_check_task_completion",
                      description: "检查模块关联分析任务完成情况",
                      suggested_params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step5'
                      },
                      why: "完成模块关联分析后，需要验证并自动进入下一步骤"
                    }],
                    progress: {
                      completed: 5,
                      total: 6,
                      percentage: Math.round(5/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step5: 模块关联分析任务已创建，请按照提示完成后使用验证工具检查"
                }, null, 2)
              }
            ]
          };
          } catch (error) {
            console.error(`[Step5] UnifiedTaskManager 集成失败: ${error.message}`);
            // 回退到传统实现作为备选方案
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `Step5 统一任务管理失败: ${error.message}`,
                  fallback: "使用传统模式处理",
                  tool: name,
                  suggestion: "请检查 UnifiedTaskManager 服务状态"
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step6_architecture_docs": {
          const { projectPath } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step6] 架构文档生成 - ${projectPath}`);
          
          // 检查服务可用性
          const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
          if (!unifiedTaskManager) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: 'UnifiedTaskManager 服务未找到',
                  tool: name,
                  step: 6
                }, null, 2)
              }]
            };
          }

          try {
            
            // 使用增强的验证逻辑
            const validation = validateStepPrerequisites(projectPath, 6);
            if (!validation.valid) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ error: true, message: validation.error, tool: name }, null, 2)
                }]
              };
            }
            
            const initState = getProjectStateEnhanced(projectPath);
            
            // 创建Step6任务
            const taskDefinition = {
              id: `step6_architecture_docs_${Date.now()}`,
              type: 'architecture_docs',
              description: '架构文档生成任务',
              files: [], // Step6基于所有已生成的文档
              metadata: {
                docsDirectory: join(resolve(projectPath), 'mg_kiro'),
                outputPath: resolve(projectPath), // 根目录输出
                stepNumber: 6,
                expectedOutputs: [
                  'README.md',
                  'architecture.md',
                  'development.md'
                ]
              }
            };
            
            const task = await unifiedTaskManager.createTask(taskDefinition, projectPath, 'step6');
          
          initState.currentStep = 6;
          const docsDir = join(resolve(projectPath), 'mg_kiro');
          
          // 生成架构文档生成提示词
          const architecturePrompt = `
## 架构文档生成任务 - Step 6 (最终步骤)

### 背景信息
- 项目路径: ${resolve(projectPath)}
- 文档目录: ${docsDir}
- 处理阶段: 基于完整的文件、模块和关联分析结果

### 任务目标
生成README、架构图、项目总览等最终文档，完成整个文档体系。

### 输入资源
1. **文件文档**: \`${docsDir}/files/\` - 所有源码文件的详细分析
2. **模块文档**: \`${docsDir}/modules/\` - 模块整合分析结果
3. **关联文档**: \`${docsDir}/relations/\` - 模块关联和依赖分析

### 现有文档结构
\`\`\`
${docsDir}/
├── files/            # 文件文档目录 (Step3生成)
│   ├── [filename1].md
│   ├── [filename2].md
│   └── ...
├── modules/          # 模块文档目录 (Step4生成)
│   ├── module-overview.md
│   └── [module-name]/
└── relations/        # 关联文档目录 (Step5生成)
    ├── function-calls.md
    ├── module-dependencies.md
    ├── data-flows.md
    └── overview.md
\`\`\`

### 输出要求
请创建以下最终架构文档：

#### 1. 项目README - \`${docsDir}/README.md\`
# [项目名称]

## 📖 项目概述
- 项目简介和核心价值
- 主要功能特性
- 技术栈概览

## 🏗️ 架构概览  
- 整体架构图
- 核心模块说明
- 技术架构选型

## 🚀 快速开始
- 环境要求
- 安装步骤
- 运行指南

## 📚 文档导航
- [架构设计](./architecture.md)
- [开发指南](./development.md)
- [模块总览](./modules/module-overview.md)
- [关联分析](./relations/overview.md)
- [完整文档索引](./docs-index.md)

#### 2. 架构设计文档 - \`${docsDir}/architecture.md\`
# 架构设计文档

## 🏗️ 整体架构
- 系统架构图
- 技术选型说明
- 设计原则和理念

## 📦 模块架构
- 模块划分策略
- 模块职责说明
- 模块间交互关系

## 🔗 依赖关系
- 核心依赖分析
- 数据流向图
- 接口设计原则

## ⚡ 性能架构
- 性能关键点
- 扩展性设计
- 监控和优化策略

#### 3. 开发指南 - \`${docsDir}/development.md\`
# 开发指南

## 🛠️ 开发环境
- 环境搭建步骤
- 开发工具推荐
- 配置说明

## 📝 开发规范
- 代码规范
- 提交规范
- 文档规范

## 🔧 开发流程
- 功能开发流程
- 测试流程
- 部署流程

## 🚀 贡献指南
- 如何贡献代码
- Issue报告规范
- Pull Request流程

#### 4. 完整文档索引 - \`${docsDir}/docs-index.md\`
# 文档索引

## 🏠 主要文档
- [README.md](./README.md) - 项目总览
- [architecture.md](./architecture.md) - 架构设计
- [development.md](./development.md) - 开发指南

## 📁 文件文档
[自动生成文件列表]

## 📦 模块文档  
[自动生成模块列表]

## 🔗 关联文档
[自动生成关联文档列表]

### 生成策略
1. 整合所有前面步骤的分析结果
2. 提取项目的核心价值和技术特色
3. 构建清晰的架构视图和技术文档
4. 提供完整的使用和开发指导
5. 建立文档间的导航和索引系统

### 重点要求
- **完整性**: 覆盖项目的所有重要方面
- **可读性**: 结构清晰，易于理解和导航
- **实用性**: 提供实际的使用和开发指导  
- **准确性**: 基于实际的代码分析结果
- **连贯性**: 各文档间保持一致的风格和结构

**🎉 完成此步骤后，整个6步init工作流将全部完成！**
          `;
          
          // 存储Step6结果并标记完成
          initState.stepResults.step6 = {
            architecturePrompt: architecturePrompt.trim(),
            completedAt: new Date().toISOString(),
            docsDirectory: docsDir
          };
          initState.stepsCompleted.push('step6');
          initState.currentStep = 6;
          initState.completed = true;
          initState.completedAt = new Date().toISOString();
          
          // Step6完成后，清理所有临时文件（最终步骤）
          try {
            const cleanupResult = cleanupTempFiles(projectPath);
            console.log(`[Step6-Cleanup] 初始化完成，清理临时文件: 删除${cleanupResult.cleaned}个临时文件，保留${cleanupResult.kept}个`);
            
            // 保存清理信息到状态中
            initState.stepResults.step6.cleanupInfo = {
              tempFilesDeleted: cleanupResult.cleaned,
              tempFilesKept: cleanupResult.kept,
              cleanupCompletedAt: new Date().toISOString()
            };
          } catch (cleanupError) {
            console.warn(`[Step6-Cleanup] 清理临时文件时出现警告: ${cleanupError.message}`);
            initState.stepResults.step6.cleanupWarning = cleanupError.message;
          }
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  currentStep: 6,
                  stepName: 'architecture-docs',
                  status: "task_created",
                  
                  // 统一任务管理器信息
                  taskManager: {
                    taskId: task.id,
                    taskStatus: task.status,
                    taskType: 'architecture_docs',
                    createdAt: task.createdAt,
                    validation: {
                      tool: 'init_step3_check_task_completion',
                      params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step6'
                      }
                    },
                    isFinalStep: true
                  },
                  
                  // Step6 AI指导提示词 (最终步骤)
                  aiInstructions: architecturePrompt.trim(),
                  
                  // 文档体系信息
                  documentationSystem: {
                    docsDirectory: docsDir,
                    totalFiles: initState.documentCount || 0,
                    generatedDocs: initState.generatedDocs?.length || 0,
                    expectedFinalDocs: [
                      `${docsDir}/README.md`,
                      `${docsDir}/architecture.md`,
                      `${docsDir}/development.md`,
                      `${docsDir}/docs-index.md`
                    ]
                  },
                  
                  // 完成状态
                  workflow: {
                    current_step: "6/6 - 架构文档生成 (最终步骤)",
                    status: "task_ready",
                    next_steps: [{
                      tool: "init_step3_check_task_completion",
                      description: "检查架构文档生成任务完成情况",
                      suggested_params: {
                        taskId: task.id,
                        projectPath: resolve(projectPath),
                        stepType: 'step6'
                      },
                      why: "完成架构文档生成后，验证并完成整个初始化流程"
                    }],
                    completion: {
                      message: "🎉 Init工作流即将完成！",
                      totalSteps: 6,
                      allStepsCompleted: false, // 任务创建完成，但还需要验证
                      finalTask: "完成架构文档生成并通过验证后，整个初始化流程将全部完成"
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
                  message: "Step6: 架构文档生成任务已创建，请按照提示完成后使用验证工具检查"
                }, null, 2)
              }
            ]
          };
          } catch (error) {
            console.error(`[Step6] UnifiedTaskManager 集成失败: ${error.message}`);
            // 回退到传统实现作为备选方案
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: `Step6 统一任务管理失败: ${error.message}`,
                  fallback: "使用传统模式处理",
                  tool: name,
                  suggestion: "请检查 UnifiedTaskManager 服务状态"
                }, null, 2)
              }]
            };
          }
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
                      "init_step3_check_task_completion - 验证任务完成状态（新验证机制）"
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
                    name: "模块关联分析",
                    tool: "init_step5_module_relations",
                    description: "详细阐述每个文件之间的关联，分析函数调用关系",
                    prerequisites: ["必须先完成init_step4_module_integration"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    expected_output: "函数调用关系图、模块依赖分析、数据流向图",
                    why: "分析模块间的深度关联，识别关键节点和依赖关系"
                  },
                  {
                    step: 6,
                    name: "架构文档生成",
                    tool: "init_step6_architecture_docs",
                    description: "生成README、架构图、项目总览等最终文档（最终步骤）",
                    prerequisites: ["必须先完成init_step5_module_relations"],
                    required_params: {
                      projectPath: "项目根目录的绝对路径"
                    },
                    expected_output: "README.md、architecture.md、development.md、完整文档索引",
                    why: "生成最终的架构文档和项目总览，完成整个文档体系"
                  }
                ],
                next_action: {
                  if_not_started: "调用 init_step1_project_analysis 开始完整的初始化流程",
                  if_step1_done: "调用 init_step2_create_todos 创建任务列表",
                  if_step2_done: "调用 init_step3_get_next_task 开始文件处理循环",
                  if_step3_done: "调用 init_step4_module_integration 进行模块整合",
                  if_step4_done: "调用 init_step5_module_relations 进行关联分析",
                  if_step5_done: "调用 init_step6_architecture_docs 生成架构文档",
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
        
        
        case "get_init_status": {
          const { projectPath } = args;
          
          console.log(`[MCP-InitStatus] 获取完整的6步工作流状态`);
          
          if (projectPath) {
            // 获取特定项目的状态
            const projectState = getProjectStateEnhanced(projectPath);
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    projectPath: resolve(projectPath),
                    currentStep: projectState.currentStep,
                    stepsCompleted: projectState.stepsCompleted,
                    totalSteps: 6,
                    progress: {
                      percentage: Math.round((projectState.stepsCompleted.length / 6) * 100),
                      completed: projectState.stepsCompleted.length,
                      remaining: 6 - projectState.stepsCompleted.length
                    },
                    status: projectState.currentStep === 0 ? 'not_started' : 
                           projectState.completed ? 'completed' : 'in_progress',
                    startedAt: projectState.startedAt,
                    completedAt: projectState.completedAt,
                    documentCount: projectState.documentCount || 0,
                    generatedDocs: projectState.generatedDocs || [],
                    nextStep: projectState.currentStep < 6 ? {
                      step: projectState.currentStep + 1,
                      tool: `init_step${projectState.currentStep + 1}_${
                        ['project_analysis', 'create_todos', 'get_next_task', 
                         'module_integration', 'module_relations', 'architecture_docs'][projectState.currentStep]
                      }`
                    } : null,
                    workflowVersion: "4.0-complete-6-steps"
                  }, null, 2)
                }
              ]
            };
          } else {
            // 返回系统整体状态
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    systemStatus: "ready",
                    availableTools: [
                      "workflow_guide - 获取完整工作流指引",
                      "init_step1_project_analysis - 项目分析",
                      "init_step2_create_todos - 创建AI任务列表",
                      "init_step3_get_next_task - 获取下一个文件任务",
                      "init_step3_get_file_content - 获取文件内容",
                      "init_step3_check_task_completion - 验证文件处理任务完成",
                      "init_step4_module_integration - 模块整合",
                      "init_step5_module_relations - 模块关联分析",
                      "init_step6_architecture_docs - 架构文档生成",
                      "get_init_status - 获取状态信息",
                      "reset_init - 重置流程"
                    ],
                    workflowVersion: "4.0-complete-6-steps",
                    totalSteps: 6,
                    description: "完整的6步文档生成流程，提供从分析到最终文档的全程指导",
                    usage: "使用 workflow_guide 工具获取完整的使用指引"
                  }, null, 2)
                }
              ]
            };
          }
        }
        
        case "reset_init": {
          console.log(`[MCP-AutoReset] 重置流程状态（增强版）`);
          
          // 新增：支持可选的项目路径参数
          const { projectPath } = args || {};
          
          let cleanupResults = {};
          if (projectPath) {
            try {
              // 新增：清理任务上下文（解决AI调用断档问题）
              const normalizedPath = resolve(projectPath);
              const hadContext = currentTaskContexts.has(normalizedPath);
              clearCurrentTaskContext(projectPath);
              
              // 清理指定项目的临时文件
              cleanupResults = cleanupTempFiles(projectPath);
              console.log(`[Reset] 清理项目 ${projectPath}: 删除${cleanupResults.cleaned}个临时文件，任务上下文已清理: ${hadContext}`);
              
              // 清除内存状态
              projectStates.delete(normalizedPath);
              
              // 清理UnifiedTaskManager中的项目数据（如果支持特定项目清理）
              // UnifiedTaskManager目前使用全局重置，项目级清理在全局重置中处理
              
              cleanupResults.taskContextCleared = hadContext;
              cleanupResults.projectStateCleared = true;
              
            } catch (error) {
              console.warn(`[Reset] 清理项目 ${projectPath} 时出现错误: ${error.message}`);
              cleanupResults.error = error.message;
            }
          } else {
            // 全局重置：清理所有内存状态和任务上下文
            const projectCount = projectStates.size;
            const contextCount = currentTaskContexts.size;
            
            projectStates.clear();
            currentTaskContexts.clear(); // 清理所有任务上下文
            
            // 清理UnifiedTaskManager数据
            const unifiedTaskManager = serviceBus.get('unifiedTaskManager');
            if (unifiedTaskManager) {
              await unifiedTaskManager.reset();
              console.log(`[Reset] UnifiedTaskManager已重置`);
            }
            
            console.log(`[Reset] 全局清理完成: ${projectCount}个项目状态，${contextCount}个任务上下文`);
            
            cleanupResults = {
              projectStatesCleared: projectCount,
              taskContextsCleared: contextCount,
              globalReset: true
            };
          }
          
          const result = claudeCodeInit.reset();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ...result,
                  nextStep: "调用 init_step1_project_analysis 开始新的6步Init流程",
                  automationEnhanced: true,
                  version: "4.0-complete-6-steps-automated",
                  cleanupResults: cleanupResults, // 增强的清理结果信息
                  
                  // 新增：自动化功能说明
                  automationFeatures: {
                    smartParameterCompletion: "AI调用工具时自动补全参数",
                    contextManagement: "自动维护任务上下文，避免断档",
                    errorRecovery: "智能错误恢复和建议",
                    seamlessWorkflow: "工具间无缝衔接，减少手动参数传递"
                  },
                  
                  improvedUserExperience: {
                    before: "AI需要手动管理taskId和relativePath参数",
                    after: "AI只需提供projectPath，其他参数自动补全",
                    benefit: "大幅减少调用断档，提升工作流连续性"
                  }
                }, null, 2)
              }
            ]
          };
        }
        
        default:
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: true, message: `未知的工具: ${name}. 可用工具: workflow_guide, init_step1_project_analysis, init_step2_create_todos, init_step2_file_analysis, init_step3_get_next_task, init_step3_get_file_content, init_step3_generate_analysis, init_step3_check_task_completion, init_step4_module_integration, init_step5_module_relations, init_step6_architecture_docs, get_init_status, reset_init`, tool: name }, null, 2)
            }]
          };
      }
    } catch (error) {
      console.error(`[MCP-6Steps] 工具执行失败: ${name}`, error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              message: error.message,
              tool: name,
              version: "4.0-complete-6-steps",
              suggestion: "请检查工具名称和参数。主要工具: workflow_guide(获取工作流指引), init_step1_project_analysis(开始6步流程)",
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
  
  console.log("\n✅ mg_kiro MCP服务器已启动 (stdio模式) - v5.0.0-complete-6-steps-redesigned");
  console.log("🚀 重新设计的完整6步Init工作流已就绪");
  console.log("🤖 支持工具: workflow_guide, init_step1-6 (文件分析→模块整合→关联分析→架构文档)");
  console.log("📡 等待Claude Code客户端连接...\n");
}

// ========== Step3文件路径计算函数 ==========

/**
 * 根据批次策略生成期望的文件路径
 * @param {string} taskId - 任务ID
 * @param {string} batchStrategy - 批次策略
 * @param {string} fileName - 文件名
 * @param {string} projectPath - 项目路径
 * @returns {Object} 包含expectedFilePath和expectedFileName的对象
 */
function generateExpectedFilePath(taskId, batchStrategy, fileName, projectPath) {
    const filesDir = resolve(projectPath, 'mg_kiro', 'files');
    
    function getFileBaseName(filePath) {
        const name = filePath.split('/').pop();
        return name.substring(0, name.lastIndexOf('.')) || name;
    }
    
    let expectedFileName;
    const baseName = fileName ? getFileBaseName(fileName) : '';
    
    switch (batchStrategy) {
        case 'CombinedFileBatch':
            expectedFileName = `${taskId}_combined_analysis.md`;
            break;
        case 'SingleFileBatch':
            expectedFileName = `${taskId}_${baseName}_analysis.md`;
            break;
        case 'LargeFileMultiBatch':
            // 从taskId中提取子批次编号 (task_3_1, task_3_2)
            const subBatchMatch = taskId.match(/_(\d+)$/);
            const subBatchId = subBatchMatch ? subBatchMatch[1] : '1';
            expectedFileName = `${taskId}_${subBatchId}_${baseName}_analysis.md`;
            break;
        default:
            // 通用格式
            expectedFileName = `${taskId}_analysis.md`;
            break;
    }
    
    const expectedFilePath = resolve(filesDir, expectedFileName);
    
    return {
        expectedFilePath,
        expectedFileName,
        filesDir,
        relativePath: `mg_kiro/files/${expectedFileName}`
    };
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