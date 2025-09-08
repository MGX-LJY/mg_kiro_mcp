# Fix模式 - 文档更新分析模板

## 输入数据
**问题ID**: {{issueId}}
**修复总结**: {{fixSummary}}
**代码变更**: {{codeChanges}}
**影响分析**: {{impactAnalysis}}
**项目文档结构**: {{docStructure}}
**文档类型**: {{docTypes}}

## 分析目标

### 1. 文档影响识别
- 识别需要更新的文档类型和范围
- 分析修复对现有文档的影响程度
- 确定文档更新的优先级和紧急程度
- 评估文档维护的成本和收益

### 2. 内容更新策略
- 设计准确反映修复内容的文档更新
- 确保技术文档与代码变更的一致性
- 更新用户文档和操作指南
- 同步API文档和接口规范

### 3. 文档质量保证
- 确保文档的准确性和完整性
- 验证文档格式和结构的一致性
- 检查文档链接和引用的有效性
- 确保多语言文档的同步更新

### 4. 知识传播和归档
- 建立修复知识的归档和索引机制
- 创建故障排除和最佳实践文档
- 更新团队知识库和经验分享
- 建立持续文档维护的流程

## 输出要求

```json
{
  "documentationUpdate": {
    "impactAnalysis": {
      "affectedDocuments": [
        {
          "path": "文档路径",
          "type": "api|user_guide|technical|troubleshooting|readme",
          "updateType": "major|minor|patch|new_section",
          "priority": "critical|high|medium|low",
          "estimatedEffort": "工作量估算",
          "dependencies": ["依赖的其他文档"]
        }
      ],
      "newDocuments": [
        {
          "type": "故障排除|最佳实践|配置指南|API更新",
          "title": "文档标题",
          "purpose": "文档目的",
          "targetAudience": "目标受众",
          "template": "使用的模板"
        }
      ],
      "obsoleteContent": [
        {
          "document": "文档路径",
          "section": "过时章节",
          "reason": "过时原因",
          "action": "删除|更新|重写"
        }
      ]
    },
    "contentStrategy": {
      "technicalDocumentation": {
        "apiChanges": [
          {
            "endpoint": "API端点",
            "changeType": "新增|修改|废弃",
            "description": "变更描述",
            "migrationGuide": "迁移指南",
            "examples": ["使用示例"]
          }
        ],
        "architectureUpdates": {
          "components": ["更新的组件"],
          "dataFlow": "数据流变更",
          "integration": "集成点变更",
          "diagrams": ["需要更新的图表"]
        },
        "configurationChanges": [
          {
            "parameter": "配置参数",
            "changeType": "新增|修改|移除",
            "defaultValue": "默认值",
            "impact": "影响说明"
          }
        ]
      },
      "userDocumentation": {
        "userGuideUpdates": [
          {
            "section": "章节名称",
            "changes": "变更内容",
            "screenshots": "需要更新的截图",
            "workflows": "更新的工作流程"
          }
        ],
        "troubleshooting": {
          "newIssues": ["新增的故障排除条目"],
          "resolvedIssues": ["已解决的问题"],
          "preventiveMeasures": ["预防措施"],
          "diagnosticSteps": ["诊断步骤"]
        },
        "releaseNotes": {
          "bugFixes": ["修复的问题"],
          "improvements": ["改进项"],
          "breakingChanges": ["破坏性变更"],
          "migration": "迁移指南"
        }
      }
    },
    "qualityAssurance": {
      "accuracy": {
        "factCheck": "事实核查状态",
        "codeExamples": "代码示例验证",
        "linkValidation": "链接有效性检查",
        "versionConsistency": "版本一致性"
      },
      "completeness": {
        "coverage": "文档覆盖率",
        "missingTopics": ["缺失的主题"],
        "redundancy": "冗余内容处理",
        "gaps": "识别的文档空白"
      },
      "accessibility": {
        "language": "语言清晰度",
        "structure": "结构合理性", 
        "formatting": "格式一致性",
        "searchability": "可搜索性"
      }
    },
    "knowledgeManagement": {
      "lessonLearned": {
        "problemPattern": "问题模式识别",
        "solution": "解决方案总结",
        "preventionStrategy": "预防策略",
        "bestPractices": ["最佳实践总结"]
      },
      "knowledgeBase": {
        "updateMethod": "更新方式",
        "categorization": "分类标签",
        "searchKeywords": ["搜索关键词"],
        "relatedTopics": ["相关主题"]
      },
      "teamKnowledge": {
        "sharingMechanism": "知识分享机制",
        "trainingNeeds": "培训需求",
        "expertise": "专业知识记录",
        "collaboration": "协作指南"
      }
    },
    "maintenancePlan": {
      "updateSchedule": {
        "immediate": ["立即更新的文档"],
        "shortTerm": ["短期更新计划"],
        "longTerm": ["长期维护计划"],
        "reviewCycle": "审查周期"
      },
      "ownership": {
        "primaryOwners": ["主要负责人"],
        "reviewers": ["审查人员"],
        "approvers": ["批准人员"],
        "stakeholders": ["利益相关者"]
      },
      "automation": {
        "autoGeneration": "自动生成的文档",
        "validation": "自动验证机制",
        "synchronization": "同步机制",
        "monitoring": "文档监控"
      }
    }
  }
}
```

## 特殊要求

### 文档类型特定处理
- **API文档**: 自动从代码生成、版本管理、向后兼容性说明
- **用户文档**: 截图更新、工作流程修改、FAQ更新
- **技术文档**: 架构图更新、配置说明、部署指南
- **故障排除**: 新增故障模式、解决步骤、预防措施

### 多语言文档同步
- **主语言优先**: 确定主要语言版本的更新
- **翻译协调**: 协调多语言版本的同步更新
- **本地化考虑**: 考虑不同语言和文化的特殊需求
- **一致性检查**: 确保多语言版本的一致性

### 文档格式标准化
- **Markdown规范**: 遵循项目的Markdown编写规范
- **API文档标准**: 使用OpenAPI/Swagger等标准格式
- **图表规范**: 统一图表绘制工具和样式
- **版本标识**: 清晰的版本标识和变更日志

### 文档关联管理
- **交叉引用**: 维护文档间的交叉引用关系
- **依赖追踪**: 跟踪文档之间的依赖关系
- **变更传播**: 自动识别需要同步更新的文档
- **一致性验证**: 验证相关文档的一致性

### 用户体验优化
- **可读性**: 提高文档的可读性和易理解性
- **导航结构**: 优化文档的导航和组织结构
- **搜索优化**: 改善文档的搜索体验
- **反馈机制**: 建立用户反馈和改进机制

## 分析重点

### 全面覆盖原则
- 确保所有受影响的文档都得到适当更新
- 避免文档更新的遗漏和不一致
- 建立系统性的文档更新流程

### 准确性保证
- 确保文档内容与实际代码和功能的一致性
- 验证所有示例和代码片段的正确性
- 建立文档质量的审查和验证机制

### 可持续性考虑
- 建立长期的文档维护机制
- 考虑文档更新的成本效益
- 推进文档自动化生成和维护