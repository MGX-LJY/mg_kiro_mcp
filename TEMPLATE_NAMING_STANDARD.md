# mg_kiro MCP 模板命名规范

## 🎯 统一命名规范 v2.0

**实施日期**: 2024-09-10  
**适用范围**: mg_kiro MCP Server 模板系统

## 📋 命名原则

### 1. **功能导向命名**
- 文件名直接反映其功能用途
- 去除冗余的 `-template` 后缀
- 使用清晰的英文词汇组合

### 2. **统一格式规范**
- 所有模板文件使用 `.md` 扩展名
- 多词组合使用连字符 `-` 分隔
- 避免使用通用名称如 `template.md`

### 3. **分层目录结构**
```
prompts/modes/init/
├── file-documentation/     # Step 3: 文件文档生成
├── module-integration/     # Step 4: 模块整合  
├── relations-analysis/     # Step 5: 关联关系分析
└── architecture-generation/ # Step 6: 架构文档生成
```

## 📂 Init工作流模板映射 (6步完整流程)

### Step 1: 项目分析
**目录**: `project-analysis/`
- `project-analysis.md` - 深度项目结构与依赖分析

### Step 2: 任务创建  
**目录**: `task-creation/`
- `task-creation.md` - AI任务列表生成与处理策略

### Step 3: 文件文档生成
**目录**: `file-documentation/`
- `file-analysis.md` - AI生成的文件分析文档

### Step 4: 模块整合  
**目录**: `module-integration/`
- `module-integration.md` - 模块整合主文档
- `module-files.md` - 模块文件清单
- `module-overview.md` - 模块功能总览

### Step 5: 关联关系分析
**目录**: `relations-analysis/`  
- `function-calls.md` - 函数调用关系分析
- `dependencies.md` - 模块依赖关系分析  
- `data-flows.md` - 数据流向分析
- `relations-overview.md` - 关联分析总览
- `relations-analysis.md` - 模块关联分析

### Step 6: 架构文档生成
**目录**: `architecture-generation/`
- `architecture-docs.md` - 最终架构文档(README + 架构图)

## 🔄 重命名前后对照

| 原文件名 | 新文件名 | 功能描述 |
|---------|----------|----------|
| `template.md` (project-analysis) | `project-analysis.md` | 项目分析模板 |
| `template.md` (task-creation) | `task-creation.md` | 任务创建模板 |
| `file-analysis-template.md` | `file-analysis.md` | 文件分析模板 |
| `template.md` (module-integration) | `module-integration.md` | 模块整合主模板 |
| `files-list-template.md` | `module-files.md` | 模块文件清单 |
| `overview-template.md` (module) | `module-overview.md` | 模块总览 |
| `function-calls-template.md` | `function-calls.md` | 函数调用分析 |
| `dependencies-template.md` | `dependencies.md` | 依赖关系分析 |
| `data-flows-template.md` | `data-flows.md` | 数据流分析 |
| `overview-template.md` (relations) | `relations-overview.md` | 关联分析总览 |
| `relations-template.md` | `relations-analysis.md` | 关联分析主文档 |
| `template.md` (architecture) | `architecture-docs.md` | 架构文档生成 |

## ✅ 配置更新状态

### 已更新的配置文件
- [x] `config/templates.config.json` - 所有模板路径已更新
- [x] `server/services/unified/mode-template-service.js` - 多文档步骤配置已更新
- [x] `server/services/unified/master-template-service.js` - 路径映射已更新

### 模板文件状态
- [x] 12个模板文件已完成重命名
- [x] 2个废弃目录已删除（connection-analysis, overview-generation）
- [x] 冗余和空目录已清理  
- [x] 6步工作流目录结构完整统一

## 🎨 命名规范优势

1. **可读性提升**: 文件名直接表达功能，无需打开文件即可理解用途
2. **维护性增强**: 统一的命名规则降低维护复杂度  
3. **扩展性更好**: 新增模板遵循统一规范，便于系统扩展
4. **用户友好**: 开发者能快速定位和理解模板作用

## 🔮 后续发展

### 计划扩展
- Create模式模板统一化
- Fix模式模板统一化  
- Analyze模式模板统一化
- 语言特定模板规范化

### 版本兼容
- 保持向前兼容性
- 逐步迁移旧模板
- 文档同步更新

---

## 🗑️ 清理记录

### 已删除的废弃内容
- `connection-analysis/` - 旧Step6目录及其template.md文件
- `overview-generation/` - 旧Step5目录及其template.md文件  
- `shared/snippets/` - 空目录

### 保留的内容
- Create模式的所有template.md文件 - 功能正常
- JavaScript语言变体模板 - 提供语言特定支持
- 其他模式和共享资源 - 系统需要

---

**生成时间**: 2024-09-10  
**更新时间**: 2024-09-10  
**规范版本**: v2.1  
**维护者**: mg_kiro MCP Team