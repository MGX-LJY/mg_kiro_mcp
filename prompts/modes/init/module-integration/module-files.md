# {{moduleName}} - 模块文件清单

## 📂 模块信息

**模块名称**: {{moduleName}}  
**模块路径**: `{{modulePath}}`  
**文件总数**: {{totalFiles}}  
**代码总行数**: {{totalLines}}  
**最后更新**: {{lastUpdated}}

## 📋 文件列表

### 🎯 入口文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{entryFiles}}

### 🔧 核心实现文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{coreFiles}}

### 🛠️ 工具辅助文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{utilityFiles}}

### ⚙️ 配置文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{configFiles}}

### 🧪 测试文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{testFiles}}

### 📄 其他文件

| 文件名 | 路径 | 大小 | 行数 | 主要功能 |
|--------|------|------|------|----------|
{{otherFiles}}

## 🔗 文件依赖关系

### 📥 内部导入关系

```mermaid
graph TD
{{internalImports}}
```

### 📤 对外导出

{{externalExports}}

## 📊 文件统计分析

### 📈 文件大小分布

| 大小范围 | 文件数量 | 占比 | 示例文件 |
|----------|----------|------|----------|
| > 1000行 | {{largeFilesCount}} | {{largeFilesPercent}} | {{largeFilesExamples}} |
| 500-1000行 | {{mediumFilesCount}} | {{mediumFilesPercent}} | {{mediumFilesExamples}} |
| 100-500行 | {{normalFilesCount}} | {{normalFilesPercent}} | {{normalFilesExamples}} |
| < 100行 | {{smallFilesCount}} | {{smallFilesPercent}} | {{smallFilesExamples}} |

### 📋 文件类型分布

{{fileTypeDistribution}}

### 🔍 复杂度分析

| 文件名 | 圈复杂度 | 维护难度 | 重要性 |
|--------|----------|----------|--------|
{{complexityAnalysis}}

## 🎯 关键文件识别

### ⭐ 核心文件 (高重要性)
{{criticalFiles}}

### 🔧 工具文件 (中重要性)  
{{toolFiles}}

### 📋 配置文件 (低重要性)
{{configurationFiles}}

## 🚨 风险文件识别

### ⚠️ 高风险文件
{{highRiskFiles}}

### 🔄 频繁修改文件
{{frequentlyChangedFiles}}

### 🕷️ 高耦合文件
{{highCouplingFiles}}

## 📝 文件责任矩阵

| 文件名 | 主要职责 | 次要职责 | 依赖文件 | 被依赖文件 |
|--------|----------|----------|----------|------------|
{{fileResponsibilityMatrix}}

## 🔧 开发建议

### 📁 文件组织建议
{{fileOrganizationSuggestions}}

### 🔄 重构建议
{{refactoringSuggestions}}

### 🧪 测试覆盖建议
{{testCoverageSuggestions}}

## 📋 文件变更历史

### 📈 最近修改
{{recentChanges}}

### 📊 修改频率
{{changeFrequency}}

---

**生成时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0  
**模块版本**: {{moduleVersion}}  
**文档版本**: {{documentVersion}}