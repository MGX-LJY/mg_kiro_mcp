# Go 依赖管理文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}  
> Go版本: {{go_version}}

## 概述

本文档管理Go项目的依赖关系，包括Go模块管理、第三方包和构建工具配置。

### Go模块系统
- **Go版本**: >= {{min_go_version}}
- **模块路径**: `{{module_path}}`
- **Go.mod版本**: {{go_mod_version}}

## go.mod配置

### 基础模块定义
```go
module {{module_path}}

go {{go_version}}

require (
    // Web框架
    {{web_framework}} {{web_framework_version}}
    
    // 数据库驱动
    {{database_driver}} {{db_driver_version}}
    
    // ORM框架
    {{orm_framework}} {{orm_version}}
    
    // 配置管理
    {{config_package}} {{config_version}}
    
    // 日志框架
    {{log_package}} {{log_version}}
    
    // HTTP客户端
    {{http_client}} {{http_client_version}}
    
    // 认证授权
    {{auth_package}} {{auth_version}}
    
    // 验证框架
    {{validation_package}} {{validation_version}}
    
    // 测试框架
    {{test_package}} {{test_version}}
)

// 排除有问题的版本
exclude (
    {{problematic_package}} {{problematic_version}}
)

// 替换依赖（开发或私有仓库）
replace (
    {{original_package}} => {{replacement_package}} {{replacement_version}}
    {{local_package}} => ../{{local_path}}
)

// 撤回版本
retract (
    v{{retracted_version}} // 包含严重bug
    [v{{range_start}}, v{{range_end}}] // 版本范围撤回
)
```

## 核心依赖分类

### Web框架依赖
| 框架 | 包路径 | 版本 | 特点 | 适用场景 |
|------|--------|------|------|----------|
| **Gin** | github.com/gin-gonic/gin | {{gin_version}} | 轻量高性能 | RESTful API |
| **Echo** | github.com/labstack/echo/v4 | {{echo_version}} | 高性能，中间件丰富 | Web应用 |
| **Fiber** | github.com/gofiber/fiber/v2 | {{fiber_version}} | Express风格，极速 | 高并发API |
| **Chi** | github.com/go-chi/chi/v5 | {{chi_version}} | 轻量路由器 | 微服务 |

#### Gin生态依赖 (推荐)
```go
require (
    github.com/gin-gonic/gin {{gin_version}}
    github.com/gin-contrib/cors {{gin_cors_version}}
    github.com/gin-contrib/sessions {{gin_sessions_version}}
    github.com/gin-contrib/static {{gin_static_version}}
    github.com/gin-contrib/gzip {{gin_gzip_version}}
    github.com/gin-contrib/pprof {{gin_pprof_version}}
    github.com/gin-contrib/requestid {{gin_requestid_version}}
    github.com/swaggo/gin-swagger {{gin_swagger_version}}
    github.com/swaggo/files {{swaggo_files_version}}
)
```

### 数据库依赖
```go
require (
    // 数据库驱动
    github.com/lib/pq {{postgres_version}}              // PostgreSQL
    github.com/go-sql-driver/mysql {{mysql_version}}    // MySQL
    github.com/mattn/go-sqlite3 {{sqlite_version}}      // SQLite
    modernc.org/sqlite {{modernc_sqlite_version}}       // SQLite (纯Go)
    
    // ORM框架
    gorm.io/gorm {{gorm_version}}
    gorm.io/driver/postgres {{gorm_postgres_version}}
    gorm.io/driver/mysql {{gorm_mysql_version}}
    gorm.io/driver/sqlite {{gorm_sqlite_version}}
    
    // 数据库迁移
    github.com/golang-migrate/migrate/v4 {{migrate_version}}
    
    // 连接池
    github.com/jmoiron/sqlx {{sqlx_version}}
    
    // Redis客户端
    github.com/redis/go-redis/v9 {{redis_version}}
    github.com/go-redis/cache/v9 {{redis_cache_version}}
    
    // MongoDB驱动
    go.mongodb.org/mongo-driver {{mongo_version}}
)
```

