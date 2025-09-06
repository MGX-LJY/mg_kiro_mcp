# Java依赖管理 - {{project_name}}

## 构建工具配置
- **工具**: {{build_tool}} (Maven/Gradle)
- **Java**: >= {{min_java_version}}

## pom.xml (Maven)
```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{project_version}}</version>
    
    <properties>
        <maven.compiler.source>{{java_version}}</maven.compiler.source>
        <maven.compiler.target>{{java_version}}</maven.compiler.target>
        <spring.boot.version>{{spring_boot_version}}</spring.boot.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
    </dependencies>
</project>
```

## build.gradle (Gradle)
```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '{{spring_boot_version}}'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

## 核心依赖
| 类别 | GroupId | ArtifactId | 说明 |
|------|---------|------------|------|
| Web框架 | org.springframework.boot | spring-boot-starter-web | Web应用 |
| 数据访问 | org.springframework.boot | spring-boot-starter-data-jpa | JPA支持 |
| 测试 | org.springframework.boot | spring-boot-starter-test | 测试框架 |

## 版本管理
```xml
<properties>
    <spring.boot.version>{{spring_boot_version}}</spring.boot.version>
    <junit.version>{{junit_version}}</junit.version>
</properties>
```

## 安全扫描
```bash
mvn org.owasp:dependency-check-maven:check
```