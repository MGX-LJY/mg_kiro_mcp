# 模块目录 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}

## 模块概览

本文档维护项目中所有模块的完整目录，包括模块描述、职责、依赖关系和接口定义。

### 模块统计
- **总模块数**: {{total_modules}}
- **核心模块**: {{core_modules_count}}
- **业务模块**: {{business_modules_count}}
- **工具模块**: {{utility_modules_count}}

## 核心模块

### 1. 认证授权模块 (Authentication & Authorization)
**模块ID**: `auth`  
**版本**: {{auth_version}}  
**状态**: {{auth_status}}

#### 职责描述
{{auth_description}}

#### 主要功能
- 用户登录/登出
- Token管理
- 权限验证
- 角色管理
- 会话管理

#### 对外接口
| 接口名称 | 方法 | 路径 | 说明 |
|---------|------|------|------|
| 用户登录 | POST | /api/auth/login | 用户身份验证 |
| 用户登出 | POST | /api/auth/logout | 结束用户会话 |
| Token刷新 | POST | /api/auth/refresh | 刷新访问令牌 |
| 权限验证 | GET | /api/auth/verify | 验证用户权限 |

#### 依赖关系
- 数据库模块 (database)
- 缓存模块 (cache)
- 加密模块 (crypto)

---

### 2. 数据访问模块 (Data Access Layer)
**模块ID**: `dal`  
**版本**: {{dal_version}}  
**状态**: {{dal_status}}

#### 职责描述
{{dal_description}}

#### 主要功能
- 数据库连接管理
- ORM/ODM封装
- 事务管理
- 数据缓存
- 查询优化

#### 依赖关系
- 数据库驱动
- 缓存服务
- 配置模块

---

## 业务模块

### 3. 用户管理模块 (User Management)
**模块ID**: `user`  
**版本**: {{user_version}}  
**状态**: {{user_status}}

#### 功能清单
- [x] 用户注册
- [x] 用户信息管理
- [x] 用户列表查询
- [ ] 用户画像分析
- [ ] 用户行为追踪

---

### 4. 通知服务模块 (Notification Service)
**模块ID**: `notification`  
**版本**: {{notification_version}}  
**状态**: {{notification_status}}

#### 支持渠道
- 邮件通知
- 短信通知
- 推送通知
- 站内消息

---

## 工具模块

### 5. 日志模块 (Logging)
**模块ID**: `logger`  
**版本**: {{logger_version}}  
**状态**: {{logger_status}}

#### 日志级别
- `ERROR`: 错误日志
- `WARN`: 警告日志
- `INFO`: 信息日志
- `DEBUG`: 调试日志
- `TRACE`: 跟踪日志

---

### 6. 配置管理模块 (Configuration)
**模块ID**: `config`  
**版本**: {{config_version}}  
**状态**: {{config_status}}

#### 配置来源
1. 环境变量
2. 配置文件
3. 命令行参数
4. 远程配置中心

---

## 模块健康度

### 健康指标
| 模块 | 代码覆盖率 | 文档完整度 | 技术债务 | 健康评分 |
|------|------------|------------|----------|----------|
| {{module1}} | {{coverage1}}% | {{doc1}}% | {{debt1}}h | {{health1}}/100 |
| {{module2}} | {{coverage2}}% | {{doc2}}% | {{debt2}}h | {{health2}}/100 |
| {{module3}} | {{coverage3}}% | {{doc3}}% | {{debt3}}h | {{health3}}/100 |

## 模块开发计划

### 进行中
- [ ] {{ongoing_module1}} - {{ongoing_desc1}}
- [ ] {{ongoing_module2}} - {{ongoing_desc2}}

### 计划中
- [ ] {{planned_module1}} - {{planned_desc1}}
- [ ] {{planned_module2}} - {{planned_desc2}}

### 已完成
- [x] {{completed_module1}} - {{completed_desc1}}
- [x] {{completed_module2}} - {{completed_desc2}}

## 相关文档

- [系统架构](./system-architecture.md)
- [模块模板](./module-template.md)
- [集成契约](./integration-contracts.md)
- [依赖管理](./dependencies.md)

---

*本文档由 mg_kiro MCP 系统自动生成和维护*