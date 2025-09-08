# Fix模式 - 问题范围识别分析模板

## 输入数据
**问题ID**: {{issueId}}
**问题描述**: {{issueDescription}}
**堆栈跟踪**: {{stackTrace}}
**语言**: {{language}}
**项目路径**: {{projectPath}}

## 分析目标

### 1. 问题类型识别
- 根据堆栈跟踪和描述判断问题类型
- 分类：运行时错误、逻辑错误、性能问题、安全漏洞等
- 评估问题的严重性和紧急程度

### 2. 影响范围分析
- 精确定位受影响的主要模块和文件
- 识别依赖关系链上的次要影响模块
- 评估问题的扩散半径和边界

### 3. 风险评估
- 分析修复该问题的破坏性风险
- 评估数据完整性和系统稳定性影响
- 识别用户体验影响程度

### 4. 边界分析
- 确定问题的最小修复范围
- 评估是否可以隔离问题影响
- 分析级联效应和安全边界

## 输出要求

```json
{
  "scopeIdentification": {
    "problemType": "runtime_error|logic_error|performance_issue|security_vulnerability",
    "primaryScope": {
      "affectedModule": "主要受影响的模块名称",
      "coreFiles": ["核心文件路径列表"],
      "impactRadius": "small|medium|large",
      "confidence": 0.0-1.0
    },
    "secondaryScopes": [
      {
        "module": "次要模块名称",
        "files": ["相关文件路径"],
        "impact": "direct|indirect|upstream|downstream",
        "reason": "影响原因说明"
      }
    ],
    "riskAssessment": {
      "breakageRisk": "low|medium|high",
      "dataIntegrity": "safe|at_risk|critical",
      "userImpact": "none|low|medium|high|critical",
      "systemStability": "stable|at_risk|unstable"
    },
    "boundaryAnalysis": {
      "containmentLevel": "function_level|class_level|module_level|service_level",
      "isolationPossible": true|false,
      "cascadeEffects": ["可能的级联效应列表"],
      "safetyMargins": ["安全边界描述"]
    }
  }
}
```

## 特殊要求

### 堆栈跟踪解析
- 从堆栈跟踪中准确提取文件路径和行号
- 识别调用链中的关键节点
- 区分直接错误位置和传播路径

### 依赖关系分析
- 基于语言特性分析模块依赖
- 识别静态导入和动态依赖
- 考虑运行时依赖和配置依赖

### 语言特定分析
- **JavaScript**: 分析require/import依赖、异步调用链
- **Python**: 分析import依赖、异常传播链
- **Java**: 分析包依赖、异常堆栈
- **Go**: 分析package依赖、错误传播

### 影响半径评估标准
- **Small**: 单个函数或方法内
- **Medium**: 单个模块或类内，可能影响少数调用方
- **Large**: 跨模块影响，可能影响多个系统组件

## 分析重点

### 精准定位原则
- 确定最小可修复单元
- 避免过度扩大修复范围
- 识别真正的根本原因

### 风险最小化
- 优先考虑数据安全
- 评估修复的副作用
- 确保系统稳定性

### 可验证性
- 提供清晰的验证路径
- 确保修复效果可测量
- 建立回滚机制