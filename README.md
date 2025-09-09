# mg_kiro MCP Server

智能项目文档管理系统的 MCP (Model Context Protocol) 服务器实现

## 概述

mg_kiro MCP Server 是一个专为 Claude Code 设计的 Model Context Protocol 服务器，提供项目初始化和文档生成功能。

**版本**: v2.0.0
**状态**: 生产就绪 - 精简架构，专注MCP协议
**核心功能**: MCP协议服务器、项目概览生成、渐进式文档生成

## 核心特性

- **🎯 MCP协议服务器** - 支持stdio和HTTP/WebSocket双模式
- **🚀 简化架构** - 专注于项目初始化和文档生成的2步流程
- **📊 项目分析** - 智能项目结构扫描和语言识别
- **📝 文档生成** - 基于项目分析的渐进式文档生成
- **🔧 服务化设计** - 模块化服务架构，依赖注入
- **🌐 多语言支持** - JavaScript/Python/Java/Go/Rust/C#等主流语言

## 项目架构

### 实际目录结构

```
mg_kiro_mcp/
├── index.js                    # 🚀 统一入口点 - MCP协议服务器 + Express + WebSocket
├── package.json                # 项目配置 - v2.0.0
├── server/                     # 📁 服务器核心模块
│   ├── routes/                 # 🛤️ 路由系统
│   │   ├── index.js            # 主路由配置
│   │   ├── system/             # 系统路由
│   │   │   ├── health.js       # 健康检查和系统状态
│   │   │   ├── mcp.js          # MCP协议端点
│   │   │   └── prompts.js      # 提示词管理
│   │   ├── init/               # 初始化流程路由
│   │   │   ├── claude-code-init.js  # Claude Code集成流程
│   │   │   ├── turbo-init.js        # 高性能处理版本
│   │   │   └── ai-batch-init.js     # AI批量分析版本
│   │   └── create/             # Create模式路由
│   │       ├── index.js
│   │       ├── existing-project-workflow.js
│   │       └── new-project-workflow.js
│   ├── services/               # 🔧 服务层
│   │   ├── service-registry.js      # 服务注册和依赖注入
│   │   ├── service-bus.js           # 服务总线
│   │   ├── config-service.js        # 配置管理
│   │   ├── language-intelligence-service.js  # 语言智能服务
│   │   ├── project-overview-generator.js     # 项目概览生成
│   │   ├── ai-todo-manager.js       # AI任务管理
│   │   ├── file-query-service.js    # 文件查询服务
│   │   ├── response-service.js      # 标准化响应
│   │   └── unified/            # 统一模板系统
│   │       ├── master-template-service.js
│   │       ├── template-config-manager.js
│   │       └── mode-template-service.js
│   ├── language/               # 🧠 语言处理模块
│   │   ├── detector.js         # 语言识别引擎
│   │   ├── language-prompt-generator.js
│   │   └── prompt-intelligence.js
│   └── analyzers/              # 📊 项目分析器
│       ├── enhanced-language-detector.js
│       ├── file-content-analyzer.js
│       └── project-scanner.js
├── prompts/                    # 📝 提示词和模板
│   ├── modes/                  # 工作模式提示词
│   │   ├── init/
│   │   └── create/
│   ├── languages/              # 语言特定配置
│   │   └── javascript/
│   └── shared/                 # 共享模板
├── config/                     # ⚙️ 配置文件
│   ├── mcp.config.json        # MCP服务器配置
│   ├── modes.config.json      # 工作模式配置
│   ├── templates.config.json  # 模板配置
│   └── template-system.config.json
└── tests/                      # 🧪 测试套件
    ├── config-integration.test.js
    └── server.test.js
```

## 快速开始

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd mg_kiro_mcp

# 安装依赖
npm install

# 启动服务器
npm start              # MCP协议模式（stdio）
MCP_PORT=3000 npm start # Web服务器模式
npm run dev            # 开发模式（热重载）

# 运行测试
npm test               # 运行所有测试
npm run test:config    # 配置系统测试
```

### 两种运行模式

#### 1. MCP协议模式（推荐）
```bash
# 直接启动，用于Claude Code集成
node index.js
```

#### 2. Web服务器模式
```bash
# 启动HTTP/WebSocket服务器
MCP_PORT=3000 node index.js

