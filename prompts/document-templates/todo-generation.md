# 开发任务分解文档生成模板

## 项目信息
**功能名称**: {{featureId}}
**技术栈**: {{primaryLanguage}}
**预估工期**: {{estimatedDuration}}

---

# {{featureId}} 开发任务分解

## 📋 项目总览
{{taskBreakdown.overview.description}}

**开发模式**: {{taskBreakdown.overview.developmentMode}}
**团队规模**: {{taskBreakdown.overview.teamSize}}
**关键里程碑**: {{taskBreakdown.overview.keyMilestones}}

## 🏗️ 任务分解结构 (WBS)

### 第一层级：主要开发阶段
{{#each taskBreakdown.phases}}
#### 阶段{{phaseNumber}}: {{name}}
**目标**: {{objective}}
**工期**: {{duration}}天
**优先级**: {{priority}}

{{#each tasks}}
##### {{taskId}}: {{title}}
- **描述**: {{description}}
- **工作量**: {{effort}}工时
- **技能要求**: {{skills}}
- **复杂度**: {{complexity}}/10
- **依赖**: {{dependencies}}
- **可并行**: {{parallel}}

###### 子任务清单
{{#each subtasks}}
- [ ] **{{id}}** {{title}} ({{estimatedHours}}h)
  - 输入: {{inputs}}
  - 输出: {{outputs}}
  - 验收标准: {{acceptanceCriteria}}

{{/each}}

{{/each}}
{{/each}}

## 📊 Sprint 规划

### Sprint 总体安排
{{#each taskBreakdown.sprints}}
#### Sprint {{sprintNumber}} ({{duration}}天)
**Sprint 目标**: {{goal}}
**团队容量**: {{capacity}}工时

##### 待办事项 (Product Backlog)
| 故事ID | 用户故事 | 优先级 | 估点 | 负责人 |
|--------|----------|--------|------|--------|
{{#each backlog}}
| {{storyId}} | {{userStory}} | {{priority}} | {{storyPoints}} | {{assignee}} |
{{/each}}

##### 冲刺任务 (Sprint Backlog)
{{#each sprintTasks}}
- [ ] **{{taskId}}**: {{title}}
  - **用户故事**: {{userStory}}
  - **工作量**: {{effort}}h
  - **状态**: {{status}}
  - **定义完成**: {{definitionOfDone}}

{{/each}}

##### 每日站会检查点
{{#each dailyCheckpoints}}
- **第{{day}}天**: {{focus}}
{{/each}}

{{/each}}

## ⏰ 项目时间线

### 甘特图概览
```mermaid
gantt
    title {{featureId}} 开发时间线
    dateFormat  YYYY-MM-DD
    {{#each taskBreakdown.timeline.ganttData}}
    section {{sectionName}}
    {{#each tasks}}
    {{taskName}} : {{startDate}}, {{endDate}}
    {{/each}}
    {{/each}}
```

### 关键路径分析
{{#each taskBreakdown.timeline.criticalPath}}
#### {{milestone}}
- **计划日期**: {{plannedDate}}
- **关键任务**: {{criticalTasks}}
- **风险因素**: {{risks}}
- **缓冲时间**: {{bufferTime}}

{{/each}}

### 依赖关系图
```mermaid
{{taskBreakdown.timeline.dependencyDiagram}}
```

## 👥 资源分配

### 团队角色定义
{{#each taskBreakdown.resources.roles}}
#### {{roleName}}
- **职责范围**: {{responsibilities}}
- **技能要求**: {{requiredSkills}}
- **工作量占比**: {{workloadPercentage}}%
- **关键任务**: {{keyTasks}}

{{/each}}

### 任务分配矩阵
| 任务类别 | 前端开发 | 后端开发 | 测试工程师 | DevOps |
|----------|----------|----------|------------|--------|
{{#each taskBreakdown.resources.allocationMatrix}}
| {{category}} | {{frontend}}% | {{backend}}% | {{testing}}% | {{devops}}% |
{{/each}}

### 技能缺口分析
{{#each taskBreakdown.resources.skillGaps}}
- **缺口领域**: {{area}}
- **影响程度**: {{impact}}
- **解决方案**: {{solution}}
- **培训计划**: {{trainingPlan}}

{{/each}}

## 🔍 风险管理

### 风险识别与评估
{{#each taskBreakdown.risks.identified}}
#### {{riskId}}: {{title}}
- **描述**: {{description}}
- **类别**: {{category}}
- **概率**: {{probability}}/10
- **影响**: {{impact}}/10
- **风险值**: {{riskValue}}

##### 缓解策略
{{#each mitigationStrategies}}
- **策略**: {{strategy}}
- **负责人**: {{owner}}
- **时间点**: {{timing}}
- **成本**: {{cost}}

{{/each}}

{{/each}}

### 应急预案
{{#each taskBreakdown.risks.contingencyPlans}}
#### 场景: {{scenario}}
- **触发条件**: {{triggerConditions}}
- **应对措施**: {{responseActions}}
- **资源调配**: {{resourceReallocation}}
- **时间影响**: {{timeImpact}}

{{/each}}

## 🎯 质量管理

### 质量标准定义
{{#each taskBreakdown.quality.standards}}
#### {{category}}
- **测量指标**: {{metrics}}
- **目标值**: {{targetValue}}
- **检查方式**: {{verificationMethod}}
- **检查频率**: {{checkFrequency}}

{{/each}}

### 代码审查计划
{{#each taskBreakdown.quality.codeReview}}
- **阶段**: {{phase}}
- **审查类型**: {{reviewType}}
- **参与人员**: {{participants}}
- **标准检查清单**: {{checklist}}

{{/each}}

### 测试策略
{{#each taskBreakdown.quality.testing}}
#### {{testType}}测试
- **覆盖范围**: {{coverage}}
- **测试用例数**: {{testCasesCount}}
- **执行时机**: {{executionTiming}}
- **通过标准**: {{passCriteria}}

{{/each}}

## 📈 进度监控

### KPI 指标体系
{{#each taskBreakdown.monitoring.kpis}}
- **{{indicator}}**: 目标{{target}} | 当前{{current}} | 趋势{{trend}}
{{/each}}

### 燃尽图设置
- **总工作量**: {{taskBreakdown.monitoring.burndown.totalEffort}}工时
- **每日理想燃尽**: {{taskBreakdown.monitoring.burndown.idealDaily}}工时
- **当前燃尽率**: {{taskBreakdown.monitoring.burndown.currentRate}}工时/天

### 里程碑检查点
{{#each taskBreakdown.monitoring.milestones}}
#### {{milestone}}
- **计划日期**: {{plannedDate}}
- **完成标准**: {{completionCriteria}}
- **交付物**: {{deliverables}}
- **评审方式**: {{reviewMethod}}

{{/each}}

## 🔄 沟通计划

### 会议安排
{{#each taskBreakdown.communication.meetings}}
#### {{meetingType}}
- **频率**: {{frequency}}
- **参与人员**: {{participants}}
- **议程模板**: {{agendaTemplate}}
- **输出物**: {{outputs}}

{{/each}}

### 报告机制
{{#each taskBreakdown.communication.reporting}}
- **报告类型**: {{reportType}}
- **频率**: {{frequency}}
- **接收人**: {{recipients}}
- **内容要点**: {{keyContent}}

{{/each}}

## 📋 验收标准

### 功能验收
{{#each taskBreakdown.acceptance.functional}}
- [ ] **{{criterion}}**
  - 验证方法: {{verificationMethod}}
  - 测试数据: {{testData}}
  - 预期结果: {{expectedResult}}

{{/each}}

### 非功能验收
{{#each taskBreakdown.acceptance.nonFunctional}}
- [ ] **{{criterion}}**
  - 测量指标: {{measurementMetric}}
  - 目标值: {{targetValue}}
  - 测试工具: {{testingTools}}

{{/each}}

### 上线准备检查
{{#each taskBreakdown.acceptance.deploymentReadiness}}
- [ ] {{item}}
{{/each}}

---

## 📊 项目仪表板

### 整体进度
- **完成百分比**: {{progress.completionPercentage}}%
- **剩余工时**: {{progress.remainingHours}}h
- **预计完成日期**: {{progress.estimatedCompletion}}

### 风险状态
- **高风险项**: {{progress.highRisks}}个
- **中风险项**: {{progress.mediumRisks}}个
- **已缓解风险**: {{progress.mitigatedRisks}}个

### 质量指标
- **代码覆盖率**: {{progress.codeCoverage}}%
- **缺陷密度**: {{progress.defectDensity}}/KLOC
- **技术债务**: {{progress.technicalDebt}}h

---

**文档版本**: v1.0  
**创建时间**: {{timestamp}}  
**分析ID**: {{analysisId}}  
**项目复杂度**: {{complexityScore}}/100  
**总计任务数**: {{totalTasks}}个