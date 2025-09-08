/**
 * Init模式 - 第1步：项目结构分析路由模块
 * 项目结构扫描和分析端点
 * 
 * 🚀 已集成IntelligentLayeredAnalyzer - 智能分层分析系统
 * - 架构层：提取关键代码片段，不敷衍不全读
 * - 模块层：完整内容分析，智能分块处理
 * - 集成层：依赖关系和模块互联分析
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import IntelligentLayeredAnalyzer from '../../analyzers/intelligent-layered-analyzer.js';
import ArchitectureKeyExtractor from '../../analyzers/architecture-key-extractor.js';

/**
 * 创建项目结构分析路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createStructureRoutes(services) {
    const router = express.Router();
    const { workflowService, server } = services;

    /**
     * 第1步-A: 扫描项目结构
     * POST /scan-structure
     */
    router.post('/scan-structure', async (req, res) => {
        try {
            const { projectPath } = req.body;
            
            if (!projectPath) {
                return error(res, '项目路径不能为空', 400);
            }

            console.log(`[Structure] 开始智能分层项目结构分析: ${projectPath}`);
            
            // 创建工作流会话
            const workflowId = workflowService.createWorkflow(projectPath, 'init');
            
            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 0, 'running');
            
            // 🚀 使用智能分层分析器进行深度项目扫描
            console.log(`[IntelligentStructure] 启动智能分层分析器...`);
            const layeredAnalyzer = new IntelligentLayeredAnalyzer(projectPath);
            const layeredResults = await layeredAnalyzer.performLayeredAnalysis();
            
            // 🏗️ 使用架构关键提取器进行精确架构分析
            console.log(`[ArchitectureExtractor] 启动架构关键信息提取...`);
            const architectureExtractor = new ArchitectureKeyExtractor(projectPath);
            const architectureKeys = await architectureExtractor.extractArchitectureKeys();
            
            // 合并分析结果，架构关键信息优先级更高
            const combinedResults = _combineAnalysisResults(layeredResults, architectureKeys);
            
            // 兼容性转换：将合并分析结果适配到原有格式
            const scanResult = _adaptLayeredResultsToLegacyFormat(combinedResults, projectPath);
            
            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 0, 'completed', scanResult);
            
            // 构建响应数据
            const responseData = {
                ...scanResult,
                metadata: {
                    workflowId,
                    step: 1,
                    stepName: 'scan_structure',
                    timestamp: new Date().toISOString()
                },
                workflowGuide: {
                    message: "🎯 工作流引导：第1步已完成，请继续后续步骤",
                    nextStep: {
                        step: 2,
                        name: "detect-language",
                        title: "智能语言检测",
                        api: `POST /mode/init/detect-language`,
                        requiredBody: {
                            workflowId: workflowId,
                            projectPath: projectPath
                        }
                    },
                    workflowOverview: {
                        currentProgress: "1/8 步骤已完成",
                        completedSteps: ["✅ 项目结构扫描"],
                        nextSteps: [
                            "2️⃣ 智能语言检测",
                            "3️⃣ 文件内容通读", 
                            "4️⃣ 基础文档生成",
                            "5️⃣ 深度模块分析",
                            "6️⃣ 语言提示词生成",
                            "7️⃣ 模块文档生成",
                            "8️⃣ 集成契约文档"
                        ]
                    },
                    tips: [
                        "💡 使用工作流ID进行后续API调用",
                        "🔄 每个步骤都会验证前置依赖",
                        "📊 可通过 GET /workflow/status/{workflowId} 查看进度"
                    ]
                }
            };

            workflowSuccess(res, responseData, 'scan_structure', '项目结构扫描完成', 200);

            console.log(`[IntelligentStructure] 智能分层分析完成: ${projectPath}`);
            console.log(`[IntelligentStructure] 架构文件: ${layeredResults.architectureAnalysis?.totalFiles || 0}, 模块文件: ${layeredResults.moduleAnalysis?.totalModules || 0}`);
            console.log(`[ArchitectureExtractor] 架构关键提取完成: 分析了 ${architectureKeys.totalFiles || 0} 个文件, 发现 ${Object.keys(architectureKeys.designPatterns || {}).length} 个设计模式`);
            
        } catch (err) {
            console.error('[Structure] 项目结构扫描失败:', err);
            
            // 更新步骤状态为失败
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 0, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 1,
                stepName: 'scan_structure'
            });
        }
    });

    /**
     * 第1步-B: 获取项目结构分析摘要
     * GET /structure-summary
     */
    router.get('/structure-summary', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const scanResult = workflow.results.step_1;
            if (!scanResult) {
                return error(res, '项目结构扫描结果不存在，请先执行 POST /scan-structure', 404);
            }

            // 生成摘要信息
            const summary = _generateStructureSummary(scanResult, server);

            workflowSuccess(res, 1, 'structure_summary', workflowId, summary, workflowService.getProgress(workflowId));

        } catch (err) {
            console.error('[Structure] 获取项目结构摘要失败:', err);
            return error(res, err.message, 500);
        }
    });

    return router;
}

