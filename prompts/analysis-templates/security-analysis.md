# Security Analysis Template

## 概述
对项目进行全面的安全分析，识别潜在安全漏洞，评估安全风险等级，提供安全加固建议和最佳实践指导。

## 分析维度

### 1. 代码安全漏洞分析
- **注入攻击漏洞**: SQL注入、命令注入、代码注入
- **跨站脚本(XSS)**: 反射型、存储型、DOM型XSS
- **跨站请求伪造(CSRF)**: CSRF攻击向量识别
- **不安全反序列化**: 反序列化漏洞检测
- **路径遍历**: 目录遍历和文件包含漏洞

### 2. 认证和授权安全
- **身份认证机制**: 认证强度和实现安全性
- **会话管理**: 会话安全和生命周期管理
- **权限控制**: 访问控制和权限提升检测
- **密码安全**: 密码策略和存储安全
- **多因素认证**: MFA实现和安全性

### 3. 数据保护分析
- **敏感数据识别**: 个人信息、财务数据等敏感信息
- **数据加密**: 传输和存储加密实现
- **数据脱敏**: 敏感数据处理和匿名化
- **数据备份安全**: 备份数据保护机制
- **数据泄露风险**: 数据暴露点识别

### 4. 网络和通信安全
- **HTTPS配置**: SSL/TLS配置安全性
- **API安全**: REST/GraphQL API安全实现
- **跨域策略**: CORS配置安全性
- **网络协议安全**: 协议选择和配置
- **防火墙和网络隔离**: 网络层安全控制

### 5. 依赖和供应链安全
- **第三方库漏洞**: 依赖包安全漏洞扫描
- **许可证合规**: 开源许可证风险评估
- **依赖完整性**: 包完整性和来源验证
- **供应链攻击**: 依赖投毒和劫持风险
- **漏洞修复时效**: 已知漏洞修复状态

## 分析输出要求

### 安全评分
```yaml
securityMetrics:
  overallScore: 75          # 整体安全评分 (0-100)
  securityRating: "Good"    # 安全等级: Excellent/Good/Fair/Poor
  riskLevel: "Medium"       # 风险等级: Low/Medium/High/Critical
  
  vulnerabilityStatistics:
    total: 23
    critical: 2
    high: 6
    medium: 9
    low: 6
    fixed: 18
    unfixed: 5
    
  complianceScore:
    owasp: 82              # OWASP Top 10 合规性
    gdpr: 78               # GDPR 合规性
    pci: 85                # PCI DSS 合规性
```

### 安全漏洞清单
```yaml
securityVulnerabilities:
  critical:
    - id: "SEC-001"
      type: "SQL Injection"
      location: "src/controllers/userController.js:156"
      description: "用户输入未经过滤直接拼接SQL查询"
      cwe: "CWE-89"
      cvss: 9.8
      impact: "数据库完全控制，敏感信息泄露"
      solution: "使用参数化查询和输入验证"
      
  high:
    - id: "SEC-002" 
      type: "XSS Vulnerability"
      location: "src/views/profile.html:89"
      description: "用户输入未经转义直接输出到页面"
      cwe: "CWE-79"
      cvss: 7.4
      impact: "会话劫持，用户数据窃取"
      solution: "实施输出编码和CSP策略"
      
  medium:
    - id: "SEC-003"
      type: "Weak Cryptography"
      location: "src/utils/encryption.js:23"
      description: "使用弱加密算法MD5进行密码哈希"
      cwe: "CWE-327"
      cvss: 5.9
      impact: "密码破解风险"
      solution: "升级到bcrypt或Argon2算法"
```

