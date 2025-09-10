# {{projectName}} - 数据流向分析

## 🌊 数据流概览

**项目名称**: {{projectName}}  
**数据流总数**: {{totalDataFlows}}  
**数据节点数**: {{totalDataNodes}}  
**数据变换节点**: {{dataTransformNodes}}  
**数据存储点**: {{dataStoragePoints}}

## 📊 主要数据流图

### 🌊 系统级数据流

```mermaid
flowchart TD
{{systemLevelDataFlow}}
```

### 🔄 模块间数据流

```mermaid
flowchart LR
{{interModuleDataFlow}}
```

## 📈 数据流分类

### 🚀 输入数据流

| 数据源 | 数据类型 | 目标模块 | 处理方式 | 频率 | 重要性 |
|--------|----------|----------|----------|------|--------|
{{inputDataFlows}}

### 📤 输出数据流

| 源模块 | 数据类型 | 输出目标 | 格式转换 | 频率 | 重要性 |
|--------|----------|----------|----------|------|--------|
{{outputDataFlows}}

### 🔄 内部数据流

| 源模块 | 目标模块 | 数据类型 | 传递方式 | 延迟 | 重要性 |
|--------|----------|----------|----------|------|--------|
{{internalDataFlows}}

## 🏪 数据中心节点

### 🎯 数据汇聚点

{{#each dataAggregationPoints}}
#### 📊 {{nodeName}}

**位置**: `{{nodeLocation}}`  
**汇聚的数据流**: {{incomingFlowsCount}}个  
**数据类型**: {{dataTypes}}  
**处理能力**: {{processingCapacity}}  
**瓶颈风险**: {{bottleneckRisk}}

**输入数据流**:
{{incomingFlows}}

**输出数据流**:
{{outgoingFlows}}

**数据变换**: {{dataTransformations}}

---
{{/each}}

### 📡 数据分发点

{{#each dataDistributionPoints}}
#### 📤 {{nodeName}}

**位置**: `{{nodeLocation}}`  
**分发的数据流**: {{outgoingFlowsCount}}个  
**数据来源**: {{dataSources}}  
**分发策略**: {{distributionStrategy}}  
**性能特征**: {{performanceCharacteristics}}

**数据流向**:
{{flowDirections}}

---
{{/each}}

## 🔄 数据变换分析

### ⚙️ 数据变换节点

| 变换节点 | 位置 | 输入格式 | 输出格式 | 变换逻辑 | 性能影响 |
|----------|------|----------|----------|----------|----------|
{{dataTransformationNodes}}

### 📋 变换类型统计

| 变换类型 | 数量 | 占比 | 平均延迟 | 复杂度 |
|----------|------|------|----------|--------|
| 格式转换 | {{formatConversionCount}} | {{formatConversionPercent}} | {{formatConversionDelay}} | {{formatConversionComplexity}} |
| 数据清洗 | {{dataCleansningCount}} | {{dataCleansningPercent}} | {{dataCleansningDelay}} | {{dataCleansningComplexity}} |
| 聚合计算 | {{dataAggregationCount}} | {{dataAggregationPercent}} | {{dataAggregationDelay}} | {{dataAggregationComplexity}} |
| 筛选过滤 | {{dataFilteringCount}} | {{dataFilteringPercent}} | {{dataFilteringDelay}} | {{dataFilteringComplexity}} |
| 映射转换 | {{dataMappingCount}} | {{dataMappingPercent}} | {{dataMappingDelay}} | {{dataMappingComplexity}} |

## 📊 数据流量分析

### 📈 流量统计

| 数据流 | 源 | 目标 | 平均流量 | 峰值流量 | 流量模式 |
|--------|----|----- |----------|----------|----------|
{{dataFlowVolumeAnalysis}}

### 🔥 高流量路径

{{highVolumeFlows}}

### ⚡ 性能关键路径

{{performanceCriticalFlows}}

## 🗄️ 数据存储分析

### 💾 数据存储节点

| 存储节点 | 类型 | 存储的数据 | 访问模式 | 容量 | 性能特征 |
|----------|------|------------|----------|------|----------|
{{dataStorageNodes}}

### 📊 存储使用模式

{{storageUsagePatterns}}

## 📋 数据接口分析

### 🔌 数据接口清单

| 接口名称 | 类型 | 数据格式 | 调用频率 | 性能要求 | 稳定性 |
|----------|------|----------|----------|----------|--------|
{{dataInterfaces}}

### 🎯 关键数据接口

{{criticalDataInterfaces}}

## 🔍 数据流路径追踪

### 🚀 典型业务流程数据路径

{{#each businessFlowPaths}}
#### {{flowName}}

**业务场景**: {{businessScenario}}  
**数据路径**: {{dataPath}}  
**涉及模块**: {{involvedModules}}  
**处理时间**: {{processingTime}}

```mermaid
flowchart LR
{{flowDiagram}}
```

**关键节点**:
{{keyNodes}}

---
{{/each}}

### 🔄 数据生命周期

{{dataLifecycles}}

## ⚠️ 数据流风险分析

### 🚨 数据瓶颈识别

{{dataBottlenecks}}

### 💥 单点故障风险

{{dataFlowSinglePoints}}

### 🔒 数据安全风险

{{dataSecurityRisks}}

### 📊 数据质量风险

{{dataQualityRisks}}

## 📊 数据一致性分析

### 🔄 数据同步点

{{dataSynchronizationPoints}}

### ⚡ 数据竞态条件

{{dataRaceConditions}}

### 🔐 数据锁定机制

{{dataLockingMechanisms}}

## 💡 优化建议

### ⚡ 性能优化

{{performanceOptimizations}}

### 🏗️ 架构优化

{{architecturalOptimizations}}

### 🔄 数据流重构建议

{{dataFlowRefactoringRecommendations}}

### 📊 缓存策略建议

{{cachingStrategies}}

## 📋 详细数据流清单

{{#each detailedFlows}}
### {{flowId}}. {{sourceName}} → {{targetName}}

**数据类型**: {{dataType}}  
**传输方式**: {{transferMethod}}  
**频率**: {{frequency}}  
**延迟要求**: {{latencyRequirement}}  
**可靠性要求**: {{reliabilityRequirement}}

**数据结构**:
```{{dataFormat}}
{{dataStructure}}
```

**处理逻辑**: {{processingLogic}}  
**错误处理**: {{errorHandling}}  
**监控指标**: {{monitoringMetrics}}

---
{{/each}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**分析版本**: {{analysisVersion}}  
**数据完整性**: {{dataIntegrityScore}}