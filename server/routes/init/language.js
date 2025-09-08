/**
 * Init模式 - 第2步：智能语言识别路由模块
 * 语言检测和技术栈分析端点
 * 
 * 🧠 已集成EnhancedLanguageDetector - 增强语言检测系统
 * - 基于智能分层分析结果进行精确语言检测
 * - 深度技术栈识别和框架检测
 * - 项目特征和开发环境分析
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { AIResponseHandlerService } from '../../services/ai-response-handler.js';
import EnhancedLanguageDetector from '../../analyzers/enhanced-language-detector.js';

/**
 * 创建语言识别路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createLanguageRoutes(services) {
    const router = express.Router();
    const { workflowService, languageService, server } = services;

    /**
     * 第2步-A: 启动语言检测引擎
     * POST /detect-language
     */
    router.post('/detect-language', async (req, res) => {
        try {
            const { workflowId, projectPath } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 检查第1步是否完成
            if (workflow.currentStep < 1) {
                return error(res, '请先完成第1步项目结构分析', 400);
            }

            const step1Results = workflow.results.step_1;
            const projectPathToUse = projectPath || workflow.projectPath;

            console.log(`[Language] 开始增强智能语言检测: ${projectPathToUse}`);
            
            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 1, 'running');
            
            // 🧠 使用增强语言检测器进行精确分析
            console.log(`[EnhancedLanguageDetector] 启动增强语言检测器...`);
            const enhancedDetector = new EnhancedLanguageDetector(projectPathToUse);
            
            // 智能集成：基于第1步的智能分层分析结果
            const step1IntelligentAnalysis = step1Results.intelligentAnalysis;
            const enhancedResults = await enhancedDetector.performEnhancedDetection({
                // 基于智能分层分析的上下文
                contextData: {
                    architectureInsights: step1IntelligentAnalysis?.architectureInsights,
                    moduleInsights: step1IntelligentAnalysis?.moduleInsights,
                    totalModules: step1IntelligentAnalysis?.moduleInsights?.totalModules || 0,
                    designPatterns: step1IntelligentAnalysis?.architectureInsights?.designPatterns || {}
                },
                // 检测配置
                detectionOptions: {
                    deepFrameworkAnalysis: true,
                    performanceOptimization: true,
                    includeVersionAnalysis: true
                }
            });
            
            // 转换增强检测结果为兼容格式
            const detectionResult = _convertEnhancedResultsToLegacyFormat(
                enhancedResults, 
                step1Results, 
                projectPathToUse
            );
            
            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 2, 'completed', {
                ...detectionResult,
                aiAnalysisPackage // 包含AI分析数据包
            });
            
            // AI驱动架构响应数据
            const responseData = {
                // AI分析数据包 (提供给AI使用)
                aiAnalysisPackage,
                
                // 模拟分析结果 (实际由AI生成)
                detection: detectionResult.detection,
                workflowIntegration: detectionResult.workflowIntegration,
                
                // AI元数据
                metadata: {
                    mode: 'ai-driven',
                    workflowId,
                    step: 2,
                    stepName: 'detect_language', 
                    analysisId: detectionResult.analysisId,
                    analysisDuration: detectionResult.analysisDuration,
                    timestamp: detectionResult.timestamp,
                    tokensReduced: '预计45-50%令牌消耗',
                    aiAnalysisTemplate: 'language-detection-analysis.md',
                    aiDocumentTemplate: 'language-detection-generation.md'
                }
            };

            workflowSuccess(res, responseData, 'detect_language', '智能语言检测完成', 200);

            console.log(`[EnhancedLanguageDetector] 增强语言检测完成: ${projectPathToUse}`);
            console.log(`[EnhancedLanguageDetector] 检测到主语言: ${enhancedResults.detection?.primaryLanguage || 'unknown'}, 置信度: ${enhancedResults.detection?.confidence || 0}%`);
            console.log(`[EnhancedLanguageDetector] 识别框架: ${enhancedResults.detection?.frameworks?.join(', ') || 'none'}`);
            console.log(`[EnhancedLanguageDetector] 项目类型: ${enhancedResults.analysis?.projectType || 'unknown'}`);
            
        } catch (err) {
            console.error('[Language] 智能语言检测失败:', err);
            
            // 更新步骤状态为失败
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 1, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 2,
                stepName: 'detect_language'
            });
        }
    });

    /**
     * 第2步-B: 获取语言检测报告
     * GET /language-report
     */
    router.get('/language-report', async (req, res) => {
        try {
            const { workflowId } = req.query;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            const detectionResult = workflow.results.step_2;
            if (!detectionResult) {
                return error(res, '语言检测结果不存在，请先执行 POST /detect-language', 404);
            }

            // 生成详细报告
            const report = _generateLanguageReport(detectionResult);

            workflowSuccess(res, report, 'language_report', '语言检测报告生成完成', 200);

        } catch (err) {
            console.error('[Language] 获取语言检测报告失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第2步-C: 保存AI生成的语言分析报告到mg_kiro
     * POST /save-language-report
     */
    router.post('/save-language-report', async (req, res) => {
        try {
            const { workflowId, aiGeneratedContent } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!aiGeneratedContent) {
                return error(res, 'AI生成内容不能为空', 400);
            }

            console.log(`[Language] 保存AI生成的语言分析报告: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            const savedFiles = [];
            const errors = [];

            try {
                // 保存language-analysis.md
                if (aiGeneratedContent.languageReport) {
                    const langPath = await aiHandler.saveDocument(
                        'architecture',
                        'language-analysis.md',
                        aiGeneratedContent.languageReport
                    );
                    savedFiles.push(langPath);
                    console.log(`[Language] 已保存: language-analysis.md`);
                }

                // 保存tech-stack-analysis.md (如果有技术栈分析)
                if (aiGeneratedContent.techStackAnalysis) {
                    const techPath = await aiHandler.saveDocument(
                        'architecture',
                        'tech-stack-analysis.md',
                        aiGeneratedContent.techStackAnalysis
                    );
                    savedFiles.push(techPath);
                    console.log(`[Language] 已保存: tech-stack-analysis.md`);
                }

            } catch (saveError) {
                errors.push(`文档保存失败: ${saveError.message}`);
            }

            if (savedFiles.length === 0) {
                return error(res, '没有成功保存任何文档', 500, { errors });
            }

            // 更新工作流步骤状态
            const stepResult = {
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                savedAt: new Date().toISOString(),
                step: 2,
                stepName: 'save_language_report'
            };

            workflowService.updateStep(workflowId, 2, 'saved', stepResult);

            console.log(`[Language] 语言分析报告保存完成，共保存 ${savedFiles.length} 个文件`);

            success(res, {
                message: '语言分析报告已保存到mg_kiro文件夹',
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                workflow: {
                    workflowId,
                    step: 2,
                    stepName: 'save_language_report',
                    status: 'saved'
                },
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, `成功保存 ${savedFiles.length} 个语言分析文档`);
            
        } catch (err) {
            console.error('[Language] 保存语言分析报告失败:', err);
            return error(res, `保存文档失败: ${err.message}`, 500, {
                step: 2,
                stepName: 'save_language_report'
            });
        }
    });

    return router;
}

/**
 * 生成语言检测详细报告
 * @param {Object} detectionResult - 检测结果
 * @returns {Object} 语言报告
 */
function _generateLanguageReport(detectionResult) {
    return {
        // 核心检测结果
        detection: {
            primaryLanguage: detectionResult.detection.primaryLanguage,
            secondaryLanguages: detectionResult.detection.secondaryLanguages,
            confidence: detectionResult.workflowIntegration.confidenceScore
        },
        
        // 技术栈生态
        techStack: {
            frameworks: detectionResult.detection.techStack.frameworks,
            buildTools: detectionResult.detection.techStack.buildTools,
            packageManagers: detectionResult.detection.techStack.packageManagers,
            testing: detectionResult.detection.techStack.testing
        },
        
        // 项目特征
        projectProfile: {
            type: detectionResult.detection.projectCharacteristics.type,
            scale: detectionResult.detection.projectCharacteristics.scale,
            maturity: detectionResult.detection.projectCharacteristics.maturity,
            complexity: detectionResult.detection.projectCharacteristics.complexity
        },
        
        // 开发环境建议
        environment: {
            recommended: detectionResult.detection.developmentEnvironment.recommended,
            currentSetup: detectionResult.detection.developmentEnvironment.currentSetup,
            missingComponents: detectionResult.detection.developmentEnvironment.missingComponents
        },
        
        // 分析质量
        analysisQuality: {
            dataQuality: detectionResult.workflowIntegration.dataQuality,
            enhancementGain: detectionResult.workflowIntegration.enhancementGain,
            step1Integration: detectionResult.workflowIntegration.step1Integration
        },
        
        // 工作流建议
        recommendations: detectionResult.detection.nextStepRecommendations,
        
        // 元信息
        metadata: {
            analysisId: detectionResult.analysisId,
            analysisDuration: detectionResult.analysisDuration,
            timestamp: detectionResult.timestamp,
            step3Readiness: detectionResult.workflowIntegration.readinessForStep3
        }
    };
}

/**
 * 🧠 转换增强语言检测结果为兼容格式
 * 保持API向后兼容，同时集成增强检测的丰富数据
 * @param {Object} enhancedResults - 增强语言检测结果
 * @param {Object} step1Results - 第1步智能分层分析结果
 * @param {string} projectPath - 项目路径
 * @returns {Object} 兼容格式的检测结果
 */
function _convertEnhancedResultsToLegacyFormat(enhancedResults, step1Results, projectPath) {
    const analysis = enhancedResults.analysis || {};
    const detection = enhancedResults.detection || {};
    const techStack = enhancedResults.techStack || {};
    
    return {
        // 核心检测结果 - 基于真实增强检测
        detection: {
            primaryLanguage: detection.primaryLanguage || 'unknown',
            confidence: (detection.confidence || 0) / 100, // 转换为0-1范围
            secondaryLanguages: _formatSecondaryLanguages(detection.secondaryLanguages),
            languageEvidence: {
                fileExtensions: detection.fileTypeAnalysis?.extensionCounts || {},
                configFiles: detection.configurationFiles || [],
                frameworkMarkers: detection.frameworks || [],
                buildTools: detection.buildTools || []
            },
            techStack: {
                frontend: {
                    frameworks: techStack.frontend?.frameworks || [],
                    libraries: techStack.frontend?.libraries || [],
                    buildTools: techStack.frontend?.buildTools || []
                },
                backend: {
                    frameworks: techStack.backend?.frameworks || [],
                    databases: techStack.backend?.databases || [],
                    servers: techStack.backend?.servers || []
                },
                development: {
                    packageManagers: techStack.development?.packageManagers || [],
                    testing: techStack.development?.testingFrameworks || [],
                    linting: techStack.development?.lintingTools || [],
                    ide: techStack.development?.ideSupport || []
                },
                deployment: {
                    containerization: techStack.deployment?.containerization || [],
                    cicd: techStack.deployment?.cicd || [],
                    cloud: techStack.deployment?.cloudPlatforms || []
                }
            },
            projectCharacteristics: {
                type: analysis.projectType || 'Unknown',
                scale: _assessProjectScale(analysis.projectScale),
                maturity: analysis.maturityLevel || 'developing',
                complexity: analysis.complexityLevel || 'medium',
                architecture: analysis.architecturalPattern || 'modular'
            },
            developmentEnvironment: {
                current: {
                    detected: detection.detectedRuntimes || [],
                    version: detection.runtimeVersions || 'Unknown'
                },
                recommended: {
                    essentials: analysis.recommendedTools?.essential || [],
                    optional: analysis.recommendedTools?.optional || [],
                    version: analysis.recommendedVersions || 'LTS'
                },
                gaps: {
                    missing: analysis.missingTools || [],
                    outdated: analysis.outdatedDependencies || [],
                    suggestions: analysis.improvementSuggestions || []
                }
            },
            qualityIndicators: {
                hasTests: analysis.qualityMetrics?.hasTests || false,
                hasDocumentation: analysis.qualityMetrics?.hasDocumentation || false,
                hasLinting: analysis.qualityMetrics?.hasLinting || false,
                hasCI: analysis.qualityMetrics?.hasCI || false,
                codeOrganization: analysis.qualityMetrics?.organizationScore || 50
            },
            nextStepRecommendations: _generateSmartNextSteps(enhancedResults, step1Results)
        },
        
        // 工作流集成信息 - 基于真实分析质量
        workflowIntegration: {
            confidenceScore: detection.confidence || 75,
            dataQuality: analysis.analysisQuality || 'good',
            enhancementGain: _calculateEnhancementGain(enhancedResults, step1Results),
            step1Integration: 'seamless',
            readinessForStep3: _assessStep3Readiness(enhancedResults)
        },
        
        // 🧠 增强检测的专有数据
        enhancedAnalysis: {
            performanceMetrics: analysis.performanceMetrics || {},
            securityAssessment: analysis.securityAssessment || {},
            dependencyAnalysis: analysis.dependencyAnalysis || {},
            versionCompatibility: analysis.versionCompatibility || {},
            ecosystemHealth: analysis.ecosystemHealth || {}
        },
        
        // 元信息
        analysisId: `enhanced-lang-${Date.now()}`,
        analysisDuration: enhancedResults.analysisTime || 200,
        timestamp: new Date().toISOString(),
        metadata: {
            mode: 'enhanced-detection',
            detectorVersion: enhancedResults.detectorVersion || '2.0',
            intelligentIntegration: true,
            step1DataUsed: !!step1Results.intelligentAnalysis
        }
    };
}

/**
 * 格式化次要语言信息
 */
function _formatSecondaryLanguages(secondaryLanguages) {
    if (!Array.isArray(secondaryLanguages)) return [];
    
    return secondaryLanguages.map(lang => ({
        language: lang.language,
        usage: lang.percentage / 100,
        purpose: lang.purpose || 'Unknown purpose'
    }));
}

/**
 * 评估项目规模
 */
function _assessProjectScale(projectScale) {
    if (typeof projectScale === 'number') {
        if (projectScale > 1000) return 'large';
        if (projectScale > 100) return 'medium';
        return 'small';
    }
    return projectScale || 'medium';
}

/**
 * 生成智能下一步建议
 */
function _generateSmartNextSteps(enhancedResults, step1Results) {
    const recommendations = [];
    
    const totalModules = step1Results.intelligentAnalysis?.moduleInsights?.totalModules || 0;
    
    // 基于模块数量建议
    if (totalModules > 50) {
        recommendations.push({
            step: '深度模块分析',
            reason: `检测到 ${totalModules} 个模块，建议进行完整模块内容分析`,
            priority: 'high'
        });
    } else {
        recommendations.push({
            step: '文件内容分析',
            reason: '项目规模适中，可直接进行文件分析',
            priority: 'medium'
        });
    }
    
    // 基于检测到的技术栈建议
    const frameworks = enhancedResults.detection?.frameworks || [];
    if (frameworks.length > 2) {
        recommendations.push({
            step: '技术栈深度分析',
            reason: `检测到多个框架 (${frameworks.join(', ')})，需要深度分析`,
            priority: 'high'
        });
    }
    
    return recommendations;
}

/**
 * 计算增强效果增益
 */
function _calculateEnhancementGain(enhancedResults, step1Results) {
    let gain = 30; // 基础增益
    
    // 基于检测准确性增加
    if ((enhancedResults.detection?.confidence || 0) > 80) gain += 20;
    
    // 基于与第1步集成质量增加
    if (step1Results.intelligentAnalysis) gain += 25;
    
    // 基于框架检测数量增加
    const frameworkCount = (enhancedResults.detection?.frameworks?.length || 0);
    gain += Math.min(frameworkCount * 5, 25);
    
    return Math.min(gain, 100);
}

/**
 * 评估第3步就绪状态
 */
function _assessStep3Readiness(enhancedResults) {
    const confidence = enhancedResults.detection?.confidence || 0;
    const hasFrameworks = (enhancedResults.detection?.frameworks?.length || 0) > 0;
    const hasAnalysisData = !!enhancedResults.analysis;
    
    return confidence > 70 && hasFrameworks && hasAnalysisData;
}

export default createLanguageRoutes;