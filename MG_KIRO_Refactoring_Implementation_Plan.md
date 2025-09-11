# MG_KIRO 重构实施计划

## 📋 项目重构总览

基于新的工作流程设计，需要对 mg_kiro MCP Server 进行全面重构，引入智能文件分析模块作为系统大脑，实现分层验证策略和统一任务管理。

### 🎯 重构目标
- **删除冗余功能**: 移除 aiGenerationGuide 相关代码
- **引入智能核心**: FileAnalysisModule 作为协调大脑
- **三种批次策略**: 综合文件批次、单文件单批次、大文件多批次
- **分层验证机制**: Step3文件夹检查、Step4模块文件夹检查、Step5/6固定文件检查
- **统一任务管理**: 扩展到全部6个步骤

---

## 🗂️ 第一阶段：核心架构搭建

### 📁 1.1 创建文件分析模块目录结构

**新增目录**: `server/services/file-analysis/`
```
file-analysis/
├── FileAnalysisModule.js          # 主要协调模块
├── token-analysis/
│   ├── PreciseTokenCalculator.js  # 精确Token计算器
│   ├── CodeStructureAnalyzer.js   # 代码结构分析器
│   └── FunctionBoundaryDetector.js # 函数边界检测器
├── batch-strategies/
│   ├── CombinedFileBatchStrategy.js # 综合文件批次策略
│   ├── SingleFileBatchStrategy.js   # 单文件单批次策略
│   └── LargeFileMultiBatchStrategy.js # 大文件多批次策略
└── task-generators/
    ├── TaskDefinitionGenerator.js  # 任务定义生成器
    └── TaskProgressTracker.js      # 任务进度跟踪器
```

**需要实现的核心功能**:
- Token精确计算（考虑不同语言特性）
- 智能文件分组算法
- 三种批次策略的具体实现
- 任务ID生成规范（task_1, task_2_1等）

### 📁 1.2 创建统一任务管理目录结构

**新增目录**: `server/services/task-management/`
```
task-management/
├── UnifiedTaskManager.js          # 统一任务管理器（重构版）
├── UnifiedTaskValidator.js.js     # 简化任务验证器
├── TaskStateManager.js            # 任务状态管理器
└── validation-strategies/
    ├── Step3FolderValidator.js     # Step3文件夹验证
    ├── Step4ModuleValidator.js     # Step4模块文件夹验证
    ├── Step5FixedFileValidator.js  # Step5固定文件验证
    └── Step6ArchitectureValidator.js # Step6架构文档验证
```

**需要实现的核心功能**:
- 分层验证策略
- 自动任务完成机制
- 任务状态管理和追踪
- 错误检测和重试逻辑

---

## 🔧 第二阶段：移除冗余功能

### 🗑️ 2.1 删除 aiGenerationGuide 相关代码

**需要修改的文件**: `index.js`
- **位置**: Step1 项目分析工具（约第749-854行）
- **删除内容**: 
  - aiGenerationGuide 相关的数据生成逻辑
  - 批次大小建议功能
  - 文档策略建议功能
- **保留内容**:
  - 项目元数据收集
  - 语言检测和框架识别
  - 目录结构分析
  - 基础依赖关系提取

**需要修改的服务文件**:
- `server/services/project-overview-generator.js` - 移除 aiGenerationGuide 生成逻辑
- 相关的配置文件中移除 aiGenerationGuide 相关配置

### 🔄 2.2 重构 Step1 输出格式

**修改内容**:
- 简化 Step1 输出，移除 aiGenerationGuide 字段
- 调整数据结构，为 Step2 FileAnalysisModule 提供所需的基础数据
- 更新响应格式，确保与新的工作流程兼容

---

## 🧠 第三阶段：实现文件分析模块

### 🔨 3.1 实现 FileAnalysisModule 核心

**新文件**: `server/services/file-analysis/FileAnalysisModule.js`

**核心功能实现**:
1. **精确Token分析**
   - 集成 PreciseTokenCalculator
   - 支持多语言Token计算
   - 考虑注释、字符串、函数结构等因素

2. **智能批次分配**
   - 小文件（<15K tokens）→ 综合文件批次策略
   - 中等文件（15K-20K tokens）→ 单文件单批次策略  
   - 大文件（>20K tokens）→ 大文件多批次策略

