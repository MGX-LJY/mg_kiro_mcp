# 模块依赖关系文档生成模板

你是一个技术文档专家。请基于模块依赖分析结果生成完整的模块依赖文档。

## 输入数据
**依赖分析结果**: {{dependencyAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标
生成完整的`modules-dependencies.md`文档，包括依赖关系图谱、风险分析和优化建议。

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 模块依赖关系文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**依赖总数**: {{dependencyAnalysis.dependencyOverview.totalDependencies}}  
**依赖复杂度**: {{#if (eq dependencyAnalysis.dependencyOverview.dependencyComplexity "low")}}🟢 低{{else if (eq dependencyAnalysis.dependencyOverview.dependencyComplexity "medium")}}🟡 中等{{else}}🔴 高{{/if}}

---

## 📊 依赖关系概览

### 统计信息
| 指标 | 数值 | 说明 |
|------|------|------|
| 依赖关系总数 | {{dependencyAnalysis.dependencyOverview.totalDependencies}} | 所有依赖关系数量 |
| 内部依赖 | {{dependencyAnalysis.dependencyOverview.internalDependencies}} | 项目内模块间依赖 |
| 外部依赖 | {{dependencyAnalysis.dependencyOverview.externalDependencies}} | 第三方库依赖 |
| 平均依赖数 | {{dependencyAnalysis.dependencyOverview.averageDependenciesPerModule}} | 每模块平均依赖数 |
| 最大依赖深度 | {{dependencyAnalysis.dependencyOverview.maxDependencyDepth}} | 依赖链最大深度 |

### 质量指标
- **抽象性**: {{dependencyAnalysis.dependencyMetrics.abstractness}}
- **不稳定性**: {{dependencyAnalysis.dependencyMetrics.instability}}
- **主序列距离**: {{dependencyAnalysis.dependencyMetrics.distance}}

---

## 🗺️ 模块依赖映射

{{#each dependencyAnalysis.dependencyMapping}}
### {{@index}}.{{increment}}. {{module}}

**路径**: `{{path}}`  
**稳定性指数**: {{stability}} {{#if (gte stability 0.8)}}🟢{{else if (gte stability 0.5)}}🟡{{else}}🔴{{/if}}  
**扇入度**: {{fanIn}} | **扇出度**: {{fanOut}}

#### 直接依赖
{{#each directDependencies}}
- `{{this}}`
{{/each}}

{{#if indirectDependencies.length}}
#### 间接依赖
{{#each indirectDependencies}}
- `{{this}}`
{{/each}}
{{/if}}

{{#if dependents.length}}
#### 被依赖关系
{{#each dependents}}
- `{{this}}`
{{/each}}
{{/if}}

---
{{/each}}

---

## ⚠️ 循环依赖分析

{{#if dependencyAnalysis.circularDependencies.length}}
{{#each dependencyAnalysis.circularDependencies}}
### {{@index}}.{{increment}}. 循环依赖 {{#if (eq severity "high")}}🔴{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**循环长度**: {{length}}  
**严重程度**: {{severity}}  
**影响范围**: {{impact}}

#### 循环路径
{{#each cycle}}
{{#unless @last}}`{{this}}` → {{else}}`{{this}}`{{/unless}}
{{/each}}

#### 打破建议
{{breakSuggestion}}

---
{{/each}}
{{else}}
✅ **未发现循环依赖**，依赖结构良好。
{{/if}}

---

## 📐 依赖层级结构

{{#each dependencyAnalysis.dependencyLayers}}
### 第{{layer}}层

**层级稳定性**: {{levelStability}} {{#if (gte levelStability 0.8)}}🟢{{else if (gte levelStability 0.5)}}🟡{{else}}🔴{{/if}}

#### 包含模块
{{#each modules}}
- `{{this}}`
{{/each}}

#### 层级职责
{{#each responsibilities}}
- {{this}}
{{/each}}

---
{{/each}}

---

## 🚨 关键依赖分析

{{#each dependencyAnalysis.criticalDependencies}}
### {{@index}}.{{increment}}. {{dependency}}

**关键度评分**: {{criticalityScore}}/100 {{#if (gte criticalityScore 80)}}🔴{{else if (gte criticalityScore 60)}}🟡{{else}}🟢{{/if}}  
**故障影响**: {{failureImpact}}

#### 影响模块
{{#each affectedModules}}
- `{{this}}`
{{/each}}

#### 缓解措施
{{mitigation}}

---
{{/each}}

---

## 📦 外部依赖管理

{{#each dependencyAnalysis.externalDependencies}}
### {{@index}}.{{increment}}. {{name}}

**版本**: {{version}}  
**类型**: {{type}}  
**风险等级**: {{#if (eq riskLevel "high")}}🔴 高{{else if (eq riskLevel "medium")}}🟡 中等{{else}}🟢 低{{/if}}  
**使用模式**: {{usagePattern}}

{{#if alternatives.length}}
#### 替代方案
{{#each alternatives}}
- {{this}}
{{/each}}
{{/if}}

#### 更新建议
{{updateRecommendation}}

---
{{/each}}

---

## ⚠️ 依赖问题诊断

{{#if dependencyAnalysis.dependencyIssues.length}}
{{#each dependencyAnalysis.dependencyIssues}}
### {{@index}}.{{increment}}. {{issue}} {{#if (eq severity "critical")}}🔴{{else if (eq severity "high")}}🟠{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}  
**修复工作量**: {{effort}}

#### 问题描述
{{description}}

#### 影响模块
{{#each affectedModules}}
- `{{this}}`
{{/each}}

#### 解决建议
{{recommendation}}

---
{{/each}}
{{else}}
✅ **依赖结构健康**，未发现重大依赖问题。
{{/if}}

---

## 💡 依赖优化建议

{{#each dependencyAnalysis.optimizationRecommendations}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}  
**实施复杂度**: {{implementationComplexity}}

#### 建议内容
{{recommendation}}

#### 建议理由
{{rationale}}

#### 预期收益
{{expectedBenefit}}

---
{{/each}}

---

## 📋 依赖优化行动计划

### 🔥 高优先级优化
{{#each dependencyAnalysis.optimizationRecommendations}}
{{#if (eq priority "high")}}
- [ ] **{{category}}**: {{recommendation}}
{{/if}}
{{/each}}

### 🟡 中优先级优化
{{#each dependencyAnalysis.optimizationRecommendations}}
{{#if (eq priority "medium")}}
- [ ] **{{category}}**: {{recommendation}}
{{/if}}
{{/each}}

### 🟢 长期规划
{{#each dependencyAnalysis.optimizationRecommendations}}
{{#if (eq priority "low")}}
- [ ] **{{category}}**: {{recommendation}}
{{/if}}
{{/each}}

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [模块层次结构文档](./modules-hierarchy.md)
- [集成契约文档](./integration-contracts.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

请基于提供的依赖分析数据，生成清晰的模块依赖关系文档。