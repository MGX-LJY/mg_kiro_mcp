# MG_KIRO MCP Server 重构需求文档

## 📋 项目概述

### 1.1 重构背景
当前 mg_kiro MCP Server 的 Init Mode 在 token 管理和文件批次处理方面存在不足：
- token 计算不够精确，导致批次分配不合理
- 缺乏智能的文件分组策略
- 任务管理仅限于 Step 3，其他步骤缺乏统一管理
- aiGenerationGuide 功能冗余，需要简化

### 1.2 重构目标
1. **引入智能文件分析模块**：作为整个系统的协调大脑
2. **实现三种批次策略**：综合文件批次、大文件多批次、单文件单批次
3. **统一任务管理**：将任务管理扩展到全部 6 个步骤
4. **精确 token 管理**：实现精确的 token 计算和智能批次分配
5. **简化项目分析**：删除 aiGenerationGuide 相关功能

### 1.3 预期效果
- 提高 token 使用效率 30%+
- 减少文件处理错误 50%+
- 提升 AI 协作体验
- 实现全流程统一任务管理

## 🎯 功能需求

### 2.1 Step 1: 项目分析 

#### 2.1.1 保留功能
- ✅ 项目元数据收集（项目名称、总文件数、项目大小）
- ✅ 语言检测和框架识别
- ✅ 目录结构分析（支持 maxDepth 参数）
- ✅ 基础依赖关系提取

#### 2.1.2 删除功能
- ❌ aiGenerationGuide 相关功能
- ❌ 批次大小建议功能
- ❌ 文档策略建议功能

#### 2.1.3 输出要求
```json
{
  "projectMetadata": {
    "name": "string",
    "totalFiles": "number",
    "projectSize": "number",
    "lastModified": "string"
  },
  "languageProfile": {
    "primary": "string",
    "frameworks": ["array"],
    "dependencies": "object"
  },
  "directoryStructure": "object",
  "keyFileContents": "object"
}
```

### 2.2 Step 2: 文件分析模块 (核心重构)

#### 2.2.1 核心组件需求

##### PreciseTokenAnalyzer (精确 Token 分析器)
**功能需求**:
- 对每个源码文件进行精确的 token 计算
- 支持中英文混合内容的 token 估算
- 基于文件类型进行 token 密度优化
- 分析代码结构，识别函数边界

**技术要求**:
```javascript
class PreciseTokenAnalyzer {
  calculateFileTokens(filePath, content, language) {
    // 返回精确的 token 数量
    // 考虑语言特性和代码密度
  }
  
  analyzeCodeStructure(content, language) {
    // 分析代码结构
    // 识别函数、类、模块边界
  }
  
  findFunctionBoundaries(content) {
    // 找到函数边界，用于大文件拆分
    // 确保拆分时不破坏函数完整性
  }
}
```

##### IntelligentBatchStrategist (智能批次策略器)
**功能需求**:
- 实现三种批次策略的智能选择
- 自动优化批次分配，目标 token 数约 18K
- 验证批次计划的合理性

**三种策略详细需求**:

1. **综合文件批次策略**
   - 适用条件：文件 token < 15K
   - 处理逻辑：将多个小文件合并到一个批次
   - 目标大小：约 18K tokens/批次
   - 示例：3K + 5K + 10K = 18K tokens → task_1

2. **单文件单批次策略**
   - 适用条件：15K ≤ 文件 token ≤ 20K
   - 处理逻辑：每个文件独立成一个批次
   - 示例：18K tokens → task_2

3. **大文件多批次策略**
   - 适用条件：文件 token > 20K
   - 处理逻辑：在不破坏函数结构的前提下拆分文件
   - 拆分原则：保持函数完整性，避免拆分函数内部
   - 示例：28K tokens → task_3_1 (14K) + task_3_2 (14K)

##### SmartFileGrouper (智能文件分组器)
**功能需求**:
- 基于文件特征进行智能分组
- 考虑文件依赖关系进行分组优化
- 生成最优的处理顺序

