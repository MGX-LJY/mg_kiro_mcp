# Init模式专用架构分析文档

## 🎯 Init模式概述

**Init模式**是mg_kiro MCP Server的核心工作模式，专门用于**项目初始化和完整文档体系生成**。通过8步渐进式工作流，自动分析项目结构、识别技术栈、生成专业文档。

**重构状态**: 🔄 AI驱动架构重构中 - 已移除大量复杂业务逻辑，转为AI智能分析

---

## 🏗️ Init模式8步工作流架构

### 📊 完整工作流概览

```
用户请求 → Init路由聚合器 → 8步工作流系统 → AI分析引擎 → 文档生成输出

第1步: 项目结构扫描     → structure.js    → WorkflowService.updateStep(0)
第2步: 智能语言识别     → language.js     → WorkflowService.updateStep(1) 
第3步: 文件内容通读     → files.js        → WorkflowService.updateStep(2)
第4步: 基础架构文档生成  → documents.js    → WorkflowService.updateStep(3)
第5步: 深度模块分析     → modules.js      → WorkflowService.updateStep(4)
第6步: 语言特定提示词生成 → prompts.js     → WorkflowService.updateStep(5)
第7步: 单独模块文档生成  → modules.js      → WorkflowService.updateStep(6)
第8步: 集成契约文档生成  → contracts.js    → WorkflowService.updateStep(7)
```

---

## 📁 Init路由系统详细架构

### 🎯 主路由聚合器
```
server/routes/init/index.js - Init模块路由索引 (主聚合器)
├── 功能: 聚合所有Init子路由，提供统一入口
├── 路由映射:
│   ├── /contracts → contracts.js (第8步)
│   ├── /data → data.js (数据提供服务)
│   ├── /documents → documents.js (第4步)
│   ├── /files → files.js (第3步)
│   ├── /language → language.js (第2步)
│   ├── /modules → modules.js (第5步+第7步)
│   ├── /prompts → prompts.js (第6步)
│   └── /structure → structure.js (第1步)
├── 状态端点:
│   ├── GET /status - Init模式状态查询
│   └── GET /help - Init模式帮助信息
└── 依赖服务: services, serverObject (WebSocket广播支持)
```

### 🔄 第1步: 项目结构分析
```
server/routes/init/structure.js - 项目结构扫描和分析端点
├── 功能: 扫描项目文件结构，分析目录组织，识别配置文件
├── 核心端点:
│   ├── POST /scan-structure - 执行项目结构扫描
│   │   ├── 输入: { projectPath }
│   │   ├── 执行: ProjectScanner.scanProject()
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 0, 'completed')
│   │   └── 输出: 项目结构数据 + workflowId
│   │
│   └── GET /structure-summary - 获取项目结构摘要
│       ├── 输入: { workflowId }
│       ├── 数据源: workflow.results.step_1
│       └── 输出: 结构化摘要报告
├── 数据处理:
│   ├── _generateStructureSummary() - 生成结构摘要
│   └── _extractFrameworks() - 提取框架信息
├── 依赖服务: workflowService, projectScanner
└── 状态管理: 步骤0完成标记
```

### 🧠 第2步: 智能语言识别 (AI驱动)
```
server/routes/init/language.js - 语言检测和技术栈分析端点
├── 功能: 智能检测项目编程语言，识别技术栈和框架
├── 🔄 架构特点: AI驱动重构 - 45-50%令牌消耗优化
├── 核心端点:
│   ├── POST /detect-language - 启动语言检测引擎
│   │   ├── 输入: { workflowId, projectPath }
│   │   ├── 前置检查: workflow.currentStep >= 1 (需要完成第1步)
│   │   ├── AI数据包: aiAnalysisPackage (包含项目结构数据)
│   │   ├── AI模板: language-detection-analysis.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 1, 'completed')
│   │   └── 输出: 语言检测结果 + 技术栈分析 + AI元数据
│   │
│   └── GET /language-report - 获取语言检测报告
│       ├── 输入: { workflowId }
│       ├── 数据源: workflow.results.step_2
│       └── 输出: 详细语言分析报告
├── AI处理逻辑:
│   ├── aiAnalysisPackage: 结构化数据提供给AI
│   ├── AI模板: language-detection-analysis.md
│   ├── 模拟结果: mockDetectionResult (实际由AI生成)
│   └── 令牌优化: 预计减少45-50%消耗
├── 数据处理:
│   └── _generateLanguageReport() - 生成语言详细报告
├── 依赖服务: workflowService, languageService
└── 状态管理: 步骤1完成标记
```

