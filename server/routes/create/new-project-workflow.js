/**
 * 新项目创建工作流
 * 
 * 处理流程：
 * 1. 用户提出需求 -> 生成需求文档
 * 2. 根据需求设计项目架构
 * 3. 规划模块结构
 * 4. 创建TODO清单
 * 5. 逐步实现项目
 * 6. 生成完整文档
 */

import express from 'express';
import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import { success, error } from '../../services/response-service.js';

export function createNewProjectRoutes(services) {
    const router = express.Router();

    // 启动新项目创建流程
    router.post('/start', async (req, res) => {
        try {
            const { 
                projectName,
                projectPath,
                requirement,
                options = {}
            } = req.body;

            if (!projectName || !requirement) {
                return error(res, '项目名称和需求描述必填', 400);
            }

            const targetPath = projectPath || resolve(process.cwd(), projectName);
            
            console.log(`[NewProject] 启动新项目创建流程: ${projectName}`);
            console.log(`[NewProject] 项目路径: ${targetPath}`);

            // 1. 检查项目路径是否已存在
            const pathValidation = await validateProjectPath(targetPath);
            if (!pathValidation.valid) {
                return error(res, pathValidation.message, 400);
            }

            // 2. 生成需求分析文档
            const requirementDoc = await generateNewProjectRequirement(
                projectName, targetPath, requirement, services
            );

            // 3. 设计项目架构
            const architectureDesign = await designProjectArchitecture(
                projectName, requirement, options, services
            );

            // 4. 规划模块结构
            const moduleStructure = await planModuleStructure(
                requirement, architectureDesign, services
            );

            // 5. 创建项目基础结构
            await createProjectBaseStructure(targetPath, architectureDesign);

            // 6. 保存架构和模块设计文档
            const designDocs = await saveDesignDocuments(
                targetPath, architectureDesign, moduleStructure
            );

            // 7. 创建TODO清单
            const todoList = await createNewProjectTodoList(
                targetPath, projectName, requirement, architectureDesign, moduleStructure, services
            );

            return success(res, {
                workflowStarted: true,
                projectName,
                projectPath: targetPath,
                phase: 'design_completed',
                
                results: {
                    requirementDocument: requirementDoc.fileName,
                    architectureDocument: designDocs.architecture.fileName,
                    moduleStructureDocument: designDocs.modules.fileName,
                    todoListCreated: todoList.success,
                    totalTasks: todoList.totalTasks
                },
                
                projectDesign: {
                    architecture: architectureDesign.summary,
                    modules: moduleStructure.summary,
                    techStack: architectureDesign.techStack,
                    estimatedTime: architectureDesign.estimatedTime
                },
                
                nextActions: [
                    '调用 /mode/create/new-project/get-next-task 获取第一个任务',
                    '按TODO清单逐步实现项目',
                    '使用 /mode/create/new-project/complete-task 标记任务完成'
                ],
                
                aiGuidance: {
                    currentPhase: '准备开始项目实现',
                    recommendation: 'AI需要按照TODO清单顺序执行任务，先创建核心架构再实现具体功能',
                    developmentStrategy: architectureDesign.developmentStrategy
                }
            }, '新项目创建流程已启动');

        } catch (err) {
            console.error('[NewProject] 启动流程失败:', err);
            return error(res, `启动流程失败: ${err.message}`, 500);
        }
    });

    // 获取下一个任务
    router.get('/get-next-task', async (req, res) => {
        try {
            const { projectPath } = req.query;

            if (!projectPath) {
                return error(res, '项目路径必填', 400);
            }

            // 使用AI TODO管理器获取下一个任务
            const nextTask = await services.aiTodoManager.getNextTask(projectPath);

            if (nextTask.completed) {
                return success(res, {
                    allTasksCompleted: true,
                    summary: nextTask.finalSummary,
                    recommendations: [
                        '项目创建任务已完成',
                        '建议运行初始化测试',
                        '检查项目结构和配置',
                        '更新README和文档'
                    ]
                }, '🎉 新项目创建任务已完成！');
            }

            if (!nextTask.success) {
                return error(res, nextTask.message, 400, {
                    suggestions: nextTask.suggestions
                });
            }

            // 增强任务信息 - 为新项目任务添加上下文
            const enhancedTask = await enhanceTaskWithNewProjectContext(
                nextTask.task, projectPath, services
            );

            return success(res, {
                task: enhancedTask,
                progress: nextTask.progress,
                projectContext: enhancedTask.projectContext,
                nextSteps: nextTask.nextSteps,
                aiInstructions: enhancedTask.aiInstructions
            }, '获取到下一个任务');

        } catch (err) {
            console.error('[NewProject] 获取任务失败:', err);
            return error(res, `获取任务失败: ${err.message}`, 500);
        }
    });

    // 完成任务
    router.post('/complete-task', async (req, res) => {
        try {
            const { 
                projectPath,
                taskId,
                completionData = {}
            } = req.body;

            if (!projectPath || !taskId) {
                return error(res, '项目路径和任务ID必填', 400);
            }

            // 使用AI TODO管理器完成任务
            const result = await services.aiTodoManager.completeTask(
                projectPath, taskId, completionData
            );

            // 如果任务类型是架构创建，执行相应的后处理
            if (completionData.taskType === 'create_architecture') {
                await handleArchitectureCreation(projectPath, completionData);
            }

            return success(res, {
                taskCompleted: true,
                completedTask: result.completedTask,
                progress: result.progress,
                nextTaskAvailable: result.nextTaskAvailable,
                recommendations: result.recommendations,
                
                nextActions: result.nextTaskAvailable ? [
                    '调用 get-next-task 获取下一个任务',
                    '继续执行项目开发任务'
                ] : [
                    '所有任务已完成',
                    '执行项目初始化和测试'
                ]
            }, '任务已完成');

        } catch (err) {
            console.error('[NewProject] 完成任务失败:', err);
            return error(res, `完成任务失败: ${err.message}`, 500);
        }
    });

    // 获取项目设计信息
    router.get('/project-design', async (req, res) => {
        try {
            const { projectPath } = req.query;

            if (!projectPath) {
                return error(res, '项目路径必填', 400);
            }

            const design = await getProjectDesign(projectPath);

            return success(res, design, '项目设计信息获取成功');

        } catch (err) {
            return error(res, `获取项目设计失败: ${err.message}`, 500);
        }
    });

    // 更新项目架构
    router.post('/update-architecture', async (req, res) => {
        try {
            const { 
                projectPath,
                architectureUpdates,
                reason = ''
            } = req.body;

            if (!projectPath || !architectureUpdates) {
                return error(res, '项目路径和架构更新必填', 400);
            }

            const updatedArchitecture = await updateProjectArchitecture(
                projectPath, architectureUpdates, reason
            );

            return success(res, {
                architectureUpdated: true,
                updatedArchitecture,
                fileName: updatedArchitecture.fileName
            }, '项目架构已更新');

        } catch (err) {
            return error(res, `更新项目架构失败: ${err.message}`, 500);
        }
    });

    return router;
}