##### UnifiedTaskManager (统一任务管理器)
**功能需求**:
- 为所有 6 个步骤创建统一的任务管理
- 生成标准化的任务 ID
- 跟踪任务进度和状态
- 提供任务完成验证

#### 2.2.2 输出要求
```json
{
  "batchPlan": {
    "combinedBatches": [
      {
        "taskId": "task_1",
        "files": ["file1.js", "file2.js", "file3.js"],
        "totalTokens": 18000,
        "strategy": "combined"
      }
    ],
    "singleBatches": [
      {
        "taskId": "task_2", 
        "files": ["file4.js"],
        "totalTokens": 18000,
        "strategy": "single"
      }
    ],
    "multiBatches": [
      {
        "taskId": "task_3_1",
        "files": ["file5.js"],
        "totalTokens": 14000,
        "strategy": "multi",
        "partIndex": 1,
        "totalParts": 2
      }
    ]
  },
  "processingStrategy": {
    "totalTasks": 10,
    "estimatedTime": "45 minutes",
    "recommendedBatchSize": 18000
  },
  "taskDefinitions": ["array of task definitions"]
}
```

### 2.3 Step 3: 文件文档循环生成 (重构)

#### 2.3.1 get_next_task 重构需求
**功能需求**:
- 从文件分析模块获取任务队列
- 返回下一个待处理的任务信息
- 支持任务类型识别（综合/单文件/多批次）

**接口要求**:
```json
{
  "input": {
    "projectPath": "string (required)"
  },
  "output": {
    "taskId": "task_1 | task_2_1",
    "taskType": "combined | single | multi",
    "files": ["array of files"],
    "totalTokens": "number",
    "processingInstructions": "object",
    "hasMoreTasks": "boolean"
  }
}
```

#### 2.3.2 get_file_content 重构需求
**功能需求**:
- 根据任务类型返回不同的文件内容
- 综合文件批次：返回多个文件内容
- 单文件单批次：返回单个文件完整内容
- 大文件多批次：返回文件指定片段内容

**处理逻辑**:
```javascript
// 综合文件批次
if (taskType === 'combined') {
  return {
    files: [
      { name: 'file1.js', content: 'content1' },
      { name: 'file2.js', content: 'content2' },
      { name: 'file3.js', content: 'content3' }
    ]
  };
}

// 大文件多批次
if (taskType === 'multi') {
  return {
    fileName: 'largeFile.js',
    partIndex: 1,
    totalParts: 2,
    content: 'file content segment 1',
    isLastPart: false
  };
}
```

#### 2.3.3 generate_analysis 重构需求
**功能需求**:
- 根据文件分析模块提供的模板进行文档生成
- 支持不同批次策略的模板选择
- 综合文件批次：提供多文件生成模板
- 大文件多批次：提供片段分析模板和完整文件模板
- 单文件单批次：提供单文件模板

**模板映射需求**:
```json
{
  "combined": "multi-file-analysis.template",
  "single": "single-file-analysis.template", 
  "multi_segment": "file-segment-analysis.template",
  "multi_complete": "complete-file-analysis.template"
}
```

#### 2.3.4 check_task_completion 重构需求
**功能需求**:
- ✅ **简化验证**: 检查预期文件是否存在
- ✅ **自动完成**: 文件存在即自动标记任务完成
- ✅ **精确反馈**: 文件缺失时明确告知 AI 哪些文件未生成
- ✅ **减少操作**: 系统自动管理任务状态，AI专注内容生成

