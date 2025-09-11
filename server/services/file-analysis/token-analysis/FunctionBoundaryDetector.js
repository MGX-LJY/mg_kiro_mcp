/**
 * 函数边界检测器 - 智能代码切割点检测
 * 
 * 核心功能：
 * - 智能检测代码切割的最佳位置
 * - 避免破坏函数、类、模块的完整性
 * - 识别安全的分割边界点
 * - 为大文件多批次策略提供精确切割指导
 * 
 * 设计理念：
 * - 语义完整性：确保每个切片都是语义完整的代码单元
 * - 上下文保持：保持必要的导入和依赖关系
 * - 智能边界：基于AST和语法结构的智能边界检测
 * - 灵活策略：支持多种切割策略（函数级、类级、模块级）
 */

export class FunctionBoundaryDetector {
    constructor(config = {}) {
        this.config = {
            minChunkSize: 1000,         // 最小切片大小（Token数）
            maxChunkSize: 18000,        // 最大切片大小（Token数）
            overlapSize: 200,           // 切片重叠大小（Token数）
            preferredBoundaries: ['function', 'class', 'module'],
            preserveImports: true,      // 保持导入语句
            ...config
        };

        // 语言特定的边界检测规则
        this.boundaryRules = {
            javascript: {
                safeBoundaries: [
                    // 函数边界
                    /^(\s*)function\s+\w+/m,
                    /^(\s*)const\s+\w+\s*=\s*(?:async\s+)?\(/m,
                    /^(\s*)export\s+(?:default\s+)?(?:function|class)/m,
                    
                    // 类边界
                    /^(\s*)class\s+\w+/m,
                    /^(\s*)export\s+(?:default\s+)?class\s+\w+/m,
                    
                    // 模块边界
                    /^(\s*)\/\*\*[\s\S]*?\*\//m, // JSDoc注释
                    /^(\s*)\/\*[\s\S]*?\*\//m,   // 块注释
                    /^(\s*)\/\/\s*=+/m,          // 分隔注释
                    
                    // 导入/导出边界
                    /^(\s*)import\s+/m,
                    /^(\s*)export\s+/m
                ],
                avoidBoundaries: [
                    // 避免在这些位置切割
                    /if\s*\(/,           // 条件语句内
                    /for\s*\(/,          // 循环语句内
                    /while\s*\(/,        // 循环语句内
                    /switch\s*\(/,       // 开关语句内
                    /try\s*{/,           // 异常处理内
                    /{\s*$/,             // 开放括号后
                    /^\s*}/              // 单独的关闭括号
                ],
                contextMarkers: [
                    'import', 'const', 'let', 'var', 'function', 'class'
                ]
            },
            typescript: {
                safeBoundaries: [
                    /^(\s*)function\s+\w+/m,
                    /^(\s*)const\s+\w+\s*[:=]/m,
                    /^(\s*)export\s+(?:default\s+)?(?:function|class|interface|type)/m,
                    /^(\s*)class\s+\w+/m,
                    /^(\s*)interface\s+\w+/m,
                    /^(\s*)type\s+\w+/m,
                    /^(\s*)\/\*\*[\s\S]*?\*\//m,
                    /^(\s*)import\s+/m,
                    /^(\s*)export\s+/m
                ],
                avoidBoundaries: [
                    /if\s*\(/, /for\s*\(/, /while\s*\(/, /switch\s*\(/,
                    /try\s*{/, /{\s*$/, /^\s*}/
                ],
                contextMarkers: [
                    'import', 'const', 'let', 'var', 'function', 'class', 'interface', 'type'
                ]
            },
            python: {
                safeBoundaries: [
                    /^(\s*)def\s+\w+/m,
                    /^(\s*)async\s+def\s+\w+/m,
                    /^(\s*)class\s+\w+/m,
                    /^(\s*)#\s*=+/m,           // 分隔注释
                    /^(\s*)"""[\s\S]*?"""/m,   // 文档字符串
                    /^(\s*)'''[\s\S]*?'''/m,   // 文档字符串
                    /^(\s*)from\s+/m,
                    /^(\s*)import\s+/m
                ],
                avoidBoundaries: [
                    /if\s+/, /elif\s+/, /else:/, /for\s+/, /while\s+/,
                    /try:/, /except/, /finally:/, /with\s+/
                ],
                contextMarkers: [
                    'import', 'from', 'def', 'class', 'async def'
                ]
            },
            java: {
                safeBoundaries: [
                    /^(\s*)(?:public|private|protected)?\s*(?:static\s+)?(?:class|interface)/m,
                    /^(\s*)(?:public|private|protected)?\s*(?:static\s+)?\w+\s+\w+\s*\(/m, // 方法
                    /^(\s*)\/\*\*[\s\S]*?\*\//m,
                    /^(\s*)import\s+/m,
                    /^(\s*)package\s+/m
                ],
                avoidBoundaries: [
                    /if\s*\(/, /for\s*\(/, /while\s*\(/, /switch\s*\(/,
                    /try\s*{/, /{\s*$/, /^\s*}/
                ],
                contextMarkers: [
                    'import', 'package', 'class', 'interface', 'public', 'private', 'protected'
                ]
            },
            default: {
                safeBoundaries: [
                    /^(\s*)function\s+\w+/m,
                    /^(\s*)class\s+\w+/m,
                    /^(\s*)\/\*[\s\S]*?\*\//m,
                    /^(\s*)\/\/\s*=+/m
                ],
                avoidBoundaries: [
                    /if\s*\(/, /for\s*\(/, /while\s*\(/, /{\s*$/, /^\s*}/
                ],
                contextMarkers: ['function', 'class']
            }
        };
    }

    /**
     * 检测文件的最佳切割点
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     * @param {Object} codeStructure - 代码结构分析结果
     * @param {number} targetChunkSize - 目标切片大小（Token数）
     * @returns {Promise<Object>} 切割点检测结果
     */
    async detectBoundaries(filePath, content, codeStructure, targetChunkSize = this.config.maxChunkSize) {
        try {
            console.log(`[FunctionBoundaryDetector] 检测切割边界: ${filePath}`);

            // 检测语言
            const language = this._detectLanguage(filePath, codeStructure);
            const rules = this.boundaryRules[language] || this.boundaryRules.default;

            // 分析内容行
            const lines = content.split('\n');
            
            // 找到所有可能的边界点
            const candidateBoundaries = this._findCandidateBoundaries(lines, rules);
            
            // 基于代码结构优化边界点
            const optimizedBoundaries = this._optimizeBoundariesWithStructure(
                candidateBoundaries, 
                codeStructure, 
                targetChunkSize
            );
            
            // 生成切割计划
            const chunkPlan = this._generateChunkPlan(
                optimizedBoundaries, 
                content, 
                targetChunkSize,
                rules
            );

            return {
                success: true,
                language,
                chunkPlan,
                metadata: {
                    totalLines: lines.length,
                    candidateBoundaries: candidateBoundaries.length,
                    optimizedBoundaries: optimizedBoundaries.length,
                    recommendedChunks: chunkPlan.chunks.length,
                    avgChunkSize: chunkPlan.avgChunkSize
                }
            };

        } catch (error) {
            console.error(`[FunctionBoundaryDetector] 检测失败: ${filePath}`, error);
            
            return {
                success: false,
                error: error.message,
                chunkPlan: this._generateFallbackChunkPlan(content, targetChunkSize)
            };
        }
    }

    /**
     * 寻找候选边界点
     * @private
     */
    _findCandidateBoundaries(lines, rules) {
        const boundaries = [];
        
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trim();
            
            // 跳过空行
            if (!trimmedLine) return;
            
            // 检查安全边界
            let isSafeBoundary = false;
            let boundaryType = 'unknown';
            
            for (const pattern of rules.safeBoundaries) {
                if (pattern.test(line)) {
                    isSafeBoundary = true;
                    boundaryType = this._identifyBoundaryType(line, rules);
                    break;
                }
            }
            
            // 检查避免边界
            let shouldAvoid = false;
            for (const pattern of rules.avoidBoundaries) {
                if (pattern.test(line)) {
                    shouldAvoid = true;
                    break;
                }
            }
            
            if (isSafeBoundary && !shouldAvoid) {
                boundaries.push({
                    lineNumber,
                    line: line,
                    type: boundaryType,
                    indentLevel: this._getIndentLevel(line),
                    priority: this._calculateBoundaryPriority(boundaryType, line)
                });
            }
        });

        return boundaries;
    }

    /**
     * 基于代码结构优化边界点
     * @private
     */
    _optimizeBoundariesWithStructure(candidateBoundaries, codeStructure, targetChunkSize) {
        const optimized = [...candidateBoundaries];
        
        if (!codeStructure || !codeStructure.structure) {
            return optimized;
        }

        const { functions, classes, interfaces } = codeStructure.structure;
        
        // 添加函数边界
        functions.forEach(func => {
            if (!this._hasBoundaryAt(optimized, func.startLine)) {
                optimized.push({
                    lineNumber: func.startLine,
                    line: `// Function: ${func.name}`,
                    type: 'function',
                    indentLevel: 0,
                    priority: 8,
                    structureInfo: func
                });
            }
        });
        
        // 添加类边界
        classes.forEach(cls => {
            if (!this._hasBoundaryAt(optimized, cls.startLine)) {
                optimized.push({
                    lineNumber: cls.startLine,
                    line: `// Class: ${cls.name}`,
                    type: 'class',
                    indentLevel: 0,
                    priority: 9,
                    structureInfo: cls
                });
            }
        });
        
        // 添加接口边界
        if (interfaces) {
            interfaces.forEach(intf => {
                if (!this._hasBoundaryAt(optimized, intf.startLine)) {
                    optimized.push({
                        lineNumber: intf.startLine,
                        line: `// Interface: ${intf.name}`,
                        type: 'interface',
                        indentLevel: 0,
                        priority: 7,
                        structureInfo: intf
                    });
                }
            });
        }
        
        // 按行号排序
        return optimized.sort((a, b) => a.lineNumber - b.lineNumber);
    }

    /**
     * 生成切割计划
     * @private
     */
    _generateChunkPlan(boundaries, content, targetChunkSize, rules) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunkStart = 0;
        let currentTokenCount = 0;
        
        // 保留的导入语句
        const imports = this._extractImports(content, rules);
        
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            const chunkEndLine = boundary.lineNumber - 1;
            
            // 计算当前切片的近似Token数
            const chunkContent = lines.slice(currentChunkStart, chunkEndLine).join('\n');
            const estimatedTokens = this._estimateTokens(chunkContent);
            
            // 如果超过目标大小，或者是最后一个边界，创建切片
            if (estimatedTokens >= this.config.minChunkSize && 
                (estimatedTokens >= targetChunkSize || i === boundaries.length - 1)) {
                
                chunks.push({
                    chunkIndex: chunks.length + 1,
                    startLine: currentChunkStart + 1,
                    endLine: chunkEndLine,
                    estimatedTokens,
                    content: this._buildChunkContent(
                        lines.slice(currentChunkStart, chunkEndLine),
                        imports,
                        chunks.length + 1
                    ),
                    boundaries: this._getChunkBoundaries(boundaries, currentChunkStart + 1, chunkEndLine),
                    type: this._determineChunkType(boundaries, currentChunkStart + 1, chunkEndLine)
                });
                
                currentChunkStart = Math.max(0, chunkEndLine - this.config.overlapSize);
                currentTokenCount = 0;
            }
        }
        
        // 处理剩余内容
        if (currentChunkStart < lines.length) {
            const remainingContent = lines.slice(currentChunkStart).join('\n');
            const remainingTokens = this._estimateTokens(remainingContent);
            
            if (remainingTokens >= this.config.minChunkSize) {
                chunks.push({
                    chunkIndex: chunks.length + 1,
                    startLine: currentChunkStart + 1,
                    endLine: lines.length,
                    estimatedTokens: remainingTokens,
                    content: this._buildChunkContent(
                        lines.slice(currentChunkStart),
                        imports,
                        chunks.length + 1
                    ),
                    boundaries: [],
                    type: 'remainder'
                });
            } else if (chunks.length > 0) {
                // 合并到最后一个切片
                const lastChunk = chunks[chunks.length - 1];
                lastChunk.endLine = lines.length;
                lastChunk.content = this._buildChunkContent(
                    lines.slice(lastChunk.startLine - 1),
                    imports,
                    lastChunk.chunkIndex
                );
                lastChunk.estimatedTokens = this._estimateTokens(lastChunk.content);
            }
        }
        
        const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.estimatedTokens, 0) / chunks.length;
        
        return {
            chunks,
            totalChunks: chunks.length,
            avgChunkSize: Math.round(avgChunkSize),
            imports,
            strategy: 'boundary-aware'
        };
    }

    /**
     * 构建切片内容
     * @private
     */
    _buildChunkContent(lines, imports, chunkIndex) {
        const content = [];
        
        // 添加头部注释
        content.push(`// Chunk ${chunkIndex} - Generated by FunctionBoundaryDetector`);
        content.push('');
        
        // 添加必要的导入语句（如果启用）
        if (this.config.preserveImports && imports.length > 0 && chunkIndex > 1) {
            content.push('// Required imports');
            content.push(...imports);
            content.push('');
        }
        
        // 添加实际内容
        content.push(...lines);
        
        return content.join('\n');
    }

    /**
     * 提取导入语句
     * @private
     */
    _extractImports(content, rules) {
        const imports = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            // 检查是否是导入语句
            if (line.trim().startsWith('import ') || 
                line.trim().startsWith('from ') ||
                line.trim().startsWith('const ') && line.includes('require(') ||
                line.trim().startsWith('package ')) {
                imports.push(line);
            } else if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                // 遇到非注释的实际代码，停止收集导入
                break;
            }
        }
        
        return imports;
    }

    /**
     * 生成备用切割计划（基于简单行数）
     * @private
     */
    _generateFallbackChunkPlan(content, targetChunkSize) {
        const lines = content.split('\n');
        const chunks = [];
        const linesPerChunk = Math.ceil(lines.length / Math.ceil(lines.length / 100)); // 假设每100行一个切片
        
        for (let i = 0; i < lines.length; i += linesPerChunk) {
            const chunkLines = lines.slice(i, i + linesPerChunk);
            const chunkContent = chunkLines.join('\n');
            
            chunks.push({
                chunkIndex: chunks.length + 1,
                startLine: i + 1,
                endLine: Math.min(i + linesPerChunk, lines.length),
                estimatedTokens: this._estimateTokens(chunkContent),
                content: chunkContent,
                boundaries: [],
                type: 'fallback'
            });
        }
        
        return {
            chunks,
            totalChunks: chunks.length,
            avgChunkSize: Math.round(content.length / chunks.length),
            imports: [],
            strategy: 'simple-split'
        };
    }

    /**
     * 辅助方法
     */
    
    _identifyBoundaryType(line, rules) {
        if (line.includes('function')) return 'function';
        if (line.includes('class')) return 'class';
        if (line.includes('interface')) return 'interface';
        if (line.includes('type')) return 'type';
        if (line.includes('import') || line.includes('export')) return 'module';
        if (line.includes('/**') || line.includes('/*')) return 'comment';
        return 'other';
    }

    _getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    _calculateBoundaryPriority(type, line) {
        const priorities = {
            'class': 10,
            'interface': 9,
            'function': 8,
            'type': 7,
            'module': 6,
            'comment': 5,
            'other': 3
        };
        return priorities[type] || 1;
    }

    _hasBoundaryAt(boundaries, lineNumber) {
        return boundaries.some(b => b.lineNumber === lineNumber);
    }

    _getChunkBoundaries(allBoundaries, startLine, endLine) {
        return allBoundaries.filter(b => 
            b.lineNumber >= startLine && b.lineNumber <= endLine
        );
    }

    _determineChunkType(boundaries, startLine, endLine) {
        const chunkBoundaries = this._getChunkBoundaries(boundaries, startLine, endLine);
        
        if (chunkBoundaries.some(b => b.type === 'class')) return 'class-focused';
        if (chunkBoundaries.some(b => b.type === 'function')) return 'function-focused';
        if (chunkBoundaries.some(b => b.type === 'interface')) return 'interface-focused';
        if (chunkBoundaries.some(b => b.type === 'module')) return 'module-focused';
        
        return 'mixed';
    }

    _estimateTokens(content) {
        // 简单的Token估算
        const chars = content.length;
        const hasChineseChars = /[\u4e00-\u9fff]/.test(content);
        const tokenRatio = hasChineseChars ? 0.6 : 0.25;
        return Math.ceil(chars * tokenRatio);
    }

    _detectLanguage(filePath, codeStructure) {
        if (codeStructure && codeStructure.structure && codeStructure.structure.language) {
            return codeStructure.structure.language;
        }
        
        const ext = filePath.split('.').pop()?.toLowerCase();
        const extMap = {
            js: 'javascript', jsx: 'javascript', mjs: 'javascript',
            ts: 'typescript', tsx: 'typescript',
            py: 'python', java: 'java', go: 'go', rs: 'rust', cs: 'c#'
        };
        
        return extMap[ext] || 'default';
    }

    /**
     * 获取检测器状态
     */
    getDetectorStatus() {
        return {
            name: 'FunctionBoundaryDetector',
            version: '1.0.0',
            config: this.config,
            supportedLanguages: Object.keys(this.boundaryRules),
            isReady: true
        };
    }
}

export default FunctionBoundaryDetector;