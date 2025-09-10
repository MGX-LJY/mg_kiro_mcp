# {{projectName}} - 模块依赖关系分析

## 🏗️ 模块依赖概览

**项目名称**: {{projectName}}  
**模块总数**: {{totalModules}}  
**依赖关系总数**: {{totalDependencies}}  
**最大依赖深度**: {{maxDependencyDepth}}  
**循环依赖检测**: {{circularDependenciesCount}}

## 📊 依赖强度矩阵

### 🔗 模块间依赖关系表

| 源模块 | 目标模块 | 依赖强度 | 依赖类型 | 风险评级 | 解耦建议 |
|--------|----------|----------|----------|----------|----------|
{{dependencyMatrix}}

### 📈 依赖强度等级说明

| 强度级别 | 分数范围 | 描述 | 建议措施 |
|----------|----------|------|----------|
| 🔥 极强 | 90-100 | 高度耦合，难以独立 | 立即重构 |
| ⚡ 强 | 70-89 | 紧密耦合，有依赖风险 | 计划解耦 |
| 🟡 中 | 40-69 | 正常依赖关系 | 保持监控 |
| 🟢 弱 | 20-39 | 松散依赖 | 良好状态 |
| ⚪ 微弱 | 1-19 | 最小依赖 | 理想状态 |

## 🎯 模块依赖层次图

### 📊 分层架构视图

```mermaid
graph TB
{{layeredArchitectureView}}
```

### 🔄 模块调用关系图

```mermaid
graph LR
{{moduleCallGraph}}
```

## 🚨 循环依赖分析

### ⚠️ 检测到的循环依赖

{{#each circularDependencies}}
#### 循环依赖 #{{index}}

**涉及模块**: {{involvedModules}}  
**循环路径**: {{circularPath}}  
**风险评级**: {{riskLevel}}  
**影响范围**: {{impactScope}}

**建议解决方案**:
{{resolutionSuggestions}}

---
{{/each}}

### 📈 循环依赖统计

| 指标 | 数值 | 说明 |
|------|------|------|
| 循环依赖数量 | {{circularDependenciesCount}} | 检测到的循环依赖总数 |
| 涉及模块数 | {{involvedModulesCount}} | 参与循环依赖的模块数 |
| 平均循环长度 | {{avgCircularLength}} | 平均循环依赖路径长度 |
| 最长循环路径 | {{maxCircularLength}} | 最长的循环依赖链 |

## 📊 模块依赖统计

### 🔢 依赖数量分布

| 依赖数量范围 | 模块数量 | 占比 | 代表模块 |
|-------------|----------|------|----------|
| 依赖>10个模块 | {{heavyDependentCount}} | {{heavyDependentPercent}} | {{heavyDependentExamples}} |
| 依赖5-10个模块 | {{moderateDependentCount}} | {{moderateDependentPercent}} | {{moderateDependentExamples}} |
| 依赖1-5个模块 | {{lightDependentCount}} | {{lightDependentPercent}} | {{lightDependentExamples}} |
| 无外部依赖 | {{independentCount}} | {{independentPercent}} | {{independentExamples}} |

### 📈 被依赖数量分布

| 被依赖数量范围 | 模块数量 | 占比 | 代表模块 |
|---------------|----------|------|----------|
| 被>10个模块依赖 | {{heavyDependedCount}} | {{heavyDependedPercent}} | {{heavyDependedExamples}} |
| 被5-10个模块依赖 | {{moderateDependedCount}} | {{moderateDependedPercent}} | {{moderateDependedExamples}} |
| 被1-5个模块依赖 | {{lightDependedCount}} | {{lightDependedPercent}} | {{lightDependedExamples}} |
| 不被其他模块依赖 | {{isolatedCount}} | {{isolatedPercent}} | {{isolatedExamples}} |

## 🎯 关键模块识别

### ⭐ 核心模块 (高依赖性)

| 模块名 | 被依赖数 | 依赖数 | 重要性评分 | 风险评估 |
|--------|----------|--------|------------|----------|
{{coreModules}}

### 🔌 服务模块 (高提供性)

| 模块名 | 被依赖数 | 提供服务数 | 稳定性评分 | 建议 |
|--------|----------|------------|------------|------|
{{serviceModules}}

### 🔧 工具模块 (高独立性)

| 模块名 | 被依赖数 | 依赖数 | 独立性评分 | 复用建议 |
|--------|----------|--------|------------|----------|
{{utilityModules}}

## 🏗️ 依赖类型分析

### 📋 依赖类型统计

| 依赖类型 | 数量 | 占比 | 描述 | 风险级别 |
|----------|------|------|------|----------|
| 直接导入 | {{directImportCount}} | {{directImportPercent}} | 显式import/require | 低 |
| 动态加载 | {{dynamicLoadCount}} | {{dynamicLoadPercent}} | 运行时加载 | 中 |
| 全局引用 | {{globalRefCount}} | {{globalRefPercent}} | 全局变量引用 | 高 |
| 配置依赖 | {{configDepCount}} | {{configDepPercent}} | 配置文件依赖 | 中 |
| 服务调用 | {{serviceCallCount}} | {{serviceCallPercent}} | 服务接口调用 | 中 |

## 📈 依赖演进分析

### 🔄 依赖变化趋势

{{dependencyTrends}}

### 📊 模块成熟度评估

| 模块名 | 成熟度评分 | 稳定性 | 变更频率 | 建议 |
|--------|------------|--------|----------|------|
{{moduleMaturityAssessment}}

## ⚠️ 风险评估

### 🚨 高风险依赖

{{highRiskDependencies}}

### 💥 单点故障风险

{{singlePointFailures}}

### 🌊 级联故障风险

{{cascadeFailureRisks}}

## 💡 优化建议

### 🔧 依赖解耦策略

{{decouplingStrategies}}

### 🏗️ 架构重构建议

{{architecturalRefactoring}}

### 📦 模块拆分建议

{{moduleSplittingRecommendations}}

### 🔗 接口设计改进

{{interfaceDesignImprovements}}

## 📋 详细依赖清单

### 🔍 按模块分类的依赖关系

{{#each modules}}
#### 📦 {{moduleName}} 模块

**对外依赖** ({{externalDependenciesCount}}个):
{{externalDependencies}}

**被依赖情况** (被{{dependentModulesCount}}个模块依赖):
{{dependentModules}}

**依赖强度分析**:
- 最强依赖: {{strongestDependency}}
- 最弱依赖: {{weakestDependency}}
- 平均强度: {{averageDependencyStrength}}

---
{{/each}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**分析版本**: {{analysisVersion}}  
**数据完整性**: {{dataIntegrityScore}}