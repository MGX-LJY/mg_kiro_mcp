# 代码架构生成文档模板

## 项目信息
**功能名称**: {{featureId}}
**主要技术**: {{primaryLanguage}}
**架构模式**: {{architecturePattern}}

---

# {{featureId}} 代码架构文档

## 🏗️ 架构总览

### 系统架构图
```mermaid
{{codeArchitecture.overview.systemDiagram}}
```

### 核心设计理念
{{codeArchitecture.overview.designPrinciples}}

### 架构决策记录 (ADR)
{{#each codeArchitecture.overview.architectureDecisions}}
#### ADR-{{id}}: {{title}}
- **状态**: {{status}}
- **决策**: {{decision}}
- **理由**: {{rationale}}
- **后果**: {{consequences}}

{{/each}}

## 📁 目录结构设计

### 项目根目录
```
{{codeArchitecture.structure.directoryTree}}
```

### 目录说明
{{#each codeArchitecture.structure.directories}}
#### {{path}}
**用途**: {{purpose}}
**包含内容**: {{contents}}
**命名约定**: {{namingConvention}}

{{#if subDirectories}}
##### 子目录结构
{{#each subDirectories}}
- `{{name}}/` - {{description}}
{{/each}}
{{/if}}

{{/each}}

## 🔧 模块设计

### 模块分层架构
```mermaid
{{codeArchitecture.modules.layerDiagram}}
```

### 核心模块
{{#each codeArchitecture.modules.coreModules}}
#### {{moduleName}}
**层级**: {{layer}}
**职责**: {{responsibility}}
**对外接口**: {{publicInterface}}

##### 文件结构
```
{{fileStructure}}
```

##### 关键类/函数
{{#each keyComponents}}
- **{{name}}** ({{type}}) - {{description}}
  - 输入: {{inputs}}
  - 输出: {{outputs}}
  - 依赖: {{dependencies}}

{{/each}}

##### 模块依赖
```mermaid
{{dependencyDiagram}}
```

{{/each}}

## 🔌 接口设计

### API 层设计
{{#each codeArchitecture.interfaces.apiLayer}}
#### {{controllerName}}
**路由前缀**: `{{routePrefix}}`
**中间件**: {{middlewares}}

##### 端点定义
{{#each endpoints}}
```javascript
// {{description}}
{{method}} {{path}}
async {{handlerName}}(req, res) {
  // 输入验证
  {{inputValidation}}
  
  // 业务逻辑调用
  {{businessLogic}}
  
  // 响应处理
  {{responseHandling}}
}
```

{{/each}}

{{/each}}

### 服务层设计
{{#each codeArchitecture.interfaces.serviceLayer}}
#### {{serviceName}}
**单一职责**: {{responsibility}}
**依赖注入**: {{dependencies}}

##### 服务接口
```javascript
class {{serviceName}} {
  {{#each methods}}
  // {{description}}
  async {{methodName}}({{parameters}}) {
    {{implementation}}
  }
  
  {{/each}}
}
```

{{/each}}

### 数据访问层设计
{{#each codeArchitecture.interfaces.dataLayer}}
#### {{repositoryName}}
**数据源**: {{dataSource}}
**ORM/ODM**: {{ormFramework}}

##### Repository 模式
```javascript
class {{repositoryName}} {
  {{#each operations}}
  // {{description}}
  async {{operationName}}({{parameters}}) {
    {{queryLogic}}
  }
  
  {{/each}}
}
```

{{/each}}

## 🎯 设计模式应用

### 创建型模式
{{#each codeArchitecture.patterns.creational}}
#### {{patternName}}
**应用场景**: {{useCase}}
**实现位置**: {{location}}
**代码示例**:
```javascript
{{codeExample}}
```

{{/each}}

### 结构型模式
{{#each codeArchitecture.patterns.structural}}
#### {{patternName}}
**应用场景**: {{useCase}}
**实现位置**: {{location}}
**代码示例**:
```javascript
{{codeExample}}
```

{{/each}}

### 行为型模式
{{#each codeArchitecture.patterns.behavioral}}
#### {{patternName}}
**应用场景**: {{useCase}}
**实现位置**: {{location}}
**代码示例**:
```javascript
{{codeExample}}
```

{{/each}}

## 🔗 依赖管理

### 依赖注入策略
{{codeArchitecture.dependencies.injectionStrategy}}

### 依赖图谱
```mermaid
{{codeArchitecture.dependencies.dependencyGraph}}
```

### 包管理
{{#each codeArchitecture.dependencies.packages}}
#### {{category}}
{{#each packages}}
- **{{packageName}}**: {{version}} - {{purpose}}
{{/each}}

{{/each}}

### 循环依赖检测
{{#each codeArchitecture.dependencies.circularDependencies}}
- **循环路径**: {{path}}
- **解决方案**: {{solution}}
{{/each}}

## 📊 数据流设计

### 数据流图
```mermaid
{{codeArchitecture.dataFlow.diagram}}
```

### 状态管理
{{#each codeArchitecture.dataFlow.stateManagement}}
#### {{stateName}}
**存储位置**: {{storageLocation}}
**更新策略**: {{updateStrategy}}
**生命周期**: {{lifecycle}}

##### 状态转换
```javascript
{{stateTransitions}}
```

{{/each}}

### 事件流处理
{{#each codeArchitecture.dataFlow.eventFlow}}
#### {{eventType}}
**触发条件**: {{triggers}}
**处理流程**: {{processingFlow}}
**副作用**: {{sideEffects}}

{{/each}}

## 🔒 安全架构

### 认证授权设计
```mermaid
{{codeArchitecture.security.authFlow}}
```

### 安全层级
{{#each codeArchitecture.security.securityLayers}}
#### {{layer}}级安全
**防护措施**: {{protections}}
**实现方式**: {{implementation}}
**验证点**: {{validationPoints}}

{{/each}}

### 数据保护策略
{{#each codeArchitecture.security.dataProtection}}
- **{{dataType}}**: {{protectionMethod}}
{{/each}}

## ⚡ 性能架构

### 性能优化策略
{{#each codeArchitecture.performance.optimizations}}
#### {{category}}
**优化手段**: {{techniques}}
**预期提升**: {{expectedGain}}
**实现复杂度**: {{complexity}}

{{/each}}

### 缓存设计
```mermaid
{{codeArchitecture.performance.cacheArchitecture}}
```

### 异步处理
{{#each codeArchitecture.performance.asyncProcessing}}
#### {{processType}}
**异步策略**: {{strategy}}
**队列设计**: {{queueDesign}}
**错误处理**: {{errorHandling}}

{{/each}}

## 🧪 测试架构

### 测试金字塔
```mermaid
{{codeArchitecture.testing.testPyramid}}
```

### 测试分层策略
{{#each codeArchitecture.testing.testLayers}}
#### {{layer}}测试
**测试范围**: {{scope}}
**工具选择**: {{tools}}
**覆盖目标**: {{coverageTarget}}
**执行策略**: {{executionStrategy}}

##### 测试用例模板
```javascript
{{testTemplate}}
```

{{/each}}

### Mock 和 Stub 策略
{{#each codeArchitecture.testing.mockingStrategy}}
- **{{component}}**: {{mockingApproach}}
{{/each}}

## 📦 构建和部署

### 构建流程
```mermaid
{{codeArchitecture.build.buildPipeline}}
```

### 部署架构
{{#each codeArchitecture.deployment.environments}}
#### {{environment}}环境
**部署策略**: {{deploymentStrategy}}
**配置管理**: {{configManagement}}
**监控接入**: {{monitoringSetup}}

{{/each}}

### 容器化设计
{{#if codeArchitecture.deployment.containerization}}
#### Docker 配置
```dockerfile
{{codeArchitecture.deployment.containerization.dockerfile}}
```

#### Kubernetes 部署
```yaml
{{codeArchitecture.deployment.containerization.k8sConfig}}
```
{{/if}}

## 📈 监控和运维

### 可观测性设计
```mermaid
{{codeArchitecture.observability.architecture}}
```

### 日志设计
{{#each codeArchitecture.observability.logging}}
#### {{logLevel}}级日志
**记录内容**: {{content}}
**输出格式**: {{format}}
**存储策略**: {{storage}}

{{/each}}

### 指标监控
{{#each codeArchitecture.observability.metrics}}
- **{{metricName}}**: {{description}} (类型: {{type}})
{{/each}}

### 链路追踪
{{codeArchitecture.observability.tracing.strategy}}

## 🔄 扩展性设计

### 水平扩展
{{#each codeArchitecture.scalability.horizontal}}
- **{{component}}**: {{scalingStrategy}}
{{/each}}

### 垂直扩展
{{#each codeArchitecture.scalability.vertical}}
- **{{component}}**: {{scalingStrategy}}
{{/each}}

### 模块化扩展
{{#each codeArchitecture.scalability.modular}}
#### {{moduleType}}
**扩展接口**: {{extensionInterface}}
**插件机制**: {{pluginMechanism}}
**热加载支持**: {{hotReloading}}

{{/each}}

## 📋 代码生成清单

### 脚手架文件
{{#each codeArchitecture.scaffolding.files}}
- [ ] **{{filePath}}** - {{description}}
  - 模板: {{template}}
  - 变量: {{variables}}

{{/each}}

### 配置文件
{{#each codeArchitecture.scaffolding.configurations}}
- [ ] **{{configFile}}** - {{purpose}}
  - 格式: {{format}}
  - 主要配置: {{keySettings}}

{{/each}}

### 初始化脚本
{{#each codeArchitecture.scaffolding.initScripts}}
- [ ] **{{scriptName}}** - {{purpose}}
```bash
{{scriptContent}}
```

{{/each}}

---

## 📊 架构质量评估

### 复杂度分析
- **圈复杂度**: {{qualityAssessment.cyclomaticComplexity}}/10
- **耦合度**: {{qualityAssessment.coupling}}/10  
- **内聚性**: {{qualityAssessment.cohesion}}/10

### 可维护性指标
- **可读性**: {{qualityAssessment.readability}}/100
- **可测试性**: {{qualityAssessment.testability}}/100
- **可扩展性**: {{qualityAssessment.extensibility}}/100

### 技术债务评估
{{#each qualityAssessment.technicalDebt}}
- **{{area}}**: {{debtLevel}} (预计修复时间: {{fixTime}})
{{/each}}

---

**文档版本**: v1.0  
**创建时间**: {{timestamp}}  
**架构师**: {{architect}}  
**分析ID**: {{analysisId}}  
**架构复杂度**: {{complexityScore}}/100