**简化验证逻辑**:
```javascript
// 简化验证逻辑：只检查文件存在性
async function checkTaskCompletion(taskId, projectPath) {
  const expectedFiles = fileAnalysisModule.getExpectedFiles(taskId);
  const validation = {
    taskId,
    success: false,
    autoCompleted: false,
    existingFiles: [],
    missingFiles: []
  };

  // 检查文件存在性
  for (const fileName of expectedFiles) {
    const filePath = path.join(projectPath, 'mg_kiro', getFileDir(fileName), fileName);
    if (fs.existsSync(filePath)) {
      validation.existingFiles.push(fileName);
    } else {
      validation.missingFiles.push(fileName);
    }
  }

  // 自动完成逻辑
  if (validation.missingFiles.length === 0) {
    // 🎉 所有文件存在，自动完成任务
    validation.success = true;
    validation.autoCompleted = true;
    await autoCompleteTask(taskId);
    
    return {
      taskCompleted: true,
      method: 'auto',
      message: `任务 ${taskId} 自动完成：${validation.existingFiles.length} 个文件已生成`,
      nextAction: 'proceed_to_next_task'
    };
  } else {
    // ⚠️ 文件缺失，需要重新生成
    return {
      taskCompleted: false,
      message: `任务 ${taskId} 未完成：${validation.missingFiles.length} 个文件缺失`,
      missingFiles: validation.missingFiles,
      existingFiles: validation.existingFiles,
      aiInstruction: `请生成以下缺失文件：${validation.missingFiles.join(', ')}`,
      nextAction: 'regenerate_missing_files'
    };
  }
}
```

### 2.4 Step 4-6: 统一任务管理扩展

#### 2.4.1 Step 4: 模块整合任务管理
**任务命名**: `module_integration_task_1`, `module_integration_task_2`...

**功能需求**:
- 读取 Step 3 生成的文件文档
- 使用统一任务管理器创建模块整合任务
- 提供模块整合模板
- 验证: 只检查模块文档文件是否生成
- **自动完成**: 文件存在即自动完成任务

#### 2.4.2 Step 5: 模块关联分析任务管理（简化版）
**任务命名**: `relations_analysis_task_1`, `relations_analysis_task_2`...

**功能需求**:
- 读取 Step 4 生成的模块文档
- 创建关联分析任务
- 提供关联分析模板
-  **简化验证**: 检查关联分析文档文件是否生成
-  **自动完成**: 文件存在即自动完成任务

#### 2.4.3 Step 6: 架构文档生成任务管理（简化版）
**任务命名**: `architecture_task_1`, `architecture_task_2`...

**功能需求**:
- 读取所有已生成文档
- 创建架构文档生成任务
- 提供架构文档模板
-  **简化验证**: 检查最终架构文档文件是否生成（README.md, architecture.md等）
-  **自动完成**: 文件存在即自动完成任务

## 🏗️ 技术需求

### 3.1 系统架构要求

#### 3.1.1 文件分析模块架构
```
FileAnalysisModule/
├── TokenAnalyzer/
│   ├── PreciseTokenCalculator
│   ├── CodeStructureAnalyzer
│   └── FunctionBoundaryDetector
├── BatchStrategist/
│   ├── CombinedFileBatchStrategy
│   ├── SingleFileBatchStrategy
│   └── LargeFileMultiBatchStrategy
├── TaskManager/
│   ├── TaskDefinitionGenerator
│   ├── TaskProgressTracker
│   └── TaskCompletionValidator
└── FileGrouper/
    ├── DependencyAnalyzer
    ├── FileTypeGrouper
    └── ProcessingOrderOptimizer
```

#### 3.1.2 服务注册要求
- 在 `service-registry.js` 中注册 FileAnalysisModule
- 设置正确的依赖关系
- 支持依赖注入和生命周期管理

### 3.2 数据结构要求

#### 3.2.1 核心数据结构

##### FileAnalysisResult
```typescript
interface FileAnalysisResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  tokenCount: number;
  language: string;
  codeStructure: {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: ImportInfo[];
  };
  complexity: 'low' | 'medium' | 'high';
  processingPriority: number;
}
```

