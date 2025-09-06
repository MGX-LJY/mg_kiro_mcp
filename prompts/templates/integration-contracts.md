# 集成契约文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}

## 概述

本文档定义了系统内外部集成的所有接口契约、数据格式、通信协议和服务级别协议(SLA)。

### 契约管理原则
1. **版本控制**: 所有接口必须有明确的版本管理
2. **向后兼容**: 新版本应保持向后兼容
3. **契约优先**: 先定义契约，后实现功能
4. **文档同步**: 契约变更必须同步更新文档

## 外部API契约

### 1. RESTful API规范

#### 基础规范
- **基础URL**: `{{base_url}}`
- **API版本**: `/api/v{{api_version}}`
- **认证方式**: {{auth_method}}
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

#### HTTP方法约定
| 方法 | 用途 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 获取资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 完整更新 | 是 | 否 |
| PATCH | 部分更新 | 否 | 否 |
| DELETE | 删除资源 | 是 | 否 |

#### 状态码规范
```yaml
2xx - 成功:
  200: OK - 请求成功
  201: Created - 资源创建成功
  204: No Content - 请求成功但无返回内容

4xx - 客户端错误:
  400: Bad Request - 请求参数错误
  401: Unauthorized - 未认证
  403: Forbidden - 无权限
  404: Not Found - 资源不存在
  409: Conflict - 资源冲突
  422: Unprocessable Entity - 验证失败

5xx - 服务器错误:
  500: Internal Server Error - 服务器内部错误
  502: Bad Gateway - 网关错误
  503: Service Unavailable - 服务不可用
```

### 2. 核心API接口

#### 用户服务接口

##### 创建用户
```yaml
endpoint: POST /api/v1/users
request:
  headers:
    Content-Type: application/json
    Authorization: Bearer {{token}}
  body:
    type: object
    required: [username, email, password]
    properties:
      username:
        type: string
        pattern: "^[a-zA-Z0-9_]{3,30}$"
      email:
        type: string
        format: email
      password:
        type: string
        minLength: 8

response:
  success:
    status: 201
    body:
      code: 0
      message: "User created successfully"
      data:
        id: string
        username: string
        email: string
        createdAt: datetime
```

##### 查询用户
```yaml
endpoint: GET /api/v1/users/{userId}
request:
  headers:
    Authorization: Bearer {{token}}
  parameters:
    userId:
      type: string
      required: true
      description: 用户ID

response:
  success:
    status: 200
    body:
      code: 0
      data:
        id: string
        username: string
        email: string
        status: enum[active, inactive, suspended]
        createdAt: datetime
        updatedAt: datetime
```

### 3. WebSocket契约

#### 连接协议
```javascript
// WebSocket连接地址
ws://{{ws_host}}/ws/v1/{{channel}}

// 认证消息
{
  "type": "auth",
  "token": "{{jwt_token}}",
  "timestamp": {{unix_timestamp}}
}

// 心跳消息
{
  "type": "ping",
  "timestamp": {{unix_timestamp}}
}

// 订阅消息
{
  "type": "subscribe",
  "channels": ["channel1", "channel2"],
  "filters": {
    "{{filter_key}}": "{{filter_value}}"
  }
}
```

## 内部服务契约

### 1. 微服务通信

#### 服务注册与发现
```yaml
service_registry:
  name: {{service_name}}
  version: {{service_version}}
  endpoints:
    - protocol: http
      host: {{service_host}}
      port: {{service_port}}
      path: {{service_path}}
  health_check:
    endpoint: /health
    interval: 30s
    timeout: 5s
  metadata:
    region: {{region}}
    environment: {{environment}}
```

### 2. 消息队列契约

#### 消息格式
```json
{
  "messageId": "{{uuid}}",
  "correlationId": "{{correlation_id}}",
  "timestamp": "{{iso8601_timestamp}}",
  "source": "{{service_name}}",
  "eventType": "{{event_type}}",
  "version": "{{event_version}}",
  "data": {
    "{{field1}}": "{{value1}}",
    "{{field2}}": "{{value2}}"
  },
  "metadata": {
    "userId": "{{user_id}}",
    "tenantId": "{{tenant_id}}",
    "traceId": "{{trace_id}}"
  }
}
```

#### 主题定义
| 主题名称 | 消息类型 | 生产者 | 消费者 | SLA |
|---------|---------|--------|--------|-----|
| {{topic1}} | {{message_type1}} | {{producer1}} | {{consumer1}} | {{sla1}} |
| {{topic2}} | {{message_type2}} | {{producer2}} | {{consumer2}} | {{sla2}} |

## 数据契约

### 1. 数据交换格式

