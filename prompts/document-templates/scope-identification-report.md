# Fix模式 - 问题范围识别报告

**问题ID**: {{issueId}}
**生成时间**: {{timestamp}}
**分析引擎**: MCP Fix模式 - 智能问题诊断系统

## 执行摘要

### 问题概述
- **问题类型**: {{problemType}}
- **严重程度**: {{severity}}
- **影响半径**: {{impactRadius}}
- **置信度**: {{confidence}}

### 核心发现
{{#primaryScope}}
**主要受影响模块**: {{affectedModule}}
**核心文件**: {{#coreFiles}}
- `{{.}}`
{{/coreFiles}}
{{/primaryScope}}

### 建议措施
基于AI分析结果，建议采用{{containmentLevel}}级别的修复策略，预计影响范围为{{impactRadius}}。

---

## 详细分析报告

### 1. 问题类型识别

**分析结果**: {{problemType}}

{{#if (eq problemType "runtime_error")}}
**运行时错误特征**:
- 错误发生在代码执行期间
- 通常由异常处理不当或资源访问问题引起
- 需要重点关注错误传播链和异常处理机制
{{/if}}

{{#if (eq problemType "logic_error")}}
**逻辑错误特征**:
- 代码逻辑不符合预期行为
- 可能影响业务流程和数据完整性
- 需要深入分析业务逻辑和算法实现
{{/if}}

{{#if (eq problemType "performance_issue")}}
**性能问题特征**:
- 系统响应时间过长或资源占用过高
- 可能影响用户体验和系统稳定性
- 需要重点分析性能瓶颈和优化机会
{{/if}}

{{#if (eq problemType "security_vulnerability")}}
**安全漏洞特征**:
- 存在潜在的安全风险或漏洞
- 可能导致数据泄露或权限提升
- 需要立即采取安全加固措施
{{/if}}

### 2. 影响范围分析

#### 主要影响范围
{{#primaryScope}}
- **模块名称**: {{affectedModule}}
- **影响半径**: {{impactRadius}}
- **置信度**: {{confidence}}

**核心文件列表**:
{{#coreFiles}}
- **文件**: `{{.}}`
  - 状态: 需要修复
  - 优先级: 高
{{/coreFiles}}
{{/primaryScope}}

#### 次要影响范围
{{#secondaryScopes}}
{{#each .}}
**模块**: {{module}}
- **影响类型**: {{impact}}
- **原因**: {{reason}}
- **相关文件**:
  {{#files}}
  - `{{.}}`
  {{/files}}
{{/each}}
{{/secondaryScopes}}

### 3. 风险评估

#### 修复风险评估
- **破坏性风险**: {{riskAssessment.breakageRisk}}
- **数据完整性**: {{riskAssessment.dataIntegrity}}
- **用户影响程度**: {{riskAssessment.userImpact}}
- **系统稳定性**: {{riskAssessment.systemStability}}

{{#if (eq riskAssessment.breakageRisk "high")}}
⚠️ **高风险警告**: 此修复可能导致系统不稳定，建议采用渐进式修复策略。
{{/if}}

{{#if (eq riskAssessment.dataIntegrity "at_risk")}}
⚠️ **数据风险**: 修复过程可能影响数据完整性，建议提前备份相关数据。
{{/if}}

{{#if (eq riskAssessment.userImpact "high")}}
⚠️ **用户影响**: 修复过程可能显著影响用户体验，建议在维护窗口期间进行。
{{/if}}

#### 风险缓解建议
{{#if (eq riskAssessment.breakageRisk "high")}}
- **渐进式修复**: 分阶段实施修复，每个阶段都进行充分验证
- **A/B测试**: 在部分用户群体中先行测试修复效果
- **实时监控**: 加强修复过程中的系统监控和告警
{{/if}}

{{#if (eq riskAssessment.dataIntegrity "at_risk")}}
- **数据备份**: 在修复前创建完整的数据备份
- **数据验证**: 修复后验证数据完整性和一致性
- **回滚机制**: 准备数据回滚和恢复机制
{{/if}}

### 4. 边界分析

#### 问题隔离和控制
- **隔离级别**: {{boundaryAnalysis.containmentLevel}}
- **隔离可行性**: {{#if boundaryAnalysis.isolationPossible}}可以隔离{{else}}难以隔离{{/if}}

#### 级联效应分析
{{#if boundaryAnalysis.cascadeEffects}}
**潜在级联效应**:
{{#boundaryAnalysis.cascadeEffects}}
- {{.}}
{{/boundaryAnalysis.cascadeEffects}}
{{else}}
✅ **良好隔离**: 未发现明显的级联效应风险
{{/if}}

#### 安全边界
{{#boundaryAnalysis.safetyMargins}}
**安全边界描述**:
{{#.}}
- {{.}}
{{/.}}
{{/boundaryAnalysis.safetyMargins}}

---

## 修复建议和后续步骤

### 立即行动项
1. **问题确认**: 验证问题诊断的准确性
2. **资源准备**: 准备修复所需的开发和测试资源
3. **风险评估**: 详细评估修复风险和影响范围

### 修复策略建议
{{#if (eq impactRadius "small")}}
**推荐策略**: 直接修复
- 影响范围有限，可以采用直接的修复方式
- 重点关注代码质量和测试覆盖率
- 预计修复时间: 1-3天
{{/if}}

{{#if (eq impactRadius "medium")}}
**推荐策略**: 分阶段修复
- 影响范围适中，建议采用分阶段的修复方式
- 首先修复核心问题，然后处理次要影响
- 预计修复时间: 3-7天
{{/if}}

{{#if (eq impactRadius "large")}}
**推荐策略**: 系统性重构
- 影响范围较大，需要系统性的解决方案
- 建议制定详细的修复计划和测试策略
- 预计修复时间: 1-3周
{{/if}}

### 质量保证要求
- **测试覆盖率**: 确保修复代码有充分的测试覆盖
- **代码审查**: 严格的代码审查和同行评议
- **集成测试**: 全面的集成和回归测试
- **性能测试**: 验证修复不会引入性能回归

### 监控和验证
- **实时监控**: 部署后的实时系统监控
- **错误追踪**: 错误日志和异常监控
- **性能指标**: 关键性能指标的持续监控
- **用户反馈**: 收集用户使用体验反馈

---

**报告生成**: 本报告由MCP Fix模式智能分析系统生成  
**数据来源**: 项目代码扫描、堆栈跟踪分析、依赖关系图谱  
**分析算法**: 基于机器学习的代码影响分析和风险评估模型

---

*此报告为问题修复的第一步分析结果，后续将进行文档检索、影响评估等深度分析。*