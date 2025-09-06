# {{module_name}} 模块 (JavaScript)

## 基本信息
- **模块ID**: `{{module_id}}`
- **NPM包名**: `{{npm_package_name}}`
- **版本**: {{module_version}}
- **负责人**: {{module_owner}}
- **Node.js**: {{node_version}}

## 安装使用
```bash
npm install {{npm_package_name}}
```

```javascript
// ES模块
import { {{export_name}} } from '{{npm_package_name}}';

// CommonJS
const { {{export_name}} } = require('{{npm_package_name}}');
```

## 主要功能
| 功能名称 | 描述 | 类型 | 状态 |
|---------|------|------|------|
| {{function1_name}} | {{function1_desc}} | {{function1_type}} | {{function1_status}} |
| {{function2_name}} | {{function2_desc}} | {{function2_type}} | {{function2_status}} |

## API接口
### {{api_endpoint}}
```javascript
app.{{method}}('{{path}}', {{handler_name}});
```

**参数**:
```javascript
{
  "{{param1}}": "{{param1_type}}",
  "{{param2}}": "{{param2_type}}"
}
```

**返回**:
```javascript
{
  "success": boolean,
  "data": {{data_type}}
}
```

## 依赖关系
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| {{dep1}} | {{dep1_version}} | {{dep1_purpose}} |
| {{dep2}} | {{dep2_version}} | {{dep2_purpose}} |

## 测试
```bash
npm test
npm run test:watch
npm run test:coverage
```

## 性能指标
| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 响应时间 | < {{target_latency}}ms | {{current_latency}}ms |
| 内存使用 | < {{target_memory}}MB | {{current_memory}}MB |