3. **任务定义生成**
   - 生成标准化任务ID（task_1, task_2_1, task_2_2等）
   - 创建任务元数据（预期文件、处理策略等）
   - 生成批次处理计划

### 🔨 3.2 实现三种批次策略

**综合文件批次策略** (`CombinedFileBatchStrategy.js`)
- 将多个小文件合并到一个批次
- 目标：每批次约18K tokens
- 生成一个任务ID，包含多个文件

**单文件单批次策略** (`SingleFileBatchStrategy.js`)
- 中等大小文件独立处理
- 一个文件一个批次
- 生成独立的任务ID

**大文件多批次策略** (`LargeFileMultiBatchStrategy.js`)
- 大文件智能拆分
- 函数边界检测，避免破坏代码结构
- 生成多个子任务ID（task_X_1, task_X_2等）

### 🔨 3.3 Token计算器实现

**新文件**: `server/services/file-analysis/token-analysis/PreciseTokenCalculator.js`

**需要实现的功能**:
- 支持不同编程语言的Token计算规则
- 准确处理注释、字符串、关键字权重
- 提供Token预估和实际计算
- 缓存机制优化性能

---

## 🎯 第四阶段：重构验证机制

### 🔨 4.1 实现 UnifiedTaskValidator.js

**新文件**: `server/services/task-management/UnifiedTaskValidator.js.js`

**核心方法重构**:
1. **checkTaskCompletion()** - 替代原来的 validateAndCompleteTask()
2. **分层验证策略**:
   - Step3: 检查文档文件夹是否有.md文件
   - Step4: 检查模块文档文件夹是否有.md文件  
   - Step5: 检查 relations.md 是否存在
   - Step6: 检查 README.md, architecture.md 是否存在

3. **自动完成机制**:
   - 验证通过时自动调用任务管理器完成任务
   - 验证失败时提供具体的缺失文件信息

### 🔨 4.2 创建具体验证策略

**四个验证策略文件**:
- `Step3FolderValidator.js` - 文件夹内容检查
- `Step4ModuleValidator.js` - 模块文档文件夹检查
- `Step5FixedFileValidator.js` - relations.md 文件检查
- `Step6ArchitectureValidator.js` - 架构文档文件检查

**每个验证器需要实现**:
- 特定的验证逻辑
- 错误信息生成
- 自动完成触发

---

## 🔄 第五阶段：重构现有工具

### 🔨 5.1 重构 init_step2_create_todos

**修改文件**: `index.js` （约第854-971行）

**重构内容**:
- 移除原来的简单任务创建逻辑
- 集成 FileAnalysisModule
- 调用文件分析模块生成智能批次计划
- 输出详细的任务定义和处理策略

**新的工作流程**:
1. 接收 Step1 的项目基础数据
2. 调用 FileAnalysisModule 进行文件分析
3. 生成三种策略的批次计划
4. 创建任务队列和处理策略
5. 返回完整的任务管理计划

### 🔨 5.2 重构 init_step3 系列工具

**需要重构的工具**:
- `init_step3_get_next_task` - 与FileAnalysisModule协调
- `init_step3_get_file_content` - 支持批次策略
- `init_step3_generate_analysis` - 适配新的批次类型
- `init_step3_complete_task` - 使用新的验证机制

**重构要点**:
- 所有Step3工具都要与FileAnalysisModule协调
- 支持三种不同的批次处理模式
- 使用UnifiedTaskValidator.js进行验证
- 实现自动任务完成机制

### 🔨 5.3 扩展 Step4-6 统一任务管理

**重构 init_step4_module_integration**:
- 使用 UnifiedTaskManager 创建模块整合任务
- 应用文件夹验证策略
- 自动完成机制

**重构 init_step5_module_relations**:
- 统一任务管理
- 固定文件验证（relations.md）
- 自动完成机制

**重构 init_step6_architecture_docs**:
- 统一任务管理  
- 固定文件验证（README.md, architecture.md）
- 自动完成机制

---

## 📡 第六阶段：MCP工具接口更新 ✅ **已完成**

### 🔨 6.1 新增工具接口定义 ✅

**修改文件**: `index.js` 工具定义部分