##### BatchPlan
```typescript
interface BatchPlan {
  batchId: string;
  strategy: 'combined' | 'single' | 'multi';
  files: FileAnalysisResult[];
  totalTokens: number;
  expectedOutputs: string[];
  processingInstructions: ProcessingInstructions;
}
```

##### TaskDefinition
```typescript
interface TaskDefinition {
  taskId: string;
  step: number;
  taskType: string;
  batchPlan: BatchPlan;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
  outputs: string[];
  dependencies: string[];
}
```

#### 3.2.2 配置结构

##### BatchConfiguration
```typescript
interface BatchConfiguration {
  tokenLimits: {
    small: number;     // < 15K
    medium: number;    // 15K-20K  
    large: number;     // > 20K
  };
  targetBatchSize: number;  // ~18K
  maxBatchSize: number;     // 25K
  functionSplitThreshold: number;  // 最小函数分割阈值
}
```

### 3.3 性能要求

#### 3.3.1 Token 计算性能
- 支持并行 token 计算
- 每个文件的 token 计算时间 < 100ms
- 支持增量计算（文件未变更时使用缓存）

#### 3.3.2 批次分配性能
- 批次分配算法时间复杂度 O(n log n)
- 支持大项目（1000+ 文件）的快速分配
- 内存使用优化，避免加载所有文件内容到内存

#### 3.3.3 任务管理性能
- 任务状态更新实时性 < 50ms
- 支持并发任务处理
- 任务进度持久化，支持断点续传

## 🔌 接口设计

### 4.1 MCP 工具接口

#### 4.1.1 重构的工具接口

##### init_step2_file_analysis_module
```json
{
  "name": "init_step2_file_analysis_module",
  "description": "文件分析模块 - 智能Token分析和批次规划",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectPath": {
        "type": "string",
        "description": "项目根目录绝对路径"
      },
      "batchConfig": {
        "type": "object",
        "description": "批次配置（可选）",
        "properties": {
          "targetBatchSize": {"type": "number", "default": 18000},
          "maxBatchSize": {"type": "number", "default": 25000}
        }
      }
    },
    "required": ["projectPath"]
  }
}
```

##### init_step3_get_next_task (重构)
```json
{
  "name": "init_step3_get_next_task",
  "description": "获取下一个文件处理任务（基于文件分析模块）",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "projectPath": {"type": "string"}
    },
    "required": ["projectPath"]
  }
}
```

##### init_step3_get_file_content (重构)
```json
{
  "name": "init_step3_get_file_content",
  "description": "获取任务文件内容（支持三种批次策略）",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectPath": {"type": "string"},
      "taskId": {"type": "string", "description": "任务ID（自动获取）"}
    },
    "required": ["projectPath"]
  }
}
```

##### init_step3_complete_task (重构)
```json
{
  "name": "init_step3_complete_task", 
  "description": "完成任务并验证文档生成（基于文件分析模块验证）",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectPath": {"type": "string"},
      "taskId": {"type": "string"},
      "generatedFiles": {
        "type": "array",
        "description": "AI声明已生成的文件列表",
        "items": {"type": "string"}
      }
    },
    "required": ["projectPath", "taskId"]
  }
}
```

#### 4.1.2 新增工具接口

##### unified_task_manager_status
```json
{
  "name": "unified_task_manager_status",
  "description": "获取统一任务管理器状态（所有步骤）",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectPath": {"type": "string"},
      "step": {
        "type": "number", 
        "description": "步骤号（可选，不提供则返回所有步骤状态）"
      }
    },
    "required": ["projectPath"]
  }
}
```

### 4.2 内部服务接口

#### 4.2.1 FileAnalysisModule 接口
```javascript
class FileAnalysisModule {
  // 主要功能接口
  async analyzeProject(projectPath, config = {})
  async createBatchPlan(analysisResults)
  async generateTaskDefinitions(batchPlan)
  
  // 任务管理接口
  async getNextTask(projectPath)
  async getTaskContent(taskId)
  async validateTaskCompletion(taskId, generatedFiles)
  
  // 查询接口
  async getProjectAnalysisStatus(projectPath)
  async getBatchPlanSummary(projectPath)
  async getTaskProgress(projectPath)
}
```

