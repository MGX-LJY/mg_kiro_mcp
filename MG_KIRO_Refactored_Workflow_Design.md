# MG_KIRO 重构工作流程设计

## 🎯 整体6步工作流程图

```mermaid
graph TD
    A[Step 1: 项目分析<br/>简化版] --> B[Step 2: 文件分析模块<br/>智能Token分析+批次规划]
    B --> C[Step 3: 文件文档循环生成<br/>基于文件分析模块协调]
    C --> D[Step 4: 模块整合<br/>统一任务管理]
    D --> E[Step 5: 模块关联分析<br/>统一任务管理]
    E --> F[Step 6: 架构文档生成<br/>统一任务管理]
    
    %% 核心模块
    G[文件分析模块<br/>FileAnalysisModule] -.-> B
    G -.-> C
    H[统一任务管理器<br/>UnifiedTaskManager] -.-> C
    H -.-> D
    H -.-> E
    H -.-> F
    
    %% 样式
    classDef coreModule fill:#ff9999,stroke:#333,stroke-width:3px
    classDef newStep fill:#99ccff,stroke:#333,stroke-width:2px
    classDef refactoredStep fill:#99ff99,stroke:#333,stroke-width:2px
    
    class G,H coreModule
    class B newStep
    class C,D,E,F refactoredStep
```

## 🧠 文件分析模块详细流程图 (Step 2)

```mermaid
graph TB
    A[开始文件分析模块] --> B[接收Step1项目基础数据]
    B --> C[逐文件Token精确计算]
    
    C --> D{文件Token数量判断}
    
    D -->|< 15K tokens| E[小文件策略<br/>等待合并处理]
    D -->|15K-20K tokens| F[中等文件策略<br/>单文件单批次]
    D -->|> 20K tokens| G[大文件策略<br/>需要拆分处理]
    
    E --> H[综合文件批次分析]
    H --> I[多文件合并<br/>目标: ~18K tokens/批次]
    I --> J[创建综合批次任务<br/>task_1, task_2...]
    
    F --> K[单文件单批次分析]
    K --> L[独立文件处理<br/>每文件一个批次]
    L --> M[创建单文件任务<br/>task_X]
    
    G --> N[大文件多批次分析]
    N --> O[函数边界检测<br/>智能拆分点]
    O --> P[拆分大文件<br/>保持函数完整性]
    P --> Q[创建多批次任务<br/>task_X_1, task_X_2...]
    
    J --> R[生成完整任务队列]
    M --> R
    Q --> R
    
    R --> S[创建处理策略配置]
    S --> T[生成文档模板映射]
    T --> U[输出: 智能批次计划<br/>+ 任务定义<br/>+ 处理策略]
    
    %% 样式
    classDef strategy fill:#ffcc99,stroke:#333,stroke-width:2px
    classDef task fill:#ccffcc,stroke:#333,stroke-width:2px
    classDef output fill:#ffccff,stroke:#333,stroke-width:2px
    
    class E,F,G strategy
    class J,M,Q task
    class U output
```

## 🔄 三种批次策略详细流程

```mermaid
graph LR
    subgraph "策略1: 综合文件批次"
        A1[文件1: 3K tokens<br/>文件2: 5K tokens<br/>文件3: 10K tokens]
        A1 --> A2[合并成一个批次<br/>总计: 18K tokens]
        A2 --> A3[任务ID: task_1<br/>包含3个文件]
        A3 --> A4[一次性处理<br/>生成3个文档]
    end
    
    subgraph "策略2: 单文件单批次"
        B1[文件4: 18K tokens]
        B1 --> B2[独立成一个批次]
        B2 --> B3[任务ID: task_2<br/>包含1个文件]
        B3 --> B4[独立处理<br/>生成1个文档]
    end
    
    subgraph "策略3: 大文件多批次"
        C1[文件5: 28K tokens]
        C1 --> C2[函数边界检测]
        C2 --> C3[智能拆分<br/>不破坏函数结构]
        C3 --> C4[片段1: 14K tokens<br/>片段2: 14K tokens]
        C4 --> C5[任务ID: task_3_1, task_3_2<br/>2个子任务]
        C5 --> C6[分批处理<br/>最后合并成1个文档]
    end
    
    %% 样式
    classDef combined fill:#ffeb3b,stroke:#333,stroke-width:2px
    classDef single fill:#4caf50,stroke:#333,stroke-width:2px
    classDef multi fill:#2196f3,stroke:#333,stroke-width:2px
    
    class A1,A2,A3,A4 combined
    class B1,B2,B3,B4 single
    class C1,C2,C3,C4,C5,C6 multi
```

