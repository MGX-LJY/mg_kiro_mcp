/**
 * Create模式 - 功能规划路由模块
 * 新功能规划和架构设计端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建功能规划路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createFeatureRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 用户需求智能分析 (Create模式第1步)
     * POST /analyze-requirements
     */
    router.post('/analyze-requirements', async (req, res) => {
        try {
            const { 
                requirements, 
                context = {},
                stakeholders = [],
                constraints = [],
                businessGoals = [],
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!requirements || !requirements.length) {
                return error(res, '需求描述不能为空', 400);
            }

            console.log(`[AnalyzeRequirements] 分析用户需求: ${requirements.length} 项需求`);

            const startTime = Date.now();

            // 智能需求分析
            const requirementsAnalysis = {
                originalRequirements: requirements,
                context,
                stakeholders,
                constraints,
                businessGoals,
                language,
                analyzed: new Date().toISOString(),
                
                // 需求分类和优先级
                categorizedRequirements: await _categorizeRequirements(requirements),
                
                // 需求验证和完整性检查
                validation: _validateRequirements(requirements, context),
                
                // 需求分解为用户故事
                userStories: await _decomposeToUserStories(requirements, stakeholders),
                
                // 可行性分析
                feasibilityAnalysis: _analyzeFeasibility(requirements, constraints, language),
                
                // 优先级评估
                priorityAssessment: _assessPriority(requirements, businessGoals),
                
                // 依赖关系分析
                dependencies: _analyzeDependencies(requirements),
                
                // 风险识别
                risks: _identifyRequirementRisks(requirements, constraints)
            };

            const executionTime = Date.now() - startTime;

            const responseData = {
                analysis: requirementsAnalysis,
                generation: {
                    executionTime,
                    templateUsed: 'requirements-analysis',
                    timestamp: new Date().toISOString()
                },
                recommendations: _generateRequirementsRecommendations(requirementsAnalysis),
                nextSteps: [
                    '审核和确认分析结果',
                    '更新用户故事文档',
                    '制定功能开发计划',
                    '开始技术设计'
                ]
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_requirements', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeRequirements] 需求分析完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeRequirements] 需求分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_requirements'
            });
        }
    });

    /**
     * 更新用户故事文档 (Create模式第1步)
     * POST /update-user-stories
     */
    router.post('/update-user-stories', async (req, res) => {
        try {
            const { 
                userStories = [], 
                format = 'markdown',
                templateType = 'standard',
                includeCriteria = true,
                includeEstimation = true,
                workflowId
            } = req.body;
            
            if (!userStories || !userStories.length) {
                return error(res, '用户故事列表不能为空', 400);
            }

            console.log(`[UpdateUserStories] 更新用户故事文档: ${userStories.length} 个故事`);

            const startTime = Date.now();

            // 用户故事文档生成
            const userStoriesDocument = {
                stories: userStories,
                format,
                templateType,
                generated: new Date().toISOString(),
                
                // 规范化用户故事格式
                normalizedStories: _normalizeUserStories(userStories),
                
                // 验收标准生成
                acceptanceCriteria: includeCriteria ? 
                    await _generateAcceptanceCriteria(userStories) : null,
                
                // 工作量估算
                estimation: includeEstimation ? 
                    _estimateUserStories(userStories) : null,
                
                // 故事优先级排序
                prioritizedStories: _prioritizeUserStories(userStories),
                
                // 史诗分组
                epics: _groupIntoEpics(userStories),
                
                // 文档生成
                document: await _generateUserStoriesDocument(userStories, format, templateType, promptService)
            };

            const executionTime = Date.now() - startTime;

            const responseData = {
                document: userStoriesDocument,
                generation: {
                    executionTime,
                    templateUsed: `user-stories-${templateType}`,
                    timestamp: new Date().toISOString()
                },
                deliverables: _generateUserStoriesDeliverables(userStoriesDocument),
                metrics: _calculateUserStoriesMetrics(userStoriesDocument),
                nextSteps: [
                    '与产品团队评审用户故事',
                    '估算开发工作量',
                    '规划迭代计划',
                    '开始技术设计'
                ]
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'update_user_stories', 'completed', responseData);
                }
            }

            console.log(`[UpdateUserStories] 用户故事文档更新完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[UpdateUserStories] 用户故事文档更新失败:', err);
            error(res, err.message, 500, {
                action: 'update_user_stories'
            });
        }
    });

    /**
     * 规划新功能
     * POST /plan-feature
     */
    router.post('/plan-feature', async (req, res) => {
        try {
            const { 
                featureName, 
                requirements = [], 
                priority = 'medium',
                complexity = 'medium',
                dependencies = [],
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!featureName) {
                return error(res, '功能名称不能为空', 400);
            }

            if (!requirements.length) {
                return error(res, '功能需求不能为空', 400);
            }

            console.log(`[PlanFeature] 规划新功能: ${featureName}`);

            const startTime = Date.now();

            // 生成功能规划
            const featurePlan = {
                name: featureName,
                requirements,
                priority,
                complexity,
                dependencies,
                language,
                created: new Date().toISOString(),
                
                // 生成任务分解
                tasks: await _generateTaskBreakdown(featureName, requirements, complexity),
                
                // 估算时间和资源
                estimation: _generateEstimation(requirements, complexity),
                
                // 技术方案
                technicalDesign: await _generateTechnicalDesign(featureName, requirements, language, promptService),
                
                // 里程碑规划
                milestones: _generateMilestones(featureName, requirements),
                
                // 风险评估
                risks: _generateRiskAssessment(complexity, dependencies)
            };

            const executionTime = Date.now() - startTime;

            const responseData = {
                plan: featurePlan,
                generation: {
                    executionTime,
                    templateUsed: `${language}-feature-plan`,
                    timestamp: new Date().toISOString()
                },
                deliverables: _generateDeliverables(featurePlan),
                nextSteps: [
                    '审核功能规划',
                    '分配开发资源',
                    '创建开发分支',
                    '开始第一个里程碑'
                ]
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'plan_feature', 'completed', responseData);
                }
            }

            console.log(`[PlanFeature] 功能 ${featureName} 规划完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[PlanFeature] 功能规划失败:', err);
            error(res, err.message, 500, {
                action: 'plan_feature'
            });
        }
    });

    /**
     * 生成功能架构
     * POST /design-architecture
     */
    router.post('/design-architecture', async (req, res) => {
        try {
            const { 
                featureName, 
                components = [], 
                integrations = [],
                dataFlow = [],
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!featureName) {
                return error(res, '功能名称不能为空', 400);
            }

            console.log(`[DesignArchitecture] 设计功能架构: ${featureName}`);

            const startTime = Date.now();

            // 生成架构设计
            const architectureDesign = {
                feature: featureName,
                language,
                created: new Date().toISOString(),
                
                // 组件架构
                architecture: {
                    components: await _generateComponentArchitecture(components, language),
                    layers: _generateLayerArchitecture(featureName, language),
                    patterns: _suggestDesignPatterns(components, integrations),
                    interfaces: _generateInterfaces(components, language)
                },
                
                // 数据模型
                dataModel: _generateDataModel(dataFlow, language),
                
                // 集成方案
                integrations: _generateIntegrationDesign(integrations),
                
                // 部署架构
                deployment: _generateDeploymentArchitecture(featureName),
                
                // 架构文档
                documentation: await _generateArchitectureDocumentation(featureName, language, promptService)
            };

            const executionTime = Date.now() - startTime;

            const responseData = {
                architecture: architectureDesign,
                generation: {
                    executionTime,
                    templateUsed: `${language}-architecture-design`,
                    timestamp: new Date().toISOString()
                },
                diagrams: _generateArchitectureDiagrams(architectureDesign),
                implementation: {
                    scaffolding: _generateScaffolding(architectureDesign, language),
                    boilerplate: _generateBoilerplateCode(architectureDesign, language)
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'design_architecture', 'completed', responseData);
                }
            }

            console.log(`[DesignArchitecture] 功能 ${featureName} 架构设计完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[DesignArchitecture] 架构设计失败:', err);
            error(res, err.message, 500, {
                action: 'design_architecture'
            });
        }
    });

    /**
     * 创建功能原型
     * POST /create-prototype
     */
    router.post('/create-prototype', async (req, res) => {
        try {
            const { 
                featureName, 
                mockData = {},
                userFlows = [],
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!featureName) {
                return error(res, '功能名称不能为空', 400);
            }

            console.log(`[CreatePrototype] 创建功能原型: ${featureName}`);

            const startTime = Date.now();

            // 生成原型
            const prototype = {
                feature: featureName,
                language,
                created: new Date().toISOString(),
                
                // 原型组件
                components: await _generatePrototypeComponents(featureName, language, promptService),
                
                // 模拟数据
                mockData: _generateMockData(mockData, userFlows),
                
                // 用户流程
                userFlows: _generateUserFlowPrototypes(userFlows, language),
                
                // 交互原型
                interactions: _generateInteractionPrototypes(userFlows),
                
                // 原型测试
                tests: _generatePrototypeTests(featureName, language)
            };

            const executionTime = Date.now() - startTime;

            const responseData = {
                prototype,
                generation: {
                    executionTime,
                    templateUsed: `${language}-prototype`,
                    timestamp: new Date().toISOString()
                },
                files: _getPrototypeFiles(featureName, language),
                demo: {
                    url: `/demo/${featureName.toLowerCase()}`,
                    endpoints: _getPrototypeDemoEndpoints(featureName),
                    instructions: _getPrototypeDemoInstructions(featureName)
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'create_prototype', 'completed', responseData);
                }
            }

            console.log(`[CreatePrototype] 功能 ${featureName} 原型创建完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CreatePrototype] 原型创建失败:', err);
            error(res, err.message, 500, {
                action: 'create_prototype'
            });
        }
    });

    return router;
}

