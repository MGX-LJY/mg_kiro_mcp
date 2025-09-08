/**
 * Init模块路由索引  
 * 聚合Init模式相关的所有路由
 */

import { Router } from 'express';
import contractsRouter from './contracts.js';
import dataRouter from './data.js';
import documentsRouter from './documents.js';
import filesRouter from './files.js';
import languageRouter from './language.js';
import modulesAnalysisRouter from './modules-analysis.js';
import modulesDocsRouter from './modules-docs.js';
import promptsRouter from './prompts.js';
import structureRouter from './structure.js';

/**
 * 创建Init模块完整路由
 * @param {Object} services - 服务依赖
 * @param {Object} serverObject - 服务器对象
 * @returns {express.Router} 路由实例
 */
export function createInitRoutes(services, serverObject) {
    const router = Router();

    // Init模式各步骤路由
    router.use('/contracts', contractsRouter);
    router.use('/data', dataRouter);
    router.use('/documents', documentsRouter);
    router.use('/files', filesRouter);
    router.use('/language', languageRouter);
    router.use('/modules-analysis', modulesAnalysisRouter); // 第5步：深度模块分析
    router.use('/modules-docs', modulesDocsRouter);       // 第7步：模块文档生成
    router.use('/prompts', promptsRouter);
    router.use('/structure', structureRouter);

    // Init模式状态和帮助
    router.get('/status', (req, res) => {
        const { success } = require('../../services/response-service.js');
        return success(res, {
            mode: 'init',
            status: 'active',
            availableSteps: [
                'contracts', 'data', 'documents', 'files',
                'language', 'modules-analysis', 'modules-docs', 'prompts', 'structure'
            ]
        }, 'Init模式状态');
    });

    router.get('/help', (req, res) => {
        const { success } = require('../../services/response-service.js');
        return success(res, {
            mode: 'init',
            description: '项目初始化模式',
            steps: {
                contracts: '合同和协议初始化',
                data: '数据模型和结构设计',
                documents: '文档生成和模板',
                files: '文件结构分析',
                language: '语言检测和配置',
                'modules-analysis': '深度模块分析 (第5步)',
                'modules-docs': '模块文档生成 (第7步)',
                prompts: '提示词生成',
                structure: '项目结构规划'
            }
        }, 'Init模式帮助信息');
    });

    return router;
}

export { createInitRoutes as default };