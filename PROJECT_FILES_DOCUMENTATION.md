# mg_kiro MCP Server - 项目文件作用详解

## 🏗️ 项目概览

**mg_kiro MCP Server** 是一个生产级的 Model Context Protocol 智能提示词管理服务器，采用全新模块化架构，为 Claude Code 提供智能项目文档管理和代码维护支持。

**项目规模**: ~4000行核心代码，100%模块化架构，6种语言支持，4种工作模式

---

## 📁 根目录文件

### 🚀 核心入口

- **`index.js`** - **统一应用入口点** (400+行)
  - 集成Express HTTP服务器 + WebSocket双协议支持
  - MCP协议握手和连接管理
  - 服务依赖注入和配置加载  
  - WebSocket广播、心跳机制、优雅关闭
  - 完整的中间件堆栈(CORS、helmet、压缩、限流)

### 📋 项目配置

- **`package.json`** - Node.js项目配置
  - 依赖管理: Express、WebSocket、CORS等
  - 脚本定义: start/dev/test命令
  - ES模块支持(type: "module")

- **`README.md`** - **项目完整说明文档**
  - 架构详解、快速开始指南
  - API接口文档、四大工作模式说明
  - 多语言测试报告、Claude Code集成指南

### 🧪 测试和调试

- **`jest.config.js`** - Jest测试框架配置
- **`run-multitest.js`** - **多语言兼容性测试运行器** (403行)
  - 测试JavaScript/Python/Vue.js项目检测
  - 动态项目创建和语言检测验证
  - 100%通过率测试报告
- **`debug-scanner.js`** - **项目扫描调试工具** (124行)
- **`test-integration.js`** - 集成测试脚本

### 📊 状态文件

- **`TODO.md`** - 项目待办事项跟踪
- **`test-results-integration.json`** - 集成测试结果
- **`mcp-test-report.json`** - MCP协议测试报告

---

## 🔧 server/ - 服务器核心模块

### 🎯 核心管理器

#### **`prompt-manager.js`** - **智能提示词管理器** (400行)
- 无循环依赖的模板加载系统
- 缓存机制(TTL、LRU策略)
- 全局变量注册和模板变量替换
- 支持热重载和性能监控

### 🏗️ routes/ - 模块化路由系统

#### **`routes/index.js`** - **主路由聚合器**
- 统一路由入口，集成所有子路由模块
- 服务依赖注入和WebSocket广播支持
- 错误处理中间件和404处理

#### 🔷 system/ - 系统路由
- **`system/health.js`** - 健康检查和监控端点
- **`system/mcp.js`** - MCP协议握手端点  
- **`system/prompts.js`** - 提示词和模板管理端点

#### 🔵 init/ - Init模式路由(6个步骤)
- **`init/structure.js`** - 项目结构分析路由
- **`init/language.js`** - 智能语言识别路由
- **`init/files.js`** - 文件内容通读路由
- **`init/documents.js`** - 基础架构文档生成路由
- **`init/modules.js`** - 深度模块分析路由  
- **`init/prompts.js`** - 集成语言提示词路由
- **`init/contracts.js`** - 集成契约文档生成路由
- **`init/data.js`** - AI主导数据分析路由

#### 🟢 create/ - Create模式路由
- **`create/index.js`** - Create模式路由聚合器
- 功能规划、模块创建、API设计路由

#### 🟡 fix/ - Fix模式路由  
- **`fix/index.js`** - Fix模式路由聚合器
- 问题报告、诊断、修复应用路由

#### 🟠 analyze/ - Analyze模式路由
- **`analyze/index.js`** - Analyze模式路由聚合器
- 质量分析、安全分析、报告生成路由

#### 🔶 language/ - 语言智能系统路由
- **`language/index.js`** - 语言智能API路由聚合器
- 语言检测引擎API、模板生成引擎API、智能提示词API

### 🔧 services/ - 服务层架构

