# {{module_name}} 模块 (Java)

## 基本信息
- **模块ID**: `{{module_id}}`
- **包名**: `{{package_name}}`
- **版本**: {{module_version}}
- **负责人**: {{module_owner}}
- **Java版本**: {{java_version}}

## Maven依赖
```xml
<dependency>
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{module_version}}</version>
</dependency>
```

## 主要功能
| 功能名称 | 描述 | 类型 | 状态 |
|---------|------|------|------|
| {{function1_name}} | {{function1_desc}} | {{function1_type}} | {{function1_status}} |
| {{function2_name}} | {{function2_desc}} | {{function2_type}} | {{function2_status}} |

## API接口
### {{api_endpoint}}
```java
@RestController
@RequestMapping("{{base_path}}")
public class {{ControllerName}} {
    
    @{{HttpMethod}}("{{endpoint_path}}")
    public ResponseEntity<{{ResponseType}}> {{methodName}}(
            @RequestBody {{RequestType}} request) {
        
        {{ResponseType}} result = {{serviceName}}.{{serviceMethod}}(request);
        return ResponseEntity.ok(result);
    }
}
```

## 数据模型
```java
@Entity
@Table(name = "{{table_name}}")
public class {{EntityName}} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "{{column1}}")
    private {{Type1}} {{field1}};
    
    @Column(name = "{{column2}}")
    private {{Type2}} {{field2}};
}
```

## 依赖关系
| 依赖 | GroupId | ArtifactId | 版本 |
|------|---------|------------|------|
| {{dep1}} | {{dep1_group}} | {{dep1_artifact}} | {{dep1_version}} |
| {{dep2}} | {{dep2_group}} | {{dep2_artifact}} | {{dep2_version}} |

## 测试
```bash
mvn test
mvn test -Dtest={{TestClass}}
mvn jacoco:report
```

## 性能指标
| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 响应时间 | < {{target_latency}}ms | {{current_latency}}ms |
| 内存使用 | < {{target_memory}}MB | {{current_memory}}MB |