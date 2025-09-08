# mg_kiro MCP Server - Prompts 目录完整分析

**分析时间**: 2025-09-08  
**项目**: mg_kiro MCP Server  
**目标**: 理清所有prompts文件的作用和关系，提出细致化整理方案

---

## 📊 目录结构概览

```
prompts/
├── 📁 analysis-templates/        # AI分析模板 (26个文件) - 第一阶段处理
├── 📁 document-templates/        # 文档生成模板 (17个文件) - 第二阶段处理  
├── 📁 languages/                 # 语言配置文件 (5个语言)
├── 📁 modes/                     # 工作模式描述 (4个模式)
├── 📁 snippets/                  # 复用片段 (4个文件)
└── 📁 templates/                 # 基础模板 (12个文件) + language-variants/
```

**问题总结**: 
- ❌ 文件夹功能重叠 (templates vs document-templates)
- ❌ 命名不统一 (-analysis vs -generation vs 无后缀)
- ❌ 语言相关文件分散 (languages/ vs templates/language-variants/)
- ❌ 缺少清晰的用途说明

---

## 📁 analysis-templates/ - AI分析模板 (26个文件)

**作用**: AI驱动架构的第一阶段 - 数据分析和理解

### Init模式相关 (6个)
| 文件名 | 用途 | 对应Step | 输出格式 |
|--------|------|----------|----------|
| `system-architecture-analysis.md` | 系统架构分析 | Step 4 | JSON结构化 |
| `modules-catalog-analysis.md` | 模块目录分析 | Step 4 | JSON结构化 |
| `language-detection-analysis.md` | 语言检测分析 | Step 2 | JSON结构化 |
| `file-content-analysis.md` | 文件内容分析 | Step 3 | JSON结构化 |
| `module-analysis.md` | 模块深度分析 | Step 5 | JSON结构化 |
| `integration-contracts-analysis.md` | 集成契约分析 | Step 8 | JSON结构化 |

### Create模式相关 (7个)
| 文件名 | 用途 | 功能阶段 | 输出格式 |
|--------|------|----------|----------|
| `requirements-categorization.md` | 需求分类分析 | 需求收集 | JSON结构化 |
| `requirements-validation.md` | 需求验证分析 | 需求验证 | JSON结构化 |
| `feasibility-analysis.md` | 可行性分析 | 方案设计 | JSON结构化 |
| `user-story-decomposition.md` | 用户故事分解 | 需求细化 | JSON结构化 |
| `tech-design-analysis.md` | 技术设计分析 | 架构设计 | JSON结构化 |
| `architecture-generation-analysis.md` | 架构生成分析 | 架构输出 | JSON结构化 |
| `todo-generation-analysis.md` | 任务生成分析 | 任务规划 | JSON结构化 |

### Fix模式相关 (6个)
| 文件名 | 用途 | 功能阶段 | 输出格式 |
|--------|------|----------|----------|
| `scope-identification-analysis.md` | 问题范围识别 | 问题定位 | JSON结构化 |
| `document-retrieval-analysis.md` | 文档检索分析 | 信息收集 | JSON结构化 |
| `impact-assessment-analysis.md` | 影响评估分析 | 风险评估 | JSON结构化 |
| `solution-design-analysis.md` | 解决方案设计 | 方案制定 | JSON结构化 |
| `code-execution-analysis.md` | 代码执行分析 | 实施阶段 | JSON结构化 |
| `documentation-update-analysis.md` | 文档更新分析 | 文档同步 | JSON结构化 |

### Analyze模式相关 (4个)
| 文件名 | 用途 | 功能阶段 | 输出格式 |
|--------|------|----------|----------|
| `code-quality-analysis.md` | 代码质量分析 | 质量评估 | JSON结构化 |
| `performance-analysis.md` | 性能分析 | 性能评估 | JSON结构化 |
| `security-analysis.md` | 安全分析 | 安全评估 | JSON结构化 |
| `dependency-analysis.md` | 依赖分析 | 依赖评估 | JSON结构化 |

