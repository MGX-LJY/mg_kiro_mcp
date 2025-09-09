# Init Step5: 项目总览生成指导模板

## 🎯 总览生成目标
基于Step4的模块整合结果，生成项目的整体概览和导航文档，为开发者和维护者提供项目全景视图。

## 📊 基础数据回顾

### 模块整合成果
- **模块总数**: {{total_modules}}个
- **核心模块**: {{core_modules}}个  
- **支持模块**: {{support_modules}}个
- **整合文档**: {{integration_docs}}个

### 项目基本信息
- **项目名称**: {{project_name}}
- **主要语言**: {{primary_language}}
- **架构类型**: {{architecture_type}}
- **复杂度等级**: {{complexity_level}}
- **文档总数**: {{total_documents}}个

## 📖 总览文档生成要求

### 1. 项目总览文档 (PROJECT-OVERVIEW.md)
生成项目的核心总览文档：

```markdown
# {{project_name}} - 项目总览

## 🏗️ 项目架构概览

### 技术栈
- **主要语言**: {{primary_language}}
- **架构模式**: {{architecture_pattern}}
- **开发框架**: {{main_frameworks}}

### 系统架构
{{architecture_diagram_description}}

## 📦 模块组织结构

### 核心业务模块
{{core_modules_overview}}

### 基础设施模块  
{{infrastructure_modules_overview}}

### 工具支持模块
{{utility_modules_overview}}

## 🚀 快速开始

### 环境要求
{{environment_requirements}}

### 安装步骤
{{installation_steps}}

### 运行指南
{{running_guide}}

## 📚 文档导航
- [详细模块文档](./modules-index.md)
- [API接口文档](./api-reference.md) 
- [开发指南](./development-guide.md)
```

### 2. 文档索引文档 (DOCUMENTATION-INDEX.md)
创建完整的文档导航索引：

```markdown
# 文档索引与导航

## 📋 文档分类

### 🏗️ 架构文档
- [项目总览](./PROJECT-OVERVIEW.md)
- [模块架构](./modules-overview.md)
- [系统架构图](./system-architecture.md)

### 📦 模块文档
{{#each modules}}
- [{{name}}模块](./module-{{slug}}.md)
{{/each}}

### 📄 文件分析文档  
{{generated_file_docs_list}}

### 🔧 开发文档
- [开发环境设置](./development-setup.md)
- [编码规范](./coding-standards.md)
- [测试指南](./testing-guide.md)

## 🗺️ 文档地图

### 按模块浏览
{{module_doc_map}}

### 按功能浏览
{{function_doc_map}}

### 按文件类型浏览
{{file_type_doc_map}}
```

### 3. 快速开始指南 (QUICK-START.md)
为新开发者提供快速上手指南：

```markdown
# 快速开始指南

## 🎯 5分钟了解项目

### 项目简介
{{project_brief_description}}

### 核心功能
{{key_features_list}}

### 技术特点
{{technical_highlights}}

## 🚀 快速部署

### 前置要求
{{prerequisites}}

### 安装依赖
```bash
{{installation_commands}}
```

### 启动项目
```bash  
{{startup_commands}}
```

### 验证运行
{{verification_steps}}

## 🧭 项目导航

### 重要目录
{{important_directories}}

### 关键文件
{{key_files}}

### 配置文件
{{config_files}}

## 📖 进阶学习路径

1. **了解架构** → [项目总览](./PROJECT-OVERVIEW.md)
2. **理解模块** → [模块文档](./modules-index.md) 
3. **查看代码** → [文件分析文档](./files/)
4. **开发调试** → [开发指南](./development-guide.md)
```

## 💡 总览生成指导原则

### 1. 用户友好性
- **新手友好**: 为不熟悉项目的开发者设计
- **信息层次**: 从概览到细节的渐进式信息组织
- **导航清晰**: 提供清晰的文档间导航链接
- **实用导向**: 重点突出实用信息和操作指南

### 2. 信息组织结构
- **总-分-总**: 先总览，再分模块，最后总结
- **层次分明**: 使用markdown标题建立清晰层次
- **交叉引用**: 在相关文档间建立链接关系
- **更新友好**: 设计易于后续更新的文档结构

### 3. 内容完整性检查
- [ ] 项目基本信息完整准确
- [ ] 技术栈描述清晰
- [ ] 模块组织结构明确
- [ ] 快速开始指南可操作
- [ ] 文档导航链接有效
- [ ] 关键概念解释清楚

## 🎨 视觉和格式优化

### Markdown格式规范
- 使用emoji增强可读性 🎯📊🏗️
- 统一的标题层级结构
- 合理的代码块和表格使用
- 清晰的列表和分组

### 文档间链接策略
- 使用相对路径链接
- 建立双向导航关系
- 提供面包屑导航
- 设置文档更新时间戳

## 🔍 质量验证清单

### 内容质量
- [ ] 信息准确性：所有数据与实际项目匹配
- [ ] 完整性：覆盖项目的所有重要方面  
- [ ] 实用性：提供可操作的指导信息
- [ ] 时效性：反映项目的当前状态

### 格式质量
- [ ] Markdown语法正确
- [ ] 链接全部有效
- [ ] 格式统一规范
- [ ] 易读性良好

## 📞 完成后操作

完成项目总览生成后，请调用以下接口标记任务完成：

```
POST /init/step3-complete-task
{
  "projectPath": "{{project_path}}",
  "step": "overview-generation",
  "taskId": "overview-generation-task", 
  "notes": "已生成PROJECT-OVERVIEW.md、DOCUMENTATION-INDEX.md、QUICK-START.md等总览文档"
}
```

---
*模板版本*: v4.0  
*适用模式*: Init  
*步骤*: Step5 - 总览生成  
*生成时间*: {{timestamp}}