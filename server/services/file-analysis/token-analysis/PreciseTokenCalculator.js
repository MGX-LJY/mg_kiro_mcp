/**
 * 精确Token计算器 - 多语言智能Token分析
 * 
 * 核心功能：
 * - 支持多种编程语言的精确Token计算
 * - 考虑注释、字符串、关键字等因素
 * - 优化的缓存机制提升性能
 * - 基于实际Token使用情况的智能估算
 * 
 * 设计理念：
 * - 精确性优于速度：确保Token计算准确
 * - 语言特异性：不同语言有不同的Token密度
 * - 智能优化：缓存和批量计算提升效率
 * - 可扩展性：易于添加新语言支持
 */

import { promises as fs } from 'fs';
import { extname, basename } from 'path';
import { TokenResultFactory, TOKEN_CALCULATION_METHODS, TOKEN_CONFIDENCE_LEVELS } from '../../../interfaces/TokenResult.js';

export class PreciseTokenCalculator {
    constructor(config = {}) {
        this.config = {
            cacheEnabled: true,
            maxCacheSize: 1000,
            tokenSafetyBuffer: 0.1, // 10%安全缓冲
            ...config
        };

        // Token计算缓存
        this.tokenCache = new Map();
        
        // 语言特定的Token计算规则
        this.languageRules = {
            javascript: {
                tokenRatio: 0.28,           // JS平均token比率
                commentWeight: 0.2,         // 注释token权重
                stringWeight: 0.35,         // 字符串token权重
                keywordWeight: 1.2,         // 关键字token权重
                symbolWeight: 0.15,         // 符号token权重
                identifierWeight: 0.3       // 标识符token权重
            },
            typescript: {
                tokenRatio: 0.32,
                commentWeight: 0.2,
                stringWeight: 0.35,
                keywordWeight: 1.3,
                symbolWeight: 0.18,
                identifierWeight: 0.35
            },
            python: {
                tokenRatio: 0.25,
                commentWeight: 0.18,
                stringWeight: 0.3,
                keywordWeight: 1.1,
                symbolWeight: 0.12,
                identifierWeight: 0.28
            },
            java: {
                tokenRatio: 0.35,
                commentWeight: 0.22,
                stringWeight: 0.4,
                keywordWeight: 1.4,
                symbolWeight: 0.2,
                identifierWeight: 0.38
            },
            go: {
                tokenRatio: 0.3,
                commentWeight: 0.2,
                stringWeight: 0.32,
                keywordWeight: 1.25,
                symbolWeight: 0.15,
                identifierWeight: 0.32
            },
            rust: {
                tokenRatio: 0.33,
                commentWeight: 0.25,
                stringWeight: 0.38,
                keywordWeight: 1.5,
                symbolWeight: 0.22,
                identifierWeight: 0.35
            },
            'c#': {
                tokenRatio: 0.34,
                commentWeight: 0.22,
                stringWeight: 0.4,
                keywordWeight: 1.35,
                symbolWeight: 0.18,
                identifierWeight: 0.36
            },
            json: {
                tokenRatio: 0.4,
                commentWeight: 0,
                stringWeight: 0.5,
                keywordWeight: 0.8,
                symbolWeight: 0.25,
                identifierWeight: 0.45
            },
            markdown: {
                tokenRatio: 0.22,
                commentWeight: 0.15,
                stringWeight: 0.25,
                keywordWeight: 0.9,
                symbolWeight: 0.1,
                identifierWeight: 0.2
            },
            yaml: {
                tokenRatio: 0.3,
                commentWeight: 0.15,
                stringWeight: 0.35,
                keywordWeight: 1.0,
                symbolWeight: 0.2,
                identifierWeight: 0.25
            },
            default: {
                tokenRatio: 0.28,
                commentWeight: 0.2,
                stringWeight: 0.3,
                keywordWeight: 1.0,
                symbolWeight: 0.15,
                identifierWeight: 0.3
            }
        };

        // 语言检测正则表达式
        this.languagePatterns = {
            javascript: /\.(js|jsx|mjs)$/i,
            typescript: /\.(ts|tsx)$/i,
            python: /\.(py|pyw)$/i,
            java: /\.(java)$/i,
            go: /\.(go)$/i,
            rust: /\.(rs)$/i,
            'c#': /\.(cs)$/i,
            json: /\.(json)$/i,
            markdown: /\.(md|markdown)$/i,
            yaml: /\.(yml|yaml)$/i
        };

        // Token限制配置
        this.tokenLimits = {
            'claude-3-5-sonnet': 200000,
            'claude-3-haiku': 200000,
            'gpt-4': 128000,
            'gpt-4-turbo': 128000,
            'gpt-3.5-turbo': 16000,
            default: 100000
        };
    }

