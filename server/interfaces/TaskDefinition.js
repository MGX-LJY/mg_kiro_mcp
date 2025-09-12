/**
 * TaskDefinition 统一任务定义接口
 * 
 * 解决任务定义、任务上下文、MCP工具参数格式不统一的问题
 * 统一所有任务相关的数据结构，提供一致的任务管理体验
 * 
 * @version 1.0.0
 * @date 2025-09-12
 */

/**
 * 任务状态枚举
 * @typedef {'pending'|'in_progress'|'completed'|'failed'|'cancelled'} TaskStatus
 */

/**
 * 任务类型枚举
 * @typedef {'file_batch'|'single_file'|'large_file_chunk'|'module_integration'|'module_relations'|'architecture_docs'} TaskType
 */

/**
 * 批次策略枚举
 * @typedef {'combined'|'single'|'largeMulti'|'module'|'architecture'} TaskStrategy
 */

/**
 * 统一任务定义接口
 * @typedef {Object} TaskDefinition
 * @property {string} id - 任务唯一标识
 * @property {TaskType} type - 任务类型
 * @property {TaskStrategy} strategy - 处理策略
 * @property {TaskStatus} status - 任务状态
 * @property {string[]} files - 相关文件路径列表
 * @property {number} estimatedTokens - 预估Token数量
 * @property {TaskMetadata} metadata - 任务元数据
 * @property {ProcessingHints} [processingHints] - 处理提示
 * @property {TaskTiming} [timing] - 时间信息
 */

/**
 * 任务元数据
 * @typedef {Object} TaskMetadata
 * @property {string} batchId - 批次ID
 * @property {TaskStrategy} strategy - 处理策略
 * @property {number} fileCount - 文件数量
 * @property {TaskType} type - 任务类型
 * @property {string} projectPath - 项目路径
 * @property {FileInfo} primaryFile - 主要文件信息
 * @property {ChunkingAdvice} chunkingAdvice - 分片建议
 * @property {Object} [strategySpecific] - 策略特定元数据
 */

/**
 * 文件信息
 * @typedef {Object} FileInfo
 * @property {string} relativePath - 相对路径
 * @property {string} fileName - 文件名
 * @property {number} fileSize - 文件大小（字节）
 * @property {string} language - 编程语言
 * @property {number} estimatedTokens - 估算Token数
 */

/**
 * 分片建议
 * @typedef {Object} ChunkingAdvice
 * @property {boolean} recommended - 是否推荐分片
 * @property {number} [maxTokensPerChunk] - 每片最大Token数
 * @property {string} [strategy] - 分片策略
 * @property {boolean} [enableBoundaryDetection] - 是否启用边界检测
 * @property {boolean} [multiChunkRequired] - 是否需要多片
 * @property {number} [currentChunk] - 当前分片索引（仅大文件分片）
 * @property {number} [totalChunks] - 总分片数（仅大文件分片）
 */

/**
 * 处理提示
 * @typedef {Object} ProcessingHints
 * @property {string} analysisDepth - 分析深度
 * @property {boolean} contextAware - 是否上下文感知
 * @property {boolean} crossFileReferences - 是否包含跨文件引用
 * @property {boolean} preserveRelationships - 是否保持关系
 * @property {string} [focusArea] - 关注领域
 * @property {Array<string>} [specialInstructions] - 特殊指令
 */

/**
 * 任务时间信息
 * @typedef {Object} TaskTiming
 * @property {string} createdAt - 创建时间
 * @property {string} [startedAt] - 开始时间
 * @property {string} [completedAt] - 完成时间
 * @property {number} [estimatedDuration] - 预估耗时（毫秒）
 * @property {number} [actualDuration] - 实际耗时（毫秒）
 */

/**
 * 统一任务上下文接口
 * @typedef {Object} TaskContext
 * @property {string} taskId - 任务ID
 * @property {string} projectPath - 项目路径
 * @property {TaskStatus} status - 任务状态
 * @property {FileInfo} currentFile - 当前处理文件信息
 * @property {number} progress - 进度百分比 (0-100)
 * @property {TaskContextMetadata} metadata - 上下文元数据
 * @property {string} updatedAt - 更新时间
 */

/**
 * 任务上下文元数据
 * @typedef {Object} TaskContextMetadata
 * @property {number} stepNumber - 步骤编号
 * @property {string} stepName - 步骤名称
 * @property {number} fileIndex - 文件索引
 * @property {number} totalFiles - 总文件数
 * @property {Object} [chunkInfo] - 分片信息（仅大文件）
 * @property {ProcessingHints} processingHints - 处理提示
 */

