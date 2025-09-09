/**
 * Create模式路由系统 - 主入口
 * 
 * 核心功能：
 * 1. 处理用户的创建需求 (功能添加/新项目创建)
 * 2. 智能判断项目状态 (已存在/新建)
 * 3. 路由到对应的处理流程
 * 4. 提供Create模式的状态管理和帮助信息
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';
import { createExistingProjectRoutes } from './existing-project-workflow.js';
import { createNewProjectRoutes } from './new-project-workflow.js';

export function createCreateModeRoutes(services) {
    const router = express.Router();

    // Create模式状态查询
    router.get('/status', async (req, res) => {
        try {
            const { projectPath } = req.query;

            if (!projectPath) {
                return error(res, '项目路径必填', 400);
            }

            // 检查项目状态
            const projectStatus = await analyzeProjectStatus(projectPath, services);
            
            return success(res, {
                mode: 'create',
                projectPath,
                projectStatus: projectStatus.status,
                recommendedFlow: projectStatus.recommendedFlow,
                availableActions: getAvailableActions(projectStatus),
                currentTodos: await services.aiTodoManager?.getProjectTodoStatus?.(projectPath) || null,
                nextSteps: getNextSteps(projectStatus)
            }, 'Create模式状态查询完成');

        } catch (err) {
            return error(res, `获取Create模式状态失败: ${err.message}`, 500);
        }
    });

    // Create模式帮助信息
    router.get('/help', async (req, res) => {
        try {
            return success(res, {
                mode: 'create',
                description: 'Create模式用于创建新功能或新项目',
                
                workflows: {
                    existingProject: {
                        title: '已有项目添加功能',
                        description: '为已存在的项目添加新功能模块',
                        endpoint: '/mode/create/existing-project',
                        steps: [
                            '1. 分析用户需求，生成需求文档',
                            '2. 读取项目现有文档(架构、模块、连接)',
                            '3. 分析影响范围，生成影响分析文档',
                            '4. 创建TODO清单',
                            '5. 逐步实现功能',
                            '6. 更新相关文档'
                        ]
                    },
                    newProject: {
                        title: '从头创建新项目',
                        description: '根据需求从零开始创建全新项目',
                        endpoint: '/mode/create/new-project',
                        steps: [
                            '1. 分析用户需求，生成需求文档',
                            '2. 设计项目架构',
                            '3. 规划模块结构',
                            '4. 创建TODO清单',
                            '5. 逐步实现项目',
                            '6. 生成完整文档'
                        ]
                    }
                },

                commonEndpoints: [
                    'GET /mode/create/status - 获取Create模式状态',
                    'GET /mode/create/help - 获取帮助信息',
                    'POST /mode/create/analyze-requirement - 分析用户需求',
                    'POST /mode/create/start-workflow - 开始创建流程'
                ],

                tips: [
                    '先调用status检查项目状态',
                    '根据项目状态选择合适的工作流',
                    '详细描述需求以获得更好的分析结果',
                    '使用TODO系统跟踪开发进度'
                ]
            }, 'Create模式帮助信息');

        } catch (err) {
            return error(res, `获取帮助信息失败: ${err.message}`, 500);
        }
    });

    // 分析用户需求 (通用接口)
    router.post('/analyze-requirement', async (req, res) => {
        try {
            const { 
                requirement, 
                projectPath,
                additionalContext = ''
            } = req.body;

            if (!requirement) {
                return error(res, '需求描述必填', 400);
            }

            console.log(`[Create] 分析用户需求: ${requirement.substring(0, 100)}...`);

            // 使用模板配置管理器生成需求分析文档
            const requirementAnalysis = await analyzeUserRequirement(
                requirement, 
                projectPath, 
                additionalContext, 
                services
            );

            // 保存需求文档到mg_kiro/create目录
            if (projectPath) {
                await saveRequirementDocument(projectPath, requirementAnalysis);
            }

            return success(res, {
                requirementAnalysis,
                documentSaved: !!projectPath,
                recommendedWorkflow: requirementAnalysis.recommendedWorkflow,
                nextActions: [
                    `使用 ${requirementAnalysis.recommendedWorkflow} 工作流`,
                    '调用对应的工作流启动接口',
                    '跟踪TODO进度直至完成'
                ]
            }, '需求分析完成');

        } catch (err) {
            console.error('[Create] 需求分析失败:', err);
            return error(res, `需求分析失败: ${err.message}`, 500);
        }
    });

    // 启动创建工作流
    router.post('/start-workflow', async (req, res) => {
        try {
            const { 
                workflowType,    // 'existing-project' | 'new-project'
                projectPath,
                requirement,
                options = {}
            } = req.body;

            if (!workflowType || !requirement) {
                return error(res, '工作流类型和需求描述必填', 400);
            }

            console.log(`[Create] 启动${workflowType}工作流`);

            // 根据工作流类型路由到具体处理
            let workflowResult;
            
            if (workflowType === 'existing-project') {
                if (!projectPath) {
                    return error(res, '已有项目工作流需要项目路径', 400);
                }
                workflowResult = await startExistingProjectWorkflow(
                    projectPath, requirement, options, services
                );
            } else if (workflowType === 'new-project') {
                workflowResult = await startNewProjectWorkflow(
                    requirement, options, services
                );
            } else {
                return error(res, `不支持的工作流类型: ${workflowType}`, 400);
            }

            return success(res, workflowResult, '创建工作流已启动');

        } catch (err) {
            console.error('[Create] 工作流启动失败:', err);
            return error(res, `工作流启动失败: ${err.message}`, 500);
        }
    });

    // 挂载子路由
    router.use('/existing-project', createExistingProjectRoutes(services));
    router.use('/new-project', createNewProjectRoutes(services));

    return router;
}

/**
 * 分析项目状态
 */
