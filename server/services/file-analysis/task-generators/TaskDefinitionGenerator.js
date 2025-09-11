/**
 * 任务定义生成器 - 标准化任务队列生成
 * 
 * 核心功能：
 * - 将各种批次策略的结果转换为标准化任务定义
 * - 生成统一的任务ID命名规范（task_1, task_2_1等）
 * - 整合任务元数据和处理策略
 * - 生成任务执行计划和优先级排序
 * 
 * 设计理念：
 * - 标准化输出：统一的任务定义格式，便于后续处理
 * - 智能排序：基于优先级和依赖关系的任务排序
 * - 完整元数据：包含所有必要的处理信息和上下文
 * - 可扩展性：支持不同类型任务的定义和扩展
 */

export class TaskDefinitionGenerator {
    constructor(config = {}) {
        this.config = {
            enablePriorityOptimization: true,    // 启用优先级优化
            enableDependencyAnalysis: true,      // 启用依赖分析
            maxTasksPerQueue: 100,               // 每个队列最大任务数
            taskIdPrefix: 'task',                // 任务ID前缀
            includeDetailedMetadata: true,       // 包含详细元数据
            ...config
        };

        // 任务类型配置
        this.taskTypes = {
            combined_files: {
                priority: 5,
                category: 'batch_processing',
                estimatedDuration: 'medium',
                requiresContext: true
            },
            single_file: {
                priority: 7,
                category: 'individual_processing',
                estimatedDuration: 'medium',
                requiresContext: false
            },
            large_file_chunk: {
                priority: 8,
                category: 'chunk_processing',
                estimatedDuration: 'high',
                requiresContext: true
            }
        };

        // 优先级计算权重
        this.priorityWeights = {
            fileImportance: 0.3,     // 文件重要性
            tokenCount: 0.2,         // Token数量
            complexity: 0.2,         // 复杂度
            dependencies: 0.15,      // 依赖关系
            urgency: 0.15           // 紧急程度
        };
    }

    /**
     * 生成任务定义
     * @param {Object} batchPlans - 批次计划对象
     * @param {Object} projectMetadata - 项目元数据
     * @param {Object} config - 配置参数
     * @returns {Promise<Object>} 任务定义结果
     */
    async generateTaskDefinitions(batchPlans, projectMetadata, config = {}) {
        try {
            console.log('[TaskDefinitionGenerator] 开始生成任务定义');

            const finalConfig = { ...this.config, ...config };

            // 收集所有批次
            const allBatches = this._collectAllBatches(batchPlans);
            console.log(`[TaskDefinitionGenerator] 收集到 ${allBatches.length} 个批次`);

            // 生成基础任务定义
            const baseTasks = this._generateBaseTasks(allBatches, projectMetadata, finalConfig);

            // 分析任务依赖关系
            const tasksWithDependencies = finalConfig.enableDependencyAnalysis ?
                this._analyzeDependencies(baseTasks, projectMetadata) : baseTasks;

            // 计算优先级和排序
            const optimizedTasks = finalConfig.enablePriorityOptimization ?
                this._optimizePriorities(tasksWithDependencies, projectMetadata) : tasksWithDependencies;

            // 生成执行计划
            const executionPlan = this._generateExecutionPlan(optimizedTasks, finalConfig);

            // 生成摘要信息
            const summary = this._generateSummary(optimizedTasks, executionPlan);

            const result = {
                success: true,
                taskDefinitions: optimizedTasks,
                executionPlan,
                summary,
                metadata: {
                    totalTasks: optimizedTasks.length,
                    generationTimestamp: new Date().toISOString(),
                    projectPath: projectMetadata.projectPath || '',
                    generatorVersion: '1.0.0'
                }
            };

            console.log(`[TaskDefinitionGenerator] 生成 ${optimizedTasks.length} 个任务定义`);

            return result;

        } catch (error) {
            console.error('[TaskDefinitionGenerator] 任务定义生成失败:', error);
            
            return {
                success: false,
                error: {
                    message: error.message,
                    type: 'TASK_GENERATION_ERROR',
                    timestamp: new Date().toISOString()
                },
                taskDefinitions: [],
                executionPlan: null,
                summary: null
            };
        }
    }