**新增工具**:
```javascript
{
  name: "init_step2_file_analysis", 
  description: "Step2: 文件分析模块 - 智能Token分析和批次规划，使用FileAnalysisModule作为系统大脑进行精确的文件分析和智能批次分配"
}
```

**修改现有工具** ✅:
- ✅ 更新Step4-6工具描述，反映统一任务管理器和新验证机制
- ✅ init_step3_check_task_completion 支持stepType参数
- ✅ 标记init_step3_complete_task为废弃工具

### 🔨 6.2 更新工具执行逻辑 ✅

**重大修改点**:
1. **init_step3_complete_task** → **init_step3_check_task_completion** ✅
   - ✅ 新增 stepType 参数支持Step3-6验证
   - ✅ 使用分层验证策略（UnifiedTaskValidator）
   - ✅ 实现自动完成机制
   - ✅ 废弃旧工具并提供迁移指导

2. **所有Step工具** ✅:
   - ✅ Step4-6集成 UnifiedTaskManager
   - ✅ 使用 UnifiedTaskValidator 进行验证
   - ✅ 统一错误处理和响应格式
   - ✅ 更新next_steps指向新验证工具

**完成状态**:
- ✅ 工具接口定义更新完成
- ✅ 废弃工具标记和迁移指导完成  
- ✅ 所有工具描述更新完成
- ✅ 错误消息中工具列表更新完成

---

## 🧪 第七阶段：服务注册和集成 ✅ **已完成**

### 🔨 7.1 更新服务注册 ✅

**修改文件**: `server/services/service-registry.js`

**新增服务注册** ✅:
```javascript
// 文件分析模块层（依赖基础服务）
serviceBus
    .register('preciseTokenCalculator', PreciseTokenCalculator, {}, [])
    .register('combinedFileBatchStrategy', CombinedFileBatchStrategy, {}, [])
    .register('singleFileBatchStrategy', SingleFileBatchStrategy, {}, [])
    .register('largeFileMultiBatchStrategy', LargeFileMultiBatchStrategy, {}, [])
    .register('taskStateManager', TaskStateManager, {}, []);

// 文件分析模块核心（依赖Token计算器和批次策略）
serviceBus
    .register('fileAnalysisModule', FileAnalysisModule, {}, [
        'preciseTokenCalculator',
        'combinedFileBatchStrategy',
        'singleFileBatchStrategy',
        'largeFileMultiBatchStrategy'
    ]);

// 任务管理模块（依赖文件分析模块）
serviceBus
    .register('unifiedTaskValidator', UnifiedTaskValidator, {}, [
        'fileAnalysisModule',
        'taskStateManager'
    ])
    .register('unifiedTaskManager', UnifiedTaskManager, {}, [
        'taskStateManager',
        'unifiedTaskValidator'
    ]);
```

### 🔨 7.2 更新服务容器 ✅

**修改文件**: `index.js` 的 getServiceContainer 函数

**新增服务引用** ✅:
```javascript
// 新的文件分析模块和任务管理服务
fileAnalysisModule: serviceBus.get('fileAnalysisModule'),
unifiedTaskManager: serviceBus.get('unifiedTaskManager'),
unifiedTaskValidator: serviceBus.get('unifiedTaskValidator'),
taskStateManager: serviceBus.get('taskStateManager'),

// 文件分析模块组件（可选直接访问）
preciseTokenCalculator: serviceBus.get('preciseTokenCalculator'),
combinedFileBatchStrategy: serviceBus.get('combinedFileBatchStrategy'),
singleFileBatchStrategy: serviceBus.get('singleFileBatchStrategy'),
largeFileMultiBatchStrategy: serviceBus.get('largeFileMultiBatchStrategy'),
```

### 🔨 7.3 依赖注入修正 ✅

**修正构造函数签名** ✅:
- ✅ UnifiedTaskManager: 修正为ServiceBus格式 `(config, dependencies, serviceBus)`
- ✅ UnifiedTaskValidator: 修正为ServiceBus格式 `(config, dependencies, serviceBus)`
- ✅ FileAnalysisModule: 修正为ServiceBus格式 `(config, dependencies, serviceBus)`
- ✅ TaskStateManager: 修正为ServiceBus格式 `(config, dependencies, serviceBus)`

