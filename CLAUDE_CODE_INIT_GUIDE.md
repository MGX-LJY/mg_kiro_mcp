# Claude Code Init流程指南

## 🎯 设计理念

基于对Claude Code工作方式的深度理解，重新设计了Init模式，实现人机协作的文档生成流程：

- **系统**负责数据收集和分析
- **Claude Code**负责基于数据生成高质量文档
- **分步执行**，每个AI生成步骤都单独进行

## 🏗️ 新的5步流程

### 步骤1: 数据收集 📊
**合并原1-3步** - 系统自动执行
- 项目结构分析（智能分层分析）
- 语言检测（增强语言识别）  
- 文件内容分析（深度文件分析）

**MCP调用**: `init_step1_data_collection`

### 步骤2: 架构文档生成 📝
**需要Claude Code参与** - AI生成文档
- 提供完整的项目分析数据包
- Claude Code基于数据生成`system-architecture.md`
- 保存到`mg_kiro/architecture/`目录

**MCP调用**: `init_step2_architecture`

### 步骤3: 深度分析 🔬  
**合并原5-6步** - 系统自动执行
- 模块深度分析
- 语言特定提示词生成

**MCP调用**: `init_step3_deep_analysis`

### 步骤4: 模块文档生成 📚
**需要Claude Code参与** - AI生成文档
- 提供模块分析数据包
- Claude Code为每个模块生成独立文档
- 保存到`mg_kiro/modules/`目录

**MCP调用**: `init_step4_module_docs`

### 步骤5: 集成契约生成 🔗
**需要Claude Code参与** - AI生成文档
- 提供集成分析数据包
- Claude Code生成`integration-contracts.md`
- 保存到`mg_kiro/contracts/`目录

**MCP调用**: `init_step5_contracts`

## 🚀 使用方式

### 方式1: MCP工具（推荐）
适合Claude Code直接调用：

```
1. init_step1_data_collection(projectPath: "/path/to/project")
2. init_step2_architecture() → 获取aiDataPackage → 生成文档
3. init_step3_deep_analysis()  
4. init_step4_module_docs() → 获取aiDataPackage → 生成文档
5. init_step5_contracts() → 获取aiDataPackage → 生成文档
```

### 方式2: HTTP API
适合外部调用：

```bash
# 初始化
POST /init/initialize
{"projectPath": "/path/to/project"}

# 步骤1: 数据收集
POST /init/step1-data-collection

# 步骤2: 架构文档生成准备
POST /init/step2-architecture
# → 使用返回的aiDataPackage生成文档

# 步骤3: 深度分析
POST /init/step3-deep-analysis

# 步骤4: 模块文档生成准备  
POST /init/step4-module-docs
# → 使用返回的aiDataPackage生成文档

# 步骤5: 集成契约生成准备
POST /init/step5-contracts
# → 使用返回的aiDataPackage生成文档
```

### 方式3: 命令行工具
一键执行所有步骤（适合测试）：

```bash
node index.js init /path/to/project
```

## 📊 数据流向

```
项目代码
    ↓
系统分析 (步骤1,3)
    ↓
AI数据包 (步骤2,4,5)
    ↓
Claude Code生成
    ↓
mg_kiro文档
```

## 📁 输出结构

```
mg_kiro/
├── architecture/
│   └── system-architecture.md      # 步骤2生成
├── modules/
│   ├── module-xxx.md              # 步骤4生成
│   └── module-yyy.md              # 步骤4生成
└── contracts/
    └── integration-contracts.md    # 步骤5生成
```

## 🔧 状态管理

```bash
# 获取当前状态
get_init_status()

# 重置流程
reset_init()
```

## 💡 关键特点

1. **人机分工明确**
   - 系统：数据收集和分析
   - Claude Code：文档生成和优化

2. **分步可控**
   - 每个AI生成步骤都单独执行
   - 可以检查和调整生成的内容

3. **数据驱动**
   - 提供完整的分析数据包
   - AI基于真实数据生成文档

4. **灵活调用**
   - 支持MCP、HTTP API、命令行三种方式
   - 适应不同的使用场景

## ⚡ 优势

- **高质量文档**: AI基于完整分析数据生成
- **可控流程**: 分步执行，每步可验证
- **省时高效**: 系统承担繁重分析工作，AI专注创作
- **适配Claude Code**: 完美配合Claude Code的工作方式

## 🎉 总结

新的Init流程实现了真正的人机协作：系统提供数据，Claude Code创造文档。既保证了分析的深度和准确性，又充分发挥了AI在文档生成方面的创造力。