/**
 * 基础模板读取服务
 * 独立的文件系统模板读取，避免循环依赖
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateReader {
    constructor() {
        this.promptsDir = path.join(__dirname, '..', '..', 'prompts');
        this.cache = new Map();
        this.cacheEnabled = true;
    }

    /**
     * 读取模板文件内容
     */
    async readTemplate(category, name) {
        const cacheKey = `${category}:${name}`;
        
        if (this.cacheEnabled && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // 构建文件路径
            const filePath = this._buildTemplatePath(category, name);
            
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const templateData = {
                category,
                name,
                content,
                path: filePath,
                size: content.length,
                lastModified: fs.statSync(filePath).mtime
            };

            if (this.cacheEnabled) {
                this.cache.set(cacheKey, templateData);
            }

            return templateData;

        } catch (error) {
            console.error(`[TemplateReader] 读取模板失败 ${category}/${name}:`, error.message);
            return null;
        }
    }

    /**
     * 构建模板文件路径 - 支持子目录结构
     */
    _buildTemplatePath(category, name) {
        // 标准化文件扩展名
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        
        // 根据类别确定路径 (重构后的新结构)
        const categoryPaths = {
            'modes': 'modes',
            'analysis': 'analysis',
            'generation': 'generation',  
            'snippets': 'snippets',
            'languages': 'languages',
            // 向后兼容映射
            'analysis-templates': 'analysis',
            'document-templates': 'generation',
            'templates': 'generation'  // 旧templates映射到generation
        };

        const categoryDir = categoryPaths[category] || category;
        const basePath = path.join(this.promptsDir, categoryDir);
        
        // 首先尝试直接在类别目录中查找
        const directPath = path.join(basePath, fileName);
        if (fs.existsSync(directPath)) {
            return directPath;
        }
        
        // 如果直接路径不存在，递归查找子目录
        return this._findTemplateInSubdirs(basePath, fileName);
    }

    /**
     * 在子目录中递归查找模板文件
     */
    _findTemplateInSubdirs(baseDir, fileName) {
        try {
            if (!fs.existsSync(baseDir)) {
                return path.join(baseDir, fileName); // 返回原始路径用于错误处理
            }

            const items = fs.readdirSync(baseDir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory()) {
                    const subDirPath = path.join(baseDir, item.name);
                    const filePath = path.join(subDirPath, fileName);
                    
                    if (fs.existsSync(filePath)) {
                        return filePath;
                    }
                    
                    // 递归查找更深层目录
                    const deepPath = this._findTemplateInSubdirs(subDirPath, fileName);
                    if (fs.existsSync(deepPath)) {
                        return deepPath;
                    }
                }
            }
        } catch (error) {
            console.warn(`[TemplateReader] 子目录搜索失败 ${baseDir}:`, error.message);
        }
        
        return path.join(baseDir, fileName); // 返回原始路径用于错误处理
    }

    /**
     * 列出类别下的所有模板 - 递归支持子目录
     */
    async listTemplates(category) {
        try {
            const categoryDir = this._getCategoryDir(category);
            
            if (!fs.existsSync(categoryDir)) {
                return [];
            }

            return this._listTemplatesRecursive(categoryDir, category);
        } catch (error) {
            console.error(`[TemplateReader] 列出模板失败 ${category}:`, error.message);
            return [];
        }
    }

    /**
     * 递归列出目录中的所有模板文件
     */
    _listTemplatesRecursive(dir, category, subPath = '') {
        const templates = [];
        
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    // 递归处理子目录
                    const subCategory = subPath ? `${subPath}/${item.name}` : item.name;
                    const subTemplates = this._listTemplatesRecursive(fullPath, category, subCategory);
                    templates.push(...subTemplates);
                } else if (item.name.endsWith('.md')) {
                    // 处理模板文件
                    const templateName = item.name.replace('.md', '');
                    const displayName = subPath ? `${subPath}/${templateName}` : templateName;
                    
                    templates.push({
                        name: templateName,
                        displayName,
                        category,
                        subcategory: subPath || null,
                        path: fullPath,
                        size: fs.statSync(fullPath).size
                    });
                }
            }
        } catch (error) {
            console.warn(`[TemplateReader] 递归列出失败 ${dir}:`, error.message);
        }
        
        return templates;
    }

    /**
     * 获取类别目录
     */
    _getCategoryDir(category) {
        const categoryPaths = {
            'modes': 'modes',
            'analysis': 'analysis',
            'generation': 'generation',
            'snippets': 'snippets', 
            'languages': 'languages',
            // 向后兼容映射
            'analysis-templates': 'analysis',
            'document-templates': 'generation',
            'templates': 'generation'  // 旧templates映射到generation
        };

        const categoryDir = categoryPaths[category] || category;
        return path.join(this.promptsDir, categoryDir);
    }

    /**
     * 处理模板变量替换
     */
    processTemplate(templateContent, variables = {}) {
        if (!templateContent || typeof templateContent !== 'string') {
            return templateContent;
        }

        let processed = templateContent;

        // 替换变量 {{variable}}
        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            processed = processed.replace(pattern, String(value));
        }

        return processed;
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 获取缓存状态
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            cacheEnabled: this.cacheEnabled
        };
    }
}

export default TemplateReader;