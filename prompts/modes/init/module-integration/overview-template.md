# {{projectName}} - 模块总览

## 📦 模块系统概述

**项目名称**: {{projectName}}  
**模块总数**: {{totalModules}}  
**文件总数**: {{totalFiles}}  
**代码总行数**: {{totalLines}}  
**主要编程语言**: {{primaryLanguage}}

## 🏗️ 模块架构图

```mermaid
graph TD
{{moduleArchitectureDiagram}}
```

## 📊 模块分类

### 🎯 核心业务模块

| 模块名称 | 文件数量 | 主要功能 | 重要性 | 状态 |
|---------|----------|----------|--------|------|
{{coreModules}}

### 🛠️ 服务支持模块

| 模块名称 | 文件数量 | 主要功能 | 重要性 | 状态 |
|---------|----------|----------|--------|------|
{{serviceModules}}

### ⚙️ 基础设施模块

| 模块名称 | 文件数量 | 主要功能 | 重要性 | 状态 |
|---------|----------|----------|--------|------|
{{infrastructureModules}}

### 🧪 测试工具模块

| 模块名称 | 文件数量 | 主要功能 | 重要性 | 状态 |
|---------|----------|----------|--------|------|
{{testingModules}}

## 🔗 模块依赖关系

### 📈 依赖强度矩阵

```mermaid
graph LR
{{dependencyMatrix}}
```

### 🔄 模块层次结构

```
{{moduleHierarchy}}
```

## 📋 模块详细信息

{{#each modules}}
### 📦 {{name}} 模块

**类型**: {{type}}  
**路径**: `{{path}}`  
**文件数量**: {{fileCount}}  
**代码行数**: {{lineCount}}  

#### 🎯 主要职责
{{responsibilities}}

#### 📂 包含文件
{{files}}

#### 🔗 对外接口
{{publicInterfaces}}

#### 📊 依赖关系
- **依赖的模块**: {{dependencies}}
- **被依赖情况**: {{dependents}}

#### 💡 设计特点
{{designFeatures}}

---

{{/each}}

## 📊 模块统计分析

### 📈 规模分布

| 规模类别 | 模块数量 | 占比 | 平均文件数 |
|---------|----------|------|------------|
| 大型 (>20文件) | {{largeModulesCount}} | {{largeModulesPercent}} | {{largeModulesAvgFiles}} |
| 中型 (5-20文件) | {{mediumModulesCount}} | {{mediumModulesPercent}} | {{mediumModulesAvgFiles}} |
| 小型 (<5文件) | {{smallModulesCount}} | {{smallModulesPercent}} | {{smallModulesAvgFiles}} |

### 🔗 耦合度分析

| 耦合级别 | 模块数量 | 描述 |
|----------|----------|------|
| 高耦合 | {{highCouplingCount}} | 依赖或被依赖超过5个模块 |
| 中耦合 | {{mediumCouplingCount}} | 依赖或被依赖2-5个模块 |
| 低耦合 | {{lowCouplingCount}} | 依赖或被依赖1-2个模块 |
| 独立 | {{isolatedCount}} | 无外部依赖关系 |

### ⭐ 重要性评级

| 重要性 | 模块数量 | 评判标准 |
|--------|----------|----------|
| 核心 ⭐⭐⭐ | {{coreImportanceCount}} | 业务核心逻辑，被多个模块依赖 |
| 重要 ⭐⭐ | {{importantCount}} | 关键功能实现，有一定依赖关系 |
| 普通 ⭐ | {{normalCount}} | 辅助功能，依赖关系简单 |

## 🎯 模块质量评估

### 📊 质量指标

| 指标 | 优秀 | 良好 | 一般 | 需改进 |
|------|------|------|------|--------|
| 内聚性 | {{highCohesionCount}} | {{goodCohesionCount}} | {{avgCohesionCount}} | {{lowCohesionCount}} |
| 可维护性 | {{highMaintainabilityCount}} | {{goodMaintainabilityCount}} | {{avgMaintainabilityCount}} | {{lowMaintainabilityCount}} |
| 可测试性 | {{highTestabilityCount}} | {{goodTestabilityCount}} | {{avgTestabilityCount}} | {{lowTestabilityCount}} |

### 🔍 问题识别

#### ⚠️ 需要关注的模块
{{modulesToWatch}}

#### 🚨 高风险模块
{{highRiskModules}}

#### 💡 优化建议
{{optimizationSuggestions}}

## 🚀 模块演进建议

### 📈 扩展计划
{{expansionPlans}}

### 🔄 重构建议
{{refactoringRecommendations}}

### 🗂️ 拆分建议
{{splittingRecommendations}}

### 🔗 整合建议
{{integrationRecommendations}}

## 📝 模块开发指南

### 🎯 新模块开发原则
{{newModulePrinciples}}

### 🔧 模块命名规范
{{moduleNamingConvention}}

### 📋 模块结构模板
{{moduleStructureTemplate}}

### 🧪 模块测试要求
{{moduleTestingRequirements}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**文档版本**: {{documentVersion}}  
**下次更新建议**: {{nextUpdateRecommendation}}