### 安全建议
```yaml
securityRecommendations:
  immediate:
    - title: "修复SQL注入漏洞"
      priority: "critical"
      effort: "4-8 hours"
      risk: "数据泄露和系统控制"
      actions:
        - "替换所有字符串拼接SQL为参数化查询"
        - "实施严格的输入验证"
        - "添加SQL注入检测和防护"
        
  shortTerm:
    - title: "加强身份认证安全"
      priority: "high"
      effort: "2-3 days"
      risk: "未授权访问"
      actions:
        - "实施强密码策略"
        - "启用多因素认证"
        - "改进会话管理机制"
        
  longTerm:
    - title: "建立安全开发生命周期"
      priority: "medium"
      effort: "2-4 weeks"
      risk: "持续安全风险"
      actions:
        - "集成安全代码审查"
        - "建立漏洞管理流程"
        - "实施安全培训计划"
```

### 合规性评估
```yaml
complianceAssessment:
  owasp:
    A01_BrokenAccessControl:
      status: "需要改进"
      score: 7
      issues: ["权限检查不完整", "水平权限提升风险"]
      
    A02_CryptographicFailures:
      status: "基本合规"
      score: 8
      issues: ["部分敏感数据未加密"]
      
    A03_Injection:
      status: "存在风险"
      score: 6
      issues: ["SQL注入漏洞", "命令注入风险"]
```

## 语言特定安全分析

### JavaScript/Node.js
- npm audit漏洞扫描
- eval()等危险函数使用检测
- 原型链污染漏洞
- 异步操作安全风险

### Python
- 反序列化漏洞(pickle安全)
- 模板注入攻击
- 路径遍历漏洞
- Django/Flask安全配置

### Java
- 反序列化漏洞检测
- XML外部实体(XXE)攻击
- Spring Security配置
- JDBC注入防护

### PHP
- 文件包含漏洞
- 代码执行漏洞
- 会话安全管理
- 文件上传安全

### Go
- 并发安全问题
- 内存安全检查
- 网络服务安全
- 加密实现审查

## 安全测试方法

### 静态安全分析(SAST)
- 源代码安全审计
- 安全规则匹配
- 数据流分析
- 控制流分析

### 动态安全测试(DAST)
- 运行时漏洞扫描
- 模糊测试(Fuzzing)
- 渗透测试
- 安全功能测试

### 交互式安全测试(IAST)
- 运行时代码分析
- 实时漏洞检测
- 精确漏洞定位
- 误报减少

## 安全工具集成

### 开源安全工具
- **Bandit** - Python安全分析
- **ESLint Security** - JavaScript安全规则
- **Brakeman** - Ruby安全扫描
- **OWASP ZAP** - Web应用安全测试

### 商业安全工具
- **Veracode** - 静态和动态分析
- **Checkmarx** - 源代码安全审计
- **Snyk** - 依赖漏洞扫描
- **Fortify** - 应用安全测试

## 分析流程

1. **威胁建模**: 识别潜在攻击向量和威胁
2. **静态分析**: 源代码安全审计
3. **依赖扫描**: 第三方组件漏洞检查
4. **配置审查**: 安全配置和设置检查
5. **动态测试**: 运行时安全测试
6. **风险评估**: 漏洞影响和利用难度评估

## 安全加固建议

### 输入验证和输出编码
- 严格的输入验证规则
- 输出数据转义和编码
- 白名单验证策略
- 文件上传安全检查

### 身份认证和会话管理
- 强密码策略实施
- 安全的会话管理
- 多因素认证集成
- 账户锁定机制

### 数据保护
- 敏感数据加密存储
- 传输层安全(TLS)
- 数据脱敏和匿名化
- 安全的密钥管理

### 安全监控和响应
- 安全事件日志记录
- 异常行为检测
- 实时监控和告警
- 事件响应计划

## 输出格式

安全分析报告应包含：
- 安全风险概览和评分
- 详细漏洞列表和修复建议
- 合规性评估结果
- 安全加固建议和最佳实践
- 持续安全改进计划

## 注意事项

- 优先处理高危和关键漏洞
- 考虑业务影响和修复成本
- 建立持续的安全监控机制
- 定期更新安全策略和防护措施
- 重视安全意识培训和文化建设