#### **`services/language-intelligence-service.js`** - **语言智能核心服务** (500+行)
- 统一管理语言检测、模板生成、智能提示词
- 多级缓存系统(detections/templates/prompts)
- 支持的语言: JavaScript/Python/Java/Go/Rust/C#
- 批量处理和性能指标跟踪

#### **`services/unified-template-service.js`** - **统一模板服务** (800+行)  
- 🧠 **智能模板选择系统**: 4种策略(legacy/intelligent/hybrid/advanced-ai)
- 上下文置信度评分和策略优选算法
- 语言特定模板增强和回退机制
- 📊 性能指标跟踪和系统健康监控

#### **`services/workflow-service.js`** - **工作流服务** (200行)
- 8步工作流管理和状态转换
- 步骤验证和结果存储
- 工作流进度跟踪和清理机制

#### 其他服务
- **`services/config-service.js`** - 配置服务
- **`services/prompt-service.js`** - 提示词服务  
- **`services/template-reader.js`** - 模板读取服务
- **`services/response-service.js`** - 标准化响应格式
- **`services/workflow-state-service.js`** - 工作流状态管理
- **`services/service-registry.js`** - 服务注册中心

### 🧠 language/ - 智能语言识别系统

#### **`language/detector.js`** - **语言识别引擎** (415行)
- **支持6种主流语言**: JavaScript/Python/Java/Go/Rust/C#  
- **智能检测机制**: 文件扩展名权重、配置文件特征、目录结构模式
- **框架识别**: React/Vue/Django/Flask/Spring等30+框架
- **置信度算法**: 权重累加和归一化评分

#### **`language/template-generator.js`** - **智能模板生成器** (600+行)
- 基于语言检测结果生成项目特定模板
- 语言配置加载和默认值合并  
- 模板变量替换和语言特定增强
- 批量生成和并发控制

#### 其他语言模块
- **`language/prompt-intelligence.js`** - 智能提示词系统
- **`language/language-prompt-generator.js`** - 语言特定提示词生成

### 📊 analyzers/ - 项目分析器模块

- **`analyzers/project-scanner.js`** - **项目结构扫描器**
  - 智能目录树生成和文件分类
  - 配置文件自动识别
  - 路径处理优化和性能监控

- **`analyzers/file-content-analyzer.js`** - **文件内容深度分析器**  
  - 核心文件内容解析和摘要生成
  - 文件大小检测和跳过逻辑修复
  - 支持多种文件类型(JS/PY/JSON/MD等)

- **`analyzers/enhanced-language-detector.js`** - 增强版语言检测器
- **`analyzers/integration-analyzer.js`** - 集成关系分析器

### 🔨 utils/ - 工具模块

- **`utils/response.js`** - 标准化响应格式工具

---

## 📁 config/ - 配置系统

### 🔧 配置文件

#### **`config/mcp.config.json`** - **MCP服务器核心配置**
- 服务器基础配置(端口、主机、协议)
- MCP协议能力声明
- 认证、日志、功能开关配置

#### **`config/modes.config.json`** - **工作模式行为定义**
- 四种模式配置: Init/Create/Fix/Analyze
- 每种模式的提示词路径、模板列表、能力声明
- 模式切换和验证规则

#### **`config/templates.config.json`** - **模板系统配置**  
- 15+种标准模板配置映射
- 模板分类(architecture/documentation/development等)
- 变量定义和渲染配置

---

## 📝 prompts/ - 提示词和模板库

### 🎯 modes/ - 工作模式提示词

- **`modes/init.md`** - 初始化模式提示词
- **`modes/create.md`** - 创建模式提示词  
- **`modes/fix.md`** - 修复模式提示词
- **`modes/analyze.md`** - 分析模式提示词

### 📄 templates/ - 标准文档模板(15+种)

#### 架构类模板
- **`templates/system-architecture.md`** - 系统架构模板
- **`templates/modules-catalog.md`** - 模块目录模板

#### 需求分析类模板  
- **`templates/user-stories.md`** - 用户故事模板
- **`templates/technical-analysis.md`** - 技术分析模板

