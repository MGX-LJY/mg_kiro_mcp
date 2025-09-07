/**
 * 工作流状态管理器
 * 管理Init模式8步工作流的状态、进度和结果
 */

export class WorkflowState {
  constructor() {
    this.workflows = new Map();
    this.currentWorkflow = null;
  }

  /**
   * 创建新的工作流会话
   * @param {string} projectPath - 项目路径
   * @param {string} mode - 工作模式 (init/create/fix/analyze)
   * @returns {string} 工作流ID
   */
  createWorkflow(projectPath, mode = 'init') {
    const workflowId = this.generateWorkflowId(projectPath, mode);
    
    const workflow = {
      id: workflowId,
      projectPath,
      mode,
      createdAt: new Date().toISOString(),
      currentStep: 0,
      totalSteps: this.getStepsForMode(mode),
      status: 'created',
      steps: this.initializeSteps(mode),
      results: {},
      context: {},
      errors: []
    };

    this.workflows.set(workflowId, workflow);
    this.currentWorkflow = workflowId;
    
    console.log(`[WorkflowState] 创建工作流: ${workflowId}`);
    return workflowId;
  }

  /**
   * 获取工作流状态
   * @param {string} workflowId - 工作流ID
   * @returns {Object} 工作流状态
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * 获取当前工作流
   * @returns {Object} 当前工作流状态
   */
  getCurrentWorkflow() {
    return this.currentWorkflow ? this.workflows.get(this.currentWorkflow) : null;
  }

  /**
   * 更新步骤状态
   * @param {string} workflowId - 工作流ID
   * @param {number} stepIndex - 步骤索引
   * @param {string} status - 状态 (pending/running/completed/failed)
   * @param {Object} result - 步骤结果
   * @param {string} error - 错误信息
   */
  updateStep(workflowId, stepIndex, status, result = null, error = null) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    if (stepIndex < 0 || stepIndex >= workflow.steps.length) {
      throw new Error(`无效的步骤索引: ${stepIndex}`);
    }

    const step = workflow.steps[stepIndex];
    step.status = status;
    step.updatedAt = new Date().toISOString();

    if (result) {
      step.result = result;
      workflow.results[`step_${stepIndex + 1}`] = result;
    }

    if (error) {
      step.error = error;
      workflow.errors.push({
        step: stepIndex + 1,
        error,
        timestamp: new Date().toISOString()
      });
    }

    // 更新整体状态
    if (status === 'running') {
      workflow.currentStep = stepIndex + 1;
      workflow.status = 'running';
    } else if (status === 'completed') {
      workflow.currentStep = stepIndex + 1;
      
      // 检查是否所有步骤都完成
      const allCompleted = workflow.steps.every(s => s.status === 'completed');
      if (allCompleted) {
        workflow.status = 'completed';
        workflow.completedAt = new Date().toISOString();
      }
    } else if (status === 'failed') {
      workflow.status = 'failed';
      workflow.failedAt = new Date().toISOString();
    }