**循环依赖解决** ✅:
- ✅ 在`service-registry.js`中通过`injectDependencies`设置循环依赖
- ✅ UnifiedTaskValidator获得UnifiedTaskManager引用

### 🔨 7.4 验证测试 ✅

**创建测试脚本** ✅: `scripts/test-service-registry.js`
- ✅ 验证所有18个服务正确初始化
- ✅ 验证依赖注入正确工作
- ✅ 验证循环依赖正确解决
- ✅ 验证功能方法正常工作

**完成状态**:
- ✅ 服务注册配置完成
- ✅ 服务容器更新完成
- ✅ 依赖注入修正完成
- ✅ 循环依赖解决完成
- ✅ 测试验证全部通过

---

## 🧪 第八阶段：测试和验证

### 🔨 8.1 创建测试文件

**新增测试目录**: `tests/file-analysis/`
```
tests/file-analysis/
├── FileAnalysisModule.test.js
├── PreciseTokenCalculator.test.js
├── BatchStrategies.test.js
└── integration/
    ├── Step3Workflow.test.js
    ├── TaskManagement.test.js
    └── EndToEndFlow.test.js
```

**测试覆盖范围**:
- 文件分析模块的各种策略
- Token计算的准确性
- 批次分配的合理性
- 验证机制的正确性
- 端到端工作流程测试

### 🔨 8.2 创建验证脚本

**新增验证脚本**: `scripts/validate-refactoring.js`

**验证内容**:
- 所有新模块的功能完整性
- 与现有代码的兼容性
- 性能对比（重构前后）
- 错误处理的健壮性

---

## 📚 第九阶段：文档和配置更新

### 🔨 9.1 更新配置文件

**需要修改的配置**:
- `config/mcp.config.json` - 新增文件分析模块配置
- `config/modes.config.json` - 更新工作模式定义
- `config/templates.config.json` - 适配新的批次策略

### 🔨 9.2 更新项目文档

**需要更新的文档**:
- `README.md` - 反映新的架构和功能
- `CLAUDE.md` - 更新开发指南
- API文档 - 更新MCP工具接口说明

---

## 🚀 第十阶段：部署和回归测试

### 🔨 10.1 渐进式部署策略

**部署步骤**:
1. **开发环境验证** - 完整功能测试
2. **兼容性测试** - 确保向下兼容
3. **性能测试** - 对比重构前后性能
4. **生产环境部署** - 谨慎的生产部署

### 🔨 10.2 回归测试计划

**测试范围**:
- 所有原有功能正常工作
- 新功能按设计工作
- 边界情况处理正确
- 错误恢复机制有效

---

## 📊 预期影响评估

### ✅ 正面影响
- **Token效率提升 30%+** - 精确计算和智能分配
- **错误率降低 50%+** - 简化验证和自动完成
- **开发体验改善** - 统一任务管理和清晰流程
- **系统稳定性提升** - 分层架构和错误处理

### ⚠️ 风险控制
- **向下兼容性** - 保持现有API接口稳定
- **渐进式迁移** - 分阶段实施，降低风险
- **回滚方案** - 完整的代码备份和回滚策略
- **监控机制** - 实时监控新功能的运行状态

---

## 🎯 实施优先级

### 🔥 高优先级（必须实现）
1. FileAnalysisModule 核心功能
2. UnifiedTaskValidator.js 验证机制
3. Step3 验证流程重构
4. 三种批次策略实现

### 🔶 中优先级（重要功能）
5. UnifiedTaskManager 扩展
6. Step4-6 统一任务管理
7. MCP工具接口更新
8. 服务注册和集成

### 🔵 低优先级（优化功能）
9. 性能优化和缓存
10. 全面测试覆盖
11. 文档和配置更新
12. 监控和日志增强

---

## 📋 总结

这个重构计划涵盖了从架构设计到具体实施的所有细节。核心是引入FileAnalysisModule作为智能大脑，实现分层验证策略，并将统一任务管理扩展到全部6个步骤。

**关键成功因素**:
- 严格按照设计文档实施
- 保持代码质量和测试覆盖
- 渐进式部署，降低风险
- 持续监控和优化

通过这个计划，mg_kiro MCP Server将实现更智能的文件处理、更精确的Token管理和更统一的任务流程。