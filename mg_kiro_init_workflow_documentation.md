# mg_kiro Init 工作流程完整文档

**版本**: v4.0.0-complete-6-steps  
**生成时间**: 2025-01-17  
**状态**: 生产就绪 ✅

## 🌟 概述

mg_kiro MCP服务器提供了两套完整的项目初始化工作流程，旨在为任何项目生成详细的技术文档体系。该系统通过MCP协议与Claude Code集成，提供智能化的文档生成服务。

## 🚀 核心特性

- **双工作流设计**: 提供简化版和完整版两套流程
- **AI协作驱动**: 每个步骤都包含详细的AI处理指导
- **智能状态管理**: 支持断点续传和错误恢复
- **模板系统**: 内置多种语言和框架的模板支持
- **实时进度跟踪**: 完整的状态监控和进度报告
- **文档体系化**: 生成结构化的完整文档体系

## 📋 工作流程总览

### 🔄 流程架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    mg_kiro Init 工作流                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  入口: workflow_guide (获取工作流指引)                       │
│    │                                                        │
│    ├── 简化版流程 (推荐) ──────────────────────────────────┐  │
│    │   │                                                 │  │
│    │   ├─ Step 1: generate_project_overview              │  │
│    │   │           ↓                                     │  │
│    │   └─ Step 2: progressive_documentation              │  │
│    │                                                     │  │
│    └── 完整版流程 (高级) ──────────────────────────────────┤  │
│        │                                                 │  │
│        ├─ Step 1: init_step1_project_analysis           │  │
│        ├─ Step 2: init_step2_create_todos               │  │
│        ├─ Step 3: init_step3_* (循环处理文件)            │  │
│        ├─ Step 4: init_step4_module_integration          │  │
│        ├─ Step 5: init_step5_overview_generation         │  │
│        └─ Step 6: init_step6_connect_docs                │  │
│                                                          │  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 简化版流程 (推荐)

### 流程特点
- **快速上手**: 仅需2步即可完成完整文档生成
- **AI协作**: 第2步采用AI协作模式，逐步完成文档
- **智能推荐**: 根据项目特征自动推荐最佳参数
- **适用场景**: 大部分项目的文档生成需求

### Step 1: 项目概览生成

**工具**: `generate_project_overview`

**功能**:
- 深度分析项目结构和架构特征
- 智能识别编程语言和技术栈
- 提取依赖关系和关键配置信息
- 读取并分析关键文件内容
- 生成项目"DNA"信息包

**参数**:
```json
{
  "projectPath": "/absolute/path/to/project",  // 必需
  "maxDepth": 3,                              // 可选，目录扫描深度
  "includeFiles": [],                         // 可选，额外文件模式
  "maxKeyFileSize": 51200                     // 可选，文件大小限制(50KB)
}
```

**输出**:
- 项目元数据(名称、语言、架构类型)
- 语言配置文件(Language Profile)
- 目录结构树
- 依赖关系分析
- 关键文件内容
- AI生成指导建议

### Step 2: 渐进式文档生成

**工具**: `progressive_documentation`

**功能**:
- 基于Step1的分析结果启动AI协作流程
- 提供详细的批次处理计划
- 生成结构化的AI处理指令
- 支持不同风格的文档生成策略

**参数**:
```json
{
  "batchSize": "80KB",                    // 可选，批次大小
  "style": "comprehensive",               // 可选，文档风格
  "focusAreas": [],                       // 可选，重点关注领域  
  "includeTests": true                    // 可选，是否包含测试
}
```

**执行模式**: AI协作模式
- 工具返回详细的AI处理指令
- AI按照指令逐步完成文档生成
- 使用`get_init_status`监控进度

## ⚙️ 完整版流程 (高级)

### 流程特点
- **精细控制**: 6个独立步骤，每步可单独执行和验证
- **状态持久化**: 完整的状态管理和恢复机制
- **批次处理**: 支持大型项目的分批文档生成
- **适用场景**: 大型复杂项目、需要精细控制的场景

### Step 1: 项目分析 (`init_step1_project_analysis`)

**核心功能**:
- 生成项目基础数据包
- 创建mg_kiro文档目录
- 保存项目分析结果到临时文件
- 初始化项目状态管理

**状态变化**:
```
currentStep: 0 → 1
stepsCompleted: [] → ['step1']
```

### Step 2: 创建AI任务列表 (`init_step2_create_todos`)

**核心功能**:
- 基于Step1结果创建文件处理任务队列
- 初始化文件查询服务
- 生成处理计划和时间预估
- 智能任务分类和优先级排序

**前置条件**: 必须完成Step1
**状态变化**:
```
currentStep: 1 → 2  
stepsCompleted: ['step1'] → ['step1', 'step2']
```

