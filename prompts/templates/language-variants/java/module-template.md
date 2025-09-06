# Java 模块文档 - {{module_name}}

> 模块版本: {{module_version}}  
> 更新日期: {{timestamp}}  
> 负责人: {{module_owner}}  
> 状态: {{module_status}}  
> Java版本: {{java_version}}

## 模块概述

### 基本信息
- **模块名**: `{{module_name}}`
- **Group ID**: `{{group_id}}`
- **Artifact ID**: `{{artifact_id}}`
- **包名**: `{{package_name}}`
- **Java版本要求**: >= {{min_java_version}}
- **构建工具**: {{build_tool}} (Maven/Gradle)

### 模块描述
{{module_description}}

### Maven坐标
```xml
<dependency>
    <groupId>{{group_id}}</groupId>
    <artifactId>{{artifact_id}}</artifactId>
    <version>{{module_version}}</version>
</dependency>
```

### Gradle坐标
```gradle
implementation '{{group_id}}:{{artifact_id}}:{{module_version}}'
```

## 包结构

### 标准包组织
```
src/main/java/{{package_path}}/
├── {{ModuleName}}Application.java     # 主启动类(如果是Spring Boot)
├── config/                           # 配置类
│   ├── {{ModuleName}}Config.java
│   ├── DatabaseConfig.java
│   └── SecurityConfig.java
├── controller/                       # 控制器层
│   ├── {{Resource}}Controller.java
│   └── advice/
│       └── GlobalExceptionHandler.java
├── service/                         # 服务层
│   ├── {{Resource}}Service.java
│   └── impl/
│       └── {{Resource}}ServiceImpl.java
├── repository/                      # 数据访问层
│   ├── {{Resource}}Repository.java
│   └── custom/
│       └── Custom{{Resource}}Repository.java
├── entity/                          # 实体类
│   ├── {{Resource}}.java
│   └── BaseEntity.java
├── dto/                            # 数据传输对象
│   ├── {{Resource}}DTO.java
│   ├── request/
│   │   └── Create{{Resource}}Request.java
│   └── response/
│       └── {{Resource}}Response.java
├── mapper/                         # 对象映射器
│   └── {{Resource}}Mapper.java
├── enums/                          # 枚举类
│   └── {{Status}}Enum.java
├── exception/                      # 自定义异常
│   ├── {{ModuleName}}Exception.java
│   └── {{Resource}}NotFoundException.java
├── security/                       # 安全相关
│   ├── JwtTokenProvider.java
│   └── UserPrincipal.java
├── util/                           # 工具类
│   ├── DateUtils.java
│   └── ValidationUtils.java
└── constant/                       # 常量类
    └── {{ModuleName}}Constants.java

src/main/resources/
├── application.yml                 # 配置文件
├── application-dev.yml             # 开发环境配置
├── application-prod.yml            # 生产环境配置
├── db/migration/                   # 数据库迁移脚本
├── static/                        # 静态资源
└── templates/                     # 模板文件

src/test/java/{{package_path}}/
├── {{ModuleName}}ApplicationTests.java
├── controller/
├── service/
├── repository/
└── integration/                   # 集成测试
    └── {{Resource}}IntegrationTest.java
```

## 核心功能定义

### 主要类设计

#### 1. 实体类 (Entity)
```java
@Entity
@Table(name = "{{table_name}}")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
@ToString(exclude = {"{{sensitive_field}}"})
@EqualsAndHashCode(callSuper = true)
public class {{Resource}} extends BaseAuditEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "title", nullable = false, length = 200)
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private {{Status}} status = {{Status}}.ACTIVE;
    
    @Column(name = "priority")
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 10, message = "Priority must not exceed 10")
    @Builder.Default
    private Integer priority = 5;
    
    @Column(name = "metadata", columnDefinition = "json")
    @Type(type = "json")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();
    
    // 关系映射
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;
    
    @OneToMany(mappedBy = "{{resource}}", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<{{ResourceItem}}> items = new ArrayList<>();
    
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "{{resource}}_categories",
        joinColumns = @JoinColumn(name = "{{resource}}_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();
    
    // 业务方法
    public void addItem({{ResourceItem}} item) {
        if (items == null) {
            items = new ArrayList<>();
        }
        items.add(item);
        item.set{{Resource}}(this);
    }
    
    public void removeItem({{ResourceItem}} item) {
        if (items != null) {
            items.remove(item);
            item.set{{Resource}}(null);
        }
    }
    
    public boolean isOwnedBy(String username) {
        return user != null && Objects.equals(user.getUsername(), username);
    }
    
    public boolean isActive() {
        return {{Status}}.ACTIVE.equals(status);
    }
    
    // JPA生命周期回调
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = {{Status}}.ACTIVE;
        }
        if (priority == null) {
            priority = 5;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        // 更新前的业务逻辑
    }
}
```

