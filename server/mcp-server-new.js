/**
 * MCP Server Core - mg_kiro MCP Server Core (Refactored)
 * Model Context Protocol Server Implementation
 * 
 * 重构版本 - 使用分层架构和模块化设计
 */

import { PromptManager } from './prompt-manager.js';
import { ProjectScanner } from './analyzers/project-scanner.js';
import { WorkflowState } from './workflow/workflow-state.js';
import { EnhancedLanguageDetector } from './analyzers/enhanced-language-detector.js';
import { FileContentAnalyzer } from './analyzers/file-content-analyzer.js';

// 新架构组件
import WorkflowService from './services/workflow-service.js';
import LanguageService from './services/language-service.js';
import PromptService from './services/prompt-service.js';
import ConfigService from './services/config-service.js';
import { createHTTPServer, setupProcessHandlers } from './core/server.js';
import { broadcastModeChange } from './core/websocket.js';

/**
 * MCP Server Class (重构版)
 */
export class MCPServer {
  constructor(config = {}) {
    // 配置管理
    this.configService = new ConfigService();
    
    // 应用用户传入的配置覆盖
    if (config) {
      Object.keys(config).forEach(key => {
        if (key === 'port') {
          this.configService.set('server.port', config[key]);
        } else if (key === 'host') {
          this.configService.set('server.host', config[key]);
        } else if (key === 'cors') {
          this.configService.set('cors', config[key]);
        } else if (key === 'rateLimit') {
          this.configService.set('rateLimit', config[key]);
        }
      });
    }
    
    this.config = this.configService.getServerConfig();
    
    // 核心状态
    this.currentMode = 'init';
    this.clients = new Map();
    this.mcpConnections = new Map();
    
    // ========== 旧组件 (逐步迁移) ==========
    
    // 初始化Prompt Manager
    this.promptManager = new PromptManager({
      version: '2.0.0',
      cacheEnabled: true,
      watchFiles: true
    });
    
    // 初始化Project Scanner
    this.projectScanner = new ProjectScanner({
      maxDepth: 4,
      enableCaching: true,
      maxFiles: 1000
    });
    
    // 工作流状态管理
    this.workflowState = new WorkflowState();
    
    // 增强语言检测器
    this.enhancedLanguageDetector = new EnhancedLanguageDetector({
      enableDeepAnalysis: true,
      maxFilesToAnalyze: 15,
      confidenceThreshold: 60
    });
    
    // 文件内容分析器
    this.fileContentAnalyzer = new FileContentAnalyzer({
      maxFileSize: 1024 * 1024, // 1MB
      maxFilesToAnalyze: 50,
      enableDeepAnalysis: true,
      pythonPriority: true // Python作为核心语言
    });

    // ========== 新服务层 ==========
    
    // 服务层初始化
    this.services = this._initializeServices();
    
    // HTTP服务器实例
    this.serverInstance = null;
    
    // 设置模式变更广播方法
    this._broadcastModeChange = (previousMode, currentMode, context) => {
      broadcastModeChange(this.clients, previousMode, currentMode, context);
    };
  }

  /**
   * 初始化服务层
   * @returns {Object} 服务实例集合
   */
  _initializeServices() {
    // 工作流服务
    const workflowService = new WorkflowService(this.workflowState);
    
    // 语言服务
    const languageService = new LanguageService(
      this.enhancedLanguageDetector,
      this.projectScanner
    );
    
    // 提示词服务
    const promptService = new PromptService(this.promptManager);
    
    return {
      configService: this.configService,
      workflowService,
      languageService,
      promptService,
      fileContentService: this.fileContentAnalyzer // 临时直接引用，后续包装
    };
  }

  /**
   * 启动服务器
   * @returns {Promise<MCPServer>} 服务器实例
   */
  async start() {
    try {
      // 创建HTTP服务器
      this.serverInstance = createHTTPServer(this.config, this.services, this);
      
      // 启动服务器
      await this.serverInstance.start();
      
      // 设置进程信号处理
      setupProcessHandlers(this.serverInstance);
      
      return this;
    } catch (error) {
      console.error('Failed to start MCP Server:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      if (this.serverInstance) {
        await this.serverInstance.stop();
      }
    } catch (error) {
      console.error('Error stopping MCP Server:', error);
      throw error;
    }
  }

  /**
   * 优雅关闭服务器
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise<void>}
   */
  async gracefulShutdown(timeout = 10000) {
    if (this.serverInstance) {
      await this.serverInstance.gracefulShutdown(timeout);
    }
  }

  // ========== 辅助方法 (临时保留，逐步迁移到服务层) ==========

