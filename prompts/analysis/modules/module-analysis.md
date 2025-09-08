# 深度模块分析模板

你是一个代码架构分析专家。请基于文件分析和语言检测结果进行深度模块分析。

## 输入数据
**文件分析结果**: {{filesResult}}
**语言检测结果**: {{languageResult}}
**项目路径**: {{projectPath}}

## 分析目标

### 1. 模块识别与分类
深度识别和分类项目中的每个模块：
- 模块类型识别（核心模块、业务模块、工具模块）
- 模块职责分析（控制器、服务、模型、工具等）
- 模块重要性评估（核心程度、依赖程度、复杂度）
- 模块成熟度评估（完整性、文档、测试覆盖）

### 2. 依赖关系深度分析
全面分析模块间的依赖关系：
- 直接依赖和间接依赖映射
- 依赖强度和频率评估
- 循环依赖检测和分析
- 高耦合模块识别
- 孤立模块发现

### 3. 代码质量和复杂度评估
评估每个模块的代码质量：
- 模块复杂度分析（圈复杂度、认知复杂度）
- 代码质量指标（可读性、可维护性、可测试性）
- 技术债务识别（代码异味、重构机会）
- 性能问题识别

### 4. 接口和API分析
分析模块的对外接口：
- 导出函数和类的识别
- API设计质量评估
- 接口一致性检查
- 向后兼容性分析

