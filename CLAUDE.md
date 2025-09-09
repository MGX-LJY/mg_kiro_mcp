# CLAUDE.md

Claude Code 工作指南 - mg_kiro MCP Server

## 项目概述

专为 Claude Code 设计的 MCP 服务器，提供项目初始化和文档生成功能。

**版本**: v2.0.0 | **状态**: 生产就绪  
**核心功能**: 项目概览生成、渐进式文档生成、语言智能识别

**架构特点**: 统一入口点 + 服务化设计 + 精简2步流程

## 开发命令

```bash
# 启动服务
npm start                     # MCP模式 (推荐)
MCP_PORT=3000 npm start      # Web服务器模式
npm run dev                   # 开发模式

# 测试和检查
npm test                      # 运行测试
curl http://localhost:3000/health  # 健康检查 (HTTP模式)
```

## 核心架构

### 主要组件
- `index.js` - 统一入口点 (MCP + Express + WebSocket)
- `server/routes/` - 路由系统 (system, init, create)
- `server/services/` - 服务层 (依赖注入 + 服务总线)
- `server/language/` - 语言处理 (检测 + 智能分析)
- `server/analyzers/` - 项目分析器 (扫描 + 内容分析)

## MCP工具 (核心功能)

| 工具 | 功能 | 参数 |
|------|------|------|
| `generate_project_overview` | 生成项目概览包 | `projectPath`(必需), `maxDepth`, `includeFiles` |
| `progressive_documentation` | 渐进式文档生成 | `batchSize`, `style`, `focusAreas`, `includeTests` |
| `get_init_status` | 获取状态和进度 | 无 |
| `reset_init` | 重置流程状态 | 无 |

## 主要API端点 (HTTP模式)

- `GET /health` - 健康检查
- `POST /init/*` - 初始化流程
- `GET /mode/create/*` - Create模式
- `GET /services/*` - 服务管理

## 语言支持

**支持语言**: JavaScript/Node.js, Python, Java, Go, Rust, C#/.NET  
**识别机制**: 文件扩展名 + 配置文件 + 目录结构 + 框架特征检测

## 配置

### 环境变量
```bash
export MCP_PORT=3000        # HTTP端口 (可选)
export MCP_LOG_LEVEL=info   # 日志级别
```

### 配置文件
- `config/mcp.config.json` - 服务器配置
- `config/modes.config.json` - 工作模式
- `config/templates.config.json` - 模板系统

## 模板系统

**模板类型**: 系统架构、模块目录、用户故事、技术分析、行动项目、变更日志  
**目录结构**: `prompts/modes/`, `prompts/languages/`, `prompts/shared/`  
**特性**: 变量替换、语言适配、动态生成、缓存机制

## 开发实践

### 架构原则
- ES6模块化 + 服务化架构 + 配置驱动
- 异步优先 + 标准化响应 + 完整错误处理

### 命名约定
- 服务: `*-service.js` | 分析器: `*-analyzer.js` | 管理器: `*-manager.js`
- 配置: `*.config.json` | 测试: `*.test.js`

### 服务开发
```javascript
// 注册服务
serviceBus.register('serviceName', ServiceClass, config, deps);
// 获取服务
const service = serviceBus.get('serviceName');
// 标准响应
return success(res, data); // error(res, msg, code);
```

## 开发任务

### 添加MCP工具
1. 在 `index.js` 添加工具定义和执行逻辑
2. 更新服务依赖
3. 测试功能

### 扩展服务
1. 创建服务文件 `server/services/`
2. 在 `service-registry.js` 注册
3. 配置依赖关系

### 添加语言支持
1. 更新 `detector.js` 检测规则
2. 创建 `prompts/languages/your-lang/`
3. 更新支持列表

## 问题排查

### 常见问题
- **MCP连接**: 检查Claude Code配置路径
- **端口占用**: `MCP_PORT=3001 npm start`
- **服务依赖**: 检查 `service-registry.js`
- **配置错误**: 验证 `config/*.json` 格式

### 调试命令
```bash
# 健康检查
curl http://localhost:3000/health
# 详细日志
MCP_LOG_LEVEL=debug npm start
# 测试
npm run test:config
```

## 项目状态

**版本**: v2.0.0 | **状态**: 生产就绪 ✅  
**MCP工具**: 4个核心工具 | **服务**: 模块化架构

**技术栈**: Node.js + ES6模块 + MCP协议 + Express + Jest

## Claude Code集成

### MCP配置
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

### 使用流程
1. `generate_project_overview` - 项目分析
2. `progressive_documentation` - 文档生成  
3. `get_init_status` - 监控进度
4. `reset_init` - 重置状态 (可选)

### 最佳实践
- 使用绝对路径
- 默认80KB批次大小
- comprehensive/concise/technical文档风格
- 定期检查状态

---
MIT许可证