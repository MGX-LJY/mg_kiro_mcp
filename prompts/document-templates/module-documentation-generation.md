# 模块文档生成模板

你是一个技术文档专家。请基于模块分析结果生成完整的单个模块文档。

## 输入数据
**模块分析结果**: {{moduleAnalysis}}
**主要语言**: {{primaryLanguage}}
**项目路径**: {{projectPath}}
**生成时间**: {{timestamp}}

## 文档生成目标

为每个模块生成完整的技术文档，包括：
1. 模块概述与职责说明
2. API接口文档详情
3. 使用方法与示例代码
4. 依赖关系说明
5. 配置选项与环境变量
6. 最佳实践与注意事项
7. 故障排除与常见问题

## 模块文档输出模板

```markdown
# {{module.name}} 模块文档

**模块类型**: {{module.category}}  
**编程语言**: {{primaryLanguage}}  
**复杂度**: {{module.analysis.complexity.rating}} ({{module.analysis.complexity.score}}/100)  
**维护性**: {{module.analysis.quality.maintainabilityIndex}}/100  
**文档完整性**: {{module.analysis.quality.documentationScore}}/100  
**生成时间**: {{timestamp}}

---

## 📖 模块概述

### 基本信息
- **模块名称**: {{module.name}}
- **文件路径**: `{{module.relativePath}}`
- **模块类型**: {{module.type}}
- **主要职责**: {{module.category}}

### 功能描述
{{module.name}} 是一个{{module.category}}类型的{{primaryLanguage}}模块，主要负责{{generateModulePurpose module.category}}。

### 核心特性
{{#each (generateKeyFeatures module)}}
- {{this}}
{{/each}}

### 质量指标
| 指标 | 数值 | 状态 |
|------|------|------|
| **代码行数** | {{module.metrics.lines}} | - |
| **函数数量** | {{module.metrics.functions}} | - |
| **类数量** | {{module.metrics.classes}} | - |
| **复杂度评分** | {{module.analysis.complexity.score}}/100 | {{#if (lte module.analysis.complexity.score 20)}}🟢 简单{{else if (lte module.analysis.complexity.score 40)}}🟡 适中{{else if (lte module.analysis.complexity.score 60)}}🟠 复杂{{else}}🔴 很复杂{{/if}} |
| **可维护性** | {{module.analysis.quality.maintainabilityIndex}}/100 | {{#if (gte module.analysis.quality.maintainabilityIndex 80)}}🟢 优秀{{else if (gte module.analysis.quality.maintainabilityIndex 60)}}🟡 良好{{else}}🔴 需改进{{/if}} |
| **技术债务** | {{module.analysis.technicalDebt.debtRatio}}% | {{#if (lte module.analysis.technicalDebt.debtRatio 10)}}🟢 低{{else if (lte module.analysis.technicalDebt.debtRatio 30)}}🟡 中等{{else}}🔴 高{{/if}} |

---

## 🔌 API 接口文档

{{#if module.interfaces.length}}
{{#each module.interfaces}}
### {{capitalize type}}

{{#if items.length}}
{{#each items}}
#### {{name}}

{{#if signature}}
**函数签名**: `{{signature}}`
{{/if}}

{{#if description}}
**功能描述**: {{description}}
{{/if}}

{{#if parameters.length}}
**参数说明**:
{{#each parameters}}
- `{{this}}`: 参数描述
{{/each}}
{{/if}}

{{#if returnType}}
**返回值**: `{{returnType}}`
{{/if}}

{{#if complexity}}
**复杂度**: {{complexity}}
{{/if}}

```{{../primaryLanguage}}
// 使用示例
{{generateUsageExample ../module.name name ../primaryLanguage}}
```

---
{{/each}}
{{else}}
暂无{{type}}定义。
{{/if}}
{{/each}}
{{else}}
该模块暂无导出的公共接口。
{{/if}}

---

## 📥 导入与使用

### 模块导入

{{#if (eq primaryLanguage "javascript")}}
```javascript
// ES6 导入
import { {{module.name}} } from '{{module.relativePath}}';

