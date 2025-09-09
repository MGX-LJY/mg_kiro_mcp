/**
 * AI To-Do 管理器
 * 为AI提供任务队列管理，让AI知道需要依次处理哪些文件
 * 
 * 核心功能：
 * - 创建和管理文件处理任务队列
 * - 跟踪AI的处理进度
 * - 提供下一个待处理任务
 * - 标记任务完成状态
 * - 提供进度统计和建议
 */

export class AITodoManager {
    constructor() {
        this.projectTodos = new Map(); // 每个项目的to-do列表
        this.taskStatus = {
            PENDING: 'pending',
            IN_PROGRESS: 'in_progress', 
            COMPLETED: 'completed',
            SKIPPED: 'skipped',
            ERROR: 'error'
        };
    }

    /**
     * 为项目创建AI to-do列表
     */
    async createProjectTodoList(projectPath, processingPlan, options = {}) {
        console.log(`[AITodo] 为项目创建to-do列表: ${projectPath}`);
        
        const {
            includeAnalysisTasks = true,
            includeSummaryTasks = true,
            customPriorities = {}
        } = options;

        const todoList = {
            projectPath,
            createdAt: new Date().toISOString(),
            totalTasks: 0,
            completedTasks: 0,
            currentTask: null,
            
            // 任务分类
            tasks: {
                fileProcessing: [],    // 文件处理任务
                analysis: [],          // 分析任务  
                summary: [],           // 总结任务
                optimization: []       // 优化任务
            },
            
            // 进度统计
            progress: {
                percentage: 0,
                estimatedTimeRemaining: null,
                currentPhase: 'preparation',
                nextMilestone: null
            },
            
            // AI指导信息
            aiGuidance: {
                currentInstruction: '准备开始文件处理，请调用 get_next_task 获取第一个任务',
                processingStrategy: '按重要性顺序逐个处理文件，每个文件完成后标记为已完成',
                qualityStandards: ['确保代码文档完整', '保持文档结构一致', '添加必要的使用示例']
            }
        };

        // 创建文件处理任务
        for (let batchIndex = 0; batchIndex < processingPlan.batches.length; batchIndex++) {
            const batch = processingPlan.batches[batchIndex];
            
            for (let fileIndex = 0; fileIndex < batch.files.length; fileIndex++) {
                const file = batch.files[fileIndex];
                
                const task = {
                    id: `file_${batchIndex + 1}_${fileIndex + 1}`,
                    type: 'file_processing',
                    status: this.taskStatus.PENDING,
                    
                    // 任务信息
                    title: `处理文件: ${file.name}`,
                    description: `分析并生成 ${file.relativePath} 的文档`,
                    
                    // 文件信息
                    file: {
                        relativePath: file.relativePath,
                        name: file.name,
                        category: file.category,
                        importance: file.importance,
                        needsTrimming: file.needsTrimming
                    },
                    
                    // 处理指导
                    instructions: {
                        action: 'get_file_content',
                        targetFile: file.relativePath,
                        expectedOutput: `${file.name}.md`,
                        focusAreas: this.getFileFocusAreas(file),
                        qualityChecks: this.getFileQualityChecks(file)
                    },
                    
                    // 优先级和批次信息
                    priority: customPriorities[file.relativePath] || file.importance,
                    batchNumber: batchIndex + 1,
                    batchPosition: fileIndex + 1,
                    
                    // 时间估算
                    estimatedTime: this.estimateProcessingTime(file),
                    
                    // 创建时间
                    createdAt: new Date().toISOString(),
                    updatedAt: null,
                    completedAt: null
                };
                
                todoList.tasks.fileProcessing.push(task);
            }
        }

        // 创建分析任务
        if (includeAnalysisTasks) {
            todoList.tasks.analysis.push(
                {
                    id: 'analysis_module_structure',
                    type: 'analysis',
                    status: this.taskStatus.PENDING,
                    title: '分析模块结构',
                    description: '基于处理的文件分析项目的模块结构和依赖关系',
                    instructions: {
                        action: 'analyze_modules',
                        dependsOn: 'file_processing_completion',
                        expectedOutput: 'module-structure.md'
                    },
                    priority: 70,
                    estimatedTime: '10-15分钟'
                },
                {
                    id: 'analysis_integration_points',
                    type: 'analysis', 
                    status: this.taskStatus.PENDING,
                    title: '分析集成点',
                    description: '识别模块间的集成点和通信模式',
                    instructions: {
                        action: 'analyze_integrations',
                        dependsOn: 'analysis_module_structure',
                        expectedOutput: 'integration-analysis.md'
                    },
                    priority: 60,
                    estimatedTime: '8-12分钟'
                }
            );
        }

        // 创建总结任务
        if (includeSummaryTasks) {
            todoList.tasks.summary.push(
                {
                    id: 'summary_architecture',
                    type: 'summary',
                    status: this.taskStatus.PENDING,
                    title: '生成架构总结',
                    description: '基于所有分析结果生成完整的系统架构文档',
                    instructions: {
                        action: 'generate_architecture_summary',
                        dependsOn: 'all_analysis_completion',
                        expectedOutput: 'system-architecture-final.md'
                    },
                    priority: 90,
                    estimatedTime: '15-20分钟'
                }
            );
        }

        // 计算总任务数
        todoList.totalTasks = todoList.tasks.fileProcessing.length + 
                             todoList.tasks.analysis.length + 
                             todoList.tasks.summary.length;

        // 设置当前任务为第一个待处理任务
        todoList.currentTask = this.findNextPendingTask(todoList);
        
        // 缓存to-do列表
        this.projectTodos.set(projectPath, todoList);
        
        console.log(`[AITodo] 创建了 ${todoList.totalTasks} 个任务`);
        
        return {
            success: true,
            todoList: {
                projectPath: todoList.projectPath,
                totalTasks: todoList.totalTasks,
                currentTask: todoList.currentTask,
                progress: todoList.progress,
                aiGuidance: todoList.aiGuidance
            },
            summary: {
                fileProcessingTasks: todoList.tasks.fileProcessing.length,
                analysisTasks: todoList.tasks.analysis.length,
                summaryTasks: todoList.tasks.summary.length,
                estimatedTotalTime: `${Math.ceil(todoList.totalTasks * 3)}-${Math.ceil(todoList.totalTasks * 5)}分钟`
            }
        };
    }

