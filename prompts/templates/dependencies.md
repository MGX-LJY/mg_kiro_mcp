# 依赖管理文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}

## 概述

本文档记录项目的所有依赖关系，包括外部库、框架、服务和工具。确保依赖的可追踪性、安全性和版本控制。

### 依赖管理原则
1. **最小化原则**: 只引入必要的依赖
2. **版本锁定**: 使用精确版本避免意外升级
3. **安全优先**: 定期检查和更新有漏洞的依赖
4. **许可合规**: 确保所有依赖符合项目许可要求

## 运行时依赖

### 核心框架
| 包名 | 版本 | 用途 | 许可证 | 状态 |
|------|------|------|--------|------|
| {{framework1}} | {{version1}} | {{purpose1}} | {{license1}} | {{status1}} |
| {{framework2}} | {{version2}} | {{purpose2}} | {{license2}} | {{status2}} |
| {{framework3}} | {{version3}} | {{purpose3}} | {{license3}} | {{status3}} |

### 生产依赖

#### Web框架
```json
{
  "{{web_framework}}": "{{web_version}}",
  "{{web_middleware1}}": "{{middleware1_version}}",
  "{{web_middleware2}}": "{{middleware2_version}}"
}
```

#### 数据库驱动
```yaml
databases:
  - name: {{db_driver1}}
    version: {{db_version1}}
    compatibility: {{db_compat1}}
    connection_pool: {{pool_size1}}
  
  - name: {{db_driver2}}
    version: {{db_version2}}
    compatibility: {{db_compat2}}
    connection_pool: {{pool_size2}}
```

#### 工具库
| 类别 | 包名 | 版本 | 说明 |
|------|------|------|------|
| 日期处理 | {{date_lib}} | {{date_version}} | {{date_desc}} |
| 加密 | {{crypto_lib}} | {{crypto_version}} | {{crypto_desc}} |
| 验证 | {{validation_lib}} | {{validation_version}} | {{validation_desc}} |
| 日志 | {{logging_lib}} | {{logging_version}} | {{logging_desc}} |
| HTTP客户端 | {{http_lib}} | {{http_version}} | {{http_desc}} |

## 开发依赖

### 构建工具
```toml
[build-dependencies]
{{build_tool1}} = "{{build_version1}}"
{{build_tool2}} = "{{build_version2}}"
{{build_tool3}} = "{{build_version3}}"
```

### 测试框架
| 框架 | 版本 | 类型 | 配置文件 |
|------|------|------|----------|
| {{test_framework1}} | {{test_version1}} | 单元测试 | {{test_config1}} |
| {{test_framework2}} | {{test_version2}} | 集成测试 | {{test_config2}} |
| {{test_framework3}} | {{test_version3}} | E2E测试 | {{test_config3}} |

### 代码质量工具
```yaml
linters:
  - name: {{linter1}}
    version: {{linter1_version}}
    config: {{linter1_config}}
    rules: {{linter1_rules}}
  
  - name: {{linter2}}
    version: {{linter2_version}}
    config: {{linter2_config}}
    rules: {{linter2_rules}}

formatters:
  - name: {{formatter1}}
    version: {{formatter1_version}}
    config: {{formatter1_config}}
```

## 外部服务依赖

### 第三方API
| 服务名 | 版本 | 用途 | SLA | 备用方案 |
|--------|------|------|-----|----------|
| {{api_service1}} | {{api_version1}} | {{api_purpose1}} | {{api_sla1}} | {{api_fallback1}} |
| {{api_service2}} | {{api_version2}} | {{api_purpose2}} | {{api_sla2}} | {{api_fallback2}} |
| {{api_service3}} | {{api_version3}} | {{api_purpose3}} | {{api_sla3}} | {{api_fallback3}} |

### 云服务
```yaml
cloud_services:
  compute:
    provider: {{compute_provider}}
    service: {{compute_service}}
    region: {{compute_region}}
    tier: {{compute_tier}}
  
  storage:
    provider: {{storage_provider}}
    service: {{storage_service}}
    region: {{storage_region}}
    redundancy: {{storage_redundancy}}
  
  database:
    provider: {{db_provider}}
    service: {{db_service}}
    version: {{db_version}}
    backup: {{db_backup}}
```

### 监控服务
| 类型 | 服务 | 集成方式 | 数据保留 |
|------|------|---------|---------|
| APM | {{apm_service}} | {{apm_integration}} | {{apm_retention}} |
| 日志 | {{log_service}} | {{log_integration}} | {{log_retention}} |
| 指标 | {{metric_service}} | {{metric_integration}} | {{metric_retention}} |
| 告警 | {{alert_service}} | {{alert_integration}} | {{alert_retention}} |

## 版本管理

### 版本策略
| 策略 | 说明 | 示例 |
|------|------|------|
| 固定版本 | 锁定特定版本 | `1.2.3` |
| 补丁范围 | 允许补丁更新 | `~1.2.3` |
| 次版本范围 | 允许次版本更新 | `^1.2.3` |
| 主版本范围 | 允许主版本更新 | `*` 或 `latest` |

### 升级计划
| 依赖 | 当前版本 | 目标版本 | 升级原因 | 计划时间 |
|------|---------|---------|---------|---------|
| {{dep1}} | {{current1}} | {{target1}} | {{reason1}} | {{date1}} |
| {{dep2}} | {{current2}} | {{target2}} | {{reason2}} | {{date2}} |
| {{dep3}} | {{current3}} | {{target3}} | {{reason3}} | {{date3}} |

