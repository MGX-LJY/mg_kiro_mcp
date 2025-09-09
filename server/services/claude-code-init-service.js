/**
 * Claude Code Init服务 - 精简版 v3.0
 * 基于新的2步精简流程重构
 * 
 * 新的简化流程：
 * 1. generate_project_overview - 生成项目概览包
 * 2. progressive_documentation - 渐进式文档生成
 * 
 * 核心设计原则：
 * - 极致简化：从5步减少到2步
 * - AI集中协作：机器准备数据，AI生成文档
 * - 智能处理：自动裁切和批次管理
 */

import { ProjectOverviewGenerator } from './project-overview-generator.js';
import { AICollaborationOrchestrator } from './ai-collaboration-orchestrator.js';

export class ClaudeCodeInitService {
    constructor() {
        this.overviewGenerator = new ProjectOverviewGenerator();
        this.aiOrchestrator = new AICollaborationOrchestrator();
        
        // 简化的状态管理
        this.state = {
            projectPath: null,
            status: 'idle', // idle, initialized, overview_ready, documentation_in_progress, completed
            flowId: null,
            currentStage: null,
            createdAt: null,
            lastUpdated: null,
            
            // 缓存生成的数据
            projectOverview: null,
            collaborationFlow: null,
            
            // 错误信息
            lastError: null
        };
    }

    /**
     * 方法1: 生成项目概览包
     * 对应MCP工具: generate_project_overview
     */
    async generateProjectOverview(projectPath, options = {}) {
        console.log(`[SimplifiedInit] 生成项目概览: ${projectPath}`);
        
        try {
            // 初始化状态
            this.state = {
                ...this.state,
                projectPath,
                status: 'initialized',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                lastError: null
            };

            // 生成项目概览
            const overview = await this.overviewGenerator.generateOverview(projectPath, {
                maxDepth: options.maxDepth || 3,
                includeFiles: options.includeFiles || [],
                maxKeyFileSize: options.maxKeyFileSize || 50 * 1024
            });

            // 缓存结果
            this.state.projectOverview = overview;
            this.state.status = 'overview_ready';
            this.state.lastUpdated = new Date().toISOString();

            console.log(`[SimplifiedInit] 项目概览生成完成`);

            return {
                success: true,
                step: 1,
                stepName: 'project-overview',
                
                // 核心数据包
                dataPackage: {
                    type: 'project-overview-package',
                    version: '3.0',
                    generatedAt: overview.generatedAt,
                    generationTime: overview.generationTime,
                    
                    // 项目元数据
                    projectMetadata: overview.projectMetadata,
                    
                    // 语言和技术栈分析
                    languageProfile: overview.languageProfile,
                    
                    // 依赖分析
                    dependencyAnalysis: overview.dependencyAnalysis,
                    
                    // 目录结构
                    directoryStructure: overview.directoryStructure,
                    
                    // 关键文件内容
                    keyFileContents: overview.keyFileContents,
                    
                    // 项目特征
                    projectCharacteristics: overview.projectCharacteristics,
                    
                    // AI生成指导
                    aiGenerationGuide: overview.aiGenerationGuide
                },

                // AI协作指令
                aiInstructions: {
                    task: '基于项目概览生成系统架构文档初版',
                    objective: '快速理解项目整体架构和技术选型',
                    targetDocument: 'system-architecture.md',
                    expectedSections: [
                        '项目概述',
                        '技术栈分析',
                        '架构概述',
                        '目录结构说明',
                        '核心依赖说明',
                        '开发环境配置'
                    ],
                    focusAreas: overview.aiGenerationGuide?.keyFocusAreas || ['architecture', 'dependencies', 'structure'],
                    estimatedTime: '2-3分钟',
                    complexity: overview.aiGenerationGuide?.complexityLevel || 'medium'
                },

                // 下一步指导
                nextStep: {
                    method: 'progressive_documentation',
                    description: '开始渐进式文档生成流程',
                    when: '架构文档初版完成后',
                    estimatedTime: '10-15分钟'
                },

                // 统计信息
                statistics: {
                    totalFiles: overview.projectMetadata.totalFiles,
                    keyFilesAnalyzed: Object.keys(overview.keyFileContents).length,
                    languagesDetected: [overview.languageProfile.primary, ...overview.languageProfile.secondary].filter(Boolean),
                    dependencySystems: overview.dependencyAnalysis.systems?.length || 0,
                    processingTime: overview.generationTime
                }
            };

        } catch (error) {
            console.error('[SimplifiedInit] 项目概览生成失败:', error);
            
            this.state.lastError = error.message;
            this.state.status = 'error';
            this.state.lastUpdated = new Date().toISOString();

            return {
                success: false,
                error: error.message,
                step: 1,
                stepName: 'project-overview',
                suggestion: '请检查项目路径是否正确，以及是否有足够的读取权限'
            };
        }
    }

