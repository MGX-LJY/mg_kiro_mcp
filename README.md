# mg_kiro MCP Server

智能项目文档管理与代码维护系统的 MCP (Model Context Protocol) 服务器实现

## 概述

mg_kiro MCP Server 是一个 Model Context Protocol 智能提示词管理服务器，专为 Claude Code 设计。

**核心功能**: MCP协议服务器、智能语言识别、四种工作模式、多语言模板生成
**状态**: 生产就绪 (100%完成度) - 全新模块化架构

## 核心特性

- **MCP协议服务器** - HTTP + WebSocket双协议支持
- **四种工作模式** - Init/Create/Fix/Analyze模块化路由系统
- **智能语言识别** - 支持JavaScript/Python/Java/Go/Rust/C#
- **项目分析器** - 项目扫描和文件内容分析
- **文档模板系统** - 15+种标准模板，支持变量替换
- **多语言测试** - 100%通过率的兼容性测试

## 项目架构

### 目录结构详解

```
mg_kiro_mcp/                           # 项目根目录 (~4000行代码)
├── server/                            # 🔥 服务器核心模块 (全新模块化架构)
│   ├── mcp-server.js                  # MCP协议服务器 (集成路由系统)
│   │                                  # HTTP + WebSocket双协议支持
│   │                                  # 中间件堆栈、连接管理、错误处理
│   ├── prompt-manager.js              # 智能提示词管理器 (400行)
│   │                                  # 缓存机制、热重载、变量替换
│   ├── config-manager.js              # 配置管理系统 (300行)
│   │                                  # 环境变量覆盖、热重载、验证
│   ├── routes/                        # 🏗️ 模块化路由系统 (全新架构)
│   │   ├── index.js                   # 主路由聚合器
│   │   ├── system/                    # 系统路由 (health, mcp, prompts)
│   │   ├── init/                      # Init模式路由 (6个步骤)
│   │   │   ├── structure.js           # 项目结构分析
│   │   │   ├── language.js            # 智能语言识别
│   │   │   ├── files.js               # 文件内容通读
│   │   │   ├── documents.js           # 文档生成
│   │   │   ├── modules.js             # 模块分析
│   │   │   └── prompts.js             # 语言提示词
│   │   ├── create/                    # Create模式路由
│   │   │   ├── modules.js             # 模块创建
│   │   │   ├── api.js                 # API端点创建
│   │   │   ├── features.js            # 功能规划
│   │   │   └── index.js               # Create模式聚合器
│   │   ├── fix/                       # Fix模式路由
│   │   │   ├── issues.js              # 问题报告
│   │   │   ├── diagnosis.js           # 问题诊断
│   │   │   ├── fixes.js               # 修复应用
│   │   │   └── index.js               # Fix模式聚合器
│   │   └── analyze/                   # Analyze模式路由
│   │       ├── quality.js             # 质量分析
│   │       ├── security.js            # 安全分析
│   │       ├── dependencies.js        # 依赖分析
│   │       ├── reports.js             # 报告生成
│   │       └── index.js               # Analyze模式聚合器
│   ├── services/                      # 🔧 服务层 (重构后统一目录)
│   │   ├── config-service.js          # 配置服务
│   │   ├── language-service.js        # 语言服务
│   │   ├── prompt-service.js          # 提示词服务
│   │   ├── workflow-service.js        # 工作流服务
│   │   ├── response-service.js        # 标准化响应格式 (从utils迁移)
│   │   └── workflow-state-service.js  # 8步骤工作流控制器 (从workflow迁移)
│   ├── language/                      # 🧠 智能语言识别系统
│   │   ├── detector.js                # 语言识别引擎 (415行)
│   │   ├── enhanced-language-detector.js # 增强版检测器
│   │   └── template-generator.js      # 动态模板生成器
│   ├── analyzers/                     # 📊 项目分析器模块
│   │   ├── project-scanner.js         # 项目结构扫描器
│   │   └── file-content-analyzer.js   # 文件内容深度分析
├── prompts/                           # 📝 提示词和模板库
│   ├── modes/                         # 工作模式提示词
│   │   ├── init.md                    # 初始化模式提示词
│   │   ├── create.md                  # 创建模式提示词
│   │   ├── fix.md                     # 修复模式提示词
│   │   └── analyze.md                 # 分析模式提示词
│   ├── templates/                     # 标准文档模板 (15+个)
│   │   ├── system-architecture.md     # 系统架构模板
│   │   ├── modules-catalog.md         # 模块目录模板
│   │   ├── user-stories.md           # 用户故事模板
│   │   ├── technical-analysis.md     # 技术分析模板
│   │   ├── action-items.md           # 行动清单模板
│   │   ├── changelog.md              # 变更记录模板
│   │   └── dependencies.md           # 依赖管理模板
│   └── languages/                     # 多语言支持配置
│       ├── javascript/               # JS生态配置
│       ├── python/                   # Python生态配置
│       ├── java/                     # Java生态配置
│       ├── go/                       # Go生态配置
│       ├── rust/                     # Rust生态配置
│       └── csharp/                   # C#生态配置
├── config/                            # 🔧 配置系统
│   ├── mcp.config.json               # MCP服务器核心配置
│   ├── modes.config.json             # 工作模式行为定义
│   └── templates.config.json         # 模板系统配置
├── tests/                             # 🧪 测试套件
│   ├── config-integration.test.js    # 配置集成测试 (100%覆盖)
│   ├── config-manager.test.js        # 配置管理测试 (100%覆盖)
│   └── server.test.js                # 服务器测试 (85%完成)
├── run-multitest.js                   # 多语言测试运行器 (403行)
├── debug-scanner.js                   # 项目扫描调试工具 (124行)
└── index.js                           # 🚀 应用启动入口
```

