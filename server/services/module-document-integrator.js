/**
 * 模块化文档整合服务
 * 将AI生成的分散文件文档整合为模块化的完整文档体系
 * 
 * 核心功能：
 * - 文件文档分类和模块化整合
 * - 每个模块生成统一文档
 * - 总模块概览文档生成
 * - 模块间连接关系分析和文档生成
 * - 调用模版系统进行格式化
 * 
 * 工作流程：
 * 1. 收集所有生成的文件文档
 * 2. 分析文档内容和模块归属
 * 3. 按模块整合相关文档
 * 4. 生成每个模块的完整文档
 * 5. 创建总览和连接文档
 * 6. 应用模版格式化
 */

import { promises as fs } from 'fs';
import { join, resolve, basename, dirname, extname } from 'path';
import TemplateReader from './template-reader.js';

export class ModuleDocumentIntegrator {
    constructor() {
        this.templateReader = new TemplateReader();
        
        // 模块分类规则
        this.modulePatterns = {
            core: {
                name: '核心模块',
                patterns: ['index', 'main', 'app', 'core', 'bootstrap'],
                priority: 100,
                description: '应用的核心启动和基础框架'
            },
            config: {
                name: '配置模块',
                patterns: ['config', 'settings', 'environment', 'constants'],
                priority: 90,
                description: '应用配置和环境管理'
            },
            routes: {
                name: '路由模块',
                patterns: ['routes', 'router', 'endpoints', 'api'],
                priority: 80,
                description: 'API路由和端点定义'
            },
            controllers: {
                name: '控制器模块',
                patterns: ['controller', 'handler', 'ctrl'],
                priority: 70,
                description: '业务逻辑控制器'
            },
            services: {
                name: '服务模块',
                patterns: ['service', 'provider', 'manager', 'client'],
                priority: 60,
                description: '核心业务服务和逻辑'
            },
            models: {
                name: '数据模型',
                patterns: ['model', 'schema', 'entity', 'dto'],
                priority: 50,
                description: '数据结构和模型定义'
            },
            utils: {
                name: '工具模块',
                patterns: ['util', 'helper', 'lib', 'common', 'tools'],
                priority: 40,
                description: '通用工具和辅助函数'
            },
            middleware: {
                name: '中间件模块',
                patterns: ['middleware', 'interceptor', 'filter'],
                priority: 30,
                description: '请求处理中间件'
            },
            tests: {
                name: '测试模块',
                patterns: ['test', 'spec', '__test__', 'tests'],
                priority: 20,
                description: '测试代码和测试套件'
            },
            other: {
                name: '其他模块',
                patterns: [],
                priority: 10,
                description: '其他辅助文件和模块'
            }
        };
        
        // 文档整合状态
        this.integrationState = {
            projectPath: null,
            collectedDocs: [],
            moduleGroups: {},
            integratedModules: {},
            overviewDocument: null,
            connectionDocument: null,
            generatedAt: null
        };
    }

    /**
     * 初始化文档整合流程
     */
    async initializeIntegration(projectPath, options = {}) {
        console.log(`[ModuleIntegrator] 初始化文档整合: ${projectPath}`);
        
        const {
            outputDir = 'docs/modules',
            templateName = 'module-documentation',
            includeOverview = true,
            includeConnections = true
        } = options;

        this.integrationState = {
            projectPath: resolve(projectPath),
            outputDir: join(projectPath, outputDir),
            templateName,
            includeOverview,
            includeConnections,
            collectedDocs: [],
            moduleGroups: {},
            integratedModules: {},
            overviewDocument: null,
            connectionDocument: null,
            generatedAt: new Date().toISOString()
        };

        // 确保输出目录存在
        await this.ensureOutputDirectory();

        return {
            success: true,
            message: '文档整合初始化成功',
            config: {
                projectPath: this.integrationState.projectPath,
                outputDir: this.integrationState.outputDir,
                templateName: this.integrationState.templateName
            }
        };
    }

