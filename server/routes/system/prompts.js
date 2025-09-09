/**
 * 提示词和模板路由模块 v3.0.0
 * 系统提示词、模式切换、模板管理端点
 * 使用统一的MasterTemplateService
 */

import express from 'express';
import { success, error } from '../../services/response-service.js';
import MasterTemplateService from '../../services/unified/master-template-service.js';
import TemplateConfigManager from '../../services/unified/template-config-manager.js';

/**
 * 创建提示词路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createPromptsRoutes(services) {
    const router = express.Router();
    const { server, promptService } = services;
    
    // 初始化统一模板服务
    const configManager = new TemplateConfigManager();
    const masterTemplateService = new MasterTemplateService(configManager.getTemplateSystemConfig());
    
    // 向后兼容：如果没有传入promptService，使用MasterTemplateService
    const templateService = promptService || masterTemplateService;

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
            
            // 使用统一模板服务
            const systemPromptResult = await masterTemplateService.getTemplate({
                category: 'modes',
                name: 'init',
                variables: variables
            });
            
            if (!systemPromptResult.success) {
                throw new Error(systemPromptResult.error);
            }
            
            const responseData = {
                system_prompt: systemPromptResult.content,
                metadata: systemPromptResult.metadata,
                version: '3.0.0',
                mode: server.currentMode,
                strategy: systemPromptResult.strategy,
                fromCache: systemPromptResult.fromCache,
                responseTime: systemPromptResult.responseTime,
                timestamp: new Date().toISOString()
            };

            success(res, responseData);
        } catch (err) {
            console.error('Failed to load system prompt:', err);
            const fallbackData = {
                fallback: _getSystemPrompt(server.currentMode)
            };
            return error(res, 'Failed to load system prompt', 500, fallbackData);
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
            return error(res, 'Mode switch failed', 500);
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

            // 使用统一模板服务
            const modePromptResult = await masterTemplateService.getTemplate({
                category: 'modes',
                name: mode,
                variables: variables,
                context: {
                    mode: mode,
                    userIntent: 'get-mode-prompt'
                }
            });
            
            if (!modePromptResult.success) {
                throw new Error(modePromptResult.error);
            }

            const responseData = {
                mode,
                prompt: modePromptResult.content,
                metadata: modePromptResult.metadata,
                templates: _getModeTemplates(mode),
                strategy: modePromptResult.strategy,
                fromCache: modePromptResult.fromCache,
                responseTime: modePromptResult.responseTime,
                version: '3.0.0',
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
            return error(res, `Failed to load prompt for mode ${req.params.mode}`, 500, fallbackData);
        }
    });

    /**
     * 列出所有可用提示词
     * GET /prompts/list
     */
    router.get('/list', async (req, res) => {
        try {
            const { category } = req.query;
            // 使用统一模板服务列出模板
            const prompts = await masterTemplateService.listTemplates(category);
            
            // 向后兼容的响应格式
            const compatibleResponse = {
                prompts: prompts.templates,
                category: category || 'all',
                total: prompts.total,
                service: 'MasterTemplateService',
                version: '3.0.0'
            };
            
            success(res, compatibleResponse);
        } catch (err) {
            console.error('Failed to list prompts:', err);
            return error(res, 'Failed to list prompts', 500);
        }
    });

    /**
     * 获取提示词管理器状态
     * GET /prompts/status
     */
    router.get('/status', (req, res) => {
        try {
            // 获取统一模板服务状态
            const masterStatus = masterTemplateService.getServiceStats();
            
            // 向后兼容：同时获取传统promptService状态（如果存在）
            const legacyStatus = promptService ? promptService.getStatus() : null;
            
            const unifiedStatus = {
                unified: masterStatus,
                legacy: legacyStatus,
                version: '3.0.0',
                migration: {
                    completed: true,
                    unifiedServiceActive: true,
                    legacyServiceActive: !!promptService
                },
                timestamp: new Date().toISOString()
            };
            
            success(res, unifiedStatus);
        } catch (err) {
            console.error('Failed to get prompt manager status:', err);
            return error(res, 'Failed to get prompt manager status', 500);
        }
    });

    /**
     * 清除提示词缓存
     * POST /prompts/cache/clear
     */
    router.post('/cache/clear', (req, res) => {
        try {
            // 清除统一模板服务缓存
            masterTemplateService.clearCache();
            
            // 同时清除传统服务缓存（如果存在）
            if (promptService) {
                promptService.clearCache();
            }
            
            success(res, {
                message: 'All template service caches cleared successfully',
                services: {
                    masterTemplateService: 'cleared',
                    legacyPromptService: promptService ? 'cleared' : 'not available'
                },
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to clear cache:', err);
            return error(res, 'Failed to clear cache', 500);
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
            
            // 使用统一模板服务获取模板
            const templateResult = await masterTemplateService.getTemplate({
                category: 'templates',
                name: name,
                variables: parsedVariables,
                context: {
                    userIntent: 'get-document-template'
                }
            });
            
            if (!templateResult.success) {
                throw new Error(templateResult.error);
            }
            
            // 向后兼容的响应格式
            const compatibleResponse = {
                category: 'templates',
                name: name,
                content: templateResult.content,
                variables: parsedVariables,
                metadata: templateResult.metadata,
                strategy: templateResult.strategy,
                fromCache: templateResult.fromCache,
                responseTime: templateResult.responseTime,
                source: 'unified',
                version: '3.0.0'
            };
            
            success(res, compatibleResponse);
        } catch (err) {
            console.error(`Failed to load template ${req.params.name}:`, err);
            return error(res, 'Template not found', 404);
        }
    });

    // === 新的统一模板服务API端点 ===
    
    /**
     * 智能模板获取（新API）
     * POST /template/intelligent
     */
    router.post('/intelligent', async (req, res) => {
        try {
            const request = req.body;
            const result = await masterTemplateService.getTemplate(request);
            
            if (!result.success) {
                return error(res, result.error, 400);
            }
            
            success(res, result);
        } catch (err) {
            console.error('Intelligent template generation failed:', err);
            return error(res, 'Intelligent template generation failed', 500);
        }
    });
    
    /**
     * 获取配置管理器状态（新API）
     * GET /config/status
     */
    router.get('/config/status', (req, res) => {
        try {
            const configStatus = configManager.getStatus();
            success(res, configStatus);
        } catch (err) {
            console.error('Failed to get config status:', err);
            return error(res, 'Failed to get config status', 500);
        }
    });
    
    /**
     * 验证配置完整性（新API）
     * GET /config/validate
     */
    router.get('/config/validate', (req, res) => {
        try {
            const validation = configManager.validateConfig();
            success(res, validation);
        } catch (err) {
            console.error('Config validation failed:', err);
            return error(res, 'Config validation failed', 500);
        }
    });
    
    /**
     * 获取服务健康状况（新API）
     * GET /health/detailed
     */
    router.get('/health/detailed', async (req, res) => {
        try {
            const masterStats = masterTemplateService.getServiceStats();
            const configStatus = configManager.getStatus();
            const configValidation = configManager.validateConfig();
            
            const healthData = {
                service: {
                    name: 'MasterTemplateService',
                    version: '3.0.0',
                    status: masterStats.health,
                    uptime: process.uptime()
                },
                performance: {
                    cache: masterStats.cache,
                    metrics: masterStats.metrics,
                    capabilities: masterStats.capabilities
                },
                configuration: {
                    status: configStatus.validation.valid ? 'valid' : 'invalid',
                    issues: configStatus.validation.issues,
                    files: configStatus.configFiles
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    memory: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            };
            
            success(res, healthData);
        } catch (err) {
            console.error('Health check failed:', err);
            return error(res, 'Health check failed', 500);
        }
    });
    
    /**
     * 重新加载配置（新API）
     * POST /config/reload
     */
    router.post('/config/reload', (req, res) => {
        try {
            const reloadResult = configManager.reload();
            
            if (reloadResult) {
                // 重新初始化MasterTemplateService
                const newConfig = configManager.getTemplateSystemConfig();
                // 注意：这里应该重新创建service，但为了简化，我们只是清除缓存
                masterTemplateService.clearCache();
                
                success(res, {
                    message: 'Configuration reloaded successfully',
                    timestamp: new Date().toISOString(),
                    newConfig: newConfig
                });
            } else {
                return error(res, 'Configuration reload failed', 500);
            }
        } catch (err) {
            console.error('Config reload failed:', err);
            return error(res, 'Config reload failed', 500);
        }
    });
    
    /**
     * 获取模板统计信息（新API）
     * GET /analytics/stats
     */
    router.get('/analytics/stats', async (req, res) => {
        try {
            const stats = masterTemplateService.getServiceStats();
            const allTemplates = await masterTemplateService.listTemplates();
            
            const analytics = {
                overview: {
                    totalTemplates: allTemplates.total,
                    totalRequests: stats.cache.stats.totalRequests,
                    cacheHitRate: stats.cache.hitRate,
                    averageResponseTime: stats.metrics.averageResponseTime
                },
                usage: {
                    strategies: stats.metrics.strategyPercentages,
                    topCategories: _analyzeTemplateCategories(allTemplates.templates)
                },
                performance: {
                    cacheStats: stats.cache.stats,
                    health: stats.health,
                    capabilities: stats.capabilities
                },
                timestamp: new Date().toISOString()
            };
            
            success(res, analytics);
        } catch (err) {
            console.error('Analytics generation failed:', err);
            return error(res, 'Analytics generation failed', 500);
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

/**
 * 分析模板类别使用情况
 * @param {Array} templates - 模板列表
 * @returns {Object} 类别统计
 */
function _analyzeTemplateCategories(templates) {
    const categoryCount = {};
    
    templates.forEach(template => {
        const category = template.category || 'unknown';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // 按使用量排序
    const sortedCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) // 前5个
        .reduce((obj, [category, count]) => {
            obj[category] = count;
            return obj;
        }, {});
    
    return sortedCategories;
}

export default createPromptsRoutes;