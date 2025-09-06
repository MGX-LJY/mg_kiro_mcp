# Python 模块文档 - {{module_name}}

> 模块版本: {{module_version}}  
> 更新日期: {{timestamp}}  
> 负责人: {{module_owner}}  
> 状态: {{module_status}}  
> Python版本: {{python_version}}

## 模块概述

### 基本信息
- **模块名**: `{{module_name}}`
- **包名**: `{{package_name}}`
- **模块类型**: {{module_type}} (库/应用/框架)
- **Python版本要求**: >= {{min_python_version}}
- **PyPI发布**: {{pypi_published}}

### 模块描述
{{module_description}}

### 安装和导入
```bash
# 使用pip安装
pip install {{package_name}}

# 使用poetry安装
poetry add {{package_name}}

# 开发模式安装
pip install -e .
```

```python
# 基本导入
from {{module_name}} import {{main_class}}
from {{module_name}}.{{submodule}} import {{function_name}}

# 别名导入
import {{module_name}} as {{alias}}
```

## 功能定义

### 核心API

#### 1. {{primary_class}}类
**描述**: {{class_description}}

**类定义**:
```python
class {{primary_class}}:
    """{{class_docstring}}
    
    Args:
        {{arg1}} ({{type1}}): {{arg1_desc}}
        {{arg2}} ({{type2}}, optional): {{arg2_desc}}
    
    Attributes:
        {{attr1}} ({{attr_type1}}): {{attr1_desc}}
        {{attr2}} ({{attr_type2}}): {{attr2_desc}}
    
    Example:
        >>> {{instance}} = {{primary_class}}({{example_args}})
        >>> {{instance}}.{{method_name}}()
        {{example_output}}
    """
    
    def __init__(self, {{init_params}}) -> None:
        self.{{attr1}} = {{attr1}}
        self.{{attr2}} = {{attr2}}
    
    def {{method_name}}(self, {{method_params}}) -> {{return_type}}:
        """{{method_description}}
        
        Args:
            {{param1}} ({{param1_type}}): {{param1_desc}}
            {{param2}} ({{param2_type}}, optional): {{param2_desc}}
        
        Returns:
            {{return_type}}: {{return_desc}}
        
        Raises:
            {{ExceptionType}}: {{exception_desc}}
        
        Example:
            >>> result = {{instance}}.{{method_name}}({{example_input}})
            >>> print(result)
            {{example_result}}
        """
        # 实现逻辑
        pass
```

#### 2. {{utility_function}}函数
**描述**: {{function_description}}

**函数签名**:
```python
def {{utility_function}}(
    {{param1}}: {{param1_type}},
    {{param2}}: {{param2_type}} = {{default_value}},
    *{{args_name}}: {{args_type}},
    **{{kwargs_name}}: {{kwargs_type}}
) -> {{return_type}}:
    """{{function_docstring}}
    
    Args:
        {{param1}}: {{param1_desc}}
        {{param2}}: {{param2_desc}} (默认: {{default_value}})
        *{{args_name}}: {{args_desc}}
        **{{kwargs_name}}: {{kwargs_desc}}
    
    Returns:
        {{return_desc}}
    
    Raises:
        ValueError: 当{{error_condition1}}时
        TypeError: 当{{error_condition2}}时
        {{CustomException}}: 当{{error_condition3}}时
    
    Example:
        >>> result = {{utility_function}}({{example_params}})
        >>> assert result == {{expected_result}}
    """
    # 实现代码
    pass
```

### 异步支持 (如果适用)

#### 异步方法
```python
import asyncio
from typing import AsyncGenerator, Awaitable

class {{AsyncClass}}:
    """异步操作类"""
    
    async def {{async_method}}(self, {{params}}) -> {{return_type}}:
        """异步{{method_description}}"""
        async with aiohttp.ClientSession() as session:
            async with session.get({{url}}) as response:
                return await response.json()
    
    async def {{async_generator}}(self, {{params}}) -> AsyncGenerator[{{yield_type}}, None]:
        """异步生成器"""
        for item in {{iterable}}:
            result = await self.{{process_item}}(item)
            yield result
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self.{{setup_method}}()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self.{{cleanup_method}}()

# 使用示例
async def main():
    async with {{AsyncClass}}() as client:
        result = await client.{{async_method}}({{params}})
        
        async for item in client.{{async_generator}}({{params}}):
            print(item)

# 运行异步函数
asyncio.run(main())
```

