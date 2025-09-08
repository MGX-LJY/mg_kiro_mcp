# Create模式第3步：开发任务分解分析模板

## 📊 输入数据分析

### 项目信息
**功能ID**: {{featureId}}
**技术设计**: {{techDesign}}
**复杂度等级**: {{complexity}}
**团队规模**: {{teamSize}}人
**Sprint周期**: {{sprintDuration}}周

## 🎯 分析目标

### 1. 任务智能分解
- 根据技术设计将功能分解为具体任务
- 按开发阶段组织任务（设计→开发→测试）
- 识别任务间的依赖关系

### 2. 工作量评估
- 基于复杂度和团队经验估算工作量
- 考虑技术难点和风险因素
- 提供时间范围和置信度

### 3. Sprint规划优化
- 根据团队容量分配任务到Sprint
- 平衡每个Sprint的工作负载
- 考虑依赖关系安排执行顺序

### 4. 风险识别预警
- 识别高风险任务和潜在阻塞点
- 评估技术风险和资源风险
- 提供风险缓解建议

## 📋 输出要求

请以JSON格式输出任务分解分析结果：

```json
{
  "taskBreakdown": {
    "phases": [
      {
        "name": "阶段名称",
        "duration": "预计时长",
        "tasks": [
          {
            "id": "任务ID", 
            "name": "任务名称",
            "priority": "优先级(high/medium/low)",
            "estimatedHours": "预计工时",
            "dependencies": ["依赖任务ID列表"]
          }
        ]
      }
    ],
    "sprintPlanning": {
      "totalSprints": "Sprint总数",
      "sprintCapacity": "每Sprint容量",
      "sprintBreakdown": [
        {
          "sprint": "Sprint编号",
          "tasks": ["包含任务ID列表"],
          "totalHours": "总工时"
        }
      ]
    },
    "riskAssessment": [
      {
        "task": "任务ID",
        "risk": "风险描述", 
        "mitigation": "缓解措施"
      }
    ]
  },
  "recommendations": [
    "任务规划建议1",
    "任务规划建议2"
  ]
}
```

## 🔍 分析重点

1. **任务原子性** - 确保任务足够小，便于跟踪和管理
2. **依赖关系** - 识别关键路径和并行机会
3. **技能匹配** - 考虑团队成员技能分工
4. **缓冲时间** - 为不确定性预留合理缓冲
5. **里程碑设置** - 设置清晰的阶段性目标

请基于技术设计进行详细的任务分解，确保任务规划科学合理且可执行。