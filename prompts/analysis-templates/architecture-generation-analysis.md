# Create模式第4步：代码架构生成分析模板

## 📊 输入数据分析

### 项目设计数据
**功能ID**: {{featureId}}
**任务分解**: {{taskBreakdown}}
**技术设计**: {{techDesign}}
**编程语言**: {{language}}
**项目上下文**: {{projectContext}}

## 🎯 分析目标

### 1. 代码结构设计
- 基于任务分解设计目录结构
- 确定文件组织和命名规范
- 分析代码分层和模块划分

### 2. 模块架构规划
- 定义各模块的职责范围
- 设计模块间的接口和依赖关系
- 规划模块的可扩展性和复用性

### 3. 脚手架代码生成
- 生成项目基础代码框架
- 提供模板代码和配置文件
- 创建开发环境配置

### 4. 开发规范制定
- 定义编码规范和最佳实践
- 设计代码审查和质量标准
- 规划测试策略和文档标准

## 📋 输出要求

请以JSON格式输出代码架构分析结果：

```json
{
  "codeArchitecture": {
    "structure": {
      "directories": [
        {
          "name": "目录路径",
          "purpose": "目录用途",
          "files": ["文件1", "文件2"]
        }
      ],
      "codeStructure": {
        "layered": ["层次1", "层次2"],
        "patterns": ["设计模式1", "设计模式2"], 
        "conventions": ["规范1", "规范2"]
      }
    },
    "modules": [
      {
        "name": "模块名",
        "files": ["文件列表"],
        "responsibilities": ["职责1", "职责2"],
        "interfaces": ["接口1", "接口2"],
        "dependencies": ["依赖模块1", "依赖模块2"]
      }
    ],
    "scaffolding": {
      "boilerplateCode": {
        "controller": "控制器模板代码",
        "service": "服务层模板代码",
        "model": "数据模型模板代码",
        "routes": "路由模板代码"
      },
      "configFiles": ["配置文件1", "配置文件2"],
      "documentationStubs": ["文档文件1", "文档文件2"]
    }
  },
  "developmentGuidelines": {
    "codingStandards": ["标准1", "标准2"],
    "testingStrategy": ["测试策略1", "测试策略2"],
    "deploymentGuide": ["部署步骤1", "部署步骤2"]
  },
  "recommendations": [
    "架构建议1",
    "架构建议2"
  ]
}
```

## 🔍 分析重点

1. **模块化设计** - 确保高内聚、低耦合的模块设计
2. **可维护性** - 代码结构清晰，易于维护和扩展
3. **开发效率** - 提供充分的脚手架和模板代码
4. **质量保证** - 内置质量检查和最佳实践
5. **团队协作** - 支持多人协作的代码组织方式

请基于任务分解和技术设计，生成完整的代码架构方案。