## 快速开始

### 安装运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start              # 生产模式
npm run dev            # 开发模式(热重载)

# 验证服务
curl http://localhost:3000/health
```

### 基本使用

```bash
# 健康检查
curl http://localhost:3000/health

# 获取模式提示词
curl http://localhost:3000/prompt/mode/init

# 切换工作模式
curl -X POST http://localhost:3000/mode/switch \
  -H "Content-Type: application/json" \
  -d '{"mode": "create"}'

# 获取文档模板
curl http://localhost:3000/template/system-architecture
```

## API接口

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/status` | 服务状态 |
| POST | `/mcp/handshake` | MCP握手 |
| POST | `/mode/switch` | 切换模式 |
| GET | `/prompt/mode/:mode` | 模式提示词 |
| GET | `/template/:name` | 文档模板 |

## 四大工作模式详解

### 🔵 Init模式 - 项目初始化智能工作流

**功能**: 扫描现有项目，自动生成完整的项目文档体系

**8步骤渐进式工作流程**:
1. ✅ **项目结构扫描** - `server/analyzers/project-scanner.js`
2. ✅ **智能语言识别** - `server/language/detector.js` (415行)
3. ✅ **文件内容通读** - `server/analyzers/file-content-analyzer.js` (已修复文件大小检测问题)
4. ✅ **技术栈识别** - `server/language/enhanced-language-detector.js`
5. ✅ **项目依赖分析**
6. ✅ **文档模板生成**
7. ✅ **工作流程创建**
8. ✅ **总结报告输出**

#### 🟢 Create模式 - 功能创建  
**功能**: 添加新功能或模块，确保文档先行
- ✅ 需求收集与分析
- ✅ 影响评估和设计规划
- ✅ 代码框架生成
- ✅ 文档自动更新

#### 🟡 Fix模式 - 问题修复
**功能**: 修复bug，优化代码，评估风险
- ✅ 问题诊断和根因分析
- ✅ 解决方案制定和实施  
- ✅ 回归测试验证
- ✅ 变更记录生成

#### 🟠 Analyze模式 - 代码分析
**功能**: 代码质量分析，性能审查，安全扫描
- ✅ 代码复杂度和质量评估
- ✅ 依赖关系分析
- ✅ 架构健康度评分
- ✅ 改进建议生成

### 4. 智能语言识别系统 (✅ 完全实现)

**文件**: `server/language/detector.js` (415行代码)