/**
 * MCP工具参数统一接口
 * @typedef {Object} MCPToolParams
 * @property {string} projectPath - 项目路径
 * @property {Object} [options] - 可选参数
 * @property {ToolMetadata} [metadata] - 工具元数据
 */

/**
 * 工具元数据
 * @typedef {Object} ToolMetadata
 * @property {string} toolName - 工具名称
 * @property {string} version - 工具版本
 * @property {string} invokedAt - 调用时间
 * @property {string} [requestId] - 请求ID
 */

/**
 * TaskDefinition工厂类
 */
export class TaskDefinitionFactory {
    /**
     * 创建标准任务定义
     * @param {string} id - 任务ID
     * @param {TaskType} type - 任务类型
     * @param {TaskStrategy} strategy - 处理策略
     * @param {string[]} files - 文件列表
     * @param {number} estimatedTokens - 估算Token数
     * @param {Object} options - 可选参数
     * @returns {TaskDefinition}
     */
    static createTaskDefinition(id, type, strategy, files, estimatedTokens, options = {}) {
        const primaryFile = this._extractPrimaryFileInfo(files[0], options.fileInfo);
        
        const taskDefinition = {
            id,
            type,
            strategy,
            status: 'pending',
            files,
            estimatedTokens: Math.max(0, estimatedTokens || 0),
            metadata: {
                batchId: options.batchId || id,
                strategy,
                fileCount: files.length,
                type,
                projectPath: options.projectPath || 'unknown',
                primaryFile,
                chunkingAdvice: options.chunkingAdvice || {
                    recommended: false,
                    strategy: 'default'
                },
                strategySpecific: options.strategySpecific || {}
            }
        };

        // 添加处理提示
        if (options.processingHints) {
            taskDefinition.processingHints = {
                analysisDepth: 'comprehensive',
                contextAware: true,
                crossFileReferences: false,
                preserveRelationships: true,
                ...options.processingHints
            };
        }

        // 添加时间信息
        const now = new Date().toISOString();
        taskDefinition.timing = {
            createdAt: now,
            estimatedDuration: options.estimatedDuration || null
        };

        return taskDefinition;
    }

    /**
     * 创建文件批次任务
     * @param {string} id - 任务ID
     * @param {string[]} files - 文件列表
     * @param {number} estimatedTokens - 估算Token数
     * @param {Object} options - 可选参数
     * @returns {TaskDefinition}
     */
    static createFileBatchTask(id, files, estimatedTokens, options = {}) {
        return this.createTaskDefinition(
            id,
            'file_batch',
            'combined',
            files,
            estimatedTokens,
            {
                ...options,
                processingHints: {
                    analysisDepth: 'comprehensive',
                    contextAware: true,
                    crossFileReferences: true,
                    preserveRelationships: true,
                    ...options.processingHints
                }
            }
        );
    }

    /**
     * 创建单文件任务
     * @param {string} id - 任务ID
     * @param {string} file - 文件路径
     * @param {number} estimatedTokens - 估算Token数
     * @param {Object} options - 可选参数
     * @returns {TaskDefinition}
     */
    static createSingleFileTask(id, file, estimatedTokens, options = {}) {
        return this.createTaskDefinition(
            id,
            'single_file',
            'single',
            [file],
            estimatedTokens,
            {
                ...options,
                processingHints: {
                    analysisDepth: 'detailed',
                    contextAware: true,
                    crossFileReferences: false,
                    preserveRelationships: false,
                    ...options.processingHints
                }
            }
        );
    }

    /**
     * 创建大文件分片任务
     * @param {string} id - 任务ID
     * @param {string} file - 文件路径
     * @param {number} estimatedTokens - 估算Token数
     * @param {Object} chunkInfo - 分片信息
     * @param {Object} options - 可选参数
     * @returns {TaskDefinition}
     */
    static createLargeFileChunkTask(id, file, estimatedTokens, chunkInfo, options = {}) {
        return this.createTaskDefinition(
            id,
            'large_file_chunk',
            'largeMulti',
            [file],
            estimatedTokens,
            {
                ...options,
                chunkingAdvice: {
                    recommended: true,
                    maxTokensPerChunk: 1200,
                    strategy: 'function_boundary',
                    enableBoundaryDetection: true,
                    multiChunkRequired: true,
                    currentChunk: chunkInfo.chunkIndex,
                    totalChunks: chunkInfo.totalChunks
                },
                strategySpecific: {
                    chunkInfo,
                    parentFileInfo: options.parentFileInfo
                },
                processingHints: {
                    analysisDepth: 'detailed',
                    contextAware: true,
                    crossFileReferences: false,
                    preserveRelationships: true,
                    focusArea: 'code_structure',
                    specialInstructions: ['focus_on_chunk_boundaries'],
                    ...options.processingHints
                }
            }
        );
    }