## 包结构

### 目录组织
```
{{module_name}}/
├── {{module_name}}/           # 主包目录
│   ├── __init__.py           # 包初始化文件
│   ├── {{core_module}}.py    # 核心模块
│   ├── {{utils_module}}.py   # 工具模块
│   ├── {{config_module}}.py  # 配置模块
│   ├── {{exceptions}}.py     # 自定义异常
│   ├── {{subpackage}}/       # 子包
│   │   ├── __init__.py
│   │   ├── {{feature1}}.py
│   │   └── {{feature2}}.py
│   └── py.typed              # 类型标记文件
├── tests/                    # 测试目录
│   ├── __init__.py
│   ├── test_{{core}}.py
│   ├── test_{{utils}}.py
│   ├── fixtures/             # 测试固件
│   └── conftest.py           # pytest配置
├── docs/                     # 文档目录
│   ├── conf.py              # Sphinx配置
│   ├── index.rst            # 主文档
│   └── api.rst              # API文档
├── examples/                 # 示例代码
├── pyproject.toml           # 项目配置
├── setup.py                 # 安装脚本(兼容)
├── requirements.txt         # 依赖文件
├── requirements-dev.txt     # 开发依赖
├── MANIFEST.in             # 打包清单
├── README.md               # 说明文档
├── LICENSE                 # 许可证
└── CHANGELOG.md            # 变更日志
```

### __init__.py配置
```python
# {{module_name}}/__init__.py
"""{{module_name}} - {{module_description}}

{{detailed_description}}

Example:
    >>> from {{module_name}} import {{main_class}}
    >>> {{instance}} = {{main_class}}()
    >>> result = {{instance}}.{{method}}()
"""

# 版本信息
__version__ = "{{module_version}}"
__author__ = "{{author_name}}"
__email__ = "{{author_email}}"
__license__ = "{{license}}"

# 主要导入
from .{{core_module}} import {{main_class}}, {{main_function}}
from .{{utils_module}} import {{utility_class}}, {{utility_function}}
from .{{exceptions}} import {{CustomException}}, {{AnotherException}}

# 公开API
__all__ = [
    # 类
    "{{main_class}}",
    "{{utility_class}}",
    
    # 函数
    "{{main_function}}",
    "{{utility_function}}",
    
    # 异常
    "{{CustomException}}",
    "{{AnotherException}}",
    
    # 常量
    "{{CONSTANT_NAME}}",
]

# 模块级常量
{{CONSTANT_NAME}} = {{constant_value}}

# 废弃警告
import warnings
warnings.filterwarnings("default", category=DeprecationWarning, module=__name__)

def {{deprecated_function}}(*args, **kwargs):
    warnings.warn(
        "{{deprecated_function}} is deprecated, use {{new_function}} instead",
        DeprecationWarning,
        stacklevel=2
    )
    return {{new_function}}(*args, **kwargs)
```

