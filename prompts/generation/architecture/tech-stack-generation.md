# 技术栈文档生成模板

你是一个技术文档专家。请基于技术栈分析结果生成完整的技术栈文档。

## 输入数据
**技术栈分析结果**: {{techStackAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`tech-stack.md`文档，包括：
1. 技术栈概览与评估
2. 各层级技术详情
3. 技术债务报告
4. 升级路线图
5. 最佳实践建议

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 技术栈文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**主要语言**: {{techStackAnalysis.techStackAnalysis.primaryLanguage}} {{techStackAnalysis.techStackAnalysis.languageVersion}}  
**整体现代化程度**: {{techStackAnalysis.technicalAssessment.overallModernity}}/100  
**可维护性评分**: {{techStackAnalysis.technicalAssessment.maintainabilityScore}}/100

---

## 📊 技术栈概览

### 核心信息
- **主要语言**: {{techStackAnalysis.techStackAnalysis.primaryLanguage}} ({{techStackAnalysis.techStackAnalysis.languageVersion}})
- **检测置信度**: {{techStackAnalysis.techStackAnalysis.confidence}}%
- **检测方式**: {{techStackAnalysis.techStackAnalysis.detectionMethod}}

### 质量指标
| 维度 | 评分 | 状态 | 说明 |
|------|------|------|------|
| 整体现代化 | {{techStackAnalysis.technicalAssessment.overallModernity}}/100 | {{#if (gte techStackAnalysis.technicalAssessment.overallModernity 80)}}🟢 优秀{{else if (gte techStackAnalysis.technicalAssessment.overallModernity 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 技术版本新旧程度 |
| 性能评级 | {{techStackAnalysis.technicalAssessment.performanceRating}}/100 | {{#if (gte techStackAnalysis.technicalAssessment.performanceRating 80)}}🟢 优秀{{else if (gte techStackAnalysis.technicalAssessment.performanceRating 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 技术栈性能特征 |
| 可维护性 | {{techStackAnalysis.technicalAssessment.maintainabilityScore}}/100 | {{#if (gte techStackAnalysis.technicalAssessment.maintainabilityScore 80)}}🟢 优秀{{else if (gte techStackAnalysis.technicalAssessment.maintainabilityScore 60)}}🟡 良好{{else}}🔴 需改进{{/if}} | 代码组织和工具链 |
| 安全等级 | {{techStackAnalysis.technicalAssessment.securityLevel}} | {{#if (eq techStackAnalysis.technicalAssessment.securityLevel "high")}}🟢 高{{else if (eq techStackAnalysis.technicalAssessment.securityLevel "medium")}}🟡 中等{{else}}🔴 低{{/if}} | 安全最佳实践采用 |
| 扩展性潜力 | {{techStackAnalysis.technicalAssessment.scalabilityPotential}} | {{#if (eq techStackAnalysis.technicalAssessment.scalabilityPotential "high")}}🟢 高{{else if (eq techStackAnalysis.technicalAssessment.scalabilityPotential "medium")}}🟡 中等{{else}}🔴 低{{/if}} | 架构扩展能力 |

---

## 🏗️ 技术架构层级

### 运行时环境
{{#with techStackAnalysis.technologyLayers.runtime}}
- **环境**: {{name}}
- **版本**: {{version}}
- **状态**: {{#if (eq status "current")}}🟢 最新{{else if (eq status "outdated")}}🟡 过时{{else}}🔴 已废弃{{/if}}
- **配置文件**: {{#each configFiles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/with}}

### 框架与库
{{#each techStackAnalysis.technologyLayers.frameworks}}
#### {{@index}}.{{increment}}. {{name}} {{#if (eq maturityLevel "mature")}}🟢{{else if (eq maturityLevel "stable")}}🟡{{else if (eq maturityLevel "experimental")}}🔴{{else}}⚫{{/if}}

**类别**: {{category}}  
**版本**: {{version}}  
**使用程度**: {{usage}}  
**成熟度**: {{maturityLevel}}

**相关文件**: {{#each files}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

---
{{/each}}

### 构建工具
{{#each techStackAnalysis.technologyLayers.buildTools}}
#### {{@index}}.{{increment}}. {{name}}

**用途**: {{purpose}}  
**配置文件**: `{{configFile}}`  
**版本**: {{version}}

---
{{/each}}

{{#if techStackAnalysis.technologyLayers.databases.length}}
### 数据存储
{{#each techStackAnalysis.technologyLayers.databases}}
#### {{@index}}.{{increment}}. {{name}}

**类型**: {{type}}  
**使用场景**: {{usage}}  
**配置**: {{#each configFiles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

---
{{/each}}
{{/if}}

{{#if techStackAnalysis.technologyLayers.deployment.length}}
### 部署架构
{{#each techStackAnalysis.technologyLayers.deployment}}
#### {{@index}}.{{increment}}. {{platform}}

**部署工具**: {{tool}}  
**容器化**: {{#if containerized}}✅ 已采用{{else}}❌ 未采用{{/if}}  
**配置文件**: {{#each configFiles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

---
{{/each}}
{{/if}}

---

## ⚠️ 技术债务报告

{{#if techStackAnalysis.technicalDebt.length}}
{{#each techStackAnalysis.technicalDebt}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq severity "critical")}}🔴{{else if (eq severity "high")}}🟠{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}  
**风险等级**: {{riskLevel}}  
**预估工作量**: {{estimatedEffort}}

#### 问题描述
{{description}}

#### 影响组件
{{#each affectedComponents}}
- {{this}}
{{/each}}

---
{{/each}}
{{else}}
🎉 **恭喜！** 未检测到明显的技术债务问题。
{{/if}}

---

## 🚀 升级建议

{{#if techStackAnalysis.upgradeRecommendations.length}}
### 优先级升级清单

{{#each techStackAnalysis.upgradeRecommendations}}
#### {{@index}}.{{increment}}. {{component}} {{#if (eq priority "critical")}}🔴{{else if (eq priority "high")}}🟠{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**当前版本**: {{currentVersion}}  
**建议版本**: {{recommendedVersion}}  
**优先级**: {{priority}}  
**破坏性变更**: {{#if (eq breakingChanges "none")}}✅ 无{{else if (eq breakingChanges "minor")}}⚠️ 轻微{{else}}🚫 重大{{/if}}  
**预估工作量**: {{estimatedEffort}}

#### 升级理由
{{rationale}}

{{#if dependencies.length}}
#### 相关依赖
{{#each dependencies}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}
{{else}}
✅ **当前技术栈版本状态良好**，暂无紧急升级需求。
{{/if}}

---

## 💡 现代化机会

{{#if techStackAnalysis.modernizationOpportunities.length}}
{{#each techStackAnalysis.modernizationOpportunities}}
### {{@index}}.{{increment}}. {{opportunity}}

**当前做法**: {{currentApproach}}  
**现代化方案**: {{modernApproach}}  
**实施复杂度**: {{#if (eq implementationComplexity "low")}}🟢 低{{else if (eq implementationComplexity "medium")}}🟡 中等{{else}}🔴 高{{/if}}  
**投资回报率**: {{roi}}

#### 预期收益
{{#each benefits}}
- {{this}}
{{/each}}

---
{{/each}}
{{else}}
📊 **技术架构已相对现代化**，建议关注性能优化和安全加固。
{{/if}}

---

## 🗺️ 技术发展路线图

### 🔥 立即执行 (本周)
{{#each techStackAnalysis.technologyRoadmap.immediate}}
- [ ] {{this}}
{{/each}}

### 📅 短期规划 (1-3个月)
{{#each techStackAnalysis.technologyRoadmap.shortTerm}}
- [ ] {{this}}
{{/each}}

### 📈 中期规划 (3-6个月)  
{{#each techStackAnalysis.technologyRoadmap.mediumTerm}}
- [ ] {{this}}
{{/each}}

### 🌟 长期愿景 (6个月以上)
{{#each techStackAnalysis.technologyRoadmap.longTerm}}
- [ ] {{this}}
{{/each}}

---

## 📋 技术选型最佳实践

### 版本管理建议
1. **保持核心依赖最新**: 关注安全更新和性能改进
2. **渐进式升级**: 避免跨版本大幅升级
3. **测试覆盖**: 升级前确保充分的测试覆盖

### 性能优化方向
1. **构建优化**: 代码分割、tree-shaking、压缩优化
2. **运行时优化**: 缓存策略、懒加载、资源优化
3. **监控完善**: 性能监控、错误跟踪、用户体验监控

### 安全加固措施
1. **依赖安全**: 定期安全扫描和漏洞修复
2. **访问控制**: 最小权限原则和身份认证
3. **数据保护**: 加密存储和传输安全

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [模块目录文档](./modules-catalog.md)
- [集成契约文档](./integration-contracts.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*下次更新建议: 技术栈变更时或每季度*
```

## 生成指南

### 动态评估
- 根据分析结果动态显示技术债务和升级建议
- 自适应优先级标记和状态图标
- 基于实际情况提供个性化建议

### 可操作性
- 提供具体的TODO清单
- 包含预估工作量和优先级
- 给出明确的技术路线图

### 专业性保证
- 使用准确的技术术语
- 提供具有实用价值的建议
- 确保内容结构化和逻辑清晰

请基于提供的技术栈分析数据，生成专业且实用的技术栈文档。