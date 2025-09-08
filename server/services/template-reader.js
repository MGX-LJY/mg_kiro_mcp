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
     * 构建模板文件路径
     */
    _buildTemplatePath(category, name) {
        // 标准化文件扩展名
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        
        // 根据类别确定路径
        const categoryPaths = {
            'templates': 'templates',
            'modes': 'modes',
            'analysis-templates': 'analysis-templates',
            'document-templates': 'document-templates',
            'snippets': 'snippets'
        };

        const categoryDir = categoryPaths[category] || category;
        return path.join(this.promptsDir, categoryDir, fileName);
    }

    /**
     * 列出类别下的所有模板
     */
    async listTemplates(category) {
        try {
            const categoryDir = this._getCategoryDir(category);
            
            if (!fs.existsSync(categoryDir)) {
                return [];
            }

            const files = fs.readdirSync(categoryDir)
                .filter(file => file.endsWith('.md'))
                .map(file => ({
                    name: file.replace('.md', ''),
                    category,
                    path: path.join(categoryDir, file),
                    size: fs.statSync(path.join(categoryDir, file)).size
                }));

            return files;
        } catch (error) {
            console.error(`[TemplateReader] 列出模板失败 ${category}:`, error.message);
            return [];
        }
    }

    /**
     * 获取类别目录
     */
    _getCategoryDir(category) {
        const categoryPaths = {
            'templates': 'templates',
            'modes': 'modes', 
            'analysis-templates': 'analysis-templates',
            'document-templates': 'document-templates',
            'snippets': 'snippets'
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