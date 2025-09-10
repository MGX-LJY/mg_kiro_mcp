#!/usr/bin/env node

/* eslint-disable no-unreachable */
/* eslint-disable no-throw-literal */

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
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, unlinkSync } from 'fs';
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
          description: "Step4: 模块整合 - 将模块内的多个文件整合在一起，添加模块相关功能，生成模块总览文档",
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
          description: "Step5: 模块关联分析 - 详细阐述每个文件之间的关联，分析哪个函数被多个模块调用，生成详细的依赖关系图",
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
          description: "Step6: 架构文档生成 - 生成README、架构图、项目总览等最终文档（最终步骤）",
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
    
    // 使用共享的serviceBus获取服务实例（修复：不再创建新实例）
    // 移除动态导入，改为使用serviceBus中已注册的服务
    
    // eslint-disable-next-line no-unused-vars - 全局错误处理
    
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
      
      // 🔥 修复：同时保存到文件系统，确保持久化
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
      
      // 🔥 修复：如果内存中没有，尝试从文件系统恢复
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
      
      // 🔥 修复：同时清除文件系统中的任务上下文
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
    
    // 获取或创建项目状态（保留原函数用于向后兼容）
    function getProjectState(projectPath) {
      // 现在使用增强版本，总是从文件加载最新状态
      return getProjectStateEnhanced(projectPath);
    }
    
    // 更新并保存项目状态
    function updateProjectState(projectPath, updates) {
      const normalizedPath = resolve(projectPath);
      const state = getProjectState(normalizedPath);
      
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
    
    // 加载步骤结果从临时文件 (保留以备未来使用)
    // function loadStepResult(projectPath, stepName) {
    //   const tempDir = getTempDirectory(projectPath);
    //   const stepFile = join(tempDir, `${stepName}-result.json`);
    //   
    //   if (existsSync(stepFile)) {
    //     try {
    //       const stepData = JSON.parse(readFileSync(stepFile, 'utf8'));
    //       return stepData.data;
    //     } catch (error) {
    //       console.warn(`[TempFile] 加载Step结果失败: ${error.message}`);
    //       return null;
    //     }
    //   }
    //   return null;
    // }
    
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
    
    // 使用共享的serviceBus获取服务实例（修复状态管理问题）
    const projectOverviewGenerator = serviceBus.get('projectOverviewGenerator');
    const aiTodoManager = serviceBus.get('aiTodoManager');
    const fileQueryService = serviceBus.get('fileQueryService');
    
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
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step2] 创建AI任务列表 - ${projectPath}`);
          
          // 使用增强的验证逻辑（新增）
          const validation = validateStepPrerequisites(projectPath, 2);
          if (!validation.valid) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: validation.error, tool: name, step: 2 }, null, 2)
              }]
            };
          }
          
          const initState = getProjectStateEnhanced(projectPath);
          
          // 更新当前步骤
          updateProjectState(projectPath, { currentStep: 2 });
          
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
          
          // 存储Step2结果到临时文件（新增）
          saveStepResult(projectPath, 'step2', {
            todoList: todoResult,
            processingPlan: processingPlan,
            completedAt: new Date().toISOString()
          });
          
          // 存储Step2结果到主状态文件（保持兼容）
          updateProjectState(projectPath, {
            stepResults: {
              ...initState.stepResults,
              step2: {
                todoList: todoResult,
                processingPlan: processingPlan,
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
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step3] 获取下一个文件任务 - ${projectPath}`);
          
          // 使用增强的验证逻辑（新增）
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
          
          // 修复：使用aiTodoManager获取下一个待处理的任务，并添加状态恢复逻辑
          let nextTaskResult = null;
          
          try {
            // 首先尝试从aiTodoManager获取任务
            nextTaskResult = await aiTodoManager.getNextTask(resolve(projectPath));
          } catch (error) {
            console.log(`[Step3-Fix] aiTodoManager中没有找到todoList，尝试从临时文件恢复: ${error.message}`);
            
            // 如果失败，尝试从.tmp文件恢复todoList状态
            try {
              const tempDir = join(resolve(projectPath), 'mg_kiro', '.tmp');
              const step2File = join(tempDir, 'step2-result.json');
              
              if (existsSync(step2File)) {
                const step2Data = JSON.parse(readFileSync(step2File, 'utf8'));
                const savedTodoList = step2Data.data?.todoList?.todoList; // 修复双重嵌套问题
                
                if (savedTodoList && savedTodoList.totalTasks > 0) {
                  console.log(`[Step3-Fix] 正在恢复todoList状态，包含 ${savedTodoList.totalTasks} 个任务`);
                  console.log(`[Step3-Fix] 任务分布: fileProcessing=${savedTodoList.tasks?.fileProcessing?.length || 0}, analysis=${savedTodoList.tasks?.analysis?.length || 0}, summary=${savedTodoList.tasks?.summary?.length || 0}`);
                  
                  // 确保所有必需的属性都存在，特别是optimization数组
                  if (!savedTodoList.tasks) {
                    savedTodoList.tasks = {
                      fileProcessing: [],
                      analysis: [],
                      summary: [],
                      optimization: []
                    };
                  } else {
                    // 确保optimization数组存在，这很关键
                    if (!savedTodoList.tasks.optimization) {
                      savedTodoList.tasks.optimization = [];
                    }
                  }
                  
                  // 验证数据完整性
                  const totalExpectedTasks = (savedTodoList.tasks.fileProcessing?.length || 0) + 
                                           (savedTodoList.tasks.analysis?.length || 0) + 
                                           (savedTodoList.tasks.summary?.length || 0) + 
                                           (savedTodoList.tasks.optimization?.length || 0);
                  
                  console.log(`[Step3-Fix] 数据验证: 期望任务数=${savedTodoList.totalTasks}, 实际任务数=${totalExpectedTasks}`);
                  
                  // 直接设置到aiTodoManager的内部Map中
                  aiTodoManager.projectTodos.set(resolve(projectPath), savedTodoList);
                  console.log(`[Step3-Fix] 状态恢复完成，设置了 ${savedTodoList.totalTasks} 个任务到projectTodos Map`);
                  
                  // 调试: 检查恢复的数据结构
                  const restoredData = aiTodoManager.projectTodos.get(resolve(projectPath));
                  console.log(`[Step3-Debug] 恢复的数据结构:`, {
                    hasFileProcessing: !!restoredData?.tasks?.fileProcessing,
                    fileProcessingLength: restoredData?.tasks?.fileProcessing?.length || 0,
                    hasOptimization: !!restoredData?.tasks?.optimization,
                    optimizationLength: restoredData?.tasks?.optimization?.length || 0,
                    firstTaskStatus: restoredData?.tasks?.fileProcessing?.[0]?.status
                  });
                  
                  // 再次尝试获取任务
                  nextTaskResult = await aiTodoManager.getNextTask(resolve(projectPath));
                  console.log(`[Step3-Fix] 恢复后的getNextTask结果:`, nextTaskResult.completed ? 'completed' : 'has_tasks');
                }
              }
            } catch (restoreError) {
              console.error(`[Step3-Fix] 恢复todoList状态失败: ${restoreError.message}`);
              nextTaskResult = { completed: true, success: true };
            }
          }

          if (!nextTaskResult || nextTaskResult.completed === true) {
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
          
          // 返回下一个任务（修复：使用新的aiTodoManager结果格式）
          const task = nextTaskResult.task;
          
          // 🔥 新增：自动设置当前任务上下文，解决AI调用断档问题
          console.log('[DEBUG] 准备设置任务上下文，task结构:', JSON.stringify(task, null, 2));
          const contextData = {
            taskId: task?.id || 'unknown',
            relativePath: task?.file?.relativePath || 'unknown',
            fileName: task?.file?.name || 'unknown',
            fileSize: task?.file?.estimatedSize || 0,
            priority: task?.priority || 0,
            estimatedTime: task?.estimatedTime || '未知',
            title: task?.title || '未知任务',
            description: task?.description || '无描述',
            step: 'get_next_task_completed'
          };
          console.log('[DEBUG] 任务上下文数据:', JSON.stringify(contextData, null, 2));
          console.log('[DEBUG] projectPath:', projectPath);
          
          setCurrentTaskContext(projectPath, contextData);
          
          return {
            content: [
              {
                type: "text", 
                text: JSON.stringify({
                  currentStep: 3,
                  stepName: 'file-documentation',
                  status: "task_available",
                  
                  // 当前任务信息（使用aiTodoManager的格式）
                  currentTask: {
                    taskId: task?.id || 'unknown',
                    filePath: task?.file?.relativePath || 'unknown',
                    fileName: task?.file?.name || 'unknown',
                    fileSize: task?.file?.estimatedSize || 0,
                    priority: task?.priority || 0,
                    estimatedTime: task?.estimatedTime || '未知',
                    title: task?.title || '未知任务',
                    description: task?.description || '无描述'
                  },
                  
                  // 进度信息（使用aiTodoManager的格式）
                  progress: nextTaskResult.progress || {
                    completed: 0,
                    total: 0,
                    remaining: 0,
                    percentage: 0
                  },
                  
                  // 🔥 新增：智能调用指导 - AI现在可以直接调用，无需手动传参
                  workflow: {
                    current_step: "3/6 - 文件文档生成（进行中）",
                    status: "in_progress",
                    next_steps: [{
                      tool: "init_step3_get_file_content",
                      description: "获取文件内容进行文档生成（自动获取任务参数）",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                        // ⚡ 注意：不再需要手动传递 relativePath 和 taskId，会自动从上下文获取
                      },
                      why: "任务上下文已自动设置，AI可以直接调用获取文件内容"
                    }],
                    progress: {
                      completed: 3,
                      total: 6,
                      percentage: Math.round(3/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step3: 获取到下一个文件处理任务，上下文已自动设置"
                }, null, 2)
              }
            ]
          };
        }
        
        case "init_step3_get_file_content": {
          // 🔥 新增：智能参数补全 - 支持自动从上下文获取任务信息
          let { projectPath, taskId, relativePath, maxContentLength } = args;
          
          if (!projectPath) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          // 🔥 智能参数补全：从任务上下文自动获取缺失的参数
          const taskContext = getCurrentTaskContext(projectPath);
          
          if (!taskId && taskContext) {
            taskId = taskContext.taskId;
            console.log(`[Auto-Param] 从上下文自动获取 taskId: ${taskId}`);
          }
          
          if (!relativePath && taskContext) {
            relativePath = taskContext.relativePath;
            console.log(`[Auto-Param] 从上下文自动获取 relativePath: ${relativePath}`);
          }
          
          // 🔥 容错处理：如果还是缺少关键参数，尝试智能恢复
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
          
          try {
            // 🔥 新增：直接文件读取 + 原有服务兼容
            const fs = await import('fs');
            const fullFilePath = resolve(projectPath, relativePath);
            
            if (!fs.existsSync(fullFilePath)) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({ error: true, message: `文件不存在: ${relativePath}`, tool: name }, null, 2)
                }]
              };
            }
            
            const fileStats = fs.statSync(fullFilePath);
            const maxSize = maxContentLength || 50000;
            
            let fileContent = '';
            if (fileStats.size > maxSize) {
              const fd = fs.openSync(fullFilePath, 'r');
              const buffer = Buffer.alloc(maxSize);
              fs.readSync(fd, buffer, 0, maxSize, 0);
              fs.closeSync(fd);
              fileContent = buffer.toString('utf8') + `\n\n... (文件太大，已截断。完整大小: ${fileStats.size} 字节)`;
            } else {
              fileContent = fs.readFileSync(fullFilePath, 'utf8');
            }
            
            const fileName = relativePath.split('/').pop();
            const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
            
            // 生成保存路径
            const docsDir = ensureDocsDirectory(resolve(projectPath));
            const filesDir = join(docsDir, 'files');
            if (!fs.existsSync(filesDir)) {
              fs.mkdirSync(filesDir, { recursive: true });
            }
            
            // 🔥 更新任务上下文状态
            if (taskContext) {
              setCurrentTaskContext(projectPath, {
                ...taskContext,
                step: 'get_file_content_completed',
                content: fileContent.slice(0, 200) + '...' // 保存内容预览
              });
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
                      taskId: taskId,
                      relativePath: relativePath,
                      fileName: fileName,
                      content: fileContent,
                      language: fileExtension,
                      size: fileStats.size,
                      lines: fileContent.split('\n').length,
                      truncated: fileStats.size > maxSize
                    },
                    
                    // AI处理指导
                    aiInstructions: {
                      task: "为这个文件生成详细的技术文档",
                      focus: "分析代码功能、架构设计、重要逻辑和使用方式", 
                      format: "Markdown格式，包含代码示例和技术说明",
                      outputFile: `mg_kiro/files/${fileName}.md`,
                      saveToPath: join(filesDir, `${fileName}.md`)
                    },
                    
                    // 🔥 简化的工作流程 - 支持直接保存或继续下一任务
                    workflow: {
                      current_step: "3/6 - 文件文档生成（内容已准备）",
                      status: "content_ready", 
                      next_steps: [{
                        description: "AI现在可以直接处理文件内容并继续下一个任务",
                        actions: [
                          `1. 生成文档并保存到: ${join(filesDir, `${fileName}.md`)}`,
                          `2. 调用 init_step3_get_next_task 获取下一个任务（无需手动完成当前任务）`
                        ],
                        why: "文件内容已获取且上下文管理自动化，可以流畅进行下一步"
                      }],
                      progress: {
                        completed: 3,
                        total: 6,
                        percentage: Math.round(3/6 * 100)
                      }
                    },
                    
                    success: true,
                    message: `Step3: 文件 ${relativePath} 内容已准备就绪（自动化上下文管理）`
                  }, null, 2)
                }
              ]
            };
          } catch (error) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ 
                  error: true, 
                  message: `读取文件失败: ${error.message}`, 
                  tool: name,
                  autoRecovery: {
                    suggestion: "请检查文件路径是否正确，或尝试重新获取任务",
                    file: relativePath,
                    projectPath: projectPath
                  }
                }, null, 2)
              }]
            };
          }
        }
        
        case "init_step3_complete_task": {
          const { projectPath, taskId, documentContent } = args;
          
          if (!projectPath || !taskId || !documentContent) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "项目路径、任务ID和文档内容不能为空", tool: name }, null, 2)
              }]
            };
          }
          
          console.log(`[MCP-Init-Step3] 完成任务 - ${projectPath} 任务:${taskId}`);
          
          const initState = getProjectState(projectPath);
          
          if (initState.currentStep < 3) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ error: true, message: "需要先通过step3工具获取任务内容", tool: name }, null, 2)
              }]
            };
          }
          
          // 完成任务并保存文档
          /** @type {Object|null} completionResult - 任务完成结果 */
          const completionResult = await (fileQueryService && fileQueryService['completeTask'] 
            ? fileQueryService['completeTask'](resolve(projectPath), taskId, documentContent) 
            : Promise.resolve({ success: false })) || { success: false };
          
          // 更新项目状态
          initState.documentCount = (initState.documentCount || 0) + 1;
          if (!initState.generatedDocs) {
            initState.generatedDocs = [];
          }
          initState.generatedDocs.push({
            taskId: taskId,
            fileName: completionResult?.fileName || '未知文件',
            docPath: completionResult?.docPath || '未知路径',
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
                    fileName: completionResult?.fileName || '未知文件',
                    documentPath: completionResult?.docPath || '未知路径',
                    totalProcessed: initState.documentCount,
                    remainingTasks: completionResult?.remainingTasks || 0
                  },
                  
                  // 下一步指导
                  workflow: {
                    current_step: "3/6 - 文件文档生成（继续处理）",
                    status: (completionResult?.remainingTasks || 0) > 0 ? "continue_processing" : "step_completed",
                    next_steps: (completionResult?.remainingTasks || 0) > 0 ? [{
                      tool: "init_step3_get_next_task",
                      description: "继续处理下一个文件任务",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: `还有 ${completionResult?.remainingTasks || 0} 个文件等待处理`
                    }] : [{
                      tool: "init_step4_module_integration",
                      description: "开始模块化整合",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "所有文件文档已完成，可以进入模块整合阶段"
                    }],
                    progress: {
                      completed: (completionResult?.remainingTasks || 0) > 0 ? 3 : 4,
                      total: 6,
                      percentage: Math.round(((completionResult?.remainingTasks || 0) > 0 ? 3 : 4)/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: `Step3: 任务 ${taskId} 已完成，文档已保存到 ${completionResult?.docPath || '未知路径'}`
                }, null, 2)
              }
            ]
          };
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
          
          // 使用增强的验证逻辑
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
                      tool: "init_step5_module_relations",
                      description: "分析模块间的关联和依赖关系",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "模块整合完成后，需要分析模块间的关联关系"
                    }],
                    progress: {
                      completed: 4,
                      total: 6,
                      percentage: Math.round(4/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step4: 模块整合指导已生成，请按照提示完成模块整合"
                }, null, 2)
              }
            ]
          };
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
                  status: "prompt_ready",
                  
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
                    status: "ready_for_ai",
                    next_steps: [{
                      tool: "init_step6_architecture_docs",
                      description: "生成架构文档和项目总览",
                      suggested_params: {
                        projectPath: resolve(projectPath)
                      },
                      why: "模块关联分析完成后，需要生成最终的架构文档"
                    }],
                    progress: {
                      completed: 5,
                      total: 6,
                      percentage: Math.round(5/6 * 100)
                    }
                  },
                  
                  success: true,
                  message: "Step5: 模块关联分析指导已准备，请按照提示完成关联分析"
                }, null, 2)
              }
            ]
          };
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
                  status: "final_step",
                  
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
                    status: "final_instructions_ready",
                    completion: {
                      message: "🎉 Init工作流即将完成！",
                      totalSteps: 6,
                      allStepsCompleted: true,
                      finalTask: "完成架构文档生成后，整个初始化流程将全部完成"
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
                  message: "Step6: 架构文档生成指导已准备，完成后init工作流将全部完成！"
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
            const projectState = getProjectState(projectPath);
            
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
                      "init_step3_complete_task - 完成文件处理任务",
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
              // 🔥 新增：清理任务上下文（解决AI调用断档问题）
              const normalizedPath = resolve(projectPath);
              const hadContext = currentTaskContexts.has(normalizedPath);
              clearCurrentTaskContext(projectPath);
              
              // 清理指定项目的临时文件
              cleanupResults = cleanupTempFiles(projectPath);
              console.log(`[Reset] 清理项目 ${projectPath}: 删除${cleanupResults.cleaned}个临时文件，任务上下文已清理: ${hadContext}`);
              
              // 清除内存状态
              projectStates.delete(normalizedPath);
              
              // 清理aiTodoManager中的项目数据
              if (aiTodoManager && aiTodoManager.projectTodos) {
                aiTodoManager.projectTodos.delete(normalizedPath);
                console.log(`[Reset] 已清理aiTodoManager中的项目数据: ${normalizedPath}`);
              }
              
              cleanupResults.taskContextCleared = hadContext;
              cleanupResults.projectStateCleared = true;
              
            } catch (error) {
              console.warn(`[Reset] 清理项目 ${projectPath} 时出现错误: ${error.message}`);
              cleanupResults.error = error.message;
            }
          } else {
            // 🔥 全局重置：清理所有内存状态和任务上下文
            const projectCount = projectStates.size;
            const contextCount = currentTaskContexts.size;
            
            projectStates.clear();
            currentTaskContexts.clear(); // 清理所有任务上下文
            
            // 清理所有aiTodoManager数据
            if (aiTodoManager && aiTodoManager.projectTodos) {
              aiTodoManager.projectTodos.clear();
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
                  
                  // 🔥 新增：自动化功能说明
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
              text: JSON.stringify({ error: true, message: `未知的工具: ${name}. 可用工具: workflow_guide, init_step1_project_analysis, init_step2_create_todos, init_step3_get_next_task, init_step3_get_file_content, init_step3_complete_task, init_step4_module_integration, init_step5_module_relations, init_step6_architecture_docs, get_init_status, reset_init`, tool: name }, null, 2)
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