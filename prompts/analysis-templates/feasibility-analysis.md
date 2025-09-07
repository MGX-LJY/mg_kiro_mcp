# 可行性智能分析模板

你是一个技术架构师和项目经理。请对以下需求进行全面的可行性分析。

## 分析数据
**需求列表**:
{{#each rawRequirements}}
- {{this}}
{{/each}}

**项目约束**: {{#each constraints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**目标语言**: {{language}}
**业务目标**: {{#each businessGoals}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

## 可行性评估维度

### 1. 技术可行性 (Technical Feasibility) - 权重30%
**评估要点**:
- 技术成熟度和可用性
- 团队技术能力匹配度
- 架构复杂度评估
- 第三方依赖风险
- 性能和扩展性要求

**{{language}}特定考虑**:
{{#if (eq language "javascript")}}
- Node.js生态系统支持
- 前端框架选择 (React/Vue/Angular)
- NPM依赖管理复杂度
- 浏览器兼容性要求
{{else if (eq language "python")}}
- Python包生态系统
- 异步处理能力
- 内存和性能限制
- 部署环境兼容性
{{else if (eq language "java")}}
- JVM生态系统
- Spring框架能力
- 企业级特性需求
- 内存和启动时间考虑
{{else}}
- 语言特定的技术栈成熟度
- 社区支持和文档完整性
- 开发和部署工具链
{{/if}}

### 2. 资源可行性 (Resource Feasibility) - 权重25%
**评估要点**:
- 开发人员数量和技能
- 开发时间估算
- 预算和成本控制
- 基础设施需求
- 外部服务和工具成本

### 3. 时间可行性 (Timeline Feasibility) - 权重25%  
**评估要点**:
- 项目时间表合理性
- 关键路径分析
- 风险缓冲时间
- 并行开发可能性
- 迭代交付计划

### 4. 业务可行性 (Business Feasibility) - 权重20%
**评估要点**:
- 业务价值投入产出比
- 市场需求验证
- 用户接受度预期
- 竞争优势分析
- 长期维护成本

## 输出要求

请以以下JSON格式输出可行性分析：

```json
{
  "feasibilityAnalysis": {
    "overall": "high|medium|low",
    "overallScore": 0-100的数字,
    "recommendation": "recommended|conditional|not_recommended",
    "factors": {
      "technical": {
        "score": 0-100的数字,
        "assessment": "详细评估说明",
        "issues": ["技术风险点"],
        "recommendations": ["技术建议"],
        "complexity": "low|medium|high"
      },
      "resource": {
        "score": 0-100的数字,
        "assessment": "详细评估说明", 
        "issues": ["资源约束问题"],
        "recommendations": ["资源优化建议"],
        "estimatedTeamSize": 数字,
        "estimatedDuration": "X周或X月"
      },
      "timeline": {
        "score": 0-100的数字,
        "assessment": "详细评估说明",
        "issues": ["时间风险点"],
        "recommendations": ["时间管理建议"],
        "criticalPath": ["关键任务"],
        "bufferNeeded": "建议缓冲时间百分比"
      },
      "business": {
        "score": 0-100的数字,
        "assessment": "详细评估说明",
        "issues": ["业务风险点"],  
        "recommendations": ["业务优化建议"],
        "roi": "预期投资回报",
        "marketFit": "市场适应性评估"
      }
    },
    "riskAssessment": {
      "highRisks": [
        {
          "risk": "风险描述",
          "impact": "high|medium|low", 
          "probability": "high|medium|low",
          "mitigation": "缓解措施"
        }
      ],
      "mediumRisks": ["中等风险列表"],
      "lowRisks": ["低风险列表"]
    },
    "alternatives": [
      {
        "option": "替代方案描述",
        "pros": ["优点"],
        "cons": ["缺点"],
        "feasibility": "high|medium|low"
      }
    ],
    "nextSteps": [
      "基于分析结果的下一步建议"
    ]
  }
}
```

## 评估指南

### 评分标准
- **90-100**: 优秀，强烈推荐实施
- **80-89**: 良好，推荐实施  
- **70-79**: 一般，条件允许时实施
- **60-69**: 较差，需要重大改进
- **<60**: 不可行，不建议实施

### 风险等级
- **高风险**: 可能导致项目失败或严重延期
- **中风险**: 可能影响项目质量或进度
- **低风险**: 影响有限，易于管理

## 分析提示
- 基于实际数据和行业经验进行评估
- 考虑团队当前能力和学习曲线
- 评估外部依赖的稳定性和风险
- 平衡理想状态和现实约束
- 提供具体可行的改进建议
- 考虑分阶段实施的可能性