/**
 * 验证项目路径
 */
async function validateProjectPath(projectPath) {
    try {
        const pathExists = await fs.access(resolve(projectPath))
            .then(() => true)
            .catch(() => false);

        if (pathExists) {
            // 检查目录是否为空
            const items = await fs.readdir(resolve(projectPath));
            if (items.length > 0) {
                return {
                    valid: false,
                    message: '目标路径已存在且不为空，请选择空目录或不存在的路径'
                };
            }
        }

        return {
            valid: true,
            message: '项目路径验证通过'
        };

    } catch (error) {
        return {
            valid: false,
            message: `路径验证失败: ${error.message}`
        };
    }
}

/**
 * 生成新项目需求文档
 */
async function generateNewProjectRequirement(projectName, projectPath, requirement, services) {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `project-requirement-${timestamp}.md`;
    
    // 确保mg_kiro/create目录存在
    const createDir = resolve(projectPath, 'mg_kiro', 'create');
    await fs.mkdir(createDir, { recursive: true });
    
    const filePath = join(createDir, fileName);
    
    // 尝试使用统一模板服务
    let document = '';
    try {
        if (services.masterTemplateService) {
            const templateResult = await services.masterTemplateService.getTemplate({
                category: 'templates',
                name: 'new-project-requirement',
                variables: {
                    projectName,
                    projectPath,
                    requirement,
                    timestamp: new Date().toISOString(),
                    projectGoal: extractProjectGoal(requirement),
                    coreFunctions: extractCoreFunctions(requirement),
                    techRequirements: extractTechRequirements(requirement),
                    performanceRequirements: extractPerformanceRequirements(requirement),
                    deploymentRequirements: extractDeploymentRequirements(requirement)
                },
                context: {
                    mode: 'create',
                    step: 'generate_project_requirement',
                    projectPath
                }
            });
            
            if (templateResult.success) {
                document = templateResult.content;
            }
        }
    } catch (error) {
        console.warn('[NewProject] 模板服务失败，使用默认模板:', error.message);
    }
    
    // 如果模板服务失败，使用默认模板
    if (!document) {
        document = `# 新项目需求文档

## 项目基本信息
- **项目名称**: ${projectName}
- **项目路径**: ${projectPath}
- **创建时间**: ${new Date().toISOString()}
- **项目类型**: 新建项目

## 项目需求
${requirement}

## 需求分析
### 项目目标
${extractProjectGoal(requirement)}

### 核心功能
${extractCoreFunctions(requirement).map(f => `- ${f}`).join('\n')}

### 技术需求
${extractTechRequirements(requirement).map(t => `- ${t}`).join('\n')}

### 性能要求
${extractPerformanceRequirements(requirement).map(p => `- ${p}`).join('\n')}

### 部署要求
${extractDeploymentRequirements(requirement).map(d => `- ${d}`).join('\n')}

## 项目范围
### 包含功能
- 核心业务功能实现
- 基础架构搭建
- API接口开发
- 数据存储设计
- 用户界面开发（如需要）

### 不包含功能
- 高级运维监控
- 复杂的性能优化
- 第三方集成（除非明确要求）

## 验收标准
- 所有核心功能正常工作
- 代码结构清晰，符合最佳实践
- 包含必要的测试用例
- 文档完整，包含使用说明
- 项目可以正常启动和部署

---
*由 mg_kiro Create模式生成 - ${new Date().toISOString()}*
`;
    }

    await fs.writeFile(filePath, document, 'utf8');
    
    return {
        fileName,
        filePath,
        content: document
    };
}

