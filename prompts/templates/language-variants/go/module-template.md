# Go 模块文档 - {{module_name}}

> 模块版本: {{module_version}}  
> 更新日期: {{timestamp}}  
> 负责人: {{module_owner}}  
> 状态: {{module_status}}  
> Go版本: {{go_version}}

## 模块概述

### 基本信息
- **模块名**: `{{module_name}}`
- **模块路径**: `{{module_path}}`
- **Go版本要求**: >= {{min_go_version}}
- **许可证**: {{license}}
- **仓库地址**: {{repository_url}}

### 模块描述
{{module_description}}

### 安装和导入
```bash
# 安装模块
go get {{module_path}}

# 更新到最新版本
go get -u {{module_path}}

# 安装特定版本
go get {{module_path}}@{{specific_version}}
```

```go
// 导入模块
import "{{module_path}}"

// 导入子包
import (
    "{{module_path}}/{{subpackage1}}"
    "{{module_path}}/{{subpackage2}}"
    "{{module_path}}/internal/{{internal_package}}"
)
```

## 模块结构

### 标准Go项目布局
```
{{module_name}}/
├── cmd/                          # 主要应用程序
│   ├── {{app_name}}/            # 应用程序入口
│   │   └── main.go
│   └── {{tool_name}}/           # 工具程序
│       └── main.go
├── internal/                     # 内部应用程序和库代码
│   ├── {{business_domain}}/     # 业务域代码
│   │   ├── {{entity}}.go
│   │   ├── {{service}}.go
│   │   └── {{repository}}.go
│   ├── config/                  # 配置管理
│   │   ├── config.go
│   │   └── database.go
│   ├── handler/                 # HTTP处理器
│   │   ├── {{resource}}.go
│   │   └── middleware.go
│   └── pkg/                     # 内部包
│       ├── errors/
│       └── validator/
├── pkg/                         # 外部应用程序可以使用的库代码
│   ├── {{public_package1}}/     # 公共库1
│   │   ├── {{interface}}.go     # 接口定义
│   │   ├── {{implementation}}.go # 实现
│   │   └── {{types}}.go         # 类型定义
│   └── {{public_package2}}/     # 公共库2
├── api/                         # API定义文件
│   ├── openapi/                 # OpenAPI/Swagger规范
│   └── protobuf/                # Protocol Buffer定义
├── web/                         # Web应用程序特定组件
│   ├── static/                  # 静态文件
│   └── template/                # 模板文件
├── configs/                     # 配置文件模板或默认配置
│   ├── config.yaml
│   └── config.example.yaml
├── deployments/                 # 系统和容器编排部署配置和模板
│   ├── docker/
│   │   └── Dockerfile
│   └── kubernetes/
├── test/                        # 额外的外部测试应用程序和测试数据
│   ├── integration/             # 集成测试
│   └── testdata/               # 测试数据
├── docs/                        # 设计和用户文档
│   ├── architecture.md
│   └── api.md
├── examples/                    # 应用程序或公共库的示例
│   ├── basic/
│   └── advanced/
├── scripts/                     # 用于执行各种构建、安装、分析等操作的脚本
│   ├── build.sh
│   └── test.sh
├── vendor/                      # 应用程序依赖项（手动管理）
├── go.mod                       # Go模块文件
├── go.sum                       # Go模块校验文件
├── Makefile                     # 构建和管理脚本
├── README.md                    # 项目说明
└── LICENSE                      # 许可证文件
```

## 核心功能设计

### 接口定义

#### 1. 主要服务接口
```go
// pkg/{{service_package}}/interface.go
package {{service_package}}

import (
    "context"
    "time"
)

// {{Service}}Client 是{{service_name}}的主要接口
// 定义了与{{service_name}}交互的所有方法
type {{Service}}Client interface {
    // Create 创建新的{{resource_name}}
    // ctx: 上下文，用于取消和超时控制
    // req: 创建请求，包含必要的字段
    // 返回创建的{{resource_name}}和可能的错误
    Create(ctx context.Context, req *Create{{Resource}}Request) (*{{Resource}}, error)
    
    // Get 根据ID获取{{resource_name}}
    // ctx: 上下文
    // id: {{resource_name}}的唯一标识符
    // 返回{{resource_name}}和可能的错误，如果不存在则返回ErrNotFound
    Get(ctx context.Context, id string) (*{{Resource}}, error)
    
    // List 获取{{resource_name}}列表
    // ctx: 上下文
    // filter: 过滤条件，可为nil
    // 返回{{resource_name}}列表和可能的错误
    List(ctx context.Context, filter *ListFilter) ([]*{{Resource}}, error)
    
    // Update 更新{{resource_name}}
    // ctx: 上下文
    // id: 要更新的{{resource_name}}ID
    // req: 更新请求
    // 返回更新后的{{resource_name}}和可能的错误
    Update(ctx context.Context, id string, req *Update{{Resource}}Request) (*{{Resource}}, error)
    
    // Delete 删除{{resource_name}}
    // ctx: 上下文
    // id: 要删除的{{resource_name}}ID
    // 返回可能的错误
    Delete(ctx context.Context, id string) error
    
    // Close 关闭客户端连接，释放资源
    // 返回可能的错误
    Close() error
}

// {{Repository}} 定义数据持久化接口
type {{Repository}} interface {
    // Save 保存{{resource_name}}到存储
    Save(ctx context.Context, {{resource}} *{{Resource}}) error
    
    // FindByID 根据ID查找{{resource_name}}
    FindByID(ctx context.Context, id string) (*{{Resource}}, error)
    
    // FindAll 查找所有符合条件的{{resource_name}}
    FindAll(ctx context.Context, filter *Filter) ([]*{{Resource}}, error)
    
    // Delete 从存储中删除{{resource_name}}
    Delete(ctx context.Context, id string) error
    
    // Count 统计符合条件的{{resource_name}}数量
    Count(ctx context.Context, filter *Filter) (int64, error)
}

// Event{{Handler}} 定义事件处理接口
type Event{{Handler}} interface {
    // Handle{{Event}} 处理{{event_name}}事件
    Handle{{Event}}(ctx context.Context, event *{{Event}}) error
    
    // Subscribe 订阅特定类型的事件
    Subscribe(eventType string, handler func(context.Context, interface{}) error) error
    
    // Unsubscribe 取消订阅
    Unsubscribe(eventType string) error
}
```

