/**
 * 提示词服务
 * 管理提示词加载、缓存和模板处理
 */

import { PromptManager } from '../prompt-manager.js';

class PromptService {
    constructor(config = {}) {
        this.promptManager = new PromptManager({
            version: '2.0.0',
            cacheEnabled: true,
            watchFiles: true,
            ...config
        });
    }

    /**
     * 加载提示词
     * @param {string} category - 提示词类别 (modes, templates, snippets)
     * @param {string} name - 提示词名称
     * @param {Object} variables - 模板变量
     * @returns {Promise<Object>} 提示词内容和元数据
     */
    async loadPrompt(category, name, variables = {}) {
        try {
            return await this.promptManager.loadPrompt(category, name, variables);
        } catch (error) {
            console.error('[PromptService] 加载提示词失败:', error);
            throw error;
        }
    }

    /**
     * 加载系统提示词
     * @param {Object} variables - 模板变量
     * @returns {Promise<Object>} 系统提示词
     */
    async loadSystemPrompt(variables = {}) {
        const defaultVariables = {
            project_name: 'mg_kiro MCP Server',
            current_mode: 'init',
            ...variables
        };
        
        try {
            return await this.loadPrompt('modes', 'init', defaultVariables);
        } catch (error) {
            console.error('[PromptService] 加载系统提示词失败:', error);
            // 返回回退提示词
            return {
                content: `mg_kiro MCP Server v2.0.0 - Smart Project Documentation Management System
Current mode: ${defaultVariables.current_mode}
Supported modes: init, create, fix, analyze
Timestamp: ${new Date().toISOString()}`,
                metadata: { fallback: true }
            };
        }
    }

    /**
     * 加载模式提示词
     * @param {string} mode - 模式名称
     * @param {Object} variables - 模板变量
     * @returns {Promise<Object>} 模式提示词
     */
    async loadModePrompt(mode, variables = {}) {
        const validModes = ['init', 'create', 'fix', 'analyze'];
        if (!validModes.includes(mode)) {
            throw new Error(`不支持的模式: ${mode}`);
        }

        const defaultVariables = {
            project_name: 'mg_kiro MCP Server',
            current_mode: mode,
            ...variables
        };

        try {
            return await this.loadPrompt('modes', mode, defaultVariables);
        } catch (error) {
            console.error(`[PromptService] 加载模式提示词失败 (${mode}):`, error);
            // 返回回退提示词
            return {
                content: `Mode ${mode} prompt placeholder`,
                metadata: { 
                    fallback: true,
                    mode,
                    templates: this._getModeTemplates(mode)
                }
            };
        }
    }

    /**
     * 加载模板
     * @param {string} name - 模板名称
     * @param {Object} variables - 模板变量
     * @returns {Promise<Object>} 模板内容
     */
    async loadTemplate(name, variables = {}) {
        try {
            return await this.loadPrompt('templates', name, variables);
        } catch (error) {
            console.error(`[PromptService] 加载模板失败 (${name}):`, error);
            throw new Error(`模板不存在: ${name}`);
        }
    }

    /**
     * 列出所有提示词
     * @param {string} category - 类别筛选
     * @returns {Promise<Object>} 提示词列表
     */
    async listPrompts(category = null) {
        try {
            return await this.promptManager.listPrompts(category);
        } catch (error) {
            console.error('[PromptService] 列出提示词失败:', error);
            throw error;
        }
    }

    /**
     * 设置全局变量
     * @param {string} key - 变量键
     * @param {*} value - 变量值
     */
    setGlobalVariable(key, value) {
        this.promptManager.setGlobalVariable(key, value);
    }

    /**
     * 获取提示词管理器状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return this.promptManager.getStatus();
    }

    /**
     * 获取缓存统计
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return this.promptManager.getCacheStats();
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.promptManager.clearCache();
    }

    /**
     * 获取模式对应的模板列表
     * @param {string} mode - 模式名称
     * @returns {Array} 模板列表
     */
    _getModeTemplates(mode) {
        const templates = {
            init: ['system-architecture', 'modules-catalog', 'dependencies'],
            create: ['module-template', 'user-stories', 'technical-analysis'],
            fix: ['action-items', 'changelog', 'technical-analysis'],
            analyze: ['technical-analysis', 'dependencies', 'system-architecture']
        };
        return templates[mode] || [];
    }

    /**
     * 验证提示词类别
     * @param {string} category - 类别名称
     * @returns {boolean} 是否有效
     */
    isValidCategory(category) {
        const validCategories = ['modes', 'templates', 'snippets'];
        return validCategories.includes(category);
    }

    /**
     * 验证模式名称
     * @param {string} mode - 模式名称
     * @returns {boolean} 是否有效
     */
    isValidMode(mode) {
        const validModes = ['init', 'create', 'fix', 'analyze'];
        return validModes.includes(mode);
    }

    /**
     * 销毁服务并清理资源
     */
    destroy() {
        if (this.promptManager && this.promptManager.destroy) {
            this.promptManager.destroy();
        }
    }
}

export default PromptService;