### 项目配置 (pyproject.toml)
```toml
[build-system]
requires = ["setuptools>=45", "wheel", "setuptools_scm>=6.2"]
build-backend = "setuptools.build_meta"

[project]
name = "{{package_name}}"
version = "{{module_version}}"
description = "{{short_description}}"
readme = "README.md"
requires-python = ">={{min_python_version}}"
license = {text = "{{license}}"}
authors = [
    {name = "{{author_name}}", email = "{{author_email}}"}
]
maintainers = [
    {name = "{{maintainer_name}}", email = "{{maintainer_email}}"}
]
keywords = {{keywords_list}}
classifiers = [
    "Development Status :: {{dev_status}}",
    "Intended Audience :: {{audience}}",
    "License :: OSI Approved :: {{license_classifier}}",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Topic :: {{topic_category}}",
    "Typing :: Typed"
]
dependencies = [
    "{{dependency1}}>={{version1}}",
    "{{dependency2}}>={{version2}},<{{max_version2}}",
    "{{conditional_dep}}>={{version3}}; python_version>='3.9'"
]

[project.optional-dependencies]
dev = [
    "pytest>={{pytest_version}}",
    "pytest-cov>={{pytest_cov_version}}",
    "black>={{black_version}}",
    "isort>={{isort_version}}",
    "mypy>={{mypy_version}}",
    "flake8>={{flake8_version}}"
]
docs = [
    "sphinx>={{sphinx_version}}",
    "sphinx-rtd-theme>={{theme_version}}"
]
test = [
    "pytest>={{pytest_version}}",
    "pytest-asyncio>={{pytest_asyncio_version}}",
    "pytest-mock>={{pytest_mock_version}}",
    "factory-boy>={{factory_boy_version}}"
]

[project.urls]
Homepage = "{{homepage_url}}"
Documentation = "{{docs_url}}"
Repository = "{{repo_url}}"
Changelog = "{{changelog_url}}"
"Bug Tracker" = "{{issues_url}}"

[project.scripts]
{{cli_name}} = "{{module_name}}.cli:main"

[project.entry-points."{{entry_point_group}}"]
{{plugin_name}} = "{{module_name}}.{{plugin_module}}:{{plugin_class}}"

# 工具配置
[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]

[tool.setuptools.package-data]
{{module_name}} = ["py.typed", "*.pyi"]

# 测试配置
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--cov={{module_name}}",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-report=xml"
]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests"
]

# 代码格式化
[tool.black]
line-length = {{line_length}}
target-version = ['py38', 'py39', 'py310', 'py311']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = {{line_length}}
known_first_party = ["{{module_name}}"]

# 类型检查
[tool.mypy]
python_version = "{{python_version}}"
warn_return_any = true
warn_unused_configs = true
show_error_codes = true
```

## 数据模型 (如果适用)

### Pydantic模型
```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List, Dict, Union
from datetime import datetime
from enum import Enum

class {{StatusEnum}}(str, Enum):
    """状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class {{BaseModel}}(BaseModel):
    """基础数据模型"""
    
    id: Optional[int] = Field(None, description="唯一标识符")
    name: str = Field(..., min_length=1, max_length=100, description="名称")
    description: Optional[str] = Field(None, max_length=500, description="描述")
    status: {{StatusEnum}} = Field({{StatusEnum}}.ACTIVE, description="状态")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    metadata: Dict[str, Union[str, int, float]] = Field(default_factory=dict)
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    @validator('name')
    def name_must_be_alphanumeric(cls, v):
        """验证名称格式"""
        if not v.replace(' ', '').replace('-', '').replace('_', '').isalnum():
            raise ValueError('Name must be alphanumeric')
        return v.strip()
    
    @validator('tags')
    def validate_tags(cls, v):
        """验证标签"""
        return [tag.strip().lower() for tag in v if tag.strip()]
    
    @root_validator
    def validate_dates(cls, values):
        """验证日期关系"""
        created_at = values.get('created_at')
        updated_at = values.get('updated_at')
        
        if created_at and updated_at and updated_at < created_at:
            raise ValueError('updated_at must be after created_at')
        
        return values
    
    class Config:
        # 配置选项
        use_enum_values = True
        validate_assignment = True
        extra = "forbid"
        schema_extra = {
            "example": {
                "name": "示例名称",
                "description": "这是一个示例",
                "status": "active",
                "tags": ["tag1", "tag2"],
                "metadata": {"key": "value"}
            }
        }
```

### SQLAlchemy模型 (如果适用)
```python
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

Base = declarative_base()

class {{ModelName}}(Base):
    """{{model_description}}"""
    
    __tablename__ = '{{table_name}}'
    
    # 主键
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # 基本字段
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # JSON字段
    metadata_ = Column('metadata', JSON, default=dict, nullable=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 外键关系
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="{{related_field}}")
    
    def __repr__(self) -> str:
        return f"<{{ModelName}}(id={self.id}, name='{self.name}')>"
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'metadata': self.metadata_,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
```

## 自定义异常