#### 2. 数据类型定义
```go
// pkg/{{service_package}}/types.go
package {{service_package}}

import (
    "encoding/json"
    "time"
)

// {{Resource}} 表示{{resource_name}}的核心数据结构
type {{Resource}} struct {
    // ID 是{{resource_name}}的唯一标识符
    ID string `json:"id" db:"id" validate:"required"`
    
    // Name 是{{resource_name}}的名称
    Name string `json:"name" db:"name" validate:"required,min=1,max=100"`
    
    // Description 是{{resource_name}}的描述信息
    Description string `json:"description,omitempty" db:"description"`
    
    // Status 表示{{resource_name}}的状态
    Status {{Status}} `json:"status" db:"status" validate:"required"`
    
    // Tags 是与{{resource_name}}关联的标签列表
    Tags []string `json:"tags,omitempty" db:"tags"`
    
    // Metadata 存储额外的元数据信息
    Metadata map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
    
    // CreatedAt 是{{resource_name}}的创建时间
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    
    // UpdatedAt 是{{resource_name}}的最后更新时间
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
    
    // Version 用于乐观锁控制
    Version int64 `json:"version" db:"version"`
}

// {{Status}} 定义{{resource_name}}的状态枚举
type {{Status}} string

const (
    {{Status}}Active   {{Status}} = "active"   // 活跃状态
    {{Status}}Inactive {{Status}} = "inactive" // 非活跃状态
    {{Status}}Pending  {{Status}} = "pending"  // 待处理状态
    {{Status}}Deleted  {{Status}} = "deleted"  // 已删除状态
)

// Valid 检查状态值是否有效
func (s {{Status}}) Valid() bool {
    switch s {
    case {{Status}}Active, {{Status}}Inactive, {{Status}}Pending, {{Status}}Deleted:
        return true
    default:
        return false
    }
}

// String 实现Stringer接口
func (s {{Status}}) String() string {
    return string(s)
}

// Create{{Resource}}Request 创建{{resource_name}}的请求结构
type Create{{Resource}}Request struct {
    Name        string                 `json:"name" validate:"required,min=1,max=100"`
    Description string                 `json:"description,omitempty" validate:"max=500"`
    Tags        []string               `json:"tags,omitempty" validate:"max=10,dive,min=1,max=50"`
    Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// Validate 验证创建请求的有效性
func (r *Create{{Resource}}Request) Validate() error {
    if r.Name == "" {
        return NewValidationError("name", "name is required")
    }
    
    if len(r.Name) > 100 {
        return NewValidationError("name", "name too long")
    }
    
    if len(r.Tags) > 10 {
        return NewValidationError("tags", "too many tags")
    }
    
    return nil
}

// Update{{Resource}}Request 更新{{resource_name}}的请求结构
type Update{{Resource}}Request struct {
    Name        *string                `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
    Description *string                `json:"description,omitempty" validate:"omitempty,max=500"`
    Status      *{{Status}}            `json:"status,omitempty" validate:"omitempty"`
    Tags        []string               `json:"tags,omitempty" validate:"max=10,dive,min=1,max=50"`
    Metadata    map[string]interface{} `json:"metadata,omitempty"`
    Version     int64                  `json:"version" validate:"required,min=0"`
}

// ListFilter 定义列表查询的过滤条件
type ListFilter struct {
    // IDs 根据ID列表过滤
    IDs []string `json:"ids,omitempty"`
    
    // Status 根据状态过滤
    Status []{{Status}} `json:"status,omitempty"`
    
    // Tags 根据标签过滤（包含任一标签）
    Tags []string `json:"tags,omitempty"`
    
    // Search 根据名称或描述进行模糊搜索
    Search string `json:"search,omitempty"`
    
    // CreatedAfter 创建时间晚于指定时间
    CreatedAfter *time.Time `json:"created_after,omitempty"`
    
    // CreatedBefore 创建时间早于指定时间
    CreatedBefore *time.Time `json:"created_before,omitempty"`
    
    // Limit 限制返回数量
    Limit int `json:"limit,omitempty" validate:"min=0,max=1000"`
    
    // Offset 分页偏移量
    Offset int `json:"offset,omitempty" validate:"min=0"`
    
    // SortBy 排序字段
    SortBy string `json:"sort_by,omitempty" validate:"omitempty,oneof=name created_at updated_at"`
    
    // SortOrder 排序方向
    SortOrder SortOrder `json:"sort_order,omitempty" validate:"omitempty,oneof=asc desc"`
}

// SortOrder 定义排序方向
type SortOrder string

const (
    SortOrderAsc  SortOrder = "asc"  // 升序
    SortOrderDesc SortOrder = "desc" // 降序
)

// {{Event}} 定义事件结构
type {{Event}} struct {
    ID        string                 `json:"id"`
    Type      string                 `json:"type"`
    Source    string                 `json:"source"`
    Timestamp time.Time              `json:"timestamp"`
    Data      map[string]interface{} `json:"data"`
}

// Marshal 将事件序列化为JSON
func (e *{{Event}}) Marshal() ([]byte, error) {
    return json.Marshal(e)
}

// Unmarshal 从JSON反序列化事件
func (e *{{Event}}) Unmarshal(data []byte) error {
    return json.Unmarshal(data, e)
}
```

### 实现示例

#### 1. 客户端实现
```go
// pkg/{{service_package}}/client.go
package {{service_package}}

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

// {{client}} 实现{{Service}}Client接口
type {{client}} struct {
    baseURL    string
    httpClient *http.Client
    apiKey     string
    timeout    time.Duration
}

