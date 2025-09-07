# CLAUDE.md

Claude Code 工作指南 - mg_kiro MCP Server

## 项目概述

mg_kiro MCP Server 是一个 Model Context Protocol 智能提示词管理服务器，专为 Claude Code 设计。

**状态**: 生产就绪 (92%完成度)
**核心功能**: MCP协议服务器、四种工作模式、智能语言识别、文档模板系统

**工作模式**:
- **Init** - 项目初始化和文档生成
- **Create** - 新功能开发和模块创建
- **Fix** - 问题修复和代码优化  
- **Analyze** - 代码分析和质量评估

## 开发命令

### 基本命令
```bash
npm start                # 启动服务器
npm run dev             # 开发模式(热重载)
npm test               # 运行测试
npm run test:config    # 配置测试
node run-multitest.js  # 多语言测试
```

### 健康检查
```bash
curl http://localhost:3000/health
curl http://localhost:3000/status
```

## 项目架构

### 核心组件
- `server/mcp-server.js` - MCP协议服务器
- `server/prompt-manager.js` - 提示词管理
- `server/mode-handler.js` - 工作模式处理器
- `server/config-manager.js` - 配置管理
- `server/language/detector.js` - 语言识别引擎
- `server/analyzers/` - 项目扫描和文件分析

### 关键API
- `GET /health` - 健康检查
- `POST /mcp/handshake` - MCP握手
- `POST /mode/switch` - 切换模式
- `GET /prompt/mode/:mode` - 模式提示词
- `GET /template/:name` - 文档模板

## 多语言支持

### 支持语言
- JavaScript/Node.js (React/Vue/Angular)
- Python (Django/Flask/FastAPI)
- Java/Go/Rust/C#/.NET

### 语言识别
自动检测文件扩展名、配置文件、框架特征进行智能识别，测试通过率100%

## 配置

### 环境变量
```bash
export MCP_PORT=3000              # 服务端口
export MCP_HOST=localhost         # 主机地址  
export MCP_LOG_LEVEL=info        # 日志级别
export MCP_API_KEY=your-key      # API密钥(可选)
```

### 配置文件
- `config/mcp.config.json` - 服务器配置
- `config/modes.config.json` - 工作模式配置
- `config/templates.config.json` - 模板系统配置

## 模板系统

### 文档模板 (15+种)
包含系统架构、用户故事、技术分析、任务清单等标准文档模板，支持变量替换和多语言变体。

模板位置: `prompts/templates/` 和 `prompts/language-variants/`

## 开发实践

### 代码架构
- ES6模块化，使用import/export语法
- 事件驱动设计，异步处理
- 配置驱动，通过JSON文件控制行为
- 完整错误处理和日志记录

### 文件命名约定
- 服务: `*-server.js`
- 管理器: `*-manager.js` 
- 处理器: `*-handler.js`
- 分析器: `*-analyzer.js`

## 常见任务

### 添加新模板
1. 在 `prompts/templates/` 创建Markdown文件
2. 使用变量占位符 `{{project_name}}`
3. 测试: `curl http://localhost:3000/template/your-template`

### 扩展工作模式  
1. 在 `server/mode-handler.js` 添加处理逻辑
2. 创建提示词文件 `prompts/modes/your-mode.md`
3. 更新 `config/modes.config.json`

### 增强语言支持
1. 在 `server/language/detector.js` 添加语言规则
2. 扩展多语言测试 `run-multitest.js`

## 问题排查

### 常见问题
- **端口占用**: `MCP_PORT=3001 npm start`
- **语言识别**: `node run-multitest.js`
- **文件扫描**: `node debug-scanner.js`
- **配置错误**: 检查 `config/*.json` 文件格式

## 项目状态

- **版本**: v2.0.1
- **完成度**: 92%
- **状态**: 生产就绪
- **多语言测试**: 100%通过率