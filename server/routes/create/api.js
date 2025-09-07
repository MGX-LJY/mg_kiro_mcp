/**
 * Create模式 - API创建路由模块
 * API端点和接口创建端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../utils/response.js';

/**
 * 创建API创建路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createAPIRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 创建新API端点
     * POST /create-api
     */
    router.post('/create-api', async (req, res) => {
        try {
            const { 
                endpoint, 
                method = 'GET', 
                description, 
                parameters = {}, 
                responses = {},
                authentication = 'required',
                workflowId,
                language = 'javascript'
            } = req.body;
            
            if (!endpoint) {
                return error(res, 'API端点路径不能为空', 400);
            }

            if (!description) {
                return error(res, 'API描述不能为空', 400);
            }

            console.log(`[CreateAPI] 创建新API端点: ${method} ${endpoint}`);

            const startTime = Date.now();

            // 生成API规范
            const apiSpec = {
                endpoint,
                method: method.toUpperCase(),
                description,
                parameters,
                responses: responses.length ? responses : _generateDefaultResponses(),
                authentication,
                language,
                created: new Date().toISOString(),
                middleware: _generateMiddleware(authentication, method),
                validation: _generateValidation(parameters),
                documentation: _generateAPIDocumentation(endpoint, method, description, parameters, responses)
            };

            // 生成API实现代码
            const apiImplementation = await _generateAPIImplementation(apiSpec, promptService);

            // 生成测试代码
            const apiTests = _generateAPITests(apiSpec);

            const executionTime = Date.now() - startTime;

            const responseData = {
                api: {
                    ...apiSpec,
                    implementation: apiImplementation,
                    tests: apiTests
                },
                generation: {
                    executionTime,
                    templateUsed: `${language}-api-${method.toLowerCase()}`,
                    timestamp: new Date().toISOString()
                },
                files: _getAPIFiles(endpoint, method, language),
                integration: {
                    routerPath: _getRouterIntegration(endpoint),
                    middlewarePath: _getMiddlewareIntegration(authentication),
                    testPath: _getTestIntegration(endpoint, method)
                },
                examples: _generateAPIExamples(apiSpec)
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'create_api', 'completed', responseData);
                }
            }

            console.log(`[CreateAPI] API端点 ${method} ${endpoint} 创建成功: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CreateAPI] 创建API端点失败:', err);
            error(res, err.message, 500, {
                action: 'create_api'
            });
        }
    });

    /**
     * 批量创建API端点
     * POST /create-api-batch
     */
    router.post('/create-api-batch', async (req, res) => {
        try {
            const { apis = [], workflowId, language = 'javascript' } = req.body;
            
            if (!apis.length) {
                return error(res, 'API列表不能为空', 400);
            }

            console.log(`[CreateAPIBatch] 批量创建${apis.length}个API端点`);

            const startTime = Date.now();
            const results = [];
            const errors = [];

            // 批量处理API创建
            for (const apiData of apis) {
                try {
                    const apiSpec = {
                        endpoint: apiData.endpoint,
                        method: (apiData.method || 'GET').toUpperCase(),
                        description: apiData.description || '',
                        parameters: apiData.parameters || {},
                        responses: apiData.responses || _generateDefaultResponses(),
                        authentication: apiData.authentication || 'required',
                        language,
                        created: new Date().toISOString()
                    };

                    const implementation = await _generateAPIImplementation(apiSpec, promptService);
                    const tests = _generateAPITests(apiSpec);

                    results.push({
                        ...apiSpec,
                        implementation,
                        tests,
                        status: 'success'
                    });

                } catch (apiError) {
                    errors.push({
                        endpoint: apiData.endpoint,
                        method: apiData.method,
                        error: apiError.message
                    });
                }
            }

            const executionTime = Date.now() - startTime;

            const responseData = {
                batch: {
                    total: apis.length,
                    successful: results.length,
                    failed: errors.length,
                    results,
                    errors
                },
                generation: {
                    executionTime,
                    timestamp: new Date().toISOString()
                },
                summary: {
                    createdAPIs: results.map(api => `${api.method} ${api.endpoint}`),
                    totalFiles: results.length * 3, // implementation + test + docs
                    nextSteps: [
                        '集成到主路由文件',
                        '添加错误处理中间件',
                        '配置API文档',
                        '运行集成测试'
                    ]
                }
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'create_api_batch', 'completed', responseData);
                }
            }

            console.log(`[CreateAPIBatch] 批量API创建完成: ${results.length}成功, ${errors.length}失败, ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CreateAPIBatch] 批量创建API失败:', err);
            error(res, err.message, 500, {
                action: 'create_api_batch'
            });
        }
    });

    return router;
}

/**
 * 生成默认响应模板
 * @returns {Object} 默认响应
 */
function _generateDefaultResponses() {
    return {
        200: {
            description: 'Success',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                }
            }
        },
        400: {
            description: 'Bad Request',
            schema: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    message: { type: 'string' }
                }
            }
        },
        500: {
            description: 'Internal Server Error',
            schema: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    };
}