/**
 * 设计项目架构
 */
async function designProjectArchitecture(projectName, requirement, options, services) {
    console.log('[NewProject] 设计项目架构...');

    const architecture = {
        projectName,
        designedAt: new Date().toISOString(),
        
        // 技术栈选择
        techStack: selectTechStack(requirement, options),
        
        // 架构模式
        architecturePattern: selectArchitecturePattern(requirement),
        
        // 核心组件
        coreComponents: designCoreComponents(requirement),
        
        // 数据层设计
        dataLayer: designDataLayer(requirement),
        
        // API设计
        apiDesign: designApiStructure(requirement),
        
        // 目录结构
        directoryStructure: designDirectoryStructure(requirement),
        
        // 开发策略
        developmentStrategy: generateDevelopmentStrategy(requirement),
        
        // 时间估算
        estimatedTime: estimateProjectTime(requirement)
    };

    // 生成架构摘要
    architecture.summary = {
        pattern: architecture.architecturePattern,
        techStack: architecture.techStack.primary,
        coreComponents: architecture.coreComponents.length,
        estimatedTime: architecture.estimatedTime
    };

    return architecture;
}

/**
 * 规划模块结构
 */
async function planModuleStructure(requirement, architectureDesign, services) {
    console.log('[NewProject] 规划模块结构...');

    const moduleStructure = {
        plannedAt: new Date().toISOString(),
        
        // 核心模块
        coreModules: planCoreModules(requirement, architectureDesign),
        
        // 业务模块
        businessModules: planBusinessModules(requirement),
        
        // 工具模块
        utilityModules: planUtilityModules(requirement),
        
        // 配置模块
        configModules: planConfigModules(requirement),
        
        // 模块依赖关系
        dependencies: planModuleDependencies(requirement),
        
        // 开发顺序
        developmentOrder: planDevelopmentOrder(requirement)
    };

    // 生成模块摘要
    moduleStructure.summary = {
        totalModules: moduleStructure.coreModules.length + 
                     moduleStructure.businessModules.length + 
                     moduleStructure.utilityModules.length + 
                     moduleStructure.configModules.length,
        developmentPhases: moduleStructure.developmentOrder.length,
        complexModules: moduleStructure.coreModules.filter(m => m.complexity === 'high').length
    };

    return moduleStructure;
}