/**
 * 生成项目结构摘要
 * @param {Object} scanResult - 扫描结果
 * @param {Object} server - 服务器实例
 * @returns {Object} 结构摘要
 */
function _generateStructureSummary(scanResult, server) {
    return {
        project: {
            path: scanResult.projectPath,
            name: scanResult.projectPath.split('/').pop(),
            scanDuration: scanResult.scanDuration,
            timestamp: scanResult.timestamp
        },
        structure: {
            totalFiles: scanResult.structure?.totalFiles || 0,
            totalDirectories: scanResult.structure?.totalDirectories || 0,
            maxDepth: server.projectScanner.getMaxDepth(scanResult.structure),
            mainDirectories: scanResult.structure?.directories || []
        },
        analysis: {
            complexity: scanResult.analysis?.complexity || 'unknown',
            scale: scanResult.analysis?.scale || 'unknown',
            maturity: scanResult.analysis?.maturity || 'unknown',
            projectType: scanResult.analysis?.projectType || 'unknown',
            developmentStage: scanResult.analysis?.developmentStage || 'unknown'
        },
        techs: {
            detectedLanguages: scanResult.configs?.detected || [],
            techStackHints: scanResult.analysis?.techStackHints || [],
            frameworks: _extractFrameworks(scanResult)
        },
        docs: {
            hasReadme: scanResult.readme?.found || false,
            readmeAnalysis: scanResult.readme?.analysis || null
        },
        recommendations: scanResult.workflowContext?.nextStepRecommendations || []
    };
}

/**
 * 从扫描结果中提取框架信息
 * @param {Object} scanResult - 项目扫描结果
 * @returns {Array} 检测到的框架列表
 */
function _extractFrameworks(scanResult) {
    const frameworks = [];
    
    try {
        // 从配置文件中提取框架信息
        const jsConfigs = scanResult.configs?.byLanguage?.javascript;
        if (jsConfigs && jsConfigs.length > 0) {
            for (const config of jsConfigs) {
                if (config.analysis?.frameworks) {
                    frameworks.push(...config.analysis.frameworks);
                }
            }
        }
        
        // 从README分析中提取技术栈信息
        const techStack = scanResult.readme?.analysis?.techStack;
        if (techStack) {
            frameworks.push(...techStack);
        }
        
        // 去重并返回
        return [...new Set(frameworks)];
    } catch (error) {
        console.error('提取框架信息失败:', error);
        return [];
    }
}

/**
 * 🚀 适配智能分层分析结果到原有格式
 * 兼容性转换函数，确保API向后兼容
 * @param {Object} layeredResults - 智能分层分析结果
 * @param {string} projectPath - 项目路径
 * @returns {Object} 兼容格式的扫描结果
 */
