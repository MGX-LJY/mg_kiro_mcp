/**
 * 综合文件批次策略 - 小文件智能合并处理
 * 
 * 核心功能：
 * - 将多个小文件（<15K tokens）合并到一个批次
 * - 目标每批次约18K tokens，最大不超过22K tokens
 * - 智能文件分组：优先合并相关文件
 * - 保持处理效率：减少API调用次数
 * 
 * 设计理念：
 * - 效率优先：最大化Token利用率，减少浪费
 * - 智能分组：相关文件放在同一批次，提升AI理解
 * - 灵活调整：根据文件特性动态调整批次大小
 * - 质量保证：确保每个批次都有足够的上下文信息
 * 
 * @version 2.0.0 - 使用统一BatchResult接口
 */

import { BatchResultFactory } from '../../interfaces/BatchResult.js';

export class CombinedFileBatchStrategy {
    constructor(config = {}) {
        this.config = {
            targetBatchSize: 18000,     // 目标批次大小（Token数）
            maxBatchSize: 22000,        // 最大批次大小（Token数）
            minBatchSize: 8000,         // 最小批次大小（Token数）
            maxFilesPerBatch: 12,       // 每批次最多文件数
            preferRelatedFiles: true,   // 优先合并相关文件
            enableSmartGrouping: true,  // 启用智能分组
            ...config
        };

        // 文件相关性评分权重
        this.relationshipWeights = {
            sameDirectory: 5,       // 同目录文件
            similarName: 3,         // 相似文件名
            sameExtension: 2,       // 相同扩展名
            importDependency: 8,    // 导入依赖关系
            similarSize: 1,         // 相似大小
            sameModule: 6           // 相同模块
        };
    }

    /**
     * 生成批次计划
     * @param {Array} smallFiles - 小文件列表（Token分析结果）
     * @param {Object} config - 配置参数
     * @returns {Promise<Array>} 批次计划列表
     */
    async generateBatches(smallFiles, config = {}) {
        try {
            console.log(`[CombinedFileBatchStrategy] 开始生成批次计划，文件数: ${smallFiles.length}`);

            if (!smallFiles || smallFiles.length === 0) {
                return [];
            }

            // 合并配置
            const finalConfig = { ...this.config, ...config };

            // 预处理文件列表
            const processedFiles = this._preprocessFiles(smallFiles);

            // 智能分组文件
            const fileGroups = this._groupRelatedFiles(processedFiles);

            // 生成批次
            const batches = this._createBatches(fileGroups, finalConfig);

            // 优化批次
            const optimizedBatches = this._optimizeBatches(batches, finalConfig);

            console.log(`[CombinedFileBatchStrategy] 生成 ${optimizedBatches.length} 个批次`);

            return optimizedBatches;

        } catch (error) {
            console.error('[CombinedFileBatchStrategy] 批次生成失败:', error);
            throw error;
        }
    }

    /**
     * 预处理文件列表
     * @private
     */
    _preprocessFiles(files) {
        return files.map((file, index) => ({
            ...file,
            originalIndex: index,
            directory: this._getDirectory(file.path),
            baseName: this._getBaseName(file.path),
            extension: this._getExtension(file.path),
            module: this._getModule(file.path),
            sizeCategory: this._getSizeCategory(
                file.tokenCount?.totalTokens || 
                file.tokenCount?.safeTokenCount || 
                (typeof file.tokenCount === 'number' ? file.tokenCount : 0)
            ),
            dependencies: this._extractDependencies(file),
            priority: this._calculateFilePriority(file)
        }));
    }

