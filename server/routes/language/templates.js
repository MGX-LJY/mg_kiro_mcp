/**
 * 模板生成引擎API路由
 * 处理基于语言的模板生成相关API端点
 */

import { Router } from 'express';
import LanguageIntelligenceService from '../../services/language-intelligence-service.js';
import TemplateEngineService from '../../services/template-engine-service.js';
import { success, error, workflowSuccess } from '../../utils/response.js';

const router = Router();
const languageService = new LanguageIntelligenceService();
const templateService = new TemplateEngineService();

/**
 * POST /template/generate
 * 基于语言生成模板
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            languageDetection,
            options = {}
        } = req.body;

        // 验证必需参数
        if (!languageDetection) {
            return error(res, '缺少必需参数: languageDetection', 400);
        }

        if (!languageDetection.language) {
            return error(res, 'languageDetection缺少language字段', 400);
        }

        // 设置生成选项
        const generateOptions = {
            templateType: options.templateType || 'auto',
            includeFrameworks: options.includeFrameworks !== false,
            customVariables: options.customVariables || {},
            outputFormat: options.outputFormat || 'markdown'
        };

        // 生成模板
        const result = await languageService.generateLanguageTemplate(
            languageDetection,
            generateOptions
        );

        const responseData = {
            ...result,
            metadata: {
                endpoint: 'template/generate',
                timestamp: new Date().toISOString(),
                options: generateOptions,
                language: languageDetection.language
            }
        };

        return success(res, responseData, '模板生成完成');

    } catch (err) {
        console.error('[Template Generate] 生成失败:', err);
        return error(res, `模板生成失败: ${err.message}`, 500);
    }
});

/**
 * GET /template/variants/:lang
 * 获取语言特定模板变体
 */
router.get('/variants/:lang', async (req, res) => {
    try {
        const { lang } = req.params;
        const {
            templateName = null,
            includeAnalysis = 'true',
            format = 'detailed'
        } = req.query;

        // 验证语言参数
        if (!lang) {
            return error(res, '缺少语言参数', 400);
        }

        // 获取模板变体
        const variants = await languageService.getLanguageTemplateVariants(lang, templateName);

        // 根据格式要求处理响应数据
        let responseData = variants;

        if (format === 'simple') {
            responseData = {
                language: lang,
                variants: Object.keys(variants.variants || {}).map(name => ({
                    name,
                    type: variants.variants[name].type,
                    lastModified: variants.variants[name].lastModified
                })),
                count: variants.count || 0
            };
        }

        // 是否包含分析数据
        if (includeAnalysis === 'false' && responseData.enhancement) {
            delete responseData.enhancement;
        }

        responseData.metadata = {
            endpoint: 'template/variants',
            timestamp: new Date().toISOString(),
            language: lang,
            templateName: templateName || 'all',
            format
        };

        return success(res, responseData, `获取${lang}模板变体成功`);

    } catch (err) {
        console.error('[Template Variants] 获取失败:', err);
        
        if (err.message.includes('不支持的语言')) {
            return error(res, err.message, 400);
        }
        
        return error(res, `获取模板变体失败: ${err.message}`, 500);
    }
});

/**
 * POST /template/batch-generate
 * 批量模板生成
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

        if (requests.length > 20) {
            return error(res, '批量生成最多支持20个请求', 400);
        }

        // 验证每个请求的结构
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            if (!request.languageDetection || !request.languageDetection.language) {
                return error(res, `请求${i + 1}缺少有效的languageDetection`, 400);
            }
        }

        // 设置批量选项
        const options = {
            maxConcurrency: Math.min(batchOptions.maxConcurrency || 5, 10),
            failFast: batchOptions.failFast || false,
            includeAnalytics: batchOptions.includeAnalytics !== false
        };

        // 执行批量生成
        const result = await languageService.batchGenerateTemplates(requests, options);

        const responseData = {
            ...result,
            metadata: {
                endpoint: 'template/batch-generate',
                timestamp: new Date().toISOString(),
                batchOptions: options,
                requestCount: requests.length
            }
        };

        return success(res, responseData, 
            `批量模板生成完成，成功: ${result.successful}，失败: ${result.failed}`);

    } catch (err) {
        console.error('[Template Batch Generate] 失败:', err);
        return error(res, `批量模板生成失败: ${err.message}`, 500);
    }
});

/**
 * GET /template/search
 * 搜索可用模板（额外功能）
 */
