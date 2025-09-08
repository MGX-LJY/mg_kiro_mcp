/**
 * 智能分层分析器
 * 解决大项目AI分析的核心挑战：架构摘要 + 模块全文 + 智能分片
 * 
 * 核心策略：
 * 1. 架构分析：提取关键代码片段，不读取全文
 * 2. 模块分析：完整读取，但智能分片处理
 * 3. 渐进式分析：先概览后深入，避免token溢出
 */

import fs from 'fs/promises';
import path from 'path';

export class IntelligentLayeredAnalyzer {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.maxTokensPerChunk = 4000; // AI处理单片最大token数
        this.maxFileSize = 50000; // 大文件阈值（字符数）
        this.analysisCache = new Map(); // 分析缓存
    }

    /**
     * 执行智能分层分析
     * @returns {Object} 分层分析结果
     */
    async performLayeredAnalysis() {
        console.log('[IntelligentAnalyzer] 开始智能分层分析...');
        
        const results = {
            architectureAnalysis: await this.performArchitectureAnalysis(),
            moduleAnalysis: await this.performModuleAnalysis(),
            integrationAnalysis: await this.performIntegrationAnalysis(),
            analysisMetadata: {
                timestamp: new Date().toISOString(),
                strategy: 'layered-smart-analysis',
                tokenOptimization: true
            }
        };

        return results;
    }

    /**
     * 架构分析：智能提取关键代码片段
     * 策略：不读取全文，只提取关键信息
     */
    async performArchitectureAnalysis() {
        console.log('[架构分析] 开始智能提取关键代码片段...');

        const architectureFiles = await this.identifyArchitectureFiles();
        const keyExtracts = [];

        for (const file of architectureFiles) {
            try {
                const content = await fs.readFile(file.path, 'utf8');
                const extract = await this.extractArchitectureKeys(file.path, content);
                keyExtracts.push(extract);
            } catch (error) {
                console.warn(`[架构分析] 跳过文件 ${file.path}: ${error.message}`);
            }
        }

        return {
            strategy: 'key-extract-only',
            totalFiles: architectureFiles.length,
            extractedFiles: keyExtracts.length,
            keyExtracts: keyExtracts,
            summary: await this.generateArchitectureSummary(keyExtracts)
        };
    }

    /**
     * 模块分析：完整读取 + 智能分片
     * 策略：分片处理大文件，保持代码完整性
     */
    async performModuleAnalysis() {
        console.log('[模块分析] 开始完整内容分析 + 智能分片...');

        const moduleFiles = await this.identifyModuleFiles();
        const moduleResults = [];

        for (const file of moduleFiles) {
            try {
                const analysis = await this.analyzeModuleWithChunking(file);
                moduleResults.push(analysis);
                
                // 缓存结果，避免重复分析
                this.analysisCache.set(file.path, analysis);
            } catch (error) {
                console.warn(`[模块分析] 分析失败 ${file.path}: ${error.message}`);
            }
        }

        return {
            strategy: 'full-content-with-chunking',
            totalModules: moduleFiles.length,
            analyzedModules: moduleResults.length,
            modules: moduleResults,
            chunkingStats: this.getChunkingStatistics(moduleResults)
        };
    }

    /**
     * 识别架构相关文件
     * 优先级：入口文件、配置文件、路由文件、主要服务
     */
    async identifyArchitectureFiles() {
        const architecturePriority = [
            // 入口文件
            { pattern: /^(index|main|app|server)\.(js|ts)$/, priority: 1, type: 'entry' },
            { pattern: /package\.json$/, priority: 1, type: 'config' },
            { pattern: /\.config\.(js|json)$/, priority: 2, type: 'config' },
            
            // 路由和API
            { pattern: /route|router|api/i, priority: 3, type: 'routing' },
            { pattern: /controller|handler/i, priority: 4, type: 'controller' },
            
            // 核心服务
            { pattern: /service|manager|core/i, priority: 5, type: 'service' },
            { pattern: /middleware/i, priority: 6, type: 'middleware' }
        ];

        const allFiles = await this.scanProjectFiles();
        const architectureFiles = [];

        for (const file of allFiles) {
            for (const rule of architecturePriority) {
                const fileName = path.basename(file);
                const relativePath = path.relative(this.projectPath, file);

                if (rule.pattern.test(fileName) || rule.pattern.test(relativePath)) {
                    architectureFiles.push({
                        path: file,
                        relativePath,
                        priority: rule.priority,
                        type: rule.type
                    });
                    break;
                }
            }
        }

        return architectureFiles
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 15); // 限制架构文件数量
    }

    /**
     * 识别模块文件
     * 包含所有需要深度分析的代码文件
     */
    async identifyModuleFiles() {
        const allFiles = await this.scanProjectFiles();
        const moduleFiles = [];

        for (const file of allFiles) {
            const stats = await fs.stat(file);
            const ext = path.extname(file);
            
            if (['.js', '.ts', '.py', '.java', '.go'].includes(ext) && 
                !this.isTestFile(file) && !this.isConfigFile(file)) {
                
                moduleFiles.push({
                    path: file,
                    relativePath: path.relative(this.projectPath, file),
                    size: stats.size,
                    isLargeFile: stats.size > this.maxFileSize,
                    language: this.detectLanguage(ext)
                });
            }
        }

        return moduleFiles.sort((a, b) => b.size - a.size); // 大文件优先
    }

    /**
     * 提取架构关键信息
     * 只读取关键代码片段，不读取全文
     */
    async extractArchitectureKeys(filePath, content) {
        const fileName = path.basename(filePath);
        const keys = {
            filePath: filePath,
            fileName: fileName,
            size: content.length,
            keyExtracts: {}
        };

        // 提取导入导出
        keys.keyExtracts.imports = this.extractImports(content);
        keys.keyExtracts.exports = this.extractExports(content);

        // 提取类和函数签名（不含具体实现）
        keys.keyExtracts.classes = this.extractClassSignatures(content);
        keys.keyExtracts.functions = this.extractFunctionSignatures(content);

        // 提取配置和常量
        keys.keyExtracts.configs = this.extractConfigurations(content);

        // 提取API路由定义
        keys.keyExtracts.routes = this.extractRouteDefinitions(content);

        // 提取关键注释
        keys.keyExtracts.keyComments = this.extractKeyComments(content);

        return keys;
    }

    /**
     * 智能分片分析模块
     * 将大文件分片，保持代码完整性
     */
    async analyzeModuleWithChunking(moduleFile) {
        const content = await fs.readFile(moduleFile.path, 'utf8');
        
        if (content.length <= this.maxFileSize) {
            // 小文件直接分析
            return {
                filePath: moduleFile.path,
                strategy: 'direct-analysis',
                content: content,
                analysis: await this.performDirectAnalysis(content),
                chunked: false
            };
        }

        // 大文件需要分片
        const chunks = await this.smartChunkFile(content, moduleFile);
        const chunkAnalyses = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkAnalysis = await this.analyzeChunk(chunks[i], i + 1, chunks.length);
            chunkAnalyses.push(chunkAnalysis);
            
            // 避免AI过载，添加小延迟
            if (i < chunks.length - 1) {
                await this.delay(100);
            }
        }

        return {
            filePath: moduleFile.path,
            strategy: 'chunked-analysis',
            totalChunks: chunks.length,
            chunkAnalyses: chunkAnalyses,
            mergedAnalysis: await this.mergeChunkAnalyses(chunkAnalyses),
            chunked: true,
            originalSize: content.length
        };
    }

    /**
     * 智能文件分片
     * 按函数、类边界分片，保持代码完整性
     */
    async smartChunkFile(content, moduleFile) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        let inFunction = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentChunk.push(line);
            currentSize += line.length + 1; // +1 for newline

            // 跟踪函数和类边界
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceCount += openBraces - closeBraces;

            // 检测函数或类开始
            if (this.isFunctionOrClassStart(line)) {
                inFunction = true;
            }

            // 在函数/类结束点分片
            if (inFunction && braceCount === 0 && currentSize > this.maxTokensPerChunk) {
                chunks.push({
                    content: currentChunk.join('\n'),
                    startLine: i - currentChunk.length + 2,
                    endLine: i + 1,
                    size: currentSize,
                    type: 'function-boundary'
                });

                currentChunk = [];
                currentSize = 0;
                inFunction = false;
            }
        }

        // 添加最后一个片段
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n'),
                startLine: lines.length - currentChunk.length + 1,
                endLine: lines.length,
                size: currentSize,
                type: 'remaining'
            });
        }

        return chunks;
    }

    /**
     * 分析单个代码片段
     */
    async analyzeChunk(chunk, chunkIndex, totalChunks) {
        return {
            chunkIndex: chunkIndex,
            totalChunks: totalChunks,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            size: chunk.size,
            type: chunk.type,
            functions: this.extractDetailedFunctions(chunk.content),
            classes: this.extractDetailedClasses(chunk.content),
            complexity: this.calculateComplexity(chunk.content),
            dependencies: this.extractDependencies(chunk.content),
            patterns: this.detectDesignPatterns(chunk.content),
            issues: this.identifyCodeIssues(chunk.content)
        };
    }

    /**
     * 合并片段分析结果
     */
    async mergeChunkAnalyses(chunkAnalyses) {
        const merged = {
            totalFunctions: 0,
            totalClasses: 0,
            allFunctions: [],
            allClasses: [],
            totalComplexity: 0,
            allDependencies: new Set(),
            detectedPatterns: new Map(),
            allIssues: []
        };

        for (const chunk of chunkAnalyses) {
            merged.totalFunctions += chunk.functions.length;
            merged.totalClasses += chunk.classes.length;
            merged.allFunctions.push(...chunk.functions);
            merged.allClasses.push(...chunk.classes);
            merged.totalComplexity += chunk.complexity.cyclomatic || 0;
            
            chunk.dependencies.forEach(dep => merged.allDependencies.add(dep));
            
            chunk.patterns.forEach(pattern => {
                merged.detectedPatterns.set(pattern, 
                    (merged.detectedPatterns.get(pattern) || 0) + 1);
            });
            
            merged.allIssues.push(...chunk.issues);
        }

        merged.allDependencies = Array.from(merged.allDependencies);
        merged.detectedPatterns = Object.fromEntries(merged.detectedPatterns);

        return merged;
    }

    /**
     * 集成分析：分析模块间关系
     */
    async performIntegrationAnalysis() {
        console.log('[集成分析] 分析模块间依赖关系...');

        const importMap = new Map();
        const exportMap = new Map();

        // 收集所有导入导出信息
        for (const [filePath, analysis] of this.analysisCache.entries()) {
            if (analysis.keyExtracts) {
                importMap.set(filePath, analysis.keyExtracts.imports || []);
                exportMap.set(filePath, analysis.keyExtracts.exports || []);
            }
        }

        return {
            strategy: 'dependency-mapping',
            totalFiles: importMap.size,
            dependencyGraph: this.buildDependencyGraph(importMap, exportMap),
            circularDependencies: this.detectCircularDependencies(importMap),
            moduleComplexity: this.calculateModuleComplexity(importMap),
            apiContracts: this.extractAPIContracts()
        };
    }

    // ====== 辅助方法 ======

    async scanProjectFiles() {
        const files = [];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'mg_kiro'];
        
        async function scanDir(dir) {
            const entries = await fs.readdir(dir);
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory() && !excludeDirs.includes(entry)) {
                    await scanDir(fullPath);
                } else if (stats.isFile()) {
                    files.push(fullPath);
                }
            }
        }

        await scanDir(this.projectPath);
        return files;
    }

    extractImports(content) {
        const importRegex = /^import\s+.*?from\s+['"](.*?)['"];?$/gm;
        const requireRegex = /require\(['"](.*?)['"]\)/g;
        const imports = [];
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push({ type: 'import', module: match[1], line: match[0] });
        }
        
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push({ type: 'require', module: match[1], line: match[0] });
        }
        
        return imports;
    }

    extractExports(content) {
        const exportRegex = /^export\s+.*?$/gm;
        const exports = [];
        
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push({ type: 'export', line: match[0] });
        }
        
        return exports;
    }

    extractFunctionSignatures(content) {
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)|(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        const functions = [];
        
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push({
                name: match[1] || match[2],
                signature: match[0],
                type: match[0].includes('async') ? 'async' : 'sync'
            });
        }
        
        return functions;
    }

    extractClassSignatures(content) {
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g;
        const classes = [];
        
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            classes.push({
                name: match[1],
                extends: match[2] || null,
                signature: match[0]
            });
        }
        
        return classes;
    }

    extractConfigurations(content) {
        const configs = [];
        
        // 配置对象
        const configRegex = /(?:const|let|var)\s+(\w*[Cc]onfig\w*)\s*=\s*\{/g;
        let match;
        while ((match = configRegex.exec(content)) !== null) {
            configs.push({ type: 'config', name: match[1] });
        }
        
        // 环境变量
        const envRegex = /process\.env\.(\w+)/g;
        while ((match = envRegex.exec(content)) !== null) {
            configs.push({ type: 'env', name: match[1] });
        }
        
        return configs;
    }

    extractRouteDefinitions(content) {
        const routes = [];
        
        // 简化的路由提取，避免复杂正则表达式
        const routePatterns = [
            /app\.\w+\(['"](.*?)['"].*?\)/g,
            /router\.\w+\(['"](.*?)['"].*?\)/g,
            /path:\s*['"](.*?)['"].*[,\}]/g
        ];
        
        for (const pattern of routePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && !routes.find(r => r.path === match[1])) {
                    routes.push({
                        path: match[1],
                        definition: match[0]
                    });
                }
            }
        }
        
        return routes;
    }

    extractKeyComments(content) {
        const keyComments = [];
        const commentRegex = /\/\*\*([\s\S]*?)\*\/|\/\/\s*(TODO|FIXME|NOTE|IMPORTANT):(.*?)$/gm;
        
        let match;
        while ((match = commentRegex.exec(content)) !== null) {
            keyComments.push({
                type: match[1] ? 'block' : 'line',
                content: match[1] || match[3] || match[0],
                priority: match[2] || 'normal'
            });
        }
        
        return keyComments;
    }

    isFunctionOrClassStart(line) {
        return /^(\s*)(?:export\s+)?(?:async\s+)?(?:function|class)\s+\w+/i.test(line) ||
               /^(\s*)\w+\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>/i.test(line);
    }

    extractDetailedFunctions(content) {
        // 实现详细的函数提取逻辑
        const functions = [];
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
        
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push({
                name: match[1],
                type: 'function',
                async: match[0].includes('async'),
                exported: match[0].includes('export')
            });
        }
        
        return functions;
    }

    extractDetailedClasses(content) {
        const classes = [];
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\}/g;
        
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            classes.push({
                name: match[1],
                extends: match[2] || null,
                methods: this.extractMethods(match[3])
            });
        }
        
        return classes;
    }

    extractMethods(classBody) {
        const methods = [];
        const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
        
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            methods.push({
                name: match[1],
                async: match[0].includes('async')
            });
        }
        
        return methods;
    }

    calculateComplexity(content) {
        const cyclomaticKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
        let complexity = 1; // 基础复杂度
        
        for (const keyword of cyclomaticKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) complexity += matches.length;
        }
        
        return { cyclomatic: complexity };
    }

    extractDependencies(content) {
        const dependencies = [];
        const importRegex = /import.*?from\s+['"](.*?)['"]|require\(['"](.*?)['"]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            dependencies.push(match[1] || match[2]);
        }
        
        return dependencies;
    }

    detectDesignPatterns(content) {
        const patterns = [];
        
        if (content.includes('getInstance')) patterns.push('Singleton');
        if (content.includes('addEventListener') || content.includes('emit')) patterns.push('Observer');
        if (content.includes('createFactory') || content.includes('Factory')) patterns.push('Factory');
        if (content.includes('export class') || content.includes('module.exports')) patterns.push('Module');
        if (content.includes('app.get') || content.includes('router.')) patterns.push('Express-Route');
        if (content.includes('next(') && content.includes('req,') && content.includes('res,')) patterns.push('Middleware');
        
        return patterns;
    }

    identifyCodeIssues(content) {
        const issues = [];
        
        if (content.includes('console.log')) issues.push({ type: 'debug-code', severity: 'low' });
        if (content.includes('TODO')) issues.push({ type: 'todo', severity: 'medium' });
        if (content.includes('FIXME')) issues.push({ type: 'fixme', severity: 'high' });
        if (content.match(/function\s+\w+\s*\([^)]{50,}/)) issues.push({ type: 'long-parameter-list', severity: 'medium' });
        
        return issues;
    }

    isTestFile(filePath) {
        return /\.(test|spec)\.(js|ts)$/.test(filePath) || 
               filePath.includes('/test/') || 
               filePath.includes('/tests/');
    }

    isConfigFile(filePath) {
        const configPatterns = [
            /\.config\.(js|json)$/,
            /package\.json$/,
            /tsconfig\.json$/,
            /webpack\.config\./,
            /babel\.config\./
        ];
        
        return configPatterns.some(pattern => pattern.test(filePath));
    }

    detectLanguage(extension) {
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript', 
            '.py': 'python',
            '.java': 'java',
            '.go': 'go'
        };
        
        return langMap[extension] || 'unknown';
    }

    buildDependencyGraph(importMap, exportMap) {
        const graph = {};
        
        for (const [filePath, imports] of importMap.entries()) {
            graph[filePath] = imports.map(imp => imp.module);
        }
        
        return graph;
    }

    detectCircularDependencies(importMap) {
        // 简化的循环依赖检测
        const visited = new Set();
        const recursionStack = new Set();
        const circular = [];
        
        // 这里可以实现更复杂的循环依赖检测算法
        return circular;
    }

    calculateModuleComplexity(importMap) {
        const complexity = {};
        
        for (const [filePath, imports] of importMap.entries()) {
            complexity[filePath] = {
                incomingDependencies: imports.length,
                complexity: imports.length > 10 ? 'high' : imports.length > 5 ? 'medium' : 'low'
            };
        }
        
        return complexity;
    }

    extractAPIContracts() {
        // 提取API契约信息
        return {
            endpoints: [],
            schemas: [],
            contracts: []
        };
    }

    getChunkingStatistics(moduleResults) {
        const stats = {
            totalModules: moduleResults.length,
            chunkedModules: moduleResults.filter(m => m.chunked).length,
            totalChunks: moduleResults.reduce((sum, m) => sum + (m.totalChunks || 1), 0),
            averageChunksPerModule: 0
        };
        
        if (stats.chunkedModules > 0) {
            stats.averageChunksPerModule = stats.totalChunks / stats.chunkedModules;
        }
        
        return stats;
    }

    async generateArchitectureSummary(keyExtracts) {
        const summary = {
            totalFiles: keyExtracts.length,
            keyInsights: [],
            mainComponents: [],
            criticalPaths: []
        };
        
        // 分析关键提取信息生成摘要
        for (const extract of keyExtracts) {
            if (extract.keyExtracts.classes && extract.keyExtracts.classes.length > 0) {
                summary.mainComponents.push({
                    file: extract.fileName,
                    classes: extract.keyExtracts.classes.map(c => c.name)
                });
            }
            
            if (extract.keyExtracts.routes && extract.keyExtracts.routes.length > 0) {
                summary.criticalPaths.push({
                    file: extract.fileName,
                    routes: extract.keyExtracts.routes.map(r => r.path)
                });
            }
        }
        
        return summary;
    }

    async performDirectAnalysis(content) {
        return {
            functions: this.extractDetailedFunctions(content),
            classes: this.extractDetailedClasses(content),
            complexity: this.calculateComplexity(content),
            dependencies: this.extractDependencies(content),
            patterns: this.detectDesignPatterns(content),
            issues: this.identifyCodeIssues(content)
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default IntelligentLayeredAnalyzer;