#### 2. 服务接口 (Service Interface)
```java
/**
 * {{Resource}}服务接口
 * 
 * @author {{author}}
 * @version {{version}}
 * @since {{since_version}}
 */
public interface {{Resource}}Service {
    
    /**
     * 分页查询{{resource_name}}
     *
     * @param pageable 分页参数
     * @param searchCriteria 搜索条件
     * @return 分页结果
     * @throws {{ServiceException}} 服务异常
     */
    Page<{{Resource}}DTO> findAll(Pageable pageable, {{Resource}}SearchCriteria searchCriteria);
    
    /**
     * 根据ID查询{{resource_name}}
     *
     * @param id {{resource_name}}ID
     * @return {{resource_name}}信息
     * @throws {{Resource}}NotFoundException 当{{resource_name}}不存在时
     */
    {{Resource}}DTO findById(Long id);
    
    /**
     * 根据用户ID查询{{resource_name}}列表
     *
     * @param userId 用户ID
     * @param pageable 分页参数
     * @return {{resource_name}}列表
     */
    Page<{{Resource}}DTO> findByUserId(Long userId, Pageable pageable);
    
    /**
     * 创建{{resource_name}}
     *
     * @param request 创建请求
     * @param currentUser 当前用户
     * @return 创建的{{resource_name}}
     * @throws {{ValidationException}} 验证异常
     */
    {{Resource}}DTO create(Create{{Resource}}Request request, String currentUser);
    
    /**
     * 更新{{resource_name}}
     *
     * @param id {{resource_name}}ID
     * @param request 更新请求
     * @param currentUser 当前用户
     * @return 更新的{{resource_name}}
     * @throws {{Resource}}NotFoundException 当{{resource_name}}不存在时
     * @throws {{AccessDeniedException}} 无权限访问时
     */
    {{Resource}}DTO update(Long id, Update{{Resource}}Request request, String currentUser);
    
    /**
     * 删除{{resource_name}}
     *
     * @param id {{resource_name}}ID
     * @param currentUser 当前用户
     * @throws {{Resource}}NotFoundException 当{{resource_name}}不存在时
     * @throws {{AccessDeniedException}} 无权限访问时
     */
    void delete(Long id, String currentUser);
    
    /**
     * 批量删除{{resource_name}}
     *
     * @param ids {{resource_name}}ID列表
     * @param currentUser 当前用户
     * @return 删除成功的数量
     */
    int batchDelete(List<Long> ids, String currentUser);
    
    /**
     * 更改{{resource_name}}状态
     *
     * @param id {{resource_name}}ID
     * @param status 新状态
     * @param currentUser 当前用户
     * @return 更新的{{resource_name}}
     */
    {{Resource}}DTO changeStatus(Long id, {{Status}} status, String currentUser);
    
    /**
     * 检查用户是否为{{resource_name}}拥有者
     *
     * @param id {{resource_name}}ID
     * @param username 用户名
     * @return 是否为拥有者
     */
    boolean isOwner(Long id, String username);
    
    /**
     * 统计用户的{{resource_name}}数量
     *
     * @param userId 用户ID
     * @return {{resource_name}}数量
     */
    long countByUserId(Long userId);
    
    /**
     * 获取{{resource_name}}统计信息
     *
     * @return 统计信息
     */
    {{Resource}}StatisticsDTO getStatistics();
}
```