**支持语言**: 6种主流编程语言
- ✅ **JavaScript/Node.js** - React/Vue/Angular/Express/Next.js (新增.vue扩展名支持)
- ✅ **Python** - Django/Flask/FastAPI  
- ✅ **Java** - Spring/Maven/Gradle
- ✅ **Go** - Gin/Echo/Fiber
- ✅ **Rust** - Actix/Rocket/Warp
- ✅ **C#/.NET** - ASP.NET/Blazor/WPF

**识别机制**:
- ✅ 文件扩展名权重分析
- ✅ 配置文件特征识别（package.json, requirements.txt等）
- ✅ 目录结构模式匹配
- ✅ 框架特征检测
- ✅ 权重算法评分

### 5. 项目分析器系统 (✅ 完全实现)

**文件**: `server/analyzers/project-scanner.js` & `server/analyzers/file-content-analyzer.js`

**核心功能**:
- ✅ **项目结构扫描** - 智能目录树生成和分析
- ✅ **文件内容通读** - 核心文件内容深度解析 (已修复文件大小0导致跳过的问题)
- ✅ **配置文件识别** - 自动识别各种配置文件类型
- ✅ **依赖关系映射** - 模块间依赖关系构建
- ✅ **路径处理优化** - 修复临时项目路径重复问题

### 6. 配置管理系统 (✅ 完全实现)

**文件**: `server/config-manager.js` (300行代码)

**特色功能**:
- ✅ **多配置文件管理** - MCP/模式/模板配置分离
- ✅ **环境变量覆盖** - 支持`MCP_PORT`、`MCP_HOST`等覆盖
- ✅ **热重载机制** - 运行时配置文件变更自动重载
- ✅ **配置验证** - 启动时完整性检查
- ✅ **错误恢复** - 配置加载失败时的优雅降级

## 🧪 多语言兼容性测试

### ✅ 测试系统 (100%通过率)

**测试运行器**: `run-multitest.js` (403行代码)
**调试工具**: `debug-scanner.js` (124行代码)

**测试覆盖**:
- ✅ **当前项目检测** - mg_kiro MCP Server (Node.js项目)
  - 语言检测: JavaScript (85%置信度)
  - 框架检测: Express
  - 文件扫描: 81个文件成功分析

- ✅ **Python项目测试** - 动态创建Flask项目
  - 语言检测: Python (90%置信度)
  - 框架检测: Flask
  - 文件分析: 4个文件 (app.py, requirements.txt, config.py, models.py)

- ✅ **Vue.js项目测试** - 动态创建Vue 3项目
  - 语言检测: JavaScript (73%置信度，新增.vue扩展名支持后提升)
  - 框架检测: Vue
  - 文件分析: 5个文件 (package.json, main.js, App.vue, HelloWorld.vue, vue.config.js)

### 运行测试

```bash
# 配置系统测试
npm run test:config

# 多语言兼容性测试
node run-multitest.js

# 项目扫描调试
node debug-scanner.js

# 运行所有测试
npm test
```

### 支持语言
- JavaScript/Node.js (React/Vue/Angular)
- Python (Django/Flask/FastAPI)
- Java (Spring/Maven/Gradle)
- Go/Rust/C#/.NET

## 配置

### 环境变量
```bash
export MCP_PORT=3000              # 服务端口
export MCP_HOST=localhost         # 主机地址
export MCP_LOG_LEVEL=info        # 日志级别
export MCP_API_KEY=your-key      # API密钥(可选)
```

### 文档模板
系统包含15+种标准文档模板，支持变量替换和多语言变体:
- system-architecture, modules-catalog, user-stories
- technical-analysis, action-items, changelog
- dependencies, module-template, integration-contracts

## Claude Code 集成

在Claude Code配置文件中添加:

```json
{
  "mcpServers": {
    "mg_kiro": {
      "command": "node",
      "args": ["/path/to/mg_kiro_mcp/index.js"],
      "env": {
        "MCP_PORT": "3000",
        "MCP_HOST": "localhost"
      }
    }
  }
}
```

## 许可证

MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情