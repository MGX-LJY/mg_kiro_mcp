# index.js 技术分析文档

## 文件概览
- **文件**: index.js
- **语言**: JavaScript/Node.js  
- **文件大小**: 140KB
- **角色**: 项目主入口文件，统一启动点

## 核心功能

### 1. 统一入口架构
- **双模式支持**: MCP服务器模式 + Express HTTP服务器模式
- **启动方式**:
  - MCP模式: `node index.js` (stdio传输)
  - Web模式: `MCP_PORT=3000 node index.js` (HTTP端口)

### 2. 服务容器系统
**服务依赖注入架构**:
- 统一服务容器 `getServiceContainer(serviceBus)`
- 服务总线管理所有业务服务
- 核心服务组件:
  ```js
  // 模板系统
  masterTemplateService, templateConfigManager
  
  // 语言智能
  languageDetector, languageIntelligence
  
  // 业务服务  
  projectOverviewGenerator
  
  // 文件分析模块
  fileAnalysisModule, unifiedTaskManager
  ```

### 3. MCP协议集成
- **SDK使用**: @modelcontextprotocol/sdk
- **传输方式**: StdioServerTransport 
- **架构模式**: 工具调用模式 (CallTool)

### 4. Express Web服务器
**Web服务特性**:
- CORS支持，50MB JSON限制
- 路由系统: `createAppRoutes(serviceContainer)`
- WebSocket支持: 实时通信
- API端点结构:
  ```
  GET  /health - 健康检查
  POST /init/project-overview - 项目概览
  POST /init/progressive-documentation - 文档生成
  GET  /init/status - 状态查询
  ```

### 5. 服务初始化流程
1. **服务系统初始化**: `initializeServices(CONFIG_DIR)`
2. **服务容器创建**: 包装serviceBus为统一接口
3. **Express应用配置**: 中间件 + 路由 + WebSocket
4. **HTTP服务器启动**: 监听指定端口

## 架构设计模式

### 1. 服务化架构
- **服务总线模式**: 中央服务注册和依赖管理
- **依赖注入**: 通过serviceBus获取服务实例
- **服务封装**: getServiceContainer包装器统一接口

### 2. 多协议支持
- **MCP协议**: 用于Claude Code集成
- **HTTP REST**: 用于Web API访问  
- **WebSocket**: 用于实时通信

### 3. 配置驱动
- **配置目录**: `CONFIG_DIR = join(__dirname, 'config')`
- **服务配置**: 通过配置文件初始化所有服务
- **环境变量**: `MCP_PORT`控制启动模式

## 技术特点

### 1. ES6模块化
- 完全使用ES6 import/export
- 现代JavaScript语法
- 模块化架构设计

### 2. 异步架构
- `async/await` 异步处理
- Promise-based服务初始化
- 错误处理机制: `catch(console.error)`

### 3. 开发友好
- 详细的控制台日志
- 请求追踪中间件
- 清晰的API文档输出

## 关键依赖
- **MCP SDK**: @modelcontextprotocol/sdk
- **Web框架**: express + cors
- **WebSocket**: ws
- **Node.js内置**: fs, path, http

## 启动输出示例
```
✅ mg_kiro Express服务器已启动
📡 HTTP服务: http://localhost:3000
🔌 WebSocket服务: ws://localhost:3000
📚 API文档: http://localhost:3000/api-docs
```

## 设计优势
1. **统一入口**: 单一启动文件支持多种运行模式
2. **服务化**: 模块化服务架构便于扩展和测试
3. **协议无关**: 支持多种通信协议
4. **配置驱动**: 灵活的配置系统
5. **开发友好**: 清晰的日志和错误处理