    /**
     * 创建任务上下文
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {TaskStatus} status - 任务状态
     * @param {FileInfo} currentFile - 当前文件信息
     * @param {Object} options - 可选参数
     * @returns {TaskContext}
     */
    static createTaskContext(taskId, projectPath, status, currentFile, options = {}) {
        return {
            taskId,
            projectPath,
            status,
            currentFile,
            progress: options.progress || 0,
            metadata: {
                stepNumber: options.stepNumber || 3,
                stepName: options.stepName || 'file_processing',
                fileIndex: options.fileIndex || 0,
                totalFiles: options.totalFiles || 1,
                chunkInfo: options.chunkInfo || null,
                processingHints: options.processingHints || {
                    analysisDepth: 'comprehensive',
                    contextAware: true
                }
            },
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * 从BatchResult创建任务定义
     * @param {string} id - 任务ID
     * @param {Object} batchResult - BatchResult对象
     * @param {Object} options - 可选参数
     * @returns {TaskDefinition}
     */
    static fromBatchResult(id, batchResult, options = {}) {
        const typeMapping = {
            'combined_batch': 'file_batch',
            'single_batch': 'single_file',
            'large_file_chunk': 'large_file_chunk'
        };

        const type = typeMapping[batchResult.type] || 'file_batch';
        const files = batchResult.files.map(f => f.path);

        const taskOptions = {
            ...options,
            batchId: batchResult.batchId,
            chunkingAdvice: batchResult.metadata?.processingHints || undefined,
            strategySpecific: {
                originalBatchResult: batchResult,
                chunkInfo: batchResult.chunkInfo,
                parentFileInfo: batchResult.parentFileInfo
            }
        };

        return this.createTaskDefinition(
            id,
            type,
            batchResult.strategy,
            files,
            batchResult.estimatedTokens,
            taskOptions
        );
    }

    /**
     * 提取主要文件信息
     * @private
     */
    static _extractPrimaryFileInfo(filePath, fileInfo = {}) {
        return {
            relativePath: filePath || 'unknown',
            fileName: filePath?.split('/').pop() || 'unknown',
            fileSize: fileInfo.fileSize || 0,
            language: fileInfo.language || 'javascript',
            estimatedTokens: fileInfo.estimatedTokens || 0
        };
    }

    /**
     * 验证任务定义格式
     * @param {*} taskDefinition - 待验证的任务定义
     * @returns {boolean}
     */
    static isValidTaskDefinition(taskDefinition) {
        if (!taskDefinition || typeof taskDefinition !== 'object') {
            return false;
        }

        const requiredFields = ['id', 'type', 'strategy', 'status', 'files', 'estimatedTokens', 'metadata'];
        for (const field of requiredFields) {
            if (!(field in taskDefinition)) {
                return false;
            }
        }

        // 验证文件数组
        if (!Array.isArray(taskDefinition.files) || taskDefinition.files.length === 0) {
            return false;
        }

        // 验证元数据
        const metadata = taskDefinition.metadata;
        if (!metadata || typeof metadata !== 'object') {
            return false;
        }

        const requiredMetadataFields = ['batchId', 'strategy', 'fileCount', 'type', 'primaryFile', 'chunkingAdvice'];
        for (const field of requiredMetadataFields) {
            if (!(field in metadata)) {
                return false;
            }
        }

        return true;
    }
}

/**
 * TaskDefinition访问助手
 */
export class TaskDefinitionHelper {
    /**
     * 获取任务主要文件路径
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {string}
     */
    static getPrimaryFilePath(taskDefinition) {
        return taskDefinition?.metadata?.primaryFile?.relativePath || 
               taskDefinition?.files?.[0] || 
               'unknown';
    }

    /**
     * 获取任务主要文件名
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {string}
     */
    static getPrimaryFileName(taskDefinition) {
        return taskDefinition?.metadata?.primaryFile?.fileName || 'unknown';
    }

    /**
     * 获取任务进度描述
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {string}
     */
    static getProgressDescription(taskDefinition) {
        const status = taskDefinition?.status || 'unknown';
        const fileName = this.getPrimaryFileName(taskDefinition);
        
        switch (status) {
            case 'pending': return `等待处理: ${fileName}`;
            case 'in_progress': return `处理中: ${fileName}`;
            case 'completed': return `已完成: ${fileName}`;
            case 'failed': return `处理失败: ${fileName}`;
            case 'cancelled': return `已取消: ${fileName}`;
            default: return `未知状态: ${fileName}`;
        }
    }

    /**
     * 检查是否为大文件分片任务
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {boolean}
     */
    static isLargeFileChunkTask(taskDefinition) {
        return taskDefinition?.type === 'large_file_chunk';
    }

    /**
     * 获取分片信息
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {Object|null}
     */
    static getChunkInfo(taskDefinition) {
        if (!this.isLargeFileChunkTask(taskDefinition)) {
            return null;
        }
        return taskDefinition?.metadata?.strategySpecific?.chunkInfo || null;
    }

    /**
     * 获取分片进度描述
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {string|null}
     */
    static getChunkProgressDescription(taskDefinition) {
        const chunkInfo = this.getChunkInfo(taskDefinition);
        if (!chunkInfo) return null;
        
        return `分片 ${chunkInfo.chunkIndex}/${chunkInfo.totalChunks}`;
    }

    /**
     * 估算任务完成时间
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {number} 估算耗时（毫秒）
     */
    static estimateCompletionTime(taskDefinition) {
        const baseTime = 30000; // 30秒基础时间
        const tokenMultiplier = 2; // 每1000个token增加2秒
        const fileMultiplier = 5000; // 每个额外文件增加5秒
        
        const tokens = taskDefinition?.estimatedTokens || 0;
        const fileCount = taskDefinition?.files?.length || 1;
        
        const tokenTime = (tokens / 1000) * tokenMultiplier * 1000;
        const fileTime = Math.max(0, fileCount - 1) * fileMultiplier;
        
        return baseTime + tokenTime + fileTime;
    }

    /**
     * 创建任务摘要
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @returns {Object}
     */
    static createTaskSummary(taskDefinition) {
        return {
            id: taskDefinition.id,
            type: taskDefinition.type,
            strategy: taskDefinition.strategy,
            status: taskDefinition.status,
            fileCount: taskDefinition.files?.length || 0,
            estimatedTokens: taskDefinition.estimatedTokens,
            primaryFile: this.getPrimaryFileName(taskDefinition),
            isLargeFileChunk: this.isLargeFileChunkTask(taskDefinition),
            chunkInfo: this.getChunkProgressDescription(taskDefinition),
            estimatedDuration: this.estimateCompletionTime(taskDefinition),
            createdAt: taskDefinition.timing?.createdAt
        };
    }

    /**
     * 添加分片信息到任务定义
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @param {Object} chunkInfo - 分片信息
     */
    static addChunkInfo(taskDefinition, chunkInfo) {
        if (!taskDefinition.metadata.strategySpecific) {
            taskDefinition.metadata.strategySpecific = {};
        }
        taskDefinition.metadata.strategySpecific.chunkInfo = chunkInfo;
        
        // 添加到主要元数据中便于快速访问
        taskDefinition.metadata.chunkIndex = chunkInfo.chunkIndex;
        taskDefinition.metadata.totalChunks = chunkInfo.totalChunks;
        taskDefinition.metadata.startLine = chunkInfo.startLine;
        taskDefinition.metadata.endLine = chunkInfo.endLine;
        taskDefinition.metadata.parentFileInfo = chunkInfo.parentFileInfo;
    }

    /**
     * 添加多文件信息到任务定义
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @param {Array} fileInfos - 文件信息数组
     */
    static addMultiFileInfo(taskDefinition, fileInfos) {
        if (!taskDefinition.metadata.strategySpecific) {
            taskDefinition.metadata.strategySpecific = {};
        }
        taskDefinition.metadata.strategySpecific.allFiles = fileInfos;
        
        // 添加到主要元数据中便于快速访问
        taskDefinition.metadata.allFiles = fileInfos;
        taskDefinition.metadata.multiFileCount = fileInfos.length;
    }

    /**
     * 添加单文件信息到任务定义
     * @param {TaskDefinition} taskDefinition - 任务定义
     * @param {Object} fileInfo - 文件信息
     */
    static addSingleFileInfo(taskDefinition, fileInfo) {
        if (!taskDefinition.metadata.strategySpecific) {
            taskDefinition.metadata.strategySpecific = {};
        }
        taskDefinition.metadata.strategySpecific.singleFileInfo = fileInfo;
        
        // 添加到主要元数据中便于快速访问
        taskDefinition.metadata.singleFileInfo = fileInfo;
    }
}

// 导出常量
export const TASK_TYPES = {
    FILE_BATCH: 'file_batch',
    SINGLE_FILE: 'single_file',
    LARGE_FILE_CHUNK: 'large_file_chunk',
    MODULE_INTEGRATION: 'module_integration',
    MODULE_RELATIONS: 'module_relations',
    ARCHITECTURE_DOCS: 'architecture_docs'
};

export const TASK_STRATEGIES = {
    COMBINED: 'combined',
    SINGLE: 'single',
    LARGE_MULTI: 'largeMulti',
    MODULE: 'module',
    ARCHITECTURE: 'architecture'
};

export const TASK_STATUSES = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};