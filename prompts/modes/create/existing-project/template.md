# Create 现有项目扩展模板

## 🎯 现有项目扩展目标
在已有的项目基础上安全地添加新功能或模块，确保与现有架构的兼容性，最小化对现有系统的影响。

## 📊 现有项目评估

### 1. 项目现状分析
深入了解现有项目的状态和特征：

#### 项目基础信息
- **项目名称**: {{existing_project_name}}
- **项目版本**: {{current_version}}
- **技术栈**: {{current_tech_stack}}
- **架构模式**: {{current_architecture}}
- **代码库规模**: {{codebase_size}}

#### 技术债务评估
- **代码质量**: {{code_quality_score}}
- **测试覆盖率**: {{test_coverage}}
- **依赖更新状态**: {{dependency_status}}
- **性能瓶颈**: {{performance_issues}}
- **安全漏洞**: {{security_vulnerabilities}}

### 2. 兼容性分析
评估新功能与现有系统的兼容性：

#### 架构兼容性
- **设计模式匹配**: 新功能是否符合现有设计模式
- **数据流一致**: 数据处理流程是否与现有流程一致
- **API风格统一**: 接口设计是否符合现有API规范
- **命名约定**: 是否遵循现有的命名规范

#### 技术兼容性
- **框架版本**: {{framework_versions}}
- **依赖库冲突**: {{dependency_conflicts}}
- **运行环境**: {{runtime_environment}}
- **构建工具**: {{build_tools_compatibility}}

## 🔧 扩展策略设计

### 1. 渐进式集成策略
采用风险最小的渐进式方法：

#### 策略选择
- **并行开发**: 新功能与现有系统并行开发，最后集成
- **分支开发**: 在独立分支开发，通过PR合并
- **插件化**: 以插件形式添加功能，降低耦合度
- **微服务化**: 将新功能作为独立服务部署

#### 集成步骤
1. **环境隔离**: 在隔离环境中开发和测试新功能
2. **接口适配**: 创建适配层确保接口兼容
3. **渐进发布**: 使用功能开关逐步发布
4. **监控验证**: 实时监控系统稳定性和性能

### 2. 风险控制措施
建立完善的风险控制机制：

#### 代码级风险控制
- **代码审查**: 严格的代码审查流程
- **静态分析**: 使用工具检测潜在问题
- **依赖分析**: 分析新增依赖的影响
- **兼容性测试**: 全面的兼容性测试

#### 部署级风险控制
- **蓝绿部署**: 零停机时间的部署策略
- **金丝雀发布**: 小批量用户试验新功能
- **回滚机制**: 快速回滚到稳定版本
- **监控告警**: 实时监控和异常告警

## 🏗️ 扩展架构设计

### 1. 最小侵入式设计
设计对现有系统影响最小的扩展方案：

#### 架构模式选择
```
现有系统架构分析:
{{existing_architecture_diagram}}

扩展点识别:
- 接口扩展点: {{interface_extension_points}}
- 服务扩展点: {{service_extension_points}}  
- 数据扩展点: {{data_extension_points}}
- 配置扩展点: {{config_extension_points}}
```

#### 扩展层设计
```javascript
// 示例：适配器模式扩展现有服务
class {{NewFeature}}Adapter {
    constructor(existingService) {
        this.existingService = existingService;
        this.newFeatureService = new {{NewFeature}}Service();
    }

    // 扩展现有方法
    async enhancedMethod(params) {
        // 调用现有方法
        const baseResult = await this.existingService.baseMethod(params);
        
        // 应用新功能增强
        const enhancedResult = await this.newFeatureService.enhance(baseResult);
        
        return enhancedResult;
    }

    // 新增方法
    async newMethod(params) {
        return await this.newFeatureService.process(params);
    }
}
```

### 2. 数据层扩展设计
安全地扩展现有数据模型：

