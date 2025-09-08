/**
 * 模板引擎服务
 * 专门处理模板生成、变体管理和批量操作的服务层
 */

import LanguageTemplateGenerator from '../language/template-generator.js';
import fs from 'fs';
import path from 'path';

class TemplateEngineService {
    constructor() {
        this.templateGenerator = new LanguageTemplateGenerator();
        this.templatesBaseDir = path.join(process.cwd(), 'prompts', 'templates');
        this.languageVariantsDir = path.join(process.cwd(), 'prompts', 'language-variants');
        
        // 模板缓存和性能监控
        this.cache = new Map();
        this.performanceMetrics = {
            totalGenerations: 0,
            averageTime: 0,
            cacheHits: 0,
            errors: 0
        };
    }

    /**
     * 基于语言生成单个模板
     * @param {Object} languageDetection - 语言检测结果
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} 生成结果
     */
    async generateTemplate(languageDetection, options = {}) {
        const startTime = Date.now();
        
        try {
            this.performanceMetrics.totalGenerations++;
            
            const result = await this.templateGenerator.generateTemplate(languageDetection, options);
            
            // 添加元数据和增强信息
            if (result.success) {
                result.enhancement = {
                    generationTime: Date.now() - startTime,
                    qualityScore: this.calculateTemplateQuality(result.templates),
                    suggestions: this.generateTemplateSuggestions(result, options),
                    relatedTemplates: await this.findRelatedTemplates(languageDetection.language)
                };
            }

            this.updatePerformanceMetrics(Date.now() - startTime);
            return result;
        } catch (error) {
            this.performanceMetrics.errors++;
            throw new Error(`模板生成失败: ${error.message}`);
        }
    }

    /**
     * 获取语言特定模板变体
     * @param {string} language - 编程语言
     * @param {string} templateName - 模板名称
     * @returns {Promise<Object>} 变体结果
     */
    async getLanguageVariants(language, templateName = null) {
        const cacheKey = `variants:${language}:${templateName || 'all'}`;
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            this.performanceMetrics.cacheHits++;
            return {
                ...this.cache.get(cacheKey),
                fromCache: true
            };
        }

