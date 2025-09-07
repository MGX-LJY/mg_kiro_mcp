/**
 * Create模式 - 数据提供路由模块
 * 重构架构：MCP提供原始数据和模板，AI主导分析
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';

/**
 * 创建数据提供路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDataRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 获取需求分析所需的原始数据和模板
     * POST /get-requirements-data
     */
    router.post('/get-requirements-data', async (req, res) => {
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

            console.log(`[RequirementsData] 提供需求分析数据: ${requirements.length} 项需求`);

            const startTime = Date.now();

            // 获取分析模板
            const analysisTemplates = await _loadAnalysisTemplates(promptService, language);
            
            // 获取参考数据
            const referenceData = await _loadReferenceData(language);
            
            // 获取分析规则配置
            const analysisRules = _getAnalysisRules();
            
            // 构建响应数据 - 仅提供原始数据和模板
            const responseData = {
                // 原始数据
                rawData: {
                    requirements,
                    context,
                    stakeholders,
                    constraints,
                    businessGoals,
                    language,
                    timestamp: new Date().toISOString()
                },
                
                // 分析模板 - AI用于分析的结构化提示
                analysisTemplates,
                
                // 参考数据 - 辅助AI做出更好的分析
                referenceData,
                
                // 分析规则配置
                analysisRules,
                
                // 元数据
                metadata: {
                    templateVersion: '1.0.0',
                    supportedLanguages: ['javascript', 'python', 'java', 'go'],
                    analysisCapabilities: [
                        'categorization',
                        'validation', 
                        'user-story-decomposition',
                        'feasibility-analysis',
                        'priority-assessment',
                        'dependency-analysis',
                        'risk-identification'
                    ]
                }
            };

            const executionTime = Date.now() - startTime;

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'requirements_data_prepared', 'completed', responseData);
                }
            }

            console.log(`[RequirementsData] 数据准备完成: ${executionTime}ms`);

            success(res, {
                ...responseData,
                generation: {
                    executionTime,
                    dataProvider: 'mcp-server',
                    analysisMode: 'ai-driven',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('[RequirementsData] 数据准备失败:', err);
            error(res, err.message, 500, {
                action: 'get_requirements_data'
            });
        }
    });

    /**
     * 获取用户故事处理所需的数据和模板
     * POST /get-user-stories-data
     */
    router.post('/get-user-stories-data', async (req, res) => {
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

            console.log(`[UserStoriesData] 提供用户故事处理数据: ${userStories.length} 个故事`);

            const startTime = Date.now();

            // 获取文档模板
            const documentTemplates = await _loadDocumentTemplates(promptService, format, templateType);
            
            // 获取验收标准模板
            const acceptanceCriteriaTemplates = includeCriteria ? 
                await _loadAcceptanceCriteriaTemplates(promptService) : null;
            
            // 获取估算参考数据
            const estimationReferences = includeEstimation ? 
                _getEstimationReferences() : null;

            const responseData = {
                // 原始数据
                rawData: {
                    userStories,
                    format,
                    templateType,
                    includeCriteria,
                    includeEstimation,
                    timestamp: new Date().toISOString()
                },
                
                // 文档生成模板
                documentTemplates,
                
                // 验收标准模板
                acceptanceCriteriaTemplates,
                
                // 估算参考数据
                estimationReferences,
                
                // 处理规则
                processingRules: {
                    normalizationRules: _getNormalizationRules(),
                    prioritizationRules: _getPrioritizationRules(),
                    epicGroupingRules: _getEpicGroupingRules()
                },
                
                // 元数据
                metadata: {
                    supportedFormats: ['markdown', 'json', 'html'],
                    supportedTemplateTypes: ['standard', 'agile', 'detailed'],
                    processingCapabilities: [
                        'normalization',
                        'acceptance-criteria-generation', 
                        'estimation',
                        'prioritization',
                        'epic-grouping',
                        'document-generation'
                    ]
                }
            };

            const executionTime = Date.now() - startTime;

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'user_stories_data_prepared', 'completed', responseData);
                }
            }

            console.log(`[UserStoriesData] 数据准备完成: ${executionTime}ms`);

            success(res, {
                ...responseData,
                generation: {
                    executionTime,
                    dataProvider: 'mcp-server',
                    processingMode: 'ai-driven',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('[UserStoriesData] 数据准备失败:', err);
            error(res, err.message, 500, {
                action: 'get_user_stories_data'
            });
        }
    });

    /**
     * 保存AI分析结果（可选）
     * POST /save-analysis-result
     */
    router.post('/save-analysis-result', async (req, res) => {
        try {
            const { 
                analysisType,
                analysisResult,
                workflowId,
                metadata = {}
            } = req.body;
            
            if (!analysisType || !analysisResult) {
                return error(res, '分析类型和结果不能为空', 400);
            }

            console.log(`[SaveAnalysis] 保存AI分析结果: ${analysisType}`);

            const saveData = {
                type: analysisType,
                result: analysisResult,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    source: 'claude-code-ai'
                }
            };

            // 如果有工作流ID，保存到工作流中
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, `ai_analysis_${analysisType}`, 'completed', saveData);
                }
            }

            console.log(`[SaveAnalysis] 分析结果已保存: ${analysisType}`);

            success(res, {
                saved: true,
                analysisType,
                workflowId,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error('[SaveAnalysis] 保存分析结果失败:', err);
            error(res, err.message, 500, {
                action: 'save_analysis_result'
            });
        }
    });

    return router;
}

