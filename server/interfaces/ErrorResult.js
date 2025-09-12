/**
 * ErrorResult 统一错误处理接口
 * 
 * 解决系统中多种不同错误格式并存的问题
 * 统一所有服务的错误返回格式，提供一致的错误处理体验
 * 
 * @version 1.0.0
 * @date 2025-09-12
 */

/**
 * 错误代码枚举
 * @typedef {'VALIDATION_ERROR'|'ANALYSIS_ERROR'|'PROCESSING_ERROR'|'NETWORK_ERROR'|'PERMISSION_ERROR'|'TIMEOUT_ERROR'|'RESOURCE_ERROR'|'CONFIGURATION_ERROR'|'DEPENDENCY_ERROR'|'UNKNOWN_ERROR'} ErrorCode
 */

/**
 * 错误类型枚举
 * @typedef {'CLIENT_ERROR'|'SERVER_ERROR'|'SYSTEM_ERROR'|'SERVICE_ERROR'} ErrorType
 */

/**
 * 统一成功结果接口
 * @template T
 * @typedef {Object} SuccessResult
 * @property {true} success - 成功标识
 * @property {T} data - 成功数据
 * @property {ResultMetadata} [metadata] - 结果元数据
 */

/**
 * 统一错误结果接口
 * @typedef {Object} ErrorResult
 * @property {false} success - 失败标识
 * @property {ErrorInfo} error - 错误信息
 */

/**
 * 错误详情信息
 * @typedef {Object} ErrorInfo
 * @property {ErrorCode} code - 错误代码
 * @property {string} message - 错误消息
 * @property {ErrorType} type - 错误类型
 * @property {ErrorContext} context - 错误上下文
 * @property {string} timestamp - 错误时间戳
 * @property {string} [stack] - 错误堆栈（仅开发环境）
 * @property {string} [requestId] - 请求ID（用于追踪）
 */

/**
 * 错误上下文信息
 * @typedef {Object} ErrorContext
 * @property {string} [service] - 服务名称
 * @property {string} [method] - 方法名称
 * @property {string} [operation] - 操作名称
 * @property {Object} [params] - 参数信息
 * @property {string} [projectPath] - 项目路径
 * @property {string} [filePath] - 文件路径
 * @property {string} [tool] - 工具名称
 * @property {number} [step] - 步骤编号
 */

/**
 * 结果元数据
 * @typedef {Object} ResultMetadata
 * @property {number} processingTime - 处理时间（毫秒）
 * @property {string} timestamp - 时间戳
 * @property {string} version - 版本信息
 * @property {Object} [metrics] - 性能指标
 */

/**
 * 结果类型联合
 * @template T
 * @typedef {SuccessResult<T>|ErrorResult} Result
 */

/**
 * ErrorResult工厂类
 */
export class ErrorResultFactory {
    /**
     * 创建成功结果
     * @template T
     * @param {T} data - 成功数据
     * @param {Object} options - 可选参数
     * @returns {SuccessResult<T>}
     */
    static createSuccess(data, options = {}) {
        const result = {
            success: true,
            data
        };

        // 添加元数据（如果提供）
        if (options.metadata || options.processingTime !== undefined) {
            result.metadata = {
                processingTime: options.processingTime || 0,
                timestamp: options.timestamp || new Date().toISOString(),
                version: options.version || '1.0.0',
                metrics: options.metrics || null
            };
        }

        return result;
    }

    /**
     * 创建错误结果
     * @param {ErrorCode} code - 错误代码
     * @param {string} message - 错误消息
     * @param {ErrorType} type - 错误类型
     * @param {ErrorContext} context - 错误上下文
     * @param {Object} options - 可选参数
     * @returns {ErrorResult}
     */
    static createError(code, message, type, context = {}, options = {}) {
        const error = {
            code,
            message,
            type,
            context,
            timestamp: new Date().toISOString()
        };

        // 添加堆栈信息（仅开发环境）
        if (options.includeStack && options.stack) {
            error.stack = options.stack;
        }

        // 添加请求ID
        if (options.requestId) {
            error.requestId = options.requestId;
        }

        return {
            success: false,
            error
        };
    }

    /**
     * 创建验证错误
     * @param {string} message - 错误消息
     * @param {ErrorContext} context - 错误上下文
     * @returns {ErrorResult}
     */
    static createValidationError(message, context = {}) {
        return this.createError(
            'VALIDATION_ERROR',
            message,
            'CLIENT_ERROR',
            { ...context, operation: 'validation' }
        );
    }

