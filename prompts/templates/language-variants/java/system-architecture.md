# 系统架构 (Java) - {{project_name}}

## 项目概述
- **项目类型**: {{project_type}} (Spring Boot/Microservice/Library)
- **Java版本**: {{java_version}}
- **构建工具**: {{build_tool}}

## 技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | Java | {{java_version}} | 编程语言 |
| 框架 | {{web_framework}} | {{framework_version}} | Web框架 |
| 数据库 | {{database}} | {{db_version}} | 数据存储 |
| ORM | {{orm}} | {{orm_version}} | 数据访问层 |
| 测试 | {{test_framework}} | {{test_version}} | 测试框架 |

## 项目结构
```
{{project_name}}/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── {{package_path}}/
│   │   │       ├── controller/    # 控制器
│   │   │       ├── service/       # 业务逻辑
│   │   │       ├── repository/    # 数据访问
│   │   │       └── model/         # 数据模型
│   │   └── resources/             # 配置文件
│   └── test/                      # 测试文件
├── pom.xml                        # Maven配置
└── {{config_file}}                # 应用配置
```

## 核心模块
| 模块 | 功能 | 包路径 |
|------|------|--------|
| {{module1}} | {{module1_desc}} | {{module1_package}} |
| {{module2}} | {{module2_desc}} | {{module2_package}} |

## 开发配置
### 应用配置 (application.yml)
```yaml
server:
  port: {{port}}
  
spring:
  datasource:
    url: {{db_url}}
    username: {{db_username}}
    
  jpa:
    hibernate:
      ddl-auto: {{ddl_auto}}
      
{{custom_config}}:
  {{custom_key}}: {{custom_value}}
```

### 构建命令
```bash
mvn clean compile
mvn spring-boot:run
mvn test
mvn package
```

## 性能目标
| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 响应时间 | < {{target_response}}ms | Micrometer |
| 内存使用 | < {{target_memory}}MB | JVM监控 |
| 并发处理 | {{target_concurrent}} | JMeter测试 |