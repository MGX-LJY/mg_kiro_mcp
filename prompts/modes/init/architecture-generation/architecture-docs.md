# {{projectName}} - 架构文档模板集

## 📖 README.md 模板

```markdown
# {{projectName}}

## 📖 项目概述

{{projectDescription}}

### 🎯 核心价值
{{coreValue}}

### ✨ 主要功能特性
{{mainFeatures}}

### 🛠️ 技术栈
{{techStack}}

## 🏗️ 架构概览

### 📊 系统架构图
```mermaid
{{systemArchitectureDiagram}}
```

### 🧩 核心模块
{{coreModules}}

### 🔧 技术架构选型
{{technicalChoices}}

## 🚀 快速开始

### 📋 环境要求
{{requirements}}

### ⚙️ 安装步骤
```bash
{{installationSteps}}
```

### 🎮 运行指南
```bash
{{runningGuide}}
```

### 🧪 测试
```bash
{{testingCommands}}
```

## 📚 文档导航

- [📐 架构设计](./architecture.md) - 详细的技术架构文档
- [👨‍💻 开发指南](./development.md) - 开发环境和流程说明
- [📦 模块总览](./modules/module-overview.md) - 功能模块详细说明
- [🔗 关联分析](./relations/overview.md) - 模块关联和依赖分析
- [📋 完整文档索引](./docs-index.md) - 所有文档的索引

## 🤝 贡献

{{contributionGuidelines}}

## 📄 许可证

{{license}}
```

---

## 🏛️ architecture.md 模板

```markdown
# {{projectName}} - 架构设计文档

## 🏗️ 整体架构

### 🎯 设计理念
{{designPhilosophy}}

### 📊 系统架构图
```mermaid
{{detailedArchitectureDiagram}}
```

### 🛠️ 技术选型说明
{{technicalDecisions}}

### 📐 设计原则
{{designPrinciples}}

## 📦 模块架构

### 🧩 模块划分策略
{{moduleStrategy}}

### 📋 模块职责分工
{{moduleResponsibilities}}

### 🔄 模块间交互关系
```mermaid
{{moduleInteractionDiagram}}
```

### 📊 模块依赖图
```mermaid
{{moduleDependencyDiagram}}
```

## 🔗 依赖关系

### 📈 核心依赖分析
{{coreDependencyAnalysis}}

### 🌊 数据流向图
```mermaid
{{dataFlowDiagram}}
```

### 🎯 接口设计原则
{{interfaceDesignPrinciples}}

### 🔌 API设计模式
{{apiDesignPatterns}}

## ⚡ 性能架构

### 🚀 性能关键点
{{performanceCriticalPoints}}

### 📈 扩展性设计
```mermaid
{{scalabilityDesign}}
```

### 🔍 监控策略
{{monitoringStrategy}}

### ⚡ 优化策略
{{optimizationStrategies}}

## 🛡️ 安全架构

### 🔒 安全设计
{{securityDesign}}

### 🛡️ 防护措施
{{securityMeasures}}

### 🔐 权限控制
{{accessControl}}

## 📊 数据架构

### 🗄️ 数据模型
{{dataModel}}

### 📈 数据流设计
{{dataFlowDesign}}

### 💾 存储策略
{{storageStrategy}}

## 🔄 部署架构

### 🚀 部署模式
{{deploymentPattern}}

### 🏗️ 基础设施
{{infrastructure}}

### 📦 容器化策略
{{containerizationStrategy}}

---

## 👨‍💻 development.md 模板

```markdown
# {{projectName}} - 开发指南

## 🛠️ 开发环境

### 📋 环境要求
{{developmentRequirements}}

### ⚙️ 环境搭建步骤
{{setupSteps}}

### 🔧 开发工具推荐
{{recommendedTools}}

### 🎛️ 配置说明
{{configurationGuide}}

## 📝 开发规范

### 📐 代码规范
{{codingStandards}}

### 🌿 分支管理规范
{{branchingStrategy}}

### 📝 提交规范
{{commitConventions}}

### 📖 文档规范
{{documentationStandards}}

## 🔧 开发流程

### 🚀 功能开发流程
{{featureDevelopmentFlow}}

### 🐛 Bug修复流程
{{bugFixingFlow}}

### 🧪 测试流程
{{testingFlow}}

### 📦 发布流程
{{releaseFlow}}

## 🧪 测试指南

### 🔬 单元测试
{{unitTestingGuide}}

### 🔗 集成测试
{{integrationTestingGuide}}

### 🎭 端到端测试
{{e2eTestingGuide}}

### 📊 测试覆盖率
{{testCoverageGuide}}

## 🐛 调试指南

### 🔍 调试技巧
{{debuggingTips}}

### 📊 性能分析
{{performanceProfiling}}

### 📝 日志分析
{{logAnalysis}}

### 🔧 常见问题解决
{{commonIssues}}

## 🚀 贡献指南

### 📥 如何贡献代码
{{contributionProcess}}

### 📋 Issue报告规范
{{issueReportingGuidelines}}

### 🔄 Pull Request流程
{{pullRequestProcess}}

### 👥 代码审查指南
{{codeReviewGuide}}

## 🔄 发布管理

### 📦 版本管理
{{versionManagement}}

### 🚀 发布流程
{{releaseProcess}}

### 📝 变更日志
{{changelogManagement}}

---

## 📋 docs-index.md 模板

```markdown
# {{projectName}} - 文档索引

## 🏠 主要文档

| 文档 | 描述 | 更新时间 |
|------|------|----------|
| [README.md](./README.md) | 项目总览和快速开始 | {{readmeUpdateTime}} |
| [architecture.md](./architecture.md) | 详细架构设计文档 | {{archUpdateTime}} |
| [development.md](./development.md) | 开发指南和规范 | {{devUpdateTime}} |

## 📁 文件文档

### 🔧 核心文件
{{coreFilesDocs}}

### 🛠️ 工具文件
{{utilityFilesDocs}}

### ⚙️ 配置文件
{{configFilesDocs}}

### 🧪 测试文件
{{testFilesDocs}}

## 📦 模块文档

### 🏗️ 主要模块
{{mainModulesDocs}}

### 🔌 服务模块
{{serviceModulesDocs}}

### 📊 数据模块
{{dataModulesDocs}}

### 🎯 业务模块
{{businessModulesDocs}}

## 🔗 关联文档

| 文档 | 内容 | 重要性 |
|------|------|--------|
| [函数调用关系](./relations/function-calls.md) | 跨模块函数调用分析 | ⭐⭐⭐ |
| [模块依赖关系](./relations/module-dependencies.md) | 模块间依赖关系图 | ⭐⭐⭐ |
| [数据流向分析](./relations/data-flows.md) | 数据传递和变换分析 | ⭐⭐ |
| [关联总览](./relations/overview.md) | 整体关联关系总结 | ⭐⭐⭐ |

## 🎯 专题文档

### 🏗️ 架构相关
{{architectureDocs}}

### ⚡ 性能相关
{{performanceDocs}}

### 🛡️ 安全相关
{{securityDocs}}

### 🧪 测试相关
{{testingDocs}}

## 📊 统计信息

- **文档总数**: {{totalDocs}}
- **模块数量**: {{moduleCount}}
- **文件数量**: {{fileCount}}
- **最后更新**: {{lastUpdateTime}}

---

**文档生成工具**: mg_kiro v5.0.0  
**生成时间**: {{generatedAt}}
```