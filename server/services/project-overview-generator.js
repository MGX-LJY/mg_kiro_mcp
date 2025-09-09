/**
 * 项目概览生成器 - 新Init流程Step1核心服务
 * 为新的7步Init流程提供基础数据包和架构文档生成
 * 
 * 新流程职责：
 * - Step1: 生成项目基础数据包和架构文档
 * - 为Step2的AI任务列表创建提供结构化上下文
 * - 为后续步骤提供完整的项目理解基础
 * - 集成模版系统进行文档格式化
 * 
 * 设计目标：
 * - 一次性获取项目的"DNA"信息
 * - 生成结构化的架构文档
 * - 为AI任务分解提供充分的上下文信息
 * - 智能选择最重要的信息
 */

import { promises as fs } from 'fs';
import { join, resolve, relative, extname, basename } from 'path';
import LanguageDetector from '../language/detector.js';
import MasterTemplateService from './unified/master-template-service.js';
import TemplateConfigManager from './unified/template-config-manager.js';

export class ProjectOverviewGenerator {
    constructor() {
        this.languageDetector = new LanguageDetector();
        
        // 初始化统一模板服务
        const configManager = new TemplateConfigManager();
        this.templateService = new MasterTemplateService(configManager.getTemplateSystemConfig());
        this.maxKeyFileSize = 50 * 1024; // 50KB，超过则智能截取
        this.keyFilePatterns = [
            // 配置文件
            'package.json', 'composer.json', 'requirements.txt', 'pom.xml', 'build.gradle',
            'Cargo.toml', 'go.mod', 'Gemfile', 'yarn.lock', 'package-lock.json',
            
            // 项目文档
            'README.md', 'README.txt', 'README.rst', 'CHANGELOG.md', 'LICENSE',
            'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md',
            
            // 配置
            '.env.example', '.env.template', 'config.json', 'config.yaml',
            'docker-compose.yml', 'Dockerfile', 'Makefile',
            
            // 语言特定
            'tsconfig.json', 'jsconfig.json', '.eslintrc.js', 'babel.config.js',
            'vite.config.js', 'webpack.config.js', 'rollup.config.js',
            'setup.py', '__init__.py', 'pyproject.toml',
            'main.go', 'mod.go',
            'index.js', 'app.js', 'server.js', 'main.js'
        ];
        
        this.exclusionPatterns = [
            '.git', '.svn', '.hg',
            'node_modules', '__pycache__', '.pytest_cache',
            'venv', 'env', '.venv', '.env',
            'build', 'dist', 'target', 'out',
            '.DS_Store', '.idea', '.vscode',
            '*.log', '*.tmp', '*.cache'
        ];
    }

