/**
 * File Content Analyzer - Step 3 Implementation
 * 智能文件内容分析器：深度解析源码、配置、测试文件
 * 
 * 功能：
 * - 文件内容深度解析（函数、类、接口）
 * - 依赖关系分析
 * - 重要性评分
 * - 多语言支持（Python核心）
 */

import { promises as fs } from 'fs';
import path from 'path';

export class FileContentAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB
      maxFilesToAnalyze: options.maxFilesToAnalyze || 50,
      enableDeepAnalysis: options.enableDeepAnalysis !== false,
      supportedExtensions: options.supportedExtensions || [
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.cs',
        '.json', '.yaml', '.yml', '.toml', '.md', '.txt', '.env'
      ],
      pythonPriority: options.pythonPriority !== false, // Python作为核心语言
      ...options
    };
    
    this.analysisCache = new Map();
    this.startTime = null;
  }

  /**
   * 分析项目文件内容
   * @param {Object} projectData - Step 1和Step 2的结果数据
   * @returns {Object} 文件内容分析结果
   */
  async analyzeFiles(projectData) {
    this.startTime = Date.now();
    
    try {
      console.log('[FileContentAnalyzer] 开始文件内容分析');
      
      // 提取关键信息
      const extractedData = this._extractProjectData(projectData);
      const { projectPath, languageData } = extractedData;
      
      // 验证必需参数
      if (!projectPath) {
        throw new Error('项目路径不能为空');
      }
      
      console.log(`[FileContentAnalyzer] 分析项目路径: ${projectPath}`);
      console.log(`[FileContentAnalyzer] 主要语言: ${languageData.primaryLanguage || '未知'}`);
      console.log(`[FileContentAnalyzer] 可用文件数: ${extractedData.files ? extractedData.files.length : 0}`);
      
      // 选择要分析的文件
      const filesToAnalyze = await this._selectFilesToAnalyze(projectPath, extractedData);
      console.log(`[FileContentAnalyzer] 选定 ${filesToAnalyze.length} 个文件进行分析`);
      
      // 并行分析文件内容
      const fileAnalysisResults = await this._analyzeFilesParallel(filesToAnalyze);
      
      // 生成综合分析报告
      const analysisReport = this._generateAnalysisReport(fileAnalysisResults, languageData);
      
      // 计算文件重要性和依赖关系
      const dependencyGraph = this._buildDependencyGraph(fileAnalysisResults);
      const importanceScores = this._calculateImportanceScores(fileAnalysisResults, dependencyGraph);
      
      const result = {
        success: true,
        analysis: {
          totalFilesAnalyzed: fileAnalysisResults.length,
          analysisTime: Date.now() - this.startTime,
          mainLanguage: languageData.primaryLanguage,
          confidence: languageData.confidence
        },
        files: fileAnalysisResults,
        overview: analysisReport,
        dependencies: dependencyGraph,
        importance: importanceScores,
        recommendations: this._generateRecommendations(fileAnalysisResults, languageData),
        timestamp: new Date().toISOString()
      };
      
      console.log(`[FileContentAnalyzer] 文件内容分析完成 (${result.analysis.analysisTime}ms)`);
      return result;
      
    } catch (error) {
      console.error('[FileContentAnalyzer] 文件内容分析失败:', error);
      return {
        success: false,
        error: error.message,
        analysisTime: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 提取项目数据
   */
  _extractProjectData(projectData) {
    const result = {
      projectPath: projectData.projectPath || projectData.structure?.path,
      structure: projectData.structure || projectData,
      languageData: projectData.languageData || projectData.language || { primaryLanguage: 'unknown', confidence: 0 }
    };
    
    // 如果structure中的files存在，重构文件列表
    if (result.structure?.files) {
      result.files = this._flattenFileStructure(result.structure, result.projectPath);
    } else if (result.structure?.subdirectories) {
      // 如果只有subdirectories，也尝试提取文件
      result.files = this._flattenFileStructure(result.structure, result.projectPath);
    } else {
      console.warn('[FileContentAnalyzer] 没有找到文件结构数据');
      result.files = [];
    }
    
    console.log(`[FileContentAnalyzer] 提取数据完成 - 路径: ${result.projectPath}, 文件数: ${result.files.length}`);
    
    return result;
  }

  /**
   * 将嵌套的文件结构展平为单一数组
   */
  _flattenFileStructure(structure, projectPath) {
    const allFiles = [];
    
    if (!structure) {
      console.warn('[FileContentAnalyzer] 文件结构为空');
      return allFiles;
    }
    
    // 处理根目录的文件
    if (structure.files && Array.isArray(structure.files)) {
      structure.files.forEach(file => {
        // 构建正确的绝对路径
        let fullPath;
        
        // ProjectScanner已经提供了完整的绝对路径
        if (file.path && path.isAbsolute(file.path)) {
          fullPath = file.path;
        } else if (file.path) {
          // 如果path是相对路径，检查是否已经相对于projectPath
          const testPath = path.resolve(projectPath, file.path);
          // 验证这个路径是否存在，如果不存在，说明可能已经包含了项目名重复
          try {
            // 先尝试直接使用file.path作为相对于当前工作目录的路径
            if (file.path.startsWith(path.basename(projectPath))) {
              // 如果路径以项目名开头，直接从当前工作目录解析
              fullPath = path.resolve(file.path);
            } else {
              fullPath = testPath;
            }
          } catch {
            fullPath = testPath;
          }
        } else {
          fullPath = path.resolve(projectPath, file.name);
        }
        
        const relativePath = path.relative(projectPath, fullPath);
        
        allFiles.push({
          ...file,
          relativePath,
          fullPath,
          size: file.size || 0 // 使用实际文件大小，如果没有则为0
        });
      });
    }
    
    // 递归处理子目录
    if (structure.subdirectories && typeof structure.subdirectories === 'object') {
      Object.entries(structure.subdirectories).forEach(([dirName, dirData]) => {
        if (dirData && typeof dirData === 'object') {
          const subFiles = this._flattenFileStructure(dirData, projectPath);
          allFiles.push(...subFiles);
        }
      });
    }
    
    console.log(`[FileContentAnalyzer] 从结构中提取到 ${allFiles.length} 个文件`);
    if (allFiles.length > 0) {
      console.log(`[FileContentAnalyzer] 文件示例: ${allFiles.slice(0, 3).map(f => f.relativePath).join(', ')}`);
    }
    
    return allFiles;
  }

  /**
   * 选择要分析的文件
   */
  async _selectFilesToAnalyze(projectPath, extractedData) {
    const allFiles = extractedData.files || [];
    const selectedFiles = [];
    const languageData = extractedData.languageData;
    
    // 文件选择策略
    const selectionCriteria = {
      // 1. 核心源码文件（优先级最高）
      coreSource: this._getSourceFiles(allFiles, languageData),
      // 2. 配置文件
      configFiles: this._getConfigFiles(allFiles),
      // 3. 测试文件
      testFiles: this._getTestFiles(allFiles),
      // 4. 文档文件
      docFiles: this._getDocFiles(allFiles)
    };

    // Python优先策略
    if (this.options.pythonPriority && languageData.primaryLanguage === 'python') {
      selectionCriteria.coreSource = this._prioritizePythonFiles(selectionCriteria.coreSource);
    }

    // 按优先级选择文件
    const priorityOrder = ['coreSource', 'configFiles', 'testFiles', 'docFiles'];
    let totalSelected = 0;
    
    for (const category of priorityOrder) {
      const categoryFiles = selectionCriteria[category];
      const remainingQuota = this.options.maxFilesToAnalyze - totalSelected;
      
      if (remainingQuota <= 0) break;
      
      const filesToAdd = categoryFiles.slice(0, remainingQuota);
      selectedFiles.push(...filesToAdd.map(file => ({
        ...file,
        category,
        fullPath: file.fullPath || path.resolve(projectPath, file.relativePath),
        priority: this._calculateFilePriority(file, category, languageData)
      })));
      
      totalSelected += filesToAdd.length;
    }

    // 按优先级排序
    selectedFiles.sort((a, b) => b.priority - a.priority);
    
    return selectedFiles.slice(0, this.options.maxFilesToAnalyze);
  }

  /**
   * 获取源码文件
   */
  _getSourceFiles(allFiles, languageData) {
    const sourceExtensions = this._getSourceExtensions(languageData.primaryLanguage);
    return allFiles.filter(file => 
      sourceExtensions.some(ext => file.relativePath.endsWith(ext)) &&
      !this._isTestFile(file.relativePath) &&
      !this._isConfigFile(file.relativePath)
    );
  }

  /**
   * 获取配置文件
   */
  _getConfigFiles(allFiles) {
    const configPatterns = [
      'package.json', 'requirements.txt', 'pyproject.toml', 'setup.py',
      'Dockerfile', 'docker-compose.yml', '.env', '.env.example',
      'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod'
    ];
    
    return allFiles.filter(file => 
      configPatterns.some(pattern => file.relativePath.endsWith(pattern)) ||
      file.relativePath.includes('config') ||
      file.relativePath.endsWith('.config.js') ||
      file.relativePath.endsWith('.config.json')
    );
  }

  /**
   * 获取测试文件
   */
  _getTestFiles(allFiles) {
    return allFiles.filter(file => this._isTestFile(file.relativePath));
  }

  /**
   * 获取文档文件
   */
  _getDocFiles(allFiles) {
    const docPatterns = ['README', 'CHANGELOG', 'LICENSE', 'CONTRIBUTING'];
    return allFiles.filter(file => 
      file.relativePath.endsWith('.md') &&
      (docPatterns.some(pattern => file.relativePath.toUpperCase().includes(pattern)) ||
       file.relativePath.includes('doc'))
    );
  }

  /**
   * Python文件优先处理
   */
  _prioritizePythonFiles(sourceFiles) {
    return sourceFiles.sort((a, b) => {
      const aPython = a.relativePath.endsWith('.py');
      const bPython = b.relativePath.endsWith('.py');
      
      if (aPython && !bPython) return -1;
      if (!aPython && bPython) return 1;
      return 0;
    });
  }

  /**
   * 并行分析文件内容
   */
  async _analyzeFilesParallel(filesToAnalyze) {
    const batchSize = 5; // 每次并行处理5个文件
    const results = [];
    
    for (let i = 0; i < filesToAnalyze.length; i += batchSize) {
      const batch = filesToAnalyze.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this._analyzeFileContent(file));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(result => result !== null));
      } catch (error) {
        console.error(`[FileContentAnalyzer] 批量分析失败:`, error);
        // 逐个重试
        for (const file of batch) {
          try {
            const result = await this._analyzeFileContent(file);
            if (result) results.push(result);
          } catch (fileError) {
            console.error(`[FileContentAnalyzer] 文件分析失败: ${file.relativePath}`, fileError);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * 分析单个文件内容
   */
  async _analyzeFileContent(fileInfo) {
    try {
      // 获取文件真实大小（如果size为0或未知）
      let realSize = fileInfo.size;
      if (realSize === 0 || !realSize) {
        try {
          const stats = await fs.stat(fileInfo.fullPath);
          realSize = stats.size;
          fileInfo.size = realSize; // 更新文件信息
        } catch (statError) {
          console.warn(`[FileContentAnalyzer] 无法获取文件大小: ${fileInfo.relativePath}`, statError.message);
          return null;
        }
      }

      // 检查缓存
      const cacheKey = `${fileInfo.fullPath}-${realSize}`;
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      // 文件大小检查
      if (realSize > this.options.maxFileSize) {
        console.warn(`[FileContentAnalyzer] 文件过大跳过: ${fileInfo.relativePath} (${realSize} bytes)`);
        return null;
      }

      // 读取文件内容
      const content = await fs.readFile(fileInfo.fullPath, 'utf8');
      
      // 分析文件内容
      const analysis = await this._performContentAnalysis(content, fileInfo);
      
      const result = {
        ...fileInfo,
        content: {
          length: content.length,
          lines: content.split('\n').length,
          encoding: 'utf8'
        },
        analysis,
        analyzedAt: new Date().toISOString()
      };
      
      // 缓存结果
      this.analysisCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error(`[FileContentAnalyzer] 文件内容分析错误: ${fileInfo.relativePath}`, error);
      return {
        ...fileInfo,
        error: error.message,
        analyzedAt: new Date().toISOString()
      };
    }
  }

  /**
   * 执行内容分析
   */
  async _performContentAnalysis(content, fileInfo) {
    const extension = path.extname(fileInfo.relativePath).toLowerCase();
    
    // 基础分析
    const basicAnalysis = {
      type: this._determineFileType(fileInfo.relativePath, content),
      complexity: this._calculateComplexity(content, extension),
      structure: this._analyzeStructure(content, extension),
      dependencies: this._extractDependencies(content, extension),
      exports: this._extractExports(content, extension),
      functions: this._extractFunctions(content, extension),
      classes: this._extractClasses(content, extension),
      comments: this._analyzeComments(content),
      codeQuality: this._assessCodeQuality(content, extension)
    };

    // 语言特定分析
    if (extension === '.py') {
      basicAnalysis.pythonSpecific = this._analyzePythonContent(content);
    } else if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
      basicAnalysis.javascriptSpecific = this._analyzeJavaScriptContent(content);
    }

    return basicAnalysis;
  }

  /**
   * 确定文件类型
   */
  _determineFileType(filePath, content) {
    if (this._isTestFile(filePath)) return 'test';
    if (this._isConfigFile(filePath)) return 'config';
    if (filePath.endsWith('.md')) return 'documentation';
    if (this._isSourceCode(filePath)) return 'source';
    return 'other';
  }

  /**
   * 计算复杂度
   */
  _calculateComplexity(content, extension) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // 简单复杂度度量
    const cyclomaticKeywords = ['if', 'for', 'while', 'switch', 'case', 'catch', 'elif', 'except'];
    const complexityScore = cyclomaticKeywords.reduce((score, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      return score + (matches ? matches.length : 0);
    }, 0);

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      cyclomaticComplexity: complexityScore,
      rating: this._getComplexityRating(complexityScore, nonEmptyLines.length)
    };
  }

  /**
   * 分析代码结构
   */
  _analyzeStructure(content, extension) {
    const structure = {
      imports: [],
      functions: 0,
      classes: 0,
      variables: 0,
      constants: 0
    };

    // 基本结构统计
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // 导入语句
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ') || 
          trimmed.includes('require(') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
        structure.imports.push(trimmed);
      }
      
      // 函数定义
      if (trimmed.startsWith('def ') || trimmed.startsWith('function ') || 
          trimmed.includes('=> ') || trimmed.match(/^\w+\s*:\s*\(/)) {
        structure.functions++;
      }
      
      // 类定义
      if (trimmed.startsWith('class ')) {
        structure.classes++;
      }
    });

    return structure;
  }

  /**
   * 提取依赖关系
   */
  _extractDependencies(content, extension) {
    const dependencies = new Set();
    
    // Python依赖
    if (extension === '.py') {
      const pythonImports = content.match(/^(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/gm);
      if (pythonImports) {
        pythonImports.forEach(imp => {
          const match = imp.match(/(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
          if (match) dependencies.add(match[1]);
        });
      }
    }
    
    // JavaScript/TypeScript依赖
    if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
      const jsImports = content.match(/(?:import|require)\s*\(?[^'"`]*['"`]([^'"`]+)['"`]/g);
      if (jsImports) {
        jsImports.forEach(imp => {
          const match = imp.match(/['"`]([^'"`]+)['"`]/);
          if (match) dependencies.add(match[1]);
        });
      }
    }
    
    return Array.from(dependencies);
  }

  /**
   * 提取导出
   */
  _extractExports(content, extension) {
    const exports = [];
    
    if (extension === '.py') {
      // Python __all__
      const allMatch = content.match(/__all__\s*=\s*\[(.*?)\]/s);
      if (allMatch) {
        const items = allMatch[1].match(/'([^']+)'|"([^"]+)"/g);
        if (items) {
          exports.push(...items.map(item => item.replace(/['"]/g, '')));
        }
      }
    }
    
    if (['.js', '.ts'].includes(extension)) {
      // JavaScript exports
      const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
      if (exportMatches) {
        exportMatches.forEach(exp => {
          const match = exp.match(/(\w+)$/);
          if (match) exports.push(match[1]);
        });
      }
    }
    
    return exports;
  }

  /**
   * 提取函数
   */
  _extractFunctions(content, extension) {
    const functions = [];
    
    if (extension === '.py') {
      const pyFunctions = content.match(/def\s+(\w+)\s*\([^)]*\):/g);
      if (pyFunctions) {
        functions.push(...pyFunctions.map(func => {
          const match = func.match(/def\s+(\w+)/);
          return match ? match[1] : '';
        }));
      }
    }
    
    if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
      const jsFunctions = content.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*{)/g);
      if (jsFunctions) {
        functions.push(...jsFunctions.map(func => {
          const match = func.match(/(?:function\s+(\w+)|const\s+(\w+))/);
          return match ? (match[1] || match[2]) : '';
        }));
      }
    }
    
    return functions.filter(f => f.length > 0);
  }

  /**
   * 提取类
   */
  _extractClasses(content, extension) {
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return classes;
  }

  /**
   * 分析注释
   */
  _analyzeComments(content) {
    const lines = content.split('\n');
    let commentLines = 0;
    let docstrings = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('//') || 
          trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        commentLines++;
      }
      if (trimmed.includes('"""') || trimmed.includes("'''")) {
        docstrings++;
      }
    });
    
    return {
      commentLines,
      docstrings,
      ratio: commentLines / lines.length
    };
  }

  /**
   * 评估代码质量
   */
  _assessCodeQuality(content, extension) {
    const lines = content.split('\n');
    const codeLines = lines.filter(line => line.trim().length > 0);
    
    // 简单质量指标
    const longLines = lines.filter(line => line.length > 120).length;
    const emptyLines = lines.filter(line => line.trim().length === 0).length;
    const indentationIssues = this._checkIndentation(lines);
    
    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      emptyLines,
      longLines,
      indentationIssues,
      readabilityScore: this._calculateReadabilityScore(lines)
    };
  }

  /**
   * Python特定分析
   */
  _analyzePythonContent(content) {
    return {
      usesTypeHints: content.includes(':') && content.includes('->'),
      hasDocstrings: content.includes('"""') || content.includes("'''"),
      usesAsyncAwait: content.includes('async ') || content.includes('await '),
      hasMainGuard: content.includes('if __name__ == "__main__"'),
      decorators: (content.match(/@\w+/g) || []).length,
      comprehensions: (content.match(/\[.*for.*in.*\]|\{.*for.*in.*\}/g) || []).length
    };
  }

  /**
   * JavaScript特定分析
   */
  _analyzeJavaScriptContent(content) {
    return {
      usesES6: content.includes('=>') || content.includes('const ') || content.includes('let '),
      usesModules: content.includes('import ') || content.includes('export '),
      usesAsync: content.includes('async ') || content.includes('await '),
      usesPromises: content.includes('Promise') || content.includes('.then('),
      hasJSX: content.includes('<') && content.includes('>') && content.includes('React'),
      framework: this._detectJSFramework(content)
    };
  }

  /**
   * 工具方法
   */
  _isTestFile(filePath) {
    return filePath.includes('test') || filePath.includes('spec') || 
           filePath.includes('__tests__') || filePath.endsWith('.test.js') || 
           filePath.endsWith('.test.py') || filePath.endsWith('.spec.js');
  }

  _isConfigFile(filePath) {
    const configFiles = ['package.json', 'requirements.txt', 'setup.py', 'pyproject.toml', 
                        'Dockerfile', '.env', 'config', '.config'];
    return configFiles.some(config => filePath.includes(config));
  }

  _isSourceCode(filePath) {
    return this.options.supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  _getSourceExtensions(primaryLanguage) {
    const extensionMap = {
      'python': ['.py', '.pyw', '.pyx'],
      'javascript': ['.js', '.jsx', '.ts', '.tsx'],
      'java': ['.java'],
      'go': ['.go'],
      'rust': ['.rs'],
      'csharp': ['.cs']
    };
    return extensionMap[primaryLanguage] || ['.js', '.py'];
  }

  _calculateFilePriority(file, category, languageData) {
    let priority = 0;
    
    // 分类权重
    const categoryWeights = { coreSource: 100, configFiles: 80, testFiles: 60, docFiles: 40 };
    priority += categoryWeights[category] || 0;
    
    // 语言匹配权重
    if (languageData.primaryLanguage === 'python' && file.relativePath.endsWith('.py')) {
      priority += 50;
    }
    
    // 文件名权重
    const importantNames = ['main', 'index', 'app', 'server', 'api', '__init__'];
    if (importantNames.some(name => file.relativePath.toLowerCase().includes(name))) {
      priority += 30;
    }
    
    return priority;
  }

  _getComplexityRating(score, codeLines) {
    const ratio = score / Math.max(codeLines, 1);
    if (ratio < 0.1) return 'low';
    if (ratio < 0.2) return 'medium';
    return 'high';
  }

  _checkIndentation(lines) {
    // 简单缩进检查
    let issues = 0;
    lines.forEach(line => {
      if (line.length > 0 && line[0] === '\t' && line.includes(' ')) {
        issues++; // 混合缩进
      }
    });
    return issues;
  }

  _calculateReadabilityScore(lines) {
    const codeLines = lines.filter(line => line.trim().length > 0);
    const avgLineLength = codeLines.reduce((sum, line) => sum + line.length, 0) / codeLines.length;
    
    // 简单可读性评分
    let score = 100;
    if (avgLineLength > 100) score -= 20;
    if (avgLineLength > 150) score -= 30;
    
    return Math.max(0, score);
  }

  _detectJSFramework(content) {
    if (content.includes('React') || content.includes('jsx')) return 'React';
    if (content.includes('Vue') || content.includes('.vue')) return 'Vue';
    if (content.includes('angular') || content.includes('@angular')) return 'Angular';
    if (content.includes('express') || content.includes('Express')) return 'Express';
    return null;
  }

  /**
   * 生成分析报告
   */
  _generateAnalysisReport(fileResults, languageData) {
    const totalFiles = fileResults.length;
    const filesByCategory = this._groupByCategory(fileResults);
    const complexityDistribution = this._calculateComplexityDistribution(fileResults);
    
    return {
      summary: {
        totalFilesAnalyzed: totalFiles,
        mainLanguage: languageData.primaryLanguage,
        languageConfidence: languageData.confidence
      },
      distribution: filesByCategory,
      complexity: complexityDistribution,
      codeMetrics: this._calculateCodeMetrics(fileResults),
      qualityIndicators: this._calculateQualityIndicators(fileResults)
    };
  }

  /**
   * 构建依赖关系图
   */
  _buildDependencyGraph(fileResults) {
    const graph = {
      nodes: [],
      edges: [],
      clusters: []
    };
    
    fileResults.forEach(file => {
      graph.nodes.push({
        id: file.relativePath,
        type: file.analysis.type,
        category: file.category
      });
      
      if (file.analysis.dependencies) {
        file.analysis.dependencies.forEach(dep => {
          graph.edges.push({
            from: file.relativePath,
            to: dep,
            type: 'dependency'
          });
        });
      }
    });
    
    return graph;
  }

  /**
   * 计算重要性得分
   */
  _calculateImportanceScores(fileResults, dependencyGraph) {
    const scores = {};
    
    fileResults.forEach(file => {
      let score = 0;
      
      // 基础分类分数
      const categoryScores = { source: 100, config: 80, test: 60, documentation: 40 };
      score += categoryScores[file.analysis.type] || 0;
      
      // 依赖关系分数（被依赖越多分数越高）
      const incomingEdges = dependencyGraph.edges.filter(edge => edge.to === file.relativePath);
      score += incomingEdges.length * 10;
      
      // 复杂度分数
      if (file.analysis.complexity) {
        score += file.analysis.complexity.cyclomaticComplexity * 2;
      }
      
      // 文件大小分数
      if (file.content) {
        score += Math.min(file.content.lines / 10, 50);
      }
      
      scores[file.relativePath] = Math.min(score, 1000); // 最高1000分
    });
    
    return scores;
  }

  /**
   * 生成建议
   */
  _generateRecommendations(fileResults, languageData) {
    const recommendations = [];
    
    // 复杂度建议
    const highComplexityFiles = fileResults.filter(file => 
      file.analysis.complexity?.rating === 'high'
    );
    
    if (highComplexityFiles.length > 0) {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: `发现 ${highComplexityFiles.length} 个高复杂度文件，建议重构简化`,
        files: highComplexityFiles.map(f => f.relativePath)
      });
    }

    // 文档建议
    const lowDocumentedFiles = fileResults.filter(file => 
      file.analysis.comments?.ratio < 0.1 && file.analysis.type === 'source'
    );
    
    if (lowDocumentedFiles.length > 0) {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        message: `发现 ${lowDocumentedFiles.length} 个源码文件缺少注释，建议增加文档`,
        files: lowDocumentedFiles.map(f => f.relativePath)
      });
    }

    // Python特定建议
    if (languageData.primaryLanguage === 'python') {
      const noTypeHints = fileResults.filter(file => 
        file.relativePath.endsWith('.py') && 
        file.analysis.pythonSpecific && 
        !file.analysis.pythonSpecific.usesTypeHints
      );
      
      if (noTypeHints.length > 0) {
        recommendations.push({
          type: 'python_typing',
          priority: 'low',
          message: `建议为 ${noTypeHints.length} 个Python文件添加类型注解`,
          files: noTypeHints.map(f => f.relativePath)
        });
      }
    }

    return recommendations;
  }

  // 辅助统计方法
  _groupByCategory(fileResults) {
    const groups = {};
    fileResults.forEach(file => {
      const category = file.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(file.relativePath);
    });
    return groups;
  }

  _calculateComplexityDistribution(fileResults) {
    const distribution = { low: 0, medium: 0, high: 0 };
    fileResults.forEach(file => {
      if (file.analysis.complexity?.rating) {
        distribution[file.analysis.complexity.rating]++;
      }
    });
    return distribution;
  }

  _calculateCodeMetrics(fileResults) {
    const metrics = {
      totalLines: 0,
      totalFunctions: 0,
      totalClasses: 0,
      avgComplexity: 0
    };
    
    let complexitySum = 0;
    let validFiles = 0;
    
    fileResults.forEach(file => {
      if (file.content) {
        metrics.totalLines += file.content.lines;
      }
      if (file.analysis.functions) {
        metrics.totalFunctions += file.analysis.functions.length;
      }
      if (file.analysis.classes) {
        metrics.totalClasses += file.analysis.classes.length;
      }
      if (file.analysis.complexity?.cyclomaticComplexity) {
        complexitySum += file.analysis.complexity.cyclomaticComplexity;
        validFiles++;
      }
    });
    
    metrics.avgComplexity = validFiles > 0 ? complexitySum / validFiles : 0;
    
    return metrics;
  }

  _calculateQualityIndicators(fileResults) {
    const indicators = {
      documentationCoverage: 0,
      testCoverage: 0,
      codeQualityScore: 0
    };
    
    const sourceFiles = fileResults.filter(f => f.analysis.type === 'source');
    const testFiles = fileResults.filter(f => f.analysis.type === 'test');
    const documentedFiles = fileResults.filter(f => f.analysis.comments?.ratio > 0.1);
    
    if (sourceFiles.length > 0) {
      indicators.documentationCoverage = documentedFiles.length / sourceFiles.length;
      indicators.testCoverage = testFiles.length / sourceFiles.length;
    }
    
    // 代码质量评分（简化）
    const qualityScores = fileResults.map(f => f.analysis.codeQuality?.readabilityScore || 0);
    indicators.codeQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;
    
    return indicators;
  }
}