/**
 * 提示词智能系统API路由
 * 处理智能提示词生成和管理相关API端点
 */

import { Router } from 'express';
import LanguageIntelligenceService from '../../services/language-intelligence-service.js';
import { success, error, workflowSuccess } from '../../services/response-service.js';

const router = Router();
const languageService = new LanguageIntelligenceService();

/**
 * GET /prompts/language-specific/:lang
 * 获取语言特定提示词
 */
router.get('/language-specific/:lang', async (req, res) => {
    try {
        const { lang } = req.params;
        const {
            category = 'all',
            framework = null,
            includeExamples = 'true',
            format = 'detailed'
        } = req.query;

        // 验证语言参数
        if (!lang) {
            return error(res, '缺少语言参数', 400);
        }

        // 构建获取选项
        const options = {
            category,
            framework,
            context: 'general',
            includeExamples: includeExamples === 'true'
        };

        // 获取语言特定提示词
        const prompts = await languageService.getLanguageSpecificPrompts(lang, options);

        // 根据格式要求处理响应数据
        let responseData = prompts;

        if (format === 'simple' && prompts.success) {
            responseData = {
                language: lang,
                framework: framework,
                promptCategories: Object.keys(prompts.prompts),
                totalPrompts: prompts.metadata.totalPrompts,
                generatedAt: prompts.metadata.generatedAt
            };
        }

        responseData.metadata = {
            ...responseData.metadata,
            endpoint: 'prompts/language-specific',
            requestOptions: options
        };

        return success(res, responseData, `获取${lang}语言提示词成功`);

    } catch (err) {
        console.error('[Language Prompts] 获取失败:', err);
        
        if (err.message.includes('不支持的语言')) {
            return error(res, err.message, 400);
        }
        
        return error(res, `获取语言提示词失败: ${err.message}`, 500);
    }
});

/**
 * POST /prompts/context-generate
 * 基于上下文生成提示词
 */
router.post('/context-generate', async (req, res) => {
    try {
        const {
            contextData,
            options = {}
        } = req.body;

        // 验证必需参数
        if (!contextData) {
            return error(res, '缺少必需参数: contextData', 400);
        }

        // 验证上下文数据结构
        const requiredFields = ['projectPath', 'currentTask', 'userIntent'];
        const missingFields = requiredFields.filter(field => !contextData[field]);
        
        if (missingFields.length > 0) {
            return error(res, `contextData缺少必需字段: ${missingFields.join(', ')}`, 400);
        }

        // 验证项目路径是否存在
        const fs = await import('fs');
        if (!fs.existsSync(contextData.projectPath)) {
            return error(res, `项目路径不存在: ${contextData.projectPath}`, 400);
        }

        // 设置默认选项
        const generateOptions = {
            includeAnalysis: options.includeAnalysis !== false,
            maxSuggestions: Math.min(options.maxSuggestions || 10, 20),
            priorityFilter: options.priorityFilter || null
        };

        // 生成上下文提示词
        const result = await languageService.generateContextualPrompts(contextData);

        // 应用选项过滤
        if (generateOptions.priorityFilter && result.suggestions) {
            result.suggestions = result.suggestions.filter(s => s.priority === generateOptions.priorityFilter);
        }

        if (result.suggestions && result.suggestions.length > generateOptions.maxSuggestions) {
            result.suggestions = result.suggestions.slice(0, generateOptions.maxSuggestions);
        }

        const responseData = {
            ...result,
            metadata: {
                ...result.metadata,
                endpoint: 'prompts/context-generate',
                generateOptions,
                timestamp: new Date().toISOString()
            }
        };

        return success(res, responseData, '上下文提示词生成完成');

    } catch (err) {
        console.error('[Context Prompts] 生成失败:', err);
        return error(res, `上下文提示词生成失败: ${err.message}`, 500);
    }
});

/**
 * GET /prompts/best-practices/:lang
 * 获取语言最佳实践提示
 */
