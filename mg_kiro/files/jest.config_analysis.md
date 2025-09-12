# Jest配置文件 (jest.config.js) 分析文档

## 概述
Jest测试框架的配置文件，专为mg_kiro MCP服务器项目优化，支持ES模块和异步测试。

## 核心配置

### 测试环境设置
- **testEnvironment**: `'node'` - Node.js环境，适合服务器端测试
- **testTimeout**: `30000ms` - 30秒超时，适应异步MCP操作

### 测试文件匹配
```javascript
testMatch: [
  '**/tests/**/*.test.js',    // 标准测试目录
  '**/tests/**/*.spec.js',    // 规格测试文件  
  '**/__tests__/**/*.js'      // Jest约定测试目录
]
```

### 性能优化
- **maxConcurrency**: `5` - 限制并发测试数，避免资源竞争
- **testPathIgnorePatterns**: 排除不必要的目录扫描

### 覆盖率配置
- 默认关闭覆盖率收集 (`collectCoverage: false`)
- 覆盖范围：`server/**/*.js` 和 `index.js`
- 自动排除测试文件和node_modules

### 环境设置
- **setupFilesAfterEnv**: 使用 `tests/setup.js` 进行测试环境初始化
- **verbose**: `true` - 详细输出测试结果

## 项目适配性

### MCP服务器测试特点
1. **异步操作密集**: 30秒超时适应MCP工具调用
2. **服务集成测试**: 覆盖server目录下的服务模块
3. **ES模块支持**: 配合项目的ES模块架构

### 测试策略
- 单元测试：服务模块独立测试
- 集成测试：MCP工具端到端测试  
- 性能测试：批次处理和大文件操作

这个配置为mg_kiro项目提供了完整的测试基础设施支持。