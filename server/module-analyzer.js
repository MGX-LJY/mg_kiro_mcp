/**
 * Module Analyzer - mg_kiro MCP Server
 * 模块分析器：深度分析项目模块的依赖关系、接口定义和功能职责
 * 支持多语言项目的智能模块解析和分析功能
 */

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * 创建模块分析路由
 * @param {Object} dependencies - 依赖对象
 * @param {PromptManager} dependencies.promptManager - 提示词管理器
 * @param {WorkflowState} dependencies.workflowState - 工作流状态管理器
 * @returns {express.Router} Express路由对象
 */
export function createModuleAnalyzerRoutes({ promptManager, workflowState }) {
  const router = express.Router();

  // ========== 第5步-A: 逐个模块详细分析 ==========
  router.post('/analyze-modules', async (req, res) => {
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

      // 检查前置条件 - 需要前4步完成
      const prerequisites = ['scan-structure', 'detect-language', 'scan-files', 'generate-architecture'];
      const missingSteps = prerequisites.filter(step => !workflow.results?.[step]);
      
      if (missingSteps.length > 0) {
        return res.status(400).json({
          success: false,
          error: `前置步骤未完成：${missingSteps.join(', ')}，请先完成前4步工作流`
        });
      }

      console.log(`[Step5] 开始深度模块分析: ${workflowId}`);
      
      // 更新步骤状态
      workflowState.updateStep(workflowId, 'analyze-modules', 'running');

      const startTime = Date.now();

      // 获取前4步的分析结果
      const structureResult = workflow.results['scan-structure'];
      const languageResult = workflow.results['detect-language'];
      const filesResult = workflow.results['scan-files'];
      const architectureResult = workflow.results['generate-architecture'];

      // 执行深度模块分析
      const moduleAnalysis = await performDeepModuleAnalysis(
        structureResult,
        languageResult, 
        filesResult,
        architectureResult,
        workflow.config?.projectPath
      );

      const executionTime = Date.now() - startTime;

      // 保存结果到工作流
      const result = {
        success: true,
        step: 'analyze-modules',
        executionTime,
        analysis: moduleAnalysis,
        generatedAt: new Date().toISOString(),
        totalModulesAnalyzed: moduleAnalysis.modules.length,
        analysisDepth: 'deep'
      };

      workflowState.setStepResult(workflowId, 'analyze-modules', result);
      workflowState.updateStep(workflowId, 'analyze-modules', 'completed');

      console.log(`[Step5] 模块分析完成: ${executionTime}ms, 分析了${moduleAnalysis.modules.length}个模块`);

      res.json({
        success: true,
        step: 'analyze-modules',
        data: {
          modules: moduleAnalysis.modules,
          dependencies: moduleAnalysis.dependencies,
          interfaces: moduleAnalysis.interfaces,
          metrics: moduleAnalysis.metrics,
          executionTime
        },
        workflowProgress: workflowState.getProgress(workflowId)
      });

    } catch (error) {
      console.error('[Step5] 模块分析失败:', error);
      
      if (req.body.workflowId) {
        workflowState.updateStep(req.body.workflowId, 'analyze-modules', 'failed', error.message);
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ========== 第5步-B: 获取单个模块详情 ==========
  router.get('/modules-detail/:moduleId', async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { workflowId } = req.query;
      
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: '工作流ID不能为空'
        });
      }

      if (!moduleId) {
        return res.status(400).json({
          success: false,
          error: '模块ID不能为空'
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

      // 检查模块分析是否已完成
      const analysisResult = workflow.results?.['analyze-modules'];
      if (!analysisResult) {
        return res.status(400).json({
          success: false,
          error: '模块分析未完成，请先执行 POST /mode/init/analyze-modules'
        });
      }

      console.log(`[Step5] 获取模块详情: ${workflowId} - ${moduleId}`);

      // 查找指定模块
      const module = analysisResult.analysis.modules.find(m => 
        m.id === moduleId || m.name === moduleId || m.path === moduleId
      );

      if (!module) {
        return res.status(404).json({
          success: false,
          error: `模块不存在: ${moduleId}`,
          availableModules: analysisResult.analysis.modules.map(m => ({
            id: m.id,
            name: m.name,
            path: m.path
          }))
        });
      }

      // 生成详细的模块报告
      const detailReport = generateModuleDetailReport(
        module,
        analysisResult.analysis,
        workflow.config?.projectPath
      );

      res.json({
        success: true,
        moduleId,
        module: detailReport,
        relatedModules: getRelatedModules(module, analysisResult.analysis.modules),
        dependencies: getModuleDependencies(module, analysisResult.analysis.dependencies),
        interfaces: getModuleInterfaces(module, analysisResult.analysis.interfaces)
      });

    } catch (error) {
      console.error('[Step5] 获取模块详情失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

/**
 * 执行深度模块分析
 */
async function performDeepModuleAnalysis(structureResult, languageResult, filesResult, architectureResult, projectPath) {
  console.log('[Step5] 开始执行深度模块分析...');

  const mainLanguage = languageResult?.analysis?.mainLanguage || 'Unknown';
  const framework = languageResult?.analysis?.framework || 'Generic';
  const projectFiles = filesResult?.analysis?.files || [];

  // 1. 识别和分析所有模块
  const modules = await identifyProjectModules(structureResult, projectFiles, projectPath, mainLanguage);
  console.log(`[Step5] 识别到 ${modules.length} 个模块`);

  // 2. 分析模块间依赖关系
  const dependencies = analyzeModuleDependencies(modules, projectFiles, mainLanguage);
  console.log(`[Step5] 分析了 ${dependencies.edges.length} 个依赖关系`);

  // 3. 提取和分析接口定义
  const interfaces = extractModuleInterfaces(modules, projectFiles, mainLanguage);
  console.log(`[Step5] 提取了 ${interfaces.length} 个接口定义`);

  // 4. 计算分析指标
  const metrics = calculateAnalysisMetrics(modules, dependencies, interfaces);

  return {
    modules,
    dependencies,
    interfaces,
    metrics,
    summary: {
      totalModules: modules.length,
      totalDependencies: dependencies.edges.length,
      totalInterfaces: interfaces.length,
      complexityScore: metrics.complexityScore,
      mainLanguage,
      framework
    }
  };
}

/**
 * 识别项目模块
 */
async function identifyProjectModules(structureResult, projectFiles, projectPath, mainLanguage) {
  const modules = [];
  const directories = structureResult?.projectStructure?.structure?.directories || [];
  
  // 基于目录结构和文件内容识别模块
  for (const dir of directories) {
    // 跳过常见的非模块目录
    if (isNonModuleDirectory(dir.name)) {
      continue;
    }

    // 获取目录下的文件
    const moduleFiles = projectFiles.filter(file => 
      file.relativePath.startsWith(dir.name + '/') || 
      file.relativePath.startsWith(dir.name + '\\')
    );

    if (moduleFiles.length === 0) {
      continue;
    }

    // 分析模块特征
    const module = {
      id: generateModuleId(dir.name, projectPath),
      name: dir.name,
      path: dir.name,
      type: inferModuleType(dir.name, moduleFiles, mainLanguage),
      files: moduleFiles.map(f => ({
        path: f.relativePath,
        type: f.analysis?.type || 'unknown',
        size: f.size || 0,
        lines: f.analysis?.metrics?.lines || 0
      })),
      functions: extractModuleFunctions(moduleFiles),
      classes: extractModuleClasses(moduleFiles),
      exports: extractModuleExports(moduleFiles, mainLanguage),
      imports: extractModuleImports(moduleFiles, mainLanguage),
      responsibility: inferModuleResponsibility(dir.name, moduleFiles, mainLanguage),
      complexity: calculateModuleComplexity(moduleFiles),
      testCoverage: estimateTestCoverage(moduleFiles),
      documentation: analyzeDocumentation(moduleFiles),
      lastModified: getLastModifiedTime(moduleFiles)
    };

    modules.push(module);
  }

  // 处理根级别文件作为单独模块
  const rootFiles = projectFiles.filter(file => 
    !file.relativePath.includes('/') && !file.relativePath.includes('\\')
  );

  if (rootFiles.length > 0) {
    modules.push({
      id: generateModuleId('root', projectPath),
      name: 'root',
      path: '.',
      type: 'root',
      files: rootFiles.map(f => ({
        path: f.relativePath,
        type: f.analysis?.type || 'unknown',
        size: f.size || 0,
        lines: f.analysis?.metrics?.lines || 0
      })),
      functions: extractModuleFunctions(rootFiles),
      classes: extractModuleClasses(rootFiles),
      exports: extractModuleExports(rootFiles, mainLanguage),
      imports: extractModuleImports(rootFiles, mainLanguage),
      responsibility: 'Entry point and configuration',
      complexity: calculateModuleComplexity(rootFiles),
      testCoverage: estimateTestCoverage(rootFiles),
      documentation: analyzeDocumentation(rootFiles),
      lastModified: getLastModifiedTime(rootFiles)
    });
  }

  return modules;
}

/**
 * 分析模块间依赖关系
 */
function analyzeModuleDependencies(modules, projectFiles, mainLanguage) {
  const dependencies = {
    nodes: modules.map(m => ({ id: m.id, name: m.name, type: m.type })),
    edges: []
  };

  // 分析每个模块的依赖
  modules.forEach(module => {
    module.imports.forEach(importPath => {
      // 找到被依赖的模块
      const targetModule = findTargetModule(importPath, modules);
      if (targetModule && targetModule.id !== module.id) {
        dependencies.edges.push({
          source: module.id,
          target: targetModule.id,
          type: 'import',
          importPath,
          strength: calculateDependencyStrength(module, targetModule, importPath)
        });
      }
    });
  });

  // 去重并排序
  dependencies.edges = dependencies.edges
    .filter((edge, index, self) => 
      self.findIndex(e => e.source === edge.source && e.target === edge.target) === index
    )
    .sort((a, b) => b.strength - a.strength);

  return dependencies;
}

/**
 * 提取模块接口
 */
function extractModuleInterfaces(modules, projectFiles, mainLanguage) {
  const interfaces = [];

  modules.forEach(module => {
    // 提取公开的API接口
    const moduleInterfaces = {
      moduleId: module.id,
      moduleName: module.name,
      publicAPI: [],
      types: [],
      constants: []
    };

    // 根据语言类型提取接口
    switch (mainLanguage) {
      case 'JavaScript':
        moduleInterfaces.publicAPI = extractJavaScriptAPI(module);
        moduleInterfaces.types = extractJavaScriptTypes(module);
        break;
      case 'Python':
        moduleInterfaces.publicAPI = extractPythonAPI(module);
        moduleInterfaces.types = extractPythonTypes(module);
        break;
      case 'Java':
        moduleInterfaces.publicAPI = extractJavaAPI(module);
        moduleInterfaces.types = extractJavaTypes(module);
        break;
      default:
        moduleInterfaces.publicAPI = extractGenericAPI(module);
    }

    if (moduleInterfaces.publicAPI.length > 0 || 
        moduleInterfaces.types.length > 0 || 
        moduleInterfaces.constants.length > 0) {
      interfaces.push(moduleInterfaces);
    }
  });

  return interfaces;
}

/**
 * 计算分析指标
 */
function calculateAnalysisMetrics(modules, dependencies, interfaces) {
  const totalFiles = modules.reduce((sum, m) => sum + m.files.length, 0);
  const totalLines = modules.reduce((sum, m) => 
    sum + m.files.reduce((fileSum, f) => fileSum + f.lines, 0), 0
  );
  const totalFunctions = modules.reduce((sum, m) => sum + m.functions.length, 0);
  const totalClasses = modules.reduce((sum, m) => sum + m.classes.length, 0);

  // 计算复杂度评分
  const avgComplexity = modules.reduce((sum, m) => sum + m.complexity, 0) / modules.length;
  const dependencyComplexity = dependencies.edges.length / modules.length;
  const complexityScore = Math.round((avgComplexity + dependencyComplexity) * 10) / 10;

  // 计算内聚性和耦合性
  const cohesion = calculateCohesion(modules);
  const coupling = calculateCoupling(modules, dependencies);

  return {
    totalModules: modules.length,
    totalFiles,
    totalLines,
    totalFunctions,
    totalClasses,
    totalDependencies: dependencies.edges.length,
    totalInterfaces: interfaces.length,
    complexityScore,
    cohesion,
    coupling,
    maintainabilityIndex: calculateMaintainabilityIndex(complexityScore, cohesion, coupling),
    qualityScore: calculateQualityScore(modules, dependencies, interfaces)
  };
}

// ========== 辅助函数 ==========

function isNonModuleDirectory(dirName) {
  const nonModuleDirs = [
    'node_modules', 'coverage', 'dist', 'build', '.git', '.vscode', 
    '.idea', 'logs', 'tmp', 'temp', '__pycache__', '.pytest_cache',
    'target', 'bin', 'obj', 'packages'
  ];
  return nonModuleDirs.includes(dirName.toLowerCase());
}

function generateModuleId(name, projectPath) {
  const projectName = path.basename(projectPath || process.cwd());
  return `${projectName}-${name}-${Date.now().toString(36)}`;
}

function inferModuleType(dirName, files, language) {
  const name = dirName.toLowerCase();
  
  if (name.includes('test') || name.includes('spec')) return 'test';
  if (name.includes('config') || name.includes('setting')) return 'config';
  if (name.includes('util') || name.includes('helper')) return 'utility';
  if (name.includes('service') || name.includes('api')) return 'service';
  if (name.includes('model') || name.includes('entity')) return 'model';
  if (name.includes('view') || name.includes('component')) return 'view';
  if (name.includes('controller') || name.includes('handler')) return 'controller';
  if (name.includes('middleware') || name.includes('plugin')) return 'middleware';
  if (name === 'src' || name === 'lib') return 'core';
  
  return 'business';
}

function extractModuleFunctions(files) {
  const functions = [];
  files.forEach(file => {
    if (file.analysis?.functions) {
      file.analysis.functions.forEach(func => {
        functions.push({
          name: func.name,
          file: file.relativePath,
          visibility: inferFunctionVisibility(func.name),
          parameters: func.parameters || [],
          complexity: func.complexity || 1
        });
      });
    }
  });
  return functions;
}

function extractModuleClasses(files) {
  const classes = [];
  files.forEach(file => {
    if (file.analysis?.classes) {
      file.analysis.classes.forEach(cls => {
        classes.push({
          name: cls.name,
          file: file.relativePath,
          methods: cls.methods || [],
          properties: cls.properties || []
        });
      });
    }
  });
  return classes;
}

function extractModuleExports(files, language) {
  const exports = [];
  files.forEach(file => {
    if (file.analysis?.exports) {
      exports.push(...file.analysis.exports);
    }
  });
  return exports;
}

function extractModuleImports(files, language) {
  const imports = [];
  files.forEach(file => {
    if (file.analysis?.imports) {
      imports.push(...file.analysis.imports);
    }
  });
  return [...new Set(imports)]; // 去重
}

function inferModuleResponsibility(dirName, files, language) {
  const name = dirName.toLowerCase();
  
  if (name.includes('auth')) return '用户认证与授权管理';
  if (name.includes('api') || name.includes('route')) return 'API接口与路由处理';
  if (name.includes('db') || name.includes('data')) return '数据模型与数据库操作';
  if (name.includes('util') || name.includes('helper')) return '通用工具与辅助功能';
  if (name.includes('config')) return '配置管理与系统设置';
  if (name.includes('service')) return '业务逻辑处理';
  if (name.includes('view') || name.includes('component')) return '用户界面展示';
  if (name.includes('test')) return '测试用例与质量保证';
  if (name === 'src' || name === 'lib') return '核心业务功能';
  
  return '业务功能模块';
}

function calculateModuleComplexity(files) {
  let complexity = 0;
  files.forEach(file => {
    if (file.analysis?.metrics?.complexity) {
      complexity += file.analysis.metrics.complexity;
    } else {
      // 简单的复杂度估算
      const lines = file.analysis?.metrics?.lines || 0;
      complexity += Math.ceil(lines / 50); // 每50行算1点复杂度
    }
  });
  return Math.max(1, complexity);
}

function estimateTestCoverage(files) {
  const testFiles = files.filter(f => 
    f.relativePath.includes('test') || 
    f.relativePath.includes('spec') ||
    f.type === 'test'
  );
  
  const sourceFiles = files.filter(f => f.type === 'source');
  
  if (sourceFiles.length === 0) return 0;
  
  // 简单的覆盖率估算：有测试文件的比例
  return Math.round((testFiles.length / sourceFiles.length) * 100);
}

function analyzeDocumentation(files) {
  const docFiles = files.filter(f => 
    f.relativePath.toLowerCase().includes('readme') ||
    f.relativePath.toLowerCase().endsWith('.md') ||
    f.relativePath.toLowerCase().includes('doc')
  );
  
  return {
    hasReadme: docFiles.some(f => f.relativePath.toLowerCase().includes('readme')),
    docFiles: docFiles.length,
    coverage: docFiles.length > 0 ? 'good' : 'poor'
  };
}

function getLastModifiedTime(files) {
  // 这里应该从文件系统获取，暂时返回当前时间
  return new Date().toISOString();
}

function findTargetModule(importPath, modules) {
  // 尝试匹配相对路径导入
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const normalizedPath = path.normalize(importPath).replace(/\\/g, '/');
    return modules.find(m => 
      normalizedPath.includes(m.path) || 
      m.files.some(f => normalizedPath.includes(f.path))
    );
  }
  
  // 尝试匹配模块名
  return modules.find(m => m.name === importPath || importPath.includes(m.name));
}

function calculateDependencyStrength(sourceModule, targetModule, importPath) {
  // 基于导入频率和类型计算依赖强度
  let strength = 1;
  
  if (importPath.includes('*')) strength += 2; // 全量导入
  if (sourceModule.files.filter(f => f.path.includes(targetModule.name)).length > 1) {
    strength += 1; // 多文件依赖
  }
  
  return strength;
}

// 接口提取相关函数
function extractJavaScriptAPI(module) {
  const api = [];
  module.exports.forEach(exp => {
    api.push({
      name: exp,
      type: 'export',
      visibility: 'public'
    });
  });
  
  module.functions.forEach(func => {
    if (func.visibility === 'public') {
      api.push({
        name: func.name,
        type: 'function',
        visibility: func.visibility,
        parameters: func.parameters
      });
    }
  });
  
  return api;
}

function extractJavaScriptTypes(module) {
  // 提取TypeScript类型或JSDoc类型
  return [];
}

function extractPythonAPI(module) {
  const api = [];
  module.functions.forEach(func => {
    if (!func.name.startsWith('_')) { // Python中_开头的是私有函数
      api.push({
        name: func.name,
        type: 'function',
        visibility: 'public',
        parameters: func.parameters
      });
    }
  });
  return api;
}

function extractPythonTypes(module) {
  return [];
}

function extractJavaAPI(module) {
  const api = [];
  module.classes.forEach(cls => {
    cls.methods.forEach(method => {
      if (method.visibility === 'public') {
        api.push({
          name: `${cls.name}.${method.name}`,
          type: 'method',
          visibility: 'public',
          parameters: method.parameters || []
        });
      }
    });
  });
  return api;
}

function extractJavaTypes(module) {
  return module.classes.map(cls => ({
    name: cls.name,
    type: 'class',
    properties: cls.properties || []
  }));
}

function extractGenericAPI(module) {
  return module.functions.map(func => ({
    name: func.name,
    type: 'function',
    visibility: func.visibility || 'public'
  }));
}

function inferFunctionVisibility(funcName) {
  if (funcName.startsWith('_') || funcName.startsWith('#')) return 'private';
  if (funcName.startsWith('test') || funcName.includes('Test')) return 'test';
  return 'public';
}

function calculateCohesion(modules) {
  // 计算模块内聚性 - 模块内部元素的相关性
  let totalCohesion = 0;
  modules.forEach(module => {
    const functionsCount = module.functions.length;
    const filesCount = module.files.length;
    
    // 简单的内聚性计算：功能数与文件数的比例
    const cohesion = functionsCount > 0 ? functionsCount / Math.max(1, filesCount) : 0;
    totalCohesion += Math.min(1, cohesion / 5); // 标准化到0-1
  });
  
  return Math.round((totalCohesion / modules.length) * 100) / 100;
}

function calculateCoupling(modules, dependencies) {
  // 计算模块耦合性 - 模块间依赖的程度
  const totalDependencies = dependencies.edges.length;
  const maxPossibleDependencies = modules.length * (modules.length - 1);
  
  return maxPossibleDependencies > 0 ? 
    Math.round((totalDependencies / maxPossibleDependencies) * 100) / 100 : 0;
}

function calculateMaintainabilityIndex(complexity, cohesion, coupling) {
  // 基于复杂度、内聚性和耦合性计算可维护性指数
  const maintainability = (cohesion * 0.4) + ((1 - coupling) * 0.3) + ((10 - complexity) / 10 * 0.3);
  return Math.max(0, Math.min(1, maintainability));
}

function calculateQualityScore(modules, dependencies, interfaces) {
  // 综合质量评分
  const avgComplexity = modules.reduce((sum, m) => sum + m.complexity, 0) / modules.length;
  const avgTestCoverage = modules.reduce((sum, m) => sum + m.testCoverage, 0) / modules.length;
  const interfaceRatio = interfaces.length / modules.length;
  
  const qualityScore = (
    (Math.max(0, 10 - avgComplexity) / 10 * 0.3) + // 复杂度越低越好
    (avgTestCoverage / 100 * 0.4) + // 测试覆盖率越高越好
    (Math.min(1, interfaceRatio) * 0.3) // 接口定义完整性
  ) * 100;
  
  return Math.round(qualityScore);
}

// 模块详情相关函数
function generateModuleDetailReport(module, analysis, projectPath) {
  return {
    ...module,
    metrics: {
      files: module.files.length,
      functions: module.functions.length,
      classes: module.classes.length,
      linesOfCode: module.files.reduce((sum, f) => sum + f.lines, 0),
      complexity: module.complexity,
      testCoverage: module.testCoverage
    },
    dependencies: {
      imports: module.imports.length,
      exports: module.exports.length
    },
    quality: {
      maintainabilityIndex: calculateModuleMaintainabilityIndex(module),
      codeSmells: identifyCodeSmells(module),
      recommendations: generateRecommendations(module)
    }
  };
}

function getRelatedModules(module, allModules) {
  // 找到与当前模块相关的其他模块
  return allModules
    .filter(m => m.id !== module.id)
    .filter(m => 
      module.imports.some(imp => imp.includes(m.name)) ||
      m.imports.some(imp => imp.includes(module.name))
    )
    .map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      relationship: determineRelationship(module, m)
    }));
}

function getModuleDependencies(module, dependencyGraph) {
  const incoming = dependencyGraph.edges.filter(edge => edge.target === module.id);
  const outgoing = dependencyGraph.edges.filter(edge => edge.source === module.id);
  
  return {
    incoming: incoming.map(edge => ({
      source: edge.source,
      type: edge.type,
      strength: edge.strength
    })),
    outgoing: outgoing.map(edge => ({
      target: edge.target,
      type: edge.type,
      strength: edge.strength
    }))
  };
}

function getModuleInterfaces(module, interfaceDefinitions) {
  return interfaceDefinitions.find(iface => iface.moduleId === module.id) || {
    publicAPI: [],
    types: [],
    constants: []
  };
}

function calculateModuleMaintainabilityIndex(module) {
  // 单个模块的可维护性指数
  const complexity = module.complexity;
  const testCoverage = module.testCoverage / 100;
  const docQuality = module.documentation.coverage === 'good' ? 1 : 0.5;
  
  return Math.round((testCoverage * 0.4 + docQuality * 0.3 + Math.max(0, (10 - complexity) / 10) * 0.3) * 100);
}

function identifyCodeSmells(module) {
  const smells = [];
  
  if (module.complexity > 10) {
    smells.push({ type: 'high_complexity', severity: 'warning', message: '模块复杂度过高' });
  }
  
  if (module.files.length > 20) {
    smells.push({ type: 'too_many_files', severity: 'info', message: '文件数量较多，建议拆分' });
  }
  
  if (module.testCoverage < 50) {
    smells.push({ type: 'low_test_coverage', severity: 'warning', message: '测试覆盖率不足' });
  }
  
  return smells;
}

function generateRecommendations(module) {
  const recommendations = [];
  
  if (module.complexity > 8) {
    recommendations.push('考虑重构复杂函数，提高代码可读性');
  }
  
  if (module.testCoverage < 70) {
    recommendations.push('增加单元测试，提高测试覆盖率');
  }
  
  if (module.documentation.coverage === 'poor') {
    recommendations.push('添加模块文档和注释，提高代码可维护性');
  }
  
  return recommendations;
}

function determineRelationship(moduleA, moduleB) {
  if (moduleA.imports.some(imp => imp.includes(moduleB.name))) {
    return 'depends_on';
  }
  if (moduleB.imports.some(imp => imp.includes(moduleA.name))) {
    return 'used_by';
  }
  return 'related';
}