// ClientOption 定义客户端配置选项
type ClientOption func(*{{client}})

// WithHTTPClient 设置自定义HTTP客户端
func WithHTTPClient(client *http.Client) ClientOption {
    return func(c *{{client}}) {
        c.httpClient = client
    }
}

// WithTimeout 设置请求超时时间
func WithTimeout(timeout time.Duration) ClientOption {
    return func(c *{{client}}) {
        c.timeout = timeout
    }
}

// WithAPIKey 设置API密钥
func WithAPIKey(apiKey string) ClientOption {
    return func(c *{{client}}) {
        c.apiKey = apiKey
    }
}

// New{{Client}} 创建新的{{service_name}}客户端
func New{{Client}}(baseURL string, opts ...ClientOption) {{Service}}Client {
    client := &{{client}}{
        baseURL: baseURL,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        timeout: 30 * time.Second,
    }
    
    for _, opt := range opts {
        opt(client)
    }
    
    return client
}

// Create 实现{{Service}}Client.Create方法
func (c *{{client}}) Create(ctx context.Context, req *Create{{Resource}}Request) (*{{Resource}}, error) {
    if req == nil {
        return nil, NewValidationError("request", "request cannot be nil")
    }
    
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }
    
    // 设置超时上下文
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    
    // 构建请求URL
    url := fmt.Sprintf("%s/{{api_endpoint}}", c.baseURL)
    
    // 发送HTTP请求
    resp, err := c.doRequest(ctx, "POST", url, req)
    if err != nil {
        return nil, fmt.Errorf("failed to create {{resource}}: %w", err)
    }
    defer resp.Body.Close()
    
    // 处理HTTP错误
    if err := c.handleErrorResponse(resp); err != nil {
        return nil, err
    }
    
    // 解析响应
    var {{resource}} {{Resource}}
    if err := c.decodeResponse(resp, &{{resource}}); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }
    
    return &{{resource}}, nil
}

// Get 实现{{Service}}Client.Get方法
func (c *{{client}}) Get(ctx context.Context, id string) (*{{Resource}}, error) {
    if id == "" {
        return nil, NewValidationError("id", "id cannot be empty")
    }
    
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    
    url := fmt.Sprintf("%s/{{api_endpoint}}/%s", c.baseURL, id)
    
    resp, err := c.doRequest(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to get {{resource}}: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == http.StatusNotFound {
        return nil, ErrNotFound
    }
    
    if err := c.handleErrorResponse(resp); err != nil {
        return nil, err
    }
    
    var {{resource}} {{Resource}}
    if err := c.decodeResponse(resp, &{{resource}}); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }
    
    return &{{resource}}, nil
}

// List 实现{{Service}}Client.List方法
func (c *{{client}}) List(ctx context.Context, filter *ListFilter) ([]*{{Resource}}, error) {
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    
    url := c.buildListURL(filter)
    
    resp, err := c.doRequest(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to list {{resources}}: %w", err)
    }
    defer resp.Body.Close()
    
    if err := c.handleErrorResponse(resp); err != nil {
        return nil, err
    }
    
    var response struct {
        Data  []*{{Resource}} `json:"data"`
        Total int64           `json:"total"`
    }
    
    if err := c.decodeResponse(resp, &response); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }
    
    return response.Data, nil
}

// Update 实现{{Service}}Client.Update方法
func (c *{{client}}) Update(ctx context.Context, id string, req *Update{{Resource}}Request) (*{{Resource}}, error) {
    if id == "" {
        return nil, NewValidationError("id", "id cannot be empty")
    }
    
    if req == nil {
        return nil, NewValidationError("request", "request cannot be nil")
    }
    
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    
    url := fmt.Sprintf("%s/{{api_endpoint}}/%s", c.baseURL, id)
    
    resp, err := c.doRequest(ctx, "PUT", url, req)
    if err != nil {
        return nil, fmt.Errorf("failed to update {{resource}}: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == http.StatusNotFound {
        return nil, ErrNotFound
    }
    
    if err := c.handleErrorResponse(resp); err != nil {
        return nil, err
    }
    
    var {{resource}} {{Resource}}
    if err := c.decodeResponse(resp, &{{resource}}); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }
    
    return &{{resource}}, nil
}

// Delete 实现{{Service}}Client.Delete方法
func (c *{{client}}) Delete(ctx context.Context, id string) error {
    if id == "" {
        return NewValidationError("id", "id cannot be empty")
    }
    
    ctx, cancel := context.WithTimeout(ctx, c.timeout)
    defer cancel()
    
    url := fmt.Sprintf("%s/{{api_endpoint}}/%s", c.baseURL, id)
    
    resp, err := c.doRequest(ctx, "DELETE", url, nil)
    if err != nil {
        return fmt.Errorf("failed to delete {{resource}}: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == http.StatusNotFound {
        return ErrNotFound
    }
    
    return c.handleErrorResponse(resp)
}

// Close 实现{{Service}}Client.Close方法
func (c *{{client}}) Close() error {
    // 清理资源，关闭连接等
    if transport, ok := c.httpClient.Transport.(*http.Transport); ok {
        transport.CloseIdleConnections()
    }
    return nil
}

// doRequest 发送HTTP请求
func (c *{{client}}) doRequest(ctx context.Context, method, url string, body interface{}) (*http.Response, error) {
    // 实现HTTP请求逻辑
    // ...
    return nil, nil
}

// handleErrorResponse 处理HTTP错误响应
func (c *{{client}}) handleErrorResponse(resp *http.Response) error {
    if resp.StatusCode >= 200 && resp.StatusCode < 300 {
        return nil
    }
    
    // 解析错误响应
    var errResp struct {
        Error   string `json:"error"`
        Message string `json:"message"`
        Code    string `json:"code"`
    }
    
    if err := c.decodeResponse(resp, &errResp); err != nil {
        return fmt.Errorf("HTTP %d: failed to decode error response", resp.StatusCode)
    }
    
    return NewAPIError(resp.StatusCode, errResp.Code, errResp.Message)
}

// decodeResponse 解码HTTP响应
func (c *{{client}}) decodeResponse(resp *http.Response, v interface{}) error {
    // 实现响应解码逻辑
    // ...
    return nil
}

// buildListURL 构建列表查询URL
func (c *{{client}}) buildListURL(filter *ListFilter) string {
    // 实现URL构建逻辑
    // ...
    return ""
}
```

#### 2. 错误处理
```go
// pkg/{{service_package}}/errors.go
package {{service_package}}

import (
    "errors"
    "fmt"
)

// 预定义的错误类型
var (
    // ErrNotFound 表示请求的资源不存在
    ErrNotFound = errors.New("resource not found")
    
    // ErrAlreadyExists 表示资源已经存在
    ErrAlreadyExists = errors.New("resource already exists")
    
    // ErrInvalidInput 表示输入参数无效
    ErrInvalidInput = errors.New("invalid input")
    
    // ErrUnauthorized 表示未授权访问
    ErrUnauthorized = errors.New("unauthorized")
    
    // ErrForbidden 表示禁止访问
    ErrForbidden = errors.New("forbidden")
    
    // ErrRateLimited 表示请求被限流
    ErrRateLimited = errors.New("rate limited")
    
    // ErrServiceUnavailable 表示服务不可用
    ErrServiceUnavailable = errors.New("service unavailable")
    
    // ErrTimeout 表示请求超时
    ErrTimeout = errors.New("request timeout")
)

// ValidationError 表示输入验证错误
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

// Error 实现error接口
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: %s: %s", e.Field, e.Message)
}

