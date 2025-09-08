/**
 * 模块完整分析器
 * 专门处理模块级别的完整内容分析，使用智能分片解决大文件AI token限制
 * 
 * 策略：
 * 1. 完整读取文件内容，进行深度分析
 * 2. 智能分片处理大文件，按代码结构分割
 * 3. 保持代码完整性，避免在函数/类中间分割
 * 4. 分析后合并结果，提供完整的模块视图
 * 5. 缓存机制避免重复分析
 */

import fs from 'fs/promises';
import path from 'path';

export class ModuleCompleteAnalyzer {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.maxChunkSize = 8000; // 每个chunk的最大字符数
        this.analysisCache = new Map();
        this.processingQueue = [];
    }

    /**
     * 执行完整模块分析
     * @returns {Object} 完整模块分析结果
     */
    async performCompleteModuleAnalysis() {
        console.log('[模块分析器] 开始完整模块内容分析...');

        const moduleFiles = await this.identifyModuleFiles();
        const moduleAnalyses = [];
        let totalProcessed = 0;

        console.log(`[模块分析器] 发现 ${moduleFiles.length} 个模块文件`);

        // 按大小排序，优先处理小文件
        const sortedFiles = moduleFiles.sort((a, b) => a.size - b.size);

        for (const moduleFile of sortedFiles) {
            try {
                console.log(`[模块分析] 处理文件 ${++totalProcessed}/${moduleFiles.length}: ${moduleFile.relativePath}`);
                
                const analysis = await this.analyzeModuleCompletely(moduleFile);
                moduleAnalyses.push(analysis);
                
                // 缓存结果
                this.analysisCache.set(moduleFile.path, analysis);
                
                // 处理间隔，避免过载
                if (totalProcessed % 5 === 0) {
                    await this.delay(200);
                }
            } catch (error) {
                console.warn(`[模块分析] 分析失败 ${moduleFile.path}: ${error.message}`);
                
                // 记录失败但继续处理
                moduleAnalyses.push({
                    filePath: moduleFile.path,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return {
            analysisStrategy: 'complete-module-analysis',
            totalFiles: moduleFiles.length,
            successfulAnalyses: moduleAnalyses.filter(a => a.status !== 'failed').length,
            failedAnalyses: moduleAnalyses.filter(a => a.status === 'failed').length,
            moduleAnalyses: moduleAnalyses,
            aggregatedInsights: await this.aggregateModuleInsights(moduleAnalyses),
            processingStatistics: await this.generateProcessingStats(moduleAnalyses)
        };
    }

    /**
     * 识别需要分析的模块文件
     */
    async identifyModuleFiles() {
        const allFiles = await this.scanProjectFiles();
        const moduleFiles = [];

        for (const file of allFiles) {
            const stats = await fs.stat(file);
            const ext = path.extname(file);
            const fileName = path.basename(file);
            
            // 只分析代码文件，跳过配置、测试、构建文件
            if (this.isCodeFile(ext) && 
                !this.isTestFile(file) && 
                !this.isBuildFile(file) && 
                !this.isConfigOnlyFile(fileName)) {
                
                moduleFiles.push({
                    path: file,
                    relativePath: path.relative(this.projectPath, file),
                    fileName: fileName,
                    size: stats.size,
                    extension: ext,
                    language: this.detectLanguageFromExtension(ext),
                    isLargeFile: stats.size > this.maxChunkSize,
                    priority: this.calculateFilePriority(file, stats.size),
                    lastModified: stats.mtime
                });
            }
        }

        console.log(`[模块识别] 找到 ${moduleFiles.length} 个模块文件`);
        return moduleFiles.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 完整分析单个模块
     */
    async analyzeModuleCompletely(moduleFile) {
        const startTime = Date.now();
        
        try {
            const content = await fs.readFile(moduleFile.path, 'utf8');
            console.log(`[模块分析] 读取文件 ${moduleFile.fileName} (${content.length} 字符)`);

            let analysis;
            
            if (content.length <= this.maxChunkSize) {
                // 小文件直接分析
                analysis = await this.analyzeSmallModule(moduleFile, content);
            } else {
                // 大文件分片分析
                analysis = await this.analyzeLargeModuleWithChunking(moduleFile, content);
            }

            analysis.processingTime = Date.now() - startTime;
            analysis.timestamp = new Date().toISOString();
            analysis.status = 'success';

            return analysis;
        } catch (error) {
            throw new Error(`模块分析失败: ${error.message}`);
        }
    }

    /**
     * 分析小模块（直接分析）
     */
    async analyzeSmallModule(moduleFile, content) {
        console.log(`[小模块分析] 直接分析 ${moduleFile.fileName}`);

        const analysis = {
            filePath: moduleFile.path,
            relativePath: moduleFile.relativePath,
            fileName: moduleFile.fileName,
            language: moduleFile.language,
            size: content.length,
            analysisType: 'direct',
            chunked: false
        };

        // 执行完整的代码分析
        analysis.codeAnalysis = await this.performDeepCodeAnalysis(content, moduleFile);
        analysis.structureAnalysis = await this.analyzeModuleStructure(content);
        analysis.qualityAnalysis = await this.analyzeCodeQuality(content);
        analysis.dependencyAnalysis = await this.analyzeDependencies(content);
        analysis.businessLogicAnalysis = await this.analyzeBusinessLogic(content, moduleFile);

        return analysis;
    }

    /**
     * 分析大模块（分片分析）
     */
    async analyzeLargeModuleWithChunking(moduleFile, content) {
        console.log(`[大模块分析] 分片分析 ${moduleFile.fileName} (${content.length} 字符)`);

        const chunks = await this.createSmartChunks(content, moduleFile);
        console.log(`[分片] 创建了 ${chunks.length} 个代码片段`);

        const chunkAnalyses = [];
        
        for (let i = 0; i < chunks.length; i++) {
            console.log(`[分片分析] 处理片段 ${i + 1}/${chunks.length}`);
            
            const chunkAnalysis = await this.analyzeChunk(chunks[i], i + 1, chunks.length, moduleFile);
            chunkAnalyses.push(chunkAnalysis);
            
            // 避免AI过载
            if (i < chunks.length - 1) {
                await this.delay(150);
            }
        }

        const mergedAnalysis = await this.mergeChunkAnalyses(chunkAnalyses, moduleFile, content);
        
        return {
            filePath: moduleFile.path,
            relativePath: moduleFile.relativePath,
            fileName: moduleFile.fileName,
            language: moduleFile.language,
            size: content.length,
            analysisType: 'chunked',
            chunked: true,
            totalChunks: chunks.length,
            chunkAnalyses: chunkAnalyses,
            mergedAnalysis: mergedAnalysis,
            chunkingStrategy: 'smart-boundary'
        };
    }

    /**
     * 创建智能代码片段
     * 按函数、类、模块边界分割，保持代码完整性
     */
    async createSmartChunks(content, moduleFile) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        let depth = 0;
        let inMultilineComment = false;
        let inString = false;
        let stringChar = '';

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmedLine = line.trim();

            // 跟踪多行注释
            if (trimmedLine.includes('/*') && !inString) inMultilineComment = true;
            if (trimmedLine.includes('*/') && !inString) inMultilineComment = false;

            // 跟踪字符串
            this.trackStringState(line, inString, stringChar);

            // 跟踪代码块深度
            if (!inMultilineComment && !inString) {
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                depth += openBraces - closeBraces;
            }

            currentChunk.push(line);
            currentSize += line.length + 1; // +1 for newline

            // 在合适的边界分割
            const shouldSplit = currentSize > this.maxChunkSize && 
                               depth === 0 && 
                               !inMultilineComment && 
                               !inString &&
                               this.isGoodSplitPoint(trimmedLine);

            if (shouldSplit) {
                chunks.push(this.createChunk(currentChunk, chunks.length, lineIndex - currentChunk.length + 1, lineIndex));
                currentChunk = [];
                currentSize = 0;
            }
        }

        // 添加最后一个片段
        if (currentChunk.length > 0) {
            chunks.push(this.createChunk(currentChunk, chunks.length, lines.length - currentChunk.length + 1, lines.length));
        }

        return chunks;
    }

    /**
     * 创建代码片段对象
     */
    createChunk(lines, index, startLine, endLine) {
        const content = lines.join('\n');
        
        return {
            index: index,
            content: content,
            size: content.length,
            startLine: startLine,
            endLine: endLine,
            lineCount: lines.length,
            type: this.determineChunkType(content),
            complexity: this.estimateChunkComplexity(content),
            hasClasses: content.includes('class '),
            hasFunctions: content.includes('function ') || content.includes(' => '),
            hasAsync: content.includes('async '),
            hasImports: content.includes('import ') || content.includes('require(')
        };
    }

    /**
     * 分析代码片段
     */
    async analyzeChunk(chunk, chunkIndex, totalChunks, moduleFile) {
        const analysis = {
            chunkIndex: chunkIndex,
            totalChunks: totalChunks,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            size: chunk.size,
            type: chunk.type,
            complexity: chunk.complexity
        };

        // 深度分析片段内容
        analysis.functions = await this.extractDetailedFunctions(chunk.content);
        analysis.classes = await this.extractDetailedClasses(chunk.content);
        analysis.variables = await this.extractVariables(chunk.content);
        analysis.imports = await this.extractImports(chunk.content);
        analysis.exports = await this.extractExports(chunk.content);
        analysis.comments = await this.extractComments(chunk.content);
        analysis.codePatterns = await this.detectCodePatterns(chunk.content);
        analysis.qualityIssues = await this.detectQualityIssues(chunk.content);
        analysis.securityIssues = await this.detectSecurityIssues(chunk.content);

        return analysis;
    }

    /**
     * 合并片段分析结果
     */
    async mergeChunkAnalyses(chunkAnalyses, moduleFile, fullContent) {
        console.log(`[合并分析] 合并 ${chunkAnalyses.length} 个片段的分析结果`);

        const merged = {
            totalFunctions: 0,
            totalClasses: 0,
            totalVariables: 0,
            allFunctions: [],
            allClasses: [],
            allVariables: [],
            allImports: [],
            allExports: [],
            allComments: [],
            detectedPatterns: {},
            qualityIssues: [],
            securityIssues: [],
            crossChunkInsights: {}
        };

        // 合并各个片段的结果
        for (const chunk of chunkAnalyses) {
            merged.totalFunctions += chunk.functions.length;
            merged.totalClasses += chunk.classes.length;
            merged.totalVariables += chunk.variables.length;
            
            merged.allFunctions.push(...chunk.functions.map(f => ({
                ...f,
                chunkIndex: chunk.chunkIndex,
                startLine: chunk.startLine + (f.lineNumber || 0)
            })));
            
            merged.allClasses.push(...chunk.classes.map(c => ({
                ...c,
                chunkIndex: chunk.chunkIndex,
                startLine: chunk.startLine + (c.lineNumber || 0)
            })));
            
            merged.allVariables.push(...chunk.variables.map(v => ({
                ...v,
                chunkIndex: chunk.chunkIndex
            })));
            
            merged.allImports.push(...chunk.imports);
            merged.allExports.push(...chunk.exports);
            merged.allComments.push(...chunk.comments);
            merged.qualityIssues.push(...chunk.qualityIssues);
            merged.securityIssues.push(...chunk.securityIssues);
            
            // 合并模式计数
            for (const pattern of chunk.codePatterns) {
                merged.detectedPatterns[pattern] = (merged.detectedPatterns[pattern] || 0) + 1;
            }
        }

        // 分析跨片段的关系和洞察
        merged.crossChunkInsights = await this.analyzeCrossChunkRelationships(chunkAnalyses, fullContent);
        merged.moduleComplexity = await this.calculateModuleComplexity(merged);
        merged.codeQuality = await this.assessOverallCodeQuality(merged);

        return merged;
    }

    /**
     * 执行深度代码分析
     */
    async performDeepCodeAnalysis(content, moduleFile) {
        return {
            functions: await this.extractDetailedFunctions(content),
            classes: await this.extractDetailedClasses(content),
            variables: await this.extractVariables(content),
            complexity: await this.calculateComplexityMetrics(content),
            patterns: await this.detectCodePatterns(content),
            antiPatterns: await this.detectAntiPatterns(content),
            codeSmells: await this.detectCodeSmells(content),
            technicalDebt: await this.assessTechnicalDebt(content)
        };
    }

    /**
     * 分析模块结构
     */
    async analyzeModuleStructure(content) {
        return {
            imports: await this.extractImports(content),
            exports: await this.extractExports(content),
            moduleType: this.determineModuleType(content),
            apiSurface: await this.analyzeAPIService(content),
            publicInterface: await this.extractPublicInterface(content),
            internalStructure: await this.analyzeInternalStructure(content)
        };
    }

    /**
     * 分析代码质量
     */
    async analyzeCodeQuality(content) {
        return {
            maintainabilityIndex: await this.calculateMaintainabilityIndex(content),
            readabilityScore: await this.calculateReadabilityScore(content),
            testability: await this.assessTestability(content),
            documentation: await this.analyzeDocumentation(content),
            codeStandards: await this.checkCodingStandards(content),
            performanceIssues: await this.detectPerformanceIssues(content)
        };
    }

    /**
     * 分析业务逻辑
     */
    async analyzeBusinessLogic(content, moduleFile) {
        return {
            businessRules: await this.extractBusinessRules(content),
            workflows: await this.identifyWorkflows(content),
            dataTransformations: await this.analyzeDataTransformations(content),
            validations: await this.extractValidations(content),
            errorHandling: await this.analyzeErrorHandling(content),
            businessComplexity: await this.assessBusinessComplexity(content)
        };
    }

    // ====== 详细提取方法 ======

    async extractDetailedFunctions(content) {
        const functions = [];
        
        // 函数声明
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/g;
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            const functionBody = match[3];
            functions.push({
                name: match[1],
                parameters: this.parseParameters(match[2]),
                async: match[0].includes('async'),
                exported: match[0].includes('export'),
                type: 'declaration',
                lineNumber: this.getLineNumber(content, match.index),
                bodyLength: functionBody.length,
                complexity: this.calculateFunctionComplexity(functionBody),
                calls: this.extractFunctionCalls(functionBody),
                returns: this.extractReturnStatements(functionBody),
                throws: this.extractThrowStatements(functionBody),
                documentation: this.extractFunctionDocumentation(content, match.index)
            });
        }

        // 箭头函数
        const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>\s*(\{[\s\S]*?\n\}|\S.*)/g;
        while ((match = arrowRegex.exec(content)) !== null) {
            const functionBody = match[3];
            functions.push({
                name: match[1],
                parameters: this.parseParameters(match[2]),
                async: match[0].includes('async'),
                exported: false,
                type: 'arrow',
                lineNumber: this.getLineNumber(content, match.index),
                bodyLength: functionBody.length,
                complexity: this.calculateFunctionComplexity(functionBody),
                calls: this.extractFunctionCalls(functionBody),
                returns: this.extractReturnStatements(functionBody),
                singleExpression: !functionBody.startsWith('{')
            });
        }

        return functions;
    }

    async extractDetailedClasses(content) {
        const classes = [];
        const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\n\}/g;
        
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const superClass = match[2];
            const classBody = match[3];

            classes.push({
                name: className,
                extends: superClass || null,
                exported: match[0].includes('export'),
                lineNumber: this.getLineNumber(content, match.index),
                methods: await this.extractClassMethods(classBody),
                properties: await this.extractClassProperties(classBody),
                constructor: await this.extractConstructor(classBody),
                staticMembers: await this.extractStaticMembers(classBody),
                accessModifiers: this.analyzeAccessModifiers(classBody),
                documentation: this.extractClassDocumentation(content, match.index)
            });
        }

        return classes;
    }

    async extractVariables(content) {
        const variables = [];
        const variableRegex = /(?:const|let|var)\s+(\w+)(?:\s*:\s*\w+)?\s*=\s*([^;]+);?/g;
        
        let match;
        while ((match = variableRegex.exec(content)) !== null) {
            variables.push({
                name: match[1],
                value: match[2].trim(),
                type: match[0].includes('const') ? 'const' : 
                      match[0].includes('let') ? 'let' : 'var',
                lineNumber: this.getLineNumber(content, match.index),
                scope: this.determineVariableScope(content, match.index)
            });
        }

        return variables;
    }

    // ====== 辅助方法 ======

    async scanProjectFiles() {
        const files = [];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'mg_kiro', 'coverage'];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir);
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory() && !excludeDirs.includes(entry) && !entry.startsWith('.')) {
                        await scanDir(fullPath);
                    } else if (stats.isFile()) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`[文件扫描] 跳过目录 ${dir}: ${error.message}`);
            }
        }

        await scanDir(this.projectPath);
        return files;
    }

    isCodeFile(extension) {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cs', '.cpp', '.c', '.php'];
        return codeExtensions.includes(extension.toLowerCase());
    }

    isTestFile(filePath) {
        const testPatterns = [
            /\.(test|spec)\.(js|ts|jsx|tsx)$/,
            /\/test\//,
            /\/tests\//,
            /\/__tests__\//,
            /\.test\./,
            /\.spec\./
        ];
        
        return testPatterns.some(pattern => pattern.test(filePath));
    }

    isBuildFile(filePath) {
        const buildPatterns = [
            /\/build\//,
            /\/dist\//,
            /\/out\//,
            /\.min\./,
            /webpack/,
            /babel/
        ];
        
        return buildPatterns.some(pattern => pattern.test(filePath));
    }

    isConfigOnlyFile(fileName) {
        const configFiles = [
            'package.json',
            'tsconfig.json',
            'webpack.config.js',
            'babel.config.js',
            '.eslintrc.js',
            '.prettierrc',
            'jest.config.js'
        ];
        
        return configFiles.includes(fileName) || fileName.startsWith('.');
    }

    detectLanguageFromExtension(extension) {
        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'javascript-react',
            '.ts': 'typescript',
            '.tsx': 'typescript-react',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.php': 'php'
        };
        
        return languageMap[extension.toLowerCase()] || 'unknown';
    }

    calculateFilePriority(filePath, size) {
        let priority = 0;
        
        // 基于文件名的优先级
        const fileName = path.basename(filePath).toLowerCase();
        if (fileName.includes('index') || fileName.includes('main')) priority += 10;
        if (fileName.includes('service') || fileName.includes('manager')) priority += 8;
        if (fileName.includes('controller') || fileName.includes('handler')) priority += 7;
        if (fileName.includes('model') || fileName.includes('entity')) priority += 6;
        if (fileName.includes('util') || fileName.includes('helper')) priority += 3;
        
        // 基于文件大小的优先级（大文件优先，但不是太大）
        if (size > 1000 && size < 10000) priority += 5;
        else if (size >= 10000) priority += 3;
        else priority += 1;
        
        return priority;
    }

    trackStringState(line, inString, stringChar) {
        // 简化的字符串状态跟踪
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && line[i-1] !== '\\') {
                inString = false;
                stringChar = '';
            }
        }
    }

    isGoodSplitPoint(line) {
        // 好的分割点：空行、注释行、函数/类结束
        return line === '' || 
               line.startsWith('//') || 
               line.startsWith('/*') || 
               line === '}' || 
               line.startsWith('export') ||
               line.startsWith('import');
    }

    determineChunkType(content) {
        if (content.includes('class ')) return 'class-definition';
        if (content.includes('function ')) return 'function-definition';
        if (content.includes('import ') || content.includes('export ')) return 'module-interface';
        if (content.includes('const ') || content.includes('let ')) return 'variable-declarations';
        return 'mixed-code';
    }

    estimateChunkComplexity(content) {
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch'];
        let complexity = 0;
        
        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = content.match(regex);
            if (matches) complexity += matches.length;
        }
        
        return complexity;
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    parseParameters(paramStr) {
        if (!paramStr || paramStr.trim() === '') return [];
        
        return paramStr.split(',').map(param => {
            const trimmed = param.trim();
            const [name, defaultValue] = trimmed.split('=');
            const [paramName, type] = name.split(':');
            
            return {
                name: paramName.trim(),
                type: type ? type.trim() : null,
                hasDefault: !!defaultValue,
                defaultValue: defaultValue ? defaultValue.trim() : null
            };
        });
    }

    calculateFunctionComplexity(functionBody) {
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
        let complexity = 1; // 基础复杂度
        
        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = functionBody.match(regex);
            if (matches) complexity += matches.length;
        }
        
        return complexity;
    }

    extractFunctionCalls(functionBody) {
        const calls = [];
        const callRegex = /(\w+)\s*\(/g;
        
        let match;
        while ((match = callRegex.exec(functionBody)) !== null) {
            calls.push(match[1]);
        }
        
        return [...new Set(calls)]; // 去重
    }

    extractReturnStatements(functionBody) {
        const returns = [];
        const returnRegex = /return\s+([^;]+);?/g;
        
        let match;
        while ((match = returnRegex.exec(functionBody)) !== null) {
            returns.push(match[1].trim());
        }
        
        return returns;
    }

    extractThrowStatements(functionBody) {
        const throws = [];
        const throwRegex = /throw\s+(.*);?/g;
        
        let match;
        while ((match = throwRegex.exec(functionBody)) !== null) {
            throws.push(match[1].trim());
        }
        
        return throws;
    }

    extractFunctionDocumentation(content, functionIndex) {
        // 查找函数前的JSDoc注释
        const beforeFunction = content.substring(0, functionIndex);
        const lines = beforeFunction.split('\n');
        
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('/**')) {
                // 找到JSDoc开始，提取整个注释块
                const docLines = [];
                for (let j = i; j < lines.length; j++) {
                    docLines.push(lines[j].trim());
                    if (lines[j].trim().endsWith('*/')) break;
                }
                return docLines.join('\n');
            }
            if (line && !line.startsWith('//')) break; // 遇到非注释行停止
        }
        
        return null;
    }

    async extractClassMethods(classBody) {
        const methods = [];
        const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/g;
        
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            if (match[1] !== 'constructor') {
                methods.push({
                    name: match[1],
                    parameters: this.parseParameters(match[2]),
                    async: match[0].includes('async'),
                    static: match[0].includes('static'),
                    private: match[1].startsWith('_') || match[1].startsWith('#')
                });
            }
        }
        
        return methods;
    }

    async extractClassProperties(classBody) {
        const properties = [];
        
        // 实例属性 (this.property = value)
        const instancePropRegex = /this\.(\w+)\s*=/g;
        let match;
        while ((match = instancePropRegex.exec(classBody)) !== null) {
            if (!properties.find(p => p.name === match[1])) {
                properties.push({
                    name: match[1],
                    type: 'instance',
                    private: match[1].startsWith('_')
                });
            }
        }
        
        // 类字段声明
        const fieldRegex = /^(\s*)(static\s+)?(?:#)?(\w+)(?:\s*:\s*\w+)?\s*[=;]/gm;
        while ((match = fieldRegex.exec(classBody)) !== null) {
            properties.push({
                name: match[3],
                type: match[2] ? 'static' : 'instance',
                private: match[0].includes('#')
            });
        }
        
        return properties;
    }

    async extractConstructor(classBody) {
        const constructorMatch = classBody.match(/constructor\s*\(([^)]*)\)\s*\{([\s\S]*?)\n(\s*)\}/);
        
        if (constructorMatch) {
            return {
                parameters: this.parseParameters(constructorMatch[1]),
                hasSuper: constructorMatch[2].includes('super('),
                bodyLength: constructorMatch[2].length,
                assignments: this.extractConstructorAssignments(constructorMatch[2])
            };
        }
        
        return null;
    }

    extractConstructorAssignments(constructorBody) {
        const assignments = [];
        const assignmentRegex = /this\.(\w+)\s*=\s*([^;]+);?/g;
        
        let match;
        while ((match = assignmentRegex.exec(constructorBody)) !== null) {
            assignments.push({
                property: match[1],
                value: match[2].trim()
            });
        }
        
        return assignments;
    }

    async extractStaticMembers(classBody) {
        const staticMembers = [];
        const staticRegex = /static\s+(?:async\s+)?(\w+)/g;
        
        let match;
        while ((match = staticRegex.exec(classBody)) !== null) {
            staticMembers.push({
                name: match[1],
                type: match[0].includes('(') ? 'method' : 'property'
            });
        }
        
        return staticMembers;
    }

    analyzeAccessModifiers(classBody) {
        return {
            hasPrivateFields: classBody.includes('#'),
            hasProtectedFields: classBody.includes('protected'),
            usesUnderscoreConvention: classBody.includes('_'),
            encapsulationLevel: this.calculateEncapsulationLevel(classBody)
        };
    }

    calculateEncapsulationLevel(classBody) {
        if (classBody.includes('#')) return 'high';
        if (classBody.includes('_')) return 'medium';
        return 'low';
    }

    extractClassDocumentation(content, classIndex) {
        return this.extractFunctionDocumentation(content, classIndex);
    }

    determineVariableScope(content, variableIndex) {
        const beforeVariable = content.substring(0, variableIndex);
        const depth = (beforeVariable.match(/\{/g) || []).length - (beforeVariable.match(/\}/g) || []).length;
        
        if (depth === 0) return 'global';
        if (depth === 1) return 'module';
        return 'local';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 占位符方法，需要根据实际需求实现
    async extractImports(content) { return []; }
    async extractExports(content) { return []; }
    async extractComments(content) { return []; }
    async detectCodePatterns(content) { return []; }
    async detectQualityIssues(content) { return []; }
    async detectSecurityIssues(content) { return []; }
    async analyzeCrossChunkRelationships(chunks, content) { return {}; }
    async calculateModuleComplexity(merged) { return 'medium'; }
    async assessOverallCodeQuality(merged) { return 'good'; }
    async calculateComplexityMetrics(content) { return {}; }
    async detectAntiPatterns(content) { return []; }
    async detectCodeSmells(content) { return []; }
    async assessTechnicalDebt(content) { return {}; }
    async analyzeDependencies(content) { return {}; }
    determineModuleType(content) { return 'unknown'; }
    async analyzeAPIService(content) { return {}; }
    async extractPublicInterface(content) { return {}; }
    async analyzeInternalStructure(content) { return {}; }
    async calculateMaintainabilityIndex(content) { return 50; }
    async calculateReadabilityScore(content) { return 7; }
    async assessTestability(content) { return 'medium'; }
    async analyzeDocumentation(content) { return {}; }
    async checkCodingStandards(content) { return {}; }
    async detectPerformanceIssues(content) { return []; }
    async extractBusinessRules(content) { return []; }
    async identifyWorkflows(content) { return []; }
    async analyzeDataTransformations(content) { return []; }
    async extractValidations(content) { return []; }
    async analyzeErrorHandling(content) { return {}; }
    async assessBusinessComplexity(content) { return 'medium'; }
    async aggregateModuleInsights(analyses) { return {}; }
    async generateProcessingStats(analyses) { return {}; }
}

export default ModuleCompleteAnalyzer;