### 通用分析 (3个)
| 文件名 | 用途 | 使用场景 | 输出格式 |
|--------|------|----------|----------|
| `module-documentation-analysis.md` | 模块文档分析 | 多模式通用 | JSON结构化 |
| `integration-contracts-update-analysis.md` | 集成契约更新分析 | 多模式通用 | JSON结构化 |
| `language-prompts-generation.md` | 语言提示词生成分析 | Init Step 6 | JSON结构化 |

---

## 📁 document-templates/ - 文档生成模板 (17个文件)

**作用**: AI驱动架构的第二阶段 - 基于分析结果生成最终文档

### Init模式文档生成 (6个)
| 文件名 | 对应分析模板 | 生成目标 | mg_kiro位置 |
|--------|--------------|----------|-------------|
| `system-architecture-generation.md` | `system-architecture-analysis.md` | `system-architecture.md` | `architecture/` |
| `modules-catalog-generation.md` | `modules-catalog-analysis.md` | `modules-catalog.md` | `modules-catalog/` |
| `language-detection-generation.md` | `language-detection-analysis.md` | `language-report.md` | `analysis/` |
| `file-overview-generation.md` | `file-content-analysis.md` | `file-overview.md` | `analysis/` |
| `module-documentation-generation.md` | `module-analysis.md` | `module-[name].md` | `modules-detail/` |
| `integration-contracts-generation.md` | `integration-contracts-analysis.md` | `integration-contracts.md` | `integrations/` |

### Create模式文档生成 (4个)
| 文件名 | 对应分析模板 | 生成目标 | 用途 |
|--------|--------------|----------|------|
| `user-stories-standard.md` | `user-story-decomposition.md` | `user-stories.md` | 需求文档 |
| `tech-design-generation.md` | `tech-design-analysis.md` | `tech-design.md` | 技术设计 |
| `architecture-generation.md` | `architecture-generation-analysis.md` | `new-architecture.md` | 新架构 |
| `todo-generation.md` | `todo-generation-analysis.md` | `todo-list.md` | 任务清单 |

### Fix模式文档生成 (4个)
| 文件名 | 对应分析模板 | 生成目标 | 用途 |
|--------|--------------|----------|------|
| `scope-identification-report.md` | `scope-identification-analysis.md` | `problem-scope.md` | 问题范围 |
| `document-retrieval-report.md` | `document-retrieval-analysis.md` | `context-docs.md` | 上下文文档 |
| `impact-assessment-report.md` | `impact-assessment-analysis.md` | `impact-report.md` | 影响报告 |
| `solution-design-report.md` | `solution-design-analysis.md` | `solution-design.md` | 解决方案 |

### 其他文档生成 (3个)
| 文件名 | 对应分析模板 | 生成目标 | 用途 |
|--------|--------------|----------|------|
| `code-execution-report.md` | `code-execution-analysis.md` | `execution-log.md` | 执行日志 |
| `documentation-update-report.md` | `documentation-update-analysis.md` | `doc-updates.md` | 文档更新 |
| `integration-contracts-update-generation.md` | `integration-contracts-update-analysis.md` | `contracts-update.md` | 契约更新 |

---

## 📁 languages/ - 语言配置 (5个语言)

**作用**: 多语言项目支持的配置信息和默认设置

### 配置文件结构
```
languages/
├── 📁 common/
│   └── defaults.json          # 通用默认配置
├── 📁 javascript/
│   ├── config.json           # JS/Node.js完整配置 (框架、工具、部署)
│   └── defaults.json         # JS默认值
├── 📁 python/ 
│   ├── config.json           # Python完整配置 (Django、Flask、工具)
│   └── defaults.json         # Python默认值
├── 📁 java/
│   └── config.json           # Java配置 (Spring、Maven、Gradle)
└── 📁 go/
    └── config.json           # Go配置 (Gin、Go模块)
```

### JavaScript配置内容详情 (示例)
- **检测规则**: 文件扩展名 (.js,.ts,.jsx,.tsx)、配置文件 (package.json)
- **包管理器**: npm、yarn、pnpm 完整支持
- **框架检测**: React、Vue、Angular、Express、Next.js、NestJS
- **构建工具**: Webpack、Vite、Parcel
- **测试框架**: Jest、Vitest、Cypress
- **代码质量**: ESLint、Prettier
- **部署目标**: Vercel、Netlify、Docker

---

## 📁 modes/ - 工作模式描述 (4个模式)

