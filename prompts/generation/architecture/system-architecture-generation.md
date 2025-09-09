# System Architecture Generation Template

## 🏗️ 系统架构文档生成指南

### 目标
基于项目分析数据生成完整的系统架构文档，为开发团队提供清晰的技术架构指导。

### 核心变量
- **project_name**: {{project_name}}
- **system_overview**: {{system_overview}}
- **core_components**: {{core_components}}
- **data_flow**: {{data_flow}}

---

## 📋 架构文档结构模板

### 1. 项目概述
```markdown
# {{project_name}} - 系统架构文档

## 项目概述
{{system_overview}}

**生成时间**: {{timestamp}}
**架构版本**: v1.0-auto
**文档状态**: 自动生成
```

### 2. 技术架构图
```markdown
## 系统架构

### 架构模式
- **架构类型**: {{architecture_pattern}}
- **主要技术栈**: {{tech_stack}}
- **开发模式**: {{development_pattern}}

### 核心组件
{{core_components}}

### 数据流向
{{data_flow}}
```

### 3. 模块结构
```markdown
## 模块结构

### 业务模块
- **总模块数**: {{total_modules}}
- **核心模块**: {{core_modules}}
- **业务模块**: {{business_modules}}
- **工具模块**: {{utility_modules}}

### 依赖关系
{{dependency_graph}}
```

### 4. 技术决策
```markdown
## 技术决策记录

### 编程语言选择
- **主语言**: {{primary_language}}
- **选择理由**: {{language_rationale}}

### 框架选择
- **主要框架**: {{main_framework}}
- **选择理由**: {{framework_rationale}}

### 数据存储
- **数据库类型**: {{database_type}}
- **存储策略**: {{storage_strategy}}
```

### 5. 部署架构
```markdown
## 部署架构

### 环境配置
- **开发环境**: {{dev_environment}}
- **测试环境**: {{test_environment}}
- **生产环境**: {{prod_environment}}

### 部署策略
- **部署方式**: {{deployment_method}}
- **扩展策略**: {{scaling_strategy}}
```

---

## 🎯 生成指导原则

### 架构设计原则
1. **清晰简洁**: 架构图和说明应该简洁明了
2. **模块化**: 强调模块间的清晰边界和职责分离
3. **可扩展**: 考虑未来的扩展需求
4. **可维护**: 便于理解和维护的结构设计

### 文档质量要求
- 使用标准的架构图表符号
- 提供必要的技术决策说明
- 包含关键的配置和部署信息
- 保持文档的时效性和准确性

### 变量处理规则
- 所有变量使用 `{{variable_name}}` 格式
- 未定义变量使用合理默认值
- 复杂对象变量支持JSON展开
- 时间戳自动生成为ISO格式

---

*模板版本*: v1.0  
*适用模式*: Init  
*类别*: Architecture  
*生成时间*: {{timestamp}}