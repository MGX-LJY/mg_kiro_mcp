# API规格文档生成模板

你是一个API文档专家。请基于API规格分析结果生成完整的API规格文档。

## 输入数据
**API规格分析结果**: {{apiAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标
生成完整的`api-specifications.md`文档，包括API端点详情、设计规范、安全规格和性能指标。

## Markdown输出模板

```markdown
# {{projectInfo.name}} - API规格文档

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**API端点总数**: {{apiAnalysis.apiOverview.totalEndpoints}}  
**设计质量评分**: {{apiAnalysis.apiOverview.designQuality}}/100  
**文档覆盖率**: {{apiAnalysis.apiOverview.documentationCoverage}}/100

---

## 📊 API概览

### 基本信息
- **端点总数**: {{apiAnalysis.apiOverview.totalEndpoints}}
- **API类型**: {{#each apiAnalysis.apiOverview.apiTypes}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **遵循标准**: {{#each apiAnalysis.apiOverview.apiStandards}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

### 质量指标
| 维度 | 评分 | 状态 |
|------|------|------|
| 设计质量 | {{apiAnalysis.apiOverview.designQuality}}/100 | {{#if (gte apiAnalysis.apiOverview.designQuality 80)}}🟢 优秀{{else if (gte apiAnalysis.apiOverview.designQuality 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 文档覆盖率 | {{apiAnalysis.apiOverview.documentationCoverage}}/100 | {{#if (gte apiAnalysis.apiOverview.documentationCoverage 80)}}🟢 优秀{{else if (gte apiAnalysis.apiOverview.documentationCoverage 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| RESTful合规性 | {{apiAnalysis.apiDesignAnalysis.restfulCompliance}}/100 | {{#if (gte apiAnalysis.apiDesignAnalysis.restfulCompliance 80)}}🟢 优秀{{else if (gte apiAnalysis.apiDesignAnalysis.restfulCompliance 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| URL设计一致性 | {{apiAnalysis.apiDesignAnalysis.urlDesignConsistency}}/100 | {{#if (gte apiAnalysis.apiDesignAnalysis.urlDesignConsistency 80)}}🟢 优秀{{else if (gte apiAnalysis.apiDesignAnalysis.urlDesignConsistency 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

---

## 🔗 API端点规格

{{#each apiAnalysis.endpoints}}
### {{@index}}.{{increment}}. {{method}} {{path}}

**所属模块**: `{{module}}`  
**认证要求**: {{authentication}}  
**授权要求**: {{authorization}}

#### 描述
{{description}}

{{#if parameters.length}}
#### 请求参数

| 参数名 | 类型 | 必需 | 描述 | 验证规则 |
|--------|------|------|------|----------|
{{#each parameters}}
| `{{name}}` | {{type}} | {{#if required}}✅ 是{{else}}❌ 否{{/if}} | {{description}} | {{validation}} |
{{/each}}
{{/if}}

#### 响应规格

{{#each responses}}
##### {{statusCode}} - {{description}}

**响应模式**: `{{schema}}`

{{#if examples.length}}
**响应示例**:
```json
{{examples.[0]}}
```
{{/if}}

{{/each}}

{{#if rateLimit}}
#### 速率限制
{{rateLimit}}
{{/if}}

{{#if caching}}
#### 缓存策略
{{caching}}
{{/if}}

---
{{/each}}

---

## 🎯 API设计分析

### RESTful设计合规性
**合规性评分**: {{apiAnalysis.apiDesignAnalysis.restfulCompliance}}/100 {{#if (gte apiAnalysis.apiDesignAnalysis.restfulCompliance 80)}}🟢{{else if (gte apiAnalysis.apiDesignAnalysis.restfulCompliance 60)}}🟡{{else}}🔴{{/if}}

- **HTTP方法使用**: {{apiAnalysis.apiDesignAnalysis.httpMethodUsage}}
- **状态码使用**: {{apiAnalysis.apiDesignAnalysis.statusCodeUsage}}
- **版本控制策略**: {{apiAnalysis.apiDesignAnalysis.versioningStrategy}}
- **内容类型处理**: {{apiAnalysis.apiDesignAnalysis.contentTypeHandling}}

### API一致性分析
| 维度 | 评分 | 状态 |
|------|------|------|
| 命名约定 | {{apiAnalysis.apiConsistency.namingConventions}}/100 | {{#if (gte apiAnalysis.apiConsistency.namingConventions 80)}}🟢 优秀{{else if (gte apiAnalysis.apiConsistency.namingConventions 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 错误处理 | {{apiAnalysis.apiConsistency.errorHandling}}/100 | {{#if (gte apiAnalysis.apiConsistency.errorHandling 80)}}🟢 优秀{{else if (gte apiAnalysis.apiConsistency.errorHandling 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 响应格式 | {{apiAnalysis.apiConsistency.responseFormat}}/100 | {{#if (gte apiAnalysis.apiConsistency.responseFormat 80)}}🟢 优秀{{else if (gte apiAnalysis.apiConsistency.responseFormat 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 分页策略 | {{apiAnalysis.apiConsistency.paginationStrategy}}/100 | {{#if (gte apiAnalysis.apiConsistency.paginationStrategy 80)}}🟢 优秀{{else if (gte apiAnalysis.apiConsistency.paginationStrategy 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

---

## 📚 API文档规格

### 文档质量评估
- **OpenAPI规格**: {{#if apiAnalysis.apiDocumentation.hasOpenAPISpec}}✅ 已实现{{else}}❌ 未实现{{/if}}
- **文档质量**: {{apiAnalysis.apiDocumentation.documentationQuality}}/100 {{#if (gte apiAnalysis.apiDocumentation.documentationQuality 80)}}🟢{{else if (gte apiAnalysis.apiDocumentation.documentationQuality 60)}}🟡{{else}}🔴{{/if}}
- **示例覆盖率**: {{apiAnalysis.apiDocumentation.examplesCoverage}}/100 {{#if (gte apiAnalysis.apiDocumentation.examplesCoverage 80)}}🟢{{else if (gte apiAnalysis.apiDocumentation.examplesCoverage 60)}}🟡{{else}}🔴{{/if}}
- **参数文档完整性**: {{apiAnalysis.apiDocumentation.parameterDocumentation}}/100 {{#if (gte apiAnalysis.apiDocumentation.parameterDocumentation 80)}}🟢{{else if (gte apiAnalysis.apiDocumentation.parameterDocumentation 60)}}🟡{{else}}🔴{{/if}}
- **错误文档完整性**: {{apiAnalysis.apiDocumentation.errorDocumentation}}/100 {{#if (gte apiAnalysis.apiDocumentation.errorDocumentation 80)}}🟢{{else if (gte apiAnalysis.apiDocumentation.errorDocumentation 60)}}🟡{{else}}🔴{{/if}}

---

## 🔒 API安全规格

### 认证与授权
- **认证方法**: {{#each apiAnalysis.apiSecurity.authenticationMethods}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **授权模型**: {{apiAnalysis.apiSecurity.authorizationModel}}

### 安全评估
| 维度 | 评分 | 状态 |
|------|------|------|
| 输入验证 | {{apiAnalysis.apiSecurity.inputValidation}}/100 | {{#if (gte apiAnalysis.apiSecurity.inputValidation 80)}}🟢 优秀{{else if (gte apiAnalysis.apiSecurity.inputValidation 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 输出净化 | {{apiAnalysis.apiSecurity.outputSanitization}}/100 | {{#if (gte apiAnalysis.apiSecurity.outputSanitization 80)}}🟢 优秀{{else if (gte apiAnalysis.apiSecurity.outputSanitization 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

### 安全头部
{{#if apiAnalysis.apiSecurity.securityHeaders.length}}
{{#each apiAnalysis.apiSecurity.securityHeaders}}
- ✅ {{this}}
{{/each}}
{{else}}
⚠️ 未检测到安全头部配置
{{/if}}

{{#if apiAnalysis.apiSecurity.vulnerabilities.length}}
### ⚠️ 安全漏洞警告
{{#each apiAnalysis.apiSecurity.vulnerabilities}}
- 🚨 {{this}}
{{/each}}
{{else}}
✅ **未发现明显安全漏洞**
{{/if}}

---

## ⚡ API性能规格

### 性能指标
- **平均响应时间**: {{apiAnalysis.apiPerformance.responseTime}}
- **系统吞吐量**: {{apiAnalysis.apiPerformance.throughput}}

### 性能优化评估
| 维度 | 评分 | 状态 |
|------|------|------|
| 缓存实现 | {{apiAnalysis.apiPerformance.cachingImplementation}}/100 | {{#if (gte apiAnalysis.apiPerformance.cachingImplementation 80)}}🟢 优秀{{else if (gte apiAnalysis.apiPerformance.cachingImplementation 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| 速率限制 | {{apiAnalysis.apiPerformance.rateLimitingImplementation}}/100 | {{#if (gte apiAnalysis.apiPerformance.rateLimitingImplementation 80)}}🟢 优秀{{else if (gte apiAnalysis.apiPerformance.rateLimitingImplementation 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |

{{#if apiAnalysis.apiPerformance.performanceBottlenecks.length}}
### 性能瓶颈识别
{{#each apiAnalysis.apiPerformance.performanceBottlenecks}}
- ⚠️ {{this}}
{{/each}}
{{else}}
✅ **未发现明显性能瓶颈**
{{/if}}

---

## ⚠️ API问题分析

{{#if apiAnalysis.apiIssues.length}}
{{#each apiAnalysis.apiIssues}}
### {{@index}}.{{increment}}. {{issue}} {{#if (eq severity "critical")}}🔴{{else if (eq severity "high")}}🟠{{else if (eq severity "medium")}}🟡{{else}}🟢{{/if}}

**严重程度**: {{severity}}  
**问题端点**: `{{endpoint}}`  
**业务影响**: {{impact}}

#### 问题描述
{{description}}

#### 解决建议
{{recommendation}}

---
{{/each}}
{{else}}
✅ **API设计良好**，未发现重大问题。
{{/if}}

---

## 💡 API改进建议

{{#each apiAnalysis.improvementSuggestions}}
### {{@index}}.{{increment}}. {{category}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}  
**实施工作量**: {{implementationEffort}}

#### 建议内容
{{suggestion}}

#### 建议理由
{{rationale}}

#### 预期收益
{{expectedBenefit}}

---
{{/each}}

---

## 📋 API改进行动计划

### 🔥 高优先级改进
{{#each apiAnalysis.improvementSuggestions}}
{{#if (eq priority "high")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

### 🟡 中优先级改进
{{#each apiAnalysis.improvementSuggestions}}
{{#if (eq priority "medium")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

### 🟢 长期规划
{{#each apiAnalysis.improvementSuggestions}}
{{#if (eq priority "low")}}
- [ ] **{{category}}**: {{suggestion}}
{{/if}}
{{/each}}

---

## 📖 相关文档

- [系统架构文档](./system-architecture.md)
- [集成契约文档](./integration-contracts.md)
- [数据流文档](./data-flow.md)

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*
```

请基于提供的API规格分析数据，生成清晰的API规格文档。