// ========== 模板和数据加载函数 ==========

/**
 * 加载分析模板
 * @param {Object} promptService - 提示词服务
 * @param {string} language - 编程语言
 * @returns {Object} 分析模板
 */
async function _loadAnalysisTemplates(promptService, language) {
    try {
        const templates = {
            categorization: await promptService.loadPrompt('analysis-templates', 'requirements-categorization', { language }),
            validation: await promptService.loadPrompt('analysis-templates', 'requirements-validation', { language }),
            userStoryDecomposition: await promptService.loadPrompt('analysis-templates', 'user-story-decomposition', { language }),
            feasibilityAnalysis: await promptService.loadPrompt('analysis-templates', 'feasibility-analysis', { language }),
            priorityAssessment: await promptService.loadPrompt('analysis-templates', 'priority-assessment', { language }),
            dependencyAnalysis: await promptService.loadPrompt('analysis-templates', 'dependency-analysis', { language }),
            riskIdentification: await promptService.loadPrompt('analysis-templates', 'risk-identification', { language })
        };
        
        return templates;
    } catch (error) {
        // 返回默认模板
        return _getDefaultAnalysisTemplates(language);
    }
}

/**
 * 加载文档模板
 * @param {Object} promptService - 提示词服务  
 * @param {string} format - 文档格式
 * @param {string} templateType - 模板类型
 * @returns {Object} 文档模板
 */
async function _loadDocumentTemplates(promptService, format, templateType) {
    try {
        const templates = {
            document: await promptService.loadPrompt('document-templates', `user-stories-${templateType}`, { format }),
            summary: await promptService.loadPrompt('document-templates', 'user-stories-summary', { format }),
            metrics: await promptService.loadPrompt('document-templates', 'user-stories-metrics', { format })
        };
        
        return templates;
    } catch (error) {
        return _getDefaultDocumentTemplates(format, templateType);
    }
}

/**
 * 加载验收标准模板
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 验收标准模板
 */
async function _loadAcceptanceCriteriaTemplates(promptService) {
    try {
        return await promptService.loadPrompt('document-templates', 'acceptance-criteria', {});
    } catch (error) {
        return _getDefaultAcceptanceCriteriaTemplate();
    }
}

/**
 * 加载参考数据
 * @param {string} language - 编程语言
 * @returns {Object} 参考数据
 */
async function _loadReferenceData(language) {
    return {
        industryPatterns: _getIndustryPatterns(),
        complexityMetrics: _getComplexityMetrics(language),
        bestPractices: _getBestPractices(language),
        commonRisks: _getCommonRisks(language)
    };
}

/**
 * 获取分析规则配置
 * @returns {Object} 分析规则
 */