  /**
   * 生成项目结构摘要
   * @param {Object} scanResult - 扫描结果
   * @returns {Object} 结构摘要
   */
  _generateStructureSummary(scanResult) {
    return {
      project: {
        path: scanResult.projectPath,
        name: scanResult.projectPath.split('/').pop(),
        scanDuration: scanResult.scanDuration,
        timestamp: scanResult.timestamp
      },
      structure: {
        totalFiles: scanResult.structure?.totalFiles || 0,
        totalDirectories: scanResult.structure?.totalDirectories || 0,
        maxDepth: this.projectScanner.getMaxDepth(scanResult.structure),
        mainDirectories: scanResult.structure?.directories || []
      },
      analysis: {
        complexity: scanResult.analysis?.complexity || 'unknown',
        scale: scanResult.analysis?.scale || 'unknown',
        maturity: scanResult.analysis?.maturity || 'unknown',
        projectType: scanResult.analysis?.projectType || 'unknown',
        developmentStage: scanResult.analysis?.developmentStage || 'unknown'
      },
      techs: {
        detectedLanguages: scanResult.configs?.detected || [],
        techStackHints: scanResult.analysis?.techStackHints || [],
        frameworks: this.extractFrameworks(scanResult)
      },
      docs: {
        hasReadme: scanResult.readme?.found || false,
        readmeAnalysis: scanResult.readme?.analysis || null
      },
      recommendations: scanResult.workflowContext?.nextStepRecommendations || []
    };
  }

  /**
   * 生成语言检测报告
   * @param {Object} detectionResult - 检测结果
   * @returns {Object} 语言报告
   */
  _generateLanguageReport(detectionResult) {
    return {
      detection: {
        primaryLanguage: detectionResult.detection.primaryLanguage,
        secondaryLanguages: detectionResult.detection.secondaryLanguages,
        confidence: detectionResult.workflowIntegration.confidenceScore
      },
      techStack: {
        frameworks: detectionResult.detection.techStack.frameworks,
        buildTools: detectionResult.detection.techStack.buildTools,
        packageManagers: detectionResult.detection.techStack.packageManagers,
        testing: detectionResult.detection.techStack.testing
      },
      projectProfile: {
        type: detectionResult.detection.projectCharacteristics.type,
        scale: detectionResult.detection.projectCharacteristics.scale,
        maturity: detectionResult.detection.projectCharacteristics.maturity,
        complexity: detectionResult.detection.projectCharacteristics.complexity
      },
      environment: {
        recommended: detectionResult.detection.developmentEnvironment.recommended,
        currentSetup: detectionResult.detection.developmentEnvironment.currentSetup,
        missingComponents: detectionResult.detection.developmentEnvironment.missingComponents
      },
      analysisQuality: {
        dataQuality: detectionResult.workflowIntegration.dataQuality,
        enhancementGain: detectionResult.workflowIntegration.enhancementGain,
        step1Integration: detectionResult.workflowIntegration.step1Integration
      },
      recommendations: detectionResult.detection.nextStepRecommendations,
      metadata: {
        analysisId: detectionResult.analysisId,
        analysisDuration: detectionResult.analysisDuration,
        timestamp: detectionResult.timestamp,
        step3Readiness: detectionResult.workflowIntegration.readinessForStep3
      }
    };
  }

  /**
   * 生成文件概览
   * @param {Object} analysisResult - 分析结果
   * @param {string} workflowId - 工作流ID
   * @returns {Object} 文件概览
   */
  _generateFilesOverview(analysisResult, workflowId) {
    return {
      analysis: {
        totalFilesAnalyzed: analysisResult.analysis.totalFilesAnalyzed,
        analysisTime: analysisResult.analysis.analysisTime,
        mainLanguage: analysisResult.analysis.mainLanguage,
        confidence: analysisResult.analysis.confidence
      },
      fileDistribution: {
        byCategory: analysisResult.overview.distribution,
        byComplexity: analysisResult.overview.complexity,
        totalLines: analysisResult.overview.codeMetrics.totalLines,
        totalFunctions: analysisResult.overview.codeMetrics.totalFunctions,
        totalClasses: analysisResult.overview.codeMetrics.totalClasses
      },
      importantFiles: this._getTopImportantFiles(analysisResult.files, analysisResult.importance, 10),
      dependencies: {
        totalNodes: analysisResult.dependencies.nodes.length,
        totalConnections: analysisResult.dependencies.edges.length,
        topDependencies: this._getTopDependencies(analysisResult.dependencies, 5)
      },
      quality: {
        documentationCoverage: Math.round(analysisResult.overview.qualityIndicators.documentationCoverage * 100),
        testCoverage: Math.round(analysisResult.overview.qualityIndicators.testCoverage * 100),
        codeQualityScore: Math.round(analysisResult.overview.qualityIndicators.codeQualityScore),
        avgComplexity: Math.round(analysisResult.overview.codeMetrics.avgComplexity * 10) / 10
      },
      recommendations: analysisResult.recommendations.map(rec => ({
        type: rec.type,
        priority: rec.priority,
        message: rec.message,
        affectedFiles: rec.files ? rec.files.length : 0
      })),
      fileTypes: this._analyzeFileTypes(analysisResult.files),
      techInsights: this._generateTechInsights(analysisResult.files, analysisResult.analysis.mainLanguage),
      metadata: {
        timestamp: analysisResult.timestamp,
        workflowId,
        step3Completed: true,
        readyForStep4: this._checkReadinessForStep4(analysisResult)
      }
    };
  }

  // ========== 现有辅助方法 (保持不变) ==========

