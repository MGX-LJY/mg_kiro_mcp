# {{module_name}} 模块 (Go)

## 基本信息
- **模块ID**: `{{module_id}}`
- **包路径**: `{{package_path}}`
- **版本**: {{module_version}}
- **负责人**: {{module_owner}}
- **Go版本**: {{go_version}}

## 安装使用
```bash
go get {{package_path}}
```

```go
package main

import (
    "{{package_path}}/{{subpackage}}"
    "{{external_package}}"
)

func main() {
    {{instance}} := {{subpackage}}.New{{Constructor}}()
    result, err := {{instance}}.{{Method}}({{params}})
}
```

## 主要功能
| 功能名称 | 描述 | 类型 | 状态 |
|---------|------|------|------|
| {{function1_name}} | {{function1_desc}} | {{function1_type}} | {{function1_status}} |
| {{function2_name}} | {{function2_desc}} | {{function2_type}} | {{function2_status}} |

## API接口
### {{api_endpoint}}
```go
func (h *{{HandlerType}}) {{HandlerName}}(c *gin.Context) {
    var req {{RequestType}}
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    result := {{ServiceMethod}}(req)
    c.JSON(200, gin.H{
        "success": true,
        "data": result,
    })
}
```

## 数据结构
```go
type {{StructName}} struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    {{Field1}} {{Type1}} `json:"{{json1}}" gorm:"{{gorm1}}"`
    {{Field2}} {{Type2}} `json:"{{json2}}" gorm:"{{gorm2}}"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

## 依赖关系
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| {{dep1}} | {{dep1_version}} | {{dep1_purpose}} |
| {{dep2}} | {{dep2_version}} | {{dep2_purpose}} |

## 测试
```bash
go test ./...
go test -cover ./...
go test -race ./...
```

## 性能指标
| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 响应时间 | < {{target_latency}}ms | {{current_latency}}ms |
| 内存使用 | < {{target_memory}}MB | {{current_memory}}MB |