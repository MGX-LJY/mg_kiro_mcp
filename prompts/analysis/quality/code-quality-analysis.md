# Code Quality Analysis Template

## 概述
对项目进行全面的代码质量分析，评估代码可维护性、可读性、复杂度和最佳实践合规性。

## 分析维度

### 1. 代码复杂度分析
- **圈复杂度评估**: 识别复杂函数和类
- **认知复杂度**: 评估代码理解难度
- **嵌套深度**: 检查过深的嵌套结构
- **函数长度**: 标识过长的函数
- **类大小**: 评估类的职责是否单一

### 2. 代码重复分析
- **重复代码检测**: 识别相似和完全重复的代码块
- **重复率计算**: 项目整体重复率统计
- **重构建议**: 提供消除重复的具体方案

### 3. 代码风格一致性
- **命名规范**: 变量、函数、类命名一致性
- **代码格式**: 缩进、空格、换行等格式统一性
- **注释规范**: 注释质量和覆盖率
- **文档完整性**: README、API文档等完整性

### 4. 最佳实践合规性
- **设计模式应用**: 是否正确应用设计模式
- **SOLID原则**: 单一职责、开闭原则等遵循情况
- **异常处理**: 错误处理是否完善
- **资源管理**: 内存、文件等资源管理

### 5. 测试覆盖率
- **单元测试覆盖**: 代码行覆盖率和分支覆盖率
- **测试质量**: 测试用例有效性评估
- **测试维护性**: 测试代码质量

## 分析输出要求

### 质量指标
```yaml
codeQuality:
  overallScore: 85          # 总体质量分数 (0-100)
  qualityRating: "Good"     # 质量等级: Excellent/Good/Fair/Poor
  
  complexityMetrics:
    averageCyclomaticComplexity: 3.2
    highComplexityFunctions: 8
    maxComplexityFunction: "processLargeDataset"
    cognitiveComplexityAvg: 4.1
    
  codeSmells:
    totalSmells: 23
    critical: 2
    major: 8
    minor: 13
    
  duplicationMetrics:
    duplicatedLines: 156
    duplicationRatio: 4.2    # 百分比
    duplicatedBlocks: 12
    
  maintainabilityIndex: 78   # 可维护性指数
  technicalDebt: "4.2 days"  # 技术债务估算
```

### 问题分类
```yaml
qualityIssues:
  complexity:
    - location: "src/utils/dataProcessor.js:45"
      issue: "Function has cyclomatic complexity of 15"
      severity: "high"
      suggestion: "Split function into smaller methods"
      
  duplication:
    - locations: 
        - "src/controllers/userController.js:125-145"
        - "src/controllers/adminController.js:89-109"
      issue: "20 lines of duplicated code"
      severity: "medium"
      suggestion: "Extract common functionality into shared utility"
      
  naming:
    - location: "src/models/User.js:23"
      issue: "Variable name 'd' is not descriptive"
      severity: "minor"
      suggestion: "Use descriptive variable name like 'date' or 'duration'"
```

### 改进建议
```yaml
recommendations:
  immediate:
    - title: "重构高复杂度函数"
      priority: "high"
      effort: "2-4 hours"
      impact: "提升可维护性和可读性"
      
  shortTerm:
    - title: "消除代码重复"
      priority: "medium" 
      effort: "1-2 days"
      impact: "降低维护成本"
      
  longTerm:
    - title: "建立代码规范和自动化检查"
      priority: "low"
      effort: "1 week"
      impact: "确保代码质量一致性"
```

### 质量趋势
```yaml
qualityTrends:
  lastMonth:
    - metric: "Code Coverage"
      change: "+5.2%"
      trend: "improving"
    - metric: "Technical Debt"
      change: "-1.3 days"
      trend: "improving"
    - metric: "Code Smells"
      change: "+3 issues"
      trend: "degrading"
```

## 语言特定分析

### JavaScript/Node.js
- ESLint规则合规性检查
- JSDoc文档覆盖率
- 异步代码模式分析
- 依赖管理评估

### Python  
- PEP 8风格指南合规性
- 类型注解覆盖率
- 异常处理模式
- 包结构合理性

### Java
- Java代码规范合规性
- 设计模式应用
- 异常处理层次
- 包依赖关系

### Go
- Go fmt格式化检查
- Go vet静态分析
- 错误处理模式
- 接口设计合理性

## 工具和方法

### 静态代码分析工具
- SonarQube - 综合质量分析
- ESLint/Pylint - 语言特定检查
- CodeClimate - 代码质量评估
- PMD/Checkstyle - Java代码规范

### 复杂度分析
- 圈复杂度计算算法
- 认知复杂度评估方法
- 函数和类大小统计

### 重复代码检测
- 基于AST的语义重复检测
- 文本相似度分析
- 克隆代码分类

## 分析流程

1. **代码扫描**: 解析项目结构和源码文件
2. **静态分析**: 运行各类静态分析工具
3. **指标计算**: 计算各维度质量指标
4. **问题识别**: 标识具体的质量问题
5. **建议生成**: 基于问题生成改进建议
6. **报告生成**: 输出结构化质量报告

## 输出格式

分析结果应包含：
- 质量概览和评分
- 详细问题列表和修复建议
- 质量趋势和对比数据
- 可操作的改进计划
- 质量门控建议

## 注意事项

- 关注代码的可维护性而非仅仅是功能性
- 结合项目规模和团队情况给出现实可行的建议
- 优先级排序要考虑投入产出比
- 提供具体的修复示例和最佳实践参考