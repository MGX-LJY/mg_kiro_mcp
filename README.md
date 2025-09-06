# 🤖 mg_kiro MCP Server

> 智能项目文档管理与代码维护系统的 MCP (Model Context Protocol) 服务器实现

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/mg_kiro_mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-purple.svg)](https://claude.ai)

## 📋 概述

mg_kiro MCP Server 是一个基于 Model Context Protocol 的智能提示词管理服务器，专为 Claude Code 设计，通过标准化的文档体系和多种工作模式，实现真正的文档驱动开发（Document Driven Development）。

### 核心特性

- 🚀 **四种工作模式**：Init（初始化）、Create（创建）、Fix（修复）、Analyze（分析）
- 📚 **标准化文档模板**：9种预定义文档模板，覆盖项目全生命周期
- 🔄 **智能模式切换**：根据任务自动切换最适合的工作模式
- 📡 **MCP协议支持**：完全兼容Claude Code的MCP通信协议
- 🛠️ **智能纠错系统**：自动检测和修复常见代码问题
- 📊 **实时状态追踪**：项目健康度、文档完整度实时监控

## 🏗️ 项目结构

```
mg_kiro_mcp/
├── server/                     # MCP服务器核心
│   ├── mcp-server.js          # MCP服务器主文件
│   ├── prompt-manager.js       # 提示词管理器
│   └── mode-handler.js         # 模式处理器
├── prompts/                    # 提示词库
│   ├── modes/                  # 工作模式提示词
│   │   ├── init.md            # 初始化模式
│   │   ├── create.md          # 创建模式
│   │   ├── fix.md             # 修复模式
│   │   └── analyze.md         # 分析模式
│   ├── templates/              # 文档模板
│   │   ├── system-architecture.md     # 系统架构
│   │   ├── modules-catalog.md         # 模块目录
│   │   ├── module-template.md         # 模块模板
│   │   ├── integration-contracts.md   # 集成契约
│   │   ├── dependencies.md            # 依赖管理
│   │   ├── user-stories.md           # 用户故事
│   │   ├── technical-analysis.md     # 技术分析
│   │   ├── action-items.md           # 待办事项
│   │   └── changelog.md              # 变更记录
│   └── snippets/               # 可复用片段
│       ├── welcome.md          # 欢迎消息
│       ├── error-handling.md   # 错误处理
│       ├── confirmation.md     # 确认提示
│       └── progress.md         # 进度显示
├── config/                     # 配置文件
│   ├── mcp.config.json        # MCP配置
│   ├── modes.config.json      # 模式配置
│   └── templates.config.json  # 模板配置
├── tests/                      # 测试文件
│   ├── server.test.js         # 服务器测试
│   └── modes.test.js          # 模式测试
├── docs/                       # 文档
├── package.json               # 项目配置
├── index.js                   # 入口文件
├── .env.example               # 环境变量示例
├── README.md                  # 说明文档
└── TODO.md                    # 待办事项

```

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Claude Code (已安装MCP支持)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/mg_kiro_mcp.git
cd mg_kiro_mcp
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件配置你的环境
```

4. **启动服务器**
```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start

# 后台运行
npm run daemon
```

### Claude Code 集成

在 Claude Code 的配置文件中添加：

```json
{
  "mcpServers": {
    "mg_kiro": {
      "command": "node",
      "args": ["/path/to/mg_kiro_mcp/index.js"],
      "env": {
        "MCP_MODE": "production",
        "MCP_PORT": "3000"
      }
    }
  }
}
```

## 🎯 工作模式详解

### 1️⃣ Init模式（初始化模式）

**用途**：扫描现有项目，自动生成完整的项目文档体系

**触发方式**：
- 命令：`@init`
- 自然语言：「初始化项目」「扫描我的代码」「生成项目文档」

**功能特性**：
- 自动识别技术栈
- 分析模块依赖关系
- 提取API接口信息
- 生成标准化文档

### 2️⃣ Create模式（创建模式）

**用途**：添加新功能或模块，确保文档先行

**触发方式**：
- 命令：`@create [feature]`
- 自然语言：「创建新功能」「添加模块」「我想要实现...」

**功能特性**：
- 需求收集与分析
- 影响评估
- 自动更新相关文档
- 生成代码框架

### 3️⃣ Fix模式（修复模式）

**用途**：修复bug，优化代码，评估风险

**触发方式**：
- 命令：`@fix [issue]`
- 自然语言：「修复bug」「解决问题」「优化性能」

**功能特性**：
- 智能问题定位
- 风险等级评估
- 影响范围分析
- 自动化测试

### 4️⃣ Analyze模式（分析模式）

**用途**：代码质量分析，性能审查，安全扫描

**触发方式**：
- 命令：`@analyze [module]`
- 自然语言：「分析代码」「代码审查」「检查质量」

**功能特性**：
- 代码复杂度分析
- 性能瓶颈识别
- 安全漏洞扫描
- 最佳实践建议

## 📡 API 文档

### 基础端点

#### 获取系统提示词
```http
GET /prompt/system
```

**响应示例**：
```json
{
  "status": "success",
  "data": {
    "system_prompt": "...",
    "version": "2.0.0",
    "mode": "init"
  }
}
```

#### 切换工作模式
```http
POST /mode/switch
Content-Type: application/json

{
  "mode": "create",
  "context": {
    "project": "my-project"
  }
}
```

#### 获取模式提示词
```http
GET /prompt/mode/:modeName
```

**支持的模式**：
- `init` - 初始化模式
- `create` - 创建模式
- `fix` - 修复模式
- `analyze` - 分析模式

#### 获取文档模板
```http
GET /template/:templateName
```

**可用模板**：
- `system-architecture` - 系统架构
- `modules-catalog` - 模块目录
- `user-stories` - 用户故事
- `technical-analysis` - 技术分析
- 更多...

### WebSocket 实时通信

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// 订阅模式变更
ws.send(JSON.stringify({
  type: 'subscribe',
  event: 'mode_change'
}));

// 接收实时更新
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Mode changed to:', msg.mode);
});
```

## 🔧 配置说明

### mcp.config.json
```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:*"]
    }
  },
  "modes": {
    "default": "init",
    "available": ["init", "create", "fix", "analyze"],
    "auto_switch": true
  },
  "cache": {
    "enabled": true,
    "ttl": 3600
  }
}
```

### modes.config.json
```json
{
  "init": {
    "name": "初始化模式",
    "description": "扫描项目并生成文档",
    "triggers": ["@init", "初始化项目", "扫描代码"],
    "promptFile": "init.md",
    "templates": [
      "system-architecture",
      "modules-catalog",
      "dependencies"
    ]
  },
  "create": {
    "name": "创建模式",
    "description": "创建新功能或模块",
    "triggers": ["@create", "创建功能", "添加模块"],
    "promptFile": "create.md",
    "requires_confirmation": true
  }
}
```

## 💻 使用示例

### Node.js 客户端
```javascript
const MgKiroClient = require('mg_kiro_mcp/client');

const client = new MgKiroClient({
  host: 'localhost',
  port: 3000,
  apiKey: 'your-api-key' // 可选
});

// 初始化项目
const initResult = await client.initProject('./my-project');
console.log('项目已初始化:', initResult);

// 切换到创建模式
await client.switchMode('create');

// 获取当前模式的提示词
const prompt = await client.getCurrentPrompt();

// 创建新功能
const feature = await client.createFeature({
  name: 'user-authentication',
  description: '用户认证系统',
  modules: ['auth', 'user']
});
```

### 命令行工具
```bash
# 全局安装CLI
npm install -g mg_kiro-cli

# 初始化项目
mg_kiro init

# 创建新功能
mg_kiro create feature user-auth

# 修复问题
mg_kiro fix "login timeout issue"

# 分析代码
mg_kiro analyze --module auth

# 查看状态
mg_kiro status
```

### cURL 示例
```bash
# 获取系统提示词
curl http://localhost:3000/prompt/system

# 切换到Fix模式
curl -X POST http://localhost:3000/mode/switch \
  -H "Content-Type: application/json" \
  -d '{"mode": "fix"}'

# 获取模板
curl http://localhost:3000/template/system-architecture
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm test -- --grep "mode switching"

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage

# 运行性能测试
npm run test:performance
```

## 📊 监控与日志

### 日志级别
- `ERROR` - 错误信息
- `WARN` - 警告信息
- `INFO` - 一般信息
- `DEBUG` - 调试信息

### 日志位置
- 开发环境：控制台输出
- 生产环境：`logs/mg_kiro.log`

### 性能监控
访问 `http://localhost:3000/metrics` 查看：
- 请求数量
- 响应时间
- 错误率
- 内存使用

## 🔒 安全考虑

- API Key 认证（可选）
- Rate Limiting（默认: 100 req/min）
- CORS 配置
- 输入验证
- SQL注入防护
- XSS防护

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v2.0.0 (2024-01-22)
- 🎉 初始版本发布
- ✨ 实现四种工作模式
- 📚 9种文档模板
- 🔧 智能纠错系统
- 📡 MCP协议支持

## 🐛 已知问题

- WebSocket 在某些代理环境下可能断连
- 大型项目（>10000文件）扫描可能较慢

## 🗺️ 路线图

- [ ] v2.1.0 - GraphQL API支持
- [ ] v2.2.0 - 插件系统
- [ ] v2.3.0 - Web管理界面
- [ ] v3.0.0 - AI增强功能

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- Claude Team - 提供强大的AI能力
- Anthropic - MCP协议设计
- 开源社区 - 持续的支持与贡献

## 📮 联系方式

- 项目主页：[https://github.com/yourusername/mg_kiro_mcp](https://github.com/yourusername/mg_kiro_mcp)
- 问题反馈：[Issues](https://github.com/yourusername/mg_kiro_mcp/issues)
- 邮件：mg_kiro@example.com

---

**mg_kiro MCP Server** - 让文档驱动开发成为现实 🚀

*Powered by Claude Code & MCP Protocol*