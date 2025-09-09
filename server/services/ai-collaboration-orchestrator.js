/**
 * AI协作流程编排器
 * 管理渐进式文档生成的完整流程
 * 
 * 流程设计：
 * 阶段1: 项目概览 → 架构文档初版
 * 阶段2: 文件级分析 → 文件文档
 * 阶段3: 模块级整合 → 模块文档  
 * 阶段4: 集成级分析 → 连接文档
 * 阶段5: 架构优化 → 最终架构文档
 */

import { ProjectOverviewGenerator } from './project-overview-generator.js';
import { ProgressiveContentGenerator } from './progressive-content-generator.js';

export class AICollaborationOrchestrator {
    constructor() {
        this.overviewGenerator = new ProjectOverviewGenerator();
        this.contentGenerator = new ProgressiveContentGenerator();
        
        this.flowState = {
            projectPath: null,
            currentStage: 'idle',
            completedStages: [],
            generatedDocuments: {},
            context: {},
            progress: {
                total: 5,
                completed: 0,
                currentActivity: 'waiting'
            }
        };

        // 流程阶段定义
        this.stages = {
            'project-overview': {
                name: '项目概览分析',
                order: 1,
                description: '生成项目的整体概览和初版架构文档',
                expectedOutput: 'system-architecture.md (初版)',
                aiInstructions: '基于项目概览数据生成系统架构文档的初版',
                dependencies: [],
                estimatedTime: '2-3分钟'
            },
            'file-level': {
                name: '文件级文档生成',
                order: 2,
                description: '逐批次分析源代码文件，生成文件级文档',
                expectedOutput: 'file-docs/*.md (多个文件)',
                aiInstructions: '分析每个代码文件，生成详细的文件文档',
                dependencies: ['project-overview'],
                estimatedTime: '5-10分钟'
            },
            'module-level': {
                name: '模块级整合',
                order: 3,
                description: '整合文件文档，生成模块级文档',
                expectedOutput: 'module-docs/*.md (模块文档)',
                aiInstructions: '基于文件文档整合生成模块级文档',
                dependencies: ['file-level'],
                estimatedTime: '3-5分钟'
            },
            'integration-level': {
                name: '集成分析',
                order: 4,
                description: '分析模块间连接，生成集成文档',
                expectedOutput: 'integration-docs/module-connections.md',
                aiInstructions: '分析模块间的依赖和连接关系',
                dependencies: ['module-level'],
                estimatedTime: '2-4分钟'
            },
            'architecture-optimization': {
                name: '架构文档优化',
                order: 5,
                description: '基于所有生成的文档优化最终架构文档',
                expectedOutput: 'system-architecture.md (最终版)',
                aiInstructions: '整合所有分析结果，生成最终的系统架构文档',
                dependencies: ['integration-level'],
                estimatedTime: '2-3分钟'
            }
        };
    }

    /**
     * 初始化AI协作流程
     */
    async initializeFlow(projectPath, options = {}) {
        console.log(`[AIOrchestrator] 初始化AI协作流程: ${projectPath}`);
        
        this.flowState = {
            projectPath,
            currentStage: 'initialized',
            completedStages: [],
            generatedDocuments: {},
            context: {
                startTime: new Date().toISOString(),
                options: {
                    maxBatchSize: options.maxBatchSize || '80KB',
                    documentationStyle: options.style || 'comprehensive',
                    focusAreas: options.focusAreas || [],
                    includeTests: options.includeTests !== false
                }
            },
            progress: {
                total: 5,
                completed: 0,
                currentActivity: 'initialized'
            }
        };

        return {
            flowId: this.generateFlowId(),
            stages: this.stages,
            estimatedTotalTime: '15-25分钟',
            nextStage: 'project-overview',
            instructions: '调用 executeStage("project-overview") 开始流程'
        };
    }