    /**
     * 智能分组相关文件
     * @private
     */
    _groupRelatedFiles(files) {
        if (!this.config.enableSmartGrouping) {
            return [files]; // 不分组，返回单一组
        }

        const groups = [];
        const processedFiles = new Set();

        // 按优先级排序
        const sortedFiles = [...files].sort((a, b) => b.priority - a.priority);

        for (const file of sortedFiles) {
            if (processedFiles.has(file.originalIndex)) continue;

            // 创建新组
            const group = [file];
            processedFiles.add(file.originalIndex);

            // 寻找相关文件
            const relatedFiles = this._findRelatedFiles(file, files, processedFiles);
            group.push(...relatedFiles);

            // 标记相关文件为已处理
            relatedFiles.forEach(rf => processedFiles.add(rf.originalIndex));

            groups.push(group);
        }

        // 处理剩余的孤立文件
        const remainingFiles = files.filter(f => !processedFiles.has(f.originalIndex));
        if (remainingFiles.length > 0) {
            groups.push(remainingFiles);
        }

        console.log(`[CombinedFileBatchStrategy] 智能分组: ${groups.length} 个组`);

        return groups;
    }

    /**
     * 寻找相关文件
     * @private
     */
    _findRelatedFiles(targetFile, allFiles, processedFiles) {
        const relatedFiles = [];
        const maxRelatedFiles = this.config.maxFilesPerBatch - 1;

        // 计算每个文件的相关性评分
        const candidates = allFiles
            .filter(f => !processedFiles.has(f.originalIndex) && f.originalIndex !== targetFile.originalIndex)
            .map(file => ({
                file,
                relationshipScore: this._calculateRelationshipScore(targetFile, file)
            }))
            .filter(item => item.relationshipScore > 0)
            .sort((a, b) => b.relationshipScore - a.relationshipScore);

        // 选择最相关的文件
        let currentTokens = targetFile.tokenCount?.totalTokens || 
                           targetFile.tokenCount?.safeTokenCount || 
                           (typeof targetFile.tokenCount === 'number' ? targetFile.tokenCount : 0);
        
        for (const { file, relationshipScore } of candidates) {
            if (relatedFiles.length >= maxRelatedFiles) break;
            const fileTokens = file.tokenCount?.totalTokens || 
                              file.tokenCount?.safeTokenCount || 
                              (typeof file.tokenCount === 'number' ? file.tokenCount : 0);
            if (currentTokens + fileTokens > this.config.maxBatchSize) break;

            relatedFiles.push(file);
            currentTokens += fileTokens;
        }

        return relatedFiles;
    }

    /**
     * 计算文件关系评分
     * @private
     */
    _calculateRelationshipScore(file1, file2) {
        let score = 0;

        // 同目录文件
        if (file1.directory === file2.directory) {
            score += this.relationshipWeights.sameDirectory;
        }

        // 相似文件名
        if (this._isSimilarName(file1.baseName, file2.baseName)) {
            score += this.relationshipWeights.similarName;
        }

        // 相同扩展名
        if (file1.extension === file2.extension) {
            score += this.relationshipWeights.sameExtension;
        }

        // 相同模块
        if (file1.module === file2.module) {
            score += this.relationshipWeights.sameModule;
        }

        // 导入依赖关系
        if (this._hasImportDependency(file1, file2)) {
            score += this.relationshipWeights.importDependency;
        }

        // 相似大小
        const file1Tokens = file1.tokenCount?.totalTokens || 
                           file1.tokenCount?.safeTokenCount || 
                           (typeof file1.tokenCount === 'number' ? file1.tokenCount : 0);
        const file2Tokens = file2.tokenCount?.totalTokens || 
                           file2.tokenCount?.safeTokenCount || 
                           (typeof file2.tokenCount === 'number' ? file2.tokenCount : 0);
        if (this._isSimilarSize(file1Tokens, file2Tokens)) {
            score += this.relationshipWeights.similarSize;
        }

        return score;
    }

    /**
     * 创建批次
     * @private
     */
    _createBatches(fileGroups, config) {
        const batches = [];

        for (const group of fileGroups) {
            const groupBatches = this._createBatchesFromGroup(group, config);
            batches.push(...groupBatches);
        }

        return batches;
    }