#### 3. 服务实现 (Service Implementation)
```java
@Service
@Transactional(readOnly = true)
@Slf4j
@RequiredArgsConstructor
public class {{Resource}}ServiceImpl implements {{Resource}}Service {
    
    private final {{Resource}}Repository {{resource}}Repository;
    private final {{Resource}}Mapper {{resource}}Mapper;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String CACHE_KEY_PREFIX = "{{module_name}}:{{resource}}:";
    
    @Override
    public Page<{{Resource}}DTO> findAll(Pageable pageable, {{Resource}}SearchCriteria searchCriteria) {
        log.debug("Finding all {{resources}} with criteria: {}", searchCriteria);
        
        Specification<{{Resource}}> spec = {{Resource}}Specifications.withCriteria(searchCriteria);
        Page<{{Resource}}> {{resources}} = {{resource}}Repository.findAll(spec, pageable);
        
        return {{resources}}.map({{resource}}Mapper::toDto);
    }
    
    @Override
    @Cacheable(value = "{{resources}}", key = "#id", unless = "#result == null")
    public {{Resource}}DTO findById(Long id) {
        log.debug("Finding {{resource}} by id: {}", id);
        
        {{Resource}} {{resource}} = {{resource}}Repository.findById(id)
                .orElseThrow(() -> new {{Resource}}NotFoundException("{{Resource}} not found with id: " + id));
        
        return {{resource}}Mapper.toDto({{resource}});
    }
    
    @Override
    public Page<{{Resource}}DTO> findByUserId(Long userId, Pageable pageable) {
        log.debug("Finding {{resources}} by user id: {}", userId);
        
        Page<{{Resource}}> {{resources}} = {{resource}}Repository.findByUserIdAndStatusNot(
                userId, {{Status}}.DELETED, pageable);
        
        return {{resources}}.map({{resource}}Mapper::toDto);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "{{resources}}_list", allEntries = true)
    public {{Resource}}DTO create(Create{{Resource}}Request request, String currentUser) {
        log.info("Creating new {{resource}} for user: {}", currentUser);
        
        // 验证用户
        User user = userService.findByUsername(currentUser)
                .orElseThrow(() -> new {{UserNotFoundException}}("User not found: " + currentUser));
        
        // 业务验证
        validateCreateRequest(request, user);
        
        // 创建实体
        {{Resource}} {{resource}} = {{resource}}Mapper.toEntity(request);
        {{resource}}.setUser(user);
        {{resource}}.setCreatedAt(Instant.now());
        
        // 保存
        {{Resource}} saved = {{resource}}Repository.save({{resource}});
        
        // 发布事件
        eventPublisher.publishEvent(new {{Resource}}CreatedEvent(saved.getId(), currentUser));
        
        log.info("Created {{resource}} with id: {} for user: {}", saved.getId(), currentUser);
        
        return {{resource}}Mapper.toDto(saved);
    }
    
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "{{resources}}", key = "#id"),
        @CacheEvict(value = "{{resources}}_list", allEntries = true)
    })
    public {{Resource}}DTO update(Long id, Update{{Resource}}Request request, String currentUser) {
        log.info("Updating {{resource}} {} by user: {}", id, currentUser);
        
        {{Resource}} existing = {{resource}}Repository.findById(id)
                .orElseThrow(() -> new {{Resource}}NotFoundException("{{Resource}} not found with id: " + id));
        
        // 权限检查
        if (!existing.isOwnedBy(currentUser) && !userService.hasRole(currentUser, "ADMIN")) {
            throw new {{AccessDeniedException}}("Access denied to {{resource}}: " + id);
        }
        
        // 业务验证
        validateUpdateRequest(request, existing);
        
        // 更新实体
        {{resource}}Mapper.updateEntityFromRequest(request, existing);
        existing.setUpdatedAt(Instant.now());
        
        {{Resource}} updated = {{resource}}Repository.save(existing);
        
        // 发布事件
        eventPublisher.publishEvent(new {{Resource}}UpdatedEvent(id, currentUser));
        
        return {{resource}}Mapper.toDto(updated);
    }
    
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "{{resources}}", key = "#id"),
        @CacheEvict(value = "{{resources}}_list", allEntries = true)
    })
    public void delete(Long id, String currentUser) {
        log.info("Deleting {{resource}} {} by user: {}", id, currentUser);
        
        {{Resource}} existing = {{resource}}Repository.findById(id)
                .orElseThrow(() -> new {{Resource}}NotFoundException("{{Resource}} not found with id: " + id));
        
        // 权限检查
        if (!existing.isOwnedBy(currentUser) && !userService.hasRole(currentUser, "ADMIN")) {
            throw new {{AccessDeniedException}}("Access denied to {{resource}}: " + id);
        }
        
        // 软删除
        existing.setStatus({{Status}}.DELETED);
        existing.setUpdatedAt(Instant.now());
        {{resource}}Repository.save(existing);
        
        // 或硬删除
        // {{resource}}Repository.deleteById(id);
        
        // 发布事件
        eventPublisher.publishEvent(new {{Resource}}DeletedEvent(id, currentUser));
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "{{resources}}_list", allEntries = true)
    public int batchDelete(List<Long> ids, String currentUser) {
        log.info("Batch deleting {{resources}} {} by user: {}", ids, currentUser);
        
        List<{{Resource}}> {{resources}} = {{resource}}Repository.findAllById(ids);
        
        // 权限检查
        List<{{Resource}}> deletable = {{resources}}.stream()
                .filter({{resource}} -> {{resource}}.isOwnedBy(currentUser) || 
                        userService.hasRole(currentUser, "ADMIN"))
                .collect(Collectors.toList());
        
        if (deletable.isEmpty()) {
            throw new {{AccessDeniedException}}("No permission to delete any of the specified {{resources}}");
        }
        
        // 批量更新状态
        deletable.forEach({{resource}} -> {
            {{resource}}.setStatus({{Status}}.DELETED);
            {{resource}}.setUpdatedAt(Instant.now());
        });
        
        {{resource}}Repository.saveAll(deletable);
        
        return deletable.size();
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "{{resources}}", key = "#id")
    public {{Resource}}DTO changeStatus(Long id, {{Status}} status, String currentUser) {
        log.info("Changing {{resource}} {} status to {} by user: {}", id, status, currentUser);
        
        {{Resource}} existing = {{resource}}Repository.findById(id)
                .orElseThrow(() -> new {{Resource}}NotFoundException("{{Resource}} not found with id: " + id));
        
        // 权限检查
        if (!existing.isOwnedBy(currentUser) && !userService.hasRole(currentUser, "ADMIN")) {
            throw new {{AccessDeniedException}}("Access denied to {{resource}}: " + id);
        }
        
        // 状态转换验证
        validateStatusTransition(existing.getStatus(), status);
        
        existing.setStatus(status);
        existing.setUpdatedAt(Instant.now());
        
        {{Resource}} updated = {{resource}}Repository.save(existing);
        
        return {{resource}}Mapper.toDto(updated);
    }
    
    @Override
    public boolean isOwner(Long id, String username) {
        return {{resource}}Repository.findById(id)
                .map({{resource}} -> {{resource}}.isOwnedBy(username))
                .orElse(false);
    }
    
    @Override
    public long countByUserId(Long userId) {
        return {{resource}}Repository.countByUserIdAndStatusNot(userId, {{Status}}.DELETED);
    }
    
    @Override
    @Cacheable(value = "{{resources}}_statistics", key = "'global'")
    public {{Resource}}StatisticsDTO getStatistics() {
        log.debug("Getting {{resource}} statistics");
        
        long total = {{resource}}Repository.countByStatusNot({{Status}}.DELETED);
        long active = {{resource}}Repository.countByStatus({{Status}}.ACTIVE);
        long inactive = {{resource}}Repository.countByStatus({{Status}}.INACTIVE);
        
        Map<{{Status}}, Long> statusCounts = Arrays.stream({{Status}}.values())
                .collect(Collectors.toMap(
                    status -> status,
                    status -> {{resource}}Repository.countByStatus(status)
                ));
        
        return {{Resource}}StatisticsDTO.builder()
                .total(total)
                .active(active)
                .inactive(inactive)
                .statusCounts(statusCounts)
                .lastUpdated(Instant.now())
                .build();
    }
    
    // 私有辅助方法
    private void validateCreateRequest(Create{{Resource}}Request request, User user) {
        // 业务验证逻辑
        if ({{resource}}Repository.existsByTitleAndUser(request.getTitle(), user)) {
            throw new {{DuplicateResourceException}}("{{Resource}} with title already exists: " + request.getTitle());
        }
        
        // 其他验证...
    }
    
    private void validateUpdateRequest(Update{{Resource}}Request request, {{Resource}} existing) {
        // 更新验证逻辑
    }
    
    private void validateStatusTransition({{Status}} from, {{Status}} to) {
        // 状态转换验证逻辑
        if (!isValidStatusTransition(from, to)) {
            throw new {{InvalidStatusTransitionException}}(
                String.format("Invalid status transition from %s to %s", from, to));
        }
    }
    
    private boolean isValidStatusTransition({{Status}} from, {{Status}} to) {
        // 定义允许的状态转换规则
        switch (from) {
            case DRAFT:
                return to == {{Status}}.ACTIVE || to == {{Status}}.DELETED;
            case ACTIVE:
                return to == {{Status}}.INACTIVE || to == {{Status}}.DELETED;
            case INACTIVE:
                return to == {{Status}}.ACTIVE || to == {{Status}}.DELETED;
            case DELETED:
                return false; // 已删除的不能再转换
            default:
                return false;
        }
    }
}
```