### 📄 第3步: 文件内容通读 (AI驱动)
```
server/routes/init/files.js - 文件内容分析和概览端点
├── 功能: 深度分析项目核心文件内容，生成代码质量报告
├── 🔄 架构特点: AI驱动重构 - 移除复杂分析函数，转为AI智能分析
├── 核心端点:
│   ├── POST /scan - 通用文件扫描端点
│   │   ├── 输入: { path, options }
│   │   ├── 执行: projectScanner.scanProject()
│   │   └── 输出: 文件扫描结果
│   │
│   ├── POST /scan-files - 智能文件内容分析
│   │   ├── 输入: { workflowId }
│   │   ├── 前置检查: workflow.currentStep >= 2 (需要完成前2步)
│   │   ├── 数据整合: step1Results + step2Results
│   │   ├── AI数据包: aiAnalysisPackage (项目数据+语言信息)
│   │   ├── AI模板: file-content-analysis.md + file-overview-generation.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 2, 'completed')
│   │   └── 输出: 文件分析结果 + 代码质量报告 + AI元数据
│   │
│   └── GET /files-overview - 获取文件内容概览
│       ├── 输入: { workflowId }
│       ├── 数据源: workflow.results.step_3
│       └── 输出: AI生成的文件概览报告
├── AI处理逻辑:
│   ├── 数据包: 项目数据 + 语言信息 + 文件列表
│   ├── AI模板: file-content-analysis.md (分析) + file-overview-generation.md (概览)
│   ├── 智能分析: 代码质量、技术债务、重要性评估、依赖关系
│   └── 令牌优化: 预计减少45-50%消耗
├── 🗑️ 移除的复杂函数 (转AI驱动):
│   ├── _generateFilesOverview() - 复杂的文件概览生成
│   ├── _getTopImportantFiles() - 重要文件排序分析
│   ├── _getTopDependencies() - 依赖关系统计
│   ├── _analyzeFileTypes() - 文件类型分析
│   ├── _generateTechInsights() - 技术栈洞察生成
│   └── _checkReadinessForStep4() - Step 4准备检查
├── 依赖服务: workflowService, projectScanner
└── 状态管理: 步骤2完成标记
```

### 📖 第4步: 基础架构文档生成 (AI驱动)
```
server/routes/init/documents.js - 系统架构和模块目录文档生成端点
├── 功能: 基于前3步分析结果，生成system-architecture.md和modules-catalog.md
├── 🔄 架构特点: AI驱动重构 - 纯数据提供模式，AI执行文档生成
├── 核心端点:
│   ├── POST /generate-architecture - 生成system-architecture.md
│   │   ├── 输入: { workflowId }
│   │   ├── 前置检查: 需要完成前3步 (structure + language + files)
│   │   ├── 数据整合: structureResult + languageResult + filesResult
│   │   ├── AI模板获取: 
│   │   │   ├── analysisTemplate: system-architecture-analysis.md
│   │   │   └── documentTemplate: system-architecture-generation.md
│   │   ├── AI数据包: rawAnalysisData + 分析模板 + 文档模板
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 3, 'completed')
│   │   └── 输出: AI驱动的架构文档生成数据包
│   │
│   └── POST /generate-catalog - 生成modules-catalog.md
│       ├── 输入: { workflowId }
│       ├── 前置检查: 需要完成前3步分析
│       ├── 数据整合: 模块数据 + 依赖关系 + 质量指标
│       ├── AI模板获取:
│       │   ├── moduleAnalysisTemplate: modules-catalog-analysis.md
│       │   └── catalogTemplate: modules-catalog-generation.md
│       ├── AI数据包: rawModuleData + 分析模板 + 文档模板
│       └── 输出: AI驱动的模块目录文档生成数据包
├── AI处理逻辑:
│   ├── 数据流: 原始数据 → AI分析模板 → AI文档模板 → 生成结果
│   ├── 模板服务: unifiedTemplateService.getTemplateByContext()
│   ├── 智能分析: 系统概述、核心组件、数据流、模块分类
│   └── 令牌优化: AI执行所有复杂分析逻辑
├── 🗑️ 移除的复杂函数 (转AI驱动):
│   ├── _generateSystemOverview() - 系统概述生成
│   ├── _generateCoreComponents() - 核心组件分析
│   ├── _generateDataFlow() - 数据流分析
│   ├── _generateModulesByCategory() - 模块分类逻辑
│   └── _generateModulesByImportance() - 模块重要性评估
├── 依赖服务: workflowService, promptService, unifiedTemplateService
└── 状态管理: 步骤3完成标记
```