    /**
     * 从文件组创建批次
     * @private
     */
    _createBatchesFromGroup(files, config) {
        const batches = [];
        let currentBatch = [];
        let currentTokenCount = 0;

        // 按Token数排序（小文件优先）
        const sortedFiles = [...files].sort((a, b) => {
            const aTokens = a.tokenCount?.totalTokens || 
                          a.tokenCount?.safeTokenCount || 
                          (typeof a.tokenCount === 'number' ? a.tokenCount : 0);
            const bTokens = b.tokenCount?.totalTokens || 
                          b.tokenCount?.safeTokenCount || 
                          (typeof b.tokenCount === 'number' ? b.tokenCount : 0);
            return aTokens - bTokens;
        });

        for (const file of sortedFiles) {
            // 检查是否可以添加到当前批次
            const fileTokens = file.tokenCount?.totalTokens || 
                             file.tokenCount?.safeTokenCount || 
                             (typeof file.tokenCount === 'number' ? file.tokenCount : 0);
            const wouldExceedSize = currentTokenCount + fileTokens > config.maxBatchSize;
            const wouldExceedCount = currentBatch.length >= config.maxFilesPerBatch;
            const shouldCreateNewBatch = wouldExceedSize || wouldExceedCount;

            if (shouldCreateNewBatch && currentBatch.length > 0) {
                // 创建当前批次
                batches.push(this._createBatchFromFiles(currentBatch, batches.length + 1));
                
                // 开始新批次
                currentBatch = [file];
                currentTokenCount = fileTokens;
            } else {
                // 添加到当前批次
                currentBatch.push(file);
                currentTokenCount += fileTokens;
            }
        }

        // 处理最后一个批次
        if (currentBatch.length > 0) {
            batches.push(this._createBatchFromFiles(currentBatch, batches.length + 1));
        }

        return batches;
    }

    /**
     * 从文件列表创建批次对象
     * @private
     */
    _createBatchFromFiles(files, batchIndex) {
        const totalTokens = files.reduce((sum, file) => {
            // 正确提取tokenCount对象中的实际token数量
            const actualTokens = file.tokenCount?.totalTokens || 
                               file.tokenCount?.safeTokenCount || 
                               (typeof file.tokenCount === 'number' ? file.tokenCount : 0);
            return sum + actualTokens;
        }, 0);
        const fileNames = files.map(f => f.path.split('/').pop()).join(', ');

        // 转换为统一的BatchFile格式
        const batchFiles = files.map(f => ({
            path: f.path,
            tokenCount: BatchResultFactory._extractTokenCount(f.tokenCount), // 统一提取Token数量
            size: f.size || 0,
            language: f.language || 'javascript',
            originalIndex: f.originalIndex,
            priority: f.priority
        }));

        const batchId = `combined_batch_${batchIndex}`;
        const efficiency = this._calculateBatchEfficiency(totalTokens, files.length);

        // 使用BatchResultFactory创建统一格式的批次结果
        const batchResult = BatchResultFactory.createCombinedBatch(
            batchId,
            batchFiles,
            totalTokens,
            {
                description: `组合批次包含${files.length}个文件: ${fileNames}`,
                efficiency: efficiency
            }
        );

        // 添加额外的处理提示和元数据（保留原有功能）
        batchResult.metadata.processingHints = {
            analysisDepth: 'comprehensive',
            contextAware: true,
            crossFileReferences: true,
            preserveRelationships: true,
            avgTokensPerFile: Math.round(totalTokens / files.length),
            directories: [...new Set(files.map(f => f.directory || 'root'))],
            extensions: [...new Set(files.map(f => f.extension || f.path.split('.').pop()))],
            modules: [...new Set(files.map(f => f.module || 'unknown'))]
        };

        console.log(`[CombinedFileBatchStrategy] 创建统一格式批次: ${batchId} (${files.length}个文件, ${totalTokens}tokens)`);
        return batchResult;
    }

