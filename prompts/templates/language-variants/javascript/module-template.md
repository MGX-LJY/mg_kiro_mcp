# JavaScript/Node.js 模块文档 - {{module_name}}

> 模块版本: {{module_version}}  
> 更新日期: {{timestamp}}  
> 负责人: {{module_owner}}  
> 状态: {{module_status}}  
> Node.js版本: {{node_version}}

## 模块概述

### 基本信息
- **模块ID**: `{{module_id}}`
- **NPM包名**: `{{npm_package_name}}`
- **模块类型**: {{module_type}} (CommonJS/ESM/UMD)
- **入口文件**: {{entry_point}}
- **TypeScript**: {{typescript_enabled}}

### 模块描述
{{module_description}}

### 安装和引用
```bash
# 安装依赖
npm install {{npm_package_name}}
# 或
yarn add {{npm_package_name}}
# 或  
pnpm add {{npm_package_name}}
```

```javascript
// ES模块导入
import { {{export_name}} } from '{{npm_package_name}}';
import {{default_export}} from '{{npm_package_name}}';

// CommonJS导入
const { {{export_name}} } = require('{{npm_package_name}}');
const {{default_export}} = require('{{npm_package_name}}');
```

## 功能定义

### 核心API

#### 1. {{primary_function}}
**描述**: {{function_description}}

**TypeScript签名**:
```typescript
function {{function_name}}(
  {{param1}}: {{param1_type}},
  {{param2}}: {{param2_type}},
  options?: {{options_type}}
): Promise<{{return_type}}>
```

**参数说明**:
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| {{param1}} | {{param1_type}} | ✅ | - | {{param1_desc}} |
| {{param2}} | {{param2_type}} | ❌ | {{param2_default}} | {{param2_desc}} |
| options | {{options_type}} | ❌ | {} | 配置选项 |

**使用示例**:
```typescript
// 基础用法
const result = await {{function_name}}('{{example_input}}');

// 带选项用法
const result = await {{function_name}}('{{example_input}}', {
  {{option1}}: {{option1_value}},
  {{option2}}: {{option2_value}}
});

// 错误处理
try {
  const result = await {{function_name}}('{{example_input}}');
  console.log(result);
} catch (error) {
  if (error instanceof {{CustomErrorType}}) {
    console.error('业务错误:', error.message);
  } else {
    console.error('系统错误:', error);
  }
}
```

### 类型定义

#### 核心类型
```typescript
// 主要数据类型
interface {{MainInterface}} {
  id: string;
  {{property1}}: {{property1_type}};
  {{property2}}: {{property2_type}};
  {{property3}}?: {{property3_type}};  // 可选属性
  readonly {{readonly_property}}: {{readonly_type}};  // 只读属性
}

// 配置选项类型
interface {{OptionsInterface}} {
  timeout?: number;           // 超时时间（毫秒）
  retries?: number;          // 重试次数
  debug?: boolean;           // 调试模式
  {{custom_option}}?: {{custom_type}};  // 自定义选项
}

// 联合类型
type {{UnionType}} = '{{option1}}' | '{{option2}}' | '{{option3}}';

// 泛型类型
interface {{GenericInterface}}<T = any> {
  data: T;
  meta: {
    count: number;
    total: number;
  };
}
```

### 事件系统 (如果适用)

#### EventEmitter模式
```typescript
import { EventEmitter } from 'events';

class {{ModuleClass}} extends EventEmitter {
  constructor() {
    super();
  }
  
  // 触发事件
  private emitEvent(event: string, data: any): void {
    this.emit(event, data);
  }
}

// 事件监听
const {{instanceName}} = new {{ModuleClass}}();

{{instanceName}}.on('{{event_name}}', (data) => {
  console.log('事件触发:', data);
});

{{instanceName}}.on('error', (error) => {
  console.error('模块错误:', error);
});
```

## 文件结构

