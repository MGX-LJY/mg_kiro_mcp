# 技术栈智能分析模板

你是一个技术架构专家。请基于项目数据生成技术栈深度分析。

## 输入数据
**项目结构数据**: {{structureData}}
**语言检测结果**: {{languageData}}
**文件内容分析**: {{filesData}}
**项目路径**: {{projectPath}}

## 分析目标

### 1. 技术栈识别与分类
深度识别项目使用的所有技术组件：
- 编程语言与版本
- 核心框架与库
- 构建工具与打包器
- 测试框架与工具
- 部署与CI/CD工具
- 数据库与存储技术

### 2. 技术选型合理性分析
评估当前技术选型：
- 技术兼容性分析
- 性能特征评估
- 维护成本分析
- 学习曲线评估
- 社区支持度
- 长期可持续性

### 3. 技术债务识别
识别技术层面的问题：
- 过时技术组件
- 版本不一致问题
- 安全漏洞风险
- 性能瓶颈技术
- 冗余技术选择

### 4. 技术升级建议
提供技术优化方向：
- 版本升级建议
- 替代技术方案
- 性能优化技术
- 安全加固措施
- 现代化改进建议

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "techStackAnalysis": {
    "primaryLanguage": "主要开发语言",
    "languageVersion": "语言版本",
    "confidence": "识别置信度(0-100)",
    "detectionMethod": "检测方式(config_file/imports/syntax)"
  },
  "technologyLayers": {
    "runtime": {
      "name": "运行时环境",
      "version": "版本信息",
      "configFiles": ["相关配置文件"],
      "status": "状态(current/outdated/deprecated)"
    },
    "frameworks": [
      {
        "name": "框架名称",
        "category": "框架类别(frontend/backend/fullstack/testing)",
        "version": "版本",
        "usage": "使用程度(primary/secondary/dev-only)",
        "files": ["相关文件"],
        "maturityLevel": "成熟度(experimental/stable/mature/legacy)"
      }
    ],
    "buildTools": [
      {
        "name": "构建工具",
        "purpose": "用途(bundling/transpiling/optimization)",
        "configFile": "配置文件",
        "version": "版本信息"
      }
    ],
    "databases": [
      {
        "type": "数据库类型",
        "name": "具体技术",
        "usage": "使用场景",
        "configFiles": ["配置文件"]
      }
    ],
    "deployment": [
      {
        "platform": "部署平台",
        "tool": "部署工具",
        "configFiles": ["配置文件"],
        "containerized": "是否容器化"
      }
    ]
  },
  "technicalAssessment": {
    "overallModernity": "整体现代化程度(0-100)",
    "performanceRating": "性能评级(0-100)",
    "maintainabilityScore": "可维护性(0-100)",
    "securityLevel": "安全等级(low/medium/high)",
    "scalabilityPotential": "扩展性潜力(low/medium/high)",
    "learningCurve": "学习曲线(easy/medium/steep)",
    "communitySupport": "社区支持(weak/moderate/strong)"
  },
  "technicalDebt": [
    {
      "category": "技术债务类别",
      "severity": "严重程度(low/medium/high/critical)",
      "description": "问题描述",
      "affectedComponents": ["影响的组件"],
      "riskLevel": "风险等级(low/medium/high)",
      "estimatedEffort": "修复工作量(hours/days/weeks)"
    }
  ],
  "upgradeRecommendations": [
    {
      "component": "需要升级的组件",
      "currentVersion": "当前版本",
      "recommendedVersion": "建议版本",
      "priority": "优先级(low/medium/high/critical)",
      "rationale": "升级理由",
      "breakingChanges": "破坏性变更风险(none/minor/major)",
      "dependencies": ["相关依赖"],
      "estimatedEffort": "升级工作量"
    }
  ],
  "modernizationOpportunities": [
    {
      "opportunity": "现代化机会",
      "currentApproach": "当前做法",
      "modernApproach": "现代化做法",
      "benefits": ["预期收益"],
      "implementationComplexity": "实施复杂度(low/medium/high)",
      "roi": "投资回报率估算"
    }
  ],
  "technologyRoadmap": {
    "immediate": ["立即执行的技术改进"],
    "shortTerm": ["短期技术规划(1-3个月)"],
    "mediumTerm": ["中期技术规划(3-6个月)"],
    "longTerm": ["长期技术愿景(6个月以上)"]
  }
}
```

## 分析指南

### 技术识别标准
- **配置文件检测**: package.json, requirements.txt, pom.xml等
- **依赖分析**: 通过import/require语句识别使用的库
- **文件扩展名**: 推断编程语言和技术栈
- **目录结构**: 识别框架特征和项目类型

### 评估标准
- **现代化程度**: 技术版本新旧、最佳实践采用
- **性能**: 技术栈的性能特征和优化程度  
- **可维护性**: 代码组织、依赖管理、工具链完整性
- **安全性**: 已知漏洞、安全最佳实践、权限管理

### 语言特定分析
{{#if (eq primaryLanguage "javascript")}}
**JavaScript特定分析**:
- Node.js版本和LTS支持
- 前端框架现代化程度(React 18+, Vue 3+)
- TypeScript采用情况
- ES6+特性使用程度
- 包管理器选择(npm/yarn/pnpm)
{{else if (eq primaryLanguage "python")}}
**Python特定分析**:
- Python版本支持状态
- Django/Flask/FastAPI版本
- 虚拟环境管理
- 异步编程采用
- 类型注解使用情况
{{else if (eq primaryLanguage "java")}}
**Java特定分析**:
- JDK版本和LTS支持
- Spring Boot版本
- 构建系统现代化(Maven/Gradle)
- 微服务架构采用
- 容器化程度
{{/if}}

请基于提供的项目数据，生成全面的技术栈分析报告，重点关注技术选型的合理性和优化建议。