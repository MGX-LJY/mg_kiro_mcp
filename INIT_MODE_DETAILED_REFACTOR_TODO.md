# Init模式详细重构TODO - 基于mg_kiro架构需求

## 📋 重构概述

**基于**: INIT_MODE_FIX_PLAN.md + 用户具体流程要求  
**目标**: 完整实现文档驱动的Init模式，AI分析→文档生成→mg_kiro文件夹  
**核心流程**: 项目扫描→语言识别→内容分析→架构生成→模块生成→集成生成

---

## 🎯 用户要求的5步核心流程

### 步骤1: 项目结构识别 + 架构文档生成
**目标**: 识别项目结构 + 提示词系统生成架构相关3个文件到mg_kiro/architecture/
- `system-architecture.md` - 系统整体架构
- `tech-stack.md` - 技术栈文档  
- `design-principles.md` - 设计原则文档

### 步骤2: 语言识别
**目标**: 智能语言检测并传递上下文到下一步

### 步骤3: 文件通读 + 总模块文档生成  
**目标**: 生成总模块的3个文件到mg_kiro/modules-catalog/
- `modules-catalog.md` - 模块总览目录
- `modules-hierarchy.md` - 模块层次结构
- `modules-dependencies.md` - 模块依赖关系

### 步骤4: 深入模块分析 + 单模块文档生成
**目标**: 每个模块深入分析，生成详细文档到mg_kiro/modules-detail/
- `module-[name].md` - 每个模块的详细文档

### 步骤5: 集成文档生成
**目标**: 基于架构和模块生成连接文件到mg_kiro/integrations/
- `integration-contracts.md` - 集成契约
- `data-flow.md` - 数据流文档
- `api-specifications.md` - API规格文档

---

## 🏗️ 详细实施TODO

### 🔴 阶段一：基础设施建设 (立即执行)

#### TODO-01: 创建mg_kiro文件夹结构
- [ ] **任务**: 在项目根目录创建mg_kiro文件夹系统
- [ ] **执行**: 
```bash
mkdir -p mg_kiro/architecture
mkdir -p mg_kiro/modules-catalog  
mkdir -p mg_kiro/modules-detail
mkdir -p mg_kiro/integrations
```
- [ ] **验证**: 检查文件夹结构完整性
- [ ] **预期结果**: 完整的4层mg_kiro目录结构

#### TODO-02: 实现AI响应处理服务 (核心基础设施)
- [ ] **任务**: 创建`server/services/ai-response-handler.js`
- [ ] **功能要求**:
  - [ ] `ensureMgKiroStructure()` - 确保mg_kiro目录存在
  - [ ] `saveDocument(category, filename, content)` - 保存AI生成的文档
  - [ ] `getDocumentPath(category, filename)` - 获取文档保存路径
  - [ ] 错误处理和日志记录
- [ ] **集成**: 与现有服务体系整合
- [ ] **测试**: 单元测试覆盖

#### TODO-03: 更新工作流步骤定义
- [ ] **任务**: 修改`server/services/workflow-state-service.js`中的init步骤定义
- [ ] **新的步骤流程**:
```javascript
init: [
  { name: 'scan_structure_and_generate_architecture', title: '项目结构分析+架构文档生成', description: '扫描+生成architecture/下3个文件' },
  { name: 'detect_language', title: '智能语言识别', description: '检测项目主要语言和框架' },
  { name: 'scan_files_and_generate_modules', title: '文件通读+总模块文档生成', description: '分析+生成modules-catalog/下3个文件' },
  { name: 'analyze_modules_deeply', title: '深度模块分析+单模块文档生成', description: '生成modules-detail/下各模块文档' },
  { name: 'generate_integration_docs', title: '集成文档生成', description: '生成integrations/下3个连接文件' }
]
```
- [ ] **向下兼容**: 保持现有8步API兼容性

### 🟡 阶段二：路由模块重构 (核心实现)

#### TODO-04: 重构第1步 - 项目结构+架构文档生成
- [ ] **任务**: 重构`server/routes/init/structure.js`
- [ ] **新增API端点**:
  - [ ] `POST /scan-and-generate-architecture` - 扫描+生成架构文档
  - [ ] `POST /save-architecture-docs` - 处理AI生成的架构文档保存
