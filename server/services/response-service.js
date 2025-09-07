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
 * @param {string} message - 错误信息
 * @param {Object} fields - 验证失败的字段
 */
export function validationError(res, message = 'Validation failed', fields = null) {
    return res.status(400).json({
        success: false,
        error: message,
        fields,
        timestamp: new Date().toISOString()
    });
}

/**
 * 未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} resource - 资源名称
 */
export function notFound(res, resource = 'Resource') {
    return res.status(404).json({
        success: false,
        error: `${resource} not found`,
        timestamp: new Date().toISOString()
    });
}

/**
 * 工作流响应 (专用于工作流API)
 * @param {Object} res - Express响应对象
 * @param {number} step - 步骤号
 * @param {string} stepName - 步骤名称
 * @param {string} workflowId - 工作流ID
 * @param {Object} data - 数据
 * @param {Object} workflowProgress - 工作流进度
 */
export function workflowSuccess(res, step, stepName, workflowId, data, workflowProgress = null) {
    return res.json({
        success: true,
        step,
        stepName,
        workflowId,
        data,
        workflowProgress,
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