#### 数据库扩展策略
```sql
-- 示例：非破坏性数据库扩展
-- 1. 添加新表
CREATE TABLE {{new_feature_table}} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    {{existing_table}}_id UUID REFERENCES {{existing_table}}(id),
    feature_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 添加新列（可选）
ALTER TABLE {{existing_table}} 
ADD COLUMN {{new_feature_enabled}} BOOLEAN DEFAULT FALSE;

-- 3. 创建索引
CREATE INDEX idx_{{new_feature_table}}_{{existing_table}}_id 
ON {{new_feature_table}}({{existing_table}}_id);
```

#### 数据迁移策略
```javascript
// 数据迁移脚本示例
class {{NewFeature}}Migration {
    async up(database) {
        // 创建新表结构
        await database.createTable('{{new_feature_table}}', {
            // 表结构定义
        });

        // 迁移现有数据（如需要）
        await this.migrateExistingData(database);

        // 创建索引
        await database.createIndexes();
    }

    async down(database) {
        // 回滚操作
        await database.dropTable('{{new_feature_table}}');
    }

    async migrateExistingData(database) {
        // 安全的数据迁移逻辑
        const batchSize = 1000;
        let offset = 0;
        
        while (true) {
            const records = await database.query(
                `SELECT * FROM {{existing_table}} 
                 LIMIT ${batchSize} OFFSET ${offset}`
            );
            
            if (records.length === 0) break;
            
            // 处理当前批次
            await this.processBatch(records);
            offset += batchSize;
        }
    }
}
```

## 🧪 测试策略

### 1. 回归测试设计
确保新功能不会破坏现有功能：

#### 测试分层
```javascript
describe('{{NewFeature}} Integration Tests', () => {
    // 现有功能回归测试
    describe('Existing Functionality', () => {
        it('should not break existing API endpoints', async () => {
            // 测试现有API的正常工作
        });

        it('should maintain existing data integrity', async () => {
            // 测试数据完整性
        });

        it('should preserve existing performance', async () => {
            // 性能基准测试
        });
    });

    // 新功能集成测试
    describe('New Feature Integration', () => {
        it('should work with existing workflows', async () => {
            // 测试与现有工作流的集成
        });

        it('should handle edge cases gracefully', async () => {
            // 边界条件测试
        });
    });
});
```

### 2. 兼容性测试矩阵
```markdown
| 测试场景 | 现有功能 | 新功能启用 | 预期结果 |
|----------|----------|-----------|----------|
| 基础CRUD操作 | ✓ | ✗ | 正常工作 |
| 基础CRUD操作 | ✓ | ✓ | 正常工作，增强功能可用 |
| 数据导入导出 | ✓ | ✓ | 兼容现有格式，支持新格式 |
| 用户认证 | ✓ | ✓ | 现有认证继续有效 |
| 权限控制 | ✓ | ✓ | 现有权限规则继续有效 |
```

## 📦 部署与发布

### 1. 分阶段发布计划
制定详细的发布时间表：

#### Phase 1: 开发环境部署
- **时间**: {{phase1_timeline}}
- **范围**: 内部开发团队
- **验证点**: 基础功能验证，API兼容性测试
- **成功标准**: 所有单元测试和集成测试通过

#### Phase 2: 测试环境部署
- **时间**: {{phase2_timeline}}
- **范围**: QA团队和部分内部用户
- **验证点**: 完整功能测试，性能基准测试
- **成功标准**: 回归测试通过，性能无显著下降

#### Phase 3: 预生产环境部署
- **时间**: {{phase3_timeline}}
- **范围**: 有限的外部用户
- **验证点**: 真实环境测试，用户反馈收集
- **成功标准**: 用户接受度测试通过，系统稳定运行

#### Phase 4: 生产环境发布
- **时间**: {{phase4_timeline}}
- **范围**: 全体用户
- **验证点**: 全面监控，用户体验反馈
- **成功标准**: 系统稳定，用户满意度达标

### 2. 功能开关管理
使用功能开关控制新功能的启用：

