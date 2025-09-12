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

/**
 * Token计算工具类
 */
class TokenCalculator {
    constructor() {
        // 基于GPT-4的token估算规则
        this.averageTokenPerChar = 0.25; // 英文约4字符/token，中文约1.5字符/token
        this.tokenLimits = {
            'claude-3': 200000,
            'gpt-4': 128000,
            'gpt-3.5': 16000,
            'default': 100000
        };
    }

    /**
     * 估算文本token数量
     */
    estimateTokens(text) {
        if (!text || typeof text !== 'string') return 0;
        
        const chars = text.length;
        const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
        
        // 中文字符token密度更高
        const tokenRatio = hasChineseChars ? 0.6 : 0.25;
        return Math.ceil(chars * tokenRatio);
    }

    /**
     * 计算代码token数（考虑代码结构）
     */
    estimateCodeTokens(code, language = 'javascript') {
        const baseTokens = this.estimateTokens(code);
        
        // 代码通常token密度较低
        const languageMultipliers = {
            'javascript': 0.8,
            'typescript': 0.85,
            'python': 0.75,
            'json': 0.9,
            'markdown': 0.7
        };
        
        const multiplier = languageMultipliers[language] || 0.8;
        return Math.ceil(baseTokens * multiplier);
    }

    /**
     * 检查是否超过token限制
     */
    exceedsLimit(tokens, model = 'default') {
        const limit = this.tokenLimits[model] || this.tokenLimits.default;
        return tokens > limit * 0.8; // 预留20%缓冲
    }

    /**
     * 计算需要的分片数
     */
    calculateChunks(tokens, model = 'default') {
        const limit = this.tokenLimits[model] || this.tokenLimits.default;
        const safeLimit = limit * 0.6; // 安全限制60%
        return Math.ceil(tokens / safeLimit);
    }
}

/**
 * 智能分片器
 */
class SmartChunker {
    constructor(tokenCalculator) {
        this.tokenCalculator = tokenCalculator;
        this.chunkOverlap = 200; // 分片重叠token数
    }

    /**
     * 🔥 超小分片处理 - 确保每个分片都在安全token范围内
     */
    async chunkFileContent(content, fileName, maxTokens = 1500) {
        const totalTokens = this.tokenCalculator.estimateCodeTokens(content);
        
        // 🔥 即使是小文件也要检查，确保在MCP限制内
        if (totalTokens <= maxTokens && content.length <= 6000) {
            return [{
                chunkIndex: 1,
                totalChunks: 1,
                content: content,
                tokens: totalTokens,
                startLine: 1,
                endLine: content.split('\n').length,
                summary: `完整文件 ${fileName}`
            }];
        }

        // 🔥 更保守的分片策略 - 基于字符数而非token估算
        const lines = content.split('\n');
        const totalLines = lines.length;
        
        // 🔥 每个分片最多1200个token，约4800字符
        const maxCharsPerChunk = Math.min(4800, maxTokens * 4);
        const chunks = [];
        
        let currentChunk = '';
        let currentStartLine = 1;
        let currentLineIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] + '\n';
            