- [ ] **功能实现**:
  - [ ] 调用现有`projectScanner.scanProject()`
  - [ ] 从prompts系统获取architecture模板:
    - [ ] `system-architecture-analysis.md` + `system-architecture-generation.md`
    - [ ] `tech-stack-analysis.md` + `tech-stack-generation.md`
    - [ ] `design-principles-analysis.md` + `design-principles-generation.md`
  - [ ] 构建AI分析数据包
  - [ ] 集成AIResponseHandler保存文档到mg_kiro/architecture/
- [ ] **响应格式**: 标准化AI数据包 + 文档保存确认

#### TODO-05: 增强第2步 - 语言识别传递
- [ ] **任务**: 增强`server/routes/init/language.js`
- [ ] **功能改进**:
  - [ ] 保持现有语言检测逻辑
  - [ ] 增加语言上下文传递到下一步
  - [ ] 添加语言特定的prompt模板选择逻辑
- [ ] **集成**: 确保与第3步的数据传递

#### TODO-06: 重构第3步 - 文件通读+总模块文档生成  
- [ ] **任务**: 重构`server/routes/init/files.js`
- [ ] **新增功能**:
  - [ ] 在现有文件扫描基础上
  - [ ] 添加总模块分析逻辑
  - [ ] 从prompts获取modules模板:
    - [ ] `modules-catalog-analysis.md` + `modules-catalog-generation.md`
    - [ ] `modules-hierarchy-analysis.md` + `modules-hierarchy-generation.md`
    - [ ] `modules-dependencies-analysis.md` + `modules-dependencies-generation.md`
  - [ ] 集成AIResponseHandler保存到mg_kiro/modules-catalog/
- [ ] **API**: `POST /scan-files-and-generate-modules`

#### TODO-07: 重构第4步 - 深度模块分析+单模块文档生成
- [ ] **任务**: 重构`server/routes/init/modules.js`
- [ ] **职责拆分**: 
  - [ ] 移除现有的双职责 (第5步+第7步)
  - [ ] 专注于深度模块分析
- [ ] **功能实现**:
  - [ ] 逐个模块深入分析
  - [ ] 读取模块相关的所有文件内容
  - [ ] 使用`module-analysis.md` + `module-documentation-generation.md`模板
  - [ ] 为每个模块生成`module-[name].md`到mg_kiro/modules-detail/
- [ ] **API**: `POST /analyze-modules-deeply`

#### TODO-08: 重构第5步 - 集成文档生成
- [ ] **任务**: 重构`server/routes/init/contracts.js`
- [ ] **功能扩展**:
  - [ ] 基于前面的架构文档和模块文档
  - [ ] 生成3个集成文档:
    - [ ] `integration-contracts.md` - 使用现有contract模板
    - [ ] `data-flow.md` - 使用新增data-flow模板  
    - [ ] `api-specifications.md` - 使用新增api-spec模板
  - [ ] 集成AIResponseHandler保存到mg_kiro/integrations/
- [ ] **API**: `POST /generate-integration-docs`

### 🟢 阶段三：系统集成与测试 (质量保证)

#### TODO-09: 修复步骤索引问题
- [ ] **任务**: 修复INIT_MODE_FIX_PLAN.md中识别的索引混乱
- [ ] **修改位置**:
  - [ ] `modules.js:208` → `updateStep(workflowId, 4, 'completed')` (新的第4步)
  - [ ] `contracts.js:145` → `updateStep(workflowId, 5, 'completed')` (新的第5步)
- [ ] **验证**: 确保步骤索引与新流程一致

#### TODO-10: 集成prompts子目录系统
- [ ] **任务**: 确保新重构的步骤能正确使用重构后的prompts子目录
- [ ] **验证**: 
  - [ ] analysis/architecture/下的模板正确加载
  - [ ] generation/architecture/下的模板正确加载
  - [ ] analysis/modules/和generation/modules/下的模板正确加载
  - [ ] analysis/integration/和generation/integration/下的模板正确加载
- [ ] **测试**: 完整的模板加载测试

