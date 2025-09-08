# 集成契约智能分析模板

你是一个系统集成架构师。请基于项目全量分析数据生成集成契约分析。

## 输入数据
**工作流结果**: {{workflowResults}}
**项目路径**: {{projectPath}}
**前置步骤数据**: {{previousSteps}}

## 分析目标

### 1. 模块间依赖分析
深度分析模块间的调用关系和依赖模式：
- 内部模块依赖映射
- 外部依赖识别
- 循环依赖检测
- 依赖深度分析
- 关键路径识别

### 2. API契约识别
识别和分析模块间的API契约：
- 函数调用接口
- 数据传输格式
- 事件通信机制
- 配置依赖关系
- 服务集成点

### 3. 数据流分析
分析系统中的数据流向和转换：
- 数据输入输出点
- 数据处理管道
- 状态管理机制
- 数据持久化方式
- 缓存策略分析

### 4. 集成风险评估
评估集成相关的风险和问题：
- 单点故障风险
- 性能瓶颈点
- 安全风险点
- 兼容性问题
- 维护复杂度

### 5. 优化建议生成
提供集成优化建议：
- 解耦合建议
- 性能优化点
- 架构改进方向
- 监控建议
- 测试策略

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "integrationAnalysis": {
    "summary": {
      "totalModules": "模块总数",
      "totalRelations": "关系总数", 
      "integrationPoints": "集成点数量",
      "apiContracts": "API契约数量",
      "dataFlows": "数据流数量",
      "externalDependencies": "外部依赖数量",
      "complexityScore": "复杂度评分(0-100)",
      "healthScore": "健康度评分(0-100)"
    },
    "moduleRelations": [
      {
        "source": "源模块名称",
        "target": "目标模块名称", 
        "relationType": "关系类型(import/call/event/config)",
        "strength": "关系强度(weak/medium/strong)",
        "description": "关系描述",
        "dataContract": "数据契约格式",
        "frequency": "调用频率估计",
        "criticality": "关键性(low/medium/high/critical)"
      }
    ],
    "apiContracts": [
      {
        "contractId": "契约唯一标识",
        "provider": "服务提供方",
        "consumer": "服务使用方",
        "interface": "接口定义",
        "dataFormat": "数据格式",
        "protocols": ["通信协议列表"],
        "parameters": ["参数列表"],
        "returnType": "返回值类型",
        "errorHandling": "错误处理机制",
        "versionCompatibility": "版本兼容性",
        "performanceRequirements": "性能要求"
      }
    ],
    "dataFlows": [
      {
        "flowId": "数据流标识",
        "source": "数据源",
        "destination": "数据目标",
        "dataType": "数据类型",
        "transformations": ["数据转换步骤"],
        "processingNodes": ["处理节点"],
        "volume": "数据量级",
        "frequency": "流动频率",
        "persistence": "持久化方式",
        "validation": "数据验证规则"
      }
    ],
    "externalDependencies": [
      {
        "dependencyName": "依赖名称",
        "type": "依赖类型(library/service/api/database)",
        "version": "版本信息",
        "purpose": "使用目的",
        "criticalityLevel": "关键程度",
        "alternatives": ["替代方案"],
        "risksAssessment": "风险评估",
        "updateFrequency": "更新频率",
        "licenseInfo": "许可证信息"
      }
    ],
    "integrationPatterns": [
      {
        "pattern": "集成模式名称",
        "description": "模式描述", 
        "applicableModules": ["适用模块"],
        "benefits": ["模式优点"],
        "drawbacks": ["模式缺点"],
        "recommendedScenarios": ["推荐使用场景"]
      }
    ]
  },
  "riskAssessment": {
    "highRisks": [
      {
        "risk": "风险描述",
        "affectedModules": ["影响模块"],
        "impact": "影响描述",
        "probability": "发生概率(low/medium/high)",
        "severity": "严重程度(low/medium/high/critical)",
        "mitigation": "缓解措施",
        "prevention": "预防建议"
      }
    ],
    "mediumRisks": [
      "中等风险列表"
    ],
    "lowRisks": [
      "低风险列表"
    ],
    "overallRiskScore": "整体风险评分(0-100)"
  },
  "optimizationRecommendations": [
    {
      "category": "优化类别",
      "priority": "优先级(high/medium/low)",
      "recommendation": "具体建议",
      "affectedComponents": ["影响组件"],
      "expectedBenefit": "预期收益",
      "implementationEffort": "实施工作量",
      "prerequisites": ["前置条件"],
      "timeline": "建议时间线",
      "successMetrics": ["成功指标"]
    }
  ],
  "architecturalInsights": {
    "couplingAnalysis": {
      "tightlyCoupled": ["紧耦合模块对"],
      "looselyCoupled": ["松耦合模块对"],
      "couplingScore": "耦合度评分(0-100)"
    },
    "cohesionAnalysis": {
      "highCohesion": ["高内聚模块"],
      "lowCohesion": ["低内聚模块"],  
      "cohesionScore": "内聚度评分(0-100)"
    },
    "layeringAnalysis": {
      "layers": ["识别的架构层次"],
      "layerViolations": ["层次违反情况"],
      "layeringScore": "分层清晰度(0-100)"
    }
  },
  "monitoringRecommendations": [
    {
      "metric": "监控指标",
      "purpose": "监控目的",
      "implementation": "实施方式",
      "alertThresholds": "告警阈值",
      "frequency": "监控频率"
    }
  ],
  "testingStrategy": {
    "integrationTests": ["集成测试建议"],
    "contractTests": ["契约测试建议"],
    "e2eTests": ["端到端测试建议"],
    "performanceTests": ["性能测试建议"],
    "testPriorities": ["测试优先级排序"]
  }
}
```

## 分析指南

### 依赖关系分析
- **强依赖**: 直接函数调用、类继承、数据共享
- **中依赖**: 配置依赖、间接调用、事件监听
- **弱依赖**: 工具类使用、可选功能、松散耦合

### API契约识别规则
- 函数签名分析：参数类型、返回值、异常
- 数据格式识别：JSON、XML、二进制等
- 通信协议：HTTP、WebSocket、消息队列等
- 版本兼容性：向后兼容、破坏性变更

### 风险评估标准
- **高风险**: 可能导致系统崩溃或数据丢失
- **中风险**: 可能影响性能或功能可用性
- **低风险**: 对系统影响有限，易于处理

### 语言特定考虑

{{#if (includes primaryLanguage "javascript")}}
**JavaScript特定分析**:
- ES6模块导入导出分析
- NPM依赖管理复杂度
- 异步调用模式识别
- Node.js事件系统分析
{{else if (includes primaryLanguage "python")}}
**Python特定分析**:
- import语句依赖分析
- 包管理和虚拟环境
- 装饰器和元类使用
- 异步编程模式
{{else if (includes primaryLanguage "java")}}
**Java特定分析**:
- Maven/Gradle依赖管理
- Spring框架集成模式
- 接口和实现分离
- 注解驱动配置
{{/if}}

请基于提供的工作流数据，进行全面的集成契约分析，生成结构化的分析结果。