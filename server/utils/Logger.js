/**
 * 统一Logger服务 - 结构化日志记录
 * 
 * 功能特点：
 * - 结构化日志格式
 * - 日志级别管理
 * - 请求追踪ID
 * - 性能监控
 * - 错误堆栈记录
 * - 上下文信息记录
 * 
 * @version 1.0.0
 * @date 2025-09-12
 */

export class Logger {
    constructor(serviceName = 'Unknown', config = {}) {
        this.serviceName = serviceName;
        this.config = {
            level: config.level || 'info',
            enableColors: config.enableColors !== false,
            enableTimestamp: config.enableTimestamp !== false,
            enableRequestId: config.enableRequestId !== false,
            enablePerformance: config.enablePerformance !== false,
            maxMessageLength: config.maxMessageLength || 2000,
            ...config
        };

        // 日志级别优先级
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        // 颜色映射
        this.colors = {
            error: '\x1b[31m',  // 红色
            warn: '\x1b[33m',   // 黄色
            info: '\x1b[36m',   // 青色
            debug: '\x1b[32m',  // 绿色
            trace: '\x1b[35m',  // 紫色
            reset: '\x1b[0m'    // 重置
        };

        // 当前请求ID
        this.currentRequestId = null;
        
        // 性能计时器存储
        this.timers = new Map();
    }

    /**
     * 设置当前请求ID
     */
    setRequestId(requestId) {
        this.currentRequestId = requestId;
    }

