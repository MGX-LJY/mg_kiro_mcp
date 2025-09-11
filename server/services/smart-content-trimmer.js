/**
 * 智能内容裁切器
 * 根据文件类型和内容结构智能裁切文件，保留关键信息
 */

export class SmartContentTrimmer {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 配置合并（ServiceBus格式）
        this.config = {
            // 裁切策略配置
            preserveImports: true,
            preserveExports: true,
            preserveComments: true,
            preserveTypes: true,
            maxPreserveRatio: 0.8, // 高优先级内容占最大比例
            
            // 文件类型策略映射
            strategies: {
                '.js': 'trimJavaScript',
                '.ts': 'trimTypeScript', 
                '.jsx': 'trimJavaScript',
                '.tsx': 'trimTypeScript',
                '.py': 'trimPython',
                '.json': 'trimJson',
                '.md': 'trimMarkdown',
                '.txt': 'trimPlainText',
                '.yml': 'trimYaml',
                '.yaml': 'trimYaml'
            },
            
            // 裁切标记配置
            trimMarkers: {
                js: '// ... (内容已裁切，完整内容请查看原文件)',
                py: '# ... (内容已裁切，完整内容请查看原文件)',
                md: '<!-- ... (内容已裁切，完整内容请查看原文件) -->',
                json: '"...": "内容已裁切，完整内容请查看原文件"',
                default: '... (内容已裁切，完整内容请查看原文件)'
            },
            
            // 覆盖默认配置
            ...config
        };

        // 依赖注入（ServiceBus格式）
        this.serviceBus = serviceBus;
        this.logger = dependencies.logger || console;
        
        // 初始化策略映射
        this.strategies = {
            '.js': this.trimJavaScript.bind(this),
            '.ts': this.trimTypeScript.bind(this),
            '.jsx': this.trimJavaScript.bind(this),
            '.tsx': this.trimTypeScript.bind(this),
            '.py': this.trimPython.bind(this),
            '.json': this.trimJson.bind(this),
            '.md': this.trimMarkdown.bind(this),
            '.txt': this.trimPlainText.bind(this),
            '.yml': this.trimYaml.bind(this),
            '.yaml': this.trimYaml.bind(this)
        };
        
