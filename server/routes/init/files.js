/**
 * Init模式 - 第3步：文件内容通读路由模块
 * 文件内容分析和概览端点
 * 
 * 📁 已集成FileContentAnalyzer - 文件内容深度分析系统
 * - 基于前两步的智能分析结果进行文件内容分析
 * - 代码质量指标和复杂度评估
 * - 依赖关系图和重要性分析
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { FileContentAnalyzer } from '../../analyzers/file-content-analyzer.js';

/**
 * 创建文件内容分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createFilesRoutes(services) {
    const router = express.Router();
    const { workflowService, server } = services;

    /**
     * 通用文件扫描端点
     * POST /scan
     */
    router.post('/scan', async (req, res) => {
        try {
            const { path, options = {} } = req.body;
            
            if (!path) {
                return error(res, '缺少必需参数: path', 400);
            }

            // 验证路径是否存在
            const fs = await import('fs');
            if (!fs.existsSync(path)) {
                return error(res, `路径不存在: ${path}`, 400);
            }

            // 使用projectScanner进行文件扫描
            const { projectScanner } = services;
            const scanResult = await projectScanner.scanProject(path, {
                recursive: options.recursive !== false,
                includeHidden: options.includeHidden || false,
                maxDepth: options.maxDepth || 3,
                ...options
            });

            const responseData = {
                path,
                summary: {
                    totalFiles: scanResult.files?.length || 0,
                    totalDirectories: scanResult.directories?.length || 0,
                    fileTypes: scanResult.fileTypes || {},
                    languages: scanResult.languages || []
                },
                files: scanResult.files || [],
                directories: scanResult.directories || [],
                metadata: {
                    scannedAt: new Date().toISOString(),
                    scanDepth: options.maxDepth || 3,
                    options: options
                }
            };

            return success(res, responseData, '文件扫描完成');

        } catch (err) {
            console.error('[Files] 文件扫描失败:', err);
            return error(res, `文件扫描失败: ${err.message}`, 500);
        }
    });

    /**
     * 第3步-A: 智能文件内容分析
     * POST /scan-files
     */
    router.post('/scan-files', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 检查前置步骤是否完成 (需要完成步骤1和2才能执行步骤3)
            if (workflow.currentStep < 2) {
                return error(res, '请先完成第1步(项目结构分析)和第2步(语言检测)', 400);
            }

            const step1Results = workflow.results.step_1;
            const step2Results = workflow.results.step_2;

            if (!step1Results || !step2Results) {
                return error(res, '缺少前置步骤的分析结果', 400);
            }

            console.log(`[Files] 开始增强文件内容分析: ${workflow.projectPath}`);
            
            // 更新步骤状态为运行中 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'running');
            
            // 📁 使用文件内容分析器进行深度分析
            console.log(`[FileContentAnalyzer] 启动文件内容分析器...`);
            const fileAnalyzer = new FileContentAnalyzer(workflow.projectPath);
            
            // 智能集成：基于前两步的分析结果
            const contextData = {
                // 第1步：智能分层分析结果
                structureAnalysis: {
                    architectureInsights: step1Results.intelligentAnalysis?.architectureInsights,
                    moduleInsights: step1Results.intelligentAnalysis?.moduleInsights,
                    totalModules: step1Results.intelligentAnalysis?.moduleInsights?.totalModules || 0
                },
                // 第2步：增强语言检测结果
                languageData: {
                    primaryLanguage: step2Results.detection.primaryLanguage,
                    confidence: step2Results.workflowIntegration.confidenceScore,
                    frameworks: step2Results.detection.techStack.frameworks || [],
                    techStack: step2Results.detection.techStack,
                    enhancedAnalysis: step2Results.enhancedAnalysis || {}
                }
            };
            
            // 执行文件内容分析
            const fileAnalysisResults = await fileAnalyzer.performDeepAnalysis({
                // 基于前面步骤的上下文进行优化分析
                contextData,
                // 分析配置
                analysisOptions: {
                    includeCodeMetrics: true,
                    analyzeDependencies: true,
                    assessQuality: true,
                    detectPatterns: true,
                    calculateComplexity: true
                }
            });
            
            // 转换文件分析结果为兼容格式
            const analysisResult = _convertFileAnalysisResultsToLegacyFormat(
                fileAnalysisResults,
                contextData,
                workflow.projectPath
            );
            
            // 更新步骤状态为已完成 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'completed', {
                ...analysisResult,
                aiAnalysisPackage // 包含AI分析数据包
            });
            
            // AI驱动架构响应数据
            const responseData = {
                // AI分析数据包 (提供给AI使用)
                aiAnalysisPackage,
                
                // 模拟分析结果 (实际由AI生成)
                analysis: analysisResult.analysis,
                overview: analysisResult.overview,
                files: analysisResult.files,
                dependencies: analysisResult.dependencies,
                importance: analysisResult.importance,
                recommendations: analysisResult.recommendations,
                technicalDebt: analysisResult.technicalDebt,
                
                // 元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 3,
                    stepName: 'scan_files',
                    timestamp: analysisResult.timestamp,
                    aiAnalysisTemplate: 'file-content-analysis.md',
                    aiOverviewTemplate: 'file-overview-generation.md'
                }
            };

            workflowSuccess(res, 3, 'scan_files', workflowId, responseData, workflowService.getProgress(workflowId));

            console.log(`[FileContentAnalyzer] 文件内容分析完成: ${workflow.projectPath}`);
            console.log(`[FileContentAnalyzer] 分析文件: ${fileAnalysisResults.totalFiles || 0} 个, 代码行数: ${fileAnalysisResults.totalLines || 0}`);
            console.log(`[FileContentAnalyzer] 质量评分: ${fileAnalysisResults.qualityScore || 0}/100, 复杂度: ${fileAnalysisResults.complexity || 'unknown'}`);
            console.log(`[FileContentAnalyzer] 发现模式: ${fileAnalysisResults.patterns?.length || 0} 个`);
            
        } catch (err) {
            console.error('[Files] 文件内容分析失败:', err);
            
            // 更新步骤状态为失败 (第3步：文件内容通读)
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 3, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 3,
                stepName: 'scan_files'
            });
        }
    });

    /**
     * 第3步-B: 获取文件内容概览
     * GET /files-overview
     */
    router.get('/files-overview', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const analysisResult = workflow.results.step_3;
            if (!analysisResult) {
                console.warn(`[Files] 文件分析结果不存在 - workflowId: ${workflowId}, 可用步骤结果: ${Object.keys(workflow.results || {}).join(', ')}`);
                return error(res, '文件内容分析结果不存在，请先执行 POST /scan-files', 404, {
                    workflowId,
                    currentStep: workflow.currentStep,
                    availableResults: Object.keys(workflow.results || {})
                });
            }

            // AI驱动的详细概览 (实际使用时由AI生成)
            const overview = {
                // 直接使用AI分析结果中的数据
                analysis: analysisResult.analysis,
                overview: analysisResult.overview,
                dependencies: analysisResult.dependencies?.statistics || {},
                recommendations: analysisResult.recommendations || [],
                
                // AI处理信息
                aiGenerated: true,
                aiTemplate: 'file-overview-generation.md',
                
                // 元数据
                metadata: {
                    workflowId,
                    timestamp: new Date().toISOString(),
                    step3Completed: true,
                    mode: 'ai-driven'
                }
            };

            workflowSuccess(res, 3, 'files_overview', workflowId, overview, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Files] 获取文件概览失败:', err);
            return error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 📁 转换文件内容分析结果为兼容格式
 * 保持API向后兼容，同时集成FileContentAnalyzer的丰富分析数据
 * @param {Object} fileAnalysisResults - 文件内容分析结果
 * @param {Object} contextData - 前置步骤的上下文数据
 * @param {string} projectPath - 项目路径
 * @returns {Object} 兼容格式的分析结果
 */
function _convertFileAnalysisResultsToLegacyFormat(fileAnalysisResults, contextData, projectPath) {
    const analysis = fileAnalysisResults.analysis || {};
    const metrics = fileAnalysisResults.metrics || {};
    const quality = fileAnalysisResults.quality || {};
    
    return {
        // 核心分析结果 - 基于真实文件内容分析
        analysis: {
            totalFilesAnalyzed: fileAnalysisResults.totalFiles || 0,
            analysisTime: fileAnalysisResults.analysisTime || 0,
            mainLanguage: contextData.languageData.primaryLanguage || 'unknown',
            confidence: Math.min((quality.overallScore || 75) / 100, 1.0)
        },
        
        // 文件列表和详细信息
        files: fileAnalysisResults.fileDetails || [],
        
        // 项目概览 - 基于真实分析数据
        overview: {
            distribution: _generateFileDistribution(fileAnalysisResults),
            complexity: _generateComplexityDistribution(fileAnalysisResults),
            codeMetrics: {
                totalLines: fileAnalysisResults.totalLines || 0,
                totalFunctions: metrics.totalFunctions || 0,
                totalClasses: metrics.totalClasses || 0,
                avgComplexity: metrics.averageComplexity || 0,
                duplicateCode: quality.duplicationRate || 0
            },
            qualityIndicators: {
                documentationCoverage: quality.documentationCoverage || 0,
                testCoverage: quality.testCoverage || 0,
                codeQualityScore: quality.overallScore || 0,
                maintainabilityIndex: quality.maintainabilityIndex || 0
            }
        },
        
        // 依赖关系分析 - 来自真实分析
        dependencies: {
            nodes: fileAnalysisResults.dependencies?.nodes || [],
            edges: fileAnalysisResults.dependencies?.edges || [],
            statistics: {
                totalNodes: fileAnalysisResults.dependencies?.totalNodes || 0,
                totalEdges: fileAnalysisResults.dependencies?.totalEdges || 0,
                maxDepth: fileAnalysisResults.dependencies?.maxDepth || 0,
                circularDependencies: fileAnalysisResults.dependencies?.circularCount || 0
            }
        },
        
        // 文件重要性评估 - 基于真实分析
        importance: _generateFileImportanceMap(fileAnalysisResults),
        
        // 智能推荐 - 基于实际分析结果
        recommendations: _generateSmartRecommendations(fileAnalysisResults, contextData),
        
        // 技术债务评估
        technicalDebt: {
            score: quality.technicalDebtScore || 0,
            issues: quality.technicalDebtIssues || []
        },
        
        // 📁 增强文件分析的专有数据
        enhancedFileAnalysis: {
            codePatterns: fileAnalysisResults.patterns || [],
            architecturalInsights: fileAnalysisResults.architecturalInsights || {},
            performanceHotspots: fileAnalysisResults.performanceHotspots || [],
            securityFindings: fileAnalysisResults.securityFindings || [],
            codeSmells: quality.codeSmells || []
        },
        
        // 元信息
        timestamp: new Date().toISOString(),
        metadata: {
            mode: 'enhanced-file-analysis',
            analyzerVersion: fileAnalysisResults.version || '2.0',
            contextualIntegration: true,
            previousStepsUsed: ['structure', 'language']
        }
    };
}

/**
 * 生成文件类型分布
 */
function _generateFileDistribution(fileAnalysisResults) {
    const distribution = {
        source: 0,
        config: 0,
        test: 0,
        documentation: 0,
        assets: 0
    };
    
    if (fileAnalysisResults.filesByType) {
        Object.entries(fileAnalysisResults.filesByType).forEach(([type, count]) => {
            switch (type) {
                case 'source':
                case 'code':
                    distribution.source = count;
                    break;
                case 'config':
                case 'configuration':
                    distribution.config = count;
                    break;
                case 'test':
                case 'spec':
                    distribution.test = count;
                    break;
                case 'doc':
                case 'documentation':
                    distribution.documentation = count;
                    break;
                default:
                    distribution.assets += count;
            }
        });
    }
    
    return distribution;
}

/**
 * 生成复杂度分布
 */
function _generateComplexityDistribution(fileAnalysisResults) {
    const complexity = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
    };
    
    if (fileAnalysisResults.complexityDistribution) {
        Object.assign(complexity, fileAnalysisResults.complexityDistribution);
    } else {
        // 基于整体复杂度评估分配
        const totalFiles = fileAnalysisResults.totalFiles || 0;
        const overallComplexity = fileAnalysisResults.complexity || 'medium';
        
        switch (overallComplexity) {
            case 'low':
                complexity.low = Math.floor(totalFiles * 0.7);
                complexity.medium = Math.floor(totalFiles * 0.2);
                complexity.high = Math.floor(totalFiles * 0.1);
                break;
            case 'medium':
                complexity.low = Math.floor(totalFiles * 0.4);
                complexity.medium = Math.floor(totalFiles * 0.4);
                complexity.high = Math.floor(totalFiles * 0.2);
                break;
            case 'high':
                complexity.low = Math.floor(totalFiles * 0.2);
                complexity.medium = Math.floor(totalFiles * 0.3);
                complexity.high = Math.floor(totalFiles * 0.4);
                complexity.critical = Math.floor(totalFiles * 0.1);
                break;
        }
    }
    
    return complexity;
}

