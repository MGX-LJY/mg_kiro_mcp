/**
 * Create模式 - 模块创建路由模块
 * 新模块和组件创建端点
 */

import express from 'express';
import { success, error, workflowSuccess } from '../../services/response-service.js';

/**
 * 创建模块创建路由
 * @param {Object} services - 服务依赖
 * @returns {express.Router} 路由实例
 */
export function createModuleRoutes(services) {
    const router = express.Router();
    const { workflowService, promptService } = services;

    /**
     * 创建新模块
     * POST /create-module
     */
    router.post('/create-module', async (req, res) => {
        try {
            const { moduleName, description, dependencies = [], workflowId, language = 'javascript' } = req.body;
            
            if (!moduleName) {
                return error(res, '模块名称不能为空', 400);
            }

            if (!description) {
                return error(res, '模块描述不能为空', 400);
            }

            console.log(`[CreateModule] 创建新模块: ${moduleName}`);

            const startTime = Date.now();

            // 生成模块规范
            const moduleSpec = {
                name: moduleName,
                description,
                dependencies,
                language,
                exports: [],
                imports: [],
                created: new Date().toISOString(),
                structure: _generateModuleStructure(moduleName, language),
                template: _generateModuleTemplate(moduleName, language, description)
            };

            // 生成模块文件内容
            const moduleContent = await _generateModuleContent(moduleSpec, promptService);

            const executionTime = Date.now() - startTime;

            const responseData = {
                module: {
                    ...moduleSpec,
                    content: moduleContent
                },
                generation: {
                    executionTime,
                    templateUsed: `${language}-module`,
                    timestamp: new Date().toISOString()
                },
                files: _getModuleFiles(moduleName, language),
                nextSteps: [
                    '创建模块文件',
                    '添加单元测试',
                    '更新文档',
                    '集成到项目中'
                ]
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'create_module', 'completed', responseData);
                }
            }

            console.log(`[CreateModule] 模块 ${moduleName} 创建成功: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CreateModule] 创建模块失败:', err);
            error(res, err.message, 500, {
                action: 'create_module'
            });
        }
    });

    /**
     * 创建新组件
     * POST /create-component
     */
    router.post('/create-component', async (req, res) => {
        try {
            const { componentName, type = 'function', props = {}, workflowId, language = 'javascript' } = req.body;
            
            if (!componentName) {
                return error(res, '组件名称不能为空', 400);
            }

            console.log(`[CreateComponent] 创建新组件: ${componentName}`);

            const startTime = Date.now();

            // 生成组件规范
            const componentSpec = {
                name: componentName,
                type,
                props,
                language,
                created: new Date().toISOString(),
                template: _generateComponentTemplate(type, language),
                interfaces: _generateComponentInterfaces(props, language)
            };

            // 生成组件代码
            const componentContent = await _generateComponentContent(componentSpec, promptService);

            const executionTime = Date.now() - startTime;

            const responseData = {
                component: {
                    ...componentSpec,
                    content: componentContent
                },
                generation: {
                    executionTime,
                    templateUsed: `${language}-${type}-component`,
                    timestamp: new Date().toISOString()
                },
                files: _getComponentFiles(componentName, type, language),
                examples: _generateUsageExamples(componentName, props, language)
            };

            // 如果有工作流ID，更新工作流状态
            if (workflowId) {
                const workflow = workflowService.getWorkflow(workflowId);
                if (workflow) {
                    workflowService.updateStep(workflowId, 'create_component', 'completed', responseData);
                }
            }

            console.log(`[CreateComponent] 组件 ${componentName} 创建成功: ${executionTime}ms`);

            success(res, responseData);

        } catch (err) {
            console.error('[CreateComponent] 创建组件失败:', err);
            error(res, err.message, 500, {
                action: 'create_component'
            });
        }
    });

    return router;
}

/**
 * 生成模块结构
 * @param {string} moduleName - 模块名称
 * @param {string} language - 编程语言
 * @returns {Object} 模块结构
 */
function _generateModuleStructure(moduleName, language) {
    const structures = {
        javascript: {
            main: `${moduleName}.js`,
            test: `${moduleName}.test.js`,
            types: `${moduleName}.d.ts`,
            docs: `${moduleName}.md`
        },
        python: {
            main: `${moduleName}.py`,
            test: `test_${moduleName}.py`,
            init: '__init__.py',
            docs: `${moduleName}.md`
        },
        java: {
            main: `${_capitalize(moduleName)}.java`,
            test: `${_capitalize(moduleName)}Test.java`,
            interface: `I${_capitalize(moduleName)}.java`,
            docs: `${moduleName}.md`
        }
    };

    return structures[language] || structures.javascript;
}

/**
 * 生成模块模板
 * @param {string} moduleName - 模块名称
 * @param {string} language - 编程语言
 * @param {string} description - 模块描述
 * @returns {string} 模块模板
 */
function _generateModuleTemplate(moduleName, language, description) {
    const templates = {
        javascript: `/**
 * ${description}
 */

class ${_capitalize(moduleName)} {
    constructor() {
        // Initialize module
    }

    // Add your methods here
}

export default ${_capitalize(moduleName)};`,
        
        python: `"""
${description}
"""

class ${_capitalize(moduleName)}:
    """${description}"""
    
    def __init__(self):
        """Initialize module"""
        pass
    
    # Add your methods here`,
        
        java: `/**
 * ${description}
 */
public class ${_capitalize(moduleName)} {
    
    public ${_capitalize(moduleName)}() {
        // Initialize module
    }
    
    // Add your methods here
}`
    };

    return templates[language] || templates.javascript;
}

/**
 * 生成组件模板
 * @param {string} type - 组件类型
 * @param {string} language - 编程语言
 * @returns {string} 组件模板
 */
function _generateComponentTemplate(type, language) {
    const templates = {
        javascript: {
            class: `class Component {
    constructor(props = {}) {
        this.props = props;
    }
    
    render() {
        return null;
    }
}`,
            function: `function Component(props = {}) {
    return null;
}`,
            module: `const Component = {
    // exports
};

export default Component;`
        },
        
        python: {
            class: `class Component:
    def __init__(self, **props):
        self.props = props
    
    def render(self):
        pass`,
            function: `def component(**props):
    return None`,
            module: `# Component module
pass`
        }
    };

    return templates[language]?.[type] || templates.javascript.function;
}

/**
 * 生成模块内容
 * @param {Object} moduleSpec - 模块规范
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 生成的模块内容
 */
async function _generateModuleContent(moduleSpec, promptService) {
    try {
        // 使用提示词服务生成更详细的内容
        const template = await promptService.loadPrompt('templates', 'module-template', {
            module_name: moduleSpec.name,
            description: moduleSpec.description,
            language: moduleSpec.language,
            dependencies: moduleSpec.dependencies.join(', ')
        });

        return {
            main: moduleSpec.template,
            documentation: template.content || `# ${moduleSpec.name}\n\n${moduleSpec.description}`,
            tests: _generateTestTemplate(moduleSpec),
            examples: _generateModuleExamples(moduleSpec)
        };
    } catch (error) {
        // 回退到基础模板
        return {
            main: moduleSpec.template,
            documentation: `# ${moduleSpec.name}\n\n${moduleSpec.description}`,
            tests: _generateTestTemplate(moduleSpec),
            examples: _generateModuleExamples(moduleSpec)
        };
    }
}

/**
 * 生成组件内容
 * @param {Object} componentSpec - 组件规范
 * @param {Object} promptService - 提示词服务
 * @returns {Object} 生成的组件内容
 */
async function _generateComponentContent(componentSpec, promptService) {
    try {
        const template = await promptService.loadPrompt('templates', 'component-template', {
            component_name: componentSpec.name,
            type: componentSpec.type,
            language: componentSpec.language,
            props: JSON.stringify(componentSpec.props, null, 2)
        });

        return {
            main: componentSpec.template,
            documentation: template.content || `# ${componentSpec.name}\n\n${componentSpec.type} component`,
            tests: _generateComponentTestTemplate(componentSpec),
            styles: componentSpec.type === 'class' ? _generateStyleTemplate(componentSpec.name) : null
        };
    } catch (error) {
        return {
            main: componentSpec.template,
            documentation: `# ${componentSpec.name}\n\n${componentSpec.type} component`,
            tests: _generateComponentTestTemplate(componentSpec),
            styles: null
        };
    }
}

/**
 * 生成测试模板
 * @param {Object} moduleSpec - 模块规范
 * @returns {string} 测试模板
 */
function _generateTestTemplate(moduleSpec) {
    const { language, name } = moduleSpec;
    
    const templates = {
        javascript: `import ${_capitalize(name)} from './${name}.js';

describe('${_capitalize(name)}', () => {
    test('should initialize correctly', () => {
        const instance = new ${_capitalize(name)}();
        expect(instance).toBeDefined();
    });
});`,
        
        python: `import unittest
from ${name} import ${_capitalize(name)}

class Test${_capitalize(name)}(unittest.TestCase):
    def test_initialization(self):
        instance = ${_capitalize(name)}()
        self.assertIsNotNone(instance)

if __name__ == '__main__':
    unittest.main()`
    };

    return templates[language] || templates.javascript;
}

/**
 * 生成组件测试模板
 * @param {Object} componentSpec - 组件规范
 * @returns {string} 组件测试模板
 */
function _generateComponentTestTemplate(componentSpec) {
    const { language, name, type } = componentSpec;
    
    if (language === 'javascript') {
        return `import ${_capitalize(name)} from './${name}.js';

describe('${_capitalize(name)} Component', () => {
    test('should render without crashing', () => {
        const component = new ${_capitalize(name)}();
        expect(component).toBeDefined();
    });
});`;
    }
    
    return `# Test for ${name} component`;
}

/**
 * 生成模块文件列表
 * @param {string} moduleName - 模块名称
 * @param {string} language - 编程语言
 * @returns {Array} 文件列表
 */
function _getModuleFiles(moduleName, language) {
    const structure = _generateModuleStructure(moduleName, language);
    return Object.values(structure);
}

/**
 * 生成组件文件列表
 * @param {string} componentName - 组件名称
 * @param {string} type - 组件类型
 * @param {string} language - 编程语言
 * @returns {Array} 文件列表
 */
function _getComponentFiles(componentName, type, language) {
    const files = [`${componentName}.${language === 'python' ? 'py' : 'js'}`];
    
    if (type === 'class' && language === 'javascript') {
        files.push(`${componentName}.css`);
    }
    
    files.push(`${componentName}.test.${language === 'python' ? 'py' : 'js'}`);
    files.push(`${componentName}.md`);
    
    return files;
}

/**
 * 生成组件接口
 * @param {Object} props - 组件属性
 * @param {string} language - 编程语言
 * @returns {Object} 接口定义
 */
function _generateComponentInterfaces(props, language) {
    if (language === 'javascript') {
        return {
            props: Object.keys(props),
            typescript: Object.entries(props).map(([key, value]) => 
                `${key}: ${typeof value}`).join('\n  ')
        };
    }
    
    return { props: Object.keys(props) };
}

/**
 * 生成使用示例
 * @param {string} componentName - 组件名称
 * @param {Object} props - 组件属性
 * @param {string} language - 编程语言
 * @returns {Array} 使用示例
 */
function _generateUsageExamples(componentName, props, language) {
    const examples = [];
    
    if (language === 'javascript') {
        examples.push({
            title: '基础用法',
            code: `const ${componentName.toLowerCase()} = new ${_capitalize(componentName)}(${JSON.stringify(props)});`
        });
    } else if (language === 'python') {
        examples.push({
            title: '基础用法',
            code: `${componentName.toLowerCase()} = ${_capitalize(componentName)}(**${JSON.stringify(props)})`
        });
    }
    
    return examples;
}

/**
 * 生成模块示例
 * @param {Object} moduleSpec - 模块规范
 * @returns {Array} 模块示例
 */
function _generateModuleExamples(moduleSpec) {
    return [
        {
            title: '导入模块',
            code: `import ${_capitalize(moduleSpec.name)} from './${moduleSpec.name}.js';`
        },
        {
            title: '创建实例',
            code: `const ${moduleSpec.name} = new ${_capitalize(moduleSpec.name)}();`
        }
    ];
}

/**
 * 生成样式模板
 * @param {string} componentName - 组件名称
 * @returns {string} CSS样式模板
 */
function _generateStyleTemplate(componentName) {
    return `.${componentName.toLowerCase()} {
    /* Add your styles here */
}`;
}

/**
 * 首字母大写
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default createModuleRoutes;