### 配置和环境管理
```go
require (
    // 环境变量
    github.com/joho/godotenv {{godotenv_version}}
    
    // 配置管理
    github.com/spf13/viper {{viper_version}}
    github.com/spf13/cobra {{cobra_version}}          // CLI工具
    github.com/spf13/pflag {{pflag_version}}          // 命令行标志
    
    // 配置验证
    github.com/go-playground/validator/v10 {{validator_version}}
    
    // YAML/JSON处理
    gopkg.in/yaml.v3 {{yaml_version}}
    github.com/json-iterator/go {{jsoniter_version}}
)
```

### 工具和实用库
```go
require (
    // 字符串处理
    github.com/iancoleman/strcase {{strcase_version}}
    
    // 时间处理
    github.com/shopspring/decimal {{decimal_version}}
    github.com/golang/protobuf {{protobuf_version}}
    
    // HTTP客户端
    github.com/go-resty/resty/v2 {{resty_version}}
    
    // UUID生成
    github.com/google/uuid {{uuid_version}}
    github.com/satori/go.uuid {{satori_uuid_version}}
    
    // 加密和哈希
    golang.org/x/crypto {{crypto_version}}
    github.com/dgrijalva/jwt-go {{jwt_version}}
    
    // 并发和同步
    golang.org/x/sync {{sync_version}}
    
    // 错误处理
    github.com/pkg/errors {{errors_version}}
    
    // 类型转换
    github.com/mitchellh/mapstructure {{mapstructure_version}}
    
    // 深拷贝
    github.com/jinzhu/copier {{copier_version}}
    
    // 文件操作
    github.com/spf13/afero {{afero_version}}
)
```

### 日志和监控
```go
require (
    // 结构化日志
    github.com/sirupsen/logrus {{logrus_version}}
    go.uber.org/zap {{zap_version}}
    github.com/rs/zerolog {{zerolog_version}}
    
    // 日志轮转
    github.com/natefinch/lumberjack {{lumberjack_version}}
    
    // 监控和指标
    github.com/prometheus/client_golang {{prometheus_version}}
    
    // 链路追踪
    go.opentelemetry.io/otel {{otel_version}}
    go.opentelemetry.io/otel/trace {{otel_trace_version}}
    go.opentelemetry.io/otel/exporters/jaeger {{otel_jaeger_version}}
    
    // 健康检查
    github.com/heptiolabs/healthcheck {{healthcheck_version}}
)
```

## 测试依赖

### 测试框架
```go
require (
    // 单元测试增强
    github.com/stretchr/testify {{testify_version}}
    
    // 行为驱动开发
    github.com/onsi/ginkgo/v2 {{ginkgo_version}}
    github.com/onsi/gomega {{gomega_version}}
    
    // Mock生成
    github.com/golang/mock {{gomock_version}}
    
    // HTTP测试
    github.com/gavv/httpexpect/v2 {{httpexpect_version}}
    
    // 数据库测试
    github.com/DATA-DOG/go-sqlmock {{sqlmock_version}}
    
    // 集成测试
    github.com/testcontainers/testcontainers-go {{testcontainers_version}}
    
    // 基准测试
    github.com/pkg/profile {{profile_version}}
    
    // 测试覆盖率
    golang.org/x/tools {{tools_version}}
)
```

### 开发工具依赖
```go
require (
    // 代码生成
    github.com/swaggo/swag {{swag_version}}           // API文档生成
    
    // 热重载
    github.com/cosmtrek/air {{air_version}}
    
    // 代码检查
    github.com/golangci/golangci-lint {{golangci_version}}
    
    // 依赖注入
    go.uber.org/fx {{fx_version}}
    go.uber.org/dig {{dig_version}}
    github.com/google/wire {{wire_version}}
    
    // 序列化
    github.com/vmihailenco/msgpack/v5 {{msgpack_version}}
    
    // gRPC
    google.golang.org/grpc {{grpc_version}}
    google.golang.org/protobuf {{protobuf_go_version}}
    
    // GraphQL
    github.com/99designs/gqlgen {{gqlgen_version}}
)
```

## go.sum文件管理

