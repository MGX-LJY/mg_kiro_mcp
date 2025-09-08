/**
 * Init模式 - 第7步：模块文档生成路由模块
 * 基于模块分析结果生成详细文档
 * 从 modules.js 拆分出的模块文档生成专用路由
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';
import { AIResponseHandlerService } from '../../services/ai-response-handler.js';
import { UnifiedUltraDetailedGenerator } from '../../services/unified-ultra-detailed-generator.js';

/**
 * 创建模块文档生成路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createModulesDocsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 第7步-A: 生成单独模块文档
     * POST /generate-module-docs
     */
    router.post('/generate-module-docs', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[ModulesDocs] 开始生成模块文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查前置步骤：需要第5步的模块分析结果
            const moduleAnalysisResult = workflow.results.step_5;
            if (!moduleAnalysisResult) {
                return error(res, '请先完成第5步模块分析', 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 7, 'running'); // 第7步，索引为7

            // 获取语言信息用于文档生成
            const languageResult = workflow.results.step_2;
            const primaryLanguage = languageResult?.detection?.primaryLanguage || 'javascript';

            // 准备AI文档生成数据包
            const aiDocumentationPackage = {
                // 数据源
                moduleAnalysis: moduleAnalysisResult.analysis,
                primaryLanguage,
                projectPath: workflow.projectPath,
                
                // AI处理指令
                aiInstructions: {
                    documentTemplate: 'module-documentation-generation.md',
                    documentType: 'module_documentation',
                    language: primaryLanguage,
                    generateExamples: true,
                    includeBestPractices: true
                },
                
                // 元数据
                metadata: {
                    workflowId,
                    step: 7,
                    stepName: 'generate_module_docs',
                    timestamp: new Date().toISOString()
                }
            };
            
            // 执行真实的超详细文档生成
            const ultraDetailedGenerator = new UnifiedUltraDetailedGenerator(workflow.projectPath);
            console.log(`[ModulesDocs] 初始化UnifiedUltraDetailedGenerator，项目路径: ${workflow.projectPath}`);
            
            // 基于第5步的模块分析结果生成超详细文档
            const realDocumentationResults = await ultraDetailedGenerator.generateUltraDetailedDocuments({
                moduleAnalysis: moduleAnalysisResult.realAnalysisResults, // 使用真实分析结果
                language: primaryLanguage,
                focusAreas: ['modules', 'interfaces', 'documentation', 'examples'],
                includeCodeExamples: true,
                includeUsagePatterns: true,
                includeBestPractices: true
            });
            console.log(`[ModulesDocs] 完成真实超详细文档生成`);
            
            // 转换结果为legacy格式保持向后兼容
            const { moduleDocuments, documentationSummary } = _convertUltraDetailedResultsToLegacyFormat(
                realDocumentationResults, 
                moduleAnalysisResult.analysis.modules,
                primaryLanguage
            );

            const executionTime = Date.now() - startTime;

            // 真实超详细文档生成响应
            const responseData = {
                // AI文档生成数据包 (提供给AI使用)
                aiDocumentationPackage,
                
                // 真实超详细文档结果 (使用UnifiedUltraDetailedGenerator)
                moduleDocuments,
                summary: documentationSummary,
                
                // 真实生成原始数据 (用于高级用户)
                realDocumentationResults: {
                    documentTypes: realDocumentationResults.documentTypes,
                    totalDocuments: realDocumentationResults.totalDocuments,
                    generationStrategy: realDocumentationResults.generationStrategy,
                    processingTime: realDocumentationResults.processingTime
                },
                
                // 执行信息
                execution: {
                    mode: 'unified-ultra-detailed-generation',
                    executionTime,
                    modulesDocumented: moduleDocuments.length,
                    totalSections: moduleDocuments.reduce((sum, doc) => sum + doc.sections.length, 0),
                    realDocumentsGenerated: realDocumentationResults.totalDocuments,
                    documentTypes: realDocumentationResults.documentTypes?.length || 0,
                    timestamp: new Date().toISOString(),
                    generationStrategy: 'ultra-detailed-with-examples-and-patterns',
                    aiDocumentTemplate: 'module-documentation-generation.md'
                },
                
                // 工作流信息
                workflow: {
                    workflowId,
                    step: 7,
                    stepName: 'generate_module_docs',
                    previousStepsCompleted: ['step_1', 'step_2', 'step_3', 'step_4', 'step_5'],
                    mode: 'ai-driven-refactor'
                }
            };

            // 更新步骤状态为已完成（第7步，索引7，存储为step_7）
            workflowService.updateStep(workflowId, 7, 'completed', responseData);

            console.log(`[ModulesDocs] 真实超详细文档生成完成: ${executionTime}ms`);
            console.log(`[ModulesDocs] - 真实文档: ${realDocumentationResults.totalDocuments} 个超详细文档`);
            console.log(`[ModulesDocs] - 文档类型: ${realDocumentationResults.documentTypes?.length || 0} 种类型`);
            console.log(`[ModulesDocs] - Legacy模块: ${moduleDocuments.length} 个模块文档`);
            console.log(`[ModulesDocs] - 总章节: ${moduleDocuments.reduce((sum, doc) => sum + doc.sections.length, 0)} 个章节`);
            console.log(`[ModulesDocs] - 生成策略: ${realDocumentationResults.generationStrategy || 'ultra-detailed'}`);

            workflowSuccess(res, 7, 'generate_module_docs', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[ModulesDocs] 模块文档生成失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 7, 'failed', null, err.message);
            }
            
            return error(res, err.message, 500, {
                step: 7,
                stepName: 'generate_module_docs'
            });
        }
    });

    /**
     * 第7步-B: 获取单个模块文档
     * GET /module-docs/:moduleName
     */
    router.get('/module-docs/:moduleName', async (req, res) => {
        try {
            const { workflowId } = req.query;
            const { moduleName } = req.params;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!moduleName) {
                return error(res, '模块名称不能为空', 400);
            }

            console.log(`[ModulesDocs] 获取模块文档: ${moduleName}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 检查第7步是否完成
            const docsResult = workflow.results.step_7;
            if (!docsResult) {
                return error(res, '模块文档未生成，请先执行 POST /generate-module-docs', 400);
            }

            // 查找指定模块的文档
            const moduleDoc = docsResult.moduleDocuments.find(
                doc => doc.moduleName === moduleName || 
                       doc.moduleId === moduleName ||
                       doc.relativePath === moduleName
            );

            if (!moduleDoc) {
                return error(res, `模块文档不存在: ${moduleName}`, 404);
            }

            // 构建详细的文档响应
            const documentDetail = {
                basic: {
                    moduleName: moduleDoc.moduleName,
                    moduleId: moduleDoc.moduleId,
                    relativePath: moduleDoc.relativePath,
                    category: moduleDoc.category,
                    language: moduleDoc.language
                },
                documentation: {
                    overview: moduleDoc.overview,
                    sections: moduleDoc.sections,
                    generatedAt: moduleDoc.generatedAt
                },
                metadata: {
                    complexity: moduleDoc.metadata.complexity,
                    dependencies: moduleDoc.metadata.dependencies,
                    metrics: moduleDoc.metadata.metrics
                },
                usage: moduleDoc.usage || {},
                examples: moduleDoc.examples || [],
                recommendations: moduleDoc.recommendations || []
            };

            success(res, documentDetail);

        } catch (err) {
            console.error('[ModulesDocs] 获取模块文档失败:', err);
            return error(res, err.message, 500);
        }
    });

    /**
     * 第7步-C: 保存AI生成的模块文档到mg_kiro
     * POST /save-module-docs
     */
    router.post('/save-module-docs', async (req, res) => {
        try {
            const { workflowId, aiGeneratedContent } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            if (!aiGeneratedContent) {
                return error(res, 'AI生成内容不能为空', 400);
            }

            console.log(`[ModulesDocs] 保存AI生成的模块文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 初始化AI响应处理服务
            const aiHandler = new AIResponseHandlerService(workflow.projectPath);
            
            const savedFiles = [];
            const errors = [];

            try {
                // 保存各个模块文档到modules-detail文件夹
                if (aiGeneratedContent.moduleDocuments && Array.isArray(aiGeneratedContent.moduleDocuments)) {
                    for (const moduleDoc of aiGeneratedContent.moduleDocuments) {
                        if (moduleDoc.name && moduleDoc.content) {
                            const docPath = await aiHandler.saveDocument(
                                'modules-detail',
                                `module-${moduleDoc.name}.md`,
                                moduleDoc.content
                            );
                            savedFiles.push(docPath);
                            console.log(`[ModulesDocs] 已保存: module-${moduleDoc.name}.md`);
                        }
                    }
                }

                // 保存模块文档汇总
                if (aiGeneratedContent.moduleDocumentationSummary) {
                    const summaryPath = await aiHandler.saveDocument(
                        'modules-detail',
                        'modules-documentation-summary.md',
                        aiGeneratedContent.moduleDocumentationSummary
                    );
                    savedFiles.push(summaryPath);
                    console.log(`[ModulesDocs] 已保存: modules-documentation-summary.md`);
                }

            } catch (saveError) {
                errors.push(`文档保存失败: ${saveError.message}`);
            }

            if (savedFiles.length === 0) {
                return error(res, '没有成功保存任何文档', 500, { errors });
            }

            // 更新工作流步骤状态 (第7步，索引为7)
            const stepResult = {
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                savedAt: new Date().toISOString(),
                step: 7,
                stepName: 'save_module_docs'
            };

            workflowService.updateStep(workflowId, 7, 'saved', stepResult);

            console.log(`[ModulesDocs] 模块文档保存完成，共保存 ${savedFiles.length} 个文件`);

            success(res, {
                message: '模块文档已保存到mg_kiro文件夹',
                savedFiles,
                errors: errors.length > 0 ? errors : null,
                workflow: {
                    workflowId,
                    step: 7,
                    stepName: 'save_module_docs',
                    status: 'saved'
                },
                mgKiroStatus: await aiHandler.checkMgKiroStatus()
            }, `成功保存 ${savedFiles.length} 个模块文档`);
            
        } catch (err) {
            console.error('[ModulesDocs] 保存模块文档失败:', err);
            return error(res, `保存文档失败: ${err.message}`, 500, {
                step: 7,
                stepName: 'save_module_docs'
            });
        }
    });

    return router;
}