/**
 * 创建项目基础结构
 */
async function createProjectBaseStructure(projectPath, architectureDesign) {
    console.log('[NewProject] 创建项目基础结构...');

    // 确保项目目录存在
    await fs.mkdir(resolve(projectPath), { recursive: true });

    // 创建mg_kiro文档目录结构
    const mgKiroStructure = [
        'mg_kiro',
        'mg_kiro/architecture',
        'mg_kiro/modules',
        'mg_kiro/connections',
        'mg_kiro/create',
        'mg_kiro/files'
    ];

    for (const dir of mgKiroStructure) {
        await fs.mkdir(resolve(projectPath, dir), { recursive: true });
    }

    // 根据架构设计创建项目目录结构
    for (const dir of architectureDesign.directoryStructure) {
        await fs.mkdir(resolve(projectPath, dir), { recursive: true });
    }

    console.log('[NewProject] 项目基础结构创建完成');
}

/**
 * 保存设计文档
 */
async function saveDesignDocuments(projectPath, architectureDesign, moduleStructure) {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 保存架构设计文档
    const archFileName = `system-architecture-${timestamp}.md`;
    const archFilePath = resolve(projectPath, 'mg_kiro', 'architecture', archFileName);
    
    const archDocument = `# 系统架构设计文档

## 项目信息
- **项目名称**: ${architectureDesign.projectName}
- **设计时间**: ${architectureDesign.designedAt}
- **架构模式**: ${architectureDesign.architecturePattern}

## 技术栈
### 主要技术
- **框架**: ${architectureDesign.techStack.framework}
- **语言**: ${architectureDesign.techStack.language}
- **数据库**: ${architectureDesign.techStack.database}
- **服务器**: ${architectureDesign.techStack.server}

### 依赖工具
${architectureDesign.techStack.tools.map(t => `- ${t}`).join('\n')}

## 架构组件
${architectureDesign.coreComponents.map(c => 
`### ${c.name}
- **类型**: ${c.type}
- **职责**: ${c.responsibility}
- **技术**: ${c.technology}`
).join('\n\n')}

## 数据层设计
### 数据存储
${architectureDesign.dataLayer.storage.map(s => `- ${s}`).join('\n')}

### 数据模型
${architectureDesign.dataLayer.models.map(m => `- ${m}`).join('\n')}

## API设计
### API风格
${architectureDesign.apiDesign.style}

### 主要端点
${architectureDesign.apiDesign.endpoints.map(e => `- ${e}`).join('\n')}

## 目录结构
\`\`\`
${architectureDesign.directoryStructure.map(d => d).join('\n')}
\`\`\`

## 开发策略
${architectureDesign.developmentStrategy.map(s => `- ${s}`).join('\n')}

---
*由 mg_kiro Create模式生成 - ${new Date().toISOString()}*
`;

    await fs.writeFile(archFilePath, archDocument, 'utf8');

    // 保存模块结构文档
    const moduleFileName = `module-structure-${timestamp}.md`;
    const moduleFilePath = resolve(projectPath, 'mg_kiro', 'modules', moduleFileName);
    
    const moduleDocument = `# 模块结构设计文档

## 基本信息
- **规划时间**: ${moduleStructure.plannedAt}
- **总模块数**: ${moduleStructure.summary.totalModules}
- **开发阶段**: ${moduleStructure.summary.developmentPhases}

## 核心模块
${moduleStructure.coreModules.map(m => 
`### ${m.name}
- **类型**: ${m.type}
- **功能**: ${m.function}
- **复杂度**: ${m.complexity}
- **依赖**: ${m.dependencies.join(', ')}`
).join('\n\n')}

## 业务模块
${moduleStructure.businessModules.map(m => 
`### ${m.name}
- **功能**: ${m.function}
- **优先级**: ${m.priority}`
).join('\n\n')}

## 工具模块
${moduleStructure.utilityModules.map(m => 
`### ${m.name}
- **用途**: ${m.purpose}`
).join('\n\n')}

## 配置模块
${moduleStructure.configModules.map(m => 
`### ${m.name}
- **配置类型**: ${m.configType}`
).join('\n\n')}

## 开发顺序
${moduleStructure.developmentOrder.map((phase, index) => 
`### 阶段 ${index + 1}: ${phase.name}
- **模块**: ${phase.modules.join(', ')}
- **预估时间**: ${phase.estimatedTime}`
).join('\n\n')}

---
*由 mg_kiro Create模式生成 - ${new Date().toISOString()}*
`;

    await fs.writeFile(moduleFilePath, moduleDocument, 'utf8');

    return {
        architecture: {
            fileName: archFileName,
            filePath: archFilePath
        },
        modules: {
            fileName: moduleFileName,
            filePath: moduleFilePath
        }
    };
}