### 异常层次结构
```python
# {{module_name}}/exceptions.py
"""{{module_name}}自定义异常模块"""

class {{ModuleName}}Error(Exception):
    """{{module_name}}基础异常类
    
    所有{{module_name}}相关异常的基类
    """
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
    
    def __str__(self) -> str:
        if self.details:
            return f"{self.message} (Code: {self.error_code}, Details: {self.details})"
        return f"{self.message} (Code: {self.error_code})"

class {{ValidationError}}({{ModuleName}}Error):
    """数据验证错误"""
    pass

class {{ConnectionError}}({{ModuleName}}Error):
    """连接错误"""
    pass

class {{AuthenticationError}}({{ModuleName}}Error):
    """认证错误"""
    pass

class {{PermissionError}}({{ModuleName}}Error):
    """权限错误"""
    pass

class {{ConfigurationError}}({{ModuleName}}Error):
    """配置错误"""
    pass

class {{TimeoutError}}({{ModuleName}}Error):
    """超时错误"""
    pass

# 异常处理装饰器
import functools
from typing import Callable, Type, Union

def handle_exceptions(
    *exception_types: Type[Exception],
    default_return=None,
    reraise_as: Type[Exception] = None
):
    """异常处理装饰器"""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except exception_types as e:
                if reraise_as:
                    raise reraise_as(f"Error in {func.__name__}: {str(e)}") from e
                return default_return
        return wrapper
    return decorator
```

## 测试

### 单元测试
```python
# tests/test_{{core_module}}.py
import pytest
from unittest.mock import Mock, patch, AsyncMock
from {{module_name}} import {{main_class}}, {{main_function}}
from {{module_name}}.exceptions import {{ValidationError}}

class Test{{MainClass}}:
    """{{main_class}}类的测试"""
    
    @pytest.fixture
    def {{instance_name}}(self):
        """创建测试实例"""
        return {{main_class}}({{test_params}})
    
    def test_init_with_valid_params(self):
        """测试正常初始化"""
        instance = {{main_class}}({{valid_params}})
        assert instance.{{attribute}} == {{expected_value}}
    
    def test_init_with_invalid_params(self):
        """测试异常参数初始化"""
        with pytest.raises({{ValidationError}}):
            {{main_class}}({{invalid_params}})
    
    def test_{{method_name}}_success(self, {{instance_name}}):
        """测试方法成功执行"""
        result = {{instance_name}}.{{method_name}}({{method_params}})
        assert result == {{expected_result}}
    
    def test_{{method_name}}_with_mock(self, {{instance_name}}):
        """测试使用Mock"""
        with patch('{{module_name}}.{{dependency}}') as mock_dep:
            mock_dep.return_value = {{mock_return}}
            result = {{instance_name}}.{{method_name}}({{params}})
            
            mock_dep.assert_called_once_with({{expected_call_args}})
            assert result == {{expected_result}}
    
    @pytest.mark.parametrize("input_val,expected", [
        ({{input1}}, {{expected1}}),
        ({{input2}}, {{expected2}}),
        ({{input3}}, {{expected3}}),
    ])
    def test_{{method_name}}_parametrized(self, {{instance_name}}, input_val, expected):
        """参数化测试"""
        result = {{instance_name}}.{{method_name}}(input_val)
        assert result == expected

# 异步测试
class Test{{AsyncClass}}:
    """异步类测试"""
    
    @pytest.mark.asyncio
    async def test_{{async_method}}(self):
        """测试异步方法"""
        instance = {{AsyncClass}}()
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.json.return_value = {{mock_json_response}}
            mock_get.return_value.__aenter__.return_value = mock_response
            
            result = await instance.{{async_method}}({{params}})
            assert result == {{expected_async_result}}
```

### 集成测试
```python
# tests/test_integration.py
import pytest
import tempfile
import os
from {{module_name}} import {{main_class}}

class TestIntegration:
    """集成测试"""
    
    @pytest.fixture
    def temp_dir(self):
        """创建临时目录"""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir
    
    @pytest.fixture
    def test_data(self):
        """测试数据"""
        return {{test_data_dict}}
    
    def test_end_to_end_workflow(self, temp_dir, test_data):
        """端到端工作流测试"""
        # 设置
        config_file = os.path.join(temp_dir, 'config.json')
        with open(config_file, 'w') as f:
            json.dump(test_data, f)
        
        # 执行
        instance = {{main_class}}(config_file=config_file)
        result = instance.{{process_method}}()
        
        # 验证
        assert result['status'] == 'success'
        assert len(result['items']) == {{expected_count}}
        
        # 检查输出文件
        output_file = os.path.join(temp_dir, 'output.json')
        assert os.path.exists(output_file)

# 性能测试
class TestPerformance:
    """性能测试"""
    
    @pytest.mark.slow
    def test_{{method_name}}_performance(self):
        """性能测试"""
        import time
        
        instance = {{main_class}}()
        large_data = {{generate_large_data}}
        
        start_time = time.time()
        result = instance.{{method_name}}(large_data)
        end_time = time.time()
        
        execution_time = end_time - start_time
        assert execution_time < {{max_execution_time}}  # 最大执行时间限制
        assert len(result) == len(large_data)
```

