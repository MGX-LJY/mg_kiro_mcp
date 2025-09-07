/**
 * IntegrationAnalyzer 单元测试
 * 全面测试集成契约分析器的各个功能
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { IntegrationAnalyzer } from '../../server/analyzers/integration-analyzer.js';

describe('IntegrationAnalyzer', () => {
  let analyzer;
  let mockWorkflowResults;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 创建分析器实例
    analyzer = new IntegrationAnalyzer({
      includeInternalDeps: true,
      includeExternalDeps: true,
      analyzeApiContracts: true,
      detectDataFlow: true
    });

    // 创建mock工作流数据
    mockWorkflowResults = global.createMockWorkflowResults();
  });

  afterEach(() => {
    global.cleanupMocks();
  });

  describe('构造函数', () => {
    test('应该使用默认配置创建实例', () => {
      const defaultAnalyzer = new IntegrationAnalyzer();
      expect(defaultAnalyzer.options.maxDepth).toBe(10);
      expect(defaultAnalyzer.options.includeInternalDeps).toBe(true);
      expect(defaultAnalyzer.options.includeExternalDeps).toBe(true);
    });

    test('应该使用自定义配置创建实例', () => {
      const customAnalyzer = new IntegrationAnalyzer({
        maxDepth: 5,
        includeInternalDeps: false,
        analyzeApiContracts: false
      });
      expect(customAnalyzer.options.maxDepth).toBe(5);
      expect(customAnalyzer.options.includeInternalDeps).toBe(false);
      expect(customAnalyzer.options.analyzeApiContracts).toBe(false);
    });

    test('应该初始化内部状态', () => {
      expect(analyzer.analysisCache).toBeDefined();
      expect(analyzer.startTime).toBeNull();
      expect(analyzer.integrationPoints).toBeDefined();
      expect(analyzer.contractRegistry).toBeDefined();
    });
  });

  describe('analyzeIntegration', () => {
    test('应该成功分析有效的工作流结果', async () => {
      const result = await analyzer.analyzeIntegration(mockWorkflowResults);
      
      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.statistics).toBeDefined();
      expect(result.moduleRelations).toBeDefined();
      expect(result.integrationPoints).toBeDefined();
      expect(result.contractDocument).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.risks).toBeDefined();
    });

    test('应该返回正确的分析统计', async () => {
      const result = await analyzer.analyzeIntegration(mockWorkflowResults);
      
      const stats = result.analysis.statistics;
      expect(stats.totalModules).toBeGreaterThan(0);
      expect(stats.totalRelations).toBeGreaterThanOrEqual(0);
      expect(stats.integrationPoints).toBeGreaterThanOrEqual(0);
      expect(stats.apiContracts).toBeGreaterThanOrEqual(0);
      expect(stats.dataFlows).toBeGreaterThanOrEqual(0);
      expect(stats.externalDependencies).toBeGreaterThanOrEqual(0);
    });

    test('应该处理缺少前置步骤的情况', async () => {
      const incompleteResults = { step_1: mockWorkflowResults.step_1 };
      
      const result = await analyzer.analyzeIntegration(incompleteResults);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少语言检测数据');
    });

    test('应该处理空数据的情况', async () => {
      const emptyResults = {};
      
      const result = await analyzer.analyzeIntegration(emptyResults);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少项目结构数据');
    });

    test('应该记录执行时间', async () => {
      const result = await analyzer.analyzeIntegration(mockWorkflowResults);
      
      expect(result.analysis.executionTime).toBeGreaterThan(0);
      expect(result.analysis.analysisTimestamp).toBeDefined();
    });
  });

  describe('_extractWorkflowData', () => {
    test('应该正确提取工作流数据', () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      expect(extractedData.projectPath).toBe('/test/project');
      expect(extractedData.structureData).toBeDefined();
      expect(extractedData.languageData).toBeDefined();
      expect(extractedData.filesData).toBeDefined();
      expect(extractedData.modulesData).toBeDefined();
    });

    test('应该抛出缺少步骤1的错误', () => {
      const invalidResults = { ...mockWorkflowResults };
      delete invalidResults.step_1;
      
      expect(() => {
        analyzer._extractWorkflowData(invalidResults);
      }).toThrow('缺少项目结构数据');
    });

    test('应该抛出缺少步骤2的错误', () => {
      const invalidResults = { ...mockWorkflowResults };
      delete invalidResults.step_2;
      
      expect(() => {
        analyzer._extractWorkflowData(invalidResults);
      }).toThrow('缺少语言检测数据');
    });

    test('应该抛出缺少步骤3的错误', () => {
      const invalidResults = { ...mockWorkflowResults };
      delete invalidResults.step_3;
      
      expect(() => {
        analyzer._extractWorkflowData(invalidResults);
      }).toThrow('缺少文件分析数据');
    });
  });

  describe('_analyzeModuleRelations', () => {
    test('应该分析模块间关系', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const relations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData, 
        extractedData.filesData, 
        extractedData.languageData
      );
      
      expect(relations.modules).toBeDefined();
      expect(relations.relations).toBeDefined();
      expect(relations.statistics).toBeDefined();
      expect(relations.statistics.totalModules).toBeGreaterThan(0);
      expect(relations.statistics.totalRelations).toBeGreaterThanOrEqual(0);
    });

    test('应该处理空模块列表', async () => {
      const emptyModulesData = { modules: [] };
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const relations = await analyzer._analyzeModuleRelations(
        emptyModulesData,
        extractedData.filesData,
        extractedData.languageData
      );
      
      expect(relations.modules).toHaveLength(0);
      expect(relations.relations).toHaveLength(0);
      expect(relations.statistics.totalModules).toBe(0);
    });

    test('应该计算关系强度', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const relations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData,
        extractedData.filesData,
        extractedData.languageData
      );
      
      relations.relations.forEach(relation => {
        expect(relation.strength).toBeGreaterThanOrEqual(0);
        expect(relation.strength).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('_identifyIntegrationPoints', () => {
    test('应该识别集成点', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const moduleRelations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData,
        extractedData.filesData, 
        extractedData.languageData
      );
      
      const integrationPoints = await analyzer._identifyIntegrationPoints(
        moduleRelations,
        extractedData.filesData,
        extractedData.languageData
      );
      
      expect(Array.isArray(integrationPoints)).toBe(true);
      integrationPoints.forEach(point => {
        expect(point.id).toBeDefined();
        expect(point.type).toBeDefined();
        expect(point.complexity).toBeGreaterThanOrEqual(0);
      });
    });

    test('应该按复杂度排序集成点', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const moduleRelations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData,
        extractedData.filesData,
        extractedData.languageData
      );
      
      const integrationPoints = await analyzer._identifyIntegrationPoints(
        moduleRelations,
        extractedData.filesData,
        extractedData.languageData
      );
      
      for (let i = 1; i < integrationPoints.length; i++) {
        expect(integrationPoints[i].complexity).toBeLessThanOrEqual(
          integrationPoints[i - 1].complexity
        );
      }
    });
  });

  describe('_analyzeApiContracts', () => {
    test('应该分析API契约', async () => {
      const mockIntegrationPoints = [
        {
          id: 'integration_1',
          type: 'api',
          source: { moduleName: 'api-module' },
          target: { moduleName: 'service-module' }
        }
      ];
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const apiContracts = await analyzer._analyzeApiContracts(
        mockIntegrationPoints,
        extractedData.filesData,
        extractedData.languageData
      );
      
      expect(apiContracts.contracts).toBeDefined();
      expect(apiContracts.statistics).toBeDefined();
      expect(apiContracts.statistics.totalContracts).toBeGreaterThanOrEqual(0);
    });

    test('应该统计契约类型', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const apiContracts = await analyzer._analyzeApiContracts(
        [],
        extractedData.filesData,
        extractedData.languageData
      );
      
      expect(apiContracts.statistics.contractTypes).toBeDefined();
      expect(apiContracts.statistics.restApis).toBeGreaterThanOrEqual(0);
      expect(apiContracts.statistics.graphqlApis).toBeGreaterThanOrEqual(0);
      expect(apiContracts.statistics.rpcApis).toBeGreaterThanOrEqual(0);
    });
  });

  describe('_analyzeDataFlow', () => {
    test('应该分析数据流', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const moduleRelations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData,
        extractedData.filesData,
        extractedData.languageData
      );
      const apiContracts = { contracts: [] };
      
      const dataFlow = await analyzer._analyzeDataFlow(
        moduleRelations,
        apiContracts,
        extractedData.filesData
      );
      
      expect(dataFlow.flows).toBeDefined();
      expect(dataFlow.statistics).toBeDefined();
      expect(dataFlow.statistics.totalFlows).toBeGreaterThanOrEqual(0);
      expect(dataFlow.statistics.dataTypes).toBeDefined();
    });

    test('应该分组数据流类型', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      const moduleRelations = await analyzer._analyzeModuleRelations(
        extractedData.modulesData,
        extractedData.filesData,
        extractedData.languageData
      );
      
      const dataFlow = await analyzer._analyzeDataFlow(
        moduleRelations,
        { contracts: [] },
        extractedData.filesData
      );
      
      expect(dataFlow.statistics.synchronousFlows).toBeGreaterThanOrEqual(0);
      expect(dataFlow.statistics.asynchronousFlows).toBeGreaterThanOrEqual(0);
      expect(dataFlow.statistics.bidirectionalFlows).toBeGreaterThanOrEqual(0);
    });
  });

  describe('_analyzeExternalDependencies', () => {
    test('应该分析外部依赖', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const externalDeps = await analyzer._analyzeExternalDependencies(
        extractedData.filesData,
        extractedData.modulesData,
        extractedData.languageData
      );
      
      expect(externalDeps.dependencies).toBeDefined();
      expect(externalDeps.securityRisks).toBeDefined();
      expect(externalDeps.statistics).toBeDefined();
      expect(externalDeps.statistics.totalDependencies).toBeGreaterThanOrEqual(0);
    });

    test('应该识别安全风险', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const externalDeps = await analyzer._analyzeExternalDependencies(
        extractedData.filesData,
        extractedData.modulesData,
        extractedData.languageData
      );
      
      expect(externalDeps.statistics.securityRisks).toBeGreaterThanOrEqual(0);
      externalDeps.securityRisks.forEach(risk => {
        expect(risk.dependency).toBeDefined();
        expect(risk.risk).toBeGreaterThan(0);
        expect(risk.source).toBeDefined();
      });
    });

    test('应该分类依赖类型', async () => {
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const externalDeps = await analyzer._analyzeExternalDependencies(
        extractedData.filesData,
        extractedData.modulesData,
        extractedData.languageData
      );
      
      expect(externalDeps.statistics.dependencyTypes).toBeDefined();
      expect(externalDeps.statistics.criticalDependencies).toBeGreaterThanOrEqual(0);
    });
  });

  describe('_generateContractDocument', () => {
    test('应该生成契约文档', () => {
      const mockAnalysisSteps = {
        moduleRelations: { modules: [], relations: [], statistics: {} },
        integrationPoints: [],
        apiContracts: { contracts: [], statistics: {} },
        dataFlow: { flows: [], statistics: {} },
        externalDeps: { dependencies: [], statistics: {} }
      };
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const contractDoc = analyzer._generateContractDocument(
        mockAnalysisSteps,
        extractedData
      );
      
      expect(contractDoc.metadata).toBeDefined();
      expect(contractDoc.metadata.title).toBeDefined();
      expect(contractDoc.metadata.projectName).toBeDefined();
      expect(contractDoc.metadata.generatedAt).toBeDefined();
      expect(contractDoc.summary).toBeDefined();
      expect(contractDoc.sections).toBeDefined();
      expect(contractDoc.sections.length).toBeGreaterThan(0);
    });

    test('应该包含关键指标', () => {
      const mockAnalysisSteps = {
        moduleRelations: { 
          modules: [{ id: 'test' }], 
          relations: [], 
          statistics: {} 
        },
        integrationPoints: [{ id: 'point1' }],
        apiContracts: { contracts: [], statistics: {} },
        dataFlow: { flows: [], statistics: {} },
        externalDeps: { dependencies: [], statistics: {} }
      };
      const extractedData = analyzer._extractWorkflowData(mockWorkflowResults);
      
      const contractDoc = analyzer._generateContractDocument(
        mockAnalysisSteps,
        extractedData
      );
      
      expect(contractDoc.summary.keyMetrics.totalModules).toBe(1);
      expect(contractDoc.summary.keyMetrics.integrationPoints).toBe(1);
    });
  });

  describe('辅助方法', () => {
    test('_findModuleByPath 应该找到模块', () => {
      const modules = [
        { relativePath: 'index.js', name: 'index' },
        { relativePath: 'server/service.js', name: 'service' }
      ];
      
      const found = analyzer._findModuleByPath(modules, 'index.js');
      expect(found).toBeDefined();
      expect(found.name).toBe('index');
    });

    test('_classifyRelationType 应该分类关系类型', () => {
      const sourceModule = { category: 'core', type: 'main' };
      const targetModule = { category: 'business', type: 'service' };
      const edge = { type: 'import' };
      
      const relationType = analyzer._classifyRelationType(
        sourceModule, 
        targetModule, 
        edge
      );
      
      expect(typeof relationType).toBe('string');
      expect(relationType.length).toBeGreaterThan(0);
    });

    test('_calculateRelationStrength 应该计算关系强度', () => {
      const source = { category: 'core' };
      const target = { category: 'core' };
      const dependencies = [{ name: 'dep1' }, { name: 'dep2' }];
      
      const strength = analyzer._calculateRelationStrength(
        source, 
        target, 
        dependencies
      );
      
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    });

    test('_isIntegrationPoint 应该识别集成点', () => {
      const highStrengthRelation = { 
        strength: 0.8, 
        type: 'service-integration' 
      };
      const lowStrengthRelation = { 
        strength: 0.2, 
        type: 'general' 
      };
      
      expect(analyzer._isIntegrationPoint(highStrengthRelation, 'javascript')).toBe(true);
      expect(analyzer._isIntegrationPoint(lowStrengthRelation, 'javascript')).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('应该处理分析异常', async () => {
      // 创建会导致错误的无效数据
      const invalidData = {
        step_1: { projectPath: null },
        step_2: { detection: null },
        step_3: { files: null }
      };
      
      const result = await analyzer.analyzeIntegration(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('应该记录执行时间即使出错', async () => {
      const invalidData = {};
      
      const result = await analyzer.analyzeIntegration(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    test('分析应该在合理时间内完成', async () => {
      const { duration } = await global.measureTime(async () => {
        return analyzer.analyzeIntegration(mockWorkflowResults);
      });
      
      // 应该在5秒内完成
      expect(duration).toBeLessThan(5000);
    });

    test('大数据集应该能正常处理', async () => {
      // 创建大数据集
      const largeDataSet = {
        ...mockWorkflowResults,
        step_5: {
          analysis: {
            modules: Array.from({ length: 100 }, (_, i) => ({
              id: `module_${i}`,
              name: `module${i}`,
              relativePath: `src/module${i}.js`,
              category: i % 3 === 0 ? 'core' : i % 3 === 1 ? 'business' : 'utility',
              type: 'module',
              metrics: { lines: 100, functions: 5, classes: 1, complexity: 3 },
              dependencies: { imports: ['common'], exports: [`Module${i}`] }
            }))
          }
        }
      };
      
      const result = await analyzer.analyzeIntegration(largeDataSet);
      
      expect(result.success).toBe(true);
      expect(result.analysis.statistics.totalModules).toBe(100);
    });
  });

  describe('边界条件', () => {
    test('应该处理零模块情况', async () => {
      const zeroModulesData = {
        ...mockWorkflowResults,
        step_5: { analysis: { modules: [] } }
      };
      
      const result = await analyzer.analyzeIntegration(zeroModulesData);
      
      expect(result.success).toBe(true);
      expect(result.analysis.statistics.totalModules).toBe(0);
    });

    test('应该处理单模块情况', async () => {
      const singleModuleData = {
        ...mockWorkflowResults,
        step_5: {
          analysis: {
            modules: [{
              id: 'single_module',
              name: 'single',
              relativePath: 'single.js',
              category: 'core',
              type: 'main',
              metrics: { lines: 50, functions: 3, classes: 1, complexity: 2 },
              dependencies: { imports: [], exports: [] }
            }]
          }
        }
      };
      
      const result = await analyzer.analyzeIntegration(singleModuleData);
      
      expect(result.success).toBe(true);
      expect(result.analysis.statistics.totalModules).toBe(1);
      expect(result.analysis.statistics.totalRelations).toBe(0);
    });

    test('应该处理循环依赖', async () => {
      const circularDepsData = {
        ...mockWorkflowResults,
        step_3: {
          ...mockWorkflowResults.step_3,
          dependencies: {
            nodes: ['a.js', 'b.js', 'c.js'],
            edges: [
              { from: 'a.js', to: 'b.js', type: 'import' },
              { from: 'b.js', to: 'c.js', type: 'import' },
              { from: 'c.js', to: 'a.js', type: 'import' }
            ]
          }
        },
        step_5: {
          analysis: {
            modules: [
              { id: 'a', name: 'a', relativePath: 'a.js', category: 'core' },
              { id: 'b', name: 'b', relativePath: 'b.js', category: 'core' },
              { id: 'c', name: 'c', relativePath: 'c.js', category: 'core' }
            ]
          }
        }
      };
      
      const result = await analyzer.analyzeIntegration(circularDepsData);
      
      expect(result.success).toBe(true);
      expect(result.risks.some(r => r.type === 'circular_dependency')).toBe(true);
    });
  });
});