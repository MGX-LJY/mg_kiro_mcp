/**
 * Init模式 - 第3步：文件内容通读路由模块
 * 文件内容分析和概览端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建文件内容分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createFilesRoutes(services) {
    const router = express.Router();
    const { workflowService, server } = services;

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

            console.log(`[Files] 开始文件内容分析: ${workflow.projectPath}`);
            
            // 更新步骤状态为运行中 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'running');
            
            // 准备项目数据
            const projectData = {
                projectPath: workflow.projectPath,
                structure: step1Results,
                languageData: {
                    primaryLanguage: step2Results.detection.primaryLanguage,
                    confidence: step2Results.workflowIntegration.confidenceScore,
                    frameworks: step2Results.detection.techStack.frameworks,
                    techStack: step2Results.detection.techStack
                }
            };
            
            // 执行文件内容分析
            const analysisResult = await server.fileContentAnalyzer.analyzeFiles(projectData);
            
            // 更新步骤状态为已完成 (第3步：文件内容通读)
            workflowService.updateStep(workflowId, 3, 'completed', analysisResult);
            
            // 构建响应数据
            const responseData = {
                ...analysisResult,
                metadata: {
                    ...analysisResult.metadata,
                    workflowId,
                    step: 3,
                    stepName: 'scan_files',
                    timestamp: new Date().toISOString()
                }
            };

            workflowSuccess(res, 3, 'scan_files', workflowId, responseData, workflowService.getProgress(workflowId));

            console.log(`[Files] 文件内容分析完成: ${workflow.projectPath} (${analysisResult.analysis.analysisTime}ms)`);
            
        } catch (err) {
            console.error('[Files] 文件内容分析失败:', err);
            
            // 更新步骤状态为失败 (第3步：文件内容通读)
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 3, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
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

            // 生成详细概览
            const overview = _generateFilesOverview(analysisResult, workflowId);

            workflowSuccess(res, 3, 'files_overview', workflowId, overview, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Files] 获取文件概览失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 生成文件内容详细概览
 * @param {Object} analysisResult - 分析结果
 * @param {string} workflowId - 工作流ID
 * @returns {Object} 文件概览
 */
function _generateFilesOverview(analysisResult, workflowId) {
    return {
        // 核心分析结果
        analysis: {
            totalFilesAnalyzed: analysisResult.analysis.totalFilesAnalyzed,
            analysisTime: analysisResult.analysis.analysisTime,
            mainLanguage: analysisResult.analysis.mainLanguage,
            confidence: analysisResult.analysis.confidence
        },
        
        // 文件分类概览
        fileDistribution: {
            byCategory: analysisResult.overview.distribution,
            byComplexity: analysisResult.overview.complexity,
            totalLines: analysisResult.overview.codeMetrics.totalLines,
            totalFunctions: analysisResult.overview.codeMetrics.totalFunctions,
            totalClasses: analysisResult.overview.codeMetrics.totalClasses
        },
        
        // 重要文件排序
        importantFiles: _getTopImportantFiles(analysisResult.files, analysisResult.importance, 10),
        
        // 依赖关系摘要
        dependencies: {
            totalNodes: analysisResult.dependencies.nodes.length,
            totalConnections: analysisResult.dependencies.edges.length,
            topDependencies: _getTopDependencies(analysisResult.dependencies, 5)
        },
        
        // 代码质量指标
        quality: {
            documentationCoverage: Math.round(analysisResult.overview.qualityIndicators.documentationCoverage * 100),
            testCoverage: Math.round(analysisResult.overview.qualityIndicators.testCoverage * 100),
            codeQualityScore: Math.round(analysisResult.overview.qualityIndicators.codeQualityScore),
            avgComplexity: Math.round(analysisResult.overview.codeMetrics.avgComplexity * 10) / 10
        },
        
        // 改进建议
        recommendations: analysisResult.recommendations.map(rec => ({
            type: rec.type,
            priority: rec.priority,
            message: rec.message,
            affectedFiles: rec.files ? rec.files.length : 0
        })),
        
        // 文件类型分布
        fileTypes: _analyzeFileTypes(analysisResult.files),
        
        // 技术栈洞察
        techInsights: _generateTechInsights(analysisResult.files, analysisResult.analysis.mainLanguage),
        
        // 元数据
        metadata: {
            timestamp: analysisResult.timestamp,
            workflowId,
            step3Completed: true,
            readyForStep4: _checkReadinessForStep4(analysisResult)
        }
    };
}

/**
 * Step 3 辅助方法 - 获取最重要的文件
 */
