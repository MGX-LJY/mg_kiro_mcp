# 智能语言检测报告生成模板

你是一个技术文档生成专家。请基于语言检测分析结果生成完整的语言检测报告。

## 输入数据
**语言检测分析**: {{languageAnalysis}}
**项目信息**: {{projectInfo}}
**生成时间**: {{timestamp}}

## 文档生成目标

生成完整的`language-detection-report.md`文档，包括：
1. 语言识别结果与置信度
2. 技术栈详细分析
3. 项目特征评估
4. 开发环境建议
5. 质量指标评估
6. 下一步工作建议

## Markdown输出模板

```markdown
# {{projectInfo.name}} - 智能语言检测报告

**版本**: 1.0  
**生成时间**: {{timestamp}}  
**项目路径**: {{projectInfo.path}}  
**置信度**: {{languageAnalysis.detection.confidence}}  

---

## 🎯 检测结果

### 主要语言
**{{languageAnalysis.detection.primaryLanguage}}** (置信度: {{languageAnalysis.detection.confidence}})

### 次要语言
{{#each languageAnalysis.detection.secondaryLanguages}}
- **{{language}}** ({{usage}}%) - {{purpose}}
{{/each}}

### 检测依据
{{#with languageAnalysis.detection.languageEvidence}}
#### 📁 文件扩展名分布
{{#each fileExtensions}}
- `{{@key}}`: {{this}}个文件
{{/each}}

#### ⚙️ 配置文件
{{#each configFiles}}
- {{this}}
{{/each}}

#### 🏗️ 框架标识
{{#each frameworkMarkers}}
- {{this}}
{{/each}}

#### 🔧 构建工具
{{#each buildTools}}  
- {{this}}
{{/each}}
{{/with}}

---

## 🛠️ 技术栈分析

### 前端技术栈
{{#with languageAnalysis.detection.techStack.frontend}}
{{#if frameworks.length}}
**框架**: {{#each frameworks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if libraries.length}}
**库**: {{#each libraries}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if buildTools.length}}
**构建工具**: {{#each buildTools}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{/with}}

### 后端技术栈
{{#with languageAnalysis.detection.techStack.backend}}
{{#if frameworks.length}}
**框架**: {{#each frameworks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if databases.length}}
**数据库**: {{#each databases}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if servers.length}}
**服务器**: {{#each servers}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{/with}}

### 开发工具链
{{#with languageAnalysis.detection.techStack.development}}
- **包管理**: {{#each packageManagers}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **测试框架**: {{#each testing}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **代码检查**: {{#each linting}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **IDE配置**: {{#each ide}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/with}}

### 部署技术
{{#with languageAnalysis.detection.techStack.deployment}}
{{#if containerization.length}}
- **容器化**: {{#each containerization}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if cicd.length}}
- **CI/CD**: {{#each cicd}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if cloud.length}}
- **云服务**: {{#each cloud}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{/with}}

---

## 📊 项目特征

{{#with languageAnalysis.detection.projectCharacteristics}}
| 特征 | 评估结果 |
|------|----------|
| **项目类型** | {{type}} |
| **项目规模** | {{scale}} |
| **成熟度** | {{maturity}} |
| **复杂度** | {{complexity}} |
| **架构模式** | {{architecture}} |
{{/with}}

---

## 💻 开发环境分析

### 当前环境状态
{{#with languageAnalysis.detection.developmentEnvironment.current}}
**已检测到的组件**:
{{#each detected}}
- {{this}}
{{/each}}

**版本信息**: {{version}}
{{/with}}

### 推荐环境配置
{{#with languageAnalysis.detection.developmentEnvironment.recommended}}
#### 必需组件
{{#each essentials}}
- {{this}}
{{/each}}

#### 可选组件  
{{#each optional}}
- {{this}}
{{/each}}

**推荐版本**: {{version}}
{{/with}}

### 环境完善建议
{{#with languageAnalysis.detection.developmentEnvironment.gaps}}
{{#if missing.length}}
#### 🚨 缺失组件
{{#each missing}}
- {{this}}
{{/each}}
{{/if}}

{{#if outdated.length}}
#### ⏰ 需要更新
{{#each outdated}}
- {{this}}
{{/each}}
{{/if}}

{{#if suggestions.length}}
#### 💡 改进建议
{{#each suggestions}}
- {{this}}
{{/each}}
{{/if}}
{{/with}}

---

## ✅ 质量指标

{{#with languageAnalysis.detection.qualityIndicators}}
| 指标 | 状态 | 评分 |
|------|------|------|
| **测试覆盖** | {{#if hasTests}}✅ 有测试{{else}}❌ 无测试{{/if}} | {{#if hasTests}}良好{{else}}需改进{{/if}} |
| **文档完整** | {{#if hasDocumentation}}✅ 有文档{{else}}❌ 无文档{{/if}} | {{#if hasDocumentation}}良好{{else}}需改进{{/if}} |
| **代码检查** | {{#if hasLinting}}✅ 已配置{{else}}❌ 未配置{{/if}} | {{#if hasLinting}}良好{{else}}需改进{{/if}} |
| **持续集成** | {{#if hasCI}}✅ 已配置{{else}}❌ 未配置{{/if}} | {{#if hasCI}}良好{{else}}需改进{{/if}} |
| **代码组织** | {{codeOrganization}}/100 | {{#if (gte codeOrganization 80)}}优秀{{else if (gte codeOrganization 60)}}良好{{else}}需改进{{/if}} |
{{/with}}

---

## 🎯 下一步建议

{{#each languageAnalysis.detection.nextStepRecommendations}}
### {{@index}}.{{increment}}. {{step}} {{#if (eq priority "high")}}🔴{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**优先级**: {{priority}}

**建议原因**: {{reason}}

---
{{/each}}

---

## 📈 分析统计

### 检测效率
- **扫描文件数**: {{languageAnalysis.metadata.filesScanned}}
- **分析耗时**: {{languageAnalysis.metadata.analysisDuration}}ms
- **检测方法**: {{languageAnalysis.metadata.detectionMethod}}
- **整体置信度**: {{languageAnalysis.metadata.confidence}}

### 分析覆盖范围
{{#with languageAnalysis.detection.languageEvidence}}
- **配置文件**: {{configFiles.length}}个
- **框架标识**: {{frameworkMarkers.length}}个  
- **构建工具**: {{buildTools.length}}个
- **文件类型**: {{objectLength fileExtensions}}种
{{/with}}

---

## 🔧 开发建议

### 基于{{languageAnalysis.detection.primaryLanguage}}的最佳实践

{{#if (eq languageAnalysis.detection.primaryLanguage "javascript")}}
#### JavaScript项目建议
- 使用ESLint进行代码检查
- 配置Prettier进行代码格式化  
- 使用Jest或Mocha进行单元测试
- 考虑TypeScript提升代码质量
- 使用npm或yarn管理依赖
{{else if (eq languageAnalysis.detection.primaryLanguage "python")}}
#### Python项目建议
- 使用Black进行代码格式化
- 配置pylint或flake8进行代码检查
- 使用pytest进行单元测试
- 创建requirements.txt管理依赖
- 使用虚拟环境隔离项目
{{else if (eq languageAnalysis.detection.primaryLanguage "java")}}
#### Java项目建议
- 使用Maven或Gradle管理构建
- 配置SpotBugs进行静态分析
- 使用JUnit进行单元测试
- 遵循Google Java Style Guide
- 配置CI/CD自动化测试
{{/if}}

### 通用改进建议
1. **代码质量**: 建立代码审查流程
2. **测试策略**: 提高测试覆盖率到80%以上  
3. **文档维护**: 保持README和API文档更新
4. **依赖管理**: 定期更新和安全扫描依赖
5. **性能监控**: 建立性能基准测试

---

## 📖 相关文档

- [项目结构分析](./project-structure.md)
- [文件内容分析](./file-analysis.md)
- [模块依赖分析](./module-dependencies.md)
- [开发环境搭建](./development-setup.md)

---

*本报告由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*下次更新建议: 项目技术栈重大变更后或每月更新*
```

## 生成指南

### 数据处理原则
- 准确反映AI分析的置信度和依据
- 提供可操作的具体建议  
- 突出项目技术特征和改进方向
- 确保信息的完整性和准确性

### 格式优化要求
- 使用清晰的视觉层次和图标
- 提供对比表格和状态指示
- 确保代码块和列表格式正确
- 添加相关文档链接便于导航

### 质量保证检查
- 验证所有分析数据的完整性
- 检查建议的可操作性和实用性  
- 确保置信度评估的合理性
- 提供具体的实施指导

请基于提供的语言检测分析数据，生成专业且实用的语言检测报告。