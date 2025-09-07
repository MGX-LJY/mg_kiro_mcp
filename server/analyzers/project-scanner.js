/**
 * 项目结构分析器 - 第1步工作流核心
 * 深度扫描项目文件结构、配置文件、README等关键信息
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 项目结构扫描器
 */
export class ProjectScanner {
  constructor(options = {}) {
    this.options = {
      maxDepth: options.maxDepth || 4,
      ignorePatterns: options.ignorePatterns || [
        'node_modules', '.git', '.vscode', '.idea', 
        'dist', 'build', 'target', '__pycache__', 
        '.pytest_cache', 'coverage', '.nyc_output'
      ],
      maxFiles: options.maxFiles || 1000,
      enableCaching: options.enableCaching !== false,
      ...options
    };
    
    this.scanCache = new Map();
    this.scanResults = {};
  }

  /**
   * 扫描项目 - 第1步工作流主入口
   * @param {string} projectPath - 项目根路径
   * @returns {Object} 扫描结果
   */
  async scanProject(projectPath) {
    if (!await this.validateProjectPath(projectPath)) {
      throw new Error(`无效的项目路径: ${projectPath}`);
    }

    const scanId = this.generateScanId(projectPath);
    
    // 检查缓存
    if (this.options.enableCaching && this.scanCache.has(scanId)) {
      console.log(`[ProjectScanner] 使用缓存结果: ${scanId}`);
      return this.scanCache.get(scanId);
    }

    console.log(`[ProjectScanner] 开始扫描项目: ${projectPath}`);
    const startTime = Date.now();

    try {
      // 并行执行多个扫描任务
      const [
        directoryStructure,
        readmeContent,
        configFiles,
        packageInfo,
        devToolsConfig,
        projectStats
      ] = await Promise.all([
        this.scanDirectoryStructure(projectPath),
        this.scanReadmeFiles(projectPath),
        this.scanConfigFiles(projectPath),
        this.analyzePackageInfo(projectPath),
        this.scanDevToolsConfig(projectPath),
        this.calculateProjectStats(projectPath)
      ]);

      // 综合分析
      const analysis = this.performComprehensiveAnalysis({
        directoryStructure,
        readmeContent,
        configFiles,
        packageInfo,
        devToolsConfig,
        projectStats
      });

      const result = {
        scanId,
        timestamp: new Date().toISOString(),
        projectPath,
        scanDuration: Date.now() - startTime,
        
        // 核心扫描结果
        structure: directoryStructure,
        readme: readmeContent,
        configs: configFiles,
        package: packageInfo,
        devTools: devToolsConfig,
        stats: projectStats,
        analysis,
        
        // 工作流上下文
        workflowContext: {
          complexity: analysis.complexity,
          scale: analysis.scale,
          maturity: analysis.maturity,
          techStackHints: analysis.techStackHints,
          nextStepRecommendations: this.getNextStepRecommendations(analysis)
        }
      };

      // 缓存结果
      if (this.options.enableCaching) {
        this.scanCache.set(scanId, result);
      }

      console.log(`[ProjectScanner] 扫描完成 (${Date.now() - startTime}ms): ${projectPath}`);
      return result;

    } catch (error) {
      console.error(`[ProjectScanner] 扫描失败: ${projectPath}`, error);
      throw new Error(`项目扫描失败: ${error.message}`);
    }
  }

  /**
   * 扫描目录结构
   * @param {string} projectPath - 项目路径
   * @returns {Object} 目录结构信息
   */
  async scanDirectoryStructure(projectPath, currentDepth = 0) {
    if (currentDepth > this.options.maxDepth) {
      return null;
    }

    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    const structure = {
      path: projectPath,
      name: path.basename(projectPath),
      depth: currentDepth,
      directories: [],
      files: [],
      totalFiles: 0,
      totalDirectories: 0
    };

    const tasks = [];
    
    for (const entry of entries) {
      // 跳过忽略的文件和目录
      if (this.shouldIgnore(entry.name)) {
        continue;
      }

      const fullPath = path.join(projectPath, entry.name);

      if (entry.isDirectory()) {
        structure.directories.push(entry.name);
        structure.totalDirectories++;
        
        // 递归扫描子目录
        if (currentDepth < this.options.maxDepth) {
          tasks.push(
            this.scanDirectoryStructure(fullPath, currentDepth + 1)
              .then(subStructure => ({ name: entry.name, structure: subStructure }))
          );
        }
      } else if (entry.isFile()) {
        const fileInfo = {
          name: entry.name,
          extension: path.extname(entry.name),
          type: this.classifyFileType(entry.name),
          path: fullPath
        };
        
        structure.files.push(fileInfo);
        structure.totalFiles++;
      }
    }

    // 等待所有子目录扫描完成
    if (tasks.length > 0) {
      const subResults = await Promise.all(tasks);
      structure.subdirectories = {};
      
      for (const { name, structure: subStructure } of subResults) {
        if (subStructure) {
          structure.subdirectories[name] = subStructure;
          structure.totalFiles += subStructure.totalFiles;
          structure.totalDirectories += subStructure.totalDirectories;
        }
      }
    }

    return structure;
  }

