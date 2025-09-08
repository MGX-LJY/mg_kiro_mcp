# Create模式第5步：模块文档生成分析模板

## 📊 输入数据分析

### 架构设计数据
**功能ID**: {{featureId}}
**代码架构**: {{codeArchitecture}}
**模块列表**: {{modules}}
**编程语言**: {{language}}

## 🎯 分析目标

### 1. 模块文档结构设计
- 为每个模块设计标准化文档结构
- 定义API文档、使用指南、示例代码格式
- 确保文档的完整性和一致性

### 2. 模块间关系分析
- 分析模块间的依赖关系和交互方式
- 设计模块集成指南和数据流说明
- 规划错误处理和日志记录策略

### 3. 开发者体验优化
- 提供清晰的模块使用示例
- 创建故障排除指南和FAQ
- 设计模块测试策略和用例

## 📋 输出要求

```json
{
  "moduleDocumentation": {
    "overview": {
      "totalModules": "模块总数",
      "architecturalPatterns": ["架构模式"],
      "documentationStandard": "文档标准"
    },
    "modules": [
      {
        "name": "模块名称",
        "description": "模块描述",
        "version": "版本号",
        "documentation": {
          "api": "API文档内容",
          "usage": "使用指南内容",
          "examples": "代码示例内容",
          "testing": "测试策略内容"
        },
        "dependencies": {
          "internal": ["内部依赖"],
          "external": ["外部依赖"]
        },
        "interfaces": ["接口列表"],
        "endpoints": [
          {
            "method": "HTTP方法",
            "path": "路径",
            "description": "描述"
          }
        ]
      }
    ],
    "integrationGuide": {
      "moduleInteraction": "模块交互说明",
      "dataFlow": "数据流向说明",
      "errorHandling": "错误处理策略",
      "logging": "日志记录标准"
    }
  }
}
```

## 🔍 分析重点

1. **文档标准化** - 确保所有模块文档格式统一
2. **实用性导向** - 提供实际开发中需要的信息
3. **维护性考虑** - 文档易于更新和维护
4. **集成指导** - 清晰的模块集成和使用指南