function _adaptLayeredResultsToLegacyFormat(layeredResults, projectPath) {
    const startTime = Date.now();
    
    // 提取架构分析结果
    const architectureAnalysis = layeredResults.architectureAnalysis || {};
    const moduleAnalysis = layeredResults.moduleAnalysis || {};
    const integrationAnalysis = layeredResults.integrationAnalysis || {};
    
    // 构建兼容的扫描结果
    return {
        projectPath,
        timestamp: new Date().toISOString(),
        scanDuration: layeredResults.analysisTime || 0,
        
        // 基础结构信息 (从模块分析中提取)
        structure: {
            totalFiles: moduleAnalysis.totalModules || 0,
            totalDirectories: architectureAnalysis.totalDirectories || 0,
            directories: _extractDirectoriesFromLayeredResults(layeredResults),
            files: _extractFilesFromLayeredResults(layeredResults)
        },
        
        // 增强的分析结果
        analysis: {
            complexity: _assessProjectComplexity(layeredResults),
            scale: _assessProjectScale(layeredResults),
            maturity: _assessProjectMaturity(layeredResults),
            projectType: architectureAnalysis.projectType || 'unknown',
            developmentStage: architectureAnalysis.developmentStage || 'active',
            techStackHints: architectureAnalysis.detectedTechnologies || []
        },
        
        // 配置分析结果
        configs: {
            detected: architectureAnalysis.detectedLanguages || [],
            byLanguage: {
                javascript: _extractJavaScriptConfigs(layeredResults)
            }
        },
        
        // 🚀 增强的智能分层分析数据
        intelligentAnalysis: {
            layeredResults,
            architectureInsights: {
                keyComponents: architectureAnalysis.keyComponents || [],
                designPatterns: architectureAnalysis.designPatterns || [],
                dependencyAnalysis: integrationAnalysis.dependencyAnalysis || {}
            },
            moduleInsights: {
                totalModules: moduleAnalysis.totalModules || 0,
                successfulAnalyses: moduleAnalysis.successfulAnalyses || 0,
                failedAnalyses: moduleAnalysis.failedAnalyses || 0,
                averageComplexity: moduleAnalysis.averageComplexity || 'medium'
            },
            integrationInsights: {
                couplingAnalysis: integrationAnalysis.couplingAnalysis || {},
                communicationPatterns: integrationAnalysis.communicationPatterns || [],
                riskAssessment: integrationAnalysis.riskAssessment || {}
            }
        },
        
        // 工作流上下文
        workflowContext: {
            nextStepRecommendations: _generateSmartRecommendations(layeredResults),
            analysisQuality: _assessAnalysisQuality(layeredResults),
            suggestedNextActions: _suggestNextActions(layeredResults)
        }
    };
}

/**
 * 从分层分析结果中提取目录信息
 */
function _extractDirectoriesFromLayeredResults(layeredResults) {
    const directories = [];
    
    // 从架构分析中提取目录结构
    if (layeredResults.architectureAnalysis?.directoryStructure) {
        directories.push(...layeredResults.architectureAnalysis.directoryStructure);
    }
    
    // 从模块分析中提取更多目录信息
    if (layeredResults.moduleAnalysis?.discoveredDirectories) {
        directories.push(...layeredResults.moduleAnalysis.discoveredDirectories);
    }
    
    return [...new Set(directories)]; // 去重
}

/**
 * 从分层分析结果中提取文件信息
 */
function _extractFilesFromLayeredResults(layeredResults) {
    const files = [];
    
    // 从架构分析中提取关键文件
    if (layeredResults.architectureAnalysis?.keyFiles) {
        files.push(...layeredResults.architectureAnalysis.keyFiles);
    }
    
    // 从模块分析中提取模块文件
    if (layeredResults.moduleAnalysis?.moduleFiles) {
        files.push(...layeredResults.moduleAnalysis.moduleFiles);
    }
    
    return files;
}

/**
 * 评估项目复杂度
 */
function _assessProjectComplexity(layeredResults) {
    const moduleCount = layeredResults.moduleAnalysis?.totalModules || 0;
    const architectureComplexity = layeredResults.architectureAnalysis?.complexityScore || 0;
    
    if (moduleCount > 100 || architectureComplexity > 0.8) return 'high';
    if (moduleCount > 50 || architectureComplexity > 0.6) return 'medium';
    return 'low';
}

