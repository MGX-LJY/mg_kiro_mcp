/**
 * 工作流服务
 * 管理mg_kiro MCP的8步工作流程状态和转换
 */

import { WorkflowState } from './workflow-state-service.js';

class WorkflowService {
    constructor(workflowState = null) {
        this.workflowState = workflowState || new WorkflowState();
    }

    /**
     * 创建新的工作流
     * @param {string} projectPath - 项目路径
     * @param {string} mode - 工作模式
     * @returns {string} 工作流ID
     */
    createWorkflow(projectPath, mode = 'init') {
        return this.workflowState.createWorkflow(projectPath, mode);
    }

    /**
     * 创建带指定ID的工作流
     * @param {string} workflowId - 指定的工作流ID
     * @param {string} projectPath - 项目路径
     * @param {string} mode - 工作模式
     * @returns {string} 工作流ID
     */
    createWorkflowWithId(workflowId, projectPath, mode = 'init') {
        return this.workflowState.createWorkflowWithId(workflowId, projectPath, mode);
    }

    /**
     * 获取工作流信息
     * @param {string} workflowId - 工作流ID
     * @returns {Object|null} 工作流对象
     */
    getWorkflow(workflowId) {
        return this.workflowState.getWorkflow(workflowId);
    }

    /**
     * 更新工作流步骤
     * @param {string} workflowId - 工作流ID
     * @param {number} stepIndex - 步骤索引
     * @param {string} status - 状态 (running|completed|failed)
     * @param {Object} result - 步骤结果
     * @param {string} error - 错误信息
     */
    updateStep(workflowId, stepIndex, status, result = null, error = null) {
        return this.workflowState.updateStep(workflowId, stepIndex, status, result, error);
    }

    /**
     * 获取工作流进度
     * @param {string} workflowId - 工作流ID
     * @returns {Object|null} 进度信息
     */
    getProgress(workflowId) {
        return this.workflowState.getProgress(workflowId);
    }

    /**
     * 获取下一步建议
     * @param {Object} workflow - 工作流对象
     * @returns {Object} 下一步信息
     */
    getNextStep(workflow) {
        return this.workflowState.getNextStep(workflow);
    }

    /**
     * 验证工作流状态
     * @param {string} workflowId - 工作流ID
     * @param {number} requiredStep - 需要的最小步骤
     * @returns {Object} 验证结果
     */
    validateWorkflowStep(workflowId, requiredStep) {
        if (!workflowId) {
            return {
                valid: false,
                error: '工作流ID不能为空'
            };
        }

        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            return {
                valid: false,
                error: `工作流不存在: ${workflowId}`
            };
        }

        if (workflow.currentStep < requiredStep) {
            return {
                valid: false,
                error: `请先完成第${requiredStep}步骤`
            };
        }

        return {
            valid: true,
            workflow
        };
    }

    /**
     * 获取步骤结果
     * @param {string} workflowId - 工作流ID
     * @param {number} stepIndex - 步骤索引
     * @returns {Object|null} 步骤结果
     */
    getStepResult(workflowId, stepIndex) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) return null;

        const stepKey = `step_${stepIndex}`;
        return workflow.results[stepKey] || null;
    }

    /**
     * 获取所有活跃工作流
     * @returns {Array} 工作流列表
     */
    getActiveWorkflows() {
        // 这需要在WorkflowState中添加相应方法
        return this.workflowState.getAllWorkflows ? 
            this.workflowState.getAllWorkflows() : [];
    }

    /**
     * 清理过期的工作流
     * @param {number} maxAge - 最大存活时间(毫秒)
     */
    cleanupExpiredWorkflows(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        if (this.workflowState.cleanup) {
            this.workflowState.cleanup(maxAge);
        }
    }
}

export default WorkflowService;