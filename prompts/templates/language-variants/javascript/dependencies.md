# JavaScript依赖管理 - {{project_name}}

## 包管理器配置
- **工具**: {{package_manager}} (npm/yarn/pnpm)
- **Node.js**: >= {{min_node_version}}

## package.json
```json
{
  "name": "{{project_name}}",
  "version": "{{project_version}}",
  "type": "{{module_type}}",
  "engines": {
    "node": ">={{node_version}}"
  },
  "scripts": {
    "start": "{{start_command}}",
    "dev": "{{dev_command}}",
    "build": "{{build_command}}",
    "test": "{{test_command}}"
  }
}
```

## 核心依赖
| 包名 | 版本 | 用途 |
|------|------|------|
| {{web_framework}} | {{web_version}} | Web框架 |
| {{database_client}} | {{db_version}} | 数据库 |
| {{validation_lib}} | {{valid_version}} | 数据验证 |

## 开发依赖
```json
{
  "typescript": "{{ts_version}}",
  "eslint": "{{eslint_version}}",
  "prettier": "{{prettier_version}}",
  "jest": "{{jest_version}}"
}
```

## 版本管理
| 前缀 | 含义 | 示例 |
|------|------|------|
| ^ | 兼容版本 | ^1.2.3 |
| ~ | 补丁版本 | ~1.2.3 |
| 无 | 精确版本 | 1.2.3 |

## 安全检查
```bash
npm audit
npm audit fix
```