#### 开发管理类模板
- **`templates/action-items.md`** - 行动清单模板
- **`templates/module-template.md`** - 模块模板
- **`templates/integration-contracts.md`** - 集成契约模板

#### 维护类模板
- **`templates/changelog.md`** - 变更记录模板
- **`templates/dependencies.md`** - 依赖管理模板
- **`templates/development-workflow.md`** - 开发工作流模板

#### 特殊目录
- **`templates/language-variants/`** - 多语言模板变体目录
  - 包含不同编程语言的特定模板版本

### 🌐 languages/ - 多语言支持配置

支持6种主流编程语言的配置目录:
- **`languages/javascript/`** - JavaScript/Node.js生态配置
- **`languages/python/`** - Python生态配置  
- **`languages/java/`** - Java生态配置
- **`languages/go/`** - Go生态配置
- **`languages/rust/`** - Rust生态配置
- **`languages/csharp/`** - C#/.NET生态配置

每个语言目录包含:
- `config.json` - 语言特定配置
- `defaults.json` - 默认变量值
- 框架特定提示词和模板

### 📝 其他提示词目录

- **`prompts/snippets/`** - 代码片段模板
- **`prompts/analysis-templates/`** - 分析类模板
- **`prompts/document-templates/`** - 文档类模板

---

## 🧪 tests/ - 测试套件

### 测试文件

- **`tests/config-integration.test.js`** - 配置集成测试(100%覆盖)
- **`tests/config-manager.test.js`** - 配置管理测试(100%覆盖)  
- **`tests/server.test.js`** - 服务器测试(85%完成)

---

## 🔗 详细架构关系图

### 🚀 应用启动层
```
index.js - 统一应用入口点 (Express+WebSocket双协议服务器)
├── 🔧 配置加载
│   ├── config/mcp.config.json - MCP服务器核心配置(端口/协议/能力)
│   ├── config/modes.config.json - 工作模式行为定义(4种模式配置)
│   └── config/templates.config.json - 模板系统配置(15+种模板映射)
│
├── 📋 项目管理
│   ├── package.json - Node.js项目配置(依赖/脚本/ES模块)
│   ├── README.md - 项目完整说明文档(架构/API/集成指南)
│   └── TODO.md - 项目待办事项跟踪
│
└── 🧪 测试调试
    ├── jest.config.js - Jest测试框架配置
    ├── run-multitest.js - 多语言兼容性测试运行器(6种语言100%通过率)
    ├── debug-scanner.js - 项目扫描调试工具(项目结构分析)
    └── test-integration.js - 集成测试脚本
```