    /**
     * 生成完整的项目概览包 - 新Init流程Step1
     * 生成基础数据包 + 架构文档 + AI任务上下文
     */
    async generateOverview(projectPath, options = {}) {
        console.log(`[ProjectOverview] 开始生成项目概览: ${projectPath}`);
        
        const startTime = Date.now();
        const projectName = basename(resolve(projectPath));
        
        try {
            // 并行执行所有分析任务
            const [
                projectMetadata,
                languageProfile,
                dependencyAnalysis,
                directoryStructure,
                keyFileContents
            ] = await Promise.all([
                this.collectProjectMetadata(projectPath),
                this.analyzeLanguageProfile(projectPath),
                this.analyzeDependencies(projectPath),
                this.analyzeDirectoryStructure(projectPath, options.maxDepth || 3),
                this.collectKeyFileContents(projectPath)
            ]);

            // 生成项目特征分析
            const projectCharacteristics = this.analyzeProjectCharacteristics({
                languageProfile,
                dependencyAnalysis,
                directoryStructure,
                keyFileContents
            });

            // 生成架构文档
            const architectureDocument = await this.generateArchitectureDocument({
                projectMetadata,
                languageProfile,
                dependencyAnalysis,
                directoryStructure,
                keyFileContents,
                projectCharacteristics
            });
            
            // 生成AI任务上下文
            const aiTaskContext = await this.generateAITaskContext({
                projectMetadata,
                languageProfile,
                directoryStructure,
                projectCharacteristics
            });
            
            const overview = {
                generatedAt: new Date().toISOString(),
                generationTime: `${Date.now() - startTime}ms`,
                
                // 基础数据包
                projectMetadata,
                languageProfile,
                dependencyAnalysis,
                directoryStructure,
                keyFileContents,
                projectCharacteristics,
                
                // 新增：架构文档
                architectureDocument,
                
                // 新增：AI任务上下文
                aiTaskContext,
                
                // AI生成指导信息（增强版）
                aiGenerationGuide: {
                    suggestedDocumentSections: this.suggestDocumentSections(projectCharacteristics),
                    keyFocusAreas: this.identifyKeyFocusAreas(languageProfile, projectCharacteristics),
                    complexityLevel: this.assessComplexity(projectMetadata, directoryStructure, dependencyAnalysis),
                    recommendedApproach: this.recommendDocumentationApproach(projectCharacteristics),
                    
                    // 新增：为Step2提供的具体指导
                    step2Guidance: {
                        suggestedBatchSize: this.calculateOptimalBatchSize(directoryStructure),
                        priorityFiles: this.identifyPriorityFiles(keyFileContents, projectCharacteristics),
                        documentationStrategy: this.recommendDocumentationStrategy(languageProfile, projectCharacteristics),
                        estimatedTaskCount: this.estimateTaskCount(directoryStructure, projectCharacteristics)
                    }
                }
            };

            console.log(`[ProjectOverview] 概览生成完成: ${overview.generationTime}`);
            return overview;

        } catch (error) {
            console.error('[ProjectOverview] 生成失败:', error);
            throw new Error(`项目概览生成失败: ${error.message}`);
        }
    }

    /**
     * 收集项目基础元数据
     */
    async collectProjectMetadata(projectPath) {
        const stats = await fs.stat(projectPath);
        const files = await this.getAllFiles(projectPath);
        
        let totalSize = 0;
        let fileTypes = {};
        
        for (const file of files) {
            try {
                const fileStats = await fs.stat(file);
                totalSize += fileStats.size;
                
                const ext = extname(file).toLowerCase();
                if (ext) {
                    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
                }
            } catch (error) {
                // 忽略无法访问的文件
            }
        }

        return {
            name: basename(resolve(projectPath)),
            path: resolve(projectPath),
            lastModified: stats.mtime.toISOString(),
            createdAt: stats.birthtime.toISOString(),
            totalFiles: files.length,
            totalSize: this.formatSize(totalSize),
            totalSizeBytes: totalSize,
            fileTypeDistribution: Object.entries(fileTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10) // 只保留前10种文件类型
                .reduce((obj, [ext, count]) => ({ ...obj, [ext]: count }), {})
        };
    }

    /**
     * 分析项目语言概况
     */
    async analyzeLanguageProfile(projectPath) {
        console.log('[ProjectOverview] 分析语言概况...');
        
        try {
            const languageResults = await this.languageDetector.detectLanguage(projectPath);
            
            return {
                primary: languageResults.language || 'unknown',
                secondary: languageResults.frameworks || [],
                frameworks: languageResults.frameworks || [],
                techStack: { primary: languageResults.language, frameworks: languageResults.frameworks },
                confidence: languageResults.confidence || 0,
                detectionSources: ['base-detection'],
                languageStats: {},
                ecosystem: languageResults.language || 'unknown'
            };
        } catch (error) {
            console.warn('[ProjectOverview] 语言检测失败, 使用基础检测:', error.message);
            return await this.basicLanguageDetection(projectPath);
        }
    }

