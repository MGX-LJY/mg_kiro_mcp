/**
 * 任务进度跟踪器 - 智能任务状态监控
 * 
 * 核心功能：
 * - 跟踪任务执行状态和进度
 * - 记录任务完成时间和性能指标
 * - 生成进度报告和统计信息
 * - 支持任务依赖关系监控
 * 
 * 设计理念：
 * - 实时监控：实时更新任务状态和进度信息
 * - 智能分析：基于历史数据预测完成时间
 * - 详细记录：完整的执行日志和性能指标
 * - 可视化支持：提供进度可视化所需数据
 */

export class TaskProgressTracker {
    constructor(config = {}) {
        this.config = {
            enablePerformanceTracking: true,    // 启用性能跟踪
            enablePredictiveAnalysis: true,     // 启用预测分析
            maxHistoryRecords: 1000,            // 最大历史记录数
            autoCleanupDays: 7,                 // 自动清理天数
            detailedLogging: true,              // 详细日志
            ...config
        };

        // 任务状态存储
        this.tasks = new Map();
        
        // 历史记录
        this.history = [];
        
        // 性能指标
        this.performanceMetrics = {
            totalTasksProcessed: 0,
            averageProcessingTime: 0,
            successRate: 0,
            errorRate: 0
        };

        // 进度统计
        this.progressStats = {
            pending: 0,
            inProgress: 0,
            completed: 0,
            failed: 0,
            skipped: 0
        };

        // 启动时间
        this.startTime = new Date();
    }

