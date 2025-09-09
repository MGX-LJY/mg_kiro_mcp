/**
 * 智能内容裁切器
 * 根据不同文件类型和内容特征进行智能截取
 * 
 * 设计目标：
 * - 保留最重要的代码结构
 * - 智能识别关键代码块
 * - 保持代码的可读性和完整性
 */

export class SmartContentTrimmer {
    constructor() {
        this.defaultMaxTokens = 4000;
        this.preserveRatios = {
            imports: 1.0,       // 100% 保留导入
            exports: 1.0,       // 100% 保留导出
            classes: 0.8,       // 80% 保留类定义
            functions: 0.7,     // 70% 保留函数
            comments: 0.3,      // 30% 保留注释
            variables: 0.5,     // 50% 保留变量声明
            implementations: 0.6 // 60% 保留实现代码
        };
    }

    /**
     * 智能裁切内容
     */
    async trimContent(content, fileExtension, maxSize = this.defaultMaxTokens) {
        const language = this.detectLanguageFromExtension(fileExtension);
        
        switch (language) {
            case 'javascript':
            case 'typescript':
                return this.trimJavaScriptContent(content, maxSize);
            case 'python':
                return this.trimPythonContent(content, maxSize);
            case 'java':
                return this.trimJavaContent(content, maxSize);
            case 'go':
                return this.trimGoContent(content, maxSize);
            case 'json':
                return this.trimJsonContent(content, maxSize);
            case 'markdown':
                return this.trimMarkdownContent(content, maxSize);
            case 'yaml':
                return this.trimYamlContent(content, maxSize);
            default:
                return this.trimGenericContent(content, maxSize);
        }
    }

    /**
     * JavaScript/TypeScript 智能裁切
     */
    trimJavaScriptContent(content, maxSize) {
        const lines = content.split('\n');
        const analysis = this.analyzeJavaScriptStructure(lines);
        
        // 优先级排序的代码块
        const prioritizedBlocks = [
            ...analysis.imports,
            ...analysis.exports,
            ...analysis.classes,
            ...analysis.functions.slice(0, Math.ceil(analysis.functions.length * 0.7)),
            ...analysis.variables.slice(0, Math.ceil(analysis.variables.length * 0.5)),
            ...analysis.comments.slice(0, Math.ceil(analysis.comments.length * 0.3))
        ];

        return this.reconstructFromBlocks(lines, prioritizedBlocks, maxSize);
    }

