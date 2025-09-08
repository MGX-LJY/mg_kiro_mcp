/**
 * 统一响应工具
 * 标准化所有API的响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {Object} data - 响应数据
 * @param {string} message - 消息
 * @param {number} status - 状态码
 */
export function success(res, data = null, message = 'Success', status = 200) {
    return res.status(status).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} error - 错误信息
 * @param {number} status - 状态码
 * @param {Object} details - 错误详情
 */
export function error(res, error = 'Internal Server Error', status = 500, details = null) {
    return res.status(status).json({
        success: false,
        error,
        details,
        timestamp: new Date().toISOString()
    });
}

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象  
 * @param {Object|string} errors - 验证错误（对象或字符串）
 * @param {string} message - 错误信息
 */
export function validationError(res, errors = {}, message = 'Validation failed') {
    // 支持多种参数格式
    let finalErrors = errors;
    let finalMessage = message;
    
    if (typeof errors === 'string') {
        finalMessage = errors;
        finalErrors = {};
    }
    
    return res.status(400).json({
        success: false,
        error: finalMessage,
        errors: finalErrors,
        timestamp: new Date().toISOString()
    });
}

/**
 * 未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误信息
 * @param {string} resource - 资源名称  
 */
export function notFound(res, message = null, resource = 'Resource') {
    const errorMessage = message || `${resource} not found`;
    
    return res.status(404).json({
        success: false,
        error: errorMessage,
        resource: resource !== 'Resource' ? resource : undefined,
        timestamp: new Date().toISOString()
    });
}

/**
 * 工作流响应 (专用于工作流API)
 * @param {Object} res - Express响应对象
 * @param {Object} data - 数据
 * @param {string} workflow - 工作流名称
 * @param {string} message - 消息
 * @param {number} status - 状态码
 */
export function workflowSuccess(res, data, workflow, message = 'Workflow success', status = 200) {
    return res.status(status).json({
        success: true,
        message,
        workflow,
        data,
        timestamp: new Date().toISOString()
    });
}

export default {
    success,
    error,
    validationError,
    notFound,
    workflowSuccess
};