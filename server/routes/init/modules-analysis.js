/**
 * Init模式 - 第5步：深度模块分析路由模块
 * 模块详细分析和依赖关系端点
 * 从 modules.js 拆分出的模块分析专用路由
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { AIResponseHandlerService } from '../../services/ai-response-handler.js';
import { ModuleCompleteAnalyzer } from '../../analyzers/module-complete-analyzer.js';

/**
 * 创建模块分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createModulesAnalysisRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 第5步-A: 逐个模块详细分析
     * POST /analyze-modules
     */
    router.post('/analyze-modules', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[ModulesAnalysis] 开始深度模块分析: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查前置步骤完成状态
            const requiredSteps = ['step_1', 'step_2', 'step_3', 'step_4'];
            const missingSteps = requiredSteps.filter(step => !workflow.results[step]);
            
            if (missingSteps.length > 0) {
                return error(res, `前置步骤未完成: ${missingSteps.join(', ')}`, 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 5, 'running');

            // 获取文件分析结果
            const filesResult = workflow.results.step_3;
            const languageResult = workflow.results.step_2;

            // 准备AI分析数据包 - 深度模块分析
            const aiAnalysisPackage = {
                // 数据源
                filesResult,
                languageResult,
                projectPath: workflow.projectPath,
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'module-analysis.md',
                    analysisType: 'deep_module_analysis',
                    language: languageResult.detection.primaryLanguage,
                    complexity: 'comprehensive'
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    step: 5,
                    stepName: 'analyze_modules',
                    timestamp: new Date().toISOString()
                }
            };
            
            // 执行真实的模块完整分析
            const moduleAnalyzer = new ModuleCompleteAnalyzer(workflow.projectPath);
            console.log(`[ModulesAnalysis] 初始化ModuleCompleteAnalyzer，项目路径: ${workflow.projectPath}`);
            
            // 执行完整模块分析
            const realAnalysisResults = await moduleAnalyzer.performCompleteModuleAnalysis();
            console.log(`[ModulesAnalysis] 完成真实分析，处理了 ${realAnalysisResults.totalFiles} 个文件`);
            
            // 转换结果为legacy格式保持向后兼容
            const moduleAnalysis = _convertModuleAnalysisResultsToLegacyFormat(
                realAnalysisResults, 
                languageResult.detection.primaryLanguage
            );

            const executionTime = Date.now() - startTime;

            // 真实模块完整分析响应数据
            const responseData = {
                // AI分析数据包 (提供给AI使用)
                aiAnalysisPackage,
                
                // 真实分析结果 (使用ModuleCompleteAnalyzer)
                analysis: moduleAnalysis,
                
                // 真实分析原始数据 (用于高级用户)
                realAnalysisResults: {
                    analysisStrategy: realAnalysisResults.analysisStrategy,
                    totalFiles: realAnalysisResults.totalFiles,
                    successfulAnalyses: realAnalysisResults.successfulAnalyses,
                    failedAnalyses: realAnalysisResults.failedAnalyses,
                    processingStatistics: realAnalysisResults.processingStatistics
                },
                
                // 执行信息
                execution: {
                    mode: 'real-complete-analysis',
                    executionTime,
                    modulesAnalyzed: moduleAnalysis.modules.length,
                    filesProcessed: realAnalysisResults.totalFiles,
                    successfulAnalyses: realAnalysisResults.successfulAnalyses,
                    dependenciesFound: moduleAnalysis.dependencies.totalConnections,
                    timestamp: new Date().toISOString(),
                    analysisStrategy: 'complete-module-content-reading',
                    chunkedFiles: realAnalysisResults.moduleAnalyses.filter(m => m.chunked).length,
                    aiAnalysisTemplate: 'module-analysis.md'
                },
                
                // 工作流信息
                workflow: {
                    workflowId,
                    step: 5,
                    stepName: 'analyze_modules',
                    previousStepsCompleted: requiredSteps,
                    mode: 'ai-driven-refactor'
                },
                
                // 摘要信息 (基于模拟数据)
                summary: {
                    totalModules: moduleAnalysis.modules.length,
                    coreModules: moduleAnalysis.modules.filter(m => m.category === 'core').length,
                    businessModules: moduleAnalysis.modules.filter(m => m.category === 'business').length,
                    utilityModules: moduleAnalysis.modules.filter(m => m.category === 'utility').length,
                    averageComplexity: moduleAnalysis.statistics.averageComplexity
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 5, 'completed', {
                ...responseData,
                aiAnalysisPackage // 包含AI分析数据包
            });

            console.log(`[ModulesAnalysis] 真实完整模块分析完成: ${executionTime}ms`);
            console.log(`[ModulesAnalysis] - 处理文件: ${realAnalysisResults.totalFiles} 个`);
            console.log(`[ModulesAnalysis] - 成功分析: ${realAnalysisResults.successfulAnalyses} 个`);
            console.log(`[ModulesAnalysis] - 失败分析: ${realAnalysisResults.failedAnalyses} 个`);
            console.log(`[ModulesAnalysis] - 分片处理: ${realAnalysisResults.moduleAnalyses.filter(m => m.chunked).length} 个大文件`);
            console.log(`[ModulesAnalysis] - 分析策略: ${realAnalysisResults.analysisStrategy}`);
            console.log(`[ModulesAnalysis] - 转换模块: ${moduleAnalysis.modules.length} 个Legacy格式模块`);

            workflowSuccess(res, 5, 'analyze_modules', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[ModulesAnalysis] 深度模块分析失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 5, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 5,
                stepName: 'analyze_modules'
            });
        }
    });

    /**
     * 第5步-B: 获取单个模块详情
     * GET /modules-detail/:moduleId
     */
    router.get('/modules-detail/:moduleId', async (req, res) => {
        try {
            const { workflowId } = req.query;
            const { moduleId } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!moduleId) {
                return error(res, '模块ID不能为空', 400);
            }

            console.log(`[ModulesAnalysis] 获取模块详情: ${moduleId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查第5步是否完成
            const analysisResult = workflow.results.step_5;
            if (!analysisResult) {
                return error(res, '模块分析结果不存在，请先执行 POST /analyze-modules', 400);
            }

            // 查找指定模块
            const module = analysisResult.analysis.modules.find(
                m => m.id === moduleId || m.relativePath === moduleId
            );

            if (!module) {
                return error(res, `模块不存在: ${moduleId}`, 404);
            }

            // 构建详细信息
            const moduleDetail = {
                basic: {
                    id: module.id,
                    name: module.name,
                    path: module.relativePath,
                    category: module.category,
                    type: module.type
                },
                analysis: module.analysis,
                dependencies: {
                    imports: module.dependencies?.imports || [],
                    exports: module.dependencies?.exports || [],
                    internalDeps: module.dependencies?.internal || [],
                    externalDeps: module.dependencies?.external || []
                },
                metrics: module.metrics,
                interfaces: module.interfaces,
                documentation: module.documentation,
                recommendations: module.recommendations || []
            };

            workflowSuccess(res, 5, 'modules_detail', workflowId, moduleDetail, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[ModulesAnalysis] 获取模块详情失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第5步-C: 保存AI生成的模块分析结果到mg_kiro
     * POST /save-module-analysis
     */
    router.post('/save-module-analysis', async (req, res) => {
        try {
            const { workflowId, aiGeneratedContent } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!aiGeneratedContent) {
                return error(res, 'AI生成内容不能为空', 400);
            }

            console.log(`[ModulesAnalysis] 保存AI生成的模块分析结果: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            const savedFiles = [];
            const errors = [];

            try {
                // 保存modules-catalog.md
                if (aiGeneratedContent.modulesCatalog) {
                    const catalogPath = await aiHandler.saveDocument(
                        'modules-catalog',
                        'modules-catalog.md',
                        aiGeneratedContent.modulesCatalog
                    );
                    savedFiles.push(catalogPath);
                    console.log(`[ModulesAnalysis] 已保存: modules-catalog.md`);
                }

                // 保存modules-hierarchy.md
                if (aiGeneratedContent.modulesHierarchy) {
                    const hierarchyPath = await aiHandler.saveDocument(
                        'modules-catalog',
                        'modules-hierarchy.md',
                        aiGeneratedContent.modulesHierarchy
                    );
                    savedFiles.push(hierarchyPath);
                    console.log(`[ModulesAnalysis] 已保存: modules-hierarchy.md`);
                }

                // 保存modules-dependencies.md
                if (aiGeneratedContent.modulesDependencies) {
                    const depsPath = await aiHandler.saveDocument(
                        'modules-catalog',
                        'modules-dependencies.md',
                        aiGeneratedContent.modulesDependencies
                    );
                    savedFiles.push(depsPath);
                    console.log(`[ModulesAnalysis] 已保存: modules-dependencies.md`);
                }

            } catch (saveError) {
                errors.push(`文档保存失败: ${saveError.message}`);
            }

            if (savedFiles.length === 0) {
                return error(res, '没有成功保存任何文档', 500, { errors });
            }

            // 更新工作流步骤状态
            const stepResult = {
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                savedAt: new Date().toISOString(),
                step: 5,
                stepName: 'save_module_analysis'
            };

            workflowService.updateStep(workflowId, 5, 'saved', stepResult);

            console.log(`[ModulesAnalysis] 模块分析结果保存完成，共保存 ${savedFiles.length} 个文件`);

            success(res, {
                message: '模块分析结果已保存到mg_kiro文件夹',
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                workflow: {
                    workflowId,
                    step: 5,
                    stepName: 'save_module_analysis',
                    status: 'saved'
                },
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, `成功保存 ${savedFiles.length} 个模块分析文档`);
            
        } catch (err) {
            console.error('[ModulesAnalysis] 保存模块分析结果失败:', err);
            return error(res, `保存文档失败: ${err.message}`, 500, {
                step: 5,
                stepName: 'save_module_analysis'
            });
        }
    });

    return router;
}