#### 4. 控制器 (Controller)
```java
@RestController
@RequestMapping("/api/v1/{{resources}}")
@Validated
@Slf4j
@RequiredArgsConstructor
@Tag(name = "{{Resource}} Management", description = "{{Resource_name}}管理API")
public class {{Resource}}Controller {
    
    private final {{Resource}}Service {{resource}}Service;
    
    @GetMapping
    @Operation(summary = "获取{{resource_name}}列表", description = "分页获取{{resource_name}}列表，支持搜索和过滤")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "400", description = "参数错误"),
        @ApiResponse(responseCode = "401", description = "未认证")
    })
    public ResponseEntity<ApiResponse<PageResponse<{{Resource}}DTO>>> getAll(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") @Range(min = 1, max = 100) int size,
            @Parameter(description = "搜索关键词") @RequestParam(required = false) String search,
            @Parameter(description = "状态过滤") @RequestParam(required = false) {{Status}} status,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortDir) {
        
        // 构建分页参数
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        // 构建搜索条件
        {{Resource}}SearchCriteria criteria = {{Resource}}SearchCriteria.builder()
                .search(search)
                .status(status)
                .build();
        
        Page<{{Resource}}DTO> result = {{resource}}Service.findAll(pageable, criteria);
        PageResponse<{{Resource}}DTO> pageResponse = PageResponse.of(result);
        
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取{{resource_name}}", description = "获取指定ID的{{resource_name}}详情")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "404", description = "{{resource_name}}不存在")
    })
    public ResponseEntity<ApiResponse<{{Resource}}DTO>> getById(
            @Parameter(description = "{{resource_name}}ID") @PathVariable @Min(1) Long id) {
        
        {{Resource}}DTO {{resource}} = {{resource}}Service.findById(id);
        return ResponseEntity.ok(ApiResponse.success({{resource}}));
    }
    
    @PostMapping
    @Operation(summary = "创建{{resource_name}}", description = "创建新的{{resource_name}}")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功"),
        @ApiResponse(responseCode = "400", description = "参数验证失败"),
        @ApiResponse(responseCode = "401", description = "未认证")
    })
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<{{Resource}}DTO>> create(
            @Parameter(description = "创建{{resource_name}}请求") @Valid @RequestBody Create{{Resource}}Request request,
            Authentication authentication) {
        
        String currentUser = authentication.getName();
        {{Resource}}DTO created = {{resource}}Service.create(request, currentUser);
        
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        
        return ResponseEntity
                .created(location)
                .body(ApiResponse.success(created, "{{Resource_name}} created successfully"));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "更新{{resource_name}}", description = "更新指定ID的{{resource_name}}")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功"),
        @ApiResponse(responseCode = "400", description = "参数验证失败"),
        @ApiResponse(responseCode = "404", description = "{{resource_name}}不存在"),
        @ApiResponse(responseCode = "403", description = "无权限操作")
    })
    @PreAuthorize("hasRole('ADMIN') or @{{resource}}Service.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<{{Resource}}DTO>> update(
            @Parameter(description = "{{resource_name}}ID") @PathVariable @Min(1) Long id,
            @Parameter(description = "更新{{resource_name}}请求") @Valid @RequestBody Update{{Resource}}Request request,
            Authentication authentication) {
        
        String currentUser = authentication.getName();
        {{Resource}}DTO updated = {{resource}}Service.update(id, request, currentUser);
        
        return ResponseEntity.ok(ApiResponse.success(updated, "{{Resource_name}} updated successfully"));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "删除{{resource_name}}", description = "删除指定ID的{{resource_name}}")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "{{resource_name}}不存在"),
        @ApiResponse(responseCode = "403", description = "无权限操作")
    })
    @PreAuthorize("hasRole('ADMIN') or @{{resource}}Service.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @Parameter(description = "{{resource_name}}ID") @PathVariable @Min(1) Long id,
            Authentication authentication) {
        
        String currentUser = authentication.getName();
        {{resource}}Service.delete(id, currentUser);
        
        return ResponseEntity.ok(ApiResponse.success(null, "{{Resource_name}} deleted successfully"));
    }
    
    @PostMapping("/batch-delete")
    @Operation(summary = "批量删除{{resource_name}}", description = "批量删除指定ID的{{resource_name}}列表")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> batchDelete(
            @Parameter(description = "{{resource_name}}ID列表") @Valid @RequestBody List<@Min(1) Long> ids,
            Authentication authentication) {
        
        String currentUser = authentication.getName();
        int deletedCount = {{resource}}Service.batchDelete(ids, currentUser);
        
        return ResponseEntity.ok(ApiResponse.success(deletedCount, 
                String.format("Successfully deleted %d {{resources}}", deletedCount)));
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "更改{{resource_name}}状态", description = "更改指定{{resource_name}}的状态")
    @PreAuthorize("hasRole('ADMIN') or @{{resource}}Service.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<{{Resource}}DTO>> changeStatus(
            @Parameter(description = "{{resource_name}}ID") @PathVariable @Min(1) Long id,
            @Parameter(description = "新状态") @Valid @RequestBody ChangeStatusRequest request,
            Authentication authentication) {
        
        String currentUser = authentication.getName();
        {{Resource}}DTO updated = {{resource}}Service.changeStatus(id, request.getStatus(), currentUser);
        
        return ResponseEntity.ok(ApiResponse.success(updated, "Status changed successfully"));
    }
    
    @GetMapping("/statistics")
    @Operation(summary = "获取{{resource_name}}统计信息", description = "获取{{resource_name}}的整体统计信息")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<{{Resource}}StatisticsDTO>> getStatistics() {
        {{Resource}}StatisticsDTO statistics = {{resource}}Service.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }
    
    @GetMapping("/my")
    @Operation(summary = "获取我的{{resource_name}}", description = "获取当前用户的{{resource_name}}列表")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PageResponse<{{Resource}}DTO>>> getMyResources(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Range(min = 1, max = 100) int size,
            Authentication authentication) {
        
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<{{Resource}}DTO> result = {{resource}}Service.findByUserId(principal.getId(), pageable);
        PageResponse<{{Resource}}DTO> pageResponse = PageResponse.of(result);
        
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }
}
```

