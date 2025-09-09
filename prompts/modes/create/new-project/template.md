# Create 新项目创建模板

## 🎯 新项目创建目标
从零开始创建一个结构良好、可维护、可扩展的新项目，建立最佳实践的开发环境和工程化流程。

## 📋 项目规划阶段

### 1. 项目基本信息定义
明确项目的基本属性和目标：

#### 项目元信息
- **项目名称**: {{project_name}}
- **项目描述**: {{project_description}}
- **项目类型**: {{project_type}} (Web应用/API服务/桌面应用/移动应用/库/工具)
- **目标用户**: {{target_users}}
- **核心价值**: {{core_value_proposition}}

#### 项目规模和复杂度
- **预期规模**: {{expected_scale}} (小型/中型/大型/企业级)
- **复杂度等级**: {{complexity_level}} (简单/中等/复杂/高复杂)
- **团队规模**: {{team_size}}人
- **开发周期**: {{development_timeline}}

### 2. 需求分析和功能规划
详细定义项目需求和功能范围：

#### 功能需求
```markdown
## 核心功能模块
1. **{{module_1_name}}**: {{module_1_description}}
   - 子功能1: {{subfeature_1_1}}
   - 子功能2: {{subfeature_1_2}}

2. **{{module_2_name}}**: {{module_2_description}}
   - 子功能1: {{subfeature_2_1}}
   - 子功能2: {{subfeature_2_2}}

3. **{{module_3_name}}**: {{module_3_description}}
   - 子功能1: {{subfeature_3_1}}
   - 子功能2: {{subfeature_3_2}}

## 支持功能模块
- 用户管理和认证
- 权限控制
- 配置管理
- 日志和监控
- 错误处理
```

#### 非功能性需求
- **性能要求**: {{performance_requirements}}
- **可用性要求**: {{availability_requirements}}
- **安全要求**: {{security_requirements}}
- **可扩展性**: {{scalability_requirements}}
- **兼容性**: {{compatibility_requirements}}

## 🏗️ 技术架构设计

### 1. 技术栈选择
基于项目需求选择最适合的技术栈：

#### 前端技术栈 (Web项目)
```yaml
前端框架选择评估:
  React:
    优势: 生态丰富、组件化、虚拟DOM
    劣势: 学习曲线、配置复杂
    适用场景: 复杂交互、大型项目
    
  Vue:
    优势: 简单易学、渐进式、文档优秀
    劣势: 生态相对小、TypeScript支持
    适用场景: 中小型项目、快速原型

  Angular:
    优势: 完整框架、TypeScript原生支持
    劣势: 学习曲线陡峭、体积大
    适用场景: 企业级应用、大型团队

推荐选择: {{frontend_framework}}
理由: {{frontend_choice_reason}}
```

#### 后端技术栈
```yaml
后端框架选择评估:
  Node.js + Express:
    优势: 前后端统一语言、npm生态、轻量级
    劣势: 单线程、CPU密集型任务弱
    适用场景: API服务、实时应用

  Python + FastAPI/Django:
    优势: 语法简洁、库丰富、AI/ML友好
    劣势: 性能相对较低、GIL限制
    适用场景: 数据处理、AI应用、快速开发

  Java + Spring Boot:
    优势: 性能好、生态成熟、企业级
    劣势: 开发效率低、配置复杂
    适用场景: 企业级应用、高并发

推荐选择: {{backend_framework}}
理由: {{backend_choice_reason}}
```

#### 数据库选择
```yaml
数据库技术评估:
  关系型数据库:
    PostgreSQL: 功能强大、ACID支持、适合复杂查询
    MySQL: 性能好、使用广泛、运维成熟
    
  文档数据库:
    MongoDB: 灵活模式、水平扩展、JSON友好
    
  键值数据库:
    Redis: 高性能缓存、数据结构丰富
    
推荐选择: 
  主数据库: {{primary_database}}
  缓存数据库: {{cache_database}}
```

### 2. 系统架构设计
设计清晰的系统架构：

#### 分层架构设计
```
┌─────────────────────────────────────┐
│           Presentation Layer        │  <- 表现层
├─────────────────────────────────────┤
│           Application Layer         │  <- 应用层
├─────────────────────────────────────┤
│             Domain Layer            │  <- 领域层
├─────────────────────────────────────┤
│          Infrastructure Layer       │  <- 基础设施层
└─────────────────────────────────────┘
```