## 🔁 Step 3 文件文档循环生成流程

```mermaid
graph TD
    A[开始Step 3循环] --> B[文件分析模块提供任务队列]
    
    B --> C[get_next_task<br/>从队列获取下一个任务]
    
    C --> D{任务类型判断}
    
    D -->|综合文件批次<br/>task_1| E[get_file_content<br/>获取多个文件内容]
    D -->|单文件单批次<br/>task_2| F[get_file_content<br/>获取单个文件内容]
    D -->|大文件多批次<br/>task_3_1| G[get_file_content<br/>获取文件片段内容]
    
    E --> H[generate_analysis<br/>多文件生成模板]
    F --> I[generate_analysis<br/>单文件生成模板]
    G --> J[generate_analysis<br/>片段分析模板]
    
    H --> K[一次生成多个文档<br/>file1.md, file2.md, file3.md]
    I --> L[生成单个文档<br/>file4.md]
    J --> M{是否为最后片段?}
    
    M -->|否| N[生成片段文档<br/>继续下一片段]
    M -->|是| O[生成完整文档<br/>file5.md]
    
    K --> P[complete_task<br/>验证文档生成]
    L --> P
    N --> P
    O --> P
    
    P --> Q{文件分析模块验证}
    Q -->|缺失文件| R[报告缺失文件列表<br/>AI重新生成]
    Q -->|验证通过| S[标记任务完成<br/>更新进度]
    
    R --> H
    S --> T{还有更多任务?}
    
    T -->|是| C
    T -->|否| U[Step 3 完成<br/>进入Step 4]
    
    %% 样式
    classDef process fill:#e1f5fe,stroke:#333,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#333,stroke-width:2px
    classDef output fill:#f3e5f5,stroke:#333,stroke-width:2px
    
    class C,E,F,G,H,I,J,P process
    class D,M,Q,T decision
    class K,L,N,O,R,U output
```

## 🎯 统一任务管理扩展流程 (Step 4-6)

```mermaid
graph TB
    subgraph "Step 4: 模块整合"
        A1[统一任务管理器创建模块任务]
        A1 --> A2[module_integration_task_1<br/>module_integration_task_2...]
        A2 --> A3[读取Step3生成的文件文档]
        A3 --> A4[提供模块整合模板]
        A4 --> A5[AI生成模块文档]
        A5 --> A6[验证模块文档完整性]
        A6 --> A7[完成模块整合任务]
    end
    
    subgraph "Step 5: 模块关联分析"
        B1[统一任务管理器创建关联任务]
        B1 --> B2[relations_analysis_task_1<br/>relations_analysis_task_2...]
        B2 --> B3[读取Step4模块文档]
        B3 --> B4[提供关联分析模板]
        B4 --> B5[AI生成关联分析文档]
        B5 --> B6[验证关联分析完整性]
        B6 --> B7[完成关联分析任务]
    end
    
    subgraph "Step 6: 架构文档生成"
        C1[统一任务管理器创建架构任务]
        C1 --> C2[architecture_task_1<br/>architecture_task_2...]
        C2 --> C3[读取所有已生成文档]
        C3 --> C4[提供架构文档模板]
        C4 --> C5[AI生成最终架构文档]
        C5 --> C6[验证架构文档完整性]
        C6 --> C7[完成所有任务<br/>流程结束]
    end
    
    A7 --> B1
    B7 --> C1
    
    %% 统一任务管理器
    D[统一任务管理器<br/>UnifiedTaskManager]
    D -.-> A1
    D -.-> B1
    D -.-> C1
    
    %% 样式
    classDef taskManager fill:#ff5722,stroke:#333,stroke-width:3px
    classDef step4 fill:#4caf50,stroke:#333,stroke-width:2px
    classDef step5 fill:#2196f3,stroke:#333,stroke-width:2px
    classDef step6 fill:#9c27b0,stroke:#333,stroke-width:2px
    
    class D taskManager
    class A1,A2,A3,A4,A5,A6,A7 step4
    class B1,B2,B3,B4,B5,B6,B7 step5
    class C1,C2,C3,C4,C5,C6,C7 step6
```

