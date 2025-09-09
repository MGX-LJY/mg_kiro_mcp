/**
 * Init模式状态管理服务
 * 简化版本，不使用工作流ID，直接管理init流程状态
 */

export class InitStateService {
  constructor() {
    this.currentState = {
      projectPath: null,
      currentStep: 0,
      totalSteps: 8,
      results: {},
      status: 'idle',
      createdAt: null,
      updatedAt: null
    };
  }

  /**
   * 初始化Init流程
   * @param {string} projectPath - 项目路径
   * @returns {Object} 初始化状态
   */
  initialize(projectPath) {
    this.currentState = {
      projectPath,
      currentStep: 0,
      totalSteps: 8,
      results: {},
      status: 'initialized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[InitState] 初始化Init流程: ${projectPath}`);
    return this.currentState;
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getState() {
    return this.currentState;
  }

  /**
   * 更新步骤结果
   * @param {number} stepNumber - 步骤编号 (1-8)
   * @param {Object} result - 步骤结果
   * @returns {Object} 更新后的状态
   */
  updateStepResult(stepNumber, result) {
    if (stepNumber < 1 || stepNumber > this.currentState.totalSteps) {
      throw new Error(`无效的步骤编号: ${stepNumber}`);
    }

    this.currentState.results[`step_${stepNumber}`] = result;
    this.currentState.currentStep = Math.max(this.currentState.currentStep, stepNumber);
    this.currentState.status = 'running';
    this.currentState.updatedAt = new Date().toISOString();
    
    // 检查是否所有步骤完成
    if (this.currentState.currentStep === this.currentState.totalSteps) {
      this.currentState.status = 'completed';
    }
    
    console.log(`[InitState] 步骤 ${stepNumber} 结果已更新`);
    return this.currentState;
  }

  /**
   * 获取步骤结果
   * @param {number} stepNumber - 步骤编号
   * @returns {Object|null} 步骤结果
   */
  getStepResult(stepNumber) {
    return this.currentState.results[`step_${stepNumber}`] || null;
  }

  /**
   * 获取进度信息
   * @returns {Object} 进度信息
   */
  getProgress() {
    const completedSteps = Object.keys(this.currentState.results).length;
    
    return {
      projectPath: this.currentState.projectPath,
      currentStep: this.currentState.currentStep,
      totalSteps: this.currentState.totalSteps,
      completedSteps,
      progress: Math.round((completedSteps / this.currentState.totalSteps) * 100),
      status: this.currentState.status,
      nextStep: this.getNextStep()
    };
  }

  /**
   * 获取下一个步骤信息
   * @returns {Object|null} 下一步信息
   */
  getNextStep() {
    const stepDefinitions = [
      { step: 1, name: 'scan_structure', title: '项目结构分析', api: '/mode/init/structure/scan-structure' },
      { step: 2, name: 'detect_language', title: '智能语言识别', api: '/mode/init/language/detect-language' },
      { step: 3, name: 'scan_files', title: '文件内容通读', api: '/mode/init/files/scan-files' },
      { step: 4, name: 'generate_architecture', title: '生成基础架构文档', api: '/mode/init/documents/generate-architecture' },
      { step: 5, name: 'analyze_modules', title: '深度模块分析', api: '/mode/init/modules-analysis/analyze-modules' },
      { step: 6, name: 'generate_prompts', title: '语言特定提示词生成', api: '/mode/init/prompts/generate-prompts' },
      { step: 7, name: 'generate_module_docs', title: '单独模块文档生成', api: '/mode/init/modules-docs/generate-module-docs' },
      { step: 8, name: 'generate_contracts', title: '集成契约文档生成', api: '/mode/init/contracts/generate-contracts' }
    ];

    const nextStepIndex = this.currentState.currentStep;
    if (nextStepIndex < this.currentState.totalSteps) {
      return stepDefinitions[nextStepIndex];
    }
    
    return null;
  }

  /**
   * 重置状态
   */
  reset() {
    this.currentState = {
      projectPath: null,
      currentStep: 0,
      totalSteps: 8,
      results: {},
      status: 'idle',
      createdAt: null,
      updatedAt: null
    };
    console.log('[InitState] 状态已重置');
  }

  /**
   * 检查步骤是否可执行
   * @param {number} stepNumber - 步骤编号
   * @returns {boolean} 是否可执行
   */
  canExecuteStep(stepNumber) {
    // 步骤必须按顺序执行
    return stepNumber === this.currentState.currentStep + 1;
  }
}

export default InitStateService;