## 数据传输对象 (DTO)

### 请求对象
```java
// 创建请求
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Schema(description = "创建{{resource_name}}请求")
public class Create{{Resource}}Request {
    
    @Schema(description = "标题", example = "示例标题", required = true)
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 200, message = "Title length must be between 1 and 200 characters")
    private String title;
    
    @Schema(description = "描述", example = "这是一个示例描述")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @Schema(description = "优先级", example = "5", minimum = "1", maximum = "10")
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 10, message = "Priority must not exceed 10")
    private Integer priority = 5;
    
    @Schema(description = "分类ID列表")
    @Valid
    private Set<@Min(1) Long> categoryIds = new HashSet<>();
    
    @Schema(description = "元数据")
    @Valid
    private Map<@NotBlank String, @NotNull Object> metadata = new HashMap<>();
    
    // 自定义验证
    @AssertTrue(message = "At least one category must be specified")
    public boolean isValidCategories() {
        return categoryIds != null && !categoryIds.isEmpty();
    }
}

// 更新请求
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Schema(description = "更新{{resource_name}}请求")
public class Update{{Resource}}Request {
    
    @Schema(description = "标题")
    @Size(min = 1, max = 200, message = "Title length must be between 1 and 200 characters")
    private String title;
    
    @Schema(description = "描述")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @Schema(description = "优先级")
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 10, message = "Priority must not exceed 10")
    private Integer priority;
    
    @Schema(description = "分类ID列表")
    @Valid
    private Set<@Min(1) Long> categoryIds;
    
    @Schema(description = "元数据")
    @Valid
    private Map<@NotBlank String, @NotNull Object> metadata;
}

// 状态更改请求
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "状态更改请求")
public class ChangeStatusRequest {
    
    @Schema(description = "新状态", required = true)
    @NotNull(message = "Status is required")
    private {{Status}} status;
    
    @Schema(description = "更改原因")
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
```