    /**
     * 分析JavaScript结构
     */
    analyzeJavaScriptStructure(lines) {
        const structure = {
            imports: [],
            exports: [],
            classes: [],
            functions: [],
            variables: [],
            comments: [],
            other: []
        };

        let currentBlock = null;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (this.isImportLine(line)) {
                structure.imports.push({ start: i, end: i, type: 'import', content: line });
            } else if (this.isExportLine(line)) {
                const block = this.findBlockEnd(lines, i);
                structure.exports.push({ start: i, end: block.end, type: 'export', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (this.isClassDefinition(line)) {
                const block = this.findBlockEnd(lines, i);
                structure.classes.push({ start: i, end: block.end, type: 'class', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (this.isFunctionDefinition(line)) {
                const block = this.findBlockEnd(lines, i);
                structure.functions.push({ start: i, end: block.end, type: 'function', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (this.isVariableDeclaration(line)) {
                structure.variables.push({ start: i, end: i, type: 'variable', content: line });
            } else if (this.isComment(line)) {
                const block = this.findCommentBlock(lines, i);
                structure.comments.push({ start: i, end: block.end, type: 'comment', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else {
                structure.other.push({ start: i, end: i, type: 'other', content: line });
            }
        }

        return structure;
    }

    /**
     * Python 智能裁切
     */
    trimPythonContent(content, maxSize) {
        const lines = content.split('\n');
        const analysis = this.analyzePythonStructure(lines);
        
        const prioritizedBlocks = [
            ...analysis.imports,
            ...analysis.classes,
            ...analysis.functions.slice(0, Math.ceil(analysis.functions.length * 0.7)),
            ...analysis.variables.slice(0, Math.ceil(analysis.variables.length * 0.5)),
            ...analysis.docstrings.slice(0, Math.ceil(analysis.docstrings.length * 0.4))
        ];

        return this.reconstructFromBlocks(lines, prioritizedBlocks, maxSize);
    }

    /**
     * 分析Python结构
     */
    analyzePythonStructure(lines) {
        const structure = {
            imports: [],
            classes: [],
            functions: [],
            variables: [],
            docstrings: [],
            other: []
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const indentLevel = this.getPythonIndentLevel(lines[i]);

            if (line.startsWith('import ') || line.startsWith('from ')) {
                structure.imports.push({ start: i, end: i, type: 'import', content: line });
            } else if (line.startsWith('class ')) {
                const block = this.findPythonBlock(lines, i, indentLevel);
                structure.classes.push({ start: i, end: block.end, type: 'class', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (line.startsWith('def ')) {
                const block = this.findPythonBlock(lines, i, indentLevel);
                structure.functions.push({ start: i, end: block.end, type: 'function', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (line.startsWith('"""') || line.startsWith("'''")) {
                const block = this.findPythonDocstring(lines, i);
                structure.docstrings.push({ start: i, end: block.end, type: 'docstring', content: lines.slice(i, block.end + 1).join('\n') });
                i = block.end;
            } else if (this.isPythonVariableAssignment(line)) {
                structure.variables.push({ start: i, end: i, type: 'variable', content: line });
            }
        }

        return structure;
    }

    /**
     * JSON 智能裁切
     */
    trimJsonContent(content, maxSize) {
        try {
            const obj = JSON.parse(content);
            
            // 对于package.json等配置文件，保留重要字段
            if (this.isPackageJson(obj)) {
                return this.trimPackageJson(obj, maxSize);
            }
            
            // 通用JSON裁切：保留第一层的重要键
            const importantKeys = this.identifyImportantJsonKeys(obj);
            const trimmed = {};
            
            for (const key of importantKeys) {
                if (obj[key] !== undefined) {
                    trimmed[key] = this.trimJsonValue(obj[key], maxSize / importantKeys.length);
                }
            }
            
            return JSON.stringify(trimmed, null, 2);
        } catch (error) {
            // JSON解析失败，使用通用裁切
            return this.trimGenericContent(content, maxSize);
        }
    }

    /**
     * Markdown 智能裁切
     */
    trimMarkdownContent(content, maxSize) {
        const lines = content.split('\n');
        const structure = this.analyzeMarkdownStructure(lines);
        
        // 优先保留：标题、简介、安装说明、API文档
        const prioritizedSections = [
            ...structure.titles,
            ...structure.introduction.slice(0, Math.ceil(structure.introduction.length * 0.8)),
            ...structure.installation.slice(0, Math.ceil(structure.installation.length * 0.9)),
            ...structure.usage.slice(0, Math.ceil(structure.usage.length * 0.7)),
            ...structure.api.slice(0, Math.ceil(structure.api.length * 0.6))
        ];

        return this.reconstructFromBlocks(lines, prioritizedSections, maxSize);
    }

    /**
     * 通用内容裁切
     */
    trimGenericContent(content, maxSize) {
        if (content.length <= maxSize) return content;

        const lines = content.split('\n');
        const totalLines = lines.length;
        
        // 保留前70%和后30%的行
        const frontLines = Math.floor(totalLines * 0.7);
        const backLines = Math.floor(totalLines * 0.3);
        
        const trimmed = [
            ...lines.slice(0, frontLines),
            '\n... [内容已截断] ...\n',
            ...lines.slice(-backLines)
        ];

        return trimmed.join('\n');
    }

    /**
     * 重建内容
     */
    reconstructFromBlocks(lines, blocks, maxSize) {
        blocks.sort((a, b) => a.start - b.start);
        
        let result = [];
        let currentSize = 0;
        const targetSize = maxSize * 0.8; // 留一些缓冲

        for (const block of blocks) {
            const blockContent = typeof block.content === 'string' 
                ? block.content 
                : lines.slice(block.start, block.end + 1).join('\n');
                
            if (currentSize + blockContent.length > targetSize) {
                break;
            }
            
            result.push(blockContent);
            currentSize += blockContent.length;
        }

        // 如果结果太短，添加一些其他内容
        if (currentSize < targetSize * 0.5 && blocks.length > result.length) {
            result.push('\n... [部分内容已截断] ...\n');
        }

        return result.join('\n');
    }

    // 工具方法
    detectLanguageFromExtension(ext) {
        const langMap = {
            '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'javascript',
            '.ts': 'typescript', '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.json': 'json',
            '.md': 'markdown',
            '.yml': 'yaml', '.yaml': 'yaml'
        };
        return langMap[ext] || 'generic';
    }

    isImportLine(line) {
        return /^(import\s|from\s|require\s*\(|const\s+.*=\s*require)/.test(line);
    }

    isExportLine(line) {
        return /^(export\s|module\.exports|exports\.)/.test(line);
    }

    isClassDefinition(line) {
        return /^(class\s|interface\s|type\s)/.test(line);
    }

    isFunctionDefinition(line) {
        return /^(function\s|const\s+\w+\s*=\s*(async\s+)?\(|async\s+function|\w+\s*\(.*\)\s*=>|\w+:\s*(async\s+)?\()/.test(line);
    }

    isVariableDeclaration(line) {
        return /^(const\s|let\s|var\s)/.test(line);
    }

    isComment(line) {
        return /^\s*(\/\/|\/\*|\*)/.test(line);
    }

    findBlockEnd(lines, start) {
        let braceCount = 0;
        let inString = false;
        let stringChar = null;

        for (let i = start; i < lines.length; i++) {
            const line = lines[i];
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (!inString) {
                    if (char === '"' || char === "'") {
                        inString = true;
                        stringChar = char;
                    } else if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0 && i > start) {
                            return { end: i };
                        }
                    }
                } else if (char === stringChar && line[j-1] !== '\\') {
                    inString = false;
                    stringChar = null;
                }
            }

            // 如果是单行函数或变量声明
            if (i === start && braceCount === 0 && !line.includes('{')) {
                return { end: i };
            }
        }

        return { end: Math.min(start + 50, lines.length - 1) }; // 最多50行
    }

    // 占位符方法（可根据需要扩展）
    findCommentBlock(lines, start) { return { end: start }; }
    getPythonIndentLevel(line) { return (line.match(/^\s*/) || [''])[0].length; }
    findPythonBlock(lines, start, indentLevel) { return { end: start + 10 }; }
    findPythonDocstring(lines, start) { return { end: start + 5 }; }
    isPythonVariableAssignment(line) { return /^\s*\w+\s*=/.test(line); }
    isPackageJson(obj) { return obj.name && obj.version; }
    trimPackageJson(obj, maxSize) { return JSON.stringify(obj, null, 2); }
    identifyImportantJsonKeys(obj) { return Object.keys(obj).slice(0, 10); }
    trimJsonValue(value, maxSize) { return value; }
    analyzeMarkdownStructure(lines) { 
        return { 
            titles: [], introduction: [], installation: [], usage: [], api: [] 
        }; 
    }
}

export default SmartContentTrimmer;