    /**
     * 方法2: 渐进式文档生成
     * 对应MCP工具: progressive_documentation
     */
    async progressiveDocumentation(options = {}) {
        console.log(`[SimplifiedInit] 开始渐进式文档生成`);

        try {
            // 检查前置条件
            if (!this.state.projectOverview) {
                throw new Error('请先执行 generate_project_overview');
            }

            // 初始化AI协作流程
            const flowConfig = await this.aiOrchestrator.initializeFlow(
                this.state.projectPath,
                {
                    maxBatchSize: options.batchSize || '80KB',
                    documentationStyle: options.style || 'comprehensive',
                    focusAreas: options.focusAreas || [],
                    includeTests: options.includeTests !== false
                }
            );

            // 更新状态
            this.state.collaborationFlow = flowConfig;
            this.state.flowId = flowConfig.flowId;
            this.state.status = 'documentation_in_progress';
            this.state.currentStage = 'project-overview';
            this.state.lastUpdated = new Date().toISOString();

            // 执行项目概览阶段（基于已有的数据）
            const overviewStage = await this.aiOrchestrator.executeStage('project-overview');

            console.log(`[SimplifiedInit] 渐进式文档生成流程已启动`);

            return {
                success: true,
                step: 2,
                stepName: 'progressive-documentation',
                
                // 流程配置
                flowConfiguration: {
                    flowId: flowConfig.flowId,
                    totalStages: 5,
                    estimatedTotalTime: flowConfig.estimatedTotalTime,
                    processingStrategy: 'ai-collaborative-progressive'
                },

                // 当前阶段数据（项目概览阶段）
                currentStage: {
                    stage: 'project-overview',
                    status: 'completed',
                    dataPackage: overviewStage.result,
                    nextStage: overviewStage.nextStage
                },

                // 完整的渐进式流程计划
                progressivePlan: {
                    stages: [
                        {
                            name: 'project-overview',
                            status: 'completed',
                            description: '项目概览分析 → 系统架构文档初版',
                            estimatedTime: '2-3分钟',
                            output: 'system-architecture.md (初版)'
                        },
                        {
                            name: 'file-level',
                            status: 'ready',
                            description: '源代码文件分析 → 文件级文档',
                            estimatedTime: '5-10分钟',
                            output: 'file-docs/*.md (多个文件)'
                        },
                        {
                            name: 'module-level',
                            status: 'pending',
                            description: '模块整合分析 → 模块级文档',
                            estimatedTime: '3-5分钟',
                            output: 'module-docs/*.md'
                        },
                        {
                            name: 'integration-level',
                            status: 'pending',
                            description: '模块连接分析 → 集成文档',
                            estimatedTime: '2-4分钟',
                            output: 'integration-docs/module-connections.md'
                        },
                        {
                            name: 'architecture-optimization',
                            status: 'pending',
                            description: '架构优化 → 最终系统架构文档',
                            estimatedTime: '2-3分钟',
                            output: 'system-architecture.md (最终版)'
                        }
                    ]
                },

                // AI协作指令（当前阶段）
                aiInstructions: overviewStage.result.instructions,

                // 继续执行指令
                continuationInstructions: {
                    nextStage: overviewStage.nextStage,
                    howToContinue: `调用 executeStage("${overviewStage.nextStage}") 继续下一阶段`,
                    automationHint: '可以设置自动执行所有阶段',
                    controlOptions: ['manual-step-by-step', 'semi-automatic', 'fully-automatic']
                }
            };

        } catch (error) {
            console.error('[SimplifiedInit] 渐进式文档生成失败:', error);
            
            this.state.lastError = error.message;
            this.state.status = 'error';
            this.state.lastUpdated = new Date().toISOString();

            return {
                success: false,
                error: error.message,
                step: 2,
                stepName: 'progressive-documentation',
                suggestion: '请确保已完成项目概览生成，并检查项目文件访问权限'
            };
        }
    }

