# {{project_name}} - 集成契约文档

## 项目概览

**项目名称**: {{project_name}}  
**主要语言**: {{primary_language}}  
**生成时间**: {{generated_at}}  
**项目路径**: {{project_path}}  
**文档版本**: 1.0.0

{{project_overview}}

## 系统架构摘要

{{architecture_summary}}

### 核心指标

- **总模块数**: {{total_modules}}
- **模块关系**: {{total_relations}} 
- **集成点**: {{integration_points_count}}
- **API契约**: {{api_contracts_count}}
- **数据流**: {{data_flows_count}}
- **外部依赖**: {{external_deps_count}}

---

## 🏗️ 模块关系图

### 模块列表

{{#each module_relations.modules}}
#### {{name}} ({{category}})

- **路径**: `{{path}}`
- **类型**: {{type}}
- **代码行数**: {{metrics.lines}}
- **函数数量**: {{metrics.functions}}
- **复杂度**: {{metrics.complexity}}

{{/each}}

### 模块间关系统计

{{#each module_relations.statistics.relationTypes}}
- **{{@key}}**: {{this}} 个关系
{{/each}}

### 关系强度分布

- **强耦合关系** (>0.7): {{module_relations.statistics.strongRelations}}
- **松耦合关系** (<0.3): {{module_relations.statistics.weakRelations}}
- **中等耦合关系**: {{module_relations.statistics.totalRelations}} - {{module_relations.statistics.strongRelations}} - {{module_relations.statistics.weakRelations}}

### 依赖关系图表

```mermaid
graph TD
{{#each module_relations.relations}}
    {{source.moduleId}}[{{source.moduleName}}] -->|{{type}}| {{target.moduleId}}[{{target.moduleName}}]
{{/each}}
    
    classDef core fill:#e1f5fe
    classDef business fill:#f3e5f5  
    classDef service fill:#e8f5e8
    classDef utility fill:#fff3e0
    
{{#each module_relations.modules}}
    class {{id}} {{category}}
{{/each}}
```

---

## 🔗 集成点分析

总计发现 **{{integration_points_count}}** 个集成点：

{{#each integration_points}}
### {{id}}

- **集成类型**: {{type}}
- **复杂度评分**: {{complexity}}/1.0
- **描述**: {{description}}

#### 源模块
- **模块**: {{source.moduleName}} ({{source.category}})
- **路径**: `{{source.path}}`

#### 目标模块  
- **模块**: {{target.moduleName}} ({{target.category}})
- **路径**: `{{target.path}}`

#### 接口定义
{{#if interfaces}}
{{#each interfaces}}
- {{name}}: {{description}}
{{/each}}
{{else}}
*接口信息待分析*
{{/if}}

#### 风险评估
{{#each risks}}
- **{{severity}}**: {{description}}
{{/each}}

#### 改进建议
{{#each recommendations}}
- {{description}}
{{/each}}

---
{{/each}}

## 📋 API契约规范

### 契约统计

{{#if api_contracts.statistics.totalContracts}}
- **总契约数**: {{api_contracts.statistics.totalContracts}}
- **REST API**: {{api_contracts.statistics.restApis}}
- **GraphQL API**: {{api_contracts.statistics.graphqlApis}}
- **RPC API**: {{api_contracts.statistics.rpcApis}}
- **内部API**: {{api_contracts.statistics.internalApis}}
- **外部API**: {{api_contracts.statistics.externalApis}}

### 契约详情

{{#each api_contracts.contracts}}
#### {{name}}

- **类型**: {{contractType}}
- **作用域**: {{scope}}
- **版本**: {{version}}
- **状态**: {{status}}

##### 端点信息
- **基础路径**: `{{basePath}}`
- **认证方式**: {{authentication}}
- **请求格式**: {{requestFormat}}
- **响应格式**: {{responseFormat}}

##### 接口列表
{{#each endpoints}}
- **{{method}} {{path}}**: {{description}}
  - 请求参数: {{#each parameters}}{{name}} ({{type}}){{#unless @last}}, {{/unless}}{{/each}}
  - 响应类型: {{responseType}}
{{/each}}

##### 数据模型
{{#each dataModels}}
- **{{name}}**: {{description}}
{{/each}}

---
{{/each}}

{{else}}
*未检测到明确的API契约，可能需要手动补充或代码中缺少相关注释。*
{{/if}}

---

## 🌊 数据流向分析

### 数据流统计

- **总数据流**: {{data_flow.statistics.totalFlows}}
- **同步数据流**: {{data_flow.statistics.synchronousFlows}}
- **异步数据流**: {{data_flow.statistics.asynchronousFlows}}
- **双向数据流**: {{data_flow.statistics.bidirectionalFlows}}

### 数据类型

{{#each data_flow.statistics.dataTypes}}
- {{this}}
{{/each}}

### 数据流向图

```mermaid
flowchart TD
{{#each data_flow.flows}}
    {{sourceId}}[{{sourceName}}] -->|{{dataType}}| {{targetId}}[{{targetName}}]
{{/each}}
    
    subgraph "同步流"
        direction TB
{{#each data_flow.flows}}
    {{#if (eq type 'synchronous')}}
        {{sourceId}} -.-> {{targetId}}
    {{/if}}
{{/each}}
    end
    
    subgraph "异步流"
        direction TB
{{#each data_flow.flows}}
    {{#if (eq type 'asynchronous')}}
        {{sourceId}} ===> {{targetId}}
    {{/if}}
{{/each}}
    end
```

### 关键数据路径

{{#each data_flow.criticalPaths}}
#### {{name}}

- **路径**: {{path}}
- **数据类型**: {{dataType}}
- **流向**: {{direction}}
- **重要性**: {{importance}}
- **延迟要求**: {{latencyRequirement}}

{{/each}}

---

## 🔌 外部依赖分析  

### 依赖统计

- **总依赖数**: {{external_dependencies.statistics.totalDependencies}}
- **关键依赖**: {{external_dependencies.statistics.criticalDependencies}}
- **安全风险**: {{external_dependencies.statistics.securityRisks}}
- **过时依赖**: {{external_dependencies.statistics.outdatedDependencies}}

### 依赖类型分布

{{#each external_dependencies.statistics.dependencyTypes}}
- **{{@key}}**: {{this}} 个
{{/each}}

### 依赖详情

{{#each external_dependencies.dependencies}}
#### {{name}}

- **类型**: {{type}}
- **版本**: {{version}}
- **作用域**: {{scope}}
- **来源文件**: `{{source}}`
- **关键程度**: {{#if critical}}🔴 关键{{else}}⚪ 一般{{/if}}
- **安全风险**: {{#if (gt securityRisk 0.5)}}⚠️ {{securityRisk}}{{else}}✅ 低风险{{/if}}

{{/each}}

### 安全风险评估

{{#each external_dependencies.securityRisks}}
#### {{dependency}}

- **风险等级**: {{risk}}
- **来源**: `{{source}}`
- **风险原因**: {{reason}}
- **建议**: 及时更新到安全版本

{{/each}}

---

## 🔄 集成流程图

### 模块交互时序图

```mermaid
sequenceDiagram
    participant Client as 客户端
{{#each module_relations.modules}}
    participant {{id}} as {{name}}
{{/each}}

{{#each integration_points}}
    Client->>{{source.moduleId}}: 请求{{type}}服务
    {{source.moduleId}}->>{{target.moduleId}}: 调用{{description}}
    {{target.moduleId}}-->>{{source.moduleId}}: 返回结果
    {{source.moduleId}}-->>Client: 响应数据
{{/each}}
```

### 数据流程图

```mermaid
graph LR
    subgraph "数据输入"
        A[外部数据源]
        B[用户输入]
        C[配置文件]
    end
    
    subgraph "数据处理"
{{#each module_relations.modules}}
    {{#if (eq category 'business')}}
        {{id}}[{{name}}]
    {{/if}}
{{/each}}
    end
    
    subgraph "数据输出"
        X[API响应]
        Y[文件输出]
        Z[日志记录]
    end
    
    A --> {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}}
    B --> {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}}
    C --> {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}}
    
    {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}} --> X
    {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}} --> Y
    {{#each module_relations.modules}}{{#if (eq category 'business')}}{{id}}{{/if}}{{/each}} --> Z
```

---

## 💡 改进建议

{{#each recommendations}}
### {{@index}}. {{title}} (优先级: {{priority}})

**类别**: {{type}}  
**影响范围**: {{impact}}

{{description}}

#### 建议措施
1. 分析当前{{type}}状况
2. 制定改进计划
3. 逐步实施优化
4. 验证改进效果

---
{{/each}}

## ⚠️ 风险识别

{{#each risks}}
### {{@index}}. {{title}} (严重程度: {{severity}})

**风险类型**: {{type}}

{{description}}

#### 影响的模块/组件
{{#each affected}}
- {{this}}
{{/each}}

#### 缓解策略
{{mitigation}}

#### 监控指标
- 定期检查相关模块的健康状态
- 监控系统性能指标
- 建立告警机制

---
{{/each}}

## 📊 SLA指标与监控

### 性能指标

| 接口类别 | 响应时间 | 可用性 | QPS |
|---------|---------|--------|-----|
| 查询接口 | < 100ms | 99.9% | 10,000 |
| 写入接口 | < 200ms | 99.9% | 5,000 |
| 复杂计算 | < 500ms | 99.5% | 1,000 |

### 监控建议

1. **响应时间监控**: 建立接口响应时间告警
2. **错误率监控**: 监控各模块错误率变化
3. **依赖健康检查**: 定期检查外部依赖状态
4. **资源使用率**: 监控CPU、内存、磁盘使用情况

---

## 🔧 版本管理与演进

### 版本策略

- **语义化版本**: 遵循 `MAJOR.MINOR.PATCH` 格式
- **向后兼容**: 保持API向后兼容性
- **废弃通知**: 提前3个版本通知API废弃
- **迁移指南**: 为每个重大变更提供迁移文档

### 变更管理流程

1. **需求分析**: 评估变更的必要性和影响范围
2. **设计评审**: 技术方案评审和架构影响评估  
3. **兼容性测试**: 确保新版本的向后兼容性
4. **灰度发布**: 渐进式部署和监控
5. **全量上线**: 完成部署并持续监控

---

## 📚 附录

### 术语表

- **模块**: 具有独立功能的代码单元
- **集成点**: 模块间的交互接口
- **契约**: 模块间协作的规范和约定
- **数据流**: 数据在系统中的流转路径
- **依赖**: 模块对外部组件的引用关系

### 相关文档

- [系统架构文档](./system-architecture.md)
- [模块目录](./modules-catalog.md)  
- [API文档](./api-documentation.md)
- [开发工作流](./development-workflow.md)

### 联系信息

- **技术负责人**: [姓名]
- **架构师**: [姓名]
- **文档维护**: [姓名]

---

### 生成信息

- **生成工具**: mg_kiro MCP Server v2.0.1
- **分析时间**: {{generated_at}}
- **分析语言**: {{primary_language}}
- **文档格式**: Markdown + Mermaid

---

*本文档基于代码静态分析自动生成，建议结合人工审核和补充。如有疑问请联系开发团队。*