/**
 * Claude Code Init服务
 * 专为配合Claude Code工作流设计的Init模式
 * 
 * 新的5步流程：
 * 1. 数据收集（合并1-3步）- 项目结构+语言检测+文件分析
 * 2. 架构文档生成（第4步，AI）- 提供数据给Claude Code生成文档
 * 3. 深度分析（合并5-6步）- 模块分析+提示词生成  
 * 4. 模块文档生成（第7步，AI）- 提供数据给Claude Code生成文档
 * 5. 集成契约生成（第8步，AI）- 提供数据给Claude Code生成文档
 */

import IntelligentLayeredAnalyzer from '../analyzers/intelligent-layered-analyzer.js';
import ArchitectureKeyExtractor from '../analyzers/architecture-key-extractor.js';
import { EnhancedLanguageDetector } from '../analyzers/enhanced-language-detector.js';
import { FileContentAnalyzer } from '../analyzers/file-content-analyzer.js';
import { ModuleAnalyzer } from '../analyzers/module-analyzer.js';
import { PromptManager } from '../prompt-manager.js';
import TemplateReader from './template-reader.js';

export class ClaudeCodeInitService {
  constructor() {
    this.currentState = {
      projectPath: null,
      currentStep: 0,
      totalSteps: 5,
      results: {},
      status: 'idle',
      createdAt: null,
      updatedAt: null
    };
  }