### 测试配置 (conftest.py)
```python
# tests/conftest.py
import pytest
import asyncio
from unittest.mock import Mock
from {{module_name}} import {{main_class}}

@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_{{dependency_name}}():
    """模拟依赖"""
    mock = Mock()
    mock.{{method_name}}.return_value = {{mock_return_value}}
    return mock

@pytest.fixture
def sample_data():
    """样本数据"""
    return {
        "{{key1}}": "{{value1}}",
        "{{key2}}": {{value2}},
        "{{key3}}": [{{list_values}}]
    }

@pytest.fixture
def {{instance_name}}(mock_{{dependency_name}}):
    """预配置实例"""
    return {{main_class}}({{dependency_name}}=mock_{{dependency_name}})

# 数据库测试设置
@pytest.fixture(scope="function")
def db_session():
    """数据库会话"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    session.close()
```

## CLI支持 (如果适用)

### Click命令行接口
```python
# {{module_name}}/cli.py
import click
from typing import Optional
from .{{core_module}} import {{main_class}}
from .exceptions import {{ModuleName}}Error

@click.group()
@click.version_option(version="{{module_version}}")
@click.option('--verbose', '-v', is_flag=True, help='启用详细输出')
@click.option('--config', '-c', type=click.Path(exists=True), help='配置文件路径')
@click.pass_context
def cli(ctx, verbose: bool, config: Optional[str]):
    """{{module_name}} 命令行工具
    
    {{cli_description}}
    """
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose
    ctx.obj['config'] = config

@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), help='输出文件路径')
@click.option('--format', type=click.Choice(['json', 'yaml', 'csv']), default='json')
@click.pass_context
def {{command_name}}(ctx, input_file: str, output: Optional[str], format: str):
    """{{command_description}}"""
    try:
        instance = {{main_class}}(
            verbose=ctx.obj['verbose'],
            config_file=ctx.obj['config']
        )
        
        result = instance.{{process_method}}(
            input_file=input_file,
            output_format=format
        )
        
        if output:
            with open(output, 'w') as f:
                if format == 'json':
                    import json
                    json.dump(result, f, indent=2)
                else:
                    f.write(str(result))
            click.echo(f"结果已保存到: {output}")
        else:
            click.echo(result)
            
    except {{ModuleName}}Error as e:
        click.echo(f"错误: {e}", err=True)
        ctx.exit(1)
    except Exception as e:
        if ctx.obj['verbose']:
            import traceback
            click.echo(traceback.format_exc(), err=True)
        else:
            click.echo(f"未知错误: {e}", err=True)
        ctx.exit(1)

@cli.command()
@click.option('--check-config', is_flag=True, help='检查配置文件')
def {{status_command}}(check_config: bool):
    """显示系统状态"""
    if check_config:
        # 检查配置
        click.echo("配置检查...")
    
    click.echo("系统状态: 正常")

if __name__ == '__main__':
    cli()
```

## 文档

### Sphinx文档配置
```python
# docs/conf.py
import os
import sys
sys.path.insert(0, os.path.abspath('..'))

project = '{{project_name}}'
copyright = '{{year}}, {{author_name}}'
author = '{{author_name}}'
release = '{{module_version}}'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.intersphinx',
    'sphinx_rtd_theme'
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# Napoleon设置
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = False
napoleon_include_private_with_doc = False

# Intersphinx映射
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'requests': ('https://requests.readthedocs.io/en/latest/', None),
}

# 自动文档生成
autosummary_generate = True
autodoc_default_options = {
    'members': True,
    'undoc-members': True,
    'show-inheritance': True,
}
```

## 相关文档

- [Python依赖管理](./dependencies.md)
- [Python系统架构](./system-architecture.md)
- [Python打包指南](https://packaging.python.org/)
- [Pydantic文档](https://pydantic-docs.helpmanual.io/)
- [pytest文档](https://docs.pytest.org/)

---

*本文档由 mg_kiro MCP 系统根据Python项目特征自动生成*