/**
 * UnifiedTaskManager - 统一任务管理器
 * 
 * 核心功能：
 * 1. 管理全部6个步骤的任务流程
 * 2. 与UnifiedTaskValidator协调进行验证
 * 3. 实现自动任务完成机制
 * 4. 提供统一的任务状态管理
 * 5. 错误检测和重试逻辑
 */

import fs from 'fs/promises';
import path from 'path';
import { ErrorResultFactory, ResultHelper } from '../../interfaces/ErrorResult.js';

export class UnifiedTaskManager {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 依赖注入（ServiceBus格式：config, dependencies, serviceBus）
        this.taskValidator = dependencies.unifiedTaskValidator;  // UnifiedTaskValidator
        this.taskStateManager = dependencies.taskStateManager;
        this.logger = dependencies.logger || console;
        this.serviceBus = serviceBus;
        
        // 任务管理状态
        this.currentTasks = new Map();
        this.completedTasks = new Map();
        this.taskMetadata = new Map();
        
        // 步骤配置
        this.stepConfigs = {
            step3: {
                name: 'File Processing',
                validationType: 'folder',
                autoComplete: true,
                maxRetries: 3
            },
            step4: {
                name: 'Module Integration', 
                validationType: 'module_folder',
                autoComplete: true,
                maxRetries: 2
            },
            step5: {
                name: 'Module Relations',
                validationType: 'fixed_file',
                autoComplete: true,
                maxRetries: 2
            },
            step6: {
                name: 'Architecture Documentation',
                validationType: 'architecture_files',
                autoComplete: true,
                maxRetries: 2
            }
        };
        