    /**
     * 生成新的请求ID
     */
    generateRequestId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.currentRequestId = `${timestamp}-${random}`;
        return this.currentRequestId;
    }

    /**
     * 开始性能计时
     */
    startTimer(timerId) {
        if (this.config.enablePerformance) {
            this.timers.set(timerId, {
                startTime: process.hrtime.bigint(),
                startTimestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 结束性能计时并记录
     */
    endTimer(timerId, message = '', context = {}) {
        if (!this.config.enablePerformance || !this.timers.has(timerId)) {
            return null;
        }

        const timerData = this.timers.get(timerId);
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - timerData.startTime) / 1000000;

        this.timers.delete(timerId);

        const performanceLog = {
            timerId,
            message: message || `Timer ${timerId} completed`,
            durationMs: Math.round(durationMs * 100) / 100,
            startTime: timerData.startTimestamp,
            endTime: new Date().toISOString(),
            ...context
        };

        this.info('Performance', performanceLog);
        return performanceLog;
    }

    /**
     * 记录错误日志
     */
    error(message, error = null, context = {}) {
        this._log('error', message, { error, ...context });
    }

    /**
     * 记录警告日志
     */
    warn(message, context = {}) {
        this._log('warn', message, context);
    }

    /**
     * 记录信息日志
     */
    info(message, context = {}) {
        this._log('info', message, context);
    }

    /**
     * 记录调试日志
     */
    debug(message, context = {}) {
        this._log('debug', message, context);
    }

    /**
     * 记录追踪日志
     */
    trace(message, context = {}) {
        this._log('trace', message, context);
    }

    /**
     * 记录方法开始
     */
    methodStart(methodName, params = {}) {
        const timerId = `${this.serviceName}.${methodName}`;
        this.startTimer(timerId);
        
        this.debug(`${methodName} 开始`, {
            method: methodName,
            params: this._sanitizeParams(params),
            phase: 'start'
        });
        
        return timerId;
    }

    /**
     * 记录方法结束
     */
    methodEnd(timerId, methodName, result = null) {
        const performanceData = this.endTimer(timerId, `${methodName} 完成`);
        
        this.debug(`${methodName} 完成`, {
            method: methodName,
            phase: 'end',
            duration: performanceData?.durationMs,
            resultType: result ? typeof result : 'void',
            success: !result?.error && !result?.success === false
        });
    }

    /**
     * 记录方法错误
     */
    methodError(timerId, methodName, error, context = {}) {
        if (this.timers.has(timerId)) {
            this.endTimer(timerId, `${methodName} 失败`);
        }
        
        this.error(`${methodName} 执行失败`, error, {
            method: methodName,
            phase: 'error',
            ...context
        });
    }

    /**
     * 记录数据结构转换
     */
    logDataTransformation(operation, from, to, context = {}) {
        this.debug(`数据转换: ${operation}`, {
            operation,
            fromType: typeof from,
            toType: typeof to,
            fromFields: from && typeof from === 'object' ? Object.keys(from) : null,
            toFields: to && typeof to === 'object' ? Object.keys(to) : null,
            success: !!to,
            ...context
        });
    }

    /**
     * 记录Token计算
     */
    logTokenCalculation(filePath, result, context = {}) {
        this.info('Token计算', {
            filePath,
            totalTokens: result?.totalTokens,
            calculationMethod: result?.metadata?.calculationMethod,
            confidence: result?.details?.confidence,
            fromCache: result?.metadata?.fromCache,
            error: result?.metadata?.error,
            success: !result?.metadata?.error,
            ...context
        });
    }

    /**
     * 记录错误结果创建
     */
    logErrorResult(errorCode, errorType, message, context = {}) {
        this.warn('错误结果创建', {
            errorCode,
            errorType,
            message: this._truncateMessage(message),
            context: this._sanitizeParams(context),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 记录任务定义创建
     */
    logTaskDefinition(taskId, taskType, fileCount, estimatedTokens, context = {}) {
        this.info('任务定义创建', {
            taskId,
            taskType,
            fileCount,
            estimatedTokens,
            strategy: context.strategy,
            batchId: context.batchId,
            projectPath: context.projectPath,
            success: true
        });
    }

    /**
     * 记录批次处理
     */
    logBatchProcessing(batchId, batchType, fileCount, estimatedTokens, phase, context = {}) {
        this.info(`批次处理: ${phase}`, {
            batchId,
            batchType,
            fileCount,
            estimatedTokens,
            phase,
            ...context
        });
    }

    /**
     * 核心日志记录方法
     * @private
     */
    _log(level, message, context = {}) {
        // 检查日志级别
        if (!this._shouldLog(level)) {
            return;
        }

        // 构建日志对象
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            service: this.serviceName,
            message: this._truncateMessage(message),
            requestId: this.currentRequestId,
            ...this._sanitizeContext(context)
        };

        // 处理错误对象
        if (context.error && context.error instanceof Error) {
            logEntry.error = {
                name: context.error.name,
                message: context.error.message,
                stack: this._sanitizeStack(context.error.stack)
            };
            delete logEntry.error; // 从主context中移除，避免重复
        }

        // 输出日志
        this._outputLog(level, logEntry);
    }

    /**
     * 检查是否应该记录此级别的日志
     * @private
     */
    _shouldLog(level) {
        const currentLevelPriority = this.levels[this.config.level] || 2;
        const logLevelPriority = this.levels[level] || 2;
        return logLevelPriority <= currentLevelPriority;
    }

    /**
     * 输出日志
     * @private
     */
    _outputLog(level, logEntry) {
        const color = this.config.enableColors ? this.colors[level] : '';
        const reset = this.config.enableColors ? this.colors.reset : '';
        
        // 简化的控制台输出
        const simpleMessage = `${color}[${logEntry.level}]${reset} ${logEntry.service}: ${logEntry.message}`;
        
        if (logEntry.requestId || Object.keys(logEntry).length > 4) {
            // 有额外信息时输出详细日志
            console.log(simpleMessage);
            console.log('  ', JSON.stringify(logEntry, null, 2));
        } else {
            // 简单日志直接输出
            console.log(simpleMessage);
        }
    }

    /**
     * 清理上下文信息
     * @private
     */
    _sanitizeContext(context) {
        const sanitized = { ...context };
        
        // 移除敏感信息
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        
        // 处理大型对象
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === 'object' && value !== null) {
                if (JSON.stringify(value).length > 500) {
                    sanitized[key] = '[Large Object]';
                }
            }
        }
        
        return sanitized;
    }

    /**
     * 清理参数信息
     * @private
     */
    _sanitizeParams(params) {
        if (!params || typeof params !== 'object') {
            return params;
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string' && value.length > 100) {
                sanitized[key] = `${value.substring(0, 100)}...`;
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = '[Object]';
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    /**
     * 截断消息
     * @private
     */
    _truncateMessage(message) {
        if (typeof message !== 'string') {
            message = String(message);
        }
        
        if (message.length <= this.config.maxMessageLength) {
            return message;
        }
        
        return message.substring(0, this.config.maxMessageLength) + '...';
    }

    /**
     * 清理错误堆栈
     * @private
     */
    _sanitizeStack(stack) {
        if (!stack) return null;
        
        // 只保留前10行堆栈信息
        return stack.split('\n').slice(0, 10).join('\n');
    }

    /**
     * 创建子Logger
     */
    createChild(childName, additionalConfig = {}) {
        const fullName = `${this.serviceName}.${childName}`;
        const childConfig = { ...this.config, ...additionalConfig };
        const childLogger = new Logger(fullName, childConfig);
        
        // 继承当前请求ID
        childLogger.currentRequestId = this.currentRequestId;
        
        return childLogger;
    }
}

/**
 * Logger工厂类
 */
export class LoggerFactory {
    static loggers = new Map();
    static globalConfig = {
        level: process.env.LOG_LEVEL || 'info',
        enableColors: process.env.NODE_ENV !== 'production',
        enablePerformance: process.env.ENABLE_PERFORMANCE_LOGS !== 'false'
    };

    /**
     * 获取或创建Logger实例
     */
    static getLogger(serviceName, config = {}) {
        if (!this.loggers.has(serviceName)) {
            const mergedConfig = { ...this.globalConfig, ...config };
            this.loggers.set(serviceName, new Logger(serviceName, mergedConfig));
        }
        return this.loggers.get(serviceName);
    }

    /**
     * 设置全局配置
     */
    static setGlobalConfig(config) {
        this.globalConfig = { ...this.globalConfig, ...config };
        
        // 更新现有的Logger实例
        for (const logger of this.loggers.values()) {
            logger.config = { ...logger.config, ...config };
        }
    }

    /**
     * 清理所有Logger实例
     */
    static cleanup() {
        this.loggers.clear();
    }
}

export default Logger;