    /**
     * 初始化任务跟踪
     * @param {Array} taskDefinitions - 任务定义数组
     * @returns {Object} 初始化结果
     */
    initializeTracking(taskDefinitions) {
        try {
            console.log(`[TaskProgressTracker] 初始化任务跟踪: ${taskDefinitions.length} 个任务`);

            // 重置状态
            this.tasks.clear();
            this.progressStats = {
                pending: 0,
                inProgress: 0,
                completed: 0,
                failed: 0,
                skipped: 0
            };

            // 初始化任务记录
            taskDefinitions.forEach(taskDef => {
                const taskRecord = this._createTaskRecord(taskDef);
                this.tasks.set(taskDef.taskId, taskRecord);
                this.progressStats.pending++;
            });

            const result = {
                success: true,
                totalTasks: taskDefinitions.length,
                initialStats: { ...this.progressStats },
                trackingId: this._generateTrackingId(),
                startTime: new Date().toISOString()
            };

            console.log(`[TaskProgressTracker] 任务跟踪初始化完成`);
            return result;

        } catch (error) {
            console.error('[TaskProgressTracker] 初始化失败:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 更新任务状态
     * @param {string} taskId - 任务ID
     * @param {string} status - 新状态
     * @param {Object} data - 额外数据
     * @returns {Object} 更新结果
     */
    updateTaskStatus(taskId, status, data = {}) {
        try {
            const task = this.tasks.get(taskId);
            
            if (!task) {
                return {
                    success: false,
                    error: `任务不存在: ${taskId}`,
                    timestamp: new Date().toISOString()
                };
            }

            const previousStatus = task.status;
            const updateTime = new Date();

            // 更新任务记录
            const updatedTask = this._updateTaskRecord(task, status, data, updateTime);
            this.tasks.set(taskId, updatedTask);

            // 更新统计
            this._updateProgressStats(previousStatus, status);

            // 记录历史
            if (this.config.detailedLogging) {
                this._recordHistory(taskId, previousStatus, status, updateTime, data);
            }

            // 更新性能指标
            if (this.config.enablePerformanceTracking && status === 'completed') {
                this._updatePerformanceMetrics(updatedTask);
            }

            const result = {
                success: true,
                taskId,
                previousStatus,
                newStatus: status,
                progressStats: { ...this.progressStats },
                timestamp: updateTime.toISOString()
            };

            console.log(`[TaskProgressTracker] 任务状态更新: ${taskId} ${previousStatus} -> ${status}`);
            return result;

        } catch (error) {
            console.error(`[TaskProgressTracker] 状态更新失败: ${taskId}`, error);
            
            return {
                success: false,
                error: error.message,
                taskId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 获取整体进度
     * @returns {Object} 进度信息
     */
    getOverallProgress() {
        const total = this.tasks.size;
        const completed = this.progressStats.completed;
        const failed = this.progressStats.failed;
        const inProgress = this.progressStats.inProgress;
        
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const failureRate = total > 0 ? (failed / total) * 100 : 0;

        return {
            total,
            completed,
            failed,
            inProgress,
            pending: this.progressStats.pending,
            skipped: this.progressStats.skipped,
            completionRate: Math.round(completionRate * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
            isComplete: completed + failed + this.progressStats.skipped === total,
            elapsedTime: Date.now() - this.startTime.getTime(),
            estimatedCompletion: this._estimateCompletion()
        };
    }

    /**
     * 获取任务详情
     * @param {string} taskId - 任务ID
     * @returns {Object} 任务详情
     */
    getTaskDetails(taskId) {
        const task = this.tasks.get(taskId);
        
        if (!task) {
            return {
                success: false,
                error: `任务不存在: ${taskId}`
            };
        }

        return {
            success: true,
            task: {
                ...task,
                processingTime: task.completedAt ? 
                    task.completedAt.getTime() - task.startedAt.getTime() : 
                    (task.startedAt ? Date.now() - task.startedAt.getTime() : 0),
                waitingTime: task.startedAt ? 
                    task.startedAt.getTime() - task.createdAt.getTime() : 
                    Date.now() - task.createdAt.getTime()
            }
        };
    }

    /**
     * 获取性能报告
     * @returns {Object} 性能报告
     */
    getPerformanceReport() {
        const completedTasks = Array.from(this.tasks.values())
            .filter(task => task.status === 'completed');

        const failedTasks = Array.from(this.tasks.values())
            .filter(task => task.status === 'failed');

        const processingTimes = completedTasks
            .filter(task => task.completedAt && task.startedAt)
            .map(task => task.completedAt.getTime() - task.startedAt.getTime());

        const averageProcessingTime = processingTimes.length > 0 ?
            processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;

        const report = {
            summary: {
                totalTasks: this.tasks.size,
                completedTasks: completedTasks.length,
                failedTasks: failedTasks.length,
                successRate: this.tasks.size > 0 ? (completedTasks.length / this.tasks.size) * 100 : 0,
                failureRate: this.tasks.size > 0 ? (failedTasks.length / this.tasks.size) * 100 : 0
            },
            timing: {
                averageProcessingTime: Math.round(averageProcessingTime),
                minProcessingTime: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
                maxProcessingTime: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
                totalElapsedTime: Date.now() - this.startTime.getTime()
            },
            breakdown: {
                byType: this._getBreakdownByType(),
                byStatus: { ...this.progressStats },
                byPriority: this._getBreakdownByPriority()
            },
            trends: this._analyzeTrends()
        };

        return report;
    }

    /**
     * 获取任务队列状态
     * @returns {Object} 队列状态
     */
    getQueueStatus() {
        const tasks = Array.from(this.tasks.values());
        
        return {
            pending: tasks.filter(t => t.status === 'pending')
                .sort((a, b) => b.priority - a.priority)
                .map(t => ({
                    taskId: t.taskId,
                    type: t.type,
                    priority: t.priority,
                    estimatedDuration: t.estimatedDuration
                })),
            inProgress: tasks.filter(t => t.status === 'inProgress')
                .map(t => ({
                    taskId: t.taskId,
                    type: t.type,
                    startedAt: t.startedAt.toISOString(),
                    elapsedTime: Date.now() - t.startedAt.getTime()
                })),
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length
        };
    }

    /**
     * 创建任务记录
     * @private
     */
    _createTaskRecord(taskDef) {
        return {
            taskId: taskDef.taskId,
            type: taskDef.type,
            category: taskDef.category,
            status: 'pending',
            priority: taskDef.priority?.calculatedPriority || 0,
            estimatedDuration: taskDef.estimatedDuration || 0,
            fileCount: taskDef.fileInfo?.totalFiles || 0,
            tokenCount: taskDef.batchInfo?.estimatedTokens || 0,
            
            // 时间戳
            createdAt: new Date(),
            startedAt: null,
            completedAt: null,
            
            // 执行数据
            result: null,
            error: null,
            attempts: 0,
            
            // 元数据
            metadata: taskDef.metadata || {}
        };
    }

    /**
     * 更新任务记录
     * @private
     */
    _updateTaskRecord(task, status, data, updateTime) {
        const updated = { ...task };
        
        updated.status = status;
        updated.lastUpdated = updateTime;
        
        // 根据状态更新时间戳
        switch (status) {
            case 'inProgress':
                updated.startedAt = updated.startedAt || updateTime;
                updated.attempts++;
                break;
            case 'completed':
                updated.completedAt = updateTime;
                updated.result = data.result || null;
                break;
            case 'failed':
                updated.completedAt = updateTime;
                updated.error = data.error || null;
                break;
            case 'skipped':
                updated.completedAt = updateTime;
                updated.error = data.reason || 'Skipped';
                break;
        }

        // 合并额外数据
        if (data.metadata) {
            updated.metadata = { ...updated.metadata, ...data.metadata };
        }

        return updated;
    }

    /**
     * 更新进度统计
     * @private
     */
    _updateProgressStats(previousStatus, newStatus) {
        if (previousStatus !== newStatus) {
            // 减少旧状态计数
            if (this.progressStats[previousStatus] !== undefined) {
                this.progressStats[previousStatus]--;
            }
            
            // 增加新状态计数
            if (this.progressStats[newStatus] !== undefined) {
                this.progressStats[newStatus]++;
            }
        }
    }

    /**
     * 记录历史
     * @private
     */
    _recordHistory(taskId, previousStatus, newStatus, timestamp, data) {
        const historyRecord = {
            taskId,
            previousStatus,
            newStatus,
            timestamp: timestamp.toISOString(),
            data: data || {}
        };

        this.history.push(historyRecord);

        // 清理旧记录
        if (this.history.length > this.config.maxHistoryRecords) {
            this.history = this.history.slice(-this.config.maxHistoryRecords);
        }
    }

    /**
     * 更新性能指标
     * @private
     */
    _updatePerformanceMetrics(task) {
        if (!this.config.enablePerformanceTracking) return;

        this.performanceMetrics.totalTasksProcessed++;

        if (task.startedAt && task.completedAt) {
            const processingTime = task.completedAt.getTime() - task.startedAt.getTime();
            
            // 更新平均处理时间
            const total = this.performanceMetrics.totalTasksProcessed;
            this.performanceMetrics.averageProcessingTime = 
                ((this.performanceMetrics.averageProcessingTime * (total - 1)) + processingTime) / total;
        }

        // 更新成功率和错误率
        const totalTasks = this.tasks.size;
        const completedTasks = this.progressStats.completed;
        const failedTasks = this.progressStats.failed;

        this.performanceMetrics.successRate = (completedTasks / totalTasks) * 100;
        this.performanceMetrics.errorRate = (failedTasks / totalTasks) * 100;
    }

    /**
     * 估算完成时间
     * @private
     */
    _estimateCompletion() {
        if (!this.config.enablePredictiveAnalysis) return null;

        const completed = this.progressStats.completed;
        const remaining = this.progressStats.pending + this.progressStats.inProgress;
        
        if (completed === 0) return null;

        const elapsedTime = Date.now() - this.startTime.getTime();
        const averageTimePerTask = elapsedTime / completed;
        const estimatedRemainingTime = remaining * averageTimePerTask;

        return {
            estimatedRemainingTime: Math.round(estimatedRemainingTime),
            estimatedCompletionTime: new Date(Date.now() + estimatedRemainingTime).toISOString(),
            confidence: Math.min((completed / this.tasks.size) * 100, 95) // 最高95%置信度
        };
    }

    /**
     * 按类型分解
     * @private
     */
    _getBreakdownByType() {
        const breakdown = {};
        
        this.tasks.forEach(task => {
            if (!breakdown[task.type]) {
                breakdown[task.type] = {
                    total: 0,
                    completed: 0,
                    failed: 0,
                    pending: 0,
                    inProgress: 0
                };
            }
            
            breakdown[task.type].total++;
            breakdown[task.type][task.status]++;
        });

        return breakdown;
    }

    /**
     * 按优先级分解
     * @private
     */
    _getBreakdownByPriority() {
        const breakdown = {
            high: { total: 0, completed: 0, failed: 0 },
            medium: { total: 0, completed: 0, failed: 0 },
            low: { total: 0, completed: 0, failed: 0 }
        };

        this.tasks.forEach(task => {
            const priority = task.priority;
            let level = 'medium';
            
            if (priority >= 8) level = 'high';
            else if (priority < 5) level = 'low';

            breakdown[level].total++;
            if (task.status === 'completed') breakdown[level].completed++;
            if (task.status === 'failed') breakdown[level].failed++;
        });

        return breakdown;
    }

    /**
     * 分析趋势
     * @private
     */
    _analyzeTrends() {
        if (this.history.length < 10) {
            return { message: '数据不足，无法分析趋势' };
        }

        const recentHistory = this.history.slice(-50); // 最近50条记录
        const completions = recentHistory.filter(h => h.newStatus === 'completed');
        const failures = recentHistory.filter(h => h.newStatus === 'failed');

        const completionRate = (completions.length / recentHistory.length) * 100;
        const failureRate = (failures.length / recentHistory.length) * 100;

        return {
            recentCompletionRate: Math.round(completionRate * 100) / 100,
            recentFailureRate: Math.round(failureRate * 100) / 100,
            trend: completionRate > 80 ? 'positive' : 
                   completionRate > 60 ? 'stable' : 'concerning',
            recommendations: this._generateRecommendations(completionRate, failureRate)
        };
    }

    /**
     * 生成建议
     * @private
     */
    _generateRecommendations(completionRate, failureRate) {
        const recommendations = [];

        if (failureRate > 20) {
            recommendations.push('失败率较高，建议检查任务配置和错误处理');
        }

        if (completionRate < 60) {
            recommendations.push('完成率偏低，建议优化任务处理流程');
        }

        const avgProcessingTime = this.performanceMetrics.averageProcessingTime;
        if (avgProcessingTime > 60000) { // 大于1分钟
            recommendations.push('平均处理时间较长，建议考虑任务分解或并行处理');
        }

        if (recommendations.length === 0) {
            recommendations.push('任务执行状态良好');
        }

        return recommendations;
    }

    /**
     * 生成跟踪ID
     * @private
     */
    _generateTrackingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `track_${timestamp}_${random}`;
    }

    /**
     * 清理旧数据
     */
    cleanupOldData() {
        if (!this.config.autoCleanupDays) return;

        const cutoffTime = new Date();
        cutoffTime.setDate(cutoffTime.getDate() - this.config.autoCleanupDays);

        // 清理旧的历史记录
        this.history = this.history.filter(record => 
            new Date(record.timestamp) > cutoffTime
        );

        console.log(`[TaskProgressTracker] 清理了 ${this.history.length} 条历史记录`);
    }

    /**
     * 重置跟踪器
     */
    reset() {
        this.tasks.clear();
        this.history = [];
        this.progressStats = {
            pending: 0,
            inProgress: 0,
            completed: 0,
            failed: 0,
            skipped: 0
        };
        this.performanceMetrics = {
            totalTasksProcessed: 0,
            averageProcessingTime: 0,
            successRate: 0,
            errorRate: 0
        };
        this.startTime = new Date();
        
        console.log('[TaskProgressTracker] 跟踪器已重置');
    }

    /**
     * 获取跟踪器状态
     */
    getTrackerStatus() {
        return {
            name: 'TaskProgressTracker',
            version: '1.0.0',
            config: this.config,
            stats: {
                activeTasks: this.tasks.size,
                historyRecords: this.history.length,
                uptime: Date.now() - this.startTime.getTime()
            },
            isReady: true
        };
    }
}

export default TaskProgressTracker;