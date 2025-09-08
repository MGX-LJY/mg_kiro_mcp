/**
 * AI响应处理服务
 * 处理AI分析结果并写入mg_kiro文件系统
 * 核心功能：AI数据包 → 文档生成 → mg_kiro文件夹保存
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AIContentGeneratorService from './ai-content-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AIResponseHandlerService {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.mgKiroPath = path.join(projectPath, 'mg_kiro');
        this.aiGenerator = new AIContentGeneratorService();
    }

    /**
     * 确保mg_kiro目录结构存在
     * 自动创建必要的子目录
     */
    async ensureMgKiroStructure() {
        const dirs = [
            this.mgKiroPath,
            path.join(this.mgKiroPath, 'architecture'),
            path.join(this.mgKiroPath, 'modules-catalog'),
            path.join(this.mgKiroPath, 'modules-detail'),
            path.join(this.mgKiroPath, 'integrations')
        ];

        try {
            for (const dir of dirs) {
                await fs.mkdir(dir, { recursive: true });
            }
            return true;
        } catch (error) {
            throw new Error(`创建mg_kiro目录结构失败: ${error.message}`);
        }
    }

    /**
     * 保存文档到指定分类目录
     * @param {string} category - 文档分类 (architecture/modules-catalog/modules-detail/integrations)
     * @param {string} filename - 文件名
     * @param {string} content - 文档内容
     * @returns {string} 保存的文件路径
     */
    async saveDocument(category, filename, content) {
        if (!content || content.trim() === '') {
            throw new Error('文档内容不能为空');
        }

        const validCategories = ['architecture', 'modules-catalog', 'modules-detail', 'integrations'];
        if (!validCategories.includes(category)) {
            throw new Error(`无效的文档分类: ${category}。支持的分类: ${validCategories.join(', ')}`);
        }

        await this.ensureMgKiroStructure();

        const filePath = path.join(this.mgKiroPath, category, filename);
        
        try {
            await fs.writeFile(filePath, content, 'utf8');
            return filePath;
        } catch (error) {
            throw new Error(`保存文档失败 ${filePath}: ${error.message}`);
        }
    }

    /**
     * 批量保存多个文档
     * @param {Array} documents - 文档数组 [{category, filename, content}, ...]
     * @returns {Array} 保存的文件路径数组
     */
    async saveDocuments(documents) {
        if (!Array.isArray(documents) || documents.length === 0) {
            throw new Error('文档数组不能为空');
        }

        const savedFiles = [];
        const errors = [];

        for (const doc of documents) {
            try {
                const { category, filename, content } = doc;
                if (!category || !filename || !content) {
                    errors.push(`文档缺少必要字段: ${JSON.stringify(doc)}`);
                    continue;
                }

                const filePath = await this.saveDocument(category, filename, content);
                savedFiles.push(filePath);
            } catch (error) {
                errors.push(`保存文档失败 ${doc.filename}: ${error.message}`);
            }
        }

        if (errors.length > 0 && savedFiles.length === 0) {
            throw new Error(`批量保存失败:\n${errors.join('\n')}`);
        }

        return {
            saved: savedFiles,
            errors: errors.length > 0 ? errors : null,
            success: savedFiles.length > 0
        };
    }

    /**
     * 处理AI分析数据包并生成文档
     * 核心方法：将AI响应转换为mg_kiro文档
     * @param {Object} aiPackage - AI分析数据包
     * @returns {Object} 处理结果
     */
    async processAIPackage(aiPackage) {
        if (!aiPackage || typeof aiPackage !== 'object') {
            throw new Error('AI数据包不能为空');
        }

        const { 
            workflowId, 
            stepIndex, 
            aiGeneratedContent, 
            processingInstructions = {} 
        } = aiPackage;

        if (!workflowId || stepIndex === undefined || !aiGeneratedContent) {
            throw new Error('AI数据包缺少必要字段: workflowId, stepIndex, aiGeneratedContent');
        }

        try {
            // 根据步骤索引决定保存策略 - 使用AI生成真实内容
            const documents = await this.prepareDocuments(stepIndex, aiGeneratedContent);
            
            // 批量保存文档
            const result = await this.saveDocuments(documents);

            return {
                success: true,
                workflowId,
                stepIndex,
                savedFiles: result.saved,
                errors: result.errors,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`处理AI数据包失败: ${error.message}`);
        }
    }

    /**
     * 根据步骤索引准备文档数据
     * Init模式8个步骤的文档映射 - 使用AI生成真实内容
     * @param {number} stepIndex - 步骤索引
     * @param {Object} aiContent - AI生成的内容
     * @returns {Promise<Array>} 文档数组
     */
    async prepareDocuments(stepIndex, aiContent) {
        const documents = [];

        try {
            switch (stepIndex) {
                case 1: // 项目扫描
                    if (aiContent.projectStructure) {
                        const content = await this.aiGenerator.generateProjectOverview(aiContent.projectStructure);
                        documents.push({
                            category: 'architecture',
                            filename: 'project-overview.md',
                            content: content
                        });
                    }
                    break;

                case 2: // 语言检测
                    if (aiContent.languageData || aiContent.detection) {
                        const content = await this.aiGenerator.generateLanguageAnalysis(aiContent);
                        documents.push({
                            category: 'architecture',
                            filename: 'language-analysis.md',
                            content: content
                        });
                    }
                    break;

                case 3: // 文件扫描
                    if (aiContent.fileData || aiContent.projectStructure) {
                        const content = await this.aiGenerator.generateFileAnalysis(aiContent.fileData || aiContent.projectStructure);
                        documents.push({
                            category: 'architecture',
                            filename: 'file-analysis.md',
                            content: content
                        });
                    }
                    break;

                case 4: // 架构生成
                    if (aiContent.projectStructure || aiContent.languageData) {
                        const archContent = await this.aiGenerator.generateSystemArchitecture(aiContent);
                        documents.push({
                            category: 'architecture',
                            filename: 'system-architecture.md',
                            content: archContent
                        });

                        const techContent = await this.aiGenerator.generateTechStack(aiContent);
                        documents.push({
                            category: 'architecture',
                            filename: 'tech-stack.md',
                            content: techContent
                        });
                    }
                    break;

                case 5: // 模块分析
                    if (aiContent.modulesCatalog) {
                        documents.push({
                            category: 'modules-catalog',
                            filename: 'modules-catalog.md',
                            content: aiContent.modulesCatalog
                        });
                    }
                    if (aiContent.modulesHierarchy) {
                        documents.push({
                            category: 'modules-catalog',
                            filename: 'modules-hierarchy.md',
                            content: aiContent.modulesHierarchy
                        });
                    }
                    break;

                case 6: // 提示词生成
                    if (aiContent.prompts) {
                        documents.push({
                            category: 'architecture',
                            filename: 'project-prompts.md',
                            content: aiContent.prompts
                        });
                    }
                    break;

                case 7: // 模块文档
                    if (aiContent.moduleDocuments && Array.isArray(aiContent.moduleDocuments)) {
                        for (const moduleDoc of aiContent.moduleDocuments) {
                            if (moduleDoc.name && moduleDoc.content) {
                                documents.push({
                                    category: 'modules-detail',
                                    filename: `module-${moduleDoc.name}.md`,
                                    content: moduleDoc.content
                                });
                            }
                        }
                    }
                    break;

                case 8: // 集成契约
                    if (aiContent.integrationContracts) {
                        documents.push({
                            category: 'integrations',
                            filename: 'integration-contracts.md',
                            content: aiContent.integrationContracts
                        });
                    }
                    if (aiContent.dataFlow) {
                        documents.push({
                            category: 'integrations',
                            filename: 'data-flow.md',
                            content: aiContent.dataFlow
                        });
                    }
                    break;

                default:
                    throw new Error(`不支持的步骤索引: ${stepIndex}`);
            }

            if (documents.length === 0) {
                throw new Error(`步骤 ${stepIndex} 没有可保存的文档内容`);
            }

            return documents;
        } catch (error) {
            console.error(`[AIResponseHandler] 准备步骤 ${stepIndex} 文档失败:`, error);
            throw error;
        }
    }

    /**
     * 检查mg_kiro目录状态
     * @returns {Object} 目录状态信息
     */
    async checkMgKiroStatus() {
        try {
            const stats = await fs.stat(this.mgKiroPath);
            const subdirs = ['architecture', 'modules-catalog', 'modules-detail', 'integrations'];
            
            const dirStatus = {};
            for (const subdir of subdirs) {
                const subdirPath = path.join(this.mgKiroPath, subdir);
                try {
                    const subdirStats = await fs.stat(subdirPath);
                    const files = await fs.readdir(subdirPath);
                    dirStatus[subdir] = {
                        exists: true,
                        fileCount: files.length,
                        files: files
                    };
                } catch {
                    dirStatus[subdir] = {
                        exists: false,
                        fileCount: 0,
                        files: []
                    };
                }
            }

            return {
                exists: true,
                path: this.mgKiroPath,
                createdAt: stats.birthtime,
                directories: dirStatus
            };
        } catch {
            return {
                exists: false,
                path: this.mgKiroPath,
                directories: {}
            };
        }
    }

    /**
     * 清理mg_kiro目录
     * 危险操作，谨慎使用
     * @param {boolean} confirm - 确认清理操作
     * @returns {boolean} 清理是否成功
     */
    async cleanupMgKiro(confirm = false) {
        if (!confirm) {
            throw new Error('清理操作需要明确确认');
        }

        try {
            await fs.rm(this.mgKiroPath, { recursive: true, force: true });
            return true;
        } catch (error) {
            throw new Error(`清理mg_kiro目录失败: ${error.message}`);
        }
    }
}

export default AIResponseHandlerService;