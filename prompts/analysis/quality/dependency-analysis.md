# Dependency Analysis Template

## 概述
对项目依赖进行全面分析，包括依赖树结构、版本管理、安全漏洞、许可证合规和优化建议，确保依赖生态健康和可持续。

## 分析维度

### 1. 依赖树结构分析
- **依赖关系映射**: 直接和传递依赖关系
- **依赖深度分析**: 依赖树深度和复杂度
- **循环依赖检测**: 循环引用和依赖环识别
- **孤立依赖识别**: 未使用或多余的依赖
- **关键路径分析**: 核心依赖和单点故障风险

### 2. 版本管理分析
- **版本一致性**: 同一依赖的多版本冲突
- **过时依赖检测**: 有更新版本的过时依赖
- **版本策略评估**: 语义化版本使用情况
- **更新风险评估**: 版本更新的破坏性变更风险
- **锁文件完整性**: lockfile的完整性和一致性

### 3. 安全漏洞分析
- **已知漏洞扫描**: CVE数据库漏洞匹配
- **漏洞严重程度**: CVSS评分和风险等级
- **修复状态跟踪**: 漏洞修复版本可用性
- **攻击向量分析**: 漏洞利用路径和影响范围
- **零日漏洞风险**: 新发现漏洞的响应时间

### 4. 许可证合规分析
- **许可证识别**: 所有依赖的许可证类型
- **许可证兼容性**: 许可证之间的兼容性检查
- **商业使用合规**: 商业项目中的许可证限制
- **版权信息完整性**: 版权声明和归属信息
- **许可证变更跟踪**: 依赖更新时的许可证变化

### 5. 性能影响分析
- **包大小统计**: 依赖包大小和总体影响
- **加载时间影响**: 启动时间和运行时性能
- **未使用代码**: Tree-shaking和死代码消除
- **替代方案**: 更轻量级的依赖替代
- **懒加载机会**: 延迟加载和按需引入

## 分析输出要求

### 依赖健康度评估
```yaml
dependencyHealth:
  overallScore: 82          # 整体健康度评分 (0-100)
  healthRating: "Good"      # 健康等级: Excellent/Good/Fair/Poor
  riskLevel: "Medium"       # 风险等级: Low/Medium/High/Critical
  
  dependencyTree:
    totalPackages: 156
    directDependencies: 23
    devDependencies: 18
    transitiveDependencies: 115
    maxDepth: 6
    circularDependencies: 0
    
  versionHealth:
    outdatedPackages: 12
    vulnerablePackages: 3
    majorUpdatesAvailable: 4
    minorUpdatesAvailable: 8
    
  sizeMetrics:
    totalSize: "45.2MB"
    productionSize: "32.1MB"
    devSize: "13.1MB"
    heaviestPackage: "webpack"
    heaviestSize: "8.5MB"
```

### 漏洞风险评估
```yaml
vulnerabilityAssessment:
  totalVulnerabilities: 7
  severityBreakdown:
    critical: 1
    high: 2  
    medium: 3
    low: 1
    
  vulnerablePackages:
    - package: "lodash"
      version: "4.17.20"
      vulnerabilities:
        - cve: "CVE-2021-23337"
          severity: "high"
          score: 7.4
          description: "Prototype pollution vulnerability"
          fixedIn: "4.17.21"
          patchAvailable: true
          
    - package: "minimist"
      version: "1.2.5"
      vulnerabilities:
        - cve: "CVE-2021-44906"
          severity: "critical"
          score: 9.8
          description: "Prototype pollution via obj[__proto__]"
          fixedIn: "1.2.6"
          patchAvailable: true
```

### 优化建议
```yaml
optimizationRecommendations:
  security:
    - title: "修复高危漏洞"
      priority: "critical"
      action: "update"
      packages: ["minimist@1.2.6", "lodash@4.17.21"]
      impact: "消除关键安全风险"
      effort: "30 minutes"
      
  maintenance:
    - title: "清理未使用依赖"
      priority: "medium"
      action: "remove"
      packages: ["moment", "underscore"]
      impact: "减少2.1MB包大小，简化依赖树"
      effort: "1-2 hours"
      
  modernization:
    - title: "升级过时依赖"
      priority: "low"
      action: "update"
      packages: ["express@4.19.2", "react@18.2.0"]
      impact: "获得新功能和性能改进"
      effort: "1-2 days"
      note: "需要测试破坏性变更"
```