    /**
     * 创建分析错误
     * @param {string} message - 错误消息
     * @param {ErrorContext} context - 错误上下文
     * @returns {ErrorResult}
     */
    static createAnalysisError(message, context = {}) {
        return this.createError(
            'ANALYSIS_ERROR',
            message,
            'SERVICE_ERROR',
            { ...context, operation: 'analysis' }
        );
    }

    /**
     * 创建处理错误
     * @param {string} message - 错误消息
     * @param {ErrorContext} context - 错误上下文
     * @returns {ErrorResult}
     */
    static createProcessingError(message, context = {}) {
        return this.createError(
            'PROCESSING_ERROR',
            message,
            'SERVER_ERROR',
            { ...context, operation: 'processing' }
        );
    }

    /**
     * 创建配置错误
     * @param {string} message - 错误消息
     * @param {ErrorContext} context - 错误上下文
     * @returns {ErrorResult}
     */
    static createConfigurationError(message, context = {}) {
        return this.createError(
            'CONFIGURATION_ERROR',
            message,
            'SYSTEM_ERROR',
            { ...context, operation: 'configuration' }
        );
    }

    /**
     * 创建依赖错误
     * @param {string} message - 错误消息
     * @param {ErrorContext} context - 错误上下文
     * @returns {ErrorResult}
     */
    static createDependencyError(message, context = {}) {
        return this.createError(
            'DEPENDENCY_ERROR',
            message,
            'SYSTEM_ERROR',
            { ...context, operation: 'dependency_check' }
        );
    }

    /**
     * 从JavaScript Error对象创建错误结果
     * @param {Error} error - JavaScript错误对象
     * @param {ErrorContext} context - 错误上下文
     * @param {Object} options - 可选参数
     * @returns {ErrorResult}
     */
    static fromJavaScriptError(error, context = {}, options = {}) {
        const code = this._mapErrorTypeToCode(error.name) || 'UNKNOWN_ERROR';
        const type = this._mapErrorTypeToResultType(error.name) || 'SERVER_ERROR';

        return this.createError(
            code,
            error.message,
            type,
            context,
            {
                includeStack: process.env.NODE_ENV === 'development',
                stack: error.stack,
                ...options
            }
        );
    }

    /**
     * 从旧格式错误转换
     * @param {*} oldError - 旧格式的错误
     * @returns {ErrorResult}
     */
    static fromLegacyError(oldError) {
        if (!oldError) {
            return this.createError('UNKNOWN_ERROR', 'Unknown error occurred', 'SERVER_ERROR');
        }

        // 格式A: { success: false, error: { message, type, projectPath, timestamp } }
        if (oldError.success === false && oldError.error) {
            const legacyError = oldError.error;
            return this.createError(
                legacyError.type || 'UNKNOWN_ERROR',
                legacyError.message || 'Unknown error',
                'SERVER_ERROR',
                {
                    projectPath: legacyError.projectPath,
                    service: 'legacy_service'
                }
            );
        }

        // 格式B: { error: true, message, tool }
        if (oldError.error === true && oldError.message) {
            return this.createError(
                'VALIDATION_ERROR',
                oldError.message,
                'CLIENT_ERROR',
                {
                    tool: oldError.tool,
                    step: oldError.step,
                    service: 'mcp_tool'
                }
            );
        }

        // JavaScript Error对象
        if (oldError instanceof Error) {
            return this.fromJavaScriptError(oldError);
        }

        // 字符串错误
        if (typeof oldError === 'string') {
            return this.createError('UNKNOWN_ERROR', oldError, 'SERVER_ERROR');
        }

        // 其他格式
        return this.createError(
            'UNKNOWN_ERROR',
            JSON.stringify(oldError),
            'SERVER_ERROR',
            { originalFormat: 'unknown' }
        );
    }

    /**
     * 映射JavaScript错误类型到错误代码
     * @private
     */
    static _mapErrorTypeToCode(errorName) {
        const mapping = {
            'ValidationError': 'VALIDATION_ERROR',
            'TypeError': 'VALIDATION_ERROR',
            'ReferenceError': 'DEPENDENCY_ERROR',
            'NetworkError': 'NETWORK_ERROR',
            'TimeoutError': 'TIMEOUT_ERROR',
            'PermissionError': 'PERMISSION_ERROR',
            'SyntaxError': 'CONFIGURATION_ERROR'
        };
        return mapping[errorName];
    }

