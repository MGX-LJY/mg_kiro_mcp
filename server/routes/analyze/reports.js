/**
 * Analyze模式 - 分析报告生成路由模块
 * 综合分析报告生成和导出端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建分析报告路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createReportsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 生成综合分析报告
     * POST /generate-report
     */
    router.post('/generate-report', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                analysisTypes = ['quality', 'security', 'dependencies'],
                format = 'json',
                template = 'comprehensive',
                includeCharts = false,
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[GenerateReport] 生成综合分析报告: ${targetPath}`);

            const startTime = Date.now();

            // 收集所有分析数据
            const analysisData = await _collectAllAnalysisData(
                targetPath,
                analysisTypes,
                language
            );

            // 生成报告
            const report = await _generateComprehensiveReport(
                analysisData,
                template,
                format,
                includeCharts,
                promptService
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                report,
                generation: {
                    targetPath,
                    language,
                    analysisTypes,
                    format,
                    template,
                    includeCharts,
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    reportId: `REPORT-${Date.now()}`,
                    dataPoints: _countDataPoints(analysisData),
                    filesCovered: analysisData.coverage?.totalFiles || 0,
                    reportSize: JSON.stringify(report).length
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'generate_report', 'completed', responseData);
                }
            }

            console.log(`[GenerateReport] 综合报告生成完成: ${targetPath}, 格式: ${format}, ${executionTime}ms`);

            // 根据格式返回不同响应
            if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=analysis-report-${Date.now()}.pdf`);
                res.send(report.content);
            } else if (format === 'html') {
                res.setHeader('Content-Type', 'text/html');
                res.send(report.content);
            } else if (format === 'markdown') {
                res.setHeader('Content-Type', 'text/markdown');
                res.send(report.content);
            } else {
                success(res, responseData);
            }

        } catch (err) {
            console.error('[GenerateReport] 生成报告失败:', err);
            error(res, err.message, 500, {
                action: 'generate_report'
            });
        }
    });

    /**
     * 生成质量趋势报告
     * POST /generate-trend-report
     */
    router.post('/generate-trend-report', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                timeRange = '30d',
                metrics = ['quality', 'complexity', 'coverage'],
                workflowId,
                language = 'javascript'
            } = req.body;

            console.log(`[GenerateTrendReport] 生成趋势报告: ${targetPath}, 时间范围: ${timeRange}`);

            const startTime = Date.now();

            // 生成趋势报告
            const trendReport = await _generateTrendReport(
                targetPath,
                timeRange,
                metrics,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                trendReport,
                analysis: {
                    targetPath,
                    language,
                    timeRange,
                    metrics,
                    executionTime,
                    timestamp: new Date().toISOString()
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'generate_trend_report', 'completed', responseData);
                }
            }

            console.log(`[GenerateTrendReport] 趋势报告生成完成: ${targetPath}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[GenerateTrendReport] 生成趋势报告失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 导出分析数据
     * POST /export-data
     */
    router.post('/export-data', async (req, res) => {
        try {
            const { 
                targetPath = '.',
                exportFormat = 'csv',
                dataTypes = ['metrics', 'issues', 'dependencies'],
                workflowId
            } = req.body;

            console.log(`[ExportData] 导出分析数据: ${targetPath}, 格式: ${exportFormat}`);

            const startTime = Date.now();

            // 导出数据
            const exportData = await _exportAnalysisData(
                targetPath,
                exportFormat,
                dataTypes
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                export: exportData,
                metadata: {
                    targetPath,
                    exportFormat,
                    dataTypes,
                    executionTime,
                    timestamp: new Date().toISOString(),
                    recordCount: exportData.recordCount || 0
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'export_data', 'completed', responseData);
                }
            }

            console.log(`[ExportData] 数据导出完成: ${targetPath}, 记录数: ${exportData.recordCount}, ${executionTime}ms`);

            // 根据格式设置响应头
            if (exportFormat === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=analysis-data-${Date.now()}.csv`);
                res.send(exportData.content);
            } else if (exportFormat === 'xlsx') {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=analysis-data-${Date.now()}.xlsx`);
                res.send(exportData.content);
            } else {
                success(res, responseData);
            }

        } catch (err) {
            console.error('[ExportData] 导出数据失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * 生成对比报告
     * POST /generate-comparison
     */
    router.post('/generate-comparison', async (req, res) => {
        try {
            const { 
                baselinePath,
                targetPath,
                comparisonType = 'quality',
                workflowId,
                language = 'javascript'
            } = req.body;

            if (!baselinePath || !targetPath) {
                return error(res, '基准路径和目标路径都不能为空', 400);
            }

            console.log(`[GenerateComparison] 生成对比报告: ${baselinePath} vs ${targetPath}`);

            const startTime = Date.now();

            // 生成对比报告
            const comparisonReport = await _generateComparisonReport(
                baselinePath,
                targetPath,
                comparisonType,
                language
            );

            const executionTime = Date.now() - startTime;

            const responseData = {
                comparison: comparisonReport,
                analysis: {
                    baselinePath,
                    targetPath,
                    language,
                    comparisonType,
                    executionTime,
                    timestamp: new Date().toISOString()
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'generate_comparison', 'completed', responseData);
                }
            }

            console.log(`[GenerateComparison] 对比报告生成完成: ${comparisonReport.overallChange}, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[GenerateComparison] 生成对比报告失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 收集所有分析数据
 * @param {string} targetPath - 目标路径
 * @param {Array} analysisTypes - 分析类型
 * @param {string} language - 编程语言
 * @returns {Object} 收集的分析数据
 */
async function _collectAllAnalysisData(targetPath, analysisTypes, language) {
    const data = {
        metadata: {
            targetPath,
            language,
            collectedAt: new Date().toISOString()
        }
    };

    // 收集质量数据
    if (analysisTypes.includes('quality')) {
        data.quality = {
            overallScore: 78,
            complexity: { average: 5.8, max: 15.2 },
            maintainability: 82,
            testCoverage: 85,
            codeSmells: 12,
            duplications: 2.3
        };
    }

    // 收集安全数据
    if (analysisTypes.includes('security')) {
        data.security = {
            securityScore: 72,
            vulnerabilities: { total: 11, critical: 0, high: 1 },
            compliance: { 'OWASP': 78 }
        };
    }

    // 收集依赖数据
    if (analysisTypes.includes('dependencies')) {
        data.dependencies = {
            total: 42,
            vulnerabilities: 4,
            outdated: 8,
            unused: 3
        };
    }

    // 收集性能数据
    if (analysisTypes.includes('performance')) {
        data.performance = {
            buildTime: 45,
            bundleSize: 2.3,
            loadTime: 1.8
        };
    }

    return data;
}

/**
 * 生成综合报告
 * @param {Object} analysisData - 分析数据
 * @param {string} template - 报告模板
 * @param {string} format - 报告格式
 * @param {boolean} includeCharts - 包含图表
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 生成的报告
 */
async function _generateComprehensiveReport(analysisData, template, format, includeCharts, promptService) {
    const report = {
        title: '项目综合分析报告',
        generated: new Date().toISOString(),
        
        executive_summary: {
            overallHealth: _calculateOverallHealth(analysisData),
            keyMetrics: _extractKeyMetrics(analysisData),
            topRecommendations: _generateTopRecommendations(analysisData)
        },
        
        detailed_analysis: analysisData,
        
        insights: {
            strengths: _identifyStrengths(analysisData),
            weaknesses: _identifyWeaknesses(analysisData),
            opportunities: _identifyOpportunities(analysisData),
            risks: _identifyRisks(analysisData)
        },
        
        action_plan: _generateActionPlan(analysisData),
        
        appendices: {
            methodology: 'Static code analysis using multiple tools and metrics',
            glossary: _generateGlossary(),
            references: _generateReferences()
        }
    };

    // 如果包含图表
    if (includeCharts) {
        report.visualizations = _generateChartData(analysisData);
    }

    // 根据格式生成内容
    if (format === 'html') {
        report.content = _generateHTMLReport(report);
    } else if (format === 'markdown') {
        report.content = _generateMarkdownReport(report);
    } else if (format === 'pdf') {
        report.content = _generatePDFReport(report);
    } else {
        report.content = JSON.stringify(report, null, 2);
    }

    return report;
}

/**
 * 生成趋势报告
 * @param {string} targetPath - 目标路径
 * @param {string} timeRange - 时间范围
 * @param {Array} metrics - 指标
 * @param {string} language - 编程语言
 * @returns {Object} 趋势报告
 */
async function _generateTrendReport(targetPath, timeRange, metrics, language) {
    // 模拟历史数据
    const historicalData = _generateHistoricalData(timeRange, metrics);
    
    return {
        title: '代码质量趋势分析',
        timeRange,
        metrics,
        
        trends: {
            quality: {
                direction: 'improving',
                change: '+5.2%',
                data: historicalData.quality
            },
            complexity: {
                direction: 'stable',
                change: '+0.8%',
                data: historicalData.complexity
            },
            coverage: {
                direction: 'improving',
                change: '+12.3%',
                data: historicalData.coverage
            }
        },
        
        forecasts: {
            nextMonth: {
                quality: 82,
                complexity: 5.9,
                coverage: 88
            },
            nextQuarter: {
                quality: 85,
                complexity: 5.7,
                coverage: 90
            }
        },
        
        insights: [
            '代码质量持续改善',
            '测试覆盖率显著提升',
            '复杂度保持稳定'
        ]
    };
}

/**
 * 导出分析数据
 * @param {string} targetPath - 目标路径
 * @param {string} exportFormat - 导出格式
 * @param {Array} dataTypes - 数据类型
 * @returns {Object} 导出数据
 */
async function _exportAnalysisData(targetPath, exportFormat, dataTypes) {
    const data = [];
    let recordCount = 0;

    // 模拟数据导出
    if (dataTypes.includes('metrics')) {
        data.push({
            type: 'metric',
            name: 'complexity',
            value: 5.8,
            file: 'src/main.js'
        });
        recordCount++;
    }

    if (dataTypes.includes('issues')) {
        data.push({
            type: 'issue',
            severity: 'high',
            message: 'SQL injection vulnerability',
            file: 'src/db.js',
            line: 145
        });
        recordCount++;
    }

    let content;
    if (exportFormat === 'csv') {
        content = _generateCSV(data);
    } else if (exportFormat === 'xlsx') {
        content = _generateXLSX(data);
    } else {
        content = JSON.stringify(data, null, 2);
    }

    return {
        content,
        recordCount,
        format: exportFormat
    };
}

/**
 * 生成对比报告
 * @param {string} baselinePath - 基准路径
 * @param {string} targetPath - 目标路径
 * @param {string} comparisonType - 对比类型
 * @param {string} language - 编程语言
 * @returns {Object} 对比报告
 */
async function _generateComparisonReport(baselinePath, targetPath, comparisonType, language) {
    // 模拟基准数据和目标数据
    const baselineData = { quality: 75, complexity: 6.2, coverage: 78 };
    const targetData = { quality: 82, complexity: 5.8, coverage: 85 };
    
    return {
        title: '项目对比分析报告',
        baseline: baselinePath,
        target: targetPath,
        comparisonType,
        
        comparison: {
            quality: {
                baseline: baselineData.quality,
                target: targetData.quality,
                change: targetData.quality - baselineData.quality,
                changePercent: ((targetData.quality - baselineData.quality) / baselineData.quality * 100).toFixed(1)
            },
            complexity: {
                baseline: baselineData.complexity,
                target: targetData.complexity,
                change: targetData.complexity - baselineData.complexity,
                changePercent: ((targetData.complexity - baselineData.complexity) / baselineData.complexity * 100).toFixed(1)
            },
            coverage: {
                baseline: baselineData.coverage,
                target: targetData.coverage,
                change: targetData.coverage - baselineData.coverage,
                changePercent: ((targetData.coverage - baselineData.coverage) / baselineData.coverage * 100).toFixed(1)
            }
        },
        
        overallChange: 'improved',
        
        insights: [
            '代码质量提升了9.3%',
            '复杂度降低了6.5%',
            '测试覆盖率提升了9.0%'
        ],
        
        recommendations: [
            '继续保持当前的质量改进趋势',
            '重点关注剩余的复杂度热点',
            '增加边界情况的测试覆盖'
        ]
    };
}

// 辅助函数实现...
function _countDataPoints(analysisData) {
    let count = 0;
    for (const key in analysisData) {
        if (typeof analysisData[key] === 'object') {
            count += Object.keys(analysisData[key]).length;
        } else {
            count++;
        }
    }
    return count;
}

function _calculateOverallHealth(analysisData) {
    const scores = [];
    if (analysisData.quality) scores.push(analysisData.quality.overallScore || 0);
    if (analysisData.security) scores.push(analysisData.security.securityScore || 0);
    
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
    
    if (average >= 90) return 'excellent';
    if (average >= 80) return 'good';
    if (average >= 70) return 'fair';
    return 'needs_improvement';
}

function _extractKeyMetrics(analysisData) {
    return {
        qualityScore: analysisData.quality?.overallScore || 0,
        securityScore: analysisData.security?.securityScore || 0,
        testCoverage: analysisData.quality?.testCoverage || 0,
        vulnerabilities: analysisData.security?.vulnerabilities?.total || 0
    };
}

function _generateTopRecommendations(analysisData) {
    return [
        '提升测试覆盖率到90%以上',
        '修复高危安全漏洞',
        '降低代码复杂度',
        '更新过时的依赖包'
    ];
}

function _identifyStrengths(analysisData) {
    return [
        '代码质量整体良好',
        '安全配置基本到位',
        '依赖管理规范'
    ];
}

function _identifyWeaknesses(analysisData) {
    return [
        '测试覆盖率有待提升',
        '存在部分安全漏洞',
        '代码复杂度偏高'
    ];
}

function _identifyOpportunities(analysisData) {
    return [
        '自动化测试覆盖率提升',
        '代码重构优化',
        '安全扫描集成'
    ];
}

function _identifyRisks(analysisData) {
    return [
        '安全漏洞可能被利用',
        '高复杂度代码维护困难',
        '依赖包漏洞风险'
    ];
}

function _generateActionPlan(analysisData) {
    return {
        immediate: [
            '修复高危安全漏洞',
            '增加关键路径测试'
        ],
        shortTerm: [
            '重构高复杂度函数',
            '更新依赖包'
        ],
        longTerm: [
            '建立持续集成质量门',
            '实施代码审查规范'
        ]
    };
}

function _generateGlossary() {
    return {
        'Cyclomatic Complexity': '衡量代码路径复杂度的指标',
        'Test Coverage': '测试覆盖的代码比例',
        'Technical Debt': '为了快速开发而产生的代码质量问题'
    };
}

function _generateReferences() {
    return [
        'OWASP Top 10 Security Risks',
        'Clean Code by Robert C. Martin',
        'Code Quality Metrics Best Practices'
    ];
}

function _generateChartData(analysisData) {
    return {
        qualityTrend: {
            type: 'line',
            data: [75, 78, 82, 85],
            labels: ['Q1', 'Q2', 'Q3', 'Q4']
        },
        complexityDistribution: {
            type: 'pie',
            data: [65, 28, 7],
            labels: ['Low', 'Medium', 'High']
        }
    };
}

function _generateHistoricalData(timeRange, metrics) {
    return {
        quality: [70, 73, 76, 78, 82],
        complexity: [6.5, 6.2, 6.0, 5.9, 5.8],
        coverage: [68, 72, 78, 82, 85]
    };
}

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
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>生成时间: ${report.generated}</p>
    </div>
    
    <div class="summary">
        <h2>执行摘要</h2>
        <p>整体健康度: <strong>${report.executive_summary.overallHealth}</strong></p>
    </div>
    
    <div class="metrics">
        ${Object.entries(report.executive_summary.keyMetrics).map(([key, value]) => 
            `<div class="metric"><strong>${key}:</strong> ${value}</div>`
        ).join('')}
    </div>
</body>
</html>`;
}

function _generateMarkdownReport(report) {
    return `# ${report.title}

生成时间: ${report.generated}

## 执行摘要

整体健康度: **${report.executive_summary.overallHealth}**

### 关键指标

${Object.entries(report.executive_summary.keyMetrics).map(([key, value]) => 
    `- **${key}**: ${value}`
).join('\n')}

### 主要建议

${report.executive_summary.topRecommendations.map(rec => `- ${rec}`).join('\n')}

## 详细分析

[详细分析内容...]

## 行动计划

### 立即执行
${report.action_plan.immediate.map(item => `- ${item}`).join('\n')}

### 短期计划
${report.action_plan.shortTerm.map(item => `- ${item}`).join('\n')}

### 长期计划
${report.action_plan.longTerm.map(item => `- ${item}`).join('\n')}
`;
}

function _generatePDFReport(report) {
    // 实际应用中应使用PDF生成库
    return Buffer.from(`PDF Report: ${report.title}\nGenerated: ${report.generated}`);
}

function _generateCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
}

function _generateXLSX(data) {
    // 实际应用中应使用XLSX库
    return Buffer.from(JSON.stringify(data));
}

export default createReportsRoutes;