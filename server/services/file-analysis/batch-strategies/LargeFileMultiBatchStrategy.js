/**
 * 大文件多批次策略 - 智能文件分割处理
 * 
 * 核心功能：
 * - 将大文件（>20K tokens）智能分割成多个批次
 * - 基于函数边界检测，避免破坏代码逻辑完整性
 * - 保持代码上下文和依赖关系
 * - 生成有序的子任务ID（task_X_1, task_X_2等）
 * 
 * 设计理念：
 * - 智能分割：基于代码结构的语义边界分割
 * - 上下文保持：确保每个切片都有足够的上下文信息
 * - 逻辑完整性：避免破坏函数、类等代码单元
 * - 可重组性：分割后的文档能够重新组合成完整理解
 */

import FunctionBoundaryDetector from '../token-analysis/FunctionBoundaryDetector.js';

export class LargeFileMultiBatchStrategy {
    constructor(config = {}) {
        this.config = {
            minTokenSize: 20000,        // 最小Token大小
            targetChunkSize: 18000,     // 目标切片大小
            maxChunkSize: 22000,        // 最大切片大小
            minChunkSize: 8000,         // 最小切片大小
            maxChunksPerFile: 10,       // 每个文件最多切片数
            overlapSize: 500,           // 切片重叠Token数
            preserveContext: true,      // 保持上下文
            smartSplitting: true,       // 启用智能分割
            ...config
        };

        // 初始化边界检测器
        this.boundaryDetector = new FunctionBoundaryDetector({
            minChunkSize: this.config.minChunkSize,
            maxChunkSize: this.config.maxChunkSize,
            overlapSize: this.config.overlapSize
        });

        // 分析质量权重
        this.qualityWeights = {
            structuralIntegrity: 0.3,   // 结构完整性
            contextPreservation: 0.25,  // 上下文保持
            sizeBestance: 0.2,          // 大小平衡
            dependencyHandling: 0.15,   // 依赖处理
            readability: 0.1            // 可读性
        };
    }

