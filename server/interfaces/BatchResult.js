/**
 * BatchResult 统一接口定义
 * 
 * 解决批次策略返回格式不一致的核心问题
 * 统一CombinedFileBatch、SingleFileBatch、LargeFileMultiBatch的输出格式
 * 
 * @version 1.0.0
 * @date 2025-09-12
 */

/**
 * 统一批次结果接口
 * @typedef {Object} BatchResult
 * @property {BatchType} type - 批次类型
 * @property {string} batchId - 批次唯一标识
 * @property {BatchStrategy} strategy - 处理策略
 * @property {number} estimatedTokens - 预估Token数量（简化为数字）
 * @property {number} fileCount - 文件数量
 * @property {BatchFile[]} files - 统一的文件信息数组
 * @property {BatchMetadata} metadata - 批次元数据
 * @property {ChunkInfo} [chunkInfo] - 可选的分片信息（仅large_file_chunk需要）
 * @property {ParentFileInfo} [parentFileInfo] - 可选的父文件信息（仅large_file_chunk需要）
 */

/**
 * 批次类型枚举
 * @typedef {'combined_batch'|'single_batch'|'large_file_chunk'} BatchType
 */

/**
 * 批次策略枚举  
 * @typedef {'combined'|'single'|'largeMulti'} BatchStrategy
 */

/**
 * 统一的批次文件信息
 * @typedef {Object} BatchFile
 * @property {string} path - 文件相对路径
 * @property {number} tokenCount - Token数量（简化为数字）
 * @property {number} size - 文件大小（字节）
 * @property {string} language - 编程语言
 * @property {number} [originalIndex] - 原始索引
 * @property {number} [priority] - 优先级
 */

/**
 * 批次元数据
 * @typedef {Object} BatchMetadata
 * @property {string} strategy - 处理策略
 * @property {number} fileCount - 文件数量
 * @property {string} [description] - 批次描述
 * @property {number} [efficiency] - 批次效率评分
 * @property {ProcessingHints} [processingHints] - 处理提示
 */

/**
 * 分片信息（仅大文件分片使用）
 * @typedef {Object} ChunkInfo
 * @property {number} chunkIndex - 分片索引（从1开始）
 * @property {number} totalChunks - 总分片数
 * @property {number} startLine - 起始行号
 * @property {number} endLine - 结束行号
 * @property {string} content - 分片内容
 * @property {string} [type] - 分片类型
 */

/**
 * 父文件信息（仅大文件分片使用）
 * @typedef {Object} ParentFileInfo
 * @property {string} path - 父文件路径
 * @property {number} totalTokens - 父文件总Token数
 * @property {number} originalIndex - 原始文件索引
 */

/**
 * 处理提示
 * @typedef {Object} ProcessingHints
 * @property {boolean} recommended - 是否推荐分片
 * @property {number} [maxTokensPerChunk] - 每片最大Token数
 * @property {string} [strategy] - 推荐策略
 * @property {boolean} [enableBoundaryDetection] - 是否启用边界检测
 */

/**
 * BatchResult工厂类
 */
export class BatchResultFactory {
    /**
     * 创建组合批次结果
     * @param {string} batchId 
     * @param {BatchFile[]} files 
     * @param {number} estimatedTokens 
     * @param {Object} options 
     * @returns {BatchResult}
     */
    static createCombinedBatch(batchId, files, estimatedTokens, options = {}) {
        return {
            type: 'combined_batch',
            batchId,
            strategy: 'combined',
            estimatedTokens,
            fileCount: files.length,
            files,
            metadata: {
                strategy: 'combined',
                fileCount: files.length,
                description: options.description || `组合批次包含${files.length}个文件`,
                efficiency: options.efficiency || 0,
                processingHints: {
                    recommended: false,
                    strategy: 'combined_files'
                }
            }
        };
    }

    /**
     * 创建单文件批次结果
     * @param {string} batchId 
     * @param {BatchFile} file 
     * @param {number} estimatedTokens 
     * @param {Object} options 
     * @returns {BatchResult}
     */
    static createSingleBatch(batchId, file, estimatedTokens, options = {}) {
        return {
            type: 'single_batch',
            batchId,
            strategy: 'single', 
            estimatedTokens,
            fileCount: 1,
            files: [file],
            metadata: {
                strategy: 'single',
                fileCount: 1,
                description: options.description || `单文件批次: ${file.path}`,
                efficiency: options.efficiency || 0,
                processingHints: {
                    recommended: false,
                    strategy: 'single_file'
                }
            }
        };
    }

    /**
     * 创建大文件分片批次结果
     * @param {string} batchId 
     * @param {BatchFile} file 
     * @param {ChunkInfo} chunkInfo 
     * @param {ParentFileInfo} parentFileInfo 
     * @param {Object} options 
     * @returns {BatchResult}
     */
    static createLargeFileChunk(batchId, file, chunkInfo, parentFileInfo, options = {}) {
        return {
            type: 'large_file_chunk',
            batchId,
            strategy: 'largeMulti',
            estimatedTokens: chunkInfo.content ? this._estimateTokens(chunkInfo.content) : 0,
            fileCount: 1,
            files: [file],
            chunkInfo,
            parentFileInfo,
            metadata: {
                strategy: 'largeMulti',
                fileCount: 1,
                description: options.description || `大文件分片 ${chunkInfo.chunkIndex}/${chunkInfo.totalChunks}: ${parentFileInfo.path}`,
                efficiency: options.efficiency || 0,
                processingHints: {
                    recommended: true,
                    maxTokensPerChunk: 1200,
                    strategy: 'function_boundary',
                    enableBoundaryDetection: true
                }
            }
        };
    }

