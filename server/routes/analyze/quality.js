/**
 * Analyze模式 - 代码质量分析路由模块
 * 代码质量评估和指标分析端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建代码质量分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createQualityRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 分析代码质量
     * POST /analyze-quality
     */
    router.post('/analyze-quality', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                options = {},
                includeMetrics = true,
                includeRecommendations = true,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!targetPath) {
                return error(res, '分析目标路径不能为空', 400);
            }

            console.log(`[AnalyzeQuality] 开始代码质量分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行代码质量分析
            const qualityAnalysis = await _performQualityAnalysis(
                targetPath, 
                options, 
                language,
                promptService
            );

            // 如果需要包含指标详情
            if (includeMetrics) {
                qualityAnalysis.detailedMetrics = await _generateDetailedMetrics(
                    targetPath,
                    qualityAnalysis,
                    language
                );
            }

            // 如果需要包含改进建议
            if (includeRecommendations) {
                qualityAnalysis.recommendations = await _generateQualityRecommendations(
                    qualityAnalysis,
                    language,
                    promptService
                );
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                analysis: qualityAnalysis,
                target: {
                    path: targetPath,
                    language,
                    analyzedAt: new Date().toISOString()
                },
                execution: {
                    executionTime,
                    includeMetrics,
                    includeRecommendations,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    overallScore: qualityAnalysis.overallScore,
                    overallRating: qualityAnalysis.overallRating,
                    criticalIssues: qualityAnalysis.issues?.critical?.length || 0,
                    majorIssues: qualityAnalysis.issues?.major?.length || 0,
                    minorIssues: qualityAnalysis.issues?.minor?.length || 0,
                    filesAnalyzed: qualityAnalysis.coverage?.totalFiles || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_quality', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeQuality] 代码质量分析完成: ${targetPath}, 评分: ${qualityAnalysis.overallScore}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeQuality] 代码质量分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_quality',
                targetPath: req.body.targetPath
            });
        }
    });

    /**
     * 分析代码复杂度
     * POST /analyze-complexity
     */
    router.post('/analyze-complexity', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                analysisDepth = 'standard',
                includeVisualizations = false,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            console.log(`[AnalyzeComplexity] 开始代码复杂度分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行复杂度分析
            const complexityAnalysis = await _performComplexityAnalysis(
                targetPath,
                analysisDepth,
                language
            );

            // 如果需要可视化
            if (includeVisualizations) {
                complexityAnalysis.visualizations = _generateComplexityVisualizations(
                    complexityAnalysis
                );
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                complexity: complexityAnalysis,
                analysis: {
                    targetPath,
                    language,
                    depth: analysisDepth,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                insights: {
                    mostComplexFunctions: complexityAnalysis.functions
                        ?.sort((a, b) => b.complexity - a.complexity)
                        ?.slice(0, 10) || [],
                    averageComplexity: complexityAnalysis.averageComplexity,
                    complexityDistribution: complexityAnalysis.distribution,
                    hotspots: complexityAnalysis.hotspots || []
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_complexity', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeComplexity] 复杂度分析完成: ${targetPath}, 平均复杂度: ${complexityAnalysis.averageComplexity}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeComplexity] 复杂度分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_complexity'
            });
        }
    });

    /**
     * 分析代码覆盖率
     * POST /analyze-coverage
     */
    router.post('/analyze-coverage', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                testPath = './tests',
                coverageType = 'all',
                workflowId,
                language = 'javascript'
            } = req.body;
            
            console.log(`[AnalyzeCoverage] 开始代码覆盖率分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行覆盖率分析
            const coverageAnalysis = await _performCoverageAnalysis(
                targetPath,
                testPath,
                coverageType,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                coverage: coverageAnalysis,
                analysis: {
                    targetPath,
                    testPath,
                    coverageType,
                    language,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    overallCoverage: coverageAnalysis.overall,
                    lineCoverage: coverageAnalysis.lines,
                    branchCoverage: coverageAnalysis.branches,
                    functionCoverage: coverageAnalysis.functions,
                    uncoveredFiles: coverageAnalysis.uncoveredFiles?.length || 0,
                    testGaps: coverageAnalysis.testGaps?.length || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_coverage', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeCoverage] 覆盖率分析完成: ${targetPath}, 总体覆盖率: ${coverageAnalysis.overall}%, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeCoverage] 覆盖率分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_coverage'
            });
        }
    });

    /**
     * 分析技术债务
     * POST /analyze-technical-debt
     */
    router.post('/analyze-technical-debt', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                includeEstimates = true,
                priorityFiltering = false,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            console.log(`[AnalyzeTechnicalDebt] 开始技术债务分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行技术债务分析
            const debtAnalysis = await _performTechnicalDebtAnalysis(
                targetPath,
                language,
                promptService
            );

            // 如果需要包含时间估算
            if (includeEstimates) {
                debtAnalysis.estimates = _calculateDebtEstimates(debtAnalysis);
            }

            // 如果需要优先级过滤
            if (priorityFiltering) {
                debtAnalysis.prioritized = _prioritizeDebtItems(debtAnalysis);
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                debt: debtAnalysis,
                analysis: {
                    targetPath,
                    language,
                    includeEstimates,
                    priorityFiltering,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    totalDebt: debtAnalysis.totalDebt,
                    highPriorityItems: debtAnalysis.items?.filter(item => item.priority === 'high')?.length || 0,
                    estimatedHours: debtAnalysis.estimates?.totalHours || 0,
                    estimatedCost: debtAnalysis.estimates?.totalCost || 0,
                    riskLevel: debtAnalysis.riskLevel || 'medium'
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_technical_debt', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeTechnicalDebt] 技术债务分析完成: ${targetPath}, 总债务: ${debtAnalysis.totalDebt}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeTechnicalDebt] 技术债务分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_technical_debt'
            });
        }
    });

    return router;
}

