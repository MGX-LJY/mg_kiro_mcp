/**
 * UnifiedTaskValidator - 统一任务验证器
 * 
 * 核心功能：
 * - 与FileAnalysisModule协作进行精确任务验证
 * - 实现分层验证策略：基于具体任务和文件验证
 * - 自动完成机制：验证通过时自动调用任务管理器完成任务
 * - 精准错误处理：明确告知具体任务和文件状态
 * 
 * 验证策略：
 * - Step3: 基于FileAnalysisModule的任务定义验证具体文件处理结果
 * - Step4: 检查模块文档文件夹是否有.md文件  
 * - Step5: 检查 relations.md 是否存在
 * - Step6: 检查 README.md, architecture.md 是否存在
 * 
 * 设计理念：
 * - 精确优于模糊：基于具体任务和文件进行验证
 * - 自动化优于手动：验证通过立即自动完成任务
 * - 明确的错误提示：清晰告知具体任务状态
 * - 协作式验证：与FileAnalysisModule紧密集成
 */

import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';

export class UnifiedTaskValidator {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 配置合并（ServiceBus格式）
        this.config = {
            enableAutoCompletion: true,     // 启用自动完成
            detailedErrorReporting: true,   // 详细错误报告
            validateFileContent: false,     // 不验证文件内容，只检查存在性
            timeoutMs: 5000,               // 验证超时时间
            ...config
        };

        // 依赖注入（ServiceBus格式：config, dependencies, serviceBus）
        this.unifiedTaskManager = null; // 将在后续通过injectDependencies设置
        this.taskStateManager = dependencies.taskStateManager;
        this.fileAnalysisModule = dependencies.fileAnalysisModule;
        this.serviceBus = serviceBus;

