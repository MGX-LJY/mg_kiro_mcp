/**
 * TokenResult 统一接口定义
 * 
 * 解决Token计算结果格式复杂化的问题
 * 统一PreciseTokenCalculator的返回格式，简化访问方式
 * 
 * @version 1.0.0
 * @date 2025-09-12
 */

/**
 * 统一Token计算结果接口
 * @typedef {Object} TokenResult
 * @property {number} totalTokens - 主要Token数量（标准访问点）
 * @property {TokenDetails} [details] - 详细信息（可选）
 * @property {TokenMetadata} [metadata] - 计算元数据（可选）
 */

/**
 * Token详细信息
 * @typedef {Object} TokenDetails
 * @property {number} estimatedTokens - 估算Token数量
 * @property {number} safeTokenCount - 安全Token数量（带缓冲）
 * @property {TokenBreakdown} breakdown - 详细分解
 * @property {number} confidence - 计算置信度 (0-1)
 */

/**
 * Token分解信息
 * @typedef {Object} TokenBreakdown
 * @property {number} totalChars - 总字符数
 * @property {number} codeTokens - 代码Token数
 * @property {number} commentTokens - 注释Token数
 * @property {number} stringTokens - 字符串Token数
 * @property {Object} [tokens] - 详细Token分析
 */

/**
 * Token计算元数据
 * @typedef {Object} TokenMetadata
 * @property {string} filePath - 文件路径
 * @property {string} language - 编程语言
 * @property {string} calculationMethod - 计算方法
 * @property {string} analysisTimestamp - 分析时间戳
 * @property {boolean} [fromCache] - 是否来自缓存
 * @property {string} [error] - 错误信息（如有）
 */

/**
 * TokenResult工厂类
 */
export class TokenResultFactory {
    /**
     * 创建标准Token计算结果
     * @param {number} totalTokens - 主要Token数量
     * @param {Object} options - 可选参数
     * @returns {TokenResult}
     */
    static createTokenResult(totalTokens, options = {}) {
        const result = {
            totalTokens: Math.max(0, totalTokens || 0)
        };

        // 添加详细信息（如果提供）
        if (options.details) {
            result.details = {
                estimatedTokens: options.details.estimatedTokens || totalTokens,
                safeTokenCount: options.details.safeTokenCount || Math.floor(totalTokens * 0.9),
                breakdown: options.details.breakdown || this._createBasicBreakdown(totalTokens),
                confidence: Math.max(0, Math.min(1, options.details.confidence || 0.8))
            };
        }

        // 添加元数据（如果提供）
        if (options.metadata) {
            result.metadata = {
                filePath: options.metadata.filePath || 'unknown',
                language: options.metadata.language || 'unknown',
                calculationMethod: options.metadata.calculationMethod || 'standard',
                analysisTimestamp: options.metadata.analysisTimestamp || new Date().toISOString(),
                fromCache: Boolean(options.metadata.fromCache),
                error: options.metadata.error || null
            };
        }

        return result;
    }

    /**
     * 创建简单Token结果（仅数值）
     * @param {number} totalTokens - Token数量
     * @returns {TokenResult}
     */
    static createSimpleTokenResult(totalTokens) {
        return {
            totalTokens: Math.max(0, totalTokens || 0)
        };
    }

    /**
     * 创建错误Token结果
     * @param {string} filePath - 文件路径
     * @param {string} errorMessage - 错误信息
     * @returns {TokenResult}
     */
    static createErrorTokenResult(filePath, errorMessage) {
        return this.createTokenResult(0, {
            metadata: {
                filePath,
                language: 'unknown',
                calculationMethod: 'error',
                analysisTimestamp: new Date().toISOString(),
                error: errorMessage
            }
        });
    }

    /**
     * 从复杂Token对象转换为统一格式
     * @param {*} complexTokenResult - 复杂的Token计算结果
     * @returns {TokenResult}
     */
    static fromComplexTokenResult(complexTokenResult) {
        if (!complexTokenResult || typeof complexTokenResult !== 'object') {
            return this.createSimpleTokenResult(0);
        }

        // 提取主要Token数量
        const totalTokens = this.extractTokenCount(complexTokenResult);

        // 构建选项对象
        const options = {};

        // 添加详细信息
        if (complexTokenResult.estimatedTokens || complexTokenResult.breakdown || complexTokenResult.confidence !== undefined) {
            options.details = {
                estimatedTokens: complexTokenResult.estimatedTokens,
                safeTokenCount: complexTokenResult.safeTokenCount,
                breakdown: complexTokenResult.breakdown,
                confidence: complexTokenResult.confidence
            };
        }

        // 添加元数据
        if (complexTokenResult.filePath || complexTokenResult.language || complexTokenResult.calculationMethod) {
            options.metadata = {
                filePath: complexTokenResult.filePath,
                language: complexTokenResult.language,
                calculationMethod: complexTokenResult.calculationMethod,
                analysisTimestamp: complexTokenResult.analysisTimestamp,
                fromCache: complexTokenResult.fromCache,
                error: complexTokenResult.error
            };
        }

        return this.createTokenResult(totalTokens, options);
    }