  extractFrameworks(scanResult) {
    const frameworks = [];
    
    try {
      const jsConfigs = scanResult.configs?.byLanguage?.javascript;
      if (jsConfigs && jsConfigs.length > 0) {
        for (const config of jsConfigs) {
          if (config.analysis?.frameworks) {
            frameworks.push(...config.analysis.frameworks);
          }
        }
      }
      
      const techStack = scanResult.readme?.analysis?.techStack;
      if (techStack) {
        frameworks.push(...techStack);
      }
      
      return [...new Set(frameworks)];
    } catch (error) {
      console.error('提取框架信息失败:', error);
      return [];
    }
  }

  _getTopImportantFiles(files, importance, limit = 10) {
    try {
      return files
        .map(file => ({
          path: file.relativePath,
          score: importance[file.relativePath] || 0,
          category: file.category,
          type: file.analysis?.type || 'unknown',
          complexity: file.analysis?.complexity?.rating || 'unknown',
          lines: file.content?.lines || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('获取重要文件失败:', error);
      return [];
    }
  }

  _getTopDependencies(dependencies, limit = 5) {
    try {
      const dependencyCount = new Map();
      
      dependencies.edges.forEach(edge => {
        const dep = edge.to;
        dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
      });
      
      return Array.from(dependencyCount.entries())
        .map(([dep, count]) => ({ dependency: dep, references: count }))
        .sort((a, b) => b.references - a.references)
        .slice(0, limit);
    } catch (error) {
      console.error('获取顶级依赖失败:', error);
      return [];
    }
  }

  _analyzeFileTypes(files) {
    try {
      const typeCount = new Map();
      const extensionCount = new Map();
      
      files.forEach(file => {
        const ext = file.relativePath.split('.').pop().toLowerCase();
        const type = file.analysis?.type || 'other';
        
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
        extensionCount.set(ext, (extensionCount.get(ext) || 0) + 1);
      });
      
      return {
        byType: Object.fromEntries(typeCount),
        byExtension: Object.fromEntries(extensionCount)
      };
    } catch (error) {
      console.error('分析文件类型失败:', error);
      return { byType: {}, byExtension: {} };
    }
  }

  _generateTechInsights(files, mainLanguage) {
    try {
      const insights = {
        mainLanguage,
        languageSpecific: {},
        frameworks: new Set(),
        patterns: []
      };
      
      files.forEach(file => {
        if (file.analysis?.dependencies) {
          file.analysis.dependencies.forEach(dep => {
            if (this._isFramework(dep)) {
              insights.frameworks.add(dep);
            }
          });
        }
        
        if (mainLanguage === 'python' && file.analysis?.pythonSpecific) {
          const py = file.analysis.pythonSpecific;
          insights.languageSpecific.usesTypeHints = py.usesTypeHints;
          insights.languageSpecific.usesAsyncAwait = py.usesAsyncAwait;
          insights.languageSpecific.hasMainGuard = py.hasMainGuard;
        }
        
        if (mainLanguage === 'javascript' && file.analysis?.javascriptSpecific) {
          const js = file.analysis.javascriptSpecific;
          insights.languageSpecific.usesES6 = js.usesES6;
          insights.languageSpecific.usesModules = js.usesModules;
          insights.languageSpecific.hasJSX = js.hasJSX;
        }
      });
      
      insights.frameworks = Array.from(insights.frameworks);
      
      if (insights.frameworks.length > 3) {
        insights.patterns.push('多框架架构');
      }
      
      if (mainLanguage === 'python' && insights.languageSpecific.usesAsyncAwait) {
        insights.patterns.push('异步Python开发');
      }
      
      return insights;
    } catch (error) {
      console.error('生成技术栈洞察失败:', error);
      return { mainLanguage, frameworks: [], patterns: [] };
    }
  }

  _isFramework(dependency) {
    const knownFrameworks = [
      'express', 'react', 'vue', 'angular', 'django', 'flask', 'fastapi',
      'spring', 'gin', 'axum', 'actix', 'tokio', 'pandas', 'numpy',
      'requests', 'aiohttp', 'socketio'
    ];
    
    return knownFrameworks.some(framework => 
      dependency.toLowerCase().includes(framework)
    );
  }

  _checkReadinessForStep4(analysisResult) {
    try {
      const requirements = {
        hasAnalyzedFiles: analysisResult.analysis?.totalFilesAnalyzed > 0,
        hasMainLanguage: !!analysisResult.analysis?.mainLanguage,
        hasQualityMetrics: !!analysisResult.overview?.qualityIndicators,
        hasRecommendations: analysisResult.recommendations?.length > 0
      };
      
      const readyCount = Object.values(requirements).filter(Boolean).length;
      const totalRequirements = Object.keys(requirements).length;
      
      return {
        ready: readyCount === totalRequirements,
        score: Math.round((readyCount / totalRequirements) * 100),
        requirements,
        missingRequirements: Object.entries(requirements)
          .filter(([_, ready]) => !ready)
          .map(([req, _]) => req)
      };
    } catch (error) {
      console.error('检查Step 4准备状态失败:', error);
      return { ready: false, score: 0, requirements: {}, missingRequirements: [] };
    }
  }
}

export default MCPServer;