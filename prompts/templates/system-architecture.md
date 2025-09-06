# 系统架构 - {{project_name}}

## 项目简介
{{project_description}}

### 核心价值
- **主要目标**: {{main_objectives}}
- **目标用户**: {{target_users}}
- **关键特性**: {{key_features}}

## 技术栈
| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | {{frontend_stack}} | {{frontend_desc}} |
| 后端 | {{backend_stack}} | {{backend_desc}} |
| 数据库 | {{database_stack}} | {{database_desc}} |
| 缓存 | {{cache_stack}} | {{cache_desc}} |
| 部署 | {{deploy_stack}} | {{deploy_desc}} |

## 核心模块
| 模块名称 | 职责 | 依赖关系 | 接口数量 |
|---------|------|---------|---------|
| {{module1_name}} | {{module1_responsibility}} | {{module1_deps}} | {{module1_apis}} |
| {{module2_name}} | {{module2_responsibility}} | {{module2_deps}} | {{module2_apis}} |
| {{module3_name}} | {{module3_responsibility}} | {{module3_deps}} | {{module3_apis}} |

## 系统架构图

### 整体架构
```mermaid
graph TB
    User["用户端"] --> LB["负载均衡器"]
    LB --> App1["应用实例1<br/>{{framework_name}}"]
    LB --> App2["应用实例2<br/>{{framework_name}}"]
    
    App1 --> Cache["缓存层<br/>{{cache_name}}"]
    App2 --> Cache
    
    App1 --> DB["数据库<br/>{{database_name}}"]
    App2 --> DB
    
    App1 --> Queue["消息队列<br/>{{queue_name}}"]
    App2 --> Queue
    
    Queue --> Worker["后台任务<br/>{{worker_name}}"]
    
    subgraph "监控系统"
        Monitor["监控服务"]
        Logs["日志收集"]
        Metrics["指标采集"]
    end
    
    App1 -.-> Monitor
    App2 -.-> Monitor
    DB -.-> Metrics
    Cache -.-> Metrics
```

### 数据流向图
```mermaid
sequenceDiagram
    participant C as 客户端
    participant A as 应用服务
    participant D as 数据库
    participant R as 缓存
    participant Q as 消息队列
    
    C->>A: 1. 发送请求
    A->>R: 2. 查询缓存
    alt 缓存命中
        R-->>A: 3a. 返回缓存数据
    else 缓存未命中
        A->>D: 3b. 查询数据库
        D-->>A: 4. 返回数据
        A->>R: 5. 更新缓存
    end
    A->>Q: 6. 异步任务入队
    A-->>C: 7. 返回响应
    Q->>A: 8. 处理异步任务
```

## 安全架构
### 安全层级
1. **网络安全**: HTTPS/TLS 加密传输
2. **应用安全**: 身份认证 {{auth_method}}, 授权 {{authz_method}}
3. **数据安全**: 敏感数据加密存储

## 性能目标
| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 响应时间 | < {{target_response_time}} | {{current_response_time}} | {{status}} |
| 并发用户 | {{target_concurrent}} | {{current_concurrent}} | {{status}} |
| 可用性 | {{target_availability}} | {{current_availability}} | {{status}} |

## 监控告警
### 告警规则
| 级别 | 触发条件 | 通知方式 |
|------|---------|---------|
| P0-紧急 | {{p0_condition}} | {{p0_notification}} |
| P1-严重 | {{p1_condition}} | {{p1_notification}} |
| P2-警告 | {{p2_condition}} | {{p2_notification}} |