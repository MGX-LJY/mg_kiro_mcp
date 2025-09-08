# Fix模式 - 文档检索结果报告

**问题ID**: {{issueId}}
**生成时间**: {{timestamp}}
**分析引擎**: MCP Fix模式 - 智能文档检索系统

## 执行摘要

### 检索概况
- **检索范围**: {{searchScope}}
- **检索深度**: {{searchDepth}}
- **文档总数**: {{totalDocuments}}
- **高相关性文档**: {{highRelevanceCount}}

### 核心发现
基于AI智能检索，发现{{totalDocuments}}个相关文档，其中{{criticalDocuments}}个为关键文档，{{missingDocuments}}个文档类型存在缺失。

### 建议行动
优先获取{{priorityDocuments}}个关键文档，补充{{knowledgeGaps}}个知识盲区，预计知识准备时间{{estimatedPreparationTime}}。

---

## 详细检索报告

### 1. 必需文档清单

#### 关键文档 (Critical)
{{#requiredDocuments}}
{{#if (eq relevance "critical")}}
**文档**: {{title}}
- **类型**: {{type}}
- **相关性**: {{relevance}}
- **预期位置**: {{expectedLocation}}
- **使用目的**: {{purpose}}
- **搜索关键词**: {{#searchKeywords}}`{{.}}`{{#unless @last}}, {{/unless}}{{/searchKeywords}}
- **状态**: {{#if found}}✅ 已找到{{else}}❌ 需要获取{{/if}}

{{/if}}
{{/requiredDocuments}}

#### 重要文档 (High Priority)
{{#requiredDocuments}}
{{#if (eq relevance "high")}}
**文档**: {{title}}
- **类型**: {{type}}
- **预期位置**: {{expectedLocation}}
- **使用目的**: {{purpose}}
- **状态**: {{#if found}}✅ 已找到{{else}}📋 待获取{{/if}}

{{/if}}
{{/requiredDocuments}}

#### 参考文档 (Medium Priority)
{{#requiredDocuments}}
{{#if (eq relevance "medium")}}
**文档**: {{title}}
- **类型**: {{type}}
- **使用目的**: {{purpose}}
- **状态**: {{#if found}}✅ 可用{{else}}⏳ 可选获取{{/if}}

{{/if}}
{{/requiredDocuments}}

### 2. 搜索策略分析

#### 主要搜索策略
**搜索范围**: {{searchStrategy.searchScope}}
**搜索深度**: {{searchStrategy.searchDepth}}

**关键词策略**:
- **主要关键词**: {{#searchStrategy.primaryKeywords}}`{{.}}`{{#unless @last}}, {{/unless}}{{/searchStrategy.primaryKeywords}}
- **辅助关键词**: {{#searchStrategy.secondaryKeywords}}`{{.}}`{{#unless @last}}, {{/unless}}{{/searchStrategy.secondaryKeywords}}
- **技术术语**: {{#searchStrategy.technicalTerms}}`{{.}}`{{#unless @last}}, {{/unless}}{{/searchStrategy.technicalTerms}}
- **排除关键词**: {{#searchStrategy.excludeKeywords}}`{{.}}`{{#unless @last}}, {{/unless}}{{/searchStrategy.excludeKeywords}}

#### 搜索执行结果
{{#if (eq searchStrategy.searchScope "codebase")}}
**代码库搜索**:
- 搜索了项目内部文档和注释
- 发现{{codebaseDocuments}}个内部文档
- 代码注释覆盖率: {{commentCoverage}}
{{/if}}

{{#if (eq searchStrategy.searchScope "external_docs")}}
**外部文档搜索**:
- 搜索了官方文档和第三方资源
- 发现{{externalDocuments}}个外部文档
- 文档时效性: {{documentFreshness}}
{{/if}}

{{#if (eq searchStrategy.searchScope "community")}}
**社区资源搜索**:
- 搜索了社区论坛和问答平台
- 发现{{communityPosts}}个相关讨论
- 解决方案质量: {{solutionQuality}}
{{/if}}

### 3. 知识缺口分析

#### 识别的知识盲区
{{#knowledgeGaps}}
{{#each .}}
**缺失领域**: {{category}}
- **影响程度**: {{impact}}
- **具体描述**: {{description}}
- **建议措施**: {{suggestedAction}}
- **紧急程度**: {{#if (eq impact "high")}}🔴 紧急{{else}}{{#if (eq impact "medium")}}🟡 重要{{else}}🟢 一般{{/if}}{{/if}}

{{/each}}
{{/knowledgeGaps}}

#### 知识获取建议
{{#knowledgeGaps}}
{{#each .}}
{{#if (eq impact "high")}}
**紧急获取**: {{category}}
- 立即寻找{{suggestedAction}}
- 预计获取时间: 0.5-1天
- 替代方案: 联系相关专家或团队
{{/if}}
{{/each}}
{{/knowledgeGaps}}

### 4. 文档质量评估

#### 整体质量状况
- **完整性**: {{documentQuality.completeness}}
- **准确性**: {{documentQuality.accuracy}}
- **可访问性**: {{documentQuality.accessibility}}
- **更新需要**: {{#if documentQuality.updateNeeded}}是{{else}}否{{/if}}

{{#if (eq documentQuality.completeness "incomplete")}}
**完整性问题**:
- 现有文档不足以支持完整的问题修复
- 建议补充{{missingDocumentTypes}}类型的文档
- 可考虑创建临时文档来填补空白
{{/if}}

{{#if (eq documentQuality.accuracy "outdated")}}
**准确性问题**:
- 部分文档可能已过时，信息可能不准确
- 建议优先验证核心文档的时效性
- 对于过时信息，需要寻找更新的替代资源
{{/if}}

{{#if (eq documentQuality.accessibility "difficult")}}
**可访问性问题**:
- 部分关键文档获取困难
- 建议联系文档维护者或相关团队
- 考虑寻找替代的信息源
{{/if}}

---

## 文档获取行动计划

### Phase 1: 立即获取 (0-1天)
{{#requiredDocuments}}
{{#if (eq relevance "critical")}}
{{#unless found}}
- [ ] 获取 **{{title}}**
  - 预期位置: {{expectedLocation}}
  - 搜索策略: {{#searchKeywords}}{{.}}{{#unless @last}}, {{/unless}}{{/searchKeywords}}
  - 负责人: [待分配]
  - 截止时间: [今天]
{{/unless}}
{{/if}}
{{/requiredDocuments}}

### Phase 2: 重要文档 (1-3天)
{{#requiredDocuments}}
{{#if (eq relevance "high")}}
{{#unless found}}
- [ ] 获取 **{{title}}**
  - 类型: {{type}}
  - 用途: {{purpose}}
  - 负责人: [待分配]
  - 截止时间: [3天内]
{{/unless}}
{{/if}}
{{/requiredDocuments}}

### Phase 3: 补充资料 (按需获取)
{{#requiredDocuments}}
{{#if (eq relevance "medium")}}
{{#unless found}}
- [ ] 可选获取 **{{title}}**
  - 用途: {{purpose}}
  - 优先级: 低
{{/unless}}
{{/if}}
{{/requiredDocuments}}

### 质量检验清单
- [ ] 验证所有关键文档的时效性
- [ ] 交叉验证不同来源的信息一致性
- [ ] 确认文档版本与项目技术栈匹配
- [ ] 建立文档更新和维护机制

---

## 风险和缓解措施

### 文档获取风险
{{#if (eq documentQuality.accessibility "difficult")}}
**⚠️ 高风险**: 关键文档获取困难
- **缓解措施**: 联系技术团队或文档维护者
- **替代方案**: 寻找社区资源或类似项目的解决方案
- **应急预案**: 基于现有信息进行初步分析，并标记不确定性
{{/if}}

{{#if (eq documentQuality.completeness "incomplete")}}
**⚠️ 中风险**: 文档不完整
- **缓解措施**: 优先获取核心文档，其他文档按需补充
- **替代方案**: 通过代码分析和专家咨询补充信息
- **质量保证**: 建立文档验证机制
{{/if}}

### 时间管理
- **预计文档准备时间**: {{estimatedPreparationTime}}
- **关键路径**: 获取{{criticalDocuments}}个关键文档
- **并行处理**: 多个文档可以并行获取和验证

---

**报告生成**: 本报告由MCP Fix模式智能文档检索系统生成  
**检索引擎**: 基于语义匹配和相关性评分的智能检索算法  
**数据来源**: 项目文档库、外部资源库、社区知识库

---

*此报告为问题修复的第二步分析结果，后续将基于获取的文档进行影响评估分析。*