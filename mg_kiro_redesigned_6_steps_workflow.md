# mg_kiro 重新设计的6步工作流程

**版本**: v5.0.0-complete-6-steps-redesigned  
**更新时间**: 2025-01-17  
**状态**: ✅ 已完成重构

## 🔄 重构概述

根据用户需求，已完全重新设计mg_kiro的工作流程：

- ❌ **删除**: 简化版2步流程（`generate_project_overview` + `progressive_documentation`）
- ✅ **保留**: 完整版6步流程，但重新调整步骤顺序和功能
- 🔄 **重新设计**: Step4-6的功能和输出结构

## 📋 新的6步工作流程

### Step 1: 项目分析 (`init_step1_project_analysis`)
**功能**: 深度分析项目结构、语言特征、依赖关系  
**输出**: 基础数据包和项目概览  
**变化**: 保持不变

### Step 2: 创建AI任务列表 (`init_step2_create_todos`)
**功能**: 基于项目分析结果，创建详细的AI处理任务列表  
**输出**: 文件处理任务队列和处理策略  
**变化**: 保持不变

### Step 3: 文件文档生成 (循环步骤)
**功能**: 🔄 **重新定义** - AI生成所有文件的markdown文档（提炼和总结）  
**工具**: `init_step3_get_next_task` → `init_step3_get_file_content` → `init_step3_complete_task`  
**输出**: `mg_kiro/files/[filename].md` - 每个文件的详细技术文档  
**变化**: 明确为AI生成文档，而非简单的文件处理

### Step 4: 模块整合 (`init_step4_module_integration`)
**功能**: 🆕 **重新设计** - 把一个模块的多个文件整合在一起，添加模块相关功能，生成模块总览  
**输出**: 
- `mg_kiro/modules/module-overview.md` - 所有模块的总览
- `mg_kiro/modules/[module-name]/README.md` - 每个模块的详细文档  
**变化**: 从简单模块整合改为深度模块分析和文档生成

### Step 5: 模块关联分析 (`init_step5_module_relations`) 
**功能**: 🆕 **全新功能** - 详细阐述每个文件之间的关联，分析哪个函数被多个模块调用  
**输出**: 
- `mg_kiro/relations/function-calls.md` - 函数调用关系图
- `mg_kiro/relations/module-dependencies.md` - 模块依赖分析
- `mg_kiro/relations/data-flows.md` - 数据流向分析  
**变化**: 原Step5(总览生成)改为关联分析

### Step 6: 架构文档生成 (`init_step6_architecture_docs`)
**功能**: 🆕 **全新功能** - 生成README、架构图、项目总览等最终文档  
**输出**:
- `mg_kiro/README.md` - 项目总览
- `mg_kiro/architecture.md` - 架构设计文档
- `mg_kiro/development.md` - 开发指南
- `mg_kiro/docs-index.md` - 完整文档索引  
**变化**: 原Step6(文档连接)改为架构文档生成，作为最终步骤

## 🏗️ 新的文档输出结构

```
项目根目录/
└── mg_kiro/                    # 文档根目录
    ├── README.md              # 项目总览 (Step6)
    ├── architecture.md        # 架构设计文档 (Step6)
    ├── development.md         # 开发指南 (Step6)
    ├── docs-index.md          # 完整文档索引 (Step6)
    ├── files/                 # 文件文档 (Step3)
    │   ├── index.js.md
    │   ├── server.js.md
    │   └── ...
    ├── modules/               # 模块文档 (Step4)
    │   ├── module-overview.md
    │   └── [module-name]/
    │       ├── README.md
    │       └── files.md
    ├── relations/             # 关联文档 (Step5)
    │   ├── function-calls.md
    │   ├── module-dependencies.md
    │   ├── data-flows.md
    │   └── overview.md
    ├── init-state.json        # 状态文件
    └── .tmp/                  # 临时文件 (自动清理)
```

## 🛠️ MCP工具变化

### ❌ 删除的工具
- `generate_project_overview` - 简化版项目概览生成
- `progressive_documentation` - 简化版渐进式文档生成

### 🔄 重新设计的工具
- `init_step4_module_integration` - 从模块整合改为深度模块分析
- `init_step5_module_relations` - 从总览生成改为关联分析 
- `init_step6_architecture_docs` - 从文档连接改为架构文档生成

### ✅ 保留的工具
- `workflow_guide` - 工作流引导
- `init_step1_project_analysis` - 项目分析
- `init_step2_create_todos` - 创建任务列表
- `init_step3_*` - 文件处理循环
- `get_init_status` - 状态查询
- `reset_init` - 重置流程

## 📄 生成的文档模板

已创建对应的文档模板：