    /**
     * 执行特定阶段
     */
    async executeStage(stageName, additionalContext = {}) {
        console.log(`[AIOrchestrator] 执行阶段: ${stageName}`);
        
        if (!this.stages[stageName]) {
            throw new Error(`未知的阶段: ${stageName}`);
        }

        const stage = this.stages[stageName];
        
        // 检查依赖
        if (!this.checkStageDependencies(stage.dependencies)) {
            throw new Error(`阶段依赖未满足: ${stage.dependencies.join(', ')}`);
        }

        this.flowState.currentStage = stageName;
        this.flowState.progress.currentActivity = stage.description;

        try {
            let result;
            
            switch (stageName) {
                case 'project-overview':
                    result = await this.executeProjectOverviewStage();
                    break;
                case 'file-level':
                    result = await this.executeFileLevelStage(additionalContext);
                    break;
                case 'module-level':
                    result = await this.executeModuleLevelStage(additionalContext);
                    break;
                case 'integration-level':
                    result = await this.executeIntegrationLevelStage(additionalContext);
                    break;
                case 'architecture-optimization':
                    result = await this.executeArchitectureOptimizationStage(additionalContext);
                    break;
                default:
                    throw new Error(`未实现的阶段执行逻辑: ${stageName}`);
            }

            // 标记阶段完成
            this.markStageCompleted(stageName);
            
            return {
                stage: stageName,
                completed: true,
                result,
                nextStage: this.getNextStage(stageName),
                progress: this.flowState.progress,
                context: this.getContextualInformation(stageName)
            };

        } catch (error) {
            console.error(`[AIOrchestrator] 阶段执行失败: ${stageName}`, error);
            throw new Error(`阶段执行失败: ${error.message}`);
        }
    }

    /**
     * 执行项目概览阶段
     */
    async executeProjectOverviewStage() {
        console.log('[AIOrchestrator] 执行项目概览阶段...');
        
        const overview = await this.overviewGenerator.generateOverview(
            this.flowState.projectPath,
            this.flowState.context.options
        );

        // 为AI准备数据包
        const aiDataPackage = {
            type: 'project-overview',
            projectMetadata: overview.projectMetadata,
            languageProfile: overview.languageProfile,
            dependencyAnalysis: overview.dependencyAnalysis,
            directoryStructure: overview.directoryStructure,
            keyFileContents: overview.keyFileContents,
            projectCharacteristics: overview.projectCharacteristics,
            
            aiGenerationGuide: {
                documentType: 'system-architecture',
                version: 'initial',
                suggestedSections: [
                    '## 项目概览',
                    '## 技术栈分析', 
                    '## 架构概述',
                    '## 目录结构',
                    '## 核心依赖',
                    '## 开发指南'
                ],
                focusAreas: overview.aiGenerationGuide.keyFocusAreas,
                style: this.flowState.context.options.documentationStyle
            },

            instructions: {
                task: '生成系统架构文档初版',
                targetFile: 'system-architecture.md',
                requirements: [
                    '基于项目概览数据分析项目架构',
                    '识别核心模块和关键组件',
                    '分析技术选型和依赖关系',
                    '提供清晰的项目结构说明',
                    '为后续详细分析奠定基础'
                ],
                outputFormat: 'markdown',
                estimatedLength: '1000-2000字'
            }
        };

        // 保存上下文用于后续阶段
        this.flowState.context.projectOverview = overview;
        this.flowState.generatedDocuments['project-overview'] = aiDataPackage;

        return aiDataPackage;
    }

    /**
     * 执行文件级阶段
     */
    async executeFileLevelStage(additionalContext = {}) {
        console.log('[AIOrchestrator] 执行文件级阶段...');
        
        const batchConfiguration = await this.contentGenerator.generateProgressiveBatches(
            this.flowState.projectPath,
            {
                stage: 'file-level',
                maxBatchSize: this.flowState.context.options.maxBatchSize,
                ...additionalContext
            }
        );

        // 为每个批次准备AI协作数据
        const fileLevelInstructions = {
            type: 'file-level-analysis',
            totalBatches: batchConfiguration.totalBatches,
            processingStrategy: 'sequential-batch-processing',
            
            batchInstructions: {
                task: '逐批次分析源代码文件',
                outputPattern: 'file-docs/{filename}.md',
                requirements: [
                    '分析每个文件的功能和作用',
                    '识别关键函数和类',
                    '分析文件间的依赖关系',
                    '记录重要的设计决策',
                    '标注需要注意的代码模式'
                ],
                batchProcessing: {
                    approach: 'incremental',
                    contextPreservation: true,
                    crossFileAnalysis: true
                }
            },

            // 批次数据会在实际调用时生成
            batches: batchConfiguration.batches,
            
            progressionPlan: {
                currentPhase: 'file-analysis',
                nextPhase: 'module-integration',
                completionCriteria: '所有源代码文件已分析并生成文档'
            }
        };

        this.flowState.context.fileLevelConfig = batchConfiguration;
        this.flowState.generatedDocuments['file-level'] = fileLevelInstructions;

        return fileLevelInstructions;
    }

