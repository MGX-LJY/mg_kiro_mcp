# Java 依赖管理文档 - {{project_name}}

> 文档版本: {{version}}  
> 更新日期: {{timestamp}}  
> 维护者: {{author}}  
> Java版本: {{java_version}}

## 概述

本文档管理Java项目的依赖关系，包括Maven/Gradle构建工具、第三方库和框架依赖。

### 构建工具
- **主要工具**: {{build_tool}} (Maven/Gradle)
- **Java版本**: >= {{min_java_version}}
- **构建工具版本**: {{build_tool_version}}

## Maven配置

### pom.xml基础结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <!-- 项目信息 -->
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{project_version}}</version>
    <packaging>{{packaging_type}}</packaging>
    
    <name>{{project_name}}</name>
    <description>{{project_description}}</description>
    <url>{{project_url}}</url>
    
    <!-- 项目属性 -->
    <properties>
        <maven.compiler.source>{{java_version}}</maven.compiler.source>
        <maven.compiler.target>{{java_version}}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        
        <!-- 依赖版本管理 -->
        <spring.boot.version>{{spring_boot_version}}</spring.boot.version>
        <spring.version>{{spring_version}}</spring.version>
        <junit.version>{{junit_version}}</junit.version>
        <mockito.version>{{mockito_version}}</mockito.version>
        <slf4j.version>{{slf4j_version}}</slf4j.version>
        <jackson.version>{{jackson_version}}</jackson.version>
    </properties>
    
    <!-- Spring Boot父项目 (如果适用) -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>${spring.boot.version}</version>
        <relativePath/>
    </parent>
</project>
```

### 生产依赖 (dependencies)
```xml
<dependencies>
    <!-- Web框架依赖 -->
    <dependency>
        <groupId>{{web_framework_group}}</groupId>
        <artifactId>{{web_framework_artifact}}</artifactId>
        <version>{{web_framework_version}}</version>
    </dependency>
    
    <!-- 数据库相关 -->
    <dependency>
        <groupId>{{db_driver_group}}</groupId>
        <artifactId>{{db_driver_artifact}}</artifactId>
        <version>{{db_driver_version}}</version>
        <scope>runtime</scope>
    </dependency>
    
    <dependency>
        <groupId>{{jpa_group}}</groupId>
        <artifactId>{{jpa_artifact}}</artifactId>
        <version>{{jpa_version}}</version>
    </dependency>
    
    <!-- 工具库 -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>{{commons_lang_version}}</version>
    </dependency>
    
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>${jackson.version}</version>
    </dependency>
    
    <!-- 日志框架 -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>{{logback_version}}</version>
    </dependency>
</dependencies>
```

### Spring Boot依赖 (如果适用)
```xml
<!-- Spring Boot Starters -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- 数据库驱动 -->
<dependency>
    <groupId>{{database_driver_group}}</groupId>
    <artifactId>{{database_driver_artifact}}</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- 开发工具 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

### 测试依赖 (test scope)
```xml
<!-- 测试框架 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>${junit.version}</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>${mockito.version}</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>${mockito.version}</version>
    <scope>test</scope>
</dependency>

<!-- Spring Boot Test -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- TestContainers (集成测试) -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>{{testcontainers_version}}</version>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>{{database_testcontainer}}</artifactId>
    <version>{{testcontainers_version}}</version>
    <scope>test</scope>
</dependency>
```

### Maven插件配置
```xml
<build>
    <plugins>
        <!-- 编译插件 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>{{maven_compiler_version}}</version>
            <configuration>
                <source>{{java_version}}</source>
                <target>{{java_version}}</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
        
        <!-- Spring Boot插件 -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-devtools</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
        
        <!-- 测试插件 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>{{maven_surefire_version}}</version>
        </plugin>
        
        <!-- 代码覆盖率插件 -->
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>{{jacoco_version}}</version>
            <executions>
                <execution>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
        
        <!-- 代码质量检查插件 -->
        <plugin>
            <groupId>org.sonarsource.scanner.maven</groupId>
            <artifactId>sonar-maven-plugin</artifactId>
            <version>{{sonar_version}}</version>
        </plugin>
    </plugins>
</build>
```

## Gradle配置

### build.gradle基础结构
```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '{{spring_boot_version}}'
    id 'io.spring.dependency-management' version '{{dependency_management_version}}'
    id 'org.sonarqube' version '{{sonarqube_version}}'
    id 'jacoco'
}

group = '{{group_id}}'
version = '{{project_version}}'
sourceCompatibility = '{{java_version}}'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
    // maven { url 'https://repo.spring.io/milestone' }
}

// 依赖版本管理
ext {
    springBootVersion = '{{spring_boot_version}}'
    junitVersion = '{{junit_version}}'
    mockitoVersion = '{{mockito_version}}'
    testcontainersVersion = '{{testcontainers_version}}'
}
```

