# 模块目录文档生成模板

你是一个技术文档专家。请基于模块分析结果生成完整的模块目录文档。

## 输入数据
**模块分析结果**: {{moduleAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`modules-catalog.md`文档，包括：
1. 模块概览统计
2. 模块分类目录
3. 重要性排名
4. 质量分析报告
5. 依赖关系图谱
6. 架构洞察
7. 改进建议

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 模块目录文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**项目语言**: {{projectInfo.language}}  
**分析模块数**: {{totalModules}}

---

## 📊 模块概览

### 统计信息
- **模块总数**: {{totalModules}}
- **核心模块**: {{moduleAnalysis.moduleCategorization.core.length}} 个
- **业务模块**: {{moduleAnalysis.moduleCategorization.business.length}} 个  
- **工具模块**: {{moduleAnalysis.moduleCategorization.utility.length}} 个
- **配置模块**: {{moduleAnalysis.moduleCategorization.configuration.length}} 个
- **测试模块**: {{moduleAnalysis.moduleCategorization.test.length}} 个

### 质量分布
{{#with moduleAnalysis.qualityMetrics.qualityDistribution}}
- 🟢 **优秀模块**: {{excellent}} 个
- 🟡 **良好模块**: {{good}} 个
- 🟠 **一般模块**: {{average}} 个
- 🔴 **较差模块**: {{poor}} 个
{{/with}}

**整体质量评分**: {{moduleAnalysis.qualityMetrics.overallQuality}}/100

---

## 🏗️ 核心模块 (Core Modules)

{{#each moduleAnalysis.moduleCategorization.core}}
### {{@index}}.{{increment}}. {{name}} {{#if (eq complexity "high")}}🔴{{else if (eq complexity "medium")}}🟡{{else}}🟢{{/if}}

**路径**: `{{path}}`  
**类型**: {{type}}  
**复杂度**: {{complexity}}  
**代码行数**: {{lines}}

#### 📝 功能描述
{{description}}

{{#if dependencies.length}}
#### ⬇️ 依赖模块
{{#each dependencies}}
- `{{this}}`
{{/each}}
{{/if}}

{{#if dependents.length}}
#### ⬆️ 被依赖
{{#each dependents}}
- `{{this}}`
{{/each}}
{{/if}}

---
{{/each}}

## 💼 业务模块 (Business Modules)

{{#each moduleAnalysis.moduleCategorization.business}}
### {{@index}}.{{increment}}. {{name}} {{#if (eq complexity "high")}}🔴{{else if (eq complexity "medium")}}🟡{{else}}🟢{{/if}}

**路径**: `{{path}}`  
**类型**: {{type}}  
**复杂度**: {{complexity}}  
**代码行数**: {{lines}}

#### 📝 功能描述
{{description}}

{{#if dependencies.length}}
#### ⬇️ 依赖模块
{{#each dependencies}}
- `{{this}}`
{{/each}}
{{/if}}

---
{{/each}}

## 🔧 工具模块 (Utility Modules)

{{#each moduleAnalysis.moduleCategorization.utility}}
### {{@index}}.{{increment}}. {{name}} {{#if (eq complexity "high")}}🔴{{else if (eq complexity "medium")}}🟡{{else}}🟢{{/if}}

**路径**: `{{path}}`  
**类型**: {{type}}  
**代码行数**: {{lines}}

#### 📝 功能描述
{{description}}

---
{{/each}}

## ⚙️ 配置模块 (Configuration)

{{#each moduleAnalysis.moduleCategorization.configuration}}
### {{@index}}.{{increment}}. {{name}}

**路径**: `{{path}}`  
**类型**: {{type}}

#### 📝 功能描述
{{description}}

---
{{/each}}

## 🧪 测试模块 (Test Modules)

{{#each moduleAnalysis.moduleCategorization.test}}
### {{@index}}.{{increment}}. {{name}}

**路径**: `{{path}}`  
**类型**: {{type}}

#### 📝 功能描述
{{description}}

---
{{/each}}

## 📈 重要性排名 (Top 10)

| 排名 | 模块名称 | 评分 | 类别 | 关键程度 | 重要性理由 |
|------|----------|------|------|----------|------------|
{{#each moduleAnalysis.importanceRanking}}
{{#if (lte @index 9)}}
| {{#add @index 1}} | `{{module}}` | {{score}} | {{category}} | {{criticalityLevel}} | {{rationale}} |
{{/if}}
{{/each}}

---

## 📊 质量分析报告

### 整体质量概览
**综合评分**: {{moduleAnalysis.qualityMetrics.overallQuality}}/100

### 模块质量详情

{{#each moduleAnalysis.qualityMetrics.moduleQuality}}
#### {{@index}}.{{increment}}. {{module}}

| 维度 | 评分 | 状态 |
|------|------|------|
| 代码质量 | {{codeQuality}}/100 | {{#if (gte codeQuality 80)}}✅ 优秀{{else if (gte codeQuality 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 文档质量 | {{documentation}}/100 | {{#if (gte documentation 80)}}✅ 优秀{{else if (gte documentation 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 测试覆盖 | {{testCoverage}}/100 | {{#if (gte testCoverage 80)}}✅ 优秀{{else if (gte testCoverage 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 可维护性 | {{maintainability}}/100 | {{#if (gte maintainability 80)}}✅ 优秀{{else if (gte maintainability 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

{{#if issues.length}}
**发现的问题**:
{{#each issues}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}

## 🔗 依赖关系分析

### 依赖统计
- **依赖关系总数**: {{moduleAnalysis.dependencyAnalysis.totalDependencies}}
- **平均每模块依赖数**: {{moduleAnalysis.dependencyAnalysis.avgDependenciesPerModule}}
- **最大依赖深度**: {{moduleAnalysis.dependencyAnalysis.maxDependencyDepth}}

{{#if moduleAnalysis.dependencyAnalysis.circularDependencies.length}}
### ⚠️ 循环依赖警告
{{#each moduleAnalysis.dependencyAnalysis.circularDependencies}}
- {{this}}
{{/each}}
{{/if}}

### 关键依赖路径
{{#each moduleAnalysis.dependencyAnalysis.criticalPath}}
- {{this}}
{{/each}}

{{#if moduleAnalysis.dependencyAnalysis.highCouplingModules.length}}
### 🔴 高耦合模块
{{#each moduleAnalysis.dependencyAnalysis.highCouplingModules}}
- `{{this}}`
{{/each}}
{{/if}}

{{#if moduleAnalysis.dependencyAnalysis.isolatedModules.length}}
### 🔵 独立模块
{{#each moduleAnalysis.dependencyAnalysis.isolatedModules}}
- `{{this}}`
{{/each}}
{{/if}}

### 依赖风险评估
{{#each moduleAnalysis.dependencyAnalysis.dependencyRisks}}
#### {{@index}}.{{increment}}. {{risk}} {{#if (eq severity "high")}}🔴{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}  
**涉及模块**: {{#each modules}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

**改进建议**: {{recommendation}}

---
{{/each}}

## 🏛️ 架构洞察

{{#with moduleAnalysis.architecturalInsights}}
### 架构质量指标
- **模块化程度**: {{modularityScore}}/100
- **内聚度**: {{cohesionLevel}}
- **耦合度**: {{couplingLevel}}

{{#if designPatterns.length}}
### 识别的设计模式
{{#each designPatterns}}
- {{this}}
{{/each}}
{{/if}}

{{#if architecturalSmells.length}}
### 架构异味检测
{{#each architecturalSmells}}
- {{this}}
{{/each}}
{{/if}}

### 重构机会
{{#each refactoringOpportunities}}
#### {{@index}}.{{increment}}. {{opportunity}}

**相关模块**: {{#each modules}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}  
**预期收益**: {{benefit}}  
**实施工作量**: {{effort}}

---
{{/each}}
{{/with}}

## 💡 改进建议

{{#each moduleAnalysis.recommendations}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}

#### 建议内容
{{suggestion}}

#### 影响模块
{{#each impactedModules}}
- `{{this}}`
{{/each}}

#### 预期收益
{{expectedBenefit}}

#### 实施难度
{{implementationEffort}}

---
{{/each}}

## 📋 行动清单

基于分析结果，建议优先关注以下改进项：

### 🔥 高优先级 (立即处理)
{{#each moduleAnalysis.recommendations}}
{{#if (eq priority "high")}}
- [ ] {{suggestion}}
{{/if}}
{{/each}}

### 🟡 中优先级 (近期处理)
{{#each moduleAnalysis.recommendations}}
{{#if (eq priority "medium")}}
- [ ] {{suggestion}}
{{/if}}
{{/each}}

### 🟢 低优先级 (长期规划)
{{#each moduleAnalysis.recommendations}}
{{#if (eq priority "low")}}
- [ ] {{suggestion}}
{{/if}}
{{/each}}

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [集成契约文档](./integration-contracts.md)
- [开发规范文档](./development-guidelines.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

## 生成指南

### 数据处理
- 自动计算模块统计信息
- 智能分类模块类型
- 生成重要性排名表格
- 识别质量和依赖问题

### 格式优化
- 使用清晰的标题层次
- 添加适当的图标和颜色标记
- 确保表格和列表格式正确
- 提供可操作的行动清单

### 质量保证
- 验证所有必需数据存在
- 检查分析结果合理性
- 提供具体可行的改进建议
- 确保文档专业性和实用性

请基于提供的模块分析数据，生成完整且实用的模块目录文档。