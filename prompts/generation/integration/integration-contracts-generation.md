# 集成契约文档生成模板

你是一个系统集成文档专家。请基于集成契约分析结果生成完整的集成契约文档。

## 输入数据
**集成分析结果**: {{integrationAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`integration-contracts.md`文档，包括：
1. 集成概览与统计
2. 模块关系图谱
3. API契约规范
4. 数据流文档
5. 外部依赖清单
6. 风险评估报告
7. 优化建议
8. 监控和测试策略

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 集成契约文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**项目语言**: {{projectInfo.language}}  
**复杂度评分**: {{integrationAnalysis.integrationAnalysis.summary.complexityScore}}/100  
**健康度评分**: {{integrationAnalysis.integrationAnalysis.summary.healthScore}}/100

---

## 📊 集成概览

### 统计摘要
- **模块总数**: {{integrationAnalysis.integrationAnalysis.summary.totalModules}}
- **关系总数**: {{integrationAnalysis.integrationAnalysis.summary.totalRelations}}
- **集成点数量**: {{integrationAnalysis.integrationAnalysis.summary.integrationPoints}}
- **API契约数量**: {{integrationAnalysis.integrationAnalysis.summary.apiContracts}}
- **数据流数量**: {{integrationAnalysis.integrationAnalysis.summary.dataFlows}}
- **外部依赖数量**: {{integrationAnalysis.integrationAnalysis.summary.externalDependencies}}

### 健康度指标
| 指标 | 评分 | 状态 |
|------|------|------|
| 整体复杂度 | {{integrationAnalysis.integrationAnalysis.summary.complexityScore}}/100 | {{#if (lte integrationAnalysis.integrationAnalysis.summary.complexityScore 50)}}🟢 良好{{else if (lte integrationAnalysis.integrationAnalysis.summary.complexityScore 75)}}🟡 中等{{else}}🔴 复杂{{/if}} |
| 系统健康度 | {{integrationAnalysis.integrationAnalysis.summary.healthScore}}/100 | {{#if (gte integrationAnalysis.integrationAnalysis.summary.healthScore 80)}}🟢 健康{{else if (gte integrationAnalysis.integrationAnalysis.summary.healthScore 60)}}🟡 一般{{else}}🔴 需关注{{/if}} |
| 整体风险 | {{integrationAnalysis.riskAssessment.overallRiskScore}}/100 | {{#if (lte integrationAnalysis.riskAssessment.overallRiskScore 30)}}🟢 低风险{{else if (lte integrationAnalysis.riskAssessment.overallRiskScore 60)}}🟡 中风险{{else}}🔴 高风险{{/if}} |

---

## 🔗 模块关系图谱

### 核心模块关系

{{#each integrationAnalysis.integrationAnalysis.moduleRelations}}
#### {{@index}}.{{increment}}. {{source}} → {{target}}

**关系类型**: {{relationType}}  
**关系强度**: {{strength}} {{#if (eq strength "strong")}}🔴{{else if (eq strength "medium")}}🟡{{else}}🟢{{/if}}  
**关键程度**: {{criticality}} {{#if (eq criticality "critical")}}⚠️{{else if (eq criticality "high")}}🔸{{else}}🔹{{/if}}

**关系描述**: {{description}}

{{#if dataContract}}
**数据契约**: `{{dataContract}}`
{{/if}}

{{#if frequency}}
**调用频率**: {{frequency}}
{{/if}}

---
{{/each}}

## 📋 API契约规范

{{#each integrationAnalysis.integrationAnalysis.apiContracts}}
### {{@index}}.{{increment}}. {{contractId}}

**服务提供方**: `{{provider}}`  
**服务使用方**: `{{consumer}}`

#### 🔌 接口定义
```
{{interface}}
```

#### 📤 数据格式
**格式**: {{dataFormat}}

{{#if parameters.length}}
**参数列表**:
{{#each parameters}}
- `{{this}}`
{{/each}}
{{/if}}

**返回类型**: `{{returnType}}`

#### 🛡️ 错误处理
{{errorHandling}}

#### 🔄 版本兼容性
{{versionCompatibility}}

{{#if performanceRequirements}}
#### ⚡ 性能要求
{{performanceRequirements}}
{{/if}}

{{#if protocols.length}}
#### 📡 通信协议
{{#each protocols}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}

## 🌊 数据流文档

{{#each integrationAnalysis.integrationAnalysis.dataFlows}}
### {{@index}}.{{increment}}. {{flowId}}

**数据源**: `{{source}}`  
**数据目标**: `{{destination}}`  
**数据类型**: {{dataType}}  
**数据量级**: {{volume}}  
**流动频率**: {{frequency}}

#### 🔄 数据转换流程
{{#each transformations}}
{{@index}}.{{increment}}. {{this}}
{{/each}}

#### 🏭 处理节点
{{#each processingNodes}}
- `{{this}}`
{{/each}}

#### 💾 持久化方式
{{persistence}}

{{#if validation}}
#### ✅ 数据验证规则
{{validation}}
{{/if}}

---
{{/each}}

## 📦 外部依赖清单

### 关键依赖

{{#each integrationAnalysis.integrationAnalysis.externalDependencies}}
#### {{@index}}.{{increment}}. {{dependencyName}} {{#if (eq criticalityLevel "critical")}}⚠️{{else if (eq criticalityLevel "high")}}🔸{{else}}🔹{{/if}}

**类型**: {{type}}  
**版本**: {{version}}  
**关键程度**: {{criticalityLevel}}

**使用目的**: {{purpose}}

{{#if alternatives.length}}
**替代方案**:
{{#each alternatives}}
- {{this}}
{{/each}}
{{/if}}

**风险评估**: {{risksAssessment}}

{{#if licenseInfo}}
**许可证**: {{licenseInfo}}
{{/if}}

**更新频率**: {{updateFrequency}}

---
{{/each}}

## ⚠️ 风险评估报告

### 🔴 高风险项目

{{#each integrationAnalysis.riskAssessment.highRisks}}
#### {{@index}}.{{increment}}. {{risk}}

**影响模块**: {{#each affectedModules}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}  
**发生概率**: {{probability}}  
**严重程度**: {{severity}}

**影响描述**: {{impact}}

**缓解措施**: {{mitigation}}

**预防建议**: {{prevention}}

---
{{/each}}

### 🟡 中等风险项目

{{#each integrationAnalysis.riskAssessment.mediumRisks}}
- {{this}}
{{/each}}

### 🟢 低风险项目

{{#each integrationAnalysis.riskAssessment.lowRisks}}
- {{this}}
{{/each}}

**整体风险评分**: {{integrationAnalysis.riskAssessment.overallRiskScore}}/100

---

## 🏗️ 架构洞察

{{#with integrationAnalysis.architecturalInsights}}
### 耦合度分析
**耦合度评分**: {{couplingAnalysis.couplingScore}}/100

{{#if couplingAnalysis.tightlyCoupled.length}}
**紧耦合模块对**:
{{#each couplingAnalysis.tightlyCoupled}}
- {{this}}
{{/each}}
{{/if}}

{{#if couplingAnalysis.looselyCoupled.length}}
**松耦合模块对**:
{{#each couplingAnalysis.looselyCoupled}}
- {{this}}
{{/each}}
{{/if}}

### 内聚度分析
**内聚度评分**: {{cohesionAnalysis.cohesionScore}}/100

{{#if cohesionAnalysis.highCohesion.length}}
**高内聚模块**:
{{#each cohesionAnalysis.highCohesion}}
- `{{this}}`
{{/each}}
{{/if}}

{{#if cohesionAnalysis.lowCohesion.length}}
**低内聚模块**:
{{#each cohesionAnalysis.lowCohesion}}
- `{{this}}`
{{/each}}
{{/if}}

### 分层分析
**分层清晰度**: {{layeringAnalysis.layeringScore}}/100

{{#if layeringAnalysis.layers.length}}
**识别的架构层次**:
{{#each layeringAnalysis.layers}}
{{@index}}.{{increment}}. {{this}}
{{/each}}
{{/if}}

{{#if layeringAnalysis.layerViolations.length}}
**层次违反情况**:
{{#each layeringAnalysis.layerViolations}}
- ⚠️ {{this}}
{{/each}}
{{/if}}
{{/with}}

---

## 💡 优化建议

{{#each integrationAnalysis.optimizationRecommendations}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}

#### 建议内容
{{recommendation}}

#### 影响组件
{{#each affectedComponents}}
- `{{this}}`
{{/each}}

#### 预期收益
{{expectedBenefit}}

#### 实施工作量
{{implementationEffort}}

{{#if prerequisites.length}}
#### 前置条件
{{#each prerequisites}}
- {{this}}
{{/each}}
{{/if}}

#### 建议时间线
{{timeline}}

{{#if successMetrics.length}}
#### 成功指标
{{#each successMetrics}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}

## 📊 监控建议

{{#each integrationAnalysis.monitoringRecommendations}}
### {{@index}}.{{increment}}. {{metric}}

**监控目的**: {{purpose}}  
**实施方式**: {{implementation}}  
**监控频率**: {{frequency}}

**告警阈值**: {{alertThresholds}}

---
{{/each}}

## 🧪 测试策略

{{#with integrationAnalysis.testingStrategy}}
### 集成测试建议
{{#each integrationTests}}
- {{this}}
{{/each}}

### 契约测试建议
{{#each contractTests}}
- {{this}}
{{/each}}

### 端到端测试建议
{{#each e2eTests}}
- {{this}}
{{/each}}

### 性能测试建议
{{#each performanceTests}}
- {{this}}
{{/each}}

### 测试优先级
{{#each testPriorities}}
{{@index}}.{{increment}}. {{this}}
{{/each}}
{{/with}}

---

## 🎯 行动计划

基于风险评估和优化建议，推荐以下行动优先级：

### 🚨 紧急处理 (高风险高优先级)
{{#each integrationAnalysis.optimizationRecommendations}}
{{#if (and (eq priority "high") (gt ../riskAssessment.overallRiskScore 70))}}
- [ ] {{recommendation}}
{{/if}}
{{/each}}

### 🔥 优先实施 (高优先级)
{{#each integrationAnalysis.optimizationRecommendations}}
{{#if (eq priority "high")}}
- [ ] {{recommendation}}
{{/if}}
{{/each}}

### 🟡 中期规划 (中优先级)
{{#each integrationAnalysis.optimizationRecommendations}}
{{#if (eq priority "medium")}}
- [ ] {{recommendation}}
{{/if}}
{{/each}}

### 🟢 长期优化 (低优先级)
{{#each integrationAnalysis.optimizationRecommendations}}
{{#if (eq priority "low")}}
- [ ] {{recommendation}}
{{/if}}
{{/each}}

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [模块目录文档](./modules-catalog.md)
- [开发规范文档](./development-guidelines.md)
- [API文档](./api-documentation.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*下次更新建议: 项目重大架构变更后或每季度更新*
```

## 生成指南

### 数据处理
- 自动计算集成统计信息
- 智能识别关键集成点
- 生成风险优先级排序
- 提供可执行的改进建议

### 格式优化  
- 使用清晰的视觉层次
- 添加状态指示图标和颜色
- 确保表格和代码块格式正确
- 提供可追踪的行动计划

### 质量保证
- 验证所有分析数据的完整性
- 检查建议的可操作性
- 确保风险评估的准确性
- 提供具体的实施指导

请基于提供的集成分析数据，生成完整且实用的集成契约文档。