    /**
     * 收集AI生成的文档
     */
    async collectGeneratedDocuments(documentSources) {
        console.log(`[ModuleIntegrator] 收集生成的文档: ${documentSources.length}个来源`);

        const collectedDocs = [];

        for (const source of documentSources) {
            try {
                let docs = [];

                if (source.type === 'directory') {
                    docs = await this.collectFromDirectory(source.path, source.pattern || '*.md');
                } else if (source.type === 'files') {
                    docs = await this.collectFromFileList(source.files);
                } else if (source.type === 'memory') {
                    docs = source.documents || [];
                }

                for (const doc of docs) {
                    const enrichedDoc = await this.enrichDocumentMetadata(doc, source);
                    collectedDocs.push(enrichedDoc);
                }

            } catch (error) {
                console.warn(`[ModuleIntegrator] 收集文档失败: ${source.path || source.type}`, error.message);
            }
        }

        this.integrationState.collectedDocs = collectedDocs;
        console.log(`[ModuleIntegrator] 共收集到 ${collectedDocs.length} 个文档`);

        return {
            success: true,
            collected: collectedDocs.length,
            documents: collectedDocs.map(doc => ({
                title: doc.title,
                module: doc.module,
                path: doc.path,
                size: doc.content ? doc.content.length : 0
            }))
        };
    }

    /**
     * 分析和分组文档
     */
    async analyzeAndGroupDocuments() {
        console.log('[ModuleIntegrator] 分析和分组文档...');

        const moduleGroups = {};

        // 初始化模块组
        for (const [moduleKey, moduleInfo] of Object.entries(this.modulePatterns)) {
            moduleGroups[moduleKey] = {
                ...moduleInfo,
                documents: [],
                totalSize: 0,
                fileCount: 0
            };
        }

        // 分类文档
        for (const doc of this.integrationState.collectedDocs) {
            const moduleKey = this.classifyDocumentModule(doc);
            
            if (moduleGroups[moduleKey]) {
                moduleGroups[moduleKey].documents.push(doc);
                moduleGroups[moduleKey].totalSize += doc.content ? doc.content.length : 0;
                moduleGroups[moduleKey].fileCount++;
                
                // 更新文档的模块信息
                doc.assignedModule = moduleKey;
                doc.moduleName = moduleGroups[moduleKey].name;
            }
        }

        // 移除空模块
        const nonEmptyModules = {};
        for (const [key, module] of Object.entries(moduleGroups)) {
            if (module.documents.length > 0) {
                nonEmptyModules[key] = module;
            }
        }

        this.integrationState.moduleGroups = nonEmptyModules;

        console.log(`[ModuleIntegrator] 发现 ${Object.keys(nonEmptyModules).length} 个非空模块`);

        return {
            success: true,
            modules: Object.keys(nonEmptyModules),
            distribution: Object.entries(nonEmptyModules).map(([key, module]) => ({
                moduleKey: key,
                moduleName: module.name,
                documentCount: module.fileCount,
                totalSize: module.totalSize
            }))
        };
    }

    /**
     * 整合每个模块的文档
     */
    async integrateModuleDocuments() {
        console.log('[ModuleIntegrator] 整合模块文档...');

        const integratedModules = {};

        for (const [moduleKey, moduleGroup] of Object.entries(this.integrationState.moduleGroups)) {
            console.log(`[ModuleIntegrator] 整合模块: ${moduleGroup.name} (${moduleGroup.documents.length}个文档)`);

            try {
                const integratedContent = await this.generateModuleDocument(moduleGroup);
                const outputPath = await this.saveModuleDocument(moduleKey, integratedContent);

                integratedModules[moduleKey] = {
                    ...moduleGroup,
                    integratedContent,
                    outputPath,
                    generatedAt: new Date().toISOString(),
                    sections: this.extractDocumentSections(integratedContent)
                };

                console.log(`[ModuleIntegrator] 模块文档已保存: ${outputPath}`);

            } catch (error) {
                console.error(`[ModuleIntegrator] 模块整合失败: ${moduleGroup.name}`, error);
                integratedModules[moduleKey] = {
                    ...moduleGroup,
                    error: error.message,
                    generatedAt: new Date().toISOString()
                };
            }
        }

        this.integrationState.integratedModules = integratedModules;

        return {
            success: true,
            processedModules: Object.keys(integratedModules),
            successfulModules: Object.keys(integratedModules).filter(key => 
                !integratedModules[key].error
            ),
            failedModules: Object.keys(integratedModules).filter(key => 
                integratedModules[key].error
            )
        };
    }

