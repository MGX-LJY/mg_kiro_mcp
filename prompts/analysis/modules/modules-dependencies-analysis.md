# 模块依赖关系智能分析模板

你是一个软件架构分析专家。请基于项目数据生成模块依赖关系深度分析。

## 输入数据
**依赖关系图**: {{dependencies}}
**模块分析结果**: {{moduleAnalysis}}
**项目结构数据**: {{structureData}}
**项目信息**: {{projectInfo}}

## 分析目标

### 1. 依赖关系映射
全面分析模块间的依赖关系：
- 直接依赖识别
- 间接依赖链分析
- 双向依赖关系
- 可选依赖vs必需依赖

### 2. 依赖质量评估
评估依赖关系的质量：
- 循环依赖检测
- 依赖深度分析
- 扇入扇出分析
- 依赖稳定性评估

### 3. 依赖风险分析
识别依赖相关的风险：
- 单点故障风险
- 级联失效风险
- 版本冲突风险
- 外部依赖风险

## 输出要求

```json
{
  "dependencyOverview": {
    "totalDependencies": "依赖关系总数",
    "internalDependencies": "内部依赖数量",
    "externalDependencies": "外部依赖数量",
    "averageDependenciesPerModule": "平均每模块依赖数",
    "maxDependencyDepth": "最大依赖深度",
    "dependencyComplexity": "依赖复杂度(low/medium/high)"
  },
  "dependencyMapping": [
    {
      "module": "模块名称",
      "path": "模块路径", 
      "directDependencies": ["直接依赖列表"],
      "indirectDependencies": ["间接依赖列表"],
      "dependents": ["依赖此模块的模块"],
      "fanIn": "扇入度",
      "fanOut": "扇出度",
      "stability": "稳定性指数(0-1)",
      "instability": "不稳定性指数(0-1)"
    }
  ],
  "circularDependencies": [
    {
      "cycle": ["循环依赖链"],
      "length": "循环长度",
      "severity": "严重程度(low/medium/high)",
      "impact": "影响范围",
      "breakSuggestion": "打破建议"
    }
  ],
  "dependencyLayers": [
    {
      "layer": "依赖层级",
      "modules": ["该层模块"],
      "levelStability": "层级稳定性",
      "responsibilities": ["层级职责"]
    }
  ],
  "criticalDependencies": [
    {
      "dependency": "关键依赖",
      "criticalityScore": "关键度评分(0-100)",
      "affectedModules": ["影响的模块"],
      "failureImpact": "故障影响范围",
      "mitigation": "缓解措施"
    }
  ],
  "externalDependencies": [
    {
      "name": "外部依赖名称",
      "version": "版本",
      "type": "依赖类型(runtime/devtime/build)",
      "usagePattern": "使用模式",
      "riskLevel": "风险等级(low/medium/high)",
      "alternatives": ["替代方案"],
      "updateRecommendation": "更新建议"
    }
  ],
  "dependencyMetrics": {
    "abstractness": "抽象性(0-1)",
    "instability": "不稳定性(0-1)", 
    "distance": "距离主序列(0-1)",
    "afferentCoupling": "传入耦合平均值",
    "efferentCoupling": "传出耦合平均值",
    "cyclomaticComplexity": "圈复杂度"
  },
  "dependencyIssues": [
    {
      "issue": "依赖问题",
      "severity": "严重程度(low/medium/high/critical)",
      "description": "问题描述",
      "affectedModules": ["影响的模块"],
      "recommendation": "解决建议",
      "effort": "修复工作量"
    }
  ],
  "optimizationRecommendations": [
    {
      "category": "优化类别",
      "recommendation": "具体建议",
      "rationale": "建议理由",
      "expectedBenefit": "预期收益",
      "implementationComplexity": "实施复杂度",
      "priority": "优先级(high/medium/low)"
    }
  ]
}
```

## 分析指南

### 依赖类型分类
- **编译依赖**: 编译时必需的依赖
- **运行依赖**: 运行时必需的依赖  
- **可选依赖**: 增强功能的可选依赖
- **开发依赖**: 仅开发时需要的依赖

### 质量评估标准
- **循环依赖**: 严重程度based on循环长度和影响范围
- **扇出度**: 模块依赖其他模块的数量，高扇出表示不稳定
- **扇入度**: 其他模块依赖该模块的数量，高扇入表示重要性
- **稳定性**: I = Ce / (Ca + Ce)，其中Ce是扇出，Ca是扇入

请基于提供的依赖数据，生成全面的依赖关系分析。