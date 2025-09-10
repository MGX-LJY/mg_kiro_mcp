# {{projectName}} - 函数调用关系分析

## 🔍 函数调用关系概览

**项目名称**: {{projectName}}  
**分析范围**: {{analysisScope}}  
**函数总数**: {{totalFunctions}}  
**跨模块调用**: {{crossModuleCalls}}  
**分析深度**: {{analysisDepth}}

## 🔥 高频被调用函数 (Top 20)

| 排名 | 函数名 | 定义位置 | 被调用次数 | 调用模块数 | 重要性评级 |
|------|--------|----------|------------|------------|------------|
{{highFrequencyFunctions}}

## 📊 函数调用统计

### 📈 调用频率分布

```mermaid
graph LR
{{callFrequencyDistribution}}
```

### 🎯 关键指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 总函数数 | {{totalFunctions}} | 项目中定义的所有函数 |
| 跨模块调用数 | {{crossModuleCallsCount}} | 跨模块边界的函数调用 |
| 平均被调用次数 | {{avgCallCount}} | 每个函数平均被调用次数 |
| 最大调用深度 | {{maxCallDepth}} | 最深的函数调用链 |
| 循环调用检测 | {{circularCallsCount}} | 检测到的循环调用 |

## 🔗 跨模块函数调用矩阵

### 📞 模块间调用关系

| 源模块 | 目标模块 | 调用函数数 | 调用次数 | 主要调用的函数 |
|--------|----------|------------|----------|----------------|
{{crossModuleCallMatrix}}

### 🎯 模块调用强度图

```mermaid
graph TD
{{moduleCallIntensityDiagram}}
```

## 🌟 核心工具函数

### 🛠️ 通用工具函数

| 函数名 | 定义位置 | 功能描述 | 被调用次数 | 依赖模块 |
|--------|----------|----------|------------|----------|
{{utilityFunctions}}

### 🔌 关键接口函数

| 函数名 | 定义位置 | 接口类型 | 被调用次数 | 重要性 |
|--------|----------|----------|------------|--------|
{{interfaceFunctions}}

### ⚡ 性能关键函数

| 函数名 | 定义位置 | 性能特征 | 被调用次数 | 优化建议 |
|--------|----------|----------|------------|----------|
{{performanceCriticalFunctions}}

## 🔄 函数调用链路分析

### 🚀 启动调用链

```mermaid
graph TD
{{bootupCallChain}}
```

### 🔄 主要业务流程链

{{majorBusinessFlows}}

### ⚡ 性能关键路径

{{performanceCriticalPaths}}

## 📊 详细调用关系

### 🔍 按模块分类的函数调用

{{#each modules}}
#### 📦 {{moduleName}} 模块

**对外提供的函数**:
{{publicFunctions}}

**调用其他模块的函数**:
{{externalCalls}}

**内部函数调用**:
{{internalCalls}}

---
{{/each}}

## ⚠️ 问题识别

### 🚨 过度被调用的函数

{{overCalledFunctions}}

### 🕷️ 高耦合函数

{{tightlyCoupledFunctions}}

### 🔄 循环调用检测

{{circularCallDetection}}

### 💀 死代码识别

{{deadCodeFunctions}}

## 🎯 调用模式分析

### 📈 设计模式识别

{{detectedPatterns}}

### 🏗️ 架构模式

{{architecturalPatterns}}

### 🔀 回调模式

{{callbackPatterns}}

## 💡 优化建议

### 🔧 解耦建议

{{decouplingRecommendations}}

### ⚡ 性能优化建议

{{performanceOptimizations}}

### 🏗️ 重构建议

{{refactoringRecommendations}}

## 📋 完整函数调用清单

{{#each functionCalls}}
### {{callerFunction}} → {{calleeFunction}}
- **调用位置**: `{{callLocation}}`
- **调用次数**: {{callCount}}
- **调用类型**: {{callType}}
- **参数传递**: {{parameterPassing}}

{{/each}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**分析版本**: {{analysisVersion}}  
**置信度**: {{confidenceLevel}}