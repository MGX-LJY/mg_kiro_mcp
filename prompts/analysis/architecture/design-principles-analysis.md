# 设计原则智能分析模板

你是一个软件架构专家。请基于项目代码分析识别和评估设计原则采用情况。

## 输入数据
**项目结构数据**: {{structureData}}
**文件内容分析**: {{filesData}}
**技术栈信息**: {{techStackData}}
**模块分析结果**: {{moduleAnalysis}}

## 分析目标

### 1. 设计模式识别
识别项目中使用的设计模式：
- 创建型模式 (单例、工厂、建造者等)
- 结构型模式 (适配器、装饰者、代理等)  
- 行为型模式 (观察者、策略、命令等)
- 架构模式 (MVC、MVP、MVVM等)

### 2. SOLID原则评估
分析SOLID原则遵循情况：
- Single Responsibility Principle (单一职责)
- Open/Closed Principle (开闭原则)
- Liskov Substitution Principle (里氏替换)
- Interface Segregation Principle (接口隔离)
- Dependency Inversion Principle (依赖倒置)

### 3. 代码质量原则
评估代码质量相关原则：
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Ain't Gonna Need It)
- 关注点分离
- 高内聚低耦合

### 4. 架构质量评估
分析架构层面的设计质量：
- 模块化程度
- 可扩展性设计
- 错误处理策略
- 性能优化考虑
- 安全设计原则

## 输出要求

```json
{
  "designPatterns": {
    "identified": [
      {
        "pattern": "设计模式名称",
        "category": "模式类别(creational/structural/behavioral/architectural)", 
        "locations": ["出现位置"],
        "implementation": "实现方式描述",
        "appropriateness": "使用恰当性(excellent/good/questionable/poor)",
        "reasoning": "评估理由"
      }
    ],
    "missing": [
      {
        "pattern": "建议使用的模式",
        "locations": ["建议应用位置"],
        "benefits": ["预期收益"],
        "implementationEffort": "实施难度(low/medium/high)"
      }
    ]
  },
  "solidPrinciples": {
    "singleResponsibility": {
      "score": "遵循程度(0-100)",
      "violations": ["违反实例"],
      "goodExamples": ["良好实例"],
      "recommendations": ["改进建议"]
    },
    "openClosed": {
      "score": "遵循程度(0-100)",
      "violations": ["违反实例"], 
      "goodExamples": ["良好实例"],
      "recommendations": ["改进建议"]
    },
    "liskovSubstitution": {
      "score": "遵循程度(0-100)",
      "violations": ["违反实例"],
      "goodExamples": ["良好实例"], 
      "recommendations": ["改进建议"]
    },
    "interfaceSegregation": {
      "score": "遵循程度(0-100)",
      "violations": ["违反实例"],
      "goodExamples": ["良好实例"],
      "recommendations": ["改进建议"]
    },
    "dependencyInversion": {
      "score": "遵循程度(0-100)",
      "violations": ["违反实例"],
      "goodExamples": ["良好实例"],
      "recommendations": ["改进建议"]
    }
  },
  "codeQualityPrinciples": {
    "dryPrinciple": {
      "score": "DRY原则遵循度(0-100)",
      "duplications": ["重复代码实例"],
      "refactoringOpportunities": ["重构机会"]
    },
    "kissPrinciple": {
      "score": "简洁性评分(0-100)",
      "complexAreas": ["复杂区域"],
      "simplificationSuggestions": ["简化建议"]
    },
    "yagniPrinciple": {
      "score": "YAGNI原则遵循度(0-100)",
      "overEngineering": ["过度设计实例"],
      "unnecessary": ["不必要的复杂性"]
    },
    "separationOfConcerns": {
      "score": "关注点分离度(0-100)",
      "mixedConcerns": ["混合关注点实例"],
      "improvementAreas": ["改进区域"]
    }
  },
  "architecturalQuality": {
    "modularity": {
      "score": "模块化程度(0-100)",
      "cohesion": "内聚度(high/medium/low)",
      "coupling": "耦合度(loose/moderate/tight)",
      "modularityIssues": ["模块化问题"]
    },
    "extensibility": {
      "score": "可扩展性(0-100)",
      "extensionPoints": ["扩展点"],
      "rigidAreas": ["僵化区域"],
      "improvementSuggestions": ["扩展性改进建议"]
    },
    "errorHandling": {
      "strategy": "错误处理策略",
      "consistency": "一致性程度(high/medium/low)",
      "coverage": "覆盖程度(0-100)",
      "improvements": ["错误处理改进建议"]
    },
    "performance": {
      "considerations": ["性能考虑实例"],
      "optimizations": ["优化机会"],
      "antipatterns": ["性能反模式"]
    },
    "security": {
      "principles": ["安全原则采用"],
      "vulnerabilities": ["潜在安全问题"], 
      "recommendations": ["安全改进建议"]
    }
  },
  "overallAssessment": {
    "designQualityScore": "整体设计质量(0-100)",
    "strengths": ["设计优势"],
    "weaknesses": ["设计弱点"],
    "criticalIssues": ["关键问题"],
    "improvementPriorities": [
      {
        "area": "改进领域",
        "priority": "优先级(high/medium/low)",
        "impact": "影响程度(high/medium/low)",
        "effort": "改进工作量(low/medium/high)"
      }
    ]
  },
  "bestPracticesAlignment": {
    "frameworkBestPractices": "框架最佳实践遵循度(0-100)",
    "industryStandards": "行业标准符合度(0-100)",
    "modernPatterns": "现代模式采用度(0-100)",
    "technicalDebt": "技术债务程度(low/medium/high)",
    "maintainabilityIndex": "可维护性指数(0-100)"
  }
}
```

## 分析指南

### 设计模式识别方法
- **文件命名**: Factory, Builder, Observer等命名模式
- **代码结构**: 类继承关系、接口实现、组合关系
- **方法模式**: getInstance(), create(), notify()等方法命名
- **架构层次**: Controller-Service-Repository等分层

### SOLID原则评估标准
- **单一职责**: 类/模块功能单一性，修改原因唯一性
- **开闭原则**: 扩展性设计，抽象使用程度
- **里氏替换**: 继承关系合理性，子类替换能力
- **接口隔离**: 接口精简性，依赖最小化
- **依赖倒置**: 抽象依赖，依赖注入使用

### 语言特定考虑
{{#if (eq primaryLanguage "javascript")}}
**JavaScript特定分析**:
- 原型继承模式使用
- 闭包和模块模式
- 异步编程模式
- 函数式编程范式
{{else if (eq primaryLanguage "python")}}
**Python特定分析**:
- Pythonic设计原则
- 装饰器模式使用
- 上下文管理器
- Duck typing应用
{{else if (eq primaryLanguage "java")}}
**Java特定分析**:
- 面向对象设计原则
- 接口和抽象类使用
- 泛型设计模式
- Spring设计模式
{{/if}}

请基于提供的项目数据，深入分析设计原则的采用情况和质量水平。