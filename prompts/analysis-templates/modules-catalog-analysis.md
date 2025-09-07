# 模块目录智能分析模板

你是一个代码架构专家。请基于项目文件数据生成模块目录分析。

## 输入数据
**项目文件列表**: {{files}}
**依赖关系图**: {{dependencies}}
**质量指标**: {{qualityIndicators}}
**重要性评分**: {{importance}}
**项目信息**: {{projectInfo}}

## 分析目标

### 1. 模块分类分析
根据文件类型、职责和功能对模块进行智能分类：
- 核心模块 (Core Modules)
- 业务模块 (Business Modules)  
- 工具模块 (Utility Modules)
- 配置模块 (Configuration Modules)
- 测试模块 (Test Modules)
- 文档模块 (Documentation Modules)

### 2. 重要性评估
基于以下标准评估模块重要性：
- 代码行数和复杂度
- 依赖关系数量
- 被依赖频度
- 业务关键程度
- 修改频率

### 3. 质量评估
分析模块质量特征：
- 代码质量等级
- 文档完整度
- 测试覆盖率
- 可维护性指数
- 耦合度分析

### 4. 依赖关系映射
分析模块间依赖关系：
- 依赖深度分析
- 循环依赖检测
- 关键路径识别
- 依赖风险评估

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "moduleCategorization": {
    "core": [
      {
        "name": "模块名称",
        "path": "文件路径",
        "type": "模块类型",
        "description": "功能描述",
        "complexity": "复杂度(low/medium/high)",
        "lines": "代码行数",
        "dependencies": ["依赖的模块列表"],
        "dependents": ["依赖此模块的模块列表"]
      }
    ],
    "business": [],
    "utility": [],
    "configuration": [],
    "test": [],
    "documentation": []
  },
  "importanceRanking": [
    {
      "module": "模块名称",
      "path": "文件路径", 
      "score": "重要性评分(0-100)",
      "category": "所属分类",
      "rationale": "重要性理由",
      "criticalityLevel": "关键程度(critical/important/normal/optional)"
    }
  ],
  "qualityMetrics": {
    "overallQuality": "整体质量评分(0-100)",
    "moduleQuality": [
      {
        "module": "模块名称",
        "codeQuality": "代码质量(0-100)",
        "documentation": "文档质量(0-100)", 
        "testCoverage": "测试覆盖(0-100)",
        "maintainability": "可维护性(0-100)",
        "issues": ["发现的问题列表"]
      }
    ],
    "qualityDistribution": {
      "excellent": "优秀模块数量",
      "good": "良好模块数量",
      "average": "一般模块数量", 
      "poor": "较差模块数量"
    }
  },
  "dependencyAnalysis": {
    "totalDependencies": "依赖关系总数",
    "avgDependenciesPerModule": "平均每模块依赖数",
    "maxDependencyDepth": "最大依赖深度",
    "circularDependencies": ["循环依赖列表"],
    "criticalPath": ["关键依赖路径"],
    "isolatedModules": ["独立模块列表"],
    "highCouplingModules": ["高耦合模块列表"],
    "dependencyRisks": [
      {
        "risk": "风险描述",
        "modules": ["涉及模块"],
        "severity": "严重程度(high/medium/low)",
        "recommendation": "改进建议"
      }
    ]
  },
  "architecturalInsights": {
    "modularityScore": "模块化程度(0-100)",
    "cohesionLevel": "内聚度(high/medium/low)",
    "couplingLevel": "耦合度(loose/moderate/tight)",
    "designPatterns": ["识别的设计模式"],
    "architecturalSmells": ["架构异味列表"],
    "refactoringOpportunities": [
      {
        "opportunity": "重构机会描述",
        "modules": ["相关模块"],
        "benefit": "预期收益",
        "effort": "实施工作量(high/medium/low)"
      }
    ]
  },
  "recommendations": [
    {
      "category": "建议类别",
      "priority": "优先级(high/medium/low)",
      "suggestion": "具体建议",
      "impactedModules": ["影响的模块"],
      "expectedBenefit": "预期收益",
      "implementationEffort": "实施难度"
    }
  ]
}
```

## 分析指南

### 模块分类标准
- **核心模块**: 入口点、主要业务逻辑、框架核心
- **业务模块**: 业务特定功能、领域逻辑
- **工具模块**: 通用工具、辅助函数、库封装
- **配置模块**: 配置文件、环境设置、常量定义
- **测试模块**: 单元测试、集成测试、测试工具
- **文档模块**: README、API文档、说明文件

### 重要性评分因素
- 代码复杂度: 高复杂度模块重要性+20分
- 依赖关系: 每个依赖+2分，每个被依赖+5分
- 文件大小: 大文件重要性相应提高
- 命名特征: main, index, core等关键词+10分

### 质量评估标准
- **优秀(80-100)**: 代码清晰、文档完整、测试充分
- **良好(60-79)**: 整体不错，个别方面需改进
- **一般(40-59)**: 基本可用，多个方面需优化
- **较差(<40)**: 存在明显问题，需要重点关注

### 依赖风险评估
- **循环依赖**: 高风险，影响可维护性
- **过深依赖**: 中等风险，增加复杂度
- **单点依赖**: 高风险，存在故障传播
- **孤立模块**: 低风险，但可能冗余

### 语言特定考虑
{{#if (eq projectInfo.language "javascript")}}
**JavaScript特定分析**:
- 识别React组件、Express路由、Node.js模块
- 分析ES6模块导入导出模式
- 检查NPM依赖管理复杂度
{{else if (eq projectInfo.language "python")}}
**Python特定分析**:
- 识别Django模型、Flask蓝图、包结构
- 分析import语句和包依赖
- 检查__init__.py文件组织
{{else if (eq projectInfo.language "java")}}
**Java特定分析**:
- 识别Spring组件、包结构、接口实现
- 分析import语句和Maven/Gradle依赖
- 检查设计模式使用情况
{{/if}}

请基于提供的文件和依赖数据，进行全面的模块目录分析，生成结构化的分析结果。