### Step 3: 文件文档生成 (循环步骤)

**子步骤**:
- `init_step3_get_next_task`: 获取下一个待处理文件任务
- `init_step3_get_file_content`: 获取文件内容并准备AI处理
- `init_step3_complete_task`: 完成任务并保存生成的文档

**执行模式**: 循环处理
```
while (hasRemainingTasks) {
  1. 获取下一个任务
  2. 读取文件内容  
  3. AI生成文档
  4. 保存并标记完成
}
```

**前置条件**: 必须完成Step1和Step2
**输出位置**: `mg_kiro/files/[filename].md`

### Step 4: 模块整合 (`init_step4_module_integration`)

**核心功能**:
- 分析文件间依赖关系
- 识别逻辑模块和功能归类
- 生成模块整合AI指导提示词
- 构建模块调用链和数据流向图

**前置条件**: 必须完成Step1-3
**输出位置**: `mg_kiro/modules/`

### Step 5: 总览生成 (`init_step5_overview_generation`)

**核心功能**:
- 整合所有分析结果
- 生成项目总览AI指导提示词
- 规划核心文档结构
- 提供完整的文档生成策略

**前置条件**: 必须完成Step1-4
**期望输出**:
- `mg_kiro/README.md` - 项目总览
- `mg_kiro/architecture.md` - 架构文档
- `mg_kiro/development.md` - 开发文档

### Step 6: 文档连接 (`init_step6_connect_docs`)

**核心功能**:
- 建立文档间的导航和引用关系
- 创建完整的文档索引
- 生成文档连接AI指导提示词
- 完成整个文档体系构建

**前置条件**: 必须完成Step1-5
**最终输出**:
- `mg_kiro/docs-index.md` - 文档索引
- `mg_kiro/navigation.md` - 快速导航
- 更新的`mg_kiro/README.md`

## 🔧 MCP工具详解

### 工作流控制工具

| 工具名称 | 功能描述 | 参数 | 输出 |
|---------|----------|------|------|
| `workflow_guide` | 获取完整工作流指引 | `workflow`, `currentStep`, `projectPath` | 详细的工作流指导 |
| `get_init_status` | 获取当前状态和进度 | `projectPath` (可选) | 状态报告、进度信息 |
| `reset_init` | 重置流程状态 | `projectPath` (可选) | 重置确认、清理报告 |

### 简化版工具

| 工具名称 | 功能描述 | 前置条件 | 后续步骤 |
|---------|----------|----------|----------|
| `generate_project_overview` | 生成项目概览包 | 无 | `progressive_documentation` |
| `progressive_documentation` | 启动渐进式文档生成 | 推荐先运行概览生成 | AI协作执行 |

### 完整版工具

| 工具名称 | 功能描述 | 前置条件 | 后续步骤 |
|---------|----------|----------|----------|
| `init_step1_project_analysis` | 项目分析 | 无 | `init_step2_create_todos` |
| `init_step2_create_todos` | 创建任务列表 | Step1完成 | `init_step3_get_next_task` |
| `init_step3_get_next_task` | 获取下一个任务 | Step2完成 | `init_step3_get_file_content` |
| `init_step3_get_file_content` | 获取文件内容 | 有可用任务 | `init_step3_complete_task` |
| `init_step3_complete_task` | 完成任务 | 文件内容已获取 | 循环或Step4 |
| `init_step4_module_integration` | 模块整合 | Step3全部完成 | `init_step5_overview_generation` |
| `init_step5_overview_generation` | 总览生成 | Step4完成 | `init_step6_connect_docs` |
| `init_step6_connect_docs` | 文档连接 | Step5完成 | 流程完成 |

## 🏗️ 系统架构

### 核心组件

```
mg_kiro MCP Server
├── index.js                        # 统一入口点 + MCP工具定义
├── server/
│   ├── services/                    # 核心服务层
│   │   ├── ai-todo-manager.js      # AI任务管理器
│   │   ├── project-overview-generator.js  # 项目概览生成器
│   │   ├── file-query-service.js   # 文件查询服务
│   │   └── unified/                # 统一模板系统
│   ├── routes/                     # HTTP路由 (可选)
│   └── language/                   # 语言检测和分析
├── config/                         # 配置文件
│   ├── workflows.config.json       # 工作流配置
│   ├── modes.config.json          # 模式配置
│   └── templates.config.json      # 模板配置
└── prompts/                        # 提示词模板
    ├── modes/init/                 # Init模式模板
    ├── languages/                  # 语言特定模板
    └── shared/                     # 共享模板
```