    /**
     * 基础语言检测（后备方案）
     */
    async basicLanguageDetection(projectPath) {
        const files = await this.getAllFiles(projectPath, 100); // 只检测前100个文件
        const extensions = {};
        
        for (const file of files) {
            const ext = extname(file).toLowerCase();
            if (ext) {
                extensions[ext] = (extensions[ext] || 0) + 1;
            }
        }

        const extensionLanguageMap = {
            '.js': 'javascript', '.ts': 'typescript', '.jsx': 'javascript', '.tsx': 'typescript',
            '.py': 'python', '.java': 'java', '.go': 'go', '.rs': 'rust',
            '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp', '.php': 'php',
            '.rb': 'ruby', '.swift': 'swift', '.kt': 'kotlin', '.scala': 'scala'
        };

        const detectedLanguages = Object.entries(extensions)
            .map(([ext, count]) => ({ 
                language: extensionLanguageMap[ext] || ext.slice(1), 
                count, 
                ext 
            }))
            .filter(item => item.language !== item.ext.slice(1)) // 过滤未知扩展名
            .sort((a, b) => b.count - a.count);

        return {
            primary: detectedLanguages[0]?.language || 'unknown',
            secondary: detectedLanguages.slice(1, 4).map(item => item.language),
            frameworks: [],
            techStack: {},
            confidence: detectedLanguages.length > 0 ? 0.7 : 0.1,
            detectionSources: ['file_extensions'],
            languageStats: extensions,
            ecosystem: detectedLanguages[0]?.language || 'unknown'
        };
    }

    /**
     * 分析项目依赖
     */
    async analyzeDependencies(projectPath) {
        console.log('[ProjectOverview] 分析项目依赖...');
        
        const dependencyFiles = [
            { file: 'package.json', type: 'npm', parser: this.parsePackageJson },
            { file: 'requirements.txt', type: 'pip', parser: this.parseRequirementsTxt },
            { file: 'pom.xml', type: 'maven', parser: this.parsePomXml },
            { file: 'Cargo.toml', type: 'cargo', parser: this.parseCargoToml },
            { file: 'go.mod', type: 'go', parser: this.parseGoMod },
            { file: 'composer.json', type: 'composer', parser: this.parseComposerJson }
        ];

        const results = {};
        let totalDependencies = 0;

        for (const { file, type, parser } of dependencyFiles) {
            const filePath = join(projectPath, file);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const parsed = await parser.call(this, content);
                
                if (parsed && (parsed.production || parsed.development)) {
                    results[type] = parsed;
                    totalDependencies += Object.keys(parsed.production || {}).length;
                    totalDependencies += Object.keys(parsed.development || {}).length;
                }
            } catch (error) {
                // 文件不存在或解析失败，跳过
            }
        }

