/**
 * Fix模式 - 问题诊断路由模块
 * 问题深度分析和诊断端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建问题诊断路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDiagnosisRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 诊断问题
     * POST /diagnose-issue
     */
    router.post('/diagnose-issue', async (req, res) => {
        try {
            const { 
                issueId, 
                context = {},
                deepAnalysis = false,
                includeCodeAnalysis = false,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[DiagnoseIssue] 开始诊断问题: ${issueId}`);

            const startTime = Date.now();

            // 模拟问题数据获取（实际应用中从数据库获取）
            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 执行诊断分析
            const diagnosis = await _performDiagnosis(issue, context, language, promptService);

            // 如果需要深度分析
            if (deepAnalysis) {
                diagnosis.deepAnalysis = await _performDeepAnalysis(issue, context, promptService);
            }

            // 如果需要代码分析
            if (includeCodeAnalysis) {
                diagnosis.codeAnalysis = await _performCodeAnalysis(issue, context);
            }

            // 生成修复建议
            diagnosis.fixSuggestions = await _generateFixSuggestions(issue, diagnosis, promptService);

            const executionTime = Date.now() - startTime;

            const responseData = {
                issueId,
                diagnosis,
                analysis: {
                    executionTime,
                    analysisDepth: deepAnalysis ? 'deep' : 'standard',
                    includeCodeAnalysis,
                    confidence: _calculateDiagnosisConfidence(diagnosis),
                    timestamp: new Date().toISOString()
                },
                recommendations: {
                    nextSteps: _getNextSteps(diagnosis),
                    priority: _assessFixPriority(diagnosis),
                    estimatedTime: _estimateFixTime(diagnosis),
                    requiredSkills: _getRequiredSkills(diagnosis, language)
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'diagnose_issue', 'completed', responseData);
                }
            }

            console.log(`[DiagnoseIssue] 问题 ${issueId} 诊断完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[DiagnoseIssue] 问题诊断失败:', err);
            error(res, err.message, 500, {
                action: 'diagnose_issue',
                issueId: req.body.issueId
            });
        }
    });

    /**
     * 批量诊断问题
     * POST /diagnose-batch
     */
    router.post('/diagnose-batch', async (req, res) => {
        try {
            const { 
                issueIds = [],
                context = {},
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!issueIds.length) {
                return error(res, '问题ID列表不能为空', 400);
            }

            console.log(`[DiagnoseBatch] 批量诊断${issueIds.length}个问题`);

            const startTime = Date.now();
            const results = [];
            const errors = [];

            // 批量处理问题诊断
            for (const issueId of issueIds) {
                try {
                    const issue = _getIssueById(issueId);
                    if (!issue) {
                        errors.push({ issueId, error: 'Issue not found' });
                        continue;
                    }

                    const diagnosis = await _performDiagnosis(issue, context, language, promptService);
                    const fixSuggestions = await _generateFixSuggestions(issue, diagnosis, promptService);

                    results.push({
                        issueId,
                        diagnosis: {
                            ...diagnosis,
                            fixSuggestions
                        },
                        status: 'success'
                    });

                } catch (diagnosisError) {
                    errors.push({
                        issueId,
                        error: diagnosisError.message
                    });
                }
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                batch: {
                    total: issueIds.length,
                    successful: results.length,
                    failed: errors.length,
                    results,
                    errors
                },
                analysis: {
                    executionTime,
                    avgTimePerIssue: Math.round(executionTime / issueIds.length),
                    timestamp: new Date().toISOString()
                },
                summary: {
                    totalIssues: issueIds.length,
                    diagnosedSuccessfully: results.length,
                    commonPatterns: _identifyCommonPatterns(results),
                    prioritySuggestions: _generateBatchPrioritySuggestions(results)
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'diagnose_batch', 'completed', responseData);
                }
            }

            console.log(`[DiagnoseBatch] 批量诊断完成: ${results.length}成功, ${errors.length}失败, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[DiagnoseBatch] 批量诊断失败:', err);
            error(res, err.message, 500, {
                action: 'diagnose_batch'
            });
        }
    });

    /**
     * 获取诊断报告
     * GET /diagnosis-report/:issueId
     */
    router.get('/diagnosis-report/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            const { format = 'json' } = req.query;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[DiagnosisReport] 获取诊断报告: ${issueId}`);

            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 检查是否已有诊断结果
            if (!issue.diagnosis) {
                return error(res, `问题 ${issueId} 尚未进行诊断`, 400, {
                    suggestion: '请先调用 POST /diagnose-issue 进行诊断'
                });
            }

            const report = await _generateDiagnosisReport(issue, issue.diagnosis, promptService);

            // 根据格式返回不同形式的响应
            if (format === 'markdown') {
                res.setHeader('Content-Type', 'text/markdown');
                res.send(report.markdown);
            } else if (format === 'html') {
                res.setHeader('Content-Type', 'text/html');
                res.send(report.html);
            } else {
                success(res, {
                    issueId,
                    report,
                    generatedAt: new Date().toISOString()
                });
            }

        } catch (err) {
            console.error('[DiagnosisReport] 获取诊断报告失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 重新诊断问题
     * PUT /re-diagnose/:issueId
     */
    router.put('/re-diagnose/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            const { 
                newContext = {},
                reason = 'manual_request',
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[ReDiagnose] 重新诊断问题: ${issueId}`);

            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            const startTime = Date.now();

            // 保存旧的诊断结果
            const oldDiagnosis = issue.diagnosis;

            // 执行新的诊断
            const newDiagnosis = await _performDiagnosis(issue, newContext, language, promptService);
            newDiagnosis.fixSuggestions = await _generateFixSuggestions(issue, newDiagnosis, promptService);

            // 比较新旧诊断结果
            const comparison = _compareDiagnoses(oldDiagnosis, newDiagnosis);

            const executionTime = Date.now() - startTime;

            const responseData = {
                issueId,
                reDiagnosis: {
                    reason,
                    timestamp: new Date().toISOString(),
                    previousDiagnosis: oldDiagnosis,
                    newDiagnosis,
                    comparison
                },
                analysis: {
                    executionTime,
                    changesDetected: comparison.hasChanges,
                    improvementScore: comparison.improvementScore
                }
            };

            // 更新问题的诊断结果
            issue.diagnosis = newDiagnosis;
            issue.diagnosisHistory = issue.diagnosisHistory || [];
            issue.diagnosisHistory.push({
                timestamp: new Date().toISOString(),
                diagnosis: oldDiagnosis,
                reason: 're-diagnosis'
            });

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 're_diagnose', 'completed', responseData);
                }
            }

            console.log(`[ReDiagnose] 问题 ${issueId} 重新诊断完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[ReDiagnose] 重新诊断失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 模拟获取问题数据
 * @param {string} issueId - 问题ID
 * @returns {Object|null} 问题数据
 */
function _getIssueById(issueId) {
    // 这里应该从数据库或缓存中获取问题数据
    // 为了演示，返回一个模拟的问题对象
    return {
        id: issueId,
        title: 'Sample Issue',
        description: 'This is a sample issue for demonstration',
        severity: 'medium',
        category: 'bug',
        stackTrace: 'Error: Sample error\n    at function1 (file1.js:10:5)\n    at function2 (file2.js:20:10)',
        language: 'javascript'
    };
}

/**
 * 执行问题诊断
 * @param {Object} issue - 问题对象
 * @param {Object} context - 上下文信息
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 诊断结果
 */
async function _performDiagnosis(issue, context, language, promptService) {
    try {
        // 使用提示词服务进行深度诊断
        const template = await promptService.loadPrompt('templates', 'issue-diagnosis', {
            title: issue.title,
            description: issue.description,
            stack_trace: issue.stackTrace || '',
            language,
            context: JSON.stringify(context)
        });

        return {
            summary: template.content || _generateDiagnosisSummary(issue),
            rootCause: await _identifyRootCause(issue, context),
            affectedComponents: _identifyAffectedComponents(issue),
            impactAssessment: _assessImpact(issue, context),
            reproductionSteps: _generateReproductionSteps(issue, context),
            environmentFactors: _analyzeEnvironmentFactors(issue, context),
            codePathAnalysis: _analyzeCodePath(issue),
            similarIssuesAnalysis: _analyzeSimilarIssues(issue),
            riskAssessment: _assessRisk(issue),
            confidence: 0.8,
            diagnosedAt: new Date().toISOString()
        };
    } catch (error) {
        return {
            summary: _generateDiagnosisSummary(issue),
            rootCause: await _identifyRootCause(issue, context),
            affectedComponents: _identifyAffectedComponents(issue),
            impactAssessment: _assessImpact(issue, context),
            reproductionSteps: _generateReproductionSteps(issue, context),
            environmentFactors: _analyzeEnvironmentFactors(issue, context),
            codePathAnalysis: _analyzeCodePath(issue),
            similarIssuesAnalysis: _analyzeSimilarIssues(issue),
            riskAssessment: _assessRisk(issue),
            confidence: 0.6,
            diagnosedAt: new Date().toISOString(),
            note: 'Fallback diagnosis used due to service error'
        };
    }
}

/**
 * 执行深度分析
 * @param {Object} issue - 问题对象
 * @param {Object} context - 上下文信息
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 深度分析结果
 */
async function _performDeepAnalysis(issue, context, promptService) {
    return {
        complexityAnalysis: _analyzeComplexity(issue),
        dependencyAnalysis: _analyzeDependencies(issue, context),
        performanceImpact: _analyzePerformanceImpact(issue),
        securityImplications: _analyzeSecurityImplications(issue),
        dataIntegrityRisk: _analyzeDataIntegrityRisk(issue),
        concurrencyIssues: _analyzeConcurrencyIssues(issue),
        memoryAnalysis: _analyzeMemoryUsage(issue),
        networkAnalysis: _analyzeNetworkFactors(issue)
    };
}

/**
 * 执行代码分析
 * @param {Object} issue - 问题对象
 * @param {Object} context - 上下文信息
 * @returns {Object} 代码分析结果
 */
async function _performCodeAnalysis(issue, context) {
    return {
        syntaxAnalysis: _analyzeSyntax(issue),
        logicAnalysis: _analyzeLogic(issue),
        patternAnalysis: _analyzePatterns(issue),
        qualityMetrics: _analyzeCodeQuality(issue),
        testCoverage: _analyzeTestCoverage(issue, context),
        codeSmells: _identifyCodeSmells(issue),
        refactoringOpportunities: _identifyRefactoringOpportunities(issue)
    };
}

/**
 * 生成修复建议
 * @param {Object} issue - 问题对象
 * @param {Object} diagnosis - 诊断结果
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 修复建议
 */
async function _generateFixSuggestions(issue, diagnosis, promptService) {
    try {
        const template = await promptService.loadPrompt('templates', 'fix-suggestions', {
            issue_title: issue.title,
            root_cause: diagnosis.rootCause?.description || 'Unknown',
            language: issue.language
        });

        return {
            quickFixes: _generateQuickFixes(issue, diagnosis),
            comprehensiveFixes: _generateComprehensiveFixes(issue, diagnosis),
            preventiveMeasures: _generatePreventiveMeasures(issue, diagnosis),
            testingStrategy: _generateTestingStrategy(issue, diagnosis),
            implementation: {
                steps: _generateImplementationSteps(issue, diagnosis),
                codeChanges: _generateCodeChanges(issue, diagnosis),
                configChanges: _generateConfigChanges(issue, diagnosis)
            },
            verification: {
                testCases: _generateTestCases(issue, diagnosis),
                validationSteps: _generateValidationSteps(issue, diagnosis)
            },
            suggestedContent: template.content || '基于诊断结果生成的修复建议'
        };
    } catch (error) {
        return {
            quickFixes: _generateQuickFixes(issue, diagnosis),
            comprehensiveFixes: _generateComprehensiveFixes(issue, diagnosis),
            preventiveMeasures: _generatePreventiveMeasures(issue, diagnosis),
            testingStrategy: _generateTestingStrategy(issue, diagnosis),
            implementation: {
                steps: _generateImplementationSteps(issue, diagnosis),
                codeChanges: _generateCodeChanges(issue, diagnosis),
                configChanges: _generateConfigChanges(issue, diagnosis)
            },
            verification: {
                testCases: _generateTestCases(issue, diagnosis),
                validationSteps: _generateValidationSteps(issue, diagnosis)
            },
            note: 'Generated using fallback method'
        };
    }
}

// 辅助函数实现...
function _generateDiagnosisSummary(issue) {
    return `诊断摘要：${issue.title} - ${issue.severity}级别${issue.category}问题`;
}

async function _identifyRootCause(issue, context) {
    // 模拟根因分析
    return {
        category: 'logic_error',
        description: '逻辑错误导致的异常处理',
        confidence: 0.8,
        evidence: ['堆栈跟踪显示特定函数调用失败', '错误模式与已知逻辑错误匹配'],
        location: {
            file: 'example.js',
            function: 'processData',
            line: 42
        }
    };
}

function _identifyAffectedComponents(issue) {
    // 从问题描述和堆栈跟踪中识别受影响的组件
    return [
        {
            name: '数据处理模块',
            impact: 'direct',
            confidence: 0.9
        },
        {
            name: '用户界面',
            impact: 'indirect',
            confidence: 0.6
        }
    ];
}

function _assessImpact(issue, context) {
    return {
        userImpact: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
        businessImpact: 'medium',
        systemImpact: 'low',
        dataImpact: 'none',
        affectedUsers: context.userCount || 'unknown',
        downtime: context.downtime || 'none'
    };
}

function _generateReproductionSteps(issue, context) {
    return [
        '启动应用程序',
        '导航到相关功能模块',
        '执行触发问题的操作',
        '观察错误现象',
        '检查日志和错误信息'
    ];
}

function _analyzeEnvironmentFactors(issue, context) {
    return {
        operatingSystem: context.os || 'unknown',
        browserVersion: context.browser || 'unknown',
        nodeVersion: context.nodeVersion || 'unknown',
        dependencies: context.dependencies || [],
        configuration: context.config || {},
        environmentType: context.environment || 'development'
    };
}

function _analyzeCodePath(issue) {
    return {
        executionPath: ['entry point', 'validation', 'processing', 'error occurred'],
        branchingPoints: ['input validation', 'error handling'],
        recursionDetected: false,
        cyclomaticComplexity: 'medium'
    };
}

function _analyzeSimilarIssues(issue) {
    return {
        foundSimilar: true,
        count: 3,
        commonPatterns: ['null pointer access', 'async operation failure'],
        resolutionPatterns: ['add null checks', 'improve error handling']
    };
}

function _assessRisk(issue) {
    return {
        riskLevel: issue.severity === 'critical' ? 'high' : 'medium',
        businessRisk: 'medium',
        technicalRisk: 'low',
        securityRisk: 'none',
        complianceRisk: 'none'
    };
}

function _calculateDiagnosisConfidence(diagnosis) {
    let confidence = 0.5;
    
    if (diagnosis.rootCause && diagnosis.rootCause.confidence > 0.7) {
        confidence += 0.2;
    }
    if (diagnosis.affectedComponents && diagnosis.affectedComponents.length > 0) {
        confidence += 0.1;
    }
    if (diagnosis.reproductionSteps && diagnosis.reproductionSteps.length >= 3) {
        confidence += 0.1;
    }
    if (diagnosis.similarIssuesAnalysis && diagnosis.similarIssuesAnalysis.foundSimilar) {
        confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
}

function _getNextSteps(diagnosis) {
    const steps = [];
    
    if (diagnosis.rootCause) {
        steps.push('根据根因分析制定修复方案');
    }
    if (diagnosis.reproductionSteps) {
        steps.push('验证问题重现步骤');
    }
    steps.push('实施修复措施');
    steps.push('执行测试验证');
    steps.push('部署到生产环境');
    
    return steps;
}

function _assessFixPriority(diagnosis) {
    if (diagnosis.riskAssessment?.riskLevel === 'high') {
        return 'critical';
    }
    if (diagnosis.impactAssessment?.userImpact === 'high') {
        return 'high';
    }
    return 'medium';
}

function _estimateFixTime(diagnosis) {
    const complexity = diagnosis.complexityAnalysis?.level || 'medium';
    
    const timeEstimates = {
        low: '1-2 hours',
        medium: '4-8 hours',
        high: '1-2 days',
        critical: '2-5 days'
    };
    
    return timeEstimates[complexity] || timeEstimates.medium;
}

function _getRequiredSkills(diagnosis, language) {
    const skills = [language];
    
    if (diagnosis.affectedComponents) {
        diagnosis.affectedComponents.forEach(comp => {
            if (comp.name.includes('数据库')) {
                skills.push('database');
            }
            if (comp.name.includes('API')) {
                skills.push('api-development');
            }
            if (comp.name.includes('界面')) {
                skills.push('frontend');
            }
        });
    }
    
    return [...new Set(skills)];
}

// 更多辅助函数的简化实现...
function _analyzeComplexity(issue) {
    return { level: 'medium', factors: ['async operations', 'error handling'] };
}

function _analyzeDependencies(issue, context) {
    return { external: [], internal: [], circular: false };
}

function _analyzePerformanceImpact(issue) {
    return { impact: 'minimal', metrics: {} };
}

function _analyzeSecurityImplications(issue) {
    return { risk: 'low', vulnerabilities: [] };
}

function _analyzeDataIntegrityRisk(issue) {
    return { risk: 'low', affectedData: [] };
}

function _analyzeConcurrencyIssues(issue) {
    return { detected: false, raceConditions: [], deadlocks: [] };
}

function _analyzeMemoryUsage(issue) {
    return { leaks: false, usage: 'normal' };
}

function _analyzeNetworkFactors(issue) {
    return { latency: 'normal', errors: [], timeout: false };
}

function _analyzeSyntax(issue) {
    return { errors: [], warnings: [] };
}

function _analyzeLogic(issue) {
    return { issues: [], complexity: 'medium' };
}

function _analyzePatterns(issue) {
    return { antiPatterns: [], suggestions: [] };
}

function _analyzeCodeQuality(issue) {
    return { score: 75, metrics: {} };
}

function _analyzeTestCoverage(issue, context) {
    return { coverage: '80%', missingTests: [] };
}

function _identifyCodeSmells(issue) {
    return ['long method', 'complex conditionals'];
}

function _identifyRefactoringOpportunities(issue) {
    return ['extract method', 'simplify conditionals'];
}

function _generateQuickFixes(issue, diagnosis) {
    return [
        {
            description: '添加空值检查',
            code: 'if (value !== null && value !== undefined) { ... }',
            risk: 'low'
        }
    ];
}

function _generateComprehensiveFixes(issue, diagnosis) {
    return [
        {
            description: '重构错误处理逻辑',
            steps: ['识别所有错误点', '统一错误处理', '添加日志记录'],
            estimatedTime: '4-6 hours'
        }
    ];
}

function _generatePreventiveMeasures(issue, diagnosis) {
    return [
        '添加输入验证',
        '增加单元测试覆盖率',
        '设置监控和告警',
        '定期代码审查'
    ];
}

function _generateTestingStrategy(issue, diagnosis) {
    return {
        unitTests: ['测试空值处理', '测试异常场景'],
        integrationTests: ['端到端流程测试'],
        performanceTests: ['压力测试'],
        securityTests: ['输入验证测试']
    };
}

function _generateImplementationSteps(issue, diagnosis) {
    return [
        '备份当前代码',
        '创建修复分支',
        '实施代码更改',
        '运行测试套件',
        '代码审查',
        '合并到主分支'
    ];
}

function _generateCodeChanges(issue, diagnosis) {
    return [
        {
            file: 'example.js',
            changes: ['添加空值检查', '改进错误处理']
        }
    ];
}

function _generateConfigChanges(issue, diagnosis) {
    return [
        {
            file: 'config.json',
            changes: ['更新超时设置', '添加重试配置']
        }
    ];
}

function _generateTestCases(issue, diagnosis) {
    return [
        {
            name: '测试空值输入',
            input: null,
            expectedOutput: 'error handled gracefully'
        }
    ];
}

function _generateValidationSteps(issue, diagnosis) {
    return [
        '验证修复解决了原始问题',
        '确认没有引入新问题',
        '检查性能影响',
        '验证错误处理'
    ];
}

function _identifyCommonPatterns(results) {
    const patterns = {};
    results.forEach(result => {
        const rootCause = result.diagnosis?.rootCause?.category;
        if (rootCause) {
            patterns[rootCause] = (patterns[rootCause] || 0) + 1;
        }
    });
    return patterns;
}

function _generateBatchPrioritySuggestions(results) {
    return results
        .filter(result => result.status === 'success')
        .sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = _assessFixPriority(a.diagnosis);
            const bPriority = _assessFixPriority(b.diagnosis);
            return priorityOrder[bPriority] - priorityOrder[aPriority];
        })
        .slice(0, 5)
        .map(result => ({
            issueId: result.issueId,
            priority: _assessFixPriority(result.diagnosis),
            estimatedTime: _estimateFixTime(result.diagnosis)
        }));
}

async function _generateDiagnosisReport(issue, diagnosis, promptService) {
    const markdown = `# 诊断报告：${issue.title}

## 问题概述
- **ID**: ${issue.id}
- **严重程度**: ${issue.severity}
- **类别**: ${issue.category}
- **状态**: ${issue.status || 'open'}

## 诊断结果
${diagnosis.summary}

## 根因分析
${diagnosis.rootCause?.description || '待分析'}

## 修复建议
${diagnosis.fixSuggestions?.quickFixes?.map(fix => `- ${fix.description}`).join('\n') || ''}

## 下一步行动
${diagnosis.nextSteps?.map(step => `1. ${step}`).join('\n') || ''}
`;

    return {
        json: { issue, diagnosis },
        markdown,
        html: _markdownToHtml(markdown)
    };
}

function _markdownToHtml(markdown) {
    // 简单的 Markdown 到 HTML 转换
    return markdown
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
}

function _compareDiagnoses(oldDiagnosis, newDiagnosis) {
    if (!oldDiagnosis) {
        return { hasChanges: true, improvementScore: 1.0, changes: ['Initial diagnosis'] };
    }

    const changes = [];
    let improvementScore = 0;

    if (oldDiagnosis.rootCause?.description !== newDiagnosis.rootCause?.description) {
        changes.push('根因分析更新');
        improvementScore += 0.3;
    }

    if (newDiagnosis.confidence > (oldDiagnosis.confidence || 0)) {
        changes.push('诊断置信度提升');
        improvementScore += 0.2;
    }

    if (newDiagnosis.fixSuggestions && 
        newDiagnosis.fixSuggestions.quickFixes?.length > (oldDiagnosis.fixSuggestions?.quickFixes?.length || 0)) {
        changes.push('新增修复建议');
        improvementScore += 0.1;
    }

    return {
        hasChanges: changes.length > 0,
        improvementScore: Math.min(improvementScore, 1.0),
        changes
    };
}

export default createDiagnosisRoutes;