    /**
     * 生成总模块概览文档
     */
    async generateOverviewDocument() {
        console.log('[ModuleIntegrator] 生成总模块概览文档...');

        if (!this.integrationState.includeOverview) {
            return { success: false, message: '概览文档生成被禁用' };
        }

        try {
            const overviewContent = await this.createOverviewContent();
            const overviewPath = await this.saveOverviewDocument(overviewContent);

            this.integrationState.overviewDocument = {
                content: overviewContent,
                path: overviewPath,
                generatedAt: new Date().toISOString()
            };

            console.log(`[ModuleIntegrator] 概览文档已保存: ${overviewPath}`);

            return {
                success: true,
                path: overviewPath,
                size: overviewContent.length,
                modules: Object.keys(this.integrationState.integratedModules)
            };

        } catch (error) {
            console.error('[ModuleIntegrator] 概览文档生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成模块连接文档
     */
    async generateConnectionDocument() {
        console.log('[ModuleIntegrator] 生成模块连接文档...');

        if (!this.integrationState.includeConnections) {
            return { success: false, message: '连接文档生成被禁用' };
        }

        try {
            const connectionAnalysis = await this.analyzeModuleConnections();
            const connectionContent = await this.createConnectionContent(connectionAnalysis);
            const connectionPath = await this.saveConnectionDocument(connectionContent);

            this.integrationState.connectionDocument = {
                content: connectionContent,
                path: connectionPath,
                analysis: connectionAnalysis,
                generatedAt: new Date().toISOString()
            };

            console.log(`[ModuleIntegrator] 连接文档已保存: ${connectionPath}`);

            return {
                success: true,
                path: connectionPath,
                size: connectionContent.length,
                connectionsFound: connectionAnalysis.connections.length
            };

        } catch (error) {
            console.error('[ModuleIntegrator] 连接文档生成失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取整合状态和结果
     */
    getIntegrationResults() {
        const state = this.integrationState;
        
        return {
            projectPath: state.projectPath,
            generatedAt: state.generatedAt,
            
            summary: {
                totalDocuments: state.collectedDocs.length,
                processedModules: Object.keys(state.integratedModules).length,
                successfulModules: Object.keys(state.integratedModules).filter(key => 
                    !state.integratedModules[key].error
                ).length,
                hasOverview: !!state.overviewDocument,
                hasConnections: !!state.connectionDocument
            },
            
            modules: Object.entries(state.integratedModules).map(([key, module]) => ({
                moduleKey: key,
                moduleName: module.name,
                documentCount: module.fileCount,
                outputPath: module.outputPath,
                hasError: !!module.error,
                error: module.error
            })),
            
            outputs: {
                overviewDocument: state.overviewDocument?.path,
                connectionDocument: state.connectionDocument?.path,
                moduleDocuments: Object.values(state.integratedModules)
                    .filter(module => module.outputPath)
                    .map(module => module.outputPath)
            },
            
            nextSteps: this.getNextStepsRecommendations()
        };
    }

    /**
     * 私有辅助方法
     */

    async ensureOutputDirectory() {
        try {
            await fs.mkdir(this.integrationState.outputDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async collectFromDirectory(dirPath, pattern) {
        // 实现目录文档收集逻辑
        const files = await fs.readdir(dirPath);
        const docs = [];
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = join(dirPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                docs.push({
                    title: basename(file, '.md'),
                    path: filePath,
                    content,
                    source: 'directory'
                });
            }
        }
        
        return docs;
    }

    async collectFromFileList(files) {
        const docs = [];
        
        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                docs.push({
                    title: basename(filePath, extname(filePath)),
                    path: filePath,
                    content,
                    source: 'filelist'
                });
            } catch (error) {
                console.warn(`无法读取文件: ${filePath}`, error.message);
            }
        }
        
        return docs;
    }

    async enrichDocumentMetadata(doc, source) {
        return {
            ...doc,
            sourceType: source.type,
            sourcePath: source.path,
            enrichedAt: new Date().toISOString(),
            wordCount: doc.content ? doc.content.split(/\s+/).length : 0,
            lineCount: doc.content ? doc.content.split('\n').length : 0
        };
    }

    classifyDocumentModule(doc) {
        const docPath = doc.path || '';
        const docTitle = (doc.title || '').toLowerCase();
        
        // 检查每个模块模式
        for (const [moduleKey, moduleInfo] of Object.entries(this.modulePatterns)) {
            if (moduleKey === 'other') continue; // 跳过other，作为默认值
            
            for (const pattern of moduleInfo.patterns) {
                if (docPath.toLowerCase().includes(pattern) || 
                    docTitle.includes(pattern)) {
                    return moduleKey;
                }
            }
        }
        
        return 'other';
    }

    async generateModuleDocument(moduleGroup) {
        const template = await this.templateReader.readTemplate(
            this.integrationState.templateName || 'module-documentation'
        );
        
        // 构建模块文档内容
        const sections = [];
        
        // 模块概述
        sections.push(`# ${moduleGroup.name}\n`);
        sections.push(`${moduleGroup.description}\n`);
        sections.push(`## 模块概述\n`);
        sections.push(`- 包含文件: ${moduleGroup.fileCount} 个`);
        sections.push(`- 总代码量: ${Math.round(moduleGroup.totalSize / 1024)} KB`);
        sections.push(`- 优先级: ${moduleGroup.priority}\n`);
        
        // 包含的文件列表
        sections.push(`## 包含文件\n`);
        for (const doc of moduleGroup.documents) {
            sections.push(`### ${doc.title}\n`);
            if (doc.content) {
                sections.push(doc.content + '\n');
            }
        }
        
        return sections.join('\n');
    }

    async saveModuleDocument(moduleKey, content) {
        const fileName = `${moduleKey}-module.md`;
        const outputPath = join(this.integrationState.outputDir, fileName);
        await fs.writeFile(outputPath, content, 'utf8');
        return outputPath;
    }

    async createOverviewContent() {
        const modules = this.integrationState.integratedModules;
        const sections = [];
        
        sections.push('# 项目模块总览\n');
        sections.push(`生成时间: ${new Date().toISOString()}\n`);
        sections.push(`项目路径: ${this.integrationState.projectPath}\n`);
        
        sections.push('## 模块结构\n');
        for (const [key, module] of Object.entries(modules)) {
            if (!module.error) {
                sections.push(`### ${module.name}`);
                sections.push(`- 文件数量: ${module.fileCount}`);
                sections.push(`- 文档路径: [${key}-module.md](${key}-module.md)`);
                sections.push(`- 描述: ${module.description}\n`);
            }
        }
        
        return sections.join('\n');
    }

    async saveOverviewDocument(content) {
        const outputPath = join(this.integrationState.outputDir, 'README.md');
        await fs.writeFile(outputPath, content, 'utf8');
        return outputPath;
    }

    async analyzeModuleConnections() {
        // 简化的连接分析
        const connections = [];
        const modules = Object.keys(this.integrationState.integratedModules);
        
        for (let i = 0; i < modules.length; i++) {
            for (let j = i + 1; j < modules.length; j++) {
                connections.push({
                    from: modules[i],
                    to: modules[j],
                    type: 'potential',
                    confidence: 0.5
                });
            }
        }
        
        return {
            connections,
            totalModules: modules.length,
            analyzedAt: new Date().toISOString()
        };
    }

    async createConnectionContent(analysis) {
        const sections = [];
        
        sections.push('# 模块连接关系\n');
        sections.push(`分析时间: ${analysis.analyzedAt}\n`);
        sections.push(`总模块数: ${analysis.totalModules}\n`);
        
        sections.push('## 连接关系图\n');
        for (const conn of analysis.connections) {
            sections.push(`- ${conn.from} → ${conn.to} (${conn.type})`);
        }
        
        return sections.join('\n');
    }

    async saveConnectionDocument(content) {
        const outputPath = join(this.integrationState.outputDir, 'module-connections.md');
        await fs.writeFile(outputPath, content, 'utf8');
        return outputPath;
    }

    extractDocumentSections(content) {
        const lines = content.split('\n');
        const sections = [];
        
        for (const line of lines) {
            if (line.startsWith('#')) {
                sections.push(line.replace(/^#+\s*/, ''));
            }
        }
        
        return sections;
    }

    getNextStepsRecommendations() {
        const state = this.integrationState;
        const recommendations = [];
        
        if (Object.keys(state.integratedModules).length > 0) {
            recommendations.push('查看生成的模块文档');
        }
        
        if (state.overviewDocument) {
            recommendations.push('阅读项目总览文档');
        }
        
        if (state.connectionDocument) {
            recommendations.push('查看模块连接关系分析');
        }
        
        recommendations.push('考虑添加更多模块间的详细连接分析');
        recommendations.push('根据需要调整模块分类规则');
        
        return recommendations;
    }
}

export default ModuleDocumentIntegrator;