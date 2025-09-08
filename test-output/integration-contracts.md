# 集成契约文档

## 契约概览

本文档定义了 **mg_kiro_mcp** 各模块间的集成契约和API接口规范。

## API端点契约

### 系统级API
### 健康检查API
- **GET /health** - 系统健康状态检查
- **GET /status** - 详细系统状态信息  
- **POST /mcp/handshake** - MCP协议握手

### 响应格式
```json
{
  "success": true,
  "data": {},
  "timestamp": "2025-09-08T11:30:00.000Z"
}
```

### 模式管理API
### 模式切换API
- **POST /mode/switch** - 工作模式切换
- **GET /mode/current** - 获取当前模式
- **GET /mode/{mode}/status** - 获取模式状态

### Init模式API
- **POST /mode/init/scan-structure** - 项目结构扫描
- **POST /mode/init/detect-language** - 语言检测
- **POST /mode/init/generate-architecture** - 生成架构文档

### 模块管理API
### 模块管理API
- **GET /modules/list** - 获取模块列表
- **GET /modules/{id}/detail** - 获取模块详情  
- **POST /modules/analyze** - 分析模块结构
- **POST /modules/generate-docs** - 生成模块文档

## 数据契约

### 请求格式
标准请求格式:

```json
{
  "action": "string",
  "data": {},
  "options": {
    "timeout": 30000,
    "version": "v1"
  }
}
```

### 响应格式
标准响应格式:

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-09-08T11:30:00.000Z"
}
```

### 错误响应  
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2025-09-08T11:30:00.000Z"
}
```

### 错误处理契约
错误代码规范:

- **VALIDATION_ERROR** (400) - 请求参数验证失败
- **AUTHENTICATION_ERROR** (401) - 身份验证失败  
- **AUTHORIZATION_ERROR** (403) - 权限不足
- **NOT_FOUND_ERROR** (404) - 资源不存在
- **INTERNAL_SERVER_ERROR** (500) - 服务器内部错误
- **SERVICE_UNAVAILABLE** (503) - 服务暂时不可用

## 模块间通信契约

模块间通信规范:

### 服务依赖注入
所有服务模块通过构造函数注入依赖，避免循环依赖。

### 事件通信
使用EventEmitter进行模块间异步通信。

### 数据传递
统一使用JSON格式进行数据交换。

## WebSocket契约

WebSocket通信契约:

### 连接建立
- 端点: `ws://localhost:3000/ws`
- 协议: WebSocket

### 消息格式
```json
{
  "type": "message_type",
  "payload": {},
  "id": "message_id"
}
```

### 消息类型
- **progress** - 进度更新
- **notification** - 系统通知
- **error** - 错误信息

## 安全契约

安全规范:

### HTTPS强制
生产环境必须使用HTTPS协议。

### 请求限流
API请求限制为每分钟100次。

### 输入验证
所有用户输入必须经过严格验证。

### 数据加密
敏感数据传输使用AES-256加密。

## 版本兼容性

版本兼容性:

### API版本控制
- 当前版本: v1
- 支持版本: v1.x
- 废弃版本: 无

### 向后兼容
保证3个主要版本的向后兼容性。

### 升级策略
提供平滑升级路径和迁移指南。

## 性能契约

性能契约:

### 响应时间
- API响应时间 < 200ms (95%的请求)
- 文档生成时间 < 5s
- 大型项目扫描 < 30s

### 并发处理
- 支持100并发请求
- WebSocket连接数 < 1000

### 资源使用
- 内存使用 < 512MB
- CPU使用率 < 80%

## 测试契约

测试契约:

### 单元测试
- 测试覆盖率 > 80%
- 所有API端点必须有测试

### 集成测试  
- 端到端功能测试
- 性能基准测试

### 自动化测试
- CI/CD集成
- 回归测试自动运行

---
*契约文档生成时间: 2025-09-08T11:31:43.166Z*
*契约版本: v2.0.0*
*维护团队: mg_kiro Team*
