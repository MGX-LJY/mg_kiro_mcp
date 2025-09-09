# Create 模块创建模板

## 🎯 模块创建目标
基于功能规划结果，创建结构良好、可维护、可扩展的新模块，确保与现有系统的良好集成。

## 📦 模块设计原则

### 1. 单一职责原则
每个模块应该有明确的单一职责：
- **核心功能**: {{module_core_function}}
- **边界定义**: {{module_boundaries}}
- **职责范围**: {{responsibility_scope}}

### 2. 接口设计原则
设计清晰、稳定的模块接口：
- **对外接口**: 模块提供给其他模块的服务
- **依赖接口**: 模块需要的外部服务
- **内部接口**: 模块内部组件间的协作
- **数据接口**: 数据输入输出规范

## 🏗️ 模块架构设计

### 1. 标准模块结构
根据项目特点采用标准化的模块结构：

#### Node.js/JavaScript 模块结构
```
{{module_name}}/
├── index.js              # 模块主入口
├── lib/                  # 核心实现
│   ├── core.js          # 核心业务逻辑
│   ├── utils.js         # 工具函数
│   └── validators.js    # 数据验证
├── api/                  # API接口层
│   ├── routes.js        # 路由定义
│   ├── controllers.js   # 控制器
│   └── middleware.js    # 中间件
├── models/              # 数据模型
│   ├── schema.js        # 数据模式
│   └── repository.js    # 数据访问层
├── config/              # 配置文件
│   └── default.json     # 默认配置
├── tests/               # 测试代码
│   ├── unit/            # 单元测试
│   ├── integration/     # 集成测试
│   └── fixtures/        # 测试数据
├── docs/                # 模块文档
│   └── README.md        # 模块说明
└── package.json         # 模块依赖配置
```

#### Python 模块结构
```
{{module_name}}/
├── __init__.py          # 模块初始化
├── core/                # 核心功能
│   ├── __init__.py
│   ├── main.py          # 主要业务逻辑
│   └── utils.py         # 工具函数
├── api/                 # API接口
│   ├── __init__.py
│   ├── views.py         # 视图函数
│   └── serializers.py   # 数据序列化
├── models/              # 数据模型
│   ├── __init__.py
│   └── models.py        # 模型定义
├── tests/               # 测试代码
│   ├── __init__.py
│   ├── test_core.py     # 核心功能测试
│   └── test_api.py      # API测试
├── config/              # 配置模块
│   └── settings.py      # 配置设置
└── requirements.txt     # 依赖管理
```

### 2. 模块核心组件

#### 核心业务逻辑 (Core)
```javascript
// 示例：核心业务类设计
class {{ModuleName}}Core {
    constructor(config = {}) {
        this.config = {
            // 默认配置
            ...this.getDefaultConfig(),
            ...config
        };
        this._initialize();
    }

    // 主要业务方法
    async {{primaryMethod}}(params) {
        try {
            // 参数验证
            this._validateParams(params);
            
            // 业务逻辑处理
            const result = await this._processBusinessLogic(params);
            
            // 结果处理
            return this._formatResult(result);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    // 私有方法
    _initialize() {
        // 初始化逻辑
    }

    _validateParams(params) {
        // 参数验证逻辑
    }

    async _processBusinessLogic(params) {
        // 核心业务逻辑
    }

    _formatResult(result) {
        // 结果格式化
    }

    _handleError(error) {
        // 错误处理
    }

    getDefaultConfig() {
        return {
            // 默认配置项
        };
    }
}

module.exports = {{ModuleName}}Core;
```

#### API接口层 (API)
```javascript
// 示例：REST API接口设计
const express = require('express');
const {{ModuleName}}Controller = require('./controllers');

const router = express.Router();

// 获取资源列表
router.get('/{{resource_name}}', {{ModuleName}}Controller.list);

// 获取单个资源
router.get('/{{resource_name}}/:id', {{ModuleName}}Controller.get);

// 创建新资源
router.post('/{{resource_name}}', {{ModuleName}}Controller.create);

// 更新资源
router.put('/{{resource_name}}/:id', {{ModuleName}}Controller.update);

// 删除资源
router.delete('/{{resource_name}}/:id', {{ModuleName}}Controller.delete);

module.exports = router;
```

#### 数据访问层 (Repository)
```javascript
// 示例：数据访问模式
class {{ModuleName}}Repository {
    constructor(database) {
        this.db = database;
        this.tableName = '{{table_name}}';
    }

    async findAll(filters = {}) {
        // 查询所有记录
    }

    async findById(id) {
        // 根据ID查询单个记录
    }

    async create(data) {
        // 创建新记录
    }

    async update(id, data) {
        // 更新记录
    }

    async delete(id) {
        // 删除记录
    }

    async findBy(criteria) {
        // 根据条件查询
    }
}

module.exports = {{ModuleName}}Repository;
```

## 🔧 模块配置与依赖

### 1. 配置管理
设计灵活的配置系统：

#### 配置文件结构
```json
{
  "{{module_name}}": {
    "enabled": true,
    "version": "1.0.0",
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "{{db_name}}"
    },
    "api": {
      "baseUrl": "/api/v1/{{module_name}}",
      "timeout": 30000,
      "rateLimiting": {
        "enabled": true,
        "maxRequests": 100,
        "timeWindow": 3600
      }
    },
    "features": {
      "caching": true,
      "logging": true,
      "monitoring": true
    }
  }
}
```