/**
 * 创建新项目TODO清单
 */
async function createNewProjectTodoList(projectPath, projectName, requirement, architectureDesign, moduleStructure, services) {
    console.log('[NewProject] 创建新项目TODO清单...');

    // 构建处理计划 - 基于模块结构和开发顺序
    const batches = [];
    
    moduleStructure.developmentOrder.forEach((phase, phaseIndex) => {
        const batchFiles = [];
        
        phase.modules.forEach(moduleName => {
            // 找到对应的模块定义
            const allModules = [
                ...moduleStructure.coreModules,
                ...moduleStructure.businessModules,
                ...moduleStructure.utilityModules,
                ...moduleStructure.configModules
            ];
            
            const module = allModules.find(m => m.name === moduleName);
            if (module) {
                batchFiles.push({
                    relativePath: `src/${moduleName.toLowerCase().replace(/\s+/g, '-')}.js`,
                    name: moduleName,
                    category: module.type || 'business',
                    importance: module.priority || 50,
                    needsTrimming: false,
                    changeType: 'create',
                    complexity: module.complexity || 'medium'
                });
            }
        });
        
        if (batchFiles.length > 0) {
            batches.push({
                batchNumber: phaseIndex + 1,
                phaseName: phase.name,
                files: batchFiles
            });
        }
    });

    const processingPlan = {
        projectName,
        batches,
        developmentPhases: moduleStructure.developmentOrder.length
    };

    // 创建专门的新项目TODO选项
    const todoOptions = {
        includeAnalysisTasks: true,
        includeSummaryTasks: true,
        workflowType: 'new_project',
        customPriorities: {}
    };

    const result = await services.aiTodoManager.createProjectTodoList(
        projectPath, processingPlan, todoOptions
    );

    return result;
}

/**
 * 增强任务信息 - 为新项目任务添加上下文
 */
async function enhanceTaskWithNewProjectContext(task, projectPath, services) {
    const enhancedTask = { ...task };

    // 添加新项目上下文
    enhancedTask.projectContext = {
        projectPath,
        isNewProject: true,
        taskContext: generateNewProjectTaskContext(task),
        templateFiles: await findTemplateFiles(task),
        creationGuidance: generateCreationGuidance(task)
    };

    // 生成AI指令
    enhancedTask.aiInstructions = generateNewProjectAIInstructions(task, enhancedTask.projectContext);

    return enhancedTask;
}

