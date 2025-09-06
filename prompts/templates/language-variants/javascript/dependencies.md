# JavaScript/Node.js 依赖管理文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}  
> Node.js版本: {{node_version}}

## 概述

本文档管理JavaScript/Node.js项目的依赖关系，包括npm包、开发工具和运行时依赖。

### 包管理器
- **主要工具**: {{package_manager}} (npm/yarn/pnpm)
- **Node.js版本**: >= {{min_node_version}}
- **包管理器版本**: {{package_manager_version}}

## package.json 配置

### 基础信息
```json
{
  "name": "{{project_name}}",
  "version": "{{project_version}}",
  "description": "{{project_description}}",
  "main": "{{main_entry}}",
  "type": "{{module_type}}",
  "engines": {
    "node": ">={{node_version}}",
    "npm": ">={{npm_version}}"
  },
  "scripts": {
    "start": "{{start_command}}",
    "dev": "{{dev_command}}",
    "build": "{{build_command}}",
    "test": "{{test_command}}",
    "lint": "{{lint_command}}",
    "format": "{{format_command}}"
  }
}
```

## 生产依赖 (dependencies)

### Web框架
| 包名 | 版本 | 用途 | 类型 |
|------|------|------|------|
| {{web_framework}} | {{web_framework_version}} | Web服务器框架 | 框架 |
| {{middleware1}} | {{middleware1_version}} | {{middleware1_desc}} | 中间件 |
| {{middleware2}} | {{middleware2_version}} | {{middleware2_desc}} | 中间件 |

### 前端框架 (如果适用)
```json
{
  "react": "{{react_version}}",
  "react-dom": "{{react_dom_version}}",
  "react-router-dom": "{{react_router_version}}",
  "@reduxjs/toolkit": "{{redux_version}}",
  "react-redux": "{{react_redux_version}}"
}
```

### 数据库和ORM
```json
{
  "{{db_client}}": "{{db_client_version}}",
  "{{orm_framework}}": "{{orm_version}}",
  "{{migration_tool}}": "{{migration_version}}"
}
```

### 工具库
| 类别 | 包名 | 版本 | 说明 |
|------|------|------|------|
| HTTP客户端 | axios | {{axios_version}} | HTTP请求库 |
| 日期处理 | dayjs | {{dayjs_version}} | 轻量级日期库 |
| 验证 | joi / zod | {{validation_version}} | 数据验证 |
| 加密 | bcryptjs | {{bcrypt_version}} | 密码哈希 |
| JWT | jsonwebtoken | {{jwt_version}} | Token处理 |
| 环境变量 | dotenv | {{dotenv_version}} | 配置管理 |
| 日志 | winston | {{winston_version}} | 日志管理 |

## 开发依赖 (devDependencies)

### TypeScript支持
```json
{
  "typescript": "{{typescript_version}}",
  "@types/node": "{{types_node_version}}",
  "@types/express": "{{types_express_version}}",
  "ts-node": "{{ts_node_version}}",
  "tsx": "{{tsx_version}}"
}
```

### 代码质量工具
| 工具 | 版本 | 配置文件 | 用途 |
|------|------|---------|------|
| ESLint | {{eslint_version}} | .eslintrc.js | 代码检查 |
| Prettier | {{prettier_version}} | .prettierrc | 代码格式化 |
| Husky | {{husky_version}} | .husky/ | Git钩子 |
| lint-staged | {{lint_staged_version}} | package.json | 暂存区检查 |

### 测试框架
```json
{
  "jest": "{{jest_version}}",
  "@testing-library/react": "{{rtl_version}}",
  "@testing-library/jest-dom": "{{jest_dom_version}}",
  "supertest": "{{supertest_version}}",
  "cypress": "{{cypress_version}}"
}
```

### 构建工具
| 工具 | 版本 | 用途 | 配置 |
|------|------|------|------|
| {{bundler}} | {{bundler_version}} | 模块打包 | {{bundler_config}} |
| {{transpiler}} | {{transpiler_version}} | 代码转换 | {{transpiler_config}} |
| nodemon | {{nodemon_version}} | 开发热重载 | nodemon.json |

## 脚本配置

### package.json scripts
```json
{
  "scripts": {
    "start": "{{start_script}}",
    "dev": "{{dev_script}}",
    "build": "{{build_script}}",
    "test": "{{test_script}}",
    "test:watch": "{{test_watch_script}}",
    "test:coverage": "{{test_coverage_script}}",
    "lint": "{{lint_script}}",
    "lint:fix": "{{lint_fix_script}}",
    "format": "{{format_script}}",
    "type-check": "{{typecheck_script}}",
    "prepare": "{{prepare_script}}"
  }
}
```

