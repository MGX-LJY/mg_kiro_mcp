/**
 * Create模式路由索引文件
 * 聚合所有Create模式路由模块
 */

import express from 'express';
import { createModuleRoutes } from './modules.js';
import { createAPIRoutes } from './api.js';
import { createFeatureRoutes } from './features.js';
import { createDataRoutes } from './data.js';
import { success, error } from '../../services/response-service.js';

/**
 * 创建Create模式主路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} Create模式路由实例
 */
export function createCreateModeRoutes(services) {
    const router = express.Router();

    // ========== Create模式子路由 ==========

    // 模块和组件创建
    const moduleRouter = createModuleRoutes(services);
    router.use('/', moduleRouter);

    // API端点创建
    const apiRouter = createAPIRoutes(services);
    router.use('/', apiRouter);

    // 功能规划和架构设计
    const featureRouter = createFeatureRoutes(services);
    router.use('/', featureRouter);

    // 数据提供服务 (重构架构：AI主导分析)
    const dataRouter = createDataRoutes(services);
    router.use('/', dataRouter);

    // ========== Create模式状态和信息端点 ==========

    /**
     * Create模式状态检查
     * GET /status
     */
    router.get('/status', async (req, res) => {
        try {
            const createModeStatus = {
                mode: 'create',
                active: true,
                timestamp: new Date().toISOString(),
                
                capabilities: {
                    dataProvision: {
                        description: '数据提供和模板服务 (AI主导架构)',
                        endpoints: [
                            'POST /get-requirements-data',
                            'POST /get-user-stories-data',
                            'POST /save-analysis-result'
                        ]
                    },
                    intelligentAnalysis: {
                        description: '传统智能分析 (兼容模式)',
                        endpoints: [
                            'POST /analyze-requirements',
                            'POST /update-user-stories'
                        ]
                    },
                    modules: {
                        description: '创建新模块和组件',
                        endpoints: [
                            'POST /create-module',
                            'POST /create-component'
                        ]
                    },
                    apis: {
                        description: '创建API端点',
                        endpoints: [
                            'POST /create-api',
                            'POST /create-api-batch'
                        ]
                    },
                    features: {
                        description: '功能规划和架构设计',
                        endpoints: [
                            'POST /plan-feature',
                            'POST /design-architecture',
                            'POST /create-prototype'
                        ]
                    }
                },
                
                supportedLanguages: ['javascript', 'python', 'java', 'go'],
                
                workflows: {
                    featureDevelopment: [
                        '规划功能需求',
                        '设计技术架构',
                        '创建原型验证',
                        '实现核心模块',
                        '开发API接口',
                        '编写测试代码'
                    ],
                    moduleCreation: [
                        '定义模块职责',
                        '生成模块结构',
                        '编写接口定义',
                        '创建测试用例',
                        '生成文档'
                    ]
                }
            };

            success(res, createModeStatus);

        } catch (err) {
            console.error('[CreateMode] 状态检查失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * Create模式帮助信息
     * GET /help
     */
    router.get('/help', async (req, res) => {
        try {
            const helpInfo = {
                mode: 'create',
                description: 'Create模式帮助您快速创建新的功能、模块和API端点',
                
                quickStart: {
                    createModule: {
                        description: '创建新模块',
                        example: {
                            endpoint: 'POST /mode/create/create-module',
                            payload: {
                                moduleName: 'UserManager',
                                description: '用户管理模块',
                                language: 'javascript',
                                dependencies: ['database', 'validator']
                            }
                        }
                    },
                    
                    createAPI: {
                        description: '创建API端点',
                        example: {
                            endpoint: 'POST /mode/create/create-api',
                            payload: {
                                endpoint: '/users',
                                method: 'GET',
                                description: '获取用户列表',
                                language: 'javascript'
                            }
                        }
                    },
                    
                    planFeature: {
                        description: '规划新功能',
                        example: {
                            endpoint: 'POST /mode/create/plan-feature',
                            payload: {
                                featureName: '用户认证',
                                requirements: ['用户注册', '用户登录', '密码重置'],
                                priority: 'high',
                                complexity: 'medium'
                            }
                        }
                    }
                },
                
                bestPractices: [
                    '先规划功能再实现代码',
                    '遵循命名规范和代码风格',
                    '为每个模块编写测试',
                    '编写清晰的API文档',
                    '考虑错误处理和边界情况',
                    '定期进行代码审查'
                ],
                
                commonWorkflows: [
                    {
                        name: '新功能完整开发',
                        steps: [
                            '1. POST /plan-feature - 规划功能',
                            '2. POST /design-architecture - 设计架构',
                            '3. POST /create-module - 创建核心模块',
                            '4. POST /create-api - 创建API接口',
                            '5. POST /create-prototype - 创建原型验证'
                        ]
                    },
                    {
                        name: '快速模块创建',
                        steps: [
                            '1. POST /create-module - 创建模块',
                            '2. 根据返回结果创建文件',
                            '3. 运行生成的测试'
                        ]
                    }
                ]
            };

            success(res, helpInfo);

        } catch (err) {
            console.error('[CreateMode] 获取帮助信息失败:', err);
            error(res, err.message, 500);
        }
    });

    /**
     * Create模式模板列表
     * GET /templates
     */
    router.get('/templates', async (req, res) => {
        try {
            const { language = 'javascript', type } = req.query;
            
            const templates = {
                modules: {
                    javascript: ['class', 'function', 'service', 'utility'],
                    python: ['class', 'function', 'module', 'package'],
                    java: ['class', 'interface', 'service', 'controller'],
                    go: ['struct', 'interface', 'package', 'service']
                },
                
                apis: {
                    javascript: ['express-router', 'fastify-route', 'koa-router'],
                    python: ['flask-route', 'fastapi-endpoint', 'django-view'],
                    java: ['spring-controller', 'jersey-resource'],
                    go: ['gin-handler', 'http-handler']
                },
                
                features: {
                    common: ['user-management', 'data-processing', 'api-gateway', 'microservice'],
                    web: ['authentication', 'file-upload', 'real-time-chat', 'payment'],
                    mobile: ['push-notification', 'offline-sync', 'location-service'],
                    data: ['etl-pipeline', 'analytics', 'reporting', 'search']
                }
            };

            let filteredTemplates = templates;
            
            if (type) {
                filteredTemplates = templates[type] || {};
            }
            
            if (language && type && templates[type]) {
                filteredTemplates = templates[type][language] || templates[type].common || [];
            }

            const responseData = {
                language,
                type: type || 'all',
                templates: filteredTemplates,
                
                usage: {
                    description: '使用模板快速创建代码结构',
                    example: 'POST /create-module 时在 payload 中指定 template: "service"'
                }
            };

            success(res, responseData);

        } catch (err) {
            console.error('[CreateMode] 获取模板列表失败:', err);
            error(res, err.message, 500);
        }
    });

    // ========== 错误处理 ==========
    
    // Create模式专用错误处理
    router.use((err, req, res, next) => {
        console.error('[CreateMode] Route error:', err);
        
        // 根据错误类型返回不同的错误信息
        if (err.name === 'ValidationError') {
            return error(res, '输入数据验证失败', 400, {
                mode: 'create',
                validationErrors: err.details
            });
        }
        
        if (err.name === 'TemplateError') {
            return error(res, '模板处理失败', 500, {
                mode: 'create',
                template: err.template
            });
        }
        
        return error(res, err.message, 500, {
            mode: 'create',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

export default createCreateModeRoutes;