    /**
     * 安全提取Token数量
     * @param {*} tokenData - Token数据（可能是数字、对象等）
     * @returns {number}
     */
    static extractTokenCount(tokenData) {
        // 如果已经是数字，直接返回
        if (typeof tokenData === 'number') {
            return Math.max(0, tokenData);
        }

        // 如果是对象，尝试提取主要字段
        if (tokenData && typeof tokenData === 'object') {
            return tokenData.totalTokens ||
                   tokenData.safeTokenCount ||
                   tokenData.estimatedTokens ||
                   0;
        }

        // 其他情况返回0
        return 0;
    }

    /**
     * 创建基础分解信息
     * @private
     */
    static _createBasicBreakdown(totalTokens) {
        return {
            totalChars: totalTokens * 4, // 估算字符数
            codeTokens: Math.floor(totalTokens * 0.7),
            commentTokens: Math.floor(totalTokens * 0.2),
            stringTokens: Math.floor(totalTokens * 0.1)
        };
    }

    /**
     * 验证TokenResult格式
     * @param {*} result - 待验证的结果
     * @returns {boolean}
     */
    static isValidTokenResult(result) {
        if (!result || typeof result !== 'object') {
            return false;
        }

        // 必须有totalTokens字段且为数字
        if (typeof result.totalTokens !== 'number' || result.totalTokens < 0) {
            return false;
        }

        // 验证details字段（如果存在）
        if (result.details) {
            if (typeof result.details !== 'object') {
                return false;
            }
            // 验证置信度范围
            if (result.details.confidence !== undefined && 
                (result.details.confidence < 0 || result.details.confidence > 1)) {
                return false;
            }
        }

        return true;
    }
}

/**
 * TokenResult访问助手
 */
export class TokenResultHelper {
    /**
     * 获取主要Token数量（推荐访问方式）
     * @param {TokenResult} tokenResult - Token结果
     * @returns {number}
     */
    static getTokenCount(tokenResult) {
        return tokenResult?.totalTokens || 0;
    }

    /**
     * 获取安全Token数量（带缓冲）
     * @param {TokenResult} tokenResult - Token结果
     * @returns {number}
     */
    static getSafeTokenCount(tokenResult) {
        return tokenResult?.details?.safeTokenCount || 
               Math.floor(this.getTokenCount(tokenResult) * 0.9);
    }

    /**
     * 获取计算置信度
     * @param {TokenResult} tokenResult - Token结果
     * @returns {number}
     */
    static getConfidence(tokenResult) {
        return tokenResult?.details?.confidence || 0.8;
    }

    /**
     * 检查是否有错误
     * @param {TokenResult} tokenResult - Token结果
     * @returns {boolean}
     */
    static hasError(tokenResult) {
        return Boolean(tokenResult?.metadata?.error);
    }

    /**
     * 获取错误信息
     * @param {TokenResult} tokenResult - Token结果
     * @returns {string|null}
     */
    static getError(tokenResult) {
        return tokenResult?.metadata?.error || null;
    }

    /**
     * 检查Token计算是否成功
     * @param {TokenResult} tokenResult - Token结果
     * @returns {boolean}
     */
    static isSuccess(tokenResult) {
        return !this.hasError(tokenResult);
    }

    /**
     * 是否来自缓存
     * @param {TokenResult} tokenResult - Token结果
     * @returns {boolean}
     */
    static isFromCache(tokenResult) {
        return Boolean(tokenResult?.metadata?.fromCache);
    }

    /**
     * 批量提取Token数量
     * @param {Array<TokenResult>} tokenResults - Token结果数组
     * @returns {Array<number>}
     */
    static batchGetTokenCounts(tokenResults) {
        if (!Array.isArray(tokenResults)) {
            return [];
        }
        return tokenResults.map(result => this.getTokenCount(result));
    }

    /**
     * 计算Token总和
     * @param {Array<TokenResult>} tokenResults - Token结果数组
     * @returns {number}
     */
    static sumTokenCounts(tokenResults) {
        return this.batchGetTokenCounts(tokenResults)
                   .reduce((sum, count) => sum + count, 0);
    }
}

// 导出常量
export const TOKEN_CALCULATION_METHODS = {
    PRECISE: 'precise_tiktoken',
    ESTIMATED: 'estimated_chars',
    BASIC: 'basic_count',
    CACHED: 'cached_result',
    ERROR: 'error',
    FALLBACK: 'fallback'
};

export const TOKEN_CONFIDENCE_LEVELS = {
    HIGH: 0.9,    // 高置信度
    MEDIUM: 0.7,  // 中等置信度
    LOW: 0.5,     // 低置信度
    UNKNOWN: 0.3  // 未知置信度
};