### 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                      │
├─────────────────────────────────────────────────────────────┤
│                    Service Bus                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐   │
│  │ Project Overview│ │  AI Todo        │ │ File Query   │   │
│  │ Generator       │ │  Manager        │ │ Service      │   │
│  └─────────────────┘ └─────────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐   │
│  │ Template        │ │  Language       │ │ Config       │   │
│  │ System          │ │  Intelligence   │ │ Manager      │   │
│  └─────────────────┘ └─────────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 输出结构

### 生成的文档目录结构

```
项目根目录/
├── mg_kiro/                        # 主文档目录
│   ├── README.md                   # 项目总览 (Step5生成)
│   ├── architecture.md             # 架构文档 (Step5生成)
│   ├── development.md              # 开发文档 (Step5生成)
│   ├── docs-index.md               # 文档索引 (Step6生成)
│   ├── navigation.md               # 快速导航 (Step6生成)
│   ├── files/                      # 文件文档目录
│   │   ├── [filename1].md          # 各文件的详细文档
│   │   ├── [filename2].md
│   │   └── ...
│   ├── modules/                    # 模块文档目录
│   │   ├── module-overview.md      # 模块总览
│   │   ├── module-dependencies.md  # 依赖关系图
│   │   └── [module-name].md        # 各模块详细文档
│   ├── .tmp/                       # 临时文件目录
│   │   ├── step1-result.json       # Step1结果缓存
│   │   ├── step2-result.json       # Step2结果缓存
│   │   └── ...
│   └── init-state.json             # 工作流状态文件
```

## 🔄 状态管理

### 状态生命周期

```
┌─────────────┐  start   ┌─────────────┐  step1   ┌─────────────┐
│ not_started │ ──────→  │ in_progress │ ──────→  │ step1_done  │
└─────────────┘          └─────────────┘          └─────────────┘
                                                         │
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ completed   │ ←──────  │ final_step  │ ←──────  │ step2_done  │
└─────────────┘          └─────────────┘          └─────────────┘
```

### 状态文件结构

```json
{
  "currentStep": 3,
  "projectPath": "/absolute/path/to/project",
  "stepsCompleted": ["step1", "step2"],
  "stepResults": {
    "step1": { "projectOverview": {...}, "completedAt": "..." },
    "step2": { "todoList": {...}, "completedAt": "..." }
  },
  "startedAt": "2025-01-17T10:00:00Z",
  "error": null,
  "documentCount": 15,
  "generatedDocs": [...]
}
```

## 🎛️ 配置系统

### 工作流配置 (`workflows.config.json`)

```json
{
  "workflows": {
    "init": {
      "name": "项目初始化工作流",
      "type": "sequential", 
      "total_steps": 2,
      "steps": [...]
    }
  },
  "intelligent_recommendations": {
    "project_size_detection": {...},
    "language_specific": {...}
  }
}
```

### 模式配置 (`modes.config.json`)

```json
{
  "modes": {
    "init": {
      "name": "初始化模式",
      "templates": ["system-architecture", "modules-catalog"],
      "capabilities": ["project_setup", "doc_generation"]
    }
  }
}
```

## 🚦 使用指南

### 基本用法 (推荐)

1. **获取工作流指引**:
```bash
# 通过Claude Code调用
workflow_guide(workflow="init")
```

2. **生成项目概览**:
```bash
generate_project_overview(projectPath="/path/to/project")
```

3. **启动文档生成**:
```bash
progressive_documentation(batchSize="80KB", style="comprehensive")
```

4. **监控进度**:
```bash
get_init_status()
```

### 高级用法 (完整流程)

1. **Step1 - 项目分析**:
```bash
init_step1_project_analysis(projectPath="/path/to/project")
```

2. **Step2 - 创建任务**:
```bash
init_step2_create_todos(projectPath="/path/to/project")
```

3. **Step3 - 文件处理循环**:
```bash
# 循环执行直到所有文件处理完成
while (hasMoreTasks) {
  init_step3_get_next_task(projectPath="/path/to/project")
  init_step3_get_file_content(projectPath="/path/to/project", taskId="...")
  # AI生成文档...
  init_step3_complete_task(projectPath="/path/to/project", taskId="...", documentContent="...")
}
```

4. **Step4-6 - 后续步骤**:
```bash
init_step4_module_integration(projectPath="/path/to/project")
init_step5_overview_generation(projectPath="/path/to/project")  
init_step6_connect_docs(projectPath="/path/to/project")
```

## 🛠️ 故障排除

### 常见问题

#### 1. 路径问题
**问题**: "项目路径不能为空" 或 "路径不存在"
**解决**: 确保使用绝对路径，检查路径权限

#### 2. 上下文溢出
**问题**: AI处理时上下文长度超限
**解决**: 减小`batchSize`参数，使用40KB或更小