function _getAnalysisRules() {
    return {
        priorityWeights: {
            businessValue: 0.4,
            implementationEffort: 0.3,
            riskLevel: 0.2,
            stakeholderImpact: 0.1
        },
        complexityFactors: [
            'integration_requirements',
            'algorithm_complexity', 
            'data_volume',
            'user_interface_complexity',
            'security_requirements'
        ],
        riskCategories: [
            'technical',
            'resource',
            'timeline',
            'requirements_change',
            'external_dependency'
        ],
        validationCriteria: {
            completeness: { minRequirements: 3, weight: 0.25 },
            clarity: { minLength: 6, weight: 0.25 },
            consistency: { allowDuplicates: false, weight: 0.25 },
            testability: { requiresObjectiveCriteria: true, weight: 0.25 }
        }
    };
}

/**
 * 获取估算参考数据
 * @returns {Object} 估算参考数据
 */
function _getEstimationReferences() {
    return {
        storyPointScale: [1, 2, 3, 5, 8, 13, 21],
        complexityMapping: {
            simple: { points: [1, 2, 3], description: '简单功能，无复杂逻辑' },
            medium: { points: [3, 5, 8], description: '中等复杂度，需要一定设计' },
            complex: { points: [8, 13, 21], description: '复杂功能，需要深度设计' }
        },
        velocityReferences: {
            sprintCapacity: 20, // 每个sprint的故事点容量
            weeklyCapacity: 10, // 每周的故事点容量
            teamSize: 3 // 默认团队大小
        }
    };
}

/**
 * 获取规范化规则
 * @returns {Object} 规范化规则
 */
function _getNormalizationRules() {
    return {
        requiredFields: ['id', 'title', 'description', 'persona', 'priority', 'storyPoints'],
        defaultValues: {
            persona: '用户',
            priority: 'medium', 
            status: 'backlog',
            epic: '未分类'
        },
        idFormat: 'US-{sequence:3}',
        titleFormat: '作为{persona}，{action}',
        validation: {
            maxTitleLength: 100,
            maxDescriptionLength: 500,
            validPriorities: ['high', 'medium', 'low'],
            validStatuses: ['backlog', 'ready', 'in_progress', 'done']
        }
    };
}

/**
 * 获取优先级规则
 * @returns {Object} 优先级规则
 */
function _getPrioritizationRules() {
    return {
        sortOrder: { high: 3, medium: 2, low: 1 },
        tieBreaker: 'storyPoints', // 相同优先级按故事点排序
        grouping: {
            mustHave: 'high',
            shouldHave: 'medium', 
            couldHave: 'low'
        }
    };
}

/**
 * 获取史诗分组规则
 * @returns {Object} 史诗分组规则
 */
function _getEpicGroupingRules() {
    return {
        autoGrouping: {
            userManagement: ['用户', '认证', '登录', '注册'],
            dataManagement: ['数据', '存储', '查询', '报告'],
            userInterface: ['界面', 'UI', '页面', '组件'],
            apiServices: ['API', '接口', '服务', '集成'],
            security: ['安全', '权限', '加密', '验证']
        },
        priorityInheritance: {
            epic: 'highest_story_priority', // 史诗优先级继承最高故事优先级
            threshold: 0.5 // 超过50%的故事是高优先级，史诗就是高优先级
        }
    };
}

// ========== 默认模板函数 ==========

function _getDefaultAnalysisTemplates(language) {
    return {
        categorization: {
            content: `# 需求分类分析模板

基于以下需求进行智能分类：
{{requirements}}

请按照以下类别进行分类：
1. **功能性需求** - 系统应该提供的具体功能
2. **非功能性需求** - 性能、安全、可用性要求  
3. **业务需求** - 业务目标和约束
4. **技术需求** - 技术架构和实现要求

细分类别：
- 用户界面 (UI)
- 数据管理 (Data)
- 系统集成 (Integration)  
- 安全功能 (Security)

输出JSON格式的分类结果。`
        },
        validation: {
            content: `# 需求验证分析模板

对以下需求进行质量验证：
{{requirements}}

验证维度：
1. **完整性** - 需求是否完整覆盖功能范围
2. **清晰度** - 需求描述是否清晰明确
3. **一致性** - 需求之间是否存在冲突
4. **可测试性** - 需求是否可以被验证和测试

为每个维度提供评分(0-100)和改进建议。`
        },
        userStoryDecomposition: {
            content: `# 用户故事分解模板

将以下需求分解为标准用户故事：
{{requirements}}

用户角色：{{stakeholders}}

用户故事格式：
"作为 [用户角色]，我想要 [功能描述]，以便 [业务价值]"

为每个用户故事提供：
- 唯一ID
- 标准格式的标题
- 详细描述
- 优先级评估
- 故事点估算
- 基本验收标准`
        }
    };
}