/**
 * 转换ModuleCompleteAnalyzer结果为Legacy格式
 * 确保与现有API保持向后兼容
 */
function _convertModuleAnalysisResultsToLegacyFormat(realResults, primaryLanguage) {
    console.log(`[ModulesAnalysis] 转换 ${realResults.totalFiles} 个文件的分析结果为Legacy格式`);
    
    const modules = [];
    const dependencies = {
        graph: { nodes: [], edges: [] },
        totalConnections: 0,
        highlyConnectedModules: [],
        circularDependencies: [],
        isolatedModules: []
    };
    
    const classification = {
        byCategory: { core: [], business: [], utility: [] },
        byComplexity: { low: [], medium: [], high: [] },
        byImportance: []
    };
    
    let totalComplexity = 0;
    
    // 转换每个模块分析结果
    for (const moduleAnalysis of realResults.moduleAnalyses) {
        if (moduleAnalysis.status === 'failed') continue;
        
        const legacyModule = {
            id: _generateModuleId(moduleAnalysis.relativePath),
            name: _extractModuleName(moduleAnalysis.fileName),
            relativePath: moduleAnalysis.relativePath,
            category: _categorizeModule(moduleAnalysis.fileName, moduleAnalysis.relativePath),
            type: 'module',
            analysis: {
                language: moduleAnalysis.language || primaryLanguage,
                size: moduleAnalysis.size,
                complexity: _convertComplexityRating(moduleAnalysis.mergedAnalysis?.moduleComplexity || 'medium')
            },
            dependencies: {
                imports: moduleAnalysis.mergedAnalysis?.allImports || [],
                exports: moduleAnalysis.mergedAnalysis?.allExports || [],
                internal: [],
                external: []
            },
            metrics: {
                lines: Math.ceil(moduleAnalysis.size / 50), // 估算行数
                functions: moduleAnalysis.mergedAnalysis?.totalFunctions || 0,
                classes: moduleAnalysis.mergedAnalysis?.totalClasses || 0,
                complexity: moduleAnalysis.mergedAnalysis?.moduleComplexity || 25
            },
            interfaces: moduleAnalysis.structureAnalysis?.publicInterface || [],
            documentation: {
                hasComments: _hasDocumentation(moduleAnalysis),
                documentationLevel: _assessDocumentationLevel(moduleAnalysis)
            },
            recommendations: _generateRecommendations(moduleAnalysis)
        };
        
        modules.push(legacyModule);
        totalComplexity += legacyModule.metrics.complexity;
        
        // 分类模块
        classification.byCategory[legacyModule.category].push(legacyModule);
        
        const complexityRating = legacyModule.analysis.complexity.rating;
        classification.byComplexity[complexityRating].push(legacyModule);
        
        // 添加到图中
        dependencies.graph.nodes.push({
            id: legacyModule.id,
            label: legacyModule.name,
            type: legacyModule.category
        });
    }
    
    // 排序重要性
    classification.byImportance = modules
        .sort((a, b) => (b.metrics.complexity + b.metrics.functions) - (a.metrics.complexity + a.metrics.functions))
        .map(m => m.id);
    
    return {
        modules,
        dependencies,
        classification,
        statistics: {
            totalModules: modules.length,
            averageComplexity: Math.round(totalComplexity / modules.length) || 0,
            dependencyMetrics: {
                totalConnections: dependencies.totalConnections,
                avgConnectionsPerModule: Math.round(dependencies.totalConnections / modules.length) || 0
            }
        }
    };
}