/**
 * 技术栈选择逻辑
 */
function selectTechStack(requirement, options) {
    const techStack = {
        language: 'JavaScript',
        framework: 'Express.js',
        database: 'MongoDB',
        server: 'Node.js',
        tools: ['npm', 'Git'],
        primary: 'Node.js + Express'
    };

    // 基于需求调整技术栈
    if (requirement.includes('React') || requirement.includes('前端')) {
        techStack.framework = 'React + Express.js';
        techStack.tools.push('React', 'Webpack');
        techStack.primary = 'React + Node.js';
    }

    if (requirement.includes('Vue')) {
        techStack.framework = 'Vue + Express.js';
        techStack.tools.push('Vue', 'Webpack');
        techStack.primary = 'Vue + Node.js';
    }

    if (requirement.includes('Python') || requirement.includes('Django')) {
        techStack.language = 'Python';
        techStack.framework = 'Django';
        techStack.server = 'Python/Django';
        techStack.tools = ['pip', 'virtualenv', 'Git'];
        techStack.primary = 'Python Django';
    }

    return techStack;
}

function selectArchitecturePattern(requirement) {
    if (requirement.includes('微服务') || requirement.includes('分布式')) {
        return 'Microservices Architecture';
    }
    if (requirement.includes('单页') || requirement.includes('SPA')) {
        return 'SPA + API Architecture';
    }
    return 'MVC Architecture';
}

function designCoreComponents(requirement) {
    const components = [
        {
            name: 'Application Core',
            type: 'core',
            responsibility: '应用程序主入口和核心配置',
            technology: 'Node.js/Express'
        },
        {
            name: 'Router Module',
            type: 'routing',
            responsibility: 'HTTP路由和API端点管理',
            technology: 'Express Router'
        },
        {
            name: 'Data Access Layer',
            type: 'data',
            responsibility: '数据访问和持久化',
            technology: 'MongoDB/Mongoose'
        }
    ];

    // 基于需求添加特定组件
    if (requirement.includes('用户') || requirement.includes('认证')) {
        components.push({
            name: 'Authentication Module',
            type: 'auth',
            responsibility: '用户认证和授权管理',
            technology: 'JWT/Session'
        });
    }

    return components;
}

function designDataLayer(requirement) {
    return {
        storage: ['MongoDB数据库', '文件存储系统'],
        models: ['用户模型', '业务数据模型', '配置模型']
    };
}

function designApiStructure(requirement) {
    return {
        style: 'RESTful API',
        endpoints: ['/api/health', '/api/users', '/api/data']
    };
}

function designDirectoryStructure(requirement) {
    return [
        'src',
        'src/controllers',
        'src/models',
        'src/routes',
        'src/services',
        'src/utils',
        'config',
        'tests',
        'docs'
    ];
}

function generateDevelopmentStrategy(requirement) {
    return [
        '1. 搭建基础项目结构和配置',
        '2. 实现核心应用框架',
        '3. 开发数据模型和数据访问层',
        '4. 实现业务逻辑和API接口',
        '5. 添加用户界面（如需要）',
        '6. 集成测试和部署准备'
    ];
}

function estimateProjectTime(requirement) {
    const complexity = assessProjectComplexity(requirement);
    const timeMap = {
        low: '1-2周',
        medium: '2-4周',
        high: '4-8周'
    };
    return timeMap[complexity] || '2-4周';
}

function assessProjectComplexity(requirement) {
    let score = 0;
    
    if (requirement.includes('数据库')) score += 1;
    if (requirement.includes('用户') || requirement.includes('认证')) score += 1;
    if (requirement.includes('API') || requirement.includes('接口')) score += 1;
    if (requirement.includes('前端') || requirement.includes('界面')) score += 2;
    if (requirement.includes('复杂') || requirement.includes('多个')) score += 2;
    
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
}