    /**
     * 执行模块级阶段
     */
    async executeModuleLevelStage(additionalContext = {}) {
        console.log('[AIOrchestrator] 执行模块级阶段...');
        
        // 基于文件级分析结果生成模块整合指令
        const fileLevelContext = this.flowState.context.fileLevelConfig || {};
        const projectOverview = this.flowState.context.projectOverview || {};

        const moduleIntegrationData = {
            type: 'module-level-integration',
            basedOn: 'file-level-analysis-results',
            
            projectContext: {
                name: projectOverview.projectMetadata?.name,
                primaryLanguage: projectOverview.languageProfile?.primary,
                architecture: projectOverview.projectCharacteristics?.architecture
            },

            moduleAnalysis: {
                identificationMethod: 'directory-and-dependency-based',
                expectedModules: this.identifyProjectModules(projectOverview),
                integrationStrategy: 'hierarchical-grouping'
            },

            aiInstructions: {
                task: '整合文件文档生成模块文档',
                inputSource: 'file-docs/*.md',
                outputPattern: 'module-docs/{module-name}.md',
                requirements: [
                    '将相关文件的文档整合成模块文档',
                    '分析模块的整体功能和职责',
                    '识别模块的公共接口和依赖',
                    '描述模块的内部架构',
                    '记录模块的使用方式和配置'
                ],
                integrationCriteria: [
                    '功能相关性',
                    '目录结构',
                    '依赖关系',
                    '职责边界'
                ]
            },

            processingHints: {
                groupingStrategy: 'smart-clustering',
                contextPreservation: 'cross-module',
                qualityChecks: ['completeness', 'consistency', 'clarity']
            }
        };

        this.flowState.generatedDocuments['module-level'] = moduleIntegrationData;
        return moduleIntegrationData;
    }

    /**
     * 执行集成级阶段
     */
    async executeIntegrationLevelStage(additionalContext = {}) {
        console.log('[AIOrchestrator] 执行集成级阶段...');
        
        const integrationAnalysisData = {
            type: 'integration-level-analysis',
            basedOn: 'module-level-documentation',
            
            analysisScope: {
                moduleInteractions: true,
                dataFlow: true,
                dependencyChain: true,
                communicationPatterns: true,
                integrationPoints: true
            },

            aiInstructions: {
                task: '分析模块间连接和集成关系',
                inputSource: 'module-docs/*.md',
                outputFile: 'integration-docs/module-connections.md',
                requirements: [
                    '分析模块间的依赖关系',
                    '识别数据流和控制流',
                    '分析通信模式和接口',
                    '识别集成点和边界',
                    '评估架构的合理性'
                ],
                analysisAspects: [
                    'dependency-analysis',
                    'data-flow-mapping',
                    'interface-analysis',
                    'communication-patterns',
                    'integration-bottlenecks'
                ]
            },

            expectedInsights: [
                '模块依赖图',
                '数据流向图',
                '关键集成点',
                '潜在问题识别',
                '优化建议'
            ],

            contextualInformation: {
                projectType: this.flowState.context.projectOverview?.projectCharacteristics?.type,
                architecturePattern: this.flowState.context.projectOverview?.projectCharacteristics?.architecture,
                complexity: this.flowState.context.projectOverview?.projectCharacteristics?.complexity
            }
        };

        this.flowState.generatedDocuments['integration-level'] = integrationAnalysisData;
        return integrationAnalysisData;
    }

