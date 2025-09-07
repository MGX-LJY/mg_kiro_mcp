/**
 * Init模式 - 第4步：生成基础架构文档路由模块
 * 系统架构和模块目录文档生成端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建文档生成路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createDocumentsRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 第4步-A: 基于语言生成system-architecture.md
     * POST /generate-architecture
     */
    router.post('/generate-architecture', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Documents] 开始生成系统架构文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 验证前置步骤完成状态
            const structureResult = workflow.results.step_1;
            const languageResult = workflow.results.step_2;
            const filesResult = workflow.results.step_3;

            if (!structureResult) {
                return error(res, '项目结构扫描结果不存在，请先执行 POST /scan-structure', 400);
            }

            if (!languageResult) {
                return error(res, '语言检测结果不存在，请先执行 POST /detect-language', 400);
            }

            if (!filesResult) {
                return error(res, '文件内容分析结果不存在，请先执行 POST /scan-files', 400);
            }

            const startTime = Date.now();

            // 更新步骤状态为运行中
            workflowService.updateStep(workflowId, 4, 'running');

            // 准备模板变量
            const templateVars = {
                // 项目基本信息
                project_name: structureResult.projectPath.split('/').pop(),
                project_path: structureResult.projectPath,
                
                // 系统概述
                system_overview: _generateSystemOverview(structureResult, languageResult, filesResult),
                
                // 核心组件
                core_components: _generateCoreComponents(filesResult),
                
                // 数据流
                data_flow: _generateDataFlow(filesResult),
                
                // 语言特定信息
                primary_language: languageResult.detection.primaryLanguage,
                frameworks: languageResult.detection.techStack.frameworks.join(', '),
                
                // 项目特征
                project_type: languageResult.detection.projectCharacteristics.type,
                project_scale: languageResult.detection.projectCharacteristics.scale,
                
                // 文档生成时间戳
                generated_at: new Date().toISOString(),
                analysis_summary: filesResult.overview
            };

            // 获取语言特定的架构模板
            const architectureDoc = await promptService.loadPrompt(
                'templates', 
                'system-architecture',
                templateVars
            );

            const executionTime = Date.now() - startTime;

            // 构建响应数据
            const responseData = {
                document: {
                    type: 'system-architecture',
                    content: architectureDoc.content,
                    metadata: architectureDoc.metadata,
                    variables: templateVars
                },
                generation: {
                    executionTime,
                    templateUsed: 'system-architecture',
                    language: languageResult.detection.primaryLanguage,
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 4,
                    stepName: 'generate_architecture',
                    previousStepsCompleted: ['scan_structure', 'detect_language', 'scan_files']
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 4, 'completed', responseData);

            console.log(`[Documents] 系统架构文档生成完成: ${executionTime}ms`);

            workflowSuccess(res, 4, 'generate_architecture', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Documents] 生成系统架构文档失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 4, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 4,
                stepName: 'generate_architecture'
            });
        }
    });

    /**
     * 第4步-B: 基于扫描结果生成modules-catalog.md
     * POST /generate-catalog
     */
    router.post('/generate-catalog', async (req, res) => {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            console.log(`[Documents] 开始生成模块目录文档: ${workflowId}`);

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, '工作流不存在', 404);
            }

            // 验证前置步骤完成状态
            const structureResult = workflow.results.step_1;
            const languageResult = workflow.results.step_2;
            const filesResult = workflow.results.step_3;

            if (!structureResult || !languageResult || !filesResult) {
                return error(res, '前置分析步骤未完成，请先完成前3步工作流', 400);
            }

            const startTime = Date.now();

            // 准备模板变量
            const templateVars = {
                // 项目信息
                project_name: structureResult.projectPath.split('/').pop(),
                
                // 模块统计
                total_modules: filesResult.files.length,
                core_modules_count: filesResult.files.filter(f => f.category === 'core').length,
                business_modules_count: filesResult.files.filter(f => f.category === 'business').length,
                
                // 模块分类数据
                modules_by_category: _generateModulesByCategory(filesResult.files),
                modules_by_importance: _generateModulesByImportance(filesResult.files, filesResult.importance),
                
                // 依赖关系
                dependency_graph: filesResult.dependencies,
                
                // 质量指标
                quality_indicators: filesResult.overview.qualityIndicators,
                
                // 语言信息
                primary_language: languageResult.detection.primaryLanguage,
                
                // 生成时间戳
                generated_at: new Date().toISOString()
            };

            // 获取模块目录模板
            const catalogDoc = await promptService.loadPrompt(
                'templates',
                'modules-catalog',
                templateVars
            );

            const executionTime = Date.now() - startTime;

            // 构建响应数据
            const responseData = {
                document: {
                    type: 'modules-catalog',
                    content: catalogDoc.content,
                    metadata: catalogDoc.metadata,
                    variables: templateVars
                },
                generation: {
                    executionTime,
                    templateUsed: 'modules-catalog',
                    modulesAnalyzed: filesResult.files.length,
                    timestamp: new Date().toISOString()
                },
                workflow: {
                    workflowId,
                    step: 4,
                    stepName: 'generate_catalog',
                    previousStepsCompleted: ['scan_structure', 'detect_language', 'scan_files']
                }
            };

            console.log(`[Documents] 模块目录文档生成完成: ${executionTime}ms`);

            workflowSuccess(res, 4, 'generate_catalog', workflowId, responseData, workflowService.getProgress(workflowId));
            
        } catch (err) {
            console.error('[Documents] 生成模块目录文档失败:', err);
            error(res, err.message, 500, {
                step: 4,
                stepName: 'generate_catalog'
            });
        }
    });

    return router;
}

