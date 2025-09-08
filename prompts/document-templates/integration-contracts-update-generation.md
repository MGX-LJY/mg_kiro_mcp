# 集成契约更新文档生成模板

## 项目信息
**功能名称**: {{featureId}}
**更新类型**: {{updateType}}
**影响程度**: {{impactLevel}}

---

# {{featureId}} 集成契约更新文档

## 📋 更新概览

### 变更摘要
{{contractsUpdate.overview.changeSummary}}

### 影响评估
- **破坏性变更**: {{contractsUpdate.overview.breakingChanges}}个
- **向后兼容**: {{contractsUpdate.overview.backwardCompatible}}个
- **新增契约**: {{contractsUpdate.overview.newContracts}}个
- **废弃契约**: {{contractsUpdate.overview.deprecatedContracts}}个

### 升级时间线
```mermaid
{{contractsUpdate.overview.upgradeTimeline}}
```

## 🆕 新增契约

{{#each contractsUpdate.newContracts}}
---

### {{contractId}} - {{name}}

**类型**: {{type}}
**版本**: {{version}}
**状态**: {{status}}

#### 契约规格

{{#if (eq type 'api')}}
##### API端点
| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
{{#each specifications.endpoints}}
| {{method}} | {{path}} | {{description}} | {{requiresAuth}} |
{{/each}}

##### 请求/响应格式
{{#each specifications.endpoints}}
###### {{method}} {{path}}

**请求格式**:
```json
{{requestSchema}}
```

**响应格式**:
```json
{{responseSchema}}
```

**状态码**:
{{#each statusCodes}}
- `{{code}}`: {{description}}
{{/each}}

{{/each}}
{{/if}}

{{#if (eq type 'database')}}
##### 数据模型
{{#each specifications.dataModels}}
###### {{modelName}}
```sql
{{schema}}
```

**字段说明**:
{{#each fields}}
- `{{name}}` ({{type}}): {{description}}
{{/each}}

**约束**:
{{#each validations}}
- {{constraint}}: {{description}}
{{/each}}

**关系**:
{{#each relationships}}
- {{relationshipType}} {{relatedModel}} ({{foreignKey}})
{{/each}}

{{/each}}
{{/if}}

{{#if (eq type 'event')}}
##### 事件规格
{{#each specifications.events}}
###### {{eventName}}
**触发条件**: {{triggers}}

**事件载荷**:
```json
{{payload}}
```

**订阅者**: {{subscribers}}

{{/each}}
{{/if}}

#### 使用示例

##### 客户端代码
```{{language}}
{{clientExample}}
```

##### 服务端代码
```{{language}}
{{serverExample}}
```

#### 测试用例
```{{language}}
{{testCase}}
```

{{/each}}

## 🔄 更新的契约

{{#each contractsUpdate.updatedContracts}}
---

### {{contractId}} - 更新详情

#### 变更清单
{{#each changes}}
##### {{type}} - {{description}}
**影响程度**: {{impact}}
**迁移需要**: {{migrationRequired}}

{{#if migrationRequired}}
**迁移步骤**:
{{#each migrationSteps}}
{{step}}. {{instruction}}
{{/each}}
{{/if}}

**变更对比**:
```diff
{{changesDiff}}
```

{{/each}}

{{/each}}

## ❌ 废弃的契约

{{#each contractsUpdate.deletedContracts}}
---

### {{contractId}} - 废弃说明

**废弃原因**: {{deprecationReason}}
**废弃时间**: {{deprecationDate}}
**完全移除时间**: {{removalDate}}

#### 替代方案
{{#each alternatives}}
- **{{alternativeName}}**: {{description}}
  - 迁移复杂度: {{migrationComplexity}}
  - 迁移指南: {{migrationGuide}}
{{/each}}

#### 废弃时间线
```mermaid
{{deprecationTimeline}}
```

{{/each}}

## 🔄 兼容性分析

### 兼容性矩阵
| 客户端版本 | 服务端v1.0 | 服务端v1.1 | 服务端v2.0 |
|------------|------------|------------|------------|
{{#each contractsUpdate.compatibilityMatrix.versionMatrix}}
| {{clientVersion}} | {{v1_0}} | {{v1_1}} | {{v2_0}} |
{{/each}}

### 破坏性变更详情
{{#each contractsUpdate.compatibilityMatrix.breakingChanges}}
#### {{change}}
**影响的客户端**: {{affectedClients}}

**迁移路径**:
{{#each migrationPath.steps}}
{{step}}. {{instruction}}
{{/each}}

**迁移示例**:
```{{language}}
// 旧版本
{{oldCode}}

// 新版本
{{newCode}}
```

{{/each}}

### 向后兼容策略
{{#each contractsUpdate.compatibilityMatrix.backwardCompatible}}
- **{{change}}**: {{strategy}}
{{/each}}

## 📋 集成实施计划

### 实施阶段
{{#each integrationPlan.phases}}
---

#### 阶段{{phase}}: {{name}}
**时间线**: {{timeline}}
**目标**: {{objectives}}

##### 涉及的契约
{{#each contracts}}
- **{{contractId}}**: {{status}} - {{description}}
{{/each}}

##### 依赖项
{{#each dependencies}}
- {{dependency}}: {{description}}
{{/each}}

##### 验收标准
{{#each acceptanceCriteria}}
- [ ] {{criterion}}
{{/each}}

##### 回滚计划
**回滚触发条件**:
{{#each rollbackTriggers}}
- {{condition}}
{{/each}}

**回滚步骤**:
{{#each rollbackProcedures}}
{{step}}. {{instruction}}
{{/each}}

{{/each}}

### 测试策略

#### 契约测试
{{#each integrationPlan.testingStrategy.contractTests}}
- **{{testName}}**: {{description}}
  - 测试范围: {{scope}}
  - 验证点: {{validationPoints}}
  - 工具: {{tools}}
{{/each}}

#### 集成测试
{{#each integrationPlan.testingStrategy.integrationTests}}
- **{{testSuite}}**: {{description}}
  - 测试环境: {{environment}}
  - 数据准备: {{dataSetup}}
  - 预期结果: {{expectedResults}}
{{/each}}

#### 回归测试
{{#each integrationPlan.testingStrategy.regressionTests}}
- **{{testCategory}}**: {{coverage}}
{{/each}}

## 🚀 部署指南

### 部署前检查清单
{{#each deploymentChecklist.preDeployment}}
- [ ] {{item}}
{{/each}}

### 灰度发布策略
```mermaid
{{deploymentStrategy.canaryDeployment}}
```

#### 发布阶段
{{#each deploymentStrategy.releasePhases}}
##### 阶段{{phase}}: {{name}}
- **流量比例**: {{trafficPercentage}}%
- **监控指标**: {{monitoringMetrics}}
- **成功标准**: {{successCriteria}}
- **回滚条件**: {{rollbackConditions}}

{{/each}}

### 环境配置
{{#each deploymentStrategy.environmentConfig}}
#### {{environment}}环境
```yaml
{{configuration}}
```

##### 验证脚本
```bash
{{validationScript}}
```

{{/each}}

### 部署后验证
{{#each deploymentChecklist.postDeployment}}
- [ ] {{item}}
{{/each}}

## 📊 监控和告警

### 关键指标
{{#each monitoring.keyMetrics}}
#### {{metricName}}
- **描述**: {{description}}
- **正常范围**: {{normalRange}}
- **告警阈值**: {{alertThreshold}}
- **监控工具**: {{monitoringTool}}

{{/each}}

### 告警配置
{{#each monitoring.alerts}}
#### {{alertName}}
```yaml
{{alertConfiguration}}
```

##### 响应流程
{{#each responsePlaybook}}
{{step}}. {{action}}
{{/each}}

{{/each}}

### 日志监控
{{#each monitoring.logging}}
- **{{component}}**: {{logLevel}} - {{logPattern}}
{{/each}}

## 🛠️ 故障排除

### 常见问题
{{#each troubleshooting.commonIssues}}
#### {{issue}}
**症状**: {{symptoms}}
**可能原因**: {{possibleCauses}}
**解决方案**: {{solutions}}

##### 诊断步骤
{{#each diagnosticSteps}}
{{step}}. {{instruction}}
{{/each}}

{{/each}}

### 应急联系人
{{#each troubleshooting.escalationMatrix}}
- **{{role}}**: {{contact}} ({{availability}})
{{/each}}

## 📈 性能影响评估

### 性能基准测试
{{#each performanceImpact.benchmarks}}
#### {{scenario}}
**测试环境**: {{testEnvironment}}
**基准指标**: 
- 响应时间: {{baselineResponseTime}}ms → {{newResponseTime}}ms
- 吞吐量: {{baselineThroughput}} → {{newThroughput}}
- 错误率: {{baselineErrorRate}}% → {{newErrorRate}}%

{{/each}}

### 资源使用分析
{{#each performanceImpact.resourceUsage}}
- **{{resource}}**: {{currentUsage}} → {{projectedUsage}} ({{changePercentage}}%)
{{/each}}

### 优化建议
{{#each performanceImpact.optimizations}}
- **{{optimization}}**: {{description}} - 预计提升: {{expectedGain}}
{{/each}}

## 📚 开发者指南

### 快速开始
```bash
{{quickStart.setupCommands}}
```

### SDK更新
{{#each developerGuide.sdkUpdates}}
#### {{sdkName}} {{version}}
**更新内容**: {{updates}}

**安装命令**:
```bash
{{installCommand}}
```

**迁移指南**: {{migrationGuide}}

{{/each}}

### 代码生成器
{{#each developerGuide.codeGenerators}}
#### {{generatorName}}
**用途**: {{purpose}}
**使用方法**:
```bash
{{usage}}
```

{{/each}}

---

## 📊 项目影响总结

### 技术指标
- **新增API端点**: {{summary.technicalMetrics.newEndpoints}}个
- **更新的数据模型**: {{summary.technicalMetrics.updatedModels}}个
- **废弃的接口**: {{summary.technicalMetrics.deprecatedInterfaces}}个
- **代码覆盖率变化**: {{summary.technicalMetrics.coverageChange}}%

### 业务影响
- **功能增强**: {{summary.businessImpact.enhancements}}
- **用户体验改进**: {{summary.businessImpact.uxImprovements}}
- **系统稳定性**: {{summary.businessImpact.systemStability}}

### 质量保证
- **自动化测试覆盖率**: {{summary.qualityAssurance.testCoverage}}%
- **文档完整性**: {{summary.qualityAssurance.documentationCompleteness}}%
- **代码审查通过率**: {{summary.qualityAssurance.codeReviewPassRate}}%

---

**文档版本**: v1.0  
**生成时间**: {{timestamp}}  
**分析ID**: {{analysisId}}  
**契约更新数量**: {{totalContractsUpdated}}个  
**影响评估**: {{impactLevel}}