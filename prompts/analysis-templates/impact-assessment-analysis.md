# Fix模式 - 影响评估分析模板

## 输入数据
**问题ID**: {{issueId}}
**问题描述**: {{issueDescription}}
**范围分析结果**: {{scopeAnalysis}}
**检索文档**: {{retrievedDocs}}
**修复建议**: {{proposedSolution}}
**技术栈**: {{techStack}}
**环境信息**: {{environmentInfo}}

## 分析目标

### 1. 业务影响评估
- 分析修复对用户体验的影响
- 评估对业务流程的潜在干扰
- 识别关键业务功能的风险点
- 估算停机时间和服务中断风险

### 2. 技术风险分析
- 评估修复可能引入的新问题
- 分析代码变更的复杂度和风险
- 识别系统依赖关系的影响
- 评估数据完整性和一致性风险

### 3. 部署影响分析
- 评估不同环境下的影响差异
- 分析部署策略和回滚计划
- 识别配置和环境依赖变更
- 评估多服务协调部署的复杂性

### 4. 资源和时间成本
- 估算修复所需的开发时间
- 评估测试验证的工作量
- 分析所需的人力和技术资源
- 制定时间线和里程碑计划

## 输出要求

```json
{
  "impactAssessment": {
    "businessImpact": {
      "userExperience": {
        "severity": "none|low|medium|high|critical",
        "affectedUsers": "specific_group|all_users|admin_only",
        "functionality": ["受影响的功能列表"],
        "mitigationStrategy": "缓解策略"
      },
      "businessProcesses": {
        "criticalProcesses": ["关键业务流程"],
        "serviceAvailability": "maintained|degraded|interrupted",
        "revenueImpact": "none|low|medium|high",
        "complianceRisk": "none|low|medium|high"
      },
      "downtime": {
        "estimated": "预估停机时间",
        "schedulingRequirement": "maintenance_window|immediate|flexible",
        "peakHours": true|false,
        "communicationPlan": "沟通计划描述"
      }
    },
    "technicalRisk": {
      "codeComplexity": {
        "changeScope": "minimal|moderate|extensive",
        "riskLevel": "low|medium|high",
        "testingCoverage": "comprehensive|partial|minimal",
        "backwardCompatibility": "maintained|partial|broken"
      },
      "systemDependencies": {
        "affectedServices": ["相关服务列表"],
        "databaseChanges": "none|schema|data|both",
        "apiChanges": "none|backward_compatible|breaking",
        "configurationChanges": ["配置变更列表"]
      },
      "dataIntegrity": {
        "riskLevel": "safe|cautious|risky",
        "backupRequired": true|false,
        "migrationNeeded": true|false,
        "rollbackComplexity": "simple|moderate|complex"
      }
    },
    "deploymentImpact": {
      "environments": {
        "development": {"risk": "low|medium|high", "notes": "说明"},
        "staging": {"risk": "low|medium|high", "notes": "说明"},
        "production": {"risk": "low|medium|high", "notes": "说明"}
      },
      "deploymentStrategy": {
        "recommended": "blue_green|canary|rolling|immediate",
        "phased": true|false,
        "rollbackPlan": "简单|复杂|困难",
        "monitoringRequirement": "标准|增强|密集"
      },
      "coordination": {
        "multiService": true|false,
        "sequenceRequired": true|false,
        "externalDependencies": ["外部依赖列表"],
        "communicationNeeded": ["需要协调的团队"]
      }
    },
    "resourceRequirements": {
      "timeline": {
        "development": "开发时间估算",
        "testing": "测试时间估算",
        "deployment": "部署时间估算",
        "monitoring": "监控时间估算",
        "totalEstimate": "总时间估算"
      },
      "teamRequirements": {
        "developers": 1|2|3,
        "testers": 1|2|3,
        "devops": 1|2|3,
        "specialistNeeded": "专家需求描述"
      },
      "infrastructure": {
        "additionalResources": "额外资源需求",
        "scalingRequired": true|false,
        "monitoringEnhancement": "监控增强需求"
      }
    },
    "riskMitigation": {
      "primaryRisks": [
        {
          "risk": "风险描述",
          "probability": "low|medium|high",
          "impact": "low|medium|high", 
          "mitigation": "缓解措施"
        }
      ],
      "contingencyPlan": "应急计划",
      "successCriteria": ["成功标准列表"],
      "monitoringMetrics": ["监控指标列表"]
    }
  }
}
```

## 特殊要求

### 业务影响深度分析
- **用户细分**: 区分不同用户群体的影响程度
- **功能优先级**: 识别核心功能vs增值功能的风险
- **业务连续性**: 评估关键业务流程的中断风险
- **合规要求**: 考虑法规和审计要求的影响

### 技术风险量化
- **变更范围**: 精确评估代码修改的影响半径
- **依赖分析**: 深度分析上下游服务的连锁影响
- **性能影响**: 评估修复对系统性能的潜在影响
- **安全考虑**: 分析修复可能引入的安全风险

### 环境差异评估
- **配置差异**: 分析不同环境的配置和行为差异
- **数据差异**: 考虑生产数据规模和复杂性的影响
- **负载差异**: 评估生产负载下的表现差异
- **监控差异**: 分析不同环境的可观测性水平

### 时间敏感性分析
- **紧急程度**: 区分紧急修复vs计划修复的策略
- **业务窗口**: 识别最佳部署时间窗口
- **依赖时序**: 分析修复的时序依赖关系
- **沟通需求**: 评估利益相关者沟通的复杂性

## 分析重点

### 全面性原则
- 覆盖技术、业务、运营三个维度
- 考虑短期和长期的影响
- 评估直接和间接的风险

### 量化评估
- 使用具体的时间和资源估算
- 提供可衡量的风险指标
- 建立明确的成功标准

### 可操作性
- 提供具体的缓解措施
- 制定清晰的执行计划
- 建立有效的监控体系