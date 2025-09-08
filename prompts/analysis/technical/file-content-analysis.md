# 文件内容智能分析模板

你是一个代码分析专家。请基于项目结构和语言检测数据进行深度文件内容分析。

## 输入数据
**项目数据**: {{projectData}}
**项目路径**: {{projectData.projectPath}}
**项目结构**: {{projectData.structure}}
**语言信息**: {{projectData.languageData}}

## 分析目标

### 1. 文件分类与分析
深度分析每个文件的内容和作用：
- 代码文件类型识别（源码、配置、测试、文档）
- 代码复杂度评估（函数数量、类数量、行数）
- 代码质量指标（文档覆盖、注释质量、命名规范）
- 重要性评分（核心业务逻辑、工具类、配置文件）

### 2. 依赖关系分析
分析文件间的依赖和调用关系：
- import/require语句解析
- 函数调用关系映射
- 模块间依赖强度评估
- 循环依赖检测

### 3. 代码质量评估
全面评估代码质量指标：
- 代码组织结构评分
- 注释和文档覆盖率
- 命名规范一致性
- 测试覆盖情况分析

### 4. 改进建议生成
基于分析结果提供优化建议：
- 代码重构建议
- 结构优化方案
- 质量提升措施
- 性能优化点

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "analysis": {
    "totalFilesAnalyzed": "分析文件总数",
    "analysisTime": "分析耗时(ms)",
    "mainLanguage": "主要编程语言",
    "confidence": "分析置信度(0.0-1.0)"
  },
  "files": [
    {
      "relativePath": "文件相对路径",
      "absolutePath": "文件绝对路径",
      "category": "文件类别(source/config/test/doc/asset)",
      "content": {
        "size": "文件大小(bytes)",
        "lines": "代码行数",
        "encoding": "文件编码"
      },
      "analysis": {
        "type": "具体类型(controller/service/model/util/config)",
        "complexity": {
          "rating": "复杂度等级(low/medium/high/critical)",
          "score": "复杂度评分(0-100)",
          "functions": "函数数量",
          "classes": "类数量",
          "imports": "导入语句数量"
        },
        "quality": {
          "documentation": "文档质量评分(0-100)",
          "comments": "注释覆盖率(%)",
          "naming": "命名规范评分(0-100)",
          "structure": "结构组织评分(0-100)"
        },
        "dependencies": [
          {
            "path": "依赖文件路径",
            "type": "依赖类型(import/require/include)",
            "usage": "使用方式描述"
          }
        ],
        "exports": [
          {
            "name": "导出名称",
            "type": "导出类型(function/class/const/default)",
            "description": "功能描述"
          }
        ],
        "languageSpecific": {
          "// JavaScript特定": {
            "usesES6": "是否使用ES6语法",
            "usesModules": "是否使用ES6模块",
            "hasJSX": "是否包含JSX",
            "frameworkUsage": "框架使用情况"
          },
          "// Python特定": {
            "usesTypeHints": "是否使用类型提示",
            "usesAsyncAwait": "是否使用异步编程",
            "hasMainGuard": "是否有主程序保护",
            "importsAnalysis": "导入语句分析"
          },
          "// Java特定": {
            "packageStructure": "包结构信息",
            "annotationUsage": "注解使用情况",
            "designPatterns": "设计模式使用",
            "springFeatures": "Spring框架特性"
          }
        }
      }
    }
  ],
  "overview": {
    "distribution": {
      "source": "源码文件数量",
      "config": "配置文件数量",
      "test": "测试文件数量",
      "documentation": "文档文件数量",
      "assets": "资源文件数量"
    },
    "complexity": {
      "low": "低复杂度文件数",
      "medium": "中等复杂度文件数",
      "high": "高复杂度文件数",
      "critical": "极高复杂度文件数"
    },
    "codeMetrics": {
      "totalLines": "总代码行数",
      "totalFunctions": "总函数数量",
      "totalClasses": "总类数量",
      "avgComplexity": "平均复杂度",
      "duplicateCode": "重复代码比例(%)"
    },
    "qualityIndicators": {
      "documentationCoverage": "文档覆盖率(0.0-1.0)",
      "testCoverage": "测试覆盖率估计(0.0-1.0)",
      "codeQualityScore": "代码质量综合评分(0-100)",
      "maintainabilityIndex": "可维护性指数(0-100)"
    }
  },
  "dependencies": {
    "nodes": [
      {
        "id": "节点ID",
        "path": "文件路径",
        "type": "节点类型",
        "category": "节点分类"
      }
    ],
    "edges": [
      {
        "from": "源节点ID",
        "to": "目标节点ID",
        "type": "依赖类型",
        "weight": "依赖强度(0.0-1.0)"
      }
    ],
    "statistics": {
      "totalNodes": "总节点数",
      "totalEdges": "总边数",
      "maxDepth": "最大依赖深度",
      "circularDependencies": "循环依赖数量"
    }
  },
  "importance": {
    "// 文件重要性评分 (路径 -> 评分)": {
      "src/main.js": 95,
      "src/config.js": 85,
      "src/utils/helper.js": 75
    }
  },
  "recommendations": [
    {
      "type": "建议类型(refactor/quality/performance/security)",
      "priority": "优先级(high/medium/low)",
      "message": "建议描述",
      "files": ["相关文件列表"],
      "impact": "预期影响",
      "effort": "实施工作量"
    }
  ],
  "technicalDebt": {
    "score": "技术债务评分(0-100)",
    "issues": [
      {
        "type": "问题类型",
        "severity": "严重程度",
        "description": "问题描述",
        "affectedFiles": ["影响文件列表"],
        "recommendation": "解决建议"
      }
    ]
  },
  "timestamp": "分析时间戳",
  "metadata": {
    "analysisType": "file_content_analysis",
    "version": "1.0.0",
    "tools": ["分析工具列表"]
  }
}
```

## 分析指南

### 文件分类规则
- **源码文件**: .js/.py/.java等，包含业务逻辑
- **配置文件**: .json/.yaml/.properties，系统配置
- **测试文件**: test/spec目录，包含测试代码
- **文档文件**: .md/.txt/.rst，项目文档
- **资源文件**: .css/.html/.images，静态资源

### 复杂度评估标准
- **低复杂度**: 函数<5个，类<2个，行数<100
- **中等复杂度**: 函数5-20个，类2-5个，行数100-500
- **高复杂度**: 函数20-50个，类5-10个，行数500-1000
- **极高复杂度**: 函数>50个，类>10个，行数>1000

### 质量评估维度
```javascript
// 文档质量 (0-100分)
- 90-100: 完整的函数/类文档，示例代码，清晰描述
- 70-89: 基本文档覆盖，部分函数有说明
- 50-69: 最小文档，主要函数有注释
- <50: 文档不足，缺少重要说明

