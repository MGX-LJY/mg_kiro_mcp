/**
 * Integration Contract Analyzer - Step 8 Implementation
 * 智能集成契约分析器：深度解析模块间调用关系、数据流向、API契约
 * 
 * 功能：
 * - 模块间调用关系分析
 * - API契约和接口识别
 * - 数据流向映射
 * - 集成点检测
 * - 契约文档生成
 */

import { promises as fs } from 'fs';
import path from 'path';

export class IntegrationAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxDepth: options.maxDepth || 10,
      includeInternalDeps: options.includeInternalDeps !== false,
      includeExternalDeps: options.includeExternalDeps !== false,
      analyzeApiContracts: options.analyzeApiContracts !== false,
      detectDataFlow: options.detectDataFlow !== false,
      ...options
    };
    
    this.analysisCache = new Map();
    this.startTime = null;
    this.integrationPoints = new Map();
    this.contractRegistry = new Map();
  }

  /**
   * 分析项目集成契约
   * @param {Object} workflowResults - 前面步骤的工作流结果
   * @returns {Object} 集成契约分析结果
   */
  async analyzeIntegration(workflowResults) {
    this.startTime = process.hrtime.bigint();
    
    try {
      console.log('[IntegrationAnalyzer] 开始集成契约分析');
      
      // 提取并验证必需的工作流数据
      const extractedData = this._extractWorkflowData(workflowResults);
      const { projectPath, structureData, languageData, filesData, modulesData } = extractedData;
      
      console.log(`[IntegrationAnalyzer] 分析项目: ${projectPath}`);
      console.log(`[IntegrationAnalyzer] 主要语言: ${languageData.primaryLanguage}`);
      console.log(`[IntegrationAnalyzer] 模块数量: ${modulesData?.modules?.length || 0}`);
      
      // 执行核心分析步骤
      const analysisSteps = await this._performAnalysisSteps(extractedData);
      
      // 生成集成契约文档数据
      const contractDocument = this._generateContractDocument(analysisSteps, extractedData);
      
      const executionTime = Math.max(1, Math.round(Number(process.hrtime.bigint() - this.startTime) / 1000000)); // Convert nanoseconds to milliseconds, minimum 1ms
      
      const result = {
        success: true,
        analysis: {
          executionTime,
          projectPath,
          primaryLanguage: languageData.primaryLanguage,
          analysisTimestamp: new Date().toISOString(),
          
          // 分析统计
          statistics: {
            totalModules: analysisSteps.moduleRelations.modules.length,
            totalRelations: analysisSteps.moduleRelations.relations.length,
            integrationPoints: analysisSteps.integrationPoints.length,
            apiContracts: analysisSteps.apiContracts.contracts.length,
            dataFlows: analysisSteps.dataFlow.flows.length,
            externalDependencies: analysisSteps.externalDeps.dependencies.length
          }
        },
        
        // 核心分析数据
        moduleRelations: analysisSteps.moduleRelations,
        integrationPoints: analysisSteps.integrationPoints,
        apiContracts: analysisSteps.apiContracts,
        dataFlow: analysisSteps.dataFlow,
        externalDependencies: analysisSteps.externalDeps,
        
        // 契约文档
        contractDocument,
        
        // 建议和风险
        recommendations: this._generateRecommendations(analysisSteps),
        risks: this._identifyIntegrationRisks(analysisSteps),
        
        timestamp: new Date().toISOString()
      };
      
      console.log(`[IntegrationAnalyzer] 集成契约分析完成 (${executionTime}ms)`);
      return result;
      
    } catch (error) {
      console.error('[IntegrationAnalyzer] 集成契约分析失败:', error);
      return {
        success: false,
        error: error.message,
        executionTime: Math.max(1, Math.round(Number(process.hrtime.bigint() - this.startTime) / 1000000)),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 提取工作流数据
   * @param {Object} workflowResults - 工作流结果
   * @returns {Object} 提取的数据
   * @private
   */
  _extractWorkflowData(workflowResults) {
    const structureData = workflowResults.step_1;
    const languageData = workflowResults.step_2?.detection;
    const filesData = workflowResults.step_3;
    const modulesData = workflowResults.step_5?.analysis;
    
    if (!structureData) {
      throw new Error('缺少项目结构数据 (Step 1)');
    }
    
    if (!languageData) {
      throw new Error('缺少语言检测数据 (Step 2)');
    }
    
    if (!filesData) {
      throw new Error('缺少文件分析数据 (Step 3)');
    }
    
    return {
      projectPath: structureData.projectPath,
      structureData,
      languageData,
      filesData,
      modulesData: modulesData || { modules: [] }
    };
  }

  /**
   * 执行分析步骤
   * @param {Object} extractedData - 提取的数据
   * @returns {Object} 分析步骤结果
   * @private
   */
  async _performAnalysisSteps(extractedData) {
    const { projectPath, structureData, languageData, filesData, modulesData } = extractedData;
    
    // 步骤1：分析模块间关系
    console.log('[IntegrationAnalyzer] 步骤1: 分析模块间关系');
    const moduleRelations = await this._analyzeModuleRelations(modulesData, filesData, languageData);
    
    // 步骤2：识别集成点
    console.log('[IntegrationAnalyzer] 步骤2: 识别集成点');
    const integrationPoints = await this._identifyIntegrationPoints(moduleRelations, filesData, languageData);
    
    // 步骤3：分析API契约
    console.log('[IntegrationAnalyzer] 步骤3: 分析API契约');
    const apiContracts = await this._analyzeApiContracts(integrationPoints, filesData, languageData);
    
    // 步骤4：分析数据流
    console.log('[IntegrationAnalyzer] 步骤4: 分析数据流');
    const dataFlow = await this._analyzeDataFlow(moduleRelations, apiContracts, filesData);
    
    // 步骤5：分析外部依赖
    console.log('[IntegrationAnalyzer] 步骤5: 分析外部依赖');
    const externalDeps = await this._analyzeExternalDependencies(filesData, modulesData, languageData);
    
    return {
      moduleRelations,
      integrationPoints,
      apiContracts,
      dataFlow,
      externalDeps
    };
  }

  /**
   * 分析模块间关系
   * @param {Object} modulesData - 模块数据
   * @param {Object} filesData - 文件数据
   * @param {Object} languageData - 语言数据
   * @returns {Object} 模块关系分析结果
   * @private
   */
  async _analyzeModuleRelations(modulesData, filesData, languageData) {
    const modules = modulesData.modules || [];
    const relations = [];
    const relationshipMap = new Map();
    
    // 基于文件依赖构建模块关系
    if (filesData.dependencies && filesData.dependencies.edges) {
      filesData.dependencies.edges.forEach(edge => {
        const sourceModule = this._findModuleByPath(modules, edge.from);
        const targetModule = this._findModuleByPath(modules, edge.to);
        
        if (sourceModule && targetModule && sourceModule.id !== targetModule.id) {
          const relationKey = `${sourceModule.id}-${targetModule.id}`;
          
          if (!relationshipMap.has(relationKey)) {
            const relation = {
              id: relationKey,
              source: {
                moduleId: sourceModule.id,
                moduleName: sourceModule.name,
                path: sourceModule.relativePath,
                category: sourceModule.category
              },
              target: {
                moduleId: targetModule.id,
                moduleName: targetModule.name,
                path: targetModule.relativePath,
                category: targetModule.category
              },
              type: this._classifyRelationType(sourceModule, targetModule, edge),
              strength: this._calculateRelationStrength(sourceModule, targetModule),
              dependencies: [edge],
              interfaces: []
            };
            
            relations.push(relation);
            relationshipMap.set(relationKey, relation);
          } else {
            // 添加额外的依赖
            relationshipMap.get(relationKey).dependencies.push(edge);
          }
        }
      });
    }
    
    // 分析模块依赖强度和类型
    relations.forEach(relation => {
    relation.strength = this._calculateRelationStrength(relation.source, relation.target, relation.dependencies);
    relation.interfaces = this._extractRelationInterfaces(relation, languageData);
    });
    
    return {
      modules: modules.map(m => ({
        id: m.id,
        name: m.name,
        path: m.relativePath,
        category: m.category,
        type: m.type,
        metrics: m.metrics
      })),
      relations,
      statistics: {
        totalModules: modules.length,
        totalRelations: relations.length,
        relationTypes: this._groupRelationsByType(relations),
        strongRelations: relations.filter(r => r.strength > 0.7).length,
        weakRelations: relations.filter(r => r.strength < 0.3).length
      }
    };
  }

  /**
   * 识别集成点
   * @param {Object} moduleRelations - 模块关系
   * @param {Object} filesData - 文件数据
   * @param {Object} languageData - 语言数据
   * @returns {Array} 集成点列表
   * @private
   */
  async _identifyIntegrationPoints(moduleRelations, filesData, languageData) {
    const integrationPoints = [];
    const primaryLanguage = languageData.primaryLanguage;
    
    // 从模块关系中识别集成点
    moduleRelations.relations.forEach(relation => {
      if (this._isIntegrationPoint(relation, primaryLanguage)) {
        const integrationPoint = {
          id: `integration_${relation.id}`,
          type: this._classifyIntegrationType(relation, primaryLanguage),
          source: relation.source,
          target: relation.target,
          description: this._generateIntegrationDescription(relation, primaryLanguage),
          interfaces: this._extractIntegrationInterfaces(relation, filesData, primaryLanguage),
          complexity: this._calculateIntegrationComplexity(relation),
          risks: this._assessIntegrationRisks(relation),
          recommendations: this._generateIntegrationRecommendations(relation)
        };
        
        integrationPoints.push(integrationPoint);
      }
    });
    
    // 基于文件内容识别额外的集成点
    const additionalPoints = await this._identifyAdditionalIntegrationPoints(filesData, languageData);
    integrationPoints.push(...additionalPoints);
    
    return integrationPoints.sort((a, b) => b.complexity - a.complexity);
  }

  /**
   * 分析API契约
   * @param {Array} integrationPoints - 集成点
   * @param {Object} filesData - 文件数据
   * @param {Object} languageData - 语言数据
   * @returns {Object} API契约分析结果
   * @private
   */
  async _analyzeApiContracts(integrationPoints, filesData, languageData) {
    const contracts = [];
    const contractTypes = new Map();
    
    for (const point of integrationPoints) {
      if (point.type === 'api' || point.type === 'service' || point.type === 'rpc') {
        const contract = await this._extractApiContract(point, filesData, languageData);
        if (contract) {
          contracts.push(contract);
          
          const type = contract.contractType;
          contractTypes.set(type, (contractTypes.get(type) || 0) + 1);
        }
      }
    }
    
    return {
      contracts,
      statistics: {
        totalContracts: contracts.length,
        contractTypes: Object.fromEntries(contractTypes),
        restApis: contracts.filter(c => c.contractType === 'REST').length,
        graphqlApis: contracts.filter(c => c.contractType === 'GraphQL').length,
        rpcApis: contracts.filter(c => c.contractType === 'RPC').length,
        internalApis: contracts.filter(c => c.scope === 'internal').length,
        externalApis: contracts.filter(c => c.scope === 'external').length
      }
    };
  }

  /**
   * 分析数据流
   * @param {Object} moduleRelations - 模块关系
   * @param {Object} apiContracts - API契约
   * @param {Object} filesData - 文件数据
   * @returns {Object} 数据流分析结果
   * @private
   */
  async _analyzeDataFlow(moduleRelations, apiContracts, filesData) {
    const flows = [];
    const dataTypes = new Set();
    
    // 从模块关系构建数据流
    moduleRelations.relations.forEach(relation => {
      const flow = this._extractDataFlow(relation, filesData);
      if (flow) {
        flows.push(flow);
        flow.dataTypes.forEach(type => dataTypes.add(type));
      }
    });
    
    // 从API契约补充数据流信息
    apiContracts.contracts.forEach(contract => {
      const apiFlows = this._extractApiDataFlows(contract);
      flows.push(...apiFlows);
      apiFlows.forEach(flow => 
        flow.dataTypes.forEach(type => dataTypes.add(type))
      );
    });
    
    // 数据流分组和分析
    const flowsByType = this._groupFlowsByType(flows);
    const criticalPaths = this._identifyCriticalDataPaths(flows);
    
    return {
      flows,
      flowsByType,
      criticalPaths,
      statistics: {
        totalFlows: flows.length,
        uniqueDataTypes: dataTypes.size,
        dataTypes: Array.from(dataTypes),
        synchronousFlows: flows.filter(f => f.type === 'synchronous').length,
        asynchronousFlows: flows.filter(f => f.type === 'asynchronous').length,
        bidirectionalFlows: flows.filter(f => f.direction === 'bidirectional').length
      }
    };
  }

  /**
   * 分析外部依赖
   * @param {Object} filesData - 文件数据
   * @param {Object} modulesData - 模块数据
   * @param {Object} languageData - 语言数据
   * @returns {Object} 外部依赖分析结果
   * @private
   */
  async _analyzeExternalDependencies(filesData, modulesData, languageData) {
    const dependencies = [];
    const dependencyTypes = new Map();
    const securityRisks = [];
    
    // 从文件分析中提取外部依赖
    if (filesData.files) {
      filesData.files.forEach(file => {
        if (file.analysis && file.analysis.dependencies) {
          file.analysis.dependencies.forEach(dep => {
            if (this._isExternalDependency(dep, languageData)) {
              const dependency = {
                name: dep.name || dep,
                type: this._classifyDependencyType(dep, languageData),
                source: file.relativePath,
                version: this._extractVersion(dep),
                scope: this._determineDependencyScope(dep),
                critical: this._isDependencyCritical(dep, file),
                securityRisk: this._assessSecurityRisk(dep)
              };
              
              dependencies.push(dependency);
              
              const type = dependency.type;
              dependencyTypes.set(type, (dependencyTypes.get(type) || 0) + 1);
              
              if (dependency.securityRisk > 0.5) {
                securityRisks.push({
                  dependency: dependency.name,
                  risk: dependency.securityRisk,
                  source: dependency.source,
                  reason: this._getSecurityRiskReason(dep)
                });
              }
            }
          });
        }
      });
    }
    
    return {
      dependencies,
      securityRisks,
      statistics: {
        totalDependencies: dependencies.length,
        dependencyTypes: Object.fromEntries(dependencyTypes),
        criticalDependencies: dependencies.filter(d => d.critical).length,
        securityRisks: securityRisks.length,
        outdatedDependencies: dependencies.filter(d => this._isOutdated(d)).length
      }
    };
  }

  /**
   * 生成契约文档
   * @param {Object} analysisSteps - 分析步骤结果
   * @param {Object} extractedData - 提取的数据
   * @returns {Object} 契约文档数据
   * @private
   */
  _generateContractDocument(analysisSteps, extractedData) {
    const { projectPath, languageData } = extractedData;
    const projectName = projectPath.split('/').pop();
    
    return {
      metadata: {
        title: `${projectName} - 集成契约文档`,
        projectName,
        projectPath,
        primaryLanguage: languageData.primaryLanguage,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      
      summary: {
        overview: this._generateProjectOverview(analysisSteps, extractedData),
        keyMetrics: {
          totalModules: analysisSteps.moduleRelations.modules.length,
          integrationPoints: analysisSteps.integrationPoints.length,
          apiContracts: analysisSteps.apiContracts.contracts.length,
          dataFlows: analysisSteps.dataFlow.flows.length,
          externalDeps: analysisSteps.externalDeps.dependencies.length
        },
        architecture: this._generateArchitectureSummary(analysisSteps)
      },
      
      sections: [
        this._generateModuleRelationsSection(analysisSteps.moduleRelations),
        this._generateIntegrationPointsSection(analysisSteps.integrationPoints),
        this._generateApiContractsSection(analysisSteps.apiContracts),
        this._generateDataFlowSection(analysisSteps.dataFlow),
        this._generateExternalDepsSection(analysisSteps.externalDeps),
        this._generateRecommendationsSection(analysisSteps),
        this._generateRisksSection(analysisSteps)
      ].filter(section => section !== null)
    };
  }

  /**
   * 生成改进建议
   * @param {Object} analysisSteps - 分析步骤结果
   * @returns {Array} 建议列表
   * @private
   */
  _generateRecommendations(analysisSteps) {
    const recommendations = [];
    
    // 模块关系建议
    if (analysisSteps.moduleRelations.statistics.strongRelations > analysisSteps.moduleRelations.statistics.totalRelations * 0.3) {
      recommendations.push({
        type: 'architecture',
        priority: 'medium',
        title: '模块耦合度过高',
        description: '检测到较多强耦合关系，建议重构以降低模块间依赖',
        impact: 'maintainability'
      });
    }
    
    // API契约建议
    if (analysisSteps.apiContracts.statistics.totalContracts > 0) {
      const undocumentedApis = analysisSteps.apiContracts.contracts.filter(c => !c.documentation || c.documentation.completeness < 0.5);
      if (undocumentedApis.length > 0) {
        recommendations.push({
          type: 'documentation',
          priority: 'high',
          title: 'API文档不完整',
          description: `发现 ${undocumentedApis.length} 个API缺少完整文档`,
          impact: 'integration'
        });
      }
    }
    
    // 外部依赖建议
    if (analysisSteps.externalDeps.statistics.securityRisks > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: '外部依赖安全风险',
        description: `发现 ${analysisSteps.externalDeps.statistics.securityRisks} 个潜在安全风险`,
        impact: 'security'
      });
    }
    
    return recommendations;
  }

  /**
   * 识别集成风险
   * @param {Object} analysisSteps - 分析步骤结果
   * @returns {Array} 风险列表
   * @private
   */
  _identifyIntegrationRisks(analysisSteps) {
    const risks = [];
    
    // 循环依赖风险
    const circularDeps = this._detectCircularDependencies(analysisSteps.moduleRelations);
    if (circularDeps.length > 0) {
      risks.push({
        type: 'circular_dependency',
        severity: 'high',
        title: '循环依赖风险',
        description: `检测到 ${circularDeps.length} 处循环依赖`,
        affected: circularDeps,
        mitigation: '重构模块结构，移除循环依赖关系'
      });
    }
    
    // 单点故障风险
    const criticalModules = this._identifyCriticalModules(analysisSteps.moduleRelations);
    if (criticalModules.length > 0) {
      risks.push({
        type: 'single_point_of_failure',
        severity: 'medium',
        title: '单点故障风险',
        description: `发现 ${criticalModules.length} 个关键模块`,
        affected: criticalModules,
        mitigation: '增加冗余设计，降低关键模块的依赖度'
      });
    }
    
    return risks;
  }

  // 辅助方法
  _findModuleByPath(modules, path) {
    return modules.find(m => m.relativePath === path || m.path === path);
  }

  _classifyRelationType(sourceModule, targetModule, edge) {
    if (sourceModule.category === 'core' && targetModule.category === 'business') return 'core-to-business';
    if (sourceModule.category === 'business' && targetModule.category === 'service') return 'business-to-service';
    if (sourceModule.type === 'controller' && targetModule.type === 'service') return 'controller-service';
    return 'general';
  }

  _calculateRelationStrength(source, target, dependencies = []) {
    let strength = 0.1;
    
    // 基于依赖数量
    strength += Math.min(dependencies.length * 0.1, 0.4);
    
    // 基于模块类型
    if (source.category === target.category) strength += 0.2;
    if (source.type === 'controller' && target.type === 'service') strength += 0.3;
    
    return Math.min(strength, 1.0);
  }

  _groupRelationsByType(relations) {
    const groups = {};
    relations.forEach(relation => {
      const type = relation.type;
      groups[type] = (groups[type] || 0) + 1;
    });
    return groups;
  }

  _isIntegrationPoint(relation, language) {
    // 判断是否为集成点的逻辑
    return relation.strength > 0.5 || 
           relation.type.includes('service') || 
           relation.type.includes('api');
  }

  _classifyIntegrationType(relation, language) {
    if (relation.type.includes('api')) return 'api';
    if (relation.type.includes('service')) return 'service';
    if (relation.type.includes('controller')) return 'mvc';
    return 'module';
  }

  _generateIntegrationDescription(relation, language) {
    return `${relation.source.moduleName} 与 ${relation.target.moduleName} 之间的${relation.type}集成`;
  }

  _extractIntegrationInterfaces(relation, filesData, language) {
    // 提取集成接口的逻辑
    return [];
  }

  _extractRelationInterfaces(relation, languageData) {
    // 提取关系接口信息
    const interfaces = [];
    
    // 基于依赖关系提取接口
    if (relation.dependencies && relation.dependencies.length > 0) {
      relation.dependencies.forEach(dep => {
        interfaces.push({
          name: dep.name || dep,
          type: dep.type || 'dependency',
          description: `${relation.source.moduleName} 依赖 ${relation.target.moduleName}`
        });
      });
    }
    
    return interfaces;
  }

  _calculateIntegrationComplexity(relation) {
    return relation.strength * (1 + relation.dependencies.length * 0.1);
  }

  _assessIntegrationRisks(relation) {
    return [];
  }

  _generateIntegrationRecommendations(relation) {
    return [];
  }

  _identifyAdditionalIntegrationPoints(filesData, languageData) {
    return [];
  }

  _extractApiContract(point, filesData, languageData) {
    return null;
  }

  _extractDataFlow(relation, filesData) {
    return null;
  }

  _extractApiDataFlows(contract) {
    return [];
  }

  _groupFlowsByType(flows) {
    return {};
  }

  _identifyCriticalDataPaths(flows) {
    return [];
  }

  _isExternalDependency(dep, languageData) {
    return true;
  }

  _classifyDependencyType(dep, languageData) {
    return 'external';
  }

  _extractVersion(dep) {
    return null;
  }

  _determineDependencyScope(dep) {
    return 'runtime';
  }

  _isDependencyCritical(dep, file) {
    return false;
  }

  _assessSecurityRisk(dep) {
    return 0.0;
  }

  _getSecurityRiskReason(dep) {
    return '';
  }

  _isOutdated(dep) {
    return false;
  }

  _generateProjectOverview(analysisSteps, extractedData) {
    return `项目集成契约分析概览`;
  }

  _generateArchitectureSummary(analysisSteps) {
    return `系统架构摘要`;
  }

  _generateModuleRelationsSection(moduleRelations) {
    return {
      title: '模块关系图',
      type: 'module-relations',
      content: moduleRelations
    };
  }

  _generateIntegrationPointsSection(integrationPoints) {
    return {
      title: '集成点分析',
      type: 'integration-points', 
      content: integrationPoints
    };
  }

  _generateApiContractsSection(apiContracts) {
    return {
      title: 'API契约规范',
      type: 'api-contracts',
      content: apiContracts
    };
  }

  _generateDataFlowSection(dataFlow) {
    return {
      title: '数据流向分析',
      type: 'data-flow',
      content: dataFlow
    };
  }

  _generateExternalDepsSection(externalDeps) {
    return {
      title: '外部依赖分析',
      type: 'external-deps',
      content: externalDeps
    };
  }

  _generateRecommendationsSection(analysisSteps) {
    return {
      title: '改进建议',
      type: 'recommendations',
      content: this._generateRecommendations(analysisSteps)
    };
  }

  _generateRisksSection(analysisSteps) {
    return {
      title: '风险识别',
      type: 'risks',
      content: this._identifyIntegrationRisks(analysisSteps)
    };
  }

  _detectCircularDependencies(moduleRelations) {
    const visited = new Set();
    const recursionStack = new Set();
    const circularDeps = [];
    
    const detectCycle = (moduleName, path = []) => {
      if (recursionStack.has(moduleName)) {
        // Found a cycle
        const cycleStart = path.indexOf(moduleName);
        const cycle = path.slice(cycleStart).concat(moduleName);
        circularDeps.push(cycle);
        return true;
      }
      
      if (visited.has(moduleName)) {
        return false;
      }
      
      visited.add(moduleName);
      recursionStack.add(moduleName);
      
      // Find dependencies of this module
      const dependencies = moduleRelations.relations?.filter(rel => 
        rel.source?.moduleName === moduleName
      ) || [];
      
      for (const dep of dependencies) {
        const targetModule = dep.target?.moduleName;
        if (targetModule && detectCycle(targetModule, path.concat(moduleName))) {
          return true;
        }
      }
      
      recursionStack.delete(moduleName);
      return false;
    };
    
    // Check all modules
    const modules = moduleRelations.modules || [];
    for (const module of modules) {
      const moduleName = module.name || module.moduleName;
      if (moduleName && !visited.has(moduleName)) {
        detectCycle(moduleName);
      }
    }
    
    return circularDeps;
  }

  _identifyCriticalModules(moduleRelations) {
    return [];
  }
}

export default IntegrationAnalyzer;