    /**
     * 映射JavaScript错误类型到结果类型
     * @private
     */
    static _mapErrorTypeToResultType(errorName) {
        const mapping = {
            'ValidationError': 'CLIENT_ERROR',
            'TypeError': 'CLIENT_ERROR',
            'ReferenceError': 'SYSTEM_ERROR',
            'NetworkError': 'NETWORK_ERROR',
            'TimeoutError': 'SERVER_ERROR',
            'PermissionError': 'CLIENT_ERROR',
            'SyntaxError': 'CLIENT_ERROR'
        };
        return mapping[errorName];
    }

    /**
     * 验证Result格式
     * @param {*} result - 待验证的结果
     * @returns {boolean}
     */
    static isValidResult(result) {
        if (!result || typeof result !== 'object') {
            return false;
        }

        // 必须有success字段
        if (typeof result.success !== 'boolean') {
            return false;
        }

        // 成功结果验证
        if (result.success === true) {
            return 'data' in result; // 必须有data字段
        }

        // 错误结果验证
        if (result.success === false) {
            if (!result.error || typeof result.error !== 'object') {
                return false;
            }
            
            const error = result.error;
            return typeof error.code === 'string' &&
                   typeof error.message === 'string' &&
                   typeof error.type === 'string' &&
                   typeof error.timestamp === 'string';
        }

        return false;
    }
}

/**
 * Result访问助手
 */
export class ResultHelper {
    /**
     * 检查是否为成功结果
     * @param {Result} result - 结果对象
     * @returns {boolean}
     */
    static isSuccess(result) {
        return result?.success === true;
    }

    /**
     * 检查是否为错误结果
     * @param {Result} result - 结果对象
     * @returns {boolean}
     */
    static isError(result) {
        return result?.success === false;
    }

    /**
     * 获取成功数据
     * @template T
     * @param {Result<T>} result - 结果对象
     * @returns {T|null}
     */
    static getData(result) {
        return this.isSuccess(result) ? result.data : null;
    }

    /**
     * 获取错误信息
     * @param {Result} result - 结果对象
     * @returns {ErrorInfo|null}
     */
    static getError(result) {
        return this.isError(result) ? result.error : null;
    }

    /**
     * 获取错误消息
     * @param {Result} result - 结果对象
     * @returns {string|null}
     */
    static getErrorMessage(result) {
        const error = this.getError(result);
        return error?.message || null;
    }

    /**
     * 获取错误代码
     * @param {Result} result - 结果对象
     * @returns {ErrorCode|null}
     */
    static getErrorCode(result) {
        const error = this.getError(result);
        return error?.code || null;
    }

    /**
     * 获取处理时间
     * @param {Result} result - 结果对象
     * @returns {number}
     */
    static getProcessingTime(result) {
        return result?.metadata?.processingTime || 0;
    }

    /**
     * 创建简化的错误信息（用于日志）
     * @param {Result} result - 结果对象
     * @returns {string}
     */
    static createLogMessage(result) {
        if (this.isSuccess(result)) {
            const processingTime = this.getProcessingTime(result);
            return `Success (${processingTime}ms)`;
        }

        const error = this.getError(result);
        if (error) {
            return `${error.code}: ${error.message} [${error.type}]`;
        }

        return 'Unknown result format';
    }

    /**
     * 批量检查结果
     * @param {Array<Result>} results - 结果数组
     * @returns {{successCount: number, errorCount: number, totalCount: number}}
     */
    static batchAnalyze(results) {
        if (!Array.isArray(results)) {
            return { successCount: 0, errorCount: 0, totalCount: 0 };
        }

        const successCount = results.filter(r => this.isSuccess(r)).length;
        const errorCount = results.filter(r => this.isError(r)).length;
        const totalCount = results.length;

        return { successCount, errorCount, totalCount };
    }
}

// 导出常量
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    ANALYSIS_ERROR: 'ANALYSIS_ERROR',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    RESOURCE_ERROR: 'RESOURCE_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const ERROR_TYPES = {
    CLIENT_ERROR: 'CLIENT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR', 
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    SERVICE_ERROR: 'SERVICE_ERROR'
};