/**
 * 辅助函数
 */
function _generateModuleId(relativePath) {
    return relativePath.replace(/[\/\.]/g, '_').replace(/_+/g, '_');
}

function _extractModuleName(fileName) {
    return fileName.replace(/\.[^/.]+$/, ""); // 移除扩展名
}

function _categorizeModule(fileName, relativePath) {
    const name = fileName.toLowerCase();
    const path = relativePath.toLowerCase();
    
    if (name.includes('index') || name.includes('main') || name.includes('app')) return 'core';
    if (name.includes('service') || name.includes('handler') || name.includes('controller')) return 'business';
    if (name.includes('util') || name.includes('helper') || name.includes('config')) return 'utility';
    if (path.includes('route') || path.includes('api')) return 'business';
    if (path.includes('service')) return 'business';
    
    return 'core';
}

function _convertComplexityRating(complexity) {
    let rating = 'medium';
    let score = 25;
    
    if (typeof complexity === 'string') {
        rating = complexity;
        switch (complexity) {
            case 'low': score = 15; break;
            case 'high': score = 45; break;
            default: score = 25; break;
        }
    } else if (typeof complexity === 'number') {
        score = complexity;
        if (score < 20) rating = 'low';
        else if (score > 35) rating = 'high';
        else rating = 'medium';
    }
    
    return { rating, score };
}