### 响应对象
```java
// 主DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Schema(description = "{{resource_name}}信息")
public class {{Resource}}DTO {
    
    @Schema(description = "ID", example = "1")
    private Long id;
    
    @Schema(description = "标题", example = "示例标题")
    private String title;
    
    @Schema(description = "描述", example = "这是一个示例描述")
    private String description;
    
    @Schema(description = "状态")
    private {{Status}} status;
    
    @Schema(description = "优先级", example = "5")
    private Integer priority;
    
    @Schema(description = "元数据")
    private Map<String, Object> metadata;
    
    @Schema(description = "所属用户")
    private UserSummaryDTO user;
    
    @Schema(description = "分类列表")
    private Set<CategoryDTO> categories;
    
    @Schema(description = "创建时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Instant createdAt;
    
    @Schema(description = "更新时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Instant updatedAt;
    
    @Schema(description = "版本号")
    private Long version;
}

// 统计DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "{{resource_name}}统计信息")
public class {{Resource}}StatisticsDTO {
    
    @Schema(description = "总数量")
    private Long total;
    
    @Schema(description = "活跃数量")
    private Long active;
    
    @Schema(description = "非活跃数量")
    private Long inactive;
    
    @Schema(description = "各状态统计")
    private Map<{{Status}}, Long> statusCounts;
    
    @Schema(description = "最后更新时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Instant lastUpdated;
}

// 搜索条件
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "{{resource_name}}搜索条件")
public class {{Resource}}SearchCriteria {
    
    @Schema(description = "搜索关键词")
    private String search;
    
    @Schema(description = "状态过滤")
    private {{Status}} status;
    
    @Schema(description = "用户ID")
    private Long userId;
    
    @Schema(description = "分类ID")
    private Long categoryId;
    
    @Schema(description = "创建时间开始")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdFrom;
    
    @Schema(description = "创建时间结束")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate createdTo;
    
    @Schema(description = "优先级最小值")
    @Min(1)
    private Integer minPriority;
    
    @Schema(description = "优先级最大值")
    @Max(10)
    private Integer maxPriority;
}
```