### 🔧 第5步: 深度模块分析 (AI驱动)
```
server/routes/init/modules.js - 模块详细分析和依赖关系端点
├── 功能: 逐个模块深度分析 + 第7步模块文档生成
├── 🔄 架构特点: AI驱动重构 - 从1100+行降低到<500行，移除所有复杂分析逻辑
├── 第5步端点:
│   ├── POST /analyze-modules - 逐个模块详细分析
│   │   ├── 输入: { workflowId }
│   │   ├── 前置检查: 需要完成前4步 (step_1到step_4)
│   │   ├── 数据源: filesResult + languageResult
│   │   ├── AI数据包: aiAnalysisPackage (文件数据+语言信息)
│   │   ├── AI模板: module-analysis.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 4, 'completed')
│   │   └── 输出: 模块分析结果 + 依赖关系图 + 分类统计
│   │
│   └── GET /modules-detail/:moduleId - 获取单个模块详情
│       ├── 输入: { workflowId, moduleId }
│       ├── 数据源: workflow.results.step_5
│       └── 输出: 单个模块的详细分析结果
├── 第7步端点 (模块文档生成):
│   ├── POST /generate-module-docs - 生成单独模块文档
│   │   ├── 输入: { workflowId }
│   │   ├── 前置检查: 需要第5步模块分析结果
│   │   ├── AI数据包: aiDocumentationPackage (模块分析数据)
│   │   ├── AI模板: module-documentation-generation.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 6, 'completed') ⚠️索引混乱
│   │   └── 输出: 每个模块的完整文档
│   │
│   └── GET /module-docs/:moduleName - 获取单个模块文档
│       ├── 输入: { workflowId, moduleName }
│       ├── 数据源: workflow.results.step_7
│       └── 输出: 指定模块的文档详情
├── ⚠️ 架构问题发现:
│   ├── 步骤索引混乱: 第5步用索引4，第7步用索引6
│   ├── 步骤编号不一致: step_5 vs step_7 在同一个文件中
│   └── 工作流状态混乱: updateStep参数与实际步骤不匹配
├── AI处理逻辑:
│   ├── 第5步: module-analysis.md → 模块识别、分类、复杂度、依赖分析
│   ├── 第7步: module-documentation-generation.md → 完整模块文档生成
│   └── 令牌优化: 预计减少45-50%消耗
├── 🗑️ 移除的超大型复杂函数 (转AI驱动):
│   ├── 第5步移除: _performDeepModuleAnalysis(), _analyzeModule(), _analyzeDependencies()等30+函数
│   └── 第7步移除: _generateModuleDocuments(), _generateSingleModuleDoc()等30+函数
├── 依赖服务: workflowService, promptService
└── 状态管理: 步骤4完成 + 步骤6完成 (第7步)
```