async function analyzeProjectStatus(projectPath, services) {
    try {
        // 检查项目是否存在
        const { existsSync } = await import('fs');
        const { resolve } = await import('path');
        
        const projectExists = existsSync(resolve(projectPath));
        
        if (!projectExists) {
            return {
                status: 'not-exists',
                recommendedFlow: 'new-project',
                description: '项目路径不存在，建议使用新项目创建流程'
            };
        }

        // 检查是否有mg_kiro文档目录
        const mgKiroPath = resolve(projectPath, 'mg_kiro');
        const hasMgKiro = existsSync(mgKiroPath);
        
        if (hasMgKiro) {
            // 检查文档完整性
            const architecturePath = resolve(mgKiroPath, 'architecture');
            const modulesPath = resolve(mgKiroPath, 'modules');
            const connectionsPath = resolve(mgKiroPath, 'connections');
            
            const hasArchitecture = existsSync(architecturePath);
            const hasModules = existsSync(modulesPath);
            const hasConnections = existsSync(connectionsPath);
            
            if (hasArchitecture && hasModules && hasConnections) {
                return {
                    status: 'initialized-with-docs',
                    recommendedFlow: 'existing-project',
                    description: '项目已存在且有完整文档，建议使用已有项目功能添加流程',
                    documentationStatus: {
                        architecture: hasArchitecture,
                        modules: hasModules,
                        connections: hasConnections
                    }
                };
            } else {
                return {
                    status: 'initialized-partial-docs',
                    recommendedFlow: 'existing-project',
                    description: '项目已初始化但文档不完整，建议先完善文档再添加功能',
                    documentationStatus: {
                        architecture: hasArchitecture,
                        modules: hasModules,
                        connections: hasConnections
                    }
                };
            }
        }

        // 检查是否是标准项目结构
        const packageJsonPath = resolve(projectPath, 'package.json');
        const hasPackageJson = existsSync(packageJsonPath);
        
        if (hasPackageJson) {
            return {
                status: 'exists-uninitialized',
                recommendedFlow: 'existing-project',
                description: '项目存在但未初始化mg_kiro文档，建议先运行Init模式'
            };
        }

        return {
            status: 'exists-unknown',
            recommendedFlow: 'existing-project',
            description: '项目目录存在但结构未知，需要手动分析'
        };

    } catch (error) {
        return {
            status: 'error',
            recommendedFlow: null,
            description: `无法分析项目状态: ${error.message}`
        };
    }
}

/**
 * 获取可用操作
 */
function getAvailableActions(projectStatus) {
    const baseActions = [
        'analyze-requirement',
        'start-workflow'
    ];

    switch (projectStatus.status) {
        case 'not-exists':
            return [...baseActions, 'create-new-project'];
        
        case 'initialized-with-docs':
            return [...baseActions, 'add-feature', 'modify-existing-feature'];
        
        case 'initialized-partial-docs':
            return [...baseActions, 'complete-initialization', 'add-feature'];
        
        case 'exists-uninitialized':
            return [...baseActions, 'run-init-mode', 'analyze-existing-code'];
        
        default:
            return baseActions;
    }
}

/**
 * 获取下一步建议
 */