/**
 * 生成文件重要性映射
 */
function _generateFileImportanceMap(fileAnalysisResults) {
    const importanceMap = {};
    
    if (fileAnalysisResults.fileImportance) {
        return fileAnalysisResults.fileImportance;
    }
    
    // 基于文件详情生成重要性评估
    if (fileAnalysisResults.fileDetails) {
        fileAnalysisResults.fileDetails.forEach(file => {
            let importance = 'medium';
            
            // 入口文件优先级最高
            if (file.isEntryPoint || file.path.includes('index.js') || file.path.includes('main.js')) {
                importance = 'critical';
            }
            // 配置文件重要性高
            else if (file.type === 'config' || file.path.includes('config')) {
                importance = 'high';
            }
            // 测试文件重要性较低
            else if (file.type === 'test' || file.path.includes('test')) {
                importance = 'low';
            }
            
            importanceMap[file.path] = importance;
        });
    }
    
    return importanceMap;
}

/**
 * 生成智能推荐
 */
function _generateSmartRecommendations(fileAnalysisResults, contextData) {
    const recommendations = [];
    
    // 基于质量评分生成推荐
    const qualityScore = fileAnalysisResults.quality?.overallScore || 0;
    if (qualityScore < 60) {
        recommendations.push({
            type: 'quality',
            priority: 'high',
            message: '代码质量偏低，建议重构和优化',
            files: fileAnalysisResults.quality?.lowQualityFiles || [],
            impact: '提高代码可维护性',
            effort: '高'
        });
    } else if (qualityScore < 80) {
        recommendations.push({
            type: 'quality',
            priority: 'medium',
            message: '增加代码注释和文档',
            files: fileAnalysisResults.quality?.underdocumentedFiles || [],
            impact: '提高代码可读性',
            effort: '中等'
        });
    }
    
    // 基于复杂度生成推荐
    if (fileAnalysisResults.complexity === 'high') {
        recommendations.push({
            type: 'complexity',
            priority: 'high',
            message: '项目复杂度较高，建议进行模块化重构',
            files: fileAnalysisResults.highComplexityFiles || [],
            impact: '降低维护成本',
            effort: '高'
        });
    }
    
    // 基于安全发现生成推荐
    if (fileAnalysisResults.securityFindings?.length > 0) {
        recommendations.push({
            type: 'security',
            priority: 'high',
            message: `发现 ${fileAnalysisResults.securityFindings.length} 个潜在安全问题`,
            files: fileAnalysisResults.securityFindings.map(f => f.file),
            impact: '提高系统安全性',
            effort: '中等'
        });
    }
    
    // 基于模块数量生成下一步推荐
    const totalModules = contextData.structureAnalysis.totalModules || 0;
    if (totalModules > 30) {
        recommendations.push({
            type: 'workflow',
            priority: 'medium',
            message: '建议进行深度模块分析以更好理解模块间关系',
            files: [],
            impact: '深入理解项目架构',
            effort: '低'
        });
    }
    
    return recommendations;
}

export default createFilesRoutes;