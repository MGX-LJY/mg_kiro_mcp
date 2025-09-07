/**
 * Create模式第1步：需求理解与拆解路由测试
 * 测试用户需求分析和用户故事更新功能
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createFeatureRoutes } from '../../server/routes/create/features.js';

describe('Create模式 - 需求理解与拆解路由测试', () => {
    let app;
    let mockServices;

    beforeEach(() => {
        // 清理mock
        jest.clearAllMocks();

        // 创建mock services
        mockServices = {
            workflowService: {
                getWorkflow: jest.fn(),
                updateStep: jest.fn()
            },
            promptService: {
                loadPrompt: jest.fn().mockRejectedValue(new Error('Template not found'))
            }
        };

        // 创建Express应用
        app = express();
        app.use(express.json());
        
        // 添加Create模式路由
        app.use('/mode/create', createFeatureRoutes(mockServices));

        // 错误处理中间件
        app.use((error, req, res, next) => {
            if (error.message === 'Invalid JSON' || error.type === 'entity.parse.failed') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid JSON format'
                });
            }
            res.status(500).json({
                success: false,
                error: error.message || 'Internal Server Error'
            });
        });
    });

    // ========== 需求分析API测试 ==========

    describe('POST /analyze-requirements', () => {
        const validRequirementsData = {
            requirements: [
                '用户登录功能',
                '用户注册功能',
                '数据存储功能',
                '用户界面设计',
                '安全权限管理'
            ],
            context: {
                projectType: 'web-application',
                targetUsers: 'general-users'
            },
            stakeholders: ['用户', '管理员', '开发者'],
            constraints: ['开发周期2个月', '团队3人'],
            businessGoals: ['提高用户体验', '增加用户留存'],
            language: 'javascript'
        };

        test('应该成功分析用户需求', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.analysis).toBeDefined();
            expect(response.body.data.analysis.originalRequirements).toEqual(validRequirementsData.requirements);
            expect(response.body.data.analysis.categorizedRequirements).toBeDefined();
            expect(response.body.data.analysis.validation).toBeDefined();
            expect(response.body.data.analysis.userStories).toBeDefined();
            expect(response.body.data.analysis.feasibilityAnalysis).toBeDefined();
            expect(response.body.data.analysis.priorityAssessment).toBeDefined();
            expect(response.body.data.analysis.dependencies).toBeDefined();
            expect(response.body.data.analysis.risks).toBeDefined();
            
            expect(response.body.data.recommendations).toBeDefined();
            expect(response.body.data.nextSteps).toBeDefined();
            expect(response.body.data.generation.executionTime).toBeDefined();
        });

        test('应该正确分类需求', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const categorized = response.body.data.analysis.categorizedRequirements;
            expect(categorized.categories.userInterface.length).toBe(1); // '用户界面设计'
            expect(categorized.categories.dataManagement.length).toBe(1); // '数据存储功能'
            expect(categorized.categories.security.length).toBe(1); // '安全权限管理'
        });

        test('应该正确验证需求质量', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const validation = response.body.data.analysis.validation;
            expect(validation.overallScore).toBeGreaterThan(0);
            expect(validation.completeness.score).toBeGreaterThan(80); // 5个需求，应该获得高分
            expect(validation.clarity.score).toBeGreaterThan(80); // 需求描述都比较清晰
            expect(validation.consistency.score).toBe(100); // 无重复需求
            expect(validation.testability.score).toBeGreaterThan(80); // 大部分需求可测试
        });

        test('应该正确生成用户故事', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const userStories = response.body.data.analysis.userStories;
            expect(userStories).toHaveLength(5);
            
            userStories.forEach(story => {
                expect(story.id).toMatch(/^US-\d{3}$/);
                expect(story.title).toContain('作为');
                expect(story.persona).toBeDefined();
                expect(story.priority).toMatch(/^(high|medium|low)$/);
                expect(story.storyPoints).toBeGreaterThan(0);
                expect(story.acceptanceCriteria).toBeInstanceOf(Array);
                expect(story.tags).toBeInstanceOf(Array);
                expect(story.epic).toBeDefined();
            });
        });

        test('应该正确评估可行性', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const feasibility = response.body.data.analysis.feasibilityAnalysis;
            expect(feasibility.overall).toMatch(/^(high|medium|low)$/);
            expect(feasibility.score).toBeGreaterThan(0);
            expect(feasibility.factors.technical.score).toBeGreaterThan(0);
            expect(feasibility.factors.resource.score).toBeGreaterThan(0);
            expect(feasibility.factors.time.score).toBeGreaterThan(0);
            expect(feasibility.factors.complexity.score).toBeGreaterThan(0);
        });

        test('应该正确评估优先级', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const priority = response.body.data.analysis.priorityAssessment;
            expect(priority.high).toBeInstanceOf(Array);
            expect(priority.medium).toBeInstanceOf(Array);
            expect(priority.low).toBeInstanceOf(Array);
            expect(priority.matrix).toBeInstanceOf(Array);
            expect(priority.matrix).toHaveLength(5);
        });

        test('应该正确分析依赖关系', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const dependencies = response.body.data.analysis.dependencies;
            expect(dependencies.dependencies).toBeInstanceOf(Array);
            expect(dependencies.groups).toBeDefined();
            expect(dependencies.sequence).toBeInstanceOf(Array);
        });

        test('应该正确识别风险', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validRequirementsData)
                .expect(200);

            const risks = response.body.data.analysis.risks;
            expect(risks).toBeInstanceOf(Array);
            risks.forEach(risk => {
                expect(risk.type).toBeDefined();
                expect(risk.level).toMatch(/^(high|medium|low)$/);
                expect(risk.description).toBeDefined();
                expect(risk.mitigation).toBeDefined();
                expect(risk.probability).toMatch(/^(high|medium|low)$/);
            });
        });

        test('应该在workflowId存在时更新工作流', async () => {
            const mockWorkflow = { id: 'test-workflow' };
            mockServices.workflowService.getWorkflow.mockReturnValue(mockWorkflow);

            const dataWithWorkflow = { ...validRequirementsData, workflowId: 'test-workflow' };

            await request(app)
                .post('/mode/create/analyze-requirements')
                .send(dataWithWorkflow)
                .expect(200);

            expect(mockServices.workflowService.getWorkflow).toHaveBeenCalledWith('test-workflow');
            expect(mockServices.workflowService.updateStep).toHaveBeenCalledWith(
                'test-workflow', 
                'analyze_requirements', 
                'completed', 
                expect.any(Object)
            );
        });

        test('应该拒绝空的需求列表', async () => {
            const invalidData = { ...validRequirementsData, requirements: [] };

            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('需求描述不能为空');
        });

        test('应该拒绝缺少需求字段的请求', async () => {
            const invalidData = { context: {}, stakeholders: [] };

            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('需求描述不能为空');
        });

        test('应该处理需求较少的情况并给出建议', async () => {
            const minimalRequirements = {
                requirements: ['基本功能', '简单界面'],
                context: {},
                stakeholders: [],
                constraints: [],
                businessGoals: []
            };

            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(minimalRequirements)
                .expect(200);

            const validation = response.body.data.analysis.validation;
            expect(validation.completeness.score).toBeLessThan(80);
            expect(validation.completeness.issues).toContain('需求数量过少，可能缺少关键功能');
            expect(validation.completeness.suggestions).toContain('考虑添加更多功能需求');
        });
    });

    // ========== 用户故事更新API测试 ==========

    describe('POST /update-user-stories', () => {
        const validUserStoriesData = {
            userStories: [
                {
                    id: 'US-001',
                    title: '作为用户，我想要登录系统',
                    description: '用户登录功能',
                    persona: '用户',
                    priority: 'high',
                    storyPoints: 5,
                    acceptanceCriteria: ['用户可以输入用户名密码', '系统验证用户身份'],
                    tags: ['user', 'auth'],
                    epic: '用户管理',
                    status: 'backlog'
                },
                {
                    id: 'US-002',
                    title: '作为管理员，我想要管理用户',
                    description: '用户管理功能',
                    persona: '管理员',
                    priority: 'medium',
                    storyPoints: 8,
                    acceptanceCriteria: ['管理员可以查看用户列表', '管理员可以禁用用户'],
                    tags: ['admin', 'user'],
                    epic: '用户管理',
                    status: 'backlog'
                },
                {
                    id: 'US-003',
                    title: '作为用户，我想要查看数据',
                    description: '数据查看功能',
                    persona: '用户',
                    priority: 'low',
                    storyPoints: 3,
                    acceptanceCriteria: ['用户可以查看个人数据'],
                    tags: ['user', 'data'],
                    epic: '数据管理',
                    status: 'backlog'
                }
            ],
            format: 'markdown',
            templateType: 'standard',
            includeCriteria: true,
            includeEstimation: true
        };

        test('应该成功更新用户故事文档', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.document).toBeDefined();
            expect(response.body.data.document.stories).toEqual(validUserStoriesData.userStories);
            expect(response.body.data.document.format).toBe('markdown');
            expect(response.body.data.document.templateType).toBe('standard');
            expect(response.body.data.document.normalizedStories).toBeDefined();
            expect(response.body.data.document.acceptanceCriteria).toBeDefined();
            expect(response.body.data.document.estimation).toBeDefined();
            expect(response.body.data.document.prioritizedStories).toBeDefined();
            expect(response.body.data.document.epics).toBeDefined();
            expect(response.body.data.document.document).toBeDefined();
            
            expect(response.body.data.deliverables).toBeDefined();
            expect(response.body.data.metrics).toBeDefined();
            expect(response.body.data.nextSteps).toBeDefined();
            expect(response.body.data.generation.executionTime).toBeDefined();
        });

        test('应该正确规范化用户故事', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const normalizedStories = response.body.data.document.normalizedStories;
            expect(normalizedStories).toHaveLength(3);
            
            normalizedStories.forEach(story => {
                expect(story.id).toBeDefined();
                expect(story.title).toBeDefined();
                expect(story.description).toBeDefined();
                expect(story.persona).toBeDefined();
                expect(story.priority).toMatch(/^(high|medium|low)$/);
                expect(story.storyPoints).toBeGreaterThan(0);
                expect(story.acceptanceCriteria).toBeInstanceOf(Array);
                expect(story.tags).toBeInstanceOf(Array);
                expect(story.epic).toBeDefined();
                expect(story.dependencies).toBeInstanceOf(Array);
                expect(story.status).toBeDefined();
                expect(story.created).toBeDefined();
                expect(story.updated).toBeDefined();
            });
        });

        test('应该正确生成验收标准', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const acceptanceCriteria = response.body.data.document.acceptanceCriteria;
            expect(acceptanceCriteria).toHaveLength(3);
            
            acceptanceCriteria.forEach(criteria => {
                expect(criteria.storyId).toBeDefined();
                expect(criteria.criteria).toBeInstanceOf(Array);
                expect(criteria.criteria.length).toBeGreaterThan(0);
                expect(criteria.criteria[0]).toContain('给定：');
                expect(criteria.criteria[1]).toContain('当：');
                expect(criteria.criteria[2]).toContain('那么：');
                expect(criteria.criteria[3]).toContain('并且：');
            });
        });

        test('应该正确估算工作量', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const estimation = response.body.data.document.estimation;
            expect(estimation.totalStoryPoints).toBe(16); // 5 + 8 + 3
            expect(estimation.averageStoryPoints).toBeCloseTo(5.33, 1);
            expect(estimation.estimatedSprints).toBe(1); // 16 / 20 = 0.8, 向上取整为1
            expect(estimation.estimatedWeeks).toBe(2); // 16 / 10 = 1.6, 向上取整为2
            expect(estimation.breakdown.high).toBe(5);
            expect(estimation.breakdown.medium).toBe(8);
            expect(estimation.breakdown.low).toBe(3);
        });

        test('应该正确排序用户故事优先级', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const prioritizedStories = response.body.data.document.prioritizedStories;
            expect(prioritizedStories).toHaveLength(3);
            
            // 应该按优先级排序：high > medium > low
            expect(prioritizedStories[0].priority).toBe('high');
            expect(prioritizedStories[1].priority).toBe('medium');
            expect(prioritizedStories[2].priority).toBe('low');
        });

        test('应该正确分组为史诗', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const epics = response.body.data.document.epics;
            expect(epics.length).toBeGreaterThan(0);
            
            const userManagementEpic = epics.find(epic => epic.name === '用户管理');
            expect(userManagementEpic).toBeDefined();
            expect(userManagementEpic.stories).toHaveLength(2);
            expect(userManagementEpic.totalPoints).toBe(13); // 5 + 8
            expect(userManagementEpic.priority).toBe('high'); // 因为有high优先级故事
            
            const dataManagementEpic = epics.find(epic => epic.name === '数据管理');
            expect(dataManagementEpic).toBeDefined();
            expect(dataManagementEpic.stories).toHaveLength(1);
            expect(dataManagementEpic.totalPoints).toBe(3);
        });

        test('应该生成正确的文档内容', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const document = response.body.data.document.document;
            expect(document).toContain('# 用户故事文档');
            expect(document).toContain('本文档包含 3 个用户故事');
            expect(document).toContain('US-001');
            expect(document).toContain('US-002');
            expect(document).toContain('US-003');
            expect(document).toContain('作为用户，我想要登录系统');
        });

        test('应该生成正确的可交付成果', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const deliverables = response.body.data.deliverables;
            expect(deliverables).toHaveLength(4);
            expect(deliverables[0].name).toBe('用户故事文档');
            expect(deliverables[1].name).toBe('验收标准清单');
            expect(deliverables[2].name).toBe('工作量估算报告');
            expect(deliverables[3].name).toBe('史诗分组报告');
        });

        test('应该计算正确的指标', async () => {
            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(validUserStoriesData)
                .expect(200);

            const metrics = response.body.data.metrics;
            expect(metrics.total).toBe(3);
            expect(metrics.byPriority.high).toBe(1);
            expect(metrics.byPriority.medium).toBe(1);
            expect(metrics.byPriority.low).toBe(1);
            expect(metrics.byEpic['用户管理']).toBe(2);
            expect(metrics.byEpic['数据管理']).toBe(1);
            expect(metrics.totalPoints).toBe(16);
            expect(metrics.averagePoints).toBeCloseTo(5.33, 1);
            expect(metrics.estimatedSprints).toBe(1);
            expect(metrics.completeness.withCriteria).toBe(3); // 所有故事都有验收标准
        });

        test('应该在workflowId存在时更新工作流', async () => {
            const mockWorkflow = { id: 'test-workflow' };
            mockServices.workflowService.getWorkflow.mockReturnValue(mockWorkflow);

            const dataWithWorkflow = { ...validUserStoriesData, workflowId: 'test-workflow' };

            await request(app)
                .post('/mode/create/update-user-stories')
                .send(dataWithWorkflow)
                .expect(200);

            expect(mockServices.workflowService.getWorkflow).toHaveBeenCalledWith('test-workflow');
            expect(mockServices.workflowService.updateStep).toHaveBeenCalledWith(
                'test-workflow', 
                'update_user_stories', 
                'completed', 
                expect.any(Object)
            );
        });

        test('应该拒绝空的用户故事列表', async () => {
            const invalidData = { ...validUserStoriesData, userStories: [] };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('用户故事列表不能为空');
        });

        test('应该拒绝缺少userStories字段的请求', async () => {
            const invalidData = { format: 'markdown' };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('用户故事列表不能为空');
        });

        test('应该处理不完整的用户故事数据', async () => {
            const incompleteStoriesData = {
                userStories: [
                    { title: '简单故事' }, // 缺少大部分字段
                    { description: '另一个故事' } // 缺少title等字段
                ]
            };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(incompleteStoriesData)
                .expect(200);

            const normalizedStories = response.body.data.document.normalizedStories;
            expect(normalizedStories).toHaveLength(2);
            
            // 验证规范化后的数据完整性
            normalizedStories.forEach(story => {
                expect(story.id).toBeDefined();
                expect(story.title).toBeDefined();
                expect(story.persona).toBe('用户'); // 默认值
                expect(story.priority).toBe('medium'); // 默认值
                expect(story.storyPoints).toBeGreaterThan(0);
                expect(story.epic).toBe('未分类'); // 默认值
                expect(story.status).toBe('backlog'); // 默认值
            });
        });

        test('应该支持不同的模板格式', async () => {
            const jsonFormatData = {
                ...validUserStoriesData,
                format: 'json',
                templateType: 'agile'
            };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(jsonFormatData)
                .expect(200);

            expect(response.body.data.document.format).toBe('json');
            expect(response.body.data.document.templateType).toBe('agile');
        });

        test('应该支持不包含验收标准的选项', async () => {
            const noCriteriaData = {
                ...validUserStoriesData,
                includeCriteria: false
            };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(noCriteriaData)
                .expect(200);

            expect(response.body.data.document.acceptanceCriteria).toBeNull();
        });

        test('应该支持不包含工作量估算的选项', async () => {
            const noEstimationData = {
                ...validUserStoriesData,
                includeEstimation: false
            };

            const response = await request(app)
                .post('/mode/create/update-user-stories')
                .send(noEstimationData)
                .expect(200);

            expect(response.body.data.document.estimation).toBeNull();
        });
    });

    // ========== 通用功能测试 ==========

    describe('通用功能测试', () => {
        test('应该处理服务器内部错误', async () => {
            // 使用null requirements会被验证拦截返回400，我们需要真正的500错误
            // 模拟一个内部异常
            const errorData = {
                requirements: ['测试需求'],
                context: {},
                stakeholders: [],
                constraints: [],
                businessGoals: []
            };

            // 临时替换一个会抛异常的方法
            const originalMethod = mockServices.workflowService.getWorkflow;
            mockServices.workflowService.getWorkflow = jest.fn(() => {
                throw new Error('Simulated internal error');
            });

            const dataWithWorkflow = { ...errorData, workflowId: 'test-workflow' };

            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(dataWithWorkflow)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();

            // 恢复原方法
            mockServices.workflowService.getWorkflow = originalMethod;
        });

        test('应该处理JSON解析错误', async () => {
            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}') // 故意的无效JSON
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid JSON format');
        });

        test('应该为所有响应包含执行时间', async () => {
            const validData = {
                requirements: ['测试需求']
            };

            const response = await request(app)
                .post('/mode/create/analyze-requirements')
                .send(validData)
                .expect(200);

            expect(response.body.data.generation.executionTime).toBeGreaterThanOrEqual(0);
            expect(typeof response.body.data.generation.executionTime).toBe('number');
        });
    });
});