/**
 * 已有项目功能添加工作流
 * 
 * 处理流程：
 * 1. 用户提出需求 -> 生成需求文档
 * 2. 读取现有项目文档(架构、模块、连接)
 * 3. 分析影响范围 -> 生成影响分析文档
 * 4. 创建TODO清单
 * 5. 逐步实现功能
 * 6. 更新相关文档
 */

import express from 'express';
import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import { success, error } from '../../services/response-service.js';

export function createExistingProjectRoutes(services) {
    const router = express.Router();

    // 启动已有项目功能添加流程
    router.post('/start', async (req, res) => {
        try {
            const { 
                projectPath,
                requirement,
                options = {}
            } = req.body;

            if (!projectPath || !requirement) {
                return error(res, '项目路径和需求描述必填', 400);
            }

            console.log(`[ExistingProject] 启动功能添加流程: ${projectPath}`);

            // 1. 验证项目状态
            const projectValidation = await validateProject(projectPath);
            if (!projectValidation.valid) {
                return error(res, projectValidation.message, 400);
            }

            // 2. 生成需求分析文档
            const requirementDoc = await generateRequirementDocument(
                projectPath, requirement, services
            );

            // 3. 读取现有项目文档
            const projectDocs = await readExistingDocuments(projectPath);

            // 4. 生成影响分析
            const impactAnalysis = await generateImpactAnalysis(
                requirement, projectDocs, services
            );

            // 5. 保存影响分析文档
            await saveImpactAnalysisDocument(projectPath, impactAnalysis);

            // 6. 创建TODO清单
            const todoList = await createFeatureAdditionTodoList(
                projectPath, requirement, impactAnalysis, services
            );

            return success(res, {
                workflowStarted: true,
                projectPath,
                phase: 'analysis_completed',
                
                results: {
                    requirementDocument: requirementDoc.fileName,
                    impactAnalysisDocument: impactAnalysis.fileName,
                    todoListCreated: todoList.success,
                    totalTasks: todoList.totalTasks
                },
                
                projectDocuments: projectDocs.available,
                impactSummary: impactAnalysis.summary,
                
                nextActions: [
                    '调用 /mode/create/existing-project/get-next-task 获取第一个任务',
                    '按TODO清单逐步实现功能',
                    '使用 /mode/create/existing-project/complete-task 标记任务完成'
                ],
                
                aiGuidance: {
                    currentPhase: '准备开始功能实现',
                    recommendation: 'AI需要按照TODO清单顺序执行任务，每完成一个任务后标记完成',
                    warningAreas: impactAnalysis.warningAreas || []
                }
            }, '已有项目功能添加流程已启动');

        } catch (err) {
            console.error('[ExistingProject] 启动流程失败:', err);
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
                        '所有功能开发任务已完成',
                        '建议运行测试验证功能',
                        '更新项目文档和README'
                    ]
                }, '🎉 所有功能添加任务已完成！');
            }

            if (!nextTask.success) {
                return error(res, nextTask.message, 400, {
                    suggestions: nextTask.suggestions
                });
            }

            // 增强任务信息 - 为现有项目任务添加上下文
            const enhancedTask = await enhanceTaskWithProjectContext(
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
            console.error('[ExistingProject] 获取任务失败:', err);
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

            // 如果任务类型是文档更新，执行相应的后处理
            if (completionData.taskType === 'update_document') {
                await handleDocumentUpdate(projectPath, completionData);
            }

            return success(res, {
                taskCompleted: true,
                completedTask: result.completedTask,
                progress: result.progress,
                nextTaskAvailable: result.nextTaskAvailable,
                recommendations: result.recommendations,
                
                nextActions: result.nextTaskAvailable ? [
                    '调用 get-next-task 获取下一个任务',
                    '继续执行开发任务'
                ] : [
                    '所有任务已完成',
                    '执行最终检查和测试'
                ]
            }, '任务已完成');

        } catch (err) {
            console.error('[ExistingProject] 完成任务失败:', err);
            return error(res, `完成任务失败: ${err.message}`, 500);
        }
    });

    // 获取项目上下文信息
    router.get('/project-context', async (req, res) => {
        try {
            const { projectPath, contextType = 'full' } = req.query;

            if (!projectPath) {
                return error(res, '项目路径必填', 400);
            }

            const context = await getProjectContext(projectPath, contextType);

            return success(res, context, '项目上下文信息获取成功');

        } catch (err) {
            return error(res, `获取项目上下文失败: ${err.message}`, 500);
        }
    });

    // 更新影响分析
    router.post('/update-impact-analysis', async (req, res) => {
        try {
            const { 
                projectPath,
                newFindings,
                updatedModules = []
            } = req.body;

            if (!projectPath) {
                return error(res, '项目路径必填', 400);
            }

            const updatedAnalysis = await updateImpactAnalysis(
                projectPath, newFindings, updatedModules
            );

            return success(res, {
                analysisUpdated: true,
                updatedAnalysis,
                fileName: updatedAnalysis.fileName
            }, '影响分析已更新');

        } catch (err) {
            return error(res, `更新影响分析失败: ${err.message}`, 500);
        }
    });

    return router;
}

