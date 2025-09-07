/**
 * 契约路由集成测试
 * 测试第8步集成契约文档生成的完整API流程
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createContractsRoutes } from '../../server/routes/init/contracts.js';
import { IntegrationAnalyzer } from '../../server/analyzers/integration-analyzer.js';

describe('契约路由集成测试', () => {
  let app;
  let mockServices;
  let mockWorkflow;

  beforeAll(() => {
    // 创建Express应用
    app = express();
    app.use(express.json({
      strict: false,
      // Handle JSON parsing errors
      verify: function(req, res, buf, encoding) {
        try {
          JSON.parse(buf.toString(encoding));
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }
    }));
    
    // 创建Mock服务
    mockServices = createMockServices();
    
    // 挂载契约路由
    const contractsRouter = createContractsRoutes(mockServices);
    app.use('/mode/init', contractsRouter);
    
    // JSON解析错误处理中间件
    app.use((error, req, res, next) => {
      if (error.message === 'Invalid JSON' || error.type === 'entity.parse.failed') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format'
        });
      }
      next(error);
    });
    
    // 全局错误处理
    app.use((error, req, res, next) => {
      res.status(500).json({
        success: false,
        error: error.message
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 创建Mock工作流
    mockWorkflow = createMockWorkflow();
    mockServices.workflowService.getWorkflow.mockReturnValue(mockWorkflow);
    mockServices.workflowService.getProgress.mockReturnValue({
      currentStep: 8,
      completedSteps: [1, 2, 3, 5, 8],
      progress: 100
    });
  });

  afterEach(() => {
    global.cleanupMocks();
  });

  describe('POST /mode/init/generate-contracts', () => {
    test('应该成功生成集成契约文档', async () => {
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.step).toBe(8);
      expect(response.body.stepName).toBe('generate_contracts');
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.document).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      
      // 验证文档结构
      const document = response.body.data.document;
      expect(document.type).toBe('integration-contracts');
      expect(document.content).toBeDefined();
      expect(document.metadata).toBeDefined();
      expect(document.sections).toBeDefined();
    });

    test('应该包含完整的分析统计', async () => {
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' })
        .expect(200);

      const summary = response.body.data.summary;
      expect(summary.totalModules).toBeGreaterThanOrEqual(0);
      expect(summary.totalRelations).toBeGreaterThanOrEqual(0);
      expect(summary.integrationPoints).toBeGreaterThanOrEqual(0);
      expect(summary.apiContracts).toBeGreaterThanOrEqual(0);
      expect(summary.dataFlows).toBeGreaterThanOrEqual(0);
      expect(summary.externalDependencies).toBeGreaterThanOrEqual(0);
      expect(summary.recommendationsCount).toBeGreaterThanOrEqual(0);
      expect(summary.risksCount).toBeGreaterThanOrEqual(0);
    });

    test('应该验证workflowId参数', async () => {
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('工作流ID不能为空');
    });

    test('应该验证工作流存在性', async () => {
      mockServices.workflowService.getWorkflow.mockReturnValue(null);

      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'nonexistent_workflow' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('工作流不存在');
    });

    test('应该验证前置步骤完成状态', async () => {
      // 创建缺少前置步骤的工作流
      const incompleteWorkflow = {
        ...mockWorkflow,
        results: {
          step_1: mockWorkflow.results.step_1,
          step_2: mockWorkflow.results.step_2
          // 缺少 step_3 和 step_5
        }
      };
      mockServices.workflowService.getWorkflow.mockReturnValue(incompleteWorkflow);

      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'incomplete_workflow' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('前置步骤未完成');
    });

    test('应该正确更新工作流状态', async () => {
      await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' })
        .expect(200);

      // 验证状态更新调用
      expect(mockServices.workflowService.updateStep).toHaveBeenCalledWith(
        'test_workflow_123', 7, 'running'
      );
      expect(mockServices.workflowService.updateStep).toHaveBeenCalledWith(
        'test_workflow_123', 7, 'completed', expect.any(Object)
      );
    });

    test('应该处理分析器错误', async () => {
      // Mock分析器抛出错误 - 提供格式错误的数据而不是null
      mockServices.workflowService.getWorkflow.mockReturnValue({
        ...mockWorkflow,
        results: {
          ...mockWorkflow.results,
          step_3: { malformed: 'data' }, // 缺少必要的字段导致分析器错误
          step_5: { analysis: { modules: 'invalid' } } // 无效的模块数据
        }
      });

      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'error_workflow' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('应该记录执行时间', async () => {
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' })
        .expect(200);

      expect(response.body.data.generation.executionTime).toBeGreaterThan(0);
      expect(response.body.data.generation.timestamp).toBeDefined();
    });
  });

  describe('GET /mode/init/contracts', () => {
    beforeEach(async () => {
      // 先生成契约文档
      await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' });
    });

    test('应该返回JSON格式的契约文档', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123', format: 'json' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.format).toBe('json');
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.document).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.access).toBeDefined();
    });

    test('应该返回Markdown格式的契约文档', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123', format: 'markdown' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.format).toBe('markdown');
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.filename).toBe('integration-contracts.md');
    });

    test('应该返回摘要格式的契约文档', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123', format: 'summary' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.format).toBe('summary');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.generation).toBeDefined();
    });

    test('应该默认返回JSON格式', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123' })
        .expect(200);

      expect(response.body.data.format).toBe('json');
    });

    test('应该验证workflowId参数', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('工作流ID不能为空');
    });

    test('应该验证契约文档是否存在', async () => {
      // 创建没有第8步结果的工作流
      mockServices.workflowService.getWorkflow.mockReturnValue({
        ...mockWorkflow,
        results: {
          step_1: mockWorkflow.results.step_1,
          step_2: mockWorkflow.results.step_2,
          step_3: mockWorkflow.results.step_3,
          step_5: mockWorkflow.results.step_5
          // 缺少 step_8
        }
      });

      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'no_contracts_workflow' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('集成契约文档未生成');
    });

    test('应该包含访问时间戳', async () => {
      const response = await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123' })
        .expect(200);

      expect(response.body.data.access.workflowId).toBe('test_workflow_123');
      expect(response.body.data.access.accessTime).toBeDefined();
      expect(response.body.data.access.step).toBe(8);
      expect(response.body.data.access.stepName).toBe('contracts');
    });
  });

  describe('GET /mode/init/relations', () => {
    beforeEach(async () => {
      // 先生成契约文档
      await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' });
    });

    test('应该返回模块关系图数据', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'modules' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('module-relations');
      expect(response.body.data.nodes).toBeDefined();
      expect(response.body.data.edges).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
    });

    test('应该返回集成点数据', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'integration' })
        .expect(200);

      expect(response.body.data.type).toBe('integration-points');
      expect(response.body.data.points).toBeDefined();
      expect(response.body.data.count).toBeGreaterThanOrEqual(0);
    });

    test('应该返回数据流数据', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'dataflow' })
        .expect(200);

      expect(response.body.data.type).toBe('data-flow');
      expect(response.body.data.flows).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
    });

    test('应该返回外部依赖数据', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'dependencies' })
        .expect(200);

      expect(response.body.data.type).toBe('external-dependencies');
      expect(response.body.data.dependencies).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
    });

    test('应该默认返回模块关系图', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123' })
        .expect(200);

      expect(response.body.data.type).toBe('module-relations');
    });

    test('应该拒绝不支持的关系图类型', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'unsupported' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('不支持的关系图类型');
    });

    test('应该验证契约分析结果存在', async () => {
      mockServices.workflowService.getWorkflow.mockReturnValue({
        ...mockWorkflow,
        results: {
          step_1: mockWorkflow.results.step_1
          // 缺少其他步骤
        }
      });

      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'incomplete_workflow' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('集成契约分析结果不存在');
    });

    test('应该包含元数据', async () => {
      const response = await request(app)
        .get('/mode/init/relations')
        .query({ workflowId: 'test_workflow_123', type: 'modules' })
        .expect(200);

      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.workflowId).toBe('test_workflow_123');
      expect(response.body.data.metadata.requestedType).toBe('modules');
      expect(response.body.data.metadata.timestamp).toBeDefined();
    });
  });

  describe('错误处理', () => {
    test('应该处理服务器内部错误', async () => {
      // Mock服务抛出异常
      mockServices.workflowService.getWorkflow.mockImplementation(() => {
        throw new Error('服务器内部错误');
      });

      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'error_workflow' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('应该处理无效JSON请求', async () => {
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    test('应该处理超大请求', async () => {
      const largePayload = {
        workflowId: 'test_workflow',
        extraData: 'x'.repeat(100000) // 100KB字符串
      };

      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send(largePayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('性能测试', () => {
    test('生成契约文档应该在合理时间内完成', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' })
        .expect(200);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000); // 10秒内完成
      expect(response.body.data.generation.executionTime).toBeGreaterThan(0);
    });

    test('获取契约文档应该快速响应', async () => {
      // 先生成文档
      await request(app)
        .post('/mode/init/generate-contracts')
        .send({ workflowId: 'test_workflow_123' });
      
      const start = Date.now();
      
      await request(app)
        .get('/mode/init/contracts')
        .query({ workflowId: 'test_workflow_123' })
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1秒内完成
    });
  });

  describe('并发测试', () => {
    test('应该支持并发生成请求', async () => {
      const workflowIds = ['workflow_1', 'workflow_2', 'workflow_3'];
      
      const promises = workflowIds.map(id => 
        request(app)
          .post('/mode/init/generate-contracts')
          .send({ workflowId: id })
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.workflow.workflowId).toBe(workflowIds[index]);
      });
    });
  });
});

/**
 * 创建Mock服务
 */
