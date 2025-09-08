/**
 * 主路由索引文件
 * 聚合所有路由模块，提供统一的路由入口
 */

import express from 'express';

// 系统路由
import { createHealthRoutes } from './system/health.js';
import { createMCPRoutes } from './system/mcp.js';
import { createPromptsRoutes } from './system/prompts.js';

// Init模式路由
import { createStructureRoutes } from './init/structure.js';
import { createLanguageRoutes } from './init/language.js';
import { createFilesRoutes } from './init/files.js';
import { createDocumentsRoutes } from './init/documents.js';
import { createModulesRoutes } from './init/modules.js';
import { createLanguagePromptsRoutes } from './init/prompts.js';
import { createContractsRoutes } from './init/contracts.js';
import { createInitDataRoutes } from './init/data.js';

// Create模式路由
import { createCreateModeRoutes } from './create/index.js';

// Fix模式路由
import { createFixModeRoutes } from './fix/index.js';

// Analyze模式路由
import { createAnalyzeModeRoutes } from './analyze/index.js';

/**
 * 创建应用程序主路由
 * @param {Object} services - 服务依赖
 * @param {Object} server - 服务器实例
 * @returns {express.Router} 主路由实例
 */
export function createAppRoutes(services, server) {
    const router = express.Router();
    const routerServices = { ...services, server };

    // ========== 系统路由 ==========
    
    // 健康检查和监控路由
    const healthRouter = createHealthRoutes(routerServices);
    router.use('/', healthRouter);

    // MCP协议端点
    const mcpRouter = createMCPRoutes(routerServices);
    router.use('/mcp', mcpRouter);

    // 提示词和模板管理 
    const promptsRouter = createPromptsRoutes(routerServices);
    router.use('/prompt', promptsRouter);
    router.use('/prompts', promptsRouter);
    router.use('/template', promptsRouter);

    // 模式切换端点 (独立路径)
    router.use('/mode', promptsRouter);

    // ========== Init模式工作流路由 ==========

    // 第1步：项目结构分析
    const structureRouter = createStructureRoutes(routerServices);
    router.use('/mode/init', structureRouter);

    // 第2步：智能语言识别
    const languageRouter = createLanguageRoutes(routerServices);
    router.use('/mode/init', languageRouter);

    // 第3步：文件内容通读
    const filesRouter = createFilesRoutes(routerServices);
    router.use('/mode/init', filesRouter);

    // 第4步：生成基础架构文档
    const documentsRouter = createDocumentsRoutes(routerServices);
    router.use('/mode/init', documentsRouter);

    // 第5步：深度模块分析
    const modulesRouter = createModulesRoutes(routerServices);
    router.use('/mode/init', modulesRouter);

    // 第6步：集成语言提示词路由
    const languagePromptRouter = createLanguagePromptsRoutes(routerServices);
    router.use('/mode/init', languagePromptRouter);

    // 第8步：集成契约文档生成
    const contractsRouter = createContractsRoutes(routerServices);
    router.use('/mode/init', contractsRouter);

    // 数据提供服务 (重构架构：AI主导分析)
    const initDataRouter = createInitDataRoutes(routerServices);
    router.use('/mode/init', initDataRouter);

    // ========== Create模式工作流路由 ==========
    
    // Create模式：新功能和模块创建
    const createModeRouter = createCreateModeRoutes(routerServices);
    router.use('/mode/create', createModeRouter);

    // ========== Fix模式工作流路由 ==========
    
    // Fix模式：问题修复和调试
    const fixModeRouter = createFixModeRoutes(routerServices);
    router.use('/mode/fix', fixModeRouter);

    // ========== Analyze模式工作流路由 ==========
    
    // Analyze模式：代码分析和质量评估
    const analyzeModeRouter = createAnalyzeModeRoutes(routerServices);
    router.use('/mode/analyze', analyzeModeRouter);

    // ========== 工作流状态管理 ==========
    
    // 工作流状态查询
    router.get('/workflow/status/:workflowId', async (req, res) => {
        try {
            const { workflowId } = req.params;
            const progress = services.workflowService.getProgress(workflowId);
            
            if (!progress) {
                return res.status(404).json({
                    success: false,
                    error: `工作流不存在: ${workflowId}`
                });
            }

            res.json({
                success: true,
                progress
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ========== 错误处理和404 ==========
    
    // 全局错误处理中间件
    router.use((error, req, res, next) => {
        console.error('Route error:', error);
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    });

    // 404处理
    router.use('*', (req, res) => {
        res.status(404).json({
            error: 'Endpoint not found',
            method: req.method,
            path: req.originalUrl
        });
    });

    return router;
}

/**
 * 创建Init模式特定路由 (需要重构的旧路由)
 * @param {Object} services - 服务依赖
 * @param {Object} server - 服务器实例
 * @returns {express.Router} Init路由实例
 */
export function createInitRoutes(services, server) {
    const router = express.Router();
    
    // TODO: 将现有的mcp-server.js中的Init模式路由迁移到这里
    // - 第1步：项目结构分析 (/mode/init/scan-structure, /mode/init/structure-summary)
    // - 第2步：智能语言识别 (/mode/init/detect-language, /mode/init/language-report)  
    // - 第3步：文件内容通读 (/mode/init/scan-files, /mode/init/files-overview)
    
    console.log('Init routes placeholder - to be implemented');
    return router;
}

export default createAppRoutes;