### 💬 第6步: 语言特定提示词生成 (AI驱动)
```
server/routes/init/prompts.js - 语言特定提示词生成路由模块
├── 功能: 基于检测语言生成专业开发、代码审查、最佳实践提示词
├── 🔄 架构特点: AI驱动架构 - 移除复杂提示词生成业务逻辑，45-50%令牌优化
├── 核心端点:
│   ├── POST /generate-prompts - 基于检测语言生成专业提示词
│   │   ├── 输入: { workflowId, options }
│   │   ├── 前置检查: workflow.currentStep >= 2 (需要语言检测)
│   │   ├── 数据源: step2Results (语言检测结果)
│   │   ├── AI数据包: aiPromptsPackage (项目信息+语言数据)
│   │   ├── AI模板: language-prompts-generation.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 5, 'completed')
│   │   └── 输出: development/codeReview/bestPractices提示词集合
│   │
│   └── GET /prompts/:language - 获取语言特定提示词(静态)
│       ├── 输入: { language, promptType, format }
│       ├── 支持语言: javascript/python/java/go/rust/csharp
│       ├── 提示词类型: all/development/codeReview/bestPractices
│       ├── 输出格式: json/markdown
│       └── 输出: 静态语言提示词集合
├── AI处理逻辑:
│   ├── 动态生成: 基于项目特点生成定制提示词
│   ├── 静态生成: 基于语言特性生成通用提示词
│   ├── AI模板: language-prompts-generation.md
│   └── 令牌优化: 预计45-50%消耗减少
├── 🗑️ 移除的复杂业务逻辑 (转AI驱动):
│   ├── LanguagePromptGenerator - 语言特定提示词生成器
│   ├── generateDevelopmentPrompt - 开发助手提示词生成
│   ├── generateCodeReviewPrompt - 代码审查提示词生成
│   ├── generateBestPracticesPrompt - 最佳实践提示词生成
│   ├── generateFrameworkPrompts - 框架特定提示词生成
│   └── customizePromptForProject - 项目定制提示词
├── 依赖服务: workflowService
└── 状态管理: 步骤5完成标记
```

### 📋 第8步: 集成契约文档生成 (AI驱动)
```
server/routes/init/contracts.js - 集成契约文档生成路由模块
├── 功能: 模块间调用关系、数据流向、API契约分析
├── 🔄 架构特点: AI驱动重构 - 纯数据提供+AI分析模式
├── 核心端点:
│   ├── POST /generate-contracts - 生成集成契约文档
│   │   ├── 输入: { workflowId }
│   │   ├── 前置检查: 需要完成step_1, step_2, step_3, step_5
│   │   ├── 数据整合: 所有前置步骤结果
│   │   ├── AI数据包: aiAnalysisPackage (完整工作流数据)
│   │   ├── AI模板: integration-contracts-analysis.md + integration-contracts-generation.md
│   │   ├── 工作流: WorkflowService.updateStep(workflowId, 7, 'completed') ⚠️第8步用索引7
│   │   └── 输出: 集成分析结果 + 契约文档 + 风险评估
│   │
│   ├── GET /contracts - 获取集成契约文档
│   │   ├── 输入: { workflowId, format }
│   │   ├── 输出格式: json/markdown/summary
│   │   └── 输出: 不同格式的契约文档
│   │
│   └── GET /relations - 获取集成关系图数据
│       ├── 输入: { workflowId, type }
│       ├── 关系类型: modules/integration/dataflow/dependencies
│       └── 输出: 不同类型的关系图数据
├── AI处理逻辑:
│   ├── 数据整合: 8步工作流的完整数据
│   ├── 智能分析: 模块关系、API契约、数据流、风险评估
│   ├── AI模板: analysis + generation双模板
│   └── 令牌优化: 减少45-50%消耗
├── 🗑️ 移除的复杂函数 (转AI驱动):
│   ├── _generateContractMarkdown() - 复杂的契约文档生成
│   ├── _generateProjectOverview() - 项目概览生成
│   ├── _generateArchitectureSummary() - 架构摘要生成
│   └── _generateBuiltinContractDocument() - 内置文档生成器
├── 依赖服务: workflowService, promptService
└── 状态管理: 步骤7完成标记 (实际第8步)
```