    /**
     * 获取下一个待处理任务
     */
    async getNextTask(projectPath) {
        const todoList = this.projectTodos.get(projectPath);
        
        if (!todoList) {
            throw new Error('项目to-do列表未找到，请先调用 create_project_todo');
        }

        // 查找下一个待处理任务
        const nextTask = this.findNextPendingTask(todoList);
        
        if (!nextTask) {
            // 检查是否所有任务都已完成
            const allTasks = this.getAllTasks(todoList);
            const completedTasks = allTasks.filter(task => task.status === this.taskStatus.COMPLETED);
            
            if (completedTasks.length === allTasks.length) {
                return {
                    success: true,
                    completed: true,
                    message: '🎉 所有任务已完成！',
                    finalSummary: {
                        totalTasks: todoList.totalTasks,
                        completedTasks: todoList.completedTasks,
                        completionTime: new Date().toISOString()
                    }
                };
            } else {
                return {
                    success: false,
                    message: '暂无可处理的任务，可能存在依赖关系未满足',
                    suggestions: [
                        '检查当前正在进行的任务是否需要标记为完成',
                        '查看是否有任务处于错误状态需要重置'
                    ]
                };
            }
        }

        // 标记任务为进行中
        nextTask.status = this.taskStatus.IN_PROGRESS;
        nextTask.startedAt = new Date().toISOString();
        nextTask.updatedAt = new Date().toISOString();
        
        // 更新当前任务
        todoList.currentTask = nextTask;
        todoList.progress = this.calculateProgress(todoList);
        
        return {
            success: true,
            task: {
                id: nextTask.id,
                type: nextTask.type,
                title: nextTask.title,
                description: nextTask.description,
                instructions: nextTask.instructions,
                file: nextTask.file,
                priority: nextTask.priority,
                estimatedTime: nextTask.estimatedTime
            },
            progress: todoList.progress,
            nextSteps: this.getNextStepsGuidance(nextTask, todoList)
        };
    }