// CommonJS 导入
const { {{module.name}} } = require('{{module.relativePath}}');
```

{{else if (eq primaryLanguage "python")}}
```python
# Python 导入
from {{convertPathToPythonImport module.relativePath}} import {{module.name}}

# 或者
import {{convertPathToPythonImport module.relativePath}} as {{module.name}}
```

{{else if (eq primaryLanguage "java")}}
```java
// Java 导入
import {{convertPathToJavaPackage module.relativePath}}.{{module.name}};
```

{{else}}
```
// 请根据具体语言调整导入方式
import {{module.name}} from '{{module.relativePath}}';
```
{{/if}}

### 基础使用

```{{primaryLanguage}}
{{generateBasicUsageExample module primaryLanguage}}
```

### 高级用法

```{{primaryLanguage}}
{{generateAdvancedUsageExample module primaryLanguage}}
```

---

## 🔗 依赖关系

### 导入依赖
{{#if module.dependencies.imports.length}}
{{#each module.dependencies.imports}}
- **{{module}}**: `{{path}}` ({{type}})
{{/each}}
{{else}}
该模块没有导入其他模块。
{{/if}}

### 内部依赖
{{#if module.dependencies.internal.length}}
{{#each module.dependencies.internal}}
- `{{this}}`
{{/each}}
{{else}}
该模块没有内部依赖。
{{/if}}

### 外部依赖
{{#if module.dependencies.external.length}}
{{#each module.dependencies.external}}
- `{{this}}`
{{/each}}
{{else}}
该模块没有外部依赖。
{{/if}}

### 依赖图谱
```
{{generateDependencyGraph module}}
```

---

## ⚙️ 配置选项

{{#if (hasConfiguration module)}}
### 默认配置
```{{primaryLanguage}}
{{generateDefaultConfiguration module primaryLanguage}}
```

### 环境变量
{{#each (getEnvironmentVariables module)}}
- `{{name}}`: {{description}} (默认: {{default}})
{{/each}}

### 自定义配置
```{{primaryLanguage}}
{{generateCustomConfiguration module primaryLanguage}}
```

{{else}}
该模块不需要特殊配置。
{{/if}}

---

## 💡 使用示例

### 基础示例

```{{primaryLanguage}}
{{generateBasicExample module primaryLanguage}}
```

### 进阶示例

```{{primaryLanguage}}
{{generateAdvancedExample module primaryLanguage}}
```

### 集成示例

```{{primaryLanguage}}
{{generateIntegrationExample module primaryLanguage}}
```

### 错误处理

```{{primaryLanguage}}
{{generateErrorHandlingExample module primaryLanguage}}
```

---

## 🧪 测试指南

### 单元测试

```{{primaryLanguage}}
{{generateUnitTestExample module primaryLanguage}}
```

### 集成测试

```{{primaryLanguage}}
{{generateIntegrationTestExample module primaryLanguage}}
```

### 测试覆盖率
{{#if module.metrics.coverage}}
当前测试覆盖率: **{{module.metrics.coverage}}%**
{{else}}
测试覆盖率信息不可用
{{/if}}

---

## 🚀 性能优化

### 性能特征
- **时间复杂度**: {{estimateTimeComplexity module}}
- **空间复杂度**: {{estimateSpaceComplexity module}}
- **并发安全性**: {{assessConcurrencySafety module}}

### 优化建议
{{#each (generatePerformanceRecommendations module)}}
- {{this}}
{{/each}}

### 基准测试
```{{primaryLanguage}}
{{generateBenchmarkExample module primaryLanguage}}
```

---

## 🛡️ 最佳实践

### 使用建议
{{#each (generateUsageRecommendations module primaryLanguage)}}
- {{this}}
{{/each}}

### 安全注意事项
{{#each (generateSecurityRecommendations module)}}
- {{this}}
{{/each}}

### 常见陷阱
{{#each (generateCommonPitfalls module)}}
- ❌ **{{issue}}**: {{description}}
- ✅ **正确做法**: {{solution}}
{{/each}}

---

## 🔧 故障排除

### 常见问题

{{#each (generateCommonIssues module primaryLanguage)}}
#### {{question}}

**问题描述**: {{description}}

**解决方案**: 
{{solution}}

**示例代码**:
```{{../primaryLanguage}}
{{example}}
```

---
{{/each}}

### 调试技巧
{{#each (generateDebuggingTips module primaryLanguage)}}
- {{this}}
{{/each}}

### 日志记录
```{{primaryLanguage}}
{{generateLoggingExample module primaryLanguage}}
```

---

## 📊 技术债务分析

{{#if module.analysis.technicalDebt.issues.length}}
### 识别的技术债务
{{#each module.analysis.technicalDebt.issues}}
- **{{this}}**: {{getSeverityLevel this}} 
{{/each}}

### 债务比例
当前技术债务比例: **{{module.analysis.technicalDebt.debtRatio}}%**

### 改进建议
{{#each module.recommendations}}
{{#if (eq type "refactor")}}
- **{{priority}}优先级**: {{message}}
{{/if}}
{{/each}}

{{else}}
该模块没有检测到明显的技术债务问题。 ✅
{{/if}}

---

## 🔄 重构建议

{{#if module.recommendations.length}}
{{#each module.recommendations}}
### {{@index}}.{{increment}}. {{type}} - {{priority}} {{#if (eq priority "critical")}}🔴{{else if (eq priority "high")}}🟠{{else if (eq priority "medium")}}🟡{{else}}🟢{{/if}}

**建议内容**: {{message}}

**预期影响**: {{impact}}

**实施难度**: {{effort}}

{{#if benefits.length}}
**预期收益**:
{{#each benefits}}
- {{this}}
{{/each}}
{{/if}}

---
{{/each}}
{{else}}
该模块当前没有重构建议。 ✅
{{/if}}

---

## 📚 相关文档

- [项目架构文档](../system-architecture.md)
- [模块目录](../modules-catalog.md) 
- [API 文档](../api-documentation.md)
- [开发指南](../development-guidelines.md)

### 依赖模块文档
{{#each module.dependencies.internal}}
- [{{this}} 模块文档](./{{convertToDocPath this}}.md)
{{/each}}

---

## 📝 更新日志

### 最近更新
- **{{timestamp}}**: 文档生成
- 基于代码分析自动生成
- 包含完整的API和使用指南

### 维护说明
- 建议在模块重大更新后重新生成文档
- 定期检查和更新示例代码
- 保持最佳实践建议的时效性

---

*本文档由 mg_kiro MCP Server 基于AI智能分析生成*  
*生成时间: {{timestamp}}*  
*模块路径: {{module.relativePath}}*
```

## 生成指南

### 数据处理原则
- 准确反映模块的功能和特性
- 提供实用的代码示例和使用指导
- 突出模块的关键接口和最佳实践
- 包含具体的性能和安全建议

### 文档结构优化
- 使用清晰的章节层次结构
- 添加视觉元素和状态指示
- 确保代码块语法正确
- 提供便于导航的链接

### 质量保证要求
- 验证所有示例代码的准确性
- 确保建议的可操作性
- 检查文档的完整性和一致性
- 提供明确的故障排除指导

### 语言特定处理

#### JavaScript项目
- ES6+ 语法使用示例
- Node.js 特定功能说明
- 异步编程最佳实践
- NPM 包管理指导

#### Python项目
- PEP 8 代码规范示例
- 类型提示使用说明
- 虚拟环境管理
- 包导入最佳实践

#### Java项目
- Java 编码规范
- Spring 框架特性
- Maven/Gradle 配置
- 企业应用模式

请基于提供的模块分析数据，生成专业且实用的模块技术文档。