// NewValidationError 创建新的验证错误
func NewValidationError(field, message string) *ValidationError {
    return &ValidationError{
        Field:   field,
        Message: message,
    }
}

// APIError 表示API调用错误
type APIError struct {
    StatusCode int    `json:"status_code"`
    Code       string `json:"code"`
    Message    string `json:"message"`
}

// Error 实现error接口
func (e *APIError) Error() string {
    return fmt.Sprintf("API error %d: %s - %s", e.StatusCode, e.Code, e.Message)
}

// NewAPIError 创建新的API错误
func NewAPIError(statusCode int, code, message string) *APIError {
    return &APIError{
        StatusCode: statusCode,
        Code:       code,
        Message:    message,
    }
}

// IsNotFound 检查错误是否为资源不存在错误
func IsNotFound(err error) bool {
    if err == nil {
        return false
    }
    
    // 检查是否为ErrNotFound
    if errors.Is(err, ErrNotFound) {
        return true
    }
    
    // 检查是否为404 API错误
    var apiErr *APIError
    if errors.As(err, &apiErr) {
        return apiErr.StatusCode == 404
    }
    
    return false
}

// IsValidationError 检查错误是否为验证错误
func IsValidationError(err error) bool {
    if err == nil {
        return false
    }
    
    var validationErr *ValidationError
    return errors.As(err, &validationErr)
}

// IsTemporary 检查错误是否为临时性错误（可重试）
func IsTemporary(err error) bool {
    if err == nil {
        return false
    }
    
    // 检查预定义的临时性错误
    if errors.Is(err, ErrRateLimited) || 
       errors.Is(err, ErrServiceUnavailable) || 
       errors.Is(err, ErrTimeout) {
        return true
    }
    
    // 检查HTTP状态码
    var apiErr *APIError
    if errors.As(err, &apiErr) {
        switch apiErr.StatusCode {
        case 429, 502, 503, 504:
            return true
        }
    }
    
    return false
}

// WrapError 包装错误，添加上下文信息
func WrapError(err error, message string) error {
    if err == nil {
        return nil
    }
    return fmt.Errorf("%s: %w", message, err)
}
```

## 并发安全设计

### 安全的并发访问
```go
// internal/{{domain}}/manager.go
package {{domain}}

import (
    "context"
    "sync"
    "time"
)

// {{Manager}} 管理{{resource_name}}的生命周期
type {{Manager}} struct {
    mu         sync.RWMutex
    {{resources}} map[string]*{{Resource}}
    eventCh    chan {{Event}}
    done       chan struct{}
    wg         sync.WaitGroup
}

// New{{Manager}} 创建新的管理器
func New{{Manager}}() *{{Manager}} {
    m := &{{Manager}}{
        {{resources}}: make(map[string]*{{Resource}}),
        eventCh:    make(chan {{Event}}, 100),
        done:       make(chan struct{}),
    }
    
    // 启动事件处理协程
    m.wg.Add(1)
    go m.eventProcessor()
    
    return m
}

// Add 添加{{resource_name}}
func (m *{{Manager}}) Add({{resource}} *{{Resource}}) error {
    if {{resource}} == nil {
        return NewValidationError("{{resource}}", "{{resource}} cannot be nil")
    }
    
    m.mu.Lock()
    defer m.mu.Unlock()
    
    if _, exists := m.{{resources}}[{{resource}}.ID]; exists {
        return ErrAlreadyExists
    }
    
    m.{{resources}}[{{resource}}.ID] = {{resource}}
    
    // 发送事件
    select {
    case m.eventCh <- {{Event}}{Type: "{{resource}}.added", Data: map[string]interface{}{"id": {{resource}}.ID}}:
    case <-time.After(time.Second):
        // 事件队列满，记录日志但不阻塞
    }
    
    return nil
}

// Get 获取{{resource_name}}
func (m *{{Manager}}) Get(id string) (*{{Resource}}, error) {
    if id == "" {
        return nil, NewValidationError("id", "id cannot be empty")
    }
    
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    {{resource}}, exists := m.{{resources}}[id]
    if !exists {
        return nil, ErrNotFound
    }
    
    // 返回副本以避免并发修改
    return m.copy{{Resource}}({{resource}}), nil
}