### 🏗️ 核心服务层
```
server/
├── prompt-manager.js - 智能提示词管理器(缓存/热重载/变量替换)
│
├── 🔀 routes/ - 模块化路由系统
│   ├── index.js - 主路由聚合器(统一入口/依赖注入/错误处理)
│   │
│   ├── 🔷 system/ - 系统管理路由
│   │   ├── health.js - 健康检查和监控端点(服务状态/性能指标)
│   │   ├── mcp.js - MCP协议握手端点(协议验证/连接管理)
│   │   └── prompts.js - 提示词和模板管理端点(模板CRUD/变量处理)
│   │
│   ├── 🔵 init/ - Init模式路由(8步工作流)
│   │   ├── structure.js - 项目结构分析路由(目录扫描/文件分类)
│   │   ├── language.js - 智能语言识别路由(6种语言检测/框架识别)
│   │   ├── files.js - 文件内容通读路由(核心文件解析/内容分析)
│   │   ├── documents.js - 基础架构文档生成路由(模板渲染/文档输出)
│   │   ├── modules.js - 深度模块分析路由(依赖关系/模块映射)
│   │   ├── prompts.js - 集成语言提示词路由(语言特定提示词生成)
│   │   ├── contracts.js - 集成契约文档生成路由(API契约/集成文档)
│   │   └── data.js - AI主导数据分析路由(智能分析/数据提取)
│   │
│   ├── 🟢 create/ - Create模式路由
│   │   └── index.js - Create模式路由聚合器(功能规划/模块创建/API设计)
│   │
│   ├── 🟡 fix/ - Fix模式路由
│   │   └── index.js - Fix模式路由聚合器(问题报告/诊断分析/修复应用)
│   │
│   ├── 🟠 analyze/ - Analyze模式路由  
│   │   └── index.js - Analyze模式路由聚合器(质量分析/安全扫描/报告生成)
│   │
│   └── 🔶 language/ - 语言智能系统路由
│       └── index.js - 语言智能API路由聚合器(检测API/模板API/提示词API)
│
├── 🔧 services/ - 服务层架构(业务逻辑核心)
│   ├── language-intelligence-service.js - 语言智能核心服务(500+行)
│   │   └── 功能: 语言检测/模板生成/智能提示词/批量处理/性能监控
│   │
│   ├── unified-template-service.js - 统一模板服务(800+行) 
│   │   └── 功能: 4种智能选择策略/上下文评分/模板增强/健康监控
│   │
│   ├── workflow-service.js - 工作流服务(8步工作流管理/状态转换/进度跟踪)
│   │
│   ├── config-service.js - 配置服务(配置加载/验证/热重载)
│   ├── prompt-service.js - 提示词服务(模板读取/变量处理/缓存管理)
│   ├── template-reader.js - 模板读取服务(文件IO/格式解析/缓存)
│   ├── response-service.js - 标准化响应格式(success/error/workflow格式)
│   ├── workflow-state-service.js - 工作流状态管理(状态机/步骤验证/结果存储)
│   └── service-registry.js - 服务注册中心(依赖注入/服务发现)
│
├── 🧠 language/ - 智能语言识别系统
│   ├── detector.js - 语言识别引擎(415行)
│   │   └── 功能: 6种语言支持/30+框架检测/权重算法/置信度评分
│   │
│   ├── template-generator.js - 智能模板生成器(600+行)
│   │   └── 功能: 语言特定模板生成/配置加载/变量替换/批量处理
│   │
│   ├── prompt-intelligence.js - 智能提示词系统(上下文感知/最佳实践)
│   └── language-prompt-generator.js - 语言特定提示词生成(框架适配)
│
├── 📊 analyzers/ - 项目分析器模块  
│   ├── project-scanner.js - 项目结构扫描器(目录树生成/文件分类/配置识别)
│   ├── file-content-analyzer.js - 文件内容深度分析器(内容解析/摘要生成)
│   ├── enhanced-language-detector.js - 增强版语言检测器(深度分析/特征提取)
│   └── integration-analyzer.js - 集成关系分析器(依赖映射/架构分析)
│
└── 🔨 utils/ - 工具模块
    └── response.js - 标准化响应格式工具(JSON格式化/错误包装)
```