```javascript
// 功能开关配置
const featureFlags = {
    {{new_feature_name}}: {
        enabled: process.env.ENABLE_{{NEW_FEATURE_NAME}} === 'true',
        rolloutPercentage: parseInt(process.env.{{NEW_FEATURE_NAME}}_ROLLOUT) || 0,
        allowedUsers: process.env.{{NEW_FEATURE_NAME}}_USERS?.split(',') || [],
        allowedRoles: ['admin', 'beta-tester']
    }
};

// 功能开关检查
function isFeatureEnabled(featureName, user) {
    const feature = featureFlags[featureName];
    
    if (!feature || !feature.enabled) {
        return false;
    }
    
    // 检查用户权限
    if (feature.allowedUsers.includes(user.id) || 
        feature.allowedRoles.some(role => user.roles.includes(role))) {
        return true;
    }
    
    // 按比例放量
    const userHash = hashUserId(user.id);
    return userHash % 100 < feature.rolloutPercentage;
}
```

## 📊 监控与维护

### 1. 关键指标监控
建立全面的监控体系：

#### 技术指标
- **系统性能**: 响应时间、吞吐量、CPU使用率
- **错误率**: 新功能相关错误的发生率
- **资源使用**: 内存、磁盘、网络资源消耗
- **数据库性能**: 查询时间、连接数、锁等待

#### 业务指标
- **功能使用率**: 新功能的采用率和使用频率
- **用户满意度**: 用户反馈和满意度评分
- **业务影响**: 新功能对核心业务指标的影响
- **转化率**: 新功能对业务转化的促进效果

### 2. 告警机制设置
```yaml
# 监控告警配置示例
alerts:
  - name: "{{NewFeature}} Error Rate High"
    condition: "error_rate > 5%"
    for: "5m"
    severity: "critical"
    channels: ["slack", "email"]
    
  - name: "{{NewFeature}} Response Time High"  
    condition: "response_time > 2s"
    for: "2m"
    severity: "warning"
    channels: ["slack"]
    
  - name: "{{NewFeature}} Usage Drop"
    condition: "usage_rate < 50% of baseline"
    for: "15m" 
    severity: "warning"
    channels: ["product-team"]
```

## 🔄 迭代改进流程

### 1. 反馈收集机制
建立系统性的反馈收集：

#### 用户反馈渠道
- **应用内反馈**: 直接在应用中收集用户反馈
- **用户调研**: 定期的用户访谈和问卷调查
- **使用数据分析**: 通过数据分析了解用户行为
- **客服反馈**: 收集客服渠道的用户问题

#### 技术反馈渠道
- **开发团队反馈**: 开发过程中的技术问题和改进建议
- **运维团队反馈**: 部署和运维过程中发现的问题
- **性能监控**: 自动化监控系统发现的性能问题
- **安全扫描**: 安全工具发现的潜在风险

### 2. 持续优化策略
```markdown
## 优化循环流程

### 周期性评估 (每2周)
- [ ] 收集和分析用户反馈
- [ ] 评估关键性能指标
- [ ] 识别改进机会
- [ ] 制定优化计划

### 月度回顾
- [ ] 功能使用情况分析
- [ ] 技术债务评估
- [ ] 用户满意度评测
- [ ] 路线图调整

### 季度规划
- [ ] 功能路线图更新
- [ ] 架构演进计划
- [ ] 资源配置调整
- [ ] 团队技能提升
```

## 🎯 成功验收标准

### 功能性验收
- [ ] 新功能按需求规范正确实现
- [ ] 现有功能完全兼容无影响
- [ ] 所有自动化测试通过
- [ ] 用户验收测试通过
- [ ] 性能基准达标
- [ ] 安全扫描无高危漏洞

### 质量验收
- [ ] 代码审查通过
- [ ] 文档完整准确
- [ ] 监控告警配置到位
- [ ] 回滚方案验证有效
- [ ] 团队培训完成
- [ ] 运维手册更新

### 业务验收
- [ ] 用户满意度达标
- [ ] 业务指标正向影响
- [ ] 投入产出比合理
- [ ] 后续迭代计划明确

---
*模板版本*: v4.0  
*适用模式*: Create  
*步骤*: existing-project - 现有项目扩展  
*生成时间*: {{timestamp}}