    /**
     * 生成批次计划
     * @param {Array} largeFiles - 大文件列表（Token分析结果）
     * @param {Object} config - 配置参数
     * @param {string} projectPath - 项目路径
     * @returns {Promise<Array>} 批次计划列表
     */
    async generateBatches(largeFiles, config = {}, projectPath = '') {
        try {
            console.log(`[LargeFileMultiBatchStrategy] 开始生成批次计划，大文件数: ${largeFiles.length}`);

            if (!largeFiles || largeFiles.length === 0) {
                return [];
            }

            // 合并配置
            const finalConfig = { ...this.config, ...config };

            // 验证文件大小
            const validFiles = this._validateLargeFiles(largeFiles, finalConfig);

            // 为每个大文件生成多批次分割计划
            const allBatches = [];
            
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                console.log(`[LargeFileMultiBatchStrategy] 处理大文件: ${file.path} (${file.tokenCount} tokens)`);
                
                const fileBatches = await this._processLargeFile(file, i + 1, finalConfig, projectPath);
                allBatches.push(...fileBatches);
            }

            // 优化批次安排
            const optimizedBatches = this._optimizeBatchArrangement(allBatches, finalConfig);

            console.log(`[LargeFileMultiBatchStrategy] 生成 ${optimizedBatches.length} 个分割批次`);

            return optimizedBatches;

        } catch (error) {
            console.error('[LargeFileMultiBatchStrategy] 批次生成失败:', error);
            throw error;
        }
    }

    /**
     * 验证大文件
     * @private
     */
    _validateLargeFiles(files, config) {
        const validFiles = [];
        const rejectedFiles = [];

        for (const file of files) {
            if (file.tokenCount >= config.minTokenSize) {
                validFiles.push(file);
            } else {
                rejectedFiles.push({
                    file,
                    reason: 'too_small'
                });
            }
        }

        if (rejectedFiles.length > 0) {
            console.warn(`[LargeFileMultiBatchStrategy] ${rejectedFiles.length} 个文件不需要分割处理:`, 
                        rejectedFiles.map(r => `${r.file.path} (${r.file.tokenCount} tokens)`));
        }

        return validFiles;
    }

    /**
     * 处理单个大文件
     * @private
     */
    async _processLargeFile(file, fileIndex, config, projectPath) {
        try {
            // 读取文件内容
            const fileContent = await this._readFileContent(file.path, projectPath);
            
            // 检测最佳分割点
            const boundaryResult = await this.boundaryDetector.detectBoundaries(
                file.path,
                fileContent,
                file.codeStructure,
                config.targetChunkSize
            );

            if (!boundaryResult.success) {
                console.warn(`[LargeFileMultiBatchStrategy] 边界检测失败: ${file.path}`);
                return this._createFallbackBatches(file, fileContent, fileIndex, config);
            }

            // 基于检测结果创建批次
            const batches = this._createBatchesFromChunkPlan(
                file,
                boundaryResult.chunkPlan,
                fileIndex,
                config
            );

            return batches;

        } catch (error) {
            console.error(`[LargeFileMultiBatchStrategy] 处理文件失败: ${file.path}`, error);
            return this._createFallbackBatches(file, '', fileIndex, config);
        }
    }

    /**
     * 读取文件内容
     * @private
     */
    async _readFileContent(filePath, projectPath) {
        try {
            // 这里应该从文件系统读取，简化实现
            const fs = await import('fs/promises');
            const fullPath = projectPath ? `${projectPath}/${filePath}` : filePath;
            return await fs.readFile(fullPath, 'utf8');
        } catch (error) {
            console.warn(`[LargeFileMultiBatchStrategy] 读取文件内容失败: ${filePath}`);
            return ''; // 返回空内容，后续会创建fallback批次
        }
    }

    /**
     * 基于切片计划创建批次
     * @private
     */
    _createBatchesFromChunkPlan(file, chunkPlan, fileIndex, config) {
        const batches = [];
        const chunks = chunkPlan.chunks;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const batch = this._createMultiBatch(file, chunk, fileIndex, i + 1, chunks.length, config);
            batches.push(batch);
        }

        return batches;
    }

    /**
     * 创建多批次子任务
     * @private
     */
    _createMultiBatch(file, chunk, fileIndex, chunkIndex, totalChunks, config) {
        const batchId = `large_file_${fileIndex}_${chunkIndex}`;
        
        const batch = {
            type: 'large_file_chunk',
            batchId,
            parentFileInfo: {
                path: file.path,
                totalTokens: file.tokenCount,
                originalIndex: file.originalIndex || fileIndex - 1
            },
            chunkInfo: {
                chunkIndex,
                totalChunks,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                estimatedTokens: chunk.estimatedTokens,
                content: chunk.content,
                type: chunk.type || 'code_chunk'
            },
            estimatedTokens: chunk.estimatedTokens,
            fileCount: 1,
            strategy: 'large_file_split',
            splitQuality: this._assessSplitQuality(chunk),
            description: this._generateChunkDescription(file, chunk, chunkIndex, totalChunks),
            metadata: this._generateChunkMetadata(file, chunk),
            processingHints: this._generateChunkProcessingHints(file, chunk, chunkIndex, totalChunks),
            contextInfo: this._generateChunkContextInfo(file, chunk, chunkIndex, totalChunks),
            reconstructionInfo: this._generateReconstructionInfo(chunk, chunkIndex, totalChunks)
        };

        return batch;
    }

    /**
     * 评估分割质量
     * @private
     */
    _assessSplitQuality(chunk) {
        let quality = 0;

        // 结构完整性评分
        const structuralScore = this._assessStructuralIntegrity(chunk);
        quality += structuralScore * this.qualityWeights.structuralIntegrity;

        // 上下文保持评分
        const contextScore = this._assessContextPreservation(chunk);
        quality += contextScore * this.qualityWeights.contextPreservation;

        // 大小平衡评分
        const sizeScore = this._assessSizeBalance(chunk);
        quality += sizeScore * this.qualityWeights.sizeBestance;

        // 依赖处理评分
        const dependencyScore = this._assessDependencyHandling(chunk);
        quality += dependencyScore * this.qualityWeights.dependencyHandling;

        // 可读性评分
        const readabilityScore = this._assessReadability(chunk);
        quality += readabilityScore * this.qualityWeights.readability;

        return Math.round(quality);
    }

    /**
     * 评估结构完整性
     * @private
     */
    _assessStructuralIntegrity(chunk) {
        let score = 50; // 基础分数

        // 检查是否包含完整的代码块
        if (chunk.boundaries && chunk.boundaries.length > 0) {
            score += 20;
        }

        // 检查切片类型
        switch (chunk.type) {
            case 'function-focused':
                score += 20;
                break;
            case 'class-focused':
                score += 25;
                break;
            case 'module-focused':
                score += 15;
                break;
            case 'interface-focused':
                score += 18;
                break;
            default:
                score += 5;
        }

        return Math.min(score, 100);
    }

    /**
     * 评估上下文保持
     * @private
     */
    _assessContextPreservation(chunk) {
        let score = 60; // 基础分数

        // 检查是否有导入语句
        if (chunk.content && chunk.content.includes('import')) {
            score += 15;
        }

        // 检查是否有注释
        if (chunk.content && (chunk.content.includes('/*') || chunk.content.includes('//'))) {
            score += 10;
        }

        // 检查边界质量
        if (chunk.boundaries && chunk.boundaries.length > 0) {
            const highPriorityBoundaries = chunk.boundaries.filter(b => b.priority >= 7);
            score += Math.min(highPriorityBoundaries.length * 5, 15);
        }

        return Math.min(score, 100);
    }

    /**
     * 评估大小平衡
     * @private
     */
    _assessSizeBalance(chunk) {
        const idealSize = this.config.targetChunkSize;
        const actualSize = chunk.estimatedTokens;
        
        // 计算与理想大小的接近程度
        const ratio = Math.min(actualSize, idealSize) / Math.max(actualSize, idealSize);
        return Math.round(ratio * 100);
    }

    /**
     * 评估依赖处理
     * @private
     */
    _assessDependencyHandling(chunk) {
        let score = 70; // 基础分数

        // 检查是否处理了导入依赖
        if (chunk.content && chunk.content.includes('// Required imports')) {
            score += 20;
        }

        // 检查内容完整性
        if (chunk.startLine && chunk.endLine && chunk.endLine > chunk.startLine) {
            score += 10;
        }

        return Math.min(score, 100);
    }

    /**
     * 评估可读性
     * @private
     */
    _assessReadability(chunk) {
        let score = 75; // 基础分数

        // 检查是否有描述性注释
        if (chunk.content && chunk.content.includes('// Chunk')) {
            score += 15;
        }

        // 检查行数合理性
        if (chunk.startLine && chunk.endLine) {
            const lineCount = chunk.endLine - chunk.startLine;
            if (lineCount > 10 && lineCount < 500) {
                score += 10;
            }
        }

        return Math.min(score, 100);
    }

    /**
     * 生成切片描述
     * @private
     */
    _generateChunkDescription(file, chunk, chunkIndex, totalChunks) {
        const fileName = file.path.split('/').pop();
        const tokenInfo = `${chunk.estimatedTokens?.toLocaleString() || '未知'} tokens`;
        const lineInfo = chunk.startLine && chunk.endLine ? 
                        `行 ${chunk.startLine}-${chunk.endLine}` : '未指定行范围';
        
        let description = `大文件分割 ${chunkIndex}/${totalChunks} - ${fileName} (${tokenInfo}, ${lineInfo})`;
        
        if (chunk.type && chunk.type !== 'code_chunk') {
            const typeNames = {
                'function-focused': '函数重点',
                'class-focused': '类重点',
                'module-focused': '模块重点',
                'interface-focused': '接口重点',
                'mixed': '混合内容'
            };
            description += ` - ${typeNames[chunk.type] || chunk.type}`;
        }

        return description;
    }

    /**
     * 生成切片元数据
     * @private
     */
    _generateChunkMetadata(file, chunk) {
        const pathParts = file.path.split('/');
        
        return {
            parentFile: {
                fileName: pathParts.pop(),
                directory: pathParts.join('/'),
                extension: this._getFileExtension(file.path),
                language: this._detectLanguage(file.path),
                totalTokens: file.tokenCount
            },
            chunk: {
                hasImports: chunk.content ? chunk.content.includes('import') : false,
                hasExports: chunk.content ? chunk.content.includes('export') : false,
                hasComments: chunk.content ? (chunk.content.includes('//') || chunk.content.includes('/*')) : false,
                boundaryCount: chunk.boundaries ? chunk.boundaries.length : 0,
                chunkType: chunk.type || 'unknown'
            }
        };
    }

    /**
     * 生成切片处理提示
     * @private
     */
    _generateChunkProcessingHints(file, chunk, chunkIndex, totalChunks) {
        const hints = {
            isFirstChunk: chunkIndex === 1,
            isLastChunk: chunkIndex === totalChunks,
            analysisDepth: this._determineAnalysisDepth(chunk),
            focusAreas: this._identifyChunkFocusAreas(chunk),
            specialInstructions: this._generateSpecialInstructions(chunk, chunkIndex, totalChunks),
            contextAware: this.config.preserveContext,
            requiresIntegration: totalChunks > 1
        };

        return hints;
    }

    /**
     * 确定分析深度
     * @private
     */
    _determineAnalysisDepth(chunk) {
        if (chunk.type === 'class-focused') return 'detailed';
        if (chunk.type === 'function-focused') return 'comprehensive';
        if (chunk.type === 'interface-focused') return 'comprehensive';
        if (chunk.estimatedTokens > 15000) return 'detailed';
        return 'comprehensive';
    }

    /**
     * 识别切片重点
     * @private
     */
    _identifyChunkFocusAreas(chunk) {
        const focusAreas = [];

        if (chunk.type === 'class-focused') {
            focusAreas.push('class_structure', 'method_analysis', 'inheritance_patterns');
        } else if (chunk.type === 'function-focused') {
            focusAreas.push('function_logic', 'parameter_analysis', 'return_patterns');
        } else if (chunk.type === 'interface-focused') {
            focusAreas.push('interface_design', 'type_definitions', 'contract_analysis');
        } else {
            focusAreas.push('code_structure', 'logic_flow', 'dependencies');
        }

        return focusAreas;
    }

    /**
     * 生成特殊指令
     * @private
     */
    _generateSpecialInstructions(chunk, chunkIndex, totalChunks) {
        const instructions = [];

        if (chunkIndex === 1) {
            instructions.push('这是文件的第一部分，请特别关注整体架构和导入依赖');
        }

        if (chunkIndex === totalChunks) {
            instructions.push('这是文件的最后部分，请特别关注导出和总结');
        }

        if (totalChunks > 3) {
            instructions.push('该文件被分割为多个部分，请在分析时考虑与其他部分的联系');
        }

        if (chunk.splitQuality && chunk.splitQuality < 70) {
            instructions.push('该切片的分割质量可能不够理想，请额外关注上下文补充');
        }

        return instructions;
    }

    /**
     * 生成切片上下文信息
     * @private
     */
    _generateChunkContextInfo(file, chunk, chunkIndex, totalChunks) {
        return {
            fileContext: {
                totalChunks,
                currentChunk: chunkIndex,
                fileImportance: file.codeStructure?.structure?.importanceScore || 50,
                filePath: file.path
            },
            chunkContext: {
                precedingChunks: chunkIndex - 1,
                followingChunks: totalChunks - chunkIndex,
                relativePosition: chunkIndex / totalChunks,
                estimatedComplexity: this._estimateChunkComplexity(chunk)
            },
            integrationHints: {
                needsContextFromPrevious: chunkIndex > 1,
                providesContextForNext: chunkIndex < totalChunks,
                standaloneAnalysis: false
            }
        };
    }

    /**
     * 生成重建信息
     * @private
     */
    _generateReconstructionInfo(chunk, chunkIndex, totalChunks) {
        return {
            sequenceInfo: {
                position: chunkIndex,
                total: totalChunks,
                isPartial: true
            },
            mergingHints: {
                requiresOrdering: true,
                hasOverlap: chunk.content && chunk.content.includes('// Required imports'),
                integrationPoints: this._identifyIntegrationPoints(chunk)
            },
            validationInfo: {
                expectedLineRange: chunk.startLine && chunk.endLine ? 
                                 `${chunk.startLine}-${chunk.endLine}` : 'unknown',
                estimatedTokens: chunk.estimatedTokens,
                qualityScore: chunk.splitQuality || 0
            }
        };
    }

    /**
     * 识别整合点
     * @private
     */
    _identifyIntegrationPoints(chunk) {
        const integrationPoints = [];

        if (chunk.boundaries && chunk.boundaries.length > 0) {
            chunk.boundaries.forEach(boundary => {
                integrationPoints.push({
                    type: boundary.type,
                    line: boundary.lineNumber,
                    priority: boundary.priority
                });
            });
        }

        return integrationPoints;
    }

    /**
     * 估算切片复杂度
     * @private
     */
    _estimateChunkComplexity(chunk) {
        let complexity = 1;

        if (chunk.estimatedTokens) {
            complexity += Math.min(chunk.estimatedTokens / 5000, 5);
        }

        if (chunk.boundaries) {
            complexity += chunk.boundaries.length * 0.5;
        }

        if (chunk.type === 'class-focused') complexity += 2;
        if (chunk.type === 'function-focused') complexity += 1;
        if (chunk.type === 'mixed') complexity += 1.5;

        return Math.min(complexity, 10);
    }

    /**
     * 创建备用批次（当智能分割失败时）
     * @private
     */
    _createFallbackBatches(file, content, fileIndex, config) {
        console.warn(`[LargeFileMultiBatchStrategy] 为 ${file.path} 创建备用分割`);

        const batches = [];
        const estimatedChunks = Math.ceil(file.tokenCount / config.targetChunkSize);
        const linesPerChunk = content ? Math.ceil(content.split('\n').length / estimatedChunks) : 100;

        for (let i = 0; i < estimatedChunks; i++) {
            const chunkIndex = i + 1;
            const startLine = i * linesPerChunk + 1;
            const endLine = Math.min((i + 1) * linesPerChunk, content ? content.split('\n').length : 1000);
            
            const estimatedTokens = Math.min(
                file.tokenCount - (i * config.targetChunkSize),
                config.targetChunkSize
            );

            const fallbackChunk = {
                chunkIndex,
                startLine,
                endLine,
                estimatedTokens,
                content: content ? content.split('\n').slice(startLine - 1, endLine).join('\n') : `// Fallback chunk ${chunkIndex}`,
                type: 'fallback'
            };

            const batch = this._createMultiBatch(file, fallbackChunk, fileIndex, chunkIndex, estimatedChunks, config);
            batch.isFallback = true;
            batch.splitQuality = 30; // 低质量分割
            batches.push(batch);
        }

        return batches;
    }

    /**
     * 优化批次安排
     * @private
     */
    _optimizeBatchArrangement(batches, config) {
        // 按文件和切片索引排序
        const sorted = batches.sort((a, b) => {
            const aFile = a.parentFileInfo?.originalIndex || 0;
            const bFile = b.parentFileInfo?.originalIndex || 0;
            
            if (aFile !== bFile) return aFile - bFile;
            
            const aChunk = a.chunkInfo?.chunkIndex || 0;
            const bChunk = b.chunkInfo?.chunkIndex || 0;
            return aChunk - bChunk;
        });

        // 重新分配批次ID和索引
        sorted.forEach((batch, index) => {
            batch.batchIndex = index + 1;
            batch.totalBatches = batches.length;
            batch.processingOrder = index + 1;
        });

        return sorted;
    }

    /**
     * 辅助方法
     */

    _getFileExtension(path) {
        const fileName = path.split('/').pop();
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    _detectLanguage(path) {
        const ext = this._getFileExtension(path).toLowerCase();
        const extMap = {
            js: 'javascript', jsx: 'javascript', mjs: 'javascript',
            ts: 'typescript', tsx: 'typescript',
            py: 'python', java: 'java', go: 'go', rs: 'rust', cs: 'c#'
        };
        return extMap[ext] || 'unknown';
    }

    /**
     * 获取策略状态
     */
    getStrategyStatus() {
        return {
            name: 'LargeFileMultiBatchStrategy',
            version: '1.0.0',
            config: this.config,
            targetFiles: '大文件 (>20K tokens)',
            boundaryDetector: this.boundaryDetector?.getDetectorStatus() || null,
            isReady: !!this.boundaryDetector
        };
    }
}

export default LargeFileMultiBatchStrategy;