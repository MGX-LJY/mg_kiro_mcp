/**
 * TaskStateManager - 任务状态管理器
 * 
 * 核心功能：
 * 1. 任务状态持久化存储
 * 2. 状态转换管理和验证
 * 3. 任务元数据管理
 * 4. 状态恢复和数据备份机制
 * 5. 与UnifiedTaskManager的集成接口
 */

import fs from 'fs/promises';
import path from 'path';

export class TaskStateManager {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 依赖注入（ServiceBus格式：config, dependencies, serviceBus）
        this.logger = dependencies.logger || console;
        this.storagePath = config.storagePath || dependencies.storagePath || 'temp';
        this.serviceBus = serviceBus;
        
        // 状态管理
        this.stateFile = path.join(this.storagePath, 'task_states.json');
        this.backupPath = path.join(this.storagePath, 'backups');
        
        // 有效状态定义
        this.validStates = new Set([
            'pending',          // 待处理
            'in_progress',      // 处理中
            'completed',        // 已完成
            'failed',           // 失败
            'validation_failed', // 验证失败
            'retry_pending',    // 待重试
            'cancelled'         // 已取消
        ]);
        
        // 状态转换规则
        this.stateTransitions = {
            'pending': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'failed', 'validation_failed'],
            'failed': ['retry_pending', 'cancelled'],
            'validation_failed': ['retry_pending', 'in_progress'],
            'retry_pending': ['in_progress', 'failed', 'cancelled'],
            'completed': [], // 最终状态
            'cancelled': []  // 最终状态
        };
        
        // 内存状态缓存
        this.stateCache = new Map();
        this.isDirty = false;
        this.lastSaved = null;
        
        // 初始化完成标志
        this.initialized = false;
    }

    /**
     * 初始化状态管理器
     */
    async initialize() {
        try {
            // 确保存储目录存在
            await fs.mkdir(this.storagePath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });
            
            // 加载现有状态
            await this.loadStates();
            
            this.initialized = true;
            this.logger.info('TaskStateManager initialized successfully');
            return { success: true };
            
        } catch (error) {
            this.logger.error(`Failed to initialize TaskStateManager: ${error.message}`);
            throw error;
        }
    }

    /**
     * 设置任务状态
     */
    async setState(taskId, newState, metadata = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            // 验证状态
            if (!this.validStates.has(newState)) {
                throw new Error(`Invalid state: ${newState}`);
            }
            
            // 获取当前状态
            const currentState = this.stateCache.get(taskId);
            const oldState = currentState ? currentState.status : null;
            
            // 验证状态转换
            if (oldState && !this.isValidTransition(oldState, newState)) {
                throw new Error(`Invalid state transition from ${oldState} to ${newState}`);
            }
            
            // 创建状态记录
            const stateRecord = {
                taskId,
                status: newState,
                previousStatus: oldState,
                timestamp: new Date().toISOString(),
                metadata: {
                    ...metadata,
                    transitionTime: new Date().toISOString()
                }
            };
            
            // 如果有旧状态，保留历史记录
            if (currentState) {
                stateRecord.history = currentState.history || [];
                stateRecord.history.push({
                    status: oldState,
                    timestamp: currentState.timestamp,
                    metadata: currentState.metadata
                });
                
                // 限制历史记录长度
                if (stateRecord.history.length > 10) {
                    stateRecord.history = stateRecord.history.slice(-10);
                }
            }
            
            // 更新缓存
            this.stateCache.set(taskId, stateRecord);
            this.isDirty = true;
            
            // 自动保存机制
            if (this.shouldAutoSave()) {
                await this.saveStates();
            }
            
            this.logger.info(`Task ${taskId} state changed: ${oldState} → ${newState}`);
            return { success: true, previousState: oldState, newState };
            
        } catch (error) {
            this.logger.error(`Failed to set task state: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取任务状态
     */
    async getState(taskId) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            const stateRecord = this.stateCache.get(taskId);
            
            if (!stateRecord) {
                return { success: false, message: 'Task not found' };
            }
            
            return {
                success: true,
                state: {
                    taskId: stateRecord.taskId,
                    status: stateRecord.status,
                    previousStatus: stateRecord.previousStatus,
                    timestamp: stateRecord.timestamp,
                    metadata: stateRecord.metadata,
                    historyCount: stateRecord.history ? stateRecord.history.length : 0
                }
            };
            
        } catch (error) {
            this.logger.error(`Failed to get task state: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 获取所有任务状态
     */
    async getAllStates(statusFilter = null) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            let states = Array.from(this.stateCache.values());
            
            // 应用状态过滤
            if (statusFilter) {
                if (Array.isArray(statusFilter)) {
                    states = states.filter(state => statusFilter.includes(state.status));
                } else {
                    states = states.filter(state => state.status === statusFilter);
                }
            }
            
            // 转换为简化格式
            const simplifiedStates = states.map(state => ({
                taskId: state.taskId,
                status: state.status,
                previousStatus: state.previousStatus,
                timestamp: state.timestamp,
                historyCount: state.history ? state.history.length : 0
            }));
            
            return {
                success: true,
                states: simplifiedStates,
                total: simplifiedStates.length,
                cached: this.stateCache.size
            };
            
        } catch (error) {
            this.logger.error(`Failed to get all states: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 获取任务历史记录
     */
    async getTaskHistory(taskId) {
        try {
            const stateRecord = this.stateCache.get(taskId);
            
            if (!stateRecord) {
                return { success: false, message: 'Task not found' };
            }
            
            const history = stateRecord.history || [];
            const currentState = {
                status: stateRecord.status,
                timestamp: stateRecord.timestamp,
                metadata: stateRecord.metadata
            };
            
            return {
                success: true,
                taskId,
                currentState,
                history,
                totalTransitions: history.length
            };
            
        } catch (error) {
            this.logger.error(`Failed to get task history: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 删除任务状态
     */
    async deleteState(taskId) {
        try {
            if (!this.stateCache.has(taskId)) {
                return { success: false, message: 'Task not found' };
            }
            
            this.stateCache.delete(taskId);
            this.isDirty = true;
            
            this.logger.info(`Deleted state for task ${taskId}`);
            return { success: true, message: 'Task state deleted' };
            
        } catch (error) {
            this.logger.error(`Failed to delete task state: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * 批量更新任务状态
     */
    async batchUpdateStates(updates) {
        try {
            const results = [];
            
            for (const update of updates) {
                const { taskId, status, metadata = {} } = update;
                
                try {
                    await this.setState(taskId, status, metadata);
                    results.push({ taskId, success: true });
                } catch (error) {
                    results.push({ 
                        taskId, 
                        success: false, 
                        error: error.message 
                    });
                }
            }
            
            // 批量操作后保存
            if (this.isDirty) {
                await this.saveStates();
            }
            
            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;
            
            this.logger.info(`Batch update completed: ${successful} successful, ${failed} failed`);
            return { success: true, results, successful, failed };
            
        } catch (error) {
            this.logger.error(`Batch update failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 状态持久化保存
     */
    async saveStates() {
        try {
            if (!this.isDirty) {
                return { success: true, message: 'No changes to save' };
            }
            
            // 创建备份
            await this.createBackup();
            
            // 转换为可序列化格式
            const statesData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                states: Object.fromEntries(this.stateCache.entries())
            };
            
            // 写入状态文件
            await fs.writeFile(
                this.stateFile, 
                JSON.stringify(statesData, null, 2), 
                'utf8'
            );
            
            this.isDirty = false;
            this.lastSaved = new Date().toISOString();
            
            this.logger.info(`States saved to ${this.stateFile}`);
            return { success: true, count: this.stateCache.size };
            
        } catch (error) {
            this.logger.error(`Failed to save states: ${error.message}`);
            throw error;
        }
    }

    /**
     * 加载状态数据
     */
    async loadStates() {
        try {
            if (!await this.fileExists(this.stateFile)) {
                this.logger.info('No existing state file found, starting fresh');
                return { success: true, message: 'Starting with empty state' };
            }
            
            const data = await fs.readFile(this.stateFile, 'utf8');
            const statesData = JSON.parse(data);
            
            // 验证数据格式
            if (!statesData.states) {
                throw new Error('Invalid state file format');
            }
            
            // 加载到缓存
            this.stateCache.clear();
            for (const [taskId, stateRecord] of Object.entries(statesData.states)) {
                this.stateCache.set(taskId, stateRecord);
            }
            
            this.isDirty = false;
            this.lastSaved = statesData.timestamp;
            
            this.logger.info(`Loaded ${this.stateCache.size} task states from ${this.stateFile}`);
            return { success: true, count: this.stateCache.size };
            
        } catch (error) {
            this.logger.error(`Failed to load states: ${error.message}`);
            // 尝试从备份恢复
            await this.restoreFromBackup();
            throw error;
        }
    }

    /**
     * 创建状态备份
     */
    async createBackup() {
        try {
            if (!await this.fileExists(this.stateFile)) {
                return { success: true, message: 'No state file to backup' };
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupPath, `task_states_${timestamp}.json`);
            
            await fs.copyFile(this.stateFile, backupFile);
            
            // 清理旧备份 (保留最近10个)
            await this.cleanupOldBackups(10);
            
            this.logger.info(`Created backup: ${backupFile}`);
            return { success: true, backupFile };
            
        } catch (error) {
            this.logger.error(`Failed to create backup: ${error.message}`);
            throw error;
        }
    }

    /**
     * 从备份恢复状态
     */
    async restoreFromBackup() {
        try {
            const backups = await fs.readdir(this.backupPath);
            const stateBackups = backups
                .filter(f => f.startsWith('task_states_') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (stateBackups.length === 0) {
                this.logger.warn('No backup files found for restoration');
                return { success: false, message: 'No backups available' };
            }
            
            // 尝试从最新备份恢复
            const latestBackup = path.join(this.backupPath, stateBackups[0]);
            await fs.copyFile(latestBackup, this.stateFile);
            
            // 重新加载
            await this.loadStates();
            
            this.logger.info(`Restored from backup: ${latestBackup}`);
            return { success: true, backupFile: latestBackup };
            
        } catch (error) {
            this.logger.error(`Failed to restore from backup: ${error.message}`);
            throw error;
        }
    }

    /**
     * 重置所有状态
     */
    async reset() {
        try {
            // 创建备份
            if (this.stateCache.size > 0) {
                await this.createBackup();
            }
            
            // 清空缓存
            this.stateCache.clear();
            this.isDirty = true;
            
            // 保存空状态
            await this.saveStates();
            
            this.logger.info('TaskStateManager reset successfully');
            return { success: true, message: 'All states reset' };
            
        } catch (error) {
            this.logger.error(`Failed to reset states: ${error.message}`);
            throw error;
        }
    }

    /**
     * 验证状态转换是否有效
     */
    isValidTransition(fromState, toState) {
        if (!this.validStates.has(fromState) || !this.validStates.has(toState)) {
            return false;
        }
        
        const allowedTransitions = this.stateTransitions[fromState];
        return allowedTransitions.includes(toState);
    }

    /**
     * 判断是否需要自动保存
     */
    shouldAutoSave() {
        // 每5分钟或状态变化达到20个时自动保存
        const timeSinceLastSave = this.lastSaved 
            ? Date.now() - new Date(this.lastSaved).getTime()
            : Infinity;
        
        return timeSinceLastSave > 5 * 60 * 1000 || this.stateCache.size % 20 === 0;
    }

    /**
     * 清理旧备份文件
     */
    async cleanupOldBackups(keepCount = 10) {
        try {
            const backups = await fs.readdir(this.backupPath);
            const stateBackups = backups
                .filter(f => f.startsWith('task_states_') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (stateBackups.length <= keepCount) {
                return { success: true, message: 'No cleanup needed' };
            }
            
            const toDelete = stateBackups.slice(keepCount);
            
            for (const backup of toDelete) {
                await fs.unlink(path.join(this.backupPath, backup));
            }
            
            this.logger.info(`Cleaned up ${toDelete.length} old backup files`);
            return { success: true, cleaned: toDelete.length };
            
        } catch (error) {
            this.logger.error(`Failed to cleanup old backups: ${error.message}`);
            throw error;
        }
    }

    /**
     * 检查文件是否存在
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取状态管理器统计信息
     */
    async getStatistics() {
        try {
            const states = Array.from(this.stateCache.values());
            const statusCounts = {};
            
            // 统计各状态数量
            for (const state of states) {
                statusCounts[state.status] = (statusCounts[state.status] || 0) + 1;
            }
            
            return {
                success: true,
                statistics: {
                    totalTasks: states.length,
                    statusBreakdown: statusCounts,
                    cacheSize: this.stateCache.size,
                    isDirty: this.isDirty,
                    lastSaved: this.lastSaved,
                    initialized: this.initialized,
                    storageInfo: {
                        stateFile: this.stateFile,
                        backupPath: this.backupPath
                    }
                }
            };
            
        } catch (error) {
            this.logger.error(`Failed to get statistics: ${error.message}`);
            return { success: false, message: error.message };
        }
    }
}

export default TaskStateManager;