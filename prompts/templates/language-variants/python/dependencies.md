# Python依赖管理 - {{project_name}}

## 包管理器配置
- **工具**: {{package_manager}} (pip/poetry/pipenv)
- **Python**: >= {{min_python_version}}

## requirements.txt
```txt
{{web_framework}}=={{framework_version}}
{{orm_framework}}=={{orm_version}}
{{database_driver}}=={{db_version}}
requests=={{requests_version}}
python-dotenv=={{dotenv_version}}

# 开发依赖
pytest=={{pytest_version}}
black=={{black_version}}
flake8=={{flake8_version}}
```

## pyproject.toml (Poetry)
```toml
[tool.poetry]
name = "{{project_name}}"
version = "{{project_version}}"

[tool.poetry.dependencies]
python = "^{{python_version}}"
{{web_framework}} = "^{{framework_version}}"

[tool.poetry.group.dev.dependencies]
pytest = "^{{pytest_version}}"
black = "^{{black_version}}"
```

## 虚拟环境
```bash
# venv
python -m venv {{venv_name}}
source {{venv_name}}/bin/activate

# Poetry
poetry install
poetry shell
```

## 版本约束
| 约束符 | 含义 | 示例 |
|--------|------|------|
| == | 精确版本 | ==3.2.0 |
| >= | 最小版本 | >=2.25.0 |
| ~= | 兼容发布 | ~=2.0.0 |

## 安全扫描
```bash
pip-audit
safety check
bandit -r src/
```