function _getDefaultDocumentTemplates(format, templateType) {
    const markdownTemplate = `# 用户故事文档

## 概述
本文档包含 {{story_count}} 个用户故事，用于指导功能开发。

## 用户故事列表
{{#each stories}}
### {{@index}}. {{title}}

- **ID**: {{id}}
- **描述**: {{description}}
- **用户角色**: {{persona}}
- **优先级**: {{priority}}
- **故事点**: {{storyPoints}}
- **状态**: {{status}}

{{#if acceptanceCriteria}}
**验收标准**:
{{#each acceptanceCriteria}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}

## 汇总信息
- **总故事点**: {{totalPoints}}
- **预估开发周期**: {{estimatedWeeks}} 周
- **高优先级故事**: {{highPriorityCount}} 个
- **史诗分组**: {{epicCount}} 个史诗`;

    return {
        document: { content: markdownTemplate },
        summary: { content: '## 用户故事摘要\n总计 {{story_count}} 个故事，{{total_points}} 个故事点。' },
        metrics: { content: '## 指标统计\n完成度: {{completeness}}%，平均故事点: {{average_points}}' }
    };
}

function _getDefaultAcceptanceCriteriaTemplate() {
    return {
        content: `# 验收标准模板

对于用户故事："{{story_title}}"

请生成具体的验收标准，使用以下格式：

**场景**: {{scenario_name}}
- **给定** (Given): 初始条件
- **当** (When): 执行的操作  
- **那么** (Then): 预期的结果
- **并且** (And): 额外的验证点

确保验收标准：
1. 具体明确，可以被测试
2. 覆盖主要使用场景
3. 包含边界情况和错误处理
4. 符合业务逻辑要求`
    };
}

function _getIndustryPatterns() {
    return [
        { pattern: 'user-authentication', complexity: 'medium', commonIn: ['web', 'mobile'] },
        { pattern: 'data-crud', complexity: 'low', commonIn: ['web', 'api'] },
        { pattern: 'real-time-communication', complexity: 'high', commonIn: ['chat', 'collaboration'] },
        { pattern: 'payment-processing', complexity: 'high', commonIn: ['ecommerce', 'fintech'] }
    ];
}

function _getComplexityMetrics(language) {
    const baseMetrics = {
        javascript: { setup: 2, crud: 3, integration: 5, algorithm: 8 },
        python: { setup: 2, crud: 3, integration: 4, algorithm: 6 },
        java: { setup: 3, crud: 4, integration: 6, algorithm: 8 },
        go: { setup: 2, crud: 3, integration: 5, algorithm: 7 }
    };
    
    return baseMetrics[language] || baseMetrics.javascript;
}

function _getBestPractices(language) {
    return {
        javascript: ['使用TypeScript', '实施ESLint规则', '编写单元测试', '遵循SOLID原则'],
        python: ['使用类型提示', '遵循PEP8', '编写docstring', '使用虚拟环境'],
        java: ['遵循Java命名规范', '使用Spring框架', '实施单元测试', '代码review'],
        go: ['遵循Go惯例', '使用Go modules', '实施错误处理', '编写benchmark测试']
    };
}

function _getCommonRisks(language) {
    return {
        javascript: ['NPM依赖漏洞', '异步处理复杂性', '浏览器兼容性', '性能优化'],
        python: ['依赖版本冲突', 'GIL性能限制', '内存管理', '部署环境差异'],
        java: ['JVM调优需求', '依赖管理复杂', '启动时间长', '内存使用高'],
        go: ['并发处理复杂性', '错误处理冗余', '泛型支持限制', '生态系统相对较小']
    };
}

export default createDataRoutes;