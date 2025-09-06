# Python 依赖管理文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}  
> Python版本: {{python_version}}

## 概述

本文档管理Python项目的依赖关系，包括包管理、虚拟环境和构建工具。

### 包管理器
- **主要工具**: {{package_manager}} (pip/conda/poetry/pipenv)
- **Python版本**: >= {{min_python_version}}
- **虚拟环境**: {{venv_tool}} (venv/conda/virtualenv)

## 依赖配置文件

### requirements.txt (pip)
```txt
# 生产依赖 - 精确版本锁定
{{web_framework}}=={{framework_version}}
{{orm_framework}}=={{orm_version}}
{{database_driver}}=={{db_driver_version}}

# 开发依赖
pytest=={{pytest_version}}
black=={{black_version}}
flake8=={{flake8_version}}
mypy=={{mypy_version}}

# 条件依赖
{{conditional_dep}}=={{cond_version}}; python_version >= "3.8"
{{platform_dep}}=={{platform_version}}; sys_platform == "linux"
```

### pyproject.toml (Poetry/现代Python)
```toml
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.poetry]
name = "{{project_name}}"
version = "{{project_version}}"
description = "{{project_description}}"
authors = ["{{author_name}} <{{author_email}}>"]
license = "{{license}}"
readme = "README.md"
homepage = "{{homepage_url}}"
repository = "{{repository_url}}"
keywords = {{project_keywords}}
classifiers = {{project_classifiers}}

[tool.poetry.dependencies]
python = "^{{python_version}}"
{{web_framework}} = "^{{framework_version}}"
{{orm_framework}} = "^{{orm_version}}"
{{database_driver}} = "^{{db_driver_version}}"
requests = "^{{requests_version}}"
pydantic = "^{{pydantic_version}}"
python-dotenv = "^{{dotenv_version}}"

# 可选依赖组
[tool.poetry.group.dev.dependencies]
pytest = "^{{pytest_version}}"
pytest-cov = "^{{pytest_cov_version}}"
black = "^{{black_version}}"
isort = "^{{isort_version}}"
flake8 = "^{{flake8_version}}"
mypy = "^{{mypy_version}}"
pre-commit = "^{{precommit_version}}"

[tool.poetry.group.docs.dependencies]
mkdocs = "^{{mkdocs_version}}"
mkdocs-material = "^{{mkdocs_material_version}}"

[tool.poetry.scripts]
{{project_name}} = "{{module_name}}.main:app"
```

### setup.py (传统方式)
```python
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="{{project_name}}",
    version="{{project_version}}",
    author="{{author_name}}",
    author_email="{{author_email}}",
    description="{{project_description}}",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="{{repository_url}}",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers={{project_classifiers}},
    python_requires=">=3.{{min_python_minor}}",
    install_requires=requirements,
    extras_require={
        "dev": ["pytest", "black", "flake8", "mypy"],
        "docs": ["sphinx", "sphinx-rtd-theme"],
        "test": ["pytest", "pytest-cov", "tox"]
    },
    entry_points={
        "console_scripts": [
            "{{project_name}}={{module_name}}.main:main",
        ],
    },
)
```

## 生产依赖

### Web框架
| 包名 | 版本 | 用途 | 生态系统 |
|------|------|------|----------|
| {{web_framework}} | {{framework_version}} | Web框架 | {{framework_ecosystem}} |
| {{template_engine}} | {{template_version}} | 模板引擎 | 前端渲染 |
| {{middleware_package}} | {{middleware_version}} | 中间件 | 请求处理 |

#### Django生态 (如果适用)
```txt
Django=={{django_version}}
djangorestframework=={{drf_version}}
django-cors-headers=={{cors_version}}
django-environ=={{environ_version}}
celery=={{celery_version}}
redis=={{redis_version}}
psycopg2-binary=={{psycopg2_version}}
```

#### FastAPI生态 (如果适用)
```txt
fastapi=={{fastapi_version}}
uvicorn[standard]=={{uvicorn_version}}
pydantic=={{pydantic_version}}
sqlalchemy=={{sqlalchemy_version}}
alembic=={{alembic_version}}
python-multipart=={{multipart_version}}
python-jose[cryptography]=={{jose_version}}
passlib[bcrypt]=={{passlib_version}}
```

#### Flask生态 (如果适用)
```txt
Flask=={{flask_version}}
Flask-SQLAlchemy=={{flask_sqlalchemy_version}}
Flask-Migrate=={{flask_migrate_version}}
Flask-JWT-Extended=={{flask_jwt_version}}
Flask-CORS=={{flask_cors_version}}
gunicorn=={{gunicorn_version}}
```

### 数据库和ORM
| 类型 | 包名 | 版本 | 说明 |
|------|------|------|------|
| ORM | {{orm_package}} | {{orm_version}} | 对象关系映射 |
| PostgreSQL | psycopg2-binary | {{psycopg2_version}} | PostgreSQL驱动 |
| MySQL | pymysql | {{pymysql_version}} | MySQL驱动 |
| SQLite | - | 内置 | 轻量级数据库 |
| Redis | redis | {{redis_version}} | 缓存和消息队列 |
| MongoDB | pymongo | {{pymongo_version}} | 文档数据库驱动 |