### 目录组织
```
{{module_name}}/
├── src/                    # 源码目录
│   ├── index.ts           # 主入口文件
│   ├── {{feature1}}/      # 功能模块1
│   │   ├── index.ts
│   │   ├── {{submodule}}.ts
│   │   └── types.ts
│   ├── utils/             # 工具函数
│   ├── constants.ts       # 常量定义
│   └── types/             # 类型定义
├── dist/                  # 编译输出
├── tests/                 # 测试文件
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── fixtures/         # 测试数据
├── docs/                 # 文档
├── package.json          # 包配置
├── tsconfig.json         # TypeScript配置
├── jest.config.js        # 测试配置
├── .eslintrc.js          # 代码检查配置
└── README.md             # 说明文档
```

### 入口文件示例
```typescript
// src/index.ts
export { default as {{MainClass}} } from './{{main-class}}';
export { {{utility_function}} } from './utils';
export * from './types';

// 默认导出
export default {
  {{MainClass}},
  {{utility_function}},
  version: '{{module_version}}'
};

// 版本信息
export const VERSION = '{{module_version}}';
```

### Package.json配置
```json
{
  "name": "{{npm_package_name}}",
  "version": "{{module_version}}",
  "description": "{{package_description}}",
  "main": "dist/index.js",
  "module": "dist/index.mjs", 
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "{{build_command}}",
    "dev": "{{dev_command}}",
    "test": "{{test_command}}",
    "test:watch": "{{test_watch_command}}",
    "lint": "{{lint_command}}",
    "type-check": "{{type_check_command}}"
  },
  "keywords": {{package_keywords}},
  "author": "{{author_name}}",
  "license": "{{license}}",
  "engines": {
    "node": ">={{min_node_version}}"
  },
  "peerDependencies": {
    "{{peer_dep}}": "{{peer_version}}"
  }
}
```

## API接口 (后端模块)

### Express路由示例
```typescript
import { Router } from 'express';
import { {{ControllerName}} } from './{{controller-file}}';

const router = Router();
const {{controllerInstance}} = new {{ControllerName}}();

// RESTful路由
router.get('/{{resource}}', {{controllerInstance}}.getAll.bind({{controllerInstance}}));
router.get('/{{resource}}/:id', {{controllerInstance}}.getById.bind({{controllerInstance}}));
router.post('/{{resource}}', {{controllerInstance}}.create.bind({{controllerInstance}}));
router.put('/{{resource}}/:id', {{controllerInstance}}.update.bind({{controllerInstance}}));
router.delete('/{{resource}}/:id', {{controllerInstance}}.delete.bind({{controllerInstance}}));

export default router;
```

### 中间件定义
```typescript
import { Request, Response, NextFunction } from 'express';

// 认证中间件
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 验证中间件
export const validateMiddleware = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};
```

## 数据模型 (如果适用)

### Mongoose模式 (MongoDB)
```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface I{{ModelName}} extends Document {
  {{field1}}: {{field1_type}};
  {{field2}}: {{field2_type}};
  {{field3}}: {{field3_type}};
  createdAt: Date;
  updatedAt: Date;
}

const {{modelName}}Schema = new Schema<I{{ModelName}}>({
  {{field1}}: {
    type: {{mongoose_type1}},
    required: {{required1}},
    {{validation1}}
  },
  {{field2}}: {
    type: {{mongoose_type2}},
    default: {{default2}}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
{{modelName}}Schema.index({ {{index_field}}: 1 });

// 虚拟字段
{{modelName}}Schema.virtual('{{virtual_field}}').get(function() {
  return this.{{field1}} + ' - ' + this.{{field2}};
});

// 中间件
{{modelName}}Schema.pre('save', function(next) {
  // 保存前逻辑
  next();
});

export const {{ModelName}} = mongoose.model<I{{ModelName}}>('{{ModelName}}', {{modelName}}Schema);
```

### Prisma模型 (SQL)
```prisma
// schema.prisma
model {{ModelName}} {
  id          String   @id @default(cuid())
  {{field1}}  {{prisma_type1}}  {{prisma_modifier1}}
  {{field2}}  {{prisma_type2}}  {{prisma_modifier2}}
  {{field3}}  {{prisma_type3}}? {{prisma_modifier3}}
  
  // 关系
  {{relation_field}}   {{RelationModel}}[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("{{table_name}}")
  @@index([{{index_fields}}])
}
```