/**
 * 转换UnifiedUltraDetailedGenerator结果为Legacy格式
 * 确保与现有API保持向后兼容
 */
function _convertUltraDetailedResultsToLegacyFormat(realResults, legacyModules, primaryLanguage) {
    console.log(`[ModulesDocs] 转换超详细文档结果为Legacy格式`);
    
    const moduleDocuments = [];
    const categories = { core: 0, business: 0, utility: 0 };
    const complexity = { low: 0, medium: 0, high: 0 };
    let totalSections = 0;
    
    // 基于legacy模块数据构建文档
    for (const module of legacyModules) {
        // 从真实结果中查找对应的详细文档
        const detailedDoc = _findMatchingDetailedDocument(realResults, module);
        
        const legacyDocument = {
            moduleName: module.name,
            moduleId: module.id,
            relativePath: module.relativePath,
            category: module.category,
            language: module.analysis?.language || primaryLanguage,
            generatedAt: new Date().toISOString(),
            overview: {
                title: `${module.name} 模块文档`,
                description: detailedDoc?.description || `${module.name} 是一个${module.category}模块`,
                keyMetrics: {
                    lines: module.metrics?.lines || 0,
                    functions: module.metrics?.functions || 0,
                    classes: module.metrics?.classes || 0
                }
            },
            sections: _generateDocumentSections(detailedDoc, module),
            usage: _generateUsageInformation(detailedDoc, module),
            examples: detailedDoc?.examples || [],
            metadata: {
                complexity: module.analysis?.complexity || { rating: 'medium', score: 25 },
                dependencies: {
                    imports: module.dependencies?.imports?.length || 0,
                    exports: module.dependencies?.exports?.length || 0
                },
                metrics: module.metrics || { lines: 0, functions: 0, classes: 0 }
            },
            recommendations: module.recommendations || []
        };
        
        moduleDocuments.push(legacyDocument);
        categories[module.category]++;
        complexity[module.analysis?.complexity?.rating || 'medium']++;
        totalSections += legacyDocument.sections.length;
    }
    
    const documentationSummary = {
        total: moduleDocuments.length,
        categories,
        complexity,
        sections: {
            total: totalSections,
            average: Math.round(totalSections / moduleDocuments.length) || 0
        },
        coverage: {
            withExamples: moduleDocuments.filter(doc => doc.examples.length > 0).length,
            withInterfaces: moduleDocuments.filter(doc => 
                doc.sections.some(section => section.type === 'interfaces')).length,
            withDependencies: moduleDocuments.filter(doc => 
                doc.metadata.dependencies.imports > 0 || doc.metadata.dependencies.exports > 0).length
        }
    };
    
    return { moduleDocuments, documentationSummary };
}