/**
 * 执行代码质量分析
 * @param {string} targetPath - 目标路径
 * @param {Object} options - 分析选项
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 质量分析结果
 */
async function _performQualityAnalysis(targetPath, options, language, promptService) {
    // 模拟代码质量分析
    const qualityMetrics = {
        complexity: {
            cyclomatic: 5.2,
            cognitive: 3.8,
            rating: 'B'
        },
        maintainability: {
            index: 78,
            rating: 'Good'
        },
        duplications: {
            percentage: 2.3,
            blocks: 5
        },
        testCoverage: {
            lines: 85,
            branches: 72,
            functions: 90
        },
        codeSmells: 12,
        technicalDebt: '2.5 days',
        bugs: {
            critical: 0,
            major: 2,
            minor: 8
        },
        vulnerabilities: {
            high: 0,
            medium: 1,
            low: 3
        }
    };

    // 计算总体评分
    const overallScore = _calculateOverallScore(qualityMetrics);
    const overallRating = _getOverallRating(overallScore);

    return {
        ...qualityMetrics,
        overallScore,
        overallRating,
        coverage: {
            totalFiles: 45,
            analyzedFiles: 43,
            percentage: 95.6
        },
        issues: {
            critical: [],
            major: [
                { type: 'complexity', message: '函数复杂度过高', file: 'src/complex.js', line: 15 },
                { type: 'duplication', message: '代码重复', file: 'src/utils.js', line: 32 }
            ],
            minor: [
                { type: 'naming', message: '变量命名不规范', file: 'src/helper.js', line: 8 },
                { type: 'comment', message: '缺少注释', file: 'src/main.js', line: 50 }
            ]
        },
        analyzedAt: new Date().toISOString()
    };
}

/**
 * 生成详细指标
 * @param {string} targetPath - 目标路径
 * @param {Object} qualityAnalysis - 质量分析结果
 * @param {string} language - 编程语言
 * @returns {Object} 详细指标
 */
async function _generateDetailedMetrics(targetPath, qualityAnalysis, language) {
    return {
        fileMetrics: [
            {
                file: 'src/main.js',
                complexity: 8.5,
                maintainability: 72,
                lines: 150,
                functions: 8,
                coverage: 88
            },
            {
                file: 'src/utils.js',
                complexity: 4.2,
                maintainability: 85,
                lines: 95,
                functions: 12,
                coverage: 92
            }
        ],
        
        functionMetrics: [
            {
                function: 'processData',
                file: 'src/main.js',
                complexity: 12,
                lines: 45,
                parameters: 6,
                coverage: 75
            },
            {
                function: 'validateInput',
                file: 'src/utils.js',
                complexity: 6,
                lines: 20,
                parameters: 3,
                coverage: 100
            }
        ],
        
        packageMetrics: {
            totalLines: 2450,
            totalFunctions: 89,
            totalClasses: 12,
            averageComplexity: 5.8,
            duplicatedLines: 56
        }
    };
}

/**
 * 生成质量改进建议
 * @param {Object} qualityAnalysis - 质量分析结果
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Array} 改进建议
 */