### 预提交钩子
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## 版本管理策略

### 语义化版本规则
| 前缀 | 含义 | 示例 | 自动更新范围 |
|------|------|------|-------------|
| ^ | 兼容版本 | ^1.2.3 | 1.2.3 ≤ version < 2.0.0 |
| ~ | 补丁版本 | ~1.2.3 | 1.2.3 ≤ version < 1.3.0 |
| 无 | 精确版本 | 1.2.3 | 仅1.2.3 |

### Lock文件管理
```bash
# npm
npm-shrinkwrap.json    # 发布包使用
package-lock.json      # 项目使用

# yarn
yarn.lock             # Yarn v1/v2

# pnpm
pnpm-lock.yaml        # PNPM使用
```

## 安全管理

### 安全审计
```bash
# npm 安全检查
npm audit
npm audit fix
npm audit fix --force

# yarn 安全检查
yarn audit
yarn audit --level moderate

# pnpm 安全检查
pnpm audit
pnpm audit --fix
```

### 已知漏洞处理
| 包名 | 当前版本 | 漏洞等级 | 修复版本 | 状态 |
|------|---------|---------|---------|------|
| {{vuln_package1}} | {{vuln_current1}} | {{vuln_severity1}} | {{vuln_fix1}} | {{vuln_status1}} |

### 安全最佳实践
1. 定期运行 `npm audit` 检查漏洞
2. 使用 `.nvmrc` 锁定Node.js版本
3. 配置 `engines` 字段限制版本范围
4. 使用 `package-lock.json` 锁定依赖版本
5. 避免使用具有已知漏洞的包

## Node.js版本管理

### .nvmrc配置
```bash
# .nvmrc
{{node_version}}
```

### 版本兼容性
| Node.js版本 | 支持状态 | ES模块 | 原生测试 |
|-------------|----------|--------|----------|
| 18.x | ✅ 推荐 | ✅ | ✅ |
| 16.x | ✅ 支持 | ✅ | ❌ |
| 14.x | ⚠️ EOL | ❌ | ❌ |

## 性能优化

### 依赖分析
```bash
# 分析包大小
npm ls --depth=0
yarn why <package>
pnpm why <package>

# 查找重复包
npm ls --depth=0 --parseable | sort | uniq -d
npx npm-check-duplicates

# Bundle分析
npx webpack-bundle-analyzer dist/stats.json
```

### 优化建议
1. **Tree Shaking**: 使用ES模块，启用摇树优化
2. **代码分割**: 按需加载，减小初始bundle大小
3. **依赖替换**: 使用更轻量的替代品
4. **Peer Dependencies**: 正确使用peerDependencies

## CI/CD集成

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: '{{package_manager}}'
      - run: {{install_command}}
      - run: {{lint_command}}
      - run: {{test_command}}
      - run: {{build_command}}
```

### 缓存策略
```yaml
# 缓存node_modules
cache:
  paths:
    - node_modules/
    - ~/.npm/
    - ~/.yarn/cache/
    - ~/.cache/pnpm/
```

## 工具配置

### ESLint配置
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // 自定义规则
  }
};
```

### Prettier配置
```json
{
  "semi": {{semi}},
  "singleQuote": {{single_quote}},
  "tabWidth": {{tab_width}},
  "trailingComma": "{{trailing_comma}}",
  "printWidth": {{print_width}}
}
```

## 疑难解答

### 常见问题
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 模块找不到 | 路径错误或未安装 | 检查import路径，重新安装 |
| 版本冲突 | peer dependency不匹配 | 调整版本或使用resolutions |
| 构建失败 | 依赖版本不兼容 | 检查Node.js版本，更新依赖 |
| 内存溢出 | 构建时内存不足 | 增加Node.js内存限制 |

### 调试命令
```bash
# 查看依赖树
npm ls --depth=2
yarn list --depth=2

# 检查过时的包
npm outdated
yarn outdated

# 清理缓存
npm cache clean --force
yarn cache clean
pnpm store prune
```

## 相关文档

- [系统架构 - JavaScript版](./system-architecture.md)
- [模块模板 - JavaScript版](./module-template.md)
- [Node.js最佳实践](https://nodejs.org/en/docs/guides/)
- [npm文档](https://docs.npmjs.com/)
- [Package.json字段说明](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)

---

*本文档由 mg_kiro MCP 系统根据JavaScript/Node.js项目特征自动生成*