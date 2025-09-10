# {{projectName}} - 模块关联分析总览

## 🔍 关联分析概览

**项目名称**: {{projectName}}  
**分析完成时间**: {{analysisCompletedAt}}  
**模块总数**: {{totalModules}}  
**文件总数**: {{totalFiles}}  
**函数总数**: {{totalFunctions}}  
**关联关系总数**: {{totalRelationships}}

## 📊 关联强度总览图

### 🎯 整体关联关系图

```mermaid
graph TD
{{overallRelationshipDiagram}}
```

### 📈 关联强度分布

| 关联强度 | 关系数量 | 占比 | 描述 |
|----------|----------|------|------|
| 极强 (90-100) | {{extremelyStrongCount}} | {{extremelyStrongPercent}} | 高度耦合，需要重点关注 |
| 强 (70-89) | {{strongCount}} | {{strongPercent}} | 紧密关联，建议优化 |
| 中 (40-69) | {{moderateCount}} | {{moderatePercent}} | 正常关联 |
| 弱 (20-39) | {{weakCount}} | {{weakPercent}} | 松散关联 |
| 极弱 (1-19) | {{veryWeakCount}} | {{veryWeakPercent}} | 最小关联 |

## 🎯 关键发现摘要

### ⭐ 核心发现

{{keyFindings}}

### 🚨 重要警告

{{importantWarnings}}

### 💡 主要建议

{{mainRecommendations}}

## 📊 三维关联分析

### 🔗 函数调用维度

**总函数调用**: {{totalFunctionCalls}}  
**跨模块调用**: {{crossModuleFunctionCalls}}  
**高频函数**: {{highFrequencyFunctions}}  

**关键指标**:
- 最高调用频率: {{maxCallFrequency}} ({{mostCalledFunction}})
- 平均调用深度: {{averageCallDepth}}
- 检测到循环调用: {{circularCallsDetected}}

### 🏗️ 模块依赖维度

**总依赖关系**: {{totalDependencies}}  
**循环依赖**: {{circularDependencies}}  
**依赖层次深度**: {{dependencyDepth}}

**关键指标**:
- 最多被依赖模块: {{mostDependedModule}} (被{{maxDependencyCount}}个模块依赖)
- 最多依赖其他模块: {{mostDependentModule}} (依赖{{maxDependingCount}}个模块)
- 独立模块数量: {{independentModulesCount}}

### 🌊 数据流维度

**总数据流**: {{totalDataFlows}}  
**数据节点**: {{totalDataNodes}}  
**数据变换点**: {{dataTransformationPoints}}

**关键指标**:
- 最大数据汇聚点: {{maxDataAggregationPoint}} ({{maxAggregationCount}}个输入流)
- 关键数据路径: {{criticalDataPaths}}
- 数据瓶颈点: {{dataBottleneckCount}}个

## 🎯 关键节点识别

### ⭐ 系统核心节点 (Top 10)

| 排名 | 节点名称 | 类型 | 关联分数 | 重要性 | 风险级别 |
|------|----------|------|----------|--------|----------|
{{systemCoreNodes}}

### 🔀 关键连接点

{{criticalConnectionPoints}}

### 📡 服务提供节点

{{serviceProviderNodes}}

### 🏪 数据中心节点

{{dataCentralNodes}}

## ⚠️ 风险热点分析

### 🚨 高风险区域

