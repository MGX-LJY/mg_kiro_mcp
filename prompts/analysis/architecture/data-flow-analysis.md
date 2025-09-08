# 数据流分析智能模板

你是一个数据流架构专家。请基于项目代码分析生成数据流分析报告。

## 输入数据
**文件内容分析**: {{filesData}}
**模块分析结果**: {{moduleAnalysis}}
**API分析结果**: {{apiAnalysis}}
**项目信息**: {{projectInfo}}

## 分析目标

### 1. 数据流路径识别
识别系统中的数据流向：
- 数据输入点识别
- 数据处理管道分析
- 数据输出点识别
- 数据转换过程分析

### 2. 数据存储分析
分析数据的存储和持久化：
- 数据库交互模式
- 缓存使用模式
- 文件存储操作
- 内存数据管理

### 3. 数据传输分析
分析数据在系统间的传输：
- API数据交换
- 消息队列使用
- 事件驱动数据流
- 实时数据流

## 输出要求

```json
{
  "dataFlowOverview": {
    "totalFlows": "数据流总数",
    "inputSources": "数据输入源数量",
    "outputDestinations": "数据输出目标数量", 
    "processingStages": "处理阶段数量",
    "dataComplexity": "数据复杂度(low/medium/high)"
  },
  "dataFlows": [
    {
      "flowName": "数据流名称",
      "description": "数据流描述",
      "source": "数据源",
      "destination": "数据目标",
      "path": ["数据流路径"],
      "dataTypes": ["数据类型"],
      "transformations": ["数据转换操作"],
      "volume": "数据量级(low/medium/high)",
      "frequency": "数据频率",
      "criticality": "重要程度(low/medium/high/critical)"
    }
  ],
  "dataInputs": [
    {
      "source": "输入源",
      "type": "输入类型(user/api/file/database/external)",
      "dataFormat": "数据格式",
      "volume": "数据量",
      "validation": "数据验证方式",
      "processingModule": "处理模块"
    }
  ],
  "dataOutputs": [
    {
      "destination": "输出目标",
      "type": "输出类型(api/file/database/ui/external)",
      "dataFormat": "数据格式",
      "frequency": "输出频率",
      "generationModule": "生成模块"
    }
  ],
  "dataStorage": {
    "databases": [
      {
        "name": "数据库名称",
        "type": "数据库类型",
        "operations": ["操作类型"],
        "dataTypes": ["存储的数据类型"],
        "accessPattern": "访问模式"
      }
    ],
    "caching": [
      {
        "name": "缓存名称",
        "type": "缓存类型",
        "dataTypes": ["缓存的数据类型"],
        "ttl": "生存时间",
        "evictionPolicy": "淘汰策略"
      }
    ],
    "files": [
      {
        "type": "文件类型",
        "operations": ["文件操作"],
        "formats": ["文件格式"],
        "location": "存储位置"
      }
    ]
  },
  "dataTransformations": [
    {
      "transformation": "转换名称",
      "inputFormat": "输入格式",
      "outputFormat": "输出格式",
      "transformationLogic": "转换逻辑",
      "performance": "性能特征",
      "module": "执行模块"
    }
  ],
  "dataQuality": {
    "validation": "数据验证覆盖度(0-100)",
    "consistency": "数据一致性(0-100)",
    "integrity": "数据完整性(0-100)",
    "security": "数据安全性(0-100)",
    "performance": "数据处理性能(0-100)"
  },
  "dataFlowIssues": [
    {
      "issue": "数据流问题",
      "severity": "严重程度(low/medium/high/critical)",
      "description": "问题描述",
      "affectedFlows": ["影响的数据流"],
      "impact": "业务影响",
      "recommendation": "解决建议"
    }
  ],
  "optimizationOpportunities": [
    {
      "opportunity": "优化机会",
      "description": "优化描述",
      "expectedBenefit": "预期收益",
      "implementationEffort": "实施工作量",
      "priority": "优先级(high/medium/low)"
    }
  ]
}
```

## 分析指南

### 数据流模式识别
- **管道模式**: 数据依次经过多个处理阶段
- **分支模式**: 数据从一个源分发到多个目标
- **聚合模式**: 多个数据源汇聚到一个目标
- **循环模式**: 数据在系统中循环处理

### 数据质量评估
- **验证**: 输入数据的验证机制
- **清洗**: 数据清洗和标准化过程
- **一致性**: 跨模块数据一致性保证
- **完整性**: 数据完整性约束

请基于提供的项目数据，深入分析数据流的路径、转换和质量。