#### 4.2.2 UnifiedTaskManager 接口
```javascript
class UnifiedTaskManager {
  // 任务创建
  async createStepTasks(step, projectPath, inputData)
  
  // 任务管理
  async getTasksByStep(step, projectPath)
  async updateTaskStatus(taskId, status)
  async completeTask(taskId, outputs)
  
  // 进度跟踪
  async getOverallProgress(projectPath)
  async getStepProgress(step, projectPath)
  
  // 验证
  async validateStepCompletion(step, projectPath)
}
```

## ✅ 验收标准

### 5.1 功能验收标准

#### 5.1.1 Step 1 验收
- ✅ 成功删除 aiGenerationGuide 相关代码
- ✅ 保持项目分析核心功能不变
- ✅ 输出格式符合 Step 2 文件分析模块的输入要求
- ✅ 性能提升：分析时间减少 20%+

#### 5.1.2 Step 2 文件分析模块验收
- ✅ Token 计算准确率 > 95%（与手动计算对比）
- ✅ 三种批次策略正确实现：
  * 综合文件批次：小文件正确合并，总 token 约 18K
  * 单文件单批次：中等文件独立处理
  * 大文件多批次：大文件按函数边界正确拆分
- ✅ 任务 ID 命名符合规范：
  * 综合/单文件：task_1, task_2...
  * 大文件多批次：task_X_1, task_X_2...
- ✅ 批次分配算法效率：1000 文件项目分配时间 < 5s

#### 5.1.3 Step 3 重构验收
- ✅ 四个子工具正确集成文件分析模块
- ✅ 支持三种批次策略的内容获取
- ✅ **简化验证机制准确性 100%**：
  * ✅ 精确检测文件存在性（文件存在 = 任务完成）
  * ✅ 准确报告缺失文件列表及路径
  * ✅ 自动完成机制正常工作：文件生成后自动标记任务完成
  * ✅ 验证时间 < 100ms（简化验证大幅提升性能）
- ✅ 循环处理逻辑正确：处理完所有任务后进入 Step 4
- ✅ **AI操作简化**：减少手动完成任务的操作，AI专注内容生成

#### 5.1.4 Step 4-6 统一任务管理验收
- ✅ 每个步骤都使用统一任务管理器
- ✅ 任务命名规范统一
- ✅ **简化任务状态管理**：
  * ✅ 自动检测任务完成状态
  * ✅ 文件存在即自动完成任务
  * ✅ 任务状态更新实时准确
- ✅ 步骤间任务依赖关系正确
- ✅ **验证效率提升**：
  * ✅ 单个任务验证时间 < 50ms
  * ✅ 自动完成率 > 95%（减少手动操作）
  * ✅ 错误恢复机制有效：缺失文件时明确指导

### 5.2 性能验收标准

#### 5.2.1 Token 管理效率
- ✅ Token 使用效率提升 30%+
- ✅ 批次分配合理性：每批次 token 数 15K-20K 范围内
- ✅ 大文件拆分准确性：不破坏函数结构

#### 5.2.2 系统性能
- ✅ 文件分析模块启动时间 < 1s
- ✅ 任务状态更新延迟 < 50ms
- ✅ 内存使用优化：大项目内存占用 < 500MB

### 5.3 质量验收标准

#### 5.3.1 代码质量
- ✅ 代码覆盖率 > 85%
- ✅ 单元测试通过率 100%
- ✅ 集成测试通过率 100%
- ✅ 代码审查通过

#### 5.3.2 文档质量
- ✅ API 文档完整性 100%
- ✅ 技术文档更新及时
- ✅ 用户手册准确性验证

### 5.4 兼容性验收标准