**作用**: 为每个工作模式提供标准的提示词和工作流程说明

| 文件 | 模式 | 核心功能 | 可用模板 |
|------|------|----------|----------|
| `init.md` | 初始化模式 | 项目扫描→文档生成 | system-architecture, modules-catalog, dependencies |
| `create.md` | 创建模式 | 需求分析→代码生成 | module-template, user-stories, technical-analysis |
| `fix.md` | 修复模式 | 问题诊断→解决方案 | 暂无具体模板列表 |
| `analyze.md` | 分析模式 | 代码分析→质量报告 | 暂无具体模板列表 |

**问题**: Fix和Analyze模式的模板列表不完整

---

## 📁 snippets/ - 复用片段 (4个文件)

**作用**: 小型可复用的文本片段，用于组合到其他模板中

| 文件 | 用途 | 使用场景 |
|------|------|----------|
| `welcome.md` | 欢迎信息 | 空文件(需要补充) |
| `confirmation.md` | 确认提示 | 用户操作确认 |
| `error-handling.md` | 错误处理 | 统一错误信息 |
| `progress.md` | 进度提示 | 长任务进度显示 |

**问题**: welcome.md 是空文件，需要补充内容

---

## 📁 templates/ - 基础模板 (12个文件 + language-variants/)

**作用**: 旧版本的基础模板系统，与document-templates/功能重叠

### 基础模板文件 (12个)
| 文件 | 用途 | 状态 |
|------|------|------|
| `system-architecture.md` | 系统架构模板 | 🔄 与document-templates重复 |
| `modules-catalog.md` | 模块目录模板 | 🔄 与document-templates重复 |
| `module-template.md` | 单模块模板 | 🔄 与document-templates重复 |
| `user-stories.md` | 用户故事模板 | 🔄 与document-templates重复 |
| `technical-analysis.md` | 技术分析模板 | ✅ 独有 |
| `integration-contracts.md` | 集成契约模板 | 🔄 与document-templates重复 |
| `dependencies.md` | 依赖管理模板 | ✅ 独有 |
| `development-workflow.md` | 开发工作流模板 | ✅ 独有 |
| `action-items.md` | 行动清单模板 | ✅ 独有 |
| `changelog.md` | 变更日志模板 | ✅ 独有 |

### language-variants/ - 语言特定变体
```
templates/language-variants/
├── 📁 javascript/
│   ├── system-architecture.md    # JS特定架构模板
│   ├── module-template.md        # JS模块模板  
│   └── dependencies.md           # JS依赖模板
├── 📁 python/
├── 📁 java/
└── 📁 go/
```

**问题**: 
- ❌ 与 `languages/` 配置重复 
- ❌ 与 `document-templates/` 功能重叠

---

## 🔍 关键问题分析

### 1. ❌ 严重重复 (优先解决)
- `templates/system-architecture.md` vs `document-templates/system-architecture-generation.md`
- `templates/language-variants/` vs `languages/` 配置  
- 多个模板文件功能高度重复

### 2. ❌ 命名不统一 (影响维护)
- Analysis模板: `-analysis.md` 后缀
- Generation模板: `-generation.md` 后缀  
- 基础模板: 无后缀或不规则后缀
- 报告模板: `-report.md` 后缀

### 3. ❌ 文件夹功能混乱 (架构问题)
- `templates/` vs `document-templates/` 职责不清
- `languages/` vs `templates/language-variants/` 分散管理
- `snippets/` 未充分利用

### 4. ⚠️ 缺失模板 (功能不完整)
**根据新mg_kiro结构缺少**:
- `tech-stack-generation.md` → `mg_kiro/architecture/tech-stack.md`
- `design-principles-generation.md` → `mg_kiro/architecture/design-principles.md`
- `modules-hierarchy-generation.md` → `mg_kiro/modules-catalog/modules-hierarchy.md`
- `modules-dependencies-generation.md` → `mg_kiro/modules-catalog/modules-dependencies.md`
- `data-flow-generation.md` → `mg_kiro/integrations/data-flow.md`
- `api-specifications-generation.md` → `mg_kiro/integrations/api-specifications.md`

---

## 🔧 细致化整理方案

### 阶段1: 立即清理 (消除重复和混乱)

