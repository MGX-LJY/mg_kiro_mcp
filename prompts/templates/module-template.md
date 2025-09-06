# 模块文档 - {{module_name}}

> 模块版本: {{module_version}}  
> 更新日期: {{timestamp}}  
> 负责人: {{module_owner}}  
> 状态: {{module_status}}

## 模块概述

### 基本信息
- **模块ID**: `{{module_id}}`
- **模块类型**: {{module_type}}
- **优先级**: {{module_priority}}
- **所属域**: {{module_domain}}

### 模块描述
{{module_description}}

### 核心价值
{{module_value_proposition}}

## 功能定义

### 主要功能
| 功能名称 | 描述 | 状态 | 优先级 |
|---------|------|------|--------|
| {{feature1_name}} | {{feature1_desc}} | {{feature1_status}} | {{feature1_priority}} |
| {{feature2_name}} | {{feature2_desc}} | {{feature2_status}} | {{feature2_priority}} |
| {{feature3_name}} | {{feature3_desc}} | {{feature3_status}} | {{feature3_priority}} |

### 功能详情

#### 1. {{feature_detail_1}}
**描述**: {{feature1_detailed_desc}}

**输入参数**:
```json
{
  "{{param1}}": "{{param1_type}}",
  "{{param2}}": "{{param2_type}}",
  "{{param3}}": "{{param3_type}}"
}
```

**输出结果**:
```json
{
  "{{result1}}": "{{result1_type}}",
  "{{result2}}": "{{result2_type}}",
  "status": "{{status_type}}"
}
```

**业务规则**:
1. {{rule1}}
2. {{rule2}}
3. {{rule3}}

## 接口定义

### REST API

#### {{api_endpoint_1}}
- **路径**: `{{api_path_1}}`
- **方法**: `{{api_method_1}}`
- **认证**: {{api_auth_1}}
- **权限**: {{api_permission_1}}

**请求示例**:
```http
{{api_method_1}} {{api_path_1}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "{{request_field1}}": "{{value1}}",
  "{{request_field2}}": "{{value2}}"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "{{response_field1}}": "{{value1}}",
    "{{response_field2}}": "{{value2}}"
  }
}
```

## 数据模型

### 核心实体

#### {{entity_name}}
```sql
CREATE TABLE {{table_name}} (
    id {{id_type}} PRIMARY KEY,
    {{field1}} {{field1_type}} {{field1_constraint}},
    {{field2}} {{field2_type}} {{field2_constraint}},
    {{field3}} {{field3_type}} {{field3_constraint}},
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 依赖关系

### 上游依赖
| 模块名称 | 依赖类型 | 版本要求 | 说明 |
|---------|---------|---------|------|
| {{upstream1}} | {{dep_type1}} | {{version1}} | {{dep_desc1}} |
| {{upstream2}} | {{dep_type2}} | {{version2}} | {{dep_desc2}} |

### 下游影响
| 模块名称 | 影响范围 | 影响级别 | 说明 |
|---------|---------|---------|------|
| {{downstream1}} | {{impact_scope1}} | {{impact_level1}} | {{impact_desc1}} |
| {{downstream2}} | {{impact_scope2}} | {{impact_level2}} | {{impact_desc2}} |

## 配置项

### 环境配置
```yaml
{{module_id}}:
  # 基础配置
  enabled: {{enabled}}
  version: {{version}}
  
  # 性能配置
  performance:
    max_connections: {{max_connections}}
    timeout: {{timeout}}
    retry_count: {{retry_count}}
  
  # 功能开关
  features:
    {{feature1}}: {{feature1_enabled}}
    {{feature2}}: {{feature2_enabled}}
```

## 错误处理

### 错误码定义
| 错误码 | 错误类型 | 错误描述 | 处理建议 |
|--------|---------|---------|---------|
| {{error_code1}} | {{error_type1}} | {{error_desc1}} | {{error_solution1}} |
| {{error_code2}} | {{error_type2}} | {{error_desc2}} | {{error_solution2}} |
| {{error_code3}} | {{error_type3}} | {{error_desc3}} | {{error_solution3}} |

### 异常处理策略
1. **重试机制**: {{retry_strategy}}
2. **降级方案**: {{fallback_strategy}}
3. **熔断策略**: {{circuit_breaker_strategy}}

## 性能指标

### SLA要求
| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 响应时间 (P99) | < {{target_latency}} | {{current_latency}} | {{latency_status}} |
| 可用性 | > {{target_availability}} | {{current_availability}} | {{availability_status}} |
| 吞吐量 | > {{target_throughput}} | {{current_throughput}} | {{throughput_status}} |

### 性能优化
- **缓存策略**: {{cache_strategy}}
- **并发控制**: {{concurrency_control}}
- **资源池化**: {{resource_pooling}}

## 安全要求

### 安全措施
1. **认证方式**: {{authentication_method}}
2. **授权机制**: {{authorization_mechanism}}
3. **数据加密**: {{encryption_method}}
4. **审计日志**: {{audit_logging}}

### 安全检查清单
- [ ] 输入验证
- [ ] SQL注入防护
- [ ] XSS防护
- [ ] CSRF防护
- [ ] 敏感数据加密
- [ ] 访问控制
- [ ] 日志脱敏

## 测试要求

### 测试覆盖
- **单元测试覆盖率**: {{unit_test_coverage}}%
- **集成测试覆盖率**: {{integration_test_coverage}}%
- **端到端测试**: {{e2e_test_count}} 个场景

### 测试用例
| 用例ID | 场景描述 | 预期结果 | 优先级 |
|--------|---------|---------|--------|
| {{test_case1}} | {{test_scenario1}} | {{expected_result1}} | {{test_priority1}} |
| {{test_case2}} | {{test_scenario2}} | {{expected_result2}} | {{test_priority2}} |

## 部署说明

### 部署要求
- **运行环境**: {{runtime_environment}}
- **资源需求**: {{resource_requirements}}
- **依赖服务**: {{dependent_services}}

### 部署步骤
1. {{deploy_step1}}
2. {{deploy_step2}}
3. {{deploy_step3}}

### 健康检查
```http
GET /health/{{module_id}}

Response:
{
  "status": "healthy",
  "version": "{{module_version}}",
  "uptime": {{uptime}},
  "checks": {
    "database": "ok",
    "cache": "ok",
    "dependencies": "ok"
  }
}
```

## 相关文档

### 内部文档
- [模块目录](./modules-catalog.md)
- [系统架构](./system-architecture.md)
- [集成契约](./integration-contracts.md)

### 外部资源
- {{external_doc1}}
- {{external_doc2}}
- {{external_doc3}}

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|---------|--------|
| {{version1}} | {{date1}} | {{change1}} | {{author1}} |
| {{version2}} | {{date2}} | {{change2}} | {{author2}} |

## 待办事项

### 高优先级
- [ ] {{todo_high_1}}
- [ ] {{todo_high_2}}

### 中优先级
- [ ] {{todo_medium_1}}
- [ ] {{todo_medium_2}}

### 低优先级
- [ ] {{todo_low_1}}
- [ ] {{todo_low_2}}

---

*本文档由 mg_kiro MCP 系统自动生成和维护*