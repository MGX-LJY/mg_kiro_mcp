# 模块关联分析报告

## 🔗 关联分析概述

**分析范围**: {{analysisScope}}  
**模块总数**: {{totalModules}}  
**文件总数**: {{totalFiles}}  
**函数总数**: {{totalFunctions}}  
**分析深度**: {{analysisDepth}}

## 📊 函数调用关系分析

### 🔥 高频被调用函数 (Top 10)

| 排名 | 函数名 | 被调用次数 | 调用模块数 | 重要性评级 |
|------|--------|------------|------------|------------|
{{highFrequencyFunctions}}

### 📞 跨模块函数调用矩阵

```mermaid
graph TD
{{crossModuleCalls}}
```

### 🎯 核心工具函数

{{coreUtilityFunctions}}

### 🔌 重要接口函数

{{importantInterfaces}}

## 🏗️ 模块依赖关系分析

### 📈 依赖强度矩阵

| 源模块 | 目标模块 | 依赖强度 | 依赖类型 | 风险评级 |
|--------|----------|----------|----------|----------|
{{dependencyMatrix}}

### 🔄 循环依赖检测

{{circularDependencies}}

### 📦 模块耦合度分析

```mermaid
graph LR
{{modulesCouplingDiagram}}
```

### 🎭 依赖层次结构

```
{{dependencyHierarchy}}
```

## 📈 数据流向分析

### 🌊 主要数据流

```mermaid
flowchart TD
{{mainDataFlows}}
```

### 📋 数据传递链路

{{dataTransferChains}}

### 🏪 数据中心节点

{{dataCentralNodes}}

### 🔄 数据变换节点

{{dataTransformationNodes}}

## 🔍 关键节点分析

### ⭐ 系统核心节点

{{systemCoreNodes}}

### 🚪 接口边界节点

{{interfaceBoundaryNodes}}

### 🔀 数据汇聚节点

{{dataAggregationNodes}}

### 📡 服务提供节点

{{serviceProviderNodes}}

## 🎯 调用链路分析

### 🚀 启动调用链

{{bootupCallChain}}

### 🔄 关键业务流程链

{{criticalBusinessFlows}}

### ⚡ 性能关键路径

{{performanceCriticalPaths}}

## ⚠️ 风险热点识别

### 🚨 高风险依赖

{{highRiskDependencies}}

### 🕷️ 过度耦合点

{{tightCouplingPoints}}

### 🔥 单点故障风险

{{singlePointFailures}}

### 🌊 雪崩风险点

{{avalancheRisks}}

## 📊 关联度统计

### 📈 模块间关联强度分布

{{relationshipStrengthDistribution}}

### 🎯 函数调用频率分布

{{functionCallFrequencyDistribution}}

### 🔗 依赖深度统计

{{dependencyDepthStats}}

## 🎨 架构模式识别

### 🏛️ 检测到的架构模式

{{detectedArchitecturalPatterns}}

### 🎭 设计模式使用

{{designPatternUsage}}

### 🏗️ 分层架构分析

{{layeredArchitectureAnalysis}}

## 💡 优化建议

### 🔧 解耦建议

{{decouplingRecommendations}}

### ⚡ 性能优化建议

{{performanceOptimizationRecommendations}}

### 🏗️ 架构重构建议

{{architecturalRefactoringRecommendations}}

### 🛡️ 风险缓解建议

{{riskMitigationRecommendations}}

## 📋 关联关系清单

### 📞 所有函数调用关系

{{allFunctionCalls}}

### 📦 所有模块依赖关系

{{allModuleDependencies}}

### 📊 所有数据流关系

{{allDataFlows}}

## 🔮 影响分析

### 🎯 变更影响范围预测

{{changeImpactPrediction}}

### 🔄 重构影响评估

{{refactoringImpactAssessment}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**分析版本**: {{analysisVersion}}  
**置信度**: {{confidenceLevel}}