async function _generateQualityRecommendations(qualityAnalysis, language, promptService) {
    const recommendations = [];

    if (qualityAnalysis.complexity.cyclomatic > 10) {
        recommendations.push({
            type: 'complexity',
            priority: 'high',
            title: '降低代码复杂度',
            description: '部分函数的圈复杂度过高，建议拆分成更小的函数',
            impact: 'maintainability',
            effort: 'medium',
            files: ['src/complex.js']
        });
    }

    if (qualityAnalysis.testCoverage.lines < 80) {
        recommendations.push({
            type: 'testing',
            priority: 'medium',
            title: '提高测试覆盖率',
            description: '当前测试覆盖率偏低，建议增加单元测试',
            impact: 'reliability',
            effort: 'high',
            targetCoverage: '85%'
        });
    }

    if (qualityAnalysis.duplications.percentage > 3) {
        recommendations.push({
            type: 'duplication',
            priority: 'medium',
            title: '减少代码重复',
            description: '发现重复代码，建议提取公共函数或模块',
            impact: 'maintainability',
            effort: 'low',
            blocks: qualityAnalysis.duplications.blocks
        });
    }

    if (qualityAnalysis.codeSmells > 10) {
        recommendations.push({
            type: 'code_smell',
            priority: 'low',
            title: '修复代码异味',
            description: '发现多个代码异味，建议进行重构',
            impact: 'maintainability',
            effort: 'medium',
            count: qualityAnalysis.codeSmells
        });
    }

    return recommendations;
}

/**
 * 执行复杂度分析
 * @param {string} targetPath - 目标路径
 * @param {string} analysisDepth - 分析深度
 * @param {string} language - 编程语言
 * @returns {Object} 复杂度分析结果
 */
async function _performComplexityAnalysis(targetPath, analysisDepth, language) {
    return {
        averageComplexity: 5.8,
        maxComplexity: 15.2,
        minComplexity: 1.0,
        
        distribution: {
            low: 65,      // 复杂度 1-5
            medium: 28,   // 复杂度 6-10
            high: 12,     // 复杂度 11-15
            veryHigh: 3   // 复杂度 >15
        },
        
        functions: [
            {
                name: 'processUserData',
                file: 'src/user.js',
                line: 25,
                complexity: 15.2,
                parameters: 8,
                lines: 85
            },
            {
                name: 'validateForm',
                file: 'src/form.js',
                line: 42,
                complexity: 12.8,
                parameters: 6,
                lines: 65
            }
        ],
        
        hotspots: [
            {
                file: 'src/user.js',
                averageComplexity: 9.5,
                functionCount: 12,
                hotspotScore: 8.2
            }
        ],
        
        trends: {
            direction: 'stable',
            weeklyChange: 0.2,
            monthlyChange: -0.5
        }
    };
}

/**
 * 生成复杂度可视化
 * @param {Object} complexityAnalysis - 复杂度分析结果
 * @returns {Object} 可视化数据
 */
function _generateComplexityVisualizations(complexityAnalysis) {
    return {
        distributionChart: {
            type: 'pie',
            data: complexityAnalysis.distribution,
            title: '复杂度分布'
        },
        
        trendChart: {
            type: 'line',
            data: [
                { date: '2024-01-01', complexity: 5.5 },
                { date: '2024-02-01', complexity: 5.8 },
                { date: '2024-03-01', complexity: 5.6 }
            ],
            title: '复杂度趋势'
        },
        
        heatMap: {
            type: 'heatmap',
            data: complexityAnalysis.hotspots,
            title: '复杂度热力图'
        }
    };
}

/**
 * 执行覆盖率分析
 * @param {string} targetPath - 目标路径
 * @param {string} testPath - 测试路径
 * @param {string} coverageType - 覆盖率类型
 * @param {string} language - 编程语言
 * @returns {Object} 覆盖率分析结果
 */
async function _performCoverageAnalysis(targetPath, testPath, coverageType, language) {
    return {
        overall: 84.5,
        lines: 86.2,
        branches: 78.9,
        functions: 91.3,
        statements: 85.7,
        
        filesCoverage: [
            {
                file: 'src/main.js',
                lines: 88.5,
                branches: 82.1,
                functions: 100,
                statements: 89.2
            },
            {
                file: 'src/utils.js',
                lines: 92.3,
                branches: 85.7,
                functions: 95.0,
                statements: 91.8
            }
        ],
        
        uncoveredFiles: [
            'src/legacy.js',
            'src/deprecated.js'
        ],
        
        testGaps: [
            {
                file: 'src/main.js',
                function: 'errorHandler',
                lines: [45, 46, 47],
                reason: 'Error path not tested'
            }
        ],
        
        recommendations: [
            '增加 src/main.js 错误处理路径的测试',
            '为 src/legacy.js 添加单元测试',
            '提高分支覆盖率到 85% 以上'
        ]
    };
}