function getNextSteps(projectStatus) {
    switch (projectStatus.status) {
        case 'not-exists':
            return [
                '1. 调用 /mode/create/analyze-requirement 分析需求',
                '2. 使用 new-project 工作流创建项目',
                '3. 跟踪TODO进度完成项目开发'
            ];
        
        case 'initialized-with-docs':
            return [
                '1. 调用 /mode/create/analyze-requirement 分析新功能需求',
                '2. 使用 existing-project 工作流添加功能',
                '3. 系统会自动读取现有文档进行分析'
            ];
        
        case 'exists-uninitialized':
            return [
                '1. 建议先运行 Init 模式生成项目文档',
                '2. 然后使用 Create 模式的 existing-project 工作流',
                '3. 或直接使用 existing-project 工作流，系统会先分析代码'
            ];
        
        default:
            return [
                '1. 调用 /mode/create/analyze-requirement 分析需求',
                '2. 根据分析结果选择合适的工作流',
                '3. 跟踪完成开发任务'
            ];
    }
}

/**
 * 分析用户需求
 */
async function analyzeUserRequirement(requirement, projectPath, additionalContext, services) {
    console.log('[Create] 开始分析用户需求...');

    // 使用统一模板服务生成需求分析
    let templateContent = '';
    try {
        if (services.masterTemplateService) {
            const templateResult = await services.masterTemplateService.getTemplate({
                category: 'templates',
                name: 'requirement-analysis',
                variables: {
                    requirement,
                    projectPath: projectPath || '新项目',
                    additionalContext,
                    analyzedAt: new Date().toISOString()
                },
                context: {
                    mode: 'create',
                    step: 'analyze_requirement',
                    language: 'auto',
                    projectPath
                }
            });
            
            if (templateResult.success) {
                templateContent = templateResult.content;
            }
        }
    } catch (error) {
        console.warn('[Create] 模板服务调用失败，使用默认分析:', error.message);
    }

    const analysis = {
        originalRequirement: requirement,
        additionalContext,
        analyzedAt: new Date().toISOString(),
        
        // 需求解析
        parsedRequirement: {
            mainGoal: extractMainGoal(requirement),
            features: extractFeatures(requirement),
            technicalRequirements: extractTechnicalRequirements(requirement),
            constraints: extractConstraints(requirement)
        },
        
        // 复杂度评估
        complexity: assessComplexity(requirement),
        estimatedTime: estimateTime(requirement),
        
        // 推荐工作流
        recommendedWorkflow: projectPath ? 'existing-project' : 'new-project',
        
        // 影响分析 (如果是已有项目)
        impactAnalysis: projectPath ? {
            affectedModules: ['待分析'],
            affectedFunctions: ['待分析'],
            newModulesNeeded: ['待分析']
        } : null,
        
        // 架构建议 (如果是新项目)
        architectureRecommendation: !projectPath ? {
            suggestedFramework: suggestFramework(requirement),
            suggestedModules: suggestModules(requirement),
            suggestedPatterns: suggestPatterns(requirement)
        } : null,
        
        // 模板内容 (如果有)
        templateContent: templateContent || null
    };

    return analysis;
}

/**
 * 保存需求文档
 */