    /**
     * 标记任务为已完成
     */
    async completeTask(projectPath, taskId, completionData = {}) {
        const todoList = this.projectTodos.get(projectPath);
        
        if (!todoList) {
            throw new Error('项目to-do列表未找到');
        }

        const task = this.findTaskById(todoList, taskId);
        
        if (!task) {
            throw new Error(`任务 ${taskId} 未找到`);
        }

        if (task.status !== this.taskStatus.IN_PROGRESS) {
            throw new Error(`任务 ${taskId} 当前状态不是进行中，无法标记为完成`);
        }

        // 标记任务完成
        task.status = this.taskStatus.COMPLETED;
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        
        // 记录完成数据
        if (completionData.outputFile) {
            task.outputFile = completionData.outputFile;
        }
        if (completionData.notes) {
            task.notes = completionData.notes;
        }

        // 更新统计
        todoList.completedTasks++;
        todoList.progress = this.calculateProgress(todoList);
        
        // 清除当前任务
        todoList.currentTask = null;

        console.log(`[AITodo] 任务完成: ${task.title}`);

        return {
            success: true,
            completedTask: {
                id: task.id,
                title: task.title,
                completedAt: task.completedAt
            },
            progress: todoList.progress,
            nextTaskAvailable: this.hasNextTask(todoList),
            recommendations: this.getCompletionRecommendations(task, todoList)
        };
    }

    /**
     * 获取项目to-do状态
     */
    async getProjectTodoStatus(projectPath) {
        const todoList = this.projectTodos.get(projectPath);
        
        if (!todoList) {
            return {
                exists: false,
                message: '项目to-do列表未创建，请先调用 create_project_todo'
            };
        }

        const allTasks = this.getAllTasks(todoList);
        const tasksByStatus = {
            pending: allTasks.filter(task => task.status === this.taskStatus.PENDING),
            inProgress: allTasks.filter(task => task.status === this.taskStatus.IN_PROGRESS),
            completed: allTasks.filter(task => task.status === this.taskStatus.COMPLETED),
            error: allTasks.filter(task => task.status === this.taskStatus.ERROR)
        };

        return {
            exists: true,
            projectPath: todoList.projectPath,
            createdAt: todoList.createdAt,
            
            overview: {
                totalTasks: todoList.totalTasks,
                completedTasks: todoList.completedTasks,
                progress: todoList.progress
            },
            
            currentStatus: {
                currentTask: todoList.currentTask,
                tasksRemaining: tasksByStatus.pending.length,
                tasksInProgress: tasksByStatus.inProgress.length,
                tasksCompleted: tasksByStatus.completed.length,
                tasksWithErrors: tasksByStatus.error.length
            },
            
            taskBreakdown: {
                fileProcessing: {
                    total: todoList.tasks.fileProcessing.length,
                    completed: todoList.tasks.fileProcessing.filter(task => 
                        task.status === this.taskStatus.COMPLETED).length
                },
                analysis: {
                    total: todoList.tasks.analysis.length,
                    completed: todoList.tasks.analysis.filter(task => 
                        task.status === this.taskStatus.COMPLETED).length
                },
                summary: {
                    total: todoList.tasks.summary.length,
                    completed: todoList.tasks.summary.filter(task => 
                        task.status === this.taskStatus.COMPLETED).length
                }
            },
            
            aiGuidance: todoList.aiGuidance
        };
    }

    /**
     * 工具方法集合
     */
    findNextPendingTask(todoList) {
        // 按优先级顺序查找待处理任务
        const allTasks = this.getAllTasks(todoList);
        const pendingTasks = allTasks.filter(task => task.status === this.taskStatus.PENDING);
        
        if (pendingTasks.length === 0) return null;
        
        // 检查依赖关系
        for (const task of pendingTasks.sort((a, b) => b.priority - a.priority)) {
            if (this.checkTaskDependencies(task, todoList)) {
                return task;
            }
        }
        
        return null;
    }