{{#each highRiskAreas}}
#### 🔥 {{riskAreaName}}

**风险类型**: {{riskType}}  
**风险级别**: {{riskLevel}}  
**影响范围**: {{impactScope}}  
**涉及组件**: {{involvedComponents}}

**具体问题**:
{{specificIssues}}

**建议措施**:
{{recommendedActions}}

---
{{/each}}

### 💥 潜在故障点

{{potentialFailurePoints}}

### 🌊 级联风险分析

{{cascadeRiskAnalysis}}

## 📊 架构健康度评估

### 🎯 整体健康度指标

| 维度 | 得分 | 等级 | 状态 | 改进空间 |
|------|------|------|------|----------|
| 模块化程度 | {{modularityScore}} | {{modularityGrade}} | {{modularityStatus}} | {{modularityImprovement}} |
| 耦合度 | {{couplingScore}} | {{couplingGrade}} | {{couplingStatus}} | {{couplingImprovement}} |
| 内聚性 | {{cohesionScore}} | {{cohesionGrade}} | {{cohesionStatus}} | {{cohesionImprovement}} |
| 可维护性 | {{maintainabilityScore}} | {{maintainabilityGrade}} | {{maintainabilityStatus}} | {{maintainabilityImprovement}} |
| 可扩展性 | {{scalabilityScore}} | {{scalabilityGrade}} | {{scalabilityStatus}} | {{scalabilityImprovement}} |
| **综合评分** | **{{overallScore}}** | **{{overallGrade}}** | **{{overallStatus}}** | **{{overallImprovement}}** |

### 📈 架构成熟度

{{architecturalMaturity}}

## 🎨 架构模式分析

### 🏛️ 识别的架构模式

{{detectedArchitecturalPatterns}}

### 🎭 设计模式使用情况

{{designPatternUsage}}

### 🏗️ 推荐架构模式

{{recommendedArchitecturalPatterns}}

## 📊 关联关系统计

### 📈 按类型分类

| 关联类型 | 数量 | 占比 | 平均强度 | 主要特征 |
|----------|------|------|----------|----------|
| 函数调用关系 | {{functionCallRelationsCount}} | {{functionCallRelationsPercent}} | {{functionCallRelationsStrength}} | {{functionCallRelationsCharacteristics}} |
| 模块依赖关系 | {{moduleDependencyRelationsCount}} | {{moduleDependencyRelationsPercent}} | {{moduleDependencyRelationsStrength}} | {{moduleDependencyRelationsCharacteristics}} |
| 数据流关系 | {{dataFlowRelationsCount}} | {{dataFlowRelationsPercent}} | {{dataFlowRelationsStrength}} | {{dataFlowRelationsCharacteristics}} |
| 接口关系 | {{interfaceRelationsCount}} | {{interfaceRelationsPercent}} | {{interfaceRelationsStrength}} | {{interfaceRelationsCharacteristics}} |
| 继承关系 | {{inheritanceRelationsCount}} | {{inheritanceRelationsPercent}} | {{inheritanceRelationsStrength}} | {{inheritanceRelationsCharacteristics}} |

### 📊 按模块分组

{{#each moduleRelationStats}}
#### 📦 {{moduleName}}

- **对外关系**: {{outgoingRelationsCount}}个
- **对内关系**: {{incomingRelationsCount}}个
- **关联强度**: {{averageRelationStrength}}
- **核心度**: {{centralityScore}}
- **重要性**: {{importanceScore}}

{{/each}}

## 🔮 影响分析预测

### 🎯 变更影响预测

{{changeImpactPredictions}}

### 🔄 重构影响评估

{{refactoringImpactAssessments}}

### 📈 演进趋势分析

{{evolutionTrendAnalysis}}

## 💡 综合优化建议

### 🏗️ 架构重构优先级

| 优先级 | 重构项目 | 预期收益 | 实施难度 | 风险评估 | 建议时间 |
|--------|----------|----------|----------|----------|----------|
{{refactoringPriorities}}

### ⚡ 性能优化建议

{{performanceOptimizationSuggestions}}

### 🔧 解耦策略

{{decouplingStrategies}}

### 📊 监控建议

{{monitoringRecommendations}}

## 📋 详细分析报告链接

### 📞 [函数调用关系分析](./function-calls.md)
{{functionCallsReportSummary}}

### 🏗️ [模块依赖关系分析](./module-dependencies.md)
{{moduleDependenciesReportSummary}}

### 🌊 [数据流向分析](./data-flows.md)
{{dataFlowsReportSummary}}

## 📊 质量度量

### 📈 关键质量指标

| 指标 | 当前值 | 目标值 | 状态 | 改进计划 |
|------|--------|--------|------|----------|
| 平均耦合度 | {{avgCoupling}} | {{targetCoupling}} | {{couplingStatus}} | {{couplingPlan}} |
| 模块内聚度 | {{avgCohesion}} | {{targetCohesion}} | {{cohesionStatus}} | {{cohesionPlan}} |
| 圈复杂度 | {{avgComplexity}} | {{targetComplexity}} | {{complexityStatus}} | {{complexityPlan}} |
| 测试覆盖率 | {{testCoverage}} | {{targetCoverage}} | {{coverageStatus}} | {{coveragePlan}} |

### 🎯 质量改进路线图

{{qualityImprovementRoadmap}}

## 📝 结论与后续行动

### 📊 总体评估

{{overallAssessment}}

### 🎯 优先行动项

{{priorityActions}}

### 📅 建议时间表

{{recommendedTimeline}}

### 🔍 持续监控建议

{{continuousMonitoringSuggestions}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**分析师**: {{analystName}}  
**报告版本**: {{reportVersion}}  
**有效期**: {{reportValidUntil}}