#### 1.1 删除重复文件夹
```bash
# 删除旧的基础模板系统
rm -rf prompts/templates/

# 语言特定模板合并到language配置中
# (保留 languages/ 作为唯一语言配置位置)
```

#### 1.2 标准化命名约定
**新的命名规则**:
- 分析模板: `[功能名称]-analysis.md`
- 生成模板: `[功能名称]-generation.md`
- 配置文件: `config.json`, `defaults.json`
- 模式描述: `[模式名称].md`
- 复用片段: `[片段名称].md`

#### 1.3 重新组织文件夹结构
```
prompts/
├── 📁 analysis/              # 原 analysis-templates，重命名简化
├── 📁 generation/            # 原 document-templates，重命名简化  
├── 📁 languages/             # 保持不变，语言配置中心
├── 📁 modes/                 # 保持不变
├── 📁 snippets/              # 保持不变，补充缺失内容
└── 📁 configs/               # 新增，全局配置文件
```

### 阶段2: 补充缺失模板 (完善功能)

#### 2.1 补充mg_kiro所需的6个模板
**新增analysis模板**:
- `tech-stack-analysis.md` 
- `design-principles-analysis.md`
- `modules-hierarchy-analysis.md`
- `modules-dependencies-analysis.md`
- `data-flow-analysis.md`
- `api-specifications-analysis.md`

**新增generation模板**:
- `tech-stack-generation.md`
- `design-principles-generation.md`
- `modules-hierarchy-generation.md`
- `modules-dependencies-generation.md`
- `data-flow-generation.md`
- `api-specifications-generation.md`

#### 2.2 完善模式描述
**更新 modes/ 文件**:
- 为 `fix.md` 和 `analyze.md` 补充完整的可用模板列表
- 标准化所有模式的工作流程描述
- 添加模式间的协作关系说明

#### 2.3 补充复用片段
**补充 snippets/ 内容**:
- 补充 `welcome.md` 的欢迎信息
- 添加更多通用片段 (loading, success, warning等)

### 阶段3: 优化和标准化 (提升质量)

#### 3.1 模板质量优化
- 简化过度复杂的模板变量
- 添加轻量级版本的模板
- 统一变量命名约定
- 添加输出长度控制

#### 3.2 文档完善
- 为每个文件夹添加 `README.md` 说明
- 创建模板使用指南
- 添加最佳实践文档

#### 3.3 自动化验证
- 添加模板语法检查脚本
- 创建变量一致性验证
- 建立模板质量评分机制

---

## 📋 实施TODO清单

### 🔴 高优先级 (立即执行)
- [ ] **删除重复文件**: 删除 `prompts/templates/` 整个文件夹
- [ ] **重命名文件夹**: `analysis-templates` → `analysis`, `document-templates` → `generation`
- [ ] **补充6个缺失模板**: 支持完整的mg_kiro文件结构
- [ ] **修复空文件**: 补充 `snippets/welcome.md` 内容

### 🟡 中等优先级 (1周内完成)
- [ ] **标准化命名**: 统一所有模板文件命名约定
- [ ] **完善模式描述**: 补充fix.md和analyze.md的模板列表  
- [ ] **语言配置整合**: 确保language和template配置一致性
- [ ] **添加README**: 为每个文件夹创建说明文档

### 🟢 低优先级 (长期优化)
- [ ] **模板质量优化**: 简化复杂模板，添加lite版本
- [ ] **自动化验证**: 添加模板检查和验证脚本
- [ ] **使用指南**: 创建完整的模板使用文档
- [ ] **性能优化**: 优化模板加载和处理性能

---

## 💡 期望效果

整理完成后的prompts结构将更加：
- **清晰**: 文件夹功能明确，无重复
- **一致**: 命名约定统一，易于维护
- **完整**: 支持所有mg_kiro文档生成需求
- **高效**: 减少冗余，提高模板复用性
- **可扩展**: 便于添加新语言和新模式

**预计整理时间**: 2-3个工作日完成高优先级任务，1-2周完成全部优化。

---

*分析完成时间: 2025-09-08*  
*分析工具: mg_kiro MCP Server 深度架构分析*  
*下一步: 按优先级开始执行清理和整理任务*