### Gradle依赖配置
```gradle
dependencies {
    // Spring Boot Starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    
    // 数据库
    runtimeOnly '{{database_driver_group}}:{{database_driver_artifact}}'
    
    // 工具库
    implementation 'org.apache.commons:commons-lang3:{{commons_lang_version}}'
    implementation 'com.fasterxml.jackson.core:jackson-databind'
    
    // 开发工具
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
    annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
    
    // 测试依赖
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation "org.junit.jupiter:junit-jupiter:$junitVersion"
    testImplementation "org.mockito:mockito-core:$mockitoVersion"
    testImplementation "org.testcontainers:junit-jupiter:$testcontainersVersion"
    testImplementation "org.testcontainers:{{database_testcontainer}}:$testcontainersVersion"
}

// 测试配置
test {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.enabled true
        html.enabled true
    }
}

// 构建配置
jar {
    enabled = false
    archiveClassifier = ''
}

bootJar {
    enabled = true
    archiveClassifier = ''
}
```

## 依赖分类

### 核心框架依赖
| 类别 | GroupId | ArtifactId | 版本 | 说明 |
|------|---------|------------|------|------|
| **Web框架** | {{web_group}} | {{web_artifact}} | {{web_version}} | {{web_desc}} |
| **依赖注入** | {{di_group}} | {{di_artifact}} | {{di_version}} | {{di_desc}} |
| **数据访问** | {{data_group}} | {{data_artifact}} | {{data_version}} | {{data_desc}} |
| **安全框架** | {{security_group}} | {{security_artifact}} | {{security_version}} | {{security_desc}} |

### 数据库相关依赖
```xml
<!-- JPA/Hibernate -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- 数据库驱动 -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- 连接池 -->
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>{{hikari_version}}</version>
</dependency>

<!-- 数据库迁移 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>{{flyway_version}}</version>
</dependency>

<!-- Redis支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 工具库依赖
```xml
<!-- Apache Commons -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>{{commons_lang_version}}</version>
</dependency>

<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>{{commons_io_version}}</version>
</dependency>

<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-collections4</artifactId>
    <version>{{commons_collections_version}}</version>
</dependency>

<!-- Google Guava -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>{{guava_version}}</version>
</dependency>

<!-- JSON处理 -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>

<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>{{gson_version}}</version>
</dependency>

<!-- 日期时间处理 -->
<dependency>
    <groupId>org.threeten</groupId>
    <artifactId>threetenbp</artifactId>
    <version>{{threetenbp_version}}</version>
</dependency>

<!-- HTTP客户端 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>

<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>{{okhttp_version}}</version>
</dependency>
```

## 版本管理策略

### BOM (Bill of Materials)
```xml
<!-- 使用Spring Boot BOM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring.boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        
        <!-- 自定义BOM -->
        <dependency>
            <groupId>{{company_group_id}}</groupId>
            <artifactId>{{company_bom_artifact}}</artifactId>
            <version>{{company_bom_version}}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 版本属性管理
```xml
<properties>
    <!-- Java版本 -->
    <maven.compiler.source>{{java_version}}</maven.compiler.source>
    <maven.compiler.target>{{java_version}}</maven.compiler.target>
    
    <!-- 框架版本 -->
    <spring.boot.version>{{spring_boot_version}}</spring.boot.version>
    <spring.cloud.version>{{spring_cloud_version}}</spring.cloud.version>
    
    <!-- 第三方库版本 -->
    <jackson.version>{{jackson_version}}</jackson.version>
    <junit.version>{{junit_version}}</junit.version>
    <mockito.version>{{mockito_version}}</mockito.version>
    <testcontainers.version>{{testcontainers_version}}</testcontainers.version>
    
    <!-- 插件版本 -->
    <maven.surefire.version>{{maven_surefire_version}}</maven.surefire.version>
    <jacoco.version>{{jacoco_version}}</jacoco.version>
</properties>
```

## 安全管理

### 依赖漏洞扫描
```xml
<!-- OWASP依赖检查插件 -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>{{dependency_check_version}}</version>
    <configuration>
        <format>ALL</format>
        <failBuildOnCVSS>7</failBuildOnCVSS>
        <suppressionFiles>
            <suppressionFile>suppression.xml</suppressionFile>
        </suppressionFiles>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 安全依赖最佳实践
```xml
<!-- 安全相关依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT支持 -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>{{jjwt_version}}</version>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>{{jjwt_version}}</version>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>{{jjwt_version}}</version>
    <scope>runtime</scope>
</dependency>

<!-- 加密支持 -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk15on</artifactId>
    <version>{{bouncycastle_version}}</version>
