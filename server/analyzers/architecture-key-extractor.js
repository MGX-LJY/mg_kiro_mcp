/**
 * 架构关键提取器
 * 专门提取架构相关的关键代码片段，而非全文读取
 * 
 * 策略：
 * 1. 只提取签名和结构，不提取实现细节
 * 2. 识别关键架构模式和设计决策
 * 3. 提取配置、路由、依赖关系等关键信息
 * 4. 生成架构层面的洞察，而非代码层面的细节
 */

import fs from 'fs/promises';
import path from 'path';

export class ArchitectureKeyExtractor {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.architecturePatterns = this.initializeArchitecturePatterns();
    }

    /**
     * 执行架构关键提取
     * @returns {Object} 架构关键信息
     */
    async extractArchitectureKeys() {
        console.log('[架构提取器] 开始提取关键架构信息...');

        const architectureFiles = await this.identifyArchitectureFiles();
        const keyInsights = await this.extractKeyInsights(architectureFiles);

        return {
            extractionStrategy: 'architecture-key-extraction',
            totalFiles: architectureFiles.length,
            extractedInsights: keyInsights,
            architectureSummary: await this.generateArchitectureSummary(keyInsights),
            designPatterns: await this.identifyDesignPatterns(keyInsights),
            systemComplexity: await this.assessSystemComplexity(keyInsights),
            extractionMetadata: {
                timestamp: new Date().toISOString(),
                analysisDepth: 'key-insights-only',
                fullContentRead: false
            }
        };
    }

    /**
     * 识别架构相关的文件
     * 按重要性和架构影响排序
     */
    async identifyArchitectureFiles() {
        const allFiles = await this.scanProjectFiles();
        const architectureFiles = [];

        // 架构文件优先级规则
        const architectureRules = [
            // 超高优先级 - 入口和主配置
            { pattern: /^(index|main|app|server)\.(js|ts)$/, priority: 1, role: 'entry-point', importance: 'critical' },
            { pattern: /package\.json$/, priority: 1, role: 'project-config', importance: 'critical' },
            
            // 高优先级 - 核心架构
            { pattern: /\.config\.(js|json|ts)$/, priority: 2, role: 'configuration', importance: 'high' },
            { pattern: /(route|router|api).*\.(js|ts)$/i, priority: 2, role: 'routing-layer', importance: 'high' },
            { pattern: /(middleware|handler).*\.(js|ts)$/i, priority: 3, role: 'middleware-layer', importance: 'high' },
            
            // 中优先级 - 核心服务
            { pattern: /(service|manager|controller).*\.(js|ts)$/i, priority: 4, role: 'service-layer', importance: 'medium' },
            { pattern: /(model|schema|entity).*\.(js|ts)$/i, priority: 5, role: 'data-layer', importance: 'medium' },
            
            // 中低优先级 - 工具和实用程序
            { pattern: /(util|helper|tool).*\.(js|ts)$/i, priority: 6, role: 'utility-layer', importance: 'medium' },
            { pattern: /constants?.*\.(js|ts)$/i, priority: 7, role: 'constants', importance: 'low' }
        ];

        for (const file of allFiles) {
            const fileName = path.basename(file);
            const relativePath = path.relative(this.projectPath, file);

            for (const rule of architectureRules) {
                if (rule.pattern.test(fileName) || rule.pattern.test(relativePath)) {
                    const stats = await fs.stat(file);
                    architectureFiles.push({
                        path: file,
                        relativePath,
                        fileName,
                        priority: rule.priority,
                        role: rule.role,
                        importance: rule.importance,
                        size: stats.size,
                        lastModified: stats.mtime
                    });
                    break;
                }
            }
        }

        // 按优先级排序，限制数量以避免信息过载
        return architectureFiles
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return b.size - a.size; // 同优先级下，大文件优先
            })
            .slice(0, 20); // 限制最多20个架构文件
    }

    /**
     * 从架构文件中提取关键洞察
     * 只读取关键结构，不读取实现细节
     */
    async extractKeyInsights(architectureFiles) {
        const insights = [];

        for (const file of architectureFiles) {
            try {
                console.log(`[架构提取] 分析文件: ${file.relativePath} (${file.role})`);
                
                const content = await fs.readFile(file.path, 'utf8');
                const keyInsight = await this.extractFileKeyInsight(file, content);
                
                insights.push(keyInsight);
            } catch (error) {
                console.warn(`[架构提取] 跳过文件 ${file.path}: ${error.message}`);
            }
        }

        return insights;
    }

    /**
     * 从单个文件提取关键洞察
     * 核心策略：结构优于内容，签名优于实现
     */
    async extractFileKeyInsight(file, content) {
        const insight = {
            file: file,
            structuralElements: {},
            architecturalRole: this.determineArchitecturalRole(file, content),
            keyMetrics: {},
            relationships: {},
            patterns: []
        };

        // 提取结构元素 (只要签名，不要实现)
        insight.structuralElements = {
            imports: this.extractImportStructure(content),
            exports: this.extractExportStructure(content),
            classes: this.extractClassStructures(content),
            functions: this.extractFunctionSignatures(content),
            constants: this.extractConstants(content),
            configurations: this.extractConfigurations(content)
        };

        // 分析架构关系
        insight.relationships = {
            dependencies: this.analyzeDependencyRelationships(content),
            provides: this.analyzeProvidedServices(content),
            consumes: this.analyzeConsumedServices(content),
            dataFlow: this.analyzeDataFlow(content)
        };

        // 关键指标（不需要读取实现）
        insight.keyMetrics = {
            complexity: this.estimateArchitecturalComplexity(content),
            coupling: this.estimateCoupling(insight.structuralElements.imports),
            cohesion: this.estimateCohesion(insight.structuralElements),
            responsibility: this.analyzeResponsibilities(content)
        };

        // 识别架构模式
        insight.patterns = this.identifyArchitecturalPatterns(content, file);

        return insight;
    }

    /**
     * 提取导入结构 - 重点关注依赖关系
     */
    extractImportStructure(content) {
        const imports = {
            external: [], // 外部包
            internal: [], // 内部模块
            types: [],    // 类型导入
            dynamic: []   // 动态导入
        };

        // ES6 导入
        const importRegex = /^import\s+(?:(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+)?['"](.*?)['"];?$/gm;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const module = match[4];
            const importType = module.startsWith('.') ? 'internal' : 'external';
            
            imports[importType].push({
                module: module,
                imports: match[1] ? match[1].split(',').map(s => s.trim()) : 
                        match[2] ? [`* as ${match[2]}`] : 
                        match[3] ? [match[3]] : ['default'],
                statement: match[0].trim()
            });
        }

        // CommonJS require
        const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\(['"](.*?)['"]\);?/g;
        while ((match = requireRegex.exec(content)) !== null) {
            const module = match[3];
            const importType = module.startsWith('.') ? 'internal' : 'external';
            
            imports[importType].push({
                module: module,
                imports: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
                statement: match[0].trim(),
                type: 'commonjs'
            });
        }

        return imports;
    }

    /**
     * 提取导出结构 - 重点关注提供的接口
     */
    extractExportStructure(content) {
        const exports = {
            named: [],      // 命名导出
            default: null,  // 默认导出
            classes: [],    // 导出的类
            functions: [],  // 导出的函数
            constants: []   // 导出的常量
        };

        // 命名导出
        const namedExportRegex = /^export\s+(?:const|let|var|function|class|async\s+function)\s+(\w+)/gm;
        let match;
        while ((match = namedExportRegex.exec(content)) !== null) {
            exports.named.push(match[1]);
        }

        // 批量导出
        const batchExportRegex = /^export\s+\{([^}]+)\}/gm;
        while ((match = batchExportRegex.exec(content)) !== null) {
            const items = match[1].split(',').map(s => s.trim().split(' as ')[0]);
            exports.named.push(...items);
        }

        // 默认导出
        const defaultExportRegex = /^export\s+default\s+(\w+|class\s+\w+|function\s+\w+)/gm;
        if ((match = defaultExportRegex.exec(content)) !== null) {
            exports.default = match[1];
        }

        // 分类导出内容
        this.categorizeExports(content, exports);

        return exports;
    }

    /**
     * 提取类结构 - 只要签名和继承关系
     */
    extractClassStructures(content) {
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
                methods: this.extractMethodSignatures(classBody),
                properties: this.extractPropertySignatures(classBody),
                constructor: this.extractConstructorSignature(classBody),
                static: this.extractStaticMembers(classBody),
                accessModifiers: this.analyzeAccessPatterns(classBody)
            });
        }

        return classes;
    }

    /**
     * 提取函数签名 - 只要签名，不要实现
     */
    extractFunctionSignatures(content) {
        const functions = [];

        // 函数声明
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push({
                name: match[1],
                parameters: this.parseParameters(match[2]),
                async: match[0].includes('async'),
                exported: match[0].includes('export'),
                type: 'declaration'
            });
        }

        // 箭头函数
        const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
        while ((match = arrowRegex.exec(content)) !== null) {
            functions.push({
                name: match[1],
                parameters: this.parseParameters(match[2]),
                async: match[0].includes('async'),
                exported: false,
                type: 'arrow'
            });
        }

        return functions;
    }

    /**
     * 确定文件的架构角色
     */
    determineArchitecturalRole(file, content) {
        const roles = [];

        // 基于文件名和路径的角色判断
        if (file.fileName.includes('index') || file.fileName.includes('main')) {
            roles.push('entry-point');
        }
        
        if (file.fileName.includes('config')) {
            roles.push('configuration');
        }
        
        if (file.fileName.includes('route') || file.fileName.includes('api')) {
            roles.push('api-layer');
        }
        
        if (file.fileName.includes('service') || file.fileName.includes('manager')) {
            roles.push('business-logic');
        }
        
        if (file.fileName.includes('middleware')) {
            roles.push('cross-cutting-concerns');
        }

        // 基于代码内容的角色判断
        if (content.includes('app.listen') || content.includes('server.listen')) {
            roles.push('application-server');
        }
        
        if (content.includes('app.use') || content.includes('router.use')) {
            roles.push('middleware-orchestrator');
        }
        
        if (content.includes('mongoose') || content.includes('sequelize') || content.includes('database')) {
            roles.push('data-access');
        }
        
        if (content.includes('jwt') || content.includes('passport') || content.includes('auth')) {
            roles.push('security');
        }

        return {
            primary: roles[0] || 'utility',
            secondary: roles.slice(1),
            confidence: roles.length > 0 ? 'high' : 'medium',
            evidence: roles
        };
    }

    /**
     * 分析架构复杂度 - 不需要读取实现
     */
    estimateArchitecturalComplexity(content) {
        const complexity = {
            structural: 0,
            dependency: 0,
            interface: 0,
            overall: 'low'
        };

        // 结构复杂度 - 基于类和函数数量
        const classCount = (content.match(/class\s+\w+/g) || []).length;
        const functionCount = (content.match(/function\s+\w+|=\s*\([^)]*\)\s*=>/g) || []).length;
        complexity.structural = classCount * 2 + functionCount;

        // 依赖复杂度 - 基于导入数量
        const importCount = (content.match(/^import\s+.*?from|require\(/gm) || []).length;
        complexity.dependency = importCount;

        // 接口复杂度 - 基于导出和公共方法
        const exportCount = (content.match(/^export\s+/gm) || []).length;
        complexity.interface = exportCount;

        // 总体复杂度评估
        const total = complexity.structural + complexity.dependency + complexity.interface;
        if (total > 50) complexity.overall = 'high';
        else if (total > 20) complexity.overall = 'medium';
        else complexity.overall = 'low';

        return complexity;
    }

    /**
     * 识别架构模式
     */
    identifyArchitecturalPatterns(content, file) {
        const patterns = [];

        // 设计模式识别
        if (content.includes('getInstance') && content.includes('constructor')) {
            patterns.push({ pattern: 'Singleton', confidence: 'high', evidence: 'getInstance method found' });
        }

        if (content.includes('addEventListener') || content.includes('emit') || content.includes('EventEmitter')) {
            patterns.push({ pattern: 'Observer/Event-Driven', confidence: 'high', evidence: 'Event handling detected' });
        }

        if (content.includes('Factory') || content.includes('create') && content.includes('class')) {
            patterns.push({ pattern: 'Factory', confidence: 'medium', evidence: 'Factory-like creation methods' });
        }

        // 架构模式识别
        if (content.includes('app.get') || content.includes('router.')) {
            patterns.push({ pattern: 'MVC/REST', confidence: 'high', evidence: 'Express routing detected' });
        }

        if (content.includes('middleware') || content.includes('next(')) {
            patterns.push({ pattern: 'Middleware/Pipeline', confidence: 'high', evidence: 'Middleware pattern detected' });
        }

        if (content.includes('async') && content.includes('await')) {
            patterns.push({ pattern: 'Async/Await', confidence: 'high', evidence: 'Asynchronous programming pattern' });
        }

        // 依赖注入
        if (content.includes('constructor') && content.includes('this.')) {
            const constructorMatch = content.match(/constructor\s*\(([^)]+)\)/);
            if (constructorMatch && constructorMatch[1].includes(',')) {
                patterns.push({ pattern: 'Dependency Injection', confidence: 'medium', evidence: 'Constructor with multiple dependencies' });
            }
        }

        return patterns;
    }

    // ====== 辅助方法 ======

    async scanProjectFiles() {
        const files = [];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'mg_kiro', 'test', 'tests', '__tests__'];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir);
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory() && !excludeDirs.includes(entry) && !entry.startsWith('.')) {
                        await scanDir(fullPath);
                    } else if (stats.isFile() && ['.js', '.ts', '.json'].includes(path.extname(entry))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`[架构扫描] 跳过目录 ${dir}: ${error.message}`);
            }
        }

        await scanDir(this.projectPath);
        return files;
    }

    parseParameters(paramStr) {
        if (!paramStr || paramStr.trim() === '') return [];
        
        return paramStr.split(',').map(param => {
            const trimmed = param.trim();
            const [name, defaultValue] = trimmed.split('=');
            return {
                name: name.trim(),
                hasDefault: !!defaultValue,
                defaultValue: defaultValue ? defaultValue.trim() : null
            };
        });
    }

    extractMethodSignatures(classBody) {
        const methods = [];
        const methodRegex = /(?:async\s+)?(\w+)\s*\(([^)]*)\)/g;
        
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            if (match[1] !== 'constructor') {
                methods.push({
                    name: match[1],
                    parameters: this.parseParameters(match[2]),
                    async: match[0].includes('async'),
                    static: match[0].includes('static')
                });
            }
        }
        
        return methods;
    }

    extractPropertySignatures(classBody) {
        const properties = [];
        const propertyRegex = /(?:this\.)?(\w+)\s*=|(\w+):/g;
        
        let match;
        while ((match = propertyRegex.exec(classBody)) !== null) {
            const propName = match[1] || match[2];
            if (propName && !properties.find(p => p.name === propName)) {
                properties.push({
                    name: propName,
                    type: match[1] ? 'instance' : 'declaration'
                });
            }
        }
        
        return properties;
    }

    extractConstructorSignature(classBody) {
        const constructorMatch = classBody.match(/constructor\s*\(([^)]*)\)/);
        if (constructorMatch) {
            return {
                parameters: this.parseParameters(constructorMatch[1]),
                hasSuper: classBody.includes('super(')
            };
        }
        return null;
    }

    extractStaticMembers(classBody) {
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

    analyzeAccessPatterns(classBody) {
        return {
            hasPrivateFields: classBody.includes('#'),
            hasGettersSetters: classBody.includes('get ') || classBody.includes('set '),
            usesWeakMap: classBody.includes('WeakMap'),
            encapsulationLevel: classBody.includes('#') ? 'high' : 
                               classBody.includes('_') ? 'medium' : 'low'
        };
    }

    extractConstants(content) {
        const constants = [];
        const constantRegex = /(?:const|Object\.freeze)\s+([A-Z_][A-Z0-9_]*)\s*=/g;
        
        let match;
        while ((match = constantRegex.exec(content)) !== null) {
            constants.push({
                name: match[1],
                frozen: match[0].includes('freeze'),
                exported: content.includes(`export { ${match[1]}`) || content.includes(`export const ${match[1]}`)
            });
        }
        
        return constants;
    }

    extractConfigurations(content) {
        const configs = [];
        
        // 配置对象
        const configRegex = /(?:const|let|var)\s+(\w*[Cc]onfig\w*)\s*=/g;
        let match;
        while ((match = configRegex.exec(content)) !== null) {
            configs.push({
                name: match[1],
                type: 'object',
                scope: 'module'
            });
        }
        
        // 环境变量
        const envRegex = /process\.env\.(\w+)/g;
        const envVars = new Set();
        while ((match = envRegex.exec(content)) !== null) {
            envVars.add(match[1]);
        }
        
        configs.push(...Array.from(envVars).map(envVar => ({
            name: envVar,
            type: 'environment',
            scope: 'system'
        })));
        
        return configs;
    }

    analyzeDependencyRelationships(content) {
        const relationships = {
            internal: [],
            external: [],
            circular: false,
            depth: 'unknown'
        };

        // 分析内部依赖
        const internalImports = content.match(/from\s+['"]\.[^'"]*['"]/g) || [];
        relationships.internal = internalImports.map(imp => {
            const match = imp.match(/from\s+['"]([^'"]*)['"]/);
            return match ? match[1] : '';
        }).filter(dep => dep);

        // 分析外部依赖
        const externalImports = content.match(/from\s+['"][^.'"]/g) || [];
        relationships.external = externalImports.map(imp => {
            const match = imp.match(/from\s+['"]([^'"]*)['"]/);
            return match ? match[1] : '';
        }).filter(dep => dep && !dep.startsWith('.'));

        return relationships;
    }

    analyzeProvidedServices(content) {
        const services = [];
        
        // 分析导出的服务
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            services.push({
                name: match[1],
                type: this.determineServiceType(content, match[1]),
                isDefault: match[0].includes('default')
            });
        }
        
        return services;
    }

    analyzeConsumedServices(content) {
        const consumed = [];
        
        // 分析导入的服务
        const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            if (match[1]) {
                // 命名导入
                const namedImports = match[1].split(',').map(s => s.trim());
                consumed.push(...namedImports.map(name => ({ name, type: 'named' })));
            } else if (match[2]) {
                // 默认导入
                consumed.push({ name: match[2], type: 'default' });
            }
        }
        
        return consumed;
    }

    analyzeDataFlow(content) {
        const flow = {
            inputs: [],
            outputs: [],
            transformations: [],
            async: false
        };

        // 检测异步数据流
        flow.async = content.includes('async') || content.includes('Promise') || content.includes('.then');

        // 检测输入源
        if (content.includes('req.body') || content.includes('req.params')) {
            flow.inputs.push('http-request');
        }
        if (content.includes('process.argv') || content.includes('process.env')) {
            flow.inputs.push('environment');
        }
        if (content.includes('fs.read') || content.includes('readFile')) {
            flow.inputs.push('file-system');
        }

        // 检测输出目标
        if (content.includes('res.send') || content.includes('res.json')) {
            flow.outputs.push('http-response');
        }
        if (content.includes('console.log') || content.includes('logger')) {
            flow.outputs.push('logging');
        }
        if (content.includes('fs.write') || content.includes('writeFile')) {
            flow.outputs.push('file-system');
        }

        return flow;
    }

    estimateCoupling(imports) {
        const totalImports = (imports.external || []).length + (imports.internal || []).length;
        
        if (totalImports > 10) return 'high';
        if (totalImports > 5) return 'medium';
        return 'low';
    }

    estimateCohesion(structuralElements) {
        const functions = structuralElements.functions || [];
        const classes = structuralElements.classes || [];
        
        // 简单的内聚性估算
        if (classes.length === 1 && functions.length <= 3) return 'high';
        if (classes.length <= 2 && functions.length <= 8) return 'medium';
        return 'low';
    }

    analyzeResponsibilities(content) {
        const responsibilities = [];
        
        if (content.includes('router') || content.includes('route')) {
            responsibilities.push('routing');
        }
        if (content.includes('auth') || content.includes('jwt')) {
            responsibilities.push('authentication');
        }
        if (content.includes('validate') || content.includes('schema')) {
            responsibilities.push('validation');
        }
        if (content.includes('log') || content.includes('error')) {
            responsibilities.push('logging');
        }
        if (content.includes('config') || content.includes('env')) {
            responsibilities.push('configuration');
        }
        
        return responsibilities;
    }

    categorizeExports(content, exports) {
        for (const exportName of exports.named) {
            if (content.includes(`class ${exportName}`)) {
                exports.classes.push(exportName);
            } else if (content.includes(`function ${exportName}`) || content.includes(`${exportName} = (`)) {
                exports.functions.push(exportName);
            } else {
                exports.constants.push(exportName);
            }
        }
    }

    determineServiceType(content, serviceName) {
        const serviceLine = content.split('\n').find(line => 
            line.includes(serviceName) && (line.includes('class') || line.includes('function'))
        );
        
        if (serviceLine && serviceLine.includes('class')) return 'class';
        if (serviceLine && serviceLine.includes('function')) return 'function';
        return 'constant';
    }

    async identifyDesignPatterns(keyInsights) {
        // 识别和聚合设计模式
        return this.aggregateDesignPatterns(keyInsights);
    }

    async assessSystemComplexity(keyInsights) {
        const complexity = {
            overall: 'medium',
            distribution: this.analyzeComplexityDistribution(keyInsights),
            factors: []
        };

        const totalFiles = keyInsights.length;
        const highComplexityFiles = keyInsights.filter(k => k.keyMetrics?.complexity?.overall === 'high').length;
        
        if (highComplexityFiles / totalFiles > 0.3) {
            complexity.overall = 'high';
            complexity.factors.push('High proportion of complex files');
        } else if (highComplexityFiles / totalFiles < 0.1) {
            complexity.overall = 'low';
        }

        return complexity;
    }

    async generateArchitectureSummary(keyInsights) {
        const summary = {
            totalFiles: keyInsights.length,
            architecturalLayers: this.identifyArchitecturalLayers(keyInsights),
            designPatterns: this.aggregateDesignPatterns(keyInsights),
            complexityDistribution: this.analyzeComplexityDistribution(keyInsights),
            dependencyAnalysis: this.analyzeDependencyPatterns(keyInsights),
            qualityMetrics: this.calculateQualityMetrics(keyInsights)
        };

        return summary;
    }

    identifyArchitecturalLayers(keyInsights) {
        const layers = {};
        
        for (const insight of keyInsights) {
            const role = insight.architecturalRole.primary;
            if (!layers[role]) {
                layers[role] = { files: [], patterns: [], complexity: 'low' };
            }
            layers[role].files.push(insight.file.fileName);
            layers[role].patterns.push(...insight.patterns.map(p => p.pattern));
        }
        
        return layers;
    }

    aggregateDesignPatterns(keyInsights) {
        const patterns = {};
        
        for (const insight of keyInsights) {
            for (const pattern of insight.patterns) {
                if (!patterns[pattern.pattern]) {
                    patterns[pattern.pattern] = { count: 0, files: [], confidence: 'medium' };
                }
                patterns[pattern.pattern].count++;
                patterns[pattern.pattern].files.push(insight.file.fileName);
                // 更新置信度
                if (pattern.confidence === 'high') {
                    patterns[pattern.pattern].confidence = 'high';
                }
            }
        }
        
        return patterns;
    }

    analyzeComplexityDistribution(keyInsights) {
        const distribution = { low: 0, medium: 0, high: 0 };
        
        for (const insight of keyInsights) {
            distribution[insight.keyMetrics.complexity.overall]++;
        }
        
        return distribution;
    }

    analyzeDependencyPatterns(keyInsights) {
        const patterns = {
            totalExternalDependencies: new Set(),
            totalInternalDependencies: new Set(),
            couplingDistribution: { low: 0, medium: 0, high: 0 },
            circularDependencies: []
        };
        
        for (const insight of keyInsights) {
            // 收集依赖
            for (const dep of insight.relationships.dependencies.external) {
                patterns.totalExternalDependencies.add(dep);
            }
            for (const dep of insight.relationships.dependencies.internal) {
                patterns.totalInternalDependencies.add(dep);
            }
            
            // 耦合度分布
            patterns.couplingDistribution[insight.keyMetrics.coupling]++;
        }
        
        patterns.totalExternalDependencies = patterns.totalExternalDependencies.size;
        patterns.totalInternalDependencies = patterns.totalInternalDependencies.size;
        
        return patterns;
    }

    calculateQualityMetrics(keyInsights) {
        const metrics = {
            averageComplexity: 0,
            couplingScore: 0,
            cohesionScore: 0,
            maintainabilityIndex: 0
        };
        
        let totalComplexity = 0;
        let highCouplingCount = 0;
        let highCohesionCount = 0;
        
        for (const insight of keyInsights) {
            // 复杂度评分
            const complexityScore = insight.keyMetrics.complexity.overall === 'high' ? 3 : 
                                  insight.keyMetrics.complexity.overall === 'medium' ? 2 : 1;
            totalComplexity += complexityScore;
            
            // 耦合度评分
            if (insight.keyMetrics.coupling === 'high') highCouplingCount++;
            
            // 内聚度评分
            if (insight.keyMetrics.cohesion === 'high') highCohesionCount++;
        }
        
        metrics.averageComplexity = totalComplexity / keyInsights.length;
        metrics.couplingScore = (keyInsights.length - highCouplingCount) / keyInsights.length * 10;
        metrics.cohesionScore = highCohesionCount / keyInsights.length * 10;
        metrics.maintainabilityIndex = (metrics.cohesionScore + metrics.couplingScore) / 2;
        
        return metrics;
    }

    initializeArchitecturePatterns() {
        return {
            'Layered Architecture': {
                indicators: ['controller', 'service', 'repository', 'model'],
                confidence: 'high'
            },
            'MVC': {
                indicators: ['model', 'view', 'controller', 'router'],
                confidence: 'high'
            },
            'Microservices': {
                indicators: ['service', 'api', 'gateway', 'discovery'],
                confidence: 'medium'
            },
            'Event-Driven': {
                indicators: ['event', 'listener', 'emit', 'subscribe'],
                confidence: 'high'
            }
        };
    }
}

export default ArchitectureKeyExtractor;