1. **文件文档模板** (`templates/file-documentation-template.md`)
   - 文件概述、核心功能、代码结构
   - 依赖关系、复杂度分析、设计模式
   - 使用示例、改进建议

2. **模块整合模板** (`templates/module-integration-template.md`)
   - 模块职责、文件结构、接口设计
   - 内部架构、性能考量、测试策略
   - 风险评估、维护指南

3. **模块关联分析模板** (`templates/module-relations-template.md`)
   - 函数调用关系、模块依赖分析
   - 数据流向图、关键节点识别
   - 风险热点、优化建议

4. **架构文档模板** (`templates/architecture-docs-template.md`)
   - README、architecture、development模板
   - 完整文档索引模板

5. **模块总览模板** (`templates/module-overview-template.md`)
   - 模块分类、依赖关系、质量评估
   - 演进建议、开发指南

## ⚙️ 配置文件更新

已更新 `config/workflows.config.json`：

- **版本**: v1.0.0 → v5.0.0
- **总步骤**: 2 → 6
- **工作流类型**: 删除简化版，专注完整版
- **步骤定义**: 完全重写所有6个步骤
- **依赖关系**: 重新设计工具依赖链
- **智能推荐**: 针对6步流程优化
- **错误处理**: 更新错误恢复策略

## 🎯 使用指南

### 基本使用流程

```bash
# 1. 获取工作流指引
workflow_guide(workflow="init")

# 2. 开始6步流程
init_step1_project_analysis(projectPath="/absolute/path/to/project")
init_step2_create_todos(projectPath="/absolute/path/to/project")

# 3. 文件处理循环
while (hasMoreTasks) {
  init_step3_get_next_task(projectPath="/absolute/path/to/project")
  init_step3_get_file_content(projectPath="/absolute/path/to/project", relativePath="...")
  # AI生成文档...
  init_step3_complete_task(projectPath="/absolute/path/to/project", taskId="...")
}

# 4. 后续步骤
init_step4_module_integration(projectPath="/absolute/path/to/project")
init_step5_module_relations(projectPath="/absolute/path/to/project")  
init_step6_architecture_docs(projectPath="/absolute/path/to/project")
```

### 状态监控
```bash
# 查看进度
get_init_status(projectPath="/absolute/path/to/project")

# 重置流程(如需要)
reset_init(projectPath="/absolute/path/to/project")
```

## 📊 流程对比

| 方面 | 旧版本 | 新版本 |
|------|--------|--------|
| **工作流数量** | 2个(简化+完整) | 1个(完整) |
| **步骤数量** | 简化2步/完整6步 | 统一6步 |
| **Step3功能** | 文件处理循环 | AI生成文件文档 |
| **Step4功能** | 模块整合提示词 | 深度模块整合分析 |
| **Step5功能** | 总览生成提示词 | 模块关联分析 |
| **Step6功能** | 文档连接提示词 | 架构文档生成 |
| **输出结构** | 基础文档体系 | 完整分层文档体系 |
| **AI协作** | 中等 | 深度协作 |

## ✨ 重构亮点

### 🎯 更清晰的职责分工
- **Step3**: 专注文件级分析和文档生成
- **Step4**: 专注模块级整合和总览
- **Step5**: 专注关联分析和依赖图谱
- **Step6**: 专注最终架构文档和项目总览

### 🏗️ 更完整的文档体系
- 文件级 → 模块级 → 关联级 → 架构级
- 4层文档结构，逐级深入
- 完整的导航和索引系统

### 🤖 更深度的AI协作
- 每步都提供详细的AI指导提示词
- 结构化的模板支持
- 明确的输出要求和格式

### 📊 更智能的分析
- 函数调用关系分析
- 模块间依赖强度评估
- 数据流向跟踪
- 架构模式识别

## 🚀 版本信息

**当前版本**: v5.0.0-complete-6-steps-redesigned  
**兼容性**: 与Claude Code MCP协议完全兼容  
**日志信息**: 已更新启动日志反映新的工作流程  
**错误处理**: 新增针对6步流程的错误恢复机制  

## 📝 总结

本次重构完全按照用户需求实现：

✅ 删除了简化版流程  
✅ 重新设计了完整的6步流程  
✅ 调整了Step4-6的功能定位  
✅ 生成了对应的文档模板  
✅ 更新了所有配置文件  
✅ 保持了与Claude Code的完全兼容性  

mg_kiro现在提供了一个更加深入、系统化的项目文档生成工作流程，能够生成从文件级到架构级的完整文档体系。

---

**重构完成时间**: 2025-01-17  
**工具支持**: 11个MCP工具  
**模板支持**: 5套完整模板  
**状态**: 生产就绪 ✅