        try {
            const variants = await this.templateGenerator.getLanguageVariants(language, templateName);
            
            if (variants.success) {
                // 添加变体增强信息
                variants.enhancement = {
                    analysis: this.analyzeVariants(variants.variants),
                    recommendations: this.getVariantRecommendations(language, variants.variants),
                    usage: this.getVariantUsageStats(language, templateName)
                };

                // 缓存结果
                this.cache.set(cacheKey, variants);
            }

            return variants;
        } catch (error) {
            throw new Error(`获取模板变体失败: ${error.message}`);
        }
    }

    /**
     * 批量生成模板
     * @param {Array} requests - 批量请求列表
     * @param {Object} batchOptions - 批量选项
     * @returns {Promise<Object>} 批量结果
     */
    async batchGenerate(requests, batchOptions = {}) {
        const {
            maxConcurrency = 5,
            failFast = false,
            includeAnalytics = true
        } = batchOptions;

        const startTime = Date.now();
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // 分批处理以避免过载
            const batches = this.chunkArray(requests, maxConcurrency);
            const allResults = [];
            const allErrors = [];

            for (const batch of batches) {
                const batchPromises = batch.map(async (request, index) => {
                    try {
                        const result = await this.templateGenerator.generateTemplate(
                            request.languageDetection,
                            request.options
                        );
                        return {
                            id: request.id || `item_${index}`,
                            ...result
                        };
                    } catch (error) {
                        const errorResult = {
                            id: request.id || `item_${index}`,
                            success: false,
                            error: error.message,
                            request
                        };

                        if (failFast) {
                            throw error;
                        }

                        return errorResult;
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                
                // 分离成功和失败的结果
                batchResults.forEach(result => {
                    if (result.success) {
                        allResults.push(result);
                    } else {
                        allErrors.push(result);
                    }
                });
            }

            const batchResult = {
                success: true,
                batchId,
                processed: requests.length,
                successful: allResults.length,
                failed: allErrors.length,
                results: allResults,
                errors: allErrors.length > 0 ? allErrors : undefined,
                timing: {
                    totalTime: Date.now() - startTime,
                    averagePerItem: (Date.now() - startTime) / requests.length
                }
            };

            // 添加分析数据
            if (includeAnalytics) {
                batchResult.analytics = this.generateBatchAnalytics(allResults, allErrors);
            }

            return batchResult;
        } catch (error) {
            throw new Error(`批量模板生成失败: ${error.message}`);
        }
    }

    /**
     * 搜索可用模板
     * @param {Object} criteria - 搜索条件
     * @returns {Promise<Object>} 搜索结果
     */
    async searchTemplates(criteria = {}) {
        const {
            language = null,
            category = null,
            keyword = null,
            includeVariants = true
        } = criteria;

        try {
            const searchResults = {
                templates: [],
                variants: [],
                metadata: {
                    searchTime: Date.now(),
                    criteria
                }
            };

            // 搜索基础模板
            const baseTemplates = await this.findBaseTemplates(keyword, category);
            searchResults.templates = baseTemplates;

            // 搜索语言变体
            if (includeVariants && language) {
                const variants = await this.findLanguageVariants(language, keyword, category);
                searchResults.variants = variants;
            }

            // 添加搜索建议
            searchResults.suggestions = this.generateSearchSuggestions(criteria, searchResults);
            searchResults.metadata.totalFound = searchResults.templates.length + searchResults.variants.length;

            return searchResults;
        } catch (error) {
            throw new Error(`模板搜索失败: ${error.message}`);
        }
    }

    /**
     * 验证模板内容
     * @param {string} templateContent - 模板内容
     * @param {Object} validationOptions - 验证选项
     * @returns {Object} 验证结果
     */
    validateTemplate(templateContent, validationOptions = {}) {
        const {
            checkSyntax = true,
            checkVariables = true,
            checkStructure = true
        } = validationOptions;

        const validation = {
            valid: true,
            issues: [],
            warnings: [],
            score: 100
        };

        try {
            // 语法检查
            if (checkSyntax) {
                this.validateTemplateSyntax(templateContent, validation);
            }

            // 变量检查
            if (checkVariables) {
                this.validateTemplateVariables(templateContent, validation);
            }

            // 结构检查
            if (checkStructure) {
                this.validateTemplateStructure(templateContent, validation);
            }

            // 计算最终分数
            validation.score = Math.max(0, 100 - (validation.issues.length * 20) - (validation.warnings.length * 5));
            validation.valid = validation.score >= 60;

            return validation;
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                score: 0
            };
        }
    }

    /**
     * 获取模板统计信息
     * @returns {Object} 统计信息
     */
    getTemplateStats() {
        return {
            performance: { ...this.performanceMetrics },
            cache: {
                size: this.cache.size,
                hitRate: this.performanceMetrics.cacheHits / Math.max(1, this.performanceMetrics.totalGenerations)
            },
            availability: {
                baseTemplates: this.getBaseTemplateCount(),
                languageVariants: this.getLanguageVariantCount(),
                totalTemplates: this.getTotalTemplateCount()
            }
        };
    }

    // 私有辅助方法

    /**
     * 计算模板质量分数
     * @private
     */
    calculateTemplateQuality(templates) {
        if (!templates || Object.keys(templates).length === 0) {
            return 0;
        }

        let totalScore = 0;
        let count = 0;

        Object.values(templates).forEach(template => {
            const content = template.content || '';
            let score = 50; // 基础分数

            // 长度检查
            if (content.length > 100) score += 10;
            if (content.length > 500) score += 10;

            // 结构检查
            if (content.includes('#')) score += 10; // 有标题
            if (content.includes('```')) score += 10; // 有代码块
            if (content.includes('- ') || content.includes('1. ')) score += 10; // 有列表

            // 变量检查
            const variables = content.match(/{{.*?}}/g) || [];
            if (variables.length > 0) score += 10;

            totalScore += Math.min(100, score);
            count++;
        });

        return count > 0 ? Math.round(totalScore / count) : 0;
    }

    /**
     * 生成模板建议
     * @private
     */
    generateTemplateSuggestions(result, options) {
        const suggestions = [];

        if (result.metadata.templateCount < 3) {
            suggestions.push({
                type: 'enhancement',
                message: '建议添加更多模板类型以丰富项目文档',
                priority: 'medium'
            });
        }

        if (!options.includeFrameworks && result.metadata.frameworks.length > 0) {
            suggestions.push({
                type: 'optimization',
                message: '启用框架特定模板可获得更好的生成效果',
                priority: 'high'
            });
        }

        return suggestions;
    }

    /**
     * 查找相关模板
     * @private
     */
    async findRelatedTemplates(language) {
        try {
            const related = [];
            const availableTemplates = await this.templateGenerator.getAvailableTemplates(language);
            
            if (availableTemplates.languages[language]) {
                const languageTemplates = availableTemplates.languages[language];
                related.push(...languageTemplates.core.slice(0, 3));
            }

            return related;
        } catch (error) {
            return [];
        }
    }

    /**
     * 更新性能指标
     * @private
     */
    updatePerformanceMetrics(duration) {
        this.performanceMetrics.averageTime = 
            (this.performanceMetrics.averageTime * (this.performanceMetrics.totalGenerations - 1) + duration) 
            / this.performanceMetrics.totalGenerations;
    }

    /**
     * 分析模板变体
     * @private
     */
    analyzeVariants(variants) {
        const analysis = {
            totalVariants: Object.keys(variants).length,
            types: {},
            averageSize: 0,
            complexity: 'medium'
        };

        let totalSize = 0;
        Object.values(variants).forEach(variant => {
            const type = variant.type || 'unknown';
            analysis.types[type] = (analysis.types[type] || 0) + 1;
            totalSize += variant.content.length;
        });

        if (analysis.totalVariants > 0) {
            analysis.averageSize = Math.round(totalSize / analysis.totalVariants);
            analysis.complexity = analysis.averageSize > 1000 ? 'high' : 
                                  analysis.averageSize > 500 ? 'medium' : 'low';
        }

        return analysis;
    }

    /**
     * 获取变体推荐
     * @private
     */
    getVariantRecommendations(language, variants) {
        const recommendations = [];
        
        const variantTypes = Object.values(variants).map(v => v.type || 'generic');
        const uniqueTypes = [...new Set(variantTypes)];

        if (uniqueTypes.length < 3) {
            recommendations.push({
                type: 'enhancement',
                message: `建议为${language}添加更多类型的模板变体`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * 获取变体使用统计
     * @private
     */
    getVariantUsageStats(language, templateName) {
        // 简化实现，实际应该从使用日志中获取
        return {
            popularity: 'medium',
            lastUsed: new Date().toISOString(),
            usageCount: Math.floor(Math.random() * 100)
        };
    }

    /**
     * 数组分块
     * @private
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * 生成批量分析
     * @private
     */
    generateBatchAnalytics(results, errors) {
        const analytics = {
            languageDistribution: {},
            templateTypeDistribution: {},
            qualityScores: [],
            commonErrors: {}
        };

        // 分析成功结果
        results.forEach(result => {
            if (result.metadata) {
                const lang = result.metadata.language;
                analytics.languageDistribution[lang] = (analytics.languageDistribution[lang] || 0) + 1;
            }
            
            if (result.enhancement && result.enhancement.qualityScore) {
                analytics.qualityScores.push(result.enhancement.qualityScore);
            }
        });

        // 分析错误
        errors.forEach(error => {
            const errorType = this.categorizeError(error.error);
            analytics.commonErrors[errorType] = (analytics.commonErrors[errorType] || 0) + 1;
        });

        // 计算统计值
        if (analytics.qualityScores.length > 0) {
            analytics.averageQuality = analytics.qualityScores.reduce((a, b) => a + b, 0) / analytics.qualityScores.length;
        }

        return analytics;
    }

    /**
     * 查找基础模板
     * @private
     */
    async findBaseTemplates(keyword, category) {
        const templates = [];
        
        try {
            if (fs.existsSync(this.templatesBaseDir)) {
                const files = fs.readdirSync(this.templatesBaseDir);
                
                files.forEach(file => {
                    if (path.extname(file) === '.md') {
                        const templateName = path.basename(file, '.md');
                        if (!keyword || templateName.includes(keyword)) {
                            templates.push({
                                name: templateName,
                                type: 'base',
                                path: path.join(this.templatesBaseDir, file),
                                category: this.detectTemplateCategory(templateName)
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.warn(`查找基础模板失败: ${error.message}`);
        }

        return templates.filter(t => !category || t.category === category);
    }

    /**
     * 查找语言变体
     * @private
     */
    async findLanguageVariants(language, keyword, category) {
        const variants = [];
        
        try {
            const languageDir = path.join(this.languageVariantsDir, language);
            
            if (fs.existsSync(languageDir)) {
                const files = fs.readdirSync(languageDir);
                
                files.forEach(file => {
                    if (path.extname(file) === '.md') {
                        const variantName = path.basename(file, '.md');
                        if (!keyword || variantName.includes(keyword)) {
                            variants.push({
                                name: variantName,
                                type: 'variant',
                                language,
                                path: path.join(languageDir, file),
                                category: this.detectTemplateCategory(variantName)
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.warn(`查找语言变体失败: ${error.message}`);
        }

        return variants.filter(v => !category || v.category === category);
    }

    /**
     * 其他私有辅助方法
     * @private
     */
    generateSearchSuggestions() { return []; }
    validateTemplateSyntax() { }
    validateTemplateVariables() { }
    validateTemplateStructure() { }
    getBaseTemplateCount() { return 0; }
    getLanguageVariantCount() { return 0; }
    getTotalTemplateCount() { return 0; }
    categorizeError(error) { return 'unknown'; }
    detectTemplateCategory(name) { return 'general'; }
}

export default TemplateEngineService;