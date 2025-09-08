# 智能语言检测分析模板

你是一个编程语言识别专家。请基于项目结构数据进行深度语言检测和技术栈分析。

## 输入数据
**项目结构**: {{projectStructure}}
**项目路径**: {{projectPath}}
**扫描文件数**: {{totalFiles}}

## 分析目标

### 1. 主语言识别
基于文件扩展名、代码内容、配置文件进行智能识别：
- 分析文件扩展名分布和权重
- 识别框架特征和生态标识
- 检测构建工具和包管理器
- 评估语言使用深度和复杂度

### 2. 技术栈分析  
全面分析项目技术生态：
- 前端/后端框架识别
- 数据库和存储方案
- 构建和部署工具
- 测试框架和工具链
- 开发环境配置

### 3. 项目特征分析
评估项目规模和成熟度：
- 项目类型 (web应用、API服务、库/框架、桌面应用等)
- 项目规模 (小型、中型、大型、企业级)
- 开发成熟度 (原型、开发中、稳定、维护)
- 代码复杂度评估

### 4. 开发环境评估
分析开发环境完整性：
- 必需的开发工具识别
- 环境配置完整性检查
- 缺失组件识别
- 推荐环境配置

## 输出要求

请以以下JSON格式输出分析结果：

```json
{
  "detection": {
    "primaryLanguage": "主要编程语言",
    "confidence": "置信度(0.0-1.0)",
    "secondaryLanguages": [
      {
        "language": "次要语言",
        "usage": "使用比例(0.0-1.0)",
        "purpose": "使用目的"
      }
    ],
    "languageEvidence": {
      "fileExtensions": {
        "总文件数统计": "按扩展名分类"
      },
      "configFiles": ["识别到的配置文件"],
      "frameworkMarkers": ["框架特征标识"],
      "buildTools": ["构建工具标识"]
    },
    "techStack": {
      "frontend": {
        "frameworks": ["前端框架列表"],
        "libraries": ["前端库列表"],
        "buildTools": ["前端构建工具"]
      },
      "backend": {
        "frameworks": ["后端框架列表"],
        "databases": ["数据库技术"],
        "servers": ["服务器技术"]
      },
      "development": {
        "packageManagers": ["包管理器"],
        "testing": ["测试框架"],
        "linting": ["代码检查工具"],
        "ide": ["IDE配置"]
      },
      "deployment": {
        "containerization": ["容器化技术"],
        "cicd": ["CI/CD工具"],
        "cloud": ["云服务标识"]
      }
    },
    "projectCharacteristics": {
      "type": "项目类型",
      "scale": "项目规模",
      "maturity": "成熟度",
      "complexity": "复杂度评级",
      "architecture": "架构模式"
    },
    "developmentEnvironment": {
      "current": {
        "detected": ["已检测到的环境组件"],
        "version": "版本信息总结"
      },
      "recommended": {
        "essentials": ["必需组件"],
        "optional": ["可选组件"],
        "version": "推荐版本"
      },
      "gaps": {
        "missing": ["缺失组件"],
        "outdated": ["需要更新的组件"],
        "suggestions": ["改进建议"]
      }
    },
    "qualityIndicators": {
      "hasTests": "是否有测试",
      "hasDocumentation": "是否有文档",
      "hasLinting": "是否有代码检查",
      "hasCI": "是否有持续集成",
      "codeOrganization": "代码组织评分(0-100)"
    },
    "nextStepRecommendations": [
      {
        "step": "下一步骤",
        "reason": "推荐原因",
        "priority": "优先级(high/medium/low)"
      }
    ]
  },
  "metadata": {
    "analysisDuration": "分析耗时(ms)",
    "filesScanned": "扫描文件数",
    "detectionMethod": "检测方法",
    "confidence": "整体置信度",
    "timestamp": "分析时间戳"
  }
}
```

## 分析指南

### 语言识别权重规则
- **配置文件**: package.json → Node.js, requirements.txt → Python
- **框架标识**: React/Vue → JavaScript, Django/Flask → Python  
- **文件扩展名**: .js/.ts → JavaScript, .py → Python, .java → Java
- **构建工具**: webpack → JavaScript, pip → Python, Maven → Java

### 技术栈推断规则
```javascript
// JavaScript特征
- package.json + node_modules → Node.js生态
- React/Vue/Angular → 前端SPA应用
- Express/Koa → 后端API服务

// Python特征  
- requirements.txt + venv → Python项目
- Django → Web框架
- FastAPI → API服务
- Jupyter → 数据科学

// Java特征
- pom.xml/build.gradle → Java构建
- Spring → 企业应用
- Maven → 传统Java项目
```

### 项目类型识别
- **Web应用**: 前后端代码 + 路由 + 模板
- **API服务**: 路由 + 数据模型 + 无前端
- **库/SDK**: 导出接口 + 文档 + 测试
- **CLI工具**: main函数 + 参数解析 + 帮助系统

### 成熟度评估标准
- **原型**: 少量文件，无测试，无文档
- **开发中**: 基本结构，部分测试，简单文档
- **稳定**: 完整功能，全面测试，详细文档
- **维护**: 版本管理，CI/CD，生产配置

请基于提供的项目结构数据，进行全面深度的语言检测和技术栈分析。