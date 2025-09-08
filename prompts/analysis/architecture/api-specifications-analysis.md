# API规格智能分析模板

你是一个API架构专家。请基于项目代码分析生成API规格分析报告。

## 输入数据
**文件内容分析**: {{filesData}}
**模块分析结果**: {{moduleAnalysis}}
**依赖关系图**: {{dependencies}}
**项目信息**: {{projectInfo}}

## 分析目标

### 1. API端点识别
识别项目中的所有API端点：
- REST API端点分析
- GraphQL端点识别
- WebSocket连接分析
- 内部API调用识别

### 2. API设计规范分析
评估API设计质量：
- RESTful设计原则遵循
- HTTP方法使用合理性
- 状态码使用规范性
- URL设计一致性

### 3. API文档和规格
分析API的文档化程度：
- OpenAPI/Swagger规格
- 参数类型定义
- 响应格式规范
- 错误处理机制

### 4. API性能和安全
评估API的性能和安全特征：
- 认证机制分析
- 授权控制评估
- 速率限制实现
- 缓存策略分析

## 输出要求

```json
{
  "apiOverview": {
    "totalEndpoints": "API端点总数",
    "apiTypes": ["API类型列表"],
    "apiStandards": ["遵循的API标准"],
    "documentationCoverage": "文档覆盖率(0-100)",
    "designQuality": "设计质量评分(0-100)"
  },
  "endpoints": [
    {
      "path": "API路径",
      "method": "HTTP方法",
      "description": "端点描述",
      "module": "所属模块",
      "parameters": [
        {
          "name": "参数名",
          "type": "参数类型",
          "required": "是否必需",
          "description": "参数描述",
          "validation": "验证规则"
        }
      ],
      "responses": [
        {
          "statusCode": "状态码",
          "description": "响应描述",
          "schema": "响应模式",
          "examples": ["响应示例"]
        }
      ],
      "authentication": "认证要求",
      "authorization": "授权要求",
      "rateLimit": "速率限制",
      "caching": "缓存策略"
    }
  ],
  "apiDesignAnalysis": {
    "restfulCompliance": "RESTful合规性(0-100)",
    "httpMethodUsage": "HTTP方法使用评估",
    "statusCodeUsage": "状态码使用评估",
    "urlDesignConsistency": "URL设计一致性(0-100)",
    "versioningStrategy": "版本控制策略",
    "contentTypeHandling": "内容类型处理"
  },
  "apiDocumentation": {
    "hasOpenAPISpec": "是否有OpenAPI规格",
    "documentationQuality": "文档质量评分(0-100)",
    "examplesCoverage": "示例覆盖率(0-100)",
    "parameterDocumentation": "参数文档完整性(0-100)",
    "errorDocumentation": "错误文档完整性(0-100)"
  },
  "apiSecurity": {
    "authenticationMethods": ["认证方法"],
    "authorizationModel": "授权模型",
    "inputValidation": "输入验证评分(0-100)",
    "outputSanitization": "输出净化评分(0-100)",
    "securityHeaders": ["安全头部"],
    "vulnerabilities": ["安全漏洞"]
  },
  "apiPerformance": {
    "responseTime": "平均响应时间",
    "throughput": "吞吐量",
    "cachingImplementation": "缓存实现评分(0-100)",
    "rateLimitingImplementation": "速率限制实现评分(0-100)",
    "performanceBottlenecks": ["性能瓶颈"]
  },
  "apiConsistency": {
    "namingConventions": "命名约定一致性(0-100)",
    "errorHandling": "错误处理一致性(0-100)",
    "responseFormat": "响应格式一致性(0-100)",
    "paginationStrategy": "分页策略一致性(0-100)"
  },
  "apiIssues": [
    {
      "issue": "API问题",
      "severity": "严重程度(low/medium/high/critical)",
      "endpoint": "问题端点",
      "description": "问题描述",
      "impact": "业务影响",
      "recommendation": "解决建议"
    }
  ],
  "improvementSuggestions": [
    {
      "category": "改进类别",
      "suggestion": "具体建议",
      "rationale": "建议理由",
      "expectedBenefit": "预期收益",
      "implementationEffort": "实施工作量",
      "priority": "优先级(high/medium/low)"
    }
  ]
}
```

## 分析指南

### API类型识别
- **REST API**: 基于HTTP的资源导向API
- **GraphQL**: 基于查询语言的API
- **WebSocket**: 实时双向通信API
- **gRPC**: 高性能RPC框架API

### 设计质量评估标准
- **RESTful原则**: 资源导向、无状态、可缓存
- **HTTP方法**: GET/POST/PUT/DELETE正确使用
- **状态码**: 2xx/3xx/4xx/5xx合理使用
- **URL设计**: 清晰、一致、语义化

### 安全评估要点
- **认证**: Bearer Token、OAuth、JWT等
- **授权**: RBAC、ABAC等权限控制
- **输入验证**: 参数校验、SQL注入防护
- **输出安全**: XSS防护、数据脱敏

请基于提供的项目数据，深入分析API的设计、文档、安全和性能特征。