#### 环境配置
```javascript
// 环境特定配置
const config = {
    development: {
        debug: true,
        logLevel: 'debug',
        database: {
            host: 'localhost'
        }
    },
    production: {
        debug: false,
        logLevel: 'error',
        database: {
            host: process.env.DB_HOST
        }
    },
    test: {
        debug: false,
        logLevel: 'silent',
        database: {
            host: ':memory:'
        }
    }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

### 2. 依赖管理
明确模块的依赖关系：

#### 外部依赖
- **核心依赖**: 模块正常运行必需的包
- **开发依赖**: 仅开发和测试时需要的包
- **可选依赖**: 提供额外功能的包
- **对等依赖**: 需要与其他包协同工作的依赖

#### 内部依赖
- **服务依赖**: 需要的内部服务模块
- **工具依赖**: 需要的工具和辅助模块
- **配置依赖**: 需要的配置模块

## 🧪 测试策略设计

### 1. 测试层次设计
建立完整的测试体系：

#### 单元测试 (Unit Tests)
```javascript
// 示例：单元测试结构
describe('{{ModuleName}}Core', () => {
    let moduleCore;

    beforeEach(() => {
        moduleCore = new {{ModuleName}}Core();
    });

    describe('{{primaryMethod}}', () => {
        it('should process valid input correctly', async () => {
            // 测试正常情况
        });

        it('should handle invalid input gracefully', async () => {
            // 测试异常情况
        });

        it('should respect configuration options', async () => {
            // 测试配置项
        });
    });
});
```

#### 集成测试 (Integration Tests)
```javascript
// 示例：API集成测试
describe('{{ModuleName}} API Integration', () => {
    let app;
    let request;

    beforeAll(async () => {
        app = await createTestApp();
        request = supertest(app);
    });

    describe('GET /{{resource_name}}', () => {
        it('should return list of resources', async () => {
            const response = await request
                .get('/api/v1/{{resource_name}}')
                .expect(200);
            
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
```

### 2. 测试数据管理
设计可维护的测试数据：

#### 测试夹具 (Fixtures)
```javascript
// 测试数据工厂
const {{ModuleName}}Factory = {
    create: (overrides = {}) => ({
        id: faker.datatype.uuid(),
        name: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        status: 'active',
        createdAt: new Date().toISOString(),
        ...overrides
    }),

    createList: (count = 5, overrides = {}) => {
        return Array.from({ length: count }, () => 
            {{ModuleName}}Factory.create(overrides)
        );
    }
};
```

## 📚 文档编写指南

### 1. 模块文档结构
为模块编写完整的文档：

#### README.md 模板
```markdown
# {{ModuleName}} Module

## 概述
{{module_description}}

## 特性
- 特性 1
- 特性 2
- 特性 3

## 安装
```bash
npm install {{module_package_name}}
```

## 快速开始
```javascript
const {{ModuleName}} = require('{{module_package_name}}');

const module = new {{ModuleName}}({
    // 配置选项
});

// 使用示例
const result = await module.{{primaryMethod}}(params);
```

## API 文档

### {{ModuleName}}(config)
创建模块实例

#### 参数
- `config` (Object): 配置选项

#### 返回值
- {{ModuleName}} 实例

### {{primaryMethod}}(params)
主要功能方法

#### 参数
- `params` (Object): 输入参数

#### 返回值
- Promise<Object>: 处理结果

## 配置选项
| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| option1 | String | 'default' | 选项1说明 |

## 错误处理
模块抛出的错误类型和处理方式

## 测试
```bash
npm test
```

## 贡献指南
如何为模块做贡献

## 许可证
MIT
```

### 2. API文档生成
使用工具自动生成API文档：

#### JSDoc注释规范
```javascript
/**
 * 核心业务处理方法
 * @param {Object} params - 输入参数
 * @param {string} params.id - 资源ID
 * @param {Object} params.data - 更新数据
 * @param {Object} [options={}] - 可选配置
 * @returns {Promise<Object>} 处理结果
 * @throws {ValidationError} 参数验证失败时抛出
 * @throws {NotFoundError} 资源不存在时抛出
 * @example
 * // 更新资源
 * const result = await module.update({
 *   id: 'resource-123',
 *   data: { name: 'New Name' }
 * });
 */
async update(params, options = {}) {
    // 实现代码
}
```

## 🚀 部署与发布

### 1. 构建配置
设置模块的构建和打包：

#### 构建脚本
```json
{
  "scripts": {
    "build": "babel src -d lib",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "docs": "jsdoc -c jsdoc.conf.json",
    "prepublish": "npm run build && npm run test"
  }
}
```

### 2. 版本管理
遵循语义化版本控制：

#### 版本发布流程
1. **补丁版本** (1.0.x): 错误修复
2. **次要版本** (1.x.0): 新增功能，向后兼容
3. **主要版本** (x.0.0): 破坏性更改

## 🔍 质量检查清单

### 模块设计质量
- [ ] 模块职责单一明确
- [ ] 接口设计简洁稳定
- [ ] 内部结构层次清晰
- [ ] 依赖关系合理最小
- [ ] 配置系统灵活易用
- [ ] 错误处理完善

### 代码质量
- [ ] 代码风格一致
- [ ] 命名规范清晰
- [ ] 注释充分准确
- [ ] 函数职责单一
- [ ] 复用性良好
- [ ] 性能考虑充分

### 测试质量
- [ ] 测试覆盖率达标 (>80%)
- [ ] 测试用例全面
- [ ] 边界条件测试
- [ ] 异常情况处理测试
- [ ] 性能测试
- [ ] 集成测试完整

### 文档质量
- [ ] README文档完整
- [ ] API文档准确
- [ ] 示例代码可运行
- [ ] 配置说明清晰
- [ ] 变更日志维护
- [ ] 贡献指南明确

---
*模板版本*: v4.0  
*适用模式*: Create  
*步骤*: module-creation - 模块创建  
*生成时间*: {{timestamp}}