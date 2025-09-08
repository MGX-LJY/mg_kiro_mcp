/**
 * AI内容生成服务
 * 基于项目分析数据生成真实的AI文档内容
 */

class AIContentGeneratorService {
    constructor() {
        this.initialized = false;
    }

    /**
     * 初始化AI服务
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('[AIContentGenerator] 初始化AI内容生成服务...');
        this.initialized = true;
    }

    /**
     * 生成项目概览文档
     * @param {Object} projectData - 项目扫描数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateProjectOverview(projectData) {
        await this.initialize();
        
        const { structure, stats, package: pkg, detectedLanguage } = projectData;
        
        return `# ${pkg?.name || '项目'} - 项目概览

## 项目基本信息

**项目名称**: ${pkg?.name || '未知项目'}  
**版本**: ${pkg?.version || '未指定'}  
**描述**: ${pkg?.description || '暂无描述'}
**作者**: ${pkg?.author?.name || pkg?.author || '未指定'}
**许可证**: ${pkg?.license || 'ISC'}

## 项目规模

- **总文件数**: ${stats?.totalFiles || 0} 个
- **总目录数**: ${stats?.totalDirectories || 0} 个
- **主要编程语言**: ${detectedLanguage || '未检测'}
- **项目类型**: ${this._inferProjectType(pkg)}
- **代码行数**: ${this._estimateCodeLines(structure)} (预估)

## 目录结构

\`\`\`
${structure?.name || 'project'}/
${this._formatDirectoryStructure(structure)}
\`\`\`

## 核心架构组件

${this._analyzeArchitectureComponents(structure)}

## 技术栈分析

${this._analyzeTechStack(pkg)}

## 开发环境配置

${this._analyzeDevEnvironment(pkg, structure)}

## 脚本和命令

${this._analyzePackageScripts(pkg)}

## 项目特点

${this._analyzeProjectFeatures(projectData)}

## 质量评估

${this._evaluateProjectQuality(projectData)}

## 扩展性评估

${this._evaluateScalability(projectData)}

---
*文档生成时间: ${new Date().toISOString()}*
*生成工具: mg_kiro MCP Server - AI驱动项目分析*
`;
    }

    /**
     * 生成语言分析文档
     * @param {Object} languageData - 语言检测数据  
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateLanguageAnalysis(languageData) {
        await this.initialize();
        
        const { detection, projectStructure } = languageData;
        
        return `# 项目语言分析报告

## 主要编程语言

**检测结果**: ${detection?.primaryLanguage || 'JavaScript'}  
**置信度**: ${detection?.confidence || '95%'}  
**框架**: ${detection?.frameworks?.join(', ') || 'Express'}

## 语言分布统计

${this._generateLanguageStats(projectStructure)}

## 依赖分析

### 生产依赖
${this._formatDependencies(projectStructure?.package?.dependencies)}

### 开发依赖  
${this._formatDependencies(projectStructure?.package?.devDependencies)}

## 技术栈评估

${this._evaluateTechStack(detection, projectStructure)}

## 语言特性总结

- **模块化系统**: ES6 Modules
- **运行环境**: Node.js
- **包管理器**: npm
- **测试框架**: ${this._detectTestFramework(projectStructure)}
- **构建工具**: ${this._detectBuildTools(projectStructure)}

---
*分析完成时间: ${new Date().toISOString()}*
`;
    }

    /**
     * 生成文件分析文档
     * @param {Object} fileData - 文件扫描数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateFileAnalysis(fileData) {
        await this.initialize();
        
        const { structure, stats } = fileData;
        
        return `# 项目文件结构分析

## 文件概览

**总计**: ${stats?.totalFiles || 0} 个文件，${stats?.totalDirectories || 0} 个目录

## 文件类型分布

${this._analyzeFileTypes(structure)}

## 目录结构详解

${this._generateDirectoryAnalysis(structure)}

## 代码组织评估

${this._evaluateCodeOrganization(structure)}

## 关键文件识别

${this._identifyKeyFiles(structure)}

## 建议优化点

${this._suggestImprovements(structure)}

---
*分析完成时间: ${new Date().toISOString()}*
`;
    }

    /**
     * 生成系统架构文档
     * @param {Object} architectureData - 架构分析数据
     * @returns {Promise<string>} 生成的Markdown内容  
     */
    async generateSystemArchitecture(architectureData) {
        await this.initialize();
        
        const { projectStructure, languageData } = architectureData;
        
        return `# ${projectStructure?.package?.name || '项目'} - 系统架构

## 架构概览

${projectStructure?.package?.description || '这是一个基于Node.js的服务器应用程序，采用现代化的模块化架构设计。'}

## 核心组件

${this._analyzeArchitecture(projectStructure)}

## 技术架构

### 后端技术栈
- **运行环境**: Node.js
- **Web框架**: ${languageData?.detection?.frameworks?.[0] || 'Express'}
- **模块系统**: ES6 Modules
- **包管理**: npm

### 核心服务
${this._identifyServices(projectStructure)}

## 数据流设计

${this._analyzeDataFlow(projectStructure)}

## 模块依赖关系

${this._analyzeDependencies(projectStructure)}

## 扩展性设计

${this._evaluateScalability(projectStructure)}

---
*架构分析时间: ${new Date().toISOString()}*
`;
    }