function _getTopImportantFiles(files, importance, limit = 10) {
    try {
        return files
            .map(file => ({
                path: file.relativePath,
                score: importance[file.relativePath] || 0,
                category: file.category,
                type: file.analysis?.type || 'unknown',
                complexity: file.analysis?.complexity?.rating || 'unknown',
                lines: file.content?.lines || 0
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    } catch (error) {
        console.error('获取重要文件失败:', error);
        return [];
    }
}

/**
 * 获取顶级依赖关系
 */
function _getTopDependencies(dependencies, limit = 5) {
    try {
        const dependencyCount = new Map();
        
        dependencies.edges.forEach(edge => {
            const dep = edge.to;
            dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
        });
        
        return Array.from(dependencyCount.entries())
            .map(([dep, count]) => ({ dependency: dep, references: count }))
            .sort((a, b) => b.references - a.references)
            .slice(0, limit);
    } catch (error) {
        console.error('获取顶级依赖失败:', error);
        return [];
    }
}

/**
 * 分析文件类型分布
 */
function _analyzeFileTypes(files) {
    try {
        const typeCount = new Map();
        const extensionCount = new Map();
        
        files.forEach(file => {
            const ext = file.relativePath.split('.').pop().toLowerCase();
            const type = file.analysis?.type || 'other';
            
            typeCount.set(type, (typeCount.get(type) || 0) + 1);
            extensionCount.set(ext, (extensionCount.get(ext) || 0) + 1);
        });
        
        return {
            byType: Object.fromEntries(typeCount),
            byExtension: Object.fromEntries(extensionCount)
        };
    } catch (error) {
        console.error('分析文件类型失败:', error);
        return { byType: {}, byExtension: {} };
    }
}

/**
 * 生成技术栈洞察
 */
function _generateTechInsights(files, mainLanguage) {
    try {
        const insights = {
            mainLanguage,
            languageSpecific: {},
            frameworks: new Set(),
            patterns: []
        };
        
        files.forEach(file => {
            // 收集框架信息
            if (file.analysis?.dependencies) {
                file.analysis.dependencies.forEach(dep => {
                    if (_isFramework(dep)) {
                        insights.frameworks.add(dep);
                    }
                });
            }
            
            // 语言特定洞察
            if (mainLanguage === 'python' && file.analysis?.pythonSpecific) {
                const py = file.analysis.pythonSpecific;
                insights.languageSpecific.usesTypeHints = py.usesTypeHints;
                insights.languageSpecific.usesAsyncAwait = py.usesAsyncAwait;
                insights.languageSpecific.hasMainGuard = py.hasMainGuard;
            }
            
            if (mainLanguage === 'javascript' && file.analysis?.javascriptSpecific) {
                const js = file.analysis.javascriptSpecific;
                insights.languageSpecific.usesES6 = js.usesES6;
                insights.languageSpecific.usesModules = js.usesModules;
                insights.languageSpecific.hasJSX = js.hasJSX;
            }
        });
        
        insights.frameworks = Array.from(insights.frameworks);
        
        // 生成模式识别
        if (insights.frameworks.length > 3) {
            insights.patterns.push('多框架架构');
        }
        
        if (mainLanguage === 'python' && insights.languageSpecific.usesAsyncAwait) {
            insights.patterns.push('异步Python开发');
        }
        
        return insights;
    } catch (error) {
        console.error('生成技术栈洞察失败:', error);
        return { mainLanguage, frameworks: [], patterns: [] };
    }
}

/**
 * 检查是否为框架
 */
function _isFramework(dependency) {
    const knownFrameworks = [
        'express', 'react', 'vue', 'angular', 'django', 'flask', 'fastapi',
        'spring', 'gin', 'axum', 'actix', 'tokio', 'pandas', 'numpy',
        'requests', 'aiohttp', 'socketio'
    ];
    
    return knownFrameworks.some(framework => 
        dependency.toLowerCase().includes(framework)
    );
}

/**
 * 检查Step 4准备就绪状态
 */
function _checkReadinessForStep4(analysisResult) {
    try {
        const requirements = {
            hasAnalyzedFiles: analysisResult.analysis?.totalFilesAnalyzed > 0,
            hasMainLanguage: !!analysisResult.analysis?.mainLanguage,
            hasQualityMetrics: !!analysisResult.overview?.qualityIndicators,
            hasRecommendations: analysisResult.recommendations?.length > 0
        };
        
        const readyCount = Object.values(requirements).filter(Boolean).length;
        const totalRequirements = Object.keys(requirements).length;
        
        return {
            ready: readyCount === totalRequirements,
            score: Math.round((readyCount / totalRequirements) * 100),
            requirements,
            missingRequirements: Object.entries(requirements)
                .filter(([_, ready]) => !ready)
                .map(([req, _]) => req)
        };
    } catch (error) {
        console.error('检查Step 4准备状态失败:', error);
        return { ready: false, score: 0, requirements: {}, missingRequirements: [] };
    }
}

export default createFilesRoutes;