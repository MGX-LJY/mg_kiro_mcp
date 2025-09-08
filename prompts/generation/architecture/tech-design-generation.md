# 技术设计文档生成模板

## 项目信息
**功能名称**: {{featureId}}
**项目类型**: {{projectType}}
**主要技术栈**: {{primaryLanguage}}

---

# {{featureId}} 技术设计文档

## 📋 概述
{{techDesign.overview.description}}

**目标用户**: {{techDesign.overview.targetUsers}}
**核心价值**: {{techDesign.overview.coreValue}}

## 🏗️ 架构设计

### 系统架构图
```
{{techDesign.architecture.systemDiagram}}
```

### 核心组件
{{#each techDesign.architecture.components}}
#### {{name}}
- **职责**: {{responsibility}}
- **类型**: {{type}}
- **接口**: {{interfaces}}

{{/each}}

### 技术选型
| 层级 | 技术选择 | 原因 |
|------|----------|------|
{{#each techDesign.architecture.techStack}}
| {{layer}} | {{technology}} | {{rationale}} |
{{/each}}

## 🔗 接口设计

### API 端点规划
{{#each techDesign.interfaces.apis}}
#### {{name}}
- **路径**: `{{method}} {{path}}`
- **描述**: {{description}}
- **请求参数**:
```json
{{requestSchema}}
```
- **响应格式**:
```json
{{responseSchema}}
```

{{/each}}

### 数据模型
{{#each techDesign.interfaces.dataModels}}
#### {{modelName}}
```json
{
  {{#each fields}}
  "{{fieldName}}": {
    "type": "{{type}}",
    "required": {{required}},
    "description": "{{description}}"
  }{{#unless @last}},{{/unless}}
  {{/each}}
}
```

{{/each}}

## 🗄️ 数据设计

### 数据库结构
{{#each techDesign.database.tables}}
#### {{tableName}}
| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
{{#each fields}}
| {{fieldName}} | {{dataType}} | {{constraints}} | {{description}} |
{{/each}}

{{/each}}

### 关系图
```
{{techDesign.database.relationships}}
```

### 数据流转
{{#each techDesign.database.dataFlow}}
1. **{{step}}**: {{description}}
{{/each}}

## 🔒 安全设计

### 认证授权
- **认证方式**: {{techDesign.security.authentication.method}}
- **授权策略**: {{techDesign.security.authorization.strategy}}
- **权限模型**: {{techDesign.security.permissions.model}}

### 数据保护
{{#each techDesign.security.dataProtection}}
- **{{category}}**: {{measures}}
{{/each}}

### 安全检查清单
{{#each techDesign.security.checklist}}
- [ ] {{item}}
{{/each}}

## ⚡ 性能设计

### 性能目标
| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
{{#each techDesign.performance.targets}}
| {{metric}} | {{target}} | {{measurement}} |
{{/each}}

### 优化策略
{{#each techDesign.performance.optimizations}}
#### {{category}}
{{#each strategies}}
- **{{name}}**: {{description}}
{{/each}}

{{/each}}

### 监控方案
{{#each techDesign.performance.monitoring}}
- **{{metric}}**: {{approach}}
{{/each}}

## 📊 质量保证

### 测试策略
{{#each techDesign.quality.testing.strategies}}
#### {{type}}测试
- **覆盖范围**: {{coverage}}
- **工具选择**: {{tools}}
- **执行频率**: {{frequency}}

{{/each}}

### 代码质量标准
{{#each techDesign.quality.codeStandards}}
- **{{category}}**: {{standard}}
{{/each}}

### 质量门禁
{{#each techDesign.quality.gates}}
- [ ] {{criteria}} (阈值: {{threshold}})
{{/each}}

## 🚀 部署设计

### 环境配置
{{#each techDesign.deployment.environments}}
#### {{name}}环境
- **配置**: {{configuration}}
- **资源要求**: {{resources}}
- **部署策略**: {{strategy}}

{{/each}}

### CI/CD 流程
```mermaid
{{techDesign.deployment.cicdFlow}}
```

### 部署检查清单
{{#each techDesign.deployment.checklist}}
- [ ] {{item}}
{{/each}}

## 🔄 运维设计

### 监控告警
{{#each techDesign.operations.monitoring}}
- **{{component}}**: {{metrics}} (告警条件: {{alertConditions}})
{{/each}}

### 日志设计
{{#each techDesign.operations.logging}}
- **{{level}}**: {{content}}
{{/each}}

### 故障处理
{{#each techDesign.operations.errorHandling}}
#### {{scenario}}
- **检测方式**: {{detection}}
- **恢复步骤**: {{recovery}}
- **预防措施**: {{prevention}}

{{/each}}

## 📈 扩展规划

### 可扩展性设计
{{#each techDesign.scalability.dimensions}}
- **{{dimension}}**: {{approach}}
{{/each}}

### 模块化策略
{{#each techDesign.scalability.modularity}}
- **{{module}}**: {{strategy}}
{{/each}}

### 未来演进
{{#each techDesign.scalability.evolution}}
- **阶段{{stage}}**: {{plan}}
{{/each}}

## 🎯 实施计划

### 开发阶段
{{#each techDesign.implementation.phases}}
#### 阶段{{phase}}: {{name}}
- **目标**: {{goals}}
- **工期**: {{timeline}}
- **里程碑**: {{milestones}}
- **风险**: {{risks}}

{{/each}}

### 资源需求
{{#each techDesign.implementation.resources}}
- **{{type}}**: {{requirement}}
{{/each}}

### 依赖管理
{{#each techDesign.implementation.dependencies}}
- **{{name}}**: {{description}} (影响: {{impact}})
{{/each}}

---

## 📋 检查清单

### 设计完整性
{{#each techDesign.qualityAssessment.completeness}}
- [ ] {{criterion}}
{{/each}}

### 技术可行性
{{#each techDesign.qualityAssessment.feasibility}}
- [ ] {{criterion}}
{{/each}}

### 风险评估
{{#each techDesign.qualityAssessment.risks}}
- **{{risk}}** (严重程度: {{severity}}) - 缓解措施: {{mitigation}}
{{/each}}

---

**文档版本**: v1.0  
**创建时间**: {{timestamp}}  
**分析ID**: {{analysisId}}  
**复杂度评分**: {{complexityScore}}/100