/**
 * 验证项目状态
 */
async function validateProject(projectPath) {
    try {
        const projectExists = await fs.access(resolve(projectPath))
            .then(() => true)
            .catch(() => false);

        if (!projectExists) {
            return {
                valid: false,
                message: '项目路径不存在'
            };
        }

        // 检查是否有mg_kiro目录
        const mgKiroPath = resolve(projectPath, 'mg_kiro');
        const hasMgKiro = await fs.access(mgKiroPath)
            .then(() => true)
            .catch(() => false);

        return {
            valid: true,
            hasMgKiro,
            message: hasMgKiro ? '项目验证通过' : '项目存在但未初始化mg_kiro文档，将在处理过程中分析代码结构'
        };

    } catch (error) {
        return {
            valid: false,
            message: `项目验证失败: ${error.message}`
        };
    }
}

/**
 * 生成需求分析文档
 */
async function generateRequirementDocument(projectPath, requirement, services) {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `requirement-${timestamp}.md`;
    
    const createDir = resolve(projectPath, 'mg_kiro', 'create');
    await fs.mkdir(createDir, { recursive: true });
    
    const filePath = join(createDir, fileName);
    
    // 尝试使用统一模板服务
    let document = '';
    try {
        if (services.masterTemplateService) {
            const templateResult = await services.masterTemplateService.getTemplate({
                category: 'templates',
                name: 'existing-project-requirement',
                variables: {
                    projectPath,
                    requirement,
                    timestamp: new Date().toISOString(),
                    mainGoal: extractMainGoalFromRequirement(requirement),
                    features: extractFeaturesFromRequirement(requirement),
                    techRequirements: extractTechnicalRequirementsFromRequirement(requirement)
                },
                context: {
                    mode: 'create',
                    step: 'generate_requirement_doc',
                    projectPath
                }
            });
            
            if (templateResult.success) {
                document = templateResult.content;
            }
        }
    } catch (error) {
        console.warn('[ExistingProject] 模板服务失败，使用默认模板:', error.message);
    }
    
    // 如果模板服务失败，使用默认模板
    if (!document) {
        document = `# 功能添加需求文档

## 基本信息
- **项目路径**: ${projectPath}
- **创建时间**: ${new Date().toISOString()}
- **需求类型**: 功能添加/增强

## 需求描述
${requirement}

## 需求分析
### 主要目标
${extractMainGoalFromRequirement(requirement)}

### 预期功能
${extractFeaturesFromRequirement(requirement).map(f => `- ${f}`).join('\n')}

### 技术要求
${extractTechnicalRequirementsFromRequirement(requirement).map(t => `- ${t}`).join('\n')}

### 验收标准
- 功能实现符合需求描述
- 代码质量符合项目标准
- 相关文档更新完整
- 测试通过

## 影响评估
*待影响分析完成后更新*

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
 * 读取现有项目文档
 */
async function readExistingDocuments(projectPath) {
    const mgKiroPath = resolve(projectPath, 'mg_kiro');
    const documents = {
        architecture: null,
        modules: {},
        connections: {},
        available: []
    };

    try {
        // 读取架构文档
        const architectureDir = join(mgKiroPath, 'architecture');
        try {
            const archFiles = await fs.readdir(architectureDir);
            const mainArchFile = archFiles.find(f => 
                f.includes('system') || f.includes('architecture')
            );
            if (mainArchFile) {
                documents.architecture = await fs.readFile(
                    join(architectureDir, mainArchFile), 'utf8'
                );
                documents.available.push(`architecture/${mainArchFile}`);
            }
        } catch (error) {
            console.log('[ExistingProject] 未找到架构文档');
        }

        // 读取模块文档
        const modulesDir = join(mgKiroPath, 'modules');
        try {
            const moduleFiles = await fs.readdir(modulesDir);
            for (const moduleFile of moduleFiles.slice(0, 10)) { // 限制读取数量
                if (moduleFile.endsWith('.md')) {
                    documents.modules[moduleFile] = await fs.readFile(
                        join(modulesDir, moduleFile), 'utf8'
                    );
                    documents.available.push(`modules/${moduleFile}`);
                }
            }
        } catch (error) {
            console.log('[ExistingProject] 未找到模块文档');
        }

        // 读取连接文档
        const connectionsDir = join(mgKiroPath, 'connections');
        try {
            const connFiles = await fs.readdir(connectionsDir);
            for (const connFile of connFiles.slice(0, 5)) { // 限制读取数量
                if (connFile.endsWith('.md')) {
                    documents.connections[connFile] = await fs.readFile(
                        join(connectionsDir, connFile), 'utf8'
                    );
                    documents.available.push(`connections/${connFile}`);
                }
            }
        } catch (error) {
            console.log('[ExistingProject] 未找到连接文档');
        }

    } catch (error) {
        console.log('[ExistingProject] mg_kiro目录不存在，将基于代码分析');
    }

    console.log(`[ExistingProject] 读取到 ${documents.available.length} 个现有文档`);
    return documents;
}

/**
 * 生成影响分析
 */
async function generateImpactAnalysis(requirement, projectDocs, services) {
    const analysis = {
        analyzedAt: new Date().toISOString(),
        requirement: requirement.substring(0, 200) + '...',
        
        // 分析结果
        affectedModules: analyzeAffectedModules(requirement, projectDocs),
        affectedFunctions: analyzeAffectedFunctions(requirement, projectDocs),
        newModulesNeeded: analyzeNewModulesNeeded(requirement),
        
        // 风险评估
        riskLevel: assessRiskLevel(requirement, projectDocs),
        warningAreas: identifyWarningAreas(requirement, projectDocs),
        
        // 实现策略
        implementationStrategy: generateImplementationStrategy(requirement),
        
        // 文档更新需求
        documentationUpdates: identifyDocumentationUpdates(requirement, projectDocs)
    };

    // 生成summary
    analysis.summary = {
        totalAffectedModules: analysis.affectedModules.length,
        newModulesCount: analysis.newModulesNeeded.length,
        riskLevel: analysis.riskLevel,
        estimatedImpact: analysis.riskLevel === 'high' ? 'major' : 
                        analysis.riskLevel === 'medium' ? 'moderate' : 'minor'
    };

    return analysis;
}

/**
 * 保存影响分析文档
 */
async function saveImpactAnalysisDocument(projectPath, impactAnalysis) {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `impact-analysis-${timestamp}.md`;
    
    const createDir = resolve(projectPath, 'mg_kiro', 'create');
    const filePath = join(createDir, fileName);
    
    const document = `# 功能影响分析文档

## 基本信息
- **分析时间**: ${impactAnalysis.analyzedAt}
- **需求**: ${impactAnalysis.requirement}
- **风险级别**: ${impactAnalysis.riskLevel}
- **预估影响**: ${impactAnalysis.summary.estimatedImpact}

## 影响范围分析

### 受影响的模块 (${impactAnalysis.summary.totalAffectedModules}个)
${impactAnalysis.affectedModules.map(m => 
`- **${m.name}**: ${m.impact} - ${m.reason}`
).join('\n')}

### 受影响的功能
${impactAnalysis.affectedFunctions.map(f => 
`- **${f.name}**: ${f.changeType} - ${f.description}`
).join('\n')}

### 需要新增的模块 (${impactAnalysis.summary.newModulesCount}个)
${impactAnalysis.newModulesNeeded.map(n => 
`- **${n.name}**: ${n.type} - ${n.purpose}`
).join('\n')}

## 风险评估

### 风险级别
${impactAnalysis.riskLevel}

### 需要注意的区域
${impactAnalysis.warningAreas.map(w => `- ${w}`).join('\n')}

## 实现策略
${impactAnalysis.implementationStrategy.map(s => `- ${s}`).join('\n')}

## 文档更新需求
${impactAnalysis.documentationUpdates.map(d => 
`- **${d.type}**: ${d.description}`
).join('\n')}

## TODO清单
*由AI TODO管理器自动生成*

---
*由 mg_kiro Create模式生成 - ${new Date().toISOString()}*
`;

    await fs.writeFile(filePath, document, 'utf8');
    
    impactAnalysis.fileName = fileName;
    impactAnalysis.filePath = filePath;
    
    return impactAnalysis;
}

/**
 * 创建功能添加TODO清单
 */
async function createFeatureAdditionTodoList(projectPath, requirement, impactAnalysis, services) {
    console.log('[ExistingProject] 创建功能添加TODO清单...');

    // 构建处理计划
    const processingPlan = {
        batches: [
            {
                files: [
                    // 基于影响分析生成需要处理的文件列表
                    ...impactAnalysis.affectedModules.map(m => ({
                        relativePath: m.filePath || `${m.name.toLowerCase()}.js`,
                        name: m.name,
                        category: 'existing_module',
                        importance: 80,
                        needsTrimming: false,
                        changeType: m.impact
                    })),
                    ...impactAnalysis.newModulesNeeded.map(n => ({
                        relativePath: `${n.name.toLowerCase()}.js`,
                        name: n.name,
                        category: 'new_module',
                        importance: 90,
                        needsTrimming: false,
                        changeType: 'create'
                    }))
                ]
            }
        ]
    };

    // 创建专门的功能添加TODO选项
    const todoOptions = {
        includeAnalysisTasks: true,
        includeSummaryTasks: true,
        customPriorities: {},
        workflowType: 'feature_addition'
    };

    const result = await services.aiTodoManager.createProjectTodoList(
        projectPath, processingPlan, todoOptions
    );

    return result;
}

/**
 * 增强任务信息 - 为现有项目任务添加上下文
 */
async function enhanceTaskWithProjectContext(task, projectPath, services) {
    // 基础任务信息
    const enhancedTask = { ...task };

    // 添加项目上下文
    enhancedTask.projectContext = {
        projectPath,
        hasExistingDocs: true,
        taskContext: generateTaskContext(task),
        relatedFiles: await findRelatedFiles(task, projectPath),
        dependencies: identifyTaskDependencies(task)
    };

    // 生成AI指令
    enhancedTask.aiInstructions = generateAIInstructions(task, enhancedTask.projectContext);

    return enhancedTask;
}

/**
 * 辅助函数实现
 */
function extractMainGoalFromRequirement(requirement) {
    return requirement.split('。')[0] || requirement.substring(0, 100) + '...';
}

function extractFeaturesFromRequirement(requirement) {
    // 简单的特性提取逻辑
    const features = [];
    if (requirement.includes('添加') || requirement.includes('新增')) {
        features.push('新增功能实现');
    }
    if (requirement.includes('修改') || requirement.includes('更新')) {
        features.push('现有功能修改');
    }
    if (requirement.includes('接口') || requirement.includes('API')) {
        features.push('API接口开发');
    }
    return features.length > 0 ? features : ['核心功能开发'];
}

function extractTechnicalRequirementsFromRequirement(requirement) {
    const techReqs = [];
    if (requirement.includes('数据库')) techReqs.push('数据库操作');
    if (requirement.includes('前端')) techReqs.push('前端界面');
    if (requirement.includes('后端')) techReqs.push('后端服务');
    if (requirement.includes('API')) techReqs.push('API接口');
    return techReqs.length > 0 ? techReqs : ['标准开发技术栈'];
}

function analyzeAffectedModules(requirement, projectDocs) {
    const modules = [];
    
    // 基于关键词分析可能影响的模块
    const moduleKeywords = {
        '用户': { name: 'UserModule', impact: 'modify', reason: '用户相关功能变更' },
        '认证': { name: 'AuthModule', impact: 'modify', reason: '认证功能可能需要调整' },
        '数据': { name: 'DataModule', impact: 'extend', reason: '数据处理逻辑扩展' },
        'API': { name: 'APIModule', impact: 'extend', reason: 'API接口扩展' }
    };

    Object.entries(moduleKeywords).forEach(([keyword, module]) => {
        if (requirement.includes(keyword)) {
            modules.push({
                ...module,
                filePath: `src/${module.name.toLowerCase()}.js`
            });
        }
    });

    // 如果没有识别到特定模块，添加一个通用模块
    if (modules.length === 0) {
        modules.push({
            name: 'CoreModule',
            impact: 'extend',
            reason: '核心业务逻辑扩展',
            filePath: 'src/core.js'
        });
    }

    return modules;
}

function analyzeAffectedFunctions(requirement, projectDocs) {
    return [
        {
            name: '主要业务函数',
            changeType: '修改/扩展',
            description: '根据需求调整核心业务逻辑'
        },
        {
            name: '数据处理函数',
            changeType: '新增/修改',
            description: '处理新的数据结构或业务规则'
        }
    ];
}

function analyzeNewModulesNeeded(requirement) {
    const modules = [];
    
    if (requirement.includes('新') || requirement.includes('添加')) {
        modules.push({
            name: 'NewFeatureModule',
            type: 'service',
            purpose: '实现新功能的核心逻辑'
        });
    }

    return modules;
}

function assessRiskLevel(requirement, projectDocs) {
    let riskScore = 0;
    
    if (requirement.includes('修改') || requirement.includes('改变')) riskScore += 2;
    if (requirement.includes('核心') || requirement.includes('重要')) riskScore += 2;
    if (requirement.includes('数据库') || requirement.includes('存储')) riskScore += 1;
    if (!projectDocs.available.length) riskScore += 2; // 缺少文档增加风险
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
}

function identifyWarningAreas(requirement, projectDocs) {
    const warnings = [];
    
    if (requirement.includes('删除') || requirement.includes('移除')) {
        warnings.push('涉及删除操作，需要仔细评估影响范围');
    }
    if (requirement.includes('数据库')) {
        warnings.push('涉及数据库变更，需要考虑数据迁移和备份');
    }
    if (!projectDocs.available.length) {
        warnings.push('缺少现有文档，需要先分析代码结构');
    }
    
    return warnings;
}

function generateImplementationStrategy(requirement) {
    return [
        '1. 先分析现有代码结构和依赖关系',
        '2. 创建必要的新模块和文件',
        '3. 逐步修改现有模块，保持向后兼容',
        '4. 实现新功能的核心逻辑',
        '5. 更新相关测试和文档',
        '6. 进行集成测试验证功能正确性'
    ];
}

function identifyDocumentationUpdates(requirement, projectDocs) {
    const updates = [];
    
    updates.push({
        type: 'architecture',
        description: '更新系统架构文档，反映新增组件'
    });
    
    updates.push({
        type: 'modules',
        description: '更新或新增模块文档'
    });
    
    if (requirement.includes('API') || requirement.includes('接口')) {
        updates.push({
            type: 'api',
            description: '更新API文档，包含新增接口'
        });
    }
    
    return updates;
}

// 其他辅助函数的简化实现
async function getProjectContext(projectPath, contextType) {
    return {
        projectPath,
        contextType,
        message: '项目上下文信息'
    };
}

async function updateImpactAnalysis(projectPath, newFindings, updatedModules) {
    return {
        updated: true,
        fileName: 'impact-analysis-updated.md'
    };
}

async function handleDocumentUpdate(projectPath, completionData) {
    console.log(`[ExistingProject] 处理文档更新: ${completionData.documentType}`);
}

function generateTaskContext(task) {
    return `任务 ${task.id} 的上下文信息`;
}

async function findRelatedFiles(task, projectPath) {
    return [`相关文件1.js`, `相关文件2.js`];
}

function identifyTaskDependencies(task) {
    return [`依赖任务1`, `依赖任务2`];
}

function generateAIInstructions(task, projectContext) {
    return [
        `处理任务: ${task.title}`,
        `项目路径: ${projectContext.projectPath}`,
        '按照任务描述执行开发工作',
        '完成后调用 complete-task 接口'
    ];
}

export default createExistingProjectRoutes;