## 🏗️ 系统架构组件关系图

```mermaid
graph TB
    subgraph "核心模块"
        A[文件分析模块<br/>FileAnalysisModule]
        B[统一任务管理器<br/>UnifiedTaskManager]
        C[精确Token分析器<br/>PreciseTokenAnalyzer]
        D[智能批次策略器<br/>IntelligentBatchStrategist]
        E[智能文件分组器<br/>SmartFileGrouper]
    end
    
    subgraph "6步工作流程"
        F[Step 1: 项目分析]
        G[Step 2: 文件分析模块]
        H[Step 3: 文件文档生成]
        I[Step 4: 模块整合]
        J[Step 5: 模块关联分析]
        K[Step 6: 架构文档生成]
    end
    
    subgraph "三种批次策略"
        L[综合文件批次<br/>CombinedFileBatch]
        M[单文件单批次<br/>SingleFileBatch]
        N[大文件多批次<br/>LargeFileMultiBatch]
    end
    
    %% 关系连接
    A --> G
    A --> H
    B --> H
    B --> I
    B --> J
    B --> K
    
    C --> A
    D --> A
    E --> A
    
    D --> L
    D --> M
    D --> N
    
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    
    %% 样式
    classDef coreModule fill:#ff9999,stroke:#333,stroke-width:3px
    classDef workflow fill:#99ccff,stroke:#333,stroke-width:2px
    classDef strategy fill:#99ff99,stroke:#333,stroke-width:2px
    
    class A,B,C,D,E coreModule
    class F,G,H,I,J,K workflow
    class L,M,N strategy
```

## 📋 任务ID命名规范

### Step 3 文件处理任务
```
综合文件批次: task_1, task_2, task_3...
  - task_1 包含多个小文件 (如 file1.js, file2.js, file3.js)
  
单文件单批次: task_4, task_5, task_6...
  - task_4 包含一个中等文件 (如 largeComponent.js)
  
大文件多批次: task_7_1, task_7_2, task_7_3...
  - task_7_1 包含大文件的第一部分
  - task_7_2 包含大文件的第二部分
  - task_7_3 包含大文件的第三部分
```

### Step 4-6 统一任务命名
```
Step 4: module_integration_task_1, module_integration_task_2...
Step 5: relations_analysis_task_1, relations_analysis_task_2...
Step 6: architecture_task_1, architecture_task_2...
```

## 🔍 验证机制

### 文档生成验证
```mermaid
graph LR
    A[complete_task调用] --> B[文件分析模块提供<br/>预期文件列表]
    B --> C{检查文件是否存在}
    C -->|全部存在| D[任务完成<br/>进入下一任务]
    C -->|有文件缺失| E[生成缺失文件报告<br/>文件1.md, 文件3.md 未生成]
    E --> F[AI重新生成缺失文件]
    F --> C
```

## 🎯 重构目标实现

1. ✅ **删除aiGenerationGuide功能** - Step 1 简化
2. ✅ **引入文件分析模块** - Step 2 核心重构
3. ✅ **三种批次策略** - 智能Token管理
4. ✅ **精确任务管理** - 统一的任务ID和验证机制
5. ✅ **循环流程优化** - Step 3 基于文件分析模块协调
6. ✅ **统一任务管理扩展** - Step 4-6 任务管理统一化

这个重构设计完全满足了你的需求，将文件分析模块作为整个系统的智能大脑，实现了更精确的Token管理和更统一的任务处理流程。