### 依赖验证
```bash
# 验证go.sum文件
go mod verify

# 下载依赖到本地缓存
go mod download

# 清理未使用的依赖
go mod tidy

# 查看依赖原因
go mod why {{package_name}}

# 查看依赖图
go mod graph
```

### 依赖更新策略
```bash
# 查看可更新的依赖
go list -u -m all

# 更新所有依赖到最新次版本
go get -u ./...

# 更新到最新补丁版本
go get -u=patch ./...

# 更新特定包到最新版本
go get -u {{package_name}}

# 更新到特定版本
go get {{package_name}}@{{version}}

# 获取最新的预发布版本
go get {{package_name}}@latest
```

## 版本管理和约束

### 语义化版本
```go
require (
    github.com/example/package v1.2.3          // 精确版本
    github.com/example/package v1.2.0          // 最小版本
    github.com/example/package v0.0.0-20230101000000-abcdef123456 // 伪版本
    github.com/example/package latest           // 最新版本（不推荐）
)
```

### 版本约束最佳实践
| 约束类型 | 语法 | 说明 | 使用场景 |
|----------|------|------|----------|
| 精确版本 | v1.2.3 | 锁定特定版本 | 生产环境 |
| 主版本 | v1 | 最新的v1.x.x | 开发阶段 |
| 次版本 | v1.2 | 最新的v1.2.x | 稳定功能 |
| 补丁版本 | v1.2.3 | 精确的补丁版本 | 关键修复 |

### 私有模块配置
```bash
# 配置私有仓库
export GOPRIVATE=github.com/yourcompany/*,gitlab.com/yourorg/*

# 配置Git认证
git config --global url."https://username:token@github.com/".insteadOf "https://github.com/"

# 配置模块代理
export GOPROXY=https://goproxy.cn,https://proxy.golang.org,direct

# 跳过校验和检查
export GOSUMDB=off
```

## 性能优化

### 构建优化
```go
// go.mod中的优化配置
module {{module_path}}

go {{go_version}}

// 使用工具链版本
toolchain go{{toolchain_version}}

require (
    // 选择性能更好的替代品
    github.com/json-iterator/go {{jsoniter_version}} // 替代encoding/json
    github.com/valyala/fasthttp {{fasthttp_version}}  // 替代net/http
    github.com/bytedance/sonic {{sonic_version}}      // 更快的JSON库
)
```

### 构建标签和条件编译
```bash
# 使用构建标签
go build -tags="production,redis" ./...

# 禁用CGO
CGO_ENABLED=0 go build -a -installsuffix cgo ./...

# 减小二进制大小
go build -ldflags="-s -w" ./...

# 交叉编译
GOOS=linux GOARCH=amd64 go build ./...
```

## 依赖安全管理

### 漏洞扫描
```bash
# Go官方漏洞扫描
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# 第三方安全扫描
go install github.com/securecodewarrior/github-action-add-sarif@latest

# 依赖许可证检查
go install github.com/fossa-contrib/fossa-cli@latest
fossa analyze
```

### 已知漏洞处理
| 包名 | 当前版本 | 漏洞ID | 严重程度 | 修复版本 |
|------|---------|--------|---------|---------|
| {{vuln_package1}} | {{vuln_current1}} | {{cve1}} | {{severity1}} | {{fix1}} |
| {{vuln_package2}} | {{vuln_current2}} | {{cve2}} | {{severity2}} | {{fix2}} |

### 安全最佳实践
```go
// go.mod安全配置示例
module {{module_path}}

go {{go_version}}

require (
    // 使用官方维护的包
    golang.org/x/crypto {{crypto_version}}
    
    // 避免使用已知有漏洞的版本
    github.com/dgrijalva/jwt-go {{jwt_safe_version}} // 使用安全版本
)

// 排除有安全问题的版本
exclude (
    github.com/dgrijalva/jwt-go v3.2.0+incompatible // 存在安全漏洞
    github.com/vulnerable/package v1.0.0            // 已知漏洞
)

// 使用安全的替代品
replace (
    github.com/dgrijalva/jwt-go => github.com/golang-jwt/jwt/v4 {{jwt_v4_version}}
)
```