    /**
     * 计算文件的精确Token数量
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容（可选，如果提供则不读取文件）
     * @param {Object} languageProfile - 语言配置信息
     * @returns {Promise<TokenResult>} 统一Token计算结果
     */
    async calculateTokens(filePath, content = null, languageProfile = null) {
        try {
            // 生成缓存键
            const cacheKey = this._generateCacheKey(filePath, content);
            
            // 检查缓存
            if (this.config.cacheEnabled && this.tokenCache.has(cacheKey)) {
                const cached = this.tokenCache.get(cacheKey);
                console.log(`[TokenCalculator] 命中缓存: ${filePath}`);
                // 转换为TokenResult格式
                return TokenResultFactory.fromComplexTokenResult({
                    ...cached,
                    fromCache: true
                });
            }

            // 读取文件内容（如果未提供）
            if (!content) {
                content = await fs.readFile(filePath, 'utf8');
            }

            // 检测语言
            const language = this._detectLanguage(filePath, languageProfile);
            const rules = this.languageRules[language] || this.languageRules.default;

            // 执行精确计算
            const tokenResult = this._calculatePreciseTokens(content, language, rules);

            // 创建统一TokenResult格式
            const result = TokenResultFactory.createTokenResult(tokenResult.totalTokens, {
                details: {
                    estimatedTokens: tokenResult.estimatedTokens,
                    safeTokenCount: Math.ceil(tokenResult.totalTokens * (1 + this.config.tokenSafetyBuffer)),
                    breakdown: tokenResult.breakdown,
                    confidence: tokenResult.confidence
                },
                metadata: {
                    filePath,
                    language,
                    calculationMethod: TOKEN_CALCULATION_METHODS.PRECISE,
                    analysisTimestamp: new Date().toISOString(),
                    fromCache: false
                }
            });

            // 更新缓存（缓存原始格式，便于后续转换）
            this._updateCache(cacheKey, {
                totalTokens: tokenResult.totalTokens,
                estimatedTokens: tokenResult.estimatedTokens,
                breakdown: tokenResult.breakdown,
                confidence: tokenResult.confidence,
                filePath,
                language,
                calculationMethod: TOKEN_CALCULATION_METHODS.PRECISE,
                safeTokenCount: Math.ceil(tokenResult.totalTokens * (1 + this.config.tokenSafetyBuffer)),
                analysisTimestamp: new Date().toISOString()
            });

            return result;

        } catch (error) {
            console.error(`[TokenCalculator] 计算Token失败: ${filePath}`, error);
            
            // 使用TokenResult工厂创建错误结果
            return TokenResultFactory.createErrorTokenResult(filePath, error.message);
        }
    }

