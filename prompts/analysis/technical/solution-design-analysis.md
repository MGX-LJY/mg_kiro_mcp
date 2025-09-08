# Fix模式 - 解决方案设计分析模板

## 输入数据
**问题ID**: {{issueId}}
**问题描述**: {{issueDescription}}
**范围分析**: {{scopeAnalysis}}
**检索文档**: {{retrievedDocs}}
**影响评估**: {{impactAssessment}}
**技术栈**: {{techStack}}
**约束条件**: {{constraints}}

## 分析目标

### 1. 解决方案架构设计
- 设计最小化影响的修复架构
- 确定修复的技术路径和实现策略
- 选择最适合的设计模式和最佳实践
- 确保解决方案的可扩展性和维护性

### 2. 代码修复策略
- 设计精确的代码变更策略
- 确定修复的优先级和执行顺序  
- 选择合适的重构和优化方法
- 确保代码质量和一致性标准

### 3. 测试验证方案
- 设计全面的测试验证策略
- 确定单元测试、集成测试的覆盖范围
- 制定性能和稳定性验证方案
- 建立回归测试和监控机制

### 4. 部署和回滚计划
- 设计渐进式部署策略
- 制定详细的回滚和应急预案
- 确定部署验证的关键检查点
- 建立部署后的监控和告警机制

## 输出要求

```json
{
  "solutionDesign": {
    "architecture": {
      "approach": "minimal_change|refactor|rebuild|workaround",
      "designPattern": "适用的设计模式",
      "coreStrategy": "核心解决策略描述",
      "implementationPath": [
        {
          "step": "步骤编号",
          "action": "具体行动",
          "rationale": "选择理由",
          "risk": "low|medium|high"
        }
      ],
      "alternativeApproaches": [
        {
          "approach": "备选方案描述", 
          "pros": ["优势列表"],
          "cons": ["劣势列表"],
          "complexity": "low|medium|high"
        }
      ]
    },
    "codeChanges": {
      "primaryChanges": [
        {
          "file": "文件路径",
          "type": "fix|refactor|add|delete|move",
          "description": "变更描述",
          "codeSnippet": "关键代码片段",
          "impact": "局部|模块|系统",
          "testRequired": true|false
        }
      ],
      "supportingChanges": [
        {
          "file": "文件路径",
          "type": "config|test|doc|dependency",
          "description": "支持性变更描述",
          "reason": "变更原因"
        }
      ],
      "codeQuality": {
        "maintainability": "improved|maintained|degraded",
        "readability": "improved|maintained|degraded", 
        "performance": "improved|maintained|degraded",
        "security": "improved|maintained|degraded"
      }
    },
    "testingStrategy": {
      "unitTests": {
        "newTests": ["新增测试列表"],
        "modifiedTests": ["修改测试列表"],
        "coverage": "目标覆盖率",
        "priority": "critical|high|medium"
      },
      "integrationTests": {
        "scenarios": ["集成测试场景"],
        "dependencies": ["依赖测试"],
        "environment": "local|staging|production-like"
      },
      "performanceTests": {
        "required": true|false,
        "metrics": ["性能指标"],
        "baseline": "性能基准",
        "acceptanceCriteria": "验收标准"
      },
      "regressionTests": {
        "scope": "affected_modules|full_system",
        "automation": "full|partial|manual",
        "criticalPaths": ["关键路径列表"]
      }
    },
    "deployment": {
      "strategy": {
        "type": "blue_green|canary|rolling|feature_flag",
        "phases": [
          {
            "phase": "阶段名称",
            "scope": "部署范围", 
            "duration": "预计时间",
            "validation": "验证步骤",
            "rollbackTrigger": "回滚条件"
          }
        ],
        "prerequisites": ["部署前提条件"],
        "dependencies": ["部署依赖"]
      },
      "validation": {
        "healthChecks": ["健康检查项"],
        "functionalChecks": ["功能验证项"],
        "performanceChecks": ["性能检查项"],
        "monitoringAlerts": ["监控告警项"]
      },
      "rollback": {
        "complexity": "simple|moderate|complex",
        "timeToRollback": "回滚时间",
        "dataRecovery": "数据恢复方案",
        "rollbackTriggers": ["回滚触发条件"]
      }
    },
    "riskMitigation": {
      "technicalRisks": [
        {
          "risk": "技术风险描述",
          "mitigation": "缓解措施", 
          "contingency": "应急方案",
          "monitoring": "监控指标"
        }
      ],
      "businessRisks": [
        {
          "risk": "业务风险描述",
          "mitigation": "缓解措施",
          "communication": "沟通策略"
        }
      ],
      "qualityGates": [
        {
          "gate": "质量门禁",
          "criteria": "通过标准",
          "action": "失败处理"
        }
      ]
    }
  }
}
```

## 特殊要求

### 架构设计原则
- **最小化原则**: 优先选择影响最小的解决方案
- **向后兼容**: 确保现有功能不受影响
- **可维护性**: 提高代码的长期可维护性
- **性能考虑**: 不引入性能回归问题

### 语言特定设计
- **JavaScript**: 考虑异步处理、错误边界、内存管理
- **Python**: 考虑异常处理、类型提示、性能优化
- **Java**: 考虑异常层次、线程安全、资源管理
- **Go**: 考虑错误处理、并发安全、内存效率

### 代码质量标准
- **SOLID原则**: 确保设计符合面向对象原则
- **Clean Code**: 遵循清洁代码实践
- **安全编码**: 避免引入安全漏洞
- **文档完备**: 提供充分的代码注释和文档

### 测试驱动设计
- **测试优先**: 基于测试用例设计解决方案
- **边界测试**: 充分测试边界条件和异常情况
- **集成测试**: 确保组件间的正确交互
- **自动化测试**: 最大化测试自动化覆盖率

### 部署策略选择
- **风险评估**: 基于影响评估选择部署策略
- **渐进部署**: 采用分阶段的渐进部署方式
- **监控密集**: 部署期间加强监控和告警
- **快速回滚**: 确保能够快速回滚到稳定状态

## 分析重点

### 解决方案完整性
- 覆盖问题的根本原因而非症状
- 考虑长期和短期的解决效果
- 确保解决方案的可验证性和可测量性

### 实现可行性
- 评估技术方案的实现复杂度
- 确保团队具备实现所需的技术能力
- 考虑时间和资源约束的现实性

### 质量保证
- 建立多层次的质量检验机制
- 确保解决方案符合编码标准和最佳实践
- 建立持续改进和优化的机制