  /**
   * 初始化Init流程
   */
  initialize(projectPath) {
    this.currentState = {
      projectPath,
      currentStep: 0,
      totalSteps: 5,
      results: {},
      status: 'initialized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[ClaudeCodeInit] 初始化Claude Code Init流程: ${projectPath}`);
    return this.currentState;
  }

  /**
   * 步骤1: 数据收集（合并原1-3步）
   * 项目结构分析 + 语言检测 + 文件内容分析
   */
  async executeStep1_DataCollection() {
    console.log('\n📊 步骤1: 数据收集阶段');
    console.log('整合项目结构分析、语言检测、文件内容分析...');
    
    const projectPath = this.currentState.projectPath;
    const results = {};
    
    try {
      // 1. 项目结构分析
      console.log('🔍 执行项目结构分析...');
      const layeredAnalyzer = new IntelligentLayeredAnalyzer(projectPath);
      const architectureExtractor = new ArchitectureKeyExtractor(projectPath);
      
      const [layeredResults, architectureKeys] = await Promise.all([
        layeredAnalyzer.performLayeredAnalysis(),
        architectureExtractor.extractArchitectureKeys()
      ]);
      
      results.structureAnalysis = { layeredResults, architectureKeys };
      
      // 2. 语言检测
      console.log('🧠 执行语言检测...');
      const languageDetector = new EnhancedLanguageDetector(projectPath);
      const languageResults = await languageDetector.detectLanguageEnhanced(
        projectPath,
        results.structureAnalysis,
        {
          contextData: {
            architectureInsights: layeredResults.architectureAnalysis,
            moduleInsights: layeredResults.moduleAnalysis
          }
        }
      );
      
      results.languageDetection = languageResults;
      
      // 3. 文件内容分析
      console.log('📁 执行文件内容分析...');
      const fileAnalyzer = new FileContentAnalyzer();
      const fileAnalysisResults = await fileAnalyzer.analyzeFiles({
        projectPath,
        structureAnalysis: results.structureAnalysis,
        languageData: results.languageDetection
      });
      
      results.fileAnalysis = fileAnalysisResults;
      
      // 更新状态
      this.currentState.results.step1 = results;
      this.currentState.currentStep = 1;
      this.currentState.status = 'step1_completed';
      this.currentState.updatedAt = new Date().toISOString();
      
      console.log('✅ 步骤1完成 - 数据收集阶段');
      return results;
      
    } catch (error) {
      console.error('❌ 步骤1失败:', error);
      this.currentState.status = 'step1_failed';
      throw error;
    }
  }

  /**
   * 步骤2: 架构文档生成（AI驱动）
   * 提供数据包给Claude Code生成system-architecture.md
   */
  async prepareStep2_ArchitectureGeneration() {
    console.log('\n📝 步骤2: 准备架构文档生成数据');
    
    if (!this.currentState.results.step1) {
      throw new Error('请先完成步骤1数据收集');
    }
    
    const step1Data = this.currentState.results.step1;
    
    // 构建给Claude Code的数据包
    const aiDataPackage = {
      // 项目基本信息
      projectInfo: {
        path: this.currentState.projectPath,
        name: this.currentState.projectPath.split('/').pop(),
        timestamp: new Date().toISOString()
      },
      
      // 结构分析数据
      structureAnalysis: {
        layeredResults: step1Data.structureAnalysis.layeredResults,
        architectureKeys: step1Data.structureAnalysis.architectureKeys,
        totalFiles: step1Data.structureAnalysis.layeredResults?.moduleAnalysis?.totalModules || 0,
        complexity: step1Data.structureAnalysis.layeredResults?.architectureAnalysis?.complexityScore || 0
      },
      
      // 语言检测数据
      languageData: {
        primaryLanguage: step1Data.languageDetection.detection?.primaryLanguage || 'unknown',
        frameworks: step1Data.languageDetection.detection?.frameworks || [],
        techStack: step1Data.languageDetection.techStack || {},
        confidence: step1Data.languageDetection.detection?.confidence || 0
      },
      
      // 文件分析数据
      fileAnalysis: {
        totalFiles: step1Data.fileAnalysis.totalFiles || 0,
        qualityScore: step1Data.fileAnalysis.quality?.overallScore || 0,
        complexity: step1Data.fileAnalysis.complexity || 'unknown',
        dependencies: step1Data.fileAnalysis.dependencies || {},
        patterns: step1Data.fileAnalysis.patterns || []
      },
      
      // AI生成指令
      generationInstructions: {
        documentType: 'system-architecture',
        outputFormat: 'markdown',
        sections: [
          'project-overview',
          'architecture-analysis', 
          'technology-stack',
          'file-structure',
          'dependencies',
          'quality-assessment',
          'recommendations'
        ],
        template: 'architecture-document-template'
      },
      
      // 元数据
      metadata: {
        step: 2,
        stepName: 'architecture_generation',
        requiresAI: true,
        targetFile: 'system-architecture.md',
        dataCollectionCompleted: true
      }
    };
    
    // 更新状态
    this.currentState.results.step2 = {
      status: 'prepared',
      aiDataPackage,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 步骤2数据准备完成 - 等待Claude Code生成架构文档');
    return aiDataPackage;
  }

  /**
   * 步骤3: 深度分析（合并原5-6步）
   * 模块分析 + 提示词生成
   */
  async executeStep3_DeepAnalysis() {
    console.log('\n🔬 步骤3: 深度分析阶段');
    console.log('执行模块分析和提示词生成...');
    
    if (!this.currentState.results.step1) {
      throw new Error('请先完成步骤1数据收集');
    }
    
    const step1Data = this.currentState.results.step1;
    const results = {};
    
    try {
      // 1. 深度模块分析
      console.log('🔍 执行深度模块分析...');
      const moduleAnalyzer = new ModuleAnalyzer(this.currentState.projectPath);
      const moduleAnalysisResults = await moduleAnalyzer.analyzeModules({
        contextData: {
          projectStructure: step1Data.structureAnalysis,
          languageInfo: step1Data.languageDetection,
          fileAnalysis: step1Data.fileAnalysis
        }
      });
      
      results.moduleAnalysis = moduleAnalysisResults;
      
      // 2. 语言特定提示词生成
      console.log('💡 生成语言特定提示词...');
      const templateReader = new TemplateReader();
      const promptManager = new PromptManager({ templateReader });
      
      const prompts = await promptManager.generateLanguageSpecificPrompts(
        step1Data.languageDetection.detection?.primaryLanguage || 'javascript',
        {
          frameworks: step1Data.languageDetection.detection?.frameworks || [],
          projectType: step1Data.structureAnalysis.architectureKeys?.projectType || 'general'
        }
      );
      
      results.promptGeneration = prompts;
      
      // 更新状态
      this.currentState.results.step3 = results;
      this.currentState.currentStep = 3;
      this.currentState.status = 'step3_completed';
      this.currentState.updatedAt = new Date().toISOString();
      
      console.log('✅ 步骤3完成 - 深度分析阶段');
      return results;
      
    } catch (error) {
      console.error('❌ 步骤3失败:', error);
      this.currentState.status = 'step3_failed';
      throw error;
    }
  }

  /**
   * 步骤4: 模块文档生成（AI驱动）
   * 提供数据包给Claude Code生成模块文档
   */
  async prepareStep4_ModuleDocGeneration() {
    console.log('\n📚 步骤4: 准备模块文档生成数据');
    
    if (!this.currentState.results.step3) {
      throw new Error('请先完成步骤3深度分析');
    }
    
    const step1Data = this.currentState.results.step1;
    const step3Data = this.currentState.results.step3;
    
    // 构建给Claude Code的数据包
    const aiDataPackage = {
      // 项目基本信息
      projectInfo: {
        path: this.currentState.projectPath,
        name: this.currentState.projectPath.split('/').pop(),
        primaryLanguage: step1Data.languageDetection.detection?.primaryLanguage
      },
      
      // 模块分析数据
      moduleData: {
        modules: step3Data.moduleAnalysis.modules || [],
        totalModules: step3Data.moduleAnalysis.totalModules || 0,
        dependencies: step1Data.fileAnalysis.dependencies || {},
        architecture: step1Data.structureAnalysis.architectureKeys || {}
      },
      
      // 上下文数据
      contextData: {
        languageFrameworks: step1Data.languageDetection.detection?.frameworks || [],
        projectComplexity: step1Data.structureAnalysis.layeredResults?.architectureAnalysis?.complexityScore || 0,
        qualityScore: step1Data.fileAnalysis.quality?.overallScore || 0
      },
      
      // AI生成指令
      generationInstructions: {
        documentType: 'module-documentation',
        outputFormat: 'multiple-markdown-files',
        moduleFilePattern: 'module-{moduleName}.md',
        sections: [
          'module-overview',
          'functionality',
          'dependencies',
          'interfaces',
          'usage-examples',
          'maintenance-notes'
        ],
        template: 'module-document-template'
      },
      
      // 元数据
      metadata: {
        step: 4,
        stepName: 'module_doc_generation',
        requiresAI: true,
        targetDirectory: 'modules/',
        expectedFileCount: step3Data.moduleAnalysis.totalModules || 0
      }
    };
    
    // 更新状态
    this.currentState.results.step4 = {
      status: 'prepared',
      aiDataPackage,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 步骤4数据准备完成 - 等待Claude Code生成模块文档');
    return aiDataPackage;
  }

  /**
   * 步骤5: 集成契约生成（AI驱动）
   * 提供数据包给Claude Code生成integration-contracts.md
   */
  async prepareStep5_IntegrationContracts() {
    console.log('\n🔗 步骤5: 准备集成契约生成数据');
    
    if (!this.currentState.results.step3) {
      throw new Error('请先完成步骤3深度分析');
    }
    
    const step1Data = this.currentState.results.step1;
    const step3Data = this.currentState.results.step3;
    
    // 构建给Claude Code的数据包
    const aiDataPackage = {
      // 项目基本信息
      projectInfo: {
        path: this.currentState.projectPath,
        name: this.currentState.projectPath.split('/').pop(),
        primaryLanguage: step1Data.languageDetection.detection?.primaryLanguage
      },
      
      // 集成分析数据
      integrationData: {
        modules: step3Data.moduleAnalysis.modules || [],
        dependencies: step1Data.fileAnalysis.dependencies || {},
        architecture: step1Data.structureAnalysis.architectureKeys || {},
        communicationPatterns: step1Data.structureAnalysis.layeredResults?.integrationAnalysis?.communicationPatterns || []
      },
      
      // 系统契约数据
      contractData: {
        interfaces: step3Data.moduleAnalysis.interfaces || [],
        dataContracts: step3Data.moduleAnalysis.dataContracts || [],
        apiContracts: step3Data.moduleAnalysis.apiContracts || [],
        eventContracts: step3Data.moduleAnalysis.eventContracts || []
      },
      
      // AI生成指令
      generationInstructions: {
        documentType: 'integration-contracts',
        outputFormat: 'markdown',
        sections: [
          'contract-overview',
          'module-interfaces',
          'data-contracts',
          'api-specifications', 
          'event-contracts',
          'integration-patterns',
          'testing-contracts',
          'versioning-strategy'
        ],
        template: 'integration-contracts-template'
      },
      
      // 元数据
      metadata: {
        step: 5,
        stepName: 'integration_contracts_generation',
        requiresAI: true,
        targetFile: 'integration-contracts.md',
        finalStep: true
      }
    };
    
    // 更新状态
    this.currentState.results.step5 = {
      status: 'prepared',
      aiDataPackage,
      timestamp: new Date().toISOString()
    };
    
    this.currentState.currentStep = 5;
    this.currentState.status = 'step5_prepared';
    this.currentState.updatedAt = new Date().toISOString();
    
    console.log('✅ 步骤5数据准备完成 - 等待Claude Code生成集成契约文档');
    return aiDataPackage;
  }

  /**
   * 标记AI生成的文档已保存
   */
  markDocumentSaved(step, filePath) {
    if (this.currentState.results[`step${step}`]) {
      this.currentState.results[`step${step}`].status = 'completed';
      this.currentState.results[`step${step}`].savedFile = filePath;
      this.currentState.results[`step${step}`].completedAt = new Date().toISOString();
    }
    
    // 检查是否所有步骤完成
    if (step === 5) {
      this.currentState.status = 'completed';
      this.currentState.completedAt = new Date().toISOString();
    }
    
    console.log(`✅ 步骤${step}文档已保存: ${filePath}`);
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.currentState;
  }

  /**
   * 获取进度信息
   */
  getProgress() {
    const completedSteps = Object.keys(this.currentState.results).filter(key => 
      this.currentState.results[key].status === 'completed'
    ).length;
    
    return {
      projectPath: this.currentState.projectPath,
      currentStep: this.currentState.currentStep,
      totalSteps: this.currentState.totalSteps,
      completedSteps,
      progress: Math.round((completedSteps / this.currentState.totalSteps) * 100),
      status: this.currentState.status,
      stepsOverview: {
        step1: '数据收集（结构+语言+文件）',
        step2: '架构文档生成（AI）',
        step3: '深度分析（模块+提示词）',
        step4: '模块文档生成（AI）',
        step5: '集成契约生成（AI）'
      }
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.currentState = {
      projectPath: null,
      currentStep: 0,
      totalSteps: 5,
      results: {},
      status: 'idle',
      createdAt: null,
      updatedAt: null
    };
    console.log('[ClaudeCodeInit] 状态已重置');
  }
}

export default ClaudeCodeInitService;