## CI/CD集成

### GitHub Actions配置
```yaml
# .github/workflows/go.yml
name: Go CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: [1.19, 1.20, 1.21]

    steps:
    - uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: ${{ matrix.go-version }}
        cache: true

    - name: Download dependencies
      run: go mod download

    - name: Verify dependencies
      run: go mod verify

    - name: Run tests
      run: go test -v -race -coverprofile=coverage.out ./...

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out

    - name: Run golangci-lint
      uses: golangci/golangci-lint-action@v3
      with:
        version: latest

    - name: Build
      run: go build -v ./...

    - name: Security scan
      run: |
        go install golang.org/x/vuln/cmd/govulncheck@latest
        govulncheck ./...
```

### Docker多阶段构建
```dockerfile
# 构建阶段
FROM golang:{{go_version}}-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# 运行阶段
FROM alpine:{{alpine_version}}

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/configs ./configs

EXPOSE {{port}}
CMD ["./main"]
```

## 开发工具配置

### Makefile示例
```makefile
# Go相关变量
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME={{binary_name}}

# 构建目标
.PHONY: all build clean test coverage deps tidy

all: test build

build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/server

clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)

test:
	$(GOTEST) -v -race -coverprofile=coverage.out ./...

coverage: test
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

deps:
	$(GOMOD) download
	$(GOMOD) verify

tidy:
	$(GOMOD) tidy

# 开发工具
install-tools:
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/cosmtrek/air@latest

# 代码生成
generate:
	go generate ./...
	swag init -g cmd/server/main.go

# 运行
run:
	go run cmd/server/main.go

# 热重载开发
dev:
	air -c .air.toml

# Docker构建
docker-build:
	docker build -t {{image_name}}:{{tag}} .

# 依赖更新
update:
	go get -u ./...
	go mod tidy
```

### Air配置 (.air.toml)
```toml
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ./cmd/server"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "0s"
  log = "build-errors.log"
  send_interrupt = false
  stop_on_root = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  time = false

[misc]
  clean_on_exit = false
```

## 模块发布

### 版本发布流程
```bash
# 创建语义化版本标签
git tag v1.2.3
git push origin v1.2.3

# 发布到Go模块代理
GOPROXY=proxy.golang.org go list -m {{module_path}}@v1.2.3

# 验证发布
go install {{module_path}}@v1.2.3
```

### go.mod最佳实践
```go
// 生产就绪的go.mod示例
module github.com/{{username}}/{{project_name}}

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/spf13/viper v1.16.0
    gorm.io/gorm v1.25.2
    gorm.io/driver/postgres v1.5.2
)

require (
    // 间接依赖会自动管理
    github.com/bytedance/sonic v1.9.1 // indirect
    github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
    // ... 其他间接依赖
)

// 开发环境特定替换
replace github.com/internal/package => ../internal/package
```

## 疑难解答

### 常见问题
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 模块找不到 | GOPATH问题或模块路径错误 | 确保使用go modules，检查import路径 |
| 版本冲突 | 不兼容的依赖版本 | 使用go mod tidy清理，手动指定版本 |
| 代理超时 | 网络或代理问题 | 配置GOPROXY或使用国内镜像 |
| 构建失败 | 缺少CGO依赖 | 安装必要的C库或使用纯Go替代 |

### 调试命令
```bash
# 查看模块信息
go list -m all
go list -m -versions {{module_name}}

# 查看依赖图
go mod graph | grep {{package_name}}

# 查看为什么需要某个依赖
go mod why {{package_name}}

# 清理模块缓存
go clean -modcache

# 验证模块
go mod verify

# 检查未使用的依赖
go mod tidy -v
```

## 相关文档

- [Go系统架构](./system-architecture.md)
- [Go模块模板](./module-template.md)
- [Go模块官方文档](https://golang.org/ref/mod)
- [Go模块代理](https://proxy.golang.org/)
- [Go漏洞数据库](https://vuln.go.dev/)

---

*本文档由 mg_kiro MCP 系统根据Go项目特征自动生成*