### 核心工具库
```toml
# HTTP客户端
requests = "^{{requests_version}}"
httpx = "^{{httpx_version}}"          # 异步HTTP客户端
aiohttp = "^{{aiohttp_version}}"      # 异步Web框架

# 数据处理
pandas = "^{{pandas_version}}"        # 数据分析
numpy = "^{{numpy_version}}"          # 数值计算
pydantic = "^{{pydantic_version}}"    # 数据验证

# 异步支持
asyncio-mqtt = "^{{mqtt_version}}"    # 异步MQTT
aioredis = "^{{aioredis_version}}"    # 异步Redis

# 配置管理
python-dotenv = "^{{dotenv_version}}" # 环境变量
pyyaml = "^{{yaml_version}}"          # YAML解析
```

## 开发依赖

### 代码质量工具
| 工具 | 版本 | 配置文件 | 用途 |
|------|------|---------|------|
| black | {{black_version}} | pyproject.toml | 代码格式化 |
| isort | {{isort_version}} | .isort.cfg | 导入排序 |
| flake8 | {{flake8_version}} | setup.cfg | 代码检查 |
| pylint | {{pylint_version}} | .pylintrc | 代码分析 |
| mypy | {{mypy_version}} | mypy.ini | 类型检查 |
| bandit | {{bandit_version}} | .bandit | 安全检查 |

### 测试框架
```toml
[tool.poetry.group.test.dependencies]
pytest = "^{{pytest_version}}"
pytest-cov = "^{{pytest_cov_version}}"
pytest-asyncio = "^{{pytest_asyncio_version}}"
pytest-mock = "^{{pytest_mock_version}}"
pytest-xdist = "^{{pytest_xdist_version}}"     # 并行测试
factory-boy = "^{{factory_boy_version}}"       # 测试数据工厂
faker = "^{{faker_version}}"                   # 假数据生成
```

### 开发工具
```toml
[tool.poetry.group.dev.dependencies]
pre-commit = "^{{precommit_version}}"          # Git钩子
commitizen = "^{{commitizen_version}}"         # 提交规范
jupyter = "^{{jupyter_version}}"               # 交互式开发
ipython = "^{{ipython_version}}"              # 增强REPL
python-dotenv = "^{{dotenv_version}}"         # 环境变量加载
```

## 虚拟环境管理

### venv (Python标准库)
```bash
# 创建虚拟环境
python -m venv {{venv_name}}

# 激活虚拟环境 (Linux/Mac)
source {{venv_name}}/bin/activate

# 激活虚拟环境 (Windows)
{{venv_name}}\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 导出依赖
pip freeze > requirements.txt

# 退出虚拟环境
deactivate
```

### conda
```bash
# 创建环境
conda create -n {{env_name}} python={{python_version}}

# 激活环境
conda activate {{env_name}}

# 从environment.yml安装
conda env create -f environment.yml

# 导出环境
conda env export > environment.yml

# 列出环境
conda env list
```

#### environment.yml示例
```yaml
name: {{project_name}}
channels:
  - conda-forge
  - defaults
dependencies:
  - python={{python_version}}
  - {{conda_package1}}={{version1}}
  - {{conda_package2}}={{version2}}
  - pip
  - pip:
    - {{pip_package1}}=={{pip_version1}}
    - {{pip_package2}}=={{pip_version2}}
```

### Poetry
```bash
# 初始化项目
poetry init

# 安装依赖
poetry install

# 添加依赖
poetry add {{package_name}}
poetry add --group dev {{dev_package}}

# 更新依赖
poetry update

# 显示依赖树
poetry show --tree

# 激活虚拟环境
poetry shell

# 运行命令
poetry run python app.py
```

### pipenv
```bash
# 安装依赖
pipenv install

# 安装开发依赖
pipenv install --dev

# 激活环境
pipenv shell

# 运行命令
pipenv run python app.py

# 生成requirements.txt
pipenv requirements > requirements.txt
```

## 版本管理策略

### 语义化版本
```python
# version.py
__version__ = "{{major}}.{{minor}}.{{patch}}"
__version_info__ = ({{major}}, {{minor}}, {{patch}})

# 版本兼容性检查
import sys
if sys.version_info < (3, {{min_minor}}):
    raise RuntimeError("Python 3.{{min_minor}}+ is required")
```

### 依赖版本约束
| 约束符号 | 含义 | 示例 | 允许范围 |
|----------|------|------|----------|
| == | 精确版本 | Django==3.2.0 | 仅3.2.0 |
| >= | 最小版本 | requests>=2.25.0 | 2.25.0及以上 |
| ~= | 兼容发布 | Flask~=2.0.0 | >=2.0.0, <2.1.0 |
| ^ | 插入符号 | fastapi^0.68.0 | >=0.68.0, <1.0.0 |

