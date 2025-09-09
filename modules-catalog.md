# mg_kiro MCP 模块目录

## 模块概览

**生成时间**: 2025-09-09  
**分析模块数**: 1个主模块  
**项目语言**: JavaScript (置信度: 86%)  

## 核心模块结构

### 1. 主模块 (Root Module)

**模块名**: `main`  
**路径**: `/Users/martinezdavid/Documents/MG/code/mg_kiro_mcp`  
**类型**: 根模块  
**描述**: 主模块 - MCP服务器核心功能

**关键特性**:
- MCP协议服务器入口点
- Express API集成
- WebSocket通信支持
- 服务依赖管理

## 架构分析详情

### 入口文件分析

#### 1. index.js (统一入口点)
- **大小**: 13,813 bytes
- **优先级**: 最高 (Critical)
- **角色**: Entry Point + Middleware Orchestrator
- **关键导入**:
  - `@modelcontextprotocol/sdk/server` - MCP服务器SDK
  - `express` - Web框架
  - `ws` - WebSocket支持
  - `./server/routes/index.js` - 路由系统

**核心函数**:
- `startServer()` - 异步服务器启动
- `handleWebSocketMessage()` - WebSocket消息处理

#### 2. server/routes/index.js (路由管理)  
- **大小**: 4,738 bytes
- **角色**: 路由编排器
- **关键路由模块**:
  - `./system/health.js` - 健康检查
  - `./system/mcp.js` - MCP协议处理
  - `./system/prompts.js` - 提示词管理
  - `./system/claude-code-init.js` - Init流程

#### 3. server/routes/init/index.js (Init模块聚合)
- **大小**: 2,617 bytes  
- **作用**: Init模式路由聚合器
- **包含子路由**:
  - `/contracts` - 集成契约
  - `/documents` - 文档生成
  - `/files` - 文件分析
  - `/language` - 语言检测
  - `/modules-analysis` - 模块分析
  - `/modules-docs` - 模块文档
  - `/prompts` - 提示词
  - `/structure` - 结构分析

## 系统路由分析

### System路由模块
- **health.js**: 系统健康监控
- **mcp.js**: MCP协议端点  
- **prompts.js**: 提示词系统

### Init路由模块详情

#### contracts.js (集成契约)
- **大小**: 30,691 bytes
- **复杂度**: 中等 (17个函数)
- **主要功能**:
  - 智能集成分析
  - 契约文档生成
  - 风险评估
  - 架构指标计算

#### documents.js (文档生成)
- **大小**: 24,504 bytes  
- **主要功能**:
  - 系统架构文档生成
  - 模块目录文档生成
  - AI响应处理
  - 超详细生成器集成

#### structure.js (结构分析)  
- **大小**: 22,722 bytes
- **复杂度**: 中等 (16个函数)
- **主要功能**:
  - 项目结构智能分析
  - 复杂度评估
  - 架构键提取
  - 可维护性指数计算

#### modules-analysis.js (模块分析)
- **大小**: 21,501 bytes
- **主要功能**:
  - 完整模块分析
  - 依赖关系映射
  - 模块分类
  - 接口分析

## 依赖关系

### 外部依赖
- **MCP SDK**: Model Context Protocol核心支持
- **Express**: Web服务器框架
- **WebSocket**: 实时通信
- **CORS**: 跨域资源共享

### 内部依赖关系
```
index.js
├── server/routes/index.js
│   ├── system/health.js
│   ├── system/mcp.js  
│   ├── system/prompts.js
│   └── system/claude-code-init.js
└── server/services/service-registry.js
```

## 设计模式识别

### 检测到的模式
1. **MVC/REST**: Express路由系统
2. **Middleware/Pipeline**: 中间件管道
3. **Async/Await**: 异步编程模式
4. **依赖注入**: 服务注册系统

## 代码质量评估

### 复杂度指标
- **结构复杂度**: 低-中等
- **依赖耦合度**: 中等
- **接口内聚度**: 中等
- **总体质量**: 良好

### 架构优势
- ✅ 清晰的模块分离
- ✅ 统一的入口点设计
- ✅ 标准化的错误处理
- ✅ 完整的路由系统

### 改进建议
1. **降低耦合度**: 某些模块依赖较重
2. **增强测试覆盖**: 需要更多单元测试
3. **文档补全**: 部分函数缺少JSDoc

---
*此文档由 Claude Code Init 流程自动生成*  
*基于模块分析和架构提取结果*  
*生成时间: 2025-09-09*