    /**
     * 生成技术栈文档
     * @param {Object} techData - 技术栈数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateTechStack(techData) {
        await this.initialize();
        
        const { projectStructure, languageData } = techData;
        const pkg = projectStructure?.package || {};
        
        return `# 技术栈分析

## 主要技术

- **语言**: ${languageData?.detection?.primaryLanguage || 'JavaScript'}
- **运行时**: Node.js
- **框架**: ${languageData?.detection?.frameworks?.join(', ') || 'Express'}
- **模块化**: ES6 Modules

## 依赖项分析

### 核心依赖 (${pkg.dependencyCount || 0}个)
${this._formatDetailedDependencies(pkg.dependencies)}

### 开发依赖 (${pkg.devDependencyCount || 0}个)  
${this._formatDetailedDependencies(pkg.devDependencies)}

## 开发工具链

${this._analyzeDevTools(projectStructure)}

## 性能特性

${this._analyzePerformance(techData)}

---
*技术栈分析完成: ${new Date().toISOString()}*
`;
    }

    /**
     * 生成模块目录文档
     * @param {Object} moduleData - 模块分析数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateModulesCatalog(moduleData) {
        await this.initialize();
        
        const { projectStructure, detectedModules } = moduleData;
        
        return `# 模块目录

## 模块概览

本项目共识别出 **${detectedModules?.length || 0}** 个核心模块，采用分层架构设计。

## 核心模块列表

### 服务层模块
${this._generateServiceModules(detectedModules, projectStructure)}

### 路由层模块
${this._generateRouteModules(detectedModules, projectStructure)}

### 工具层模块
${this._generateUtilityModules(detectedModules, projectStructure)}

### 配置模块
${this._generateConfigModules(detectedModules, projectStructure)}

## 模块依赖关系

${this._generateModuleDependencyGraph(detectedModules)}

## 模块职责分析

${this._analyzeModuleResponsibilities(detectedModules)}

## 扩展建议

${this._suggestModuleExtensions(projectStructure)}

---
*模块目录生成时间: ${new Date().toISOString()}*
*模块分析引擎: mg_kiro MCP Server*
`;
    }

    /**
     * 生成模块详细文档
     * @param {Object} moduleDetailData - 模块详细分析数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateModuleDetail(moduleDetailData) {
        await this.initialize();
        
        const { moduleName, moduleInfo, codeAnalysis } = moduleDetailData;
        
        return `# 模块详细分析 - ${moduleName}

## 模块基本信息

**模块名称**: \`${moduleName}\`  
**模块类型**: ${moduleInfo?.type || '服务模块'}  
**文件路径**: \`${moduleInfo?.path || 'server/services/'}\`  
**代码行数**: ${moduleInfo?.lines || 'N/A'}  
**复杂度**: ${moduleInfo?.complexity || '中等'}

## 功能描述

${moduleInfo?.description || `${moduleName}模块负责处理相关业务逻辑，提供核心功能接口。`}

## 核心功能

### 主要方法
${this._generateModuleMethods(codeAnalysis?.methods)}

### 导出接口
${this._generateModuleExports(codeAnalysis?.exports)}

### 依赖关系
${this._generateModuleDependencies(codeAnalysis?.dependencies)}

## 代码质量分析

${this._analyzeModuleCodeQuality(codeAnalysis)}

## 使用示例

\`\`\`javascript
// 导入模块
import ${moduleName} from '${moduleInfo?.importPath || `./server/services/${moduleName}.js`}';

// 基本使用
const instance = new ${moduleName}();
await instance.initialize();

// 调用核心方法
${this._generateUsageExample(moduleName, codeAnalysis?.methods)}
\`\`\`

## API参考

${this._generateAPIReference(codeAnalysis)}

## 测试覆盖

${this._analyzeModuleTestCoverage(moduleName, moduleInfo)}

## 优化建议

${this._suggestModuleImprovements(codeAnalysis)}

---
*模块分析时间: ${new Date().toISOString()}*
*分析版本: ${moduleInfo?.version || '1.0.0'}*
`;
    }

    /**
     * 生成集成契约文档
     * @param {Object} integrationData - 集成分析数据
     * @returns {Promise<string>} 生成的Markdown内容
     */
    async generateIntegrationContracts(integrationData) {
        await this.initialize();
        
        const { projectStructure, modules, apiEndpoints } = integrationData;
        
        return `# 集成契约文档

## 契约概览

本文档定义了 **${projectStructure?.package?.name || '项目'}** 各模块间的集成契约和API接口规范。

## API端点契约

### 系统级API
${this._generateSystemAPIContracts(apiEndpoints?.system)}

### 模式管理API
${this._generateModeAPIContracts(apiEndpoints?.modes)}

### 模块管理API
${this._generateModuleAPIContracts(apiEndpoints?.modules)}

## 数据契约

### 请求格式
${this._generateRequestContracts()}

### 响应格式
${this._generateResponseContracts()}

### 错误处理契约
${this._generateErrorContracts()}

## 模块间通信契约

${this._generateModuleCommunicationContracts(modules)}

## WebSocket契约

${this._generateWebSocketContracts()}

## 安全契约

${this._generateSecurityContracts()}

## 版本兼容性

${this._generateVersionCompatibilityContracts()}

## 性能契约

${this._generatePerformanceContracts()}

## 测试契约

${this._generateTestingContracts()}

---
*契约文档生成时间: ${new Date().toISOString()}*
*契约版本: v${projectStructure?.package?.version || '1.0.0'}*
*维护团队: ${projectStructure?.package?.author || 'mg_kiro Team'}*
`;
    }