/**
 * 生成系统概述
 * @param {Object} structureResult - 结构分析结果
 * @param {Object} languageResult - 语言检测结果
 * @param {Object} filesResult - 文件分析结果
 * @returns {string} 系统概述
 */
function _generateSystemOverview(structureResult, languageResult, filesResult) {
    const projectName = structureResult.projectPath.split('/').pop();
    const primaryLanguage = languageResult.detection.primaryLanguage;
    const totalFiles = filesResult.analysis.totalFilesAnalyzed;
    const frameworks = languageResult.detection.techStack.frameworks.join(', ') || '无特定框架';
    
    return `${projectName} 是一个基于 ${primaryLanguage} 的${languageResult.detection.projectCharacteristics.type}项目，` +
           `包含 ${totalFiles} 个核心文件。主要使用 ${frameworks} 技术栈，` +
           `项目规模为${languageResult.detection.projectCharacteristics.scale}，` +
           `成熟度为${languageResult.detection.projectCharacteristics.maturity}。`;
}

/**
 * 生成核心组件列表
 * @param {Object} filesResult - 文件分析结果
 * @returns {string} 核心组件描述
 */
function _generateCoreComponents(filesResult) {
    const coreFiles = filesResult.files
        .filter(f => f.category === 'core' || f.analysis?.type === 'main')
        .slice(0, 10);
    
    return coreFiles
        .map(f => `- ${f.relativePath}: ${f.analysis?.description || '核心组件'}`)
        .join('\n');
}

/**
 * 生成数据流描述
 * @param {Object} filesResult - 文件分析结果
 * @returns {string} 数据流描述
 */
function _generateDataFlow(filesResult) {
    const dependencies = filesResult.dependencies;
    const flowDescription = dependencies.edges.length > 0 
        ? `系统包含 ${dependencies.nodes.length} 个模块节点，${dependencies.edges.length} 个依赖关系，形成复杂的数据流网络。`
        : '系统模块相对独立，依赖关系简单。';
    
    return flowDescription;
}

/**
 * 按分类生成模块列表
 * @param {Array} files - 文件列表
 * @returns {Object} 按分类的模块
 */
function _generateModulesByCategory(files) {
    const categories = {};
    files.forEach(file => {
        const category = file.category || 'other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({
            path: file.relativePath,
            type: file.analysis?.type || 'unknown',
            lines: file.content?.lines || 0
        });
    });
    return categories;
}

/**
 * 按重要性生成模块列表
 * @param {Array} files - 文件列表
 * @param {Object} importance - 重要性评分
 * @returns {Array} 按重要性排序的模块
 */
function _generateModulesByImportance(files, importance) {
    return files
        .map(file => ({
            path: file.relativePath,
            score: importance[file.relativePath] || 0,
            category: file.category,
            type: file.analysis?.type || 'unknown'
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
}

export default createDocumentsRoutes;