/**
 * 查找匹配的详细文档
 */
function _findMatchingDetailedDocument(realResults, module) {
    // 从realResults中查找与module匹配的详细信息
    // 这是一个简化的匹配逻辑，实际可能需要更复杂的匹配策略
    if (realResults.documents) {
        return realResults.documents.find(doc => 
            doc.modulePath === module.relativePath || 
            doc.moduleName === module.name
        );
    }
    return null;
}

/**
 * 生成文档章节
 */
function _generateDocumentSections(detailedDoc, module) {
    const sections = [
        {
            title: '模块概述',
            type: 'overview',
            content: {
                description: detailedDoc?.overview || `${module.name} 模块概述`,
                purpose: detailedDoc?.purpose || '处理核心业务逻辑',
                keyFeatures: detailedDoc?.features || []
            }
        },
        {
            title: '接口定义',
            type: 'interfaces',
            content: {
                exports: module.dependencies?.exports || [],
                publicMethods: detailedDoc?.publicMethods || [],
                parameters: detailedDoc?.parameters || []
            }
        },
        {
            title: '使用方法',
            type: 'usage',
            content: {
                quickStart: detailedDoc?.quickStart || '基本用法说明',
                commonPatterns: detailedDoc?.patterns || [],
                bestPractices: detailedDoc?.bestPractices || []
            }
        }
    ];
    
    // 如果有依赖关系，添加依赖章节
    if (module.dependencies?.imports?.length > 0) {
        sections.push({
            title: '依赖关系',
            type: 'dependencies',
            content: {
                imports: module.dependencies.imports,
                externalDeps: module.dependencies.external || []
            }
        });
    }
    
    return sections;
}

