# 模块层次结构智能分析模板

你是一个软件架构分析师。请基于项目模块数据生成模块层次结构分析。

## 输入数据
**模块分析结果**: {{moduleAnalysis}}
**项目结构数据**: {{structureData}}
**依赖关系图**: {{dependencies}}
**项目信息**: {{projectInfo}}

## 分析目标

### 1. 模块层次识别
识别项目的模块层次结构：
- 顶层模块识别
- 子模块和组件分析
- 模块嵌套关系
- 层级深度分析

### 2. 架构层级分析
分析软件架构的分层结构：
- 表现层 (Presentation Layer)
- 业务层 (Business/Service Layer)
- 数据访问层 (Data Access Layer)
- 基础设施层 (Infrastructure Layer)

### 3. 模块依赖层次
分析模块间的依赖层次：
- 依赖方向分析
- 循环依赖检测
- 依赖深度评估
- 关键路径识别

## 输出要求

```json
{
  "hierarchyAnalysis": {
    "totalLevels": "层级总数",
    "maxDepth": "最大嵌套深度", 
    "organizationPattern": "组织模式(layered/modular/microservices/monolithic)",
    "hierarchyComplexity": "层次复杂度(low/medium/high)"
  },
  "moduleHierarchy": {
    "topLevel": [
      {
        "name": "顶层模块名",
        "type": "模块类型",
        "path": "模块路径",
        "children": [
          {
            "name": "子模块名",
            "type": "子模块类型",
            "path": "子模块路径",
            "level": "层级深度",
            "children": []
          }
        ],
        "responsibilities": ["主要职责"],
        "interfaces": ["对外接口"]
      }
    ]
  },
  "architecturalLayers": [
    {
      "layer": "架构层名称",
      "level": "层级位置(0-N)",
      "modules": ["包含的模块"],
      "responsibilities": ["层职责"],
      "dependencies": ["依赖的层"],
      "thickness": "层厚度评估(thin/moderate/thick)"
    }
  ],
  "dependencyHierarchy": {
    "dependencyLevels": [
      {
        "level": "依赖层级",
        "modules": ["该层级的模块"],
        "fanIn": "入度统计",
        "fanOut": "出度统计",
        "stability": "稳定性评分(0-100)"
      }
    ],
    "criticalPaths": ["关键依赖路径"],
    "circularDependencies": ["循环依赖组"],
    "isolatedModules": ["孤立模块"]
  },
  "hierarchyMetrics": {
    "averageDepth": "平均嵌套深度",
    "balanceFactor": "平衡因子(0-100)",
    "cohesionScore": "内聚性评分(0-100)", 
    "couplingScore": "耦合度评分(0-100)",
    "modularityIndex": "模块化指数(0-100)"
  },
  "hierarchyIssues": [
    {
      "issue": "层次结构问题",
      "severity": "严重程度(low/medium/high)",
      "affectedModules": ["影响的模块"],
      "description": "问题描述",
      "recommendation": "改进建议"
    }
  ],
  "optimizationSuggestions": [
    {
      "category": "优化类别",
      "suggestion": "具体建议",
      "expectedBenefit": "预期收益",
      "implementationEffort": "实施难度(low/medium/high)",
      "priority": "优先级(low/medium/high)"
    }
  ]
}
```

## 分析指南

### 模块类型识别
- **容器模块**: 包含其他模块的顶层模块
- **功能模块**: 实现特定业务功能的模块
- **工具模块**: 提供通用功能的辅助模块
- **桥接模块**: 连接不同层次的中间模块

### 层次模式识别
- **分层架构**: 严格的水平分层，上层依赖下层
- **模块化架构**: 功能模块为中心的垂直切分
- **微服务架构**: 独立部署的小型服务模块
- **单体架构**: 统一部署的大型应用模块

请基于提供的模块数据，深入分析模块的层次结构和组织模式。