### 🗄️ 数据提供服务 (重构架构)
```
server/routes/init/data.js - 数据提供路由模块
├── 功能: MCP提供原始扫描数据和模板，AI主导分析
├── 🔄 架构特点: 重构为纯数据提供模式，不执行业务逻辑
├── 核心端点:
│   ├── POST /get-project-scan-data - 获取项目扫描原始数据和分析模板
│   │   ├── 输入: { projectPath }
│   │   ├── 功能: 创建工作流 + 基础扫描 + 模板加载
│   │   ├── 输出: rawScanData + analysisTemplates + referenceData
│   │   └── 目标: 为AI提供完整的分析数据包
│   │
│   ├── POST /get-language-detection-data - 获取语言检测数据和模板
│   │   ├── 输入: { workflowId }
│   │   ├── 数据源: 项目扫描结果
│   │   ├── 输出: rawData + languageTemplates + languageReferences
│   │   └── 目标: 为AI语言检测提供数据包
│   │
│   ├── POST /get-module-analysis-data - 获取模块分析数据和模板
│   │   ├── 输入: { workflowId, language }
│   │   ├── 数据源: 文件分析 + 语言检测结果
│   │   ├── 输出: rawData + moduleTemplates + moduleReferences
│   │   └── 目标: 为AI模块分析提供数据包
│   │
│   └── POST /save-init-analysis-result - 保存AI分析结果
│       ├── 输入: { workflowId, analysisType, analysisResult, stepNumber }
│       ├── 功能: 将AI分析结果保存到工作流中
│       └── 输出: 保存确认信息
├── 辅助功能:
│   ├── _performBasicScan() - 执行基础项目扫描
│   ├── _loadInitAnalysisTemplates() - 加载Init分析模板
│   ├── _loadLanguageDetectionTemplates() - 加载语言检测模板
│   ├── _loadModuleAnalysisTemplates() - 加载模块分析模板
│   ├── _loadInitReferenceData() - 获取参考数据
│   └── 各种默认模板和参考数据函数
├── 依赖服务: workflowService, projectScanner, unifiedTemplateService
└── 架构意义: 将MCP从分析执行者转换为数据提供者
```

---

## 🔧 服务层依赖架构

### 核心服务依赖图
```
Init模式路由系统
├── WorkflowService - 8步工作流管理 (核心依赖)
│   ├── createWorkflow() - 创建工作流会话
│   ├── updateStep() - 更新步骤状态 ⚠️步骤索引混乱问题
│   ├── getWorkflow() - 获取工作流对象
│   ├── getProgress() - 获取工作流进度
│   └── validateWorkflowStep() - 验证工作流步骤
│
├── UnifiedTemplateService - 统一模板服务 (AI驱动核心)
│   ├── getTemplateByContext() - 基于上下文获取模板
│   ├── 智能模板选择: 4种策略 (legacy/intelligent/hybrid/advanced-ai)
│   └── 上下文置信度评分和策略优选算法
│
├── ProjectScanner - 项目结构扫描器
│   ├── scanProject() - 项目扫描主函数
│   └── getMaxDepth() - 获取最大扫描深度
│
├── LanguageDetector - 语言识别引擎
│   ├── detectLanguage() - 语言检测主函数
│   └── 6种语言支持 + 30+框架检测
│
├── PromptService - 提示词服务 (部分路由使用)
│   └── loadPrompt() - 加载提示词
│
└── ResponseService - 标准化响应格式
    ├── success() - 成功响应
    ├── error() - 错误响应
    └── workflowSuccess() - 工作流成功响应
```

---

## ⚠️ 发现的架构问题

### 🔴 严重问题

