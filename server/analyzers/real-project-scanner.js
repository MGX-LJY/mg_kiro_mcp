/**
 * 真实项目扫描器
 * 深度分析项目文件和结构，提供详细的真实数据源
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RealProjectScanner {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.scanResults = null;
    }

    /**
     * 执行完整项目扫描
     * @returns {Promise<Object>} 详细的项目分析结果
     */
    async scanProject() {
        console.log('[RealProjectScanner] 开始深度扫描项目...');
        
        const results = {
            basicInfo: await this._scanBasicInfo(),
            fileStructure: await this._scanFileStructure(),
            dependencies: await this._analyzeDependencies(),
            configuration: await this._analyzeConfiguration(),
            codeAnalysis: {},
            apiEndpoints: {},
            moduleStructure: {},
            statistics: {}
        };

        // 代码分析需要文件结构数据
        results.codeAnalysis = await this._analyzeCode(results.fileStructure);
        results.apiEndpoints = await this._extractAPIEndpoints(results.fileStructure);
        results.moduleStructure = await this._analyzeModuleStructure(results.fileStructure);

        // 计算统计信息
        results.statistics = this._calculateStatistics(results);
        
        this.scanResults = results;
        console.log('[RealProjectScanner] 项目扫描完成');
        return results;
    }

    /**
     * 扫描项目基本信息
     */
    async _scanBasicInfo() {
        const packageJsonPath = path.join(this.projectPath, 'package.json');
        let packageInfo = {};
        
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
                packageInfo = JSON.parse(packageContent);
            }
        } catch (error) {
            console.warn('[RealProjectScanner] 无法读取package.json:', error.message);
        }

        return {
            name: packageInfo.name || path.basename(this.projectPath),
            version: packageInfo.version || '0.0.0',
            description: packageInfo.description || '',
            author: packageInfo.author || '',
            license: packageInfo.license || 'ISC',
            type: packageInfo.type || 'commonjs',
            engines: packageInfo.engines || {},
            scripts: packageInfo.scripts || {},
            keywords: packageInfo.keywords || [],
            repository: packageInfo.repository || null,
            homepage: packageInfo.homepage || null
        };
    }

    /**
     * 扫描文件结构
     */
    async _scanFileStructure() {
        const structure = {
            directories: [],
            files: [],
            totalFiles: 0,
            totalDirectories: 0,
            filesByExtension: {},
            largestFiles: [],
            recentFiles: []
        };

        await this._scanDirectory(this.projectPath, structure, 0);
        
        // 按大小排序获取最大文件
        structure.largestFiles = structure.files
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map(f => ({
                path: f.relativePath,
                size: f.size,
                sizeFormatted: this._formatFileSize(f.size)
            }));

        // 按修改时间排序获取最近文件
        structure.recentFiles = structure.files
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .slice(0, 10)
            .map(f => ({
                path: f.relativePath,
                modified: f.modified,
                modifiedFormatted: new Date(f.modified).toLocaleString()
            }));

        return structure;
    }

    /**
     * 递归扫描目录
     */
    async _scanDirectory(dirPath, structure, depth) {
        if (depth > 10) return; // 防止过深递归
        
        const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
        const dirName = path.basename(dirPath);
        
        if (ignorePatterns.some(pattern => dirName.includes(pattern))) {
            return;
        }

        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relativePath = path.relative(this.projectPath, fullPath);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    structure.directories.push({
                        name: item,
                        path: fullPath,
                        relativePath,
                        depth,
                        itemCount: fs.readdirSync(fullPath).length
                    });
                    structure.totalDirectories++;
                    
                    await this._scanDirectory(fullPath, structure, depth + 1);
                } else if (stats.isFile()) {
                    const ext = path.extname(item);
                    const fileInfo = {
                        name: item,
                        path: fullPath,
                        relativePath,
                        extension: ext,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        created: stats.birthtime.toISOString()
                    };
                    
                    structure.files.push(fileInfo);
                    structure.totalFiles++;
                    
                    // 按扩展名分类
                    if (!structure.filesByExtension[ext]) {
                        structure.filesByExtension[ext] = { count: 0, totalSize: 0 };
                    }
                    structure.filesByExtension[ext].count++;
                    structure.filesByExtension[ext].totalSize += stats.size;
                }
            }
        } catch (error) {
            console.warn('[RealProjectScanner] 无法扫描目录:', dirPath, error.message);
        }
    }

    /**
     * 分析代码
     */
    async _analyzeCode(fileStructure) {
        const codeAnalysis = {
            totalLines: 0,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            languages: {},
            complexity: 'medium',
            mainFiles: [],
            classesAndFunctions: []
        };

        const codeFiles = fileStructure?.files?.filter(f => 
            ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'].includes(f.extension)
        ) || [];

        for (const file of codeFiles.slice(0, 50)) { // 限制分析文件数量
            try {
                const content = fs.readFileSync(file.path, 'utf8');
                const analysis = this._analyzeFileContent(content, file);
                
                codeAnalysis.totalLines += analysis.totalLines;
                codeAnalysis.codeLines += analysis.codeLines;
                codeAnalysis.commentLines += analysis.commentLines;
                codeAnalysis.blankLines += analysis.blankLines;
                
                if (analysis.classes.length > 0 || analysis.functions.length > 0) {
                    codeAnalysis.classesAndFunctions.push({
                        file: file.relativePath,
                        classes: analysis.classes,
                        functions: analysis.functions,
                        exports: analysis.exports,
                        imports: analysis.imports
                    });
                }
                
                if (analysis.isMainFile) {
                    codeAnalysis.mainFiles.push({
                        path: file.relativePath,
                        purpose: analysis.purpose,
                        importance: analysis.importance
                    });
                }
            } catch (error) {
                console.warn('[RealProjectScanner] 无法分析文件:', file.path);
            }
        }

        return codeAnalysis;
    }

    /**
     * 分析单个文件内容
     */
    _analyzeFileContent(content, fileInfo) {
        const lines = content.split('\n');
        const analysis = {
            totalLines: lines.length,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            classes: [],
            functions: [],
            exports: [],
            imports: [],
            isMainFile: false,
            purpose: '',
            importance: 'normal'
        };

        let inBlockComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                analysis.blankLines++;
                continue;
            }
            
            // 检查注释
            if (line.startsWith('//') || line.startsWith('#') || line.startsWith('*')) {
                analysis.commentLines++;
                continue;
            }
            
            if (line.includes('/*')) inBlockComment = true;
            if (line.includes('*/')) {
                inBlockComment = false;
                analysis.commentLines++;
                continue;
            }
            
            if (inBlockComment) {
                analysis.commentLines++;
                continue;
            }
            
            analysis.codeLines++;
            
            // 提取类定义
            const classMatch = line.match(/(?:export\s+)?(?:class|interface)\s+(\w+)/);
            if (classMatch) {
                analysis.classes.push({
                    name: classMatch[1],
                    line: i + 1,
                    exported: line.includes('export')
                });
            }
            
            // 提取函数定义
            const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{|function))/);
            if (funcMatch) {
                const funcName = funcMatch[1] || funcMatch[2];
                if (funcName && !['if', 'for', 'while', 'switch'].includes(funcName)) {
                    analysis.functions.push({
                        name: funcName,
                        line: i + 1,
                        async: line.includes('async'),
                        exported: line.includes('export')
                    });
                }
            }
            
            // 提取导入导出
            if (line.includes('import') && line.includes('from')) {
                const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    analysis.imports.push({
                        items: importMatch[1] || importMatch[2] || importMatch[3],
                        from: importMatch[4],
                        line: i + 1
                    });
                }
            }
            
            if (line.includes('export')) {
                const exportMatch = line.match(/export\s+(?:\{([^}]+)\}|(?:default\s+)?(\w+))/);
                if (exportMatch) {
                    analysis.exports.push({
                        items: exportMatch[1] || exportMatch[2],
                        default: line.includes('default'),
                        line: i + 1
                    });
                }
            }
        }
        
        // 判断是否为主要文件
        const fileName = fileInfo.name.toLowerCase();
        if (['index.js', 'main.js', 'app.js', 'server.js', 'index.ts'].includes(fileName)) {
            analysis.isMainFile = true;
            analysis.importance = 'high';
            analysis.purpose = '应用程序入口点';
        } else if (fileName.includes('config')) {
            analysis.importance = 'high';
            analysis.purpose = '配置文件';
        } else if (fileName.includes('test') || fileName.includes('spec')) {
            analysis.purpose = '测试文件';
        } else if (analysis.classes.length > 0) {
            analysis.importance = 'medium';
            analysis.purpose = '核心业务类';
        }
        
        return analysis;
    }

    /**
     * 分析依赖关系
     */
    async _analyzeDependencies() {
        const packageJsonPath = path.join(this.projectPath, 'package.json');
        let packageInfo = {};
        
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
                packageInfo = JSON.parse(packageContent);
            }
        } catch (error) {
            return { error: '无法读取package.json' };
        }

        const analysis = {
            production: packageInfo.dependencies || {},
            development: packageInfo.devDependencies || {},
            peer: packageInfo.peerDependencies || {},
            optional: packageInfo.optionalDependencies || {},
            analysis: {
                totalCount: 0,
                categories: {},
                securityRisks: [],
                outdatedPackages: [],
                heavyDependencies: []
            }
        };

        // 分析依赖类别
        const allDeps = { ...analysis.production, ...analysis.development };
        analysis.analysis.totalCount = Object.keys(allDeps).length;

        for (const [name, version] of Object.entries(allDeps)) {
            const category = this._categorizeDependency(name);
            if (!analysis.analysis.categories[category]) {
                analysis.analysis.categories[category] = [];
            }
            analysis.analysis.categories[category].push({ name, version, category });
        }

        return analysis;
    }

    /**
     * 分析配置文件
     */
    async _analyzeConfiguration() {
        const configFiles = [
            'package.json', '.env', '.gitignore', '.eslintrc.js', '.eslintrc.json',
            'tsconfig.json', 'webpack.config.js', 'vite.config.js', 'jest.config.js'
        ];

        const configuration = {
            files: [],
            settings: {},
            scripts: {},
            environments: []
        };

        for (const configFile of configFiles) {
            const configPath = path.join(this.projectPath, configFile);
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    const fileInfo = {
                        name: configFile,
                        path: configPath,
                        size: fs.statSync(configPath).size,
                        content: configFile.endsWith('.json') ? JSON.parse(content) : content.substring(0, 500)
                    };
                    configuration.files.push(fileInfo);
                    
                    if (configFile === 'package.json') {
                        const pkg = JSON.parse(content);
                        configuration.scripts = pkg.scripts || {};
                        configuration.settings.engines = pkg.engines || {};
                        configuration.settings.type = pkg.type || 'commonjs';
                    }
                } catch (error) {
                    console.warn('[RealProjectScanner] 无法读取配置文件:', configFile);
                }
            }
        }

        return configuration;
    }

    /**
     * 提取API端点
     */
    async _extractAPIEndpoints(fileStructure) {
        const endpoints = {
            routes: [],
            middleware: [],
            controllers: [],
            totalEndpoints: 0
        };

        // 查找路由文件
        const routeFiles = fileStructure?.files?.filter(f => 
            f.relativePath.includes('route') || 
            f.relativePath.includes('api') || 
            f.relativePath.includes('controller') ||
            f.name.includes('route')
        ) || [];

        for (const file of routeFiles) {
            try {
                const content = fs.readFileSync(file.path, 'utf8');
                const extractedRoutes = this._extractRoutesFromContent(content, file);
                endpoints.routes.push(...extractedRoutes);
            } catch (error) {
                console.warn('[RealProjectScanner] 无法分析路由文件:', file.path);
            }
        }

        endpoints.totalEndpoints = endpoints.routes.length;
        return endpoints;
    }

    /**
     * 从文件内容提取路由
     */
    _extractRoutesFromContent(content, fileInfo) {
        const routes = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Express路由模式
            const routeMatch = line.match(/(?:router|app)\.(get|post|put|delete|patch|use|all)\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (routeMatch) {
                routes.push({
                    method: routeMatch[1].toUpperCase(),
                    path: routeMatch[2],
                    file: fileInfo.relativePath,
                    line: i + 1,
                    middleware: this._extractMiddleware(line)
                });
            }
        }
        
        return routes;
    }

    /**
     * 分析模块结构
     */
    async _analyzeModuleStructure(fileStructure) {
        const structure = {
            modules: [],
            layers: {
                routes: [],
                services: [],
                controllers: [],
                middleware: [],
                utils: [],
                config: []
            },
            relationships: []
        };

        const files = fileStructure?.files || [];
        
        for (const file of files) {
            if (!['.js', '.ts'].includes(file.extension)) continue;
            
            const layer = this._identifyFileLayer(file);
            const moduleInfo = {
                name: path.basename(file.name, file.extension),
                path: file.relativePath,
                layer,
                size: file.size,
                importance: this._calculateFileImportance(file)
            };
            
            structure.modules.push(moduleInfo);
            
            if (structure.layers[layer]) {
                structure.layers[layer].push(moduleInfo);
            }
        }

        return structure;
    }

    /**
     * 计算统计信息
     */
    _calculateStatistics(results) {
        return {
            totalFiles: results.fileStructure.totalFiles,
            totalDirectories: results.fileStructure.totalDirectories,
            totalCodeLines: results.codeAnalysis.totalLines,
            totalClasses: results.codeAnalysis.classesAndFunctions.reduce((sum, f) => sum + f.classes.length, 0),
            totalFunctions: results.codeAnalysis.classesAndFunctions.reduce((sum, f) => sum + f.functions.length, 0),
            totalDependencies: results.dependencies.analysis.totalCount,
            totalEndpoints: results.apiEndpoints.totalEndpoints,
            projectComplexity: this._calculateComplexity(results),
            mainLanguage: this._detectMainLanguage(results.fileStructure.filesByExtension),
            projectSize: this._calculateProjectSize(results.fileStructure.files)
        };
    }

    // 辅助方法
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    _categorizeDependency(name) {
        const categories = {
            'framework': ['express', 'react', 'vue', 'angular', 'next', 'nuxt'],
            'testing': ['jest', 'mocha', 'chai', 'supertest', 'cypress'],
            'build': ['webpack', 'vite', 'rollup', 'parcel', 'babel'],
            'utility': ['lodash', 'axios', 'moment', 'uuid', 'fs-extra'],
            'database': ['mongodb', 'mysql', 'postgres', 'redis', 'mongoose'],
            'security': ['helmet', 'cors', 'bcrypt', 'jsonwebtoken'],
            'development': ['nodemon', 'eslint', 'prettier', 'typescript']
        };

        for (const [category, packages] of Object.entries(categories)) {
            if (packages.some(pkg => name.includes(pkg))) {
                return category;
            }
        }
        return 'other';
    }

    _extractMiddleware(line) {
        const middleware = [];
        if (line.includes('cors')) middleware.push('cors');
        if (line.includes('helmet')) middleware.push('helmet');
        if (line.includes('auth')) middleware.push('auth');
        return middleware;
    }

    _identifyFileLayer(file) {
        const path = file.relativePath.toLowerCase();
        if (path.includes('route')) return 'routes';
        if (path.includes('service')) return 'services';
        if (path.includes('controller')) return 'controllers';
        if (path.includes('middleware')) return 'middleware';
        if (path.includes('util')) return 'utils';
        if (path.includes('config')) return 'config';
        return 'other';
    }

    _calculateFileImportance(file) {
        let score = 0;
        if (file.name.includes('index')) score += 3;
        if (file.name.includes('main')) score += 3;
        if (file.name.includes('config')) score += 2;
        if (file.name.includes('server')) score += 3;
        if (file.size > 10000) score += 2;
        
        if (score >= 5) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
    }

    _calculateComplexity(results) {
        const totalFiles = results.fileStructure.totalFiles;
        const totalClasses = results.codeAnalysis.classesAndFunctions.reduce((sum, f) => sum + f.classes.length, 0);
        const totalDeps = results.dependencies.analysis.totalCount;
        
        const complexity = totalFiles + totalClasses + totalDeps;
        
        if (complexity > 100) return 'high';
        if (complexity > 50) return 'medium';
        return 'low';
    }

    _detectMainLanguage(filesByExtension) {
        let maxCount = 0;
        let mainLanguage = 'JavaScript';
        
        const languageMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript', 
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust'
        };
        
        for (const [ext, data] of Object.entries(filesByExtension)) {
            if (languageMap[ext] && data.count > maxCount) {
                maxCount = data.count;
                mainLanguage = languageMap[ext];
            }
        }
        
        return mainLanguage;
    }

    _calculateProjectSize(files) {
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        return this._formatFileSize(totalSize);
    }
}

export default RealProjectScanner;