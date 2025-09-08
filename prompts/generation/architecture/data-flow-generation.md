# 数据流文档生成模板

你是一个数据架构文档专家。请基于数据流分析结果生成完整的数据流文档。

## 输入数据
**数据流分析结果**: {{dataFlowAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标
生成完整的`data-flow.md`文档，包括数据流图谱、存储分析、质量评估和优化建议。

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 数据流文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**数据流总数**: {{dataFlowAnalysis.dataFlowOverview.totalFlows}}  
**数据复杂度**: {{#if (eq dataFlowAnalysis.dataFlowOverview.dataComplexity "low")}}🟢 低{{else if (eq dataFlowAnalysis.dataFlowOverview.dataComplexity "medium")}}🟡 中等{{else}}🔴 高{{/if}}

---

## 📊 数据流概览

### 统计信息
| 指标 | 数值 | 说明 |
|------|------|------|
| 数据流总数 | {{dataFlowAnalysis.dataFlowOverview.totalFlows}} | 识别的数据流数量 |
| 输入源数量 | {{dataFlowAnalysis.dataFlowOverview.inputSources}} | 数据输入点数量 |
| 输出目标数量 | {{dataFlowAnalysis.dataFlowOverview.outputDestinations}} | 数据输出点数量 |
| 处理阶段数量 | {{dataFlowAnalysis.dataFlowOverview.processingStages}} | 数据处理环节数 |

### 数据质量评估
| 维度 | 评分 | 状态 |
|------|------|------|
| 数据验证 | {{dataFlowAnalysis.dataQuality.validation}}/100 | {{#if (gte dataFlowAnalysis.dataQuality.validation 80)}}🟢 优秀{{else if (gte dataFlowAnalysis.dataQuality.validation 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 数据一致性 | {{dataFlowAnalysis.dataQuality.consistency}}/100 | {{#if (gte dataFlowAnalysis.dataQuality.consistency 80)}}🟢 优秀{{else if (gte dataFlowAnalysis.dataQuality.consistency 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 数据完整性 | {{dataFlowAnalysis.dataQuality.integrity}}/100 | {{#if (gte dataFlowAnalysis.dataQuality.integrity 80)}}🟢 优秀{{else if (gte dataFlowAnalysis.dataQuality.integrity 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 数据安全性 | {{dataFlowAnalysis.dataQuality.security}}/100 | {{#if (gte dataFlowAnalysis.dataQuality.security 80)}}🟢 优秀{{else if (gte dataFlowAnalysis.dataQuality.security 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 处理性能 | {{dataFlowAnalysis.dataQuality.performance}}/100 | {{#if (gte dataFlowAnalysis.dataQuality.performance 80)}}🟢 优秀{{else if (gte dataFlowAnalysis.dataQuality.performance 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

---

## 🌊 数据流分析

{{#each dataFlowAnalysis.dataFlows}}
### {{@index}}.{{increment}}. {{flowName}} {{#if (eq criticality "critical")}}🔴{{else if (eq criticality "high")}}🟠{{else if (eq criticality "medium")}}🟡{{else}}🟢{{/if}}

**重要程度**: {{criticality}}  
**数据量级**: {{#if (eq volume "high")}}🔴 高{{else if (eq volume "medium")}}🟡 中等{{else}}🟢 低{{/if}}  
**处理频率**: {{frequency}}

#### 流程描述
{{description}}

#### 数据路径
{{#each path}}
{{#unless @last}}`{{this}}` → {{else}}`{{this}}`{{/unless}}
{{/each}}

#### 数据类型
{{#each dataTypes}}
- {{this}}
{{/each}}

{{#if transformations.length}}
#### 数据转换
{{#each transformations}}
- {{this}}
{{/each}}
{{/if}}

**数据源**: {{source}}  
**数据目标**: {{destination}}

---
{{/each}}

---

## 📥 数据输入分析

{{#each dataFlowAnalysis.dataInputs}}
### {{@index}}.{{increment}}. {{source}}

**输入类型**: {{type}}  
**数据格式**: {{dataFormat}}  
**数据量**: {{volume}}  
**处理模块**: `{{processingModule}}`

#### 数据验证
{{validation}}

---
{{/each}}

---

## 📤 数据输出分析

{{#each dataFlowAnalysis.dataOutputs}}
### {{@index}}.{{increment}}. {{destination}}

**输出类型**: {{type}}  
**数据格式**: {{dataFormat}}  
**输出频率**: {{frequency}}  
**生成模块**: `{{generationModule}}`

---
{{/each}}

---

## 💾 数据存储架构

### 数据库存储
{{#each dataFlowAnalysis.dataStorage.databases}}
#### {{@index}}.{{increment}}. {{name}}

**数据库类型**: {{type}}  
**访问模式**: {{accessPattern}}

**操作类型**:
{{#each operations}}
- {{this}}
{{/each}}

**存储数据类型**:
{{#each dataTypes}}
- {{this}}
{{/each}}

---
{{/each}}

{{#if dataFlowAnalysis.dataStorage.caching.length}}
### 缓存系统
{{#each dataFlowAnalysis.dataStorage.caching}}
#### {{@index}}.{{increment}}. {{name}}

**缓存类型**: {{type}}  
**生存时间**: {{ttl}}  
**淘汰策略**: {{evictionPolicy}}

**缓存数据类型**:
{{#each dataTypes}}
- {{this}}
{{/each}}

---
{{/each}}
{{/if}}

{{#if dataFlowAnalysis.dataStorage.files.length}}
### 文件存储
{{#each dataFlowAnalysis.dataStorage.files}}
#### {{@index}}.{{increment}}. {{type}}文件

**存储位置**: {{location}}

**文件操作**:
{{#each operations}}
- {{this}}
{{/each}}

**支持格式**:
{{#each formats}}
- {{this}}
{{/each}}

---
{{/each}}
{{/if}}

---

## 🔄 数据转换分析

{{#each dataFlowAnalysis.dataTransformations}}
### {{@index}}.{{increment}}. {{transformation}}

**输入格式**: {{inputFormat}}  
**输出格式**: {{outputFormat}}  
**执行模块**: `{{module}}`  
**性能特征**: {{performance}}

#### 转换逻辑
{{transformationLogic}}

---
{{/each}}

---

## ⚠️ 数据流问题分析

{{#if dataFlowAnalysis.dataFlowIssues.length}}
{{#each dataFlowAnalysis.dataFlowIssues}}
### {{@index}}.{{increment}}. {{issue}} {{#if (eq severity "critical")}}🔴{{else if (eq severity "high")}}🟠{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}  
**业务影响**: {{impact}}

#### 问题描述
{{description}}

#### 影响的数据流
{{#each affectedFlows}}
- {{this}}
{{/each}}

#### 解决建议
{{recommendation}}

---
{{/each}}
{{else}}
✅ **数据流健康**，未发现重大数据流问题。
{{/if}}

---

## 🚀 数据流优化建议

{{#each dataFlowAnalysis.optimizationOpportunities}}
### {{@index}}.{{increment}}. {{opportunity}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}  
**实施工作量**: {{implementationEffort}}

#### 优化描述
{{description}}

#### 预期收益
{{expectedBenefit}}

---
{{/each}}

---

## 📋 数据流优化行动计划

### 🔥 高优先级优化
{{#each dataFlowAnalysis.optimizationOpportunities}}
{{#if (eq priority "high")}}
- [ ] **{{opportunity}}**: {{description}}
{{/if}}
{{/each}}

### 🟡 中优先级优化
{{#each dataFlowAnalysis.optimizationOpportunities}}
{{#if (eq priority "medium")}}
- [ ] **{{opportunity}}**: {{description}}
{{/if}}
{{/each}}

### 🟢 长期规划
{{#each dataFlowAnalysis.optimizationOpportunities}}
{{#if (eq priority "low")}}
- [ ] **{{opportunity}}**: {{description}}
{{/if}}
{{/each}}

---

## 🔄 数据流程图

```mermaid
graph TD
    {{#each dataFlowAnalysis.dataInputs}}
    Input{{@index}}[{{source}}] --> 
    {{/each}}
    
    {{#each dataFlowAnalysis.dataFlows}}
    Flow{{@index}}[{{flowName}}]
    {{/each}}
    
    {{#each dataFlowAnalysis.dataOutputs}}
    --> Output{{@index}}[{{destination}}]
    {{/each}}
```

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [集成契约文档](./integration-contracts.md)
- [API规格文档](./api-specifications.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

请基于提供的数据流分析数据，生成清晰的数据流文档。