#### 通用响应格式
```typescript
interface ApiResponse<T> {
  code: number;          // 业务状态码
  message: string;       // 描述信息
  data?: T;             // 响应数据
  timestamp: number;     // 响应时间戳
  requestId: string;     // 请求追踪ID
  pagination?: {        // 分页信息
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

#### 错误响应格式
```typescript
interface ErrorResponse {
  code: number;          // 错误码
  message: string;       // 错误信息
  details?: {           // 详细错误
    field?: string;     // 错误字段
    reason?: string;    // 错误原因
    suggestion?: string; // 修复建议
  }[];
  timestamp: number;
  requestId: string;
}
```

### 2. 数据验证规则

#### 字段验证
```yaml
validation_rules:
  # 字符串类型
  string_fields:
    - minLength: {{min_length}}
    - maxLength: {{max_length}}
    - pattern: {{regex_pattern}}
    - enum: [{{allowed_values}}]
  
  # 数值类型
  number_fields:
    - minimum: {{min_value}}
    - maximum: {{max_value}}
    - multipleOf: {{step}}
  
  # 日期类型
  date_fields:
    - format: ISO8601
    - timezone: UTC
    - range: [{{start_date}}, {{end_date}}]
```

## 安全契约

### 1. 认证授权

#### JWT Token格式
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "{{key_id}}"
  },
  "payload": {
    "sub": "{{user_id}}",
    "iat": {{issued_at}},
    "exp": {{expires_at}},
    "aud": "{{audience}}",
    "iss": "{{issuer}}",
    "roles": ["{{role1}}", "{{role2}}"],
    "permissions": ["{{permission1}}", "{{permission2}}"]
  }
}
```

### 2. 数据加密

#### 加密算法
| 场景 | 算法 | 密钥长度 | 用途 |
|------|------|---------|------|
| 传输加密 | TLS 1.3 | 256-bit | HTTPS通信 |
| 数据加密 | AES-256-GCM | 256-bit | 敏感数据存储 |
| 签名算法 | RSA-SHA256 | 2048-bit | 数据签名 |
| 哈希算法 | SHA-256 | - | 数据完整性 |

## SLA定义

### 1. 性能指标

| 接口类别 | 响应时间(P99) | 可用性 | 并发数 | QPS限制 |
|---------|--------------|--------|--------|---------|
| 查询接口 | < 100ms | 99.9% | 1000 | 10000 |
| 写入接口 | < 200ms | 99.9% | 500 | 5000 |
| 批量接口 | < 1000ms | 99.5% | 100 | 100 |
| 文件上传 | < 5000ms | 99.0% | 50 | 50 |

### 2. 限流策略

```yaml
rate_limiting:
  global:
    requests_per_second: {{global_rps}}
    burst_size: {{global_burst}}
  
  per_user:
    requests_per_minute: {{user_rpm}}
    requests_per_day: {{user_rpd}}
  
  per_api:
    {{api_path1}}: {{api1_limit}}
    {{api_path2}}: {{api2_limit}}
```

## 版本管理

### 1. API版本策略

#### 版本命名
- **格式**: `v{major}.{minor}`
- **示例**: `v1.0`, `v2.1`

### 2. 兼容性矩阵

| 客户端版本 | 服务端v1.0 | 服务端v1.1 | 服务端v2.0 |
|-----------|------------|------------|------------|
| v1.0 | ✅ | ✅ | ⚠️ |
| v1.1 | ✅ | ✅ | ⚠️ |
| v2.0 | ❌ | ⚠️ | ✅ |

## 契约测试

### 1. 契约验证

```yaml
contract_tests:
  - name: {{test_name}}
    type: {{test_type}}
    endpoint: {{endpoint}}
    scenarios:
      - name: {{scenario_name}}
        given: {{precondition}}
        when: {{action}}
        then: {{expected_result}}
```

### 2. Mock服务

```javascript
// Mock服务定义
const mockService = {
  endpoint: "{{mock_endpoint}}",
  method: "{{http_method}}",
  request: {
    headers: {{request_headers}},
    body: {{request_body}}
  },
  response: {
    status: {{response_status}},
    headers: {{response_headers}},
    body: {{response_body}},
    delay: {{response_delay}}
  }
};
```

## 集成指南

### 1. 快速开始

```bash
# 1. 获取API密钥
curl -X POST {{auth_url}}/api/keys \
  -H "Content-Type: application/json" \
  -d '{"appId": "{{app_id}}", "secret": "{{app_secret}}"}'

# 2. 测试连接
curl -X GET {{base_url}}/api/v1/health \
  -H "Authorization: Bearer {{api_key}}"

# 3. 第一个API调用
curl -X GET {{base_url}}/api/v1/{{resource}} \
  -H "Authorization: Bearer {{api_key}}"
```

### 2. SDK支持

| 语言 | 包名 | 版本 | 文档 |
|------|------|------|------|
| JavaScript | {{js_package}} | {{js_version}} | [链接]({{js_doc}}) |
| Python | {{py_package}} | {{py_version}} | [链接]({{py_doc}}) |
| Java | {{java_package}} | {{java_version}} | [链接]({{java_doc}}) |
| Go | {{go_package}} | {{go_version}} | [链接]({{go_doc}}) |

## 相关文档

- [系统架构](./system-architecture.md)
- [模块目录](./modules-catalog.md)
- [API文档]({{api_doc_url}})
- [开发者指南]({{developer_guide_url}})

---

*本文档由 mg_kiro MCP 系统自动生成和维护*