#### 项目目录结构
```
{{project_name}}/
├── README.md                 # 项目说明文档
├── package.json             # 依赖配置
├── .gitignore              # Git忽略规则
├── .env.example            # 环境变量示例
├── docker-compose.yml      # Docker容器编排
├── docs/                   # 项目文档
│   ├── api/               # API文档
│   ├── deployment/        # 部署文档
│   └── development/       # 开发文档
├── src/                    # 源代码目录
│   ├── api/               # API接口层
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   └── routes/        # 路由定义
│   ├── core/              # 核心业务逻辑
│   │   ├── services/      # 业务服务
│   │   ├── models/        # 数据模型
│   │   └── utils/         # 工具函数
│   ├── config/            # 配置管理
│   └── database/          # 数据库相关
│       ├── migrations/    # 数据库迁移
│       ├── seeds/         # 种子数据
│       └── schemas/       # 数据库模式
├── tests/                  # 测试代码
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/              # 端到端测试
├── scripts/               # 项目脚本
│   ├── build.sh          # 构建脚本
│   ├── deploy.sh         # 部署脚本
│   └── dev.sh            # 开发脚本
└── infrastructure/        # 基础设施配置
    ├── docker/           # Docker配置
    ├── kubernetes/       # K8s配置
    └── terraform/        # 基础设施即代码
```

## 🚀 项目脚手架创建

### 1. 项目初始化脚本
创建自动化的项目初始化脚本：

```bash
#!/bin/bash
# 项目初始化脚本 - init-project.sh

PROJECT_NAME="{{project_name}}"
BACKEND_FRAMEWORK="{{backend_framework}}"
FRONTEND_FRAMEWORK="{{frontend_framework}}"

echo "🚀 正在初始化项目: $PROJECT_NAME"

# 创建项目目录结构
echo "📁 创建目录结构..."
mkdir -p $PROJECT_NAME/{src/{api/{controllers,middleware,routes},core/{services,models,utils},config,database/{migrations,seeds,schemas}},tests/{unit,integration,e2e},scripts,docs/{api,deployment,development},infrastructure/{docker,kubernetes,terraform}}

# 切换到项目目录
cd $PROJECT_NAME

# 初始化版本控制
echo "🔄 初始化Git仓库..."
git init
git add .
git commit -m "Initial project structure"

# 根据选择的技术栈初始化项目
case $BACKEND_FRAMEWORK in
    "nodejs")
        echo "📦 初始化Node.js项目..."
        npm init -y
        npm install express cors helmet morgan
        npm install -D nodemon jest supertest eslint
        ;;
    "python")
        echo "🐍 初始化Python项目..."
        python -m venv venv
        source venv/bin/activate
        pip install fastapi uvicorn sqlalchemy
        pip install -D pytest black flake8
        ;;
    "java")
        echo "☕ 初始化Java项目..."
        # Spring Boot项目初始化逻辑
        ;;
esac

echo "✅ 项目初始化完成！"
echo "📖 请查看 README.md 了解下一步操作"
```

### 2. 基础配置文件创建
生成项目必需的配置文件：

#### package.json (Node.js项目)
```json
{
  "name": "{{project_name}}",
  "version": "1.0.0",
  "description": "{{project_description}}",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "build": "npm run lint && npm run test",
    "deploy": "./scripts/deploy.sh"
  },
  "keywords": [
    "{{project_keywords}}"
  ],
  "author": "{{author_name}}",
  "license": "{{license}}",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0"
  }
}
```

#### Docker配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./src:/app/src
      - ./tests:/app/tests

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB={{project_name}}
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🛠️ 开发环境配置

### 1. 代码质量工具配置
建立代码质量保证体系：

#### ESLint配置 (.eslintrc.js)
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'no-debugger': 'error'
  }
};
```

#### Prettier配置 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Git Hooks配置 (husky)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "src/**/*.js": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### 2. 开发工作流配置
建立高效的开发工作流：

#### VS Code配置 (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".git": true
  },
  "search.exclude": {
    "node_modules": true,
    "dist": true
  }
}
```

