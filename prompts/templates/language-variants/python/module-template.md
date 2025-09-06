# {{module_name}} 模块 (Python)

## 基本信息
- **模块ID**: `{{module_id}}`
- **包名**: `{{package_name}}`
- **版本**: {{module_version}}
- **负责人**: {{module_owner}}
- **Python**: {{python_version}}

## 安装使用
```bash
pip install {{package_name}}
# 或
poetry add {{package_name}}
```

```python
from {{package_name}} import {{class_name}}
from {{package_name}}.{{submodule}} import {{function_name}}
```

## 主要功能
| 功能名称 | 描述 | 类型 | 状态 |
|---------|------|------|------|
| {{function1_name}} | {{function1_desc}} | {{function1_type}} | {{function1_status}} |
| {{function2_name}} | {{function2_desc}} | {{function2_type}} | {{function2_status}} |

## API接口
### {{api_endpoint}}
```python
@app.route('{{path}}', methods=['{{method}}'])
def {{handler_name}}():
    return jsonify({
        "{{field1}}": {{value1}},
        "{{field2}}": {{value2}}
    })
```

**参数**:
```python
{
    "{{param1}}": {{param1_type}},
    "{{param2}}": {{param2_type}}
}
```

## 数据模型
```python
class {{model_name}}(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    {{field1}} = db.Column(db.{{field1_type}}, {{field1_constraint}})
    {{field2}} = db.Column(db.{{field2_type}}, {{field2_constraint}})
```

## 依赖关系
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| {{dep1}} | {{dep1_version}} | {{dep1_purpose}} |
| {{dep2}} | {{dep2_version}} | {{dep2_purpose}} |

## 测试
```bash
pytest
pytest --cov={{module_name}}
pytest -v tests/
```

## 性能指标
| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 响应时间 | < {{target_latency}}ms | {{current_latency}}ms |
| 内存使用 | < {{target_memory}}MB | {{current_memory}}MB |