1. **步骤索引混乱**:
   ```
   实际步骤 vs 工作流索引 vs 存储键名:
   第1步 → updateStep(0) → step_1  ✅ 一致
   第2步 → updateStep(1) → step_2  ✅ 一致  
   第3步 → updateStep(2) → step_3  ✅ 一致
   第4步 → updateStep(3) → step_4  ✅ 一致
   第5步 → updateStep(4) → step_5  ✅ 一致
   第6步 → updateStep(5) → step_6  ✅ 一致
   第7步 → updateStep(6) → step_7  ❌ 混乱 (在modules.js中)
   第8步 → updateStep(7) → step_8  ❌ 混乱 (在contracts.js中)
   ```

2. **路由职责重叠**:
   ```
   modules.js 同时处理:
   ├── 第5步: POST /analyze-modules (步骤4)
   └── 第7步: POST /generate-module-docs (步骤6)
   
   问题: 一个文件处理两个不连续的工作流步骤
   ```

3. **AI驱动重构不彻底**:
   ```
   部分文件已重构为AI驱动:
   ├── ✅ language.js - 完全AI驱动
   ├── ✅ files.js - 完全AI驱动
   ├── ✅ prompts.js - 完全AI驱动
   ├── ⚠️ documents.js - 部分AI驱动
   ├── ⚠️ modules.js - 部分AI驱动
   └── ⚠️ contracts.js - 部分AI驱动
   ```

### 🟡 中等问题

4. **配置不一致**:
   ```
   config/modes.config.json 显示Init模式模板:
   ├── "system-architecture" ✅ 对应documents.js
   ├── "modules-catalog" ✅ 对应documents.js  
   ├── "user-stories" ❌ 未在Init路由中使用
   └── "technical-analysis" ❌ 未在Init路由中使用
   ```

5. **错误处理不统一**:
   - 有些路由使用 `return error(res, ...)`
   - 有些路由使用 `error(res, ...)` (无return)
   - 工作流更新失败处理不一致

---

## 🔧 建议的架构重构方案

### 📋 重构优先级

#### 🔴 高优先级 (立即修复)

1. **统一步骤索引**:
   ```javascript
   // 标准化所有步骤索引
   const STEP_INDEX_MAP = {
     'scan_structure': 0,      // 第1步
     'detect_language': 1,     // 第2步  
     'scan_files': 2,          // 第3步
     'generate_architecture': 3, // 第4步
     'analyze_modules': 4,     // 第5步
     'generate_prompts': 5,    // 第6步
     'generate_module_docs': 6, // 第7步
     'generate_contracts': 7   // 第8步
   };
   ```

2. **拆分modules.js**:
   ```
   当前: modules.js (第5步 + 第7步)
   拆分为:
   ├── modules-analysis.js (第5步: 深度模块分析)
   └── modules-docs.js (第7步: 模块文档生成)
   ```

3. **统一AI驱动架构**:
   ```javascript
   // 标准化AI数据包格式
   const aiAnalysisPackage = {
     rawData: {...},           // 原始数据
     analysisTemplate: {...},  // 分析模板
     documentTemplate: {...},  // 文档模板 (可选)
     processingInstructions: {...}, // 处理指令
     metadata: {...}          // 元数据
   };
   ```

#### 🟡 中等优先级 (逐步优化)

4. **完善错误处理**:
   ```javascript
   // 统一错误处理格式
   try {
     // 业务逻辑
     return workflowSuccess(res, step, stepName, workflowId, data, progress);
   } catch (err) {
     console.error(`[${stepName}] 失败:`, err);
     if (workflowId) {
       workflowService.updateStep(workflowId, stepIndex, 'failed', null, err.message);
     }
     return error(res, err.message, 500, { step, stepName });
   }
   ```

5. **优化模板配置**:
   ```json
   // 更新modes.config.json
   "init": {
     "templates": [
       "system-architecture",    // 第4步使用
       "modules-catalog",       // 第4步使用
       "integration-contracts", // 第8步使用
       "language-prompts"       // 第6步使用
     ]
   }
   ```

#### 🟢 低优先级 (长期规划)