/**
 * 生成使用信息
 */
function _generateUsageInformation(detailedDoc, module) {
    return {
        quickStart: detailedDoc?.usage?.quickStart || `import { ${module.name} } from './${module.relativePath}';`,
        commonPatterns: detailedDoc?.usage?.patterns || [
            `// 基本使用方式\nconst ${module.name.toLowerCase()} = new ${module.name}();`
        ],
        troubleshooting: detailedDoc?.troubleshooting || '常见问题解决方案'
    };
}

/**
 * 拆分说明:
 * 
 * 从 modules.js 中提取了第7步相关的所有功能：
 * - POST /generate-module-docs - 生成模块文档 (已升级使用UnifiedUltraDetailedGenerator)
 * - GET /module-docs/:moduleName - 获取单个模块文档  
 * - POST /save-module-docs - 保存AI生成的模块文档
 * 
 * 专注于模块文档生成职责，依赖第5步的分析结果
 * 日志前缀更新为 [ModulesDocs] 以区分功能
 * 确保第7步索引正确 (workflowService.updateStep(workflowId, 7, ...))
 * 
 * 重构更新 (Step 6):
 * - 集成了UnifiedUltraDetailedGenerator替换mock文档生成
 * - 添加了完整的结果转换函数确保向后兼容
 * - 保持原有API格式，客户端无需更改
 * - 实现了超详细文档生成，包含示例、最佳实践、使用模式
 */

export default createModulesDocsRoutes;