#### 5.4.1 向后兼容
- ✅ 现有项目的 mg_kiro 文档不受影响
- ✅ 现有 MCP 工具调用方式继续支持（过渡期）
- ✅ 配置文件格式向后兼容

#### 5.4.2 系统兼容
- ✅ 支持多种编程语言项目
- ✅ 支持不同规模项目（小型、中型、大型）
- ✅ 跨平台兼容性（Windows、macOS、Linux）

## 📅 实施计划

### 6.1 开发阶段

#### 阶段 1：核心模块开发（预计 2 周）
**Week 1:**
- 开发 PreciseTokenAnalyzer
- 开发三种批次策略
- 实现基础的 FileAnalysisModule

**Week 2:**  
- 开发 UnifiedTaskManager
- 集成文件分析模块到 Step 2
- 完成核心架构

#### 阶段 2：工具重构（预计 1.5 周）
**Week 3:**
- 重构 Step 1（删除 aiGenerationGuide）
- 重构 Step 3 的四个工具
- 实现新的 MCP 工具接口

**Week 3.5:**
- 扩展 Step 4-6 的统一任务管理
- 完成所有工具接口

#### 阶段 3：测试和优化（预计 1 周）
**Week 4:**
- 单元测试和集成测试
- 性能优化和压力测试
- 文档更新

#### 阶段 4：部署和验收（预计 0.5 周）
**Week 4.5:**
- 部署到测试环境
- 用户验收测试
- 生产环境部署

### 6.2 里程碑

| 里程碑 | 完成时间 | 验收标准 |
|--------|----------|----------|
| 文件分析模块完成 | Week 2 | 三种批次策略正确实现 |
| Step 1-3 重构完成 | Week 3 | 工具接口测试通过 |
| 统一任务管理完成 | Week 3.5 | 全流程任务管理验证 |
| 系统测试完成 | Week 4 | 所有验收标准满足 |
| 项目交付 | Week 4.5 | 生产环境稳定运行 |

### 6.3 风险控制

#### 6.3.1 技术风险
- **Token 计算准确性风险**：建立测试基准，对比多种计算方法
- **大文件拆分复杂性风险**：实现渐进式算法，先支持基础拆分
- **性能优化风险**：建立性能基准测试，持续监控

#### 6.3.2 项目风险  
- **范围蔓延风险**：严格按需求文档执行，变更需正式评审
- **进度延期风险**：每周进度检查，及时调整资源分配
- **质量风险**：每个阶段都有质量门控，不达标不进入下一阶段

## 🎯 总结

本重构项目将彻底改进 mg_kiro MCP Server 的 Init Mode，通过引入智能文件分析模块和统一任务管理，实现：

### 核心价值
1. **智能化提升**：精确的 token 管理和智能批次分配
2. **统一化管理**：全流程统一的任务管理体系
3. **效率化优化**：三种批次策略的精准应用
4. **简化流程**：删除冗余功能，聚焦核心价值

### 技术创新
- **文件分析模块**：作为系统大脑的智能协调中心
- **三种批次策略**：针对不同文件特征的精准处理
- **统一任务管理**：跨步骤的任务标准化管理
- **精确 Token 计算**：基于代码结构的智能 token 分析
- **🎯 简化验证机制**：文件存在性检查 + 自动任务完成的高效方案

### 简化验证机制的核心价值
1. **极致简化**：从复杂的内容完整性验证简化为文件存在性检查
2. **自动高效**：文件生成即自动完成任务，无需手动操作
3. **精确反馈**：缺失文件时给出明确的文件名和路径指导
4. **性能提升**：验证时间从数秒缩短到毫秒级别
5. **用户友好**：AI专注内容创作，系统负责任务管理

这个重构将使 mg_kiro MCP Server 成为更智能、更高效、更自动化的项目文档生成工具，为开发者提供卓越的 AI 协作体验。

---

**文档版本**: v1.0  
**创建时间**: 2025-01-11  
**预计实施时间**: 4.5 周  
**重构范围**: Step 1-6 全面重构