## 安全管理

### 漏洞扫描
```bash
# 运行安全审计
{{security_audit_command}}

# 检查过时的依赖
{{outdated_check_command}}

# 更新有漏洞的依赖
{{security_update_command}}
```

### 已知漏洞
| 依赖 | 漏洞ID | 严重程度 | 状态 | 修复版本 |
|------|--------|---------|------|----------|
| {{vuln_dep1}} | {{cve1}} | {{severity1}} | {{status1}} | {{fix1}} |
| {{vuln_dep2}} | {{cve2}} | {{severity2}} | {{status2}} | {{fix2}} |

### 安全策略
1. **定期审计**: 每{{audit_frequency}}进行一次安全审计
2. **自动更新**: 启用{{auto_update_level}}级别的自动更新
3. **漏洞响应**: {{vulnerability_response_time}}内响应高危漏洞
4. **依赖审查**: 新依赖需要{{review_process}}

## 许可证合规

### 许可证类型统计
| 许可证类型 | 数量 | 依赖列表 | 兼容性 |
|-----------|------|---------|---------|
| MIT | {{mit_count}} | {{mit_deps}} | ✅ |
| Apache-2.0 | {{apache_count}} | {{apache_deps}} | ✅ |
| BSD | {{bsd_count}} | {{bsd_deps}} | ✅ |
| GPL | {{gpl_count}} | {{gpl_deps}} | ⚠️ |
| 专有 | {{proprietary_count}} | {{proprietary_deps}} | ❌ |

### 许可证冲突
| 依赖A | 许可证A | 依赖B | 许可证B | 冲突说明 |
|-------|---------|-------|---------|---------|
| {{dep_a}} | {{license_a}} | {{dep_b}} | {{license_b}} | {{conflict_desc}} |

## 安装配置

### 包管理器配置

#### NPM/Yarn (Node.js)
```json
{
  "name": "{{project_name}}",
  "version": "{{project_version}}",
  "dependencies": {
    "{{npm_dep1}}": "{{npm_version1}}",
    "{{npm_dep2}}": "{{npm_version2}}"
  },
  "devDependencies": {
    "{{npm_dev1}}": "{{npm_dev_version1}}",
    "{{npm_dev2}}": "{{npm_dev_version2}}"
  },
  "engines": {
    "node": "{{node_version}}",
    "npm": "{{npm_version}}"
  }
}
```

#### pip (Python)
```txt
# requirements.txt
{{py_dep1}}=={{py_version1}}
{{py_dep2}}=={{py_version2}}
{{py_dep3}}>={{py_version3}},<{{py_version4}}
```

#### Maven (Java)
```xml
<dependencies>
  <dependency>
    <groupId>{{group_id1}}</groupId>
    <artifactId>{{artifact_id1}}</artifactId>
    <version>{{maven_version1}}</version>
  </dependency>
</dependencies>
```

### 私有仓库配置
```yaml
registries:
  npm:
    url: {{npm_registry_url}}
    auth: {{npm_auth_token}}
  
  docker:
    url: {{docker_registry_url}}
    auth: {{docker_auth}}
  
  maven:
    url: {{maven_repository_url}}
    auth: {{maven_credentials}}
```

## 依赖指标

### 健康度评分
| 指标 | 权重 | 当前值 | 目标值 | 得分 |
|------|------|--------|--------|------|
| 依赖新鲜度 | 30% | {{freshness}}% | 90% | {{freshness_score}} |
| 安全性 | 30% | {{security}}% | 100% | {{security_score}} |
| 许可证合规 | 20% | {{compliance}}% | 100% | {{compliance_score}} |
| 依赖数量 | 10% | {{dep_count}} | <{{target_count}} | {{count_score}} |
| 更新频率 | 10% | {{update_freq}} | {{target_freq}} | {{freq_score}} |

**总体健康度**: {{overall_health}}/100

### 优化建议
1. **减少依赖**: {{reduction_suggestion}}
2. **更新策略**: {{update_strategy}}
3. **替代方案**: {{alternative_suggestions}}
4. **性能优化**: {{performance_tips}}

## 更新记录

### 最近更新
| 日期 | 依赖 | 操作 | 版本变化 | 原因 |
|------|------|------|---------|------|
| {{date1}} | {{dep1}} | {{action1}} | {{version_change1}} | {{reason1}} |
| {{date2}} | {{dep2}} | {{action2}} | {{version_change2}} | {{reason2}} |
| {{date3}} | {{dep3}} | {{action3}} | {{version_change3}} | {{reason3}} |

### 计划更新
- [ ] {{planned_update1}}
- [ ] {{planned_update2}}
- [ ] {{planned_update3}}

## 相关文档

- [系统架构](./system-architecture.md)
- [模块目录](./modules-catalog.md)
- [集成契约](./integration-contracts.md)
- [部署指南](./deployment-guide.md)

## 注意事项

### 依赖引入检查清单
- [ ] 是否真的需要这个依赖？
- [ ] 是否有更轻量的替代方案？
- [ ] 许可证是否兼容？
- [ ] 是否有已知的安全漏洞？
- [ ] 社区是否活跃？
- [ ] 文档是否完善？
- [ ] 是否有良好的测试覆盖？
- [ ] 依赖的依赖是否可控？

### 依赖移除流程
1. 确认没有代码使用该依赖
2. 运行测试确保功能正常
3. 从配置文件中移除
4. 更新lock文件
5. 更新文档
6. 通知团队成员

---

*本文档由 mg_kiro MCP 系统自动生成和维护*