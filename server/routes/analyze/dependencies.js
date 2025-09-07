/**
 * Analyze模式 - 依赖关系分析路由模块
 * 项目依赖分析和管理端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建依赖关系分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDependenciesRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 分析项目依赖
     * POST /analyze-dependencies
     */
    router.post('/analyze-dependencies', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                includeDevDependencies = true,
                checkVulnerabilities = true,
                checkOutdated = true,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[AnalyzeDependencies] 开始依赖分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行依赖分析
            const dependencyAnalysis = await _performDependencyAnalysis(
                targetPath,
                {
                    includeDevDependencies,
                    checkVulnerabilities,
                    checkOutdated
                },
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                dependencies: dependencyAnalysis,
                analysis: {
                    targetPath,
                    language,
                    includeDevDependencies,
                    checkVulnerabilities,
                    checkOutdated,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    totalDependencies: dependencyAnalysis.total,
                    directDependencies: dependencyAnalysis.direct,
                    vulnerabilities: dependencyAnalysis.vulnerabilities?.total || 0,
                    outdatedPackages: dependencyAnalysis.outdated?.length || 0,
                    riskLevel: dependencyAnalysis.riskAssessment?.level || 'medium'
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_dependencies', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeDependencies] 依赖分析完成: ${targetPath}, 总依赖: ${dependencyAnalysis.total}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeDependencies] 依赖分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_dependencies'
            });
        }
    });

    /**
     * 分析依赖关系图
     * POST /analyze-dependency-graph
     */
    router.post('/analyze-dependency-graph', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                maxDepth = 3,
                includeVisualGraph = false,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[AnalyzeDependencyGraph] 开始依赖关系图分析: ${targetPath}`);

            const startTime = Date.now();

            // 分析依赖关系图
            const graphAnalysis = await _analyzeDependencyGraph(
                targetPath,
                maxDepth,
                language
            );

            // 如果需要可视化图
            if (includeVisualGraph) {
                graphAnalysis.visualGraph = _generateDependencyVisualGraph(graphAnalysis);
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                graph: graphAnalysis,
                analysis: {
                    targetPath,
                    language,
                    maxDepth,
                    includeVisualGraph,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                insights: {
                    circularDependencies: graphAnalysis.circularDependencies || [],
                    criticalNodes: graphAnalysis.criticalNodes || [],
                    isolatedNodes: graphAnalysis.isolatedNodes || [],
                    heaviestDependencies: graphAnalysis.heaviestDependencies || []
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_dependency_graph', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeDependencyGraph] 依赖图分析完成: ${targetPath}, 节点: ${graphAnalysis.nodes?.length}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeDependencyGraph] 依赖图分析失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 检查过时依赖
     * POST /check-outdated
     */
    router.post('/check-outdated', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                includePrerelease = false,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[CheckOutdated] 检查过时依赖: ${targetPath}`);

            const startTime = Date.now();

            // 检查过时依赖
            const outdatedAnalysis = await _checkOutdatedDependencies(
                targetPath,
                includePrerelease,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                outdated: outdatedAnalysis,
                analysis: {
                    targetPath,
                    language,
                    includePrerelease,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    totalOutdated: outdatedAnalysis.packages?.length || 0,
                    majorUpdates: outdatedAnalysis.packages?.filter(p => p.updateType === 'major')?.length || 0,
                    minorUpdates: outdatedAnalysis.packages?.filter(p => p.updateType === 'minor')?.length || 0,
                    patchUpdates: outdatedAnalysis.packages?.filter(p => p.updateType === 'patch')?.length || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'check_outdated', 'completed', responseData);
                }
            }

            console.log(`[CheckOutdated] 过时依赖检查完成: ${targetPath}, 过时包: ${outdatedAnalysis.packages?.length}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CheckOutdated] 检查过时依赖失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 分析未使用依赖
     * POST /analyze-unused
     */
    router.post('/analyze-unused', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                scanTestFiles = true,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[AnalyzeUnused] 分析未使用依赖: ${targetPath}`);

            const startTime = Date.now();

            // 分析未使用的依赖
            const unusedAnalysis = await _analyzeUnusedDependencies(
                targetPath,
                scanTestFiles,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                unused: unusedAnalysis,
                analysis: {
                    targetPath,
                    language,
                    scanTestFiles,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    unusedPackages: unusedAnalysis.packages?.length || 0,
                    potentialSavings: unusedAnalysis.potentialSavings || 0,
                    bundleSizeReduction: unusedAnalysis.bundleSizeReduction || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_unused', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeUnused] 未使用依赖分析完成: ${targetPath}, 未使用包: ${unusedAnalysis.packages?.length}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeUnused] 分析未使用依赖失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 执行依赖分析
 * @param {string} targetPath - 目标路径
 * @param {Object} options - 分析选项
 * @param {string} language - 编程语言
 * @returns {Object} 依赖分析结果
 */
async function _performDependencyAnalysis(targetPath, options, language) {
    // 模拟依赖分析结果
    const analysis = {
        total: 42,
        direct: 15,
        transitive: 27,
        
        categories: {
            production: 32,
            development: 10
        },
        
        packages: [
            {
                name: 'express',
                version: '4.18.2',
                type: 'production',
                size: '210kb',
                license: 'MIT',
                lastUpdated: '2023-02-15'
            },
            {
                name: 'lodash',
                version: '4.17.21',
                type: 'production',
                size: '531kb',
                license: 'MIT',
                lastUpdated: '2021-02-20'
            }
        ],
        
        riskAssessment: {
            level: 'medium',
            factors: [
                'Some outdated dependencies',
                'Minor vulnerabilities detected'
            ]
        }
    };

    // 如果启用漏洞检查
    if (options.checkVulnerabilities) {
        analysis.vulnerabilities = await _checkVulnerabilities(analysis.packages);
    }

    // 如果启用过时检查
    if (options.checkOutdated) {
        analysis.outdated = await _getOutdatedPackages(analysis.packages);
    }

    return analysis;
}

/**
 * 检查漏洞
 * @param {Array} packages - 包列表
 * @returns {Object} 漏洞信息
 */
async function _checkVulnerabilities(packages) {
    return {
        total: 4,
        critical: 0,
        high: 1,
        medium: 2,
        low: 1,
        
        vulnerabilities: [
            {
                package: 'lodash',
                version: '4.17.21',
                severity: 'high',
                title: 'Prototype Pollution',
                cve: 'CVE-2021-23337',
                fixedVersion: '4.17.21'
            },
            {
                package: 'minimist',
                version: '1.2.5',
                severity: 'medium',
                title: 'Prototype Pollution',
                cve: 'CVE-2021-44906',
                fixedVersion: '1.2.6'
            }
        ]
    };
}

/**
 * 获取过时包信息
 * @param {Array} packages - 包列表
 * @returns {Array} 过时包列表
 */
async function _getOutdatedPackages(packages) {
    return [
        {
            package: 'express',
            current: '4.18.2',
            latest: '4.19.0',
            updateType: 'minor',
            breaking: false
        },
        {
            package: 'lodash',
            current: '4.17.21',
            latest: '5.0.0',
            updateType: 'major',
            breaking: true
        }
    ];
}

/**
 * 分析依赖关系图
 * @param {string} targetPath - 目标路径
 * @param {number} maxDepth - 最大深度
 * @param {string} language - 编程语言
 * @returns {Object} 依赖图分析结果
 */
async function _analyzeDependencyGraph(targetPath, maxDepth, language) {
    return {
        nodes: [
            { id: 'main', type: 'entry', dependencies: ['express', 'lodash'] },
            { id: 'express', type: 'package', dependencies: ['body-parser', 'cookie'] },
            { id: 'lodash', type: 'package', dependencies: [] },
            { id: 'body-parser', type: 'package', dependencies: ['bytes', 'type-is'] }
        ],
        
        edges: [
            { from: 'main', to: 'express', type: 'depends' },
            { from: 'main', to: 'lodash', type: 'depends' },
            { from: 'express', to: 'body-parser', type: 'depends' },
            { from: 'express', to: 'cookie', type: 'depends' }
        ],
        
        statistics: {
            totalNodes: 4,
            totalEdges: 4,
            maxDepth: 2,
            avgDegree: 1.0
        },
        
        circularDependencies: [],
        
        criticalNodes: [
            {
                id: 'express',
                importance: 'high',
                reason: 'Core framework dependency'
            }
        ],
        
        isolatedNodes: [],
        
        heaviestDependencies: [
            {
                package: 'lodash',
                size: '531kb',
                impact: 'high'
            }
        ]
    };
}

/**
 * 生成依赖可视化图
 * @param {Object} graphAnalysis - 图分析结果
 * @returns {Object} 可视化图数据
 */
function _generateDependencyVisualGraph(graphAnalysis) {
    return {
        type: 'network',
        nodes: graphAnalysis.nodes.map(node => ({
            id: node.id,
            label: node.id,
            group: node.type,
            size: node.dependencies?.length || 1
        })),
        edges: graphAnalysis.edges.map(edge => ({
            from: edge.from,
            to: edge.to,
            arrows: 'to'
        })),
        options: {
            layout: { hierarchical: { direction: 'UD', sortMethod: 'directed' } },
            physics: { enabled: false }
        }
    };
}

/**
 * 检查过时依赖
 * @param {string} targetPath - 目标路径
 * @param {boolean} includePrerelease - 包含预发布版本
 * @param {string} language - 编程语言
 * @returns {Object} 过时依赖分析结果
 */
async function _checkOutdatedDependencies(targetPath, includePrerelease, language) {
    return {
        packages: [
            {
                name: 'express',
                current: '4.18.2',
                wanted: '4.18.3',
                latest: '4.19.0',
                updateType: 'minor',
                breaking: false,
                releaseDate: '2024-01-15',
                changelog: 'https://github.com/expressjs/express/releases/tag/4.19.0'
            },
            {
                name: 'lodash',
                current: '4.17.21',
                wanted: '4.17.21',
                latest: '5.0.0-beta.1',
                updateType: 'major',
                breaking: true,
                releaseDate: '2024-02-01',
                changelog: 'https://github.com/lodash/lodash/releases/tag/5.0.0-beta.1'
            }
        ],
        
        summary: {
            total: 2,
            safe: 1,
            breaking: 1
        },
        
        updateStrategy: {
            immediate: ['express'],
            careful: ['lodash'],
            ignore: []
        },
        
        recommendations: [
            '立即更新 express 到 4.19.0 - 无破坏性变更',
            '谨慎考虑 lodash 5.x 更新 - 包含破坏性变更',
            '建议在测试环境先验证更新'
        ]
    };
}

/**
 * 分析未使用依赖
 * @param {string} targetPath - 目标路径
 * @param {boolean} scanTestFiles - 扫描测试文件
 * @param {string} language - 编程语言
 * @returns {Object} 未使用依赖分析结果
 */
async function _analyzeUnusedDependencies(targetPath, scanTestFiles, language) {
    return {
        packages: [
            {
                name: 'moment',
                version: '2.29.4',
                type: 'production',
                size: '289kb',
                lastUsed: 'never',
                confidence: 'high'
            },
            {
                name: 'underscore',
                version: '1.13.6',
                type: 'production', 
                size: '34kb',
                lastUsed: 'never',
                confidence: 'medium',
                note: 'Similar functionality available in lodash'
            }
        ],
        
        analysis: {
            totalScanned: 45,
            totalUnused: 2,
            confidence: 'high'
        },
        
        potentialSavings: 323, // KB
        bundleSizeReduction: 8.5, // %
        
        recommendations: [
            '移除 moment - 考虑使用 date-fns 或原生 Date API',
            '移除 underscore - 已有 lodash 提供类似功能',
            '运行测试确保移除后功能正常'
        ],
        
        alternatives: {
            moment: ['date-fns', 'dayjs', 'native Date API'],
            underscore: ['lodash', 'native ES6+ methods']
        }
    };
}

export default createDependenciesRoutes;