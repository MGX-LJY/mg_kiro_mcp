# 系统架构文档生成模板

你是一个技术文档专家。请基于系统架构分析结果生成专业的系统架构文档。

## 输入数据
**架构分析结果**: {{architectureAnalysis}}
**项目名称**: {{projectName}}
**语言信息**: {{languageInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`system-architecture.md`文档，包括：
1. 系统概述
2. 技术架构
3. 核心组件
4. 数据流设计
5. 部署架构
6. 质量属性

## Markdown输出模板

```markdown
# {{projectName}} - 系统架构文档

**版本**: 1.0  
**创建时间**: {{timestamp}}  
**主要语言**: {{languageInfo.primaryLanguage}}  
**架构模式**: {{architectureAnalysis.systemOverview.architecturalPattern}}

---

## 📋 系统概述

### 项目特征
- **项目类型**: {{architectureAnalysis.systemOverview.projectType}}
- **业务领域**: {{architectureAnalysis.systemOverview.coreBusinessDomain}}  
- **项目规模**: {{architectureAnalysis.systemOverview.projectScale}}
- **技术复杂度**: {{architectureAnalysis.systemOverview.technicalComplexity}}/10

### 整体描述
{{architectureAnalysis.systemOverview.description}}

---

## 🏗️ 技术架构

### 技术栈
{{#with architectureAnalysis.technicalStack}}
- **主要语言**: {{primaryLanguage}}
- **核心框架**: {{#each frameworks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **构建工具**: {{#each buildTools}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **测试框架**: {{#each testingFramework}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if codeQuality}}- **代码质量**: {{#each codeQuality}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if deployment}}- **部署工具**: {{#each deployment}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/with}}

### 架构模式
**{{architectureAnalysis.systemOverview.architecturalPattern}}架构**

{{#if (eq architectureAnalysis.systemOverview.architecturalPattern "MVC")}}
采用经典的Model-View-Controller架构模式，实现了关注点分离和代码组织的最佳实践。
{{else if (eq architectureAnalysis.systemOverview.architecturalPattern "微服务")}}
采用微服务架构，各服务独立部署和扩展，提高了系统的可维护性和可扩展性。
{{else if (eq architectureAnalysis.systemOverview.architecturalPattern "组件化")}}
采用组件化架构，通过可复用组件提高开发效率和代码质量。
{{else}}
采用{{architectureAnalysis.systemOverview.architecturalPattern}}架构模式，适合当前项目的业务特点和技术要求。
{{/if}}

---

## 🔧 核心组件

{{#each architectureAnalysis.coreComponents}}
### {{@index}}. {{name}} {{#if (eq complexity "high")}}🔴{{else if (eq complexity "medium")}}🟡{{else}}🟢{{/if}}

**组件类型**: {{type}}  
**复杂度**: {{complexity}}

#### 📝 核心职责
{{responsibility}}

#### 📁 相关文件
{{#each files}}
- `{{this}}`
{{/each}}

{{#if interfaces}}
#### 🔌 对外接口
{{#each interfaces}}
- {{this}}
{{/each}}
{{/if}}

{{#if dependencies}}
#### 🔗 组件依赖
{{#each dependencies}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}

## 🌊 数据流设计

{{#with architectureAnalysis.dataFlow}}
### 数据流向概述
{{flowDescription}}

### 关键节点
- **入口点**: {{#each entryPoints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **处理层**: {{#each processLayers}}{{this}}{{#unless @last}} → {{/unless}}{{/each}}
- **输出点**: {{#each outputPoints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

### 存储模式
{{storagePattern}}

{{#if apiEndpoints}}
### 核心API端点
{{#each apiEndpoints}}
- `{{this}}`
{{/each}}
{{/if}}
{{/with}}

---

## 📊 质量属性

{{#with architectureAnalysis.qualityMetrics}}
### 质量评估

| 维度 | 评分 | 状态 |
|------|------|------|
| 代码组织 | {{codeOrganization}}/10 | {{#if (gte codeOrganization 8)}}✅ 优秀{{else if (gte codeOrganization 6)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 文档完整度 | {{documentationLevel}}/10 | {{#if (gte documentationLevel 8)}}✅ 优秀{{else if (gte documentationLevel 6)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 测试覆盖 | {{testCoverage}}/10 | {{#if (gte testCoverage 8)}}✅ 优秀{{else if (gte testCoverage 6)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 可维护性 | {{maintainability}}/10 | {{#if (gte maintainability 8)}}✅ 优秀{{else if (gte maintainability 6)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 可扩展性 | {{scalability}}/10 | {{#if (gte scalability 8)}}✅ 优秀{{else if (gte scalability 6)}}🟡 良好{{else}}🔴 需改进{{/if}} |

**综合评分**: {{#divide (add codeOrganization documentationLevel testCoverage maintainability scalability) 5 round=1}}{{/divide}}/10
{{/with}}

---

## 🚀 架构建议

{{#each architectureAnalysis.architecturalRecommendations}}
### {{@index}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}

#### 建议内容
{{suggestion}}

#### 实施理由
{{rationale}}

---
{{/each}}

## 📈 后续优化方向

基于当前架构分析，建议关注以下优化方向：

1. **高优先级改进**
   {{#each architectureAnalysis.architecturalRecommendations}}
   {{#if (eq priority "high")}}
   - {{suggestion}}
   {{/if}}
   {{/each}}

2. **中长期规划**
   {{#each architectureAnalysis.architecturalRecommendations}}
   {{#if (ne priority "high")}}
   - {{suggestion}}
   {{/if}}
   {{/each}}

---

## 📖 相关文档

- [模块目录文档](./modules-catalog.md)
- [集成契约文档](./integration-contracts.md)
- [开发规范文档](./development-guidelines.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

## 生成指南

### 质量检查
- 确保所有模板变量都被正确替换
- 验证Markdown语法正确性
- 检查表格格式和链接有效性

### 自适应内容
- 根据项目规模调整详细程度
- 基于技术栈提供相关建议
- 根据复杂度调整说明深度

### 专业性保证
- 使用准确的技术术语
- 提供实用的架构建议
- 确保内容逻辑清晰

请基于提供的架构分析数据，生成专业且实用的系统架构文档。