/**
 * 生成任务分解
 * @param {string} featureName - 功能名称
 * @param {Array} requirements - 需求列表
 * @param {string} complexity - 复杂度
 * @returns {Array} 任务列表
 */
async function _generateTaskBreakdown(featureName, requirements, complexity) {
    const baseTasks = [
        {
            name: '需求分析和规格定义',
            type: 'analysis',
            priority: 'high',
            estimatedHours: complexity === 'high' ? 16 : complexity === 'medium' ? 8 : 4,
            dependencies: []
        },
        {
            name: '数据模型设计',
            type: 'design',
            priority: 'high',
            estimatedHours: complexity === 'high' ? 12 : complexity === 'medium' ? 6 : 3,
            dependencies: ['需求分析和规格定义']
        },
        {
            name: '接口设计',
            type: 'design',
            priority: 'high',
            estimatedHours: complexity === 'high' ? 8 : complexity === 'medium' ? 4 : 2,
            dependencies: ['数据模型设计']
        },
        {
            name: '核心业务逻辑实现',
            type: 'development',
            priority: 'high',
            estimatedHours: complexity === 'high' ? 32 : complexity === 'medium' ? 16 : 8,
            dependencies: ['接口设计']
        },
        {
            name: 'UI组件开发',
            type: 'development',
            priority: 'medium',
            estimatedHours: complexity === 'high' ? 24 : complexity === 'medium' ? 12 : 6,
            dependencies: ['接口设计']
        },
        {
            name: '单元测试',
            type: 'testing',
            priority: 'medium',
            estimatedHours: complexity === 'high' ? 16 : complexity === 'medium' ? 8 : 4,
            dependencies: ['核心业务逻辑实现']
        },
        {
            name: '集成测试',
            type: 'testing',
            priority: 'medium',
            estimatedHours: complexity === 'high' ? 12 : complexity === 'medium' ? 6 : 3,
            dependencies: ['UI组件开发', '单元测试']
        },
        {
            name: '文档编写',
            type: 'documentation',
            priority: 'low',
            estimatedHours: complexity === 'high' ? 8 : complexity === 'medium' ? 4 : 2,
            dependencies: ['集成测试']
        }
    ];

    // 根据需求添加特定任务
    const additionalTasks = requirements.map((req, index) => ({
        name: `实现需求: ${req}`,
        type: 'development',
        priority: 'medium',
        estimatedHours: complexity === 'high' ? 8 : complexity === 'medium' ? 4 : 2,
        dependencies: ['核心业务逻辑实现']
    }));

    return [...baseTasks, ...additionalTasks];
}

/**
 * 生成时间估算
 * @param {Array} requirements - 需求列表
 * @param {string} complexity - 复杂度
 * @returns {Object} 估算结果
 */
function _generateEstimation(requirements, complexity) {
    const baseHours = {
        low: 40,
        medium: 80,
        high: 160
    };

    const additionalHours = requirements.length * (complexity === 'high' ? 8 : complexity === 'medium' ? 4 : 2);
    const totalHours = baseHours[complexity] + additionalHours;

    return {
        totalHours,
        totalDays: Math.ceil(totalHours / 8),
        totalWeeks: Math.ceil(totalHours / 40),
        breakdown: {
            analysis: Math.round(totalHours * 0.15),
            design: Math.round(totalHours * 0.25),
            development: Math.round(totalHours * 0.45),
            testing: Math.round(totalHours * 0.10),
            documentation: Math.round(totalHours * 0.05)
        },
        confidence: complexity === 'low' ? 'high' : complexity === 'medium' ? 'medium' : 'low'
    };
}