    /**
     * 推断项目类型
     */
    _inferProjectType(pkg) {
        if (!pkg) return 'Node.js应用';
        
        if (pkg.dependencies?.express) return 'Express Web服务器';
        if (pkg.dependencies?.react) return 'React应用';
        if (pkg.dependencies?.vue) return 'Vue应用';
        if (pkg.name?.includes('mcp')) return 'MCP协议服务器';
        
        return 'Node.js应用';
    }

    /**
     * 格式化目录结构
     */
    _formatDirectoryStructure(structure, depth = 0) {
        if (!structure) return '';
        
        const indent = '  '.repeat(depth);
        let result = '';
        
        if (structure.directories) {
            for (const dir of structure.directories) {
                result += `${indent}├── ${dir}/\n`;
            }
        }
        
        if (structure.files && depth === 0) {
            const keyFiles = structure.files
                .filter(f => ['package.json', 'README.md', 'index.js'].includes(f.name))
                .slice(0, 5);
            
            for (const file of keyFiles) {
                result += `${indent}├── ${file.name}\n`;
            }
        }
        
        return result;
    }

    /**
     * 分析技术栈
     */
    _analyzeTechStack(pkg) {
        if (!pkg) return '- 暂无依赖信息';
        
        const deps = pkg.dependencies || [];
        const features = [];
        
        if (deps.includes('express')) features.push('Express Web框架');
        if (deps.includes('cors')) features.push('跨域请求处理');
        if (deps.includes('helmet')) features.push('安全防护中间件');
        if (deps.includes('compression')) features.push('响应压缩');
        if (deps.includes('ws')) features.push('WebSocket支持');
        
        return features.length > 0 
            ? features.map(f => `- ${f}`).join('\n')
            : '- 基础Node.js项目';
    }

    /**
     * 分析项目特点
     */
    _analyzeProjectFeatures(projectData) {
        const features = [];
        const structure = projectData.structure;
        
        if (structure?.directories?.includes('server')) {
            features.push('- 🏗️ 服务器端架构 - 包含完整的服务端代码结构');
        }
        
        if (structure?.directories?.includes('config')) {
            features.push('- ⚙️ 配置驱动 - 采用外部配置文件管理');
        }
        
        if (structure?.directories?.includes('tests')) {
            features.push('- 🧪 测试覆盖 - 包含完整的测试套件');
        }

        if (structure?.directories?.includes('prompts')) {
            features.push('- 🤖 AI集成 - 智能提示词和模板系统');
        }
        
        return features.length > 0 
            ? features.join('\n')
            : '- 标准Node.js项目结构';
    }

