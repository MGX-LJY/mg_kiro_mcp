/**
 * 代码结构分析器 - 智能代码组织分析
 * 
 * 核心功能：
 * - 分析代码结构：函数、类、模块、导入导出
 * - 识别代码块边界和依赖关系
 * - 为批次切分提供智能边界检测
 * - 计算代码复杂度和重要性评分
 * 
 * 设计理念：
 * - 多语言支持：不同语言有不同的结构模式
 * - 智能识别：准确识别代码边界，避免破坏逻辑完整性
 * - 层次分析：从文件级到函数级的多层次结构分析
 * - 依赖感知：理解代码之间的依赖关系
 */

export class CodeStructureAnalyzer {
    constructor(config = {}) {
        this.config = {
            maxAnalysisDepth: 5,
            enableComplexityAnalysis: true,
            enableDependencyAnalysis: true,
            ...config
        };

        // 语言特定的代码结构规则
        this.languageRules = {
            javascript: {
                functionPatterns: [
                    /function\s+(\w+)\s*\([^)]*\)\s*{/g,
                    /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*{/g,
                    /(\w+)\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*{/g,
                    /(\w+)\s*\([^)]*\)\s*{/g // 类方法
                ],
                classPatterns: [
                    /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g
                ],
                exportPatterns: [
                    /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
                    /export\s*{\s*([^}]+)\s*}/g,
                    /module\.exports\s*=\s*(\w+)/g
                ],
                importPatterns: [
                    /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
                    /const\s+(?:{[^}]+}|\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
                ],
                blockDelimiters: ['{', '}'],
                commentPatterns: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
            },
            typescript: {
                functionPatterns: [
                    /function\s+(\w+)\s*[<]?[^>]*[>]?\s*\([^)]*\)\s*:\s*[^{]*{/g,
                    /const\s+(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*{/g,
                    /(\w+)\s*\([^)]*\)\s*:\s*[^{]*{/g // 类方法
                ],
                classPatterns: [
                    /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*{/g
                ],
                interfacePatterns: [
                    /interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*{/g
                ],
                typePatterns: [
                    /type\s+(\w+)(?:\s*<[^>]+>)?\s*=/g
                ],
                exportPatterns: [
                    /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g,
                    /export\s*{\s*([^}]+)\s*}/g
                ],
                importPatterns: [
                    /import\s+(?:type\s+)?(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g
                ],
                blockDelimiters: ['{', '}'],
                commentPatterns: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
            },
            python: {
                functionPatterns: [
                    /def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:/g,
                    /async\s+def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:/g
                ],
                classPatterns: [
                    /class\s+(\w+)(?:\([^)]*\))?\s*:/g
                ],
                exportPatterns: [
                    /__all__\s*=\s*\[([^\]]+)\]/g
                ],
                importPatterns: [
                    /from\s+([^\s]+)\s+import\s+([^#\n]+)/g,
                    /import\s+([^#\n]+)/g
                ],
                blockDelimiters: [':', ''],
                commentPatterns: [/#.*$/gm, /'''[\s\S]*?'''/g, /"""[\s\S]*?"""/g]
            },
            java: {
                functionPatterns: [
                    /(?:public|private|protected|static)?\s*(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\s*{/g
                ],
                classPatterns: [
                    /(?:public|private|protected)?\s*(?:abstract|final)?\s*class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*{/g
                ],
                interfacePatterns: [
                    /(?:public|private|protected)?\s*interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*{/g
                ],
                exportPatterns: [
                    /public\s+(?:class|interface)\s+(\w+)/g
                ],
                importPatterns: [
                    /import\s+(?:static\s+)?([^;]+);/g
                ],
                blockDelimiters: ['{', '}'],
                commentPatterns: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
            },
            default: {
                functionPatterns: [/function\s+(\w+)\s*\([^)]*\)\s*{/g],
                classPatterns: [/class\s+(\w+)\s*{/g],
                exportPatterns: [/export\s+(\w+)/g],
                importPatterns: [/import.*from\s+['"`]([^'"`]+)['"`]/g],
                blockDelimiters: ['{', '}'],
                commentPatterns: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm]
            }
        };
    }

    /**
     * 分析代码结构
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     * @param {Object} languageProfile - 语言配置信息
     * @returns {Promise<Object>} 代码结构分析结果
     */
    async analyze(filePath, content, languageProfile = null) {
        try {
            if (!content || typeof content !== 'string') {
                throw new Error('无效的文件内容');
            }

            console.log(`[CodeStructureAnalyzer] 分析代码结构: ${filePath}`);

            // 检测语言
            const language = this._detectLanguage(filePath, languageProfile);
            const rules = this.languageRules[language] || this.languageRules.default;

            // 预处理：移除注释
            const cleanContent = this._removeComments(content, rules);

            // 分析代码结构
            const structure = {
                language,
                filePath,
                totalLines: content.split('\n').length,
                functions: this._analyzeFunctions(cleanContent, rules),
                classes: this._analyzeClasses(cleanContent, rules),
                interfaces: this._analyzeInterfaces(cleanContent, rules),
                types: this._analyzeTypes(cleanContent, rules),
                imports: this._analyzeImports(cleanContent, rules),
                exports: this._analyzeExports(cleanContent, rules),
                blocks: this._analyzeCodeBlocks(cleanContent, rules),
                complexity: this._analyzeComplexity(cleanContent, rules),
                dependencies: this._analyzeDependencies(cleanContent, rules)
            };

            // 计算重要性评分
            structure.importanceScore = this._calculateImportanceScore(structure);

            // 计算可分割性评分
            structure.splittabilityScore = this._calculateSplittabilityScore(structure);

            return {
                success: true,
                structure,
                analysisTimestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`[CodeStructureAnalyzer] 分析失败: ${filePath}`, error);
            
            return {
                success: false,
                error: error.message,
                structure: null,
                analysisTimestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 分析函数结构
     * @private
     */
    _analyzeFunctions(content, rules) {
        const functions = [];
        
        rules.functionPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const functionName = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                // 寻找函数结束位置
                const endInfo = this._findBlockEnd(content, startIndex, rules.blockDelimiters);
                
                functions.push({
                    name: functionName,
                    startLine,
                    endLine: endInfo.endLine,
                    startIndex,
                    endIndex: endInfo.endIndex,
                    type: 'function',
                    complexity: this._calculateFunctionComplexity(
                        content.substring(startIndex, endInfo.endIndex)
                    )
                });
            }
        });

        return functions;
    }

    /**
     * 分析类结构
     * @private
     */
    _analyzeClasses(content, rules) {
        const classes = [];
        
        rules.classPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const className = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                // 寻找类结束位置
                const endInfo = this._findBlockEnd(content, startIndex, rules.blockDelimiters);
                
                // 分析类内方法
                const classContent = content.substring(startIndex, endInfo.endIndex);
                const methods = this._analyzeClassMethods(classContent, rules);
                
                classes.push({
                    name: className,
                    startLine,
                    endLine: endInfo.endLine,
                    startIndex,
                    endIndex: endInfo.endIndex,
                    type: 'class',
                    methods,
                    complexity: this._calculateClassComplexity(classContent, methods)
                });
            }
        });

        return classes;
    }

    /**
     * 分析接口结构（TypeScript/Java）
     * @private
     */
    _analyzeInterfaces(content, rules) {
        if (!rules.interfacePatterns) return [];
        
        const interfaces = [];
        
        rules.interfacePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const interfaceName = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                const endInfo = this._findBlockEnd(content, startIndex, rules.blockDelimiters);
                
                interfaces.push({
                    name: interfaceName,
                    startLine,
                    endLine: endInfo.endLine,
                    startIndex,
                    endIndex: endInfo.endIndex,
                    type: 'interface'
                });
            }
        });

        return interfaces;
    }

    /**
     * 分析类型定义（TypeScript）
     * @private
     */
    _analyzeTypes(content, rules) {
        if (!rules.typePatterns) return [];
        
        const types = [];
        
        rules.typePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const typeName = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                types.push({
                    name: typeName,
                    startLine,
                    startIndex,
                    type: 'type'
                });
            }
        });

        return types;
    }

    /**
     * 分析导入语句
     * @private
     */
    _analyzeImports(content, rules) {
        const imports = [];
        
        rules.importPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                imports.push({
                    path: importPath,
                    startLine,
                    startIndex,
                    type: 'import',
                    isRelative: importPath.startsWith('.'),
                    isNodeModule: !importPath.startsWith('.')
                });
            }
        });

        return imports;
    }

    /**
     * 分析导出语句
     * @private
     */
    _analyzeExports(content, rules) {
        const exports = [];
        
        rules.exportPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const exportName = match[1];
                const startIndex = match.index;
                const startLine = content.substring(0, startIndex).split('\n').length;
                
                exports.push({
                    name: exportName,
                    startLine,
                    startIndex,
                    type: 'export'
                });
            }
        });

        return exports;
    }

    /**
     * 分析代码块结构
     * @private
     */
    _analyzeCodeBlocks(content, rules) {
        const blocks = [];
        const [openDelimiter, closeDelimiter] = rules.blockDelimiters;
        
        let depth = 0;
        let blockStart = -1;
        let blockStartLine = 0;
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            
            if (char === openDelimiter) {
                if (depth === 0) {
                    blockStart = i;
                    blockStartLine = content.substring(0, i).split('\n').length;
                }
                depth++;
            } else if (char === closeDelimiter && closeDelimiter !== '') {
                depth--;
                if (depth === 0 && blockStart !== -1) {
                    const blockEndLine = content.substring(0, i).split('\n').length;
                    blocks.push({
                        startIndex: blockStart,
                        endIndex: i + 1,
                        startLine: blockStartLine,
                        endLine: blockEndLine,
                        depth: 1,
                        type: 'block'
                    });
                }
            }
        }

        return blocks;
    }

    /**
     * 分析代码复杂度
     * @private
     */
    _analyzeComplexity(content, rules) {
        if (!this.config.enableComplexityAnalysis) {
            return { score: 0, factors: [] };
        }

        const factors = [];
        let score = 0;

        // 循环复杂度
        const loopPatterns = [/for\s*\(/g, /while\s*\(/g, /do\s*{/g, /forEach\s*\(/g];
        loopPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                score += matches.length * 2;
                factors.push({ type: 'loops', count: matches.length, weight: 2 });
            }
        });

        // 条件复杂度
        const conditionPatterns = [/if\s*\(/g, /else\s+if\s*\(/g, /switch\s*\(/g, /case\s+/g];
        conditionPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                score += matches.length * 1.5;
                factors.push({ type: 'conditions', count: matches.length, weight: 1.5 });
            }
        });

        // 嵌套深度
        const maxNesting = this._calculateMaxNesting(content, rules.blockDelimiters);
        score += maxNesting * 3;
        factors.push({ type: 'nesting', depth: maxNesting, weight: 3 });

        return { score, factors, maxNesting };
    }

    /**
     * 分析依赖关系
     * @private
     */
    _analyzeDependencies(content, rules) {
        if (!this.config.enableDependencyAnalysis) {
            return { internal: [], external: [], score: 0 };
        }

        const internal = [];
        const external = [];

        // 从导入语句中提取依赖
        rules.importPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                
                if (importPath.startsWith('.')) {
                    internal.push(importPath);
                } else {
                    external.push(importPath);
                }
            }
        });

        const score = internal.length * 0.5 + external.length * 0.3;

        return { internal, external, score };
    }

    /**
     * 寻找代码块结束位置
     * @private
     */
    _findBlockEnd(content, startIndex, delimiters) {
        const [openDelimiter, closeDelimiter] = delimiters;
        
        // Python风格（用缩进）
        if (closeDelimiter === '') {
            return this._findPythonBlockEnd(content, startIndex);
        }

        let depth = 0;
        let found = false;
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            
            if (char === openDelimiter) {
                depth++;
                found = true;
            } else if (char === closeDelimiter) {
                depth--;
                if (depth === 0 && found) {
                    const endLine = content.substring(0, i).split('\n').length;
                    return { endIndex: i + 1, endLine };
                }
            }
        }
        
        // 如果没找到结束，返回文件末尾
        const endLine = content.split('\n').length;
        return { endIndex: content.length, endLine };
    }

    /**
     * 寻找Python代码块结束（基于缩进）
     * @private
     */
    _findPythonBlockEnd(content, startIndex) {
        const lines = content.split('\n');
        const startLineIndex = content.substring(0, startIndex).split('\n').length - 1;
        
        // 获取函数/类定义行的缩进
        const defLine = lines[startLineIndex];
        const baseIndent = defLine.match(/^(\s*)/)[1].length;
        
        // 寻找下一个相同或更少缩进的行
        for (let i = startLineIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue; // 跳过空行
            
            const currentIndent = lines[i].match(/^(\s*)/)[1].length;
            if (currentIndent <= baseIndent) {
                const endIndex = lines.slice(0, i).join('\n').length;
                return { endIndex, endLine: i };
            }
        }
        
        // 如果没找到，返回文件末尾
        return { endIndex: content.length, endLine: lines.length };
    }

    /**
     * 计算最大嵌套深度
     * @private
     */
    _calculateMaxNesting(content, delimiters) {
        const [openDelimiter, closeDelimiter] = delimiters;
        
        if (closeDelimiter === '') return 1; // Python风格
        
        let maxDepth = 0;
        let currentDepth = 0;
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (char === openDelimiter) {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === closeDelimiter) {
                currentDepth--;
            }
        }
        
        return maxDepth;
    }

    /**
     * 计算函数复杂度
     * @private
     */
    _calculateFunctionComplexity(functionContent) {
        let complexity = 1; // 基础复杂度
        
        // 分支语句
        const branches = functionContent.match(/if\s*\(|else\s+if\s*\(|switch\s*\(/g);
        if (branches) complexity += branches.length;
        
        // 循环语句
        const loops = functionContent.match(/for\s*\(|while\s*\(|do\s*{/g);
        if (loops) complexity += loops.length;
        
        // 异常处理
        const exceptions = functionContent.match(/try\s*{|catch\s*\(|except\s*:/g);
        if (exceptions) complexity += exceptions.length;
        
        return complexity;
    }

    /**
     * 计算类复杂度
     * @private
     */
    _calculateClassComplexity(classContent, methods) {
        const methodComplexity = methods.reduce((sum, method) => sum + (method.complexity || 1), 0);
        const baseComplexity = Math.ceil(classContent.length / 1000); // 基于长度
        return methodComplexity + baseComplexity;
    }

    /**
     * 分析类方法
     * @private
     */
    _analyzeClassMethods(classContent, rules) {
        // 重用函数分析逻辑
        return this._analyzeFunctions(classContent, rules);
    }

    /**
     * 计算重要性评分
     * @private
     */
    _calculateImportanceScore(structure) {
        let score = 0;
        
        // 导出项增加重要性
        score += structure.exports.length * 5;
        
        // 类和接口增加重要性
        score += structure.classes.length * 4;
        score += structure.interfaces.length * 3;
        
        // 函数数量
        score += structure.functions.length * 2;
        
        // 复杂度影响
        score += (structure.complexity.score || 0) * 0.1;
        
        // 依赖关系影响
        score += structure.dependencies.external.length * 1;
        score += structure.dependencies.internal.length * 0.5;
        
        return Math.min(score, 100); // 限制最大值
    }

    /**
     * 计算可分割性评分
     * @private
     */
    _calculateSplittabilityScore(structure) {
        let score = 50; // 基础分割性
        
        // 函数越多，越容易分割
        score += Math.min(structure.functions.length * 2, 20);
        
        // 类增加分割难度
        score -= structure.classes.length * 3;
        
        // 高复杂度降低分割性
        score -= (structure.complexity.maxNesting || 0) * 5;
        
        // 大量内部依赖降低分割性
        score -= structure.dependencies.internal.length * 2;
        
        return Math.max(Math.min(score, 100), 0); // 限制在0-100范围
    }

    /**
     * 移除注释
     * @private
     */
    _removeComments(content, rules) {
        let cleanContent = content;
        
        rules.commentPatterns.forEach(pattern => {
            cleanContent = cleanContent.replace(pattern, '');
        });
        
        return cleanContent;
    }

    /**
     * 检测语言
     * @private
     */
    _detectLanguage(filePath, languageProfile = null) {
        // 优先使用提供的语言配置
        if (languageProfile && languageProfile.primary) {
            return languageProfile.primary.toLowerCase();
        }

        // 基于文件扩展名检测
        const ext = filePath.split('.').pop()?.toLowerCase();
        
        const extMap = {
            js: 'javascript',
            jsx: 'javascript',
            mjs: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            java: 'java',
            go: 'go',
            rs: 'rust',
            cs: 'c#'
        };

        return extMap[ext] || 'default';
    }

    /**
     * 获取分析器状态
     */
    getAnalyzerStatus() {
        return {
            name: 'CodeStructureAnalyzer',
            version: '1.0.0',
            config: this.config,
            supportedLanguages: Object.keys(this.languageRules),
            isReady: true
        };
    }
}

export default CodeStructureAnalyzer;