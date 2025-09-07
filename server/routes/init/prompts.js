/**
 * Init模式 - 第6步：语言特定提示词生成路由模块
 * 基于检测语言生成专业提示词端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建语言提示词路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createLanguagePromptsRoutes(services) {
    const router = express.Router();
    const { workflowService, languageService } = services;

    /**
     * 第6步-A: 基于检测语言生成专业提示词
     * POST /generate-prompts
     */
    router.post('/generate-prompts', async (req, res) => {
        try {
            const { workflowId, options = {} } = req.body;
            
            if (!workflowId) {
                return error(res, '工作流ID不能为空', 400);
            }

            const workflow = workflowService.getWorkflow(workflowId);
            if (!workflow) {
                return error(res, `工作流不存在: ${workflowId}`, 404);
            }

            // 检查前置步骤是否完成 (需要完成步骤2的语言检测)
            if (workflow.currentStep < 2) {
                return error(res, '请先完成第2步(语言检测)才能生成语言特定提示词', 400);
            }

            const step2Results = workflow.results.step_2;
            if (!step2Results || !step2Results.detection) {
                return error(res, '缺少语言检测结果，无法生成语言特定提示词', 400);
            }

            console.log(`[LanguagePrompts] 开始生成语言特定提示词: ${workflow.projectPath}`);
            
            // 更新步骤状态为运行中 (第6步：语言特定提示词生成)
            workflowService.updateStep(workflowId, 6, 'running');
            
            // 动态导入语言提示词生成器
            const { default: LanguagePromptGenerator } = await import('../../language/language-prompt-generator.js');
            const promptGenerator = new LanguagePromptGenerator();
            
            // 生成语言特定提示词
            const promptResult = await promptGenerator.generatePrompts(workflow.projectPath, options);
            
            // 构建响应数据
            const responseData = {
                project: {
                    path: workflow.projectPath,
                    detectedLanguage: step2Results.detection.primaryLanguage,
                    confidence: step2Results.workflowIntegration.confidenceScore,
                    frameworks: step2Results.detection.techStack.frameworks
                },
                
                // 提示词数据
                prompts: promptResult.prompts,
                
                // 生成信息
                generation: {
                    executionTime: Date.now() - Date.now(), // 简化版
                    templateUsed: 'language-specific',
                    language: step2Results.detection.primaryLanguage,
                    timestamp: new Date().toISOString()
                },
                
                // 元信息
                metadata: {
                    ...promptResult.metadata,
                    workflowId,
                    step: 6,
                    stepName: 'generate_prompts',
                    analysisTimestamp: step2Results.timestamp,
                    promptGenerationTimestamp: new Date().toISOString()
                },
                
                // 使用建议
                usage: {
                    primary_prompt: 'development',
                    recommended_prompts: ['bestPractices', 'codeReview', 'testing'],
                    context_aware: true,
                    framework_specific: !!step2Results.detection.techStack.frameworks.length
                }
            };

            // 更新步骤状态为已完成
            workflowService.updateStep(workflowId, 6, 'completed', responseData);
            
            workflowSuccess(res, 6, 'generate_prompts', workflowId, responseData, workflowService.getProgress(workflowId));

            console.log(`[LanguagePrompts] 语言特定提示词生成完成: ${workflow.projectPath}`);

        } catch (err) {
            console.error('[LanguagePrompts] 语言特定提示词生成失败:', err);
            
            if (req.body.workflowId) {
                workflowService.updateStep(req.body.workflowId, 6, 'failed', null, err.message);
            }
            
            error(res, err.message, 500, {
                step: 6,
                stepName: 'generate_prompts'
            });
        }
    });

    /**
     * 第6步-B: 获取语言特定提示词 (支持静态语言查询)
     * GET /prompts/:language
     */
    router.get('/prompts/:language', async (req, res) => {
        try {
            const { language } = req.params;
            const { promptType = 'all', format = 'json' } = req.query;
            
            console.log(`[LanguagePrompts] 获取${language}语言特定提示词`);
            
            // 动态导入语言提示词生成器
            const { default: LanguagePromptGenerator } = await import('../../language/language-prompt-generator.js');
            const promptGenerator = new LanguagePromptGenerator();
            
            // 获取语言特定提示词
            const promptResult = promptGenerator.getLanguageSpecificPrompts(language);
            
            if (!promptResult.success) {
                return error(res, `不支持的语言: ${language}`, 404, {
                    supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust', 'csharp']
                });
            }

            // 过滤提示词类型 (如果指定)
            let prompts = promptResult.prompts;
            if (promptType !== 'all' && prompts[promptType]) {
                prompts = { [promptType]: prompts[promptType] };
            }

            const responseData = {
                language,
                requestedType: promptType,
                prompts,
                metadata: {
                    ...promptResult.metadata,
                    requestTimestamp: new Date().toISOString(),
                    staticGeneration: true
                },
                
                // 可用提示词类型
                availableTypes: Object.keys(promptResult.prompts),
                
                // 使用说明
                usage: {
                    description: `${language}语言专业提示词集合`,
                    bestPractices: '建议结合具体项目上下文使用',
                    customization: '可根据项目特点调整提示词内容'
                }
            };

            // 根据格式返回不同形式的响应
            if (format === 'markdown' && promptType !== 'all' && prompts[promptType]) {
                res.setHeader('Content-Type', 'text/markdown');
                res.send(prompts[promptType].content);
            } else {
                success(res, responseData);
            }

        } catch (err) {
            console.error('[LanguagePrompts] 获取语言特定提示词失败:', err);
            error(res, err.message, 500);
        }
    });

    return router;
}

export default createLanguagePromptsRoutes;