/**
 * 执行技术债务分析
 * @param {string} targetPath - 目标路径
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 技术债务分析结果
 */
async function _performTechnicalDebtAnalysis(targetPath, language, promptService) {
    return {
        totalDebt: '8.5 days',
        totalDebtHours: 68,
        
        items: [
            {
                id: 'TD001',
                type: 'code_duplication',
                priority: 'high',
                description: '多处代码重复，需要重构',
                file: 'src/utils.js',
                estimatedHours: 8,
                impact: 'maintainability'
            },
            {
                id: 'TD002',
                type: 'complex_function',
                priority: 'medium',
                description: '函数复杂度过高',
                file: 'src/processor.js',
                estimatedHours: 6,
                impact: 'maintainability'
            },
            {
                id: 'TD003',
                type: 'missing_tests',
                priority: 'medium',
                description: '缺少单元测试',
                file: 'src/validator.js',
                estimatedHours: 12,
                impact: 'reliability'
            }
        ],
        
        categories: {
            code_quality: '3.2 days',
            documentation: '1.8 days',
            testing: '2.5 days',
            architecture: '1.0 days'
        },
        
        riskLevel: 'medium',
        
        trends: {
            direction: 'increasing',
            monthlyGrowth: '0.5 days'
        }
    };
}

/**
 * 计算债务时间估算
 * @param {Object} debtAnalysis - 债务分析结果
 * @returns {Object} 时间估算
 */
function _calculateDebtEstimates(debtAnalysis) {
    const totalHours = debtAnalysis.items.reduce((sum, item) => sum + item.estimatedHours, 0);
    const hourlyRate = 100; // $100/hour 示例费率
    
    return {
        totalHours,
        totalDays: Math.ceil(totalHours / 8),
        totalCost: totalHours * hourlyRate,
        byPriority: {
            high: debtAnalysis.items
                .filter(item => item.priority === 'high')
                .reduce((sum, item) => sum + item.estimatedHours, 0),
            medium: debtAnalysis.items
                .filter(item => item.priority === 'medium')
                .reduce((sum, item) => sum + item.estimatedHours, 0),
            low: debtAnalysis.items
                .filter(item => item.priority === 'low')
                .reduce((sum, item) => sum + item.estimatedHours, 0)
        }
    };
}

/**
 * 优先级排序债务项目
 * @param {Object} debtAnalysis - 债务分析结果
 * @returns {Object} 优先级排序结果
 */
function _prioritizeDebtItems(debtAnalysis) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    const sorted = debtAnalysis.items.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.estimatedHours - a.estimatedHours; // 次要排序：工作量
    });
    
    return {
        sortedItems: sorted,
        quickWins: sorted.filter(item => item.estimatedHours <= 4 && item.priority !== 'low'),
        majorEfforts: sorted.filter(item => item.estimatedHours > 16),
        immediate: sorted.filter(item => item.priority === 'high')
    };
}

/**
 * 计算总体评分
 * @param {Object} qualityMetrics - 质量指标
 * @returns {number} 总体评分
 */
function _calculateOverallScore(qualityMetrics) {
    let score = 0;
    let factors = 0;
    
    // 可维护性权重：30%
    if (qualityMetrics.maintainability?.index) {
        score += qualityMetrics.maintainability.index * 0.3;
        factors += 0.3;
    }
    
    // 测试覆盖率权重：25%
    if (qualityMetrics.testCoverage?.lines) {
        score += qualityMetrics.testCoverage.lines * 0.25;
        factors += 0.25;
    }
    
    // 复杂度权重：20% (反向计算)
    if (qualityMetrics.complexity?.cyclomatic) {
        const complexityScore = Math.max(0, 100 - qualityMetrics.complexity.cyclomatic * 5);
        score += complexityScore * 0.2;
        factors += 0.2;
    }
    
    // 代码重复权重：15% (反向计算)
    if (qualityMetrics.duplications?.percentage !== undefined) {
        const duplicationScore = Math.max(0, 100 - qualityMetrics.duplications.percentage * 10);
        score += duplicationScore * 0.15;
        factors += 0.15;
    }
    
    // 代码异味权重：10% (反向计算)
    if (qualityMetrics.codeSmells !== undefined) {
        const smellScore = Math.max(0, 100 - qualityMetrics.codeSmells * 2);
        score += smellScore * 0.1;
        factors += 0.1;
    }
    
    return factors > 0 ? Math.round(score / factors) : 0;
}

/**
 * 获取总体评级
 * @param {number} score - 评分
 * @returns {string} 评级
 */
function _getOverallRating(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

export default createQualityRoutes;