    console.log(`[WorkflowState] 步骤更新: ${workflowId} - Step ${stepIndex + 1}: ${status}`);
  }

  /**
   * 获取工作流进度
   * @param {string} workflowId - 工作流ID
   * @returns {Object} 进度信息
   */
  getProgress(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return null;
    }

    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const failedSteps = workflow.steps.filter(s => s.status === 'failed').length;
    const runningSteps = workflow.steps.filter(s => s.status === 'running').length;

    return {
      workflowId,
      mode: workflow.mode,
      currentStep: workflow.currentStep,
      totalSteps: workflow.totalSteps,
      completedSteps,
      failedSteps,
      runningSteps,
      progress: Math.round((completedSteps / workflow.totalSteps) * 100),
      status: workflow.status,
      duration: this.calculateDuration(workflow),
      nextStep: this.getNextStep(workflow)
    };
  }

  /**
   * 初始化工作模式的步骤
   * @param {string} mode - 工作模式
   * @returns {Array} 步骤数组
   */
  initializeSteps(mode) {
    const stepDefinitions = {
      init: [
        { name: 'scan_structure', title: '项目结构分析', description: '分析README、项目文件结构' },
        { name: 'detect_language', title: '智能语言识别', description: '启动语言检测引擎' },
        { name: 'scan_files', title: '文件内容通读', description: '智能文件内容分析' },
        { name: 'generate_architecture', title: '生成基础架构文档', description: '基于语言生成system-architecture.md' },
        { name: 'analyze_modules', title: '深度模块分析', description: '逐个模块详细分析' },
        { name: 'generate_prompts', title: '语言特定提示词生成', description: '基于检测语言生成专业提示词' },
        { name: 'generate_module_docs', title: '单独模块文档生成', description: '为每个模块生成独立文档' },
        { name: 'generate_contracts', title: '集成契约文档生成', description: '生成integration-contracts.md' }
      ],
      create: [
        { name: 'analyze_requirements', title: '需求理解与拆解', description: '用户需求智能分析' },
        { name: 'generate_tech_design', title: '技术设计文档生成', description: '基于语言特征生成技术设计' },
        { name: 'generate_todo', title: '开发任务分解', description: '自动生成开发任务清单' },
        { name: 'generate_architecture', title: '代码架构生成', description: '为新功能生成架构文档' },
        { name: 'generate_modules', title: '模块文档生成', description: '生成新功能相关模块文档' },
        { name: 'update_contracts', title: '集成契约更新', description: '更新集成契约文档' }
      ],
      fix: [
        { name: 'identify_scope', title: '问题范围识别', description: '智能识别问题影响范围' },
        { name: 'find_docs', title: '相关文档检索', description: '只检索相关模块文档' },
        { name: 'assess_impact', title: '影响度评估', description: '深度影响分析' },
        { name: 'design_solution', title: '修复方案设计', description: '基于语言特性设计修复方案' },
        { name: 'apply_changes', title: '代码更新执行', description: '执行代码修复' },
        { name: 'update_docs', title: '文档同步更新', description: '同步更新相关文档' }
      ],
      analyze: [
        { name: 'quality_scan', title: '代码质量分析', description: '启动代码质量扫描' },
        { name: 'performance_scan', title: '性能分析', description: '性能瓶颈分析' },
        { name: 'security_scan', title: '安全分析', description: '安全漏洞扫描' },
        { name: 'deps_scan', title: '依赖分析', description: '依赖关系分析' }
      ]
    };

    const definitions = stepDefinitions[mode] || stepDefinitions.init;
    
    return definitions.map((def, index) => ({
      index,
      ...def,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      result: null,
      error: null
    }));
  }

  /**
   * 获取工作模式的步骤数
   * @param {string} mode - 工作模式
   * @returns {number} 步骤数
   */
  getStepsForMode(mode) {
    const stepCounts = {
      init: 8,
      create: 6,
      fix: 6,
      analyze: 4
    };
    return stepCounts[mode] || stepCounts.init;
  }

  /**
   * 获取下一个步骤
   * @param {Object} workflow - 工作流对象
   * @returns {Object} 下一步信息
   */
  getNextStep(workflow) {
    const currentIndex = workflow.currentStep;
    
    if (currentIndex >= workflow.steps.length) {
      return null; // 所有步骤已完成
    }

    const nextStep = workflow.steps[currentIndex];
    return {
      index: currentIndex,
      ...nextStep,
      api: this.getApiEndpointForStep(workflow.mode, nextStep.name)
    };
  }

  /**
   * 获取步骤对应的API端点
   * @param {string} mode - 工作模式
   * @param {string} stepName - 步骤名称
   * @returns {string} API端点
   */
  getApiEndpointForStep(mode, stepName) {
    return `POST /mode/${mode}/${stepName.replace('_', '-')}`;
  }

  /**
   * 计算工作流持续时间
   * @param {Object} workflow - 工作流对象
   * @returns {number} 持续时间(毫秒)
   */
  calculateDuration(workflow) {
    const startTime = new Date(workflow.createdAt).getTime();
    const endTime = workflow.completedAt 
      ? new Date(workflow.completedAt).getTime() 
      : Date.now();
    return endTime - startTime;
  }

  /**
   * 生成工作流ID
   * @param {string} projectPath - 项目路径
   * @param {string} mode - 工作模式
   * @returns {string} 工作流ID
   */
  generateWorkflowId(projectPath, mode) {
    const projectName = projectPath.split('/').pop() || 'unknown';
    const timestamp = Date.now();
    return `${mode}_${projectName}_${timestamp}`;
  }

  /**
   * 清理过期的工作流
   * @param {number} maxAge - 最大年龄(毫秒)，默认1小时
   */
  cleanupExpiredWorkflows(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, workflow] of this.workflows) {
      const age = now - new Date(workflow.createdAt).getTime();
      if (age > maxAge && workflow.status !== 'running') {
        this.workflows.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[WorkflowState] 清理了 ${cleaned} 个过期工作流`);
    }
  }

  /**
   * 获取所有工作流摘要
   * @returns {Array} 工作流摘要列表
   */
  getAllWorkflows() {
    const summaries = [];
    
    for (const [id, workflow] of this.workflows) {
      summaries.push({
        id,
        mode: workflow.mode,
        projectPath: workflow.projectPath,
        status: workflow.status,
        progress: Math.round((workflow.steps.filter(s => s.status === 'completed').length / workflow.totalSteps) * 100),
        createdAt: workflow.createdAt,
        duration: this.calculateDuration(workflow)
      });
    }
    
    return summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * 保存工作流到持久存储 (可选实现)
   * @param {string} workflowId - 工作流ID
   */
  async saveWorkflow(workflowId) {
    // 可以实现保存到文件或数据库
    console.log(`[WorkflowState] 保存工作流到持久存储: ${workflowId}`);
  }

  /**
   * 从持久存储恢复工作流 (可选实现)
   * @param {string} workflowId - 工作流ID
   */
  async restoreWorkflow(workflowId) {
    // 可以实现从文件或数据库恢复
    console.log(`[WorkflowState] 从持久存储恢复工作流: ${workflowId}`);
  }
}

export default WorkflowState;