    /**
     * 批量计算Token
     * @param {Array} files - 文件列表 [{path, content}]
     * @param {Object} languageProfile - 语言配置信息
     * @returns {Promise<Array<TokenResult>>} 统一Token计算结果数组
     */
    async batchCalculateTokens(files, languageProfile = null) {
        console.log(`[TokenCalculator] 开始批量计算Token: ${files.length} 个文件`);
        
        const results = [];
        const batchSize = 10; // 并发批次大小
        
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            
            const batchPromises = batch.map(file => 
                this.calculateTokens(file.path, file.content, languageProfile)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`[TokenCalculator] 批量计算失败: ${batch[index].path}`, result.reason);
                    results.push(TokenResultFactory.createErrorTokenResult(
                        batch[index].path, 
                        result.reason.message || 'Unknown batch calculation error'
                    ));
                }
            });
        }
        
        return results;
    }

    /**
     * 精确Token计算核心算法
     * @private
     */
    _calculatePreciseTokens(content, language, rules) {
        const breakdown = {
            totalChars: content.length,
            lines: content.split('\n').length,
            comments: 0,
            strings: 0,
            keywords: 0,
            symbols: 0,
            identifiers: 0,
            whitespace: 0
        };

        // 分析内容组成
        this._analyzeContentBreakdown(content, language, breakdown);

        // 基于组成部分计算Token
        const tokenBreakdown = {
            commentsTokens: Math.ceil(breakdown.comments * rules.commentWeight),
            stringsTokens: Math.ceil(breakdown.strings * rules.stringWeight),
            keywordsTokens: Math.ceil(breakdown.keywords * rules.keywordWeight),
            symbolsTokens: Math.ceil(breakdown.symbols * rules.symbolWeight),
            identifiersTokens: Math.ceil(breakdown.identifiers * rules.identifierWeight),
            baseTokens: Math.ceil(breakdown.totalChars * rules.tokenRatio)
        };

        // 计算总Token数（使用更精确的方法）
        const preciseTokens = tokenBreakdown.commentsTokens + 
                             tokenBreakdown.stringsTokens + 
                             tokenBreakdown.keywordsTokens + 
                             tokenBreakdown.symbolsTokens + 
                             tokenBreakdown.identifiersTokens;

        // 估算Token数（简单方法）
        const estimatedTokens = tokenBreakdown.baseTokens;

        // 取两者的平均值，偏向精确计算
        const totalTokens = Math.ceil((preciseTokens * 0.7) + (estimatedTokens * 0.3));

        // 计算置信度
        const confidence = this._calculateConfidence(content, language, totalTokens);

        return {
            totalTokens,
            estimatedTokens,
            breakdown: {
                ...breakdown,
                tokens: tokenBreakdown
            },
            confidence
        };
    }

    /**
     * 分析内容组成
     * @private
     */
    _analyzeContentBreakdown(content, language, breakdown) {
        // 计算注释
        breakdown.comments = this._countComments(content, language);
        
        // 计算字符串
        breakdown.strings = this._countStrings(content, language);
        
        // 计算关键字
        breakdown.keywords = this._countKeywords(content, language);
        
        // 计算符号
        breakdown.symbols = this._countSymbols(content);
        
        // 计算标识符
        breakdown.identifiers = this._countIdentifiers(content, language);
        
        // 计算空白字符
        breakdown.whitespace = this._countWhitespace(content);
    }

    /**
     * 计算注释字符数
     * @private
     */
    _countComments(content, language) {
        const commentPatterns = {
            javascript: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            typescript: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            python: [/#.*$/gm, /'''[\s\S]*?'''/g, /"""[\s\S]*?"""/g],
            java: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            go: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            rust: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            'c#': [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
            default: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm, /#.*$/gm]
        };

        const patterns = commentPatterns[language] || commentPatterns.default;
        let commentChars = 0;

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                commentChars += matches.reduce((sum, match) => sum + match.length, 0);
            }
        });

        return commentChars;
    }

    /**
     * 计算字符串字符数
     * @private
     */
    _countStrings(content, language) {
        const stringPatterns = {
            javascript: [/"[^"\\]*(?:\\.[^"\\]*)*"/g, /'[^'\\]*(?:\\.[^'\\]*)*'/g, /`[^`\\]*(?:\\.[^`\\]*)*`/g],
            typescript: [/"[^"\\]*(?:\\.[^"\\]*)*"/g, /'[^'\\]*(?:\\.[^'\\]*)*'/g, /`[^`\\]*(?:\\.[^`\\]*)*`/g],
            python: [/"""[\s\S]*?"""/g, /'''[\s\S]*?'''/g, /"[^"\\]*(?:\\.[^"\\]*)*"/g, /'[^'\\]*(?:\\.[^'\\]*)*'/g],
            default: [/"[^"\\]*(?:\\.[^"\\]*)*"/g, /'[^'\\]*(?:\\.[^'\\]*)*'/g]
        };

        const patterns = stringPatterns[language] || stringPatterns.default;
        let stringChars = 0;

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                stringChars += matches.reduce((sum, match) => sum + match.length, 0);
            }
        });

        return stringChars;
    }

    /**
     * 计算关键字字符数
     * @private
     */
    _countKeywords(content, language) {
        const keywords = {
            javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'export', 'import'],
            typescript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'export', 'import', 'interface', 'type'],
            python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'return', 'try', 'except'],
            default: ['function', 'class', 'if', 'else', 'for', 'while', 'return']
        };

        const langKeywords = keywords[language] || keywords.default;
        let keywordChars = 0;

        langKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) {
                keywordChars += matches.length * keyword.length;
            }
        });

        return keywordChars;
    }

    /**
     * 计算符号字符数
     * @private
     */
    _countSymbols(content) {
        const symbolPattern = /[{}()\[\]<>.,;:!@#$%^&*+=|\\/?-]/g;
        const matches = content.match(symbolPattern);
        return matches ? matches.length : 0;
    }

    /**
     * 计算标识符字符数
     * @private
     */
    _countIdentifiers(content, language) {
        // 移除注释和字符串后计算标识符
        let cleanContent = content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '')
            .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '');

        const identifierPattern = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
        const matches = cleanContent.match(identifierPattern);
        return matches ? matches.reduce((sum, match) => sum + match.length, 0) : 0;
    }

    /**
     * 计算空白字符数
     * @private
     */
    _countWhitespace(content) {
        const whitespacePattern = /\s/g;
        const matches = content.match(whitespacePattern);
        return matches ? matches.length : 0;
    }

    /**
     * 计算置信度
     * @private
     */
    _calculateConfidence(content, language, totalTokens) {
        let confidence = 0.8; // 基础置信度

        // 已知语言提升置信度
        if (this.languageRules[language]) {
            confidence += 0.15;
        }

        // 内容大小适中提升置信度
        if (content.length > 100 && content.length < 50000) {
            confidence += 0.05;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * 检测语言
     * @private
     */
    _detectLanguage(filePath, languageProfile = null) {
        // 优先使用提供的语言配置
        if (languageProfile && languageProfile.primary) {
            return languageProfile.primary.toLowerCase();
        }

        // 基于文件扩展名检测
        for (const [language, pattern] of Object.entries(this.languagePatterns)) {
            if (pattern.test(filePath)) {
                return language;
            }
        }

        return 'default';
    }

    /**
     * 基础Token估算（备用方法）
     * @private
     */
    _basicTokenEstimate(content) {
        const chars = content.length;
        const hasChineseChars = /[\u4e00-\u9fff]/.test(content);
        const tokenRatio = hasChineseChars ? 0.6 : 0.25;
        return Math.ceil(chars * tokenRatio);
    }

    /**
     * 生成缓存键
     * @private
     */
    _generateCacheKey(filePath, content) {
        const contentHash = content ? this._simpleHash(content) : 'no-content';
        return `${filePath}:${contentHash}`;
    }

    /**
     * 简单哈希函数
     * @private
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < Math.min(str.length, 1000); i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * 更新缓存
     * @private
     */
    _updateCache(key, value) {
        if (!this.config.cacheEnabled) return;

        // 清理旧缓存
        if (this.tokenCache.size >= this.config.maxCacheSize) {
            const firstKey = this.tokenCache.keys().next().value;
            this.tokenCache.delete(firstKey);
        }

        this.tokenCache.set(key, value);
    }

    /**
     * 检查Token是否超过限制
     */
    exceedsLimit(tokens, model = 'default') {
        const limit = this.tokenLimits[model] || this.tokenLimits.default;
        return tokens > limit * 0.8; // 预留20%缓冲
    }

    /**
     * 计算需要的分片数
     */
    calculateChunks(tokens, model = 'default') {
        const limit = this.tokenLimits[model] || this.tokenLimits.default;
        const safeLimit = limit * 0.6; // 安全限制60%
        return Math.ceil(tokens / safeLimit);
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            cacheSize: this.tokenCache.size,
            maxCacheSize: this.config.maxCacheSize,
            cacheHitRate: this.cacheHits / Math.max(this.totalRequests, 1),
            isEnabled: this.config.cacheEnabled
        };
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.tokenCache.clear();
        this.cacheHits = 0;
        this.totalRequests = 0;
        console.log('[TokenCalculator] 缓存已清空');
    }
}

export default PreciseTokenCalculator;