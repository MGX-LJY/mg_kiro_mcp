/**
 * AI To-Do 管理器 (支持Create模式)
 * 为AI提供任务队列管理，让AI知道需要依次处理哪些文件和任务
 * 
 * 核心功能：
 * - 创建和管理文件处理任务队列
 * - 支持Create模式的功能开发和项目创建任务
 * - 跟踪AI的处理进度
 * - 提供下一个待处理任务
 * - 标记任务完成状态
 * - 提供进度统计和建议
 * - 支持不同工作流模式（Init/Create/Fix/Analyze）
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
        
        // 工作流类型
        this.workflowTypes = {
            INIT: 'init',
            CREATE: 'create',
            FIX: 'fix',
            ANALYZE: 'analyze'
        };
        
        // Create模式任务类型
        this.createTaskTypes = {
            REQUIREMENT_ANALYSIS: 'requirement_analysis',
            IMPACT_ANALYSIS: 'impact_analysis',
            ARCHITECTURE_DESIGN: 'architecture_design',
            MODULE_CREATION: 'module_creation',
            CODE_IMPLEMENTATION: 'code_implementation',
            DOCUMENT_UPDATE: 'document_update',
            TESTING: 'testing',
            INTEGRATION: 'integration'
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
            customPriorities = {},
            workflowType = this.workflowTypes.INIT
        } = options;

        const todoList = {
            projectPath,
            createdAt: new Date().toISOString(),
            totalTasks: 0,
            completedTasks: 0,
            currentTask: null,
            
            // 工作流类型
            workflowType,
            
            // 任务分类
            tasks: {
                fileProcessing: [],    // 文件处理任务
                analysis: [],          // 分析任务  
                summary: [],           // 总结任务
                optimization: [],      // 优化任务
                // Create模式专用任务分类
                requirementAnalysis: [],  // 需求分析任务
                impactAnalysis: [],       // 影响分析任务
                architectureDesign: [],   // 架构设计任务
                moduleCreation: [],       // 模块创建任务
                codeImplementation: [],   // 代码实现任务
                documentUpdate: [],       // 文档更新任务
                testing: [],              // 测试任务
                integration: []           // 集成任务
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

        // 根据工作流类型创建对应的任务
        if (workflowType === this.workflowTypes.CREATE) {
            await this.createCreateModeTasks(todoList, processingPlan, options);
        } else {
            // 默认的文件处理任务创建逻辑（适用于Init等模式）
            await this.createDefaultFileTasks(todoList, processingPlan, options);
        }

        // 创建文件处理任务（兼容性保留）  
        if (processingPlan.batches && processingPlan.batches.length > 0 && workflowType !== this.workflowTypes.CREATE) {
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

    /**
     * Create模式任务创建方法
     */
    async createCreateModeTasks(todoList, processingPlan, options) {
        console.log('[AITodo] 创建Create模式任务');
        
        const { workflowType = 'feature_addition' } = options;
        
        if (workflowType === 'feature_addition') {
            // 已有项目功能添加任务
            await this.createFeatureAdditionTasks(todoList, processingPlan, options);
        } else if (workflowType === 'new_project') {
            // 新项目创建任务
            await this.createNewProjectTasks(todoList, processingPlan, options);
        }
    }

    /**
     * 创建功能添加任务
     */
    async createFeatureAdditionTasks(todoList, processingPlan, options) {
        let taskCounter = 1;
        
        // 1. 需求分析任务（如果需要）
        if (!options.skipRequirementAnalysis) {
            todoList.tasks.requirementAnalysis.push({
                id: `req_analysis_${taskCounter++}`,
                type: this.createTaskTypes.REQUIREMENT_ANALYSIS,
                status: this.taskStatus.PENDING,
                title: '分析功能需求',
                description: '深入分析用户提出的功能需求，生成详细的需求文档',
                instructions: {
                    action: 'analyze_user_requirement',
                    expectedOutput: 'requirement-analysis.md',
                    focusAreas: ['功能范围', '技术要求', '验收标准']
                },
                priority: 100,
                estimatedTime: '10-15分钟',
                createdAt: new Date().toISOString()
            });
        }

        // 2. 影响分析任务
        todoList.tasks.impactAnalysis.push({
            id: `impact_analysis_${taskCounter++}`,
            type: this.createTaskTypes.IMPACT_ANALYSIS,
            status: this.taskStatus.PENDING,
            title: '分析功能影响范围',
            description: '分析新功能对现有模块和功能的影响',
            instructions: {
                action: 'analyze_feature_impact',
                expectedOutput: 'impact-analysis.md',
                dependsOn: 'req_analysis_1'
            },
            priority: 95,
            estimatedTime: '15-20分钟'
        });

        // 3. 代码实现任务
        if (processingPlan.batches) {
            processingPlan.batches.forEach((batch, batchIndex) => {
                batch.files.forEach((file, fileIndex) => {
                    const task = {
                        id: `code_impl_${batchIndex + 1}_${fileIndex + 1}`,
                        type: this.createTaskTypes.CODE_IMPLEMENTATION,
                        status: this.taskStatus.PENDING,
                        title: `实现${file.name}`,
                        description: file.changeType === 'create' ? 
                            `创建新模块: ${file.name}` : 
                            `修改现有模块: ${file.name}`,
                        
                        file: {
                            relativePath: file.relativePath,
                            name: file.name,
                            changeType: file.changeType,
                            category: file.category
                        },
                        
                        instructions: {
                            action: file.changeType === 'create' ? 'create_new_module' : 'modify_existing_module',
                            targetFile: file.relativePath,
                            expectedOutput: file.relativePath,
                            dependsOn: 'impact_analysis_2'
                        },
                        
                        priority: file.importance || 80,
                        estimatedTime: this.estimateTaskTime(file),
                        createdAt: new Date().toISOString()
                    };
                    
                    todoList.tasks.codeImplementation.push(task);
                });
            });
        }

        // 4. 文档更新任务
        todoList.tasks.documentUpdate.push({
            id: `doc_update_${taskCounter++}`,
            type: this.createTaskTypes.DOCUMENT_UPDATE,
            status: this.taskStatus.PENDING,
            title: '更新项目文档',
            description: '更新架构文档、模块文档和API文档',
            instructions: {
                action: 'update_project_documentation',
                expectedOutput: ['architecture.md', 'modules.md'],
                dependsOn: 'code_implementation_completion'
            },
            priority: 70,
            estimatedTime: '10-15分钟'
        });

        // 5. 测试任务
        if (options.includeTestingTasks !== false) {
            todoList.tasks.testing.push({
                id: `testing_${taskCounter++}`,
                type: this.createTaskTypes.TESTING,
                status: this.taskStatus.PENDING,
                title: '功能测试验证',
                description: '创建和执行功能测试，确保新功能正常工作',
                instructions: {
                    action: 'create_and_run_tests',
                    expectedOutput: 'test-results.md',
                    dependsOn: 'doc_update_3'
                },
                priority: 60,
                estimatedTime: '15-20分钟'
            });
        }
    }

    /**
     * 创建新项目任务
     */
    async createNewProjectTasks(todoList, processingPlan, options) {
        let taskCounter = 1;

        // 1. 需求分析任务
        todoList.tasks.requirementAnalysis.push({
            id: `req_analysis_${taskCounter++}`,
            type: this.createTaskTypes.REQUIREMENT_ANALYSIS,
            status: this.taskStatus.PENDING,
            title: '项目需求分析',
            description: '分析项目需求，明确功能范围和技术要求',
            instructions: {
                action: 'analyze_project_requirements',
                expectedOutput: 'project-requirements.md'
            },
            priority: 100,
            estimatedTime: '15-20分钟'
        });

        // 2. 架构设计任务
        todoList.tasks.architectureDesign.push({
            id: `arch_design_${taskCounter++}`,
            type: this.createTaskTypes.ARCHITECTURE_DESIGN,
            status: this.taskStatus.PENDING,
            title: '设计项目架构',
            description: '设计项目的整体架构和技术选型',
            instructions: {
                action: 'design_project_architecture',
                expectedOutput: 'system-architecture.md',
                dependsOn: 'req_analysis_1'
            },
            priority: 95,
            estimatedTime: '20-30分钟'
        });

        // 3. 模块创建任务
        if (processingPlan.batches) {
            processingPlan.batches.forEach((batch, batchIndex) => {
                batch.files.forEach((file, fileIndex) => {
                    const task = {
                        id: `module_create_${batchIndex + 1}_${fileIndex + 1}`,
                        type: this.createTaskTypes.MODULE_CREATION,
                        status: this.taskStatus.PENDING,
                        title: `创建${file.name}模块`,
                        description: `创建项目核心模块: ${file.name}`,
                        
                        file: {
                            relativePath: file.relativePath,
                            name: file.name,
                            category: file.category,
                            complexity: file.complexity
                        },
                        
                        instructions: {
                            action: 'create_project_module',
                            targetFile: file.relativePath,
                            expectedOutput: file.relativePath,
                            dependsOn: 'arch_design_2'
                        },
                        
                        priority: file.importance || 80,
                        estimatedTime: this.estimateTaskTime(file),
                        createdAt: new Date().toISOString()
                    };
                    
                    todoList.tasks.moduleCreation.push(task);
                });
            });
        }

        // 4. 集成任务
        todoList.tasks.integration.push({
            id: `integration_${taskCounter++}`,
            type: this.createTaskTypes.INTEGRATION,
            status: this.taskStatus.PENDING,
            title: '项目集成和配置',
            description: '集成所有模块，配置项目环境和依赖',
            instructions: {
                action: 'integrate_project_modules',
                expectedOutput: ['package.json', 'config/', 'README.md'],
                dependsOn: 'module_creation_completion'
            },
            priority: 85,
            estimatedTime: '20-25分钟'
        });

        // 5. 项目文档任务
        todoList.tasks.documentUpdate.push({
            id: `project_docs_${taskCounter++}`,
            type: this.createTaskTypes.DOCUMENT_UPDATE,
            status: this.taskStatus.PENDING,
            title: '生成项目文档',
            description: '生成完整的项目文档，包括架构说明和使用指南',
            instructions: {
                action: 'generate_project_documentation',
                expectedOutput: ['mg_kiro/architecture/', 'mg_kiro/modules/', 'README.md'],
                dependsOn: 'integration_3'
            },
            priority: 75,
            estimatedTime: '15-20分钟'
        });
    }

    /**
     * 默认文件任务创建方法（用于Init等模式）
     */
    async createDefaultFileTasks(todoList, processingPlan, options) {
        // 保持原有的文件处理逻辑不变
        console.log('[AITodo] 创建默认文件处理任务');
    }

    /**
     * 估算任务时间
     */
    estimateTaskTime(file) {
        if (file.complexity === 'high') return '15-25分钟';
        if (file.complexity === 'medium') return '10-15分钟';
        return '5-10分钟';
    }

    /**
     * 获取所有任务（扩展支持Create模式任务）
     */
    getAllTasks(todoList) {
        return [
            ...todoList.tasks.fileProcessing,
            ...todoList.tasks.analysis,
            ...todoList.tasks.summary,
            ...todoList.tasks.optimization,
            ...todoList.tasks.requirementAnalysis,
            ...todoList.tasks.impactAnalysis,
            ...todoList.tasks.architectureDesign,
            ...todoList.tasks.moduleCreation,
            ...todoList.tasks.codeImplementation,
            ...todoList.tasks.documentUpdate,
            ...todoList.tasks.testing,
            ...todoList.tasks.integration
        ];
    }

    /**
     * 检查任务依赖（扩展支持Create模式）
     */
    checkTaskDependencies(task, todoList) {
        if (!task.instructions.dependsOn) return true;
        
        const dependency = task.instructions.dependsOn;
        
        // 检查特定完成阶段
        if (dependency === 'code_implementation_completion') {
            return todoList.tasks.codeImplementation.every(t => 
                t.status === this.taskStatus.COMPLETED
            );
        }
        
        if (dependency === 'module_creation_completion') {
            return todoList.tasks.moduleCreation.every(t => 
                t.status === this.taskStatus.COMPLETED
            );
        }
        
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

    /**
     * 更新进度计算（支持Create模式）
     */
    calculateProgress(todoList) {
        const percentage = Math.round((todoList.completedTasks / todoList.totalTasks) * 100);
        const remainingTasks = todoList.totalTasks - todoList.completedTasks;
        
        let currentPhase = 'preparation';
        
        if (todoList.workflowType === this.workflowTypes.CREATE) {
            // Create模式的阶段判断
            if (todoList.completedTasks === 0) {
                currentPhase = 'requirement_analysis';
            } else if (percentage < 30) {
                currentPhase = 'impact_analysis';
            } else if (percentage < 70) {
                currentPhase = 'code_implementation';
            } else if (percentage < 90) {
                currentPhase = 'documentation_update';
            } else {
                currentPhase = 'testing_integration';
            }
        } else {
            // 原有的阶段判断逻辑
            if (todoList.completedTasks > 0) {
                if (percentage < 70) currentPhase = 'file_processing';
                else if (percentage < 90) currentPhase = 'analysis';
                else currentPhase = 'finalization';
            }
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

    /**
     * Create模式专用的任务指导
     */
    getCreateModeGuidance(task, todoList) {
        const guidance = [];
        
        switch (task.type) {
            case this.createTaskTypes.REQUIREMENT_ANALYSIS:
                guidance.push('仔细分析用户需求，识别核心功能点');
                guidance.push('生成结构化的需求分析文档');
                break;
                
            case this.createTaskTypes.IMPACT_ANALYSIS:
                guidance.push('读取现有项目文档，了解当前架构');
                guidance.push('分析新功能对现有模块的影响');
                guidance.push('识别需要修改和新增的模块');
                break;
                
            case this.createTaskTypes.CODE_IMPLEMENTATION:
                guidance.push('根据影响分析结果实现具体功能');
                guidance.push('遵循项目的代码规范和最佳实践');
                guidance.push('确保代码质量和可维护性');
                break;
                
            case this.createTaskTypes.DOCUMENT_UPDATE:
                guidance.push('更新相关的架构和模块文档');
                guidance.push('确保文档与代码实现保持同步');
                break;
                
            default:
                guidance.push('按照任务描述执行相应的开发工作');
        }
        
        guidance.push(`完成后调用 complete_task("${task.id}") 标记任务完成`);
        
        return guidance;
    }
}

export default AITodoManager;