    /**
     * 简单的Token估算（备用方法）
     * @param {string} content 
     * @returns {number}
     */
    static _estimateTokens(content) {
        if (!content) return 0;
        // 简单估算：平均每4个字符1个token
        return Math.ceil(content.length / 4);
    }

    /**
     * 验证BatchResult格式
     * @param {*} result 
     * @returns {boolean}
     */
    static isValidBatchResult(result) {
        if (!result || typeof result !== 'object') return false;
        
        const requiredFields = ['type', 'batchId', 'strategy', 'estimatedTokens', 'fileCount', 'files', 'metadata'];
        for (const field of requiredFields) {
            if (!(field in result)) {
                console.warn(`[BatchResult] 缺少必需字段: ${field}`);
                return false;
            }
        }

        // 验证files数组
        if (!Array.isArray(result.files)) {
            console.warn(`[BatchResult] files必须是数组`);
            return false;
        }

        // 验证large_file_chunk特殊字段
        if (result.type === 'large_file_chunk') {
            if (!result.chunkInfo || !result.parentFileInfo) {
                console.warn(`[BatchResult] large_file_chunk必须包含chunkInfo和parentFileInfo`);
                return false;
            }
        }

        return true;
    }

    /**
     * 从旧格式转换为新格式（向后兼容）
     * @param {*} oldResult 
     * @returns {BatchResult|null}
     */
    static convertFromLegacyFormat(oldResult) {
        if (!oldResult || typeof oldResult !== 'object') return null;

        try {
            // 检测旧的CombinedFileBatch格式
            if (oldResult.type === 'combined_files' && oldResult.files) {
                const files = oldResult.files.map(f => ({
                    path: f.path,
                    tokenCount: this._extractTokenCount(f.tokenCount),
                    size: f.size || 0,
                    language: f.language || 'javascript',
                    originalIndex: f.originalIndex,
                    priority: f.priority
                }));

                return this.createCombinedBatch(
                    oldResult.batchId, 
                    files, 
                    oldResult.estimatedTokens,
                    { efficiency: oldResult.efficiency }
                );
            }

            // 检测旧的LargeFileMultiBatch格式
            if (oldResult.type === 'large_file_chunk' && oldResult.parentFileInfo && oldResult.chunkInfo) {
                const file = {
                    path: oldResult.parentFileInfo.path,
                    tokenCount: oldResult.chunkInfo.estimatedTokens || 0,
                    size: 0, // 分片没有单独的文件大小
                    language: 'javascript' // 默认语言
                };

                return this.createLargeFileChunk(
                    oldResult.batchId,
                    file,
                    oldResult.chunkInfo,
                    oldResult.parentFileInfo
                );
            }

            console.warn(`[BatchResult] 未知的旧格式:`, oldResult.type);
            return null;

        } catch (error) {
            console.error(`[BatchResult] 格式转换失败:`, error);
            return null;
        }
    }

    /**
     * 安全提取Token数量
     * @param {*} tokenCount 
     * @returns {number}
     */
    static _extractTokenCount(tokenCount) {
        if (typeof tokenCount === 'number') return tokenCount;
        if (tokenCount && typeof tokenCount === 'object') {
            return tokenCount.totalTokens || 
                   tokenCount.safeTokenCount || 
                   tokenCount.estimatedTokens || 0;
        }
        return 0;
    }
}

/**
 * BatchResult验证器
 */
export class BatchResultValidator {
    /**
     * 深度验证BatchResult
     * @param {*} result 
     * @returns {{isValid: boolean, errors: string[]}}
     */
    static validate(result) {
        const errors = [];

        if (!BatchResultFactory.isValidBatchResult(result)) {
            errors.push('基本格式验证失败');
        }

        // 验证类型一致性
        if (result.type && result.strategy) {
            const typeStrategyMap = {
                'combined_batch': 'combined',
                'single_batch': 'single',
                'large_file_chunk': 'largeMulti'
            };

            if (typeStrategyMap[result.type] !== result.strategy) {
                errors.push(`类型(${result.type})与策略(${result.strategy})不匹配`);
            }
        }

        // 验证Token数量
        if (typeof result.estimatedTokens !== 'number' || result.estimatedTokens < 0) {
            errors.push('estimatedTokens必须是非负数');
        }

        // 验证文件数量一致性
        if (result.fileCount && result.files && result.fileCount !== result.files.length) {
            errors.push(`fileCount(${result.fileCount})与files数组长度(${result.files.length})不匹配`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 导出接口常量
export const BATCH_TYPES = {
    COMBINED: 'combined_batch',
    SINGLE: 'single_batch', 
    LARGE_CHUNK: 'large_file_chunk'
};

export const BATCH_STRATEGIES = {
    COMBINED: 'combined',
    SINGLE: 'single',
    LARGE_MULTI: 'largeMulti'
};