### 📝 内容管理层
```
prompts/ - 提示词和模板库
├── 🎯 modes/ - 工作模式提示词
│   ├── init.md - 初始化模式提示词(项目初始化指导/8步工作流提示)
│   ├── create.md - 创建模式提示词(功能开发指导/文档先行流程)
│   ├── fix.md - 修复模式提示词(问题诊断指导/修复流程)
│   └── analyze.md - 分析模式提示词(代码分析指导/质量评估)
│
├── 📄 templates/ - 标准文档模板(15+种)
│   ├── 🏛️ 架构类
│   │   ├── system-architecture.md - 系统架构模板(组件设计/数据流)
│   │   └── modules-catalog.md - 模块目录模板(模块清单/依赖关系)
│   │
│   ├── 📋 需求分析类
│   │   ├── user-stories.md - 用户故事模板(需求描述/验收标准)
│   │   └── technical-analysis.md - 技术分析模板(技术选型/风险评估)
│   │
│   ├── 🔧 开发管理类
│   │   ├── action-items.md - 行动清单模板(任务分解/优先级)
│   │   ├── module-template.md - 模块模板(代码结构/接口定义)
│   │   └── integration-contracts.md - 集成契约模板(API契约/数据格式)
│   │
│   ├── 🔄 维护类  
│   │   ├── changelog.md - 变更记录模板(版本历史/影响分析)
│   │   ├── dependencies.md - 依赖管理模板(依赖清单/更新策略)
│   │   └── development-workflow.md - 开发工作流模板(流程规范/最佳实践)
│   │
│   └── language-variants/ - 多语言模板变体目录(特定语言的模板版本)
│
├── 🌐 languages/ - 多语言支持配置
│   ├── javascript/ - JavaScript/Node.js生态配置(React/Vue/Angular/Express)
│   ├── python/ - Python生态配置(Django/Flask/FastAPI/数据科学框架)
│   ├── java/ - Java生态配置(Spring/Maven/Gradle/企业级框架)
│   ├── go/ - Go生态配置(Gin/Echo/Fiber/云原生工具)
│   ├── rust/ - Rust生态配置(Actix/Rocket/Warp/系统编程)
│   └── csharp/ - C#/.NET生态配置(ASP.NET/Blazor/WPF/企业应用)
│   └── 每个语言目录包含:
│       ├── config.json - 语言特定配置(框架列表/检测规则)
│       ├── defaults.json - 默认变量值(模板变量/项目配置)
│       └── 框架特定提示词和模板文件
│
├── 📝 snippets/ - 代码片段模板(常用代码模式/最佳实践示例)
├── 📊 analysis-templates/ - 分析类模板(质量报告/性能分析/安全评估)
└── 📖 document-templates/ - 文档类模板(技术文档/API文档/用户指南)
```

### 🧪 测试验证层
```
tests/ - 测试套件
├── config-integration.test.js - 配置集成测试(100%覆盖/配置加载验证)
├── config-manager.test.js - 配置管理测试(100%覆盖/热重载测试)  
└── server.test.js - 服务器测试(85%完成/API端点测试/WebSocket测试)
```

### 📊 数据流向图
```
用户请求 → index.js → Routes路由分发 → Services业务处理 → 数据存储/返回
    ↓
WebSocket连接 ← 实时推送 ← 状态变更通知 ← WorkflowService工作流
    ↓  
Language检测 → Template生成 → Prompt处理 → 文档输出
    ↓
项目分析 → 结果缓存 → 性能监控 → 健康检查反馈
```

---

## 💡 核心特性总结

### 🔥 技术亮点

1. **模块化架构**: 完全解耦的路由系统和服务层
2. **智能语言识别**: 支持6种语言，30+框架检测
3. **统一模板服务**: 4种智能选择策略，上下文感知生成
4. **双协议支持**: HTTP REST API + WebSocket实时通信
5. **工作流引擎**: 8步渐进式项目初始化流程

### 📊 项目统计

- **代码行数**: ~4000行核心代码
- **测试覆盖**: 配置系统100%，语言检测100%通过率  
- **支持语言**: 6种(JavaScript/Python/Java/Go/Rust/C#)
- **工作模式**: 4种(Init/Create/Fix/Analyze)  
- **文档模板**: 15+种标准模板
- **路由端点**: 25+个API端点

### 🎯 使用场景

1. **项目初始化**: 自动分析现有代码库，生成完整文档体系
2. **功能开发**: 文档先行的新功能开发流程
3. **问题修复**: 结构化的bug修复和风险评估  
4. **代码分析**: 质量分析、性能审查、安全扫描
5. **多语言项目**: 智能识别技术栈，生成语言特定文档

### 🚀 快速启动

```bash
# 启动服务器
npm start

# 健康检查
curl http://localhost:3000/health

# 获取模式提示词
curl http://localhost:3000/prompt/mode/init

# 切换工作模式
curl -X POST http://localhost:3000/mode/switch \
  -H "Content-Type: application/json" \
  -d '{"mode": "create"}'
```

---

**这个项目代表了现代化MCP服务器的最佳实践，集成了智能分析、模板生成、工作流管理等多个维度的创新功能。**

---

*文档生成时间: ${new Date().toLocaleString('zh-CN')}*  
*生成工具: mg_kiro MCP Server 文档分析系统*