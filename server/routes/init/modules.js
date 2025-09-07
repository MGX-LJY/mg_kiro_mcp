/**
 * Init模式 - 第5步：深度模块分析路由模块
 * 模块详细分析和依赖关系端点
 */

import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建模块分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createModulesRoutes(services) {
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

            console.log(`[Modules] 开始深度模块分析: ${workflowId}`);

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

            // 执行深度模块分析
            const moduleAnalysis = await _performDeepModuleAnalysis(
                filesResult,
                languageResult,
                workflow.projectPath
            );

            const executionTime = Date.now() - startTime;

            // 构建响应数据
            const responseData = {
                analysis: moduleAnalysis,
                execution: {
                    executionTime,
                    modulesAnalyzed: moduleAnalysis.modules.length,
                    dependenciesFound: moduleAnalysis.dependencies.totalConnections,
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 5,
                    stepName: 'analyze_modules',
                    previousStepsCompleted: requiredSteps
                },
                summary: {
                    totalModules: moduleAnalysis.modules.length,
                    coreModules: moduleAnalysis.modules.filter(m => m.category === 'core').length,
                    businessModules: moduleAnalysis.modules.filter(m => m.category === 'business').length,
                    utilityModules: moduleAnalysis.modules.filter(m => m.category === 'utility').length,
                    complexityDistribution: _calculateComplexityDistribution(moduleAnalysis.modules)
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 5, 'completed', responseData);

            console.log(`[Modules] 深度模块分析完成: ${executionTime}ms，分析了 ${moduleAnalysis.modules.length} 个模块`);

            workflowSuccess(res, 5, 'analyze_modules', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Modules] 深度模块分析失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 5, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
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

            console.log(`[Modules] 获取模块详情: ${moduleId}`);

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
            console.error('[Modules] 获取模块详情失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 执行深度模块分析
 * @param {Object} filesResult - 文件分析结果
 * @param {Object} languageResult - 语言检测结果
 * @param {string} projectPath - 项目路径
 * @returns {Object} 模块分析结果
 */
async function _performDeepModuleAnalysis(filesResult, languageResult, projectPath) {
    const primaryLanguage = languageResult.detection.primaryLanguage;
    const modules = [];

    // 分析每个文件作为模块
    for (const file of filesResult.files) {
        const moduleAnalysis = await _analyzeModule(file, projectPath, primaryLanguage);
        modules.push(moduleAnalysis);
    }

    // 分析模块间依赖关系
    const dependencies = _analyzeDependencies(modules, filesResult.dependencies);

    // 生成模块分类和排名
    const classification = _classifyModules(modules);
    
    return {
        modules,
        dependencies,
        classification,
        statistics: {
            totalModules: modules.length,
            averageComplexity: _calculateAverageComplexity(modules),
            dependencyMetrics: _calculateDependencyMetrics(dependencies)
        }
    };
}

/**
 * 分析单个模块
 * @param {Object} file - 文件对象
 * @param {string} projectPath - 项目路径
 * @param {string} language - 主要语言
 * @returns {Object} 模块分析结果
 */
async function _analyzeModule(file, projectPath, language) {
    const fullPath = path.join(projectPath, file.relativePath);
    
    try {
        // 尝试读取文件内容（如果需要更深入的分析）
        let content = '';
        try {
            const stats = await fs.stat(fullPath);
            if (stats.size < 1024 * 100) { // 只读取小于100KB的文件
                content = await fs.readFile(fullPath, 'utf-8');
            }
        } catch (readError) {
            // 文件读取失败，使用已有的分析结果
        }

        return {
            id: _generateModuleId(file.relativePath),
            name: path.basename(file.relativePath, path.extname(file.relativePath)),
            relativePath: file.relativePath,
            category: file.category || 'unknown',
            type: file.analysis?.type || 'module',
            
            // 基础分析信息
            analysis: {
                ...file.analysis,
                language,
                size: file.content?.lines || 0,
                complexity: file.analysis?.complexity || { rating: 'unknown', score: 0 }
            },
            
            // 依赖关系
            dependencies: {
                imports: file.analysis?.dependencies || [],
                exports: file.analysis?.exports || [],
                internal: [],
                external: []
            },
            
            // 代码指标
            metrics: {
                lines: file.content?.lines || 0,
                functions: file.analysis?.functions || 0,
                classes: file.analysis?.classes || 0,
                complexity: file.analysis?.complexity?.score || 0
            },
            
            // 接口定义
            interfaces: _extractInterfaces(file.analysis, content),
            
            // 文档情况
            documentation: {
                hasComments: file.analysis?.hasComments || false,
                documentationLevel: file.analysis?.documentationLevel || 'none',
                missingDocs: file.analysis?.missingDocs || []
            },
            
            // 改进建议
            recommendations: _generateModuleRecommendations(file.analysis, language)
        };
    } catch (error) {
        console.error(`分析模块失败: ${file.relativePath}`, error);
        
        // 返回基础信息
        return {
            id: _generateModuleId(file.relativePath),
            name: path.basename(file.relativePath),
            relativePath: file.relativePath,
            category: 'unknown',
            type: 'module',
            analysis: { error: error.message },
            dependencies: { imports: [], exports: [], internal: [], external: [] },
            metrics: { lines: 0, functions: 0, classes: 0, complexity: 0 },
            interfaces: [],
            documentation: { hasComments: false, documentationLevel: 'none' },
            recommendations: []
        };
    }
}

/**
 * 分析模块间依赖关系
 * @param {Array} modules - 模块列表
 * @param {Object} dependencyGraph - 依赖图
 * @returns {Object} 依赖关系分析
 */
function _analyzeDependencies(modules, dependencyGraph) {
    return {
        graph: dependencyGraph,
        totalConnections: dependencyGraph.edges.length,
        highlyConnectedModules: _findHighlyConnectedModules(modules, dependencyGraph),
        circularDependencies: _detectCircularDependencies(dependencyGraph),
        isolatedModules: _findIsolatedModules(modules, dependencyGraph)
    };
}

/**
 * 模块分类
 * @param {Array} modules - 模块列表
 * @returns {Object} 分类结果
 */
function _classifyModules(modules) {
    const byCategory = {};
    const byComplexity = { low: [], medium: [], high: [] };
    const byImportance = modules.slice().sort((a, b) => b.metrics.complexity - a.metrics.complexity);
    
    modules.forEach(module => {
        // 按类别分类
        const category = module.category || 'unknown';
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(module);
        
        // 按复杂度分类
        const complexity = module.metrics.complexity || 0;
        if (complexity < 5) {
            byComplexity.low.push(module);
        } else if (complexity < 15) {
            byComplexity.medium.push(module);
        } else {
            byComplexity.high.push(module);
        }
    });
    
    return {
        byCategory,
        byComplexity,
        byImportance: byImportance.slice(0, 20)
    };
}

/**
 * 计算复杂度分布
 * @param {Array} modules - 模块列表
 * @returns {Object} 复杂度分布
 */
function _calculateComplexityDistribution(modules) {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    modules.forEach(module => {
        const complexity = module.metrics?.complexity || 0;
        if (complexity < 5) distribution.low++;
        else if (complexity < 15) distribution.medium++;
        else distribution.high++;
    });
    
    return distribution;
}

/**
 * 计算平均复杂度
 * @param {Array} modules - 模块列表
 * @returns {number} 平均复杂度
 */
function _calculateAverageComplexity(modules) {
    if (modules.length === 0) return 0;
    const total = modules.reduce((sum, module) => sum + (module.metrics?.complexity || 0), 0);
    return Math.round((total / modules.length) * 100) / 100;
}

/**
 * 计算依赖指标
 * @param {Object} dependencies - 依赖关系
 * @returns {Object} 依赖指标
 */
function _calculateDependencyMetrics(dependencies) {
    return {
        totalConnections: dependencies.totalConnections,
        avgConnectionsPerModule: dependencies.totalConnections / dependencies.graph.nodes.length,
        circularDependencies: dependencies.circularDependencies.length,
        isolatedModules: dependencies.isolatedModules.length
    };
}

/**
 * 生成模块ID
 * @param {string} relativePath - 相对路径
 * @returns {string} 模块ID
 */
function _generateModuleId(relativePath) {
    return relativePath.replace(/[\/\\]/g, '_').replace(/\./g, '_');
}

/**
 * 提取接口定义
 * @param {Object} analysis - 分析结果
 * @param {string} content - 文件内容
 * @returns {Array} 接口列表
 */
function _extractInterfaces(analysis, content) {
    // 基础接口提取，可以根据语言特性扩展
    const interfaces = [];
    
    if (analysis?.functions) {
        interfaces.push({
            type: 'functions',
            count: analysis.functions,
            items: analysis.functionList || []
        });
    }
    
    if (analysis?.classes) {
        interfaces.push({
            type: 'classes',
            count: analysis.classes,
            items: analysis.classList || []
        });
    }
    
    return interfaces;
}

/**
 * 生成模块改进建议
 * @param {Object} analysis - 分析结果
 * @param {string} language - 编程语言
 * @returns {Array} 建议列表
 */
function _generateModuleRecommendations(analysis, language) {
    const recommendations = [];
    
    if (analysis?.complexity?.score > 20) {
        recommendations.push({
            type: 'complexity',
            priority: 'high',
            message: '模块复杂度过高，建议重构拆分'
        });
    }
    
    if (!analysis?.hasComments) {
        recommendations.push({
            type: 'documentation',
            priority: 'medium',
            message: '缺少代码注释，建议添加文档'
        });
    }
    
    if (analysis?.dependencies?.length > 10) {
        recommendations.push({
            type: 'dependencies',
            priority: 'medium',
            message: '依赖过多，建议简化依赖关系'
        });
    }
    
    return recommendations;
}

/**
 * 查找高连接度模块
 * @param {Array} modules - 模块列表
 * @param {Object} dependencyGraph - 依赖图
 * @returns {Array} 高连接度模块
 */
function _findHighlyConnectedModules(modules, dependencyGraph) {
    const connectionCounts = new Map();
    
    dependencyGraph.edges.forEach(edge => {
        connectionCounts.set(edge.from, (connectionCounts.get(edge.from) || 0) + 1);
        connectionCounts.set(edge.to, (connectionCounts.get(edge.to) || 0) + 1);
    });
    
    return Array.from(connectionCounts.entries())
        .filter(([_, count]) => count > 5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
}

/**
 * 检测循环依赖
 * @param {Object} dependencyGraph - 依赖图
 * @returns {Array} 循环依赖列表
 */
function _detectCircularDependencies(dependencyGraph) {
    // 简化的循环依赖检测，可以实现更复杂的算法
    const cycles = [];
    const visited = new Set();
    const stack = new Set();
    
    // 这里实现一个简化版本
    return cycles;
}

/**
 * 查找孤立模块
 * @param {Array} modules - 模块列表
 * @param {Object} dependencyGraph - 依赖图
 * @returns {Array} 孤立模块
 */
function _findIsolatedModules(modules, dependencyGraph) {
    const connectedNodes = new Set();
    
    dependencyGraph.edges.forEach(edge => {
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
    });
    
    return modules.filter(module => !connectedNodes.has(module.relativePath));
}

export default createModulesRoutes;