    /**
     * 收集所有批次
     * @private
     */
    _collectAllBatches(batchPlans) {
        const batches = [];

        // 合并批次策略
        if (batchPlans.combinedBatches) {
            batches.push(...batchPlans.combinedBatches);
        }
        if (batchPlans.singleBatches) {
            batches.push(...batchPlans.singleBatches);
        }
        if (batchPlans.multiBatches) {
            batches.push(...batchPlans.multiBatches);
        }

        // 处理错误批次（转换为特殊任务）
        if (batchPlans.errorHandling) {
            const errorTasks = batchPlans.errorHandling.map(error => ({
                type: 'error_recovery',
                batchId: `error_${batches.length + 1}`,
                file: error.file,
                strategy: error.strategy,
                reason: error.reason,
                estimatedTokens: 0,
                fileCount: 1
            }));
            batches.push(...errorTasks);
        }

        return batches;
    }

    /**
     * 生成基础任务定义
     * @private
     */
    _generateBaseTasks(batches, projectMetadata, config) {
        const tasks = [];
        let sequentialTaskId = 1;

        for (const batch of batches) {
            const task = this._createTaskDefinition(batch, sequentialTaskId, projectMetadata, config);
            tasks.push(task);
            sequentialTaskId++;
        }

        return tasks;
    }

    /**
     * 创建任务定义
     * @private
     */
    _createTaskDefinition(batch, sequentialId, projectMetadata, config) {
        const taskId = this._generateTaskId(batch, sequentialId);
        const taskType = this.taskTypes[batch.type] || this.taskTypes.single_file;

        const task = {
            // 基础信息
            taskId,
            sequentialId,
            type: batch.type,
            category: taskType.category,
            status: 'pending',

            // 批次信息
            batchInfo: {
                batchId: batch.batchId,
                strategy: batch.strategy,
                estimatedTokens: batch.estimatedTokens,
                fileCount: batch.fileCount,
                efficiency: batch.efficiency || 0
            },

            // 文件信息
            fileInfo: this._extractFileInfo(batch),

            // 处理配置
            processingConfig: {
                analysisDepth: batch.processingHints?.analysisDepth || 'comprehensive',
                focusAreas: batch.processingHints?.focusAreas || [],
                specialHandling: batch.processingHints?.specialHandling || [],
                contextAware: batch.processingHints?.contextAware || false,
                requiresIntegration: batch.processingHints?.requiresIntegration || false
            },

            // 优先级信息
            priority: {
                basePriority: taskType.priority,
                calculatedPriority: 0, // 稍后计算
                factors: {}
            },

            // 元数据
            metadata: config.includeDetailedMetadata ? this._generateTaskMetadata(batch, projectMetadata) : {},

            // 上下文信息
            contextInfo: batch.contextInfo || null,

            // 重构信息（用于大文件分割任务）
            reconstructionInfo: batch.reconstructionInfo || null,

            // 时间估算
            estimatedDuration: this._estimateTaskDuration(batch),

            // 创建时间
            createdAt: new Date().toISOString()
        };

        return task;
    }

    /**
     * 生成任务ID
     * @private
     */
    _generateTaskId(batch, sequentialId) {
        const prefix = this.config.taskIdPrefix;

        // 大文件分割任务的特殊ID格式
        if (batch.type === 'large_file_chunk' && batch.chunkInfo) {
            const fileIndex = batch.parentFileInfo?.originalIndex + 1 || sequentialId;
            const chunkIndex = batch.chunkInfo.chunkIndex;
            return `${prefix}_${fileIndex}_${chunkIndex}`;
        }

        // 标准ID格式
        return `${prefix}_${sequentialId}`;
    }

    /**
     * 提取文件信息
     * @private
     */
    _extractFileInfo(batch) {
        const fileInfo = {
            files: [],
            totalFiles: batch.fileCount || 0
        };

        if (batch.type === 'combined_files' && batch.files) {
            // 综合文件批次
            fileInfo.files = batch.files.map(f => ({
                path: f.path,
                tokenCount: f.tokenCount,
                importance: f.importance || 0,
                priority: f.priority || 0
            }));
        } else if (batch.type === 'single_file' && batch.file) {
            // 单文件批次
            fileInfo.files = [{
                path: batch.file.path,
                tokenCount: batch.file.tokenCount,
                importance: batch.file.importance || 0,
                complexity: batch.file.complexity || 0
            }];
        } else if (batch.type === 'large_file_chunk' && batch.parentFileInfo) {
            // 大文件分割批次
            fileInfo.files = [{
                path: batch.parentFileInfo.path,
                tokenCount: batch.chunkInfo?.estimatedTokens || 0,
                isChunk: true,
                chunkIndex: batch.chunkInfo?.chunkIndex || 1,
                totalChunks: batch.chunkInfo?.totalChunks || 1,
                parentTokens: batch.parentFileInfo.totalTokens
            }];
        } else if (batch.type === 'error_recovery' && batch.file) {
            // 错误处理批次
            fileInfo.files = [{
                path: batch.file.path,
                tokenCount: 0,
                hasError: true,
                errorReason: batch.reason
            }];
        }

        return fileInfo;
    }