### 许可证合规报告
```yaml
licenseCompliance:
  licenseDistribution:
    "MIT": 134
    "Apache-2.0": 12
    "BSD-3-Clause": 8
    "ISC": 2
    
  complianceStatus:
    compliant: 145
    needsReview: 8
    nonCompliant: 3
    
  riskAssessment:
    commercialRisk: "Low"
    copyleftRisk: "None"
    patentRisk: "Low"
    
  nonCompliantPackages:
    - package: "gpl-licensed-lib"
      license: "GPL-3.0"
      risk: "High"
      issue: "强制开源要求与商业项目冲突"
      recommendation: "寻找MIT许可的替代方案"
```

### 依赖更新计划
```yaml
updatePlan:
  immediate:
    - package: "minimist"
      from: "1.2.5"
      to: "1.2.6"
      reason: "Critical security vulnerability"
      risk: "Low"
      testing: "Regression testing required"
      
  scheduled:
    - package: "express"
      from: "4.18.1"
      to: "4.19.2"  
      reason: "Feature updates and bug fixes"
      risk: "Low"
      timeline: "Next sprint"
      
  deferred:
    - package: "react"
      from: "17.0.2"
      to: "18.2.0"
      reason: "Major version upgrade"
      risk: "High"
      timeline: "Next quarter"
      blockers: ["Breaking changes in components"]
```

## 语言特定依赖分析

### JavaScript/Node.js
- package.json和package-lock.json分析
- NPM registry安全检查
- Bundle size分析
- Tree-shaking效果评估

### Python
- requirements.txt和setup.py分析
- PyPI包安全扫描
- 虚拟环境依赖隔离
- Wheel和源码包区别

### Java
- Maven/Gradle依赖管理
- JAR包冲突检测
- 传递依赖排除策略
- 安全框架依赖审查

### Go
- go.mod和go.sum分析
- Module proxy安全
- Vendor目录管理
- 最小版本选择策略

### PHP
- Composer.json依赖分析
- Packagist安全扫描
- Autoloader性能影响
- 开发和生产依赖分离

## 依赖管理最佳实践

### 版本管理
- 语义化版本策略
- 锁文件版本控制
- 定期依赖更新
- 自动化安全更新

### 安全管理
- 定期漏洞扫描
- 安全补丁及时应用
- 依赖来源验证
- 私有registry使用

### 性能优化
- 依赖大小监控
- 懒加载策略
- Code splitting应用
- 生产优化构建

### 治理策略
- 依赖审批流程
- 许可证政策制定
- 技术债务管理
- 依赖生命周期管理

## 自动化工具集成

### 安全扫描工具
- **npm audit** - Node.js安全审计
- **Snyk** - 多语言漏洞扫描
- **OWASP Dependency Check** - 已知漏洞检测
- **GitHub Dependabot** - 自动化安全更新

### 分析工具
- **webpack-bundle-analyzer** - Bundle大小分析
- **depcheck** - 未使用依赖检测
- **bundlephobia** - NPM包大小影响
- **license-checker** - 许可证合规检查

## 分析流程

1. **依赖发现**: 扫描所有依赖声明文件
2. **关系构建**: 构建完整的依赖关系图
3. **安全扫描**: 检查已知安全漏洞
4. **版本分析**: 评估版本新旧和兼容性
5. **许可证审查**: 检查许可证合规性
6. **优化识别**: 发现优化和清理机会

## 监控和维护

### 持续监控
- 定期依赖健康检查
- 新漏洞自动通知
- 许可证变更监控
- 性能影响跟踪

### 维护策略
- 定期依赖清理
- 安全更新自动化
- 重大更新计划制定
- 依赖退役管理

## 输出格式

依赖分析报告应包含：
- 依赖健康度概览和评分
- 详细漏洞列表和修复建议
- 许可证合规性评估
- 具体优化建议和更新计划
- 依赖管理流程改进建议

## 注意事项

- 优先处理安全漏洞和合规风险
- 平衡功能需求与依赖复杂度
- 考虑团队技能和维护能力
- 建立可持续的依赖治理策略
- 关注依赖供应链安全风险