6. **接口标准化**:
   - 统一输入参数验证
   - 标准化响应格式
   - 完善OpenAPI文档

7. **性能优化**:
   - 并行处理非依赖步骤
   - 智能缓存机制
   - 渐进式结果返回

---

## 📊 Init模式完整数据流图

```
用户请求项目初始化
         ↓
    Init路由聚合器 (index.js)
         ↓
┌─────────────────────────────────────────────────┐
│                8步工作流系统                      │
├─────────────────────────────────────────────────┤
│ 第1步: structure.js                             │
│ ├── POST /scan-structure                        │
│ ├── ProjectScanner.scanProject()                │  
│ ├── WorkflowService.updateStep(0, 'completed')  │
│ └── 输出: 项目结构数据                            │
│                                                 │
│ 第2步: language.js (AI驱动)                     │
│ ├── POST /detect-language                       │
│ ├── AI模板: language-detection-analysis.md      │
│ ├── WorkflowService.updateStep(1, 'completed')  │
│ └── 输出: 语言检测 + 技术栈分析                   │
│                                                 │
│ 第3步: files.js (AI驱动)                        │
│ ├── POST /scan-files                            │
│ ├── AI模板: file-content-analysis.md            │
│ ├── WorkflowService.updateStep(2, 'completed')  │
│ └── 输出: 文件分析 + 代码质量报告                 │
│                                                 │
│ 第4步: documents.js (AI驱动)                     │
│ ├── POST /generate-architecture                 │
│ ├── POST /generate-catalog                      │
│ ├── AI模板: system-architecture-analysis.md     │
│ ├── WorkflowService.updateStep(3, 'completed')  │
│ └── 输出: system-architecture.md + modules-catalog.md │
│                                                 │
│ 第5步: modules.js (AI驱动)                      │
│ ├── POST /analyze-modules                       │
│ ├── AI模板: module-analysis.md                  │
│ ├── WorkflowService.updateStep(4, 'completed')  │
│ └── 输出: 深度模块分析 + 依赖关系                │
│                                                 │
│ 第6步: prompts.js (AI驱动)                      │
│ ├── POST /generate-prompts                      │
│ ├── AI模板: language-prompts-generation.md      │
│ ├── WorkflowService.updateStep(5, 'completed')  │
│ └── 输出: 语言特定提示词集合                     │
│                                                 │
│ 第7步: modules.js (AI驱动) ⚠️混合在第5步文件中  │
│ ├── POST /generate-module-docs                  │
│ ├── AI模板: module-documentation-generation.md  │
│ ├── WorkflowService.updateStep(6, 'completed')  │
│ └── 输出: 每个模块的完整文档                     │
│                                                 │
│ 第8步: contracts.js (AI驱动)                    │
│ ├── POST /generate-contracts                    │
│ ├── AI模板: integration-contracts-analysis.md   │
│ ├── WorkflowService.updateStep(7, 'completed')  │
│ └── 输出: 集成契约文档 + 关系图                  │
└─────────────────────────────────────────────────┘
         ↓
    完整项目文档体系
```

---

## 💡 总结

**Init模式**是一个功能强大但架构复杂的工作流系统。通过8步渐进式处理，能够将任意项目转换为完整的文档化项目。

### ✅ 优势
- **AI驱动重构**: 大幅简化代码复杂度，提升分析质量
- **模块化设计**: 每个步骤独立可测试
- **工作流管理**: 完整的状态跟踪和错误处理
- **模板系统**: 灵活的文档生成和格式化

### ⚠️ 需要改进
- **步骤索引混乱**: 需要统一标准化
- **文件职责重叠**: modules.js需要拆分
- **AI重构不彻底**: 需要完全转为AI驱动模式
- **错误处理不统一**: 需要标准化处理流程

**建议**: 先解决高优先级问题，然后逐步完善整个Init模式架构，使其成为真正的AI驱动智能项目初始化系统。

---

*文档生成时间: 2025-09-08*  
*分析工具: mg_kiro MCP Server 深度架构分析*