# 验证服务
curl http://localhost:3000/health
```

## MCP工具接口

### 核心MCP工具（v3.0.0-simplified）

| 工具名称 | 功能描述 |
|---------|----------|
| `generate_project_overview` | 生成项目概览包：语言分析+依赖分析+目录结构+README+核心文件内容 |
| `progressive_documentation` | 启动渐进式文档生成：AI协作流程，从项目概览到完整文档体系 |
| `get_init_status` | 获取当前Init流程的状态、进度和健康信息 |
| `reset_init` | 重置Init流程，清除所有缓存状态 |

### Web API接口（当启用HTTP模式时）

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/health` | 健康检查和系统状态 |
| GET | `/status` | 详细服务状态 |
| GET | `/metrics` | 系统性能指标 |
| POST | `/init/initialize` | 项目初始化 |
| POST | `/init/project-overview` | 生成项目概览 |
| POST | `/init/progressive-documentation` | 渐进式文档生成 |
| GET | `/init/status` | 获取初始化状态 |
| GET | `/services/status` | 服务状态查询 |

## 核心功能详解

### 🎯 精简化2步Init流程（v3.0-simplified）

#### **Step 1: 项目概览生成**
使用MCP工具 `generate_project_overview`：
- **📁 项目结构分析** - 智能目录扫描，最大深度可配置
- **🔍 语言识别** - 自动识别主要编程语言和框架
- **📄 依赖分析** - 解析配置文件，提取依赖关系
- **📋 核心文件内容** - 自动读取关键文件（README、配置、主要代码文件）
- **📊 项目统计** - 文件数量、代码行数、项目规模评估

#### **Step 2: 渐进式文档生成**
使用MCP工具 `progressive_documentation`：
- **📝 AI协作流程** - 基于项目概览，启动分批文档生成
- **📚 文档体系构建** - 从文件文档到模块文档到集成文档
- **🎨 多种文档风格** - comprehensive（全面）/ concise（简洁）/ technical（技术导向）
- **🔄 批量处理** - 可配置批次大小（默认80KB），避免上下文溢出
- **📈 进度管理** - 实时跟踪文档生成进度和状态

### 🧠 智能语言识别系统

**实现文件**: `server/language/detector.js` 和 `server/analyzers/enhanced-language-detector.js`

**支持语言**：
- **JavaScript/Node.js** - React、Vue、Angular、Express、Next.js
- **Python** - Django、Flask、FastAPI
- **Java** - Spring、Maven、Gradle
- **Go** - Gin、Echo、Fiber
- **Rust** - Actix、Rocket、Warp
- **C#/.NET** - ASP.NET、Blazor、WPF

**识别机制**：
- 文件扩展名权重分析
- 配置文件特征识别（package.json、requirements.txt等）
- 目录结构模式匹配
- 框架特征检测和权重算法评分

### 📊 项目分析器系统

**核心组件**：
- **项目扫描器** (`server/analyzers/project-scanner.js`)
- **文件内容分析器** (`server/analyzers/file-content-analyzer.js`)

**功能特性**：
- 智能目录树生成，可配置扫描深度
- 核心文件内容提取和分析
- 配置文件自动识别和解析
- 依赖关系图构建

### ⚙️ 服务化架构

**服务注册系统** (`server/services/service-registry.js`)：
- 依赖注入模式
- 服务生命周期管理
- 统一的服务总线 (`service-bus.js`)

**核心服务**：
- `LanguageIntelligenceService` - 语言智能分析
- `MasterTemplateService` - 统一模板管理
- `ProjectOverviewGenerator` - 项目概览生成
- `AITodoManager` - AI任务管理

## 🧪 测试和验证

### 测试套件

```bash
# 运行所有测试
npm test

# 配置系统测试
npm run test:config

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration
```

### 健康检查

```bash
# 系统健康检查（HTTP模式下）
curl http://localhost:3000/health
curl http://localhost:3000/status
curl http://localhost:3000/metrics

# MCP工具测试
# 使用Claude Code客户端测试MCP工具
```

## 配置

### 环境变量
```bash
export MCP_PORT=3000              # 服务端口
export MCP_HOST=localhost         # 主机地址
export MCP_LOG_LEVEL=info        # 日志级别
export MCP_API_KEY=your-key      # API密钥(可选)
```

### 模板系统
系统支持多种文档模板，配置在 `config/templates.config.json`:
- system-architecture（系统架构）
- modules-catalog（模块目录）
- user-stories（用户故事）
- technical-analysis（技术分析）
- action-items（行动项目）
- changelog（变更日志）

## Claude Code 集成

### MCP服务器配置

在Claude Code的MCP配置中添加：

```json
{
  "mcpServers": {
    "mg_kiro": {
      "command": "node",
      "args": ["/path/to/mg_kiro_mcp/index.js"]
    }
  }
}
```

### 使用方式

1. **项目概览生成**：
   ```
   使用MCP工具 generate_project_overview
   参数：projectPath（项目根目录绝对路径）
   ```

2. **渐进式文档生成**：
   ```
   使用MCP工具 progressive_documentation
   参数：batchSize, style, focusAreas, includeTests
   ```

3. **状态查询**：
   ```
   使用MCP工具 get_init_status
   获取当前初始化流程的进度和状态
   ```

## 许可证

MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情