# 模块目录

## 模块概览

本项目共识别出 **3** 个核心模块，采用分层架构设计。

## 核心模块列表

### 服务层模块
- **AIContentGeneratorService - AI内容生成核心引擎**
- **AIResponseHandlerService - AI响应处理和文档持久化**
- **TemplateEngineService - 模板引擎和变量替换**
- **LanguageIntelligenceService - 语言智能检测服务**

### 路由层模块
- **SystemRoutes - 系统级API路由 (health, status, mcp)**
- **InitModeRoutes - Init模式工作流路由**
- **CreateModeRoutes - Create模式功能路由**
- **FixModeRoutes - Fix模式修复路由**
- **AnalyzeModeRoutes - Analyze模式分析路由**
- **LanguageRoutes - 语言智能系统路由**

### 工具层模块
- **ResponseUtility - 标准化响应格式工具**
- **FileScanner - 项目文件扫描工具**
- **LanguageDetector - 编程语言检测工具**
- **TemplateReader - 模板文件读取工具**

### 配置模块
- **MCPConfig - MCP服务器配置管理**
- **ModesConfig - 工作模式配置管理**
- **TemplatesConfig - 模板系统配置管理**
- **LanguageConfig - 语言检测配置管理**

## 模块依赖关系

模块依赖关系图:

```
Express Server (index.js)
├── Routes Layer
│   ├── System Routes
│   ├── Init Mode Routes  
│   ├── Create Mode Routes
│   ├── Fix Mode Routes
│   └── Analyze Mode Routes
├── Services Layer
│   ├── AI Content Generator
│   ├── AI Response Handler
│   ├── Template Engine
│   └── Language Intelligence
└── Infrastructure Layer
    ├── Config Manager
    ├── File Scanner
    └── Response Utilities
```

## 模块职责分析

核心职责分析:

**表现层** - 负责HTTP请求处理和路由分发
**业务层** - 负责核心业务逻辑和AI内容生成  
**服务层** - 负责具体功能实现和外部集成
**基础层** - 负责配置管理和工具支持

各层职责清晰，符合分层架构设计原则。

## 扩展建议

扩展建议:

🔌 **插件系统** - 支持自定义模块热插拔
📊 **监控模块** - 添加性能监控和日志分析
🔐 **认证模块** - 增强安全认证和权限管理
🌐 **国际化模块** - 支持多语言界面和文档

---
*模块目录生成时间: 2025-09-08T11:31:43.164Z*
*模块分析引擎: mg_kiro MCP Server*