            // 检查添加这一行是否会超出分片大小
            if (currentChunk.length + line.length > maxCharsPerChunk && currentChunk.length > 0) {
                // 创建当前分片
                chunks.push({
                    chunkIndex: chunks.length + 1,
                    totalChunks: 0, // 稍后更新
                    content: currentChunk.trimEnd(), // 移除末尾空白
                    tokens: this.tokenCalculator.estimateCodeTokens(currentChunk),
                    startLine: currentStartLine,
                    endLine: i,
                    summary: `${fileName} 片段 ${chunks.length + 1}`
                });
                
                // 开始新分片
                currentChunk = line;
                currentStartLine = i + 1;
            } else {
                currentChunk += line;
            }
        }
        
        // 添加最后一个分片
        if (currentChunk.length > 0) {
            chunks.push({
                chunkIndex: chunks.length + 1,
                totalChunks: 0, // 稍后更新
                content: currentChunk.trimEnd(),
                tokens: this.tokenCalculator.estimateCodeTokens(currentChunk),
                startLine: currentStartLine,
                endLine: lines.length,
                summary: `${fileName} 片段 ${chunks.length + 1}`
            });
        }

        // 更新总分片数
        const totalChunks = chunks.length;
        chunks.forEach(chunk => {
            chunk.totalChunks = totalChunks;
        });

        console.log(`[SuperChunk] ${fileName} 分片完成: ${totalChunks}片，平均${Math.round(content.length/totalChunks)}字符/片`);
        return chunks;
    }

    /**
     * 分片项目文件列表
     */
    async chunkProjectFiles(files, maxTokensPerChunk = 80000) {
        const chunks = [];
        let currentChunk = {
            files: [],
            totalTokens: 0,
            chunkIndex: 1
        };

        for (const file of files) {
            const fileTokens = this.tokenCalculator.estimateTokens(JSON.stringify(file));
            
            if (currentChunk.totalTokens + fileTokens > maxTokensPerChunk && currentChunk.files.length > 0) {
                // 完成当前分片
                chunks.push({ ...currentChunk });
                
                // 开始新分片
                currentChunk = {
                    files: [file],
                    totalTokens: fileTokens,
                    chunkIndex: chunks.length + 1
                };
            } else {
                currentChunk.files.push(file);
                currentChunk.totalTokens += fileTokens;
            }
        }

        // 添加最后一个分片
        if (currentChunk.files.length > 0) {
            chunks.push(currentChunk);
        }

        // 设置总分片数
        const totalChunks = chunks.length;
        chunks.forEach((chunk, index) => {
            chunk.totalChunks = totalChunks;
            chunk.summary = `项目文件分片 ${index + 1}/${totalChunks} (${chunk.files.length}个文件, ~${chunk.totalTokens}tokens)`;
        });

        return chunks;
    }
}

export class FileQueryService {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 配置合并（ServiceBus格式）
        this.config = {
            // 文件查询配置
            enableCaching: true,
            cacheExpiration: 300000, // 5分钟
            maxFileSize: 5000000, // 5MB
            maxContentLength: 50000, // 50K字符
            
            // 支持的文件扩展名
            supportedExtensions: [
                '.js', '.ts', '.jsx', '.tsx', '.mjs',
                '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs',
                '.php', '.rb', '.swift', '.kt', '.scala',
                '.json', '.yaml', '.yml', '.toml', '.xml',
                '.md', '.txt', '.sql', '.sh', '.bat',
                '.vue', '.svelte', '.html', '.css', '.scss', '.less'
            ],
            
            // 文件分类配置
            fileCategories: {
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
            },
            
            // 排除模式
            exclusionPatterns: [
                '.git', '.svn', 'node_modules', '__pycache__', '.pytest_cache',
                'venv', '.venv', 'build', 'dist', 'target', 'out',
                '.DS_Store', '.idea', '.vscode', '*.log', '*.tmp',
                'coverage', '.nyc_output', 'logs'
            ],
            
            // 覆盖默认配置
            ...config
        };

        // 依赖注入（ServiceBus格式）
        this.serviceBus = serviceBus;
        this.logger = dependencies.logger || console;
        this.smartContentTrimmer = dependencies.smartContentTrimmer;
        
        // 核心状态
        this.cachedProjects = new Map(); // 缓存项目信息
        this.tokenCalculator = new TokenCalculator();
        this.smartChunker = new SmartChunker(this.tokenCalculator);
        
        // 使用配置中的数据（向后兼容）
        this.supportedExtensions = this.config.supportedExtensions;
        this.fileCategories = this.config.fileCategories;
        this.exclusionPatterns = this.config.exclusionPatterns;
        
