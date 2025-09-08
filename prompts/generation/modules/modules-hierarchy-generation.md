# 模块层次结构文档生成模板

你是一个技术文档专家。请基于模块层次分析结果生成完整的模块层次文档。

## 输入数据
**模块层次分析结果**: {{hierarchyAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标
生成完整的`modules-hierarchy.md`文档，包括模块层次结构图、架构层级说明、依赖关系分析和优化建议。

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 模块层次结构文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**组织模式**: {{hierarchyAnalysis.hierarchyAnalysis.organizationPattern}}  
**层级总数**: {{hierarchyAnalysis.hierarchyAnalysis.totalLevels}}  
**最大深度**: {{hierarchyAnalysis.hierarchyAnalysis.maxDepth}}

---

## 📊 层次结构概览

### 架构特征
- **组织模式**: {{hierarchyAnalysis.hierarchyAnalysis.organizationPattern}}
- **层次复杂度**: {{#if (eq hierarchyAnalysis.hierarchyAnalysis.hierarchyComplexity "low")}}🟢 低{{else if (eq hierarchyAnalysis.hierarchyAnalysis.hierarchyComplexity "medium")}}🟡 中等{{else}}🔴 高{{/if}}
- **平均深度**: {{hierarchyAnalysis.hierarchyMetrics.averageDepth}}
- **平衡因子**: {{hierarchyAnalysis.hierarchyMetrics.balanceFactor}}/100

### 质量指标
| 指标 | 评分 | 状态 |
|------|------|------|
| 模块化指数 | {{hierarchyAnalysis.hierarchyMetrics.modularityIndex}}/100 | {{#if (gte hierarchyAnalysis.hierarchyMetrics.modularityIndex 80)}}🟢 优秀{{else if (gte hierarchyAnalysis.hierarchyMetrics.modularityIndex 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 内聚性 | {{hierarchyAnalysis.hierarchyMetrics.cohesionScore}}/100 | {{#if (gte hierarchyAnalysis.hierarchyMetrics.cohesionScore 80)}}🟢 优秀{{else if (gte hierarchyAnalysis.hierarchyMetrics.cohesionScore 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 耦合度 | {{hierarchyAnalysis.hierarchyMetrics.couplingScore}}/100 | {{#if (lte hierarchyAnalysis.hierarchyMetrics.couplingScore 30)}}🟢 优秀{{else if (lte hierarchyAnalysis.hierarchyMetrics.couplingScore 60)}}🟡 可接受{{else}}🔴 需改进{{/if}} |

---

## 🏗️ 模块层次结构

{{#each hierarchyAnalysis.moduleHierarchy.topLevel}}
### {{@index}}.{{increment}}. {{name}}

**类型**: {{type}}  
**路径**: `{{path}}`

#### 主要职责
{{#each responsibilities}}
- {{this}}
{{/each}}

{{#if interfaces.length}}
#### 对外接口
{{#each interfaces}}
- {{this}}
{{/each}}
{{/if}}

{{#if children.length}}
#### 子模块结构
{{#each children}}
- **{{name}}** ({{type}}) - 层级 {{level}}
  - 路径: `{{path}}`
{{/each}}
{{/if}}

---
{{/each}}

---

## 🏛️ 架构分层

{{#each hierarchyAnalysis.architecturalLayers}}
### 第{{level}}层: {{layer}} {{#if (eq thickness "thin")}}🟢{{else if (eq thickness "moderate")}}🟡{{else}}🔴{{/if}}

**层厚度**: {{thickness}}

#### 包含模块
{{#each modules}}
- `{{this}}`
{{/each}}

#### 层职责
{{#each responsibilities}}
- {{this}}
{{/each}}

{{#if dependencies.length}}
#### 依赖关系
{{#each dependencies}}
- 依赖 → {{this}}
{{/each}}
{{/if}}

---
{{/each}}

---

## 🔗 依赖层次分析

### 依赖层级结构

{{#each hierarchyAnalysis.dependencyHierarchy.dependencyLevels}}
#### 依赖层级 {{level}}

**稳定性**: {{stability}}/100 {{#if (gte stability 80)}}🟢{{else if (gte stability 60)}}🟡{{else}}🔴{{/if}}  
**入度**: {{fanIn}}  
**出度**: {{fanOut}}

**包含模块**:
{{#each modules}}
- `{{this}}`
{{/each}}

---
{{/each}}

### 关键依赖路径
{{#each hierarchyAnalysis.dependencyHierarchy.criticalPaths}}
- {{this}}
{{/each}}

{{#if hierarchyAnalysis.dependencyHierarchy.circularDependencies.length}}
### ⚠️ 循环依赖警告
{{#each hierarchyAnalysis.dependencyHierarchy.circularDependencies}}
- 🔄 {{this}}
{{/each}}
{{/if}}

{{#if hierarchyAnalysis.dependencyHierarchy.isolatedModules.length}}
### 🔵 孤立模块
{{#each hierarchyAnalysis.dependencyHierarchy.isolatedModules}}
- `{{this}}`
{{/each}}
{{/if}}

---

## ⚠️ 层次结构问题

{{#if hierarchyAnalysis.hierarchyIssues.length}}
{{#each hierarchyAnalysis.hierarchyIssues}}
### {{@index}}.{{increment}}. {{issue}} {{#if (eq severity "high")}}🔴{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}

#### 问题描述
{{description}}

#### 影响模块
{{#each affectedModules}}
- `{{this}}`
{{/each}}

#### 改进建议
{{recommendation}}

---
{{/each}}
{{else}}
✅ **层次结构良好**，未发现明显的结构问题。
{{/if}}

---

## 💡 优化建议

{{#each hierarchyAnalysis.optimizationSuggestions}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}  
**实施难度**: {{#if (eq implementationEffort "low")}}🟢 低{{else if (eq implementationEffort "medium")}}🟡 中等{{else}}🔴 高{{/if}}

#### 建议内容
{{suggestion}}

#### 预期收益
{{expectedBenefit}}

---
{{/each}}

---

## 📋 层次优化行动计划

### 🔥 高优先级改进
{{#each hierarchyAnalysis.optimizationSuggestions}}
{{#if (eq priority "high")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

### 🟡 中优先级改进
{{#each hierarchyAnalysis.optimizationSuggestions}}
{{#if (eq priority "medium")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

### 🟢 长期规划
{{#each hierarchyAnalysis.optimizationSuggestions}}
{{#if (eq priority "low")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [模块目录文档](./modules-catalog.md)
- [模块依赖关系文档](./modules-dependencies.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

请基于提供的模块层次分析数据，生成清晰的模块层次结构文档。