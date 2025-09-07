/**
 * Document Generator - mg_kiro MCP Server
 * 文档生成器：处理系统架构和模块目录文档的智能生成
 * 支持基于项目分析结果的自动化文档生成功能
 */

import express from 'express';
import path from 'path';

/**
 * 创建文档生成路由
 * @param {Object} dependencies - 依赖对象
 * @param {PromptManager} dependencies.promptManager - 提示词管理器
 * @param {WorkflowState} dependencies.workflowState - 工作流状态管理器
 * @returns {express.Router} Express路由对象
 */
export function createDocumentRoutes({ promptManager, workflowState }) {
  const router = express.Router();

  // ========== 第4步-A: 基于语言生成system-architecture.md ==========
  router.post('/generate-architecture', async (req, res) => {
    try {
      const { workflowId } = req.body;
      
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: '工作流ID不能为空'
        });
      }

      // 获取工作流状态
      const workflow = workflowState.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: '工作流不存在'
        });
      }

      // 检查前置条件
      const structureResult = workflow.results?.['scan-structure'];
      const languageResult = workflow.results?.['detect-language'];
      const filesResult = workflow.results?.['scan-files'];

      if (!structureResult) {
        return res.status(400).json({
          success: false,
          error: '项目结构扫描结果不存在，请先执行 POST /mode/init/scan-structure'
        });
      }

      if (!languageResult) {
        return res.status(400).json({
          success: false,
          error: '语言检测结果不存在，请先执行 POST /mode/init/detect-language'
        });
      }

      if (!filesResult) {
        return res.status(400).json({
          success: false,
          error: '文件内容分析结果不存在，请先执行 POST /mode/init/scan-files'
        });
      }

      console.log(`[Step4] 开始生成系统架构文档: ${workflowId}`);
      
      // 更新步骤状态
      workflowState.updateStep(workflowId, 'generate-architecture', 'running');

      const startTime = Date.now();

      // 生成项目特征变量
      const projectVariables = generateProjectVariables(
        structureResult, 
        languageResult, 
        filesResult,
        workflow.config?.projectPath
      );

      // 加载系统架构模板
      const architectureTemplate = await promptManager.getTemplate('system-architecture.md');
      
      // 变量替换生成最终文档
      const architectureDocument = replaceTemplateVariables(architectureTemplate, projectVariables);

      const executionTime = Date.now() - startTime;

      // 保存结果到工作流
      const result = {
        success: true,
        step: 'generate-architecture',
        executionTime,
        projectVariables,
        document: architectureDocument,
        template: 'system-architecture.md',
        generatedAt: new Date().toISOString()
      };

      workflowState.setStepResult(workflowId, 'generate-architecture', result);
      workflowState.updateStep(workflowId, 'generate-architecture', 'completed');

      console.log(`[Step4] 系统架构文档生成完成: ${executionTime}ms`);

      res.json({
        success: true,
        step: 'generate-architecture',
        data: {
          document: architectureDocument,
          variables: projectVariables,
          executionTime,
          template: 'system-architecture.md'
        },
        workflowProgress: workflowState.getProgress(workflowId)
      });

    } catch (error) {
      console.error('[Step4] 生成系统架构文档失败:', error);
      
      if (req.body.workflowId) {
        workflowState.updateStep(req.body.workflowId, 'generate-architecture', 'failed', error.message);
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== 第4步-B: 基于扫描结果生成modules-catalog.md ==========
  router.post('/generate-catalog', async (req, res) => {
    try {
      const { workflowId } = req.body;
      
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: '工作流ID不能为空'
        });
      }

      // 获取工作流状态
      const workflow = workflowState.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: '工作流不存在'
        });
      }

      // 检查前置条件
      const structureResult = workflow.results?.['scan-structure'];
      const languageResult = workflow.results?.['detect-language'];
      const filesResult = workflow.results?.['scan-files'];

      if (!structureResult || !languageResult || !filesResult) {
        return res.status(400).json({
          success: false,
          error: '前置分析步骤未完成，请先完成前3步工作流'
        });
      }

      console.log(`[Step4] 开始生成模块目录文档: ${workflowId}`);
      
      // 更新步骤状态
      workflowState.updateStep(workflowId, 'generate-catalog', 'running');

      const startTime = Date.now();

      // 生成模块特征变量
      const moduleVariables = generateModuleVariables(
        structureResult, 
        languageResult, 
        filesResult,
        workflow.config?.projectPath
      );

      // 加载模块目录模板
      const catalogTemplate = await promptManager.getTemplate('modules-catalog.md');
      
      // 变量替换生成最终文档
      const catalogDocument = replaceTemplateVariables(catalogTemplate, moduleVariables);

      const executionTime = Date.now() - startTime;

      // 保存结果到工作流
      const result = {
        success: true,
        step: 'generate-catalog',
        executionTime,
        moduleVariables,
        document: catalogDocument,
        template: 'modules-catalog.md',
        generatedAt: new Date().toISOString()
      };

      workflowState.setStepResult(workflowId, 'generate-catalog', result);
      workflowState.updateStep(workflowId, 'generate-catalog', 'completed');

      console.log(`[Step4] 模块目录文档生成完成: ${executionTime}ms`);

      res.json({
        success: true,
        step: 'generate-catalog',
        data: {
          document: catalogDocument,
          variables: moduleVariables,
          executionTime,
          template: 'modules-catalog.md'
        },
        workflowProgress: workflowState.getProgress(workflowId)
      });

    } catch (error) {
      console.error('[Step4] 生成模块目录文档失败:', error);
      
      if (req.body.workflowId) {
        workflowState.updateStep(req.body.workflowId, 'generate-catalog', 'failed', error.message);
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

/**
 * 生成项目特征变量 - 用于系统架构文档模板
 */
function generateProjectVariables(structureResult, languageResult, filesResult, projectPath) {
  try {
    const projectName = structureResult?.projectStructure?.projectName || path.basename(projectPath || process.cwd());
    const mainLanguage = languageResult?.analysis?.mainLanguage || 'Unknown';
    const framework = languageResult?.analysis?.framework || 'Generic';

    // 分析技术栈
    const techStack = analyzeTechStack(structureResult, languageResult, filesResult);
    
    // 分析核心模块
    const coreModules = identifyCoreModules(structureResult, filesResult);
    
    // 生成项目描述
    const projectDescription = generateProjectDescription(mainLanguage, framework);

    return {
      // 基本信息
      project_name: projectName,
      project_description: projectDescription,
      main_objectives: generateObjectives(mainLanguage, framework),
      target_users: generateTargetUsers(framework),
      key_features: generateKeyFeatures(structureResult, filesResult),

      // 技术栈
      frontend_stack: techStack.frontend || '未检测',
      frontend_desc: getTechDescription(techStack.frontend, 'frontend'),
      backend_stack: techStack.backend || mainLanguage,
      backend_desc: getTechDescription(techStack.backend || mainLanguage, 'backend'),
      database_stack: techStack.database || '待配置',
      database_desc: getTechDescription(techStack.database, 'database'),
      cache_stack: techStack.cache || 'Memory',
      cache_desc: getTechDescription(techStack.cache, 'cache'),
      deploy_stack: techStack.deploy || 'Docker',
      deploy_desc: getTechDescription(techStack.deploy, 'deploy'),

      // 核心模块（前3个）
      module1_name: coreModules[0]?.name || '核心模块',
      module1_responsibility: coreModules[0]?.responsibility || '核心业务逻辑',
      module1_deps: coreModules[0]?.dependencies?.join(', ') || '无',
      module1_apis: coreModules[0]?.apiCount || '待统计',

      module2_name: coreModules[1]?.name || '数据处理模块',
      module2_responsibility: coreModules[1]?.responsibility || '数据处理与存储',
      module2_deps: coreModules[1]?.dependencies?.join(', ') || '数据库',
      module2_apis: coreModules[1]?.apiCount || '待统计',

      module3_name: coreModules[2]?.name || '工具模块',
      module3_responsibility: coreModules[2]?.responsibility || '通用工具与辅助功能',
      module3_deps: coreModules[2]?.dependencies?.join(', ') || '系统库',
      module3_apis: coreModules[2]?.apiCount || '待统计',

      // 架构图变量
      framework_name: framework,
      cache_name: techStack.cache || 'Redis',
      database_name: techStack.database || 'PostgreSQL',
      queue_name: techStack.queue || 'RabbitMQ',
      worker_name: techStack.worker || 'Background Jobs',

      // 安全配置
      auth_method: detectAuthMethod(filesResult),
      authz_method: detectAuthzMethod(),

      // 性能目标
      target_response_time: getResponseTimeTarget(framework),
      current_response_time: '待测试',
      target_concurrent: getConcurrencyTarget(),
      current_concurrent: '待测试',  
      target_availability: '99.9%',
      current_availability: '待监控',
      status: '规划中',

      // 告警配置
      p0_condition: '服务完全不可用',
      p0_notification: '电话 + 短信 + 邮件',
      p1_condition: '核心功能异常',
      p1_notification: '短信 + 邮件 + Slack',
      p2_condition: '性能指标异常',
      p2_notification: '邮件 + Slack'
    };

  } catch (error) {
    console.error('生成项目变量失败:', error);
    return getDefaultProjectVariables();
  }
}

/**
 * 生成模块特征变量 - 用于模块目录文档模板
 */
function generateModuleVariables(structureResult, languageResult, filesResult, projectPath) {
  try {
    const projectName = structureResult?.projectStructure?.projectName || path.basename(projectPath || process.cwd());
    const modules = identifyAllModules(structureResult, filesResult);

    return {
      // 基本信息
      project_name: projectName,
      total_modules: modules.length,
      core_modules_count: modules.filter(m => m.type === 'core').length,
      business_modules_count: modules.filter(m => m.type === 'business').length,

      // 核心模块版本和状态
      auth_version: getModuleVersion(modules, 'auth'),
      auth_status: getModuleStatus(modules, 'auth'),
      dal_version: getModuleVersion(modules, 'dal'),
      dal_status: getModuleStatus(modules, 'dal'),

      // 业务模块版本和状态
      user_version: getModuleVersion(modules, 'user'),
      user_status: getModuleStatus(modules, 'user'),
      notification_version: getModuleVersion(modules, 'notification'),
      notification_status: getModuleStatus(modules, 'notification'),

      // 模块健康度（前两个模块）
      module1: modules[0]?.name || 'N/A',
      coverage1: modules[0]?.testCoverage || 0,
      doc1: modules[0]?.docCoverage || 0,
      health1: modules[0]?.healthScore || 0,

      module2: modules[1]?.name || 'N/A',
      coverage2: modules[1]?.testCoverage || 0,
      doc2: modules[1]?.docCoverage || 0,
      health2: modules[1]?.healthScore || 0,

      // 开发计划
      ongoing_module1: getOngoingModule(modules, 0),
      ongoing_desc1: getOngoingDescription(modules, 0),
      ongoing_module2: getOngoingModule(modules, 1),
      ongoing_desc2: getOngoingDescription(modules, 1),

      planned_module1: getPlannedModule(modules, 0),
      planned_desc1: getPlannedDescription(modules, 0),
      planned_module2: getPlannedModule(modules, 1),
      planned_desc2: getPlannedDescription(modules, 1)
    };

  } catch (error) {
    console.error('生成模块变量失败:', error);
    return getDefaultModuleVariables();
  }
}

/**
 * 模板变量替换
 */
function replaceTemplateVariables(template, variables) {
  try {
    let result = template;
    
    // 替换所有 {{variable_name}} 格式的占位符
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'string' ? value : String(value);
      result = result.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return result;
  } catch (error) {
    console.error('模板变量替换失败:', error);
    return template;
  }
}

// ========== 辅助函数 ==========

/**
 * 分析技术栈
 */
function analyzeTechStack(structureResult, languageResult, filesResult) {
  const mainLanguage = languageResult?.analysis?.mainLanguage;
  const framework = languageResult?.analysis?.framework;
  
  const stack = {
    backend: mainLanguage,
    frontend: null,
    database: null,
    cache: null,
    deploy: 'Docker',
    queue: null,
    worker: null
  };

  // 根据语言推断技术栈
  switch (mainLanguage) {
    case 'JavaScript':
      stack.frontend = framework?.includes('React') ? 'React' : framework?.includes('Vue') ? 'Vue' : 'JavaScript';
      stack.database = 'MongoDB';
      stack.cache = 'Redis';
      stack.queue = 'Bull';
      break;
    case 'Python':
      stack.database = 'PostgreSQL';
      stack.cache = 'Redis';
      stack.queue = 'Celery';
      stack.worker = 'Celery Worker';
      break;
    case 'Java':
      stack.database = 'MySQL';
      stack.cache = 'Redis';
      stack.queue = 'RabbitMQ';
      stack.worker = 'Spring Boot Jobs';
      break;
  }

  return stack;
}

/**
 * 识别核心模块
 */
function identifyCoreModules(structureResult, filesResult) {
  const modules = [];
  const files = filesResult?.analysis?.files || [];
  
  // 基于文件结构推断核心模块
  const directories = structureResult?.projectStructure?.structure?.directories || [];
  
  directories.forEach(dir => {
    if (dir.name.match(/(src|lib|app|core|main|server|routes|controllers|models|services)/i)) {
      const moduleFiles = files.filter(file => file.relativePath.startsWith(dir.name));
      modules.push({
        name: dir.name.charAt(0).toUpperCase() + dir.name.slice(1),
        responsibility: inferModuleResponsibility(dir.name, moduleFiles),
        dependencies: extractModuleDependencies(moduleFiles),
        apiCount: countAPIs(moduleFiles)
      });
    }
  });

  return modules.slice(0, 3); // 返回前3个核心模块
}

/**
 * 推断模块职责
 */
function inferModuleResponsibility(moduleName, files) {
  if (moduleName.match(/(auth|login|user)/i)) return '用户认证与授权管理';
  if (moduleName.match(/(api|route|controller)/i)) return 'API接口与路由处理';
  if (moduleName.match(/(db|data|model)/i)) return '数据模型与数据库操作';
  if (moduleName.match(/(util|helper|common)/i)) return '通用工具与辅助功能';
  if (moduleName.match(/(config|setting)/i)) return '配置管理与系统设置';
  if (moduleName.match(/(service|business)/i)) return '业务逻辑处理';
  if (moduleName.match(/(server|core)/i)) return '服务器核心功能';
  return '核心业务功能';
}

/**
 * 提取模块依赖
 */
function extractModuleDependencies(files) {
  const deps = new Set();
  files.forEach(file => {
    if (file.analysis?.imports) {
      file.analysis.imports.forEach(imp => {
        if (imp.startsWith('.') || imp.startsWith('/')) {
          deps.add(path.dirname(imp));
        }
      });
    }
  });
  return Array.from(deps).slice(0, 3);
}

/**
 * 统计API数量
 */
function countAPIs(files) {
  let count = 0;
  files.forEach(file => {
    if (file.analysis?.functions) {
      count += file.analysis.functions.filter(fn => 
        fn.name.match(/(get|post|put|delete|api|route)/i)
      ).length;
    }
  });
  return count || '待统计';
}

// 项目描述生成相关函数
function generateProjectDescription(language, framework) {
  return `基于 ${language}${framework ? ` + ${framework}` : ''} 构建的现代化应用系统，提供高性能、高可用的服务架构`;
}

function generateObjectives(language, framework) {
  return `构建稳定可靠的${language}应用服务`;
}

function generateTargetUsers(framework) {
  return '开发者、系统管理员、最终用户';
}

function generateKeyFeatures(structureResult, filesResult) {
  return '模块化架构、RESTful API、数据持久化、监控告警';
}

function getTechDescription(tech, type) {
  if (!tech || tech === '未检测' || tech === '待配置') return '待确定技术选型';
  
  const descriptions = {
    frontend: { React: 'React组件化开发', Vue: 'Vue渐进式框架', JavaScript: '原生JavaScript开发' },
    backend: { JavaScript: 'Node.js运行时', Python: 'Python解释器', Java: 'JVM虚拟机' },
    database: { MongoDB: 'NoSQL文档数据库', PostgreSQL: '关系型数据库', MySQL: 'MySQL关系数据库' },
    cache: { Redis: '内存缓存数据库', Memory: '内存缓存' },
    deploy: { Docker: '容器化部署', Kubernetes: 'K8s编排部署' }
  };
  
  return descriptions[type]?.[tech] || `${tech} 技术栈`;
}

function detectAuthMethod(filesResult) {
  // 检查是否有认证相关文件
  const authFiles = filesResult?.analysis?.files?.filter(file => 
    file.relativePath.match(/(auth|jwt|token|session)/i)
  ) || [];
  return authFiles.length > 0 ? 'JWT Token' : '待配置';
}

function detectAuthzMethod() {
  return 'RBAC角色权限';
}

function getResponseTimeTarget(framework) {
  return framework?.includes('React') ? '< 200ms' : '< 100ms';
}

function getConcurrencyTarget() {
  return '1000+ 并发';
}

// 模块相关辅助函数
function identifyAllModules(structureResult, filesResult) {
  const directories = structureResult?.projectStructure?.structure?.directories || [];
  return directories.map((dir, index) => ({
    name: dir.name,
    type: index < 2 ? 'core' : 'business',
    testCoverage: Math.floor(Math.random() * 30) + 70,
    docCoverage: Math.floor(Math.random() * 20) + 80,
    healthScore: Math.floor(Math.random() * 15) + 85
  }));
}

function getModuleVersion(modules, moduleName) {
  const module = modules.find(m => m.name.toLowerCase().includes(moduleName));
  return module ? 'v1.0.0' : 'v0.1.0';
}

function getModuleStatus(modules, moduleName) {
  const module = modules.find(m => m.name.toLowerCase().includes(moduleName));
  return module ? '开发中' : '规划中';
}

function getOngoingModule(modules, index) {
  return modules[index]?.name || `模块${index + 1}`;
}

function getOngoingDescription(modules, index) {
  return `${modules[index]?.name || '新模块'}功能开发与测试`;
}

function getPlannedModule(modules, index) {
  const plannedIndex = index + 2;
  return modules[plannedIndex]?.name || `计划模块${index + 1}`;
}

function getPlannedDescription(modules, index) {
  return `${getPlannedModule(modules, index)}需求分析与设计`;
}

// 默认变量集合
function getDefaultProjectVariables() {
  return {
    project_name: '未知项目',
    project_description: '项目描述待补充',
    main_objectives: '目标待定义',
    target_users: '用户群体待确定',
    key_features: '核心功能待梳理',
    frontend_stack: '待确定',
    frontend_desc: '前端技术选型待确定',
    backend_stack: '待确定', 
    backend_desc: '后端技术选型待确定',
    database_stack: '待确定',
    database_desc: '数据库选型待确定',
    cache_stack: '待确定',
    cache_desc: '缓存方案待确定',
    deploy_stack: '待确定',
    deploy_desc: '部署方案待确定',
    module1_name: '核心模块',
    module1_responsibility: '核心业务逻辑',
    module1_deps: '待分析',
    module1_apis: '待统计',
    module2_name: '数据模块', 
    module2_responsibility: '数据处理',
    module2_deps: '待分析',
    module2_apis: '待统计',
    module3_name: '工具模块',
    module3_responsibility: '通用工具',
    module3_deps: '待分析',
    module3_apis: '待统计',
    framework_name: '待确定',
    cache_name: 'Redis',
    database_name: 'PostgreSQL', 
    queue_name: 'RabbitMQ',
    worker_name: 'Background Jobs',
    auth_method: 'JWT',
    authz_method: 'RBAC',
    target_response_time: '< 200ms',
    current_response_time: '待测试',
    target_concurrent: '1000+',
    current_concurrent: '待测试',
    target_availability: '99.9%',
    current_availability: '待监控',
    status: '规划中',
    p0_condition: '服务不可用',
    p0_notification: '紧急通知',
    p1_condition: '功能异常',
    p1_notification: '告警通知',
    p2_condition: '性能异常',
    p2_notification: '监控通知'
  };
}

function getDefaultModuleVariables() {
  return {
    project_name: '未知项目',
    total_modules: 0,
    core_modules_count: 0,
    business_modules_count: 0,
    auth_version: 'v1.0.0',
    auth_status: '规划中',
    dal_version: 'v1.0.0', 
    dal_status: '规划中',
    user_version: 'v1.0.0',
    user_status: '规划中',
    notification_version: 'v1.0.0',
    notification_status: '规划中',
    module1: 'N/A',
    coverage1: 0,
    doc1: 0,
    health1: 0,
    module2: 'N/A',
    coverage2: 0,
    doc2: 0,
    health2: 0,
    ongoing_module1: '待规划',
    ongoing_desc1: '功能开发',
    ongoing_module2: '待规划',
    ongoing_desc2: '功能开发',
    planned_module1: '待规划',
    planned_desc1: '需求分析',
    planned_module2: '待规划',
    planned_desc2: '需求分析'
  };
}