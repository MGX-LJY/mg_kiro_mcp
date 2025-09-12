/**
 * 文件分析模块 - 系统协调大脑
 * 
 * 核心职责：
 * - 精确Token分析和智能批次分配
 * - 协调三种批次策略：综合文件批次、单文件单批次、大文件多批次
 * - 生成标准化任务定义和处理策略
 * - 为Step2提供智能文件分析结果
 * 
 * 设计理念：
 * - 作为系统大脑，统筹文件分析和批次规划
 * - 基于Token精确计算，智能分配处理策略
 * - 生成结构化任务队列，支持复杂文件处理场景
 * - 优化AI处理效率，减少Token浪费
 * 
 * 批次策略阈值：
 * - 小文件 (<15K tokens) -> 综合文件批次策略
 * - 中等文件 (15K-20K tokens) -> 单文件单批次策略
 * - 大文件 (>20K tokens) -> 大文件多批次策略
 */

export class FileAnalysisModule {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 配置合并（ServiceBus格式）
        this.config = {
            smallFileThreshold: 15000,    // 15K tokens
            largeFileThreshold: 20000,    // 20K tokens
            batchTargetSize: 18000,       // 18K tokens per batch
            maxBatchSize: 22000,          // 22K tokens maximum
            ...config
        };

        // 依赖注入（ServiceBus格式：config, dependencies, serviceBus）
        this.tokenCalculator = dependencies.preciseTokenCalculator;
        this.codeStructureAnalyzer = null; // 如果需要的话稍后注入
        this.boundaryDetector = null; // 如果需要的话稍后注入
        this.batchStrategies = {
            combined: dependencies.combinedFileBatchStrategy,
            single: dependencies.singleFileBatchStrategy,
            largeMulti: dependencies.largeFileMultiBatchStrategy
        };
        this.taskGenerator = {
            generateTaskDefinitions: async (batchPlans, projectMetadata, config) => {
                const taskDefinitions = [];
                let taskCounter = 1;
                
                console.log('[FileAnalysisModule] 开始生成任务定义 - 使用统一BatchResult接口');
                
                // 统一处理所有批次类型 - 所有批次现在都有统一的BatchResult格式
                const allBatches = [
                    ...(batchPlans.combinedBatches || []),
                    ...(batchPlans.singleBatches || []),
                    ...(batchPlans.multiBatches || [])
                ];
                
                for (const batch of allBatches) {
                    // 统一验证：所有批次都应该有files数组和基础字段
                    if (!batch.files || batch.files.length === 0) {
                        console.warn('[FileAnalysisModule] 批次缺少files数组，跳过:', batch.batchId, batch.type);
                        continue;
                    }
                    
                    // 获取主要文件信息（用于元数据）
                    const primaryFile = batch.files[0];
                    
                    // 创建统一的任务定义
                    const taskDefinition = {
                        id: `task_${taskCounter}`,
                        type: this._mapBatchTypeToTaskType(batch.type),
                        strategy: batch.strategy,
                        files: batch.files.map(f => f.path), // 统一提取文件路径
                        estimatedTokens: batch.estimatedTokens,
                        metadata: {
                            // 基础批次信息
                            batchId: batch.batchId,
                            strategy: batch.strategy,
                            fileCount: batch.fileCount,
                            type: batch.type,
                            
                            // 主要文件信息
                            relativePath: primaryFile.path,
                            fileName: primaryFile.path.split('/').pop() || 'unknown',
                            fileSize: primaryFile.size || 0,
                            language: primaryFile.language || 'javascript',
                            
                            // 分片建议（从batch metadata继承）
                            chunkingAdvice: batch.metadata?.processingHints || {
                                recommended: false,
                                strategy: 'default'
                            }
                        }
                    };
                    
                    // 根据批次类型添加特殊元数据
                    if (batch.type === 'large_file_chunk' && batch.chunkInfo) {
                        // 大文件分片的特殊元数据
                        taskDefinition.metadata.chunkIndex = batch.chunkInfo.chunkIndex;
                        taskDefinition.metadata.totalChunks = batch.chunkInfo.totalChunks;
                        taskDefinition.metadata.startLine = batch.chunkInfo.startLine;
                        taskDefinition.metadata.endLine = batch.chunkInfo.endLine;
                        taskDefinition.metadata.parentFileInfo = batch.parentFileInfo;
                        
                        console.log(`[FileAnalysisModule] 创建大文件chunk任务: ${batch.batchId} (${batch.chunkInfo.chunkIndex}/${batch.chunkInfo.totalChunks})`);
                    } else if (batch.type === 'combined_batch') {
                        // 组合批次的特殊元数据
                        taskDefinition.metadata.allFiles = batch.files.map(f => ({
                            path: f.path,
                            tokenCount: f.tokenCount,
                            size: f.size,
                            language: f.language
                        }));
                        
                        console.log(`[FileAnalysisModule] 创建组合批次任务: ${batch.batchId} (${batch.files.length}个文件)`);
                    } else if (batch.type === 'single_batch') {
                        // 单文件批次的特殊元数据
                        taskDefinition.metadata.singleFileInfo = primaryFile;
                        
                        console.log(`[FileAnalysisModule] 创建单文件任务: ${batch.batchId} (${primaryFile.path})`);
                    }
                    
                    taskDefinitions.push(taskDefinition);
                    taskCounter++;
                }
                
                console.log(`[FileAnalysisModule] 任务定义生成完成: 总计${taskDefinitions.length}个任务`);
                return taskDefinitions;
            },
            
            /**
             * 将BatchResult类型映射为TaskDefinition类型
             * @private
             */
            _mapBatchTypeToTaskType: (batchType) => {
                switch (batchType) {
                    case 'combined_batch': return 'file_batch';
                    case 'single_batch': return 'single_file';
                    case 'large_file_chunk': return 'large_file_chunk';
                    default: 
                        console.warn(`[FileAnalysisModule] 未知的批次类型: ${batchType}`);
                        return 'file_batch';
                }
            }
        };
        this.progressTracker = null; // 暂时不需要
        this.serviceBus = serviceBus;
        
