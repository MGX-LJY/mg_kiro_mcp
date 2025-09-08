# 文档同步更新报告 (Documentation Update Report)

**报告类型**: Fix模式 - 第6步：文档同步更新  
**生成时间**: {{timestamp}}  
**问题ID**: {{issue_id}}  
**更新者**: {{updater}}

## 📋 更新概览

### 问题描述
{{issue_description}}

### 修复影响范围
{{fix_impact_scope}}

### 文档更新状态
- **更新状态**: {{update_status}}
- **开始时间**: {{start_time}}
- **完成时间**: {{completion_time}}
- **总耗时**: {{duration}}

## 📚 文档更新范围

### 受影响文档清单
{{#each_document}}
#### {{doc_index}}. {{document_name}}
- **文档路径**: `{{document_path}}`
- **文档类型**: {{document_type}}
- **更新原因**: {{update_reason}}
- **优先级**: {{priority_level}}
- **更新状态**: {{document_status}}
{{/each_document}}

### 文档分类统计
| 文档类型 | 数量 | 已更新 | 待更新 | 跳过 |
|----------|------|--------|--------|------|
{{#each_doc_type}}
| {{doc_type}} | {{total_count}} | {{updated_count}} | {{pending_count}} | {{skipped_count}} |
{{/each_doc_type}}

## 🔄 详细更新内容

### 技术文档更新
{{#each_tech_doc}}
#### {{tech_doc_name}}
**更新内容**:
- {{update_content}}

**更新前**:
```
{{before_content}}
```

**更新后**:
```
{{after_content}}
```

**变更说明**: {{change_explanation}}
{{/each_tech_doc}}

### API文档更新
{{#each_api_doc}}
#### {{api_doc_name}}
- **接口变更**: {{api_changes}}
- **参数变更**: {{parameter_changes}}
- **返回值变更**: {{response_changes}}
- **示例更新**: {{example_updates}}
{{/each_api_doc}}

### 用户文档更新
{{#each_user_doc}}
#### {{user_doc_name}}
- **功能描述**: {{feature_description}}
- **使用说明**: {{usage_instructions}}
- **注意事项**: {{important_notes}}
- **截图更新**: {{screenshot_updates}}
{{/each_user_doc}}

## ✅ 一致性验证

### 文档间一致性检查
| 检查项 | 状态 | 说明 |
|--------|------|------|
{{#each_consistency_check}}
| {{check_item}} | {{check_status}} | {{check_notes}} |
{{/each_consistency_check}}

### 代码与文档同步性
- **API文档同步**: {{api_sync_status}}
- **配置文档同步**: {{config_sync_status}}
- **部署文档同步**: {{deployment_sync_status}}
- **故障排除文档同步**: {{troubleshooting_sync_status}}

### 版本一致性
- **文档版本**: {{doc_version}}
- **代码版本**: {{code_version}}
- **发布版本**: {{release_version}}
- **一致性状态**: {{version_consistency}}

## 🔍 质量检查

### 文档质量评估
{{#each_quality_metric}}
- **{{quality_aspect}}**: {{quality_score}}/10
  - 说明: {{quality_explanation}}
{{/each_quality_metric}}

### 语言和格式检查
- **拼写检查**: {{spell_check_result}}
- **语法检查**: {{grammar_check_result}}
- **格式标准**: {{format_standard_result}}
- **链接有效性**: {{link_validity_result}}

### 可读性分析
- **技术准确性**: {{technical_accuracy}}
- **表达清晰度**: {{clarity_level}}
- **结构完整性**: {{structural_integrity}}
- **示例有效性**: {{example_validity}}

## 🌐 多语言支持

### 国际化更新
{{#if_multilingual}}
{{#each_language}}
- **语言**: {{language_name}}
- **更新状态**: {{translation_status}}
- **完成度**: {{completion_percentage}}%
- **审核状态**: {{review_status}}
{{/each_language}}
{{else}}
当前项目不支持多语言文档。
{{/if_multilingual}}

## 📝 变更记录

### 文档变更历史
{{#each_change_record}}
#### {{change_date}}
- **变更类型**: {{change_type}}
- **影响文档**: {{affected_docs}}
- **变更描述**: {{change_description}}
- **变更人**: {{change_author}}
{{/each_change_record}}

### 版本控制信息
- **分支**: {{branch_name}}
- **提交哈希**: {{commit_hash}}
- **提交消息**: {{commit_message}}
- **合并状态**: {{merge_status}}

## 🚨 问题与异常

### 更新过程中的问题
{{#if_has_issues}}
{{#each_issue}}
- **问题**: {{issue_description}}
- **严重程度**: {{severity_level}}
- **解决方案**: {{resolution}}
- **状态**: {{issue_status}}
{{/each_issue}}
{{else}}
文档更新过程中未发现问题。
{{/if_has_issues}}

### 遗留问题
{{#if_has_pending_issues}}
{{#each_pending_issue}}
- **问题**: {{pending_issue_description}}
- **计划解决时间**: {{planned_resolution_date}}
- **负责人**: {{assignee}}
{{/each_pending_issue}}
{{else}}
无遗留问题。
{{/if_has_pending_issues}}

## 📢 通知与培训

### 团队通知
{{#each_notification}}
- **通知对象**: {{notification_target}}
- **通知方式**: {{notification_method}}
- **通知内容**: {{notification_content}}
- **发送状态**: {{notification_status}}
{{/each_notification}}

### 培训需求
{{#if_training_required}}
{{#each_training_item}}
- **培训内容**: {{training_content}}
- **目标人群**: {{target_audience}}
- **培训形式**: {{training_format}}
- **计划时间**: {{training_schedule}}
{{/each_training_item}}
{{else}}
无额外培训需求。
{{/if_training_required}}

## 🔗 知识库同步

### 内部知识库更新
- **Wiki更新**: {{wiki_update_status}}
- **FAQ更新**: {{faq_update_status}}
- **最佳实践**: {{best_practices_update}}
- **案例研究**: {{case_study_update}}

### 外部文档同步
- **官网文档**: {{official_site_sync}}
- **开发者门户**: {{developer_portal_sync}}
- **社区文档**: {{community_docs_sync}}
- **第三方平台**: {{third_party_sync}}

## 📊 更新统计

### 工作量统计
- **更新文档数**: {{updated_docs_count}}
- **新增内容字数**: {{added_content_words}}
- **修改内容字数**: {{modified_content_words}}
- **删除内容字数**: {{removed_content_words}}

### 时间分析
- **内容编写**: {{content_writing_time}}
- **格式调整**: {{formatting_time}}
- **质量检查**: {{quality_check_time}}
- **同步发布**: {{sync_publish_time}}

## ✅ 完成确认

### 文档更新清单
- [ ] 所有受影响文档已识别
- [ ] 技术文档已同步更新
- [ ] API文档版本一致
- [ ] 用户指南已更新
- [ ] 质量检查通过
- [ ] 版本控制已提交
- [ ] 团队已收到通知
- [ ] 知识库已同步

### 签署确认
- **技术文档负责人**: {{tech_doc_lead_signature}}
- **产品文档负责人**: {{product_doc_lead_signature}}
- **质量保证**: {{qa_signature}}

## 📅 后续计划

### 持续维护
{{maintenance_plan}}

### 定期审查
{{review_schedule}}

### 反馈收集
{{feedback_collection_plan}}

---
**报告生成**: mg_kiro MCP Server - Fix模式  
**模板版本**: v1.0.0