// 模块规划函数
function planCoreModules(requirement, architectureDesign) {
    return [
        {
            name: 'App Core',
            type: 'core',
            function: '应用程序核心和启动逻辑',
            complexity: 'medium',
            dependencies: [],
            priority: 100
        },
        {
            name: 'Router',
            type: 'routing',
            function: 'HTTP路由管理',
            complexity: 'low',
            dependencies: ['App Core'],
            priority: 90
        }
    ];
}

function planBusinessModules(requirement) {
    const modules = [
        {
            name: 'Business Logic',
            function: '核心业务逻辑处理',
            priority: 80
        }
    ];

    if (requirement.includes('用户')) {
        modules.push({
            name: 'User Management',
            function: '用户管理功能',
            priority: 85
        });
    }

    return modules;
}

function planUtilityModules(requirement) {
    return [
        {
            name: 'Utils',
            purpose: '通用工具函数'
        },
        {
            name: 'Helpers',
            purpose: '业务辅助函数'
        }
    ];
}

function planConfigModules(requirement) {
    return [
        {
            name: 'App Config',
            configType: '应用程序配置'
        },
        {
            name: 'Database Config',
            configType: '数据库连接配置'
        }
    ];
}

function planModuleDependencies(requirement) {
    return {
        'App Core': [],
        'Router': ['App Core'],
        'Business Logic': ['App Core', 'Database Config']
    };
}

function planDevelopmentOrder(requirement) {
    return [
        {
            name: '基础架构阶段',
            modules: ['App Core', 'App Config'],
            estimatedTime: '2-3天'
        },
        {
            name: '路由和API阶段',
            modules: ['Router', 'Business Logic'],
            estimatedTime: '3-5天'
        },
        {
            name: '功能完善阶段',
            modules: ['User Management', 'Utils', 'Helpers'],
            estimatedTime: '3-4天'
        }
    ];
}

// 需求提取辅助函数
function extractProjectGoal(requirement) {
    return requirement.split('。')[0] || requirement.substring(0, 150) + '...';
}

function extractCoreFunctions(requirement) {
    const functions = [];
    if (requirement.includes('用户')) functions.push('用户管理系统');
    if (requirement.includes('数据')) functions.push('数据处理功能');
    if (requirement.includes('API')) functions.push('API接口服务');
    if (requirement.includes('界面')) functions.push('用户界面');
    return functions.length > 0 ? functions : ['核心业务功能'];
}

function extractTechRequirements(requirement) {
    const techReqs = [];
    if (requirement.includes('数据库')) techReqs.push('数据库系统');
    if (requirement.includes('Web')) techReqs.push('Web服务器');
    if (requirement.includes('API')) techReqs.push('RESTful API');
    return techReqs.length > 0 ? techReqs : ['Web应用技术栈'];
}

function extractPerformanceRequirements(requirement) {
    return ['响应时间 < 500ms', '支持并发用户访问', '数据处理效率优化'];
}

function extractDeploymentRequirements(requirement) {
    return ['支持容器化部署', '环境配置管理', '日志和监控'];
}

// 其他辅助函数
async function getProjectDesign(projectPath) {
    return {
        projectPath,
        message: '项目设计信息'
    };
}

async function updateProjectArchitecture(projectPath, architectureUpdates, reason) {
    return {
        updated: true,
        fileName: 'architecture-updated.md'
    };
}

async function handleArchitectureCreation(projectPath, completionData) {
    console.log(`[NewProject] 处理架构创建: ${completionData.architectureType}`);
}

function generateNewProjectTaskContext(task) {
    return `新项目任务 ${task.id} 的上下文信息`;
}

async function findTemplateFiles(task) {
    return [`模板文件1.js`, `模板文件2.js`];
}

function generateCreationGuidance(task) {
    return [
        '基于项目架构设计创建文件',
        '遵循项目约定和代码规范',
        '包含必要的注释和文档'
    ];
}

function generateNewProjectAIInstructions(task, projectContext) {
    return [
        `创建任务: ${task.title}`,
        `项目路径: ${projectContext.projectPath}`,
        '这是新项目，需要从零开始创建',
        '按照架构设计和最佳实践实现',
        '完成后调用 complete-task 接口'
    ];
}

export default createNewProjectRoutes;