#### 环境变量管理
```bash
# .env.example
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{project_name}}
DB_USER=admin
DB_PASSWORD=password

# 认证配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 第三方服务
REDIS_URL=redis://localhost:6379
EMAIL_SERVICE_API_KEY=your-api-key

# 日志配置
LOG_LEVEL=debug
```

## 🧪 测试框架搭建

### 1. 测试架构设计
建立完整的测试体系：

#### 测试配置 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
    '!src/database/migrations/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ]
};
```

#### 测试工具类
```javascript
// tests/utils/test-helpers.js
const request = require('supertest');
const app = require('../../src/app');

class TestHelpers {
  static async createTestUser(userData = {}) {
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword'
    };
    
    return await User.create({
      ...defaultUser,
      ...userData
    });
  }

  static async authenticateUser(user) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'testpassword'
      });
      
    return response.body.token;
  }

  static async cleanDatabase() {
    // 清理测试数据库
    await User.deleteMany({});
    // ... 清理其他模型
  }
}

module.exports = TestHelpers;
```

### 2. 示例测试用例
```javascript
// tests/integration/api/users.test.js
const request = require('supertest');
const app = require('../../../src/app');
const TestHelpers = require('../../utils/test-helpers');

describe('Users API', () => {
  beforeEach(async () => {
    await TestHelpers.cleanDatabase();
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      // 创建测试数据
      await TestHelpers.createTestUser();

      // 发送请求
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // 验证响应
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should handle empty result', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });
});
```

## 📦 CI/CD管道设置

### 1. GitHub Actions工作流
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t ${{ github.repository }}:latest .
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ${{ github.repository }}:latest
```

### 2. 部署脚本
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

PROJECT_NAME="{{project_name}}"
ENVIRONMENT=${1:-staging}

echo "🚀 部署项目到 $ENVIRONMENT 环境"

# 构建项目
echo "🔨 构建项目..."
npm run build

# 运行测试
echo "🧪 运行测试..."
npm run test

# 构建Docker镜像
echo "🐳 构建Docker镜像..."
docker build -t $PROJECT_NAME:$ENVIRONMENT .

# 部署到目标环境
case $ENVIRONMENT in
    "staging")
        echo "📤 部署到测试环境..."
        docker-compose -f docker-compose.staging.yml up -d
        ;;
    "production")
        echo "📤 部署到生产环境..."
        # 生产环境部署逻辑
        ;;
esac

echo "✅ 部署完成！"
```

## 📚 项目文档创建

### 1. README.md模板
```markdown
# {{project_name}}

{{project_description}}

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0 (可选)

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd {{project_name}}
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件设置必要的环境变量
```

4. 启动数据库
```bash
docker-compose up -d db
```

5. 运行数据库迁移
```bash
npm run migrate
```

6. 启动项目
```bash
npm run dev
```

## 📖 项目文档

- [API文档](./docs/api/README.md)
- [开发指南](./docs/development/README.md)
- [部署指南](./docs/deployment/README.md)
- [架构设计](./docs/architecture.md)

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 🚀 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### Docker部署
```bash
docker-compose up -d
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 {{license}} 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
```

## 🎯 项目交付检查清单

### 基础设施完整性
- [ ] 项目目录结构完整
- [ ] 配置文件正确设置
- [ ] 环境变量配置完整
- [ ] 数据库连接正常
- [ ] Docker配置可用

### 代码质量保证
- [ ] 代码规范配置生效
- [ ] Git hooks正常工作
- [ ] 静态代码分析通过
- [ ] 测试框架搭建完成
- [ ] 测试覆盖率达标 (>80%)

### 开发工作流
- [ ] 本地开发环境可用
- [ ] 热重载功能正常
- [ ] 调试配置完整
- [ ] 日志系统可用
- [ ] 错误处理机制完善

### CI/CD流程
- [ ] 持续集成配置完成
- [ ] 自动化测试运行正常
- [ ] 构建流程无误
- [ ] 部署脚本可用
- [ ] 监控告警配置

### 文档完整性
- [ ] README文档完整
- [ ] API文档生成
- [ ] 开发指南编写
- [ ] 部署文档准备
- [ ] 架构文档完成

---
*模板版本*: v4.0  
*适用模式*: Create  
*步骤*: new-project - 新项目创建  
*生成时间*: {{timestamp}}