/**
 * 生成技术设计
 * @param {string} featureName - 功能名称
 * @param {Array} requirements - 需求列表
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 技术设计
 */
async function _generateTechnicalDesign(featureName, requirements, language, promptService) {
    try {
        const template = await promptService.loadPrompt('templates', 'technical-design', {
            feature_name: featureName,
            requirements: requirements.join('\n- '),
            language
        });

        return {
            overview: template.content || `技术设计概述：${featureName}功能实现方案`,
            components: _generateTechnicalComponents(featureName, language),
            dataFlow: _generateTechnicalDataFlow(requirements),
            apis: _generateTechnicalAPIs(featureName, requirements),
            database: _generateDatabaseDesign(featureName, requirements),
            security: _generateSecurityConsiderations(requirements),
            performance: _generatePerformanceConsiderations(requirements)
        };
    } catch (error) {
        return {
            overview: `技术设计概述：${featureName}功能实现方案`,
            components: _generateTechnicalComponents(featureName, language),
            dataFlow: _generateTechnicalDataFlow(requirements),
            apis: _generateTechnicalAPIs(featureName, requirements),
            database: _generateDatabaseDesign(featureName, requirements),
            security: _generateSecurityConsiderations(requirements),
            performance: _generatePerformanceConsiderations(requirements)
        };
    }
}

/**
 * 生成里程碑
 * @param {string} featureName - 功能名称
 * @param {Array} requirements - 需求列表
 * @returns {Array} 里程碑列表
 */
function _generateMilestones(featureName, requirements) {
    return [
        {
            name: '需求确认和设计完成',
            description: '完成需求分析、技术设计和接口定义',
            deliverables: ['需求文档', '技术设计文档', 'API文档'],
            percentage: 20,
            estimatedWeeks: 1
        },
        {
            name: '核心功能实现',
            description: '完成主要业务逻辑和数据层实现',
            deliverables: ['核心模块', '数据模型', '业务逻辑'],
            percentage: 60,
            estimatedWeeks: 2
        },
        {
            name: '用户界面完成',
            description: '完成所有用户界面和交互功能',
            deliverables: ['UI组件', '用户交互', '前端集成'],
            percentage: 80,
            estimatedWeeks: 1
        },
        {
            name: '测试和部署',
            description: '完成全面测试和生产环境部署',
            deliverables: ['测试报告', '部署文档', '生产环境'],
            percentage: 100,
            estimatedWeeks: 1
        }
    ];
}

/**
 * 生成风险评估
 * @param {string} complexity - 复杂度
 * @param {Array} dependencies - 依赖列表
 * @returns {Array} 风险列表
 */
function _generateRiskAssessment(complexity, dependencies) {
    const risks = [
        {
            name: '技术复杂性',
            probability: complexity === 'high' ? 'high' : complexity === 'medium' ? 'medium' : 'low',
            impact: 'high',
            mitigation: '分阶段实现，制定技术调研计划',
            contingency: '寻求技术专家支持，考虑备选方案'
        },
        {
            name: '需求变更',
            probability: 'medium',
            impact: 'medium',
            mitigation: '及时沟通，版本控制需求变更',
            contingency: '预留20%缓冲时间处理变更'
        }
    ];

    if (dependencies.length > 0) {
        risks.push({
            name: '外部依赖',
            probability: 'medium',
            impact: 'high',
            mitigation: '提前识别依赖，制定集成计划',
            contingency: '准备备选依赖方案'
        });
    }

    return risks;
}

/**
 * 生成可交付成果
 * @param {Object} featurePlan - 功能规划
 * @returns {Array} 可交付成果列表
 */
function _generateDeliverables(featurePlan) {
    return [
        {
            name: '功能规划文档',
            type: 'documentation',
            format: 'markdown',
            description: '详细的功能规划和需求分析'
        },
        {
            name: '技术设计文档',
            type: 'documentation',
            format: 'markdown',
            description: '技术架构和实现方案'
        },
        {
            name: '项目计划',
            type: 'planning',
            format: 'json',
            description: '任务分解和时间计划'
        },
        {
            name: '风险评估报告',
            type: 'analysis',
            format: 'markdown',
            description: '风险识别和应对策略'
        }
    ];
}

/**
 * 生成技术组件
 * @param {string} featureName - 功能名称
 * @param {string} language - 编程语言
 * @returns {Array} 技术组件列表
 */
function _generateTechnicalComponents(featureName, language) {
    return [
        {
            name: `${featureName}Service`,
            type: 'service',
            description: '业务逻辑服务层',
            dependencies: ['database', 'validation']
        },
        {
            name: `${featureName}Controller`,
            type: 'controller',
            description: 'API控制器',
            dependencies: [`${featureName}Service`]
        },
        {
            name: `${featureName}Model`,
            type: 'model',
            description: '数据模型',
            dependencies: ['database']
        },
        {
            name: `${featureName}Validator`,
            type: 'validator',
            description: '数据验证',
            dependencies: []
        }
    ];
}

/**
 * 生成技术数据流
 * @param {Array} requirements - 需求列表
 * @returns {Object} 数据流设计
 */
function _generateTechnicalDataFlow(requirements) {
    return {
        input: requirements.map(req => `用户${req}输入`),
        processing: ['数据验证', '业务逻辑处理', '数据存储'],
        output: ['处理结果', '状态更新', '用户反馈'],
        storage: ['数据库存储', '缓存更新', '日志记录']
    };
}

/**
 * 生成技术API列表
 * @param {string} featureName - 功能名称
 * @param {Array} requirements - 需求列表
 * @returns {Array} API列表
 */
function _generateTechnicalAPIs(featureName, requirements) {
    const apis = [
        {
            endpoint: `/${featureName.toLowerCase()}`,
            method: 'GET',
            description: `获取${featureName}列表`
        },
        {
            endpoint: `/${featureName.toLowerCase()}`,
            method: 'POST',
            description: `创建${featureName}`
        },
        {
            endpoint: `/${featureName.toLowerCase()}/:id`,
            method: 'PUT',
            description: `更新${featureName}`
        },
        {
            endpoint: `/${featureName.toLowerCase()}/:id`,
            method: 'DELETE',
            description: `删除${featureName}`
        }
    ];

    // 根据需求添加特定API
    requirements.forEach(req => {
        apis.push({
            endpoint: `/${featureName.toLowerCase()}/${req.toLowerCase().replace(/\s+/g, '-')}`,
            method: 'POST',
            description: `处理${req}`
        });
    });

    return apis;
}