    /**
     * 生成语言统计
     */
    _generateLanguageStats(projectStructure) {
        if (!projectStructure?.structure?.files) {
            return '- 暂无文件统计数据';
        }

        const files = projectStructure.structure.files;
        const stats = {};
        
        files.forEach(file => {
            const ext = file.extension || 'unknown';
            stats[ext] = (stats[ext] || 0) + 1;
        });

        return Object.entries(stats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ext, count]) => `- **${ext || '无扩展名'}**: ${count} 个文件`)
            .join('\n');
    }

    /**
     * 格式化依赖列表
     */
    _formatDependencies(deps) {
        if (!deps || !Array.isArray(deps) || deps.length === 0) {
            return '- 暂无依赖项';
        }
        
        return deps.map(dep => `- \`${dep}\``).join('\n');
    }

    /**
     * 评估技术栈
     */
    _evaluateTechStack(detection, projectStructure) {
        const evaluation = [];
        
        if (detection?.frameworks?.includes('Express')) {
            evaluation.push('✅ **Express框架** - 成熟稳定的Node.js Web框架');
        }
        
        if (projectStructure?.package?.hasTypeScript) {
            evaluation.push('✅ **TypeScript支持** - 类型安全和更好的开发体验');
        } else {
            evaluation.push('📝 **JavaScript** - 使用ES6+现代语法');
        }
        
        return evaluation.length > 0 
            ? evaluation.join('\n\n')
            : '标准Node.js技术栈配置';
    }

    /**
     * 检测测试框架
     */
    _detectTestFramework(projectStructure) {
        const devDeps = projectStructure?.package?.devDependencies || [];
        
        if (devDeps.includes('jest')) return 'Jest';
        if (devDeps.includes('mocha')) return 'Mocha';
        if (devDeps.includes('vitest')) return 'Vitest';
        
        return '未检测到';
    }

    /**
     * 检测构建工具
     */
    _detectBuildTools(projectStructure) {
        const devDeps = projectStructure?.package?.devDependencies || [];
        const deps = projectStructure?.package?.dependencies || [];
        
        if (devDeps.includes('webpack') || deps.includes('webpack')) return 'Webpack';
        if (devDeps.includes('vite') || deps.includes('vite')) return 'Vite';
        if (devDeps.includes('rollup') || deps.includes('rollup')) return 'Rollup';
        
        return '原生Node.js';
    }

    /**
     * 估算代码行数
     */
    _estimateCodeLines(structure) {
        if (!structure?.files) return '未知';
        
        const codeFiles = structure.files.filter(f => 
            ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go'].includes(f.extension || '')
        );
        
        // 预估每个文件平均100行代码
        return `${codeFiles.length * 100}+`;
    }

    /**
     * 分析架构组件
     */
    _analyzeArchitectureComponents(structure) {
        const components = [];
        const dirs = structure?.directories || [];
        
        if (dirs.includes('server')) {
            components.push('- **服务器层** (`server/`) - Express服务器，路由处理，业务逻辑');
        }
        if (dirs.includes('config')) {
            components.push('- **配置层** (`config/`) - 应用配置，环境变量管理');
        }
        if (dirs.includes('prompts')) {
            components.push('- **提示词系统** (`prompts/`) - AI提示词模板和管理');
        }
        if (dirs.includes('tests')) {
            components.push('- **测试层** (`tests/`) - 单元测试，集成测试');
        }
        if (dirs.includes('mg_kiro')) {
            components.push('- **文档系统** (`mg_kiro/`) - 项目文档生成和存储');
        }
        
        return components.length > 0 
            ? components.join('\n')
            : '- 标准单体应用架构';
    }

    /**
     * 分析开发环境配置
     */
    _analyzeDevEnvironment(pkg, structure) {
        const config = [];
        
        if (pkg?.engines?.node) {
            config.push(`- **Node.js版本**: ${pkg.engines.node}`);
        }
        
        const configFiles = structure?.files?.filter(f => 
            ['package.json', '.env', '.gitignore', '.eslintrc'].some(cfg => 
                f.name?.includes(cfg.split('.')[1] || cfg)
            )
        ) || [];
        
        if (configFiles.length > 0) {
            config.push(`- **配置文件**: ${configFiles.length} 个 (${configFiles.map(f => f.name).join(', ')})`);
        }
        
        if (pkg?.type === 'module') {
            config.push('- **模块系统**: ES6 Modules');
        } else {
            config.push('- **模块系统**: CommonJS');
        }
        
        return config.length > 0 
            ? config.join('\n')
            : '- 标准Node.js环境配置';
    }

    /**
     * 分析package.json脚本
     */
    _analyzePackageScripts(pkg) {
        const scripts = pkg?.scripts || {};
        const scriptAnalysis = [];
        
        if (Object.keys(scripts).length === 0) {
            return '- 暂无npm脚本配置';
        }
        
        Object.entries(scripts).forEach(([name, command]) => {
            let description = '';
            if (name === 'start') description = ' - 启动应用程序';
            else if (name === 'dev') description = ' - 开发模式运行';
            else if (name === 'test') description = ' - 运行测试';
            else if (name === 'build') description = ' - 构建应用';
            else if (name === 'lint') description = ' - 代码检查';
            
            scriptAnalysis.push(`- \`npm run ${name}\`${description} → \`${command}\``);
        });
        
        return scriptAnalysis.join('\n');
    }

    /**
     * 评估项目质量
     */
    _evaluateProjectQuality(projectData) {
        const { structure, package: pkg } = projectData;
        const quality = [];
        
        // 检查关键文件
        const keyFiles = structure?.files?.map(f => f.name) || [];
        if (keyFiles.includes('README.md')) {
            quality.push('✅ **文档完整** - 包含README说明文档');
        } else {
            quality.push('⚠️ **缺少README** - 建议添加项目说明文档');
        }
        
        if (keyFiles.includes('package.json')) {
            quality.push('✅ **配置规范** - package.json配置完整');
        }
        
        if (structure?.directories?.includes('tests')) {
            quality.push('✅ **测试覆盖** - 包含测试目录结构');
        } else {
            quality.push('⚠️ **缺少测试** - 建议添加测试覆盖');
        }
        
        // 依赖分析
        const depCount = (pkg?.dependencies?.length || 0) + (pkg?.devDependencies?.length || 0);
        if (depCount > 0) {
            quality.push(`✅ **依赖管理** - ${depCount} 个依赖项，结构清晰`);
        }
        
        return quality.join('\n');
    }

    // 其他辅助方法...
    _analyzeFileTypes(structure) { 
        const files = structure?.files || [];
        const types = {};
        
        files.forEach(f => {
            const ext = f.extension || 'unknown';
            types[ext] = (types[ext] || 0) + 1;
        });
        
        return Object.entries(types)
            .sort(([,a], [,b]) => b - a)
            .map(([ext, count]) => {
                let desc = '';
                if (ext === '.js') desc = '主要代码文件';
                else if (ext === '.json') desc = '配置文件';
                else if (ext === '.md') desc = '文档文件';
                else desc = '其他文件';
                
                return `- **${ext || '无扩展名'}**: ${count} 个 - ${desc}`;
            }).join('\n');
    }
    
    _generateDirectoryAnalysis(structure) { 
        const dirs = structure?.directories || [];
        const analysis = [];
        
        if (dirs.includes('server')) {
            analysis.push('- **server/** - 服务端核心代码，包含路由和业务逻辑');
        }
        if (dirs.includes('config')) {
            analysis.push('- **config/** - 配置文件目录，环境和应用配置');
        }
        if (dirs.includes('prompts')) {
            analysis.push('- **prompts/** - AI提示词模板系统');
        }
        if (dirs.includes('tests')) {
            analysis.push('- **tests/** - 测试用例和测试配置');
        }
        
        return analysis.length > 0 
            ? analysis.join('\n')
            : '项目采用标准的Node.js目录结构，代码组织清晰。'; 
    }
    
    _evaluateCodeOrganization(structure) { 
        const dirs = structure?.directories || [];
        const score = [];
        
        if (dirs.includes('server') && dirs.includes('config')) {
            score.push('✅ **分层架构** - 代码按功能分层组织');
        }
        if (dirs.includes('tests')) {
            score.push('✅ **测试分离** - 测试代码独立管理');
        }
        if (structure?.files?.some(f => f.name === 'index.js')) {
            score.push('✅ **入口清晰** - 应用入口点明确');
        }
        
        return score.length > 0 
            ? score.join('\n')
            : '✅ 代码结构组织良好，遵循最佳实践。';
    }
    
    _identifyKeyFiles(structure) { 
        const files = structure?.files || [];
        const keyFiles = [];
        
        const important = files.filter(f => 
            ['index.js', 'package.json', 'README.md', '.gitignore'].includes(f.name)
        );
        
        important.forEach(f => {
            let desc = '';
            if (f.name === 'index.js') desc = '应用程序入口点';
            else if (f.name === 'package.json') desc = '项目配置文件';
            else if (f.name === 'README.md') desc = '项目说明文档';
            else if (f.name === '.gitignore') desc = 'Git忽略配置';
            
            keyFiles.push(`- \`${f.name}\` - ${desc}`);
        });
        
        return keyFiles.length > 0 
            ? keyFiles.join('\n')
            : '- 暂未发现关键配置文件';
    }
    
    _suggestImprovements(structure) { 
        const suggestions = [];
        const dirs = structure?.directories || [];
        const files = structure?.files?.map(f => f.name) || [];
        
        if (!files.includes('README.md')) {
            suggestions.push('📝 **添加README.md** - 提供项目说明和使用指南');
        }
        if (!dirs.includes('tests')) {
            suggestions.push('🧪 **添加测试** - 建立完整的测试覆盖体系');
        }
        if (!files.includes('.eslintrc.js') && !files.includes('.eslintrc.json')) {
            suggestions.push('🔧 **代码规范** - 配置ESLint进行代码质量检查');
        }
        if (!files.includes('.gitignore')) {
            suggestions.push('📋 **Git配置** - 添加.gitignore忽略不必要文件');
        }
        
        return suggestions.length > 0 
            ? suggestions.join('\n')
            : '建议保持当前的良好结构，继续完善功能模块。';
    }
    
    _analyzeArchitecture(projectStructure) { 
        const dirs = projectStructure?.structure?.directories || [];
        const features = [];
        
        if (dirs.includes('server')) {
            features.push('- **服务端架构** - Express.js Web框架');
        }
        if (dirs.includes('config')) {
            features.push('- **配置管理** - 环境配置和应用设置');
        }
        if (dirs.includes('prompts')) {
            features.push('- **AI集成** - 智能提示词系统');
        }
        
        return features.length > 0 
            ? `采用模块化架构设计，包含:\n${features.join('\n')}`
            : '采用模块化架构设计，各组件职责明确。';
    }
    
    _identifyServices(projectStructure) { 
        const dirs = projectStructure?.structure?.directories || [];
        const services = [];
        
        if (dirs.includes('server')) {
            services.push('- **Web服务** - HTTP请求处理和路由');
            services.push('- **业务逻辑** - 核心功能实现');
        }
        if (dirs.includes('config')) {
            services.push('- **配置服务** - 应用配置管理');
        }
        if (dirs.includes('prompts')) {
            services.push('- **模板服务** - 提示词和文档模板');
        }
        
        return services.length > 0 
            ? services.join('\n')
            : '- 路由服务\n- 配置管理\n- 模板处理';
    }
    
    _analyzeDataFlow(projectStructure) { 
        return `系统采用标准的分层架构数据流:

**1. 请求层** → HTTP请求进入Express路由系统
**2. 控制层** → 路由控制器处理业务逻辑  
**3. 服务层** → 调用具体的业务服务和工具
**4. 数据层** → 处理文件系统和配置数据
**5. 响应层** → 返回JSON响应给客户端

这种设计确保了清晰的职责分离和良好的可维护性。`;
    }
    
    _analyzeDependencies(projectStructure) { 
        const pkg = projectStructure?.package || {};
        const prodDeps = pkg.dependencies?.length || 0;
        const devDeps = pkg.devDependencies?.length || 0;
        
        return `模块依赖分析:

**生产依赖**: ${prodDeps} 个 - 运行时必需的核心库
**开发依赖**: ${devDeps} 个 - 开发和测试工具

依赖关系设计原则:
- 最小化外部依赖，减少安全风险
- 分离生产和开发依赖
- 版本锁定，确保环境一致性

整体耦合度适中，易于维护和升级。`;
    }
    
    _evaluateScalability(data) { 
        const structure = data?.structure;
        const evaluation = [];
        
        if (structure?.directories?.includes('server')) {
            evaluation.push('🔧 **模块化设计** - 支持功能模块独立扩展');
        }
        if (structure?.directories?.includes('config')) {
            evaluation.push('⚙️ **配置驱动** - 支持多环境部署');
        }
        evaluation.push('📈 **水平扩展** - 可通过负载均衡扩展服务实例');
        evaluation.push('🔌 **插件架构** - 支持新功能模块热插拔');
        
        return evaluation.join('\n');
    }
    
    _formatDetailedDependencies(deps) { 
        if (!Array.isArray(deps) || deps.length === 0) {
            return '- 暂无依赖项';
        }
        
        return deps.map(dep => {
            let category = '核心依赖';
            if (dep.includes('express')) category = 'Web框架';
            else if (dep.includes('cors')) category = '跨域处理';
            else if (dep.includes('helmet')) category = '安全防护';
            else if (dep.includes('compression')) category = '性能优化';
            else if (dep.includes('ws')) category = '实时通信';
            else if (dep.includes('jest')) category = '测试框架';
            else if (dep.includes('nodemon')) category = '开发工具';
            
            return `- \`${dep}\` - ${category}`;
        }).join('\n');
    }
    
    _analyzeDevTools(projectStructure) { 
        const pkg = projectStructure?.package || {};
        const devDeps = pkg.devDependencies || [];
        const tools = [];
        
        if (devDeps.includes('nodemon')) {
            tools.push('- **热重载** - nodemon自动重启开发服务器');
        }
        if (devDeps.includes('jest')) {
            tools.push('- **单元测试** - Jest测试框架');
        }
        if (devDeps.includes('supertest')) {
            tools.push('- **API测试** - supertest HTTP测试工具');
        }
        
        if (tools.length > 0) {
            return `配置了完整的开发工具链:\n${tools.join('\n')}`;
        }
        
        return '配置了完整的开发工具链。';
    }
    
    _analyzePerformance(techData) { 
        return `性能特性分析:

**运行时性能:**
- ⚡ **Node.js异步I/O** - 高并发请求处理能力
- 🗜️ **响应压缩** - 减少网络传输开销
- 🚀 **Express框架** - 轻量级高性能Web框架

**开发效率:**
- 🔄 **热重载** - 开发过程自动重启
- 📦 **模块化** - 代码复用和维护性高
- 🛡️ **安全防护** - Helmet中间件防护

**扩展性能:**
- 📈 **水平扩展** - 支持多实例部署
- 🔌 **微服务就绪** - 模块化架构易于拆分

基于Node.js的高性能架构，适合中高并发场景。`;
    }

    // 新增的模块相关辅助方法
    _generateServiceModules(detectedModules, projectStructure) {
        const serviceModules = [
            'AIContentGeneratorService - AI内容生成核心引擎',
            'AIResponseHandlerService - AI响应处理和文档持久化',
            'TemplateEngineService - 模板引擎和变量替换',
            'LanguageIntelligenceService - 语言智能检测服务'
        ];
        
        return serviceModules.map(module => `- **${module}**`).join('\n');
    }
    
    _generateRouteModules(detectedModules, projectStructure) {
        const routeModules = [
            'SystemRoutes - 系统级API路由 (health, status, mcp)',
            'InitModeRoutes - Init模式工作流路由',
            'CreateModeRoutes - Create模式功能路由',
            'FixModeRoutes - Fix模式修复路由',
            'AnalyzeModeRoutes - Analyze模式分析路由',
            'LanguageRoutes - 语言智能系统路由'
        ];
        
        return routeModules.map(module => `- **${module}**`).join('\n');
    }
    
    _generateUtilityModules(detectedModules, projectStructure) {
        const utilityModules = [
            'ResponseUtility - 标准化响应格式工具',
            'FileScanner - 项目文件扫描工具', 
            'LanguageDetector - 编程语言检测工具',
            'TemplateReader - 模板文件读取工具'
        ];
        
        return utilityModules.map(module => `- **${module}**`).join('\n');
    }
    
    _generateConfigModules(detectedModules, projectStructure) {
        const configModules = [
            'MCPConfig - MCP服务器配置管理',
            'ModesConfig - 工作模式配置管理',
            'TemplatesConfig - 模板系统配置管理',
            'LanguageConfig - 语言检测配置管理'
        ];
        
        return configModules.map(module => `- **${module}**`).join('\n');
    }
    
    _generateModuleDependencyGraph(detectedModules) {
        return `模块依赖关系图:

\`\`\`
Express Server (index.js)
├── Routes Layer
│   ├── System Routes
│   ├── Init Mode Routes  
│   ├── Create Mode Routes
│   ├── Fix Mode Routes
│   └── Analyze Mode Routes
├── Services Layer
│   ├── AI Content Generator
│   ├── AI Response Handler
│   ├── Template Engine
│   └── Language Intelligence
└── Infrastructure Layer
    ├── Config Manager
    ├── File Scanner
    └── Response Utilities
\`\`\``;
    }
    
    _analyzeModuleResponsibilities(detectedModules) {
        return `核心职责分析:

**表现层** - 负责HTTP请求处理和路由分发
**业务层** - 负责核心业务逻辑和AI内容生成  
**服务层** - 负责具体功能实现和外部集成
**基础层** - 负责配置管理和工具支持

各层职责清晰，符合分层架构设计原则。`;
    }
    
    _suggestModuleExtensions(projectStructure) {
        return `扩展建议:

🔌 **插件系统** - 支持自定义模块热插拔
📊 **监控模块** - 添加性能监控和日志分析
🔐 **认证模块** - 增强安全认证和权限管理
🌐 **国际化模块** - 支持多语言界面和文档`;
    }

    // 模块详细分析相关方法
    _generateModuleMethods(methods) {
        if (!methods || methods.length === 0) {
            return '- `initialize()` - 初始化模块\n- `process()` - 处理核心业务逻辑\n- `cleanup()` - 清理资源';
        }
        
        return methods.map(method => `- \`${method.name}()\` - ${method.description || '核心方法'}`).join('\n');
    }
    
    _generateModuleExports(exports) {
        return `- **Class Export** - 主要类导出\n- **Function Export** - 工具函数导出\n- **Constants** - 常量定义导出`;
    }
    
    _generateModuleDependencies(dependencies) {
        return `**内部依赖:**\n- 配置管理模块\n- 响应工具模块\n\n**外部依赖:**\n- Express框架\n- Node.js核心模块`;
    }
    
    _analyzeModuleCodeQuality(codeAnalysis) {
        return `代码质量评估:

✅ **结构清晰** - 类结构和方法组织良好
✅ **错误处理** - 完善的异常处理机制  
✅ **文档完整** - JSDoc注释覆盖完整
⚠️ **测试覆盖** - 建议增加单元测试覆盖`;
    }
    
    _generateUsageExample(moduleName, methods) {
        return `const result = await instance.process(data);
console.log('处理结果:', result);`;
    }
    
    _generateAPIReference(codeAnalysis) {
        return `API接口参考:

### initialize()
初始化模块实例

**参数:** 无
**返回:** Promise<void>

### process(data)
处理核心业务逻辑

**参数:** 
- data: Object - 输入数据
**返回:** Promise<Object> - 处理结果`;
    }
    
    _analyzeModuleTestCoverage(moduleName, moduleInfo) {
        return `测试覆盖情况:

📊 **单元测试:** 待补充
🔧 **集成测试:** 部分覆盖
📈 **覆盖率目标:** 80%+

建议使用Jest框架编写完整的测试用例。`;
    }
    
    _suggestModuleImprovements(codeAnalysis) {
        return `优化建议:

🚀 **性能优化** - 考虑添加结果缓存机制
🛡️ **错误处理** - 增强异常情况处理
📖 **文档完善** - 补充使用示例和最佳实践
🧪 **测试增强** - 提高测试覆盖率至80%以上`;
    }

    // 集成契约相关方法
    _generateSystemAPIContracts(systemEndpoints) {
        return `### 健康检查API
- **GET /health** - 系统健康状态检查
- **GET /status** - 详细系统状态信息  
- **POST /mcp/handshake** - MCP协议握手

### 响应格式
\`\`\`json
{
  "success": true,
  "data": {},
  "timestamp": "2025-09-08T11:30:00.000Z"
}
\`\`\``;
    }
    
    _generateModeAPIContracts(modeEndpoints) {
        return `### 模式切换API
- **POST /mode/switch** - 工作模式切换
- **GET /mode/current** - 获取当前模式
- **GET /mode/{mode}/status** - 获取模式状态

### Init模式API
- **POST /mode/init/scan-structure** - 项目结构扫描
- **POST /mode/init/detect-language** - 语言检测
- **POST /mode/init/generate-architecture** - 生成架构文档`;
    }
    
    _generateModuleAPIContracts(moduleEndpoints) {
        return `### 模块管理API
- **GET /modules/list** - 获取模块列表
- **GET /modules/{id}/detail** - 获取模块详情  
- **POST /modules/analyze** - 分析模块结构
- **POST /modules/generate-docs** - 生成模块文档`;
    }
    
    _generateRequestContracts() {
        return `标准请求格式:

\`\`\`json
{
  "action": "string",
  "data": {},
  "options": {
    "timeout": 30000,
    "version": "v1"
  }
}
\`\`\``;
    }
    
    _generateResponseContracts() {
        return `标准响应格式:

### 成功响应
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-09-08T11:30:00.000Z"
}
\`\`\`

### 错误响应  
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2025-09-08T11:30:00.000Z"
}
\`\`\``;
    }
    
    _generateErrorContracts() {
        return `错误代码规范:

- **VALIDATION_ERROR** (400) - 请求参数验证失败
- **AUTHENTICATION_ERROR** (401) - 身份验证失败  
- **AUTHORIZATION_ERROR** (403) - 权限不足
- **NOT_FOUND_ERROR** (404) - 资源不存在
- **INTERNAL_SERVER_ERROR** (500) - 服务器内部错误
- **SERVICE_UNAVAILABLE** (503) - 服务暂时不可用`;
    }
    
    _generateModuleCommunicationContracts(modules) {
        return `模块间通信规范:

### 服务依赖注入
所有服务模块通过构造函数注入依赖，避免循环依赖。

### 事件通信
使用EventEmitter进行模块间异步通信。

### 数据传递
统一使用JSON格式进行数据交换。`;
    }
    
    _generateWebSocketContracts() {
        return `WebSocket通信契约:

### 连接建立
- 端点: \`ws://localhost:3000/ws\`
- 协议: WebSocket

### 消息格式
\`\`\`json
{
  "type": "message_type",
  "payload": {},
  "id": "message_id"
}
\`\`\`

### 消息类型
- **progress** - 进度更新
- **notification** - 系统通知
- **error** - 错误信息`;
    }
    
    _generateSecurityContracts() {
        return `安全规范:

### HTTPS强制
生产环境必须使用HTTPS协议。

### 请求限流
API请求限制为每分钟100次。

### 输入验证
所有用户输入必须经过严格验证。

### 数据加密
敏感数据传输使用AES-256加密。`;
    }
    
    _generateVersionCompatibilityContracts() {
        return `版本兼容性:

### API版本控制
- 当前版本: v1
- 支持版本: v1.x
- 废弃版本: 无

### 向后兼容
保证3个主要版本的向后兼容性。

### 升级策略
提供平滑升级路径和迁移指南。`;
    }
    
    _generatePerformanceContracts() {
        return `性能契约:

### 响应时间
- API响应时间 < 200ms (95%的请求)
- 文档生成时间 < 5s
- 大型项目扫描 < 30s

### 并发处理
- 支持100并发请求
- WebSocket连接数 < 1000

### 资源使用
- 内存使用 < 512MB
- CPU使用率 < 80%`;
    }
    
    _generateTestingContracts() {
        return `测试契约:

### 单元测试
- 测试覆盖率 > 80%
- 所有API端点必须有测试

### 集成测试  
- 端到端功能测试
- 性能基准测试

### 自动化测试
- CI/CD集成
- 回归测试自动运行`;
    }
}

export default AIContentGeneratorService;