/**
 * 评估项目规模
 */
function _assessProjectScale(layeredResults) {
    const totalFiles = layeredResults.moduleAnalysis?.totalModules || 0;
    
    if (totalFiles > 200) return 'large';
    if (totalFiles > 50) return 'medium';
    return 'small';
}

/**
 * 评估项目成熟度
 */
function _assessProjectMaturity(layeredResults) {
    const hasTests = layeredResults.architectureAnalysis?.hasTestFiles || false;
    const hasDocumentation = layeredResults.architectureAnalysis?.hasDocumentation || false;
    const hasProperStructure = layeredResults.architectureAnalysis?.hasProperStructure || false;
    
    if (hasTests && hasDocumentation && hasProperStructure) return 'mature';
    if (hasTests || hasDocumentation) return 'developing';
    return 'early';
}

/**
 * 提取JavaScript配置信息
 */
function _extractJavaScriptConfigs(layeredResults) {
    const configs = [];
    
    if (layeredResults.architectureAnalysis?.configFiles) {
        layeredResults.architectureAnalysis.configFiles.forEach(config => {
            if (config.type === 'javascript' || config.language === 'javascript') {
                configs.push({
                    path: config.path,
                    type: config.configType || 'unknown',
                    analysis: {
                        frameworks: config.frameworks || []
                    }
                });
            }
        });
    }
    
    return configs;
}

/**
 * 生成智能推荐
 */
function _generateSmartRecommendations(layeredResults) {
    const recommendations = [];
    
    // 基于分析质量生成推荐
    const moduleSuccessRate = (layeredResults.moduleAnalysis?.successfulAnalyses || 0) / 
                             (layeredResults.moduleAnalysis?.totalModules || 1);
    
    if (moduleSuccessRate === 1.0) {
        recommendations.push('✅ 项目结构分析完美，建议继续进行语言检测分析');
    } else if (moduleSuccessRate > 0.8) {
        recommendations.push('⚡ 项目结构分析良好，建议进行深度模块分析');
    } else {
        recommendations.push('⚠️ 部分模块分析失败，建议检查项目结构完整性');
    }
    
    // 基于架构复杂度生成推荐
    const complexity = _assessProjectComplexity(layeredResults);
    if (complexity === 'high') {
        recommendations.push('🎯 检测到高复杂度项目，建议启用渐进式分析模式');
    }
    
    return recommendations;
}

/**
 * 评估分析质量
 */
function _assessAnalysisQuality(layeredResults) {
    const architectureQuality = layeredResults.architectureAnalysis ? 1 : 0;
    const moduleQuality = (layeredResults.moduleAnalysis?.successfulAnalyses || 0) / 
                         (layeredResults.moduleAnalysis?.totalModules || 1);
    const integrationQuality = layeredResults.integrationAnalysis ? 1 : 0;
    
    const overallQuality = (architectureQuality + moduleQuality + integrationQuality) / 3;
    
    if (overallQuality >= 0.9) return 'excellent';
    if (overallQuality >= 0.7) return 'good';
    if (overallQuality >= 0.5) return 'fair';
    return 'poor';
}

/**
 * 建议下一步操作
 */
function _suggestNextActions(layeredResults) {
    const actions = [];
    
    // 始终建议语言检测
    actions.push({
        step: 2,
        action: 'language-detection',
        priority: 'high',
        reason: '基于智能分层分析结果进行精确语言检测'
    });
    
    // 基于模块分析结果建议后续步骤
    const moduleCount = layeredResults.moduleAnalysis?.totalModules || 0;
    if (moduleCount > 50) {
        actions.push({
            step: 5,
            action: 'deep-module-analysis',
            priority: 'high',
            reason: '检测到大量模块，建议进行深度模块分析'
        });
    }
    
    return actions;
}

/**
 * 🏗️ 合并智能分层分析和架构关键提取结果
 * 架构关键信息优先，用于覆盖和增强分层分析的架构部分
 * @param {Object} layeredResults - 智能分层分析结果
 * @param {Object} architectureKeys - 架构关键提取结果
 * @returns {Object} 合并后的分析结果
 */