## 错误处理

### 自定义错误类
```typescript
// 基础错误类
export abstract class {{BaseError}} extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误
export class {{BusinessError}} extends {{BaseError}} {
  readonly statusCode = 400;
  readonly isOperational = true;
}

// 系统错误
export class {{SystemError}} extends {{BaseError}} {
  readonly statusCode = 500;
  readonly isOperational = false;
}

// 错误处理器
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof {{BaseError}}) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        type: error.constructor.name
      }
    });
  }
  
  // 未知错误
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error'
    }
  });
};
```

## 测试

### Jest单元测试
```typescript
// tests/unit/{{module-name}}.test.ts
import { {{FunctionName}} } from '../../src';

describe('{{FunctionName}}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should handle valid input correctly', async () => {
    // Arrange
    const input = {{test_input}};
    const expected = {{expected_output}};
    
    // Act
    const result = await {{FunctionName}}(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
  
  test('should throw error for invalid input', async () => {
    // Arrange
    const invalidInput = {{invalid_input}};
    
    // Act & Assert
    await expect({{FunctionName}}(invalidInput))
      .rejects
      .toThrow({{ExpectedError}});
  });
});
```

### 集成测试
```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('{{API_ENDPOINT}}', () => {
  test('POST /api/{{resource}} should create resource', async () => {
    const payload = {{test_payload}};
    
    const response = await request(app)
      .post('/api/{{resource}}')
      .send(payload)
      .expect(201);
    
    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      {{field1}}: payload.{{field1}}
    });
  });
});
```

### Mock和Stub
```typescript
// 模拟外部依赖
jest.mock('{{external_module}}', () => ({
  {{external_function}}: jest.fn()
}));

// 模拟数据库
const mockRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};
```

## 性能优化

### 内存管理
```typescript
// 流处理大文件
import { createReadStream } from 'fs';
import { Transform } from 'stream';

export const processLargeFile = (filePath: string) => {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(filePath);
    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        // 处理数据块
        const processed = chunk.toString().toUpperCase();
        callback(null, processed);
      }
    });
    
    readStream
      .pipe(transformStream)
      .on('data', (chunk) => {
        // 处理转换后的数据
      })
      .on('end', resolve)
      .on('error', reject);
  });
};
```

### 缓存策略
```typescript
// 内存缓存
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export const getCachedData = async (key: string): Promise<any> => {
  // 检查缓存
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
    cache.delete(key);
  }
  
  // 获取新数据
  const data = await fetchDataFromSource(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

## 部署配置

### Docker配置
```dockerfile
# Dockerfile
FROM node:{{node_version}}-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY dist/ ./dist/

# 设置环境变量
ENV NODE_ENV=production
ENV PORT={{port}}

# 暴露端口
EXPOSE {{port}}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:{{port}}/health || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
```

### 环境配置
```typescript
// config/environment.ts
interface Config {
  port: number;
  database: {
    url: string;
    maxConnections: number;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};
```

## 监控和日志

### Winston日志配置
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});

export default logger;
```

### 健康检查
```typescript
// health-check.ts
export const healthCheck = {
  async database(): Promise<boolean> {
    try {
      await db.raw('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
  
  async redis(): Promise<boolean> {
    try {
      await redisClient.ping();
      return true;
    } catch {
      return false;
    }
  },
  
  async overall(): Promise<{status: string, checks: Record<string, boolean>}> {
    const checks = {
      database: await this.database(),
      redis: await this.redis()
    };
    
    const allHealthy = Object.values(checks).every(Boolean);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    };
  }
};
```

## 相关文档

- [JavaScript依赖管理](./dependencies.md)
- [JavaScript系统架构](./system-architecture.md)
- [Node.js最佳实践](https://nodejs.org/en/docs/guides/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [Express.js指南](https://expressjs.com/en/guide/)

---

*本文档由 mg_kiro MCP 系统根据JavaScript/Node.js项目特征自动生成*