    /**
     * 生成任务元数据
     * @private
     */
    _generateTaskMetadata(batch, projectMetadata) {
        const metadata = {
            batchMetadata: batch.metadata || {},
            projectContext: {
                projectName: projectMetadata.projectName || '',
                language: projectMetadata.languageProfile?.primary || 'unknown',
                framework: projectMetadata.languageProfile?.frameworks?.[0] || 'unknown'
            }
        };

        // 添加特定类型的元数据
        switch (batch.type) {
            case 'combined_files':
                metadata.combinedFilesInfo = {
                    directories: batch.metadata?.directories || [],
                    extensions: batch.metadata?.extensions || [],
                    avgTokensPerFile: batch.metadata?.avgTokensPerFile || 0
                };
                break;
            
            case 'single_file':
                metadata.singleFileInfo = {
                    fileName: batch.metadata?.fileName || '',
                    directory: batch.metadata?.directory || '',
                    language: batch.metadata?.language || 'unknown',
                    isEntryPoint: batch.metadata?.isEntryPoint || false
                };
                break;
            
            case 'large_file_chunk':
                metadata.chunkInfo = {
                    parentFile: batch.metadata?.parentFile || {},
                    chunkDetails: batch.metadata?.chunk || {},
                    splitQuality: batch.splitQuality || 0
                };
                break;
        }

        return metadata;
    }

    /**
     * 估算任务持续时间
     * @private
     */
    _estimateTaskDuration(batch) {
        let baseDuration = 30; // 基础时间（秒）

        // 根据Token数量调整
        if (batch.estimatedTokens) {
            baseDuration += Math.min(batch.estimatedTokens / 1000, 60);
        }

        // 根据文件数量调整
        baseDuration += (batch.fileCount || 1) * 10;

        // 根据类型调整
        const typeMultipliers = {
            'combined_files': 1.2,
            'single_file': 1.0,
            'large_file_chunk': 1.3,
            'error_recovery': 0.5
        };

        baseDuration *= typeMultipliers[batch.type] || 1.0;

        return Math.round(baseDuration);
    }

    /**
     * 分析任务依赖关系
     * @private
     */
    _analyzeDependencies(tasks, projectMetadata) {
        const tasksWithDeps = tasks.map(task => ({
            ...task,
            dependencies: {
                predecessors: [],
                successors: [],
                relatedTasks: []
            }
        }));

        // 分析大文件分割任务的顺序依赖
        this._analyzeLargeFileChunkDependencies(tasksWithDeps);

        // 分析文件级依赖关系
        this._analyzeFileDependencies(tasksWithDeps, projectMetadata);

        return tasksWithDeps;
    }

    /**
     * 分析大文件分割任务依赖
     * @private
     */
    _analyzeLargeFileChunkDependencies(tasks) {
        const chunkGroups = {};

        // 按父文件分组
        tasks.forEach(task => {
            if (task.type === 'large_file_chunk') {
                const parentPath = task.fileInfo.files[0]?.path;
                if (parentPath) {
                    if (!chunkGroups[parentPath]) {
                        chunkGroups[parentPath] = [];
                    }
                    chunkGroups[parentPath].push(task);
                }
            }
        });

        // 为每组设置顺序依赖
        Object.values(chunkGroups).forEach(chunks => {
            chunks.sort((a, b) => {
                const aChunk = a.fileInfo.files[0]?.chunkIndex || 0;
                const bChunk = b.fileInfo.files[0]?.chunkIndex || 0;
                return aChunk - bChunk;
            });

            // 设置前后依赖关系
            for (let i = 1; i < chunks.length; i++) {
                chunks[i].dependencies.predecessors.push(chunks[i - 1].taskId);
                chunks[i - 1].dependencies.successors.push(chunks[i].taskId);
            }
        });
    }