// 代码组织 (0-100分)  
- 90-100: 清晰的模块划分，职责单一，命名规范
- 70-89: 良好的结构，偶有职责混合
- 50-69: 基本结构，存在改进空间
- <50: 结构混乱，需要重构
```

### 重要性评分算法
```
重要性评分 = 基础分 + 依赖权重 + 复杂度权重 + 类型权重

基础分: 所有文件基础分20
依赖权重: 被依赖次数 × 5 (最高30分)
复杂度权重: 复杂度等级对应分数 (low:5, medium:10, high:20, critical:30)
类型权重: 
  - 入口文件 (main.js, index.js): +25
  - 核心服务 (service, controller): +15
  - 配置文件 (config): +10
  - 工具类 (utils, helpers): +5
```

### 语言特定分析

#### JavaScript项目
- 检测ES6/ES7语法使用情况
- 分析异步编程模式 (Promise, async/await)
- 识别框架使用 (React, Vue, Express)
- 模块化程度评估 (CommonJS vs ES6 modules)

#### Python项目  
- 类型提示使用情况分析
- 异步编程检测 (asyncio, async/await)
- 包导入结构分析
- PEP 8规范遵循度评估

#### Java项目
- 注解使用情况统计
- 设计模式识别
- Spring框架特性使用
- 包结构组织评估

请基于提供的项目数据，进行全面深度的文件内容分析。