#### TODO-11: 端到端测试
- [ ] **任务**: 完整的Init模式流程测试
- [ ] **测试场景**:
  - [ ] 完整5步流程执行
  - [ ] mg_kiro文件夹正确生成
  - [ ] 12个文档文件正确生成:
    - [ ] `mg_kiro/architecture/`: 3个文件
    - [ ] `mg_kiro/modules-catalog/`: 3个文件  
    - [ ] `mg_kiro/modules-detail/`: N个module文件
    - [ ] `mg_kiro/integrations/`: 3个文件
  - [ ] AI数据包正确构建
  - [ ] 文档内容质量验证
- [ ] **测试工具**: 创建专用测试脚本

### 🔵 阶段四：优化与文档 (长期完善)

#### TODO-12: 性能优化
- [ ] **任务**: 优化重构后的性能
- [ ] **优化点**:
  - [ ] 并行处理优化
  - [ ] 缓存机制优化  
  - [ ] 内存使用优化
  - [ ] AI数据包大小优化
- [ ] **监控**: 添加性能监控指标

#### TODO-13: 错误处理增强
- [ ] **任务**: 完善错误处理机制
- [ ] **覆盖点**:
  - [ ] 文件系统错误 (权限、磁盘空间)
  - [ ] AI响应处理错误
  - [ ] 工作流状态错误
  - [ ] 模板加载错误
- [ ] **恢复机制**: 添加错误恢复和重试逻辑

#### TODO-14: API文档更新
- [ ] **任务**: 更新所有相关文档
- [ ] **文档范围**:
  - [ ] README.md - 更新Init模式描述
  - [ ] CLAUDE.md - 更新开发指南
  - [ ] API文档 - 新增端点文档
  - [ ] 架构图 - 更新数据流图

---

## 📊 实施优先级与时间规划

### 🔴 立即执行 (第1天)
- TODO-01: mg_kiro文件夹创建
- TODO-02: AI响应处理服务实现
- TODO-03: 工作流步骤更新

### 🟡 核心实现 (第2-4天)
- TODO-04: 第1步重构 (架构文档生成)
- TODO-05: 第2步增强 (语言识别)
- TODO-06: 第3步重构 (总模块文档)
- TODO-07: 第4步重构 (单模块文档)  
- TODO-08: 第5步重构 (集成文档)

### 🟢 质量保证 (第5-6天)
- TODO-09: 索引问题修复
- TODO-10: prompts系统集成
- TODO-11: 端到端测试

### 🔵 完善优化 (第7天+)
- TODO-12: 性能优化
- TODO-13: 错误处理
- TODO-14: 文档更新

---

## 🎯 成功标准

### 功能验证
- [ ] ✅ mg_kiro文件夹完整生成 (4个子目录)
- [ ] ✅ 12+个文档文件正确生成
- [ ] ✅ AI数据包→文档生成流程100%工作
- [ ] ✅ 5步流程顺序执行无错误

### 质量验证  
- [ ] ✅ 向后兼容性保持 (现有8步API可用)
- [ ] ✅ 错误处理覆盖率>95%
- [ ] ✅ 性能不低于当前水平
- [ ] ✅ 代码质量和文档完整

### 用户体验验证
- [ ] ✅ 流程清晰易理解 (5步逻辑)
- [ ] ✅ 文档质量高 (AI生成内容可用)
- [ ] ✅ 错误信息友好
- [ ] ✅ 后续模式可基于mg_kiro文档工作

---

## 💡 技术难点预警

### 1. AI数据包大小控制
**问题**: 深度文件分析可能产生超大数据包  
**解决**: 分批处理、内容摘要、智能过滤

### 2. 文件权限和路径处理
**问题**: 不同系统的文件权限和路径差异  
**解决**: 统一路径处理、权限检查、错误恢复

### 3. 模板系统集成复杂性
**问题**: 新prompts子目录系统与现有逻辑冲突  
**解决**: 增量集成、向后兼容、全面测试

### 4. 工作流状态同步
**问题**: 5步新流程与8步旧流程的状态同步  
**解决**: 状态映射、双模式支持、逐步迁移

---

**重构完成预期**: 完整的文档驱动Init模式，AI分析→mg_kiro文档生成→后续模式协作的完整闭环  
**开发周期**: 7个工作日  
**质量目标**: 生产就绪、100%测试覆盖、完整文档

---

*详细TODO制定时间: 2025-09-08*  
*基于: INIT_MODE_FIX_PLAN.md + 用户具体流程需求*  
*下一步: 开始执行阶段一基础设施建设*