    /**
     * 执行特定阶段（辅助方法）
     */
    async executeStage(stageName, additionalContext = {}) {
        console.log(`[SimplifiedInit] 执行阶段: ${stageName}`);

        try {
            if (!this.state.collaborationFlow) {
                throw new Error('请先执行 progressive_documentation');
            }

            const stageResult = await this.aiOrchestrator.executeStage(stageName, additionalContext);

            // 更新状态
            this.state.currentStage = stageName;
            this.state.lastUpdated = new Date().toISOString();

            // 如果所有阶段完成，更新最终状态
            if (!stageResult.nextStage) {
                this.state.status = 'completed';
            }

            return {
                success: true,
                stageName,
                result: stageResult,
                flowStatus: this.aiOrchestrator.getFlowStatus(),
                isCompleted: !stageResult.nextStage
            };

        } catch (error) {
            console.error(`[SimplifiedInit] 阶段执行失败: ${stageName}`, error);
            
            this.state.lastError = error.message;
            
            return {
                success: false,
                error: error.message,
                stageName,
                suggestion: `检查${stageName}阶段的依赖条件和输入数据`
            };
        }
    }

    /**
     * 获取当前状态
     */
    getState() {
        return {
            ...this.state,
            flowStatus: this.aiOrchestrator ? this.aiOrchestrator.getFlowStatus() : null
        };
    }

    /**
     * 获取进度信息
     */
    getProgress() {
        const flowStatus = this.aiOrchestrator ? this.aiOrchestrator.getFlowStatus() : null;
        
        return {
            projectPath: this.state.projectPath,
            currentStatus: this.state.status,
            currentStage: this.state.currentStage,
            completedSteps: this.state.status === 'overview_ready' || 
                           this.state.status === 'documentation_in_progress' || 
                           this.state.status === 'completed' ? 1 : 0,
            totalSteps: 2, // 简化后只有2个主要步骤
            flowProgress: flowStatus ? flowStatus.completionPercentage : 0,
            lastUpdated: this.state.lastUpdated,
            hasError: !!this.state.lastError,
            errorMessage: this.state.lastError
        };
    }

    /**
     * 重置服务状态
     */
    reset() {
        console.log('[SimplifiedInit] 重置服务状态');
        
        this.state = {
            projectPath: null,
            status: 'idle',
            flowId: null,
            currentStage: null,
            createdAt: null,
            lastUpdated: null,
            projectOverview: null,
            collaborationFlow: null,
            lastError: null
        };

        // 重置AI编排器
        if (this.aiOrchestrator) {
            this.aiOrchestrator = new AICollaborationOrchestrator();
        }

        return {
            success: true,
            message: '服务状态已重置',
            newStatus: 'idle'
        };
    }

    /**
     * 健康检查
     */
    healthCheck() {
        return {
            service: 'ClaudeCodeInitService',
            version: '3.0-simplified',
            status: this.state.status,
            components: {
                overviewGenerator: !!this.overviewGenerator,
                aiOrchestrator: !!this.aiOrchestrator
            },
            lastActivity: this.state.lastUpdated,
            hasActiveProject: !!this.state.projectPath,
            capabilities: [
                'generate_project_overview',
                'progressive_documentation',
                'ai_collaboration'
            ]
        };
    }
}

export default ClaudeCodeInitService;