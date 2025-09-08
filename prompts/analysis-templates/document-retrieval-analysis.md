# Fix模式 - 文档检索分析模板

## 输入数据
**问题ID**: {{issueId}}
**问题描述**: {{issueDescription}}
**影响模块**: {{affectedModules}}
**技术栈**: {{techStack}}
**项目路径**: {{projectPath}}
**范围分析结果**: {{scopeAnalysis}}

## 分析目标

### 1. 相关文档识别
- 根据问题范围识别所需的技术文档类型
- 定位与问题直接相关的API文档和规范
- 查找相关的最佳实践和设计模式文档

### 2. 文档优先级评估
- 评估文档与问题解决的相关性
- 确定文档的时效性和准确性
- 识别关键决策依据文档

### 3. 知识库搜索策略
- 设计精确的搜索关键词和过滤条件
- 确定搜索范围和深度
- 制定多轮搜索策略

### 4. 文档完整性检查
- 评估现有文档是否足以支持问题修复
- 识别文档缺失和过时的部分
- 确定是否需要创建新文档

## 输出要求

```json
{
  "documentRetrieval": {
    "requiredDocuments": [
      {
        "type": "api_documentation|technical_spec|design_pattern|best_practice|troubleshooting",
        "title": "文档标题",
        "relevance": "critical|high|medium|low",
        "searchKeywords": ["关键词1", "关键词2"],
        "expectedLocation": "文档可能位置",
        "purpose": "使用此文档的目的"
      }
    ],
    "searchStrategy": {
      "primaryKeywords": ["主要搜索词"],
      "secondaryKeywords": ["辅助搜索词"],
      "technicalTerms": ["技术术语"],
      "excludeKeywords": ["排除词"],
      "searchScope": "codebase|external_docs|community|official_docs",
      "searchDepth": "surface|deep|comprehensive"
    },
    "knowledgeGaps": [
      {
        "category": "缺失的知识领域",
        "impact": "high|medium|low",
        "description": "具体描述缺失内容",
        "suggestedAction": "建议的补充措施"
      }
    ],
    "documentQuality": {
      "completeness": "complete|partial|incomplete",
      "accuracy": "current|outdated|unknown",
      "accessibility": "easy|moderate|difficult",
      "updateNeeded": true|false
    }
  }
}
```

## 特殊要求

### 文档类型识别
- **API文档**: REST/GraphQL接口规范、SDK文档
- **技术规范**: 架构设计、数据模型、协议规范
- **设计模式**: 代码模式、最佳实践、反模式
- **故障排除**: 已知问题、解决方案、诊断指南
- **配置文档**: 环境配置、部署指南、参数说明

### 搜索策略优化
- **关键词扩展**: 同义词、技术术语、错误代码
- **上下文过滤**: 版本相关、环境相关、框架相关
- **多维搜索**: 按问题类型、技术栈、时间范围

### 语言和框架特定要求
- **JavaScript**: NPM文档、框架官方文档、MDN参考
- **Python**: PyPI文档、PEP标准、框架文档
- **Java**: Javadoc、Spring文档、Apache项目文档
- **Go**: Go文档、标准库参考、社区最佳实践

### 文档相关性评估标准
- **Critical**: 直接解决问题的核心文档
- **High**: 提供重要上下文和约束条件
- **Medium**: 补充信息和参考资料
- **Low**: 背景知识和通用信息

## 分析重点

### 精准检索原则
- 避免信息过载，聚焦问题相关内容
- 优先获取官方和权威文档
- 确保文档版本与项目技术栈匹配

### 质量保证
- 验证文档的时效性和准确性
- 交叉验证多个来源的信息
- 识别潜在的文档冲突和矛盾

### 效率优化
- 建立高效的文档检索流程
- 复用已有的文档索引和分类
- 建立知识缓存减少重复搜索