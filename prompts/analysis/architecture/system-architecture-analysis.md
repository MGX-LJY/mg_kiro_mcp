# 系统架构智能分析模板

你是一个技术架构师。请基于项目扫描数据生成系统架构分析。

## 输入数据
**项目结构数据**: {{structureData}}
**语言检测结果**: {{languageData}}
**文件内容分析**: {{filesData}}
**项目路径**: {{projectPath}}

## 分析目标

### 1. 系统概述生成
分析项目特征，生成系统概述：
- 项目类型和规模
- 核心技术栈
- 架构模式识别
- 业务领域分析

### 2. 核心组件识别
基于文件结构和内容识别核心组件：
- 主要模块划分
- 组件职责描述
- 关键接口定义
- 依赖关系映射

### 3. 数据流分析
分析系统数据流向：
- 数据输入输出点
- 处理流程链路
- 存储机制
- API调用关系

### 4. 技术架构评估
评估技术选型合理性：
- 框架适配度
- 扩展性分析
- 性能特征
- 维护复杂度

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "systemOverview": {
    "projectType": "项目类型(web应用/API服务/库/工具等)",
    "projectScale": "项目规模(small/medium/large/enterprise)",
    "coreBusinessDomain": "核心业务领域描述",
    "architecturalPattern": "架构模式(MVC/微服务/单体/etc)",
    "technicalComplexity": "技术复杂度评估(1-10分)",
    "description": "系统整体概述(2-3句话)"
  },
  "coreComponents": [
    {
      "name": "组件名称",
      "type": "组件类型(service/controller/model/utility/etc)",
      "responsibility": "核心职责描述",
      "files": ["相关文件列表"],
      "dependencies": ["依赖的其他组件"],
      "interfaces": ["对外提供的接口"],
      "complexity": "复杂度评级(low/medium/high)"
    }
  ],
  "dataFlow": {
    "entryPoints": ["数据输入点"],
    "processLayers": ["处理层级"],
    "outputPoints": ["数据输出点"],
    "storagePattern": "存储模式",
    "apiEndpoints": ["关键API端点"],
    "flowDescription": "数据流向描述"
  },
  "technicalStack": {
    "primaryLanguage": "主要开发语言",
    "frameworks": ["使用的框架"],
    "buildTools": ["构建工具"],
    "testingFramework": ["测试框架"],
    "codeQuality": ["代码质量工具"],
    "deployment": ["部署相关工具"]
  },
  "architecturalRecommendations": [
    {
      "category": "改进类别",
      "suggestion": "具体建议",
      "priority": "优先级(high/medium/low)",
      "rationale": "建议理由"
    }
  ],
  "qualityMetrics": {
    "codeOrganization": "代码组织程度(1-10分)",
    "documentationLevel": "文档完整度(1-10分)",
    "testCoverage": "测试覆盖程度(1-10分)",
    "maintainability": "可维护性(1-10分)",
    "scalability": "可扩展性(1-10分)"
  }
}
```

## 分析指南

### 项目类型识别
- **Web应用**: 包含前端UI组件、路由、状态管理
- **API服务**: 主要是路由、控制器、中间件
- **库/框架**: 模块化导出、API设计、文档
- **工具/CLI**: 命令行处理、配置管理

### 架构模式识别
- **MVC**: Controllers + Models + Views结构
- **微服务**: 多个独立服务模块
- **单体**: 单一入口点，功能耦合
- **组件化**: 可复用组件设计

### 复杂度评估标准
- **1-3分**: 简单项目，基本CRUD功能
- **4-6分**: 中等复杂度，有业务逻辑
- **7-8分**: 复杂项目，多模块集成
- **9-10分**: 企业级，高度复杂架构

### 语言特定考虑

{{#if (eq primaryLanguage "javascript")}}
**JavaScript特定分析**:
- React/Vue/Angular框架特征
- Node.js服务器端模式
- NPM依赖管理复杂度
- ES6+特性使用情况
{{else if (eq primaryLanguage "python")}}
**Python特定分析**:
- Django/Flask/FastAPI框架
- 包管理和虚拟环境
- 异步编程模式
- 数据科学工具使用
{{else if (eq primaryLanguage "java")}}
**Java特定分析**:
- Spring生态系统
- Maven/Gradle构建系统
- 企业级设计模式
- JVM相关配置
{{/if}}

请基于提供的项目数据，进行全面的系统架构分析，生成结构化的分析结果。