function _combineAnalysisResults(layeredResults, architectureKeys) {
    // 深度合并结果，架构关键信息优先级更高
    const combined = {
        ...layeredResults,
        
        // 合并时间戳信息
        combinedAnalysisTime: (layeredResults.analysisTime || 0) + (architectureKeys.analysisTime || 0),
        
        // 🏗️ 增强架构分析 - 架构关键信息优先
        architectureAnalysis: {
            ...(layeredResults.architectureAnalysis || {}),
            ...(architectureKeys || {}),
            
            // 合并关键架构信息
            totalFiles: Math.max(
                layeredResults.architectureAnalysis?.totalFiles || 0,
                architectureKeys.totalFiles || 0
            ),
            
            // 架构关键提取的设计模式更准确
            designPatterns: architectureKeys.designPatterns || layeredResults.architectureAnalysis?.designPatterns || {},
            
            // 合并架构复杂度信息
            complexityScore: architectureKeys.systemComplexity === 'high' ? 0.9 : 
                           architectureKeys.systemComplexity === 'medium' ? 0.6 : 0.3,
                           
            // 🔑 关键架构洞察 - 来自架构关键提取器
            keyInsights: {
                coreModules: architectureKeys.coreModules || [],
                entryPoints: architectureKeys.entryPoints || [],
                configFiles: architectureKeys.configFiles || [],
                criticalPaths: architectureKeys.criticalPaths || [],
                dependencyGraph: architectureKeys.dependencyGraph || {},
                designPatternDetails: architectureKeys.designPatternDetails || {}
            },
            
            // 技术栈检测 - 合并两个分析器的结果
            detectedTechnologies: [
                ...(layeredResults.architectureAnalysis?.detectedTechnologies || []),
                ...(architectureKeys.detectedTechnologies || [])
            ].filter((tech, index, self) => self.indexOf(tech) === index), // 去重
            
            // 架构质量评估
            architectureQuality: {
                structureScore: _calculateStructureScore(architectureKeys),
                couplingLevel: architectureKeys.couplingLevel || 'medium',
                cohesionLevel: architectureKeys.cohesionLevel || 'medium',
                maintainabilityIndex: _calculateMaintainabilityIndex(architectureKeys)
            }
        },
        
        // 保留原有的模块分析（不受影响）
        moduleAnalysis: layeredResults.moduleAnalysis,
        
        // 增强集成分析
        integrationAnalysis: {
            ...(layeredResults.integrationAnalysis || {}),
            
            // 从架构关键提取器获取更准确的依赖信息
            dependencyAnalysis: {
                ...(layeredResults.integrationAnalysis?.dependencyAnalysis || {}),
                internalDependencies: architectureKeys.internalDependencies || {},
                externalDependencies: architectureKeys.externalDependencies || {},
                dependencyCycles: architectureKeys.dependencyCycles || []
            }
        }
    };
    
    return combined;
}

/**
 * 计算架构结构评分
 */
function _calculateStructureScore(architectureKeys) {
    let score = 0.5; // 基础分数
    
    // 有入口点 +0.2
    if (architectureKeys.entryPoints?.length > 0) score += 0.2;
    
    // 有配置文件 +0.1  
    if (architectureKeys.configFiles?.length > 0) score += 0.1;
    
    // 有设计模式 +0.2
    if (Object.keys(architectureKeys.designPatterns || {}).length > 0) score += 0.2;
    
    return Math.min(score, 1.0);
}

/**
 * 计算可维护性指数
 */
function _calculateMaintainabilityIndex(architectureKeys) {
    // 基于系统复杂度和设计模式计算
    const complexityFactor = architectureKeys.systemComplexity === 'low' ? 0.8 : 
                           architectureKeys.systemComplexity === 'medium' ? 0.6 : 0.4;
    
    const patternFactor = Object.keys(architectureKeys.designPatterns || {}).length > 0 ? 0.2 : 0;
    
    return Math.min(complexityFactor + patternFactor, 1.0);
}

export default createStructureRoutes;