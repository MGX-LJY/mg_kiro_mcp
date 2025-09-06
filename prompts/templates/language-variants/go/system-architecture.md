# 系统架构 (Go) - {{project_name}}

## 项目概述
- **项目类型**: {{project_type}} (Web Service/CLI/Library)
- **Go版本**: {{go_version}}
- **模块路径**: `{{module_path}}`

## 技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | Go | {{go_version}} | 编程语言 |
| 框架 | {{web_framework}} | {{framework_version}} | Web框架 |
| 数据库 | {{database}} | {{db_version}} | 数据存储 |
| ORM | {{orm}} | {{orm_version}} | 数据访问层 |
| 测试 | testing | 内置 | 测试框架 |

## 项目结构
```
{{project_name}}/
├── cmd/
│   └── server/        # 应用入口
├── internal/
│   ├── handler/       # HTTP处理器
│   ├── service/       # 业务逻辑
│   ├── repository/    # 数据访问
│   └── model/         # 数据模型
├── pkg/               # 公共包
├── configs/           # 配置文件
├── go.mod            # 模块定义
└── go.sum            # 依赖校验
```

## 核心模块
| 模块 | 功能 | 包路径 |
|------|------|--------|
| {{module1}} | {{module1_desc}} | {{module1_path}} |
| {{module2}} | {{module2_desc}} | {{module2_path}} |

## 开发配置
### 环境变量
```bash
GO_ENV={{environment}}
PORT={{port}}
DATABASE_URL={{db_url}}
{{custom_env}}={{custom_value}}
```

### 构建命令
```bash
go build -o bin/{{binary_name}} cmd/server/main.go
go run cmd/server/main.go
go test ./...
```

## 性能目标
| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 响应时间 | < {{target_response}}ms | {{monitoring_tool}} |
| 内存使用 | < {{target_memory}}MB | runtime.ReadMemStats |
| 并发处理 | {{target_concurrent}} | 压力测试 |