</dependency>
```

## 多环境配置

### Maven Profiles
```xml
<profiles>
    <!-- 开发环境 -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
            <skip.tests>false</skip.tests>
        </properties>
        <dependencies>
            <!-- 开发专用依赖 -->
            <dependency>
                <groupId>com.h2database</groupId>
                <artifactId>h2</artifactId>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </profile>
    
    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <properties>
            <spring.profiles.active>prod</spring.profiles.active>
            <skip.tests>true</skip.tests>
        </properties>
        <dependencies>
            <!-- 生产数据库驱动 -->
            <dependency>
                <groupId>org.postgresql</groupId>
                <artifactId>postgresql</artifactId>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </profile>
    
    <!-- 测试环境 -->
    <profile>
        <id>test</id>
        <dependencies>
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>postgresql</artifactId>
                <version>${testcontainers.version}</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
    </profile>
</profiles>
```

## 性能优化

### 依赖排除和优化
```xml
<!-- 排除传递依赖 -->
<dependency>
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{version}}</version>
    <exclusions>
        <exclusion>
            <groupId>{{excluded_group}}</groupId>
            <artifactId>{{excluded_artifact}}</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 选择性依赖 -->
<dependency>
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{version}}</version>
    <optional>true</optional>
</dependency>

<!-- 编译时依赖 -->
<dependency>
    <groupId>{{annotation_processor_group}}</groupId>
    <artifactId>{{annotation_processor_artifact}}</artifactId>
    <version>{{annotation_processor_version}}</version>
    <scope>provided</scope>
</dependency>
```

## CI/CD集成

### Maven CI配置
```yaml
# GitHub Actions示例
name: Java CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [11, 17, 21]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK ${{ matrix.java }}
      uses: actions/setup-java@v3
      with:
        java-version: ${{ matrix.java }}
        distribution: 'temurin'
        cache: maven
    
    - name: Run tests
      run: mvn clean test
    
    - name: Generate test report
      run: mvn jacoco:report
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
    
    - name: Dependency vulnerability scan
      run: mvn org.owasp:dependency-check-maven:check
```

## 仓库配置

### Maven仓库设置
```xml
<repositories>
    <!-- 中央仓库 -->
    <repository>
        <id>central</id>
        <name>Maven Central</name>
        <url>https://repo1.maven.org/maven2</url>
    </repository>
    
    <!-- Spring仓库 -->
    <repository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
    </repository>
    
    <!-- 公司私有仓库 -->
    <repository>
        <id>company-nexus</id>
        <name>Company Nexus Repository</name>
        <url>{{company_nexus_url}}</url>
    </repository>
</repositories>

<!-- 插件仓库 -->
<pluginRepositories>
    <pluginRepository>
        <id>spring-plugins</id>
        <name>Spring Plugins</name>
        <url>https://repo.spring.io/plugins-release</url>
    </pluginRepository>
</pluginRepositories>
```

### 分发管理
```xml
<distributionManagement>
    <repository>
        <id>releases</id>
        <name>Release Repository</name>
        <url>{{release_repo_url}}</url>
    </repository>
    <snapshotRepository>
        <id>snapshots</id>
        <name>Snapshot Repository</name>
        <url>{{snapshot_repo_url}}</url>
    </snapshotRepository>
</distributionManagement>
```

## 疑难解答

### 常见依赖问题
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 依赖冲突 | 传递依赖版本冲突 | 使用`<exclusions>`或显式声明版本 |
| 类找不到 | 依赖缺失或scope错误 | 检查依赖声明和scope设置 |
| 版本不兼容 | 依赖版本过旧/过新 | 查看兼容性矩阵，调整版本 |
| 构建缓慢 | 依赖下载或过多传递依赖 | 使用本地仓库，排除不必要依赖 |

### Maven命令工具
```bash
# 依赖分析
mvn dependency:tree                    # 查看依赖树
mvn dependency:analyze                 # 分析未使用依赖
mvn dependency:resolve-sources         # 下载源码
mvn dependency:copy-dependencies       # 复制依赖到目录

# 插件信息
mvn help:describe -Dplugin=compiler   # 查看插件信息
mvn help:effective-pom                # 查看有效POM

# 版本管理
mvn versions:display-dependency-updates  # 显示可更新依赖
mvn versions:use-latest-versions          # 更新到最新版本
```

## 相关文档

- [Java系统架构](./system-architecture.md)
- [Java模块模板](./module-template.md)
- [Maven官方文档](https://maven.apache.org/guides/)
- [Gradle官方文档](https://gradle.org/guides/)
- [Spring Boot依赖管理](https://docs.spring.io/spring-boot/docs/current/reference/html/dependency-versions.html)

---

*本文档由 mg_kiro MCP 系统根据Java项目特征自动生成*