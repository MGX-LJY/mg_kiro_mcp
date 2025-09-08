# 文件内容概览生成模板

你是一个技术报告专家。请基于文件内容分析结果生成完整的文件分析概览报告。

## 输入数据
**文件分析结果**: {{fileAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`file-content-overview.md`文档，包括：
1. 分析结果摘要与统计
2. 文件分类分布详情
3. 代码质量评估报告
4. 重要文件识别清单
5. 依赖关系图谱概览
6. 技术债务分析报告
7. 改进建议与行动计划

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 文件内容分析概览

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**项目路径**: {{projectInfo.path}}  
**分析文件数**: {{fileAnalysis.analysis.totalFilesAnalyzed}}  
**主要语言**: {{fileAnalysis.analysis.mainLanguage}}  
**分析置信度**: {{fileAnalysis.analysis.confidence}}

---

## 📊 分析摘要

### 核心指标
| 指标 | 数值 | 状态 |
|------|------|------|
| **总文件数** | {{fileAnalysis.analysis.totalFilesAnalyzed}} | - |
| **总代码行数** | {{fileAnalysis.overview.codeMetrics.totalLines}} | - |
| **总函数数** | {{fileAnalysis.overview.codeMetrics.totalFunctions}} | - |
| **总类数** | {{fileAnalysis.overview.codeMetrics.totalClasses}} | - |
| **平均复杂度** | {{fileAnalysis.overview.codeMetrics.avgComplexity}} | {{#if (lte fileAnalysis.overview.codeMetrics.avgComplexity 3)}}🟢 良好{{else if (lte fileAnalysis.overview.codeMetrics.avgComplexity 6)}}🟡 中等{{else}}🔴 复杂{{/if}} |
| **代码质量** | {{fileAnalysis.overview.qualityIndicators.codeQualityScore}}/100 | {{#if (gte fileAnalysis.overview.qualityIndicators.codeQualityScore 80)}}🟢 优秀{{else if (gte fileAnalysis.overview.qualityIndicators.codeQualityScore 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| **可维护性** | {{fileAnalysis.overview.qualityIndicators.maintainabilityIndex}}/100 | {{#if (gte fileAnalysis.overview.qualityIndicators.maintainabilityIndex 80)}}🟢 高{{else if (gte fileAnalysis.overview.qualityIndicators.maintainabilityIndex 60)}}🟡 中等{{else}}🔴 低{{/if}} |

---

## 📁 文件分类分布

### 文件类型统计
{{#with fileAnalysis.overview.distribution}}
- **源码文件**: {{source}}个 ({{percentage source ../totalFiles}}%)
- **配置文件**: {{config}}个 ({{percentage config ../totalFiles}}%)  
- **测试文件**: {{test}}个 ({{percentage test ../totalFiles}}%)
- **文档文件**: {{documentation}}个 ({{percentage documentation ../totalFiles}}%)
- **资源文件**: {{assets}}个 ({{percentage assets ../totalFiles}}%)
{{/with}}

### 复杂度分布
{{#with fileAnalysis.overview.complexity}}
| 复杂度等级 | 文件数量 | 占比 | 状态 |
|-----------|---------|------|------|
| **低复杂度** | {{low}} | {{percentage low ../totalFiles}}% | 🟢 健康 |
| **中等复杂度** | {{medium}} | {{percentage medium ../totalFiles}}% | 🟡 适中 |
| **高复杂度** | {{high}} | {{percentage high ../totalFiles}}% | 🟠 关注 |
| **极高复杂度** | {{critical}} | {{percentage critical ../totalFiles}}% | 🔴 需重构 |
{{/with}}

---

## 🏆 重要文件识别

### Top 10 关键文件
{{#each (topImportantFiles fileAnalysis.importance 10)}}
#### {{@index}}.{{increment}}. {{path}} {{#if (gte score 90)}}⭐⭐⭐{{else if (gte score 75)}}⭐⭐{{else if (gte score 60)}}⭐{{/if}}

**重要性评分**: {{score}}/100  
**文件类型**: {{type}}  
**复杂度**: {{complexity}} {{#if (eq complexity "critical")}}🔴{{else if (eq complexity "high")}}🟠{{else if (eq complexity "medium")}}🟡{{else}}🟢{{/if}}  

{{#if description}}
**功能描述**: {{description}}
{{/if}}

---
{{/each}}

## 🔗 依赖关系分析

### 依赖图谱概览
{{#with fileAnalysis.dependencies.statistics}}
- **总节点数**: {{totalNodes}}
- **总依赖关系**: {{totalEdges}}  
- **最大依赖深度**: {{maxDepth}}
- **循环依赖**: {{circularDependencies}}个 {{#if (gt circularDependencies 0)}}⚠️{{else}}✅{{/if}}
{{/with}}

### 依赖强度分析
{{#with fileAnalysis.dependencies}}
#### 高依赖文件 (被依赖次数 > 5)
{{#each (highDependencyFiles nodes edges 5)}}
- **{{path}}**: 被{{dependencyCount}}个文件依赖
{{/each}}

#### 孤立文件 (无依赖关系)
{{#each (isolatedFiles nodes edges)}}
- {{path}}
{{/each}}
{{/with}}

---

## 💎 代码质量详细评估

### 质量指标详情
{{#with fileAnalysis.overview.qualityIndicators}}
| 质量维度 | 评分 | 状态 | 说明 |
|----------|------|------|------|
| **文档覆盖率** | {{documentationCoverage}}% | {{#if (gte documentationCoverage 0.8)}}🟢 优秀{{else if (gte documentationCoverage 0.6)}}🟡 良好{{else}}🔴 不足{{/if}} | {{#if (gte documentationCoverage 0.8)}}文档完整{{else if (gte documentationCoverage 0.6)}}基本覆盖{{else}}需要补充{{/if}} |
| **测试覆盖率** | {{testCoverage}}% | {{#if (gte testCoverage 0.8)}}🟢 优秀{{else if (gte testCoverage 0.6)}}🟡 良好{{else}}🔴 不足{{/if}} | {{#if (gte testCoverage 0.8)}}测试充分{{else if (gte testCoverage 0.6)}}基本测试{{else}}缺少测试{{/if}} |
| **代码质量** | {{codeQualityScore}}/100 | {{#if (gte codeQualityScore 80)}}🟢 优秀{{else if (gte codeQualityScore 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 综合代码质量评估 |
| **可维护性** | {{maintainabilityIndex}}/100 | {{#if (gte maintainabilityIndex 80)}}🟢 高{{else if (gte maintainabilityIndex 60)}}🟡 中等{{else}}🔴 低{{/if}} | 代码维护难易程度 |
{{/with}}

### 代码指标统计
{{#with fileAnalysis.overview.codeMetrics}}
- **代码行密度**: {{linesPerFile}} 行/文件
- **函数复杂度**: {{functionsPerFile}} 函数/文件
- **重复代码率**: {{duplicateCode}}% {{#if (lte duplicateCode 5)}}🟢{{else if (lte duplicateCode 15)}}🟡{{else}}🔴{{/if}}
{{/with}}

---

## 🚨 技术债务分析

{{#with fileAnalysis.technicalDebt}}
### 总体技术债务评估
**技术债务评分**: {{score}}/100 {{#if (lte score 30)}}🟢 低债务{{else if (lte score 60)}}🟡 中等债务{{else}}🔴 高债务{{/if}}

### 主要债务问题
{{#each issues}}
#### {{@index}}.{{increment}}. {{type}} - {{severity}} {{#if (eq severity "high")}}🔴{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**问题描述**: {{description}}

**影响文件**: {{affectedFiles.length}}个
{{#each affectedFiles}}
- `{{this}}`
{{/each}}

**解决建议**: {{recommendation}}

---
{{/each}}
{{/with}}

## 💡 改进建议

{{#each fileAnalysis.recommendations}}
### {{@index}}.{{increment}}. {{type}} - {{priority}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}

#### 问题描述
{{message}}

#### 影响文件
{{#each files}}
- `{{this}}`
{{/each}}

#### 预期影响
{{impact}}

#### 实施工作量
{{effort}}

---
{{/each}}

## 🎯 行动计划

### 🚨 立即处理 (高优先级)
{{#each fileAnalysis.recommendations}}
{{#if (eq priority "high")}}
- [ ] {{message}} (影响{{files.length}}个文件)
{{/if}}
{{/each}}

### 🔥 短期优化 (中优先级)  
{{#each fileAnalysis.recommendations}}
{{#if (eq priority "medium")}}
- [ ] {{message}} (影响{{files.length}}个文件)
{{/if}}
{{/each}}

### 🟢 长期改进 (低优先级)
{{#each fileAnalysis.recommendations}}
{{#if (eq priority "low")}}
- [ ] {{message}} (影响{{files.length}}个文件)
{{/if}}
{{/each}}

---

## 🔍 语言特定洞察

### {{fileAnalysis.analysis.mainLanguage}} 项目特点

{{#if (eq fileAnalysis.analysis.mainLanguage "javascript")}}
#### JavaScript代码特征
{{#each (jsSpecificInsights fileAnalysis.files)}}
- **{{feature}}**: {{value}}
{{/each}}

#### 建议优化方向
- 考虑引入TypeScript提升类型安全
- 统一使用ES6+语法特性
- 添加ESLint和Prettier规范代码
- 完善单元测试覆盖

{{else if (eq fileAnalysis.analysis.mainLanguage "python")}}
#### Python代码特征  
{{#each (pythonSpecificInsights fileAnalysis.files)}}
- **{{feature}}**: {{value}}
{{/each}}

#### 建议优化方向
- 增加类型提示提升代码可读性
- 遵循PEP 8代码规范
- 添加docstring文档字符串
- 使用pytest进行测试

{{else if (eq fileAnalysis.analysis.mainLanguage "java")}}
#### Java代码特征
{{#each (javaSpecificInsights fileAnalysis.files)}}
- **{{feature}}**: {{value}}
{{/each}}

#### 建议优化方向  
- 增强注解使用提升代码清晰度
- 遵循Google Java Style Guide
- 加强单元测试和集成测试
- 考虑引入Spring Boot最佳实践
{{/if}}

---

## 📊 分析统计

### 执行信息
- **分析耗时**: {{fileAnalysis.analysis.analysisTime}}ms
- **分析时间**: {{fileAnalysis.timestamp}}
- **分析工具**: mg_kiro MCP Server v2.0.1
- **分析版本**: {{fileAnalysis.metadata.version}}

### 覆盖范围
- **分析文件**: {{fileAnalysis.analysis.totalFilesAnalyzed}}个
- **依赖关系**: {{fileAnalysis.dependencies.statistics.totalEdges}}条
- **质量评估**: {{fileAnalysis.overview.distribution.source}}个源文件
- **重要性评分**: {{objectLength fileAnalysis.importance}}个文件

---

## 📖 相关文档

- [项目结构分析](./project-structure.md)
- [语言检测报告](./language-detection.md)
- [模块依赖分析](./module-dependencies.md)
- [系统架构文档](./system-architecture.md)

---

*本报告由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*下次更新建议: 代码结构重大变更后或每周更新*
```

## 生成指南

### 数据处理原则
- 准确计算和展示各项代码指标
- 突出显示需要关注的质量问题
- 提供具体可操作的改进建议
- 确保统计数据的准确性和一致性

### 格式优化要求  
- 使用清晰的表格展示量化指标
- 添加状态图标和颜色区分等级
- 确保图表和代码块格式正确
- 提供跳转链接便于导航

### 质量保证检查
- 验证所有分析数据的完整性
- 检查建议的针对性和可行性
- 确保评分标准的一致性
- 提供明确的行动指导

请基于提供的文件内容分析数据，生成专业且实用的文件分析概览报告。