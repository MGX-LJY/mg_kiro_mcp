/**
 * Init模式 - 第8步：集成契约文档生成路由模块
 * 模块间调用关系、数据流向、API契约分析端点
 */

import express from 'express';
import { IntegrationAnalyzer } from '../../analyzers/integration-analyzer.js';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建集成契约路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createContractsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    // 初始化集成分析器
    const integrationAnalyzer = new IntegrationAnalyzer({
        includeInternalDeps: true,
        includeExternalDeps: true,
        analyzeApiContracts: true,
        detectDataFlow: true
    });

    /**
     * 第8步-A: 生成集成契约文档
     * POST /generate-contracts
     */
    router.post('/generate-contracts', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Contracts] 开始生成集成契约文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 验证前置步骤完成状态
            const requiredSteps = ['step_1', 'step_2', 'step_3', 'step_5'];
            const missingSteps = requiredSteps.filter(step => !workflow.results[step]);
            
            if (missingSteps.length > 0) {
                return error(res, `前置步骤未完成: ${missingSteps.join(', ')}`, 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 7, 'running'); // 第8步，索引为7

            // 执行集成契约分析
            const integrationAnalysis = await integrationAnalyzer.analyzeIntegration(workflow.results);
            
            if (!integrationAnalysis.success) {
                throw new Error(`集成分析失败: ${integrationAnalysis.error}`);
            }

            // 生成契约文档内容
            const contractDocument = await _generateContractMarkdown(
                integrationAnalysis, 
                workflow.results,
                promptService
            );

            const routeExecutionTime = Date.now() - startTime;
            const totalExecutionTime = Math.max(1, routeExecutionTime + (integrationAnalysis.analysis?.executionTime || 0));

            // 构建响应数据
            const responseData = {
                analysis: integrationAnalysis,
                document: {
                    type: 'integration-contracts',
                    content: contractDocument.content,
                    metadata: contractDocument.metadata,
                    sections: contractDocument.sections
                },
                generation: {
                    executionTime: totalExecutionTime,
                    analysisTime: integrationAnalysis.analysis.executionTime,
                    templateUsed: 'integration-contracts',
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 8,
                    stepName: 'generate_contracts',
                    previousStepsCompleted: requiredSteps
                },
                summary: {
                    totalModules: integrationAnalysis.analysis.statistics.totalModules,
                    totalRelations: integrationAnalysis.analysis.statistics.totalRelations,
                    integrationPoints: integrationAnalysis.analysis.statistics.integrationPoints,
                    apiContracts: integrationAnalysis.analysis.statistics.apiContracts,
                    dataFlows: integrationAnalysis.analysis.statistics.dataFlows,
                    externalDependencies: integrationAnalysis.analysis.statistics.externalDependencies,
                    recommendationsCount: integrationAnalysis.recommendations.length,
                    risksCount: integrationAnalysis.risks.length
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 7, 'completed', responseData);

            console.log(`[Contracts] 集成契约文档生成完成: ${totalExecutionTime}ms`);
            console.log(`[Contracts] - 模块数量: ${responseData.summary.totalModules}`);
            console.log(`[Contracts] - 集成点: ${responseData.summary.integrationPoints}`);
            console.log(`[Contracts] - API契约: ${responseData.summary.apiContracts}`);

            workflowSuccess(res, 8, 'generate_contracts', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Contracts] 生成集成契约文档失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 7, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 8,
                stepName: 'generate_contracts'
            });
        }
    });

    /**
     * 第8步-B: 获取集成契约文档
     * GET /contracts
     */
    router.get('/contracts', async (req, res) => {
        try {
            const { workflowId, format = 'json' } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Contracts] 获取集成契约文档: ${workflowId}, 格式: ${format}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查第8步是否完成
            const contractsResult = workflow.results.step_8;
            if (!contractsResult) {
                return error(res, '集成契约文档未生成，请先执行 POST /generate-contracts', 400);
            }

            let responseData;

            switch (format.toLowerCase()) {
                case 'markdown':
                case 'md':
                    // 返回Markdown格式的文档内容
                    responseData = {
                        format: 'markdown',
                        content: contractsResult.document.content,
                        metadata: contractsResult.document.metadata,
                        filename: 'integration-contracts.md'
                    };
                    break;

                case 'summary':
                    // 返回摘要信息
                    responseData = {
                        format: 'summary',
                        summary: contractsResult.summary || {},
                        metadata: contractsResult.document?.metadata || {},
                        generation: contractsResult.generation || {}
                    };
                    break;

                case 'json':
                default:
                    // 返回完整的JSON数据
                    responseData = {
                        format: 'json',
                        analysis: contractsResult.analysis,
                        document: contractsResult.document,
                        summary: contractsResult.summary,
                        generation: contractsResult.generation,
                        workflow: contractsResult.workflow
                    };
                    break;
            }

            // 添加访问信息
            responseData.access = {
                workflowId,
                accessTime: new Date().toISOString(),
                step: 8,
                stepName: 'contracts'
            };

            workflowSuccess(res, 8, 'contracts', workflowId, responseData, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Contracts] 获取集成契约文档失败:', err);
            error(res, err.message, 500, {
                step: 8,
                stepName: 'contracts'
            });
        }
    });

    /**
     * 第8步-C: 获取集成关系图数据
     * GET /relations
     */
    router.get('/relations', async (req, res) => {
        try {
            const { workflowId, type = 'modules' } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Contracts] 获取集成关系图: ${workflowId}, 类型: ${type}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            const contractsResult = workflow.results.step_8;
            if (!contractsResult) {
                return error(res, '集成契约分析结果不存在', 400);
            }

            let relationData;

            switch (type.toLowerCase()) {
                case 'modules':
                    const moduleRelations = contractsResult.analysis.moduleRelations || { modules: [], relations: [], statistics: {} };
                    relationData = {
                        type: 'module-relations',
                        nodes: moduleRelations.modules || [],
                        edges: moduleRelations.relations || [],
                        statistics: moduleRelations.statistics || {}
                    };
                    break;

                case 'integration':
                    const integrationPoints = contractsResult.analysis.integrationPoints || [];
                    relationData = {
                        type: 'integration-points',
                        points: integrationPoints,
                        count: integrationPoints.length
                    };
                    break;

                case 'dataflow':
                    const dataFlow = contractsResult.analysis.dataFlow || { flows: [], flowsByType: {}, statistics: {} };
                    relationData = {
                        type: 'data-flow',
                        flows: dataFlow.flows || [],
                        flowsByType: dataFlow.flowsByType || {},
                        statistics: dataFlow.statistics || {}
                    };
                    break;

                case 'dependencies':
                    const externalDependencies = contractsResult.analysis.externalDependencies || { dependencies: [], securityRisks: [], statistics: {} };
                    relationData = {
                        type: 'external-dependencies',
                        dependencies: externalDependencies.dependencies || [],
                        securityRisks: externalDependencies.securityRisks || [],
                        statistics: externalDependencies.statistics || {}
                    };
                    break;

                default:
                    return error(res, `不支持的关系图类型: ${type}`, 400);
            }

            success(res, {
                ...relationData,
                metadata: {
                    workflowId,
                    requestedType: type,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('[Contracts] 获取集成关系图失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 生成契约文档Markdown内容
 * @param {Object} integrationAnalysis - 集成分析结果
 * @param {Object} workflowResults - 工作流结果
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 文档内容
 * @private
 */
async function _generateContractMarkdown(integrationAnalysis, workflowResults, promptService) {
    const { analysis, moduleRelations, integrationPoints, apiContracts, dataFlow, externalDependencies } = integrationAnalysis;
    const projectName = workflowResults.step_1?.projectPath?.split('/').pop() || 'Unknown Project';
    const primaryLanguage = workflowResults.step_2?.detection?.primaryLanguage || 'Unknown';
    
    // 准备模板变量
    const templateVars = {
        // 项目基本信息
        project_name: projectName,
        project_path: workflowResults.step_1?.projectPath || '',
        primary_language: primaryLanguage,
        generated_at: new Date().toISOString(),
        
        // 统计数据
        total_modules: analysis?.statistics?.totalModules || 0,
        total_relations: analysis?.statistics?.totalRelations || 0,
        integration_points_count: analysis?.statistics?.integrationPoints || 0,
        api_contracts_count: analysis?.statistics?.apiContracts || 0,
        data_flows_count: analysis?.statistics?.dataFlows || 0,
        external_deps_count: analysis?.statistics?.externalDependencies || 0,
        
        // 核心数据
        module_relations: moduleRelations || {},
        integration_points: integrationPoints || [],
        api_contracts: apiContracts || {},
        data_flow: dataFlow || {},
        external_dependencies: externalDependencies || {},
        
        // 分析结果
        recommendations: integrationAnalysis.recommendations || [],
        risks: integrationAnalysis.risks || [],
        
        // 概览描述
        project_overview: _generateProjectOverview(integrationAnalysis, workflowResults),
        architecture_summary: _generateArchitectureSummary(integrationAnalysis, workflowResults)
    };

    // 尝试加载契约文档模板
    try {
        const contractTemplate = await promptService.loadPrompt(
            'templates',
            'integration-contracts',
            templateVars
        );
        
        if (contractTemplate && contractTemplate.content) {
            return {
                content: contractTemplate.content,
                metadata: {
                    templateUsed: 'integration-contracts',
                    variables: Object.keys(templateVars),
                    generatedAt: new Date().toISOString()
                },
                sections: _extractSections(contractTemplate.content)
            };
        }
    } catch (templateError) {
        console.warn('[Contracts] 模板加载失败，使用内置生成器:', templateError.message);
    }

    // 使用内置文档生成器
    const builtinDocument = _generateBuiltinContractDocument(templateVars);
    
    return {
        content: builtinDocument,
        metadata: {
            templateUsed: 'builtin',
            variables: Object.keys(templateVars),
            generatedAt: new Date().toISOString()
        },
        sections: _extractSections(builtinDocument)
    };
}

/**
 * 生成项目概览
 * @param {Object} integrationAnalysis - 集成分析
 * @param {Object} workflowResults - 工作流结果
 * @returns {string} 项目概览
 * @private
 */
function _generateProjectOverview(integrationAnalysis, workflowResults) {
    const projectName = workflowResults.step_1?.projectPath?.split('/').pop() || '未知项目';
    const primaryLanguage = workflowResults.step_2?.detection?.primaryLanguage || '未知语言';
    const stats = integrationAnalysis.analysis?.statistics || {};
    
    return `${projectName} 是一个基于 ${primaryLanguage} 的项目，包含 ${stats.totalModules || 0} 个模块，` +
           `${stats.integrationPoints || 0} 个集成点，${stats.apiContracts || 0} 个API契约。` +
           `系统具有 ${stats.dataFlows || 0} 个数据流和 ${stats.externalDependencies || 0} 个外部依赖。`;
}

/**
 * 生成架构摘要
 * @param {Object} integrationAnalysis - 集成分析
 * @param {Object} workflowResults - 工作流结果
 * @returns {string} 架构摘要
 * @private
 */
function _generateArchitectureSummary(integrationAnalysis, workflowResults) {
    const relations = integrationAnalysis.moduleRelations?.relations || [];
    const strongRelations = relations.filter(r => r.strength > 0.7).length;
    const weakRelations = relations.filter(r => r.strength < 0.3).length;
    
    return `系统架构包含 ${relations.length} 个模块间关系，其中 ${strongRelations} 个强耦合关系，` +
           `${weakRelations} 个松耦合关系。整体架构${strongRelations > relations.length * 0.3 ? '耦合度较高' : '结构良好'}。`;
}

/**
 * 生成内置契约文档
 * @param {Object} vars - 模板变量
 * @returns {string} 文档内容
 * @private
 */
function _generateBuiltinContractDocument(vars) {
    return `# ${vars.project_name} - 集成契约文档

## 项目概览

**项目名称**: ${vars.project_name}  
**主要语言**: ${vars.primary_language}  
**生成时间**: ${vars.generated_at}  
**项目路径**: ${vars.project_path}

${vars.project_overview}

## 系统架构摘要

${vars.architecture_summary}

### 核心指标

- **总模块数**: ${vars.total_modules}
- **模块关系**: ${vars.total_relations}
- **集成点**: ${vars.integration_points_count}
- **API契约**: ${vars.api_contracts_count}
- **数据流**: ${vars.data_flows_count}
- **外部依赖**: ${vars.external_deps_count}

## 模块关系图

### 模块列表

${vars.module_relations.modules.map(m => 
    `- **${m.name}** (${m.category}): \`${m.path}\``
).join('\n')}

### 关系统计

${Object.entries(vars.module_relations.statistics.relationTypes || {}).map(([type, count]) => 
    `- ${type}: ${count}个`
).join('\n')}

## 集成点分析

${vars.integration_points.length > 0 ? 
    vars.integration_points.map(point => 
        `### ${point.id}\n\n- **类型**: ${point.type}\n- **复杂度**: ${point.complexity}\n- **描述**: ${point.description}\n`
    ).join('\n') : 
    '未检测到明显的集成点。'
}

## API契约规范

${vars.api_contracts.contracts.length > 0 ?
    `### API统计\n\n${Object.entries(vars.api_contracts.statistics.contractTypes || {}).map(([type, count]) =>
        `- ${type}: ${count}个`
    ).join('\n')}` :
    '未检测到API契约。'
}

## 数据流向分析

### 数据流统计

- **总数据流**: ${vars.data_flow.statistics.totalFlows}
- **同步流**: ${vars.data_flow.statistics.synchronousFlows}
- **异步流**: ${vars.data_flow.statistics.asynchronousFlows}
- **双向流**: ${vars.data_flow.statistics.bidirectionalFlows}

### 数据类型

${vars.data_flow.statistics.dataTypes.map(type => `- ${type}`).join('\n')}

## 外部依赖分析

### 依赖统计

- **总依赖数**: ${vars.external_dependencies.statistics.totalDependencies}
- **关键依赖**: ${vars.external_dependencies.statistics.criticalDependencies}
- **安全风险**: ${vars.external_dependencies.statistics.securityRisks}

### 依赖类型分布

${Object.entries(vars.external_dependencies.statistics.dependencyTypes || {}).map(([type, count]) =>
    `- ${type}: ${count}个`
).join('\n')}

## 改进建议

${vars.recommendations.map((rec, index) => 
    `### ${index + 1}. ${rec.title} (${rec.priority})\n\n${rec.description}\n\n**影响**: ${rec.impact}\n`
).join('\n')}

## 风险识别

${vars.risks.map((risk, index) =>
    `### ${index + 1}. ${risk.title} (${risk.severity})\n\n${risk.description}\n\n**缓解方案**: ${risk.mitigation}\n`
).join('\n')}

## 附录

### 生成信息

- **分析时间**: ${vars.generated_at}
- **分析工具**: mg_kiro MCP Server v2.0.1
- **文档版本**: 1.0.0

---

*本文档由 mg_kiro MCP Server 自动生成，基于项目代码静态分析结果。*
`;
}

/**
 * 提取文档章节
 * @param {string} content - 文档内容
 * @returns {Array} 章节列表
 * @private
 */
function _extractSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const title = headerMatch[2];
            
            if (level <= 2) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                currentSection = {
                    title,
                    level,
                    content: []
                };
            }
        } else if (currentSection) {
            currentSection.content.push(line);
        }
    });
    
    if (currentSection) {
        sections.push(currentSection);
    }
    
    return sections.map(section => ({
        title: section.title,
        level: section.level,
        content: section.content.join('\n').trim()
    }));
}

export default createContractsRoutes;