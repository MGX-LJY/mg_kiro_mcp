/**
 * 语言检测引擎API路由
 * 处理项目语言检测相关的API端点
 */

import { Router } from 'express';
import LanguageIntelligenceService from '../../services/language-intelligence-service.js';
import { success, error, workflowSuccess } from '../../utils/response.js';

const router = Router();
const languageService = new LanguageIntelligenceService();

/**
 * POST /language/detect
 * 项目语言检测
 */
router.post('/detect', async (req, res) => {
    try {
        const { 
            projectPath,
            options = {}
        } = req.body;

        // 验证必需参数
        if (!projectPath) {
            return error(res, '缺少必需参数: projectPath', 400);
        }

        // 验证项目路径
        const fs = await import('fs');
        if (!fs.existsSync(projectPath)) {
            return error(res, `项目路径不存在: ${projectPath}`, 400);
        }

        // 执行语言检测
        const detection = await languageService.detectProjectLanguage(projectPath, {
            useCache: options.useCache !== false,
            includeFrameworks: options.includeFrameworks !== false,
            deepAnalysis: options.deepAnalysis || false
        });

        return success(res, {
            detection,
            metadata: {
                endpoint: 'language/detect',
                timestamp: new Date().toISOString(),
                options: options
            }
        }, '语言检测完成');

    } catch (err) {
        console.error('[Language Detection] 检测失败:', err);
        return error(res, `语言检测失败: ${err.message}`, 500);
    }
});

/**
 * GET /language/supported
 * 获取支持的语言列表
 */
router.get('/supported', async (req, res) => {
    try {
        const {
            includeDetails = 'true',
            category = null
        } = req.query;

        // 获取支持的语言信息
        const supportedLanguages = languageService.getSupportedLanguages();

        // 根据查询参数过滤结果
        let responseData = supportedLanguages;
        
        if (category) {
            const filteredLanguages = {};
            Object.keys(supportedLanguages.languages).forEach(lang => {
                const langInfo = supportedLanguages.languages[lang];
                if (langInfo.capabilities.includes(category)) {
                    filteredLanguages[lang] = langInfo;
                }
            });
            
            responseData = {
                ...supportedLanguages,
                languages: filteredLanguages,
                filtered: true,
                filterCategory: category
            };
        }

        // 简化输出（如果不需要详细信息）
        if (includeDetails === 'false') {
            responseData = {
                languages: Object.keys(responseData.languages).map(lang => ({
                    id: lang,
                    name: responseData.languages[lang].displayName,
                    extensions: responseData.languages[lang].extensions
                })),
                total: responseData.total
            };
        }

        return success(res, responseData, '获取支持语言列表成功');

    } catch (err) {
        console.error('[Language Support] 获取失败:', err);
        return error(res, `获取支持语言失败: ${err.message}`, 500);
    }
});

/**
 * GET /language/frameworks/:lang
 * 获取指定语言支持的框架
 */
router.get('/frameworks/:lang', async (req, res) => {
    try {
        const { lang } = req.params;
        const {
            includeDetails = 'true',
            category = null,
            popularOnly = 'false'
        } = req.query;

        // 验证语言参数
        if (!lang) {
            return error(res, '缺少语言参数', 400);
        }

        // 获取框架信息
        const frameworks = languageService.getLanguageFrameworks(lang);

        // 应用过滤条件
        let filteredFrameworks = frameworks.frameworks;

        if (category) {
            filteredFrameworks = filteredFrameworks.filter(f => f.category === category);
        }

        if (popularOnly === 'true') {
            filteredFrameworks = filteredFrameworks.filter(f => 
                f.popularity === 'very-high' || f.popularity === 'high'
            );
        }

        // 构造响应数据
        const responseData = {
            ...frameworks,
            frameworks: filteredFrameworks,
            filtered: category !== null || popularOnly === 'true',
            filterApplied: {
                category: category || null,
                popularOnly: popularOnly === 'true'
            }
        };

        // 简化输出
        if (includeDetails === 'false') {
            responseData.frameworks = responseData.frameworks.map(f => ({
                name: f.name,
                displayName: f.displayName,
                category: f.category,
                popularity: f.popularity
            }));
        }

        return success(res, responseData, `获取${lang}框架信息成功`);

    } catch (err) {
        console.error('[Language Frameworks] 获取失败:', err);
        
        // 检查是否是不支持的语言错误
        if (err.message.includes('不支持的语言')) {
            return error(res, err.message, 400);
        }
        
        return error(res, `获取语言框架失败: ${err.message}`, 500);
    }
});

/**
 * POST /language/detect/batch
 * 批量语言检测（额外功能）
 */
router.post('/detect/batch', async (req, res) => {
    try {
        const { 
            projects,
            options = {}
        } = req.body;

        // 验证输入
        if (!projects || !Array.isArray(projects)) {
            return error(res, '缺少或无效的projects数组参数', 400);
        }

        if (projects.length === 0) {
            return error(res, 'projects数组不能为空', 400);
        }

        if (projects.length > 10) {
            return error(res, '批量检测最多支持10个项目', 400);
        }

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const results = [];
        const errors = [];

        // 处理每个项目
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            
            try {
                if (!project.projectPath) {
                    throw new Error(`项目${i + 1}缺少projectPath`);
                }

                const detection = await languageService.detectProjectLanguage(
                    project.projectPath, 
                    {
                        useCache: options.useCache !== false,
                        includeFrameworks: options.includeFrameworks !== false,
                        deepAnalysis: options.deepAnalysis || false
                    }
                );

                results.push({
                    id: project.id || `project_${i + 1}`,
                    projectPath: project.projectPath,
                    detection,
                    index: i
                });

            } catch (err) {
                errors.push({
                    id: project.id || `project_${i + 1}`,
                    projectPath: project.projectPath,
                    error: err.message,
                    index: i
                });
            }
        }

        const responseData = {
            batchId,
            processed: projects.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                languages: this.summarizeLanguages(results),
                frameworks: this.summarizeFrameworks(results)
            },
            timing: {
                processedAt: new Date().toISOString()
            }
        };

        return success(res, responseData, `批量语言检测完成，成功: ${results.length}，失败: ${errors.length}`);

    } catch (err) {
        console.error('[Batch Language Detection] 失败:', err);
        return error(res, `批量语言检测失败: ${err.message}`, 500);
    }
});

/**
 * GET /language/stats
 * 获取语言检测统计信息（额外功能）
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = languageService.getServiceStats();
        
        const responseData = {
            ...stats,
            endpoint: 'language/stats',
            generatedAt: new Date().toISOString()
        };

        return success(res, responseData, '获取语言检测统计信息成功');

    } catch (err) {
        console.error('[Language Stats] 获取失败:', err);
        return error(res, `获取统计信息失败: ${err.message}`, 500);
    }
});

// 辅助函数

/**
 * 汇总语言分布
 * @private
 */
function summarizeLanguages(results) {
    const languages = {};
    results.forEach(result => {
        const lang = result.detection.language;
        if (lang && lang !== 'unknown') {
            languages[lang] = (languages[lang] || 0) + 1;
        }
    });
    return languages;
}

/**
 * 汇总框架分布
 * @private
 */
function summarizeFrameworks(results) {
    const frameworks = {};
    results.forEach(result => {
        if (result.detection.frameworks) {
            result.detection.frameworks.forEach(framework => {
                const name = framework.name || framework;
                frameworks[name] = (frameworks[name] || 0) + 1;
            });
        }
    });
    return frameworks;
}

export default router;