        this.logger.info('[FileQueryService] 文件查询服务已初始化');
    }

    /**
     * ServiceBus兼容方法：初始化服务
     */
    async initialize() {
        // 执行任何异步初始化逻辑
        return Promise.resolve();
    }

    /**
     * ServiceBus兼容方法：获取服务状态
     */
    getStatus() {
        return {
            name: 'FileQueryService',
            status: 'active',
            cachedProjects: this.cachedProjects.size,
            config: this.config
        };
    }

    /**
     * 初始化项目文件索引
     */
    async initializeProject(projectPath) {
        this.logger.info(`[FileQuery] 初始化项目文件索引: ${projectPath}`);
        
        const startTime = Date.now();
        const projectKey = resolve(projectPath);
        
        try {
            // 扫描项目文件
            const allFiles = await this.scanProjectFiles(projectPath);
            this.logger.info(`[FileQuery] 发现 ${allFiles.length} 个源代码文件`);

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
            
            this.logger.info(`[FileQuery] 项目索引完成: ${projectInfo.indexingTime}`);
            return projectInfo;

        } catch (error) {
            this.logger.error('[FileQuery] 项目初始化失败:', error);
            throw new Error(`项目文件索引失败: ${error.message}`);
        }
    }

    /**
     * 获取项目文件列表（支持分片）
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
            includePreview = false, // 是否包含文件预览
            enableChunking = false, // 是否启用智能分片
            maxTokensPerChunk = 80000, // 每个分片的最大token数
            chunkIndex = null     // 请求特定分片
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

        // 如果启用分片
        if (enableChunking) {
            const chunks = await this.smartChunker.chunkProjectFiles(filteredFiles, maxTokensPerChunk);
            
            const result = {
                projectPath,
                totalFiles: projectInfo.totalFiles,
                filteredFiles: filteredFiles.length,
                categories: Object.keys(projectInfo.filesByCategory),
                queryOptions: options,
                chunking: {
                    totalChunks: chunks.length,
                    currentChunk: chunkIndex || 1,
                    chunksAvailable: chunks.map(chunk => ({
                        chunkIndex: chunk.chunkIndex,
                        fileCount: chunk.files.length,
                        estimatedTokens: chunk.totalTokens,
                        summary: chunk.summary
                    }))
                }
            };
            
            // 返回请求的分片或第一个分片
            if (chunkIndex && chunkIndex <= chunks.length) {
                result.files = chunks[chunkIndex - 1].files;
                result.chunking.selectedChunk = chunks[chunkIndex - 1];
            } else {
                result.files = chunks[0].files;
                result.chunking.selectedChunk = {
                    ...chunks[0],
                    note: '自动返回第一个分片，使用chunkIndex参数获取其他分片'
                };
            }
            
            return result;
        }

        // 常规返回（不分片）
        return {
            projectPath,
            totalFiles: projectInfo.totalFiles,
            filteredFiles: filteredFiles.length,
            files: filteredFiles,
            categories: Object.keys(projectInfo.filesByCategory),
            queryOptions: options,
            tokenInfo: {
                estimatedTotalTokens: this.tokenCalculator.estimateTokens(JSON.stringify(filteredFiles)),
                exceedsLimit: filteredFiles.length > 50,
                recommendChunking: filteredFiles.length > 30
            }
        };
    }

    /**
     * 获取单个文件详细信息（支持分片）
     */
    async getFileDetails(projectPath, relativePath, options = {}) {
        const projectKey = resolve(projectPath);
        const filePath = join(projectPath, relativePath);
        
        try {
            const stats = await fs.stat(filePath);
            let content = await fs.readFile(filePath, 'utf8');
            
            const {
                maxContentLength = this.config.maxContentLength,
                includeTrimming = true,
                includeAnalysis = true,
                enableChunking = false,
                maxTokensPerChunk = 60000,
                chunkIndex = null,
                // ✅ 新增: 预分析数据支持
                preAnalysisData = null
            } = options;

            let trimming = null;
            let chunking = null;
            const originalLength = content.length;
            
            // ✅ 智能 Token 估算：优先使用预分析结果
            let estimatedTokens;
            let shouldForceChunk;
            let effectiveMaxTokensPerChunk = maxTokensPerChunk;
            
            if (preAnalysisData && preAnalysisData.estimatedTokens) {
                // ✅ 使用预分析的精确结果
                estimatedTokens = preAnalysisData.estimatedTokens;
                const chunkingAdvice = preAnalysisData.chunkingAdvice || {};
                
                console.log(`[✅ FileQueryService] 使用预分析数据: Token=${estimatedTokens}, 文件=${preAnalysisData.fileSize}字节`);
                
                // 使用预分析的分片建议
                shouldForceChunk = enableChunking && chunkingAdvice.recommended;
                effectiveMaxTokensPerChunk = chunkingAdvice.maxTokensPerChunk || maxTokensPerChunk;
                
                console.log(`[✅ FileQueryService] 预分析分片建议: 启用=${shouldForceChunk}, 每片Token=${effectiveMaxTokensPerChunk}`);
                
            } else {
                // ☔ 降级到传统计算方式
                console.log(`[☔ FileQueryService] 无预分析数据，实时计算Token: ${relativePath}`);
                estimatedTokens = this.tokenCalculator.estimateCodeTokens(content, this.detectLanguage(extname(filePath)));
                
                const mcpSafeLimit = 8000;
                shouldForceChunk = enableChunking && (
                    estimatedTokens > mcpSafeLimit || 
                    originalLength > 20000 ||
                    this.tokenCalculator.exceedsLimit(estimatedTokens)
                );
                
                console.log(`[☔ FileQueryService] 实时计算结果: Token=${estimatedTokens}, 强制分片=${shouldForceChunk}`);
            }
            
            if (shouldForceChunk) {
                const chunks = await this.smartChunker.chunkFileContent(content, basename(filePath), maxTokensPerChunk);
                
                // 🔥 优化分片响应结构 - 减少元数据占用token
                chunking = {
                    totalChunks: chunks.length,
                    currentChunk: chunkIndex || 1,
                    // 🔥 简化chunksAvailable，只保留必要信息
                    navigation: {
                        hasPrevious: (chunkIndex || 1) > 1,
                        hasNext: (chunkIndex || 1) < chunks.length,
                        totalLines: content.split('\n').length
                    }
                };
                
                // 🔥 选择并优化分片内容
                const targetChunk = (chunkIndex && chunkIndex <= chunks.length) 
                    ? chunks[chunkIndex - 1] 
                    : chunks[0];
                
                content = targetChunk.content;
                
                // 🔥 精简分片信息，减少token消耗
                chunking.selectedChunk = {
                    index: targetChunk.chunkIndex,
                    lines: `${targetChunk.startLine}-${targetChunk.endLine}`,
                    size: targetChunk.content.length
                };
                
                // 🔥 添加导航提示（仅在需要时）
                if (!chunkIndex && chunks.length > 1) {
                    chunking.note = `已分片处理，使用chunkIndex=2,3...获取其他分片`;
                }
            }
            // 检查是否需要裁切（当未启用分片时）
            else if (content.length > maxContentLength && includeTrimming) {
                // 使用依赖注入的smartContentTrimmer，如果没有则动态导入
                let smartTrimmer = this.smartContentTrimmer;
                if (!smartTrimmer) {
                    const trimmer = await import('./smart-content-trimmer.js');
                    smartTrimmer = new trimmer.SmartContentTrimmer();
                }
                
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

            // 🔥 为分片模式禁用详细分析，减少token消耗
            let analysis = null;
            if (includeAnalysis && !chunking) {
                // 只在非分片模式下进行分析，减少响应大小
                analysis = await this.analyzeIndividualFile({
                    fullPath: filePath,
                    relativePath,
                    name: basename(filePath),
                    ext: extname(filePath),
                    size: stats.size
                });
            }

            // 🔥 优化返回结构 - 分片模式下只返回必要信息
            const response = {
                file: {
                    relativePath,
                    name: basename(filePath),
                    size: originalLength, // 原始文件大小
                    extension: extname(filePath)
                },
                content
            };
            
            // 只在有分片时添加分片信息
            if (chunking) {
                response.chunking = chunking;
            }
            
            // 只在有裁切时添加裁切信息
            if (trimming) {
                response.trimming = trimming;
            }
            
            // 只在非分片模式下添加详细分析
            if (analysis) {
                response.analysis = analysis;
            }
            
            // 🔥 精简的token信息
            if (!chunking) {
                response.tokenInfo = {
                    estimatedTokens: this.tokenCalculator.estimateCodeTokens(content, this.detectLanguage(extname(filePath))),
                    contentLength: content.length
                };
            }
            
            return response;

        } catch (error) {
            throw new Error(`无法获取文件 ${relativePath}: ${error.message}`);
        }
    }

    /**
     * 获取项目文件处理计划（支持token分析）
     */
    async getProcessingPlan(projectPath, options = {}) {
        const projectInfo = await this.getProjectFiles(projectPath, {
            maxFiles: 200,
            includePreview: false
        });

        const {
            batchSize = 5,           // 每批处理的文件数
            priorityOrder = true,    // 是否按优先级排序
            estimateOnly = false,    // 是否只返回估算信息
            tokenBasedBatching = false, // 是否基于token数量分批
            maxTokensPerBatch = 100000  // 每批最大token数
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

        // 创建批次（支持基于token的分批）
        const batches = [];
        
        if (tokenBasedBatching) {
            // 基于token数量的智能分批
            let currentBatch = {
                batchNumber: 1,
                files: [],
                estimatedTokens: 0
            };
            
            for (const file of sortedFiles) {
                const fileTokens = this.tokenCalculator.estimateCodeTokens(
                    JSON.stringify(file), 
                    this.detectLanguage(file.ext)
                );
                
                if (currentBatch.estimatedTokens + fileTokens > maxTokensPerBatch && currentBatch.files.length > 0) {
                    batches.push(currentBatch);
                    currentBatch = {
                        batchNumber: batches.length + 1,
                        files: [],
                        estimatedTokens: 0
                    };
                }
                
                currentBatch.files.push({
                    relativePath: file.relativePath,
                    name: file.name,
                    category: file.category,
                    importance: file.importance,
                    estimatedSize: file.size,
                    estimatedTokens: fileTokens,
                    needsTrimming: file.size > 25000,
                    needsChunking: this.tokenCalculator.exceedsLimit(fileTokens)
                });
                
                currentBatch.estimatedTokens += fileTokens;
            }
            
            // 添加最后一批
            if (currentBatch.files.length > 0) {
                batches.push(currentBatch);
            }
        } else {
            // 传统的基于文件数量的分批
            for (let i = 0; i < sortedFiles.length; i += batchSize) {
                const batchFiles = sortedFiles.slice(i, i + batchSize);
                const batchTokens = batchFiles.reduce((sum, file) => 
                    sum + this.tokenCalculator.estimateCodeTokens(JSON.stringify(file)), 0
                );
                
                batches.push({
                    batchNumber: Math.floor(i / batchSize) + 1,
                    estimatedTokens: batchTokens,
                    files: batchFiles.map(file => ({
                        relativePath: file.relativePath,
                        name: file.name,
                        category: file.category,
                        importance: file.importance,
                        estimatedSize: file.size,
                        estimatedTokens: this.tokenCalculator.estimateCodeTokens(JSON.stringify(file)),
                        needsTrimming: file.size > 25000,
                        needsChunking: this.tokenCalculator.exceedsLimit(this.tokenCalculator.estimateCodeTokens(JSON.stringify(file)))
                    }))
                });
            }
        }

        const totalEstimatedTokens = batches.reduce((sum, batch) => sum + (batch.estimatedTokens || 0), 0);
        const largeFilesCount = sortedFiles.filter(f => f.size > 25000).length;
        const chunkedFilesCount = sortedFiles.filter(f => 
            this.tokenCalculator.exceedsLimit(this.tokenCalculator.estimateCodeTokens(JSON.stringify(f)))
        ).length;
        
        const processingPlan = {
            projectPath,
            planCreatedAt: new Date().toISOString(),
            
            summary: {
                totalFiles: sortedFiles.length,
                totalBatches: batches.length,
                averageBatchSize: Math.round(sortedFiles.length / batches.length),
                estimatedTotalTime: `${batches.length * 2}-${batches.length * 4} 分钟`,
                totalEstimatedTokens,
                averageTokensPerBatch: Math.round(totalEstimatedTokens / batches.length),
                largeFilesCount,
                chunkedFilesCount
            },
            
            processingStrategy: {
                batchSize,
                priorityOrder,
                tokenBasedBatching,
                maxTokensPerBatch,
                processingMode: 'sequential-ai-collaboration',
                description: tokenBasedBatching 
                    ? 'AI将基于token数量智能分批处理文件'
                    : 'AI将逐批处理文件，每批完成后再进行下一批'
            },
            
            tokenAnalysis: {
                totalTokens: totalEstimatedTokens,
                averageTokensPerFile: Math.round(totalEstimatedTokens / sortedFiles.length),
                recommendedModel: totalEstimatedTokens > 500000 ? 'claude-3' : 'gpt-4',
                chunkedFilesCount,
                estimatedCost: this.estimateProcessingCost(totalEstimatedTokens)
            },
            
            batches: estimateOnly ? undefined : batches,
            
            recommendations: [
                '建议AI按批次顺序处理，每批完成后标记进度',
                '重要文件优先处理，确保核心功能文档完整',
                largeFilesCount > 0 ? `${largeFilesCount}个大文件会自动裁切` : '所有文件大小适中',
                chunkedFilesCount > 0 ? `${chunkedFilesCount}个文件需要分片处理` : '无需分片处理',
                tokenBasedBatching ? '使用智能token分批，提高处理效率' : '使用固定批次大小',
                totalEstimatedTokens > 100000 ? '建议启用分片处理以优化性能' : '文件大小适中，可直接处理'
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
        const estimatedTokens = this.tokenCalculator.estimateCodeTokens(
            JSON.stringify(file), 
            this.detectLanguage(file.ext)
        );
        
        return {
            category: this.categorizeFile(file),
            importance: this.calculateFileImportance(file),
            language: this.detectLanguage(file.ext),
            complexity: file.size > 10000 ? 'high' : file.size > 1000 ? 'medium' : 'low',
            recommendedAction: this.tokenCalculator.exceedsLimit(estimatedTokens) 
                ? 'chunk_content' : file.size > 25000 ? 'trim_content' : 'full_content',
            tokenInfo: {
                estimatedTokens,
                exceedsLimit: this.tokenCalculator.exceedsLimit(estimatedTokens),
                recommendedChunks: this.tokenCalculator.calculateChunks(estimatedTokens)
            }
        };
    }

    /**
     * 估算处理成本（基于token数量）
     */
    estimateProcessingCost(totalTokens) {
        // 基于OpenAI定价的粗略估算
        const costPer1KTokens = {
            'gpt-4': 0.03,
            'gpt-3.5': 0.002,
            'claude-3': 0.015
        };
        
        const tokensInK = totalTokens / 1000;
        
        return {
            'gpt-4': `$${(tokensInK * costPer1KTokens['gpt-4']).toFixed(2)}`,
            'gpt-3.5': `$${(tokensInK * costPer1KTokens['gpt-3.5']).toFixed(2)}`,
            'claude-3': `$${(tokensInK * costPer1KTokens['claude-3']).toFixed(2)}`,
            note: '估算成本，实际费用可能有所不同'
        };
    }

    /**
     * 获取文件的智能分片
     */
    async getFileChunks(projectPath, relativePath, options = {}) {
        const { maxTokensPerChunk = 60000 } = options;
        
        try {
            const filePath = join(projectPath, relativePath);
            const content = await fs.readFile(filePath, 'utf8');
            const fileName = basename(filePath);
            
            const chunks = await this.smartChunker.chunkFileContent(content, fileName, maxTokensPerChunk);
            
            return {
                file: {
                    relativePath,
                    name: fileName,
                    fullPath: filePath
                },
                chunking: {
                    totalChunks: chunks.length,
                    maxTokensPerChunk,
                    chunks: chunks.map(chunk => ({
                        chunkIndex: chunk.chunkIndex,
                        tokens: chunk.tokens,
                        lineRange: `${chunk.startLine}-${chunk.endLine}`,
                        summary: chunk.summary
                    }))
                },
                success: true
            };
        } catch (error) {
            return {
                error: true,
                message: `无法分片文件 ${relativePath}: ${error.message}`
            };
        }
    }

    /**
     * 获取特定文件分片的内容
     */
    async getFileChunkContent(projectPath, relativePath, chunkIndex, options = {}) {
        const { maxTokensPerChunk = 60000 } = options;
        
        try {
            const filePath = join(projectPath, relativePath);
            const content = await fs.readFile(filePath, 'utf8');
            const fileName = basename(filePath);
            
            const chunks = await this.smartChunker.chunkFileContent(content, fileName, maxTokensPerChunk);
            
            if (chunkIndex < 1 || chunkIndex > chunks.length) {
                return {
                    error: true,
                    message: `分片索引 ${chunkIndex} 超出范围 (1-${chunks.length})`
                };
            }
            
            const selectedChunk = chunks[chunkIndex - 1];
            
            return {
                file: {
                    relativePath,
                    name: fileName,
                    fullPath: filePath
                },
                chunk: selectedChunk,
                navigation: {
                    hasPrevious: chunkIndex > 1,
                    hasNext: chunkIndex < chunks.length,
                    previousChunk: chunkIndex > 1 ? chunkIndex - 1 : null,
                    nextChunk: chunkIndex < chunks.length ? chunkIndex + 1 : null
                },
                success: true
            };
        } catch (error) {
            return {
                error: true,
                message: `无法获取文件分片 ${relativePath}[${chunkIndex}]: ${error.message}`
            };
        }
    }
}

export default FileQueryService;