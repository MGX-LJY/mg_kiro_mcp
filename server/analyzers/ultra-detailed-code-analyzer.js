/**
 * 超详细代码分析器
 * 深度分析JavaScript代码，提取函数、类、导入导出、复杂度等详细信息
 */

import fs from 'fs';
import path from 'path';

export class UltraDetailedCodeAnalyzer {
    constructor() {
        this.totalAnalyzedFiles = 0;
        this.errors = [];
    }

    /**
     * 分析项目中的所有代码文件
     * @param {Array} files - 文件列表
     * @returns {Promise<Object>} 详细的代码分析结果
     */
    async analyzeProject(files) {
        console.log('[UltraDetailedCodeAnalyzer] 开始深度代码分析...');
        
        const analysis = {
            overview: {
                totalFiles: 0,
                analyzedFiles: 0,
                skippedFiles: 0,
                totalLines: 0,
                codeLines: 0,
                commentLines: 0,
                blankLines: 0,
                averageLinesPerFile: 0,
                averageFunctionsPerFile: 0
            },
            languages: {
                JavaScript: { files: 0, lines: 0, functions: 0, classes: 0 },
                TypeScript: { files: 0, lines: 0, functions: 0, classes: 0 },
                JSON: { files: 0, lines: 0 },
                Markdown: { files: 0, lines: 0 }
            },
            functions: [],
            classes: [],
            modules: [],
            imports: [],
            exports: [],
            complexity: {
                cyclomaticComplexity: 0,
                cognitiveComplexity: 0,
                maintenanceIndex: 0,
                technicalDebt: []
            },
            fileDetails: [],
            dependencies: {
                internal: new Set(),
                external: new Set(),
                graph: {}
            },
            codeQuality: {
                duplicateCode: [],
                longMethods: [],
                largeClasses: [],
                deepNesting: [],
                unusedCode: []
            },
            patterns: {
                designPatterns: [],
                antiPatterns: [],
                frameworkUsage: {}
            }
        };

        // 过滤代码文件
        const codeFiles = files.filter(file => 
            ['.js', '.ts', '.jsx', '.tsx'].includes(file.extension) &&
            !file.path.includes('node_modules') &&
            !file.path.includes('.git') &&
            file.size > 0
        );

        analysis.overview.totalFiles = codeFiles.length;

        for (const file of codeFiles) {
            try {
                const fileAnalysis = await this._analyzeFile(file);
                if (fileAnalysis) {
                    this._mergeFileAnalysis(analysis, fileAnalysis, file);
                    analysis.overview.analyzedFiles++;
                } else {
                    analysis.overview.skippedFiles++;
                }
            } catch (error) {
                this.errors.push(`分析文件 ${file.relativePath} 失败: ${error.message}`);
                analysis.overview.skippedFiles++;
            }
        }

        // 计算平均值和复杂度指标
        this._calculateMetrics(analysis);
        
        console.log(`[UltraDetailedCodeAnalyzer] 分析完成: ${analysis.overview.analyzedFiles}/${analysis.overview.totalFiles} 个文件`);
        return analysis;
    }

    /**
     * 深度分析单个文件
     * @param {Object} file - 文件信息
     * @returns {Promise<Object>} 文件分析结果
     */
    async _analyzeFile(file) {
        try {
            const content = fs.readFileSync(file.path, 'utf8');
            if (!content.trim()) return null;

            const fileAnalysis = {
                path: file.relativePath,
                size: file.size,
                lines: {
                    total: 0,
                    code: 0,
                    comments: 0,
                    blank: 0
                },
                functions: [],
                classes: [],
                imports: [],
                exports: [],
                variables: [],
                complexity: {
                    cyclomatic: 0,
                    cognitive: 0,
                    nestingDepth: 0
                },
                quality: {
                    maintainabilityIndex: 0,
                    duplications: [],
                    smells: []
                },
                patterns: []
            };

            // 分析代码行
            this._analyzeLines(content, fileAnalysis);
            
            // 提取函数和类
            this._extractFunctions(content, fileAnalysis);
            this._extractClasses(content, fileAnalysis);
            
            // 分析导入导出
            this._analyzeImportsExports(content, fileAnalysis);
            
            // 分析变量声明
            this._analyzeVariables(content, fileAnalysis);
            
            // 计算复杂度
            this._calculateComplexity(content, fileAnalysis);
            
            // 代码质量分析
            this._analyzeCodeQuality(content, fileAnalysis);
            
            // 模式识别
            this._identifyPatterns(content, fileAnalysis);

            return fileAnalysis;

        } catch (error) {
            console.warn(`[UltraDetailedCodeAnalyzer] 无法分析文件 ${file.relativePath}:`, error.message);
            return null;
        }
    }

