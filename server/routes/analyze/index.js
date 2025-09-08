/**
 * Analyze模式路由索引文件
 * 聚合所有Analyze模式路由模块
 */

import express from 'express';
import { createQualityRoutes } from './quality.js';
import { createPerformanceRoutes } from './performance.js';
import { createDependenciesRoutes } from './dependencies.js';
import { createSecurityRoutes } from './security.js';
import { createReportsRoutes } from './reports.js';
import { success, error } from '../../services/response-service.js';

/**
 * 创建Analyze模式主路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} Analyze模式路由实例
 */
export function createAnalyzeModeRoutes(services) {
    const router = express.Router();

    // ========== Analyze模式子路由 ==========

    // 代码质量分析
    const qualityRouter = createQualityRoutes(services);
    router.use('/', qualityRouter);

    // 性能分析
    const performanceRouter = createPerformanceRoutes(services);
    router.use('/', performanceRouter);

    // 依赖关系分析
    const dependenciesRouter = createDependenciesRoutes(services);
    router.use('/', dependenciesRouter);

    // 安全分析
    const securityRouter = createSecurityRoutes(services);
    router.use('/', securityRouter);

    // 报告生成
    const reportsRouter = createReportsRoutes(services);
    router.use('/', reportsRouter);

    // ========== Analyze模式状态和信息端点 ==========

    /**
     * Analyze模式状态检查
     * GET /status
     */
    router.get('/status', async (req, res) => {
        try {
            const analyzeModeStatus = {
                mode: 'analyze',
                active: true,
                timestamp: new Date().toISOString(),
                
                capabilities: {
                    quality: {
                        description: '代码质量和复杂度分析',
                        endpoints: [
                            'POST /analyze-quality',
                            'POST /analyze-complexity',
                            'POST /analyze-coverage',
                            'POST /analyze-technical-debt'
                        ]
                    },
                    dependencies: {
                        description: '依赖关系和包管理分析',
                        endpoints: [
                            'POST /analyze-dependencies',
                            'POST /analyze-dependency-graph',
                            'POST /check-outdated',
                            'POST /analyze-unused'
                        ]
                    },
                    security: {
                        description: '安全漏洞和风险分析',
                        endpoints: [
                            'POST /analyze-security',
                            'POST /scan-vulnerabilities',
                            'POST /analyze-security-config',
                            'POST /generate-security-report'
                        ]
                    },
                    reports: {
                        description: '综合分析报告生成',
                        endpoints: [
                            'POST /generate-report',
                            'POST /generate-trend-report',
                            'POST /export-data',
                            'POST /generate-comparison'
                        ]
                    }
                },
                
                supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust', 'csharp'],
                
                analysisTypes: [
                    'quality', 'security', 'dependencies', 'performance', 
                    'complexity', 'coverage', 'maintainability'
                ],
                
                reportFormats: ['json', 'html', 'markdown', 'pdf', 'csv', 'xlsx'],
                
                workflows: {
                    comprehensiveAnalysis: [
                        '代码质量分析',
                        '安全漏洞扫描',
                        '依赖关系分析',
                        '生成综合报告'
                    ],
                    securityAudit: [
                        '安全漏洞扫描',
                        '依赖安全检查',
                        '配置安全分析',
                        '生成安全报告'
                    ],
                    qualityAssessment: [
                        '代码质量分析',
                        '复杂度评估',
                        '测试覆盖率分析',
                        '技术债务分析'
                    ]
                }
            };

            success(res, analyzeModeStatus);

        } catch (err) {
            console.error('[AnalyzeMode] 状态检查失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * Analyze模式帮助信息
     * GET /help
     */
    router.get('/help', async (req, res) => {
        try {
            const helpInfo = {
                mode: 'analyze',
                description: 'Analyze模式提供全方位的代码分析功能，包括质量、安全、依赖等多个维度',
                
                quickStart: {
                    qualityAnalysis: {
                        description: '执行代码质量分析',
                        example: {
                            endpoint: 'POST /mode/analyze/analyze-quality',
                            payload: {
                                targetPath: '.',
                                includeMetrics: true,
                                includeRecommendations: true,
                                language: 'javascript'
                            }
                        }
                    },
                    
                    securityScan: {
                        description: '运行安全漏洞扫描',
                        example: {
                            endpoint: 'POST /mode/analyze/analyze-security',
                            payload: {
                                targetPath: '.',
                                scanTypes: ['vulnerability', 'dependency', 'code'],
                                includeCompliance: true,
                                language: 'javascript'
                            }
                        }
                    },
                    
                    dependencyAnalysis: {
                        description: '分析项目依赖',
                        example: {
                            endpoint: 'POST /mode/analyze/analyze-dependencies',
                            payload: {
                                targetPath: '.',
                                includeDevDependencies: true,
                                checkVulnerabilities: true,
                                checkOutdated: true
                            }
                        }
                    },
                    
                    generateReport: {
                        description: '生成综合分析报告',
                        example: {
                            endpoint: 'POST /mode/analyze/generate-report',
                            payload: {
                                targetPath: '.',
                                analysisTypes: ['quality', 'security', 'dependencies'],
                                format: 'html',
                                includeCharts: true
                            }
                        }
                    }
                },
                
                bestPractices: [
                    '定期执行全面的代码分析',
                    '根据项目特点选择合适的分析维度',
                    '关注安全漏洞和依赖风险',
                    '建立质量趋势监控',
                    '将分析结果集成到CI/CD流程',
                    '及时处理高优先级问题',
                    '定期生成和审查分析报告'
                ],
                
                commonWorkflows: [
                    {
                        name: '全面质量评估',
                        steps: [
                            '1. POST /analyze-quality - 代码质量分析',
                            '2. POST /analyze-complexity - 复杂度分析',
                            '3. POST /analyze-coverage - 测试覆盖率',
                            '4. POST /analyze-technical-debt - 技术债务',
                            '5. POST /generate-report - 生成质量报告'
                        ]
                    },
                    {
                        name: '安全审计流程',
                        steps: [
                            '1. POST /analyze-security - 综合安全分析',
                            '2. POST /scan-vulnerabilities - 漏洞扫描',
                            '3. POST /analyze-dependencies (checkVulnerabilities: true)',
                            '4. POST /analyze-security-config - 配置检查',
                            '5. POST /generate-security-report - 安全报告'
                        ]
                    },
                    {
                        name: '依赖管理审查',
                        steps: [
                            '1. POST /analyze-dependencies - 依赖分析',
                            '2. POST /check-outdated - 过时包检查',
                            '3. POST /analyze-unused - 未使用包分析',
                            '4. POST /analyze-dependency-graph - 依赖图分析',
                            '5. 根据结果制定依赖更新计划'
                        ]
                    },
                    {
                        name: '项目对比分析',
                        steps: [
                            '1. 对基准版本执行分析',
                            '2. 对目标版本执行分析',
                            '3. POST /generate-comparison - 生成对比',
                            '4. 分析改进点和回归问题',
                            '5. 制定优化计划'
                        ]
                    }
                ],
                
                analysisGuides: {
                    quality: {
                        metrics: [
                            'Cyclomatic Complexity - 代码路径复杂度',
                            'Maintainability Index - 可维护性指数',
                            'Code Coverage - 测试覆盖率',
                            'Code Duplication - 代码重复率',
                            'Technical Debt - 技术债务'
                        ],
                        thresholds: {
                            complexity: 'Low: 1-5, Medium: 6-10, High: 11-15, Very High: >15',
                            coverage: 'Poor: <70%, Fair: 70-80%, Good: 80-90%, Excellent: >90%',
                            maintainability: 'Poor: <20, Fair: 20-40, Good: 40-70, Excellent: >70'
                        }
                    },
                    
                    security: {
                        categories: [
                            'Injection Flaws - 注入漏洞',
                            'Cross-Site Scripting - 跨站脚本',
                            'Authentication Issues - 认证问题',
                            'Sensitive Data Exposure - 敏感数据暴露',
                            'Security Configuration - 安全配置'
                        ],
                        priorities: {
                            critical: '立即修复 - 存在严重安全风险',
                            high: '高优先级 - 一周内修复',
                            medium: '中优先级 - 一个月内修复',
                            low: '低优先级 - 下个版本修复'
                        }
                    },
                    
                    dependencies: {
                        risks: [
                            'Known Vulnerabilities - 已知漏洞',
                            'Outdated Packages - 过时包',
                            'License Issues - 许可证问题',
                            'Unmaintained Dependencies - 无人维护',
                            'Circular Dependencies - 循环依赖'
                        ],
                        strategies: [
                            '定期更新依赖到最新稳定版本',
                            '移除不必要的依赖',
                            '监控依赖安全公告',
                            '使用dependabot等自动化工具',
                            '建立依赖审批流程'
                        ]
                    }
                }
            };

            success(res, helpInfo);

        } catch (err) {
            console.error('[AnalyzeMode] 获取帮助信息失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * Analyze模式分析预设
     * GET /analysis-presets
     */
    router.get('/analysis-presets', async (req, res) => {
        try {
            const presets = {
                quick: {
                    name: '快速分析',
                    description: '基础质量和安全检查，适合快速评估',
                    duration: '2-5分钟',
                    analyses: [
                        { type: 'quality', config: { includeMetrics: false, includeRecommendations: true } },
                        { type: 'security', config: { scanTypes: ['vulnerability'], includeCompliance: false } },
                        { type: 'dependencies', config: { checkVulnerabilities: true, checkOutdated: false } }
                    ]
                },
                
                standard: {
                    name: '标准分析',
                    description: '全面的质量、安全和依赖分析',
                    duration: '5-15分钟',
                    analyses: [
                        { type: 'quality', config: { includeMetrics: true, includeRecommendations: true } },
                        { type: 'complexity', config: { analysisDepth: 'standard' } },
                        { type: 'security', config: { scanTypes: ['vulnerability', 'dependency'], includeCompliance: true } },
                        { type: 'dependencies', config: { includeDevDependencies: true, checkVulnerabilities: true, checkOutdated: true } }
                    ]
                },
                
                comprehensive: {
                    name: '全面分析',
                    description: '最详细的分析，包含所有维度和深度分析',
                    duration: '15-30分钟',
                    analyses: [
                        { type: 'quality', config: { includeMetrics: true, includeRecommendations: true } },
                        { type: 'complexity', config: { analysisDepth: 'deep', includeVisualizations: true } },
                        { type: 'coverage', config: { coverageType: 'all' } },
                        { type: 'technical-debt', config: { includeEstimates: true, priorityFiltering: true } },
                        { type: 'security', config: { scanTypes: ['vulnerability', 'dependency', 'code'], includeCompliance: true } },
                        { type: 'dependencies', config: { includeDevDependencies: true, checkVulnerabilities: true, checkOutdated: true } },
                        { type: 'dependency-graph', config: { maxDepth: 5, includeVisualGraph: true } }
                    ]
                },
                
                security_focus: {
                    name: '安全专项',
                    description: '专注于安全漏洞和风险分析',
                    duration: '10-20分钟',
                    analyses: [
                        { type: 'security', config: { scanTypes: ['vulnerability', 'dependency', 'code'], includeCompliance: true } },
                        { type: 'dependencies', config: { checkVulnerabilities: true, checkOutdated: true } },
                        { type: 'security-config', config: { configTypes: ['env', 'cors', 'headers', 'auth'] } }
                    ]
                },
                
                maintenance: {
                    name: '维护检查',
                    description: '关注技术债务和依赖管理',
                    duration: '8-15分钟',
                    analyses: [
                        { type: 'technical-debt', config: { includeEstimates: true, priorityFiltering: true } },
                        { type: 'dependencies', config: { includeDevDependencies: true, checkOutdated: true } },
                        { type: 'unused-dependencies', config: { scanTestFiles: true } },
                        { type: 'complexity', config: { analysisDepth: 'standard' } }
                    ]
                }
            };

            success(res, presets);

        } catch (err) {
            console.error('[AnalyzeMode] 获取分析预设失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 执行预设分析
     * POST /run-preset
     */
    router.post('/run-preset', async (req, res) => {
        try {
            const { 
                preset = 'standard',
                targetPath = '.',
                language = 'javascript',
                workflowId
            } = req.body;

            console.log(`[RunPreset] 执行预设分析: ${preset}, 路径: ${targetPath}`);

            const startTime = Date.now();

            // 获取预设配置
            const presetConfig = await _getPresetConfig(preset);
            if (!presetConfig) {
                return error(res, `未知的预设: ${preset}`, 400);
            }

            // 执行预设分析
            const analysisResults = await _executePresetAnalysis(
                presetConfig,
                targetPath,
                language,
                services
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                preset: presetConfig.name,
                results: analysisResults,
                analysis: {
                    targetPath,
                    language,
                    executionTime,
                    timestamp: new Date().toISOString(),
                    analysesRun: presetConfig.analyses.length
                },
                summary: _generatePresetSummary(analysisResults)
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = services.workflowService.getWorkflow(workflowId);
                if (workflow) {
                    services.workflowService.updateStep(workflowId, 'run_preset', 'completed', responseData);
                }
            }

            console.log(`[RunPreset] 预设分析完成: ${preset}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[RunPreset] 执行预设分析失败:', err);
            error(res, err.message, 500);
        }
    });

    // ========== 错误处理 ==========
    
    // Analyze模式专用错误处理
    router.use((err, req, res, next) => {
        console.error('[AnalyzeMode] Route error:', err);
        
        // 根据错误类型返回不同的错误信息
        if (err.name === 'AnalysisTimeoutError') {
            return error(res, '分析超时', 408, {
                mode: 'analyze',
                suggestion: '尝试减少分析范围或使用更轻量的预设'
            });
        }
        
        if (err.name === 'UnsupportedLanguageError') {
            return error(res, '不支持的编程语言', 400, {
                mode: 'analyze',
                supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust', 'csharp']
            });
        }
        
        if (err.name === 'InvalidPathError') {
            return error(res, '无效的目标路径', 400, {
                mode: 'analyze',
                suggestion: '确保路径存在且具有读取权限'
            });
        }
        
        if (err.name === 'ReportGenerationError') {
            return error(res, '报告生成失败', 500, {
                mode: 'analyze',
                suggestion: '请检查数据完整性或尝试其他格式'
            });
        }
        
        return error(res, err.message, 500, {
            mode: 'analyze',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

/**
 * 获取预设配置
 * @param {string} presetName - 预设名称
 * @returns {Object|null} 预设配置
 */
async function _getPresetConfig(presetName) {
    const presets = {
        quick: {
            name: '快速分析',
            analyses: [
                { type: 'quality', config: { includeMetrics: false } },
                { type: 'security', config: { scanTypes: ['vulnerability'] } }
            ]
        },
        standard: {
            name: '标准分析',
            analyses: [
                { type: 'quality', config: { includeMetrics: true } },
                { type: 'security', config: { scanTypes: ['vulnerability', 'dependency'] } },
                { type: 'dependencies', config: { checkVulnerabilities: true } }
            ]
        },
        comprehensive: {
            name: '全面分析',
            analyses: [
                { type: 'quality', config: { includeMetrics: true, includeRecommendations: true } },
                { type: 'complexity', config: { analysisDepth: 'deep' } },
                { type: 'security', config: { scanTypes: ['vulnerability', 'dependency', 'code'] } },
                { type: 'dependencies', config: { checkVulnerabilities: true, checkOutdated: true } }
            ]
        }
    };
    
    return presets[presetName] || null;
}

/**
 * 执行预设分析
 * @param {Object} presetConfig - 预设配置
 * @param {string} targetPath - 目标路径
 * @param {string} language - 编程语言
 * @param {Object} services - 服务
 * @returns {Object} 分析结果
 */
async function _executePresetAnalysis(presetConfig, targetPath, language, services) {
    const results = {};
    
    for (const analysis of presetConfig.analyses) {
        try {
            switch (analysis.type) {
                case 'quality':
                    results.quality = await _simulateQualityAnalysis(targetPath, analysis.config);
                    break;
                case 'security':
                    results.security = await _simulateSecurityAnalysis(targetPath, analysis.config);
                    break;
                case 'dependencies':
                    results.dependencies = await _simulateDependencyAnalysis(targetPath, analysis.config);
                    break;
                case 'complexity':
                    results.complexity = await _simulateComplexityAnalysis(targetPath, analysis.config);
                    break;
                default:
                    console.warn(`Unknown analysis type: ${analysis.type}`);
            }
        } catch (error) {
            console.error(`Analysis failed for ${analysis.type}:`, error);
            results[analysis.type] = { error: error.message };
        }
    }
    
    return results;
}

/**
 * 生成预设分析摘要
 * @param {Object} analysisResults - 分析结果
 * @returns {Object} 摘要
 */
function _generatePresetSummary(analysisResults) {
    const summary = {
        overallScore: 0,
        totalIssues: 0,
        criticalIssues: 0,
        recommendations: []
    };
    
    let scoreCount = 0;
    
    if (analysisResults.quality) {
        summary.overallScore += analysisResults.quality.overallScore || 0;
        scoreCount++;
        summary.totalIssues += analysisResults.quality.issues?.length || 0;
    }
    
    if (analysisResults.security) {
        summary.overallScore += analysisResults.security.securityScore || 0;
        scoreCount++;
        summary.criticalIssues += analysisResults.security.vulnerabilities?.critical || 0;
    }
    
    if (scoreCount > 0) {
        summary.overallScore = Math.round(summary.overallScore / scoreCount);
    }
    
    // 生成建议
    if (summary.criticalIssues > 0) {
        summary.recommendations.push('立即修复关键安全问题');
    }
    if (summary.overallScore < 70) {
        summary.recommendations.push('整体质量需要改进');
    }
    if (analysisResults.dependencies?.outdated?.length > 0) {
        summary.recommendations.push('更新过时的依赖包');
    }
    
    return summary;
}

// 模拟分析函数
async function _simulateQualityAnalysis(targetPath, config) {
    return {
        overallScore: 78,
        complexity: { average: 5.8 },
        maintainability: 82,
        issues: [
            { type: 'complexity', severity: 'medium', file: 'src/main.js' }
        ]
    };
}

async function _simulateSecurityAnalysis(targetPath, config) {
    return {
        securityScore: 75,
        vulnerabilities: { total: 5, critical: 0, high: 1, medium: 4 }
    };
}

async function _simulateDependencyAnalysis(targetPath, config) {
    return {
        total: 42,
        vulnerabilities: 3,
        outdated: config.checkOutdated ? 8 : undefined
    };
}

async function _simulateComplexityAnalysis(targetPath, config) {
    return {
        averageComplexity: 5.8,
        maxComplexity: 15.2,
        distribution: { low: 65, medium: 28, high: 7 }
    };
}

export default createAnalyzeModeRoutes;