    findTaskById(todoList, taskId) {
        const allTasks = this.getAllTasks(todoList);
        return allTasks.find(task => task.id === taskId);
    }

    getAllTasks(todoList) {
        return [
            ...todoList.tasks.fileProcessing,
            ...todoList.tasks.analysis,
            ...todoList.tasks.summary,
            ...todoList.tasks.optimization
        ];
    }

    calculateProgress(todoList) {
        const percentage = Math.round((todoList.completedTasks / todoList.totalTasks) * 100);
        const remainingTasks = todoList.totalTasks - todoList.completedTasks;
        
        let currentPhase = 'preparation';
        if (todoList.completedTasks > 0) {
            if (percentage < 70) currentPhase = 'file_processing';
            else if (percentage < 90) currentPhase = 'analysis';
            else currentPhase = 'finalization';
        }

        return {
            percentage,
            completedTasks: todoList.completedTasks,
            totalTasks: todoList.totalTasks,
            remainingTasks,
            currentPhase,
            estimatedTimeRemaining: `${remainingTasks * 3}-${remainingTasks * 5}分钟`
        };
    }

    checkTaskDependencies(task, todoList) {
        if (!task.instructions.dependsOn) return true;
        
        const dependency = task.instructions.dependsOn;
        
        // 检查文件处理完成依赖
        if (dependency === 'file_processing_completion') {
            return todoList.tasks.fileProcessing.every(t => 
                t.status === this.taskStatus.COMPLETED
            );
        }
        
        // 检查特定任务依赖
        const dependentTask = this.findTaskById(todoList, dependency);
        return dependentTask && dependentTask.status === this.taskStatus.COMPLETED;
    }

    hasNextTask(todoList) {
        return this.findNextPendingTask(todoList) !== null;
    }

    getFileFocusAreas(file) {
        const focusMap = {
            entry: ['应用启动流程', '核心配置', '主要路由'],
            config: ['配置项说明', '环境变量', '默认值'],
            route: ['API端点', '请求参数', '响应格式'],
            controller: ['业务逻辑', '输入验证', '错误处理'],
            service: ['核心功能', '依赖关系', '接口定义'],
            model: ['数据结构', '字段说明', '关系定义'],
            component: ['组件功能', '属性接口', '使用示例'],
            utility: ['工具函数', '参数说明', '返回值'],
            test: ['测试场景', '测试数据', '断言逻辑']
        };
        
        return focusMap[file.category] || ['代码功能', '使用方式', '注意事项'];
    }

    getFileQualityChecks(file) {
        return [
            '确保文档结构清晰',
            '添加必要的代码示例',
            '说明重要的配置选项',
            '包含错误处理说明'
        ];
    }

    estimateProcessingTime(file) {
        if (file.needsTrimming) return '5-8分钟';
        if (file.importance > 50) return '4-6分钟';
        return '2-4分钟';
    }

    getNextStepsGuidance(task, todoList) {
        const guidance = [
            `使用 get_file_content 获取文件 ${task.file.relativePath} 的内容`,
            '分析文件功能并生成对应的文档',
            `完成后调用 complete_task("${task.id}") 标记任务完成`,
            '然后调用 get_next_task 获取下一个任务'
        ];

        if (task.file.needsTrimming) {
            guidance.splice(1, 0, '注意：此文件较大，内容会被智能裁切');
        }

        return guidance;
    }

    getCompletionRecommendations(task, todoList) {
        const recommendations = [
            '调用 get_next_task 继续处理下一个任务'
        ];

        const progress = todoList.progress;
        if (progress.percentage >= 70 && progress.currentPhase === 'file_processing') {
            recommendations.push('文件处理阶段即将完成，准备进入分析阶段');
        }

        return recommendations;
    }
}

export default AITodoManager;