# 用户故事文档生成模板 (标准版)

你是一个技术文档专家。请基于分析后的用户故事数据生成高质量的用户故事文档。

## 输入数据
**用户故事列表**: {{userStoriesData}}
**文档格式**: {{format}}
**包含验收标准**: {{includeCriteria}}
**包含工作量估算**: {{includeEstimation}}

## 文档结构要求

### 1. 文档头部
- 项目名称和版本
- 文档创建时间
- 文档目的和范围说明

### 2. 执行摘要
- 总故事数量和类型分布
- 总体工作量估算
- 关键里程碑和交付计划
- 风险和依赖概述

### 3. 用户故事详情
每个用户故事包含：
- 标准格式的用户故事标题
- 详细功能描述
- 业务价值说明
- 优先级和理由
- 故事点估算和依据
- 验收标准 (如果启用)
- 技术备注和依赖

### 4. 史诗分组
- 按功能模块分组展示
- 每个史诗的总体目标
- 史诗内故事的执行顺序建议

### 5. 开发计划
- 迭代规划建议
- 资源分配建议
- 风险缓解计划

## Markdown输出模板

```markdown
# {{projectName}} 用户故事文档

**版本**: 1.0  
**创建时间**: {{generationDate}}  
**文档状态**: 草案/审核中/已批准

## 📋 执行摘要

### 项目概述
本文档包含 **{{totalStories}}** 个用户故事，总计 **{{totalStoryPoints}}** 个故事点。

### 工作量概览
- **预估开发周期**: {{estimatedWeeks}} 周
- **建议迭代数**: {{estimatedSprints}} 个Sprint  
- **平均故事点**: {{averageStoryPoints}} 点/故事

### 优先级分布
- 🔴 **高优先级**: {{highPriorityCount}} 个故事 ({{highPriorityPercentage}}%)
- 🟡 **中优先级**: {{mediumPriorityCount}} 个故事 ({{mediumPriorityPercentage}}%)
- 🟢 **低优先级**: {{lowPriorityCount}} 个故事 ({{lowPriorityPercentage}}%)

---

## 📖 用户故事详情

{{#each userStories}}
### {{@index}}.{{increment}}. {{title}}

**ID**: `{{id}}`  
**史诗**: {{epic}}  
**优先级**: {{priorityIcon priority}} {{priority}}  
**故事点**: {{storyPoints}}  
**状态**: {{status}}

#### 📝 描述
{{description}}

#### 💡 业务价值
{{businessValue}}

{{#if acceptanceCriteria}}
#### ✅ 验收标准
{{#each acceptanceCriteria}}
- {{this}}
{{/each}}
{{/if}}

{{#if technicalNotes}}
#### 🔧 技术备注
{{technicalNotes}}
{{/if}}

{{#if dependencies}}
#### 🔗 依赖关系
{{#each dependencies}}
- 依赖于: `{{this}}`
{{/each}}
{{/if}}

{{#if tags}}
**标签**: {{#each tags}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

---
{{/each}}

## 📊 史诗分组

{{#each epics}}
### 🎯 史诗: {{name}}

**优先级**: {{priority}}  
**总故事点**: {{totalPoints}}  
**故事数量**: {{storyCount}}

#### 包含的故事
{{#each stories}}
- {{title}} ({{storyPoints}}点, {{priority}})
{{/each}}

#### 执行建议
{{executionRecommendation}}

---
{{/each}}

## 📅 开发计划建议

### Sprint规划
{{#each sprintPlan}}
#### Sprint {{sprintNumber}} ({{duration}})
**目标**: {{goal}}  
**故事点容量**: {{capacity}}

**计划故事**:
{{#each stories}}
- {{title}} ({{storyPoints}}点)
{{/each}}

**里程碑**: {{milestone}}
{{/each}}

### 🎯 关键里程碑
{{#each milestones}}
- **{{name}}** ({{date}}): {{description}}
{{/each}}

### ⚠️ 风险和缓解措施
{{#each risks}}
- **{{risk}}**: {{mitigation}}
{{/each}}

## 📈 质量指标

### 完整性检查
- ✅ 所有故事有明确的验收标准: {{#if allHaveCriteria}}是{{else}}否 ({{missingCriteriaCount}}个缺失){{/if}}
- ✅ 所有故事有工作量估算: {{#if allHaveEstimation}}是{{else}}否{{/if}}
- ✅ 所有故事有业务价值说明: {{#if allHaveBusinessValue}}是{{else}}否{{/if}}

### 质量评分
- **整体质量得分**: {{qualityScore}}/100
- **推荐改进**: {{#each improvements}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

---

## 📝 附录

### 词汇表
{{#each glossary}}
- **{{term}}**: {{definition}}
{{/each}}

### 参考文档
- 需求规格说明
- 技术架构设计
- UI/UX设计稿

---

*本文档由 mg_kiro MCP Server 生成，基于AI智能分析*  
*生成时间: {{generationTimestamp}}*
```

## 生成指南

### 数据处理
- 自动计算汇总统计信息
- 智能生成史诗分组建议
- 基于故事点估算开发周期
- 识别关键依赖和风险

### 格式优化
- 使用清晰的标题层次
- 添加适当的图标和符号
- 确保表格和列表格式正确
- 提供交互式的目录链接

### 质量保证
- 验证所有必需字段存在
- 检查数据一致性
- 提供质量改进建议
- 确保文档专业性和可读性

请基于提供的用户故事数据，生成符合上述模板的完整Markdown文档。