    /**
     * 分析代码行
     */
    _analyzeLines(content, fileAnalysis) {
        const lines = content.split('\n');
        let inBlockComment = false;
        let inDocComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            fileAnalysis.lines.total++;
            
            if (!trimmedLine) {
                fileAnalysis.lines.blank++;
                continue;
            }
            
            // 检查块注释
            if (trimmedLine.includes('/*')) {
                inBlockComment = true;
                if (trimmedLine.includes('/**')) {
                    inDocComment = true;
                }
            }
            
            if (trimmedLine.includes('*/')) {
                fileAnalysis.lines.comments++;
                inBlockComment = false;
                inDocComment = false;
                continue;
            }
            
            if (inBlockComment) {
                fileAnalysis.lines.comments++;
                continue;
            }
            
            // 单行注释
            if (trimmedLine.startsWith('//')) {
                fileAnalysis.lines.comments++;
                continue;
            }
            
            // 混合行（代码+注释）
            if (trimmedLine.includes('//')) {
                fileAnalysis.lines.code++;
                fileAnalysis.lines.comments++;
                continue;
            }
            
            fileAnalysis.lines.code++;
        }
    }

    /**
     * 提取函数定义
     */
    _extractFunctions(content, fileAnalysis) {
        // 匹配各种函数定义模式
        const patterns = [
            // function declarations
            /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
            // arrow functions
            /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
            // method definitions
            /(\w+)\s*\(([^)]*)\)\s*\{/g,
            // async methods
            /async\s+(\w+)\s*\(([^)]*)\)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const functionName = match[1];
                const params = match[2];
                
                // 跳过一些非函数的匹配
                if (['if', 'for', 'while', 'switch', 'catch'].includes(functionName)) {
                    continue;
                }

                const functionInfo = {
                    name: functionName,
                    parameters: params ? params.split(',').map(p => p.trim()).filter(p => p) : [],
                    line: this._getLineNumber(content, match.index),
                    isAsync: content.substring(Math.max(0, match.index - 20), match.index).includes('async'),
                    isExported: content.substring(Math.max(0, match.index - 20), match.index).includes('export'),
                    complexity: this._calculateFunctionComplexity(this._extractFunctionBody(content, match.index)),
                    length: 0 // 将在后续计算
                };

                // 计算函数体长度
                const functionBody = this._extractFunctionBody(content, match.index);
                functionInfo.length = functionBody.split('\n').length;

                fileAnalysis.functions.push(functionInfo);
            }
        });

        // 去重（同一个函数可能被多个模式匹配）
        fileAnalysis.functions = fileAnalysis.functions.filter((func, index, arr) => 
            arr.findIndex(f => f.name === func.name && f.line === func.line) === index
        );
    }

    /**
     * 提取类定义
     */
    _extractClasses(content, fileAnalysis) {
        const classPattern = /(?:export\s+)?(?:default\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g;
        let match;
        
        while ((match = classPattern.exec(content)) !== null) {
            const className = match[1];
            const superClass = match[2];
            
            const classInfo = {
                name: className,
                superClass: superClass || null,
                line: this._getLineNumber(content, match.index),
                isExported: content.substring(Math.max(0, match.index - 20), match.index).includes('export'),
                methods: [],
                properties: [],
                complexity: 0
            };

            // 提取类的方法和属性
            const classBody = this._extractClassBody(content, match.index);
            this._analyzeClassMembers(classBody, classInfo);

            fileAnalysis.classes.push(classInfo);
        }
    }

    /**
     * 分析导入导出
     */
    _analyzeImportsExports(content, fileAnalysis) {
        // 分析导入
        const importPatterns = [
            /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g,
            /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/g
        ];

        importPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importInfo = {
                    type: pattern.source.includes('import') ? 'ES6' : 'CommonJS',
                    items: match[1] || match[2] || match[3],
                    from: match[4] || match[7],
                    line: this._getLineNumber(content, match.index),
                    isExternal: !match[4]?.startsWith('.') && !match[7]?.startsWith('.')
                };

                fileAnalysis.imports.push(importInfo);
            }
        });

        // 分析导出
        const exportPatterns = [
            /export\s+(?:\{([^}]+)\}|(?:default\s+)?(\w+)|(?:const|let|var)\s+(\w+))/g,
            /module\.exports\s*=\s*(\w+)/g,
            /exports\.(\w+)\s*=/g
        ];

        exportPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const exportInfo = {
                    type: pattern.source.includes('export') ? 'ES6' : 'CommonJS',
                    items: match[1] || match[2] || match[3],
                    line: this._getLineNumber(content, match.index),
                    isDefault: content.substring(match.index, match.index + 50).includes('default')
                };

                fileAnalysis.exports.push(exportInfo);
            }
        });
    }

    /**
     * 分析变量声明
     */
    _analyzeVariables(content, fileAnalysis) {
        const variablePattern = /(?:const|let|var)\s+(\w+)\s*=/g;
        let match;
        
        while ((match = variablePattern.exec(content)) !== null) {
            const variableInfo = {
                name: match[1],
                type: content.substring(match.index, match.index + 5).trim(),
                line: this._getLineNumber(content, match.index),
                scope: this._determineScope(content, match.index)
            };

            fileAnalysis.variables.push(variableInfo);
        }
    }

    /**
     * 计算复杂度
     */
    _calculateComplexity(content, fileAnalysis) {
        // 圈复杂度计算
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch'];
        const operatorKeywords = ['&&', '||', '\\?']; // 需要转义的操作符
        let cyclomaticComplexity = 1; // 基础复杂度为1

        complexityKeywords.forEach(keyword => {
            const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
            if (matches) {
                cyclomaticComplexity += matches.length;
            }
        });

        // 单独处理操作符
        operatorKeywords.forEach(operator => {
            const matches = content.match(new RegExp(operator, 'g'));
            if (matches) {
                cyclomaticComplexity += matches.length;
            }
        });

        // 认知复杂度（基于嵌套深度）
        let cognitiveComplexity = 0;
        let nestingLevel = 0;
        let maxNesting = 0;

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            
            // 计算嵌套层级
            if (trimmed.includes('{')) nestingLevel++;
            if (trimmed.includes('}')) nestingLevel--;
            
            maxNesting = Math.max(maxNesting, nestingLevel);
            
            // 认知复杂度增加规则
            const allKeywords = [...complexityKeywords, '&&', '||'];
            if (allKeywords.some(keyword => {
                if (keyword === '&&' || keyword === '||') {
                    return trimmed.includes(keyword);
                }
                return new RegExp(`\\b${keyword}\\b`).test(trimmed);
            })) {
                cognitiveComplexity += nestingLevel + 1;
            }
        }

        fileAnalysis.complexity = {
            cyclomatic: cyclomaticComplexity,
            cognitive: cognitiveComplexity,
            nestingDepth: maxNesting
        };
    }

    /**
     * 代码质量分析
     */
    _analyzeCodeQuality(content, fileAnalysis) {
        const lines = content.split('\n');
        
        // 检查长方法
        fileAnalysis.functions.forEach(func => {
            if (func.length > 50) {
                fileAnalysis.quality.smells.push({
                    type: 'LongMethod',
                    function: func.name,
                    line: func.line,
                    length: func.length,
                    suggestion: '考虑将长方法拆分为多个较小的方法'
                });
            }
        });

        // 检查深层嵌套
        if (fileAnalysis.complexity.nestingDepth > 4) {
            fileAnalysis.quality.smells.push({
                type: 'DeepNesting',
                depth: fileAnalysis.complexity.nestingDepth,
                suggestion: '考虑重构以减少嵌套层级'
            });
        }

        // 检查重复代码
        this._detectDuplicateCode(lines, fileAnalysis);

        // 计算可维护性指数
        fileAnalysis.quality.maintainabilityIndex = this._calculateMaintainabilityIndex(fileAnalysis);
    }

    /**
     * 识别设计模式
     */
    _identifyPatterns(content, fileAnalysis) {
        // 单例模式
        if (content.includes('getInstance') || content.match(/class\s+\w+.*\{\s*static\s+instance/)) {
            fileAnalysis.patterns.push('Singleton');
        }

        // 观察者模式
        if (content.includes('addEventListener') || content.includes('emit') || content.includes('subscribe')) {
            fileAnalysis.patterns.push('Observer');
        }

        // 工厂模式
        if (content.match(/create\w+|make\w+|\w+Factory/)) {
            fileAnalysis.patterns.push('Factory');
        }

        // 模块模式
        if (content.includes('export') || content.includes('module.exports')) {
            fileAnalysis.patterns.push('Module');
        }

        // Express.js 模式
        if (content.includes('app.get') || content.includes('app.post') || content.includes('router.')) {
            fileAnalysis.patterns.push('Express-Route');
        }

        // 中间件模式
        if (content.includes('next()') || content.match(/\(req,\s*res,\s*next\)/)) {
            fileAnalysis.patterns.push('Middleware');
        }
    }

    // === 辅助方法 ===

    /**
     * 获取指定位置的行号
     */
    _getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * 提取函数体
     */
    _extractFunctionBody(content, startIndex) {
        let braceCount = 0;
        let i = content.indexOf('{', startIndex);
        if (i === -1) return '';

        const start = i;
        braceCount = 1;
        i++;

        while (i < content.length && braceCount > 0) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') braceCount--;
            i++;
        }

        return content.substring(start + 1, i - 1);
    }

    /**
     * 提取类体
     */
    _extractClassBody(content, startIndex) {
        return this._extractFunctionBody(content, startIndex); // 使用相同的逻辑
    }

    /**
     * 分析类成员
     */
    _analyzeClassMembers(classBody, classInfo) {
        // 提取方法
        const methodPattern = /(\w+)\s*\(([^)]*)\)\s*\{/g;
        let match;
        
        while ((match = methodPattern.exec(classBody)) !== null) {
            classInfo.methods.push({
                name: match[1],
                parameters: match[2] ? match[2].split(',').map(p => p.trim()) : [],
                isPrivate: match[1].startsWith('_')
            });
        }

        // 提取属性
        const propertyPattern = /this\.(\w+)\s*=/g;
        while ((match = propertyPattern.exec(classBody)) !== null) {
            if (!classInfo.properties.includes(match[1])) {
                classInfo.properties.push(match[1]);
            }
        }
    }

    /**
     * 计算函数复杂度
     */
    _calculateFunctionComplexity(functionBody) {
        if (!functionBody) return 1;
        
        const keywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch'];
        const operators = ['&&', '||', '\\?'];
        let complexity = 1;
        
        keywords.forEach(keyword => {
            const matches = functionBody.match(new RegExp(`\\b${keyword}\\b`, 'g'));
            if (matches) complexity += matches.length;
        });
        
        operators.forEach(operator => {
            const matches = functionBody.match(new RegExp(operator, 'g'));
            if (matches) complexity += matches.length;
        });
        
        return complexity;
    }

    /**
     * 确定变量作用域
     */
    _determineScope(content, index) {
        const beforeContent = content.substring(0, index);
        const functionCount = (beforeContent.match(/function\s+\w+/g) || []).length;
        const classCount = (beforeContent.match(/class\s+\w+/g) || []).length;
        
        if (functionCount > 0) return 'function';
        if (classCount > 0) return 'class';
        return 'global';
    }

    /**
     * 检测重复代码
     */
    _detectDuplicateCode(lines, fileAnalysis) {
        const codeBlocks = new Map();
        
        // 检查3行以上的重复块
        for (let i = 0; i < lines.length - 2; i++) {
            const block = lines.slice(i, i + 3).join('\n').trim();
            if (block.length > 50) { // 只检查有意义的代码块
                if (codeBlocks.has(block)) {
                    fileAnalysis.quality.duplications.push({
                        block,
                        lines: [codeBlocks.get(block), i + 1],
                        suggestion: '考虑提取为公共函数'
                    });
                } else {
                    codeBlocks.set(block, i + 1);
                }
            }
        }
    }

    /**
     * 计算可维护性指数
     */
    _calculateMaintainabilityIndex(fileAnalysis) {
        const { cyclomatic, cognitive } = fileAnalysis.complexity;
        const linesOfCode = fileAnalysis.lines.code;
        
        // 简化的可维护性指数计算
        let index = 100;
        index -= cyclomatic * 2;
        index -= cognitive * 1.5;
        index -= Math.log(linesOfCode) * 5;
        
        return Math.max(0, Math.round(index));
    }

    /**
     * 合并文件分析结果
     */
    _mergeFileAnalysis(analysis, fileAnalysis, file) {
        // 更新总览统计
        analysis.overview.totalLines += fileAnalysis.lines.total;
        analysis.overview.codeLines += fileAnalysis.lines.code;
        analysis.overview.commentLines += fileAnalysis.lines.comments;
        analysis.overview.blankLines += fileAnalysis.lines.blank;

        // 更新语言统计
        const lang = file.extension === '.ts' || file.extension === '.tsx' ? 'TypeScript' : 'JavaScript';
        analysis.languages[lang].files++;
        analysis.languages[lang].lines += fileAnalysis.lines.total;
        analysis.languages[lang].functions += fileAnalysis.functions.length;
        analysis.languages[lang].classes += fileAnalysis.classes.length;

        // 添加到详细列表
        analysis.functions.push(...fileAnalysis.functions.map(f => ({...f, file: file.relativePath})));
        analysis.classes.push(...fileAnalysis.classes.map(c => ({...c, file: file.relativePath})));
        analysis.imports.push(...fileAnalysis.imports.map(i => ({...i, file: file.relativePath})));
        analysis.exports.push(...fileAnalysis.exports.map(e => ({...e, file: file.relativePath})));

        // 更新复杂度
        analysis.complexity.cyclomaticComplexity += fileAnalysis.complexity.cyclomatic;
        analysis.complexity.cognitiveComplexity += fileAnalysis.complexity.cognitive;

        // 添加文件详情
        analysis.fileDetails.push({
            path: file.relativePath,
            size: file.size,
            lines: fileAnalysis.lines,
            functions: fileAnalysis.functions.length,
            classes: fileAnalysis.classes.length,
            complexity: fileAnalysis.complexity,
            quality: fileAnalysis.quality,
            patterns: fileAnalysis.patterns
        });

        // 构建依赖图
        fileAnalysis.imports.forEach(imp => {
            if (imp.isExternal) {
                analysis.dependencies.external.add(imp.from);
            } else {
                analysis.dependencies.internal.add(imp.from);
                if (!analysis.dependencies.graph[file.relativePath]) {
                    analysis.dependencies.graph[file.relativePath] = [];
                }
                analysis.dependencies.graph[file.relativePath].push(imp.from);
            }
        });

        // 代码质量问题
        if (fileAnalysis.quality.smells.length > 0) {
            analysis.complexity.technicalDebt.push(...fileAnalysis.quality.smells.map(smell => ({
                ...smell,
                file: file.relativePath
            })));
        }

        // 长方法统计
        fileAnalysis.functions.forEach(func => {
            if (func.length > 30) {
                analysis.codeQuality.longMethods.push({
                    name: func.name,
                    file: file.relativePath,
                    line: func.line,
                    length: func.length
                });
            }
        });

        // 设计模式使用
        fileAnalysis.patterns.forEach(pattern => {
            if (!analysis.patterns.frameworkUsage[pattern]) {
                analysis.patterns.frameworkUsage[pattern] = 0;
            }
            analysis.patterns.frameworkUsage[pattern]++;
        });
    }

    /**
     * 计算最终指标
     */
    _calculateMetrics(analysis) {
        if (analysis.overview.analyzedFiles > 0) {
            analysis.overview.averageLinesPerFile = Math.round(analysis.overview.totalLines / analysis.overview.analyzedFiles);
            analysis.overview.averageFunctionsPerFile = Math.round(analysis.functions.length / analysis.overview.analyzedFiles);
        }

        // 计算平均复杂度
        if (analysis.functions.length > 0) {
            const totalComplexity = analysis.functions.reduce((sum, func) => sum + func.complexity, 0);
            analysis.complexity.averageFunctionComplexity = Math.round(totalComplexity / analysis.functions.length);
        }

        // 转换Set为Array
        analysis.dependencies.external = Array.from(analysis.dependencies.external);
        analysis.dependencies.internal = Array.from(analysis.dependencies.internal);
    }
}

export default UltraDetailedCodeAnalyzer;