        // 任务统计
        this.statistics = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            autoCompletedTasks: 0,
            retryAttempts: 0
        };
    }

    /**
     * 创建任务 - 统一的任务创建接口
     */
    async createTask(taskDefinition, projectPath, stepType = 'step3') {
        try {
            const taskId = taskDefinition.id || this.generateTaskId(stepType);
            
            // 验证步骤类型
            if (!this.stepConfigs[stepType]) {
                throw new Error(`Unsupported step type: ${stepType}`);
            }
            
            const task = {
                id: taskId,
                stepType,
                projectPath,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                retryCount: 0,
                metadata: {
                    ...taskDefinition,
                    stepConfig: this.stepConfigs[stepType]
                }
            };
            
            // 存储任务
            this.currentTasks.set(taskId, task);
            this.taskMetadata.set(taskId, taskDefinition);
            this.statistics.totalTasks++;
            
            this.logger.info(`Created task ${taskId} for ${stepType}`);
            return task;
            
        } catch (error) {
            this.logger.error(`Failed to create task: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取当前任务 - 返回下一个待处理任务
     */
    async getNextTask(projectPath, stepType = 'step3') {
        try {
            // 查找指定步骤的待处理任务
            for (const [taskId, task] of this.currentTasks.entries()) {
                if (task.stepType === stepType && 
                    task.status === 'pending' && 
                    task.projectPath === projectPath) {
                    
                    // 标记为处理中
                    task.status = 'in_progress';
                    task.updatedAt = new Date().toISOString();
                    
                    this.logger.info(`Retrieved next task: ${taskId} (${stepType})`);
                    return task;
                }
            }
            
            // 没有找到待处理任务
            this.logger.info(`No pending tasks found for ${stepType}`);
            return null;
            
        } catch (error) {
            this.logger.error(`Failed to get next task: ${error.message}`);
            throw error;
        }
    }

    /**
     * 检查任务完成状态 - 与UnifiedTaskValidator协调
     */
    async checkTaskCompletion(taskId, projectPath, stepType = null) {
        try {
            const task = this.currentTasks.get(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            
            // 使用实际的步骤类型
            const actualStepType = stepType || task.stepType;
            
            // 调用验证器进行检查
            if (!this.taskValidator) {
                throw new Error('Task validator not available');
            }
            
            const validationResult = await this.taskValidator.checkTaskCompletion(
                taskId, 
                projectPath, 
                actualStepType
            );
            
            // 处理验证结果
            if (validationResult.success) {
                await this.completeTask(taskId, {
                    autoCompleted: validationResult.autoCompleted,
                    validationDetails: validationResult.details
                });
                
                this.logger.info(`Task ${taskId} validation passed - auto-completed`);
                return ErrorResultFactory.createSuccess({
                    status: 'completed',
                    autoCompleted: validationResult.autoCompleted,
                    message: validationResult.message
                });
            } else {
                // 验证失败，更新任务状态
                task.status = 'validation_failed';
                task.updatedAt = new Date().toISOString();
                task.lastError = validationResult.message;
                
                this.logger.warn(`Task ${taskId} validation failed: ${validationResult.message}`);
                return ErrorResultFactory.createValidationError(
                    validationResult.message,
                    {
                        service: 'UnifiedTaskManager',
                        method: 'checkTaskCompletion',
                        params: { taskId },
                        details: { missingFiles: validationResult.missingFiles }
                    }
                );
            }
            
        } catch (error) {
            this.logger.error(`Failed to check task completion: ${error.message}`);
            return ErrorResultFactory.fromJavaScriptError(
                error,
                {
                    service: 'UnifiedTaskManager',
                    method: 'checkTaskCompletion',
                    params: { taskId }
                }
            );
        }
    }

    /**
     * 完成任务 - 内部方法
     */
    async completeTask(taskId, completionData = {}) {
        try {
            const task = this.currentTasks.get(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            
            // 更新任务状态
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            task.updatedAt = new Date().toISOString();
            task.completionData = completionData;
            
            // 移动到已完成任务
            this.completedTasks.set(taskId, task);
            this.currentTasks.delete(taskId);
            
            // 更新统计
            this.statistics.completedTasks++;
            if (completionData.autoCompleted) {
                this.statistics.autoCompletedTasks++;
            }
            
            this.logger.info(`Task ${taskId} completed successfully`);
            return task;
            
        } catch (error) {
            this.logger.error(`Failed to complete task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 重试失败任务
     */
    async retryTask(taskId, maxRetries = null) {
        try {
            const task = this.currentTasks.get(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            
            const stepConfig = this.stepConfigs[task.stepType];
            const actualMaxRetries = maxRetries || stepConfig.maxRetries || 3;
            
            if (task.retryCount >= actualMaxRetries) {
                task.status = 'failed';
                task.updatedAt = new Date().toISOString();
                this.statistics.failedTasks++;
                
                this.logger.warn(`Task ${taskId} exceeded max retries (${actualMaxRetries})`);
                return ErrorResultFactory.createProcessingError(
                    `Task exceeded max retries (${actualMaxRetries})`,
                    {
                        service: 'UnifiedTaskManager',
                        method: 'processTask',
                        params: { taskId, maxRetries: actualMaxRetries }
                    }
                );
            }
            
            // 重置任务状态进行重试
            task.status = 'pending';
            task.retryCount++;
            task.updatedAt = new Date().toISOString();
            task.lastRetry = new Date().toISOString();
            
            this.statistics.retryAttempts++;
            
            this.logger.info(`Retrying task ${taskId} (attempt ${task.retryCount}/${actualMaxRetries})`);
            return { success: true, message: 'Task queued for retry' };
            
        } catch (error) {
            this.logger.error(`Failed to retry task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取任务状态
     */
    async getTaskStatus(taskId = null) {
        try {
            if (taskId) {
                // 获取特定任务状态
                const currentTask = this.currentTasks.get(taskId);
                const completedTask = this.completedTasks.get(taskId);
                const task = currentTask || completedTask;
                
                if (!task) {
                    return ErrorResultFactory.createValidationError(
                        'Task not found',
                        {
                            service: 'UnifiedTaskManager',
                            method: 'getTaskStatus',
                            params: { taskId }
                        }
                    );
                }
                
                return {
                    success: true,
                    task: {
                        id: task.id,
                        stepType: task.stepType,
                        status: task.status,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                        retryCount: task.retryCount,
                        metadata: task.metadata
                    }
                };
            } else {
                // 获取整体状态
                return {
                    success: true,
                    overview: {
                        statistics: { ...this.statistics },
                        currentTasks: Array.from(this.currentTasks.keys()),
                        completedTasks: Array.from(this.completedTasks.keys()),
                        stepConfigs: this.stepConfigs
                    }
                };
            }
            
        } catch (error) {
            this.logger.error(`Failed to get task status: ${error.message}`);
            return ErrorResultFactory.fromJavaScriptError(
                error,
                {
                    service: 'UnifiedTaskManager',
                    method: 'getTaskStatus',
                    params: { taskId }
                }
            );
        }
    }

    /**
     * 批量创建任务 - 用于Step3的多批次任务
     */
    async createBatchTasks(taskDefinitions, projectPath, stepType = 'step3') {
        try {
            const createdTasks = [];
            
            for (const definition of taskDefinitions) {
                const task = await this.createTask(definition, projectPath, stepType);
                createdTasks.push(task);
            }
            
            this.logger.info(`Created ${createdTasks.length} batch tasks for ${stepType}`);
            return {
                success: true,
                tasks: createdTasks,
                count: createdTasks.length
            };
            
        } catch (error) {
            this.logger.error(`Failed to create batch tasks: ${error.message}`);
            throw error;
        }
    }

    /**
     * 清理已完成任务 - 释放内存
     */
    async cleanupCompletedTasks(olderThanHours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
            let cleanedCount = 0;
            
            for (const [taskId, task] of this.completedTasks.entries()) {
                const completedAt = new Date(task.completedAt || task.updatedAt);
                if (completedAt < cutoffTime) {
                    this.completedTasks.delete(taskId);
                    this.taskMetadata.delete(taskId);
                    cleanedCount++;
                }
            }
            
            this.logger.info(`Cleaned up ${cleanedCount} completed tasks`);
            return { success: true, cleaned: cleanedCount };
            
        } catch (error) {
            this.logger.error(`Failed to cleanup completed tasks: ${error.message}`);
            throw error;
        }
    }

    /**
     * 重置任务管理器 - 清除所有任务和状态
     */
    async reset() {
        try {
            this.currentTasks.clear();
            this.completedTasks.clear();
            this.taskMetadata.clear();
            
            // 重置统计
            this.statistics = {
                totalTasks: 0,
                completedTasks: 0,
                failedTasks: 0,
                autoCompletedTasks: 0,
                retryAttempts: 0
            };
            
            this.logger.info('UnifiedTaskManager reset successfully');
            return { success: true, message: 'Task manager reset' };
            
        } catch (error) {
            this.logger.error(`Failed to reset task manager: ${error.message}`);
            throw error;
        }
    }

    /**
     * 生成任务ID - 内部方法
     */
    generateTaskId(stepType, suffix = null) {
        const stepNumber = stepType.replace('step', '');
        const timestamp = Date.now().toString().slice(-6);
        const base = `task_${stepNumber}_${timestamp}`;
        return suffix ? `${base}_${suffix}` : base;
    }

    /**
     * 获取步骤统计信息
     */
    async getStepStatistics(stepType = null) {
        try {
            if (stepType) {
                // 特定步骤统计
                const stepTasks = Array.from(this.currentTasks.values())
                    .concat(Array.from(this.completedTasks.values()))
                    .filter(task => task.stepType === stepType);
                
                const stats = {
                    stepType,
                    total: stepTasks.length,
                    completed: stepTasks.filter(t => t.status === 'completed').length,
                    pending: stepTasks.filter(t => t.status === 'pending').length,
                    inProgress: stepTasks.filter(t => t.status === 'in_progress').length,
                    failed: stepTasks.filter(t => t.status === 'failed').length,
                    autoCompleted: stepTasks.filter(t => t.completionData?.autoCompleted).length
                };
                
                return { success: true, statistics: stats };
            } else {
                // 所有步骤统计
                const allSteps = Object.keys(this.stepConfigs);
                const stepStats = {};
                
                for (const step of allSteps) {
                    const result = await this.getStepStatistics(step);
                    stepStats[step] = result.statistics;
                }
                
                return { success: true, statistics: stepStats, overview: this.statistics };
            }
            
        } catch (error) {
            this.logger.error(`Failed to get step statistics: ${error.message}`);
            return ErrorResultFactory.fromJavaScriptError(
                error,
                {
                    service: 'UnifiedTaskManager',
                    method: 'getStepStatistics'
                }
            );
        }
    }
}

export default UnifiedTaskManager;