## 安全管理

### 安全扫描工具
```bash
# pip-audit - 依赖漏洞扫描
pip install pip-audit
pip-audit

# safety - 已知漏洞检查
pip install safety
safety check

# bandit - 代码安全检查
pip install bandit
bandit -r src/

# semgrep - 静态分析
pip install semgrep
semgrep --config=auto src/
```

### 已知漏洞处理
| 包名 | 当前版本 | 漏洞ID | 严重程度 | 修复版本 |
|------|---------|--------|---------|---------|
| {{vuln_package1}} | {{vuln_current1}} | {{cve1}} | {{severity1}} | {{fix1}} |
| {{vuln_package2}} | {{vuln_current2}} | {{cve2}} | {{severity2}} | {{fix2}} |

### 安全最佳实践
1. 定期运行 `pip-audit` 和 `safety check`
2. 使用 `bandit` 检查代码安全问题
3. 配置 `.python-version` 或 `runtime.txt` 锁定Python版本
4. 使用虚拟环境隔离依赖
5. 定期更新依赖到最新安全版本

## Python版本管理

### pyenv配置
```bash
# 安装特定Python版本
pyenv install {{python_version}}

# 设置全局版本
pyenv global {{python_version}}

# 设置项目版本
pyenv local {{python_version}}

# .python-version文件
echo "{{python_version}}" > .python-version
```

### 版本兼容性
| Python版本 | 支持状态 | EOL日期 | 推荐用途 |
|-----------|----------|---------|----------|
| 3.11 | ✅ 最新 | 2027-10 | 新项目首选 |
| 3.10 | ✅ 稳定 | 2026-10 | 生产环境 |
| 3.9 | ✅ 维护 | 2025-10 | 兼容需求 |
| 3.8 | ⚠️ EOL | 2024-10 | 遗留系统 |

## 性能优化

### 依赖分析
```bash
# 分析安装包大小
pip list --format=freeze | xargs pip show | grep -E "Name|Size"

# 检查依赖树
pipdeptree
pipdeptree --packages {{package_name}}

# 找出未使用的依赖
pip-autoremove -y

# 查找过时的包
pip list --outdated
```

### 轻量化策略
```txt
# 选择轻量级替代品
requests-cache      # 替代 requests + cache
httpx              # 替代 requests (异步支持)
orjson             # 替代 json (更快)
uvloop             # 替代默认事件循环
pydantic           # 替代 marshmallow (更快验证)
```

## CI/CD集成

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.8, 3.9, "3.10", "3.11"]
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Lint with flake8
      run: flake8 src tests
    
    - name: Type check with mypy
      run: mypy src
    
    - name: Test with pytest
      run: pytest --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### tox配置
```ini
# tox.ini
[tox]
envlist = py38,py39,py310,py311,flake8,mypy
isolated_build = true

[testenv]
deps = 
    pytest
    pytest-cov
commands = 
    pytest {posargs}

[testenv:flake8]
deps = flake8
commands = flake8 src tests

[testenv:mypy]
deps = mypy
commands = mypy src

[testenv:coverage]
deps = 
    pytest
    pytest-cov
commands = 
    pytest --cov=src --cov-report=html --cov-report=term
```

## 工具配置

### 代码格式化 (pyproject.toml)
```toml
[tool.black]
line-length = {{line_length}}
target-version = ['py{{python_minor}}']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = {{line_length}}
known_first_party = ["{{module_name}}"]

[tool.mypy]
python_version = "{{python_version}}"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### pytest配置
```toml
[tool.pytest.ini_options]
minversion = "6.0"
addopts = [
    "--strict-markers",
    "--strict-config",
    "--cov={{module_name}}",
    "--cov-report=term-missing:skip-covered",
    "--cov-report=html",
    "--cov-report=xml",
    "--cov-fail-under={{coverage_threshold}}"
]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests"
]
```

## 疑难解答

### 常见问题
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| ModuleNotFoundError | 包未安装或环境问题 | 检查虚拟环境，重新安装 |
| 版本冲突 | 依赖版本不兼容 | 使用pip-tools解决依赖 |
| 构建失败 | 缺少系统依赖 | 安装build-essential |
| ImportError | Python路径问题 | 检查PYTHONPATH设置 |

### 调试命令
```bash
# 检查Python环境
python --version
which python
echo $PYTHONPATH

# 检查pip环境
pip --version
pip list
pip show {{package_name}}

# 检查依赖冲突
pip check
pipdeptree --warn=conflict

# 清理缓存
pip cache purge
poetry cache clear --all pypi
```

## 相关文档

- [Python系统架构](./system-architecture.md)
- [Python模块模板](./module-template.md)
- [Python官方打包指南](https://packaging.python.org/)
- [Poetry文档](https://python-poetry.org/docs/)
- [pip文档](https://pip.pypa.io/en/stable/)

---

*本文档由 mg_kiro MCP 系统根据Python项目特征自动生成*