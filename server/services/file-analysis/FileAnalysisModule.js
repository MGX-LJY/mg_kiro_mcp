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
                
                // 处理综合批次
                for (const batch of batchPlans.combinedBatches || []) {
                    const primaryFile = batch.files[0]; // 主要文件用于上下文设置
                    taskDefinitions.push({
                        id: `task_${taskCounter}_${Date.now().toString().slice(-6)}`,
                        type: 'file_batch',
                        strategy: 'combined',
                        files: batch.files.map(f => f.path),
                        estimatedTokens: batch.estimatedTokens,
                        metadata: {
                            batchId: batch.id,
                            strategy: 'combined',
                            fileCount: batch.files.length,
                            // ✅ 新增: 详细文件信息
                            relativePath: primaryFile?.path || batch.files[0]?.path,
                            fileName: primaryFile?.name || 'combined_batch',
                            fileSize: primaryFile?.size || 0,
                            language: primaryFile?.language || 'javascript',
                            // ✅ 新增: 分片建议
                            chunkingAdvice: {
                                recommended: batch.estimatedTokens > 8000,
                                maxTokensPerChunk: Math.min(1500, Math.floor(batch.estimatedTokens / 3)),
                                strategy: 'combined_files'
                            },
                            // ✅ 新增: 所有文件详情
                            allFiles: batch.files.map(f => ({
                                path: f.path,
                                name: f.name,
                                size: f.size || 0,
                                estimatedTokens: f.estimatedTokens || 0,
                                language: f.language || 'javascript'
                            }))
                        }
                    });
                    taskCounter++;
                }
                
                // 处理单文件批次
                for (const batch of batchPlans.singleBatches || []) {
                    const singleFile = batch.files[0]; // 单文件批次
                    taskDefinitions.push({
                        id: `task_${taskCounter}_${Date.now().toString().slice(-6)}`,
                        type: 'single_file',
                        strategy: 'single',
                        files: batch.files.map(f => f.path),
                        estimatedTokens: batch.estimatedTokens,
                        metadata: {
                            batchId: batch.id,
                            strategy: 'single',
                            fileCount: batch.files.length,
                            // ✅ 新增: 单文件详细信息
                            relativePath: singleFile?.path || batch.files[0]?.path,
                            fileName: singleFile?.name || 'single_file',
                            fileSize: singleFile?.size || 0,
                            language: singleFile?.language || 'javascript',
                            estimatedFileTokens: singleFile?.estimatedTokens || batch.estimatedTokens,
                            // ✅ 新增: 单文件分片建议
                            chunkingAdvice: {
                                recommended: batch.estimatedTokens > 12000,
                                maxTokensPerChunk: 1500,
                                strategy: 'function_boundary',
                                enableSmartChunking: true
                            }
                        }
                    });
                    taskCounter++;
                }
                
                // 处理多批次大文件
                for (const batch of batchPlans.multiBatches || []) {
                    const largeFile = batch.files[0]; // 大文件
                    taskDefinitions.push({
                        id: `task_${taskCounter}_${Date.now().toString().slice(-6)}`,
                        type: 'large_file_multi',
                        strategy: 'largeMulti',
                        files: batch.files.map(f => f.path),
                        estimatedTokens: batch.estimatedTokens,
                        metadata: {
                            batchId: batch.id,
                            strategy: 'largeMulti',
                            fileCount: batch.files.length,
                            // ✅ 新增: 大文件详细信息
                            relativePath: largeFile?.path || batch.files[0]?.path,
                            fileName: largeFile?.name || 'large_file',
                            fileSize: largeFile?.size || 0,
                            language: largeFile?.language || 'javascript',
                            estimatedFileTokens: largeFile?.estimatedTokens || batch.estimatedTokens,
                            // ✅ 新增: 大文件专用分片建议
                            chunkingAdvice: {
                                recommended: true, // 大文件必须分片
                                maxTokensPerChunk: 1200, // 更小的分片
                                strategy: 'smart_boundary_detection',
                                enableBoundaryDetection: true,
                                multiChunkRequired: true,
                                estimatedChunks: Math.ceil(batch.estimatedTokens / 1200)
                            }
                        }
                    });
                    taskCounter++;
                }
                
                return taskDefinitions;
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
        
        for (const file of fileList) {
            try {
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
                
                fileAnalyses.push({
                    ...file,
                    tokenCount,
                    codeStructure,
                    analysisTimestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.warn(`[FileAnalysisModule] 分析文件失败: ${file.path}`, error.message);
                
                // 添加错误标记的文件分析
                fileAnalyses.push({
                    ...file,
                    tokenCount: 0,
                    codeStructure: null,
                    analysisError: error.message,
                    analysisTimestamp: new Date().toISOString()
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
        
        for (const analysis of fileAnalyses) {
            if (analysis.analysisError) {
                categories.error.push(analysis);
            } else if (analysis.tokenCount < this.config.smallFileThreshold) {
                categories.small.push(analysis);
            } else if (analysis.tokenCount < this.config.largeFileThreshold) {
                categories.medium.push(analysis);
            } else {
                categories.large.push(analysis);
            }
        }
        
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
            .reduce((sum, file) => sum + file.tokenCount, 0);
        
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
            for (const task of taskDefinitions.tasks || []) {
                this.taskDefinitionStorage.set(task.id, {
                    ...task,
                    projectPath,
                    storedAt: new Date().toISOString()
                });
                projectTasks.add(task.id);
            }
            
            console.log(`[FileAnalysisModule] 已存储 ${taskDefinitions.tasks?.length || 0} 个任务定义`);
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