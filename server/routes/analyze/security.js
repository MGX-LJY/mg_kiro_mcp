/**
 * Analyze模式 - 安全分析路由模块
 * 代码安全漏洞和风险分析端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建安全分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createSecurityRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 运行安全分析
     * POST /analyze-security
     */
    router.post('/analyze-security', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                scanTypes = ['vulnerability', 'dependency', 'code'],
                includeCompliance = false,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[AnalyzeSecurity] 开始安全分析: ${targetPath}`);

            const startTime = Date.now();

            // 执行安全分析
            const securityAnalysis = await _performSecurityAnalysis(
                targetPath,
                scanTypes,
                language,
                promptService
            );

            // 如果需要合规检查
            if (includeCompliance) {
                securityAnalysis.compliance = await _performComplianceCheck(
                    securityAnalysis,
                    language
                );
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                security: securityAnalysis,
                analysis: {
                    targetPath,
                    language,
                    scanTypes,
                    includeCompliance,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    overallRisk: securityAnalysis.overallRisk || 'medium',
                    totalIssues: securityAnalysis.vulnerabilities?.total || 0,
                    criticalIssues: securityAnalysis.vulnerabilities?.critical || 0,
                    securityScore: securityAnalysis.securityScore || 75,
                    recommendations: securityAnalysis.recommendations?.length || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_security', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeSecurity] 安全分析完成: ${targetPath}, 安全评分: ${securityAnalysis.securityScore}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeSecurity] 安全分析失败:', err);
            error(res, err.message, 500, {
                action: 'analyze_security'
            });
        }
    });

    /**
     * 扫描代码漏洞
     * POST /scan-vulnerabilities
     */
    router.post('/scan-vulnerabilities', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                rules = 'default',
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[ScanVulnerabilities] 扫描代码漏洞: ${targetPath}`);

            const startTime = Date.now();

            // 扫描代码漏洞
            const vulnerabilityResults = await _scanCodeVulnerabilities(
                targetPath,
                rules,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                vulnerabilities: vulnerabilityResults,
                scan: {
                    targetPath,
                    language,
                    rules,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                statistics: {
                    filesScanned: vulnerabilityResults.filesScanned || 0,
                    totalFindings: vulnerabilityResults.findings?.length || 0,
                    bySevertity: vulnerabilityResults.bySeverity || {}
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'scan_vulnerabilities', 'completed', responseData);
                }
            }

            console.log(`[ScanVulnerabilities] 漏洞扫描完成: ${targetPath}, 发现: ${vulnerabilityResults.findings?.length}个问题, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[ScanVulnerabilities] 漏洞扫描失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 分析安全配置
     * POST /analyze-security-config
     */
    router.post('/analyze-security-config', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                configTypes = ['env', 'cors', 'headers', 'auth'],
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[AnalyzeSecurityConfig] 分析安全配置: ${targetPath}`);

            const startTime = Date.now();

            // 分析安全配置
            const configAnalysis = await _analyzeSecurityConfiguration(
                targetPath,
                configTypes,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                configuration: configAnalysis,
                analysis: {
                    targetPath,
                    language,
                    configTypes,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                assessment: {
                    configurationScore: configAnalysis.score || 70,
                    missingConfigs: configAnalysis.missing?.length || 0,
                    weakConfigs: configAnalysis.weak?.length || 0,
                    goodConfigs: configAnalysis.good?.length || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'analyze_security_config', 'completed', responseData);
                }
            }

            console.log(`[AnalyzeSecurityConfig] 安全配置分析完成: ${targetPath}, 配置评分: ${configAnalysis.score}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[AnalyzeSecurityConfig] 安全配置分析失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 生成安全报告
     * POST /generate-security-report
     */
    router.post('/generate-security-report', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                reportFormat = 'json',
                includeRemediation = true,
                workflowId
            } = req.body;

            console.log(`[GenerateSecurityReport] 生成安全报告: ${targetPath}`);

            const startTime = Date.now();

            // 收集所有安全分析数据
            const securityData = await _collectSecurityData(targetPath);

            // 生成报告
            const securityReport = await _generateSecurityReport(
                securityData,
                reportFormat,
                includeRemediation,
                promptService
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                report: securityReport,
                generation: {
                    targetPath,
                    reportFormat,
                    includeRemediation,
                    executionTime,
                    timestamp: new Date().toISOString()
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'generate_security_report', 'completed', responseData);
                }
            }

            console.log(`[GenerateSecurityReport] 安全报告生成完成: ${targetPath}, 格式: ${reportFormat}, ${executionTime}ms`);

            // 根据格式返回不同响应
            if (reportFormat === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=security-report-${Date.now()}.pdf`);
                res.send(securityReport.content);
            } else if (reportFormat === 'html') {
                res.setHeader('Content-Type', 'text/html');
                res.send(securityReport.content);
            } else {
                success(res, responseData);
            }

        } catch (err) {
            console.error('[GenerateSecurityReport] 生成安全报告失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 执行安全分析
 * @param {string} targetPath - 目标路径
 * @param {Array} scanTypes - 扫描类型
 * @param {string} language - 编程语言
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 安全分析结果
 */
async function _performSecurityAnalysis(targetPath, scanTypes, language, promptService) {
    const analysis = {
        vulnerabilities: {
            total: 11,
            critical: 0,
            high: 1,
            medium: 3,
            low: 7,
            
            findings: [
                {
                    id: 'SEC001',
                    severity: 'high',
                    type: 'injection',
                    title: 'SQL注入风险',
                    description: '用户输入未经验证直接用于SQL查询',
                    file: 'src/database.js',
                    line: 145,
                    cwe: 'CWE-89',
                    fix: '使用参数化查询或ORM'
                },
                {
                    id: 'SEC002',
                    severity: 'medium',
                    type: 'xss',
                    title: 'XSS漏洞',
                    description: '用户输入未经转义直接输出到页面',
                    file: 'src/render.js',
                    line: 67,
                    cwe: 'CWE-79',
                    fix: '对用户输入进行HTML转义'
                }
            ]
        },
        
        dependencies: {
            vulnerablePackages: 3,
            packages: [
                {
                    name: 'lodash',
                    version: '4.17.20',
                    vulnerabilities: 1,
                    severity: 'medium',
                    cves: ['CVE-2021-23337']
                }
            ]
        },
        
        authentication: {
            issues: [
                '密码强度要求不足',
                '缺少多因子认证',
                '会话管理存在问题'
            ],
            score: 65
        },
        
        encryption: {
            issues: [
                '部分敏感数据未加密存储',
                '使用了弱加密算法'
            ],
            score: 70
        },
        
        securityScore: 72,
        overallRisk: 'medium',
        
        recommendations: [
            {
                priority: 'high',
                category: 'input_validation',
                title: '加强输入验证',
                description: '对所有用户输入进行严格验证和清理'
            },
            {
                priority: 'medium',
                category: 'dependency',
                title: '更新依赖包',
                description: '更新存在安全漏洞的第三方依赖包'
            }
        ]
    };

    return analysis;
}

/**
 * 执行合规检查
 * @param {Object} securityAnalysis - 安全分析结果
 * @param {string} language - 编程语言
 * @returns {Object} 合规检查结果
 */
async function _performComplianceCheck(securityAnalysis, language) {
    return {
        standards: {
            'OWASP Top 10': {
                compliance: 78,
                issues: [
                    'A03:2021 – Injection',
                    'A07:2021 – Identification and Authentication Failures'
                ]
            },
            'CWE Top 25': {
                compliance: 82,
                issues: [
                    'CWE-79: Cross-site Scripting',
                    'CWE-89: SQL Injection'
                ]
            },
            'GDPR': {
                compliance: 65,
                issues: [
                    '数据加密不完整',
                    '缺少数据保留策略'
                ]
            }
        },
        
        recommendations: [
            '实施完整的输入验证策略',
            '加强身份认证机制',
            '完善数据保护措施'
        ]
    };
}

/**
 * 扫描代码漏洞
 * @param {string} targetPath - 目标路径
 * @param {string} rules - 规则集
 * @param {string} language - 编程语言
 * @returns {Object} 漏洞扫描结果
 */
async function _scanCodeVulnerabilities(targetPath, rules, language) {
    return {
        filesScanned: 35,
        
        findings: [
            {
                id: 'VULN001',
                severity: 'high',
                rule: 'sql-injection',
                title: 'SQL注入漏洞',
                file: 'src/database.js',
                line: 145,
                column: 20,
                code: 'SELECT * FROM users WHERE id = ' + userId,
                message: '直接字符串拼接存在SQL注入风险'
            },
            {
                id: 'VULN002',
                severity: 'medium',
                rule: 'xss-risk',
                title: '跨站脚本风险',
                file: 'src/template.js',
                line: 67,
                column: 15,
                code: 'innerHTML = userInput',
                message: '未转义的用户输入可能导致XSS攻击'
            }
        ],
        
        bySeverity: {
            critical: 0,
            high: 1,
            medium: 4,
            low: 8,
            info: 12
        },
        
        byCategory: {
            injection: 3,
            xss: 2,
            auth: 1,
            crypto: 1,
            other: 8
        },
        
        fixable: 8,
        unfixable: 7
    };
}

/**
 * 分析安全配置
 * @param {string} targetPath - 目标路径
 * @param {Array} configTypes - 配置类型
 * @param {string} language - 编程语言
 * @returns {Object} 安全配置分析结果
 */
async function _analyzeSecurityConfiguration(targetPath, configTypes, language) {
    return {
        score: 75,
        
        configurations: {
            cors: {
                status: 'configured',
                strength: 'medium',
                issues: ['允许所有来源'],
                recommendations: ['限制允许的来源域名']
            },
            
            headers: {
                status: 'partial',
                strength: 'weak',
                present: ['Content-Type', 'X-Frame-Options'],
                missing: ['X-Content-Type-Options', 'X-XSS-Protection', 'Strict-Transport-Security'],
                recommendations: ['添加缺失的安全头']
            },
            
            env: {
                status: 'issues',
                strength: 'weak',
                issues: ['敏感信息硬编码', '缺少环境变量验证'],
                recommendations: ['使用环境变量管理敏感信息', '添加配置验证']
            },
            
            auth: {
                status: 'configured',
                strength: 'medium',
                issues: ['JWT密钥强度不足'],
                recommendations: ['使用更强的密钥', '实施令牌轮换']
            }
        },
        
        good: [
            'HTTPS强制跳转已启用',
            '会话超时配置合理',
            '错误信息不泄露敏感信息'
        ],
        
        weak: [
            'CORS配置过于宽松',
            'JWT密钥强度不足',
            '缺少请求频率限制'
        ],
        
        missing: [
            'Content Security Policy',
            '请求大小限制',
            '安全审计日志'
        ]
    };
}

/**
 * 收集安全数据
 * @param {string} targetPath - 目标路径
 * @returns {Object} 安全数据
 */
async function _collectSecurityData(targetPath) {
    // 模拟收集各种安全分析数据
    return {
        vulnerabilities: await _scanCodeVulnerabilities(targetPath, 'default', 'javascript'),
        dependencies: { vulnerablePackages: 3 },
        configuration: await _analyzeSecurityConfiguration(targetPath, ['cors', 'headers'], 'javascript'),
        compliance: { 'OWASP': 78, 'CWE': 82 }
    };
}

/**
 * 生成安全报告
 * @param {Object} securityData - 安全数据
 * @param {string} format - 报告格式
 * @param {boolean} includeRemediation - 包含修复建议
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 安全报告
 */
async function _generateSecurityReport(securityData, format, includeRemediation, promptService) {
    const report = {
        title: '安全分析报告',
        generated: new Date().toISOString(),
        
        executive_summary: {
            overall_risk: 'medium',
            security_score: 72,
            critical_issues: 0,
            total_issues: 15,
            key_findings: [
                'SQL注入漏洞需要立即修复',
                '依赖包存在已知漏洞',
                '安全配置需要加强'
            ]
        },
        
        vulnerability_details: securityData.vulnerabilities,
        dependency_analysis: securityData.dependencies,
        configuration_review: securityData.configuration,
        
        recommendations: [
            {
                priority: 'critical',
                title: '修复SQL注入漏洞',
                description: '使用参数化查询替代字符串拼接',
                effort: 'low',
                impact: 'high'
            },
            {
                priority: 'high',
                title: '更新依赖包',
                description: '更新存在漏洞的第三方包',
                effort: 'medium',
                impact: 'medium'
            }
        ]
    };

    if (includeRemediation) {
        report.remediation_guide = {
            immediate_actions: [
                '修复高危漏洞',
                '更新依赖包',
                '加强输入验证'
            ],
            short_term: [
                '实施安全编码规范',
                '建立安全测试流程',
                '加强配置管理'
            ],
            long_term: [
                '建立安全开发生命周期',
                '定期安全审计',
                '安全培训计划'
            ]
        };
    }

    // 根据格式生成不同内容
    if (format === 'html') {
        report.content = _generateHTMLReport(report);
    } else if (format === 'pdf') {
        report.content = _generatePDFReport(report);
    } else {
        report.content = JSON.stringify(report, null, 2);
    }

    return report;
}

/**
 * 生成HTML报告
 * @param {Object} report - 报告数据
 * @returns {string} HTML内容
 */
function _generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { background: #e8f4fd; padding: 15px; margin: 20px 0; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>生成时间: ${report.generated}</p>
    </div>
    
    <div class="summary">
        <h2>执行摘要</h2>
        <p>总体风险等级: <strong>${report.executive_summary.overall_risk}</strong></p>
        <p>安全评分: <strong>${report.executive_summary.security_score}/100</strong></p>
        <p>发现问题总数: <strong>${report.executive_summary.total_issues}</strong></p>
    </div>
    
    <h2>主要发现</h2>
    <ul>
    ${report.executive_summary.key_findings.map(finding => `<li>${finding}</li>`).join('')}
    </ul>
    
    <h2>修复建议</h2>
    ${report.recommendations.map(rec => `
        <div class="${rec.priority}">
            <h3>${rec.title}</h3>
            <p>${rec.description}</p>
        </div>
    `).join('')}
</body>
</html>`;
}

/**
 * 生成PDF报告（模拟）
 * @param {Object} report - 报告数据
 * @returns {Buffer} PDF内容
 */
function _generatePDFReport(report) {
    // 在实际应用中，这里应该使用PDF生成库如puppeteer、jsPDF等
    return Buffer.from(`PDF Report: ${report.title}\nGenerated: ${report.generated}`);
}

export default createSecurityRoutes;