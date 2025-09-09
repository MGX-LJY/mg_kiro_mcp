/**
 * 渐进式内容生成器 v3.0 - 多次API调用模式
 * 支持分批次渐进式文档生成，AI协作友好设计
 * 
 * 核心特性：
 * - 🔄 多次API调用：每次返回一个批次，等待AI完成后再继续
 * - 🎯 智能文件优先级排序：核心文件优先处理
 * - 📏 智能内容裁切：大文件自动裁切，保留关键信息
 * - 📊 详细状态跟踪：文件裁切提醒、处理进度、批次信息
 * - 🤖 AI协作优化：专为AI理解和处理优化的数据结构
 * 
 * 使用流程：
 * 1. initializeProgressiveFlow() - 初始化流程
 * 2. getNextBatch() - 获取下一批次（AI处理）
 * 3. markBatchCompleted() - 标记完成，准备下一批次
 * 4. 重复2-3步骤直到完成
 */

import { promises as fs } from 'fs';
import { join, resolve, relative, extname, basename, dirname } from 'path';
import { SmartContentTrimmer } from './smart-content-trimmer.js';

export class ProgressiveContentGenerator {
    constructor() {
        this.contentTrimmer = new SmartContentTrimmer();
        this.maxBatchSize = 80 * 1024; // 80KB per batch
        this.maxFileSize = 25 * 1024;  // 25KB per file
        
        // 🔄 多次API调用状态跟踪
        this.flowState = {
            projectPath: null,
            status: 'idle', // idle | initialized | processing | completed | error
            currentBatchIndex: 0,
            totalBatches: 0,
            completedBatches: 0,
            allBatches: [],
            stage: null,
            startedAt: null,
            lastBatchAt: null,
            completedAt: null,
            errors: [],
            aiWaitingForNext: false // AI是否在等待下一批次
        };
        
        // 📊 详细统计信息
        this.statistics = {
            totalFiles: 0,
            processedFiles: 0,
            trimmedFiles: 0,
            totalOriginalSize: 0,
            totalProcessedSize: 0,
            processingTimeMs: 0
        };
        
        // 文件重要性权重配置
        this.importanceWeights = {
            // 核心入口文件
            entry: 100,     // main.js, app.js, index.js, server.js
            config: 90,     // 配置文件
            route: 85,      // 路由定义
            controller: 80, // 控制器
            service: 75,    // 服务层
            model: 70,      // 数据模型
            component: 65,  // 组件
            utility: 60,    // 工具函数
            test: 30,       // 测试文件
            asset: 20,      // 静态资源
            build: 15,      // 构建相关
            other: 10       // 其他文件
        };

        // 文件类型模式
        this.filePatterns = {
            entry: [
                'main.js', 'app.js', 'index.js', 'server.js', 'start.js',
                'main.py', 'app.py', 'run.py', '__main__.py',
                'main.go', 'main.java', 'Program.cs', 'main.cpp'
            ],
            config: [
                'config', 'settings', '.env', 'package.json', 'tsconfig.json',
                'webpack.config.js', 'vite.config.js', 'babel.config.js',
                'docker', 'nginx.conf', 'requirements.txt', 'pom.xml'
            ],
            route: ['router', 'routes', 'endpoint', 'api'],
            controller: ['controller', 'ctrl', 'handler'],
            service: ['service', 'provider', 'manager', 'client'],
            model: ['model', 'schema', 'entity', 'dto'],
            component: ['component', 'widget', 'view'],
            utility: ['util', 'helper', 'lib', 'common', 'tools'],
            test: ['test', 'spec', '__test__', '.test.', '.spec.'],
            asset: ['assets', 'static', 'public', 'images', 'css', 'scss'],
            build: ['build', 'dist', 'webpack', 'rollup', 'gulp', 'grunt']
        };

        this.exclusionPatterns = [
            '.git', '.svn', 'node_modules', '__pycache__', '.pytest_cache',
            'venv', '.venv', 'build', 'dist', 'target', 'out',
            '.DS_Store', '.idea', '.vscode', '*.log', '*.tmp',
            'coverage', '.nyc_output', 'logs'
        ];

        // 支持的文件扩展名
        this.supportedExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.mjs',
            '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs',
            '.php', '.rb', '.swift', '.kt', '.scala',
            '.json', '.yaml', '.yml', '.toml', '.xml',
            '.md', '.txt', '.sql', '.sh', '.bat',
            '.vue', '.svelte', '.html', '.css', '.scss', '.less'
        ];
    }

    /**
     * 生成渐进式内容批次
     */
    async generateProgressiveBatches(projectPath, options = {}) {
        console.log(`[ProgressiveContent] 开始生成渐进式内容: ${projectPath}`);
        
        const {
            maxBatchSize = this.maxBatchSize,
            maxBatches = 20,
            stage = 'file-level',
            focusModule = null
        } = options;

        try {
            // 1. 扫描和分析所有文件
            const allFiles = await this.scanProjectFiles(projectPath);
            console.log(`[ProgressiveContent] 发现 ${allFiles.length} 个源代码文件`);

            // 2. 计算文件重要性和优先级
            const prioritizedFiles = await this.prioritizeFiles(allFiles, focusModule);
            console.log(`[ProgressiveContent] 完成文件优先级排序`);

            // 3. 根据处理阶段进行文件分组
            const groupedFiles = this.groupFilesByStage(prioritizedFiles, stage);
            console.log(`[ProgressiveContent] 按${stage}阶段分组完成`);

            // 4. 创建智能批次
            const batches = await this.createSmartBatches(groupedFiles, maxBatchSize, maxBatches);
            console.log(`[ProgressiveContent] 创建了 ${batches.length} 个处理批次`);

            return {
                totalBatches: batches.length,
                totalFiles: allFiles.length,
                stage,
                processing: {
                    strategy: this.getProcessingStrategy(stage),
                    expectedOutputs: this.getExpectedOutputs(stage, batches),
                    progression: this.getProgressionPlan(stage)
                },
                batches
            };

        } catch (error) {
            console.error('[ProgressiveContent] 生成失败:', error);
            throw new Error(`渐进式内容生成失败: ${error.message}`);
        }
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
                                path: itemPath,
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
     * 文件优先级排序
     */
    async prioritizeFiles(files, focusModule = null) {
        const prioritized = files.map(file => ({
            ...file,
            importance: this.calculateFileImportance(file),
            category: this.categorizeFile(file),
            moduleRelevance: focusModule ? this.calculateModuleRelevance(file, focusModule) : 1
        }));

        // 综合排序：重要性 × 模块相关性 × 新鲜度
        return prioritized.sort((a, b) => {
            const scoreA = (a.importance * a.moduleRelevance) + (this.calculateFreshnessScore(a) * 0.1);
            const scoreB = (b.importance * b.moduleRelevance) + (this.calculateFreshnessScore(b) * 0.1);
            return scoreB - scoreA;
        });
    }

    /**
     * 计算文件重要性
     */
    calculateFileImportance(file) {
        let baseScore = this.importanceWeights.other;

        // 根据文件名和路径模式计算重要性
        for (const [category, patterns] of Object.entries(this.filePatterns)) {
            for (const pattern of patterns) {
                if (file.name.toLowerCase().includes(pattern.toLowerCase()) ||
                    file.relativePath.toLowerCase().includes(pattern.toLowerCase())) {
                    baseScore = Math.max(baseScore, this.importanceWeights[category] || 10);
                }
            }
        }

        // 根据目录深度调整分数（越浅越重要）
        const depthPenalty = Math.max(0, (file.depth - 1) * 5);
        baseScore -= depthPenalty;

        // 根据文件大小调整分数（过大或过小都降低分数）
        if (file.size < 100) baseScore -= 20; // 太小可能不重要
        if (file.size > 50000) baseScore -= 10; // 太大可能需要特殊处理

        return Math.max(1, baseScore);
    }

    /**
     * 文件分类
     */
    categorizeFile(file) {
        for (const [category, patterns] of Object.entries(this.filePatterns)) {
            for (const pattern of patterns) {
                if (file.name.toLowerCase().includes(pattern.toLowerCase()) ||
                    file.relativePath.toLowerCase().includes(pattern.toLowerCase())) {
                    return category;
                }
            }
        }
        return 'other';
    }

    /**
     * 根据阶段分组文件
     */
    groupFilesByStage(files, stage) {
        switch (stage) {
            case 'file-level':
                return this.groupByFileCategory(files);
            case 'module-level':
                return this.groupByModule(files);
            case 'integration-level':
                return this.groupByIntegration(files);
            default:
                return { all: files };
        }
    }

    /**
     * 按文件类别分组
     */
    groupByFileCategory(files) {
        const groups = {};
        
        for (const file of files) {
            const category = file.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(file);
        }

        // 按重要性排序分组
        const sortedGroups = {};
        const groupOrder = ['entry', 'config', 'route', 'controller', 'service', 'model', 'component', 'utility', 'other'];
        
        for (const category of groupOrder) {
            if (groups[category] && groups[category].length > 0) {
                sortedGroups[category] = groups[category];
            }
        }

        return sortedGroups;
    }

    /**
     * 按模块分组
     */
    groupByModule(files) {
        const modules = {};
        
        for (const file of files) {
            const moduleName = this.extractModuleName(file);
            if (!modules[moduleName]) {
                modules[moduleName] = [];
            }
            modules[moduleName].push(file);
        }

        return modules;
    }

    /**
     * 创建智能批次
     */
    async createSmartBatches(groupedFiles, maxBatchSize, maxBatches) {
        const batches = [];
        let currentBatch = null;
        let currentSize = 0;

        for (const [groupName, files] of Object.entries(groupedFiles)) {
            console.log(`[ProgressiveContent] 处理分组: ${groupName} (${files.length} files)`);

            for (const file of files) {
                if (batches.length >= maxBatches) break;

                // 预估处理后的文件大小
                const estimatedSize = Math.min(file.size, this.maxFileSize);

                // 检查是否需要创建新批次
                if (!currentBatch || (currentSize + estimatedSize) > maxBatchSize) {
                    if (currentBatch) {
                        batches.push(await this.finalizeBatch(currentBatch, batches.length));
                    }

                    currentBatch = {
                        groupName,
                        files: [],
                        totalSize: 0,
                        stage: this.determineStageFromGroup(groupName),
                        context: {
                            focusArea: groupName,
                            expectedOutputType: this.getExpectedOutputType(groupName),
                            instructions: this.getProcessingInstructions(groupName)
                        }
                    };
                    currentSize = 0;
                }

                // 添加文件到当前批次
                currentBatch.files.push(file);
                currentSize += estimatedSize;
                currentBatch.totalSize += file.size;
            }
        }

        // 完成最后一个批次
        if (currentBatch && currentBatch.files.length > 0) {
            batches.push(await this.finalizeBatch(currentBatch, batches.length));
        }

        return batches;
    }

    /**
     * 完成批次处理
     */
    async finalizeBatch(batch, batchIndex) {
        const processedFiles = [];
        
        for (const file of batch.files) {
            try {
                let content = await fs.readFile(file.path, 'utf8');
                
                // 智能内容裁切
                if (content.length > this.maxFileSize) {
                    content = await this.contentTrimmer.trimContent(
                        content, 
                        file.ext, 
                        this.maxFileSize
                    );
                }

                processedFiles.push({
                    path: file.relativePath,
                    name: file.name,
                    type: file.category,
                    language: this.detectLanguage(file.ext),
                    size: file.size,
                    content,
                    isTruncated: content.length < file.size,
                    importance: file.importance,
                    relationships: await this.findFileRelationships(file),
                    lastModified: file.mtime.toISOString()
                });

            } catch (error) {
                console.warn(`[ProgressiveContent] 无法处理文件 ${file.relativePath}:`, error.message);
            }
        }

        return {
            batchId: batchIndex + 1,
            groupName: batch.groupName,
            stage: batch.stage,
            fileCount: processedFiles.length,
            totalOriginalSize: batch.totalSize,
            estimatedProcessedSize: processedFiles.reduce((sum, f) => sum + f.content.length, 0),
            
            batchContext: {
                ...batch.context,
                processingHints: this.generateProcessingHints(processedFiles),
                suggestedActions: this.suggestNextActions(batch.stage, batch.groupName),
                relationships: this.analyzeBatchRelationships(processedFiles)
            },
            
            files: processedFiles,
            
            progressiveInstructions: {
                currentStage: batch.stage,
                focusArea: batch.groupName,
                expectedOutput: batch.context.expectedOutputType,
                nextStep: this.suggestNextStep(batchIndex, batch.stage),
                completionCriteria: this.getCompletionCriteria(batch.stage)
            }
        };
    }

    /**
     * 工具方法集合
     */
    isSourceFile(fileName) {
        const ext = extname(fileName).toLowerCase();
        return this.supportedExtensions.includes(ext) || 
               fileName.toLowerCase().includes('readme') ||
               fileName.toLowerCase().includes('changelog');
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

    extractModuleName(file) {
        const pathParts = file.relativePath.split('/');
        return pathParts[0] || 'root';
    }

    calculateModuleRelevance(file, focusModule) {
        if (!focusModule) return 1;
        return file.relativePath.toLowerCase().includes(focusModule.toLowerCase()) ? 2 : 0.5;
    }

    calculateFreshnessScore(file) {
        const daysSinceModified = (Date.now() - file.mtime.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 30 - daysSinceModified);
    }

    // 占位符方法（待实现）
    async findFileRelationships(file) { return []; }
    generateProcessingHints(files) { return []; }
    suggestNextActions(stage, groupName) { return []; }
    analyzeBatchRelationships(files) { return {}; }
    determineStageFromGroup(groupName) { return 'file-level'; }
    getExpectedOutputType(groupName) { return 'documentation'; }
    getProcessingInstructions(groupName) { return 'Analyze and document the files'; }
    suggestNextStep(batchIndex, stage) { return 'Continue processing'; }
    getCompletionCriteria(stage) { return ['All files documented']; }
    getProcessingStrategy(stage) { return 'Sequential processing'; }
    getExpectedOutputs(stage, batches) { return []; }
    getProgressionPlan(stage) { return []; }
    groupByIntegration(files) { return { integration: files }; }
}

export default ProgressiveContentGenerator;