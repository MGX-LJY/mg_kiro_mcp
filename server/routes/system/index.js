/**
 * System模块路由索引
 * 聚合系统相关的所有路由
 */

import { Router } from 'express';
import { createHealthRoutes } from './health.js';
import { createMCPRoutes } from './mcp.js';
import { createPromptsRoutes } from './prompts.js';

/**
 * 创建System模块完整路由
 * @param {Object} services - 服务依赖
 * @param {Object} serverObject - 服务器对象
 * @returns {express.Router} 路由实例
 */
export function createSystemRoutes(services, serverObject) {
    const router = Router();

    // 健康检查路由
    router.use('/', createHealthRoutes(services, serverObject));
    
    // MCP协议路由
    router.use('/mcp', createMCPRoutes(services, serverObject));
    
    // 提示词管理路由
    router.use('/', createPromptRoutes(services, serverObject));

    return router;
}

export default createSystemRoutes;