function _hasDocumentation(moduleAnalysis) {
    const comments = moduleAnalysis.mergedAnalysis?.allComments || [];
    return comments.length > 0;
}

function _assessDocumentationLevel(moduleAnalysis) {
    const comments = moduleAnalysis.mergedAnalysis?.allComments || [];
    const functions = moduleAnalysis.mergedAnalysis?.totalFunctions || 0;
    
    if (comments.length === 0) return 'none';
    if (functions > 0 && comments.length / functions > 0.5) return 'good';
    if (comments.length > 3) return 'basic';
    return 'minimal';
}

function _generateRecommendations(moduleAnalysis) {
    const recommendations = [];
    
    // 基于质量分析生成建议
    if (moduleAnalysis.qualityAnalysis?.maintainabilityIndex < 30) {
        recommendations.push('考虑重构以提高维护性');
    }
    
    if (moduleAnalysis.mergedAnalysis?.totalFunctions > 10) {
        recommendations.push('考虑拆分为多个较小的模块');
    }
    
    if (moduleAnalysis.qualityAnalysis?.documentationLevel === 'none') {
        recommendations.push('添加文档注释');
    }
    
    return recommendations;
}

/**
 * 拆分说明:
 * 
 * 从 modules.js 中提取了第5步相关的所有功能：
 * - POST /analyze-modules - 深度模块分析 (已升级使用ModuleCompleteAnalyzer)
 * - GET /modules-detail/:moduleId - 获取单个模块详情  
 * - POST /save-module-analysis - 保存AI生成的模块分析结果
 * 
 * 专注于模块分析职责，与第7步的文档生成功能完全分离
 * 日志前缀更新为 [ModulesAnalysis] 以区分功能
 * 
 * 重构更新 (Step 5):
 * - 集成了ModuleCompleteAnalyzer替换mock分析
 * - 添加了完整的结果转换函数确保向后兼容
 * - 保持原有API格式，客户端无需更改
 * - 实现了完整模块内容分析，符合用户"完整读取文件内容"需求
 */

export default createModulesAnalysisRoutes;