// List 获取所有{{resource_name}}
func (m *{{Manager}}) List() []*{{Resource}} {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    result := make([]*{{Resource}}, 0, len(m.{{resources}}))
    for _, {{resource}} := range m.{{resources}} {
        result = append(result, m.copy{{Resource}}({{resource}}))
    }
    
    return result
}

// Remove 移除{{resource_name}}
func (m *{{Manager}}) Remove(id string) error {
    if id == "" {
        return NewValidationError("id", "id cannot be empty")
    }
    
    m.mu.Lock()
    defer m.mu.Unlock()
    
    if _, exists := m.{{resources}}[id]; !exists {
        return ErrNotFound
    }
    
    delete(m.{{resources}}, id)
    
    // 发送事件
    select {
    case m.eventCh <- {{Event}}{Type: "{{resource}}.removed", Data: map[string]interface{}{"id": id}}:
    case <-time.After(time.Second):
        // 事件队列满，记录日志但不阻塞
    }
    
    return nil
}

// Close 关闭管理器
func (m *{{Manager}}) Close() error {
    close(m.done)
    m.wg.Wait()
    return nil
}

// eventProcessor 处理事件的协程
func (m *{{Manager}}) eventProcessor() {
    defer m.wg.Done()
    
    for {
        select {
        case event := <-m.eventCh:
            m.handleEvent(event)
        case <-m.done:
            // 处理剩余事件
            for {
                select {
                case event := <-m.eventCh:
                    m.handleEvent(event)
                default:
                    return
                }
            }
        }
    }
}

// handleEvent 处理单个事件
func (m *{{Manager}}) handleEvent(event {{Event}}) {
    // 实现事件处理逻辑
    // 记录日志、发送通知等
}

// copy{{Resource}} 创建{{resource_name}}的深拷贝
func (m *{{Manager}}) copy{{Resource}}({{resource}} *{{Resource}}) *{{Resource}} {
    if {{resource}} == nil {
        return nil
    }
    
    copied := *{{resource}}
    
    // 深拷贝切片和映射
    if {{resource}}.Tags != nil {
        copied.Tags = make([]string, len({{resource}}.Tags))
        copy(copied.Tags, {{resource}}.Tags)
    }
    
    if {{resource}}.Metadata != nil {
        copied.Metadata = make(map[string]interface{})
        for k, v := range {{resource}}.Metadata {
            copied.Metadata[k] = v
        }
    }
    
    return &copied
}

// BatchProcess 批量处理{{resource_name}}
func (m *{{Manager}}) BatchProcess(ctx context.Context, ids []string, processor func(string, *{{Resource}}) error) error {
    const maxConcurrency = 10
    
    if len(ids) == 0 {
        return nil
    }
    
    // 创建带缓冲的通道
    semaphore := make(chan struct{}, maxConcurrency)
    resultCh := make(chan error, len(ids))
    
    // 启动协程池
    for _, id := range ids {
        go func(id string) {
            // 获取信号量
            semaphore <- struct{}{}
            defer func() { <-semaphore }()
            
            // 获取{{resource_name}}
            {{resource}}, err := m.Get(id)
            if err != nil {
                resultCh <- fmt.Errorf("failed to get {{resource}} %s: %w", id, err)
                return
            }
            
            // 处理{{resource_name}}
            if err := processor(id, {{resource}}); err != nil {
                resultCh <- fmt.Errorf("failed to process {{resource}} %s: %w", id, err)
                return
            }
            
            resultCh <- nil
        }(id)
    }
    
    // 收集结果
    var errors []error
    for i := 0; i < len(ids); i++ {
        select {
        case err := <-resultCh:
            if err != nil {
                errors = append(errors, err)
            }
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    
    if len(errors) > 0 {
        return fmt.Errorf("batch processing failed: %d errors occurred", len(errors))
    }
    
    return nil
}
```

## 测试

### 单元测试
```go
// pkg/{{service_package}}/client_test.go
package {{service_package}}

import (
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestClient_Create(t *testing.T) {
    tests := []struct {
        name           string
        request        *Create{{Resource}}Request
        serverResponse {{Resource}}
        serverStatus   int
        wantErr        bool
        expectedErr    error
    }{
        {
            name: "成功创建{{resource_name}}",
            request: &Create{{Resource}}Request{
                Name:        "Test {{Resource}}",
                Description: "Test Description",
                Tags:        []string{"test", "example"},
            },
            serverResponse: {{Resource}}{
                ID:          "123",
                Name:        "Test {{Resource}}",
                Description: "Test Description",
                Status:      {{Status}}Active,
                Tags:        []string{"test", "example"},
                CreatedAt:   time.Now(),
                UpdatedAt:   time.Now(),
            },
            serverStatus: http.StatusCreated,
            wantErr:      false,
        },
        {
            name: "无效请求应该返回错误",
            request: &Create{{Resource}}Request{
                Name: "", // 空名称
            },
            wantErr:     true,
            expectedErr: NewValidationError("name", "name is required"),
        },
        {
            name: "服务器错误应该返回错误",
            request: &Create{{Resource}}Request{
                Name:        "Test {{Resource}}",
                Description: "Test Description",
            },
            serverStatus: http.StatusInternalServerError,
            wantErr:      true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // 创建测试服务器
            server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                assert.Equal(t, "POST", r.Method)
                assert.Equal(t, "/{{api_endpoint}}", r.URL.Path)
                
                if tt.serverStatus != 0 {
                    w.WriteHeader(tt.serverStatus)
                }
                
                if tt.serverStatus == http.StatusCreated {
                    w.Header().Set("Content-Type", "application/json")
                    json.NewEncoder(w).Encode(tt.serverResponse)
                }
            }))
            defer server.Close()
            
            // 创建客户端
            client := New{{Client}}(server.URL)
            defer client.Close()
            
            // 执行测试
            result, err := client.Create(context.Background(), tt.request)
            
            if tt.wantErr {
                assert.Error(t, err)
                if tt.expectedErr != nil {
                    assert.Equal(t, tt.expectedErr.Error(), err.Error())
                }
                assert.Nil(t, result)
            } else {
                assert.NoError(t, err)
                assert.NotNil(t, result)
                assert.Equal(t, tt.serverResponse.ID, result.ID)
                assert.Equal(t, tt.serverResponse.Name, result.Name)
            }
        })
    }
}