async function saveRequirementDocument(projectPath, analysis) {
    const { promises: fs } = await import('fs');
    const { resolve, join } = await import('path');

    const createDir = resolve(projectPath, 'mg_kiro', 'create');
    
    // 确保目录存在
    await fs.mkdir(createDir, { recursive: true });

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `requirement-analysis-${timestamp}.md`;
    const filePath = join(createDir, fileName);

    const document = `# 需求分析文档

## 基本信息
- **分析时间**: ${analysis.analyzedAt}
- **项目路径**: ${projectPath || '新项目'}
- **推荐工作流**: ${analysis.recommendedWorkflow}

## 原始需求
${analysis.originalRequirement}

${analysis.additionalContext ? `## 附加说明\n${analysis.additionalContext}\n` : ''}

## 需求解析
### 主要目标
${analysis.parsedRequirement.mainGoal}

### 功能特性
${analysis.parsedRequirement.features.map(f => `- ${f}`).join('\n')}

### 技术要求
${analysis.parsedRequirement.technicalRequirements.map(t => `- ${t}`).join('\n')}

### 限制条件
${analysis.parsedRequirement.constraints.map(c => `- ${c}`).join('\n')}

## 复杂度评估
- **复杂度级别**: ${analysis.complexity}
- **预估时间**: ${analysis.estimatedTime}

${analysis.impactAnalysis ? `## 影响分析
### 影响的模块
${analysis.impactAnalysis.affectedModules.map(m => `- ${m}`).join('\n')}

### 影响的功能
${analysis.impactAnalysis.affectedFunctions.map(f => `- ${f}`).join('\n')}

### 需要新增的模块
${analysis.impactAnalysis.newModulesNeeded.map(n => `- ${n}`).join('\n')}
` : ''}

${analysis.architectureRecommendation ? `## 架构建议
### 推荐框架
${analysis.architectureRecommendation.suggestedFramework}

### 推荐模块
${analysis.architectureRecommendation.suggestedModules.map(m => `- ${m}`).join('\n')}

### 推荐模式
${analysis.architectureRecommendation.suggestedPatterns.map(p => `- ${p}`).join('\n')}
` : ''}

---
*由 mg_kiro Create模式自动生成*
`;

    await fs.writeFile(filePath, document, 'utf8');
    console.log(`[Create] 需求文档已保存: ${fileName}`);
}

/**
 * 启动已有项目工作流
 */
async function startExistingProjectWorkflow(projectPath, requirement, options, services) {
    // 这里会调用 existing-project-workflow 的具体实现
    return {
        workflowType: 'existing-project',
        projectPath,
        status: 'started',
        message: '已有项目功能添加工作流已启动，请调用具体的existing-project接口继续',
        nextEndpoint: '/mode/create/existing-project/start'
    };
}

/**
 * 启动新项目工作流
 */
async function startNewProjectWorkflow(requirement, options, services) {
    // 这里会调用 new-project-workflow 的具体实现
    return {
        workflowType: 'new-project',
        status: 'started',
        message: '新项目创建工作流已启动，请调用具体的new-project接口继续',
        nextEndpoint: '/mode/create/new-project/start'
    };
}

/**
 * 需求分析辅助函数
 */
function extractMainGoal(requirement) {
    // 简单的关键词提取逻辑，实际中会更复杂
    if (requirement.includes('创建') || requirement.includes('开发')) {
        return requirement.split('。')[0] || requirement.substring(0, 100);
    }
    return '根据需求描述开发相应功能';
}

function extractFeatures(requirement) {
    const features = [];
    
    // 简单的特性提取逻辑
    const keywords = ['功能', '特性', '接口', 'API', '页面', '组件', '服务'];
    keywords.forEach(keyword => {
        if (requirement.includes(keyword)) {
            features.push(`实现${keyword}相关功能`);
        }
    });
    
    return features.length > 0 ? features : ['实现核心业务功能'];
}

function extractTechnicalRequirements(requirement) {
    const techReqs = [];
    
    const techKeywords = {
        'React': 'React框架开发',
        'Vue': 'Vue框架开发', 
        'Node.js': 'Node.js后端开发',
        'API': 'RESTful API接口',
        '数据库': '数据库设计和操作',
        '前端': '前端界面开发',
        '后端': '后端服务开发'
    };
    
    Object.entries(techKeywords).forEach(([keyword, desc]) => {
        if (requirement.includes(keyword)) {
            techReqs.push(desc);
        }
    });
    
    return techReqs.length > 0 ? techReqs : ['标准Web应用开发技术栈'];
}

function extractConstraints(requirement) {
    const constraints = [];
    
    if (requirement.includes('时间')) {
        constraints.push('需注意时间限制');
    }
    if (requirement.includes('性能')) {
        constraints.push('需考虑性能要求');
    }
    if (requirement.includes('安全')) {
        constraints.push('需满足安全要求');
    }
    
    return constraints.length > 0 ? constraints : ['按照标准开发规范执行'];
}

function assessComplexity(requirement) {
    const length = requirement.length;
    const keywords = ['复杂', '多个', '系统', '集成', '架构'].filter(k => 
        requirement.includes(k)
    ).length;
    
    if (length > 500 || keywords >= 3) return 'high';
    if (length > 200 || keywords >= 1) return 'medium';
    return 'low';
}

function estimateTime(requirement) {
    const complexity = assessComplexity(requirement);
    
    const timeMap = {
        low: '1-2天',
        medium: '3-5天', 
        high: '1-2周'
    };
    
    return timeMap[complexity];
}

function suggestFramework(requirement) {
    if (requirement.includes('React')) return 'React';
    if (requirement.includes('Vue')) return 'Vue';
    if (requirement.includes('Node')) return 'Node.js';
    return '根据具体需求选择合适框架';
}

function suggestModules(requirement) {
    const modules = [];
    
    if (requirement.includes('API') || requirement.includes('接口')) {
        modules.push('API路由模块', 'API控制器模块');
    }
    if (requirement.includes('数据') || requirement.includes('存储')) {
        modules.push('数据模型模块', '数据库服务模块');
    }
    if (requirement.includes('用户') || requirement.includes('认证')) {
        modules.push('用户管理模块', '认证授权模块');
    }
    
    return modules.length > 0 ? modules : ['核心业务模块', '通用工具模块'];
}

function suggestPatterns(requirement) {
    return [
        'MVC架构模式',
        '服务层模式',
        '依赖注入模式',
        'RESTful设计模式'
    ];
}

export default createCreateModeRoutes;