    /**
     * 分析文件依赖关系
     * @private
     */
    _analyzeFileDependencies(tasks, projectMetadata) {
        // 简单实现：基于文件路径和导入关系
        tasks.forEach(task => {
            const taskFiles = task.fileInfo.files.map(f => f.path);
            
            tasks.forEach(otherTask => {
                if (task.taskId === otherTask.taskId) return;
                
                const otherFiles = otherTask.fileInfo.files.map(f => f.path);
                
                // 检查是否有文件层面的关联
                if (this._hasFileRelationship(taskFiles, otherFiles)) {
                    task.dependencies.relatedTasks.push(otherTask.taskId);
                }
            });
        });
    }

    /**
     * 检查文件关系
     * @private
     */
    _hasFileRelationship(files1, files2) {
        // 简单实现：检查是否在同一目录
        const dirs1 = files1.map(f => f.split('/').slice(0, -1).join('/'));
        const dirs2 = files2.map(f => f.split('/').slice(0, -1).join('/'));
        
        return dirs1.some(dir => dirs2.includes(dir));
    }

    /**
     * 优化任务优先级
     * @private
     */
    _optimizePriorities(tasks, projectMetadata) {
        const optimizedTasks = tasks.map(task => {
            const priority = this._calculateTaskPriority(task, projectMetadata);
            return {
                ...task,
                priority: {
                    ...task.priority,
                    calculatedPriority: priority.total,
                    factors: priority.factors
                }
            };
        });

        // 按优先级排序
        return optimizedTasks.sort((a, b) => b.priority.calculatedPriority - a.priority.calculatedPriority);
    }

    /**
     * 计算任务优先级
     * @private
     */
    _calculateTaskPriority(task, projectMetadata) {
        const factors = {};
        let total = task.priority.basePriority;

        // 文件重要性因子
        const fileImportance = this._calculateFileImportanceFactor(task);
        factors.fileImportance = fileImportance;
        total += fileImportance * this.priorityWeights.fileImportance;

        // Token数量因子
        const tokenFactor = Math.min((task.batchInfo.estimatedTokens || 0) / 10000, 5);
        factors.tokenCount = tokenFactor;
        total += tokenFactor * this.priorityWeights.tokenCount;

        // 复杂度因子
        const complexityFactor = this._calculateComplexityFactor(task);
        factors.complexity = complexityFactor;
        total += complexityFactor * this.priorityWeights.complexity;

        // 依赖关系因子
        const dependencyFactor = this._calculateDependencyFactor(task);
        factors.dependencies = dependencyFactor;
        total += dependencyFactor * this.priorityWeights.dependencies;

        // 紧急程度因子
        const urgencyFactor = this._calculateUrgencyFactor(task);
        factors.urgency = urgencyFactor;
        total += urgencyFactor * this.priorityWeights.urgency;

        return {
            total: Math.round(total * 10) / 10,
            factors
        };
    }

    /**
     * 计算文件重要性因子
     * @private
     */
    _calculateFileImportanceFactor(task) {
        let importance = 0;

        task.fileInfo.files.forEach(file => {
            const path = file.path.toLowerCase();
            
            if (path.includes('index.')) importance += 5;
            if (path.includes('main.')) importance += 4;
            if (path.includes('app.')) importance += 4;
            if (path.includes('server.')) importance += 3;
            if (path.includes('config')) importance += 2;
            if (path.includes('test')) importance -= 2;
            
            // 使用文件自身的重要性评分
            if (file.importance) {
                importance += file.importance / 10;
            }
        });

        return Math.min(importance, 10);
    }

    /**
     * 计算复杂度因子
     * @private
     */
    _calculateComplexityFactor(task) {
        let complexity = 0;

        if (task.type === 'large_file_chunk') {
            complexity += 3;
            if (task.reconstructionInfo) complexity += 1;
        }

        if (task.type === 'combined_files') {
            complexity += Math.min(task.fileInfo.totalFiles * 0.5, 3);
        }

        task.fileInfo.files.forEach(file => {
            if (file.complexity) {
                complexity += file.complexity / 20;
            }
        });

        return Math.min(complexity, 8);
    }

    /**
     * 计算依赖关系因子
     * @private
     */
    _calculateDependencyFactor(task) {
        let factor = 0;

        if (task.dependencies) {
            // 有前置依赖的任务优先级降低
            factor -= task.dependencies.predecessors.length * 0.5;
            
            // 有后续任务的优先级提升
            factor += task.dependencies.successors.length * 0.3;
            
            // 相关任务数量
            factor += Math.min(task.dependencies.relatedTasks.length * 0.2, 2);
        }

        return Math.max(factor, -3);
    }