func TestClient_Get(t *testing.T) {
    {{resource}} := {{Resource}}{
        ID:          "123",
        Name:        "Test {{Resource}}",
        Description: "Test Description",
        Status:      {{Status}}Active,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }

    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        assert.Equal(t, "GET", r.Method)
        
        if r.URL.Path == "/{{api_endpoint}}/123" {
            w.Header().Set("Content-Type", "application/json")
            json.NewEncoder(w).Encode({{resource}})
        } else if r.URL.Path == "/{{api_endpoint}}/notfound" {
            w.WriteHeader(http.StatusNotFound)
        }
    }))
    defer server.Close()

    client := New{{Client}}(server.URL)
    defer client.Close()

    t.Run("成功获取{{resource_name}}", func(t *testing.T) {
        result, err := client.Get(context.Background(), "123")
        require.NoError(t, err)
        assert.Equal(t, {{resource}}.ID, result.ID)
        assert.Equal(t, {{resource}}.Name, result.Name)
    })

    t.Run("{{resource_name}}不存在应该返回ErrNotFound", func(t *testing.T) {
        result, err := client.Get(context.Background(), "notfound")
        assert.Error(t, err)
        assert.True(t, IsNotFound(err))
        assert.Nil(t, result)
    })

    t.Run("空ID应该返回验证错误", func(t *testing.T) {
        result, err := client.Get(context.Background(), "")
        assert.Error(t, err)
        assert.True(t, IsValidationError(err))
        assert.Nil(t, result)
    })
}

// 基准测试
func BenchmarkClient_Create(b *testing.B) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        response := {{Resource}}{
            ID:        "bench-123",
            Name:      "Benchmark {{Resource}}",
            Status:    {{Status}}Active,
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        }
        json.NewEncoder(w).Encode(response)
    }))
    defer server.Close()

    client := New{{Client}}(server.URL)
    defer client.Close()

    request := &Create{{Resource}}Request{
        Name:        "Benchmark {{Resource}}",
        Description: "Benchmark Description",
    }

    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            _, err := client.Create(context.Background(), request)
            if err != nil {
                b.Fatal(err)
            }
        }
    })
}

// 并发安全测试
func TestManager_ConcurrentAccess(t *testing.T) {
    manager := New{{Manager}}()
    defer manager.Close()

    const numGoroutines = 100
    const numOperations = 1000

    // 并发添加和读取
    var wg sync.WaitGroup
    wg.Add(numGoroutines * 2)

    // 写协程
    for i := 0; i < numGoroutines; i++ {
        go func(id int) {
            defer wg.Done()
            for j := 0; j < numOperations; j++ {
                {{resource}} := &{{Resource}}{
                    ID:     fmt.Sprintf("%d-%d", id, j),
                    Name:   fmt.Sprintf("{{Resource}} %d-%d", id, j),
                    Status: {{Status}}Active,
                }
                manager.Add({{resource}})
            }
        }(i)
    }

    // 读协程
    for i := 0; i < numGoroutines; i++ {
        go func(id int) {
            defer wg.Done()
            for j := 0; j < numOperations; j++ {
                manager.List()
            }
        }(i)
    }

    wg.Wait()

    // 验证最终状态
    {{resources}} := manager.List()
    assert.Equal(t, numGoroutines*numOperations, len({{resources}}))
}

