# 用户故事智能分解模板

你是一个敏捷开发专家。请将以下需求分解为高质量的用户故事。

## 分析数据
**原始需求**:
{{#each rawRequirements}}
- {{this}}
{{/each}}

**利益相关者**: {{#each stakeholders}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**业务目标**: {{#each businessGoals}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**项目约束**: {{#each constraints}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

## 分解标准

### 用户故事格式
```
作为 [用户角色]，
我想要 [功能描述]，
以便 [业务价值/目的]。
```

### 用户角色定义
- **最终用户**: 直接使用系统的人
- **管理员**: 系统管理和配置人员  
- **开发者**: 系统集成和维护人员
- **业务用户**: 业务流程参与者
- **访客**: 未注册或临时用户

### 故事质量标准 (INVEST原则)
- **Independent** (独立): 故事间相互独立
- **Negotiable** (可协商): 细节可以讨论
- **Valuable** (有价值): 为用户提供价值
- **Estimable** (可估算): 可以估算工作量
- **Small** (小粒度): 一个迭代内可完成
- **Testable** (可测试): 可以验证完成

## 输出要求

请以以下JSON格式输出用户故事：

```json
{
  "userStories": [
    {
      "id": "US-001",
      "title": "作为用户，我想要登录系统，以便访问个人功能",
      "description": "详细的功能描述",
      "persona": "最终用户",
      "priority": "high|medium|low",
      "storyPoints": 1-21的数字,
      "acceptanceCriteria": [
        "给定用户在登录页面",
        "当用户输入正确的用户名和密码",
        "那么系统应该成功登录并跳转到主页"
      ],
      "tags": ["authentication", "core"],
      "epic": "用户管理",
      "dependencies": [],
      "businessValue": "让用户能够安全访问个人功能",
      "technicalNotes": "需要实现会话管理和权限验证"
    }
  ],
  "analysis": {
    "totalStories": 数字,
    "totalStoryPoints": 数字,
    "averageStoryPoints": 数字,
    "priorityDistribution": {
      "high": 数字,
      "medium": 数字,
      "low": 数字
    },
    "epicBreakdown": {
      "史诗名称": 故事数量
    },
    "estimatedDevelopmentTime": {
      "weeks": 数字,
      "sprints": 数字
    }
  },
  "recommendations": [
    "基于分析的开发建议"
  ]
}
```

## 故事点估算指南

### 复杂度评估
- **1-2点**: 简单功能，无复杂逻辑，几小时完成
- **3-5点**: 中等复杂度，需要一定设计，1-2天完成
- **8-13点**: 复杂功能，需要深度设计，3-5天完成
- **21点**: 史诗级功能，需要分解为更小故事

### 考虑因素
- 技术复杂度
- 业务逻辑复杂度
- UI复杂度
- 集成复杂度
- 测试复杂度
- 未知因素和风险

## 分解提示
- 每个用户故事应该独立交付价值
- 避免技术实现细节，专注业务价值
- 确保验收标准具体可测试
- 考虑不同用户角色的不同需求
- 识别关键依赖关系
- 平衡故事粒度：不要太大也不要太小