/**
 * 生成中间件配置
 * @param {string} authentication - 认证类型
 * @param {string} method - HTTP方法
 * @returns {Array} 中间件列表
 */
function _generateMiddleware(authentication, method) {
    const middleware = [];
    
    if (authentication === 'required') {
        middleware.push('authenticate');
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        middleware.push('validateRequest');
    }
    
    middleware.push('logRequest');
    
    return middleware;
}

/**
 * 生成验证配置
 * @param {Object} parameters - 请求参数
 * @returns {Object} 验证配置
 */
function _generateValidation(parameters) {
    const validation = {
        query: {},
        body: {},
        params: {}
    };
    
    Object.entries(parameters).forEach(([key, param]) => {
        const location = param.in || 'query';
        validation[location][key] = {
            type: param.type || 'string',
            required: param.required || false,
            description: param.description || ''
        };
    });
    
    return validation;
}

/**
 * 生成API文档
 * @param {string} endpoint - 端点路径
 * @param {string} method - HTTP方法
 * @param {string} description - 描述
 * @param {Object} parameters - 参数
 * @param {Object} responses - 响应
 * @returns {string} API文档
 */
function _generateAPIDocumentation(endpoint, method, description, parameters, responses) {
    let doc = `# ${method} ${endpoint}\n\n${description}\n\n`;
    
    if (Object.keys(parameters).length > 0) {
        doc += '## Parameters\n\n';
        Object.entries(parameters).forEach(([key, param]) => {
            doc += `- **${key}** (${param.type || 'string'}): ${param.description || ''}\n`;
        });
        doc += '\n';
    }
    
    if (Object.keys(responses).length > 0) {
        doc += '## Responses\n\n';
        Object.entries(responses).forEach(([code, response]) => {
            doc += `### ${code}\n${response.description}\n\n`;
        });
    }
    
    return doc;
}

/**
 * 生成API实现代码
 * @param {Object} apiSpec - API规范
 * @param {Object} promptService - 提示词服务
 * @returns {Object} API实现
 */
async function _generateAPIImplementation(apiSpec, promptService) {
    const { endpoint, method, language, parameters, authentication } = apiSpec;
    
    try {
        // 使用提示词服务生成实现
        const template = await promptService.loadPrompt('templates', 'api-implementation', {
            endpoint,
            method,
            language,
            parameters: JSON.stringify(parameters),
            authentication
        });
        
        return {
            handler: template.content || _getDefaultImplementation(apiSpec),
            middleware: _generateMiddlewareImplementation(apiSpec.middleware, language),
            validation: _generateValidationImplementation(apiSpec.validation, language)
        };
    } catch (error) {
        return {
            handler: _getDefaultImplementation(apiSpec),
            middleware: _generateMiddlewareImplementation(apiSpec.middleware, language),
            validation: _generateValidationImplementation(apiSpec.validation, language)
        };
    }
}

/**
 * 获取默认实现
 * @param {Object} apiSpec - API规范
 * @returns {string} 默认实现代码
 */
function _getDefaultImplementation(apiSpec) {
    const { endpoint, method, language } = apiSpec;
    
    if (language === 'javascript') {
        return `/**
 * ${method} ${endpoint}
 * ${apiSpec.description}
 */
router.${method.toLowerCase()}('${endpoint}', async (req, res) => {
    try {
        // TODO: Implement your logic here
        
        res.json({
            success: true,
            message: '${method} ${endpoint} endpoint working'
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});`;
    }
    
    if (language === 'python') {
        return `@app.route('${endpoint}', methods=['${method}'])
def ${_getHandlerName(endpoint, method)}():
    """
    ${method} ${endpoint}
    ${apiSpec.description}
    """
    try:
        # TODO: Implement your logic here
        
        return jsonify({
            'success': True,
            'message': '${method} ${endpoint} endpoint working'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500`;
    }
    
    return `// ${method} ${endpoint} - ${apiSpec.description}`;
}

/**
 * 生成中间件实现
 * @param {Array} middleware - 中间件列表
 * @param {string} language - 编程语言
 * @returns {string} 中间件实现
 */
function _generateMiddlewareImplementation(middleware, language) {
    if (language === 'javascript') {
        return middleware.map(mw => {
            switch (mw) {
                case 'authenticate':
                    return `// Authentication middleware
const authenticate = (req, res, next) => {
    // TODO: Implement authentication
    next();
};`;
                case 'validateRequest':
                    return `// Request validation middleware
const validateRequest = (req, res, next) => {
    // TODO: Implement validation
    next();
};`;
                case 'logRequest':
                    return `// Request logging middleware
const logRequest = (req, res, next) => {
    console.log(\`\${req.method} \${req.path}\`);
    next();
};`;
                default:
                    return `// ${mw} middleware`;
            }
        }).join('\n\n');
    }
    
    return `# Middleware: ${middleware.join(', ')}`;
}

