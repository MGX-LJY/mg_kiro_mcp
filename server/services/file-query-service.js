/**
 * 文件查询服务
 * 让AI可以随时查询项目的所有文件信息
 * 
 * 核心功能：
 * - 提供项目文件树查询
 * - 支持文件详细信息查询
 * - 智能文件分类和重要性排序
 * - 支持文件内容预览和完整获取
 */

import { promises as fs } from 'fs';
import { join, resolve, relative, extname, basename, dirname } from 'path';

export class FileQueryService {
    constructor() {
        this.cachedProjects = new Map(); // 缓存项目信息
        this.supportedExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.mjs',
            '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs',
            '.php', '.rb', '.swift', '.kt', '.scala',
            '.json', '.yaml', '.yml', '.toml', '.xml',
            '.md', '.txt', '.sql', '.sh', '.bat',
            '.vue', '.svelte', '.html', '.css', '.scss', '.less'
        ];
        
        this.fileCategories = {
            entry: ['main.js', 'app.js', 'index.js', 'server.js', 'start.js'],
            config: ['package.json', 'tsconfig.json', 'webpack.config.js', '.env'],
            route: ['router', 'routes', 'endpoint', 'api'],
            controller: ['controller', 'ctrl', 'handler'],
            service: ['service', 'provider', 'manager', 'client'],
            model: ['model', 'schema', 'entity', 'dto'],
            component: ['component', 'widget', 'view'],
            utility: ['util', 'helper', 'lib', 'common', 'tools'],
            test: ['test', 'spec', '__test__', '.test.', '.spec.'],
            documentation: ['README', 'CHANGELOG', 'LICENSE', 'docs']
        };
        