function createMockServices() {
  return {
    workflowService: {
      getWorkflow: jest.fn(),
      updateStep: jest.fn(),
      getProgress: jest.fn()
    },
    promptService: {
      loadPrompt: jest.fn().mockResolvedValue({
        content: '# Mock Contract Document\nThis is a mock document.',
        metadata: { template: 'integration-contracts' }
      })
    }
  };
}

/**
 * 创建Mock工作流
 */
function createMockWorkflow() {
  const mockResults = global.createMockWorkflowResults();
  
  return {
    projectPath: '/test/project',
    currentStep: 8,
    results: {
      ...mockResults,
      // 添加第8步结果（模拟已生成的契约文档）
      step_8: {
        analysis: {
          statistics: {
            totalModules: 2,
            totalRelations: 1,
            integrationPoints: 1,
            apiContracts: 0,
            dataFlows: 1,
            externalDependencies: 3
          }
        },
        moduleRelations: {
          modules: mockResults.step_5.analysis.modules,
          relations: [
            {
              id: 'rel_1',
              source: { moduleId: 'index_js', moduleName: 'index' },
              target: { moduleId: 'service_js', moduleName: 'service' },
              type: 'general',
              strength: 0.6
            }
          ],
          statistics: {
            totalModules: 2,
            totalRelations: 1,
            strongRelations: 0,
            weakRelations: 1
          }
        },
        integrationPoints: [
          {
            id: 'integration_1',
            type: 'service',
            description: '服务集成点',
            complexity: 0.5
          }
        ],
        apiContracts: { contracts: [], statistics: { totalContracts: 0 } },
        dataFlow: {
          flows: [
            {
              id: 'flow_1',
              sourceId: 'index_js',
              targetId: 'service_js',
              dataType: 'config'
            }
          ],
          statistics: {
            totalFlows: 1,
            synchronousFlows: 1,
            asynchronousFlows: 0,
            bidirectionalFlows: 0,
            dataTypes: ['config']
          }
        },
        externalDependencies: {
          dependencies: [
            { name: 'express', type: 'framework', critical: true },
            { name: 'fs', type: 'builtin', critical: false },
            { name: 'path', type: 'builtin', critical: false }
          ],
          statistics: {
            totalDependencies: 3,
            criticalDependencies: 1,
            securityRisks: 0
          }
        },
        document: {
          type: 'integration-contracts',
          content: '# Mock Integration Contract Document',
          metadata: {
            title: 'Test Project - 集成契约文档',
            generatedAt: new Date().toISOString()
          },
          sections: [
            { title: '项目概览', level: 2 },
            { title: '模块关系图', level: 2 }
          ]
        },
        summary: {
          totalModules: 2,
          totalRelations: 1,
          integrationPoints: 1,
          apiContracts: 0,
          dataFlows: 1,
          externalDependencies: 3,
          recommendationsCount: 1,
          risksCount: 0
        },
        recommendations: [
          {
            type: 'architecture',
            priority: 'medium',
            title: '模块优化',
            description: '建议优化模块结构'
          }
        ],
        risks: []
      }
    }
  };
}