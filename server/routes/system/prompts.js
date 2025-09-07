/**
 * 提示词和模板路由模块
 * 系统提示词、模式切换、模板管理端点
 */

import express from 'express';
import { success, error } from '../../utils/response.js';

/**
 * 创建提示词路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createPromptsRoutes(services) {
    const router = express.Router();
    const { server, promptService } = services;

    /**
     * 获取系统提示词
     * GET /prompt/system
     */
    router.get('/system', async (req, res) => {
        try {
            const variables = {
                project_name: 'mg_kiro MCP Server',
                current_mode: server.currentMode
            };
            
            const systemPrompt = await promptService.loadPrompt('modes', 'init', variables);
            
            const responseData = {
                system_prompt: systemPrompt.content,
                metadata: systemPrompt.metadata,
                version: '2.0.0',
                mode: server.currentMode,
                timestamp: new Date().toISOString()
            };

            success(res, responseData);
        } catch (err) {
            console.error('Failed to load system prompt:', err);
            const fallbackData = {
                fallback: _getSystemPrompt(server.currentMode)
            };
            error(res, 'Failed to load system prompt', 500, fallbackData);
        }
    });

    /**
     * 模式切换
     * POST /mode/switch
     */
    router.post('/switch', (req, res) => {
        try {
            const { mode, context } = req.body;
            
            if (!['init', 'create', 'fix', 'analyze'].includes(mode)) {
                return error(res, 'Invalid mode', 400, {
                    availableModes: ['init', 'create', 'fix', 'analyze']
                });
            }

            const previousMode = server.currentMode;
            server.currentMode = mode;

            // Update prompt manager's current mode
            if (server.promptManager) {
                server.promptManager.setGlobalVariable('current_mode', () => mode);
            }

            server._broadcastModeChange(previousMode, mode, context);

            const responseData = {
                previousMode,
                currentMode: mode,
                timestamp: new Date().toISOString()
            };

            success(res, responseData);

            console.log(`Mode switched: ${previousMode} -> ${mode}`);
        } catch (err) {
            console.error('Mode switch failed:', err);
            error(res, 'Mode switch failed', 500);
        }
    });

    /**
     * 获取模式特定提示词
     * GET /prompt/mode/:mode
     */
    router.get('/mode/:mode', async (req, res) => {
        try {
            const { mode } = req.params;
            
            if (!['init', 'create', 'fix', 'analyze'].includes(mode)) {
                return error(res, 'Mode not found', 404);
            }

            const variables = {
                project_name: 'mg_kiro MCP Server',
                current_mode: mode
            };

            const modePrompt = await promptService.loadPrompt('modes', mode, variables);

            const responseData = {
                mode,
                prompt: modePrompt.content,
                metadata: modePrompt.metadata,
                templates: _getModeTemplates(mode),
                version: modePrompt.version,
                timestamp: new Date().toISOString()
            };

            success(res, responseData);
        } catch (err) {
            console.error(`Failed to load prompt for mode ${req.params.mode}:`, err);
            const fallbackData = {
                mode: req.params.mode,
                prompt: `Mode ${req.params.mode} prompt placeholder`,
                templates: _getModeTemplates(req.params.mode)
            };
            error(res, `Failed to load prompt for mode ${req.params.mode}`, 500, fallbackData);
        }
    });

    /**
     * 列出所有可用提示词
     * GET /prompts/list
     */
    router.get('/list', async (req, res) => {
        try {
            const { category } = req.query;
            const prompts = await promptService.listPrompts(category);
            
            success(res, prompts);
        } catch (err) {
            console.error('Failed to list prompts:', err);
            error(res, 'Failed to list prompts', 500);
        }
    });

    /**
     * 获取提示词管理器状态
     * GET /prompts/status
     */
    router.get('/status', (req, res) => {
        try {
            const status = promptService.getStatus();
            success(res, status);
        } catch (err) {
            console.error('Failed to get prompt manager status:', err);
            error(res, 'Failed to get prompt manager status', 500);
        }
    });

    /**
     * 清除提示词缓存
     * POST /prompts/cache/clear
     */
    router.post('/cache/clear', (req, res) => {
        try {
            promptService.clearCache();
            
            success(res, {
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to clear cache:', err);
            error(res, 'Failed to clear cache', 500);
        }
    });

    /**
     * 获取文档模板
     * GET /template/:name
     */
    router.get('/:name', async (req, res) => {
        try {
            const { name } = req.params;
            const { variables } = req.query;
            
            const parsedVariables = variables ? JSON.parse(variables) : {};
            const template = await promptService.loadPrompt('templates', name, parsedVariables);
            
            success(res, template);
        } catch (err) {
            console.error(`Failed to load template ${req.params.name}:`, err);
            error(res, 'Template not found', 404);
        }
    });

    return router;
}

/**
 * 获取系统提示词备用方案
 * @param {string} currentMode - 当前模式
 * @returns {string} 系统提示词
 */
function _getSystemPrompt(currentMode) {
    return `mg_kiro MCP Server v2.0.0 - Smart Project Documentation Management System
Current mode: ${currentMode}
Supported modes: init, create, fix, analyze
Timestamp: ${new Date().toISOString()}`;
}

/**
 * 获取模式可用模板
 * @param {string} mode - 模式名称
 * @returns {Array} 模板列表
 */
function _getModeTemplates(mode) {
    const templates = {
        init: ['system-architecture', 'modules-catalog', 'dependencies'],
        create: ['module-template', 'user-stories', 'technical-analysis'],
        fix: ['action-items', 'changelog', 'technical-analysis'],
        analyze: ['technical-analysis', 'dependencies', 'system-architecture']
    };
    return templates[mode] || [];
}

export default createPromptsRoutes;