        return {
            systems: Object.keys(results),
            details: results,
            totalDependencies,
            hasLockFile: await this.checkLockFiles(projectPath),
            securityAnalysis: await this.basicSecurityCheck(results),
            summary: this.generateDependencySummary(results)
        };
    }

    /**
     * 解析package.json
     */
    parsePackageJson(content) {
        try {
            const pkg = JSON.parse(content);
            return {
                production: pkg.dependencies || {},
                development: pkg.devDependencies || {},
                peer: pkg.peerDependencies || {},
                scripts: pkg.scripts || {},
                engines: pkg.engines || {},
                projectInfo: {
                    name: pkg.name,
                    version: pkg.version,
                    description: pkg.description,
                    author: pkg.author,
                    license: pkg.license
                }
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * 解析requirements.txt
     */
    parseRequirementsTxt(content) {
        const lines = content.split('\n').filter(line => 
            line.trim() && !line.trim().startsWith('#')
        );
        
        const dependencies = {};
        lines.forEach(line => {
            const match = line.trim().match(/^([a-zA-Z0-9_-]+)[>=<]=?(.*)$/);
            if (match) {
                dependencies[match[1]] = match[2] || '*';
            }
        });

        return {
            production: dependencies,
            development: {},
            total: Object.keys(dependencies).length
        };
    }

    /**
     * 分析目录结构（智能深度限制）
     */
    async analyzeDirectoryStructure(projectPath, maxDepth = 3) {
        console.log('[ProjectOverview] 分析目录结构...');
        
        const structure = await this.buildDirectoryTree(projectPath, maxDepth);
        const analysis = this.analyzeStructurePatterns(structure);
        
        return {
            maxDepth,
            totalDirectories: analysis.totalDirectories,
            totalFiles: analysis.totalFiles,
            importantPaths: analysis.importantPaths,
            projectType: analysis.projectType,
            architecturePattern: analysis.architecturePattern,
            structure: this.simplifyStructureForAI(structure),
            keyFindings: analysis.keyFindings
        };
    }

    /**
     * 构建目录树
     */
    async buildDirectoryTree(dirPath, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return { name: basename(dirPath), type: 'directory', truncated: true };
        }

        try {
            const items = await fs.readdir(dirPath);
            const children = [];

            for (const item of items) {
                // 跳过排除的文件/目录
                if (this.exclusionPatterns.some(pattern => 
                    item.includes(pattern.replace('*', ''))
                )) {
                    continue;
                }

                const itemPath = join(dirPath, item);
                try {
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory()) {
                        const subTree = await this.buildDirectoryTree(itemPath, maxDepth, currentDepth + 1);
                        children.push(subTree);
                    } else if (stats.isFile()) {
                        children.push({
                            name: item,
                            type: 'file',
                            size: stats.size,
                            ext: extname(item)
                        });
                    }
                } catch (error) {
                    // 跳过无法访问的文件
                }
            }

            return {
                name: basename(dirPath),
                type: 'directory',
                children: children.slice(0, 50) // 限制每个目录最多50个子项
            };
        } catch (error) {
            return { name: basename(dirPath), type: 'directory', error: true };
        }
    }

    /**
     * 收集关键文件内容
     */
    async collectKeyFileContents(projectPath) {
        console.log('[ProjectOverview] 收集关键文件内容...');
        
        const keyFiles = {};
        const foundFiles = [];

        // 查找所有匹配的关键文件
        for (const pattern of this.keyFilePatterns) {
            const filePath = join(projectPath, pattern);
            try {
                await fs.access(filePath);
                foundFiles.push({ pattern, path: filePath });
            } catch (error) {
                // 文件不存在，跳过
            }
        }

        // 限制最多处理20个关键文件，避免数据包过大
        for (const { pattern, path } of foundFiles.slice(0, 20)) {
            try {
                const stats = await fs.stat(path);
                let content = await fs.readFile(path, 'utf8');
                
                // 如果文件过大，进行智能截取
                if (stats.size > this.maxKeyFileSize) {
                    content = await this.intelligentContentTrim(content, pattern);
                }

                keyFiles[pattern] = {
                    content,
                    size: stats.size,
                    isTrimmed: stats.size > this.maxKeyFileSize,
                    lastModified: stats.mtime.toISOString(),
                    importance: this.calculateFileImportance(pattern),
                    type: this.detectFileType(pattern)
                };

            } catch (error) {
                console.warn(`[ProjectOverview] 无法读取文件 ${pattern}:`, error.message);
            }
        }

        return keyFiles;
    }

    /**
     * 智能内容截取
     */
    async intelligentContentTrim(content, fileName) {
        const maxLines = 200;
        const lines = content.split('\n');
        
        if (lines.length <= maxLines) {
            return content;
        }

        // 根据文件类型采用不同的截取策略
        if (fileName.endsWith('.json')) {
            return this.trimJsonContent(content);
        } else if (fileName.endsWith('.md')) {
            return this.trimMarkdownContent(lines, maxLines);
        } else if (fileName.includes('README')) {
            return this.trimReadmeContent(lines, maxLines);
        }

        // 默认策略：前50%行 + 后20%行
        const frontLines = Math.floor(maxLines * 0.7);
        const backLines = Math.floor(maxLines * 0.3);
        
        return [
            ...lines.slice(0, frontLines),
            '\n... [内容已截断] ...\n',
            ...lines.slice(-backLines)
        ].join('\n');
    }

    /**
     * JSON内容智能截取
     */
    trimJsonContent(content) {
        try {
            const obj = JSON.parse(content);
            
            // 保留重要字段的完整信息
            const importantFields = [
                'name', 'version', 'description', 'author', 'license',
                'scripts', 'dependencies', 'devDependencies', 'engines',
                'main', 'module', 'types', 'exports'
            ];

            const trimmed = {};
            for (const field of importantFields) {
                if (obj[field] !== undefined) {
                    trimmed[field] = obj[field];
                }
            }

            return JSON.stringify(trimmed, null, 2);
        } catch (error) {
            // JSON解析失败，使用通用截取
            return content.substring(0, this.maxKeyFileSize);
        }
    }

    /**
     * 工具方法集合
     */
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        
        return `${Math.round(size * 100) / 100} ${units[unit]}`;
    }

    async getAllFiles(dirPath, limit = Infinity) {
        const files = [];
        
        async function traverse(currentPath, depth = 0) {
            if (files.length >= limit || depth > 5) return;
            
            try {
                const items = await fs.readdir(currentPath);
                
                for (const item of items) {
                    if (files.length >= limit) break;
                    
                    const itemPath = join(currentPath, item);
                    
                    // 跳过排除的路径
                    if (this.exclusionPatterns.some(pattern => 
                        item.includes(pattern.replace('*', ''))
                    )) {
                        continue;
                    }

                    try {
                        const stats = await fs.stat(itemPath);
                        if (stats.isFile()) {
                            files.push(itemPath);
                        } else if (stats.isDirectory()) {
                            await traverse(itemPath, depth + 1);
                        }
                    } catch (error) {
                        // 跳过无法访问的文件
                    }
                }
            } catch (error) {
                // 跳过无法访问的目录
            }
        }

        await traverse.call(this, dirPath);
        return files;
    }

    /**
     * 生成架构文档 - 新流程Step1核心输出
     */
    async generateArchitectureDocument(data) {
        console.log('[ProjectOverview] 生成架构文档...');
        
        try {
            // 应用架构文档模版
            const templateResult = await this.templateService.getTemplate({
                category: 'templates',
                name: 'architecture/system-architecture-generation'
            });
            
            const architectureDoc = {
                title: `${data.projectMetadata.name} - 系统架构文档`,
                generatedAt: new Date().toISOString(),
                version: '1.0-auto',
                
                // 项目概述
                overview: {
                    name: data.projectMetadata.name,
                    primaryLanguage: data.languageProfile.primary,
                    architecture: data.projectCharacteristics.architecture,
                    complexity: data.projectCharacteristics.complexity,
                    totalFiles: data.projectMetadata.totalFiles
                },
                
                // 技术栈
                techStack: {
                    primary: data.languageProfile.primary,
                    frameworks: data.languageProfile.frameworks,
                    dependencies: Object.keys(data.dependencyAnalysis.details).length,
                    ecosystem: data.languageProfile.ecosystem
                },
                
                // 目录结构概述
                structure: {
                    type: data.directoryStructure.projectType,
                    pattern: data.directoryStructure.architecturePattern,
                    importantPaths: data.directoryStructure.importantPaths,
                    totalDirectories: data.directoryStructure.totalDirectories
                },
                
                // 核心模块识别
                coreModules: this.identifyCoreModules(data.keyFileContents, data.directoryStructure),
                
                // 架构特征
                characteristics: {
                    designPatterns: this.identifyDesignPatterns(data),
                    scalabilityLevel: this.assessScalability(data),
                    maintainabilityScore: this.calculateMaintainability(data),
                    testability: this.assessTestability(data)
                },
                
                // 建议改进
                recommendations: this.generateArchitectureRecommendations(data)
            };
            
            console.log('[ProjectOverview] 架构文档生成完成');
            return architectureDoc;
            
        } catch (error) {
            console.warn('[ProjectOverview] 架构文档生成失败:', error.message);
            return this.generateFallbackArchitectureDoc(data);
        }
    }
    
    /**
     * 生成AI任务上下文 - 为Step2提供结构化信息
     */
    async generateAITaskContext(data) {
        console.log('[ProjectOverview] 生成AI任务上下文...');
        
        const context = {
            generatedAt: new Date().toISOString(),
            projectName: data.projectMetadata.name,
            
            // 文件处理指导
            fileProcessingGuide: {
                totalFilesToProcess: this.countProcessableFiles(data.directoryStructure),
                recommendedBatchSize: this.calculateOptimalBatchSize(data.directoryStructure),
                priorityLevels: this.definePriorityLevels(data),
                processingStrategy: this.recommendProcessingStrategy(data.languageProfile, data.projectCharacteristics)
            },
            
            // 模块分类指导
            moduleClassification: {
                expectedModules: this.predictModuleTypes(data.directoryStructure, data.languageProfile),
                coreModules: this.identifyCoreModules(data.keyFileContents, data.directoryStructure),
                supportingModules: this.identifySupportingModules(data.directoryStructure)
            },
            
            // 文档生成策略
            documentationStrategy: {
                approach: this.recommendDocumentationStrategy(data.languageProfile, data.projectCharacteristics),
                templates: this.recommendTemplates(data.languageProfile),
                qualityStandards: this.defineQualityStandards(data.projectCharacteristics)
            },
            
            // AI协作指导
            aiCollaborationGuide: {
                contextSize: this.calculateContextRequirements(data),
                specialInstructions: this.generateSpecialInstructions(data),
                qualityChecks: this.defineQualityChecks(data.languageProfile),
                progressMilestones: this.defineMilestones(data)
            }
        };
        
        console.log('[ProjectOverview] AI任务上下文生成完成');
        return context;
    }
    
    /**
     * 新增辅助方法 - Step1增强功能
     */
    
    identifyCoreModules(keyFiles, structure) {
        const coreModules = [];
        
        if (!keyFiles || typeof keyFiles !== 'object') {
            return coreModules;
        }
        
        // 识别入口模块
        const entryFiles = Object.keys(keyFiles).filter(file => 
            ['index.js', 'main.js', 'app.js', 'server.js'].includes(file)
        );
        if (entryFiles.length > 0) {
            coreModules.push({
                name: 'Application Entry',
                files: entryFiles,
                importance: 100,
                description: '应用程序入口点'
            });
        }
        
        // 识别配置模块
        const configFiles = Object.keys(keyFiles).filter(file => 
            file.includes('config') || file.includes('env') || ['package.json'].includes(file)
        );
        if (configFiles.length > 0) {
            coreModules.push({
                name: 'Configuration',
                files: configFiles,
                importance: 90,
                description: '系统配置和环境设置'
            });
        }
        
        return coreModules;
    }
    
    calculateOptimalBatchSize(structure) {
        const totalFiles = structure.totalFiles || 0;
        if (totalFiles <= 20) return 3;
        if (totalFiles <= 50) return 5;
        if (totalFiles <= 100) return 7;
        return 10;
    }
    
    identifyPriorityFiles(keyFiles, characteristics) {
        return Object.entries(keyFiles)
            .map(([fileName, fileData]) => ({
                fileName,
                priority: fileData.importance || this.calculateFileImportance(fileName),
                reason: this.getPriorityReason(fileName, fileData)
            }))
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }
    
    recommendDocumentationStrategy(languageProfile, characteristics) {
        const strategies = {
            javascript: '重点关注模块导入导出、异步处理和API设计',
            typescript: '强调类型定义、接口设计和模块边界',
            python: '注重类结构、函数签名和包组织',
            java: '突出类继承、接口实现和包结构',
            go: '重点记录包接口、并发模式和错误处理'
        };
        
        return strategies[languageProfile.primary] || '通用文档生成策略';
    }
    
    estimateTaskCount(structure, characteristics) {
        const base = structure.totalFiles || 0;
        const multiplier = characteristics.complexity === 'high' ? 1.3 : 
                          characteristics.complexity === 'low' ? 0.8 : 1.0;
        return Math.ceil(base * multiplier) + 5; // +5 for analysis and summary tasks
    }
    
    countProcessableFiles(structure) {
        return structure.totalFiles || 0;
    }
    
    definePriorityLevels(data) {
        return {
            critical: ['entry points', 'main configurations'],
            high: ['core business logic', 'API definitions'],
            medium: ['utilities', 'helpers', 'components'],
            low: ['tests', 'documentation', 'assets']
        };
    }
    
    recommendProcessingStrategy(language, characteristics) {
        if (characteristics.complexity === 'high') {
            return 'sequential-with-context';
        } else if (characteristics.complexity === 'low') {
            return 'batch-parallel';
        }
        return 'adaptive-batch';
    }
    
    predictModuleTypes(structure, language) {
        const moduleTypes = ['core', 'config', 'routes', 'controllers', 'services', 'models', 'utils'];
        
        // 基于语言调整模块类型预测
        if (language.primary === 'javascript' || language.primary === 'typescript') {
            moduleTypes.push('components', 'hooks', 'middleware');
        } else if (language.primary === 'python') {
            moduleTypes.push('views', 'serializers', 'managers');
        } else if (language.primary === 'java') {
            moduleTypes.push('repositories', 'entities', 'dto');
        }
        
        return moduleTypes;
    }
    
    identifySupportingModules(structure) {
        return [
            { name: 'tests', pattern: 'test|spec', importance: 30 },
            { name: 'docs', pattern: 'doc|readme', importance: 20 },
            { name: 'build', pattern: 'build|dist|webpack', importance: 15 }
        ];
    }
    
    recommendTemplates(language) {
        const languageTemplates = {
            javascript: ['module-documentation', 'api-documentation', 'component-documentation'],
            typescript: ['interface-documentation', 'class-documentation', 'module-documentation'],
            python: ['class-documentation', 'function-documentation', 'package-documentation'],
            java: ['class-documentation', 'interface-documentation', 'package-documentation']
        };
        
        return languageTemplates[language.primary] || ['general-documentation'];
    }
    
    defineQualityStandards(characteristics) {
        return {
            completeness: characteristics.complexity === 'high' ? 0.9 : 0.8,
            clarity: 0.85,
            examples: characteristics.complexity !== 'low',
            codeSnippets: true,
            apiDocumentation: true
        };
    }
    
    calculateContextRequirements(data) {
        const baseSize = data.projectMetadata.totalFiles * 1024; // rough estimate
        return {
            estimatedSize: baseSize,
            maxFileSize: 50 * 1024,
            compressionNeeded: baseSize > 100 * 1024
        };
    }
    
    generateSpecialInstructions(data) {
        const instructions = [];
        
        if (data.languageProfile.primary === 'javascript') {
            instructions.push('注意异步函数和Promise处理');
            instructions.push('记录模块导入导出关系');
        }
        
        if (data.projectCharacteristics.complexity === 'high') {
            instructions.push('需要详细的架构说明');
            instructions.push('重点关注模块间的依赖关系');
        }
        
        return instructions;
    }
    
    defineQualityChecks(language) {
        return {
            syntaxValidation: true,
            structureConsistency: true,
            exampleCompleteness: language.primary !== 'unknown',
            linkValidation: true
        };
    }
    
    defineMilestones(data) {
        const totalFiles = data.projectMetadata.totalFiles;
        return [
            { stage: '25%', description: '核心文件文档完成', fileCount: Math.ceil(totalFiles * 0.25) },
            { stage: '50%', description: '主要模块文档完成', fileCount: Math.ceil(totalFiles * 0.5) },
            { stage: '75%', description: '支持模块文档完成', fileCount: Math.ceil(totalFiles * 0.75) },
            { stage: '100%', description: '所有文档和整合完成', fileCount: totalFiles }
        ];
    }
    
    identifyDesignPatterns(data) {
        // 简化的设计模式识别
        const patterns = [];
        if (data.directoryStructure.importantPaths?.includes('controller')) {
            patterns.push('MVC');
        }
        if (data.keyFileContents['package.json']?.content?.includes('express')) {
            patterns.push('RESTful API');
        }
        return patterns.length > 0 ? patterns : ['Standard Structure'];
    }
    
    assessScalability(data) {
        const factors = {
            modularStructure: data.directoryStructure.architecturePattern !== 'unknown',
            dependencyManagement: Object.keys(data.dependencyAnalysis.details).length > 0,
            testCoverage: Object.keys(data.keyFileContents).some(f => f.includes('test'))
        };
        
        const score = Object.values(factors).filter(Boolean).length;
        return score >= 2 ? 'high' : score >= 1 ? 'medium' : 'low';
    }
    
    calculateMaintainability(data) {
        let score = 50; // base score
        
        if (data.keyFileContents['README.md']) score += 20;
        if (data.projectCharacteristics.complexity === 'low') score += 10;
        if (data.languageProfile.confidence > 0.8) score += 10;
        if (data.directoryStructure.architecturePattern !== 'unknown') score += 10;
        
        return Math.min(100, score);
    }
    
    assessTestability(data) {
        const hasTestFiles = Object.keys(data.keyFileContents).some(f => 
            f.includes('test') || f.includes('spec')
        );
        const hasTestFramework = data.dependencyAnalysis.systems.some(sys => 
            ['npm'].includes(sys) // simplified check
        );
        
        if (hasTestFiles && hasTestFramework) return 'high';
        if (hasTestFiles || hasTestFramework) return 'medium';
        return 'low';
    }
    
    generateArchitectureRecommendations(data) {
        const recommendations = [];
        
        if (!data.keyFileContents['README.md']) {
            recommendations.push({
                type: 'documentation',
                priority: 'high',
                message: '建议添加README.md文档'
            });
        }
        
        if (data.projectCharacteristics.complexity === 'high' && 
            !Object.keys(data.keyFileContents).some(f => f.includes('test'))) {
            recommendations.push({
                type: 'testing',
                priority: 'medium',
                message: '复杂项目建议增加测试覆盖'
            });
        }
        
        return recommendations;
    }
    
    generateFallbackArchitectureDoc(data) {
        return {
            title: `${data.projectMetadata.name} - 系统架构文档`,
            generatedAt: new Date().toISOString(),
            version: '1.0-fallback',
            overview: {
                name: data.projectMetadata.name,
                primaryLanguage: data.languageProfile.primary || 'unknown',
                totalFiles: data.projectMetadata.totalFiles
            },
            note: '架构文档生成使用了后备方案，建议手动完善'
        };
    }
    
    getPriorityReason(fileName, fileData) {
        if (['index.js', 'main.js', 'app.js'].includes(fileName)) {
            return '应用入口文件';
        }
        if (fileName.includes('config')) {
            return '配置文件';
        }
        if (fileName === 'package.json') {
            return '项目依赖配置';
        }
        if (fileName === 'README.md') {
            return '项目文档';
        }
        return '重要项目文件';
    }
    
    // 占位符方法（保留兼容性）
    identifyEcosystem(languageResults) { return languageResults.detection?.primaryLanguage || 'unknown'; }
    parseRequirementsTxt(content) { return null; }
    parsePomXml(content) { return null; }
    parseCargoToml(content) { return null; }
    parseGoMod(content) { return null; }
    parseComposerJson(content) { return null; }
    checkLockFiles(projectPath) { return false; }
    basicSecurityCheck(results) { return { issues: [], score: 'unknown' }; }
    generateDependencySummary(results) { return 'No analysis available'; }
    analyzeStructurePatterns(structure) { 
        return { 
            totalDirectories: 0, 
            totalFiles: 0, 
            importantPaths: [], 
            projectType: 'unknown',
            architecturePattern: 'unknown',
            keyFindings: []
        }; 
    }
    simplifyStructureForAI(structure) { return structure; }
    analyzeProjectCharacteristics(data) {
        return {
            type: 'application',
            architecture: 'unknown',
            complexity: 'medium',
            maturity: 'development'
        };
    }
    suggestDocumentSections(characteristics) { return ['overview', 'architecture', 'setup']; }
    identifyKeyFocusAreas(language, characteristics) { return ['core_functionality']; }
    assessComplexity(metadata, structure, dependencies) { return 'medium'; }
    recommendDocumentationApproach(characteristics) { return 'standard'; }
    calculateFileImportance(fileName) { return this.keyFilePatterns.indexOf(fileName) + 1; }
    detectFileType(fileName) {
        if (fileName.endsWith('.json')) return 'config';
        if (fileName.endsWith('.md')) return 'documentation';
        if (fileName.includes('README')) return 'readme';
        return 'unknown';
    }
    trimMarkdownContent(lines, maxLines) {
        return lines.slice(0, maxLines).join('\n');
    }
    trimReadmeContent(lines, maxLines) {
        return lines.slice(0, maxLines).join('\n');
    }
}

export default ProjectOverviewGenerator;