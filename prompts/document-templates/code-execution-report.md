# 代码执行报告 (Code Execution Report)

**报告类型**: Fix模式 - 第5步：代码更新执行  
**生成时间**: {{timestamp}}  
**问题ID**: {{issue_id}}  
**执行者**: {{executor}}

## 📋 执行概览

### 问题描述
{{issue_description}}

### 修复范围
{{fix_scope}}

### 执行状态
- **状态**: {{execution_status}}
- **开始时间**: {{start_time}}
- **结束时间**: {{end_time}}
- **总耗时**: {{duration}}

## 🔧 执行详情

### 执行前状态快照
```
分支状态: {{branch_status}}
最新提交: {{latest_commit}}
工作区状态: {{workspace_status}}
依赖版本: {{dependency_versions}}
```

### 修改操作记录
{{#each_change}}
#### 修改项 {{change_index}}
- **文件**: `{{file_path}}`
- **操作类型**: {{operation_type}}
- **修改行数**: {{lines_changed}}
- **修改内容**:
```{{language}}
{{change_content}}
```
- **验证状态**: {{validation_status}}
{{/each_change}}

### 执行步骤日志
```
{{execution_log}}
```

## ✅ 验证结果

### 功能验证
| 验证项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
{{#each_validation}}
| {{validation_item}} | {{expected_result}} | {{actual_result}} | {{status}} |
{{/each_validation}}

### 测试执行结果
- **单元测试**: {{unit_test_result}}
- **集成测试**: {{integration_test_result}}
- **端到端测试**: {{e2e_test_result}}
- **回归测试**: {{regression_test_result}}

### 性能影响评估
- **内存使用**: {{memory_impact}}
- **CPU使用**: {{cpu_impact}}
- **响应时间**: {{response_time_impact}}
- **吞吐量**: {{throughput_impact}}

## 🔄 质量检查

### 代码质量
- **语法检查**: {{syntax_check}}
- **类型检查**: {{type_check}}
- **代码规范**: {{code_standards}}
- **安全扫描**: {{security_scan}}

### 依赖影响
{{#each_dependency}}
- **依赖**: {{dependency_name}}
- **版本变化**: {{version_change}}
- **影响范围**: {{impact_scope}}
- **兼容性**: {{compatibility_status}}
{{/each_dependency}}

## 🚨 问题与异常

### 执行过程中的问题
{{#if_has_issues}}
{{#each_issue}}
- **问题**: {{issue_description}}
- **严重程度**: {{severity_level}}
- **解决方案**: {{resolution}}
- **状态**: {{issue_status}}
{{/each_issue}}
{{else}}
执行过程中未发现问题。
{{/if_has_issues}}

### 警告信息
{{#if_has_warnings}}
{{#each_warning}}
- {{warning_message}}
{{/each_warning}}
{{else}}
无警告信息。
{{/if_has_warnings}}

## 🔙 回滚信息

### 回滚策略
{{rollback_strategy}}

### 回滚步骤
{{#each_rollback_step}}
{{step_index}}. {{rollback_step}}
{{/each_rollback_step}}

### 数据备份
- **备份位置**: {{backup_location}}
- **备份大小**: {{backup_size}}
- **备份验证**: {{backup_verification}}

## 📊 执行统计

### 修改统计
- **修改文件数**: {{files_modified}}
- **新增代码行**: {{lines_added}}
- **删除代码行**: {{lines_deleted}}
- **修改代码行**: {{lines_modified}}

### 时间分析
- **代码修改时间**: {{coding_time}}
- **测试执行时间**: {{testing_time}}
- **验证时间**: {{validation_time}}
- **部署时间**: {{deployment_time}}

## ✅ 完成确认

### 修复确认清单
- [ ] 所有计划修改已执行
- [ ] 功能验证通过
- [ ] 测试用例通过
- [ ] 性能指标正常
- [ ] 无破坏性影响
- [ ] 代码质量符合标准
- [ ] 文档已同步更新

### 签署确认
- **技术负责人**: {{tech_lead_signature}}
- **质量保证**: {{qa_signature}}
- **产品负责人**: {{product_owner_signature}}

## 📝 后续行动

### 部署计划
{{deployment_plan}}

### 监控要求
{{monitoring_requirements}}

### 文档更新
{{documentation_updates}}

---
**报告生成**: mg_kiro MCP Server - Fix模式  
**模板版本**: v1.0.0