        // 任务定义存储
        this.taskDefinitionStorage = new Map(); // taskId -> taskDefinition
        this.projectTaskMapping = new Map();    // projectPath -> Set of taskIds
    }

    /**
     * 注入依赖服务
     */
    injectDependencies({
        tokenCalculator,
        codeStructureAnalyzer,
        boundaryDetector,
        combinedStrategy,
        singleStrategy,
        largeMultiStrategy,
        taskGenerator,
        progressTracker
    }) {
        this.tokenCalculator = tokenCalculator;
        this.codeStructureAnalyzer = codeStructureAnalyzer;
        this.boundaryDetector = boundaryDetector;
        this.batchStrategies.combined = combinedStrategy;
        this.batchStrategies.single = singleStrategy;
        this.batchStrategies.largeMulti = largeMultiStrategy;
        this.taskGenerator = taskGenerator;
        this.progressTracker = progressTracker;
    }

    /**
     * 主入口：分析项目文件并生成批次计划
     * @param {string} projectPath - 项目路径
     * @param {Array} fileList - 文件列表（来自Step1）
     * @param {Object} projectMetadata - 项目元数据（来自Step1）
     * @param {Object} options - 分析选项
     * @returns {Object} 批次分析结果和任务定义
     */
    async analyzeProject(projectPath, fileList, projectMetadata, options = {}) {
        console.log(`[FileAnalysisModule] 开始分析项目: ${projectPath}`);
        
        // 防护性检查参数
        if (!projectPath || typeof projectPath !== 'string') {
            throw new Error('Invalid projectPath provided');
        }
        
        if (!fileList || !Array.isArray(fileList)) {
            throw new Error('Invalid fileList provided: must be an array');
        }
        
        if (!projectMetadata || typeof projectMetadata !== 'object') {
            throw new Error('Invalid projectMetadata provided');
        }
        
        const startTime = Date.now();
        
        try {
            // Step 1: 文件Token分析
            console.log(`[FileAnalysisModule] 执行文件Token分析...`);
            const fileAnalyses = await this._analyzeFileTokens(projectPath, fileList, projectMetadata);
            
            // Step 2: 文件分类和策略分配
            console.log(`[FileAnalysisModule] 执行文件分类和策略分配...`);
            const fileCategories = this._categorizeFiles(fileAnalyses);
            
            // Step 3: 生成批次计划
            console.log(`[FileAnalysisModule] 生成批次计划...`);
            const batchPlans = await this._generateBatchPlans(fileCategories, projectPath);
            
            // Step 4: 创建任务定义
            console.log(`[FileAnalysisModule] 创建任务定义...`);
            const taskDefinitions = await this._createTaskDefinitions(batchPlans, projectMetadata);
            
            // Step 4.1: 存储任务定义供后续查询
            this._storeTaskDefinitions(taskDefinitions, projectPath);
            
            // Step 5: 生成处理策略总结
            const strategySummary = this._generateStrategySummary(fileCategories, batchPlans);
            
            const processingTime = Date.now() - startTime;
            
            console.log(`[FileAnalysisModule] 分析完成，耗时: ${processingTime}ms`);
            
            return {
                success: true,
                analysisResult: {
                    fileAnalyses,
                    fileCategories,
                    batchPlans,
                    taskDefinitions,
                    strategySummary,
                    metadata: {
                        projectPath,
                        totalFiles: fileList.length,
                        processingTime,
                        timestamp: new Date().toISOString()
                    }
                }
            };
            
        } catch (error) {
            console.error(`[FileAnalysisModule] 分析失败:`, error);
            
            return {
                success: false,
                error: {
                    message: error.message,
                    type: 'ANALYSIS_ERROR',
                    projectPath,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * 分析文件Token数量
     * @private
     */
    async _analyzeFileTokens(projectPath, fileList, projectMetadata) {
        const fileAnalyses = [];
        
        // 防护性检查
        if (!fileList || !Array.isArray(fileList)) {
            console.warn('[FileAnalysisModule] fileList is not a valid array:', fileList);
            return fileAnalyses;
        }
        
        if (!this.tokenCalculator) {
            console.error('[FileAnalysisModule] tokenCalculator is not initialized');
            throw new Error('TokenCalculator is not available');
        }
        
        for (const file of fileList) {
            try {
                // 防护性检查文件对象
                if (!file || typeof file !== 'object') {
                    console.warn('[FileAnalysisModule] 跳过无效的文件对象:', file);
                    continue;
                }
                
                // 计算精确Token数量
                const tokenCount = await this.tokenCalculator.calculateTokens(
                    file.path, 
                    file.content || null,
                    projectMetadata.languageProfile
                );
                
                // 分析代码结构 - 使用简化版本
                const codeStructure = this.codeStructureAnalyzer ? 
                    await this.codeStructureAnalyzer.analyze(
                        file.path,
                        file.content || null,
                        projectMetadata.languageProfile
                    ) : {
                        complexity: 1,
                        functions: [],
                        classes: [],
                        imports: []
                    };
                
                // ✅ 修复：只保存必要的元数据，不包含文件内容
                fileAnalyses.push({
                    path: file.path,
                    name: file.name,
                    size: file.size,
                    extension: file.extension,
                    isSourceCode: file.isSourceCode,
                    language: file.language,
                    // 分析结果
                    tokenCount,
                    codeStructure,
                    analysisTimestamp: new Date().toISOString()
                    // 注意：不包含 file.content，避免文件过大
                });
                
            } catch (error) {
                console.warn(`[FileAnalysisModule] 分析文件失败: ${file.path}`, error.message);
                
                // ✅ 修复：添加错误标记的文件分析，只保存必要元数据
                fileAnalyses.push({
                    path: file.path,
                    name: file.name,
                    size: file.size,
                    extension: file.extension,
                    isSourceCode: file.isSourceCode,
                    language: file.language,
                    // 错误处理结果
                    tokenCount: 0,
                    codeStructure: null,
                    analysisError: error.message,
                    analysisTimestamp: new Date().toISOString()
                    // 注意：不包含 file.content，避免文件过大
                });
            }
        }
        
        return fileAnalyses;
    }

    /**
     * 文件分类：根据Token数量分配处理策略
     * @private
     */
    _categorizeFiles(fileAnalyses) {
        const categories = {
            small: [],      // <15K tokens - 综合文件批次策略
            medium: [],     // 15K-20K tokens - 单文件单批次策略
            large: [],      // >20K tokens - 大文件多批次策略
            error: []       // 分析出错的文件
        };
        
        console.log(`[FileAnalysisModule] 开始文件分类，阈值: small<${this.config.smallFileThreshold}, medium<${this.config.largeFileThreshold}`);
        
        for (const analysis of fileAnalyses) {
            if (analysis.analysisError) {
                console.log(`[FileAnalysisModule] 错误文件: ${analysis.path} - ${analysis.analysisError}`);
                categories.error.push(analysis);
                continue;
            }
            
            // Fix: tokenCount is an object, extract the actual token count
            const actualTokenCount = analysis.tokenCount?.totalTokens || 
                                   analysis.tokenCount?.safeTokenCount || 
                                   analysis.tokenCount || 0;
            
            let category;
            if (actualTokenCount < this.config.smallFileThreshold) {
                categories.small.push(analysis);
                category = 'small';
            } else if (actualTokenCount < this.config.largeFileThreshold) {
                categories.medium.push(analysis);
                category = 'medium';
            } else {
                categories.large.push(analysis);
                category = 'large';
            }
            
            console.log(`[FileAnalysisModule] ${analysis.path} -> ${category} (${actualTokenCount} tokens)`);
        }
        
        console.log(`[FileAnalysisModule] 分类结果: small=${categories.small.length}, medium=${categories.medium.length}, large=${categories.large.length}, error=${categories.error.length}`);
        
        return categories;
    }

    /**
     * 生成批次计划
     * @private
     */
    async _generateBatchPlans(fileCategories, projectPath) {
        const plans = {
            combinedBatches: [],
            singleBatches: [],
            multiBatches: [],
            errorHandling: []
        };
        
        // 综合文件批次策略
        if (fileCategories.small.length > 0) {
            plans.combinedBatches = await this.batchStrategies.combined.generateBatches(
                fileCategories.small, 
                this.config
            );
        }
        
        // 单文件单批次策略
        if (fileCategories.medium.length > 0) {
            plans.singleBatches = await this.batchStrategies.single.generateBatches(
                fileCategories.medium,
                this.config
            );
        }
        
        // 大文件多批次策略
        if (fileCategories.large.length > 0) {
            plans.multiBatches = await this.batchStrategies.largeMulti.generateBatches(
                fileCategories.large,
                this.config,
                projectPath
            );
        }
        
        // 错误处理策略
        if (fileCategories.error.length > 0) {
            plans.errorHandling = fileCategories.error.map(file => ({
                type: 'error_recovery',
                file: file,
                strategy: 'manual_review',
                reason: file.analysisError
            }));
        }
        
        return plans;
    }

    /**
     * 创建任务定义
     * @private
     */
    async _createTaskDefinitions(batchPlans, projectMetadata) {
        return await this.taskGenerator.generateTaskDefinitions(
            batchPlans,
            projectMetadata,
            this.config
        );
    }

    /**
     * 生成处理策略总结
     * @private
     */
    _generateStrategySummary(fileCategories, batchPlans) {
        const totalFiles = fileCategories.small.length + 
                          fileCategories.medium.length + 
                          fileCategories.large.length;
        
        const totalBatches = batchPlans.combinedBatches.length +
                            batchPlans.singleBatches.length +
                            batchPlans.multiBatches.length;
        
        return {
            fileDistribution: {
                small: fileCategories.small.length,
                medium: fileCategories.medium.length,
                large: fileCategories.large.length,
                error: fileCategories.error.length,
                total: totalFiles + fileCategories.error.length
            },
            batchDistribution: {
                combinedBatches: batchPlans.combinedBatches.length,
                singleBatches: batchPlans.singleBatches.length,
                multiBatches: batchPlans.multiBatches.length,
                total: totalBatches
            },
            strategyEfficiency: {
                averageFilesPerBatch: totalFiles / (totalBatches || 1),
                tokenOptimizationRate: this._calculateTokenOptimization(fileCategories, batchPlans)
            },
            recommendations: this._generateProcessingRecommendations(fileCategories, batchPlans)
        };
    }

    /**
     * 计算Token优化率
     * @private
     */
    _calculateTokenOptimization(fileCategories, batchPlans) {
        // 计算优化前后的Token使用效率
        const totalTokens = [...fileCategories.small, ...fileCategories.medium, ...fileCategories.large]
            .reduce((sum, file) => {
                const actualTokenCount = file.tokenCount?.totalTokens || 
                                       file.tokenCount?.safeTokenCount || 
                                       file.tokenCount || 0;
                return sum + actualTokenCount;
            }, 0);
        
        const batchTokenEfficiency = this._calculateBatchEfficiency(batchPlans);
        
        return {
            totalTokens,
            batchTokenEfficiency,
            optimizationPercentage: ((batchTokenEfficiency / totalTokens) * 100).toFixed(2)
        };
    }

    /**
     * 计算批次效率
     * @private
     */
    _calculateBatchEfficiency(batchPlans) {
        let totalEffectiveTokens = 0;
        
        // 计算各种批次的有效Token使用
        [...batchPlans.combinedBatches, ...batchPlans.singleBatches, ...batchPlans.multiBatches]
            .forEach(batch => {
                totalEffectiveTokens += batch.estimatedTokens || 0;
            });
        
        return totalEffectiveTokens;
    }

    /**
     * 生成处理建议
     * @private
     */
    _generateProcessingRecommendations(fileCategories, batchPlans) {
        const recommendations = [];
        
        if (fileCategories.large.length > 0) {
            recommendations.push({
                type: 'large_file_attention',
                message: `发现 ${fileCategories.large.length} 个大文件，建议优先处理`,
                priority: 'high'
            });
        }
        
        if (fileCategories.error.length > 0) {
            recommendations.push({
                type: 'error_files',
                message: `${fileCategories.error.length} 个文件分析失败，需要手动检查`,
                priority: 'medium'
            });
        }
        
        const totalBatches = batchPlans.combinedBatches.length + 
                            batchPlans.singleBatches.length + 
                            batchPlans.multiBatches.length;
        
        if (totalBatches > 20) {
            recommendations.push({
                type: 'batch_optimization',
                message: `批次数量较多（${totalBatches}），建议分阶段处理`,
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    /**
     * 存储任务定义 - 在analyzeProject完成后调用
     * @private
     */
    _storeTaskDefinitions(taskDefinitions, projectPath) {
        try {
            if (!this.projectTaskMapping.has(projectPath)) {
                this.projectTaskMapping.set(projectPath, new Set());
            }
            
            const projectTasks = this.projectTaskMapping.get(projectPath);
            
            // 存储每个任务定义
            for (const task of taskDefinitions || []) {
                this.taskDefinitionStorage.set(task.id, {
                    ...task,
                    projectPath,
                    storedAt: new Date().toISOString()
                });
                projectTasks.add(task.id);
            }
            
            console.log(`[FileAnalysisModule] 已存储 ${taskDefinitions?.length || 0} 个任务定义`);
            return true;
            
        } catch (error) {
            console.error('[FileAnalysisModule] 存储任务定义失败:', error);
            return false;
        }
    }

    /**
     * 获取任务定义 - 供UnifiedTaskValidator调用
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object|null>} 任务定义或null
     */
    async getTaskDefinition(taskId) {
        try {
            const taskDefinition = this.taskDefinitionStorage.get(taskId);
            
            if (!taskDefinition) {
                console.warn(`[FileAnalysisModule] 未找到任务定义: ${taskId}`);
                return null;
            }
            
            return {
                id: taskDefinition.id,
                files: taskDefinition.files || [],
                batchStrategy: taskDefinition.batchStrategy,
                processingType: taskDefinition.processingType,
                metadata: taskDefinition.metadata || {},
                tokenEstimate: taskDefinition.tokenEstimate,
                priority: taskDefinition.priority,
                subBatches: taskDefinition.subBatches,
                projectPath: taskDefinition.projectPath,
                storedAt: taskDefinition.storedAt
            };
            
        } catch (error) {
            console.error(`[FileAnalysisModule] 获取任务定义失败: ${taskId}`, error);
            return null;
        }
    }

    /**
     * 获取项目的所有任务ID
     * @param {string} projectPath - 项目路径
     * @returns {Array<string>} 任务ID列表
     */
    getProjectTaskIds(projectPath) {
        const projectTasks = this.projectTaskMapping.get(projectPath);
        return projectTasks ? Array.from(projectTasks) : [];
    }

    /**
     * 清理项目的任务定义
     * @param {string} projectPath - 项目路径
     */
    clearProjectTasks(projectPath) {
        const projectTasks = this.projectTaskMapping.get(projectPath);
        if (projectTasks) {
            // 删除所有任务定义
            for (const taskId of projectTasks) {
                this.taskDefinitionStorage.delete(taskId);
            }
            // 删除项目映射
            this.projectTaskMapping.delete(projectPath);
            console.log(`[FileAnalysisModule] 已清理项目 ${projectPath} 的任务定义`);
        }
    }

    /**
     * 获取模块状态信息
     */
    getModuleStatus() {
        return {
            moduleName: 'FileAnalysisModule',
            version: '1.0.0',
            config: this.config,
            dependencies: {
                tokenCalculator: !!this.tokenCalculator,
                codeStructureAnalyzer: !!this.codeStructureAnalyzer,
                boundaryDetector: !!this.boundaryDetector,
                combinedStrategy: !!this.batchStrategies.combined,
                singleStrategy: !!this.batchStrategies.single,
                largeMultiStrategy: !!this.batchStrategies.largeMulti,
                taskGenerator: !!this.taskGenerator,
                progressTracker: !!this.progressTracker
            },
            isReady: this._checkDependenciesReady()
        };
    }

    /**
     * 检查依赖是否就绪
     * @private
     */
    _checkDependenciesReady() {
        return !!(
            this.tokenCalculator &&
            this.codeStructureAnalyzer &&
            this.boundaryDetector &&
            this.batchStrategies.combined &&
            this.batchStrategies.single &&
            this.batchStrategies.largeMulti &&
            this.taskGenerator &&
            this.progressTracker
        );
    }
}

export default FileAnalysisModule;