        // 步骤验证器映射
        this.stepValidators = {
            'step3': null,  // Step3FolderValidator
            'step4': null,  // Step4ModuleValidator  
            'step5': null,  // Step5FixedFileValidator
            'step6': null   // Step6ArchitectureValidator
        };
    }

    /**
     * 注入依赖服务
     */
    injectDependencies({
        unifiedTaskManager,
        taskStateManager,
        fileAnalysisModule,
        step3Validator,
        step4Validator,
        step5Validator,
        step6Validator
    }) {
        this.unifiedTaskManager = unifiedTaskManager;
        this.taskStateManager = taskStateManager;
        this.fileAnalysisModule = fileAnalysisModule;
        this.stepValidators.step3 = step3Validator;
        this.stepValidators.step4 = step4Validator;
        this.stepValidators.step5 = step5Validator;
        this.stepValidators.step6 = step6Validator;
    }

    /**
     * 主入口：检查任务完成情况
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {string} stepType - 步骤类型 (step3, step4, step5, step6)
     * @returns {Promise<Object>} 验证结果
     */
    async checkTaskCompletion(taskId, projectPath, stepType) {
        console.log(`[UnifiedTaskValidator] 开始验证任务: ${taskId}, 步骤: ${stepType}`);

        try {
            const startTime = Date.now();

            // 验证输入参数
            const paramValidation = this._validateParameters(taskId, projectPath, stepType);
            if (!paramValidation.valid) {
                return this._createErrorResponse('INVALID_PARAMETERS', paramValidation.error, taskId);
            }

            // 检测步骤类型
            const detectedStepType = stepType || this._detectStepType(taskId, projectPath);
            
            // 获取对应的验证器
            const validator = this.stepValidators[detectedStepType];
            if (!validator) {
                return this._createErrorResponse(
                    'NO_VALIDATOR', 
                    `没有找到步骤 ${detectedStepType} 的验证器`, 
                    taskId
                );
            }

            // Step3 需要特殊处理：获取FileAnalysisModule的任务定义
            let taskContext = null;
            if (detectedStepType === 'step3' && this.fileAnalysisModule) {
                taskContext = await this._getTaskContext(taskId, projectPath);
            }

            // 执行验证
            const validationResult = await this._executeValidation(
                validator, 
                taskId, 
                projectPath, 
                detectedStepType,
                taskContext
            );

            const processingTime = Date.now() - startTime;

            // 处理验证结果
            if (validationResult.isValid) {
                // 验证通过，自动完成任务
                const completionResult = await this._autoCompleteTask(
                    taskId, 
                    projectPath, 
                    detectedStepType, 
                    validationResult
                );

                return {
                    success: true,
                    taskId,
                    stepType: detectedStepType,
                    validationPassed: true,
                    autoCompleted: completionResult.success,
                    result: validationResult,
                    completionDetails: completionResult,
                    processingTime,
                    timestamp: new Date().toISOString()
                };
            } else {
                // 验证失败，返回详细错误信息
                return {
                    success: false,
                    taskId,
                    stepType: detectedStepType,
                    validationPassed: false,
                    autoCompleted: false,
                    error: {
                        type: 'VALIDATION_FAILED',
                        message: '任务验证失败',
                        details: validationResult,
                        missingFiles: validationResult.missingFiles || [],
                        suggestions: validationResult.suggestions || []
                    },
                    processingTime,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            console.error(`[UnifiedTaskValidator] 验证过程异常: ${taskId}`, error);
            
            return this._createErrorResponse('VALIDATION_ERROR', error.message, taskId);
        }
    }

    /**
     * 批量验证多个任务
     * @param {Array} tasks - 任务列表 [{taskId, projectPath, stepType}]
     * @returns {Promise<Object>} 批量验证结果
     */
    async batchCheckTasks(tasks) {
        console.log(`[UnifiedTaskValidator] 开始批量验证: ${tasks.length} 个任务`);

        const results = [];
        const batchSize = 5; // 并发批次大小

        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            
            const batchPromises = batch.map(task => 
                this.checkTaskCompletion(task.taskId, task.projectPath, task.stepType)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        success: false,
                        taskId: batch[index].taskId,
                        error: {
                            type: 'BATCH_ERROR',
                            message: result.reason.message,
                            originalError: result.reason
                        }
                    });
                }
            });
        }

        // 生成批量结果摘要
        const summary = this._generateBatchSummary(results);

        return {
            success: true,
            totalTasks: tasks.length,
            results,
            summary,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 获取任务上下文（从FileAnalysisModule）
     * @private
     */
    async _getTaskContext(taskId, projectPath) {
        try {
            if (!this.fileAnalysisModule) {
                console.warn('[UnifiedTaskValidator] FileAnalysisModule未注入，无法获取任务上下文');
                return null;
            }

            // 从FileAnalysisModule获取任务定义和相关文件信息
            const taskDefinition = await this.fileAnalysisModule.getTaskDefinition(taskId);
            if (!taskDefinition) {
                console.warn(`[UnifiedTaskValidator] 无法找到任务 ${taskId} 的定义`);
                return null;
            }

            return {
                taskId,
                projectPath,
                taskDefinition,
                expectedFiles: taskDefinition.files || [],
                batchStrategy: taskDefinition.batchStrategy,
                processingType: taskDefinition.processingType,
                metadata: taskDefinition.metadata || {}
            };

        } catch (error) {
            console.error(`[UnifiedTaskValidator] 获取任务上下文失败: ${taskId}`, error);
            return null;
        }
    }

    /**
     * 验证输入参数
     * @private
     */
    _validateParameters(taskId, projectPath, stepType) {
        if (!taskId || typeof taskId !== 'string') {
            return { valid: false, error: '任务ID必须是有效的字符串' };
        }

        if (!projectPath || typeof projectPath !== 'string') {
            return { valid: false, error: '项目路径必须是有效的字符串' };
        }

        if (stepType && !this.stepValidators[stepType]) {
            return { valid: false, error: `不支持的步骤类型: ${stepType}` };
        }

        return { valid: true };
    }

    /**
     * 检测步骤类型
     * @private
     */
    _detectStepType(taskId, projectPath) {
        // 基于任务ID模式检测
        if (taskId.includes('step3') || taskId.includes('file_processing')) {
            return 'step3';
        }
        if (taskId.includes('step4') || taskId.includes('module_integration')) {
            return 'step4';
        }
        if (taskId.includes('step5') || taskId.includes('module_relations')) {
            return 'step5';
        }
        if (taskId.includes('step6') || taskId.includes('architecture_docs')) {
            return 'step6';
        }

        // 检查项目路径中的提示
        try {
            // 简单的步骤检测逻辑
            const pathLower = projectPath.toLowerCase();
            if (pathLower.includes('step3')) return 'step3';
            if (pathLower.includes('step4')) return 'step4';
            if (pathLower.includes('step5')) return 'step5';
            if (pathLower.includes('step6')) return 'step6';
        } catch (error) {
            console.warn('[UnifiedTaskValidator] 步骤类型检测失败，使用默认值');
        }

        // 默认返回step3
        return 'step3';
    }

    /**
     * 执行验证
     * @private
     */
    async _executeValidation(validator, taskId, projectPath, stepType, taskContext = null) {
        try {
            // 调用特定步骤验证器
            const result = await validator.validate(taskId, projectPath, {
                timeoutMs: this.config.timeoutMs,
                detailedErrors: this.config.detailedErrorReporting,
                taskContext  // 传递任务上下文（包含FileAnalysisModule的任务定义）
            });

            return result;

        } catch (error) {
            console.error(`[UnifiedTaskValidator] 步骤 ${stepType} 验证器执行失败:`, error);
            
            return {
                isValid: false,
                error: error.message,
                stepType,
                validatorError: true
            };
        }
    }

    /**
     * 自动完成任务
     * @private
     */
    async _autoCompleteTask(taskId, projectPath, stepType, validationResult) {
        if (!this.config.enableAutoCompletion) {
            return { 
                success: false, 
                reason: 'AUTO_COMPLETION_DISABLED',
                message: '自动完成功能已禁用' 
            };
        }

        if (!this.unifiedTaskManager) {
            return { 
                success: false, 
                reason: 'NO_TASK_MANAGER',
                message: '统一任务管理器未注入' 
            };
        }

        try {
            // 调用统一任务管理器完成任务
            const completionResult = await this.unifiedTaskManager.completeTask(taskId, {
                validationResult,
                stepType,
                projectPath,
                autoCompleted: true,
                completedAt: new Date().toISOString()
            });

            console.log(`[UnifiedTaskValidator] 自动完成任务: ${taskId}`);

            return {
                success: true,
                taskId,
                completionResult,
                autoCompleted: true
            };

        } catch (error) {
            console.error(`[UnifiedTaskValidator] 自动完成任务失败: ${taskId}`, error);
            
            return {
                success: false,
                reason: 'AUTO_COMPLETION_FAILED',
                message: error.message,
                taskId
            };
        }
    }

    /**
     * 创建错误响应
     * @private
     */
    _createErrorResponse(errorType, errorMessage, taskId = null) {
        return {
            success: false,
            taskId,
            validationPassed: false,
            autoCompleted: false,
            error: {
                type: errorType,
                message: errorMessage,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 生成批量结果摘要
     * @private
     */
    _generateBatchSummary(results) {
        const summary = {
            total: results.length,
            successful: 0,
            failed: 0,
            autoCompleted: 0,
            byStepType: {},
            errors: []
        };

        results.forEach(result => {
            if (result.success) {
                summary.successful++;
                if (result.autoCompleted) {
                    summary.autoCompleted++;
                }
            } else {
                summary.failed++;
                if (result.error) {
                    summary.errors.push({
                        taskId: result.taskId,
                        error: result.error.message,
                        type: result.error.type
                    });
                }
            }

            // 按步骤类型统计
            const stepType = result.stepType || 'unknown';
            if (!summary.byStepType[stepType]) {
                summary.byStepType[stepType] = { total: 0, successful: 0, failed: 0 };
            }
            summary.byStepType[stepType].total++;
            if (result.success) {
                summary.byStepType[stepType].successful++;
            } else {
                summary.byStepType[stepType].failed++;
            }
        });

        return summary;
    }

    /**
     * 获取验证器状态
     */
    getValidatorStatus() {
        const validatorStatuses = {};
        
        Object.entries(this.stepValidators).forEach(([stepType, validator]) => {
            validatorStatuses[stepType] = {
                available: !!validator,
                status: validator ? validator.getValidatorStatus?.() || 'ready' : 'not_injected'
            };
        });

        return {
            name: 'UnifiedTaskValidator',
            version: '1.0.0',
            config: this.config,
            dependencies: {
                unifiedTaskManager: !!this.unifiedTaskManager,
                taskStateManager: !!this.taskStateManager,
                fileAnalysisModule: !!this.fileAnalysisModule
            },
            stepValidators: validatorStatuses,
            isReady: this._checkDependenciesReady()
        };
    }

    /**
     * 检查依赖是否就绪
     * @private
     */
    _checkDependenciesReady() {
        const hasTaskManager = !!this.unifiedTaskManager;
        const hasValidators = Object.values(this.stepValidators).some(validator => !!validator);
        
        return hasTaskManager && hasValidators;
    }

    /**
     * 重置验证器状态
     */
    reset() {
        // 可以在这里添加重置逻辑，比如清理缓存等
        console.log('[UnifiedTaskValidator] 验证器状态已重置');
    }

    /**
     * 设置超时时间
     */
    setTimeout(timeoutMs) {
        this.config.timeoutMs = timeoutMs;
        console.log(`[UnifiedTaskValidator] 超时时间设置为: ${timeoutMs}ms`);
    }

    /**
     * 启用/禁用自动完成
     */
    setAutoCompletion(enabled) {
        this.config.enableAutoCompletion = enabled;
        console.log(`[UnifiedTaskValidator] 自动完成功能: ${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 获取支持的步骤类型
     */
    getSupportedStepTypes() {
        return Object.keys(this.stepValidators);
    }

    /**
     * 验证项目路径是否可访问
     */
    async validateProjectPath(projectPath) {
        try {
            const stats = await fs.stat(projectPath);
            return {
                accessible: true,
                isDirectory: stats.isDirectory(),
                path: resolve(projectPath)
            };
        } catch (error) {
            return {
                accessible: false,
                error: error.message,
                path: projectPath
            };
        }
    }
}

export default UnifiedTaskValidator;