/**
 * Fix模式路由索引文件
 * 聚合所有Fix模式路由模块
 */

import express from 'express';
import { createIssuesRoutes } from './issues.js';
import { createDiagnosisRoutes } from './diagnosis.js';
import { createFixesRoutes } from './fixes.js';
import { success, error } from '../../services/response-service.js';

/**
 * 创建Fix模式主路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} Fix模式路由实例
 */
export function createFixModeRoutes(services) {
    const router = express.Router();

    // ========== Fix模式子路由 ==========

    // 问题管理和跟踪
    const issuesRouter = createIssuesRoutes(services);
    router.use('/', issuesRouter);

    // 问题诊断和分析
    const diagnosisRouter = createDiagnosisRoutes(services);
    router.use('/', diagnosisRouter);

    // 修复应用和验证
    const fixesRouter = createFixesRoutes(services);
    router.use('/', fixesRouter);

    // ========== Fix模式状态和信息端点 ==========

    /**
     * Fix模式状态检查
     * GET /status
     */
    router.get('/status', async (req, res) => {
        try {
            const fixModeStatus = {
                mode: 'fix',
                active: true,
                timestamp: new Date().toISOString(),
                
                capabilities: {
                    issueManagement: {
                        description: '问题报告、跟踪和管理',
                        endpoints: [
                            'POST /report-issue',
                            'GET /issues',
                            'GET /issues/:issueId',
                            'PUT /issues/:issueId/status',
                            'DELETE /issues/:issueId'
                        ]
                    },
                    diagnosis: {
                        description: '问题深度分析和诊断',
                        endpoints: [
                            'POST /diagnose-issue',
                            'POST /diagnose-batch',
                            'GET /diagnosis-report/:issueId',
                            'PUT /re-diagnose/:issueId'
                        ]
                    },
                    fixing: {
                        description: '修复应用和验证',
                        endpoints: [
                            'POST /apply-fix',
                            'POST /verify-fix',
                            'POST /rollback-fix',
                            'GET /fix-history/:issueId',
                            'POST /generate-patch'
                        ]
                    }
                },
                
                supportedCategories: [
                    'bug', 'performance', 'security', 'feature', 'documentation'
                ],
                
                supportedSeverities: [
                    'critical', 'high', 'medium', 'low'
                ],
                
                supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust'],
                
                workflows: {
                    standardFix: [
                        '报告问题',
                        '诊断分析',
                        '应用修复',
                        '验证修复',
                        '关闭问题'
                    ],
                    hotfix: [
                        '报告紧急问题',
                        '快速诊断',
                        '应用热修复',
                        '立即验证',
                        '监控稳定性'
                    ],
                    complexFix: [
                        '报告复杂问题',
                        '深度诊断',
                        '制定修复计划',
                        '分阶段实施',
                        '全面验证',
                        '渐进式部署'
                    ]
                }
            };

            success(res, fixModeStatus);

        } catch (err) {
            console.error('[FixMode] 状态检查失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * Fix模式帮助信息
     * GET /help
     */
    router.get('/help', async (req, res) => {
        try {
            const helpInfo = {
                mode: 'fix',
                description: 'Fix模式帮助您系统化地报告、诊断和修复代码问题',
                
                quickStart: {
                    reportIssue: {
                        description: '报告新问题',
                        example: {
                            endpoint: 'POST /mode/fix/report-issue',
                            payload: {
                                title: '用户登录失败',
                                description: '用户点击登录按钮后没有响应',
                                severity: 'high',
                                category: 'bug',
                                stackTrace: 'Error at line 42 in auth.js',
                                language: 'javascript'
                            }
                        }
                    },
                    
                    diagnoseIssue: {
                        description: '诊断已报告的问题',
                        example: {
                            endpoint: 'POST /mode/fix/diagnose-issue',
                            payload: {
                                issueId: 'ISSUE-123456789',
                                deepAnalysis: true,
                                includeCodeAnalysis: true,
                                language: 'javascript'
                            }
                        }
                    },
                    
                    applyFix: {
                        description: '应用修复方案',
                        example: {
                            endpoint: 'POST /mode/fix/apply-fix',
                            payload: {
                                issueId: 'ISSUE-123456789',
                                fixCode: 'if (user !== null) { processLogin(user); }',
                                testChanges: true,
                                backupFiles: true
                            }
                        }
                    }
                },
                
                bestPractices: [
                    '详细描述问题症状和复现步骤',
                    '提供完整的错误堆栈跟踪',
                    '使用适当的严重程度和类别标签',
                    '在应用修复前进行充分测试',
                    '保留文件备份以便必要时回滚',
                    '验证修复后监控系统稳定性',
                    '记录修复过程和经验教训'
                ],
                
                commonWorkflows: [
                    {
                        name: '标准问题修复流程',
                        steps: [
                            '1. POST /report-issue - 报告问题',
                            '2. POST /diagnose-issue - 深度诊断',
                            '3. POST /apply-fix - 应用修复',
                            '4. POST /verify-fix - 验证修复',
                            '5. PUT /issues/:id/status - 更新状态为已解决'
                        ]
                    },
                    {
                        name: '紧急问题热修复',
                        steps: [
                            '1. POST /report-issue (severity: critical)',
                            '2. POST /diagnose-issue (快速诊断)',
                            '3. POST /apply-fix (立即修复)',
                            '4. POST /verify-fix (快速验证)',
                            '5. 监控系统稳定性'
                        ]
                    },
                    {
                        name: '批量问题处理',
                        steps: [
                            '1. POST /diagnose-batch - 批量诊断',
                            '2. 分析共同模式和优先级',
                            '3. 制定统一修复策略',
                            '4. 分批应用修复'
                        ]
                    }
                ],
                
                troubleshooting: {
                    commonErrors: [
                        {
                            error: '修复验证失败',
                            solution: '检查测试用例是否正确，考虑是否需要更新测试'
                        },
                        {
                            error: '无法重现问题',
                            solution: '收集更多环境信息和复现步骤'
                        },
                        {
                            error: '修复引入新问题',
                            solution: '立即回滚修复，重新分析问题根因'
                        }
                    ],
                    diagnosticTips: [
                        '使用日志和堆栈跟踪精确定位问题',
                        '检查相关的环境配置和依赖版本',
                        '分析相似问题的解决方案',
                        '考虑并发和异步操作的影响'
                    ]
                }
            };

            success(res, helpInfo);

        } catch (err) {
            console.error('[FixMode] 获取帮助信息失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * Fix模式统计信息
     * GET /statistics
     */
    router.get('/statistics', async (req, res) => {
        try {
            const { timeRange = '7d' } = req.query;
            
            // 这里应该从实际的问题存储中获取统计数据
            // 为了演示，返回模拟数据
            const statistics = {
                timeRange,
                period: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                },
                
                issues: {
                    total: 156,
                    new: 23,
                    inProgress: 45,
                    resolved: 78,
                    closed: 10
                },
                
                bySeverity: {
                    critical: 8,
                    high: 34,
                    medium: 89,
                    low: 25
                },
                
                byCategory: {
                    bug: 98,
                    performance: 23,
                    security: 12,
                    feature: 18,
                    documentation: 5
                },
                
                byLanguage: {
                    javascript: 67,
                    python: 34,
                    java: 28,
                    go: 15,
                    other: 12
                },
                
                resolution: {
                    averageTimeToFix: '4.2 hours',
                    averageTimeToVerify: '1.8 hours',
                    successRate: '94.5%',
                    rollbackRate: '5.5%'
                },
                
                trends: {
                    issueCreationTrend: 'decreasing',
                    resolutionTimeTrend: 'improving',
                    qualityTrend: 'stable'
                },
                
                topIssues: [
                    {
                        pattern: 'Null pointer exceptions',
                        count: 23,
                        trend: 'increasing'
                    },
                    {
                        pattern: 'Database connection timeouts',
                        count: 18,
                        trend: 'stable'
                    },
                    {
                        pattern: 'API rate limiting',
                        count: 15,
                        trend: 'decreasing'
                    }
                ]
            };

            success(res, statistics);

        } catch (err) {
            console.error('[FixMode] 获取统计信息失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * Fix模式工作流模板
     * GET /workflow-templates
     */
    router.get('/workflow-templates', async (req, res) => {
        try {
            const templates = {
                standard: {
                    name: '标准修复工作流',
                    description: '适用于大多数常规问题的修复流程',
                    steps: [
                        {
                            id: 'report',
                            name: '问题报告',
                            endpoint: 'POST /report-issue',
                            required: ['title', 'description', 'severity'],
                            estimated_time: '5-10 minutes'
                        },
                        {
                            id: 'diagnose',
                            name: '问题诊断',
                            endpoint: 'POST /diagnose-issue',
                            required: ['issueId'],
                            estimated_time: '15-30 minutes'
                        },
                        {
                            id: 'fix',
                            name: '应用修复',
                            endpoint: 'POST /apply-fix',
                            required: ['issueId', 'fixCode'],
                            estimated_time: '30-60 minutes'
                        },
                        {
                            id: 'verify',
                            name: '验证修复',
                            endpoint: 'POST /verify-fix',
                            required: ['issueId'],
                            estimated_time: '10-20 minutes'
                        }
                    ],
                    total_estimated_time: '60-120 minutes'
                },
                
                hotfix: {
                    name: '紧急热修复工作流',
                    description: '适用于生产环境紧急问题的快速修复流程',
                    steps: [
                        {
                            id: 'report',
                            name: '紧急问题报告',
                            endpoint: 'POST /report-issue',
                            required: ['title', 'description', 'severity: critical'],
                            estimated_time: '2-5 minutes'
                        },
                        {
                            id: 'quick_diagnose',
                            name: '快速诊断',
                            endpoint: 'POST /diagnose-issue',
                            required: ['issueId'],
                            options: { deepAnalysis: false },
                            estimated_time: '5-10 minutes'
                        },
                        {
                            id: 'hotfix',
                            name: '应用热修复',
                            endpoint: 'POST /apply-fix',
                            required: ['issueId', 'fixCode'],
                            options: { testChanges: true, backupFiles: true },
                            estimated_time: '15-30 minutes'
                        },
                        {
                            id: 'quick_verify',
                            name: '快速验证',
                            endpoint: 'POST /verify-fix',
                            required: ['issueId'],
                            estimated_time: '5-10 minutes'
                        }
                    ],
                    total_estimated_time: '27-55 minutes'
                },
                
                batch: {
                    name: '批量问题处理工作流',
                    description: '适用于处理多个相关问题的批处理流程',
                    steps: [
                        {
                            id: 'batch_diagnose',
                            name: '批量诊断',
                            endpoint: 'POST /diagnose-batch',
                            required: ['issueIds'],
                            estimated_time: '20-40 minutes'
                        },
                        {
                            id: 'analyze_patterns',
                            name: '分析共同模式',
                            description: '识别问题共同原因和修复策略',
                            estimated_time: '15-30 minutes'
                        },
                        {
                            id: 'batch_fix',
                            name: '批量应用修复',
                            description: '按优先级分批应用修复',
                            estimated_time: '60-120 minutes'
                        },
                        {
                            id: 'batch_verify',
                            name: '批量验证',
                            description: '验证所有修复效果',
                            estimated_time: '30-60 minutes'
                        }
                    ],
                    total_estimated_time: '125-250 minutes'
                }
            };

            success(res, templates);

        } catch (err) {
            console.error('[FixMode] 获取工作流模板失败:', err);
            return error(res, err.message, 500);
        }
    });

    // ========== 错误处理 ==========
    
    // Fix模式专用错误处理
    router.use((err, req, res, next) => {
        console.error('[FixMode] Route error:', err);
        
        // 根据错误类型返回不同的错误信息
        if (err.name === 'IssueNotFoundError') {
            return error(res, '问题不存在', 404, {
                mode: 'fix',
                issueId: err.issueId
            });
        }
        
        if (err.name === 'DiagnosisRequiredError') {
            return error(res, '请先完成问题诊断', 400, {
                mode: 'fix',
                suggestion: '调用 POST /diagnose-issue 进行诊断'
            });
        }
        
        if (err.name === 'FixValidationError') {
            return error(res, '修复方案验证失败', 400, {
                mode: 'fix',
                validationErrors: err.validationErrors
            });
        }
        
        if (err.name === 'VerificationFailedError') {
            return error(res, '修复验证失败', 500, {
                mode: 'fix',
                verificationDetails: err.details
            });
        }
        
        return error(res, err.message, 500, {
            mode: 'fix',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

export default createFixModeRoutes;