/**
 * 生成数据库设计
 * @param {string} featureName - 功能名称
 * @param {Array} requirements - 需求列表
 * @returns {Object} 数据库设计
 */
function _generateDatabaseDesign(featureName, requirements) {
    return {
        tables: [
            {
                name: featureName.toLowerCase(),
                fields: [
                    { name: 'id', type: 'UUID', primary: true },
                    { name: 'name', type: 'VARCHAR(255)', required: true },
                    { name: 'description', type: 'TEXT' },
                    { name: 'status', type: 'ENUM', values: ['active', 'inactive'] },
                    { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE' }
                ],
                indexes: ['name', 'status', 'created_at']
            }
        ],
        relationships: [],
        migrations: [`create_${featureName.toLowerCase()}_table`]
    };
}

/**
 * 生成安全考虑
 * @param {Array} requirements - 需求列表
 * @returns {Array} 安全考虑列表
 */
function _generateSecurityConsiderations(requirements) {
    return [
        {
            aspect: '身份认证',
            requirement: '确保用户身份验证',
            implementation: 'JWT token验证'
        },
        {
            aspect: '数据验证',
            requirement: '验证输入数据',
            implementation: '使用验证中间件'
        },
        {
            aspect: '授权控制',
            requirement: '控制访问权限',
            implementation: 'RBAC权限模型'
        },
        {
            aspect: '数据加密',
            requirement: '敏感数据加密存储',
            implementation: 'bcrypt密码加密'
        }
    ];
}

/**
 * 生成性能考虑
 * @param {Array} requirements - 需求列表
 * @returns {Array} 性能考虑列表
 */
function _generatePerformanceConsiderations(requirements) {
    return [
        {
            aspect: '数据库优化',
            requirement: '提高查询性能',
            implementation: '添加适当索引'
        },
        {
            aspect: '缓存策略',
            requirement: '减少数据库访问',
            implementation: 'Redis缓存热点数据'
        },
        {
            aspect: '分页处理',
            requirement: '处理大量数据',
            implementation: '分页查询和懒加载'
        },
        {
            aspect: '异步处理',
            requirement: '提高响应速度',
            implementation: '队列处理耗时操作'
        }
    ];
}

// 其他辅助函数...
function _generateComponentArchitecture(components, language) {
    return components.map(comp => ({
        name: comp.name || comp,
        type: comp.type || 'module',
        responsibilities: comp.responsibilities || [`处理${comp.name || comp}相关逻辑`],
        interfaces: comp.interfaces || []
    }));
}

function _generateLayerArchitecture(featureName, language) {
    return {
        presentation: `${featureName}Controller`,
        business: `${featureName}Service`,
        data: `${featureName}Repository`,
        integration: `${featureName}Integration`
    };
}

function _suggestDesignPatterns(components, integrations) {
    const patterns = ['Repository Pattern', 'Service Layer Pattern'];
    
    if (integrations.length > 0) {
        patterns.push('Adapter Pattern');
    }
    
    if (components.length > 3) {
        patterns.push('Factory Pattern');
    }
    
    return patterns;
}

function _generateInterfaces(components, language) {
    return components.map(comp => ({
        name: `I${comp.name || comp}`,
        methods: [`process()`, `validate()`, `save()`]
    }));
}

function _generateDataModel(dataFlow, language) {
    return {
        entities: dataFlow.map(flow => ({
            name: flow.entity || 'Entity',
            attributes: flow.attributes || ['id', 'name', 'createdAt']
        })),
        relationships: [],
        constraints: []
    };
}

function _generateIntegrationDesign(integrations) {
    return integrations.map(integration => ({
        name: integration.name || integration,
        type: integration.type || 'REST API',
        protocol: integration.protocol || 'HTTP',
        authentication: integration.authentication || 'API Key'
    }));
}

function _generateDeploymentArchitecture(featureName) {
    return {
        environments: ['development', 'staging', 'production'],
        containers: [`${featureName.toLowerCase()}-api`, `${featureName.toLowerCase()}-worker`],
        databases: [`${featureName.toLowerCase()}_db`],
        services: [`${featureName.toLowerCase()}-service`]
    };
}

async function _generateArchitectureDocumentation(featureName, language, promptService) {
    try {
        const template = await promptService.loadPrompt('templates', 'architecture-documentation', {
            feature_name: featureName,
            language
        });
        
        return template.content;
    } catch (error) {
        return `# ${featureName} 架构文档\n\n## 概述\n\n${featureName}功能的技术架构说明`;
    }
}

function _generateArchitectureDiagrams(architectureDesign) {
    return [
        {
            name: '组件图',
            type: 'component',
            description: '展示功能组件及其关系'
        },
        {
            name: '数据流图',
            type: 'dataflow',
            description: '展示数据在系统中的流转'
        },
        {
            name: '部署图',
            type: 'deployment',
            description: '展示系统部署架构'
        }
    ];
}

function _generateScaffolding(architectureDesign, language) {
    return {
        directories: [
            'controllers',
            'services',
            'models',
            'routes',
            'middleware',
            'tests'
        ],
        files: architectureDesign.architecture.components.map(comp => 
            `${comp.name}.${language === 'python' ? 'py' : 'js'}`
        )
    };
}

function _generateBoilerplateCode(architectureDesign, language) {
    return {
        controller: `// ${architectureDesign.feature} Controller boilerplate`,
        service: `// ${architectureDesign.feature} Service boilerplate`,
        model: `// ${architectureDesign.feature} Model boilerplate`,
        routes: `// ${architectureDesign.feature} Routes boilerplate`
    };
}

async function _generatePrototypeComponents(featureName, language, promptService) {
    return [
        {
            name: `${featureName}Component`,
            type: 'main',
            template: `Basic ${featureName} component template`
        },
        {
            name: `${featureName}Form`,
            type: 'form',
            template: `Form component for ${featureName}`
        },
        {
            name: `${featureName}List`,
            type: 'list',
            template: `List component for ${featureName}`
        }
    ];
}

function _generateMockData(mockData, userFlows) {
    return {
        ...mockData,
        defaultEntities: userFlows.map((flow, index) => ({
            id: index + 1,
            name: `Sample ${flow.name || 'Entity'}`,
            status: 'active'
        }))
    };
}

function _generateUserFlowPrototypes(userFlows, language) {
    return userFlows.map(flow => ({
        name: flow.name || flow,
        steps: flow.steps || ['Start', 'Process', 'Complete'],
        mockImplementation: `// Mock implementation for ${flow.name || flow}`
    }));
}

function _generateInteractionPrototypes(userFlows) {
    return userFlows.map(flow => ({
        trigger: flow.trigger || 'click',
        action: flow.action || 'process',
        response: flow.response || 'success'
    }));
}

function _generatePrototypeTests(featureName, language) {
    return `// Prototype tests for ${featureName}
describe('${featureName} Prototype', () => {
    test('should render correctly', () => {
        // Test implementation
    });
});`;
}

function _getPrototypeFiles(featureName, language) {
    const ext = language === 'python' ? 'py' : 'js';
    return [
        `prototypes/${featureName}.${ext}`,
        `prototypes/${featureName}-form.${ext}`,
        `prototypes/${featureName}-list.${ext}`,
        `prototypes/${featureName}.test.${ext}`
    ];
}

function _getPrototypeDemoEndpoints(featureName) {
    return [
        `/demo/${featureName.toLowerCase()}`,
        `/demo/${featureName.toLowerCase()}/form`,
        `/demo/${featureName.toLowerCase()}/list`
    ];
}

function _getPrototypeDemoInstructions(featureName) {
    return [
        `访问 /demo/${featureName.toLowerCase()} 查看功能原型`,
        `测试各种用户交互场景`,
        `收集用户反馈并迭代改进`
    ];
}

// ========== Create模式第1步：需求理解与拆解辅助函数 ==========

/**
 * 需求分类
 * @param {Array} requirements - 需求列表
 * @returns {Object} 分类后的需求
 */
async function _categorizeRequirements(requirements) {
    return {
        functional: requirements.filter(req => 
            typeof req === 'string' ? !req.includes('性能') && !req.includes('安全') : req.type === 'functional'
        ),
        nonFunctional: requirements.filter(req => 
            typeof req === 'string' ? req.includes('性能') || req.includes('安全') : req.type === 'non-functional'
        ),
        business: requirements.filter(req => 
            typeof req === 'string' ? req.includes('业务') || req.includes('商业') : req.type === 'business'
        ),
        technical: requirements.filter(req => 
            typeof req === 'string' ? req.includes('技术') || req.includes('架构') : req.type === 'technical'
        ),
        categories: {
            userInterface: requirements.filter(req => 
                typeof req === 'string' ? req.includes('界面') || req.includes('UI') : req.category === 'ui'
            ),
            dataManagement: requirements.filter(req => 
                typeof req === 'string' ? req.includes('数据') || req.includes('存储') : req.category === 'data'
            ),
            integration: requirements.filter(req => 
                typeof req === 'string' ? req.includes('集成') || req.includes('接口') : req.category === 'integration'
            ),
            security: requirements.filter(req => 
                typeof req === 'string' ? req.includes('安全') || req.includes('权限') : req.category === 'security'
            )
        }
    };
}

/**
 * 需求验证
 * @param {Array} requirements - 需求列表
 * @param {Object} context - 上下文
 * @returns {Object} 验证结果
 */
function _validateRequirements(requirements, context) {
    const validation = {
        completeness: {
            score: 0,
            issues: [],
            suggestions: []
        },
        clarity: {
            score: 0,
            issues: [],
            suggestions: []
        },
        consistency: {
            score: 0,
            issues: [],
            suggestions: []
        },
        testability: {
            score: 0,
            issues: [],
            suggestions: []
        }
    };

    // 完整性检查
    if (requirements.length < 3) {
        validation.completeness.issues.push('需求数量过少，可能缺少关键功能');
        validation.completeness.suggestions.push('考虑添加更多功能需求');
        validation.completeness.score = 60;
    } else {
        validation.completeness.score = 90;
    }

    // 清晰度检查
    const unclearRequirements = requirements.filter(req => 
        typeof req === 'string' && req.length < 6
    );
    if (unclearRequirements.length > 0) {
        validation.clarity.issues.push(`${unclearRequirements.length}个需求描述过于简单`);
        validation.clarity.suggestions.push('为模糊需求添加更详细的描述');
        validation.clarity.score = 70;
    } else {
        validation.clarity.score = 95;
    }

    // 一致性检查
    const duplicates = _findDuplicateRequirements(requirements);
    if (duplicates.length > 0) {
        validation.consistency.issues.push(`发现${duplicates.length}个重复需求`);
        validation.consistency.suggestions.push('合并重复需求，避免功能冗余');
        validation.consistency.score = 75;
    } else {
        validation.consistency.score = 100;
    }

    // 可测试性检查
    const untestableRequirements = requirements.filter(req => 
        typeof req === 'string' && (req.includes('用户友好') || req.includes('美观'))
    );
    if (untestableRequirements.length > 0) {
        validation.testability.issues.push(`${untestableRequirements.length}个需求难以量化测试`);
        validation.testability.suggestions.push('为主观需求定义具体的测试标准');
        validation.testability.score = 80;
    } else {
        validation.testability.score = 95;
    }

    // 计算总分
    validation.overallScore = Math.round(
        (validation.completeness.score + validation.clarity.score + 
         validation.consistency.score + validation.testability.score) / 4
    );

    return validation;
}

/**
 * 需求分解为用户故事
 * @param {Array} requirements - 需求列表
 * @param {Array} stakeholders - 利益相关者
 * @returns {Array} 用户故事列表
 */
async function _decomposeToUserStories(requirements, stakeholders) {
    const defaultPersonas = ['用户', '管理员', '访客', '开发者'];
    const personas = stakeholders.length > 0 ? stakeholders : defaultPersonas;

    return requirements.map((req, index) => {
        const requirement = typeof req === 'string' ? req : req.description || req.title;
        const persona = personas[index % personas.length];
        
        return {
            id: `US-${String(index + 1).padStart(3, '0')}`,
            title: `作为${persona}，${requirement}`,
            description: requirement,
            persona: persona,
            priority: _inferPriority(requirement),
            storyPoints: _estimateStoryPoints(requirement),
            acceptanceCriteria: _generateBasicAcceptanceCriteria(requirement),
            tags: _extractTags(requirement),
            epic: _identifyEpic(requirement),
            dependencies: [],
            status: 'backlog'
        };
    });
}

/**
 * 可行性分析
 * @param {Array} requirements - 需求列表
 * @param {Array} constraints - 约束条件
 * @param {string} language - 编程语言
 * @returns {Object} 可行性分析结果
 */
function _analyzeFeasibility(requirements, constraints, language) {
    const analysis = {
        overall: 'high',
        score: 0,
        factors: {
            technical: { score: 0, issues: [], recommendations: [] },
            resource: { score: 0, issues: [], recommendations: [] },
            time: { score: 0, issues: [], recommendations: [] },
            complexity: { score: 0, issues: [], recommendations: [] }
        }
    };

    // 技术可行性
    const technicalComplexity = _assessTechnicalComplexity(requirements, language);
    analysis.factors.technical.score = technicalComplexity > 0.7 ? 60 : technicalComplexity > 0.5 ? 80 : 95;
    
    if (technicalComplexity > 0.7) {
        analysis.factors.technical.issues.push('技术实现复杂度较高');
        analysis.factors.technical.recommendations.push('考虑分阶段实现，降低技术风险');
    }

    // 资源可行性
    const resourceRequirement = requirements.length * 0.1;
    analysis.factors.resource.score = resourceRequirement > 1 ? 70 : 90;
    
    if (resourceRequirement > 1) {
        analysis.factors.resource.issues.push('需要较多开发资源');
        analysis.factors.resource.recommendations.push('考虑增加开发人员或延长开发周期');
    }

    // 时间可行性
    const timeComplexity = requirements.length > 10 ? 0.8 : requirements.length > 5 ? 0.6 : 0.4;
    analysis.factors.time.score = timeComplexity > 0.7 ? 65 : timeComplexity > 0.5 ? 85 : 95;
    
    if (timeComplexity > 0.7) {
        analysis.factors.time.issues.push('功能较多，开发周期可能较长');
        analysis.factors.time.recommendations.push('优化功能优先级，分批次交付');
    }

    // 复杂度可行性
    analysis.factors.complexity.score = Math.max(60, 100 - requirements.length * 5);
    
    if (requirements.length > 8) {
        analysis.factors.complexity.issues.push('功能复杂度较高');
        analysis.factors.complexity.recommendations.push('简化功能设计，专注核心价值');
    }

    // 计算总分
    analysis.score = Math.round(
        (analysis.factors.technical.score + analysis.factors.resource.score + 
         analysis.factors.time.score + analysis.factors.complexity.score) / 4
    );

    analysis.overall = analysis.score >= 85 ? 'high' : analysis.score >= 70 ? 'medium' : 'low';

    return analysis;
}

/**
 * 优先级评估
 * @param {Array} requirements - 需求列表
 * @param {Array} businessGoals - 业务目标
 * @returns {Object} 优先级评估结果
 */
function _assessPriority(requirements, businessGoals) {
    return {
        high: requirements.filter(req => _inferPriority(req) === 'high'),
        medium: requirements.filter(req => _inferPriority(req) === 'medium'),
        low: requirements.filter(req => _inferPriority(req) === 'low'),
        matrix: requirements.map(req => ({
            requirement: req,
            priority: _inferPriority(req),
            businessValue: _assessBusinessValue(req, businessGoals),
            implementationEffort: _assessImplementationEffort(req),
            riskLevel: _assessRiskLevel(req)
        }))
    };
}

/**
 * 依赖关系分析
 * @param {Array} requirements - 需求列表
 * @returns {Object} 依赖关系
 */
function _analyzeDependencies(requirements) {
    const dependencies = [];
    const groups = {};

    requirements.forEach((req, index) => {
        const requirement = typeof req === 'string' ? req : req.description;
        
        // 查找前置依赖
        if (requirement.includes('数据') || requirement.includes('存储')) {
            groups.data = groups.data || [];
            groups.data.push({ index, requirement });
        }
        
        if (requirement.includes('用户') || requirement.includes('认证')) {
            groups.auth = groups.auth || [];
            groups.auth.push({ index, requirement });
        }
        
        if (requirement.includes('界面') || requirement.includes('UI')) {
            groups.ui = groups.ui || [];
            groups.ui.push({ index, requirement });
        }
    });

    // 生成依赖关系
    if (groups.ui && groups.data) {
        dependencies.push({
            from: groups.ui[0]?.requirement,
            to: groups.data[0]?.requirement,
            type: 'requires',
            reason: 'UI组件需要数据支持'
        });
    }

    if (groups.auth && groups.data) {
        dependencies.push({
            from: groups.auth[0]?.requirement,
            to: groups.data[0]?.requirement,
            type: 'requires',
            reason: '用户认证需要数据存储'
        });
    }

    return {
        dependencies,
        groups,
        sequence: _generateImplementationSequence(groups)
    };
}

/**
 * 风险识别
 * @param {Array} requirements - 需求列表
 * @param {Array} constraints - 约束条件
 * @returns {Array} 风险列表
 */
function _identifyRequirementRisks(requirements, constraints) {
    const risks = [];

    // 需求复杂度风险
    if (requirements.length > 10) {
        risks.push({
            type: 'complexity',
            level: 'high',
            description: '需求数量过多，可能导致项目复杂度过高',
            mitigation: '分阶段实现，优先完成核心功能',
            probability: 'medium'
        });
    }

    // 技术风险
    const technicalRequirements = requirements.filter(req => 
        typeof req === 'string' && (req.includes('集成') || req.includes('算法'))
    );
    
    if (technicalRequirements.length > 0) {
        risks.push({
            type: 'technical',
            level: 'medium',
            description: '存在技术集成和算法实现风险',
            mitigation: '提前进行技术验证和原型开发',
            probability: 'medium'
        });
    }

    // 资源约束风险
    if (constraints.some(c => typeof c === 'string' && c.includes('时间'))) {
        risks.push({
            type: 'resource',
            level: 'high',
            description: '时间约束可能影响功能完整实现',
            mitigation: '调整功能范围或增加开发资源',
            probability: 'high'
        });
    }

    // 需求变更风险
    risks.push({
        type: 'requirements',
        level: 'medium',
        description: '需求可能在开发过程中发生变更',
        mitigation: '建立需求变更管理流程',
        probability: 'medium'
    });

    return risks;
}

/**
 * 生成需求分析建议
 * @param {Object} analysis - 分析结果
 * @returns {Array} 建议列表
 */
function _generateRequirementsRecommendations(analysis) {
    const recommendations = [];

    // 基于验证结果的建议
    if (analysis.validation.overallScore < 80) {
        recommendations.push({
            type: 'validation',
            priority: 'high',
            title: '需求质量改进',
            description: '当前需求存在一些质量问题，建议优先解决',
            actions: [
                '完善需求描述，确保清晰具体',
                '添加验收标准和测试用例',
                '检查需求一致性和完整性'
            ]
        });
    }

    // 基于可行性分析的建议
    if (analysis.feasibilityAnalysis.overall === 'low') {
        recommendations.push({
            type: 'feasibility',
            priority: 'high',
            title: '可行性改进',
            description: '部分需求实现难度较高，建议调整',
            actions: [
                '简化复杂功能设计',
                '分阶段实现高风险功能',
                '考虑技术方案替代'
            ]
        });
    }

    // 基于风险分析的建议
    const highRisks = analysis.risks.filter(r => r.level === 'high');
    if (highRisks.length > 0) {
        recommendations.push({
            type: 'risk',
            priority: 'medium',
            title: '风险控制',
            description: `识别到${highRisks.length}个高风险项`,
            actions: highRisks.map(r => r.mitigation)
        });
    }

    // 优先级建议
    const highPriorityCount = analysis.priorityAssessment.high.length;
    if (highPriorityCount > 5) {
        recommendations.push({
            type: 'priority',
            priority: 'medium',
            title: '优先级优化',
            description: '高优先级需求过多，建议重新评估',
            actions: [
                '重新评估需求业务价值',
                '与业务方确认核心功能',
                '制定分批次交付计划'
            ]
        });
    }

    return recommendations;
}

// ========== 用户故事处理辅助函数 ==========

/**
 * 规范化用户故事格式
 * @param {Array} userStories - 用户故事列表
 * @returns {Array} 规范化后的用户故事
 */
function _normalizeUserStories(userStories) {
    return userStories.map(story => ({
        id: story.id || `US-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: story.title || story.description || '未定义标题',
        description: story.description || story.title || '',
        persona: story.persona || '用户',
        priority: story.priority || 'medium',
        storyPoints: story.storyPoints || _estimateStoryPoints(story.title || story.description),
        acceptanceCriteria: story.acceptanceCriteria || [],
        tags: story.tags || [],
        epic: story.epic || '未分类',
        dependencies: story.dependencies || [],
        status: story.status || 'backlog',
        created: story.created || new Date().toISOString(),
        updated: new Date().toISOString()
    }));
}

/**
 * 生成验收标准
 * @param {Array} userStories - 用户故事列表
 * @returns {Array} 验收标准列表
 */
async function _generateAcceptanceCriteria(userStories) {
    return userStories.map(story => ({
        storyId: story.id,
        criteria: [
            `给定：${story.persona}已登录系统`,
            `当：${story.persona}执行${story.description || story.title}操作`,
            `那么：系统应该正确响应并提供预期结果`,
            `并且：操作结果应该被正确记录和显示`
        ]
    }));
}

/**
 * 工作量估算
 * @param {Array} userStories - 用户故事列表
 * @returns {Object} 估算结果
 */
function _estimateUserStories(userStories) {
    const totalPoints = userStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
    const averagePoints = totalPoints / userStories.length;

    return {
        totalStoryPoints: totalPoints,
        averageStoryPoints: Math.round(averagePoints * 100) / 100,
        estimatedSprints: Math.ceil(totalPoints / 20), // 假设每个sprint 20 story points
        estimatedWeeks: Math.ceil(totalPoints / 10), // 假设每周 10 story points
        breakdown: {
            high: userStories.filter(s => s.priority === 'high').reduce((sum, s) => sum + s.storyPoints, 0),
            medium: userStories.filter(s => s.priority === 'medium').reduce((sum, s) => sum + s.storyPoints, 0),
            low: userStories.filter(s => s.priority === 'low').reduce((sum, s) => sum + s.storyPoints, 0)
        }
    };
}

/**
 * 用户故事优先级排序
 * @param {Array} userStories - 用户故事列表
 * @returns {Array} 排序后的用户故事
 */
function _prioritizeUserStories(userStories) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return [...userStories].sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 相同优先级按故事点排序（小的优先）
        return (a.storyPoints || 0) - (b.storyPoints || 0);
    });
}

/**
 * 分组为史诗
 * @param {Array} userStories - 用户故事列表
 * @returns {Array} 史诗分组
 */
function _groupIntoEpics(userStories) {
    const epics = {};
    
    userStories.forEach(story => {
        const epic = story.epic || '通用功能';
        if (!epics[epic]) {
            epics[epic] = {
                name: epic,
                stories: [],
                totalPoints: 0,
                priority: 'medium'
            };
        }
        epics[epic].stories.push(story);
        epics[epic].totalPoints += story.storyPoints || 0;
    });

    // 确定史诗优先级
    Object.values(epics).forEach(epic => {
        const highPriorityCount = epic.stories.filter(s => s.priority === 'high').length;
        const mediumPriorityCount = epic.stories.filter(s => s.priority === 'medium').length;
        
        if (highPriorityCount > 0) {
            epic.priority = 'high';
        } else if (mediumPriorityCount > 0) {
            epic.priority = 'medium';
        } else {
            epic.priority = 'low';
        }
    });

    return Object.values(epics);
}

/**
 * 生成用户故事文档
 * @param {Array} userStories - 用户故事列表
 * @param {string} format - 文档格式
 * @param {string} templateType - 模板类型
 * @param {Object} promptService - 提示词服务
 * @returns {string} 文档内容
 */
async function _generateUserStoriesDocument(userStories, format, templateType, promptService) {
    try {
        const template = await promptService.loadPrompt('templates', `user-stories-${templateType}`, {
            stories_count: userStories.length,
            format: format
        });
        
        if (template && template.content) {
            return template.content;
        }
    } catch (error) {
        // 使用默认模板
    }

    // 默认Markdown格式文档
    let document = `# 用户故事文档\n\n`;
    document += `## 概述\n\n本文档包含 ${userStories.length} 个用户故事\n\n`;
    document += `## 用户故事列表\n\n`;

    userStories.forEach((story, index) => {
        document += `### ${index + 1}. ${story.title}\n\n`;
        document += `- **ID**: ${story.id}\n`;
        document += `- **描述**: ${story.description}\n`;
        document += `- **角色**: ${story.persona}\n`;
        document += `- **优先级**: ${story.priority}\n`;
        document += `- **故事点**: ${story.storyPoints}\n`;
        document += `- **状态**: ${story.status}\n\n`;
        
        if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
            document += `**验收标准**:\n`;
            story.acceptanceCriteria.forEach(criteria => {
                document += `- ${criteria}\n`;
            });
            document += `\n`;
        }
    });

    return document;
}

/**
 * 生成用户故事可交付成果
 * @param {Object} document - 用户故事文档
 * @returns {Array} 可交付成果列表
 */
function _generateUserStoriesDeliverables(document) {
    return [
        {
            name: '用户故事文档',
            type: 'documentation',
            format: document.format,
            description: `包含${document.stories.length}个用户故事的完整文档`
        },
        {
            name: '验收标准清单',
            type: 'checklist',
            format: 'markdown',
            description: '每个用户故事的详细验收标准'
        },
        {
            name: '工作量估算报告',
            type: 'report',
            format: 'json',
            description: '基于故事点的工作量分析'
        },
        {
            name: '史诗分组报告',
            type: 'analysis',
            format: 'markdown',
            description: '用户故事按功能模块的分组情况'
        }
    ];
}

/**
 * 计算用户故事指标
 * @param {Object} document - 用户故事文档
 * @returns {Object} 指标数据
 */
function _calculateUserStoriesMetrics(document) {
    const stories = document.normalizedStories;
    
    return {
        total: stories.length,
        byPriority: {
            high: stories.filter(s => s.priority === 'high').length,
            medium: stories.filter(s => s.priority === 'medium').length,
            low: stories.filter(s => s.priority === 'low').length
        },
        byEpic: document.epics.reduce((acc, epic) => {
            acc[epic.name] = epic.stories.length;
            return acc;
        }, {}),
        totalPoints: document.estimation?.totalStoryPoints || 0,
        averagePoints: document.estimation?.averageStoryPoints || 0,
        estimatedSprints: document.estimation?.estimatedSprints || 0,
        completeness: {
            withCriteria: stories.filter(s => s.acceptanceCriteria && s.acceptanceCriteria.length > 0).length,
            withoutCriteria: stories.filter(s => !s.acceptanceCriteria || s.acceptanceCriteria.length === 0).length
        }
    };
}

// ========== 通用辅助函数 ==========

function _findDuplicateRequirements(requirements) {
    const seen = new Set();
    const duplicates = [];
    
    requirements.forEach(req => {
        const requirement = typeof req === 'string' ? req.toLowerCase() : req.description?.toLowerCase();
        if (seen.has(requirement)) {
            duplicates.push(requirement);
        } else {
            seen.add(requirement);
        }
    });
    
    return duplicates;
}

function _inferPriority(requirement) {
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    const highPriorityKeywords = ['核心', '重要', '关键', '必须', '紧急'];
    const lowPriorityKeywords = ['优化', '美化', '改善', '可选'];
    
    if (highPriorityKeywords.some(keyword => req.includes(keyword))) {
        return 'high';
    } else if (lowPriorityKeywords.some(keyword => req.includes(keyword))) {
        return 'low';
    }
    return 'medium';
}

function _estimateStoryPoints(description) {
    if (!description) return 3;
    
    const complexity = description.length;
    if (complexity > 100) return 8;
    if (complexity > 50) return 5;
    if (complexity > 20) return 3;
    return 2;
}

function _generateBasicAcceptanceCriteria(requirement) {
    return [
        `功能应该按照需求"${requirement}"正确实现`,
        '用户界面应该直观易用',
        '操作应该有适当的反馈',
        '错误情况应该有合适的处理'
    ];
}

function _extractTags(requirement) {
    const tags = [];
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    
    if (req.includes('用户')) tags.push('user');
    if (req.includes('数据')) tags.push('data');
    if (req.includes('界面')) tags.push('ui');
    if (req.includes('API')) tags.push('api');
    if (req.includes('安全')) tags.push('security');
    
    return tags;
}

function _identifyEpic(requirement) {
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    
    if (req.includes('用户') || req.includes('认证')) return '用户管理';
    if (req.includes('数据') || req.includes('存储')) return '数据管理';
    if (req.includes('界面') || req.includes('UI')) return '用户界面';
    if (req.includes('API') || req.includes('接口')) return 'API服务';
    if (req.includes('安全') || req.includes('权限')) return '安全功能';
    
    return '核心功能';
}

function _assessTechnicalComplexity(requirements, language) {
    let complexityScore = 0;
    const totalRequirements = requirements.length;
    
    requirements.forEach(req => {
        const requirement = typeof req === 'string' ? req : req.description || '';
        
        if (requirement.includes('算法') || requirement.includes('计算')) complexityScore += 0.3;
        if (requirement.includes('集成') || requirement.includes('第三方')) complexityScore += 0.2;
        if (requirement.includes('实时') || requirement.includes('并发')) complexityScore += 0.25;
        if (requirement.includes('大数据') || requirement.includes('分析')) complexityScore += 0.2;
        if (requirement.includes('机器学习') || requirement.includes('AI')) complexityScore += 0.4;
    });
    
    return Math.min(1.0, complexityScore / totalRequirements);
}

function _assessBusinessValue(requirement, businessGoals) {
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    
    // 如果有明确的业务目标，尝试匹配
    if (businessGoals && businessGoals.length > 0) {
        const matchingGoals = businessGoals.filter(goal => 
            typeof goal === 'string' && req.toLowerCase().includes(goal.toLowerCase())
        );
        if (matchingGoals.length > 0) return 'high';
    }
    
    // 基于关键词判断业务价值
    const highValueKeywords = ['收入', '用户', '客户', '核心', '关键'];
    const mediumValueKeywords = ['效率', '体验', '性能'];
    
    if (highValueKeywords.some(keyword => req.includes(keyword))) return 'high';
    if (mediumValueKeywords.some(keyword => req.includes(keyword))) return 'medium';
    return 'low';
}

function _assessImplementationEffort(requirement) {
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    
    const highEffortKeywords = ['集成', '算法', '复杂', '多个'];
    const lowEffortKeywords = ['简单', '基础', '标准'];
    
    if (highEffortKeywords.some(keyword => req.includes(keyword))) return 'high';
    if (lowEffortKeywords.some(keyword => req.includes(keyword))) return 'low';
    return 'medium';
}

function _assessRiskLevel(requirement) {
    const req = typeof requirement === 'string' ? requirement : requirement.description || '';
    
    const highRiskKeywords = ['新技术', '第三方', '复杂', '未知'];
    const lowRiskKeywords = ['标准', '成熟', '简单'];
    
    if (highRiskKeywords.some(keyword => req.includes(keyword))) return 'high';
    if (lowRiskKeywords.some(keyword => req.includes(keyword))) return 'low';
    return 'medium';
}

function _generateImplementationSequence(groups) {
    const sequence = [];
    
    // 数据层优先
    if (groups.data) {
        sequence.push({ phase: 1, group: 'data', description: '数据模型和存储实现' });
    }
    
    // 认证系统其次
    if (groups.auth) {
        sequence.push({ phase: 2, group: 'auth', description: '用户认证和权限管理' });
    }
    
    // UI最后
    if (groups.ui) {
        sequence.push({ phase: 3, group: 'ui', description: '用户界面和交互实现' });
    }
    
    return sequence;
}

export default createFeatureRoutes;