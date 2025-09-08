/**
 * Fix模式 - 问题管理路由模块
 * 问题报告、跟踪和管理端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建问题管理路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createIssuesRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;
    
    // 简单的内存存储，实际应用中应该使用数据库
    const issues = new Map();

    /**
     * 报告新问题
     * POST /report-issue
     */
    router.post('/report-issue', async (req, res) => {
        try {
            const { 
                title, 
                description, 
                severity = 'medium',
                category = 'bug',
                stackTrace,
                reproducible = true,
                environment = 'development',
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!title) {
                return error(res, '问题标题不能为空', 400);
            }

            if (!description) {
                return error(res, '问题描述不能为空', 400);
            }

            console.log(`[ReportIssue] 报告新问题: ${title}`);

            const startTime = Date.now();
            const issueId = `ISSUE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // 创建问题记录
            const issue = {
                id: issueId,
                title,
                description,
                severity,
                category,
                stackTrace,
                reproducible,
                environment,
                language,
                status: 'open',
                priority: _calculatePriority(severity, category, reproducible),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                
                // 自动分析
                analysis: await _analyzeIssue(title, description, stackTrace, promptService),
                
                // 建议的标签
                tags: _generateIssueTags(title, description, category, language),
                
                // 相似问题
                similarIssues: _findSimilarIssues(title, description, issues),
                
                // 初步分类
                classification: _classifyIssue(title, description, stackTrace, category)
            };

            // 存储问题
            issues.set(issueId, issue);

            const executionTime = Date.now() - startTime;

            const responseData = {
                issue,
                metadata: {
                    executionTime,
                    issueCount: issues.size,
                    timestamp: new Date().toISOString()
                },
                nextSteps: [
                    '问题已记录并分类',
                    '可使用 POST /diagnose-issue 进行深度诊断',
                    '查看相似问题获取解决方案',
                    '根据优先级安排修复计划'
                ],
                recommendations: _generateIssueRecommendations(issue)
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'report_issue', 'completed', responseData);
                }
            }

            console.log(`[ReportIssue] 问题 ${issueId} 报告完成: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[ReportIssue] 问题报告失败:', err);
            error(res, err.message, 500, {
                action: 'report_issue'
            });
        }
    });

    /**
     * 获取问题列表
     * GET /issues
     */
    router.get('/issues', async (req, res) => {
        try {
            const { 
                status,
                severity,
                category,
                language,
                limit = 20,
                offset = 0
            } = req.query;

            console.log('[GetIssues] 获取问题列表');

            let filteredIssues = Array.from(issues.values());

            // 应用过滤器
            if (status) {
                filteredIssues = filteredIssues.filter(issue => issue.status === status);
            }
            if (severity) {
                filteredIssues = filteredIssues.filter(issue => issue.severity === severity);
            }
            if (category) {
                filteredIssues = filteredIssues.filter(issue => issue.category === category);
            }
            if (language) {
                filteredIssues = filteredIssues.filter(issue => issue.language === language);
            }

            // 排序（按创建时间倒序）
            filteredIssues.sort((a, b) => new Date(b.created) - new Date(a.created));

            // 分页
            const totalIssues = filteredIssues.length;
            const paginatedIssues = filteredIssues.slice(Number(offset), Number(offset) + Number(limit));

            const responseData = {
                issues: paginatedIssues,
                pagination: {
                    total: totalIssues,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < totalIssues
                },
                filters: {
                    status,
                    severity,
                    category,
                    language
                },
                statistics: _getIssuesStatistics(Array.from(issues.values()))
            };

            success(res, responseData);

        } catch (err) {
            console.error('[GetIssues] 获取问题列表失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 获取单个问题详情
     * GET /issues/:issueId
     */
    router.get('/issues/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[GetIssue] 获取问题详情: ${issueId}`);

            const issue = issues.get(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 获取问题历史记录
            const history = _getIssueHistory(issue);

            // 获取相关文件
            const relatedFiles = await _getRelatedFiles(issue, promptService);

            const responseData = {
                issue,
                history,
                relatedFiles,
                troubleshooting: {
                    commonCauses: _getCommonCauses(issue.category, issue.language),
                    quickFixes: _getQuickFixes(issue.category, issue.language),
                    diagnosticSteps: _getDiagnosticSteps(issue.category)
                }
            };

            success(res, responseData);

        } catch (err) {
            console.error('[GetIssue] 获取问题详情失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 更新问题状态
     * PUT /issues/:issueId/status
     */
    router.put('/issues/:issueId/status', async (req, res) => {
        try {
            const { issueId } = req.params;
            const { status, comment, assignee } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            if (!status) {
                return error(res, '状态不能为空', 400);
            }

            const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'duplicate'];
            if (!validStatuses.includes(status)) {
                return error(res, `无效的状态: ${status}`, 400, {
                    validStatuses
                });
            }

            console.log(`[UpdateIssueStatus] 更新问题状态: ${issueId} -> ${status}`);

            const issue = issues.get(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 记录状态变更历史
            if (!issue.history) {
                issue.history = [];
            }

            issue.history.push({
                timestamp: new Date().toISOString(),
                action: 'status_change',
                oldValue: issue.status,
                newValue: status,
                comment,
                assignee
            });

            // 更新问题状态
            const oldStatus = issue.status;
            issue.status = status;
            issue.updated = new Date().toISOString();
            
            if (assignee) {
                issue.assignee = assignee;
            }

            // 如果问题已解决，记录解决时间
            if (status === 'resolved' && oldStatus !== 'resolved') {
                issue.resolvedAt = new Date().toISOString();
                issue.resolutionTime = new Date(issue.resolvedAt) - new Date(issue.created);
            }

            const responseData = {
                issue,
                statusChange: {
                    from: oldStatus,
                    to: status,
                    comment,
                    assignee,
                    timestamp: new Date().toISOString()
                }
            };

            success(res, responseData);

        } catch (err) {
            console.error('[UpdateIssueStatus] 更新问题状态失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 删除问题
     * DELETE /issues/:issueId
     */
    router.delete('/issues/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            const { reason = 'user_request' } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[DeleteIssue] 删除问题: ${issueId}`);

            const issue = issues.get(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 软删除：标记为已删除而不是真正删除
            issue.deleted = true;
            issue.deletedAt = new Date().toISOString();
            issue.deleteReason = reason;

            // 或者真正删除（根据业务需求）
            // issues.delete(issueId);

            const responseData = {
                issueId,
                deleted: true,
                deletedAt: issue.deletedAt,
                reason
            };

            success(res, responseData);

        } catch (err) {
            console.error('[DeleteIssue] 删除问题失败:', err);
            error(res, err.message, 500);
        }
    });

    
    /**
     * 计算问题优先级
 * @param {string} severity - 严重程度
 * @param {string} category - 问题类别
 * @param {boolean} reproducible - 是否可重现
 * @returns {string} 优先级
 */
function _calculatePriority(severity, category, reproducible) {
    const severityWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
    };

    const categoryWeight = {
        bug: 3,
        performance: 2,
        security: 4,
        feature: 1,
        documentation: 1
    };

    const score = (severityWeight[severity] || 2) + 
                  (categoryWeight[category] || 1) + 
                  (reproducible ? 1 : 0);

    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

/**
 * 分析问题
 * @param {string} title - 问题标题
 * @param {string} description - 问题描述
 * @param {string} stackTrace - 堆栈跟踪
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 分析结果
 */
async function _analyzeIssue(title, description, stackTrace, promptService) {
    try {
        // 使用提示词服务进行问题分析
        const template = await promptService.loadPrompt('templates', 'issue-analysis', {
            title,
            description,
            stack_trace: stackTrace || 'No stack trace provided'
        });

        return {
            summary: template.content || `自动分析：${title}`,
            possibleCauses: _extractPossibleCauses(description, stackTrace),
            affectedComponents: _extractAffectedComponents(description, stackTrace),
            suggestedKeywords: _extractKeywords(title + ' ' + description),
            complexity: _assessComplexity(description, stackTrace)
        };
    } catch (error) {
        return {
            summary: `自动分析：${title}`,
            possibleCauses: _extractPossibleCauses(description, stackTrace),
            affectedComponents: _extractAffectedComponents(description, stackTrace),
            suggestedKeywords: _extractKeywords(title + ' ' + description),
            complexity: _assessComplexity(description, stackTrace)
        };
    }
}

/**
 * 生成问题标签
 * @param {string} title - 问题标题
 * @param {string} description - 问题描述
 * @param {string} category - 问题类别
 * @param {string} language - 编程语言
 * @returns {Array} 标签列表
 */
function _generateIssueTags(title, description, category, language) {
    const tags = [category, language];
    
    const text = (title + ' ' + description).toLowerCase();
    
    // 技术标签
    if (text.includes('database') || text.includes('sql')) tags.push('database');
    if (text.includes('api') || text.includes('endpoint')) tags.push('api');
    if (text.includes('ui') || text.includes('interface')) tags.push('ui');
    if (text.includes('performance') || text.includes('slow')) tags.push('performance');
    if (text.includes('security') || text.includes('vulnerability')) tags.push('security');
    if (text.includes('test') || text.includes('testing')) tags.push('testing');
    
    // 框架标签
    if (text.includes('react')) tags.push('react');
    if (text.includes('vue')) tags.push('vue');
    if (text.includes('angular')) tags.push('angular');
    if (text.includes('express')) tags.push('express');
    if (text.includes('django')) tags.push('django');
    if (text.includes('flask')) tags.push('flask');
    
    return [...new Set(tags)]; // 去重
}

/**
 * 查找相似问题
 * @param {string} title - 问题标题
 * @param {string} description - 问题描述
 * @param {Map} issuesMap - 问题映射
 * @returns {Array} 相似问题列表
 */
function _findSimilarIssues(title, description, issuesMap) {
    const currentKeywords = _extractKeywords(title + ' ' + description);
    const similarIssues = [];
    
    for (const [id, issue] of issuesMap) {
        if (issue.deleted) continue;
        
        const issueKeywords = _extractKeywords(issue.title + ' ' + issue.description);
        const commonKeywords = currentKeywords.filter(keyword => 
            issueKeywords.includes(keyword)
        );
        
        if (commonKeywords.length >= 2) {
            similarIssues.push({
                id: issue.id,
                title: issue.title,
                status: issue.status,
                similarity: commonKeywords.length / Math.max(currentKeywords.length, issueKeywords.length),
                commonKeywords
            });
        }
    }
    
    return similarIssues
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
}

/**
 * 分类问题
 * @param {string} title - 问题标题
 * @param {string} description - 问题描述
 * @param {string} stackTrace - 堆栈跟踪
 * @param {string} category - 问题类别
 * @returns {Object} 分类结果
 */
function _classifyIssue(title, description, stackTrace, category) {
    const text = (title + ' ' + description + ' ' + (stackTrace || '')).toLowerCase();
    
    const classification = {
        primary: category,
        secondary: [],
        confidence: 0.8
    };
    
    // 二级分类
    if (text.includes('memory') || text.includes('leak')) {
        classification.secondary.push('memory-leak');
    }
    if (text.includes('timeout') || text.includes('slow')) {
        classification.secondary.push('performance');
    }
    if (text.includes('null') || text.includes('undefined')) {
        classification.secondary.push('null-pointer');
    }
    if (text.includes('connection') || text.includes('network')) {
        classification.secondary.push('network');
    }
    
    return classification;
}

/**
 * 生成问题建议
 * @param {Object} issue - 问题对象
 * @returns {Array} 建议列表
 */
function _generateIssueRecommendations(issue) {
    const recommendations = [];
    
    if (issue.severity === 'critical') {
        recommendations.push({
            type: 'priority',
            message: '这是一个严重问题，建议立即处理',
            action: '分配给高级开发人员'
        });
    }
    
    if (issue.similarIssues.length > 0) {
        recommendations.push({
            type: 'reference',
            message: '发现相似问题，可以参考已有解决方案',
            action: '查看相似问题的解决方案'
        });
    }
    
    if (!issue.stackTrace) {
        recommendations.push({
            type: 'information',
            message: '建议提供堆栈跟踪信息以便更好地诊断',
            action: '收集详细的错误信息'
        });
    }
    
    if (!issue.reproducible) {
        recommendations.push({
            type: 'reproduction',
            message: '无法重现的问题难以调试，建议收集更多信息',
            action: '尝试重现问题并记录步骤'
        });
    }
    
    return recommendations;
}

/**
 * 获取问题统计
 * @param {Array} allIssues - 所有问题
 * @returns {Object} 统计信息
 */
function _getIssuesStatistics(allIssues) {
    const stats = {
        total: allIssues.length,
        byStatus: {},
        bySeverity: {},
        byCategory: {},
        byLanguage: {},
        resolved: 0,
        avgResolutionTime: 0
    };
    
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    allIssues.forEach(issue => {
        if (issue.deleted) return;
        
        // 按状态统计
        stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
        
        // 按严重程度统计
        stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
        
        // 按类别统计
        stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
        
        // 按语言统计
        stats.byLanguage[issue.language] = (stats.byLanguage[issue.language] || 0) + 1;
        
        // 解决时间统计
        if (issue.status === 'resolved' && issue.resolutionTime) {
            totalResolutionTime += issue.resolutionTime;
            resolvedCount++;
        }
    });
    
    if (resolvedCount > 0) {
        stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedCount / 1000 / 60); // 转换为分钟
    }
    
    stats.resolved = resolvedCount;
    
    return stats;
}

/**
 * 获取问题历史记录
 * @param {Object} issue - 问题对象
 * @returns {Array} 历史记录
 */
function _getIssueHistory(issue) {
    return issue.history || [
        {
            timestamp: issue.created,
            action: 'created',
            comment: '问题已创建'
        }
    ];
}

/**
 * 获取相关文件
 * @param {Object} issue - 问题对象
 * @param {Object} promptService - 提示词服务
 * @returns {Array} 相关文件列表
 */
async function _getRelatedFiles(issue, promptService) {
    // 从堆栈跟踪中提取文件路径
    const files = [];
    
    if (issue.stackTrace) {
        const filePattern = /(?:at\s+)?(?:\w+\s+)?(?:\[.*?\]\s+)?([^\s\(\)]+\.[a-zA-Z]+):(\d+):?(\d+)?/g;
        let match;
        
        while ((match = filePattern.exec(issue.stackTrace)) !== null) {
            files.push({
                path: match[1],
                line: parseInt(match[2]),
                column: match[3] ? parseInt(match[3]) : null,
                type: 'stack_trace'
            });
        }
    }
    
    return files.slice(0, 10); // 限制返回数量
}

// 辅助函数
function _extractPossibleCauses(description, stackTrace) {
    const causes = [];
    const text = (description + ' ' + (stackTrace || '')).toLowerCase();
    
    if (text.includes('null') || text.includes('undefined')) {
        causes.push('空值引用');
    }
    if (text.includes('timeout')) {
        causes.push('请求超时');
    }
    if (text.includes('connection')) {
        causes.push('连接问题');
    }
    if (text.includes('permission') || text.includes('access')) {
        causes.push('权限问题');
    }
    if (text.includes('memory')) {
        causes.push('内存问题');
    }
    
    return causes.length > 0 ? causes : ['需要进一步分析'];
}

function _extractAffectedComponents(description, stackTrace) {
    const components = [];
    const text = (description + ' ' + (stackTrace || '')).toLowerCase();
    
    if (text.includes('database') || text.includes('sql')) {
        components.push('数据库层');
    }
    if (text.includes('api') || text.includes('controller')) {
        components.push('API控制器');
    }
    if (text.includes('service')) {
        components.push('业务服务层');
    }
    if (text.includes('ui') || text.includes('component')) {
        components.push('用户界面');
    }
    
    return components.length > 0 ? components : ['未知组件'];
}

function _extractKeywords(text) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    return [...new Set(words)];
}

function _assessComplexity(description, stackTrace) {
    let complexity = 1;
    
    if (stackTrace && stackTrace.length > 500) complexity += 1;
    if (description.length > 200) complexity += 1;
    if ((description + (stackTrace || '')).includes('async') || 
        (description + (stackTrace || '')).includes('concurrent')) complexity += 1;
    
    if (complexity <= 1) return 'low';
    if (complexity <= 2) return 'medium';
    return 'high';
}

function _getCommonCauses(category, language) {
    const causes = {
        bug: {
            javascript: ['空值引用', '类型错误', '异步处理错误'],
            python: ['索引越界', '类型错误', '模块导入错误'],
            java: ['空指针异常', '类型转换错误', '并发问题'],
            default: ['逻辑错误', '边界条件', '配置错误']
        },
        performance: {
            javascript: ['阻塞主线程', '内存泄漏', '过多DOM操作'],
            python: ['循环性能', 'IO阻塞', '内存使用过高'],
            default: ['算法效率', '资源竞争', '缓存失效']
        }
    };
    
    return causes[category]?.[language] || causes[category]?.default || causes.bug.default;
}

function _getQuickFixes(category, language) {
    const fixes = {
        bug: {
            javascript: ['添加空值检查', '使用try-catch', '检查异步调用'],
            python: ['添加边界检查', '使用异常处理', '验证输入参数'],
            default: ['添加日志', '增加验证', '检查配置']
        },
        performance: {
            javascript: ['使用防抖节流', '优化DOM操作', '添加缓存'],
            python: ['优化算法', '使用生成器', '添加索引'],
            default: ['添加缓存', '优化查询', '并行处理']
        }
    };
    
    return fixes[category]?.[language] || fixes[category]?.default || fixes.bug.default;
}

function _getDiagnosticSteps(category) {
    const steps = {
        bug: [
            '重现问题场景',
            '检查日志输出',
            '验证输入数据',
            '跟踪执行流程',
            '检查相关配置'
        ],
        performance: [
            '性能监控分析',
            '资源使用检查',
            '瓶颈点识别',
            '代码性能分析',
            '系统资源监控'
        ],
        security: [
            '权限验证检查',
            '输入验证审查',
            '访问控制测试',
            '数据加密验证',
            '安全漏洞扫描'
        ]
    };
    
    return steps[category] || steps.bug;
}

    // ========== AI驱动Fix模式6步工作流端点 ==========

    /**
     * 第1步: 问题范围识别 - AI智能分析
     * POST /identify-scope
     */
    router.post('/identify-scope', async (req, res) => {
        try {
            const { 
                issueId,
                issueDescription,
                stackTrace,
                language = 'javascript',
                projectPath,
                workflowId
            } = req.body;
            
            if (!issueId && !issueDescription) {
                return error(res, '问题ID或问题描述不能为空', 400);
            }

            console.log(`[IdentifyScope] AI问题范围识别: ${issueId || 'New Issue'}`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 问题范围识别
            const aiAnalysisPackage = {
                // 问题数据
                problemData: {
                    issueId,
                    issueDescription,
                    stackTrace,
                    language,
                    projectPath,
                    reportedAt: new Date().toISOString()
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'scope-identification-analysis.md',
                    documentTemplate: 'scope-identification-report.md',
                    analysisType: 'problem_scope_analysis',
                    complexity: 'detailed'
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 1,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockScopeResult = {
                scopeIdentification: {
                    problemType: 'runtime_error',
                    primaryScope: {
                        affectedModule: 'AuthenticationService',
                        coreFiles: ['src/auth/service.js', 'src/auth/middleware.js'],
                        impactRadius: 'medium',
                        confidence: 0.88
                    },
                    secondaryScopes: [
                        {
                            module: 'UserSessionManager',
                            files: ['src/session/manager.js'],
                            impact: 'indirect',
                            reason: '依赖AuthenticationService的会话验证'
                        },
                        {
                            module: 'APIGateway',
                            files: ['src/api/gateway.js'],
                            impact: 'upstream',
                            reason: '调用认证服务进行请求验证'
                        }
                    ],
                    riskAssessment: {
                        breakageRisk: 'medium',
                        dataIntegrity: 'safe',
                        userImpact: 'high',
                        systemStability: 'stable'
                    },
                    boundaryAnalysis: {
                        containmentLevel: 'module_level',
                        isolationPossible: true,
                        cascadeEffects: ['会话失效', '用户重新登录'],
                        safetyMargins: ['不影响数据存储', '不影响其他服务']
                    }
                },
                analysisMetrics: {
                    confidenceScore: 88,
                    coverageCompleteness: 95,
                    analysisDepth: 'comprehensive',
                    riskLevel: 'medium'
                },
                analysisId: `ai-scope-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'scope-identification-analysis.md',
                    aiDocumentTemplate: 'scope-identification-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const scopeResult = mockScopeResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    // 如果工作流不存在，创建一个新的
                    workflowService.createWorkflowWithId(workflowId, projectPath || '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 0, 'completed', scopeResult);
                }
            }
            
            const responseData = {
                // AI分析数据包 (提供给AI使用)
                aiAnalysisPackage,
                
                // 问题范围识别结果
                scopeIdentification: scopeResult.scopeIdentification,
                analysisMetrics: scopeResult.analysisMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 1,
                    stepName: 'identify_scope',
                    analysisId: scopeResult.analysisId,
                    analysisDuration: scopeResult.analysisDuration,
                    timestamp: scopeResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[IdentifyScope] AI问题范围识别完成: ${scopeResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[IdentifyScope] AI范围识别失败:', err);
            error(res, err.message, 500, {
                step: 1,
                stepName: 'identify_scope'
            });
        }
    });

    /**
     * 第1步-B: 获取受影响模块列表
     * GET /affected-modules
     */
    router.get('/affected-modules', async (req, res) => {
        try {
            const { workflowId, issueId } = req.query;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            // 从工作流中获取范围识别结果
            let scopeResult = null;
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow && workflow.results.step_1) {
                    scopeResult = workflow.results.step_1;
                }
            }
            
            if (!scopeResult) {
                return error(res, '未找到范围识别结果，请先执行 POST /identify-scope', 404);
            }
            
            const affectedModules = {
                primary: {
                    module: scopeResult.scopeIdentification.primaryScope.affectedModule,
                    files: scopeResult.scopeIdentification.primaryScope.coreFiles,
                    impact: 'direct',
                    priority: 'high'
                },
                secondary: scopeResult.scopeIdentification.secondaryScopes.map(scope => ({
                    module: scope.module,
                    files: scope.files,
                    impact: scope.impact,
                    priority: scope.impact === 'upstream' ? 'medium' : 'low',
                    reason: scope.reason
                })),
                summary: {
                    totalModules: 1 + scopeResult.scopeIdentification.secondaryScopes.length,
                    totalFiles: scopeResult.scopeIdentification.primaryScope.coreFiles.length + 
                               scopeResult.scopeIdentification.secondaryScopes.reduce((sum, s) => sum + s.files.length, 0),
                    riskLevel: scopeResult.scopeIdentification.riskAssessment.breakageRisk,
                    containmentLevel: scopeResult.scopeIdentification.boundaryAnalysis.containmentLevel
                }
            };

            success(res, affectedModules);
            
        } catch (err) {
            console.error('[AffectedModules] 获取受影响模块失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 第2步: 相关文档检索 - AI智能检索
     * POST /find-docs
     */
    router.post('/find-docs', async (req, res) => {
        try {
            const { 
                workflowId,
                issueId,
                affectedModules = [],
                searchScope = 'focused',
                language = 'javascript'
            } = req.body;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            console.log(`[FindDocs] AI相关文档检索: ${workflowId || issueId}`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 文档检索
            const aiAnalysisPackage = {
                // 检索数据
                searchData: {
                    workflowId,
                    issueId,
                    affectedModules,
                    searchScope,
                    language,
                    searchDate: new Date().toISOString()
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'document-retrieval-analysis.md',
                    documentTemplate: 'document-retrieval-report.md',
                    analysisType: 'contextual_document_search',
                    searchDepth: searchScope
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 2,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockDocsResult = {
                documentRetrieval: {
                    relevantDocuments: [
                        {
                            type: 'architecture',
                            title: '认证服务架构设计',
                            path: 'docs/architecture/auth-service.md',
                            relevance: 0.92,
                            sections: ['服务接口', '错误处理', '会话管理'],
                            reason: '直接描述认证服务的设计和错误处理机制'
                        },
                        {
                            type: 'api',
                            title: '认证API文档',
                            path: 'docs/api/authentication.md',
                            relevance: 0.88,
                            sections: ['登录接口', '错误码说明'],
                            reason: '包含认证相关的API规范和错误码定义'
                        },
                        {
                            type: 'troubleshooting',
                            title: '认证问题排查指南',
                            path: 'docs/troubleshooting/auth-issues.md',
                            relevance: 0.85,
                            sections: ['常见问题', '调试方法'],
                            reason: '提供认证问题的排查步骤和解决方案'
                        }
                    ],
                    codeDocumentation: [
                        {
                            file: 'src/auth/service.js',
                            documentedFunctions: ['authenticate', 'validateToken', 'handleAuthError'],
                            coverage: 0.78,
                            lastUpdated: '2024-08-15'
                        },
                        {
                            file: 'src/auth/middleware.js',
                            documentedFunctions: ['authMiddleware', 'requireAuth'],
                            coverage: 0.65,
                            lastUpdated: '2024-07-20'
                        }
                    ],
                    searchMetrics: {
                        documentsScanned: 147,
                        relevantFound: 3,
                        confidenceThreshold: 0.8,
                        searchCompleteness: 0.94
                    }
                },
                analysisMetrics: {
                    searchAccuracy: 94,
                    documentRelevance: 88,
                    coverageCompleteness: 92
                },
                analysisId: `ai-docs-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'document-retrieval-analysis.md',
                    aiDocumentTemplate: 'document-retrieval-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const docsResult = mockDocsResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 1, 'completed', docsResult);
                }
            }
            
            const responseData = {
                // AI分析数据包
                aiAnalysisPackage,
                
                // 文档检索结果
                documentRetrieval: docsResult.documentRetrieval,
                analysisMetrics: docsResult.analysisMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 2,
                    stepName: 'find_docs',
                    analysisId: docsResult.analysisId,
                    analysisDuration: docsResult.analysisDuration,
                    timestamp: docsResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[FindDocs] AI文档检索完成: ${docsResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[FindDocs] AI文档检索失败:', err);
            error(res, err.message, 500, {
                step: 2,
                stepName: 'find_docs'
            });
        }
    });

    /**
     * 第2步-B: 获取相关文档列表
     * GET /relevant-docs
     */
    router.get('/relevant-docs', async (req, res) => {
        try {
            const { workflowId, relevanceThreshold = 0.8 } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取文档检索结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_2) {
                return error(res, '未找到文档检索结果，请先执行 POST /find-docs', 404);
            }
            
            const docsResult = workflow.results.step_2;
            const threshold = parseFloat(relevanceThreshold);
            
            const relevantDocs = {
                highRelevance: docsResult.documentRetrieval.relevantDocuments.filter(doc => doc.relevance >= 0.9),
                mediumRelevance: docsResult.documentRetrieval.relevantDocuments.filter(doc => doc.relevance >= threshold && doc.relevance < 0.9),
                codeDocumentation: docsResult.documentRetrieval.codeDocumentation,
                searchSummary: {
                    totalFound: docsResult.documentRetrieval.relevantDocuments.length,
                    highRelevanceCount: docsResult.documentRetrieval.relevantDocuments.filter(doc => doc.relevance >= 0.9).length,
                    searchAccuracy: docsResult.analysisMetrics.searchAccuracy,
                    recommendedReading: docsResult.documentRetrieval.relevantDocuments
                        .filter(doc => doc.relevance >= threshold)
                        .sort((a, b) => b.relevance - a.relevance)
                        .slice(0, 3)
                        .map(doc => ({
                            title: doc.title,
                            path: doc.path,
                            priority: doc.relevance >= 0.9 ? 'high' : 'medium'
                        }))
                }
            };

            success(res, relevantDocs);
            
        } catch (err) {
            console.error('[RelevantDocs] 获取相关文档失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 第3步: 影响度评估 - AI深度分析
     * POST /assess-impact
     */
    router.post('/assess-impact', async (req, res) => {
        try {
            const { 
                workflowId,
                issueId,
                proposedSolution = '',
                analysisDepth = 'comprehensive',
                language = 'javascript'
            } = req.body;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            console.log(`[AssessImpact] AI影响度评估: ${workflowId || issueId}`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 影响度评估
            const aiAnalysisPackage = {
                // 评估数据
                impactData: {
                    workflowId,
                    issueId,
                    proposedSolution,
                    analysisDepth,
                    language,
                    evaluationDate: new Date().toISOString()
                },
                
                // 前置步骤数据
                contextData: {
                    scopeAnalysis: workflowId ? 'step_1_results' : null,
                    documentRetrieval: workflowId ? 'step_2_results' : null
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'impact-assessment-analysis.md',
                    documentTemplate: 'impact-assessment-report.md',
                    analysisType: 'comprehensive_impact_analysis',
                    analysisDepth: analysisDepth
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 3,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockImpactResult = {
                impactAssessment: {
                    overallRiskLevel: 'medium',
                    upstreamImpacts: [
                        {
                            component: 'APIGateway',
                            impactType: 'functional',
                            severity: 'medium',
                            description: '认证失败会导致API网关拒绝请求',
                            mitigation: '实现降级策略或临时认证绕过'
                        },
                        {
                            component: 'LoadBalancer',
                            impactType: 'operational',
                            severity: 'low',
                            description: '健康检查可能受影响',
                            mitigation: '调整健康检查参数'
                        }
                    ],
                    downstreamImpacts: [
                        {
                            component: 'UserSessionManager',
                            impactType: 'data',
                            severity: 'high',
                            description: '现有会话可能失效',
                            mitigation: '保持现有会话，仅影响新登录'
                        },
                        {
                            component: 'AuditLogger',
                            impactType: 'operational',
                            severity: 'low',
                            description: '认证日志格式可能改变',
                            mitigation: '保持向后兼容的日志格式'
                        }
                    ],
                    dataFlowImpacts: {
                        dataIntegrity: 'safe',
                        dataConsistency: 'maintained',
                        potentialDataLoss: 'none',
                        backupRequired: ['user_sessions', 'auth_tokens'],
                        rollbackComplexity: 'low'
                    },
                    performanceImpacts: {
                        expectedLatencyChange: '+5ms',
                        throughputImpact: 'negligible',
                        resourceUtilization: 'unchanged',
                        scalabilityEffect: 'none'
                    },
                    securityImpacts: {
                        vulnerabilityRisk: 'none',
                        permissionChanges: 'none',
                        exposureRisk: 'low',
                        complianceAffected: false
                    }
                },
                riskMatrix: {
                    probability: 'medium',
                    impact: 'medium',
                    riskScore: 6, // 3x3 matrix: medium * medium
                    acceptanceLevel: 'acceptable',
                    mitigationRequired: true
                },
                analysisMetrics: {
                    confidenceLevel: 87,
                    coverageCompleteness: 91,
                    analysisDepth: 'comprehensive',
                    riskAccuracy: 89
                },
                analysisId: `ai-impact-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'impact-assessment-analysis.md',
                    aiDocumentTemplate: 'impact-assessment-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const impactResult = mockImpactResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 2, 'completed', impactResult);
                }
            }
            
            const responseData = {
                // AI分析数据包
                aiAnalysisPackage,
                
                // 影响度评估结果
                impactAssessment: impactResult.impactAssessment,
                riskMatrix: impactResult.riskMatrix,
                analysisMetrics: impactResult.analysisMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 3,
                    stepName: 'assess_impact',
                    analysisId: impactResult.analysisId,
                    analysisDuration: impactResult.analysisDuration,
                    timestamp: impactResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[AssessImpact] AI影响度评估完成: ${impactResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[AssessImpact] AI影响度评估失败:', err);
            error(res, err.message, 500, {
                step: 3,
                stepName: 'assess_impact'
            });
        }
    });

    /**
     * 第3步-B: 获取影响评估报告
     * GET /impact-report
     */
    router.get('/impact-report', async (req, res) => {
        try {
            const { workflowId, format = 'summary' } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取影响评估结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_3) {
                return error(res, '未找到影响评估结果，请先执行 POST /assess-impact', 404);
            }
            
            const impactResult = workflow.results.step_3;
            
            let report;
            if (format === 'detailed') {
                report = {
                    executiveSummary: {
                        overallRisk: impactResult.impactAssessment.overallRiskLevel,
                        riskScore: impactResult.riskMatrix.riskScore,
                        recommendation: impactResult.riskMatrix.acceptanceLevel,
                        keyFindings: [
                            `${impactResult.impactAssessment.upstreamImpacts.length} 个上游组件受影响`,
                            `${impactResult.impactAssessment.downstreamImpacts.length} 个下游组件受影响`,
                            `数据完整性: ${impactResult.impactAssessment.dataFlowImpacts.dataIntegrity}`,
                            `回滚复杂度: ${impactResult.impactAssessment.dataFlowImpacts.rollbackComplexity}`
                        ]
                    },
                    detailedAnalysis: impactResult.impactAssessment,
                    riskMatrix: impactResult.riskMatrix,
                    mitigationPlan: {
                        required: impactResult.riskMatrix.mitigationRequired,
                        backupStrategy: impactResult.impactAssessment.dataFlowImpacts.backupRequired,
                        rollbackPlan: `复杂度: ${impactResult.impactAssessment.dataFlowImpacts.rollbackComplexity}`
                    },
                    qualityMetrics: impactResult.analysisMetrics
                };
            } else {
                report = {
                    riskLevel: impactResult.impactAssessment.overallRiskLevel,
                    riskScore: impactResult.riskMatrix.riskScore,
                    affectedComponents: impactResult.impactAssessment.upstreamImpacts.length + impactResult.impactAssessment.downstreamImpacts.length,
                    dataIntegrity: impactResult.impactAssessment.dataFlowImpacts.dataIntegrity,
                    rollbackComplexity: impactResult.impactAssessment.dataFlowImpacts.rollbackComplexity,
                    recommendation: impactResult.riskMatrix.acceptanceLevel,
                    confidence: impactResult.analysisMetrics.confidenceLevel
                };
            }

            success(res, report);
            
        } catch (err) {
            console.error('[ImpactReport] 获取影响评估报告失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

export default createIssuesRoutes;