        this.logger.info('[SmartContentTrimmer] 智能内容裁切器已初始化');
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
            name: 'SmartContentTrimmer',
            status: 'active',
            supportedExtensions: Object.keys(this.strategies),
            config: this.config
        };
    }

    /**
     * 智能裁切内容
     */
    async trimContent(content, fileExtension, maxLength) {
        if (!content || content.length <= maxLength) {
            return content;
        }

        const trimmer = this.strategies[fileExtension.toLowerCase()];
        if (trimmer) {
            return await trimmer(content, maxLength);
        }

        // 默认裁切策略
        return this.trimPlainText(content, maxLength);
    }

    /**
     * JavaScript/JSX 裁切策略
     */
    async trimJavaScript(content, maxLength) {
        const lines = content.split('\n');
        const result = [];
        let currentLength = 0;
        
        // 优先保留的内容
        const priorities = [
            /^import\s+/, // import语句
            /^export\s+/, // export语句
            /^\/\*\*/, // JSDoc注释开始
            /^class\s+/, // 类定义
            /^function\s+/, // 函数定义
            /^const\s+\w+\s*=\s*\([^)]*\)\s*=>/, // 箭头函数
            /^async\s+function/, // 异步函数
            /^\s*\/\/.*TODO|FIXME|NOTE/, // 重要注释
        ];

        // 第一遍: 收集高优先级内容
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength * this.config.maxPreserveRatio) break;
            
            if (priorities.some(pattern => pattern.test(line))) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        // 第二遍: 补充其他内容
        for (let i = 0; i < lines.length && currentLength < maxLength * 0.9; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength) break;
            
            if (!result.includes(line) && line.trim() && !line.trim().startsWith('//')) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        if (result.length < lines.length) {
            result.push('', this.config.trimMarkers.js, '');
        }

        return result.join('\n');
    }

    /**
     * TypeScript/TSX 裁切策略
     */
    async trimTypeScript(content, maxLength) {
        const lines = content.split('\n');
        const result = [];
        let currentLength = 0;
        
        // TypeScript 特有的优先内容
        const priorities = [
            /^import\s+/, 
            /^export\s+/,
            /^interface\s+/, // 接口定义
            /^type\s+/, // 类型定义
            /^enum\s+/, // 枚举定义
            /^class\s+/,
            /^function\s+/,
            /^const\s+\w+\s*:\s*/, // 带类型的常量
            /^\/\*\*/,
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength * 0.9) break;
            
            if (priorities.some(pattern => pattern.test(line)) || 
                (currentLength < maxLength * 0.6 && line.trim())) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        if (result.length < lines.length) {
            result.push('', '// ... (TypeScript内容已裁切)', '');
        }

        return result.join('\n');
    }

    /**
     * Python 裁切策略
     */
    async trimPython(content, maxLength) {
        const lines = content.split('\n');
        const result = [];
        let currentLength = 0;
        
        const priorities = [
            /^import\s+/,
            /^from\s+.*import/,
            /^class\s+/,
            /^def\s+/,
            /^async\s+def/,
            /^\s*"""/, // 文档字符串
            /^\s*'''/, 
            /^@\w+/, // 装饰器
            /^if\s+__name__\s*==\s*["']__main__["']/,
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength * 0.9) break;
            
            if (priorities.some(pattern => pattern.test(line)) || 
                (currentLength < maxLength * 0.6 && line.trim() && !line.trim().startsWith('#'))) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        if (result.length < lines.length) {
            result.push('', '# ... (Python内容已裁切)', '');
        }

        return result.join('\n');
    }

    /**
     * JSON 裁切策略
     */
    async trimJson(content, maxLength) {
        try {
            const obj = JSON.parse(content);
            
            // 对于package.json等配置文件，保留重要字段
            if (obj.name || obj.version || obj.dependencies) {
                const trimmed = {
                    ...(obj.name && { name: obj.name }),
                    ...(obj.version && { version: obj.version }),
                    ...(obj.description && { description: obj.description }),
                    ...(obj.main && { main: obj.main }),
                    ...(obj.scripts && { scripts: obj.scripts }),
                    ...(obj.dependencies && { dependencies: obj.dependencies }),
                    ...(obj.devDependencies && { devDependencies: obj.devDependencies }),
                };
                
                const result = JSON.stringify(trimmed, null, 2);
                if (result.length <= maxLength) {
                    return result;
                }
            }
            
            // 通用JSON裁切
            return JSON.stringify(obj, null, 2).substring(0, maxLength - 50) + '\n  ...\n}';
            
        } catch (error) {
            // 如果不是有效JSON，按纯文本处理
            return this.trimPlainText(content, maxLength);
        }
    }

    /**
     * Markdown 裁切策略
     */
    async trimMarkdown(content, maxLength) {
        const lines = content.split('\n');
        const result = [];
        let currentLength = 0;
        
        const priorities = [
            /^#\s+/, // 一级标题
            /^##\s+/, // 二级标题
            /^###\s+/, // 三级标题
            /^\s*\*\s+/, // 无序列表
            /^\s*\d+\.\s+/, // 有序列表
            /^```/, // 代码块
            /^\|\s*.*\s*\|/, // 表格
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength * 0.9) break;
            
            if (priorities.some(pattern => pattern.test(line)) || 
                (currentLength < maxLength * 0.7 && line.trim())) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        if (result.length < lines.length) {
            result.push('', '... (Markdown内容已裁切)', '');
        }

        return result.join('\n');
    }

    /**
     * YAML 裁切策略
     */
    async trimYaml(content, maxLength) {
        const lines = content.split('\n');
        const result = [];
        let currentLength = 0;
        
        // YAML 保留根级别的键
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLength = line.length + 1;
            
            if (currentLength + lineLength > maxLength * 0.9) break;
            
            // 保留根级别键和重要配置
            if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) || 
                line.match(/^\s*-\s/) ||
                (currentLength < maxLength * 0.6 && line.trim())) {
                result.push(line);
                currentLength += lineLength;
            }
        }

        if (result.length < lines.length) {
            result.push('', '# ... (YAML内容已裁切)', '');
        }

        return result.join('\n');
    }

    /**
     * 纯文本裁切策略
     */
    async trimPlainText(content, maxLength) {
        if (content.length <= maxLength) {
            return content;
        }

        const trimPoint = maxLength - 100;
        const truncated = content.substring(0, trimPoint);
        
        // 尝试在换行处截断
        const lastNewline = truncated.lastIndexOf('\n');
        if (lastNewline > trimPoint * 0.8) {
            return truncated.substring(0, lastNewline) + '\n\n... (内容已裁切)';
        }
        
        return truncated + '\n\n... (内容已裁切)';
    }
}

export default SmartContentTrimmer;