router.get('/best-practices/:lang', async (req, res) => {
    try {
        const { lang } = req.params;
        const {
            context = 'general',
            importance = null,
            category = null,
            includeActionItems = 'true'
        } = req.query;

        // 验证语言参数
        if (!lang) {
            return error(res, '缺少语言参数', 400);
        }

        // 获取最佳实践
        const practices = await languageService.getBestPracticesPrompts(lang, context);

        // 应用过滤条件
        let filteredPractices = practices.practices;

        if (importance) {
            filteredPractices = filteredPractices.filter(p => p.importance === importance);
        }

        if (category) {
            filteredPractices = filteredPractices.filter(p => p.category === category);
        }

        const responseData = {
            ...practices,
            practices: filteredPractices,
            filtered: importance !== null || category !== null,
            filterApplied: {
                importance,
                category,
                originalCount: practices.practices.length,
                filteredCount: filteredPractices.length
            },
            metadata: {
                ...practices.metadata,
                endpoint: 'prompts/best-practices',
                requestParams: { lang, context, importance, category },
                includeActionItems: includeActionItems === 'true'
            }
        };

        // 如果不需要行动项目，移除相关数据
        if (includeActionItems === 'false') {
            delete responseData.actionItems;
        }

        return success(res, responseData, `获取${lang}最佳实践提示成功`);

    } catch (err) {
        console.error('[Best Practices] 获取失败:', err);
        return error(res, `获取最佳实践失败: ${err.message}`, 500);
    }
});

/**
 * POST /prompts/analyze-intent
 * 分析用户意图并生成相关提示词（额外功能）
 */
router.post('/analyze-intent', async (req, res) => {
    try {
        const {
            userInput,
            language = null,
            currentContext = {}
        } = req.body;

        // 验证必需参数
        if (!userInput) {
            return error(res, '缺少必需参数: userInput', 400);
        }

        if (typeof userInput !== 'string' || userInput.trim().length === 0) {
            return error(res, 'userInput必须是非空字符串', 400);
        }

        // 分析意图
        const intentAnalysis = languageService.promptIntelligence.analyzeUserIntent(
            userInput, 
            currentContext.currentTask
        );

        // 如果指定了语言，获取语言特定的建议
        let languagePrompts = null;
        if (language) {
            try {
                const prompts = await languageService.getLanguageSpecificPrompts(language, {
                    category: languageService.mapIntentToCategory?.(intentAnalysis.primary) || 'general'
                });
                if (prompts.success) {
                    languagePrompts = prompts.prompts;
                }
            } catch (err) {
                console.warn('获取语言提示词失败:', err.message);
            }
        }

        const responseData = {
            userInput,
            intentAnalysis,
            languagePrompts,
            recommendations: this.generateIntentRecommendations(intentAnalysis, language),
            metadata: {
                endpoint: 'prompts/analyze-intent',
                timestamp: new Date().toISOString(),
                language: language || 'not-specified',
                inputLength: userInput.length
            }
        };

        return success(res, responseData, `意图分析完成，检测到主要意图: ${intentAnalysis.primary}`);

    } catch (err) {
        console.error('[Intent Analysis] 分析失败:', err);
        return error(res, `意图分析失败: ${err.message}`, 500);
    }
});

/**
 * GET /prompts/categories
 * 获取可用的提示词类别（额外功能）
 */
router.get('/categories', async (req, res) => {
    try {
        const {
            language = null,
            includeStats = 'false'
        } = req.query;

        // 获取提示词类别信息
        const categories = languageService.promptIntelligence.promptCategories;
        
        let responseData = {
            categories,
            metadata: {
                endpoint: 'prompts/categories',
                timestamp: new Date().toISOString(),
                language: language || 'all',
                totalCategories: Object.keys(categories).length
            }
        };

        // 如果指定了语言，过滤相关类别
        if (language) {
            const isLanguageSupported = languageService.promptIntelligence.isLanguageSupported(language);
            responseData.languageSupported = isLanguageSupported;
            
            if (!isLanguageSupported) {
                return error(res, `不支持的语言: ${language}`, 400);
            }
        }

        // 如果需要统计信息
        if (includeStats === 'true') {
            responseData.statistics = this.calculateCategoryStats(categories);
        }

        return success(res, responseData, '获取提示词类别信息成功');

    } catch (err) {
        console.error('[Prompt Categories] 获取失败:', err);
        return error(res, `获取提示词类别失败: ${err.message}`, 500);
    }
});

/**
 * POST /prompts/batch-generate
 * 批量生成提示词（额外功能）
 */
