# mg_kiro MCP 系统架构文档

## 项目概览

**项目名称**: mg_kiro_mcp  
**生成时间**: 2025-09-09  
**项目类型**: MCP协议智能提示词管理服务器  

mg_kiro MCP Server 是一个基于 Model Context Protocol 的智能提示词管理服务器，专为 Claude Code 工作流设计。

## 架构分析

### 系统设计模式
- **架构模式**: 模块化微服务架构
- **通信协议**: MCP (Model Context Protocol) + Express REST API + WebSocket
- **运行模式**: 双模式支持 (MCP stdio 模式 + HTTP 服务器模式)

### 核心组件

#### 1. 统一入口点 (index.js)
- **作用**: MCP协议服务器 + Express API + WebSocket 统一入口
- **关键导入**:
  - `@modelcontextprotocol/sdk/server/index.js` - MCP服务器核心
  - `express` - HTTP服务器框架
  - `ws` - WebSocket支持
- **运行模式**:
  - stdio模式: `node index.js`
  - HTTP服务器模式: `MCP_PORT=3000 node index.js`

#### 2. 路由系统 (server/routes/)
- **主路由**: 简化架构，核心系统路由
  - `/` - 健康检查
  - `/mcp` - MCP协议端点
  - `/init` - Claude Code Init服务
  - `/services/*` - 服务状态查询

#### 3. Init 模式路由 (server/routes/init/)
完整的初始化流程管理：
- `/contracts` - 集成契约生成
- `/documents` - 架构文档生成
- `/files` - 文件内容分析
- `/language` - 语言检测

#### 4. 系统路由 (server/routes/system/)
核心系统功能：
- `health.js` - 健康检查和监控
- `mcp.js` - MCP协议处理
- `prompts.js` - 提示词管理

## 技术栈

### 主要语言
- **JavaScript/Node.js**: 服务器端开发语言

### 核心框架
- **Express.js**: Web服务器框架
- **WebSocket**: 实时通信
- **MCP SDK**: Model Context Protocol 支持

### 配置系统
- `config/mcp.config.json` - MCP服务器配置
- `config/modes.config.json` - 工作模式配置
- `config/templates.config.json` - 模板系统配置

## 文件结构

### 入口文件
- `index.js` (12,583 bytes) - 统一入口点

### 路由模块
- `server/routes/index.js` (4,398 bytes) - 主路由配置
- `server/routes/init/index.js` (2,315 bytes) - Init模块路由聚合
- `server/routes/system/index.js` (753 bytes) - 系统模块路由聚合

### 核心路由实现
- `server/routes/init/contracts.js` (28,019 bytes) - 集成契约生成
- `server/routes/init/documents.js` (22,130 bytes) - 文档生成
- `server/routes/init/files.js` (18,571 bytes) - 文件分析
- `server/routes/init/language.js` (19,569 bytes) - 语言检测

### 配置文件
- `jest.config.js` (1,114 bytes) - 测试配置
- `config/*.json` - 各类系统配置

## 关键路径分析

### 主要服务端点
1. **根路径** (`/`) - 健康检查和基础API
2. **MCP协议** (`/mcp`) - MCP客户端通信
3. **Init流程** (`/init`) - Claude Code初始化流程
4. **服务管理** (`/services/*`) - 服务状态和信息

### Init 流程关键端点
- `/generate-contracts` - 集成契约生成
- `/generate-architecture` - 架构文档生成  
- `/scan-files` - 文件内容分析
- `/detect-language` - 语言检测

## 质量评估

### 项目规模
- **总文件数**: 15个核心文件
- **代码行数**: 约130,000字符
- **复杂度**: 中等复杂度

### 架构优势
- ✅ 统一入口点设计
- ✅ 模块化路由架构
- ✅ 双协议支持 (MCP + HTTP)
- ✅ 完整的配置管理
- ✅ 标准化错误处理

## 建议和优化

### 架构建议
1. **服务依赖注入**: 已实现统一服务管理
2. **错误处理**: 标准化响应格式
3. **配置驱动**: 基于JSON配置的灵活设计

### 扩展性
- 支持新工作模式快速接入
- 模块化设计便于功能扩展
- MCP协议保证与Claude Code的良好集成

---
*此文档由 Claude Code Init 流程自动生成*  
*生成时间: 2025-09-09*  
*基于项目结构分析和语言检测结果*