// 表格驱动测试示例
func TestValidation(t *testing.T) {
    testCases := []struct {
        name    string
        input   *Create{{Resource}}Request
        wantErr bool
        errMsg  string
    }{
        {
            name: "有效请求",
            input: &Create{{Resource}}Request{
                Name:        "Valid Name",
                Description: "Valid Description",
                Tags:        []string{"tag1", "tag2"},
            },
            wantErr: false,
        },
        {
            name: "空名称",
            input: &Create{{Resource}}Request{
                Name:        "",
                Description: "Valid Description",
            },
            wantErr: true,
            errMsg:  "name is required",
        },
        {
            name: "名称过长",
            input: &Create{{Resource}}Request{
                Name: string(make([]byte, 101)), // 超过100个字符
            },
            wantErr: true,
            errMsg:  "name too long",
        },
        {
            name: "标签过多",
            input: &Create{{Resource}}Request{
                Name: "Valid Name",
                Tags: make([]string, 11), // 超过10个标签
            },
            wantErr: true,
            errMsg:  "too many tags",
        },
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            err := tc.input.Validate()
            
            if tc.wantErr {
                assert.Error(t, err)
                if tc.errMsg != "" {
                    assert.Contains(t, err.Error(), tc.errMsg)
                }
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### 集成测试
```go
// test/integration/{{service_package}}_integration_test.go
package integration

import (
    "context"
    "os"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/suite"
    "{{module_path}}/pkg/{{service_package}}"
)

type {{Service}}IntegrationTestSuite struct {
    suite.Suite
    client {{service_package}}.{{Service}}Client
}

func (suite *{{Service}}IntegrationTestSuite) SetupSuite() {
    // 从环境变量获取测试配置
    baseURL := os.Getenv("{{SERVICE_NAME}}_BASE_URL")
    if baseURL == "" {
        suite.T().Skip("{{SERVICE_NAME}}_BASE_URL not set, skipping integration tests")
    }

    apiKey := os.Getenv("{{SERVICE_NAME}}_API_KEY")
    
    suite.client = {{service_package}}.New{{Client}}(
        baseURL,
        {{service_package}}.WithAPIKey(apiKey),
        {{service_package}}.WithTimeout(30*time.Second),
    )
}

func (suite *{{Service}}IntegrationTestSuite) TearDownSuite() {
    if suite.client != nil {
        suite.client.Close()
    }
}

func (suite *{{Service}}IntegrationTestSuite) TestCreateAndGetResource() {
    ctx := context.Background()
    
    // 创建{{resource_name}}
    createReq := &{{service_package}}.Create{{Resource}}Request{
        Name:        "Integration Test {{Resource}}",
        Description: "Created by integration test",
        Tags:        []string{"integration", "test"},
    }
    
    created, err := suite.client.Create(ctx, createReq)
    suite.Require().NoError(err)
    suite.Require().NotNil(created)
    suite.Equal(createReq.Name, created.Name)
    
    // 获取创建的{{resource_name}}
    retrieved, err := suite.client.Get(ctx, created.ID)
    suite.Require().NoError(err)
    suite.Require().NotNil(retrieved)
    suite.Equal(created.ID, retrieved.ID)
    suite.Equal(created.Name, retrieved.Name)
    
    // 清理：删除创建的{{resource_name}}
    err = suite.client.Delete(ctx, created.ID)
    suite.NoError(err)
    
    // 验证已删除
    _, err = suite.client.Get(ctx, created.ID)
    suite.True({{service_package}}.IsNotFound(err))
}

func (suite *{{Service}}IntegrationTestSuite) TestListResources() {
    ctx := context.Background()
    
    // 创建多个{{resource_name}}用于测试
    var created []*{{service_package}}.{{Resource}}
    for i := 0; i < 3; i++ {
        createReq := &{{service_package}}.Create{{Resource}}Request{
            Name:        fmt.Sprintf("List Test {{Resource}} %d", i),
            Description: "Created for list test",
            Tags:        []string{"list", "test"},
        }
        
        {{resource}}, err := suite.client.Create(ctx, createReq)
        suite.Require().NoError(err)
        created = append(created, {{resource}})
    }
    
    // 测试列表查询
    filter := &{{service_package}}.ListFilter{
        Tags:   []string{"list"},
        Limit:  10,
        Offset: 0,
    }
    
    {{resources}}, err := suite.client.List(ctx, filter)
    suite.Require().NoError(err)
    suite.GreaterOrEqual(len({{resources}}), 3)
    
    // 清理创建的{{resource_name}}
    for _, {{resource}} := range created {
        err := suite.client.Delete(ctx, {{resource}}.ID)
        suite.NoError(err)
    }
}

func TestIntegration{{Service}}(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration tests in short mode")
    }
    
    suite.Run(t, new({{Service}}IntegrationTestSuite))
}
```

## 示例用法

### 基本使用示例
```go
// examples/basic/main.go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "{{module_path}}/pkg/{{service_package}}"
)

func main() {
    // 创建客户端
    client := {{service_package}}.New{{Client}}(
        "https://api.example.com",
        {{service_package}}.WithAPIKey("your-api-key"),
        {{service_package}}.WithTimeout(30*time.Second),
    )
    defer client.Close()

    ctx := context.Background()

    // 创建{{resource_name}}
    createReq := &{{service_package}}.Create{{Resource}}Request{
        Name:        "My First {{Resource}}",
        Description: "This is my first {{resource_name}}",
        Tags:        []string{"example", "demo"},
        Metadata: map[string]interface{}{
            "source": "example",
            "version": "1.0",
        },
    }

    {{resource}}, err := client.Create(ctx, createReq)
    if err != nil {
        log.Fatalf("Failed to create {{resource}}: %v", err)
    }

    fmt.Printf("Created {{resource}}: %s (ID: %s)\n", {{resource}}.Name, {{resource}}.ID)

    // 获取{{resource_name}}
    retrieved, err := client.Get(ctx, {{resource}}.ID)
    if err != nil {
        log.Fatalf("Failed to get {{resource}}: %v", err)
    }

    fmt.Printf("Retrieved {{resource}}: %s\n", retrieved.Name)

    // 更新{{resource_name}}
    updateReq := &{{service_package}}.Update{{Resource}}Request{
        Description: stringPtr("Updated description"),
        Version:     retrieved.Version,
    }

    updated, err := client.Update(ctx, {{resource}}.ID, updateReq)
    if err != nil {
        log.Fatalf("Failed to update {{resource}}: %v", err)
    }

    fmt.Printf("Updated {{resource}} description: %s\n", updated.Description)

    // 列出{{resource_name}}
    filter := &{{service_package}}.ListFilter{
        Status: []{{service_package}}.{{Status}}{{{service_package}}.{{Status}}Active},
        Limit:  10,
    }

    {{resources}}, err := client.List(ctx, filter)
    if err != nil {
        log.Fatalf("Failed to list {{resources}}: %v", err)
    }

    fmt.Printf("Found %d {{resources}}\n", len({{resources}}))
    for _, r := range {{resources}} {
        fmt.Printf("  - %s (ID: %s)\n", r.Name, r.ID)
    }

    // 删除{{resource_name}}
    err = client.Delete(ctx, {{resource}}.ID)
    if err != nil {
        log.Fatalf("Failed to delete {{resource}}: %v", err)
    }

    fmt.Printf("Deleted {{resource}}: %s\n", {{resource}}.ID)
}

// stringPtr 返回字符串指针
func stringPtr(s string) *string {
    return &s
}
```

### 高级使用示例
```go
// examples/advanced/main.go
package main

import (
    "context"
    "fmt"
    "log"
    "sync"
    "time"

    "{{module_path}}/pkg/{{service_package}}"
)

func main() {
    // 配置客户端
    client := {{service_package}}.New{{Client}}(
        "https://api.example.com",
        {{service_package}}.WithAPIKey("your-api-key"),
        {{service_package}}.WithTimeout(30*time.Second),
        {{service_package}}.WithHTTPClient(&http.Client{
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     90 * time.Second,
            },
        }),
    )
    defer client.Close()

    // 并发创建多个{{resource_name}}
    concurrentCreate(client)
    
    // 批量处理{{resource_name}}
    batchProcess(client)
    
    // 错误处理示例
    errorHandling(client)
}

func concurrentCreate(client {{service_package}}.{{Service}}Client) {
    fmt.Println("=== 并发创建{{resource_name}} ===")
    
    const numWorkers = 5
    const numResources = 20
    
    jobs := make(chan int, numResources)
    results := make(chan string, numResources)
    var wg sync.WaitGroup
    
    // 启动工作协程
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for j := range jobs {
                createReq := &{{service_package}}.Create{{Resource}}Request{
                    Name:        fmt.Sprintf("Concurrent {{Resource}} %d", j),
                    Description: fmt.Sprintf("Created by worker %d", workerID),
                    Tags:        []string{"concurrent", "test"},
                }
                
                ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
                {{resource}}, err := client.Create(ctx, createReq)
                cancel()
                
                if err != nil {
                    log.Printf("Worker %d failed to create {{resource}} %d: %v", workerID, j, err)
                    results <- ""
                } else {
                    results <- {{resource}}.ID
                }
            }
        }(w)
    }
    
    // 发送任务
    for j := 1; j <= numResources; j++ {
        jobs <- j
    }
    close(jobs)
    
    // 等待完成并收集结果
    go func() {
        wg.Wait()
        close(results)
    }()
    
    var createdCount int
    for id := range results {
        if id != "" {
            createdCount++
        }
    }
    
    fmt.Printf("成功并发创建了 %d 个{{resource_name}}\n", createdCount)
}

func batchProcess(client {{service_package}}.{{Service}}Client) {
    fmt.Println("\n=== 批量处理{{resource_name}} ===")
    
    ctx := context.Background()
    
    // 获取所有活跃的{{resource_name}}
    filter := &{{service_package}}.ListFilter{
        Status: []{{service_package}}.{{Status}}{{{service_package}}.{{Status}}Active},
        Limit:  100,
    }
    
    {{resources}}, err := client.List(ctx, filter)
    if err != nil {
        log.Printf("Failed to list {{resources}}: %v", err)
        return
    }
    
    if len({{resources}}) == 0 {
        fmt.Println("没有找到活跃的{{resource_name}}")
        return
    }
    
    // 批量更新{{resource_name}}的标签
    const batchSize = 5
    var processed int
    
    for i := 0; i < len({{resources}}); i += batchSize {
        end := i + batchSize
        if end > len({{resources}}) {
            end = len({{resources}})
        }
        
        batch := {{resources}}[i:end]
        var wg sync.WaitGroup
        
        for _, {{resource}} := range batch {
            wg.Add(1)
            go func(r *{{service_package}}.{{Resource}}) {
                defer wg.Done()
                
                // 添加批处理标签
                newTags := append(r.Tags, "batch-processed")
                updateReq := &{{service_package}}.Update{{Resource}}Request{
                    Tags:    newTags,
                    Version: r.Version,
                }
                
                ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
                _, err := client.Update(ctx, r.ID, updateReq)
                cancel()
                
                if err != nil {
                    log.Printf("Failed to update {{resource}} %s: %v", r.ID, err)
                } else {
                    processed++
                }
            }({{resource}})
        }
        
        wg.Wait()
        fmt.Printf("处理了批次 %d-%d\n", i+1, end)
        
        // 批次间隔，避免过度请求
        time.Sleep(100 * time.Millisecond)
    }
    
    fmt.Printf("批量处理完成，共处理 %d 个{{resource_name}}\n", processed)
}

func errorHandling(client {{service_package}}.{{Service}}Client) {
    fmt.Println("\n=== 错误处理示例 ===")
    
    ctx := context.Background()
    
    // 尝试获取不存在的{{resource_name}}
    _, err := client.Get(ctx, "nonexistent-id")
    if err != nil {
        if {{service_package}}.IsNotFound(err) {
            fmt.Println("✓ 正确处理了资源不存在错误")
        } else {
            fmt.Printf("✗ 意外错误: %v\n", err)
        }
    }
    
    // 验证错误
    invalidReq := &{{service_package}}.Create{{Resource}}Request{
        Name: "", // 空名称
    }
    
    _, err = client.Create(ctx, invalidReq)
    if err != nil {
        if {{service_package}}.IsValidationError(err) {
            fmt.Println("✓ 正确处理了验证错误")
        } else {
            fmt.Printf("✗ 意外错误: %v\n", err)
        }
    }
    
    // 重试逻辑示例
    retryExample(client)
}

func retryExample(client {{service_package}}.{{Service}}Client) {
    fmt.Println("\n--- 重试逻辑示例 ---")
    
    const maxRetries = 3
    const baseDelay = 100 * time.Millisecond
    
    createReq := &{{service_package}}.Create{{Resource}}Request{
        Name:        "Retry Example {{Resource}}",
        Description: "用于演示重试逻辑",
    }
    
    var lastErr error
    for attempt := 0; attempt < maxRetries; attempt++ {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        {{resource}}, err := client.Create(ctx, createReq)
        cancel()
        
        if err == nil {
            fmt.Printf("✓ 第 %d 次尝试成功创建{{resource_name}}: %s\n", attempt+1, {{resource}}.ID)
            return
        }
        
        lastErr = err
        
        // 检查是否为临时性错误
        if !{{service_package}}.IsTemporary(err) {
            fmt.Printf("✗ 非临时性错误，停止重试: %v\n", err)
            return
        }
        
        // 指数退避
        delay := baseDelay * time.Duration(1<<uint(attempt))
        fmt.Printf("第 %d 次尝试失败，%v 后重试: %v\n", attempt+1, delay, err)
        time.Sleep(delay)
    }
    
    fmt.Printf("✗ 所有重试都失败了，最后错误: %v\n", lastErr)
}
```

## 相关文档

- [Go依赖管理](./dependencies.md)
- [Go系统架构](./system-architecture.md)
- [Go模块官方文档](https://golang.org/ref/mod)
- [Go代码审查指南](https://github.com/golang/go/wiki/CodeReviewComments)
- [Effective Go](https://golang.org/doc/effective_go.html)

---

*本文档由 mg_kiro MCP 系统根据Go项目特征自动生成*