    /**
     * 计算紧急程度因子
     * @private
     */
    _calculateUrgencyFactor(task) {
        let urgency = 0;

        // 错误恢复任务优先级较低
        if (task.type === 'error_recovery') {
            urgency -= 2;
        }

        // 大文件第一个分片优先级较高
        if (task.type === 'large_file_chunk') {
            const chunkIndex = task.fileInfo.files[0]?.chunkIndex || 1;
            if (chunkIndex === 1) urgency += 2;
        }

        // 入口文件优先级较高
        if (task.metadata?.singleFileInfo?.isEntryPoint) {
            urgency += 1;
        }

        return urgency;
    }

    /**
     * 生成执行计划
     * @private
     */
    _generateExecutionPlan(tasks, config) {
        const plan = {
            totalTasks: tasks.length,
            estimatedTotalTime: tasks.reduce((sum, task) => sum + task.estimatedDuration, 0),
            phases: this._groupTasksIntoPhases(tasks),
            processingOrder: tasks.map(task => ({
                taskId: task.taskId,
                order: task.sequentialId,
                estimatedDuration: task.estimatedDuration,
                priority: task.priority.calculatedPriority
            })),
            parallelizationOpportunities: this._identifyParallelization(tasks)
        };

        return plan;
    }

    /**
     * 将任务分组到阶段
     * @private
     */
    _groupTasksIntoPhases(tasks) {
        const phases = {
            immediate: [], // 可立即执行
            dependent: [], // 有依赖关系
            cleanup: []    // 清理和错误处理
        };

        tasks.forEach(task => {
            if (task.type === 'error_recovery') {
                phases.cleanup.push(task.taskId);
            } else if (task.dependencies?.predecessors?.length > 0) {
                phases.dependent.push(task.taskId);
            } else {
                phases.immediate.push(task.taskId);
            }
        });

        return phases;
    }

    /**
     * 识别并行化机会
     * @private
     */
    _identifyParallelization(tasks) {
        const opportunities = [];
        
        // 查找可并行执行的任务组
        const independentTasks = tasks.filter(task => 
            !task.dependencies?.predecessors?.length
        );

        if (independentTasks.length > 1) {
            opportunities.push({
                type: 'independent_tasks',
                taskIds: independentTasks.map(t => t.taskId),
                estimatedTimeSaving: Math.round(
                    independentTasks.reduce((sum, t) => sum + t.estimatedDuration, 0) * 0.3
                )
            });
        }

        return opportunities;
    }

    /**
     * 生成摘要信息
     * @private
     */
    _generateSummary(tasks, executionPlan) {
        const typeDistribution = {};
        const priorityDistribution = { high: 0, medium: 0, low: 0 };

        tasks.forEach(task => {
            // 类型分布
            typeDistribution[task.type] = (typeDistribution[task.type] || 0) + 1;
            
            // 优先级分布
            const priority = task.priority.calculatedPriority;
            if (priority >= 8) priorityDistribution.high++;
            else if (priority >= 5) priorityDistribution.medium++;
            else priorityDistribution.low++;
        });

        return {
            taskCount: {
                total: tasks.length,
                byType: typeDistribution,
                byPriority: priorityDistribution
            },
            processing: {
                estimatedTotalTime: executionPlan.estimatedTotalTime,
                averageTaskTime: Math.round(executionPlan.estimatedTotalTime / tasks.length),
                parallelizationPotential: executionPlan.parallelizationOpportunities.length > 0
            },
            fileStats: {
                totalFiles: tasks.reduce((sum, task) => sum + task.fileInfo.totalFiles, 0),
                totalTokens: tasks.reduce((sum, task) => sum + task.batchInfo.estimatedTokens, 0),
                averageTokensPerTask: Math.round(
                    tasks.reduce((sum, task) => sum + task.batchInfo.estimatedTokens, 0) / tasks.length
                )
            }
        };
    }

    /**
     * 获取生成器状态
     */
    getGeneratorStatus() {
        return {
            name: 'TaskDefinitionGenerator',
            version: '1.0.0',
            config: this.config,
            supportedTaskTypes: Object.keys(this.taskTypes),
            isReady: true
        };
    }
}

export default TaskDefinitionGenerator;