## 对象映射 (MapStruct)

```java
@Mapper(componentModel = "spring", 
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        injectionStrategy = InjectionStrategy.CONSTRUCTOR)
public interface {{Resource}}Mapper {
    
    // Entity to DTO
    @Mapping(source = "user.id", target = "user.id")
    @Mapping(source = "user.username", target = "user.username")
    @Mapping(source = "user.email", target = "user.email")
    {{Resource}}DTO toDto({{Resource}} entity);
    
    List<{{Resource}}DTO> toDtoList(List<{{Resource}}> entities);
    
    // Request to Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    {{Resource}} toEntity(Create{{Resource}}Request request);
    
    // Update Entity from Request
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    void updateEntityFromRequest(Update{{Resource}}Request request, @MappingTarget {{Resource}} entity);
    
    // Custom mapping methods
    default UserSummaryDTO mapUser(User user) {
        if (user == null) return null;
        
        return UserSummaryDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }
    
    default Set<CategoryDTO> mapCategories(Set<Category> categories) {
        if (categories == null) return null;
        
        return categories.stream()
                .map(this::mapCategory)
                .collect(Collectors.toSet());
    }
    
    default CategoryDTO mapCategory(Category category) {
        if (category == null) return null;
        
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
```

## 测试

### 单元测试示例
```java
@ExtendWith(MockitoExtension.class)
class {{Resource}}ServiceImplTest {
    
    @Mock
    private {{Resource}}Repository {{resource}}Repository;
    
    @Mock
    private {{Resource}}Mapper {{resource}}Mapper;
    
    @Mock
    private UserService userService;
    
    @Mock
    private ApplicationEventPublisher eventPublisher;
    
    @InjectMocks
    private {{Resource}}ServiceImpl {{resource}}Service;
    
    @Test
    @DisplayName("应该成功通过ID查找{{resource_name}}")
    void shouldFindById() {
        // Given
        Long id = 1L;
        {{Resource}} {{resource}} = {{Resource}}.builder()
                .id(id)
                .title("Test Title")
                .status({{Status}}.ACTIVE)
                .build();
        
        {{Resource}}DTO expectedDto = {{Resource}}DTO.builder()
                .id(id)
                .title("Test Title")
                .status({{Status}}.ACTIVE)
                .build();
        
        when({{resource}}Repository.findById(id)).thenReturn(Optional.of({{resource}}));
        when({{resource}}Mapper.toDto({{resource}})).thenReturn(expectedDto);
        
        // When
        {{Resource}}DTO result = {{resource}}Service.findById(id);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getTitle()).isEqualTo("Test Title");
        
        verify({{resource}}Repository).findById(id);
        verify({{resource}}Mapper).toDto({{resource}});
    }
    
    @Test
    @DisplayName("当{{resource_name}}不存在时应该抛出异常")
    void shouldThrowExceptionWhenNotFound() {
        // Given
        Long id = 1L;
        when({{resource}}Repository.findById(id)).thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> {{resource}}Service.findById(id))
                .isInstanceOf({{Resource}}NotFoundException.class)
                .hasMessage("{{Resource}} not found with id: " + id);
        
        verify({{resource}}Repository).findById(id);
        verifyNoInteractions({{resource}}Mapper);
    }
    
    @Test
    @DisplayName("应该成功创建{{resource_name}}")
    void shouldCreateResource() {
        // Given
        String currentUser = "testuser";
        Create{{Resource}}Request request = Create{{Resource}}Request.builder()
                .title("New Title")
                .description("New Description")
                .priority(5)
                .build();
        
        User user = User.builder()
                .id(1L)
                .username(currentUser)
                .build();
        
        {{Resource}} {{resource}} = {{Resource}}.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .user(user)
                .build();
        
        {{Resource}} saved{{Resource}} = {{Resource}}.builder()
                .id(1L)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .user(user)
                .status({{Status}}.ACTIVE)
                .build();
        
        {{Resource}}DTO expectedDto = {{Resource}}DTO.builder()
                .id(1L)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status({{Status}}.ACTIVE)
                .build();
        
        when(userService.findByUsername(currentUser)).thenReturn(Optional.of(user));
        when({{resource}}Mapper.toEntity(request)).thenReturn({{resource}});
        when({{resource}}Repository.save(any({{Resource}}.class))).thenReturn(saved{{Resource}});
        when({{resource}}Mapper.toDto(saved{{Resource}})).thenReturn(expectedDto);
        
        // When
        {{Resource}}DTO result = {{resource}}Service.create(request, currentUser);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo(request.getTitle());
        
        verify(userService).findByUsername(currentUser);
        verify({{resource}}Repository).save(any({{Resource}}.class));
        verify(eventPublisher).publishEvent(any({{Resource}}CreatedEvent.class));
    }
    
    @ParameterizedTest
    @EnumSource({{Status}}.class)
    @DisplayName("应该正确处理不同状态的统计")
    void shouldHandleStatisticsForDifferentStatuses({{Status}} status) {
        // Given
        when({{resource}}Repository.countByStatus(status)).thenReturn(10L);
        when({{resource}}Repository.countByStatusNot({{Status}}.DELETED)).thenReturn(50L);
        when({{resource}}Repository.countByStatus({{Status}}.ACTIVE)).thenReturn(30L);
        when({{resource}}Repository.countByStatus({{Status}}.INACTIVE)).thenReturn(20L);
        
        // When
        {{Resource}}StatisticsDTO statistics = {{resource}}Service.getStatistics();
        
        // Then
        assertThat(statistics).isNotNull();
        assertThat(statistics.getStatusCounts()).containsKey(status);
        assertThat(statistics.getStatusCounts().get(status)).isEqualTo(10L);
    }
}
```

## 相关文档

- [Java依赖管理](./dependencies.md)
- [Java系统架构](./system-architecture.md)
- [Spring Boot官方文档](https://spring.io/projects/spring-boot)
- [Spring Data JPA参考](https://spring.io/projects/spring-data-jpa)
- [MapStruct文档](https://mapstruct.org/)

---

*本文档由 mg_kiro MCP 系统根据Java项目特征自动生成*