    /**
     * 优化批次
     * @private
     */
    _optimizeBatches(batches, config) {
        let optimizedBatches = [...batches];

        // 合并小批次
        optimizedBatches = this._mergeSmallBatches(optimizedBatches, config);

        // 平衡批次大小
        optimizedBatches = this._balanceBatchSizes(optimizedBatches, config);

        // 重新计算索引
        optimizedBatches.forEach((batch, index) => {
            batch.batchId = `batch_${index + 1}`;
            batch.batchIndex = index + 1;
            batch.totalBatches = optimizedBatches.length;
        });

        return optimizedBatches;
    }

    /**
     * 合并过小的批次
     * @private
     */
    _mergeSmallBatches(batches, config) {
        const optimized = [];
        let i = 0;

        while (i < batches.length) {
            const currentBatch = batches[i];

            // 如果当前批次太小，尝试与下一个批次合并
            if (currentBatch.estimatedTokens < config.minBatchSize && i + 1 < batches.length) {
                const nextBatch = batches[i + 1];
                const combinedTokens = currentBatch.estimatedTokens + nextBatch.estimatedTokens;
                const combinedFiles = currentBatch.files.length + nextBatch.files.length;

                // 如果合并后不超过限制，则合并
                if (combinedTokens <= config.maxBatchSize && combinedFiles <= config.maxFilesPerBatch) {
                    const mergedBatch = this._mergeBatches(currentBatch, nextBatch);
                    optimized.push(mergedBatch);
                    i += 2; // 跳过下一个批次
                    continue;
                }
            }

            optimized.push(currentBatch);
            i++;
        }

        return optimized;
    }

    /**
     * 平衡批次大小
     * @private
     */
    _balanceBatchSizes(batches, config) {
        // 简单实现：如果有批次过大，尝试移动一些文件到较小的批次
        const optimized = [...batches];

        for (let i = 0; i < optimized.length; i++) {
            const batch = optimized[i];
            
            if (batch.estimatedTokens > config.maxBatchSize) {
                // 尝试移动一些小文件到其他批次
                this._redistributeFiles(optimized, i, config);
            }
        }

        return optimized;
    }

    /**
     * 重新分配文件
     * @private
     */
    _redistributeFiles(batches, overflowBatchIndex, config) {
        const overflowBatch = batches[overflowBatchIndex];
        
        // 按Token数排序，移动最小的文件
        const sortedFiles = [...overflowBatch.files].sort((a, b) => a.tokenCount - b.tokenCount);
        
        for (const file of sortedFiles) {
            if (overflowBatch.estimatedTokens <= config.targetBatchSize) break;

            // 寻找可以容纳这个文件的批次
            for (let j = 0; j < batches.length; j++) {
                if (j === overflowBatchIndex) continue;

                const targetBatch = batches[j];
                const wouldFit = targetBatch.estimatedTokens + file.tokenCount <= config.targetBatchSize;
                const hasSpace = targetBatch.files.length < config.maxFilesPerBatch;

                if (wouldFit && hasSpace) {
                    // 移动文件
                    this._moveFile(overflowBatch, targetBatch, file);
                    break;
                }
            }
        }
    }

    /**
     * 移动文件到另一个批次
     * @private
     */
    _moveFile(fromBatch, toBatch, file) {
        // 从源批次移除
        const fileIndex = fromBatch.files.findIndex(f => f.originalIndex === file.originalIndex);
        if (fileIndex !== -1) {
            fromBatch.files.splice(fileIndex, 1);
            fromBatch.estimatedTokens -= file.tokenCount;
            fromBatch.fileCount = fromBatch.files.length;
        }

        // 添加到目标批次
        toBatch.files.push(file);
        toBatch.estimatedTokens += file.tokenCount;
        toBatch.fileCount = toBatch.files.length;

        // 更新描述
        fromBatch.description = this._generateBatchDescription(fromBatch);
        toBatch.description = this._generateBatchDescription(toBatch);
    }

