# 设计原则文档生成模板

你是一个软件架构文档专家。请基于设计原则分析结果生成完整的设计原则文档。

## 输入数据
**设计原则分析结果**: {{designAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`design-principles.md`文档，包括：
1. 设计模式使用报告
2. SOLID原则遵循评估  
3. 代码质量原则分析
4. 架构质量评估
5. 改进建议和最佳实践

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 设计原则与架构质量报告

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**整体设计质量**: {{designAnalysis.overallAssessment.designQualityScore}}/100  
**可维护性指数**: {{designAnalysis.bestPracticesAlignment.maintainabilityIndex}}/100

---

## 📊 设计质量概览

### 核心指标
| 维度 | 评分 | 状态 | 备注 |
|------|------|------|------|
| 设计质量 | {{designAnalysis.overallAssessment.designQualityScore}}/100 | {{#if (gte designAnalysis.overallAssessment.designQualityScore 80)}}🟢 优秀{{else if (gte designAnalysis.overallAssessment.designQualityScore 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 整体架构设计水平 |
| 可维护性 | {{designAnalysis.bestPracticesAlignment.maintainabilityIndex}}/100 | {{#if (gte designAnalysis.bestPracticesAlignment.maintainabilityIndex 80)}}🟢 优秀{{else if (gte designAnalysis.bestPracticesAlignment.maintainabilityIndex 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 代码维护友好程度 |
| 框架最佳实践 | {{designAnalysis.bestPracticesAlignment.frameworkBestPractices}}/100 | {{#if (gte designAnalysis.bestPracticesAlignment.frameworkBestPractices 80)}}🟢 优秀{{else if (gte designAnalysis.bestPracticesAlignment.frameworkBestPractices 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 框架使用规范性 |
| 现代模式采用 | {{designAnalysis.bestPracticesAlignment.modernPatterns}}/100 | {{#if (gte designAnalysis.bestPracticesAlignment.modernPatterns 80)}}🟢 优秀{{else if (gte designAnalysis.bestPracticesAlignment.modernPatterns 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 现代设计模式使用 |
| 技术债务 | {{designAnalysis.bestPracticesAlignment.technicalDebt}} | {{#if (eq designAnalysis.bestPracticesAlignment.technicalDebt "low")}}🟢 低{{else if (eq designAnalysis.bestPracticesAlignment.technicalDebt "medium")}}🟡 中等{{else}}🔴 高{{/if}} | 技术债务水平 |

### 设计优势
{{#each designAnalysis.overallAssessment.strengths}}
- ✅ {{this}}
{{/each}}

### 设计弱点  
{{#each designAnalysis.overallAssessment.weaknesses}}
- ⚠️ {{this}}
{{/each}}

---

## 🎯 设计模式分析

### 已识别的设计模式

{{#each designAnalysis.designPatterns.identified}}
#### {{@index}}.{{increment}}. {{pattern}} {{#if (eq appropriateness "excellent")}}🟢{{else if (eq appropriateness "good")}}🟡{{else if (eq appropriateness "questionable")}}🟠{{else}}🔴{{/if}}

**类别**: {{category}}  
**使用恰当性**: {{appropriateness}}  
**实现方式**: {{implementation}}

**出现位置**:
{{#each locations}}
- `{{this}}`
{{/each}}

**评估**: {{reasoning}}

---
{{/each}}

### 建议采用的设计模式

{{#if designAnalysis.designPatterns.missing.length}}
{{#each designAnalysis.designPatterns.missing}}
#### {{@index}}.{{increment}}. {{pattern}}

**建议应用位置**:
{{#each locations}}
- {{this}}
{{/each}}

**预期收益**:
{{#each benefits}}
- {{this}}
{{/each}}

**实施难度**: {{#if (eq implementationEffort "low")}}🟢 低{{else if (eq implementationEffort "medium")}}🟡 中等{{else}}🔴 高{{/if}}

---
{{/each}}
{{else}}
✅ **当前设计模式使用合理**，暂无明显的模式缺失问题。
{{/if}}

---

## 🏗️ SOLID原则评估

### 单一职责原则 (SRP)
**遵循程度**: {{designAnalysis.solidPrinciples.singleResponsibility.score}}/100 {{#if (gte designAnalysis.solidPrinciples.singleResponsibility.score 80)}}🟢{{else if (gte designAnalysis.solidPrinciples.singleResponsibility.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.solidPrinciples.singleResponsibility.violations.length}}
**违反实例**:
{{#each designAnalysis.solidPrinciples.singleResponsibility.violations}}
- ⚠️ {{this}}
{{/each}}
{{/if}}

{{#if designAnalysis.solidPrinciples.singleResponsibility.goodExamples.length}}
**良好实例**:
{{#each designAnalysis.solidPrinciples.singleResponsibility.goodExamples}}
- ✅ {{this}}
{{/each}}
{{/if}}

**改进建议**:
{{#each designAnalysis.solidPrinciples.singleResponsibility.recommendations}}
- {{this}}
{{/each}}

### 开闭原则 (OCP)  
**遵循程度**: {{designAnalysis.solidPrinciples.openClosed.score}}/100 {{#if (gte designAnalysis.solidPrinciples.openClosed.score 80)}}🟢{{else if (gte designAnalysis.solidPrinciples.openClosed.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.solidPrinciples.openClosed.violations.length}}
**违反实例**:
{{#each designAnalysis.solidPrinciples.openClosed.violations}}
- ⚠️ {{this}}
{{/each}}
{{/if}}

**改进建议**:
{{#each designAnalysis.solidPrinciples.openClosed.recommendations}}
- {{this}}
{{/each}}

### 里氏替换原则 (LSP)
**遵循程度**: {{designAnalysis.solidPrinciples.liskovSubstitution.score}}/100 {{#if (gte designAnalysis.solidPrinciples.liskovSubstitution.score 80)}}🟢{{else if (gte designAnalysis.solidPrinciples.liskovSubstitution.score 60)}}🟡{{else}}🔴{{/if}}

**改进建议**:
{{#each designAnalysis.solidPrinciples.liskovSubstitution.recommendations}}
- {{this}}
{{/each}}

### 接口隔离原则 (ISP)
**遵循程度**: {{designAnalysis.solidPrinciples.interfaceSegregation.score}}/100 {{#if (gte designAnalysis.solidPrinciples.interfaceSegregation.score 80)}}🟢{{else if (gte designAnalysis.solidPrinciples.interfaceSegregation.score 60)}}🟡{{else}}🔴{{/if}}

**改进建议**:
{{#each designAnalysis.solidPrinciples.interfaceSegregation.recommendations}}
- {{this}}
{{/each}}

### 依赖倒置原则 (DIP)
**遵循程度**: {{designAnalysis.solidPrinciples.dependencyInversion.score}}/100 {{#if (gte designAnalysis.solidPrinciples.dependencyInversion.score 80)}}🟢{{else if (gte designAnalysis.solidPrinciples.dependencyInversion.score 60)}}🟡{{else}}🔴{{/if}}

**改进建议**:
{{#each designAnalysis.solidPrinciples.dependencyInversion.recommendations}}
- {{this}}
{{/each}}

---

## 📏 代码质量原则

### DRY原则 (Don't Repeat Yourself)
**遵循度**: {{designAnalysis.codeQualityPrinciples.dryPrinciple.score}}/100 {{#if (gte designAnalysis.codeQualityPrinciples.dryPrinciple.score 80)}}🟢{{else if (gte designAnalysis.codeQualityPrinciples.dryPrinciple.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.codeQualityPrinciples.dryPrinciple.duplications.length}}
**重复代码实例**:
{{#each designAnalysis.codeQualityPrinciples.dryPrinciple.duplications}}
- 🔄 {{this}}
{{/each}}

**重构机会**:
{{#each designAnalysis.codeQualityPrinciples.dryPrinciple.refactoringOpportunities}}
- 🔧 {{this}}
{{/each}}
{{/if}}

### KISS原则 (Keep It Simple, Stupid)
**简洁性评分**: {{designAnalysis.codeQualityPrinciples.kissPrinciple.score}}/100 {{#if (gte designAnalysis.codeQualityPrinciples.kissPrinciple.score 80)}}🟢{{else if (gte designAnalysis.codeQualityPrinciples.kissPrinciple.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.codeQualityPrinciples.kissPrinciple.complexAreas.length}}
**复杂区域**:
{{#each designAnalysis.codeQualityPrinciples.kissPrinciple.complexAreas}}
- 🔴 {{this}}
{{/each}}

**简化建议**:
{{#each designAnalysis.codeQualityPrinciples.kissPrinciple.simplificationSuggestions}}
- 💡 {{this}}
{{/each}}
{{/if}}

### YAGNI原则 (You Ain't Gonna Need It)  
**遵循度**: {{designAnalysis.codeQualityPrinciples.yagniPrinciple.score}}/100 {{#if (gte designAnalysis.codeQualityPrinciples.yagniPrinciple.score 80)}}🟢{{else if (gte designAnalysis.codeQualityPrinciples.yagniPrinciple.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.codeQualityPrinciples.yagniPrinciple.overEngineering.length}}
**过度设计实例**:
{{#each designAnalysis.codeQualityPrinciples.yagniPrinciple.overEngineering}}
- ⚠️ {{this}}
{{/each}}
{{/if}}

### 关注点分离
**分离度**: {{designAnalysis.codeQualityPrinciples.separationOfConcerns.score}}/100 {{#if (gte designAnalysis.codeQualityPrinciples.separationOfConcerns.score 80)}}🟢{{else if (gte designAnalysis.codeQualityPrinciples.separationOfConcerns.score 60)}}🟡{{else}}🔴{{/if}}

{{#if designAnalysis.codeQualityPrinciples.separationOfConcerns.mixedConcerns.length}}
**混合关注点实例**:
{{#each designAnalysis.codeQualityPrinciples.separationOfConcerns.mixedConcerns}}
- ⚠️ {{this}}
{{/each}}
{{/if}}

---

## 🏛️ 架构质量评估

### 模块化设计
**模块化程度**: {{designAnalysis.architecturalQuality.modularity.score}}/100 {{#if (gte designAnalysis.architecturalQuality.modularity.score 80)}}🟢{{else if (gte designAnalysis.architecturalQuality.modularity.score 60)}}🟡{{else}}🔴{{/if}}

- **内聚度**: {{#if (eq designAnalysis.architecturalQuality.modularity.cohesion "high")}}🟢 高{{else if (eq designAnalysis.architecturalQuality.modularity.cohesion "medium")}}🟡 中等{{else}}🔴 低{{/if}}
- **耦合度**: {{#if (eq designAnalysis.architecturalQuality.modularity.coupling "loose")}}🟢 松耦合{{else if (eq designAnalysis.architecturalQuality.modularity.coupling "moderate")}}🟡 适度耦合{{else}}🔴 紧耦合{{/if}}

{{#if designAnalysis.architecturalQuality.modularity.modularityIssues.length}}
**模块化问题**:
{{#each designAnalysis.architecturalQuality.modularity.modularityIssues}}
- ⚠️ {{this}}
{{/each}}
{{/if}}

### 可扩展性设计
**可扩展性**: {{designAnalysis.architecturalQuality.extensibility.score}}/100 {{#if (gte designAnalysis.architecturalQuality.extensibility.score 80)}}🟢{{else if (gte designAnalysis.architecturalQuality.extensibility.score 60)}}🟡{{else}}🔴{{/if}}

**扩展点**:
{{#each designAnalysis.architecturalQuality.extensibility.extensionPoints}}
- ✅ {{this}}
{{/each}}

{{#if designAnalysis.architecturalQuality.extensibility.rigidAreas.length}}
**僵化区域**:
{{#each designAnalysis.architecturalQuality.extensibility.rigidAreas}}
- 🔒 {{this}}
{{/each}}
{{/if}}

### 错误处理策略
**策略**: {{designAnalysis.architecturalQuality.errorHandling.strategy}}  
**一致性**: {{#if (eq designAnalysis.architecturalQuality.errorHandling.consistency "high")}}🟢 高{{else if (eq designAnalysis.architecturalQuality.errorHandling.consistency "medium")}}🟡 中等{{else}}🔴 低{{/if}}  
**覆盖程度**: {{designAnalysis.architecturalQuality.errorHandling.coverage}}/100

**改进建议**:
{{#each designAnalysis.architecturalQuality.errorHandling.improvements}}
- {{this}}
{{/each}}

---

## 🚨 关键问题与改进建议

### 关键问题
{{#if designAnalysis.overallAssessment.criticalIssues.length}}
{{#each designAnalysis.overallAssessment.criticalIssues}}
- 🔴 **{{this}}**
{{/each}}
{{else}}
✅ **未发现关键设计问题**
{{/if}}

### 改进优先级

{{#each designAnalysis.overallAssessment.improvementPriorities}}
#### {{@index}}.{{increment}}. {{area}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}  
**影响程度**: {{#if (eq impact "high")}}🔴 高{{else if (eq impact "medium")}}🟡 中等{{else}}🟢 低{{/if}}  
**改进工作量**: {{#if (eq effort "low")}}🟢 低{{else if (eq effort "medium")}}🟡 中等{{else}}🔴 高{{/if}}

---
{{/each}}

---

## 📋 行动计划

### 🔥 高优先级 (立即处理)
{{#each designAnalysis.overallAssessment.improvementPriorities}}
{{#if (eq priority "high")}}
- [ ] **{{area}}** - 影响程度: {{impact}}, 工作量: {{effort}}
{{/if}}
{{/each}}

### 🟡 中优先级 (1个月内)
{{#each designAnalysis.overallAssessment.improvementPriorities}}
{{#if (eq priority "medium")}}
- [ ] **{{area}}** - 影响程度: {{impact}}, 工作量: {{effort}}
{{/if}}
{{/each}}

### 🟢 低优先级 (长期规划)
{{#each designAnalysis.overallAssessment.improvementPriorities}}
{{#if (eq priority "low")}}
- [ ] **{{area}}** - 影响程度: {{impact}}, 工作量: {{effort}}
{{/if}}
{{/each}}

---

## 💡 最佳实践建议

### 设计模式使用
1. **继续保持良好的模式使用**，确保模式选择与问题场景匹配
2. **避免过度设计**，不要为了使用模式而使用模式  
3. **文档化设计决策**，帮助团队理解架构选择

### 代码质量改进
1. **重构重复代码**，提取公共逻辑到可复用组件
2. **简化复杂逻辑**，拆分大型函数和类
3. **增强错误处理**，确保异常处理的完整性和一致性

### 架构演进方向
1. **增强模块化**，明确模块边界和职责
2. **提升可扩展性**，设计合理的扩展点
3. **持续重构**，定期评估和优化架构设计

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [技术栈文档](./tech-stack.md)
- [模块目录文档](./modules-catalog.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*建议更新频率: 重大架构变更时或每季度*
```

## 生成指南

### 内容要求
- 基于实际分析数据生成具体评估
- 提供可操作的改进建议
- 使用清晰的优先级分类
- 包含具体的代码示例和位置

### 格式优化
- 使用适当的图标和颜色标记
- 提供结构化的评分和状态
- 确保表格和列表格式正确
- 生成可执行的行动计划

请基于提供的设计原则分析数据，生成专业且实用的设计原则文档。