# 系统架构 (Python) - {{project_name}}

## 项目概述
- **项目类型**: {{project_type}} (Web App/API/CLI/Package)
- **Python版本**: {{python_version}}
- **包管理器**: {{package_manager}}

## 技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | Python | {{python_version}} | 编程语言 |
| 框架 | {{web_framework}} | {{framework_version}} | Web框架 |
| 数据库 | {{database}} | {{db_version}} | 数据存储 |
| ORM | {{orm}} | {{orm_version}} | 数据访问层 |
| 测试 | {{test_framework}} | {{test_version}} | 测试框架 |

## 项目结构
```
{{project_name}}/
├── {{package_name}}/
│   ├── __init__.py    # 包初始化
│   ├── models/        # 数据模型
│   ├── views/         # 视图控制
│   ├── services/      # 业务逻辑
│   └── utils/         # 工具函数
├── tests/             # 测试文件
├── docs/              # 文档
├── requirements.txt   # 依赖配置
└── {{config_file}}    # 配置文件
```

## 核心模块
| 模块 | 功能 | 文件路径 |
|------|------|---------|
| {{module1}} | {{module1_desc}} | {{module1_path}} |
| {{module2}} | {{module2_desc}} | {{module2_path}} |

## 开发配置
### 环境变量
```bash
FLASK_ENV={{environment}}
DATABASE_URL={{db_url}}
SECRET_KEY={{secret_key}}
{{custom_env}}={{custom_value}}
```

### 虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

## 性能目标
| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 响应时间 | < {{target_response}}ms | {{monitoring_tool}} |
| 内存使用 | < {{target_memory}}MB | psutil监控 |
| 并发请求 | {{target_concurrent}} | 压力测试 |