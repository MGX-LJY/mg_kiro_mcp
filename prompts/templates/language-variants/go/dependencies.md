# Go依赖管理 - {{project_name}}

## Go模块配置
- **Go版本**: >= {{min_go_version}}
- **模块路径**: `{{module_path}}`

## go.mod
```go
module {{module_path}}

go {{go_version}}

require (
    {{web_framework}} {{web_version}}
    {{database_driver}} {{db_version}}
    {{orm_framework}} {{orm_version}}
    {{config_package}} {{config_version}}
    {{log_package}} {{log_version}}
)

exclude (
    {{problematic_package}} {{problematic_version}}
)

replace (
    {{local_package}} => ../{{local_path}}
)
```

## 核心依赖
| 框架 | 包路径 | 版本 | 特点 |
|------|--------|------|------|
| Gin | github.com/gin-gonic/gin | {{gin_version}} | 轻量高性能 |
| GORM | gorm.io/gorm | {{gorm_version}} | ORM框架 |
| Viper | github.com/spf13/viper | {{viper_version}} | 配置管理 |

## 常用命令
```bash
go mod tidy          # 清理依赖
go mod download      # 下载依赖
go mod verify        # 验证依赖
go get -u ./...      # 更新依赖
```

## 版本管理
| 版本类型 | 语法 | 说明 |
|----------|------|------|
| 精确版本 | v1.2.3 | 锁定特定版本 |
| 主版本 | v1 | 最新v1.x.x |

## 安全扫描
```bash
govulncheck ./...
```