    /**
     * 执行架构优化阶段
     */
    async executeArchitectureOptimizationStage(additionalContext = {}) {
        console.log('[AIOrchestrator] 执行架构优化阶段...');
        
        const optimizationData = {
            type: 'architecture-optimization',
            basedOn: 'complete-documentation-set',
            
            inputSources: [
                'system-architecture.md (初版)',
                'file-docs/*.md',
                'module-docs/*.md', 
                'integration-docs/module-connections.md'
            ],

            optimizationObjectives: {
                accuracy: '基于深入分析修正初版架构文档',
                completeness: '补充遗漏的架构细节',
                clarity: '提高文档的清晰度和可读性',
                consistency: '确保与实际实现的一致性',
                usefulness: '增加实用的开发指导信息'
            },

            aiInstructions: {
                task: '生成最终优化的系统架构文档',
                outputFile: 'system-architecture.md (最终版)',
                requirements: [
                    '整合所有分析结果',
                    '修正初版文档的不准确之处',
                    '补充详细的架构信息',
                    '添加实际的使用指导',
                    '提供清晰的开发建议'
                ],
                integrationStrategy: 'comprehensive-synthesis',
                qualityStandards: [
                    'technical-accuracy',
                    'completeness',
                    'clarity',
                    'actionability'
                ]
            },

            comprehensiveContext: {
                projectOverview: this.flowState.context.projectOverview,
                analysisJourney: this.getAnalysisJourney(),
                keyFindings: this.extractKeyFindings(),
                improvementOpportunities: this.identifyImprovements()
            }
        };

        this.flowState.generatedDocuments['architecture-optimization'] = optimizationData;
        return optimizationData;
    }

    /**
     * 获取流程状态
     */
    getFlowStatus() {
        return {
            flowState: this.flowState,
            availableStages: Object.keys(this.stages),
            stageDetails: this.stages,
            completionPercentage: (this.flowState.progress.completed / this.flowState.progress.total) * 100,
            estimatedRemaining: this.calculateRemainingTime()
        };
    }

    /**
     * 工具方法集合
     */
    generateFlowId() {
        return `ai-flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    checkStageDependencies(dependencies) {
        return dependencies.every(dep => this.flowState.completedStages.includes(dep));
    }

    markStageCompleted(stageName) {
        if (!this.flowState.completedStages.includes(stageName)) {
            this.flowState.completedStages.push(stageName);
            this.flowState.progress.completed++;
        }
    }

    getNextStage(currentStage) {
        const stageOrder = ['project-overview', 'file-level', 'module-level', 'integration-level', 'architecture-optimization'];
        const currentIndex = stageOrder.indexOf(currentStage);
        return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
    }

    getContextualInformation(stageName) {
        return {
            completedStages: this.flowState.completedStages,
            remainingStages: Object.keys(this.stages).filter(s => !this.flowState.completedStages.includes(s)),
            progressSummary: `${this.flowState.progress.completed}/${this.flowState.progress.total} 阶段完成`,
            nextRecommendedAction: this.getNextStage(stageName) ? 
                `执行下一阶段: ${this.getNextStage(stageName)}` : 
                '所有阶段已完成'
        };
    }

    identifyProjectModules(overview) {
        // 简化的模块识别逻辑
        return ['core', 'api', 'utils', 'config'].slice(0, 3);
    }

    getAnalysisJourney() {
        return {
            stages: this.flowState.completedStages,
            insights: 'Progressive analysis from files to architecture',
            methodology: 'Bottom-up comprehensive analysis'
        };
    }

    extractKeyFindings() {
        return [
            '项目结构分析完成',
            '模块依赖关系已明确',
            '集成点已识别'
        ];
    }

    identifyImprovements() {
        return [
            '架构文档准确性提升',
            '开发指导信息完善',
            '模块边界清晰化'
        ];
    }

    calculateRemainingTime() {
        const remaining = this.flowState.progress.total - this.flowState.progress.completed;
        return `约 ${remaining * 3} 分钟`;
    }
}

export default AICollaborationOrchestrator;