        this.exclusionPatterns = [
            '.git', '.svn', 'node_modules', '__pycache__', '.pytest_cache',
            'venv', '.venv', 'build', 'dist', 'target', 'out',
            '.DS_Store', '.idea', '.vscode', '*.log', '*.tmp',
            'coverage', '.nyc_output', 'logs'
        ];
    }

    /**
     * 初始化项目文件索引
     */
    async initializeProject(projectPath) {
        console.log(`[FileQuery] 初始化项目文件索引: ${projectPath}`);
        
        const startTime = Date.now();
        const projectKey = resolve(projectPath);
        
        try {
            // 扫描项目文件
            const allFiles = await this.scanProjectFiles(projectPath);
            console.log(`[FileQuery] 发现 ${allFiles.length} 个源代码文件`);

            // 分析文件信息
            const analysisResults = await this.analyzeProjectFiles(projectPath, allFiles);
            
            // 缓存项目信息
            const projectInfo = {
                projectPath: projectKey,
                indexedAt: new Date().toISOString(),
                indexingTime: `${Date.now() - startTime}ms`,
                totalFiles: allFiles.length,
                ...analysisResults
            };
            
            this.cachedProjects.set(projectKey, projectInfo);
            
            console.log(`[FileQuery] 项目索引完成: ${projectInfo.indexingTime}`);
            return projectInfo;

        } catch (error) {
            console.error('[FileQuery] 项目初始化失败:', error);
            throw new Error(`项目文件索引失败: ${error.message}`);
        }
    }

    /**
     * 获取项目文件列表
     */
    async getProjectFiles(projectPath, options = {}) {
        const projectKey = resolve(projectPath);
        let projectInfo = this.cachedProjects.get(projectKey);
        
        if (!projectInfo) {
            projectInfo = await this.initializeProject(projectPath);
        }

        const {
            category = null,      // 按类别过滤
            importance = null,    // 按重要性过滤
            maxFiles = 100,       // 最大文件数限制
            includePreview = false // 是否包含文件预览
        } = options;

        let filteredFiles = projectInfo.filesByCategory.all;

        // 按类别过滤
        if (category && projectInfo.filesByCategory[category]) {
            filteredFiles = projectInfo.filesByCategory[category];
        }

        // 按重要性过滤
        if (importance) {
            filteredFiles = filteredFiles.filter(file => 
                file.importance >= importance
            );
        }

        // 限制返回数量
        filteredFiles = filteredFiles.slice(0, maxFiles);

        // 添加预览内容
        if (includePreview) {
            for (const file of filteredFiles) {
                try {
                    const content = await fs.readFile(file.fullPath, 'utf8');
                    file.preview = content.substring(0, 500) + (content.length > 500 ? '...' : '');
                    file.hasLongContent = content.length > 10000;
                } catch (error) {
                    file.preview = '[无法读取文件内容]';
                    file.hasLongContent = false;
                }
            }
        }

        return {
            projectPath,
            totalFiles: projectInfo.totalFiles,
            filteredFiles: filteredFiles.length,
            files: filteredFiles,
            categories: Object.keys(projectInfo.filesByCategory),
            queryOptions: options
        };
    }

    /**
     * 获取单个文件详细信息
     */
    async getFileDetails(projectPath, relativePath, options = {}) {
        const projectKey = resolve(projectPath);
        const filePath = join(projectPath, relativePath);
        
        try {
            const stats = await fs.stat(filePath);
            let content = await fs.readFile(filePath, 'utf8');
            
            const {
                maxContentLength = 50000,  // 最大内容长度
                includeTrimming = true,    // 是否包含裁切信息
                includeAnalysis = true     // 是否包含文件分析
            } = options;

            let trimming = null;
            const originalLength = content.length;
            
            // 检查是否需要裁切
            if (content.length > maxContentLength && includeTrimming) {
                const trimmer = await import('./smart-content-trimmer.js');
                const smartTrimmer = new trimmer.SmartContentTrimmer();
                
                content = await smartTrimmer.trimContent(
                    content, 
                    extname(filePath), 
                    maxContentLength
                );
                
                trimming = {
                    wasTrimmed: true,
                    originalLength,
                    trimmedLength: content.length,
                    compressionRatio: (content.length / originalLength * 100).toFixed(1) + '%',
                    trimmingStrategy: this.detectTrimmingStrategy(extname(filePath)),
                    recommendation: '文件内容较长，已智能裁切保留关键部分'
                };
            }

            let analysis = null;
            if (includeAnalysis) {
                analysis = await this.analyzeIndividualFile({
                    fullPath: filePath,
                    relativePath,
                    name: basename(filePath),
                    ext: extname(filePath),
                    size: stats.size
                });
            }

            return {
                file: {
                    relativePath,
                    name: basename(filePath),
                    fullPath: filePath,
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    extension: extname(filePath),
                    directory: relative(projectPath, dirname(filePath))
                },
                content,
                trimming,
                analysis,
                metadata: {
                    requestedAt: new Date().toISOString(),
                    contentLength: content.length,
                    encoding: 'utf8'
                }
            };

        } catch (error) {
            throw new Error(`无法获取文件 ${relativePath}: ${error.message}`);
        }
    }

    /**
     * 获取项目文件处理计划
     */
    async getProcessingPlan(projectPath, options = {}) {
        const projectInfo = await this.getProjectFiles(projectPath, {
            maxFiles: 200,
            includePreview: false
        });

        const {
            batchSize = 5,           // 每批处理的文件数
            priorityOrder = true,    // 是否按优先级排序
            estimateOnly = false     // 是否只返回估算信息
        } = options;

        // 按重要性和类别排序文件
        let sortedFiles = [...projectInfo.files];
        
        if (priorityOrder) {
            sortedFiles.sort((a, b) => {
                // 首先按重要性排序
                if (b.importance !== a.importance) {
                    return b.importance - a.importance;
                }
                // 然后按类别排序
                const categoryOrder = ['entry', 'config', 'route', 'controller', 'service', 'model', 'component'];
                const aIndex = categoryOrder.indexOf(a.category) !== -1 ? categoryOrder.indexOf(a.category) : 999;
                const bIndex = categoryOrder.indexOf(b.category) !== -1 ? categoryOrder.indexOf(b.category) : 999;
                return aIndex - bIndex;
            });
        }

        // 创建批次
        const batches = [];
        for (let i = 0; i < sortedFiles.length; i += batchSize) {
            const batchFiles = sortedFiles.slice(i, i + batchSize);
            batches.push({
                batchNumber: Math.floor(i / batchSize) + 1,
                files: batchFiles.map(file => ({
                    relativePath: file.relativePath,
                    name: file.name,
                    category: file.category,
                    importance: file.importance,
                    estimatedSize: file.size,
                    needsTrimming: file.size > 25000
                }))
            });
        }

        const processingPlan = {
            projectPath,
            planCreatedAt: new Date().toISOString(),
            
            summary: {
                totalFiles: sortedFiles.length,
                totalBatches: batches.length,
                averageBatchSize: Math.round(sortedFiles.length / batches.length),
                estimatedTotalTime: `${batches.length * 2}-${batches.length * 4} 分钟`
            },
            
            processingStrategy: {
                batchSize,
                priorityOrder,
                processingMode: 'sequential-ai-collaboration',
                description: 'AI将逐批处理文件，每批完成后再进行下一批'
            },
            
            batches: estimateOnly ? undefined : batches,
            
            recommendations: [
                '建议AI按批次顺序处理，每批完成后标记进度',
                '重要文件优先处理，确保核心功能文档完整',
                '大文件会自动裁切，保留关键代码结构',
                '建议为每批文件生成独立的文档文件'
            ]
        };

        return processingPlan;
    }

    /**
     * 扫描项目文件
     */
    async scanProjectFiles(projectPath) {
        const files = [];

        async function scan(dirPath, depth = 0) {
            if (depth > 6) return; // 限制扫描深度

            try {
                const items = await fs.readdir(dirPath);

                for (const item of items) {
                    // 跳过排除的目录/文件
                    if (this.exclusionPatterns.some(pattern => 
                        item.includes(pattern.replace('*', ''))
                    )) {
                        continue;
                    }

                    const itemPath = join(dirPath, item);
                    try {
                        const stats = await fs.stat(itemPath);

                        if (stats.isDirectory()) {
                            await scan.call(this, itemPath, depth + 1);
                        } else if (stats.isFile() && this.isSourceFile(item)) {
                            files.push({
                                fullPath: itemPath,
                                relativePath: relative(projectPath, itemPath),
                                name: item,
                                ext: extname(item),
                                size: stats.size,
                                mtime: stats.mtime,
                                directory: relative(projectPath, dirname(itemPath)),
                                depth: depth
                            });
                        }
                    } catch (error) {
                        // 跳过无法访问的文件
                    }
                }
            } catch (error) {
                // 跳过无法访问的目录
            }
        }

        await scan.call(this, projectPath);
        return files;
    }

    /**
     * 分析项目文件
     */
    async analyzeProjectFiles(projectPath, allFiles) {
        const filesByCategory = { all: [] };
        const languageStats = {};
        const sizeStats = { total: 0, average: 0, largest: null, smallest: null };

        for (const file of allFiles) {
            // 计算文件重要性和分类
            const importance = this.calculateFileImportance(file);
            const category = this.categorizeFile(file);
            
            const analyzedFile = {
                ...file,
                importance,
                category
            };

            filesByCategory.all.push(analyzedFile);
            
            // 按类别分组
            if (!filesByCategory[category]) {
                filesByCategory[category] = [];
            }
            filesByCategory[category].push(analyzedFile);

            // 语言统计
            const lang = this.detectLanguage(file.ext);
            languageStats[lang] = (languageStats[lang] || 0) + 1;

            // 大小统计
            sizeStats.total += file.size;
            if (!sizeStats.largest || file.size > sizeStats.largest.size) {
                sizeStats.largest = file;
            }
            if (!sizeStats.smallest || file.size < sizeStats.smallest.size) {
                sizeStats.smallest = file;
            }
        }

        sizeStats.average = Math.round(sizeStats.total / allFiles.length);

        return {
            filesByCategory,
            languageStats,
            sizeStats
        };
    }

    /**
     * 工具方法
     */
    isSourceFile(fileName) {
        const ext = extname(fileName).toLowerCase();
        return this.supportedExtensions.includes(ext) || 
               fileName.toLowerCase().includes('readme') ||
               fileName.toLowerCase().includes('changelog');
    }

    calculateFileImportance(file) {
        let score = 10; // 基础分数

        // 入口文件加分
        if (this.fileCategories.entry.some(pattern => 
            file.name.toLowerCase().includes(pattern.toLowerCase()))) {
            score += 50;
        }

        // 配置文件加分
        if (this.fileCategories.config.some(pattern => 
            file.name.toLowerCase().includes(pattern.toLowerCase()))) {
            score += 40;
        }

        // 根据目录深度调整（越浅越重要）
        score -= file.depth * 5;

        // 根据文件大小调整
        if (file.size < 100) score -= 10; // 太小可能不重要
        if (file.size > 1000 && file.size < 50000) score += 10; // 适中大小的文件通常重要

        return Math.max(1, score);
    }

    categorizeFile(file) {
        for (const [category, patterns] of Object.entries(this.fileCategories)) {
            for (const pattern of patterns) {
                if (file.name.toLowerCase().includes(pattern.toLowerCase()) ||
                    file.relativePath.toLowerCase().includes(pattern.toLowerCase())) {
                    return category;
                }
            }
        }
        return 'other';
    }

    detectLanguage(extension) {
        const langMap = {
            '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'javascript',
            '.ts': 'typescript', '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp',
            '.php': 'php', '.rb': 'ruby', '.swift': 'swift',
            '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
            '.md': 'markdown', '.html': 'html', '.css': 'css'
        };
        return langMap[extension] || 'text';
    }

    detectTrimmingStrategy(extension) {
        const strategies = {
            '.js': '保留imports、exports、函数定义',
            '.ts': '保留imports、exports、类型定义、函数定义',
            '.py': '保留imports、类定义、函数定义、文档字符串',
            '.json': '保留重要配置字段',
            '.md': '保留标题、安装说明、API文档'
        };
        return strategies[extension] || '通用智能裁切策略';
    }

    async analyzeIndividualFile(file) {
        return {
            category: this.categorizeFile(file),
            importance: this.calculateFileImportance(file),
            language: this.detectLanguage(file.ext),
            complexity: file.size > 10000 ? 'high' : file.size > 1000 ? 'medium' : 'low',
            recommendedAction: file.size > 25000 ? 'trim_content' : 'full_content'
        };
    }
}

export default FileQueryService;