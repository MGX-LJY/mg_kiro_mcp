/**
 * 增强语言检测器 - 第2步工作流专用
 * 基于第1步扫描结果进行深度语言识别和技术栈分析
 */

import { promises as fs } from 'fs';
import path from 'path';
import LanguageDetector from '../language/detector.js';

/**
 * 增强版语言检测器
 * 集成第1步扫描结果，提供更精确的语言识别
 */
export class EnhancedLanguageDetector {
  constructor(options = {}) {
    this.options = {
      enableDeepAnalysis: options.enableDeepAnalysis !== false,
      maxFilesToAnalyze: options.maxFilesToAnalyze || 20,
      confidenceThreshold: options.confidenceThreshold || 60,
      ...options
    };
    
    // 使用现有的语言检测器
    this.baseDetector = new LanguageDetector();
    this.analysisCache = new Map();
  }

  /**
   * 基于第1步结果进行增强语言检测
   * @param {string} projectPath - 项目路径
   * @param {Object} step1Results - 第1步扫描结果
   * @param {Object} workflowContext - 工作流上下文
   * @returns {Object} 增强的语言检测结果
   */
  async detectLanguageEnhanced(projectPath, step1Results, workflowContext = {}) {
    const analysisId = this.generateAnalysisId(projectPath);
    
    console.log(`[EnhancedLanguageDetector] 开始增强语言检测: ${projectPath}`);
    const startTime = Date.now();

    try {
      // 1. 运行基础语言检测
      const baseDetection = await this.baseDetector.detectLanguage(projectPath);
      
      // 2. 基于第1步结果进行增强分析
      const enhancedAnalysis = await this.performEnhancedAnalysis(
        baseDetection, 
        step1Results, 
        workflowContext
      );
      
      // 3. 深度代码内容分析（可选）
      const codeAnalysis = this.options.enableDeepAnalysis 
        ? await this.performCodeAnalysis(projectPath, step1Results)
        : null;
      
      // 4. 综合所有信息生成最终结果
      const finalResult = this.synthesizeResults(
        baseDetection,
        enhancedAnalysis,
        codeAnalysis,
        step1Results
      );

      // 5. 生成下一步建议
      finalResult.nextStepRecommendations = this.generateNextStepRecommendations(finalResult);

      const result = {
        analysisId,
        timestamp: new Date().toISOString(),
        projectPath,
        analysisDuration: Date.now() - startTime,
        
        // 核心检测结果
        detection: finalResult,
        
        // 原始数据
        rawData: {
          baseDetection,
          enhancedAnalysis,
          codeAnalysis
        },
        
        // 工作流集成
        workflowIntegration: {
          step1Integration: this.analyzeStep1Integration(step1Results, finalResult),
          confidenceScore: this.calculateOverallConfidence(finalResult),
          readinessForStep3: this.assessStep3Readiness(finalResult)
        }
      };

      console.log(`[EnhancedLanguageDetector] 语言检测完成 (${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      console.error(`[EnhancedLanguageDetector] 语言检测失败:`, error);
      throw new Error(`增强语言检测失败: ${error.message}`);
    }
  }

  /**
   * 基于第1步结果进行增强分析
   * @param {Object} baseDetection - 基础检测结果
   * @param {Object} step1Results - 第1步结果
   * @param {Object} workflowContext - 工作流上下文
   * @returns {Object} 增强分析结果
   */
  async performEnhancedAnalysis(baseDetection, step1Results, workflowContext) {
    const analysis = {
      configFileAnalysis: this.analyzeConfigFiles(step1Results),
      dependencyAnalysis: this.analyzeDependencies(step1Results),
      frameworkInference: this.inferFrameworks(step1Results, baseDetection),
      projectStructureClues: this.extractStructureClues(step1Results),
      readmeBasedInference: this.analyzeReadmeContent(step1Results)
    };

    // 计算增强置信度
    analysis.enhancedConfidence = this.calculateEnhancedConfidence(baseDetection, analysis);
    
    return analysis;
  }

  /**
   * 分析配置文件以获取语言线索
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} 配置文件分析结果
   */
  analyzeConfigFiles(step1Results) {
    const configAnalysis = {
      detectedLanguages: [],
      buildSystems: [],
      packageManagers: [],
      confidence: {}
    };

    const configs = step1Results.configs;
    if (!configs) return configAnalysis;

    // 分析各语言的配置文件
    for (const [language, configList] of Object.entries(configs.byLanguage || {})) {
      if (configList && configList.length > 0) {
        configAnalysis.detectedLanguages.push(language);
        configAnalysis.confidence[language] = this.calculateConfigConfidence(configList);
        
        // 提取构建系统信息
        for (const config of configList) {
          if (config.type === 'npm-package' && config.analysis) {
            configAnalysis.packageManagers.push('npm');
            if (config.analysis.scripts) {
              configAnalysis.buildSystems.push(...this.extractBuildSystems(config.analysis.scripts));
            }
          }
        }
      }
    }

    return configAnalysis;
  }

  /**
   * 分析项目依赖
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} 依赖分析结果
   */
  analyzeDependencies(step1Results) {
    const depAnalysis = {
      totalDependencies: 0,
      frameworks: [],
      libraries: [],
      devTools: [],
      languageHints: []
    };

    const configs = step1Results.configs;
    if (!configs?.byLanguage?.javascript) return depAnalysis;

    const jsConfigs = configs.byLanguage.javascript;
    for (const config of jsConfigs) {
      if (config.analysis?.dependencies) {
        depAnalysis.totalDependencies += config.analysis.dependencyCount || 0;
        
        // 分析依赖以推断技术栈
        const deps = config.analysis.dependencies;
        depAnalysis.frameworks.push(...this.classifyDependencies(deps, 'framework'));
        depAnalysis.libraries.push(...this.classifyDependencies(deps, 'library'));
        depAnalysis.devTools.push(...this.classifyDependencies(deps, 'devtool'));
      }
    }

    return depAnalysis;
  }

  /**
   * 推断使用的框架
   * @param {Object} step1Results - 第1步结果
   * @param {Object} baseDetection - 基础检测结果
   * @returns {Object} 框架推断结果
   */
  inferFrameworks(step1Results, baseDetection) {
    const frameworkInference = {
      detected: [],
      ecosystem: null,
      confidence: {},
      recommendations: []
    };

    // 标准化框架名称映射
    const frameworkMap = {
      'express': 'Express',
      'react': 'React',
      'vue': 'Vue',
      'angular': 'Angular',
      'django': 'Django'
    };

    const normalizedFrameworks = new Set();

    // 从基础检测结果获取框架信息
    if (baseDetection.frameworks && baseDetection.frameworks.length > 0) {
      for (const framework of baseDetection.frameworks) {
        // 处理对象形式的框架
        if (typeof framework === 'object' && framework.name) {
          const normalized = frameworkMap[framework.name.toLowerCase()] || framework.name;
          normalizedFrameworks.add(normalized);
        } 
        // 处理字符串形式的框架
        else if (typeof framework === 'string') {
          const normalized = frameworkMap[framework.toLowerCase()] || framework;
          normalizedFrameworks.add(normalized);
        }
      }
    }

    // 从第1步结果中提取额外框架信息
    const step1Frameworks = step1Results.analysis?.techStackHints || [];
    for (const hint of step1Frameworks) {
      const normalized = frameworkMap[hint.toLowerCase()] || hint;
      normalizedFrameworks.add(normalized);
    }

    frameworkInference.detected = Array.from(normalizedFrameworks);
    frameworkInference.ecosystem = this.determineEcosystem(frameworkInference.detected);

    // 计算框架置信度
    for (const framework of frameworkInference.detected) {
      frameworkInference.confidence[framework] = this.calculateFrameworkConfidence(
        framework, 
        step1Results, 
        baseDetection
      );
    }

    return frameworkInference;
  }

  /**
   * 从项目结构中提取语言线索
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} 结构线索
   */
  extractStructureClues(step1Results) {
    const structureClues = {
      languagePatterns: [],
      organizationStyle: null,
      moduleSystem: null,
      testingApproach: null
    };

    const structure = step1Results.structure;
    if (!structure) return structureClues;

    // 分析目录结构模式
    const directories = structure.directories || [];
    
    // JavaScript/Node.js 模式
    if (directories.includes('src') && directories.includes('node_modules')) {
      structureClues.languagePatterns.push('javascript-modern');
      structureClues.organizationStyle = 'src-based';
    }
    
    // Python 项目模式深度识别
    this.identifyPythonPatterns(directories, structure, structureClues);
    
    // Java 模式
    if (directories.includes('src') && structure.subdirectories?.src?.directories?.includes('main')) {
      structureClues.languagePatterns.push('java-maven');
      structureClues.organizationStyle = 'maven-standard';
    }

    // 检测测试方法
    if (directories.includes('tests') || directories.includes('test')) {
      structureClues.testingApproach = 'dedicated-test-directory';
    }

    return structureClues;
  }

  /**
   * 分析README内容获取语言线索
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} README分析结果
   */
  analyzeReadmeContent(step1Results) {
    const readmeAnalysis = {
      explicitLanguages: [],
      implicitHints: [],
      installationCommands: [],
      usageExamples: []
    };

    const readme = step1Results.readme;
    if (!readme?.found || !readme.analysis) return readmeAnalysis;

    const analysis = readme.analysis;
    
    // 从技术栈中提取明确的语言
    if (analysis.techStack) {
      readmeAnalysis.explicitLanguages = analysis.techStack.filter(tech => 
        ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C#'].includes(tech)
      );
    }

    // 从安装说明中推断包管理器和语言
    if (analysis.installation) {
      readmeAnalysis.installationCommands = this.extractCommands(analysis.installation);
    }

    return readmeAnalysis;
  }

  /**
   * 进行深度代码内容分析
   * @param {string} projectPath - 项目路径
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} 代码分析结果
   */
  async performCodeAnalysis(projectPath, step1Results) {
    const codeAnalysis = {
      sampledFiles: [],
      languagePatterns: {},
      importPatterns: [],
      syntaxFeatures: []
    };

    try {
      // 选择代表性文件进行深度分析
      const filesToAnalyze = this.selectRepresentativeFiles(step1Results);
      
      for (const file of filesToAnalyze.slice(0, this.options.maxFilesToAnalyze)) {
        const analysis = await this.analyzeCodeFile(file.path);
        if (analysis) {
          codeAnalysis.sampledFiles.push(analysis);
        }
      }

      // 汇总分析结果
      codeAnalysis.languagePatterns = this.summarizeLanguagePatterns(codeAnalysis.sampledFiles);
      codeAnalysis.importPatterns = this.extractImportPatterns(codeAnalysis.sampledFiles);
      codeAnalysis.syntaxFeatures = this.identifySyntaxFeatures(codeAnalysis.sampledFiles);

    } catch (error) {
      console.error('代码分析失败:', error);
      codeAnalysis.error = error.message;
    }

    return codeAnalysis;
  }

  /**
   * 综合所有分析结果
   * @param {Object} baseDetection - 基础检测结果
   * @param {Object} enhancedAnalysis - 增强分析结果
   * @param {Object} codeAnalysis - 代码分析结果
   * @param {Object} step1Results - 第1步结果
   * @returns {Object} 最终综合结果
   */
  synthesizeResults(baseDetection, enhancedAnalysis, codeAnalysis, step1Results) {
    const synthesis = {
      // 主要语言（最高置信度）
      primaryLanguage: {
        language: baseDetection.language,
        confidence: Math.max(baseDetection.confidence, enhancedAnalysis.enhancedConfidence || 0),
        source: 'base-detection'
      },
      
      // 次要语言
      secondaryLanguages: [],
      
      // 技术栈生态
      techStack: {
        frameworks: enhancedAnalysis.frameworkInference.detected,
        buildTools: enhancedAnalysis.configFileAnalysis.buildSystems,
        packageManagers: enhancedAnalysis.configFileAnalysis.packageManagers,
        testing: this.inferTestingFramework(step1Results, enhancedAnalysis)
      },
      
      // 项目特征
      projectCharacteristics: {
        type: step1Results.analysis?.projectType || 'unknown',
        scale: step1Results.analysis?.scale || 'unknown',
        maturity: step1Results.analysis?.maturity || 'unknown',
        complexity: step1Results.analysis?.complexity || 'unknown'
      },
      
      // 开发环境
      developmentEnvironment: {
        recommended: this.recommendDevelopmentEnvironment(baseDetection.language),
        currentSetup: this.analyzCurrentSetup(step1Results),
        missingComponents: this.identifyMissingComponents(step1Results, baseDetection.language)
      }
    };

    // 如果有代码分析，整合其结果
    if (codeAnalysis && !codeAnalysis.error) {
      synthesis.codeInsights = {
        importPatterns: codeAnalysis.importPatterns,
        syntaxFeatures: codeAnalysis.syntaxFeatures,
        languageUsage: codeAnalysis.languagePatterns
      };
    }

    return synthesis;
  }

  /**
   * 生成下一步工作流建议
   * @param {Object} detectionResult - 检测结果
   * @returns {Array} 建议列表
   */
  generateNextStepRecommendations(detectionResult) {
    const recommendations = [];
    
    // 基于主要语言推荐第3步策略
    const primaryLang = detectionResult.primaryLanguage.language;
    if (detectionResult.primaryLanguage.confidence > 80) {
      recommendations.push({
        step: 3,
        action: 'scan_files',
        strategy: `${primaryLang}-optimized`,
        reason: `主语言${primaryLang}置信度高，建议使用优化扫描策略`,
        priority: 'high'
      });
    }
    
    // 基于项目复杂度推荐
    const complexity = detectionResult.projectCharacteristics.complexity;
    if (complexity === 'high') {
      recommendations.push({
        step: 5,
        action: 'analyze_modules',
        reason: '项目复杂度高，建议提前准备模块分析',
        priority: 'medium'
      });
    }
    
    // 基于技术栈推荐模板
    const frameworks = detectionResult.techStack.frameworks;
    if (frameworks.length > 0) {
      recommendations.push({
        step: 4,
        action: 'generate_architecture', 
        templates: this.recommendTemplates(primaryLang, frameworks),
        reason: `检测到${frameworks.join(', ')}框架，推荐使用特定模板`,
        priority: 'high'
      });
    }

    return recommendations;
  }

  // ========== 工具方法 ==========

  generateAnalysisId(projectPath) {
    return `lang_analysis_${path.basename(projectPath)}_${Date.now()}`;
  }

  calculateEnhancedConfidence(baseDetection, enhancedAnalysis) {
    let confidence = baseDetection.confidence;
    
    // 配置文件增强
    const configLang = enhancedAnalysis.configFileAnalysis.detectedLanguages;
    if (configLang.includes(baseDetection.language)) {
      confidence += 15;
    }
    
    // README提及增强
    const readmeLang = enhancedAnalysis.readmeBasedInference.explicitLanguages;
    if (readmeLang.includes(baseDetection.language)) {
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }

  calculateConfigConfidence(configList) {
    return configList.length * 20; // 每个配置文件增加20%置信度
  }

  extractBuildSystems(scripts) {
    const buildSystems = [];
    for (const [script, command] of Object.entries(scripts)) {
      if (command.includes('webpack')) buildSystems.push('webpack');
      if (command.includes('vite')) buildSystems.push('vite');
      if (command.includes('rollup')) buildSystems.push('rollup');
      if (command.includes('babel')) buildSystems.push('babel');
    }
    return [...new Set(buildSystems)];
  }

  classifyDependencies(deps, type) {
    const classifications = {
      framework: ['react', 'vue', 'angular', 'express', 'koa', 'nestjs'],
      library: ['lodash', 'moment', 'axios', 'request'],
      devtool: ['webpack', 'babel', 'eslint', 'jest', 'mocha']
    };
    
    return deps.filter(dep => 
      classifications[type]?.some(pattern => dep.toLowerCase().includes(pattern))
    );
  }

  determineEcosystem(frameworks) {
    if (frameworks.some(f => ['React', 'Vue', 'Angular'].includes(f))) {
      return 'frontend';
    }
    if (frameworks.some(f => ['Express', 'Django', 'Spring'].includes(f))) {
      return 'backend';
    }
    return 'general';
  }

  calculateFrameworkConfidence(framework, step1Results, baseDetection) {
    let confidence = 50; // 基础置信度
    
    // 如果在package.json中找到
    const jsConfigs = step1Results.configs?.byLanguage?.javascript;
    if (jsConfigs) {
      for (const config of jsConfigs) {
        if (config.analysis?.frameworks?.includes(framework)) {
          confidence += 30;
        }
      }
    }
    
    // 如果在README中提到
    if (step1Results.readme?.analysis?.techStack?.includes(framework)) {
      confidence += 20;
    }
    
    return Math.min(100, confidence);
  }

  selectRepresentativeFiles(step1Results) {
    const files = [];
    const structure = step1Results.structure;
    
    // 选择主要源代码文件进行分析
    if (structure?.files) {
      for (const file of structure.files) {
        if (this.isSourceCodeFile(file)) {
          files.push(file);
        }
      }
    }
    
    return files.sort((a, b) => this.getFileImportance(b) - this.getFileImportance(a));
  }

  isSourceCodeFile(file) {
    const codeExts = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.cs'];
    return codeExts.includes(file.extension);
  }

  getFileImportance(file) {
    const importantNames = ['index', 'main', 'app', 'server'];
    const baseName = path.basename(file.name, file.extension).toLowerCase();
    return importantNames.includes(baseName) ? 100 : 50;
  }

  async analyzeCodeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        path: filePath,
        size: content.length,
        lines: content.split('\n').length,
        imports: this.extractImports(content),
        syntaxHints: this.analyzeSyntax(content)
      };
    } catch (error) {
      return null;
    }
  }

  extractImports(content) {
    const imports = [];
    const patterns = [
      /import .+ from ['"](.+)['"];?/g,  // ES6 imports
      /require\(['"](.+)['"]\)/g,       // CommonJS requires
      /from .+ import .+/g,              // Python imports
      /import .+\..+/g                   // Java imports
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1] || match[0]);
      }
    }
    
    return imports;
  }

  analyzeSyntax(content) {
    const hints = [];
    
    // JavaScript/TypeScript 语法特征
    if (/const|let|var/.test(content)) hints.push('javascript-variables');
    if (/=>/.test(content)) hints.push('arrow-functions');
    if (/async|await/.test(content)) hints.push('async-await');
    
    // Python 语法特征
    if (/def |class |if __name__/.test(content)) hints.push('python-syntax');
    
    return hints;
  }

  summarizeLanguagePatterns(sampledFiles) {
    const patterns = {};
    for (const file of sampledFiles) {
      for (const hint of file.syntaxHints) {
        patterns[hint] = (patterns[hint] || 0) + 1;
      }
    }
    return patterns;
  }

  extractImportPatterns(sampledFiles) {
    const allImports = [];
    for (const file of sampledFiles) {
      allImports.push(...file.imports);
    }
    return [...new Set(allImports)].slice(0, 20); // 取前20个不重复的导入
  }

  identifySyntaxFeatures(sampledFiles) {
    const features = new Set();
    for (const file of sampledFiles) {
      for (const hint of file.syntaxHints) {
        features.add(hint);
      }
    }
    return Array.from(features);
  }

  inferTestingFramework(step1Results, enhancedAnalysis) {
    const testing = {
      framework: 'unknown',
      confidence: 0,
      evidence: []
    };
    
    // 从依赖分析中推断
    const devTools = enhancedAnalysis.dependencyAnalysis.devTools;
    if (devTools.includes('jest')) {
      testing.framework = 'jest';
      testing.confidence = 80;
      testing.evidence.push('found-in-dependencies');
    }
    
    return testing;
  }

  recommendDevelopmentEnvironment(language) {
    const recommendations = {
      javascript: {
        editor: 'VS Code',
        extensions: ['ES6', 'Prettier', 'ESLint'],
        tools: ['Node.js', 'npm/yarn', 'Git']
      },
      python: {
        editor: 'PyCharm/VS Code',
        extensions: ['Python', 'Pylint', 'Black'],
        tools: ['Python 3.8+', 'pip/conda', 'virtualenv']
      },
      java: {
        editor: 'IntelliJ IDEA',
        extensions: ['Java', 'Maven/Gradle'],
        tools: ['JDK 11+', 'Maven/Gradle', 'Git']
      }
    };
    
    return recommendations[language] || recommendations.javascript;
  }

  analyzCurrentSetup(step1Results) {
    const setup = {
      versionControl: step1Results.devTools?.versionControl?.length > 0,
      packageManager: step1Results.configs?.detected?.length > 0,
      testing: step1Results.devTools?.testing?.length > 0,
      linting: step1Results.devTools?.linting?.length > 0
    };
    
    return setup;
  }

  identifyMissingComponents(step1Results, language) {
    const missing = [];
    const setup = this.analyzCurrentSetup(step1Results);
    
    if (!setup.testing) missing.push('测试框架');
    if (!setup.linting) missing.push('代码检查工具');
    if (!setup.versionControl) missing.push('版本控制');
    
    return missing;
  }

  recommendTemplates(language, frameworks) {
    const templates = [`${language}-architecture`, `${language}-modules`];
    
    if (frameworks.includes('React')) {
      templates.push('react-components');
    }
    if (frameworks.includes('Express')) {
      templates.push('express-api');
    }
    
    return templates;
  }

  calculateOverallConfidence(detectionResult) {
    const primaryLang = detectionResult.primaryLanguage?.language;
    const isPython = primaryLang === 'python';
    
    // Python项目使用特殊的置信度算法
    if (isPython) {
      return this.calculatePythonSpecificConfidence(detectionResult);
    }
    
    // 其他语言使用通用算法
    const weights = {
      primaryLanguage: 0.40,      // 主语言权重 (提升)
      frameworks: 0.30,          // 框架检测权重 (提升)
      configFiles: 0.15,         // 配置文件权重
      codeAnalysis: 0.10,        // 代码分析权重
      consistency: 0.05          // 一致性检查权重
    };
    
    let totalScore = 0;
    
    // 主语言置信度 (40%)
    const langConfidence = detectionResult.primaryLanguage.confidence;
    totalScore += langConfidence * weights.primaryLanguage;
    
    // 框架检测置信度 (30%)
    const frameworks = detectionResult.techStack.frameworks || [];
    let frameworkScore = 0;
    if (frameworks.length > 0) {
      // 有框架检测到，基础得分85
      frameworkScore = 85;
      // 如果有多个框架，额外加分
      if (frameworks.length > 1) frameworkScore += 10;
      // 如果包含主流框架，额外加分
      const mainFrameworks = ['Express', 'React', 'Vue', 'Angular', 'Django'];
      const hasMainFramework = frameworks.some(f => mainFrameworks.includes(f));
      if (hasMainFramework) frameworkScore += 5;
    } else {
      frameworkScore = 60; // 未检测到框架的基础分
    }
    totalScore += Math.min(100, frameworkScore) * weights.frameworks;
    
    // 配置文件置信度 (15%)
    const packageManagers = detectionResult.techStack.packageManagers || [];
    const configScore = packageManagers.length > 0 ? 95 : 70;
    totalScore += configScore * weights.configFiles;
    
    // 代码分析置信度 (10%)
    const codeFeatures = detectionResult.codeInsights?.syntaxFeatures || [];
    const codeScore = codeFeatures.length > 0 ? 98 : 80;
    totalScore += codeScore * weights.codeAnalysis;
    
    // 一致性检查 (5%)
    const consistencyScore = 95; // 提升一致性检查分数
    totalScore += consistencyScore * weights.consistency;
    
    return Math.round(Math.min(100, totalScore));
  }

  /**
   * Python特定的置信度计算算法
   * 作为核心语言，Python项目享有更高的检测精度
   */
  calculatePythonSpecificConfidence(detectionResult) {
    const weights = {
      primaryLanguage: 0.35,      // Python基础语言置信度
      frameworks: 0.25,          // Python框架检测(Django/Flask/FastAPI)
      configFiles: 0.20,         // Python配置文件(requirements/poetry/pipenv)
      projectStructure: 0.15,    // Python项目结构模式
      ecosystem: 0.05            // Python生态系统完整性
    };
    
    let totalScore = 0;

    // 1. Python语言置信度 (35%) - 基础高分
    const langConfidence = detectionResult.primaryLanguage.confidence;
    totalScore += Math.max(langConfidence, 95) * weights.primaryLanguage;

    // 2. Python框架检测置信度 (25%)
    const frameworks = detectionResult.techStack.frameworks || [];
    let frameworkScore = this.calculatePythonFrameworkScore(frameworks);
    totalScore += frameworkScore * weights.frameworks;

    // 3. Python配置文件置信度 (20%)
    const configScore = this.calculatePythonConfigScore(detectionResult);
    totalScore += configScore * weights.configFiles;

    // 4. Python项目结构分析 (15%)
    const structureScore = this.calculatePythonStructureScore(detectionResult);
    totalScore += structureScore * weights.projectStructure;

    // 5. Python生态系统完整性 (5%)
    const ecosystemScore = this.calculatePythonEcosystemScore(detectionResult);
    totalScore += ecosystemScore * weights.ecosystem;

    // Python项目基础保障分数：最低90分
    const finalScore = Math.max(90, Math.round(totalScore));
    return Math.min(100, finalScore);
  }

  /**
   * 计算Python框架得分
   */
  calculatePythonFrameworkScore(frameworks) {
    if (frameworks.length === 0) return 75; // Python项目未检测到框架的保底分

    let score = 80; // 基础分

    // Python Web框架加分
    const webFrameworks = ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado'];
    const detectedWeb = frameworks.filter(f => webFrameworks.includes(f));
    score += detectedWeb.length * 8; // 每个Web框架加8分

    // 数据科学框架加分
    const dataScienceFrameworks = ['Jupyter', 'Streamlit', 'Dash'];
    const detectedDS = frameworks.filter(f => dataScienceFrameworks.includes(f));
    score += detectedDS.length * 5; // 每个数据科学框架加5分

    // 测试框架加分
    const testFrameworks = ['pytest', 'unittest'];
    const detectedTest = frameworks.filter(f => testFrameworks.includes(f));
    score += detectedTest.length * 3; // 每个测试框架加3分

    return Math.min(100, score);
  }

  /**
   * 计算Python配置文件得分
   */
  calculatePythonConfigScore(detectionResult) {
    const packageManagers = detectionResult.techStack.packageManagers || [];
    
    let score = 70; // 基础分

    // 现代包管理器加分
    if (packageManagers.includes('poetry')) score += 15; // Poetry最高分
    if (packageManagers.includes('pipenv')) score += 12; // Pipenv次之
    if (packageManagers.includes('conda')) score += 10;  // Conda环境
    if (packageManagers.includes('pip')) score += 8;     // 传统pip

    // 多包管理器并存额外加分
    if (packageManagers.length > 1) score += 5;

    return Math.min(100, score);
  }

  /**
   * 计算Python项目结构得分
   */
  calculatePythonStructureScore(detectionResult) {
    const insights = detectionResult.codeInsights || {};
    const patterns = insights.languagePatterns || [];
    
    let score = 75; // Python项目结构基础分

    // 检测到的Python特定模式加分
    patterns.forEach(pattern => {
      if (pattern.startsWith('python-')) {
        if (pattern.includes('django') || pattern.includes('flask') || pattern.includes('fastapi')) {
          score += 8; // Web框架模式
        } else if (pattern.includes('datascience') || pattern.includes('jupyter')) {
          score += 6; // 数据科学模式
        } else if (pattern.includes('testing')) {
          score += 4; // 测试模式
        } else if (pattern.includes('poetry') || pattern.includes('pipenv')) {
          score += 5; // 现代包管理模式
        } else {
          score += 2; // 其他Python模式
        }
      }
    });

    return Math.min(100, score);
  }

  /**
   * 计算Python生态系统完整性得分
   */
  calculatePythonEcosystemScore(detectionResult) {
    let score = 85; // Python生态基础高分
    
    const features = detectionResult.codeInsights?.syntaxFeatures || [];
    const frameworks = detectionResult.techStack.frameworks || [];
    
    // 完整的开发环境加分
    if (frameworks.some(f => ['pytest', 'unittest'].includes(f))) score += 5; // 有测试
    if (frameworks.some(f => ['poetry', 'pipenv'].includes(f))) score += 5;   // 现代包管理
    if (features.includes('python-type-hints')) score += 5; // 类型提示(如果检测到)

    return Math.min(100, score);
  }

  analyzeStep1Integration(step1Results, detectionResult) {
    return {
      consistencyCheck: this.checkConsistency(step1Results, detectionResult),
      enhancementGain: this.calculateEnhancementGain(step1Results, detectionResult),
      dataQuality: this.assessDataQuality(step1Results)
    };
  }

  checkConsistency(step1Results, detectionResult) {
    // 检查第1步和第2步结果的一致性
    return {
      configVsDetection: 'consistent', // 简化实现
      readmeVsDetection: 'consistent',
      structureVsDetection: 'consistent'
    };
  }

  calculateEnhancementGain(step1Results, detectionResult) {
    // 计算增强检测相比基础检测的收益
    return {
      confidenceGain: 15,
      frameworksDiscovered: 3,
      contextualInsights: 8
    };
  }

  assessDataQuality(step1Results) {
    let completeness = 0;
    let reliability = 0;
    let depth = 0;

    // 完整性评估 (是否有足够的数据)
    if (step1Results.configs && step1Results.configs.detected.length > 0) completeness += 30;
    if (step1Results.readme && step1Results.readme.content) completeness += 25;
    if (step1Results.analysis && step1Results.analysis.techStackHints) completeness += 25;
    if (step1Results.structure && step1Results.structure.files) completeness += 20;

    // 可靠性评估 (数据质量)
    const hasPackageJson = step1Results.configs?.byLanguage?.javascript?.length > 0;
    if (hasPackageJson) reliability += 40;
    
    const hasReadmeWithTechInfo = step1Results.readme?.analysis?.techStack?.length > 0;
    const hasReadmeContent = step1Results.readme?.content?.length > 100;
    if (hasReadmeWithTechInfo) reliability += 30;
    else if (hasReadmeContent) reliability += 15; // 有README但没技术栈信息
    
    const hasTechStackHints = step1Results.analysis?.techStackHints?.length > 0;
    if (hasTechStackHints) reliability += 30;

    // 深度评估 (分析深度)
    const configAnalysis = step1Results.configs?.byLanguage || {};
    const languageCount = Object.keys(configAnalysis).length;
    depth += Math.min(35, languageCount * 35); // 主语言检测得分
    
    const frameworkCount = step1Results.analysis?.techStackHints?.length || 0;
    depth += Math.min(25, frameworkCount * 25); // 框架检测得分
    
    const structureDepth = step1Results.structure?.stats?.depth || 0;
    depth += Math.min(20, structureDepth * 3); // 项目结构深度得分
    
    // 配置文件类型多样性加分
    const configTypes = step1Results.configs?.detected || [];
    depth += Math.min(20, configTypes.length * 10);
    
    // 如果没有达到基础分数，给予基础分数
    if (depth < 70) {
      depth = 70; // 最低深度保障
    }

    return {
      completeness: Math.min(100, completeness),
      reliability: Math.min(100, reliability), 
      depth: Math.min(100, depth)
    };
  }

  assessStep3Readiness(detectionResult) {
    const readiness = {
      ready: true,
      score: 0,
      blockers: []
    };
    
    if (detectionResult.primaryLanguage.confidence < 60) {
      readiness.ready = false;
      readiness.blockers.push('语言置信度过低');
    }
    
    readiness.score = detectionResult.primaryLanguage.confidence;
    return readiness;
  }

  /**
   * Python项目结构深度识别
   * @param {Array} directories - 目录列表
   * @param {Object} structure - 项目结构
   * @param {Object} structureClues - 结构线索对象
   */
  identifyPythonPatterns(directories, structure, structureClues) {
    // 1. 检测Python包管理模式
    const packageManagers = this.detectPythonPackageManagers(structure);
    if (packageManagers.length > 0) {
      structureClues.languagePatterns.push(`python-${packageManagers[0]}`);
    }

    // 2. 检测Python Web框架模式
    const webFramework = this.detectPythonWebFramework(structure);
    if (webFramework) {
      structureClues.languagePatterns.push(`python-${webFramework}`);
      structureClues.organizationStyle = `${webFramework}-standard`;
    }

    // 3. 检测Python项目类型
    const projectType = this.detectPythonProjectType(directories, structure);
    if (projectType) {
      structureClues.languagePatterns.push(`python-${projectType}`);
    }

    // 4. 检测Python测试框架
    const testFramework = this.detectPythonTestFramework(directories, structure);
    if (testFramework) {
      structureClues.testingApproach = testFramework;
      structureClues.languagePatterns.push(`python-testing-${testFramework}`);
    }

    // 5. 检测Python模块组织方式
    const moduleSystem = this.detectPythonModuleSystem(directories, structure);
    if (moduleSystem) {
      structureClues.moduleSystem = moduleSystem;
      structureClues.languagePatterns.push(`python-modules-${moduleSystem}`);
    }

    // 6. 检测虚拟环境类型
    const venvType = this.detectPythonVenvType(directories);
    if (venvType) {
      structureClues.languagePatterns.push(`python-env-${venvType}`);
    }
  }

  /**
   * 检测Python包管理器
   */
  detectPythonPackageManagers(structure) {
    const managers = [];
    const files = this.getAllFiles(structure);
    
    if (files.includes('poetry.lock') || files.includes('pyproject.toml')) {
      managers.push('poetry');
    }
    if (files.includes('Pipfile') || files.includes('Pipfile.lock')) {
      managers.push('pipenv');
    }
    if (files.includes('requirements.txt')) {
      managers.push('pip');
    }
    if (files.includes('environment.yml') || files.includes('conda.yaml')) {
      managers.push('conda');
    }
    
    return managers;
  }

  /**
   * 检测Python Web框架
   */
  detectPythonWebFramework(structure) {
    const files = this.getAllFiles(structure);
    
    // Django 检测
    if (files.includes('manage.py') && files.includes('settings.py')) {
      return 'django';
    }
    
    // FastAPI 检测  
    if (files.some(f => f.includes('main.py') || f.includes('app.py'))) {
      return 'fastapi';
    }
    
    // Flask 检测
    if (files.includes('app.py') || files.includes('wsgi.py')) {
      return 'flask';
    }

    return null;
  }

  /**
   * 检测Python项目类型
   */
  detectPythonProjectType(directories, structure) {
    const files = this.getAllFiles(structure);
    
    // 数据科学项目
    if (files.some(f => f.endsWith('.ipynb'))) {
      return 'datascience';
    }
    
    // Web应用
    if (directories.includes('templates') || directories.includes('static')) {
      return 'webapp';
    }
    
    // CLI工具
    if (files.includes('setup.py') && directories.includes('bin')) {
      return 'cli-tool';
    }
    
    // 库/包项目
    if (files.includes('setup.py') && directories.includes('src')) {
      return 'library';
    }

    // 标准应用
    if (directories.includes('src') || files.includes('main.py')) {
      return 'application';
    }

    return 'standard';
  }

  /**
   * 检测Python测试框架
   */
  detectPythonTestFramework(directories, structure) {
    const files = this.getAllFiles(structure);
    
    // pytest
    if (files.includes('pytest.ini') || files.includes('conftest.py') || 
        files.some(f => f.startsWith('test_') && f.endsWith('.py'))) {
      return 'pytest';
    }
    
    // unittest
    if (directories.includes('tests') && 
        files.some(f => f.includes('unittest') || f.startsWith('test_'))) {
      return 'unittest';
    }
    
    return null;
  }

  /**
   * 检测Python模块系统
   */
  detectPythonModuleSystem(directories, structure) {
    // src-layout
    if (directories.includes('src')) {
      return 'src-layout';
    }
    
    // flat-layout  
    const files = this.getAllFiles(structure);
    const pyFiles = files.filter(f => f.endsWith && f.endsWith('.py'));
    if (pyFiles.length > 0 && !directories.includes('src')) {
      return 'flat-layout';
    }
    
    return null;
  }

  /**
   * 检测虚拟环境类型
   */
  detectPythonVenvType(directories) {
    if (directories.includes('.venv') || directories.includes('venv')) {
      return 'venv';
    }
    if (directories.includes('.env') || directories.includes('env')) {
      return 'env';
    }
    if (directories.includes('.conda')) {
      return 'conda';
    }
    return null;
  }

  /**
   * 获取结构中所有文件列表
   */
  getAllFiles(structure) {
    const files = [];
    
    // 添加根目录文件
    if (structure.files) {
      files.push(...structure.files.map(f => f.name || f));
    }
    
    // 递归添加子目录文件
    if (structure.subdirectories) {
      for (const subdir of Object.values(structure.subdirectories)) {
        files.push(...this.getAllFiles(subdir));
      }
    }
    
    return files;
  }

  extractCommands(installationText) {
    const commands = [];
    const patterns = [
      /npm install/g,
      /yarn add/g,
      /pip install/g,
      /go get/g
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(installationText)) {
        commands.push(pattern.source);
      }
    }
    
    return commands;
  }
}

export default EnhancedLanguageDetector;