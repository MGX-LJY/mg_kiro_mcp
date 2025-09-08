/**
 * Fix模式 - 修复应用路由模块
 * 修复应用和验证端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建修复应用路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createFixesRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 应用修复
     * POST /apply-fix
     */
    router.post('/apply-fix', async (req, res) => {
        try {
            const { 
                issueId, 
                fixCode, 
                files = [],
                testChanges = false,
                backupFiles = true,
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            if (!fixCode && !files.length) {
                return error(res, '必须提供修复代码或文件修改列表', 400);
            }

            console.log(`[ApplyFix] 开始应用修复: ${issueId}`);

            const startTime = Date.now();

            // 获取问题信息
            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 检查问题是否已诊断
            if (!issue.diagnosis) {
                return error(res, `问题 ${issueId} 尚未进行诊断，请先执行诊断`, 400);
            }

            // 验证修复方案
            const validationResult = await _validateFix(issue, fixCode, files, language);
            if (!validationResult.valid) {
                return error(res, '修复方案验证失败', 400, {
                    validationErrors: validationResult.errors
                });
            }

            // 创建备份（如果需要）
            let backup = null;
            if (backupFiles) {
                backup = await _createBackup(files, issueId);
            }

            // 应用修复
            const applyResult = await _applyFixChanges(fixCode, files, language, promptService);

            // 如果需要测试，运行自动化测试
            let testResults = null;
            if (testChanges) {
                testResults = await _runAutomatedTests(issue, applyResult);
            }

            const executionTime = Date.now() - startTime;

            // 记录修复操作
            const fixRecord = {
                issueId,
                appliedAt: new Date().toISOString(),
                fixCode,
                modifiedFiles: files,
                backup,
                testResults,
                status: 'applied',
                executionTime,
                appliedBy: 'system', // 在实际应用中应该是当前用户
                language
            };

            const responseData = {
                fix: fixRecord,
                changes: applyResult.changes,
                verification: {
                    backupCreated: !!backup,
                    testsRun: !!testResults,
                    changesSummary: applyResult.summary,
                    riskAssessment: _assessFixRisk(fixRecord, applyResult)
                },
                nextSteps: [
                    '验证修复效果',
                    '运行完整测试套件',
                    '监控系统稳定性',
                    '更新文档'
                ]
            };

            // 更新问题状态
            issue.fix = fixRecord;
            issue.status = 'fixed';
            issue.updatedAt = new Date().toISOString();

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'apply_fix', 'completed', responseData);
                }
            }

            console.log(`[ApplyFix] 修复 ${issueId} 应用成功: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[ApplyFix] 应用修复失败:', err);
            return error(res, err.message, 500, {
                action: 'apply_fix',
                issueId: req.body.issueId
            });
        }
    });

    /**
     * 验证修复
     * POST /verify-fix
     */
    router.post('/verify-fix', async (req, res) => {
        try {
            const { 
                issueId, 
                tests = [],
                verificationSteps = [],
                runFullTestSuite = false,
                workflowId
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[VerifyFix] 开始验证修复: ${issueId}`);

            const startTime = Date.now();

            // 获取问题信息
            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 检查问题是否已应用修复
            if (!issue.fix || issue.status !== 'fixed') {
                return error(res, `问题 ${issueId} 尚未应用修复`, 400);
            }

            // 执行验证测试
            const verificationResult = await _performFixVerification(
                issue, 
                tests, 
                verificationSteps,
                runFullTestSuite
            );

            const executionTime = Date.now() - startTime;

            // 创建验证记录
            const verification = {
                issueId,
                verifiedAt: new Date().toISOString(),
                tests,
                verificationSteps,
                results: verificationResult,
                executionTime,
                status: verificationResult.success ? 'verified' : 'failed',
                verifiedBy: 'system'
            };

            const responseData = {
                verification,
                summary: {
                    totalTests: verificationResult.totalTests,
                    passedTests: verificationResult.passedTests,
                    failedTests: verificationResult.failedTests,
                    overallSuccess: verificationResult.success,
                    confidence: verificationResult.confidence
                },
                details: {
                    testResults: verificationResult.testDetails,
                    performanceMetrics: verificationResult.performance,
                    regressionAnalysis: verificationResult.regression
                },
                recommendations: _generateVerificationRecommendations(verificationResult)
            };

            // 更新问题状态
            issue.verification = verification;
            issue.status = verificationResult.success ? 'verified' : 'fix_failed';
            issue.updatedAt = new Date().toISOString();

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'verify_fix', 'completed', responseData);
                }
            }

            console.log(`[VerifyFix] 修复 ${issueId} 验证完成: ${verificationResult.success ? '成功' : '失败'}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[VerifyFix] 验证修复失败:', err);
            return error(res, err.message, 500, {
                action: 'verify_fix',
                issueId: req.body.issueId
            });
        }
    });

    /**
     * 回滚修复
     * POST /rollback-fix
     */
    router.post('/rollback-fix', async (req, res) => {
        try {
            const { 
                issueId, 
                reason = 'manual_rollback',
                restoreFromBackup = true,
                workflowId
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[RollbackFix] 开始回滚修复: ${issueId}`);

            const startTime = Date.now();

            // 获取问题信息
            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 检查是否有可回滚的修复
            if (!issue.fix) {
                return error(res, `问题 ${issueId} 没有可回滚的修复`, 400);
            }

            // 执行回滚操作
            const rollbackResult = await _performRollback(
                issue.fix, 
                restoreFromBackup,
                reason
            );

            const executionTime = Date.now() - startTime;

            // 创建回滚记录
            const rollback = {
                issueId,
                originalFix: issue.fix,
                rolledBackAt: new Date().toISOString(),
                reason,
                restoreFromBackup,
                rollbackDetails: rollbackResult,
                executionTime,
                rolledBackBy: 'system'
            };

            const responseData = {
                rollback,
                result: rollbackResult,
                summary: {
                    success: rollbackResult.success,
                    filesRestored: rollbackResult.restoredFiles?.length || 0,
                    changesReverted: rollbackResult.revertedChanges?.length || 0
                },
                nextSteps: rollbackResult.success ? [
                    '确认系统恢复正常',
                    '分析修复失败原因',
                    '制定新的修复方案'
                ] : [
                    '手动检查文件状态',
                    '恢复关键功能',
                    '联系技术支持'
                ]
            };

            // 更新问题状态
            if (rollbackResult.success) {
                issue.rollback = rollback;
                issue.status = 'open'; // 回滚后问题重新开放
                issue.fix = null; // 清除失败的修复记录
            } else {
                issue.rollbackAttempts = (issue.rollbackAttempts || 0) + 1;
                issue.lastRollbackError = rollbackResult.error;
            }
            issue.updatedAt = new Date().toISOString();

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'rollback_fix', 'completed', responseData);
                }
            }

            console.log(`[RollbackFix] 修复 ${issueId} 回滚${rollbackResult.success ? '成功' : '失败'}: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[RollbackFix] 回滚修复失败:', err);
            return error(res, err.message, 500, {
                action: 'rollback_fix',
                issueId: req.body.issueId
            });
        }
    });

    /**
     * 获取修复历史
     * GET /fix-history/:issueId
     */
    router.get('/fix-history/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[FixHistory] 获取修复历史: ${issueId}`);

            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            // 构建修复历史
            const history = _buildFixHistory(issue);

            const responseData = {
                issueId,
                history,
                summary: {
                    totalAttempts: history.length,
                    successfulFixes: history.filter(h => h.status === 'verified').length,
                    failedFixes: history.filter(h => h.status === 'failed').length,
                    rollbacks: history.filter(h => h.type === 'rollback').length
                },
                timeline: _buildFixTimeline(history)
            };

            success(res, responseData);

        } catch (err) {
            console.error('[FixHistory] 获取修复历史失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 生成修复补丁
     * POST /generate-patch
     */
    router.post('/generate-patch', async (req, res) => {
        try {
            const { 
                issueId, 
                format = 'git',
                includeTests = true,
                workflowId
            } = req.body;
            
            if (!issueId) {
                return error(res, '问题ID不能为空', 400);
            }

            console.log(`[GeneratePatch] 生成修复补丁: ${issueId}`);

            const issue = _getIssueById(issueId);
            if (!issue) {
                return error(res, `问题不存在: ${issueId}`, 404);
            }

            if (!issue.fix) {
                return error(res, `问题 ${issueId} 没有可用的修复`, 400);
            }

            // 生成补丁文件
            const patch = await _generatePatch(issue.fix, format, includeTests);

            const responseData = {
                issueId,
                patch,
                metadata: {
                    format,
                    includeTests,
                    generatedAt: new Date().toISOString(),
                    fileCount: patch.files?.length || 0,
                    lineChanges: {
                        added: patch.stats?.additions || 0,
                        removed: patch.stats?.deletions || 0,
                        modified: patch.stats?.modifications || 0
                    }
                },
                usage: {
                    gitApply: `git apply ${patch.filename}`,
                    gitAm: `git am ${patch.filename}`,
                    manual: '手动应用补丁内容'
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'generate_patch', 'completed', responseData);
                }
            }

            success(res, responseData);

        } catch (err) {
            console.error('[GeneratePatch] 生成补丁失败:', err);
            return error(res, err.message, 500);
        }
    });

    
    /**
     * 模拟获取问题数据
 * @param {string} issueId - 问题ID
 * @returns {Object|null} 问题数据
 */
function _getIssueById(issueId) {
    // 模拟问题数据，实际应用中应从数据库获取
    return {
        id: issueId,
        title: 'Sample Issue',
        description: 'This is a sample issue',
        severity: 'medium',
        status: 'diagnosed',
        diagnosis: {
            rootCause: { description: 'Null pointer exception' },
            confidence: 0.8
        }
    };
}

/**
 * 验证修复方案
 * @param {Object} issue - 问题对象
 * @param {string} fixCode - 修复代码
 * @param {Array} files - 文件列表
 * @param {string} language - 编程语言
 * @returns {Object} 验证结果
 */
async function _validateFix(issue, fixCode, files, language) {
    const errors = [];
    
    // 基本验证
    if (!fixCode && !files.length) {
        errors.push('必须提供修复代码或文件修改');
    }
    
    // 语法验证（简化版）
    if (fixCode && language === 'javascript') {
        try {
            // 简单的语法检查
            new Function(fixCode);
        } catch (syntaxError) {
            errors.push(`JavaScript语法错误: ${syntaxError.message}`);
        }
    }
    
    // 文件路径验证
    for (const file of files) {
        if (!file.path || !file.content) {
            errors.push(`文件 ${file.path || '未知'} 缺少路径或内容`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 创建文件备份
 * @param {Array} files - 文件列表
 * @param {string} issueId - 问题ID
 * @returns {Object} 备份信息
 */
async function _createBackup(files, issueId) {
    const backupId = `backup-${issueId}-${Date.now()}`;
    
    // 模拟备份创建
    const backup = {
        id: backupId,
        createdAt: new Date().toISOString(),
        files: files.map(file => ({
            path: file.path,
            originalContent: file.originalContent || '// Original content',
            size: file.originalContent?.length || 0
        })),
        location: `/backups/${backupId}`,
        compressed: true
    };
    
    return backup;
}

/**
 * 应用修复更改
 * @param {string} fixCode - 修复代码
 * @param {Array} files - 文件列表
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 应用结果
 */
async function _applyFixChanges(fixCode, files, language, promptService) {
    const changes = [];
    const summary = {
        filesModified: files.length,
        linesAdded: 0,
        linesRemoved: 0,
        linesModified: 0
    };
    
    // 处理每个文件的修改
    for (const file of files) {
        const change = {
            file: file.path,
            type: file.type || 'modify',
            changes: file.changes || [],
            status: 'applied'
        };
        
        // 统计行数变化
        if (file.changes) {
            file.changes.forEach(ch => {
                if (ch.type === 'add') summary.linesAdded++;
                else if (ch.type === 'remove') summary.linesRemoved++;
                else if (ch.type === 'modify') summary.linesModified++;
            });
        }
        
        changes.push(change);
    }
    
    // 如果有直接的修复代码，将其作为一个独立的更改
    if (fixCode) {
        changes.push({
            file: 'inline_fix.js',
            type: 'code_injection',
            content: fixCode,
            status: 'applied'
        });
    }
    
    return {
        success: true,
        changes,
        summary,
        appliedAt: new Date().toISOString()
    };
}

/**
 * 运行自动化测试
 * @param {Object} issue - 问题对象
 * @param {Object} applyResult - 应用结果
 * @returns {Object} 测试结果
 */
async function _runAutomatedTests(issue, applyResult) {
    // 模拟测试执行
    const testResults = {
        totalTests: 10,
        passedTests: 8,
        failedTests: 2,
        skippedTests: 0,
        executionTime: 5000,
        testSuites: [
            {
                name: 'Unit Tests',
                tests: 6,
                passed: 5,
                failed: 1
            },
            {
                name: 'Integration Tests',
                tests: 4,
                passed: 3,
                failed: 1
            }
        ],
        failureDetails: [
            {
                test: 'should handle null input',
                error: 'Expected null handling but got undefined',
                file: 'test/unit.test.js',
                line: 25
            },
            {
                test: 'integration flow should work',
                error: 'Connection timeout',
                file: 'test/integration.test.js',
                line: 15
            }
        ]
    };
    
    return testResults;
}

/**
 * 评估修复风险
 * @param {Object} fixRecord - 修复记录
 * @param {Object} applyResult - 应用结果
 * @returns {Object} 风险评估
 */
function _assessFixRisk(fixRecord, applyResult) {
    let riskLevel = 'low';
    const riskFactors = [];
    
    // 基于修改文件数量评估风险
    if (fixRecord.modifiedFiles.length > 5) {
        riskLevel = 'medium';
        riskFactors.push('修改文件数量较多');
    }
    
    // 基于修改行数评估风险
    const totalLines = applyResult.summary.linesAdded + 
                      applyResult.summary.linesRemoved + 
                      applyResult.summary.linesModified;
    
    if (totalLines > 100) {
        riskLevel = 'high';
        riskFactors.push('代码更改量较大');
    }
    
    // 基于是否有测试评估风险
    if (!fixRecord.testResults) {
        riskFactors.push('未运行自动化测试');
    }
    
    return {
        level: riskLevel,
        factors: riskFactors,
        score: riskLevel === 'high' ? 8 : riskLevel === 'medium' ? 5 : 2,
        recommendations: _getRiskRecommendations(riskLevel, riskFactors)
    };
}

/**
 * 执行修复验证
 * @param {Object} issue - 问题对象
 * @param {Array} tests - 测试列表
 * @param {Array} verificationSteps - 验证步骤
 * @param {boolean} runFullTestSuite - 是否运行完整测试套件
 * @returns {Object} 验证结果
 */
async function _performFixVerification(issue, tests, verificationSteps, runFullTestSuite) {
    // 模拟验证过程
    const verificationResult = {
        success: true,
        confidence: 0.9,
        totalTests: tests.length + (runFullTestSuite ? 50 : 0),
        passedTests: 0,
        failedTests: 0,
        testDetails: [],
        performance: {
            responseTime: '150ms',
            memoryUsage: 'stable',
            cpuUsage: 'normal'
        },
        regression: {
            detected: false,
            affectedFeatures: []
        }
    };
    
    // 执行自定义测试
    for (const test of tests) {
        const testResult = {
            name: test.name,
            status: Math.random() > 0.1 ? 'passed' : 'failed',
            executionTime: Math.round(Math.random() * 1000),
            description: test.description
        };
        
        if (testResult.status === 'passed') {
            verificationResult.passedTests++;
        } else {
            verificationResult.failedTests++;
            verificationResult.success = false;
        }
        
        verificationResult.testDetails.push(testResult);
    }
    
    // 执行验证步骤
    for (const step of verificationSteps) {
        const stepResult = {
            step: step.description || step,
            status: Math.random() > 0.05 ? 'completed' : 'failed',
            details: `执行步骤: ${step.description || step}`
        };
        
        if (stepResult.status === 'failed') {
            verificationResult.success = false;
        }
    }
    
    // 如果运行完整测试套件
    if (runFullTestSuite) {
        const fullSuiteResult = await _runFullTestSuite();
        verificationResult.passedTests += fullSuiteResult.passed;
        verificationResult.failedTests += fullSuiteResult.failed;
        
        if (fullSuiteResult.failed > 0) {
            verificationResult.success = false;
        }
    }
    
    return verificationResult;
}

/**
 * 执行回滚操作
 * @param {Object} fixRecord - 修复记录
 * @param {boolean} restoreFromBackup - 是否从备份恢复
 * @param {string} reason - 回滚原因
 * @returns {Object} 回滚结果
 */
async function _performRollback(fixRecord, restoreFromBackup, reason) {
    try {
        const rollbackResult = {
            success: true,
            restoredFiles: [],
            revertedChanges: [],
            rollbackMethod: restoreFromBackup ? 'backup_restore' : 'git_revert'
        };
        
        if (restoreFromBackup && fixRecord.backup) {
            // 从备份恢复
            for (const file of fixRecord.backup.files) {
                rollbackResult.restoredFiles.push({
                    path: file.path,
                    restoredFrom: fixRecord.backup.id,
                    status: 'restored'
                });
            }
        } else {
            // 手动回滚更改
            for (const file of fixRecord.modifiedFiles) {
                rollbackResult.revertedChanges.push({
                    file: file.path,
                    action: 'reverted',
                    status: 'success'
                });
            }
        }
        
        return rollbackResult;
    } catch (error) {
        return {
            success: false,
            error: error.message,
            partialRollback: true
        };
    }
}

/**
 * 生成验证建议
 * @param {Object} verificationResult - 验证结果
 * @returns {Array} 建议列表
 */
function _generateVerificationRecommendations(verificationResult) {
    const recommendations = [];
    
    if (!verificationResult.success) {
        recommendations.push({
            type: 'critical',
            message: '验证失败，建议分析失败原因并重新修复',
            action: '检查失败的测试用例'
        });
    }
    
    if (verificationResult.failedTests > 0) {
        recommendations.push({
            type: 'warning',
            message: `有 ${verificationResult.failedTests} 个测试失败`,
            action: '修复失败的测试或确认是否为预期行为'
        });
    }
    
    if (verificationResult.regression.detected) {
        recommendations.push({
            type: 'critical',
            message: '检测到功能回归',
            action: '立即回滚修复并重新分析'
        });
    }
    
    if (verificationResult.confidence < 0.7) {
        recommendations.push({
            type: 'info',
            message: '验证置信度较低',
            action: '考虑增加更多测试用例'
        });
    }
    
    return recommendations;
}

/**
 * 构建修复历史
 * @param {Object} issue - 问题对象
 * @returns {Array} 历史记录
 */
function _buildFixHistory(issue) {
    const history = [];
    
    if (issue.fix) {
        history.push({
            type: 'fix',
            timestamp: issue.fix.appliedAt,
            status: issue.verification?.status || 'applied',
            details: issue.fix
        });
    }
    
    if (issue.verification) {
        history.push({
            type: 'verification',
            timestamp: issue.verification.verifiedAt,
            status: issue.verification.status,
            details: issue.verification
        });
    }
    
    if (issue.rollback) {
        history.push({
            type: 'rollback',
            timestamp: issue.rollback.rolledBackAt,
            status: 'completed',
            details: issue.rollback
        });
    }
    
    return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * 构建修复时间线
 * @param {Array} history - 历史记录
 * @returns {Array} 时间线
 */
function _buildFixTimeline(history) {
    return history.map((entry, index) => ({
        step: index + 1,
        type: entry.type,
        timestamp: entry.timestamp,
        status: entry.status,
        duration: index < history.length - 1 ? 
            new Date(history[index + 1].timestamp) - new Date(entry.timestamp) : 
            null
    }));
}

/**
 * 生成补丁文件
 * @param {Object} fixRecord - 修复记录
 * @param {string} format - 格式
 * @param {boolean} includeTests - 是否包含测试
 * @returns {Object} 补丁文件
 */
async function _generatePatch(fixRecord, format, includeTests) {
    const patchContent = [];
    const stats = { additions: 0, deletions: 0, modifications: 0 };
    
    // 生成补丁头部
    patchContent.push(`--- Fix for Issue: ${fixRecord.issueId}`);
    patchContent.push(`--- Applied at: ${fixRecord.appliedAt}`);
    patchContent.push(`--- Language: ${fixRecord.language}`);
    patchContent.push('');
    
    // 处理每个修改的文件
    for (const file of fixRecord.modifiedFiles) {
        patchContent.push(`diff --git a/${file.path} b/${file.path}`);
        patchContent.push(`--- a/${file.path}`);
        patchContent.push(`+++ b/${file.path}`);
        
        // 模拟差异内容
        if (file.changes) {
            file.changes.forEach((change, index) => {
                if (change.type === 'add') {
                    patchContent.push(`+${change.line}`);
                    stats.additions++;
                } else if (change.type === 'remove') {
                    patchContent.push(`-${change.line}`);
                    stats.deletions++;
                } else if (change.type === 'modify') {
                    patchContent.push(`-${change.oldLine}`);
                    patchContent.push(`+${change.newLine}`);
                    stats.modifications++;
                }
            });
        }
        
        patchContent.push('');
    }
    
    // 如果包含直接的修复代码
    if (fixRecord.fixCode) {
        patchContent.push('--- Inline Fix Code ---');
        patchContent.push(fixRecord.fixCode);
        patchContent.push('');
    }
    
    const filename = `fix-${fixRecord.issueId}-${Date.now()}.patch`;
    
    return {
        filename,
        content: patchContent.join('\n'),
        format,
        stats,
        files: fixRecord.modifiedFiles.map(f => f.path),
        size: patchContent.join('\n').length,
        includeTests
    };
}

/**
 * 获取风险建议
 * @param {string} riskLevel - 风险级别
 * @param {Array} riskFactors - 风险因子
 * @returns {Array} 建议列表
 */
function _getRiskRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    if (riskLevel === 'high') {
        recommendations.push('建议在测试环境中充分验证');
        recommendations.push('考虑分阶段部署');
        recommendations.push('准备快速回滚方案');
    }
    
    if (riskFactors.includes('未运行自动化测试')) {
        recommendations.push('强烈建议运行完整测试套件');
    }
    
    if (riskFactors.includes('代码更改量较大')) {
        recommendations.push('考虑拆分为多个小的修复');
    }
    
    return recommendations;
}

/**
 * 运行完整测试套件
 * @returns {Object} 测试结果
 */
async function _runFullTestSuite() {
    // 模拟完整测试套件执行
    return {
        passed: 45,
        failed: 5,
        executionTime: 120000
    };
}

    // ========== AI驱动Fix模式第4-6步工作流端点 ==========

    /**
     * 第4步: 修复方案设计 - AI基于语言特性设计
     * POST /design-solution
     */
    router.post('/design-solution', async (req, res) => {
        try {
            const { 
                workflowId,
                issueId,
                impactAssessment,
                language = 'javascript',
                solutionPreferences = {}
            } = req.body;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            console.log(`[DesignSolution] AI修复方案设计: ${workflowId || issueId}`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 修复方案设计
            const aiAnalysisPackage = {
                // 方案设计数据
                solutionData: {
                    workflowId,
                    issueId,
                    impactAssessment,
                    language,
                    solutionPreferences,
                    designDate: new Date().toISOString()
                },
                
                // 前置步骤数据
                contextData: {
                    scopeAnalysis: workflowId ? 'step_1_results' : null,
                    documentRetrieval: workflowId ? 'step_2_results' : null,
                    impactAssessment: workflowId ? 'step_3_results' : null
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'solution-design-analysis.md',
                    documentTemplate: 'solution-design-report.md',
                    analysisType: 'language_specific_solution_design',
                    complexity: 'comprehensive'
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 4,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockSolutionResult = {
                solutionDesign: {
                    primarySolution: {
                        approach: 'error_handling_enhancement',
                        confidence: 0.92,
                        description: '增强认证服务的错误处理机制',
                        codeChanges: [
                            {
                                file: 'src/auth/service.js',
                                changeType: 'modification',
                                linesAffected: [42, 45, 67],
                                description: '添加更完善的错误处理和日志记录',
                                complexity: 'low'
                            },
                            {
                                file: 'src/auth/middleware.js',
                                changeType: 'addition',
                                linesAffected: [23],
                                description: '增加错误回调处理函数',
                                complexity: 'low'
                            }
                        ],
                        languageSpecific: {
                            jsFeatures: ['try-catch-finally', 'promise-rejection-handling', 'error-first-callbacks'],
                            bestPractices: ['explicit error types', 'structured logging', 'graceful degradation'],
                            testingStrategy: ['unit tests for error paths', 'integration error scenarios']
                        }
                    },
                    alternativeSolutions: [
                        {
                            approach: 'circuit_breaker_pattern',
                            confidence: 0.85,
                            description: '实现熔断器模式预防级联故障',
                            pros: ['系统稳定性提升', '自动恢复能力'],
                            cons: ['增加复杂度', '需要监控配置']
                        },
                        {
                            approach: 'retry_with_backoff',
                            confidence: 0.78,
                            description: '实现指数退避重试机制',
                            pros: ['简单易实现', '处理瞬时错误'],
                            cons: ['可能延长响应时间', '需要合理配置重试次数']
                        }
                    ],
                    implementationPlan: {
                        phases: [
                            {
                                phase: 1,
                                name: '核心错误处理',
                                duration: '2-3小时',
                                steps: [
                                    '修改src/auth/service.js的错误处理逻辑',
                                    '添加结构化错误日志',
                                    '单元测试覆盖错误路径'
                                ]
                            },
                            {
                                phase: 2,
                                name: '中间件增强',
                                duration: '1-2小时',
                                steps: [
                                    '更新认证中间件错误处理',
                                    '集成测试验证',
                                    '性能基准测试'
                                ]
                            }
                        ],
                        totalEstimate: '4-6小时',
                        riskMitigation: [
                            '在测试环境先验证',
                            '保留原代码备份',
                            '分阶段部署验证'
                        ]
                    },
                    qualityAssurance: {
                        testingRequirements: [
                            '错误场景单元测试',
                            '认证流程集成测试',
                            '负载测试验证',
                            '安全测试确保无新漏洞'
                        ],
                        codeReviewChecklist: [
                            '错误处理完整性',
                            '日志信息敏感性',
                            '性能影响评估',
                            '向后兼容性'
                        ],
                        rollbackStrategy: {
                            triggerConditions: ['错误率超过基线10%', '响应时间增加超过100ms'],
                            rollbackSteps: ['停止新部署', '恢复备份代码', '验证系统稳定性'],
                            estimatedTime: '10-15分钟'
                        }
                    }
                },
                analysisMetrics: {
                    solutionQuality: 92,
                    implementationFeasibility: 88,
                    riskLevel: 'low',
                    confidenceScore: 90
                },
                analysisId: `ai-solution-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'solution-design-analysis.md',
                    aiDocumentTemplate: 'solution-design-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const solutionResult = mockSolutionResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 3, 'completed', solutionResult);
                }
            }
            
            const responseData = {
                // AI分析数据包
                aiAnalysisPackage,
                
                // 修复方案设计结果
                solutionDesign: solutionResult.solutionDesign,
                analysisMetrics: solutionResult.analysisMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 4,
                    stepName: 'design_solution',
                    analysisId: solutionResult.analysisId,
                    analysisDuration: solutionResult.analysisDuration,
                    timestamp: solutionResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[DesignSolution] AI修复方案设计完成: ${solutionResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[DesignSolution] AI方案设计失败:', err);
            return error(res, err.message, 500, {
                step: 4,
                stepName: 'design_solution'
            });
        }
    });

    /**
     * 第4步-B: 获取特定问题的修复方案
     * GET /solution/:issueId
     */
    router.get('/solution/:issueId', async (req, res) => {
        try {
            const { issueId } = req.params;
            const { workflowId, solutionType = 'primary' } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取方案设计结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_4) {
                return error(res, '未找到修复方案，请先执行 POST /design-solution', 404);
            }
            
            const solutionResult = workflow.results.step_4;
            let solution;
            
            if (solutionType === 'primary') {
                solution = {
                    approach: solutionResult.solutionDesign.primarySolution.approach,
                    confidence: solutionResult.solutionDesign.primarySolution.confidence,
                    description: solutionResult.solutionDesign.primarySolution.description,
                    codeChanges: solutionResult.solutionDesign.primarySolution.codeChanges,
                    implementationPlan: solutionResult.solutionDesign.implementationPlan,
                    qualityAssurance: solutionResult.solutionDesign.qualityAssurance
                };
            } else if (solutionType === 'alternatives') {
                solution = {
                    alternatives: solutionResult.solutionDesign.alternativeSolutions,
                    comparison: solutionResult.solutionDesign.alternativeSolutions.map(alt => ({
                        approach: alt.approach,
                        confidence: alt.confidence,
                        pros: alt.pros,
                        cons: alt.cons
                    }))
                };
            } else {
                solution = solutionResult.solutionDesign;
            }

            success(res, {
                issueId,
                solutionType,
                solution,
                metadata: {
                    workflowId,
                    analysisId: solutionResult.analysisId,
                    timestamp: solutionResult.timestamp
                }
            });
            
        } catch (err) {
            console.error('[GetSolution] 获取修复方案失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第5步: 代码更新执行 - AI精准执行修复
     * POST /apply-changes
     */
    router.post('/apply-changes', async (req, res) => {
        try {
            const { 
                workflowId,
                issueId,
                solutionId,
                executeImmediately = false,
                dryRun = false,
                language = 'javascript'
            } = req.body;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            console.log(`[ApplyChanges] AI代码更新执行: ${workflowId || issueId} (DryRun: ${dryRun})`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 代码更新执行
            const aiAnalysisPackage = {
                // 执行数据
                executionData: {
                    workflowId,
                    issueId,
                    solutionId,
                    executeImmediately,
                    dryRun,
                    language,
                    executionDate: new Date().toISOString()
                },
                
                // 前置步骤数据
                contextData: {
                    solutionDesign: workflowId ? 'step_4_results' : null,
                    impactAssessment: workflowId ? 'step_3_results' : null
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'code-execution-analysis.md',
                    documentTemplate: 'code-execution-report.md',
                    analysisType: 'precise_code_application',
                    executionMode: dryRun ? 'simulation' : 'actual'
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 5,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockExecutionResult = {
                codeExecution: {
                    executionStatus: dryRun ? 'simulated' : 'completed',
                    appliedChanges: [
                        {
                            file: 'src/auth/service.js',
                            changeType: 'modification',
                            linesModified: [42, 43, 44, 45, 67],
                            backupCreated: true,
                            backupPath: 'backups/auth-service-2024-09-08.js',
                            checksumBefore: 'abc123def456',
                            checksumAfter: 'def456ghi789'
                        },
                        {
                            file: 'src/auth/middleware.js',
                            changeType: 'addition',
                            linesAdded: [23, 24, 25],
                            backupCreated: true,
                            backupPath: 'backups/auth-middleware-2024-09-08.js',
                            checksumAfter: 'ghi789jkl012'
                        }
                    ],
                    testResults: {
                        preExecutionTests: {
                            totalTests: 28,
                            passed: 25,
                            failed: 3,
                            duration: 2300
                        },
                        postExecutionTests: dryRun ? null : {
                            totalTests: 28,
                            passed: 28,
                            failed: 0,
                            duration: 2450
                        },
                        coverageReport: {
                            before: 78.5,
                            after: dryRun ? null : 82.1,
                            improvement: dryRun ? null : '+3.6%'
                        }
                    },
                    performanceImpact: dryRun ? null : {
                        responseTimeChange: '+2ms',
                        memoryUsageChange: '+0.1MB',
                        cpuUsageChange: 'negligible'
                    },
                    validationResults: {
                        syntaxCheck: 'passed',
                        linting: 'passed',
                        typeChecking: 'passed',
                        securityScan: 'no_issues'
                    }
                },
                executionMetrics: {
                    executionTime: Date.now() - startTime,
                    filesModified: 2,
                    linesChanged: 8,
                    successRate: dryRun ? 100 : 100,
                    rollbackAvailable: true
                },
                analysisId: `ai-execution-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'code-execution-analysis.md',
                    aiDocumentTemplate: 'code-execution-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const executionResult = mockExecutionResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 4, 'completed', executionResult);
                }
            }
            
            const responseData = {
                // AI分析数据包
                aiAnalysisPackage,
                
                // 代码执行结果
                codeExecution: executionResult.codeExecution,
                executionMetrics: executionResult.executionMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 5,
                    stepName: 'apply_changes',
                    analysisId: executionResult.analysisId,
                    analysisDuration: executionResult.analysisDuration,
                    timestamp: executionResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[ApplyChanges] AI代码更新执行完成: ${executionResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[ApplyChanges] AI代码执行失败:', err);
            return error(res, err.message, 500, {
                step: 5,
                stepName: 'apply_changes'
            });
        }
    });

    /**
     * 第5步-B: 获取修复执行状态
     * GET /changes-status
     */
    router.get('/changes-status', async (req, res) => {
        try {
            const { workflowId, executionId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取执行结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_5) {
                return error(res, '未找到执行结果，请先执行 POST /apply-changes', 404);
            }
            
            const executionResult = workflow.results.step_5;
            
            const status = {
                executionStatus: executionResult.codeExecution.executionStatus,
                summary: {
                    filesModified: executionResult.executionMetrics.filesModified,
                    linesChanged: executionResult.executionMetrics.linesChanged,
                    executionTime: executionResult.executionMetrics.executionTime,
                    successRate: executionResult.executionMetrics.successRate
                },
                changes: executionResult.codeExecution.appliedChanges.map(change => ({
                    file: change.file,
                    changeType: change.changeType,
                    status: 'completed',
                    backupAvailable: change.backupCreated
                })),
                testResults: executionResult.codeExecution.testResults.postExecutionTests,
                validation: executionResult.codeExecution.validationResults,
                rollbackInfo: {
                    available: executionResult.executionMetrics.rollbackAvailable,
                    backupPaths: executionResult.codeExecution.appliedChanges
                        .filter(change => change.backupCreated)
                        .map(change => change.backupPath)
                }
            };

            success(res, status);
            
        } catch (err) {
            console.error('[ChangesStatus] 获取执行状态失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第6步: 文档同步更新 - AI智能更新相关文档
     * POST /update-docs
     */
    router.post('/update-docs', async (req, res) => {
        try {
            const { 
                workflowId,
                issueId,
                codeChanges = [],
                updateScope = 'affected_only',
                language = 'javascript'
            } = req.body;
            
            if (!workflowId && !issueId) {
                return error(res, '工作流ID或问题ID不能为空', 400);
            }

            console.log(`[UpdateDocs] AI文档同步更新: ${workflowId || issueId}`);
            
            const startTime = Date.now();
            
            // 准备AI分析数据包 - 文档同步更新
            const aiAnalysisPackage = {
                // 更新数据
                documentationData: {
                    workflowId,
                    issueId,
                    codeChanges,
                    updateScope,
                    language,
                    updateDate: new Date().toISOString()
                },
                
                // 前置步骤数据
                contextData: {
                    codeExecution: workflowId ? 'step_5_results' : null,
                    solutionDesign: workflowId ? 'step_4_results' : null,
                    documentRetrieval: workflowId ? 'step_2_results' : null
                },
                
                // AI处理指令
                aiInstructions: {
                    analysisTemplate: 'documentation-update-analysis.md',
                    documentTemplate: 'documentation-update-report.md',
                    analysisType: 'synchronized_documentation_update',
                    updateScope: updateScope
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    mode: 'fix',
                    step: 6,
                    timestamp: new Date().toISOString()
                }
            };
            
            // AI分析结果 (实际使用时由AI完成)
            const mockDocsUpdateResult = {
                documentationUpdate: {
                    updatedDocuments: [
                        {
                            documentType: 'api',
                            title: '认证API文档',
                            path: 'docs/api/authentication.md',
                            updateType: 'section_modification',
                            sectionsUpdated: ['错误处理', '状态码说明'],
                            changes: [
                                {
                                    section: '错误处理',
                                    changeType: 'enhancement',
                                    description: '更新错误处理流程说明，增加新的错误类型和处理方式'
                                },
                                {
                                    section: '状态码说明',
                                    changeType: 'addition',
                                    description: '新增认证错误的详细状态码说明'
                                }
                            ],
                            backupCreated: true,
                            backupPath: 'docs/backups/authentication-2024-09-08.md'
                        },
                        {
                            documentType: 'troubleshooting',
                            title: '认证问题排查指南',
                            path: 'docs/troubleshooting/auth-issues.md',
                            updateType: 'content_addition',
                            sectionsUpdated: ['解决方案'],
                            changes: [
                                {
                                    section: '解决方案',
                                    changeType: 'addition',
                                    description: '新增错误处理改进方案的说明'
                                }
                            ],
                            backupCreated: true,
                            backupPath: 'docs/backups/auth-issues-2024-09-08.md'
                        }
                    ],
                    codeDocumentation: [
                        {
                            file: 'src/auth/service.js',
                            updateType: 'inline_comments',
                            changes: [
                                {
                                    lineNumber: 42,
                                    changeType: 'addition',
                                    content: '// 增强的错误处理：捕获并记录认证失败详情'
                                },
                                {
                                    lineNumber: 67,
                                    changeType: 'modification',
                                    content: '// 更新：使用结构化日志格式记录错误信息'
                                }
                            ]
                        },
                        {
                            file: 'src/auth/middleware.js',
                            updateType: 'jsdoc_comments',
                            changes: [
                                {
                                    lineNumber: 23,
                                    changeType: 'addition',
                                    content: '/**\n * 认证错误回调处理函数\n * @param {Error} error - 认证错误对象\n * @param {Object} context - 请求上下文\n */'
                                }
                            ]
                        }
                    ],
                    updateSummary: {
                        totalDocumentsUpdated: 2,
                        totalCodeFilesDocumented: 2,
                        backupsCreated: 2,
                        updateComplexity: 'low',
                        consistencyMaintained: true
                    }
                },
                validationResults: {
                    linkValidation: 'passed',
                    markdownSyntax: 'passed',
                    codeExampleValidation: 'passed',
                    crossReferenceCheck: 'passed'
                },
                analysisMetrics: {
                    updateAccuracy: 94,
                    consistencyScore: 96,
                    completenessScore: 92
                },
                analysisId: `ai-docs-update-${Date.now()}`,
                analysisDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                metadata: {
                    mode: 'ai-driven',
                    aiAnalysisTemplate: 'documentation-update-analysis.md',
                    aiDocumentTemplate: 'documentation-update-report.md'
                }
            };
            
            // 使用模拟结果（实际使用时由AI生成）
            const docsUpdateResult = mockDocsUpdateResult;
            
            // 更新工作流状态
            if (workflowId) {
                let workflow = workflowService.getWorkflow(workflowId);
                if (!workflow) {
                    workflowService.createWorkflowWithId(workflowId, '/unknown', 'fix');
                    workflow = workflowService.getWorkflow(workflowId);
                }
                if (workflow) {
                    workflowService.updateStep(workflowId, 5, 'completed', docsUpdateResult);
                }
            }
            
            const responseData = {
                // AI分析数据包
                aiAnalysisPackage,
                
                // 文档更新结果
                documentationUpdate: docsUpdateResult.documentationUpdate,
                validationResults: docsUpdateResult.validationResults,
                analysisMetrics: docsUpdateResult.analysisMetrics,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 6,
                    stepName: 'update_docs',
                    analysisId: docsUpdateResult.analysisId,
                    analysisDuration: docsUpdateResult.analysisDuration,
                    timestamp: docsUpdateResult.timestamp
                }
            };

            success(res, responseData);

            console.log(`[UpdateDocs] AI文档同步更新完成: ${docsUpdateResult.analysisDuration}ms`);
            
        } catch (err) {
            console.error('[UpdateDocs] AI文档更新失败:', err);
            return error(res, err.message, 500, {
                step: 6,
                stepName: 'update_docs'
            });
        }
    });

    /**
     * 第6步-B: 获取更新的文档清单
     * GET /updated-docs
     */
    router.get('/updated-docs', async (req, res) => {
        try {
            const { workflowId, documentType } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            // 从工作流中获取文档更新结果
            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow || !workflow.results.step_6) {
                return error(res, '未找到文档更新结果，请先执行 POST /update-docs', 404);
            }
            
            const docsUpdateResult = workflow.results.step_6;
            
            let updatedDocs = {
                documents: docsUpdateResult.documentationUpdate.updatedDocuments,
                codeDocumentation: docsUpdateResult.documentationUpdate.codeDocumentation,
                summary: docsUpdateResult.documentationUpdate.updateSummary
            };
            
            // 根据文档类型过滤
            if (documentType) {
                updatedDocs.documents = updatedDocs.documents.filter(doc => 
                    doc.documentType === documentType
                );
            }
            
            // 添加访问链接和预览信息
            updatedDocs.documents = updatedDocs.documents.map(doc => ({
                ...doc,
                accessUrl: `file://${doc.path}`,
                backupUrl: doc.backupCreated ? `file://${doc.backupPath}` : null,
                lastModified: new Date().toISOString(),
                changesSummary: `${doc.changes.length}个更新: ${doc.changes.map(c => c.changeType).join(', ')}`
            }));
            
            updatedDocs.metadata = {
                workflowId,
                updateTimestamp: docsUpdateResult.timestamp,
                validationStatus: docsUpdateResult.validationResults,
                qualityMetrics: docsUpdateResult.analysisMetrics
            };

            success(res, updatedDocs);
            
        } catch (err) {
            console.error('[UpdatedDocs] 获取更新文档清单失败:', err);
            return error(res, err.message, 500);
        }
    });

    return router;
}

export default createFixesRoutes;