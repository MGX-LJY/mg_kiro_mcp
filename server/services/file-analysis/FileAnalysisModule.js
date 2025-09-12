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

import { TokenResultHelper, TokenResultFactory } from '../../interfaces/TokenResult.js';
import { ErrorResultFactory } from '../../interfaces/ErrorResult.js';
import { TaskDefinitionFactory, TaskDefinitionHelper } from '../../interfaces/TaskDefinition.js';
import { LoggerFactory } from '../../utils/Logger.js';

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
        
        this.progressTracker = null; // 暂时不需要
        this.serviceBus = serviceBus;
        
        // 任务定义存储
        this.taskDefinitionStorage = new Map(); // taskId -> taskDefinition
        this.projectTaskMapping = new Map();    // projectPath -> Set of taskIds

        // 初始化Logger
        this.logger = LoggerFactory.getLogger('FileAnalysisModule');
        this.logger.info('FileAnalysisModule初始化', {
            smallFileThreshold: this.config.smallFileThreshold,
            largeFileThreshold: this.config.largeFileThreshold,
            batchTargetSize: this.config.batchTargetSize,
            maxBatchSize: this.config.maxBatchSize,
            hasTokenCalculator: !!this.tokenCalculator,
            hasServiceBus: !!serviceBus
        });
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
        const requestId = this.logger.generateRequestId();
        const timerId = this.logger.methodStart('analyzeProject', { 
            projectPath, 
            fileCount: fileList?.length, 
            hasProjectMetadata: !!projectMetadata 
        });
        
        this.logger.info('开始项目分析', {
            projectPath,
            fileCount: fileList?.length,
            languageProfile: projectMetadata?.languageProfile?.primary,
            projectType: projectMetadata?.projectType,
            requestId
        });
        
        // 防护性检查参数
        if (!projectPath || typeof projectPath !== 'string') {
            const error = new Error('Invalid projectPath provided');
            this.logger.methodError(timerId, 'analyzeProject', error, { 
                projectPath: typeof projectPath,
                validation: 'projectPath_invalid'
            });
            throw error;
        }
        
        if (!fileList || !Array.isArray(fileList)) {
            const error = new Error('Invalid fileList provided: must be an array');
            this.logger.methodError(timerId, 'analyzeProject', error, { 
                fileList: typeof fileList,
                validation: 'fileList_invalid'
            });
            throw error;
        }
        
        if (!projectMetadata || typeof projectMetadata !== 'object') {
            const error = new Error('Invalid projectMetadata provided');
            this.logger.methodError(timerId, 'analyzeProject', error, { 
                projectMetadata: typeof projectMetadata,
                validation: 'projectMetadata_invalid'
            });
            throw error;
        }
        
        this.logger.debug('参数验证通过', {
            projectPath,
            fileCount: fileList.length,
            projectMetadataKeys: Object.keys(projectMetadata),
            optionsKeys: Object.keys(options)
        });
        
        const startTime = Date.now();
        
        try {
            // Step 1: 分析文件Token数量
            this.logger.info('Step 1: 开始文件Token分析', { fileCount: fileList.length });
            const fileAnalyses = await this._analyzeFileTokens(projectPath, fileList, projectMetadata);
            this.logger.info('Step 1: 文件Token分析完成', { 
                analysisCount: fileAnalyses.length,
                successCount: fileAnalyses.filter(a => !a.analysisError).length,
                errorCount: fileAnalyses.filter(a => a.analysisError).length
            });
            
            // Step 2: 文件分类
            this.logger.info('Step 2: 开始文件分类');
            const fileCategories = this._categorizeFiles(fileAnalyses);
            this.logger.info('Step 2: 文件分类完成', {
                smallFiles: fileCategories.small.length,
                mediumFiles: fileCategories.medium.length,
                largeFiles: fileCategories.large.length,
                errorFiles: fileCategories.error.length
            });
            
            // Step 3: 生成批次计划
            this.logger.info('Step 3: 开始批次计划生成');
            const batchPlans = await this._generateBatchPlans(fileCategories, projectPath);
            this.logger.info('Step 3: 批次计划生成完成', {
                combinedBatches: batchPlans.combinedBatches.length,
                singleBatches: batchPlans.singleBatches.length,
                multiBatches: batchPlans.multiBatches.length,
                errorHandling: batchPlans.errorHandling.length
            });
            
            // Step 4: 创建任务定义
            this.logger.info('Step 4: 开始任务定义创建');
            const taskDefinitions = await this._createTaskDefinitions(batchPlans, projectMetadata);
            this.logger.info('Step 4: 任务定义创建完成', { 
                taskCount: taskDefinitions.length 
            });
            
            // Step 4.1: 存储任务定义供后续查询
            this.logger.debug('Step 4.1: 存储任务定义');
            const storeResult = this._storeTaskDefinitions(taskDefinitions, projectPath);
            this.logger.debug('Step 4.1: 任务定义存储完成', { success: storeResult });
            
            // Step 5: 生成处理策略总结
            this.logger.debug('Step 5: 生成策略总结');
            const strategySummary = this._generateStrategySummary(fileCategories, batchPlans);
            
            const processingTime = Date.now() - startTime;
            this.logger.info('项目分析完成', {
                processingTimeMs: processingTime,
                totalFiles: fileList.length,
                totalTasks: taskDefinitions.length,
                strategySummary: {
                    totalBatches: strategySummary.batchDistribution.total,
                    averageFilesPerBatch: strategySummary.strategyEfficiency.averageFilesPerBatch
                }
            });
            
            return {
                success: true,
                data: {
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
            
            return ErrorResultFactory.createAnalysisError(
                error.message,
                {
                    service: 'FileAnalysisModule',
                    method: 'analyzeProject',
                    projectPath,
                    timestamp: new Date().toISOString()
                }
            );
        }
    }

    /**
     * 分析文件Token数量
     * @private
     */
    async _analyzeFileTokens(projectPath, fileList, projectMetadata) {
        const timerId = this.logger.methodStart('_analyzeFileTokens', {
            projectPath,
            fileCount: fileList?.length,
            hasProjectMetadata: !!projectMetadata
        });
        
        const fileAnalyses = [];
        
        // 防护性检查
        if (!fileList || !Array.isArray(fileList)) {
            this.logger.warn('fileList参数无效', {
                fileListType: typeof fileList,
                isArray: Array.isArray(fileList)
            });
            this.logger.methodEnd(timerId, '_analyzeFileTokens', { fileCount: 0, errorCount: 0 });
            return fileAnalyses;
        }
        
        if (!this.tokenCalculator) {
            const error = new Error('TokenCalculator is not available');
            this.logger.methodError(timerId, '_analyzeFileTokens', error, {
                dependency: 'tokenCalculator',
                available: !!this.tokenCalculator
            });
            throw error;
        }
        
        this.logger.info('开始文件Token分析', {
            fileCount: fileList.length,
            projectPath,
            hasTokenCalculator: !!this.tokenCalculator,
            hasCodeStructureAnalyzer: !!this.codeStructureAnalyzer
        });
        
        let successCount = 0;
        let errorCount = 0;
        let totalTokens = 0;
        
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const fileTimerId = this.logger.methodStart('analyzeFile', {
                fileName: file?.name,
                filePath: file?.path,
                fileIndex: i + 1,
                totalFiles: fileList.length
            });
            
            try {
                // 防护性检查文件对象
                if (!file || typeof file !== 'object') {
                    this.logger.warn('跳过无效文件对象', {
                        fileIndex: i,
                        fileType: typeof file,
                        file: file
                    });
                    continue;
                }
                
                this.logger.debug('分析文件', {
                    filePath: file.path,
                    fileSize: file.size,
                    isSourceCode: file.isSourceCode,
                    language: file.language,
                    hasContent: !!file.content
                });
                
                // 计算精确Token数量
                const tokenCount = await this.tokenCalculator.calculateTokens(
                    file.path, 
                    file.content || null,
                    projectMetadata.languageProfile
                );
                
                const actualTokens = TokenResultHelper.getTokenCount(tokenCount);
                totalTokens += actualTokens;
                
                this.logger.debug('Token计算完成', {
                    filePath: file.path,
                    tokenCount: actualTokens,
                    calculationSuccess: TokenResultHelper.isSuccess(tokenCount),
                    calculationMethod: tokenCount?.metadata?.calculationMethod
                });
                
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
                
                this.logger.debug('代码结构分析完成', {
                    filePath: file.path,
                    hasAnalyzer: !!this.codeStructureAnalyzer,
                    complexity: codeStructure?.complexity,
                    functionsCount: codeStructure?.functions?.length,
                    classesCount: codeStructure?.classes?.length
                });
                
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
                
                successCount++;
                this.logger.methodEnd(fileTimerId, 'analyzeFile', {
                    success: true,
                    tokenCount: actualTokens
                });
                
                this.logger.info('文件分析成功', {
                    filePath: file.path,
                    tokenCount: actualTokens,
                    progress: `${i + 1}/${fileList.length}`,
                    progressPercent: Math.round(((i + 1) / fileList.length) * 100)
                });
                
            } catch (error) {
                errorCount++;
                this.logger.methodError(fileTimerId, 'analyzeFile', error, {
                    filePath: file?.path,
                    fileName: file?.name,
                    fileIndex: i,
                    errorType: error.name,
                    errorCode: error.code
                });
                
                this.logger.warn('文件分析失败', {
                    filePath: file?.path,
                    errorMessage: error.message,
                    progress: `${i + 1}/${fileList.length}`
                });
                
                // ✅ 修复：添加错误标记的文件分析，只保存必要元数据
                fileAnalyses.push({
                    path: file.path,
                    name: file.name,
                    size: file.size,
                    extension: file.extension,
                    isSourceCode: file.isSourceCode,
                    language: file.language,
                    // 错误处理结果 - 使用统一TokenResult格式
                    tokenCount: TokenResultFactory.createErrorTokenResult(file.path, error.message),
                    codeStructure: null,
                    analysisError: error.message,
                    analysisTimestamp: new Date().toISOString()
                    // 注意：不包含 file.content，避免文件过大
                });
            }
        }
        
        this.logger.methodEnd(timerId, '_analyzeFileTokens', {
            totalFiles: fileList.length,
            successCount,
            errorCount,
            totalTokens,
            successRate: Math.round((successCount / fileList.length) * 100)
        });
        
        this.logger.info('文件Token分析完成', {
            总文件数: fileList.length,
            成功分析: successCount,
            分析失败: errorCount,
            总Token数: totalTokens,
            成功率: `${Math.round((successCount / fileList.length) * 100)}%`
        });
        
        return fileAnalyses;
    }

    /**
     * 文件分类：根据Token数量分配处理策略
     * @private
     */
    _categorizeFiles(fileAnalyses) {
        const timerId = this.logger.methodStart('_categorizeFiles', {
            fileCount: fileAnalyses?.length,
            smallThreshold: this.config.smallFileThreshold,
            largeThreshold: this.config.largeFileThreshold
        });
        
        const categories = {
            small: [],      // <15K tokens - 综合文件批次策略
            medium: [],     // 15K-20K tokens - 单文件单批次策略
            large: [],      // >20K tokens - 大文件多批次策略
            error: []       // 分析出错的文件
        };
        
        this.logger.info('开始文件分类', {
            fileCount: fileAnalyses?.length,
            smallThreshold: this.config.smallFileThreshold,
            mediumThreshold: this.config.largeFileThreshold,
            策略说明: {
                small: '综合文件批次策略',
                medium: '单文件单批次策略', 
                large: '大文件多批次策略'
            }
        });
        
        let tokenDistribution = {
            minTokens: Infinity,
            maxTokens: 0,
            totalTokens: 0,
            validFileCount: 0
        };
        
        for (let i = 0; i < fileAnalyses.length; i++) {
            const analysis = fileAnalyses[i];
            
            this.logger.debug('分析文件分类', {
                filePath: analysis.path,
                fileIndex: i + 1,
                totalFiles: fileAnalyses.length,
                hasAnalysisError: !!analysis.analysisError
            });
            
            if (analysis.analysisError) {
                this.logger.warn('文件分析错误，归类为错误文件', {
                    filePath: analysis.path,
                    errorMessage: analysis.analysisError,
                    fileSize: analysis.size,
                    language: analysis.language
                });
                categories.error.push(analysis);
                continue;
            }
            
            // 使用TokenResultHelper统一提取Token数量
            const actualTokenCount = TokenResultHelper.getTokenCount(analysis.tokenCount);
            
            // 更新Token分布统计
            tokenDistribution.validFileCount++;
            tokenDistribution.totalTokens += actualTokenCount;
            tokenDistribution.minTokens = Math.min(tokenDistribution.minTokens, actualTokenCount);
            tokenDistribution.maxTokens = Math.max(tokenDistribution.maxTokens, actualTokenCount);
            
            let category;
            let strategyReason;
            
            if (actualTokenCount < this.config.smallFileThreshold) {
                categories.small.push(analysis);
                category = 'small';
                strategyReason = '文件较小，适合与其他文件组合批处理';
            } else if (actualTokenCount < this.config.largeFileThreshold) {
                categories.medium.push(analysis);
                category = 'medium';
                strategyReason = '中等大小文件，适合单独批处理';
            } else {
                categories.large.push(analysis);
                category = 'large';
                strategyReason = '大文件，需要分块多批次处理';
            }
            
            this.logger.debug('文件分类决策', {
                filePath: analysis.path,
                tokenCount: actualTokenCount,
                category: category,
                strategyReason: strategyReason,
                fileSize: analysis.size,
                language: analysis.language,
                isSourceCode: analysis.isSourceCode
            });
            
            this.logger.trace('文件分类详情', {
                filePath: analysis.path,
                分类: category,
                Token数量: actualTokenCount,
                小文件阈值: this.config.smallFileThreshold,
                大文件阈值: this.config.largeFileThreshold,
                处理策略: strategyReason
            });
        }
        
        // 计算平均Token数
        const avgTokens = tokenDistribution.validFileCount > 0 
            ? Math.round(tokenDistribution.totalTokens / tokenDistribution.validFileCount) 
            : 0;
        
        const categoryStats = {
            small: categories.small.length,
            medium: categories.medium.length,
            large: categories.large.length,
            error: categories.error.length,
            total: fileAnalyses.length
        };
        
        this.logger.methodEnd(timerId, '_categorizeFiles', {
            ...categoryStats,
            tokenStats: {
                ...tokenDistribution,
                avgTokens,
                minTokens: tokenDistribution.minTokens === Infinity ? 0 : tokenDistribution.minTokens
            }
        });
        
        this.logger.info('文件分类完成', {
            分类结果: categoryStats,
            Token统计: {
                最小Token: tokenDistribution.minTokens === Infinity ? 0 : tokenDistribution.minTokens,
                最大Token: tokenDistribution.maxTokens,
                平均Token: avgTokens,
                总Token数: tokenDistribution.totalTokens,
                有效文件数: tokenDistribution.validFileCount
            },
            处理策略分布: {
                综合批次: `${categories.small.length}个文件`,
                单文件批次: `${categories.medium.length}个文件`,
                多批次处理: `${categories.large.length}个文件`,
                错误处理: `${categories.error.length}个文件`
            }
        });
        
        // 记录潜在的优化建议
        if (categories.large.length > categories.small.length + categories.medium.length) {
            this.logger.warn('大文件过多警告', {
                largeFileCount: categories.large.length,
                totalValidFiles: tokenDistribution.validFileCount,
                largeFileRatio: Math.round((categories.large.length / tokenDistribution.validFileCount) * 100),
                建议: '考虑调整大文件阈值或优化文件结构'
            });
        }
        
        if (categories.error.length > tokenDistribution.validFileCount * 0.1) {
            this.logger.warn('错误文件过多警告', {
                errorFileCount: categories.error.length,
                totalFiles: fileAnalyses.length,
                errorRate: Math.round((categories.error.length / fileAnalyses.length) * 100),
                建议: '检查文件读取和Token计算逻辑'
            });
        }
        
        return categories;
    }

    /**
     * 生成批次计划
     * @private
     */
    async _generateBatchPlans(fileCategories, projectPath) {
        const timerId = this.logger.methodStart('_generateBatchPlans', {
            projectPath,
            smallFiles: fileCategories.small?.length || 0,
            mediumFiles: fileCategories.medium?.length || 0,
            largeFiles: fileCategories.large?.length || 0,
            errorFiles: fileCategories.error?.length || 0
        });
        
        const plans = {
            combinedBatches: [],
            singleBatches: [],
            multiBatches: [],
            errorHandling: []
        };
        
        this.logger.info('开始生成批次计划', {
            文件分类统计: {
                小文件: fileCategories.small?.length || 0,
                中文件: fileCategories.medium?.length || 0,
                大文件: fileCategories.large?.length || 0,
                错误文件: fileCategories.error?.length || 0
            },
            策略配置: {
                batchTargetSize: this.config.batchTargetSize,
                maxBatchSize: this.config.maxBatchSize
            }
        });
        
        let totalEstimatedTokens = 0;
        let totalBatches = 0;
        
        // 综合文件批次策略
        if (fileCategories.small.length > 0) {
            const strategyTimerId = this.logger.methodStart('combinedBatchStrategy', {
                fileCount: fileCategories.small.length,
                strategy: 'combined'
            });
            
            this.logger.info('执行综合文件批次策略', {
                targetFiles: fileCategories.small.length,
                strategy: 'CombinedFileBatchStrategy',
                targetSize: this.config.batchTargetSize
            });
            
            try {
                plans.combinedBatches = await this.batchStrategies.combined.generateBatches(
                    fileCategories.small, 
                    this.config
                );
                
                const combinedTokens = plans.combinedBatches.reduce((sum, batch) => sum + (batch.estimatedTokens || 0), 0);
                totalEstimatedTokens += combinedTokens;
                totalBatches += plans.combinedBatches.length;
                
                this.logger.methodEnd(strategyTimerId, 'combinedBatchStrategy', {
                    batchCount: plans.combinedBatches.length,
                    totalTokens: combinedTokens,
                    averageTokensPerBatch: plans.combinedBatches.length > 0 ? Math.round(combinedTokens / plans.combinedBatches.length) : 0
                });
                
                this.logger.info('综合文件批次策略完成', {
                    输入文件: fileCategories.small.length,
                    生成批次: plans.combinedBatches.length,
                    估计Token: combinedTokens,
                    平均每批Token: plans.combinedBatches.length > 0 ? Math.round(combinedTokens / plans.combinedBatches.length) : 0
                });
                
            } catch (error) {
                this.logger.methodError(strategyTimerId, 'combinedBatchStrategy', error, {
                    fileCount: fileCategories.small.length,
                    strategy: 'combined'
                });
                
                this.logger.error('综合文件批次策略失败', error, {
                    fileCount: fileCategories.small.length,
                    errorType: error.name
                });
            }
        } else {
            this.logger.debug('跳过综合文件批次策略', { reason: '无小文件需要处理' });
        }
        
        // 单文件单批次策略
        if (fileCategories.medium.length > 0) {
            const strategyTimerId = this.logger.methodStart('singleBatchStrategy', {
                fileCount: fileCategories.medium.length,
                strategy: 'single'
            });
            
            this.logger.info('执行单文件单批次策略', {
                targetFiles: fileCategories.medium.length,
                strategy: 'SingleFileBatchStrategy'
            });
            
            try {
                plans.singleBatches = await this.batchStrategies.single.generateBatches(
                    fileCategories.medium,
                    this.config
                );
                
                const singleTokens = plans.singleBatches.reduce((sum, batch) => sum + (batch.estimatedTokens || 0), 0);
                totalEstimatedTokens += singleTokens;
                totalBatches += plans.singleBatches.length;
                
                this.logger.methodEnd(strategyTimerId, 'singleBatchStrategy', {
                    batchCount: plans.singleBatches.length,
                    totalTokens: singleTokens,
                    averageTokensPerBatch: plans.singleBatches.length > 0 ? Math.round(singleTokens / plans.singleBatches.length) : 0
                });
                
                this.logger.info('单文件单批次策略完成', {
                    输入文件: fileCategories.medium.length,
                    生成批次: plans.singleBatches.length,
                    估计Token: singleTokens,
                    平均每批Token: plans.singleBatches.length > 0 ? Math.round(singleTokens / plans.singleBatches.length) : 0
                });
                
            } catch (error) {
                this.logger.methodError(strategyTimerId, 'singleBatchStrategy', error, {
                    fileCount: fileCategories.medium.length,
                    strategy: 'single'
                });
                
                this.logger.error('单文件单批次策略失败', error, {
                    fileCount: fileCategories.medium.length,
                    errorType: error.name
                });
            }
        } else {
            this.logger.debug('跳过单文件单批次策略', { reason: '无中等文件需要处理' });
        }
        
        // 大文件多批次策略
        if (fileCategories.large.length > 0) {
            const strategyTimerId = this.logger.methodStart('largeMultiBatchStrategy', {
                fileCount: fileCategories.large.length,
                strategy: 'largeMulti',
                projectPath
            });
            
            this.logger.info('执行大文件多批次策略', {
                targetFiles: fileCategories.large.length,
                strategy: 'LargeFileMultiBatchStrategy',
                projectPath: projectPath
            });
            
            try {
                plans.multiBatches = await this.batchStrategies.largeMulti.generateBatches(
                    fileCategories.large,
                    this.config,
                    projectPath
                );
                
                const multiTokens = plans.multiBatches.reduce((sum, batch) => sum + (batch.estimatedTokens || 0), 0);
                totalEstimatedTokens += multiTokens;
                totalBatches += plans.multiBatches.length;
                
                // 计算分块统计
                const chunkStats = plans.multiBatches.reduce((stats, batch) => {
                    if (batch.type === 'large_file_chunk' && batch.chunkInfo) {
                        const fileKey = batch.parentFileInfo?.path || 'unknown';
                        if (!stats[fileKey]) {
                            stats[fileKey] = { chunks: 0, totalTokens: 0 };
                        }
                        stats[fileKey].chunks++;
                        stats[fileKey].totalTokens += batch.estimatedTokens || 0;
                    }
                    return stats;
                }, {});
                
                this.logger.methodEnd(strategyTimerId, 'largeMultiBatchStrategy', {
                    batchCount: plans.multiBatches.length,
                    totalTokens: multiTokens,
                    averageTokensPerBatch: plans.multiBatches.length > 0 ? Math.round(multiTokens / plans.multiBatches.length) : 0,
                    chunkStats
                });
                
                this.logger.info('大文件多批次策略完成', {
                    输入文件: fileCategories.large.length,
                    生成批次: plans.multiBatches.length,
                    估计Token: multiTokens,
                    平均每批Token: plans.multiBatches.length > 0 ? Math.round(multiTokens / plans.multiBatches.length) : 0,
                    分块统计: Object.keys(chunkStats).map(file => ({
                        文件: file.split('/').pop(),
                        分块数: chunkStats[file].chunks,
                        Token数: chunkStats[file].totalTokens
                    }))
                });
                
            } catch (error) {
                this.logger.methodError(strategyTimerId, 'largeMultiBatchStrategy', error, {
                    fileCount: fileCategories.large.length,
                    strategy: 'largeMulti',
                    projectPath
                });
                
                this.logger.error('大文件多批次策略失败', error, {
                    fileCount: fileCategories.large.length,
                    errorType: error.name,
                    projectPath
                });
            }
        } else {
            this.logger.debug('跳过大文件多批次策略', { reason: '无大文件需要处理' });
        }
        
        // 错误处理策略
        if (fileCategories.error.length > 0) {
            this.logger.warn('生成错误处理计划', {
                errorFileCount: fileCategories.error.length,
                strategy: 'manual_review'
            });
            
            plans.errorHandling = fileCategories.error.map(file => {
                this.logger.debug('创建错误恢复任务', {
                    filePath: file.path,
                    errorMessage: file.analysisError,
                    fileSize: file.size,
                    language: file.language
                });
                
                return {
                    type: 'error_recovery',
                    file: file,
                    strategy: 'manual_review',
                    reason: file.analysisError
                };
            });
            
            this.logger.info('错误处理计划完成', {
                错误文件数: fileCategories.error.length,
                处理策略: 'manual_review',
                需要手动处理的文件: fileCategories.error.map(f => f.path.split('/').pop())
            });
        } else {
            this.logger.debug('无错误文件', { reason: '所有文件分析成功' });
        }
        
        this.logger.methodEnd(timerId, '_generateBatchPlans', {
            totalBatches,
            totalEstimatedTokens,
            combinedBatches: plans.combinedBatches.length,
            singleBatches: plans.singleBatches.length,
            multiBatches: plans.multiBatches.length,
            errorHandling: plans.errorHandling.length,
            averageTokensPerBatch: totalBatches > 0 ? Math.round(totalEstimatedTokens / totalBatches) : 0
        });
        
        this.logger.info('批次计划生成完成', {
            批次计划摘要: {
                综合批次: plans.combinedBatches.length,
                单文件批次: plans.singleBatches.length,
                多分块批次: plans.multiBatches.length,
                错误处理: plans.errorHandling.length,
                总批次数: totalBatches
            },
            Token估算: {
                总Token数: totalEstimatedTokens,
                平均每批Token: totalBatches > 0 ? Math.round(totalEstimatedTokens / totalBatches) : 0
            },
            处理效率评估: this._evaluateBatchEfficiency(plans, fileCategories)
        });
        
        return plans;
    }

    /**
     * 评估批次效率
     * @private
     */
    _evaluateBatchEfficiency(plans, fileCategories) {
        const totalFiles = fileCategories.small.length + fileCategories.medium.length + fileCategories.large.length;
        const totalBatches = plans.combinedBatches.length + plans.singleBatches.length + plans.multiBatches.length;
        
        return {
            文件利用率: totalFiles > 0 ? `${Math.round((totalFiles / (totalFiles + fileCategories.error.length)) * 100)}%` : '0%',
            批次密度: totalFiles > 0 ? Math.round(totalFiles / Math.max(totalBatches, 1) * 100) / 100 : 0,
            策略分布: {
                综合策略占比: totalBatches > 0 ? `${Math.round((plans.combinedBatches.length / totalBatches) * 100)}%` : '0%',
                单文件策略占比: totalBatches > 0 ? `${Math.round((plans.singleBatches.length / totalBatches) * 100)}%` : '0%',
                多批次策略占比: totalBatches > 0 ? `${Math.round((plans.multiBatches.length / totalBatches) * 100)}%` : '0%'
            }
        };
    }

    /**
     * 创建任务定义
     * @private
     */
    async _createTaskDefinitions(batchPlans, projectMetadata) {
        const timerId = this.logger.methodStart('_createTaskDefinitions', {
            combinedBatches: batchPlans.combinedBatches?.length || 0,
            singleBatches: batchPlans.singleBatches?.length || 0,
            multiBatches: batchPlans.multiBatches?.length || 0,
            projectPath: projectMetadata?.projectPath
        });
        
        const taskDefinitions = [];
        let taskCounter = 1;
        
        this.logger.info('开始生成任务定义', {
            批次计划统计: {
                综合批次: batchPlans.combinedBatches?.length || 0,
                单文件批次: batchPlans.singleBatches?.length || 0,
                多分块批次: batchPlans.multiBatches?.length || 0
            },
            项目信息: {
                projectPath: projectMetadata?.projectPath,
                languageProfile: projectMetadata?.languageProfile?.primary
            },
            使用接口: 'TaskDefinitionFactory + BatchResult统一接口'
        });
        
        // 统一处理所有批次类型
        const allBatches = [
            ...(batchPlans.combinedBatches || []),
            ...(batchPlans.singleBatches || []),
            ...(batchPlans.multiBatches || [])
        ];
        
        this.logger.debug('合并批次数据', {
            总批次数: allBatches.length,
            批次来源: {
                combined: batchPlans.combinedBatches?.length || 0,
                single: batchPlans.singleBatches?.length || 0,
                multi: batchPlans.multiBatches?.length || 0
            }
        });
        
        let taskCreationStats = {
            成功创建: 0,
            跳过无效: 0,
            大文件分块: 0,
            组合批次: 0,
            单文件批次: 0,
            总Token估算: 0
        };
        
        for (let i = 0; i < allBatches.length; i++) {
            const batch = allBatches[i];
            const batchTimerId = this.logger.methodStart('createTaskFromBatch', {
                batchId: batch.batchId,
                batchType: batch.type,
                batchIndex: i + 1,
                totalBatches: allBatches.length
            });
            
            try {
                // 统一验证：所有批次都应该有files数组和基础字段
                if (!batch.files || batch.files.length === 0) {
                    taskCreationStats.跳过无效++;
                    this.logger.warn('批次验证失败，跳过任务创建', {
                        batchId: batch.batchId,
                        batchType: batch.type,
                        hasFiles: !!batch.files,
                        filesLength: batch.files?.length || 0,
                        reason: 'files数组为空或不存在'
                    });
                    continue;
                }
                
                // 获取主要文件信息（用于元数据）
                const primaryFile = batch.files[0];
                
                this.logger.debug('开始创建任务定义', {
                    taskId: `task_${taskCounter}`,
                    batchId: batch.batchId,
                    batchType: batch.type,
                    fileCount: batch.files.length,
                    estimatedTokens: batch.estimatedTokens,
                    primaryFile: primaryFile?.path
                });
                
                // 创建统一的任务定义 - 使用TaskDefinitionFactory
                const taskDefinition = TaskDefinitionFactory.createTaskDefinition(
                    `task_${taskCounter}`,
                    FileAnalysisModule._mapBatchTypeToTaskType(batch.type),
                    batch.strategy || 'default',
                    batch.files.map(f => f.path),
                    batch.estimatedTokens,
                    {
                        batchId: batch.batchId,
                        projectPath: projectMetadata.projectPath,
                        fileInfo: {
                            path: primaryFile.path,
                            name: primaryFile.path.split('/').pop() || 'unknown',
                            size: primaryFile.size || 0,
                            language: primaryFile.language || 'javascript'
                        },
                        chunkingAdvice: batch.metadata?.processingHints || {
                            recommended: false,
                            strategy: 'default'
                        },
                        strategySpecific: {
                            fileCount: batch.fileCount,
                            batchType: batch.type
                        }
                    }
                );
                
                this.logger.debug('基础任务定义创建完成', {
                    taskId: taskDefinition.id,
                    taskType: taskDefinition.processingType,
                    strategy: taskDefinition.batchStrategy,
                    fileCount: taskDefinition.files.length
                });
                
                // 根据批次类型添加特殊元数据
                if (batch.type === 'large_file_chunk' && batch.chunkInfo) {
                    taskCreationStats.大文件分块++;
                    
                    TaskDefinitionHelper.addChunkInfo(taskDefinition, {
                        chunkIndex: batch.chunkInfo.chunkIndex,
                        totalChunks: batch.chunkInfo.totalChunks,
                        startLine: batch.chunkInfo.startLine,
                        endLine: batch.chunkInfo.endLine,
                        parentFileInfo: batch.parentFileInfo
                    });
                    
                    this.logger.info('创建大文件分块任务', {
                        taskId: taskDefinition.id,
                        batchId: batch.batchId,
                        分块信息: {
                            当前分块: batch.chunkInfo.chunkIndex,
                            总分块数: batch.chunkInfo.totalChunks,
                            行范围: `${batch.chunkInfo.startLine}-${batch.chunkInfo.endLine}`,
                            父文件: batch.parentFileInfo?.path
                        },
                        Token估算: batch.estimatedTokens
                    });
                    
                } else if (batch.type === 'combined_batch') {
                    taskCreationStats.组合批次++;
                    
                    TaskDefinitionHelper.addMultiFileInfo(taskDefinition, batch.files.map(f => ({
                        path: f.path,
                        tokenCount: TokenResultHelper.getTokenCount(f.tokenCount),
                        size: f.size,
                        language: f.language
                    })));
                    
                    this.logger.info('创建组合批次任务', {
                        taskId: taskDefinition.id,
                        batchId: batch.batchId,
                        文件信息: {
                            文件数量: batch.files.length,
                            文件列表: batch.files.map(f => f.path.split('/').pop()),
                            总Token: batch.files.reduce((sum, f) => sum + TokenResultHelper.getTokenCount(f.tokenCount), 0)
                        },
                        Token估算: batch.estimatedTokens
                    });
                    
                } else if (batch.type === 'single_batch') {
                    taskCreationStats.单文件批次++;
                    
                    TaskDefinitionHelper.addSingleFileInfo(taskDefinition, primaryFile);
                    
                    this.logger.info('创建单文件批次任务', {
                        taskId: taskDefinition.id,
                        batchId: batch.batchId,
                        文件信息: {
                            文件路径: primaryFile.path,
                            文件大小: primaryFile.size,
                            语言类型: primaryFile.language,
                            Token数: TokenResultHelper.getTokenCount(primaryFile.tokenCount)
                        },
                        Token估算: batch.estimatedTokens
                    });
                }
                
                taskDefinitions.push(taskDefinition);
                taskCreationStats.成功创建++;
                taskCreationStats.总Token估算 += batch.estimatedTokens || 0;
                taskCounter++;
                
                this.logger.methodEnd(batchTimerId, 'createTaskFromBatch', {
                    success: true,
                    taskId: taskDefinition.id,
                    batchType: batch.type,
                    estimatedTokens: batch.estimatedTokens
                });
                
                this.logger.debug('任务创建成功', {
                    taskId: taskDefinition.id,
                    进度: `${i + 1}/${allBatches.length}`,
                    当前成功数: taskCreationStats.成功创建
                });
                
            } catch (error) {
                this.logger.methodError(batchTimerId, 'createTaskFromBatch', error, {
                    batchId: batch?.batchId,
                    batchType: batch?.type,
                    batchIndex: i,
                    errorType: error.name
                });
                
                this.logger.warn('任务创建失败', {
                    batchId: batch?.batchId,
                    batchType: batch?.type,
                    errorMessage: error.message,
                    progress: `${i + 1}/${allBatches.length}`
                });
            }
        }
        
        this.logger.methodEnd(timerId, '_createTaskDefinitions', {
            totalTasks: taskDefinitions.length,
            ...taskCreationStats,
            成功率: allBatches.length > 0 ? Math.round((taskCreationStats.成功创建 / allBatches.length) * 100) : 0
        });
        
        this.logger.info('任务定义生成完成', {
            处理结果: {
                总批次数: allBatches.length,
                成功创建: taskCreationStats.成功创建,
                跳过无效: taskCreationStats.跳过无效,
                成功率: allBatches.length > 0 ? `${Math.round((taskCreationStats.成功创建 / allBatches.length) * 100)}%` : '0%'
            },
            任务类型分布: {
                大文件分块任务: taskCreationStats.大文件分块,
                组合批次任务: taskCreationStats.组合批次,
                单文件批次任务: taskCreationStats.单文件批次
            },
            Token统计: {
                总估算Token: taskCreationStats.总Token估算,
                平均每任务Token: taskCreationStats.成功创建 > 0 ? Math.round(taskCreationStats.总Token估算 / taskCreationStats.成功创建) : 0
            }
        });
        
        if (taskCreationStats.跳过无效 > 0) {
            this.logger.warn('任务创建警告', {
                跳过的批次数: taskCreationStats.跳过无效,
                跳过比例: allBatches.length > 0 ? `${Math.round((taskCreationStats.跳过无效 / allBatches.length) * 100)}%` : '0%',
                建议: '检查批次策略生成的数据格式是否正确'
            });
        }
        
        return taskDefinitions;
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
                return sum + TokenResultHelper.getTokenCount(file.tokenCount);
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
        const allBatches = [
            ...batchPlans.combinedBatches,
            ...batchPlans.singleBatches,
            ...batchPlans.multiBatches
        ];
        
        return allBatches.reduce((sum, batch) => sum + (batch.estimatedTokens || 0), 0);
    }

    /**
     * 生成处理建议
     * @private
     */
    _generateProcessingRecommendations(fileCategories, batchPlans) {
        const recommendations = [];
        
        // 基于文件分布的建议
        if (fileCategories.large.length > 5) {
            recommendations.push('考虑增加并发处理数量以处理大量大文件');
        }
        
        if (fileCategories.error.length > 0) {
            recommendations.push(`${fileCategories.error.length}个文件需要手动处理`);
        }
        
        const totalBatches = batchPlans.combinedBatches.length +
                            batchPlans.singleBatches.length +
                            batchPlans.multiBatches.length;
                            
        if (totalBatches > 20) {
            recommendations.push('批次数量较多，建议分阶段处理');
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
     * 获取任务定义（公共接口）
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
     */
    getProjectTaskIds(projectPath) {
        return Array.from(this.projectTaskMapping.get(projectPath) || []);
    }

    /**
     * 清理项目任务定义
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
     * 获取模块状态
     */
    getModuleStatus() {
        return {
            dependencies: {
                tokenCalculator: !!this.tokenCalculator,
                codeStructureAnalyzer: !!this.codeStructureAnalyzer,
                boundaryDetector: !!this.boundaryDetector,
                combinedStrategy: !!this.batchStrategies.combined,
                singleStrategy: !!this.batchStrategies.single,
                largeMultiStrategy: !!this.batchStrategies.largeMulti,
                progressTracker: !!this.progressTracker
            },
            storage: {
                taskDefinitions: this.taskDefinitionStorage.size,
                projectMappings: this.projectTaskMapping.size
            },
            config: this.config,
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
            this.batchStrategies.combined &&
            this.batchStrategies.single &&
            this.batchStrategies.largeMulti
        );
    }

    /**
     * 将BatchResult类型映射为TaskDefinition类型
     * @static
     * @private
     */
    static _mapBatchTypeToTaskType(batchType) {
        switch (batchType) {
            case 'combined_batch': return 'file_batch';
            case 'single_batch': return 'single_file';
            case 'large_file_chunk': return 'large_file_chunk';
            default: 
                console.warn(`[FileAnalysisModule] 未知的批次类型: ${batchType}`);
                return 'file_batch';
        }
    }
}

export default FileAnalysisModule;