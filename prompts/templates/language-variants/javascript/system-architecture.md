# 系统架构 (JavaScript) - {{project_name}}

## 项目概述
- **项目类型**: {{project_type}} (Web App/API/CLI/Library)
- **Node.js版本**: {{node_version}}
- **包管理器**: {{package_manager}}

## 技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | {{node_version}} | JavaScript运行环境 |
| 框架 | {{web_framework}} | {{framework_version}} | Web框架 |
| 数据库 | {{database}} | {{db_version}} | 数据存储 |
| ORM | {{orm}} | {{orm_version}} | 数据访问层 |
| 测试 | {{test_framework}} | {{test_version}} | 测试框架 |

## 项目结构
```
{{project_name}}/
├── src/
│   ├── controllers/    # 控制器
│   ├── models/        # 数据模型
│   ├── routes/        # 路由配置
│   ├── middleware/    # 中间件
│   └── utils/         # 工具函数
├── tests/             # 测试文件
├── docs/              # 文档
├── package.json       # 依赖配置
└── {{config_file}}    # 配置文件
```

## 核心模块
| 模块 | 功能 | 入口文件 |
|------|------|---------|
| {{module1}} | {{module1_desc}} | {{module1_entry}} |
| {{module2}} | {{module2_desc}} | {{module2_entry}} |

## 开发配置
### 环境变量
```bash
NODE_ENV={{environment}}
PORT={{port}}
DATABASE_URL={{db_url}}
{{custom_env}}={{custom_value}}
```

### 脚本命令
```json
{
  "start": "{{start_command}}",
  "dev": "{{dev_command}}",
  "test": "{{test_command}}",
  "build": "{{build_command}}"
}
```

## 性能目标
| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 响应时间 | < {{target_response}}ms | {{monitoring_tool}} |
| 内存使用 | < {{target_memory}}MB | process.memoryUsage() |
| 并发请求 | {{target_concurrent}} | 负载测试 |