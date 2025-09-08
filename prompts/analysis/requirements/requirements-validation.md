# 需求质量验证分析模板

你是一个经验丰富的需求工程师。请对以下需求进行质量验证分析。

## 分析数据
**需求列表**:
{{#each rawRequirements}}
- {{this}}
{{/each}}

**项目上下文**: {{context}}
**约束条件**: {{constraints}}

## 验证标准

### 1. 完整性 (Completeness) - 权重25%
**评估标准**:
- 需求数量是否足够 (最少3个)
- 是否覆盖主要功能领域
- 是否包含边界情况和异常处理
- 是否明确了前置条件和后置条件

### 2. 清晰度 (Clarity) - 权重25%
**评估标准**:
- 需求描述是否具体明确
- 是否避免了模糊词汇 ("用户友好"、"高性能")
- 是否使用了明确的动词和名词
- 是否包含可量化的指标

### 3. 一致性 (Consistency) - 权重25%
**评估标准**:
- 需求间是否存在冲突
- 术语使用是否一致
- 是否存在重复需求
- 优先级设置是否合理

### 4. 可测试性 (Testability) - 权重25%
**评估标准**:
- 需求是否可以被验证
- 是否有明确的验收标准
- 是否可以设计测试用例
- 成功条件是否明确定义

## 输出要求

请以以下JSON格式输出验证结果：

```json
{
  "validation": {
    "completeness": {
      "score": 0-100的数字,
      "issues": [
        "具体问题描述"
      ],
      "suggestions": [
        "改进建议"
      ]
    },
    "clarity": {
      "score": 0-100的数字,
      "issues": [
        "具体问题描述"
      ],
      "suggestions": [
        "改进建议"
      ]
    },
    "consistency": {
      "score": 0-100的数字,
      "issues": [
        "具体问题描述"
      ],
      "suggestions": [
        "改进建议"
      ]
    },
    "testability": {
      "score": 0-100的数字,
      "issues": [
        "具体问题描述"
      ],
      "suggestions": [
        "改进建议"
      ]
    },
    "overallScore": 0-100的数字,
    "qualityLevel": "excellent|good|fair|poor",
    "criticalIssues": [
      "必须解决的关键问题"
    ],
    "improvements": [
      "优先改进建议"
    ]
  },
  "detailedAnalysis": {
    "strengths": [
      "需求的优点"
    ],
    "weaknesses": [
      "需求的不足"
    ],
    "riskAreas": [
      "高风险区域"
    ]
  }
}
```

## 验证提示
- 评分要客观公正，基于具体证据
- 问题描述要具体，避免泛泛而谈
- 建议要可行，提供具体的改进方向
- 考虑需求的业务价值和技术可行性
- 重点关注可能影响项目成功的质量问题