#### 3. 前置条件不满足
**问题**: "需要先完成xxx步骤"
**解决**: 按顺序执行步骤，或使用`get_init_status`检查状态

#### 4. 状态损坏
**问题**: 状态文件损坏或状态不一致  
**解决**: 使用`reset_init`重置状态，重新开始

### 错误恢复

#### 自动恢复机制
- **临时文件验证**: 自动从.tmp文件恢复状态
- **状态双重检查**: 临时文件和主状态文件交叉验证
- **断点续传**: 支持从任意步骤继续执行

#### 手动恢复
```bash
# 1. 查看当前状态
get_init_status(projectPath="/path/to/project")

# 2. 如果状态异常，重置并重新开始
reset_init(projectPath="/path/to/project")

# 3. 重新启动流程
workflow_guide(workflow="init")
```

## 📊 性能和限制

### 性能指标

| 项目规模 | 文件数量 | 推荐批次大小 | 预估时间 | 内存使用 |
|---------|----------|-------------|----------|----------|
| 小型项目 | <100 | 40KB | 5-15分钟 | <50MB |
| 中型项目 | 100-500 | 80KB | 15-45分钟 | 50-200MB |
| 大型项目 | >500 | 120KB | 45-120分钟 | 200-500MB |

### 系统限制

- **最大文件大小**: 50KB (可配置)
- **最大目录深度**: 10层 (可配置)
- **并发处理**: 单线程顺序处理
- **支持的文件类型**: 25+ 常见编程语言

## 🚀 最佳实践

### 选择合适的工作流

1. **简化版流程** - 推荐用于:
   - 快速文档生成需求
   - 中小型项目 (<500文件)
   - 初次使用mg_kiro
   - 标准的技术栈项目

2. **完整版流程** - 推荐用于:
   - 大型复杂项目 (>500文件)
   - 需要精细控制每个步骤
   - 自定义文档生成策略
   - 高级用户和开发者

### 参数优化建议

#### 项目路径
- 总是使用绝对路径
- 确保路径权限正确
- 避免包含特殊字符

#### 批次大小
- 小项目: 40KB
- 中项目: 80KB  
- 大项目: 120KB
- 上下文溢出时适当减小

#### 文档风格
- JavaScript/TypeScript: `technical`
- Python: `comprehensive`
- Java/C#: `technical`
- Go/Rust: `concise`

### 监控和维护

1. **定期状态检查**:
```bash
get_init_status()  # 无参数查看系统状态
get_init_status(projectPath="/path") # 查看项目状态
```

2. **清理和重置**:
```bash
reset_init()  # 全局重置
reset_init(projectPath="/path")  # 单项目重置
```

3. **日志监控**:
- 关注控制台输出
- 检查临时文件目录
- 监控内存使用情况

## 🔮 版本历史

### v4.0.0-complete-6-steps (当前)
- ✅ 完整的6步工作流实现
- ✅ 双工作流架构 (简化版+完整版)
- ✅ 增强的状态管理和错误恢复
- ✅ 统一模板系统集成
- ✅ 智能推荐和参数优化

### v3.0.0
- ✅ 简化版2步工作流
- ✅ AI协作模式
- ✅ 智能项目分析

### v2.0.0  
- ✅ MCP协议集成
- ✅ 服务化架构重构
- ✅ 模板系统

### v1.0.0
- ✅ 基础文档生成功能
- ✅ 语言检测
- ✅ 项目分析

## 🎯 未来规划

### 短期目标 (v4.1)
- [ ] 并发文件处理优化
- [ ] 增强的错误处理和用户提示
- [ ] 更多编程语言支持
- [ ] Web界面支持

### 长期目标 (v5.0)
- [ ] 分布式文档生成
- [ ] 团队协作功能
- [ ] 版本控制集成
- [ ] 自定义模板编辑器

---

## 📝 结论

mg_kiro的init工作流程提供了完整而灵活的项目文档生成解决方案。通过双工作流架构，既满足了快速上手的需求，也为高级用户提供了精细控制能力。

**核心优势**:
- 🚀 快速上手：2步即可完成文档生成
- 🎛️ 精细控制：6步完整流程满足复杂需求  
- 🤖 AI协作：智能化的文档生成指导
- 📊 状态管理：完整的进度跟踪和错误恢复
- 🏗️ 可扩展：模块化架构支持自定义扩展

选择合适的工作流程，配置正确的参数，mg_kiro将为您的项目生成高质量的技术文档体系。

---

**文档生成**: mg_kiro v4.0.0-complete-6-steps  
**Claude Code集成**: 通过MCP协议完美集成  
**技术支持**: 查看GitHub Issues或使用workflow_guide工具获取更多帮助