router.get('/search', async (req, res) => {
    try {
        const {
            language = null,
            category = null,
            keyword = null,
            includeVariants = 'true'
        } = req.query;

        // 构建搜索条件
        const criteria = {
            language,
            category,
            keyword,
            includeVariants: includeVariants === 'true'
        };

        // 执行搜索
        const searchResults = await templateService.searchTemplates(criteria);

        const responseData = {
            ...searchResults,
            metadata: {
                endpoint: 'template/search',
                timestamp: new Date().toISOString(),
                criteria: criteria
            }
        };

        return success(res, responseData, 
            `模板搜索完成，找到${searchResults.metadata.totalFound}个结果`);

    } catch (err) {
        console.error('[Template Search] 搜索失败:', err);
        return error(res, `模板搜索失败: ${err.message}`, 500);
    }
});

/**
 * POST /template/validate
 * 验证模板内容（额外功能）
 */
router.post('/validate', async (req, res) => {
    try {
        const {
            templateContent,
            validationOptions = {}
        } = req.body;

        // 验证必需参数
        if (!templateContent) {
            return error(res, '缺少必需参数: templateContent', 400);
        }

        if (typeof templateContent !== 'string') {
            return error(res, 'templateContent必须是字符串', 400);
        }

        // 执行验证
        const validation = templateService.validateTemplate(templateContent, validationOptions);

        const responseData = {
            validation,
            templateLength: templateContent.length,
            metadata: {
                endpoint: 'template/validate',
                timestamp: new Date().toISOString(),
                validationOptions
            }
        };

        const message = validation.valid ? 
            `模板验证通过，质量分数: ${validation.score}` :
            `模板验证失败，发现${validation.issues.length}个问题`;

        return success(res, responseData, message);

    } catch (err) {
        console.error('[Template Validate] 验证失败:', err);
        return error(res, `模板验证失败: ${err.message}`, 500);
    }
});

/**
 * GET /template/stats
 * 获取模板引擎统计信息（额外功能）
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = templateService.getTemplateStats();

        const responseData = {
            ...stats,
            metadata: {
                endpoint: 'template/stats',
                timestamp: new Date().toISOString()
            }
        };

        return success(res, responseData, '获取模板统计信息成功');

    } catch (err) {
        console.error('[Template Stats] 获取失败:', err);
        return error(res, `获取模板统计信息失败: ${err.message}`, 500);
    }
});

/**
 * GET /template/types
 * 获取可用的模板类型（额外功能）
 */
router.get('/types', async (req, res) => {
    try {
        const {
            language = null,
            includeExamples = 'false'
        } = req.query;

        // 获取模板类型信息
        const availableTemplates = await templateService.templateGenerator.getAvailableTemplates(language);

        let responseData = {
            ...availableTemplates,
            metadata: {
                endpoint: 'template/types',
                timestamp: new Date().toISOString(),
                language: language || 'all'
            }
        };

        // 如果不需要示例，简化输出
        if (includeExamples === 'false') {
            if (responseData.languages) {
                Object.keys(responseData.languages).forEach(lang => {
                    const langData = responseData.languages[lang];
                    if (langData.frameworks) {
                        Object.keys(langData.frameworks).forEach(framework => {
                            // 只保留框架名称，不保留具体的指示文件列表
                            langData.frameworks[framework] = {
                                available: true,
                                templateCount: langData.frameworks[framework].length
                            };
                        });
                    }
                });
            }
        }

        return success(res, responseData, '获取模板类型信息成功');

    } catch (err) {
        console.error('[Template Types] 获取失败:', err);
        return error(res, `获取模板类型失败: ${err.message}`, 500);
    }
});

export default router;