### 5. 改进建议生成
基于分析结果提供优化建议：
- 重构建议（拆分、合并、重组）
- 架构改进建议
- 性能优化建议
- 维护性改进建议

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "modules": [
    {
      "id": "模块唯一标识",
      "name": "模块名称",
      "relativePath": "相对路径",
      "category": "模块类别(core/business/utility/service/component/controller/model/view/middleware/config/test)",
      "type": "具体类型(module/class/function/service/controller/model/utility)",
      
      "analysis": {
        "language": "编程语言",
        "size": "代码行数",
        "complexity": {
          "rating": "复杂度等级(low/medium/high/critical)",
          "score": "复杂度评分(0-100)",
          "cyclomaticComplexity": "圈复杂度",
          "cognitiveComplexity": "认知复杂度"
        },
        "quality": {
          "maintainabilityIndex": "可维护性指数(0-100)",
          "readabilityScore": "可读性评分(0-100)",
          "testabilityScore": "可测试性评分(0-100)",
          "documentationScore": "文档完整性(0-100)"
        },
        "technicalDebt": {
          "debtRatio": "技术债务比例(0.0-1.0)",
          "issues": ["技术债务问题列表"],
          "severity": "严重程度(low/medium/high/critical)"
        }
      },
      
      "dependencies": {
        "imports": [
          {
            "module": "导入模块名",
            "path": "导入路径",
            "type": "导入类型(default/named/namespace)",
            "usage": "使用方式描述"
          }
        ],
        "exports": [
          {
            "name": "导出名称",
            "type": "导出类型(function/class/const/default)",
            "signature": "函数签名或类型",
            "description": "功能描述"
          }
        ],
        "internal": ["内部依赖模块列表"],
        "external": ["外部依赖列表"]
      },
      
      "metrics": {
        "lines": "代码行数",
        "functions": "函数数量",
        "classes": "类数量",
        "complexity": "复杂度评分",
        "duplication": "重复代码比例",
        "coverage": "测试覆盖率估算"
      },
      
      "interfaces": [
        {
          "type": "接口类型(functions/classes/constants)",
          "count": "数量",
          "items": [
            {
              "name": "接口名称",
              "signature": "接口签名",
              "parameters": ["参数列表"],
              "returnType": "返回类型",
              "description": "功能描述",
              "isPublic": "是否为公共接口",
              "complexity": "接口复杂度"
            }
          ]
        }
      ],
      
      "documentation": {
        "hasComments": "是否有注释",
        "documentationLevel": "文档等级(none/basic/good/excellent)",
        "missingDocs": ["缺失文档的接口"],
        "inlineComments": "内联注释质量",
        "apiDocs": "API文档完整性"
      },
      
      "recommendations": [
        {
          "type": "建议类型(refactor/performance/security/documentation/testing)",
          "priority": "优先级(low/medium/high/critical)",
          "message": "具体建议内容",
          "impact": "预期影响",
          "effort": "实施难度",
          "benefits": ["预期收益列表"]
        }
      ]
    }
  ],
  
  "dependencies": {
    "graph": {
      "nodes": ["节点列表"],
      "edges": [
        {
          "from": "源模块",
          "to": "目标模块",
          "type": "依赖类型",
          "strength": "依赖强度(0.0-1.0)",
          "frequency": "使用频率"
        }
      ]
    },
    "totalConnections": "总连接数",
    "highlyConnectedModules": [
      {
        "module": "模块名",
        "connections": "连接数",
        "type": "连接类型(hub/authority)"
      }
    ],
    "circularDependencies": [
      {
        "cycle": ["循环依赖路径"],
        "severity": "严重程度",
        "impact": "影响描述"
      }
    ],
    "isolatedModules": ["孤立模块列表"]
  },
  
  "classification": {
    "byCategory": {
      "core": ["核心模块列表"],
      "business": ["业务模块列表"],
      "utility": ["工具模块列表"],
      "service": ["服务模块列表"],
      "other": ["其他模块列表"]
    },
    "byComplexity": {
      "low": ["低复杂度模块"],
      "medium": ["中等复杂度模块"],
      "high": ["高复杂度模块"],
      "critical": ["极高复杂度模块"]
    },
    "byImportance": [
      {
        "module": "模块名",
        "importance": "重要性评分(0-100)",
        "reason": "重要性原因"
      }
    ]
  },
  
  "statistics": {
    "totalModules": "模块总数",
    "averageComplexity": "平均复杂度",
    "complexityDistribution": {
      "low": "低复杂度模块数",
      "medium": "中等复杂度模块数", 
      "high": "高复杂度模块数",
      "critical": "极高复杂度模块数"
    },
    "dependencyMetrics": {
      "totalConnections": "总连接数",
      "avgConnectionsPerModule": "平均连接数",
      "circularDependencies": "循环依赖数",
      "isolatedModules": "孤立模块数",
      "maxDepth": "最大依赖深度",
      "fanInOut": "扇入扇出统计"
    },
    "qualityMetrics": {
      "averageMaintainability": "平均可维护性",
      "documentationCoverage": "文档覆盖率",
      "testCoverage": "测试覆盖率",
      "technicalDebtRatio": "技术债务比例"
    }
  },
  
  "architecturalInsights": {
    "patterns": [
      {
        "pattern": "架构模式名称",
        "modules": ["相关模块"],
        "description": "模式描述",
        "quality": "模式实现质量"
      }
    ],
    "antiPatterns": [
      {
        "antiPattern": "反模式名称",
        "modules": ["相关模块"],
        "issue": "问题描述",
        "recommendation": "改进建议"
      }
    ],
    "layering": {
      "layers": ["识别的架构层次"],
      "violations": ["层次违规情况"],
      "clarity": "分层清晰度(0-100)"
    },
    "cohesion": {
      "highCohesion": ["高内聚模块"],
      "lowCohesion": ["低内聚模块"],
      "averageCohesion": "平均内聚度"
    },
    "coupling": {
      "tightlyCoupled": ["紧耦合模块对"],
      "looselyCoupled": ["松耦合模块对"],
      "averageCoupling": "平均耦合度"
    }
  },
  
  "recommendations": [
    {
      "category": "建议类别(architecture/refactor/performance/quality)",
      "priority": "优先级(low/medium/high/critical)",
      "title": "建议标题",
      "description": "详细描述",
      "affectedModules": ["影响的模块"],
      "benefits": ["预期收益"],
      "effort": "实施工作量",
      "timeline": "建议时间线",
      "prerequisites": ["前置条件"]
    }
  ],
  
  "metadata": {
    "analysisTime": "分析耗时(ms)",
    "analysisId": "分析ID",
    "timestamp": "分析时间戳",
    "version": "分析版本",
    "confidence": "分析置信度(0.0-1.0)"
  }
}
```

## 分析指南

### 模块分类标准
- **核心模块(core)**: 系统基础功能，被广泛依赖
- **业务模块(business)**: 业务逻辑实现，领域特定
- **工具模块(utility)**: 通用工具和辅助功能
- **服务模块(service)**: 服务层，处理业务流程
- **组件模块(component)**: 可重用组件和UI元素
- **控制器模块(controller)**: 请求处理和路由
- **模型模块(model)**: 数据模型和业务实体

### 复杂度评估标准
```
低复杂度(0-10): 简单模块，职责单一
中等复杂度(11-20): 适中复杂度，结构清晰
高复杂度(21-40): 复杂模块，需要重构考虑
极高复杂度(40+): 非常复杂，强烈建议重构
```

### 依赖分析重点
- **强依赖**: 紧密耦合，频繁交互
- **弱依赖**: 松散耦合，偶尔调用
- **循环依赖**: 需要重构解决的架构问题
- **扇入扇出**: 模块的被依赖和依赖他人情况

### 质量评估维度
- **可维护性**: 代码修改和扩展的容易程度
- **可读性**: 代码理解的难易程度
- **可测试性**: 编写和执行测试的容易程度
- **文档完整性**: 文档和注释的完整程度

### 语言特定分析

#### JavaScript/Node.js项目
- CommonJS vs ES6模块系统
- 异步编程模式分析
- 框架特定模块识别
- NPM依赖管理

#### Python项目
- 模块导入结构分析
- 包结构组织评估
- 装饰器和元编程使用
- 虚拟环境依赖管理

#### Java项目
- 包结构和命名空间
- Spring框架模式识别
- 注解驱动开发分析
- Maven/Gradle依赖管理

请基于提供的文件分析和语言检测数据，进行全面深度的模块分析。