  /**
   * 扫描README文件
   * @param {string} projectPath - 项目路径
   * @returns {Object} README内容分析
   */
  async scanReadmeFiles(projectPath) {
    const readmeFiles = ['README.md', 'README.rst', 'README.txt', 'README'];
    const results = {
      found: false,
      files: [],
      content: null,
      analysis: null
    };

    for (const fileName of readmeFiles) {
      const filePath = path.join(projectPath, fileName);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        results.found = true;
        results.files.push(fileName);
        
        if (!results.content) { // 使用第一个找到的README
          results.content = content;
          results.analysis = this.analyzeReadmeContent(content);
        }
      } catch (error) {
        // 文件不存在，继续寻找其他README文件
        continue;
      }
    }

    return results;
  }

  /**
   * 分析README内容
   * @param {string} content - README内容
   * @returns {Object} 分析结果
   */
  analyzeReadmeContent(content) {
    if (!content) return null;

    const analysis = {
      length: content.length,
      sections: [],
      features: [],
      techStack: [],
      installation: null,
      usage: null,
      hasLicense: false,
      hasContributing: false
    };

    // 提取标题和章节
    const sectionRegex = /^#{1,6}\s+(.+)$/gm;
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      analysis.sections.push(match[1].trim());
    }

    // 检测技术栈关键词
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C#',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring', 'Docker', 'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL'
    ];
    
    for (const keyword of techKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        analysis.techStack.push(keyword);
      }
    }

    // 检测特殊章节
    if (/install|installation|setup/i.test(content)) {
      const installMatch = content.match(/#+\s*(install|installation|setup)[\s\S]*?(?=#+|$)/i);
      if (installMatch) {
        analysis.installation = installMatch[0].slice(0, 500); // 限制长度
      }
    }

    if (/usage|example|getting started/i.test(content)) {
      const usageMatch = content.match(/#+\s*(usage|example|getting started)[\s\S]*?(?=#+|$)/i);
      if (usageMatch) {
        analysis.usage = usageMatch[0].slice(0, 500);
      }
    }

    analysis.hasLicense = /license/i.test(content);
    analysis.hasContributing = /contribut/i.test(content);

    return analysis;
  }

  /**
   * 扫描配置文件
   * @param {string} projectPath - 项目路径
   * @returns {Object} 配置文件信息
   */
  async scanConfigFiles(projectPath) {
    const configPatterns = {
      // JavaScript/Node.js
      javascript: ['package.json', 'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'tsconfig.json'],
      
      // Python
      python: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile', 'environment.yml'],
      
      // Java
      java: ['pom.xml', 'build.gradle', 'settings.gradle', 'gradle.properties'],
      
      // Go
      go: ['go.mod', 'go.sum'],
      
      // Rust  
      rust: ['Cargo.toml', 'Cargo.lock'],
      
      // C#/.NET
      csharp: ['*.csproj', '*.sln', 'Directory.Build.props', 'global.json'],
      
      // 通用配置
      general: ['.env', '.env.example', 'config.json', 'config.yml', 'config.yaml']
    };

    const results = {
      byLanguage: {},
      general: [],
      detected: []
    };

    // 扫描各语言配置文件
    for (const [language, patterns] of Object.entries(configPatterns)) {
      const languageConfigs = [];
      
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // 处理通配符模式
          try {
            const entries = await fs.readdir(projectPath);
            const matching = entries.filter(entry => {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(entry);
            });
            
            for (const match of matching) {
              const filePath = path.join(projectPath, match);
              languageConfigs.push(await this.analyzeConfigFile(filePath, language));
            }
          } catch (error) {
            // 目录不存在或无法访问
            continue;
          }
        } else {
          // 直接文件名
          const filePath = path.join(projectPath, pattern);
          try {
            await fs.access(filePath);
            languageConfigs.push(await this.analyzeConfigFile(filePath, language));
          } catch (error) {
            // 文件不存在，继续
            continue;
          }
        }
      }
      
      if (languageConfigs.length > 0) {
        results.byLanguage[language] = languageConfigs;
        results.detected.push(language);
      }
    }

    return results;
  }

  /**
   * 分析单个配置文件
   * @param {string} filePath - 配置文件路径
   * @param {string} language - 语言类型
   * @returns {Object} 配置文件分析结果
   */
  async analyzeConfigFile(filePath, language) {
    const fileName = path.basename(filePath);
    const analysis = {
      file: fileName,
      path: filePath,
      language,
      type: this.getConfigFileType(fileName),
      exists: true,
      content: null,
      parsed: null,
      analysis: {}
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      analysis.content = content;
      
      // 根据文件类型解析
      if (fileName === 'package.json') {
        analysis.parsed = JSON.parse(content);
        analysis.analysis = this.analyzePackageJson(analysis.parsed);
      } else if (fileName.endsWith('.json')) {
        try {
          analysis.parsed = JSON.parse(content);
        } catch (e) {
          analysis.analysis.parseError = e.message;
        }
      } else if (fileName.endsWith('.toml')) {
        // 简单的TOML分析（不完整解析）
        analysis.analysis.sections = this.extractTomlSections(content);
      }
      
    } catch (error) {
      analysis.exists = false;
      analysis.error = error.message;
    }

    return analysis;
  }

  /**
   * 分析package.json详细信息
   * @param {Object} packageJson - package.json内容
   * @returns {Object} 分析结果
   */
  analyzePackageJson(packageJson) {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      scripts: Object.keys(packageJson.scripts || {}),
      dependencyCount: Object.keys(packageJson.dependencies || {}).length,
      devDependencyCount: Object.keys(packageJson.devDependencies || {}).length,
      hasTypeScript: !!(packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript),
      frameworks: this.detectFrameworks(packageJson)
    };
  }

  /**
   * 检测框架
   * @param {Object} packageJson - package.json内容
   * @returns {Array} 检测到的框架
   */
  detectFrameworks(packageJson) {
    const frameworks = [];
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    const frameworkPatterns = {
      'React': /^react$/,
      'Vue.js': /^vue$/,
      'Angular': /^@angular\//,
      'Express': /^express$/,
      'Next.js': /^next$/,
      'Nuxt.js': /^nuxt$/,
      'Svelte': /^svelte$/,
      'Electron': /^electron$/
    };

    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
      if (Object.keys(allDeps).some(dep => pattern.test(dep))) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  /**
   * 分析包信息
   * @param {string} projectPath - 项目路径
   * @returns {Object} 包信息分析
   */
  async analyzePackageInfo(projectPath) {
    // package.json已在scanConfigFiles中分析，这里可以做更深入的依赖分析
    return {
      analyzed: true,
      note: 'Package analysis performed in scanConfigFiles'
    };
  }

  /**
   * 扫描开发工具配置
   * @param {string} projectPath - 项目路径
   * @returns {Object} 开发工具配置
   */
  async scanDevToolsConfig(projectPath) {
    const devFiles = [
      '.gitignore', '.gitattributes',
      '.env', '.env.example', '.env.local',
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'Makefile',
      '.eslintrc.js', '.eslintrc.json', '.prettierrc',
      'jest.config.js', 'cypress.json',
      '.github/workflows'
    ];

    const results = {
      versionControl: [],
      containerization: [],
      buildTools: [],
      linting: [],
      testing: [],
      ci: []
    };

    for (const file of devFiles) {
      const filePath = path.join(projectPath, file);
      try {
        const stats = await fs.stat(filePath);
        
        if (file.startsWith('.git')) {
          results.versionControl.push(file);
        } else if (file.includes('docker') || file === 'Dockerfile') {
          results.containerization.push(file);
        } else if (file === 'Makefile') {
          results.buildTools.push(file);
        } else if (file.includes('eslint') || file.includes('prettier')) {
          results.linting.push(file);
        } else if (file.includes('jest') || file.includes('cypress')) {
          results.testing.push(file);
        } else if (file.includes('workflows')) {
          results.ci.push(file);
        }
      } catch (error) {
        // 文件不存在，继续
        continue;
      }
    }

    return results;
  }

  /**
   * 计算项目统计信息
   * @param {string} projectPath - 项目路径
   * @returns {Object} 项目统计
   */
  async calculateProjectStats(projectPath) {
    // 这里可以实现更复杂的统计算法
    return {
      calculatedAt: new Date().toISOString(),
      note: 'Detailed stats calculation to be implemented'
    };
  }

  /**
   * 综合分析
   * @param {Object} scanData - 所有扫描数据
   * @returns {Object} 综合分析结果
   */
  performComprehensiveAnalysis(scanData) {
    const analysis = {
      complexity: this.calculateComplexity(scanData),
      scale: this.calculateScale(scanData),
      maturity: this.calculateMaturity(scanData),
      techStackHints: this.extractTechStackHints(scanData),
      projectType: this.inferProjectType(scanData),
      developmentStage: this.inferDevelopmentStage(scanData)
    };

    return analysis;
  }

  /**
   * 计算复杂度
   * @param {Object} scanData - 扫描数据
   * @returns {string} 复杂度等级
   */
  calculateComplexity(scanData) {
    let score = 0;
    
    // 基于文件数量
    const totalFiles = scanData.structure?.totalFiles || 0;
    if (totalFiles > 100) score += 3;
    else if (totalFiles > 50) score += 2;
    else if (totalFiles > 20) score += 1;
    
    // 基于目录深度
    const maxDepth = this.getMaxDepth(scanData.structure);
    if (maxDepth > 5) score += 2;
    else if (maxDepth > 3) score += 1;
    
    // 基于依赖数量
    const depCount = scanData.configs?.byLanguage?.javascript?.[0]?.analysis?.dependencyCount || 0;
    if (depCount > 50) score += 2;
    else if (depCount > 20) score += 1;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * 计算项目规模
   * @param {Object} scanData - 扫描数据
   * @returns {string} 规模等级
   */
  calculateScale(scanData) {
    const totalFiles = scanData.structure?.totalFiles || 0;
    if (totalFiles > 200) return 'large';
    if (totalFiles > 50) return 'medium';
    return 'small';
  }

  /**
   * 计算成熟度
   * @param {Object} scanData - 扫描数据
   * @returns {string} 成熟度等级
   */
  calculateMaturity(scanData) {
    let score = 0;
    
    // 有README
    if (scanData.readme?.found) score += 1;
    
    // 有版本控制
    if (scanData.devTools?.versionControl?.length > 0) score += 1;
    
    // 有测试配置
    if (scanData.devTools?.testing?.length > 0) score += 1;
    
    // 有CI/CD
    if (scanData.devTools?.ci?.length > 0) score += 1;
    
    // 有linting工具
    if (scanData.devTools?.linting?.length > 0) score += 1;

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * 提取技术栈提示
   * @param {Object} scanData - 扫描数据
   * @returns {Array} 技术栈提示
   */
  extractTechStackHints(scanData) {
    const hints = [];
    
    // 从配置文件检测到的语言
    if (scanData.configs?.detected) {
      hints.push(...scanData.configs.detected);
    }
    
    // 从README检测到的技术栈
    if (scanData.readme?.analysis?.techStack) {
      hints.push(...scanData.readme.analysis.techStack);
    }
    
    // 从package.json检测到的框架
    console.log('[ProjectScanner] 调试scanData结构:', Object.keys(scanData));
    console.log('[ProjectScanner] 调试configFiles:', JSON.stringify(scanData.configFiles?.byLanguage?.javascript?.[0]?.analysis, null, 2));
    
    const packageAnalysis = scanData.configFiles?.byLanguage?.javascript?.[0]?.analysis;
    if (packageAnalysis?.frameworks) {
      console.log('[ProjectScanner] 提取框架:', packageAnalysis.frameworks);
      hints.push(...packageAnalysis.frameworks);
    }
    
    // 从依赖分析中提取更多技术栈信息
    if (packageAnalysis?.dependencies) {
      const deps = packageAnalysis.dependencies;
      
      // Web框架检测
      if (deps.includes('express')) hints.push('Express');
      if (deps.includes('koa')) hints.push('Koa');
      if (deps.includes('fastify')) hints.push('Fastify');
      
      // 前端框架检测
      if (deps.includes('react')) hints.push('React');
      if (deps.includes('vue')) hints.push('Vue.js');
      if (deps.includes('@angular/core')) hints.push('Angular');
      if (deps.includes('next')) hints.push('Next.js');
      
      // 数据库检测
      if (deps.includes('mongoose') || deps.includes('mongodb')) hints.push('MongoDB');
      if (deps.includes('mysql2') || deps.includes('mysql')) hints.push('MySQL');
      if (deps.includes('pg')) hints.push('PostgreSQL');
      
      // 工具链检测
      if (deps.includes('webpack')) hints.push('Webpack');
      if (deps.includes('vite')) hints.push('Vite');
      if (deps.includes('typescript')) hints.push('TypeScript');
    }

    const uniqueHints = [...new Set(hints)];
    console.log('[ProjectScanner] 最终技术栈提示:', uniqueHints);
    return uniqueHints;
  }

  /**
   * 推断项目类型
   * @param {Object} scanData - 扫描数据
   * @returns {string} 项目类型
   */
  inferProjectType(scanData) {
    const hints = this.extractTechStackHints(scanData);
    
    if (hints.includes('React') || hints.includes('Vue.js') || hints.includes('Angular')) {
      return 'frontend';
    }
    if (hints.includes('Express') || hints.includes('Django') || hints.includes('Spring')) {
      return 'backend';
    }
    if (hints.includes('Next.js') || hints.includes('Nuxt.js')) {
      return 'fullstack';
    }
    if (hints.includes('Electron')) {
      return 'desktop';
    }
    
    return 'library';
  }

  /**
   * 推断开发阶段
   * @param {Object} scanData - 扫描数据
   * @returns {string} 开发阶段
   */
  inferDevelopmentStage(scanData) {
    const packageAnalysis = scanData.configs?.byLanguage?.javascript?.[0]?.analysis;
    const version = packageAnalysis?.version;
    
    if (version) {
      if (version.startsWith('0.0.')) return 'initial';
      if (version.startsWith('0.')) return 'alpha';
      if (version.includes('beta')) return 'beta';
      if (parseInt(version.split('.')[0]) >= 1) return 'production';
    }
    
    return 'development';
  }

  /**
   * 获取下一步建议
   * @param {Object} analysis - 分析结果
   * @returns {Array} 建议列表
   */
  getNextStepRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.techStackHints.length > 0) {
      recommendations.push({
        step: 2,
        action: 'detect_language',
        reason: `检测到${analysis.techStackHints.length}个技术栈提示`,
        priority: 'high'
      });
    }
    
    if (analysis.complexity === 'high') {
      recommendations.push({
        step: 5,
        action: 'analyze_modules',
        reason: '项目复杂度较高，需要深度模块分析',
        priority: 'high'
      });
    }
    
    if (analysis.maturity === 'low') {
      recommendations.push({
        step: 6,
        action: 'generate_prompts',
        reason: '项目成熟度较低，需要专业提示词指导',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // 工具方法

  generateScanId(projectPath) {
    return `scan_${path.basename(projectPath)}_${Date.now()}`;
  }

  async validateProjectPath(projectPath) {
    try {
      const stats = await fs.stat(projectPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  shouldIgnore(name) {
    return this.options.ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern || name.startsWith(pattern);
    });
  }

  classifyFileType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.ts': 'typescript', 
      '.jsx': 'react',
      '.tsx': 'react-typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cs': 'csharp',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.toml': 'toml',
      '.xml': 'xml'
    };
    
    return typeMap[ext] || 'unknown';
  }

  getConfigFileType(fileName) {
    if (fileName === 'package.json') return 'npm-package';
    if (fileName.includes('lock')) return 'lock-file';
    if (fileName.includes('config')) return 'config';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'yaml';
    if (fileName.endsWith('.toml')) return 'toml';
    if (fileName.endsWith('.xml')) return 'xml';
    return 'unknown';
  }

  extractTomlSections(content) {
    const sections = [];
    const sectionRegex = /^\[([^\]]+)\]/gm;
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push(match[1]);
    }
    return sections;
  }

  getMaxDepth(structure, currentDepth = 0) {
    if (!structure || !structure.subdirectories) {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    for (const subdir of Object.values(structure.subdirectories)) {
      maxDepth = Math.max(maxDepth, this.getMaxDepth(subdir, currentDepth + 1));
    }
    
    return maxDepth;
  }
}

export default ProjectScanner;