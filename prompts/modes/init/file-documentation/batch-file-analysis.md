# 🔄 批次任务处理指南

## ⚠️ 批次任务要求

**这是一个批次任务！必须处理完所有文件才算完成。**

### 📋 任务特征识别
- 系统返回了多个文件需要处理
- 每个文件都必须生成对应的 `文件名.md` 文档
- 处理完一个文件后，必须继续处理下一个文件

### 🔄 完整处理流程（每个文件重复）

```
1. init_step3_get_next_task      ← 获取下一个文件任务
2. init_step3_get_file_content   ← 获取文件内容  
3. init_step3_generate_analysis  ← 生成分析文档
4. init_step3_check_task_completion ← 检查完成状态
   ↓
   如果还有文件 → 返回步骤1
   如果全部完成 → 进入Step4
```

## 🎯 批次任务完成标准

### ✅ 成功完成的条件：
- **所有文件**都已处理
- **每个文件**都有对应的分析文档
- 系统提示 "Step3批次任务完成"

### ❌ 常见错误：
- 只处理第一个文件就停止
- 忘记调用 `get_next_task` 获取下一个文件
- 没有验证所有文件都有文档

## 🚨 关键提醒

### 当 `check_task_completion` 返回成功时：
- **如果显示 "continue_next_file"** → 立即调用 `init_step3_get_next_task`
- **如果显示 "step_completed"** → 调用 `init_step4_module_integration`

### 当 `check_task_completion` 返回失败时：
- 检查缺失的分析文档
- 使用 Write 工具创建缺失的文档
- 再次调用 `check_task_completion` 验证

## 🔍 进度监控

### 批次进度识别：
- 系统会显示 "【批次进度 X/Y】"
- X = 当前处理的文件序号
- Y = 总文件数量

### 完成判断：
```
✅ 完成：所有 Y 个文件都有 文件名.md 文档
❌ 未完成：还有文件缺少分析文档
```

---

# {{fileName}} - 代码技术分析

**🔄 批次任务进度：第 {{currentIndex}}/{{totalFiles}} 个文件**

## 📄 文件基础信息

**文件路径**: `{{filePath}}`  
**编程语言**: {{language}}  
**文件大小**: {{fileSize}}  
**代码行数**: {{lineCount}}  

## 🎯 功能分析

### 核心职责
{{primaryResponsibilities}}

### 主要功能点
{{keyFunctions}}

## 🏗️ 代码结构分析

### 导入模块分析
```{{language}}
{{imports}}
```
**导入分析**: {{importAnalysis}}

### 导出接口分析
```{{language}}
{{exports}}
```
**导出分析**: {{exportAnalysis}}

### 主要类/函数结构
{{codeStructure}}

## 🔧 函数实现分析

### 核心函数详解
{{functionImplementations}}

### 函数调用链分析
{{functionCallChain}}

### 数据流分析
{{dataFlow}}

### 算法逻辑分析
{{algorithmLogic}}

## 🔗 依赖与调用关系

### 对外部模块的依赖
{{externalDependencies}}

### 内部函数间的调用关系
{{internalCallRelationships}}

### 被其他模块调用的情况
{{usageByOtherModules}}

## 💾 数据处理分析

### 数据结构定义
{{dataStructures}}

### 数据变换逻辑
{{dataTransformations}}

### 状态管理机制
{{stateManagement}}

## ⚙️ 技术实现细节

### 设计模式运用
{{designPatterns}}

### 关键算法实现
{{keyAlgorithms}}

### 错误处理机制
{{errorHandling}}

### 性能相关实现
{{performanceImplementation}}

## 🚀 代码运行逻辑

### 典型执行流程
{{executionFlow}}

### 关键代码片段解析
```{{language}}
{{keyCodeSnippets}}
```

### 边界条件处理
{{boundaryConditions}}

---

**🔄 批次任务提醒**：
- 当前文件: {{fileName}} (第{{currentIndex}}/{{totalFiles}}个)
- 剩余文件: {{remainingFiles}}个
- 下一步: 调用 `init_step3_check_task_completion` 验证完成状态

**分析时间**: {{generatedAt}}  
**分析工具**: mg_kiro v5.0.0