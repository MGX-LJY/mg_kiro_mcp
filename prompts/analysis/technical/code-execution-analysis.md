# Fix模式 - 代码执行分析模板

## 输入数据
**问题ID**: {{issueId}}
**解决方案设计**: {{solutionDesign}}
**目标文件路径**: {{targetFiles}}
**执行模式**: {{executionMode}}
**代码变更**: {{codeChanges}}
**项目上下文**: {{projectContext}}

## 分析目标

### 1. 执行前验证
- 验证代码变更的语法和逻辑正确性
- 检查代码变更与项目架构的一致性
- 确认所有依赖和导入的可用性
- 验证配置和环境变量的正确性

### 2. 精确代码应用
- 精确定位代码插入和修改的位置
- 确保代码变更不破坏现有逻辑结构
- 处理代码缩进、格式和风格的一致性
- 管理代码冲突和依赖关系

### 3. 实时验证检查
- 实时检查语法错误和编译问题
- 验证导入和依赖的正确解析
- 检查类型兼容性和接口一致性
- 确认配置文件的同步更新

### 4. 回滚和恢复机制
- 建立完整的文件备份和版本控制
- 设计快速回滚和恢复策略
- 维护变更历史和审计日志
- 确保数据和状态的一致性

## 输出要求

```json
{
  "codeExecution": {
    "preValidation": {
      "syntaxCheck": {
        "status": "passed|failed|warning",
        "errors": ["语法错误列表"],
        "warnings": ["警告信息列表"],
        "fixedIssues": ["自动修复的问题"]
      },
      "dependencyCheck": {
        "missingImports": ["缺失的导入"],
        "unresolvedDependencies": ["未解析的依赖"],
        "versionConflicts": ["版本冲突"],
        "resolution": "自动解析|手动处理|无法解析"
      },
      "architecturalConsistency": {
        "consistent": true|false,
        "violations": ["架构违规项"],
        "recommendations": ["改进建议"],
        "severity": "info|warning|error"
      }
    },
    "execution": {
      "appliedChanges": [
        {
          "file": "文件路径",
          "operation": "create|modify|delete|move",
          "lineRange": "起始行-结束行",
          "changeType": "addition|deletion|modification|replacement",
          "content": "变更内容摘要",
          "status": "success|failed|partial"
        }
      ],
      "backupInfo": {
        "backupPath": "备份路径",
        "timestamp": "备份时间戳",
        "checksum": "文件校验和",
        "recovery": "easy|moderate|complex"
      },
      "codeQuality": {
        "linting": {
          "passed": true|false,
          "newIssues": ["新增的代码质量问题"],
          "fixedIssues": ["修复的代码质量问题"],
          "score": "质量评分"
        },
        "formatting": {
          "consistent": true|false,
          "autoFormatted": true|false,
          "styleGuide": "遵循的样式指南"
        }
      }
    },
    "validation": {
      "compilationCheck": {
        "success": true|false,
        "errors": ["编译错误"],
        "warnings": ["编译警告"],
        "buildTime": "编译时间"
      },
      "unitTestResults": {
        "executed": true|false,
        "passed": 10,
        "failed": 0,
        "coverage": "测试覆盖率",
        "newTests": ["新增测试"],
        "brokenTests": ["失败测试"]
      },
      "integrationCheck": {
        "apiCompatibility": true|false,
        "serviceConnectivity": true|false,
        "dataIntegrity": true|false,
        "performanceImpact": "positive|neutral|negative"
      }
    },
    "monitoring": {
      "executionMetrics": {
        "duration": "执行时长",
        "memoryUsage": "内存使用",
        "cpuUsage": "CPU使用",
        "diskIO": "磁盘IO"
      },
      "errorTracking": {
        "errors": ["执行期间的错误"],
        "warnings": ["执行期间的警告"],
        "stackTraces": ["相关堆栈跟踪"],
        "logEntries": ["重要日志条目"]
      },
      "performanceBaseline": {
        "before": "修复前性能基准",
        "after": "修复后性能基准", 
        "improvement": "性能改进情况",
        "regression": "性能回归检查"
      }
    },
    "rollbackPlan": {
      "available": true|false,
      "mechanism": "git_revert|backup_restore|manual_undo",
      "estimatedTime": "回滚时间估算",
      "dataLoss": "potential|none|minimal",
      "rollbackSteps": [
        {
          "step": "回滚步骤",
          "command": "具体命令",
          "verification": "验证方法"
        }
      ]
    }
  }
}
```

## 特殊要求

### 精确代码定位
- **行级精度**: 精确到代码行的修改和插入
- **上下文保持**: 保持代码上下文和逻辑结构
- **缩进处理**: 自动处理代码缩进和格式化
- **注释保留**: 保留和维护相关代码注释

### 语言特定执行
- **JavaScript**: 处理async/await、模块导入、JSX语法
- **Python**: 处理缩进、装饰器、类型注解、虚拟环境
- **Java**: 处理包声明、访问修饰符、泛型、注解
- **Go**: 处理包管理、接口实现、并发代码、错误处理

### 安全执行保障
- **权限检查**: 验证文件访问和修改权限
- **沙箱执行**: 在隔离环境中进行代码验证
- **恶意代码检测**: 检查潜在的恶意代码模式
- **访问限制**: 限制对敏感文件和系统资源的访问

### 实时监控机制
- **进度跟踪**: 实时跟踪执行进度和状态
- **错误捕获**: 即时捕获和报告执行错误
- **性能监控**: 监控执行性能和资源使用
- **日志记录**: 详细记录执行过程和决策

### 质量保证检查
- **代码标准**: 确保符合项目代码标准和约定
- **最佳实践**: 应用语言和框架的最佳实践
- **安全编码**: 遵循安全编码原则和指南
- **文档同步**: 确保代码注释和文档的同步更新

## 分析重点

### 可靠性优先
- 确保代码执行的可靠性和稳定性
- 建立完善的错误处理和恢复机制
- 提供详细的执行日志和审计跟踪

### 最小影响原则
- 最小化代码变更对现有系统的影响
- 避免引入不必要的复杂性和依赖
- 保持代码的向后兼容性

### 验证驱动
- 每个执行步骤都有相应的验证机制
- 建立多层次的质量检验体系
- 确保修复效果可以被准确测量和验证