router.post('/batch-generate', async (req, res) => {
    try {
        const {
            requests,
            batchOptions = {}
        } = req.body;

        // 验证输入
        if (!requests || !Array.isArray(requests)) {
            return error(res, '缺少或无效的requests数组参数', 400);
        }

        if (requests.length === 0) {
            return error(res, 'requests数组不能为空', 400);
        }

        if (requests.length > 15) {
            return error(res, '批量生成最多支持15个请求', 400);
        }

        const batchId = `prompt_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const results = [];
        const errors = [];

        // 处理每个请求
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            
            try {
                let result;
                
                if (request.type === 'language-specific') {
                    if (!request.language) {
                        throw new Error('language-specific请求缺少language参数');
                    }
                    result = await languageService.getLanguageSpecificPrompts(
                        request.language, 
                        request.options || {}
                    );
                } else if (request.type === 'context-generate') {
                    if (!request.contextData) {
                        throw new Error('context-generate请求缺少contextData参数');
                    }
                    result = await languageService.generateContextualPrompts(request.contextData);
                } else if (request.type === 'best-practices') {
                    if (!request.language) {
                        throw new Error('best-practices请求缺少language参数');
                    }
                    result = await languageService.getBestPracticesPrompts(
                        request.language, 
                        request.context || 'general'
                    );
                } else {
                    throw new Error(`不支持的请求类型: ${request.type}`);
                }

                results.push({
                    id: request.id || `request_${i + 1}`,
                    type: request.type,
                    result,
                    index: i
                });

            } catch (err) {
                errors.push({
                    id: request.id || `request_${i + 1}`,
                    type: request.type,
                    error: err.message,
                    index: i
                });
            }
        }

        const responseData = {
            batchId,
            processed: requests.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            summary: this.generateBatchSummary(results),
            metadata: {
                endpoint: 'prompts/batch-generate',
                timestamp: new Date().toISOString(),
                batchOptions
            }
        };

        return success(res, responseData, 
            `批量提示词生成完成，成功: ${results.length}，失败: ${errors.length}`);

    } catch (err) {
        console.error('[Batch Prompts] 生成失败:', err);
        return error(res, `批量提示词生成失败: ${err.message}`, 500);
    }
});

// 辅助函数

/**
 * 生成意图推荐
 * @private
 */
function generateIntentRecommendations(intentAnalysis, language) {
    const recommendations = [];
    
    if (intentAnalysis.confidence < 0.5) {
        recommendations.push({
            type: 'warning',
            message: '意图识别置信度较低，建议提供更详细的描述',
            priority: 'high'
        });
    }

    if (language && intentAnalysis.primary !== 'general') {
        recommendations.push({
            type: 'suggestion',
            message: `建议查看${language}中${intentAnalysis.primary}任务的最佳实践`,
            priority: 'medium'
        });
    }

    if (intentAnalysis.secondary.length > 0) {
        recommendations.push({
            type: 'info',
            message: `检测到多个意图，也考虑: ${intentAnalysis.secondary.join(', ')}`,
            priority: 'low'
        });
    }

    return recommendations;
}

/**
 * 计算类别统计信息
 * @private
 */
function calculateCategoryStats(categories) {
    const stats = {
        totalCategories: Object.keys(categories).length,
        subcategoriesCount: {},
        totalSubcategories: 0
    };

    Object.keys(categories).forEach(category => {
        const subcategories = Object.keys(categories[category]);
        stats.subcategoriesCount[category] = subcategories.length;
        stats.totalSubcategories += subcategories.length;
    });

    return stats;
}

/**
 * 生成批量处理摘要
 * @private
 */
function generateBatchSummary(results) {
    const summary = {
        requestTypes: {},
        languages: {},
        totalPrompts: 0
    };

    results.forEach(result => {
        // 统计请求类型
        summary.requestTypes[result.type] = (summary.requestTypes[result.type] || 0) + 1;
        
        // 统计语言分布
        if (result.result.language) {
            summary.languages[result.result.language] = (summary.languages[result.result.language] || 0) + 1;
        }
        
        // 统计提示词数量
        if (result.result.metadata && result.result.metadata.totalPrompts) {
            summary.totalPrompts += result.result.metadata.totalPrompts;
        }
    });

    return summary;
}

export default router;