/**
 * 生成验证实现
 * @param {Object} validation - 验证配置
 * @param {string} language - 编程语言
 * @returns {string} 验证实现
 */
function _generateValidationImplementation(validation, language) {
    if (language === 'javascript') {
        return `const Joi = require('joi');

const validationSchema = {
    query: Joi.object({
        ${Object.entries(validation.query || {}).map(([key, rule]) => 
            `${key}: Joi.${rule.type}()${rule.required ? '.required()' : '.optional()'}`)
        .join(',\n        ')}
    }),
    body: Joi.object({
        ${Object.entries(validation.body || {}).map(([key, rule]) => 
            `${key}: Joi.${rule.type}()${rule.required ? '.required()' : '.optional()'}`)
        .join(',\n        ')}
    }),
    params: Joi.object({
        ${Object.entries(validation.params || {}).map(([key, rule]) => 
            `${key}: Joi.${rule.type}()${rule.required ? '.required()' : '.optional()'}`)
        .join(',\n        ')}
    })
};`;
    }
    
    return '# Validation schema';
}

/**
 * 生成API测试
 * @param {Object} apiSpec - API规范
 * @returns {string} 测试代码
 */
function _generateAPITests(apiSpec) {
    const { endpoint, method, language } = apiSpec;
    
    if (language === 'javascript') {
        return `const request = require('supertest');
const app = require('../app');

describe('${method} ${endpoint}', () => {
    test('should respond successfully', async () => {
        const response = await request(app)
            .${method.toLowerCase()}('${endpoint}');
            
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
    
    test('should handle errors gracefully', async () => {
        // TODO: Add error test cases
    });
});`;
    }
    
    if (language === 'python') {
        return `import unittest
import json
from app import app

class Test${_capitalize(_getHandlerName(endpoint, method))}(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
    
    def test_${method.toLowerCase()}_${endpoint.replace('/', '_')}(self):
        response = self.client.${method.toLowerCase()}('${endpoint}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()`;
    }
    
    return `// Tests for ${method} ${endpoint}`;
}

/**
 * 获取API文件列表
 * @param {string} endpoint - 端点路径
 * @param {string} method - HTTP方法
 * @param {string} language - 编程语言
 * @returns {Array} 文件列表
 */
function _getAPIFiles(endpoint, method, language) {
    const handlerName = _getHandlerName(endpoint, method);
    const ext = language === 'python' ? 'py' : 'js';
    
    return [
        `routes/${handlerName}.${ext}`,
        `tests/${handlerName}.test.${ext}`,
        `docs/${handlerName}.md`
    ];
}

/**
 * 获取路由集成代码
 * @param {string} endpoint - 端点路径
 * @returns {string} 集成代码
 */
function _getRouterIntegration(endpoint) {
    return `// Add to main router file
import ${_getHandlerName(endpoint, 'handler')} from './routes/${_getHandlerName(endpoint, 'handler')}.js';
app.use('${endpoint}', ${_getHandlerName(endpoint, 'handler')});`;
}

/**
 * 获取中间件集成代码
 * @param {string} authentication - 认证类型
 * @returns {string} 中间件集成代码
 */
function _getMiddlewareIntegration(authentication) {
    if (authentication === 'required') {
        return `// Add authentication middleware
import { authenticate } from './middleware/auth.js';
app.use(authenticate);`;
    }
    return '// No authentication required';
}

/**
 * 获取测试集成代码
 * @param {string} endpoint - 端点路径
 * @param {string} method - HTTP方法
 * @returns {string} 测试集成代码
 */
function _getTestIntegration(endpoint, method) {
    const handlerName = _getHandlerName(endpoint, method);
    return `// Add to test suite
import './${handlerName}.test.js';`;
}

/**
 * 生成API使用示例
 * @param {Object} apiSpec - API规范
 * @returns {Array} 使用示例
 */
function _generateAPIExamples(apiSpec) {
    const { endpoint, method, parameters } = apiSpec;
    
    const examples = [
        {
            title: 'cURL Example',
            code: `curl -X ${method} "${endpoint}" \\
  -H "Content-Type: application/json"`
        }
    ];
    
    if (['POST', 'PUT', 'PATCH'].includes(method) && Object.keys(parameters).length > 0) {
        examples.push({
            title: 'JavaScript Fetch',
            code: `fetch('${endpoint}', {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(${JSON.stringify(parameters, null, 4)})
});`
        });
    }
    
    return examples;
}

/**
 * 获取处理函数名称
 * @param {string} endpoint - 端点路径
 * @param {string} method - HTTP方法
 * @returns {string} 处理函数名称
 */
function _getHandlerName(endpoint, method) {
    const cleanEndpoint = endpoint.replace(/[^\w]/g, '_');
    return `${method.toLowerCase()}_${cleanEndpoint}`.replace(/_+/g, '_');
}

/**
 * 首字母大写
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default createAPIRoutes;