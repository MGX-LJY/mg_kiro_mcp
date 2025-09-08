# Create模式 - 集成契约更新分析模板

## 输入数据
**功能ID**: {{featureId}}
**模块文档**: {{moduleDocumentation}}
**现有契约**: {{existingContracts}}
**项目路径**: {{projectPath}}

## 分析目标

### 1. 契约影响分析
- 新功能对现有API契约的影响
- 数据结构变更和兼容性评估
- 接口版本管理策略

### 2. 集成点识别
- 内部模块集成需求
- 外部服务集成需求
- 数据库契约更新需求

### 3. 契约设计
- 新增API接口规格
- 数据模型和传输格式
- 错误处理和状态码定义

### 4. 向后兼容性
- 破坏性变更识别
- 迁移策略设计
- 版本过渡计划

## 输出要求

```json
{
  "contractsUpdate": {
    "newContracts": [
      {
        "contractId": "契约唯一标识",
        "type": "api|database|event|integration",
        "name": "契约名称",
        "description": "契约描述",
        "specifications": {
          "endpoints": [
            {
              "method": "GET|POST|PUT|DELETE",
              "path": "/api/path",
              "requestSchema": {},
              "responseSchema": {},
              "statusCodes": []
            }
          ],
          "dataModels": [
            {
              "modelName": "数据模型名",
              "fields": [],
              "validations": [],
              "relationships": []
            }
          ],
          "events": [
            {
              "eventName": "事件名称",
              "payload": {},
              "triggers": []
            }
          ]
        }
      }
    ],
    "updatedContracts": [
      {
        "contractId": "现有契约ID",
        "changes": [
          {
            "type": "addition|modification|deprecation",
            "description": "变更描述",
            "impact": "high|medium|low",
            "migrationRequired": true
          }
        ]
      }
    ],
    "deletedContracts": ["已废弃的契约ID"],
    "compatibilityMatrix": {
      "breakingChanges": [
        {
          "change": "破坏性变更描述",
          "affectedClients": [],
          "migrationPath": "迁移路径"
        }
      ],
      "backwardCompatible": ["向后兼容的变更"]
    }
  },
  "integrationPlan": {
    "phases": [
      {
        "phase": 1,
        "name": "阶段名称",
        "contracts": ["此阶段涉及的契约"],
        "timeline": "预估时间",
        "dependencies": ["依赖项"]
      }
    ],
    "testingStrategy": {
      "contractTests": ["契约测试清单"],
      "integrationTests": ["集成测试清单"],
      "regressionTests": ["回归测试清单"]
    },
    "rollbackPlan": {
      "triggers": ["回滚触发条件"],
      "procedures": ["回滚步骤"]
    }
  },
  "qualityAssessment": {
    "contractComplexity": {
      "score": 85,
      "factors": ["复杂度影响因素"]
    },
    "riskAnalysis": {
      "high": ["高风险项"],
      "medium": ["中风险项"],
      "low": ["低风险项"]
    },
    "maintenanceImpact": {
      "score": 75,
      "reasoning": "维护影响评估"
    }
  },
  "recommendations": [
    {
      "category": "performance|security|maintainability",
      "priority": "high|medium|low",
      "description": "建议描述",
      "implementation": "实施方案"
    }
  ],
  "metadata": {
    "analysisId": "contracts-update-{{timestamp}}",
    "featureId": "{{featureId}}",
    "contractsCount": 0,
    "impactLevel": "high|medium|low",
    "estimatedEffort": "开发工作量估算"
  }
}
```

## 特殊要求

### 契约命名规范
- API契约: `api_v{version}_{domain}_{action}`
- 数据库契约: `db_{entity}_{operation}`
- 事件契约: `event_{domain}_{action}`

### 版本控制策略
- 语义化版本号 (major.minor.patch)
- 破坏性变更必须升级major版本
- 新增功能升级minor版本
- 修复升级patch版本

### 文档生成要求
- OpenAPI 3.0规格文档
- 数据库Schema文档
- 集成指南和示例代码
- 变更日志和迁移指南