/**
 * Analyze模式 - 依赖关系分析路由模块
 * 项目依赖分析和管理端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建依赖关系分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDependenciesRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 启动依赖扫描
     * POST /deps-scan
     */
    router.post('/deps-scan', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                includeDevDependencies = true,
                checkVulnerabilities = true,
                checkOutdated = true,
                analyzeUnused = true,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!targetPath) {
                return error(res, '分析目标路径不能为空', 400);
            }

            console.log(`[DependencyScan] AI依赖分析扫描: ${targetPath}`);

            const startTime = Date.now();
            
            // 准备AI分析数据包 - 依赖分析
            const aiAnalysisPackage = {
                // 依赖分析数据
                dependencyData: {
                    targetPath,
                    language,
                    analysisScope: {
                        includeDevDependencies,
                        checkVulnerabilities,
                        checkOutdated,
                        analyzeUnused
                    },
                    scanInitiated: new Date().toISOString()
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'dependency-analysis.md',
                    documentTemplate: 'dependency-report.md',
                    analysisType: 'comprehensive_dependency_analysis',
                    analysisDepth: 'deep'
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'analyze',
                    step: 4, // 依赖分析是第4步
                    timestamp: new Date().toISOString()
                }
            };

            // AI依赖分析结果 (实际使用时由AI完成)
            const mockDependencyResult = {
                dependencyAnalysis: {
                    overallHealth: 82,
                    healthRating: 'Good',
                    dependencyTree: {
                        totalPackages: 156,
                        directDependencies: 23,
                        devDependencies: 18,
                        transitiveDependencies: 115,
                        treeDepth: 6
                    },
                    vulnerabilityAnalysis: {
                        totalVulnerabilities: 3,
                        critical: 0,
                        high: 1,
                        medium: 2,
                        low: 0,
                        vulnerablePackages: [
                            {
                                name: 'lodash',
                                version: '4.17.20',
                                severity: 'high',
                                cve: 'CVE-2021-23337',
                                description: 'Prototype pollution vulnerability',
                                fixedIn: '4.17.21',
                                patchAvailable: true
                            },
                            {
                                name: 'minimist',
                                version: '1.2.5',
                                severity: 'medium',
                                cve: 'CVE-2021-44906',
                                description: 'Prototype pollution via obj[__proto__]',
                                fixedIn: '1.2.6',
                                patchAvailable: true
                            }
                        ]
                    },
                    outdatedAnalysis: {
                        outdatedPackages: 12,
                        majorUpdates: 3,
                        minorUpdates: 6,
                        patchUpdates: 3,
                        packages: [
                            {
                                name: 'express',
                                current: '4.18.1',
                                latest: '4.19.2',
                                updateType: 'minor',
                                breaking: false,
                                security: false
                            },
                            {
                                name: 'react',
                                current: '17.0.2',
                                latest: '18.2.0',
                                updateType: 'major',
                                breaking: true,
                                security: false
                            }
                        ]
                    },
                    unusedDependencies: {
                        unusedPackages: 4,
                        potentialSavings: '2.1MB',
                        bundleSizeReduction: '8.5%',
                        packages: [
                            {
                                name: 'moment',
                                version: '2.29.1',
                                size: '289KB',
                                lastUsed: 'never',
                                confidence: 'high',
                                suggestion: 'Consider using date-fns or native Date API'
                            },
                            {
                                name: 'underscore',
                                version: '1.13.1',
                                size: '34KB',
                                lastUsed: 'never',
                                confidence: 'medium',
                                suggestion: 'Functionality available in lodash'
                            }
                        ]
                    },
                    licenseAnalysis: {
                        licenses: {
                            'MIT': 134,
                            'Apache-2.0': 12,
                            'BSD-3-Clause': 8,
                            'ISC': 2
                        },
                        conflicts: [],
                        riskLevel: 'low'
                    },
                    recommendations: [
                        '立即更新lodash到4.17.21以修复高危漏洞',
                        '考虑移除未使用的moment依赖，节省289KB空间',
                        '评估React 18升级，注意破坏性变更',
                        '建立定期依赖更新流程'
                    ]
                },
                analysisMetrics: {
                    scanAccuracy: 93,
                    coverageCompleteness: 89,
                    vulnerabilityDetectionRate: 96,
                    analysisDepth: 'comprehensive'
                },
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 4,
                    stepName: 'dependency_scan',
                    analysisId: `ai-deps-${Date.now()}`,
                    analysisDuration: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                }
            };
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, targetPath, 'analyze');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 3, 'completed', mockDependencyResult);
                }
            }
            
            const responseData = {
                // AI分析数据包 (提供给AI使用)
                aiAnalysisPackage,
                
                // 依赖分析结果
                dependencyAnalysis: mockDependencyResult.dependencyAnalysis,
                analysisMetrics: mockDependencyResult.analysisMetrics,
                
                // AI元数据
                metadata: mockDependencyResult.metadata
            };

            success(res, responseData);

            console.log(`[DependencyScan] AI依赖分析完成: ${mockDependencyResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[DependencyScan] AI依赖分析失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 获取依赖分析报告
     * GET /deps-report
     */
    router.get('/deps-report', async (req, res) => {
        try {
            const { workflowId, reportType = 'summary' } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取依赖分析结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_4) {
                return error(res, '未找到依赖分析结果，请先执行 POST /deps-scan', 404);
            }
            
            const dependencyResult = workflow.results.step_4;
            
            let report;
            if (reportType === 'detailed') {
                report = {
                    executiveSummary: {
                        overallHealth: dependencyResult.dependencyAnalysis.overallHealth,
                        healthRating: dependencyResult.dependencyAnalysis.healthRating,
                        totalPackages: dependencyResult.dependencyAnalysis.dependencyTree.totalPackages,
                        vulnerabilities: dependencyResult.dependencyAnalysis.vulnerabilityAnalysis.totalVulnerabilities,
                        outdatedPackages: dependencyResult.dependencyAnalysis.outdatedAnalysis.outdatedPackages,
                        unusedPackages: dependencyResult.dependencyAnalysis.unusedDependencies.unusedPackages
                    },
                    detailedAnalysis: dependencyResult.dependencyAnalysis,
                    actionPlan: {
                        immediateActions: dependencyResult.dependencyAnalysis.vulnerabilityAnalysis.vulnerablePackages.filter(v => v.severity === 'critical' || v.severity === 'high'),
                        scheduledUpdates: dependencyResult.dependencyAnalysis.outdatedAnalysis.packages.filter(p => !p.breaking),
                        cleanupTasks: dependencyResult.dependencyAnalysis.unusedDependencies.packages,
                        longTermGoals: dependencyResult.dependencyAnalysis.recommendations
                    },
                    qualityMetrics: dependencyResult.analysisMetrics
                };
            } else {
                report = {
                    overallHealth: dependencyResult.dependencyAnalysis.overallHealth,
                    healthRating: dependencyResult.dependencyAnalysis.healthRating,
                    totalPackages: dependencyResult.dependencyAnalysis.dependencyTree.totalPackages,
                    criticalIssues: dependencyResult.dependencyAnalysis.vulnerabilityAnalysis.critical + dependencyResult.dependencyAnalysis.vulnerabilityAnalysis.high,
                    outdatedPackages: dependencyResult.dependencyAnalysis.outdatedAnalysis.outdatedPackages,
                    unusedPackages: dependencyResult.dependencyAnalysis.unusedDependencies.unusedPackages,
                    potentialSavings: dependencyResult.dependencyAnalysis.unusedDependencies.potentialSavings,
                    topRecommendation: dependencyResult.dependencyAnalysis.recommendations[0]
                };
            }
            
            // 添加访问链接和下载选项
            report.reportMetadata = {
                generatedAt: new Date().toISOString(),
                reportType: reportType,
                downloadLinks: {
                    pdf: `/mode/analyze/deps-report/${workflowId}.pdf`,
                    json: `/mode/analyze/deps-report/${workflowId}.json`,
                    csv: `/mode/analyze/deps-report/${workflowId}.csv`
                },
                analysisTimestamp: dependencyResult.metadata.timestamp,
                analysisQuality: dependencyResult.analysisMetrics.scanAccuracy
            };

            success(res, report);
            
        } catch (err) {
            console.error('[DepsReport] 获取依赖分析报告失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 执行依赖分析 (模拟函数)
 * @param {string} targetPath - 目标路径
 * @param {Object} options - 分析选项
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 依赖分析结果
 */
async function _performDependencyAnalysis(targetPath, options, language, promptService) {
    // 在实际实现中，这里会调用AI服务进行依赖分析
    // 目前返回模拟数据
    return {
        overallHealth: 82,
        healthRating: 'Good',
        analysisCompleted: true
    };
}

/**
 * 生成依赖优化建议 (模拟函数)
 * @param {Object} dependencyAnalysis - 依赖分析结果
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 优化建议
 */
async function _generateDependencyRecommendations(dependencyAnalysis, language, promptService) {
    // 在实际实现中，这里会基于分析结果生成优化建议
    return {
        priority: 'high',
        suggestions: ['更新漏洞依赖', '移除未使用包', '优化依赖结构']
    };
}

export default createDependenciesRoutes;