    /**
     * 合并两个批次
     * @private
     */
    _mergeBatches(batch1, batch2) {
        return {
            type: 'combined_files',
            batchId: batch1.batchId,
            files: [...batch1.files, ...batch2.files],
            estimatedTokens: batch1.estimatedTokens + batch2.estimatedTokens,
            fileCount: batch1.fileCount + batch2.fileCount,
            strategy: 'combined_merged',
            efficiency: this._calculateBatchEfficiency(
                batch1.estimatedTokens + batch2.estimatedTokens,
                batch1.fileCount + batch2.fileCount
            ),
            description: `合并批次 - ${batch1.fileCount + batch2.fileCount} 个文件`,
            metadata: {
                avgTokensPerFile: Math.round((batch1.estimatedTokens + batch2.estimatedTokens) / (batch1.fileCount + batch2.fileCount)),
                directories: [...new Set([...batch1.metadata.directories, ...batch2.metadata.directories])],
                extensions: [...new Set([...batch1.metadata.extensions, ...batch2.metadata.extensions])],
                modules: [...new Set([...batch1.metadata.modules, ...batch2.metadata.modules])]
            },
            processingHints: {
                analysisDepth: 'comprehensive',
                contextAware: true,
                crossFileReferences: true,
                preserveRelationships: true
            }
        };
    }

    /**
     * 辅助方法
     */

    _getDirectory(filePath) {
        const parts = filePath.split('/');
        return parts.length > 1 ? parts[parts.length - 2] : '';
    }

    _getBaseName(filePath) {
        const fileName = filePath.split('/').pop();
        return fileName.split('.')[0];
    }

    _getExtension(filePath) {
        const fileName = filePath.split('/').pop();
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    _getModule(filePath) {
        const parts = filePath.split('/');
        return parts.length > 2 ? parts[parts.length - 3] : '';
    }

    _getSizeCategory(tokenCount) {
        if (tokenCount < 2000) return 'tiny';
        if (tokenCount < 5000) return 'small';
        if (tokenCount < 10000) return 'medium';
        return 'large';
    }

    _extractDependencies(file) {
        // 简单实现，可以基于代码结构分析结果扩展
        return file.codeStructure?.structure?.dependencies || { internal: [], external: [] };
    }

    _calculateFilePriority(file) {
        let priority = 0;
        
        // 基于文件类型
        if (file.path.includes('index.')) priority += 5;
        if (file.path.includes('main.')) priority += 4;
        if (file.path.includes('config')) priority += 3;
        if (file.path.includes('test')) priority += 1;
        
        // 基于Token数量（较大的文件优先级稍高）
        priority += Math.min(file.tokenCount / 1000, 5);
        
        return priority;
    }

    _isSimilarName(name1, name2) {
        const similarity = this._calculateStringSimilarity(name1, name2);
        return similarity > 0.6;
    }

    _calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this._levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    _levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    _hasImportDependency(file1, file2) {
        const deps1 = file1.dependencies;
        const deps2 = file2.dependencies;
        
        if (!deps1 || !deps2) return false;
        
        // 检查是否有相互引用
        const file1Name = file1.baseName;
        const file2Name = file2.baseName;
        
        return deps1.internal.some(dep => dep.includes(file2Name)) ||
               deps2.internal.some(dep => dep.includes(file1Name));
    }

    _isSimilarSize(size1, size2) {
        const ratio = Math.min(size1, size2) / Math.max(size1, size2);
        return ratio > 0.7;
    }

    _calculateBatchEfficiency(totalTokens, fileCount) {
        const targetEfficiency = this.config.targetBatchSize;
        const efficiency = (totalTokens / targetEfficiency) * 100;
        return Math.min(Math.round(efficiency), 100);
    }

    _generateBatchDescription(batch) {
        const fileNames = batch.files.map(f => f.path.split('/').pop()).join(', ');
        return `合并批次 - ${batch.fileCount} 个文件 (${fileNames})`;
    }

    /**
     * 获取策略状态
     */
    getStrategyStatus() {
        return {
            name: 'CombinedFileBatchStrategy',
            version: '1.0.0',
            config: this.config,
            targetFiles: '小文件 (<15K tokens)',
            isReady: true
        };
    }
}

export default CombinedFileBatchStrategy;