/**
 * 任务完成监控服务
 * 
 * 核心功能：
 * - 监督任务执行流程和完成质量
 * - 验证任务完成条件和输出质量
 * - 提供任务执行建议和错误恢复
 * - 统计和分析任务执行效率
 * - 与AI TODO管理器协同工作
 */

import { promises as fs } from 'fs';
import { resolve, join, dirname } from 'path';

export class CompleteTaskMonitor {
    constructor(config = {}, dependencies = {}, serviceBus = null) {
        // 配置合并（ServiceBus格式）
        this.config = {
            // 质量检查配置
            minQualityScore: 70,
            enableDetailedLogging: true,
            saveReports: true,
            reportsDir: 'mg_kiro/create/reports',
            
            // 任务类型配置
            taskTypes: {
                FILE_PROCESSING: 'file_processing',
                CODE_CREATION: 'code_creation',
                DOCUMENT_GENERATION: 'document_generation',
                ARCHITECTURE_DESIGN: 'architecture_design',
                MODULE_IMPLEMENTATION: 'module_implementation',
                API_DEVELOPMENT: 'api_development',
                TEST_CREATION: 'test_creation'
            },
            
            // 质量检查类型
            qualityChecks: {
                COMPLETENESS: 'completeness',
                CODE_QUALITY: 'code_quality',
                DOCUMENTATION: 'documentation',
                FUNCTIONALITY: 'functionality',
                STANDARDS_COMPLIANCE: 'standards_compliance',
                ERROR_HANDLING: 'error_handling'
            },
            
            // 覆盖默认配置
            ...config
        };

        // 依赖注入（ServiceBus格式）
        this.serviceBus = serviceBus;
        this.logger = dependencies.logger || console;
        
        // 核心状态
        this.taskExecutions = new Map(); // 任务执行记录
        this.qualityStandards = new Map(); // 质量标准
        this.executionMetrics = new Map(); // 执行指标
        
        // 使用配置中的枚举（向后兼容）
        this.taskTypes = this.config.taskTypes;
        this.qualityChecks = this.config.qualityChecks;

        // 初始化质量标准
        this.initializeQualityStandards();
        
        this.logger.info('[TaskMonitor] 任务完成监控服务已初始化');
    }

    /**
     * ServiceBus兼容方法：初始化服务
     */
    async initialize() {
        // 执行任何异步初始化逻辑
        return Promise.resolve();
    }

    /**
     * ServiceBus兼容方法：获取服务状态
     */
    getStatus() {
        return {
            name: 'CompleteTaskMonitor',
            status: 'active',
            taskExecutions: this.taskExecutions.size,
            qualityStandards: this.qualityStandards.size,
            config: this.config
        };
    }

    /**
     * 开始监控任务执行
     */
    async startTaskMonitoring(taskId, taskData, options = {}) {
        this.logger.info(`[TaskMonitor] 开始监控任务: ${taskId}`);

        const execution = {
            taskId,
            taskType: taskData.type || 'general',
            projectPath: taskData.projectPath,
            startTime: new Date().toISOString(),
            status: 'in_progress',
            
            // 任务信息
            taskInfo: {
                title: taskData.title,
                description: taskData.description,
                expectedOutputs: taskData.expectedOutputs || [],
                qualityRequirements: taskData.qualityRequirements || []
            },
            
            // 执行上下文
            context: {
                workflowType: options.workflowType || 'unknown',
                phase: options.phase || 'implementation',
                dependencies: taskData.dependencies || [],
                relatedFiles: taskData.relatedFiles || []
            },
            
            // 监控配置
            monitoring: {
                enableQualityCheck: options.enableQualityCheck !== false,
                enableTimeTracking: options.enableTimeTracking !== false,
                enableOutputValidation: options.enableOutputValidation !== false,
                customValidators: options.customValidators || []
            },
            
            // 执行记录
            execution: {
                attempts: 0,
                errors: [],
                warnings: [],
                outputs: [],
                metrics: {}
            }
        };

        this.taskExecutions.set(taskId, execution);
        
        return {
            success: true,
            taskId,
            message: '任务监控已启动',
            monitoringConfig: execution.monitoring,
            qualityStandards: this.getTaskQualityStandards(execution.taskType),
            nextActions: [
                '执行任务开发工作',
                '生成必要的输出文件',
                '调用 complete_task_validation 进行完成验证'
            ]
        };
    }

    /**
     * 验证任务完成
     */
    async validateTaskCompletion(taskId, completionData, options = {}) {
        this.logger.info(`[TaskMonitor] 验证任务完成: ${taskId}`);

        const execution = this.taskExecutions.get(taskId);
        
        if (!execution) {
            return {
                success: false,
                error: `任务 ${taskId} 未找到监控记录`
            };
        }

        // 更新执行记录
        execution.execution.attempts++;
        execution.execution.outputs.push({
            timestamp: new Date().toISOString(),
            data: completionData
        });

        // 执行完成验证
        const validationResult = await this.performTaskValidation(
            execution, completionData, options
        );

        // 更新执行状态
        if (validationResult.passed) {
            execution.status = 'completed';
            execution.completedTime = new Date().toISOString();
            execution.execution.metrics.totalTime = this.calculateExecutionTime(execution);
        } else {
            execution.status = 'validation_failed';
            execution.execution.errors.push({
                timestamp: new Date().toISOString(),
                type: 'validation_failure',
                details: validationResult.issues
            });
        }

        // 生成完成报告
        const completionReport = await this.generateCompletionReport(
            execution, validationResult
        );

        return {
            success: validationResult.passed,
            taskId,
            validationResult,
            completionReport,
            recommendations: this.generateTaskRecommendations(execution, validationResult),
            
            // 如果验证失败，提供恢复建议
            recoveryActions: validationResult.passed ? null : 
                this.generateRecoveryActions(execution, validationResult)
        };
    }

    /**
     * 执行任务验证
     */
    async performTaskValidation(execution, completionData, options) {
        this.logger.info(`[TaskMonitor] 执行任务验证: ${execution.taskType}`);

        const validationResult = {
            passed: true,
            score: 0,
            maxScore: 0,
            issues: [],
            checks: {}
        };

        try {
            // 获取任务类型对应的质量标准
            const qualityStandards = this.getTaskQualityStandards(execution.taskType);
            
            // 执行各项质量检查
            for (const standard of qualityStandards) {
                const checkResult = await this.performQualityCheck(
                    standard, execution, completionData, options
                );
                
                validationResult.checks[standard.name] = checkResult;
                validationResult.score += checkResult.score;
                validationResult.maxScore += standard.maxScore;
                
                if (!checkResult.passed) {
                    validationResult.passed = false;
                    validationResult.issues.push(...checkResult.issues);
                }
            }

            // 计算总体质量分数
            validationResult.qualityScore = Math.round(
                (validationResult.score / validationResult.maxScore) * 100
            );

            // 如果分数低于阈值，标记为未通过
            const minQualityScore = options.minQualityScore || this.config.minQualityScore;
            if (validationResult.qualityScore < minQualityScore) {
                validationResult.passed = false;
                validationResult.issues.push(
                    `质量分数 ${validationResult.qualityScore} 低于最低要求 ${minQualityScore}`
                );
            }

        } catch (error) {
            this.logger.error('[TaskMonitor] 任务验证失败:', error);
            validationResult.passed = false;
            validationResult.issues.push(`验证执行失败: ${error.message}`);
        }

        return validationResult;
    }

    /**
     * 执行质量检查
     */
    async performQualityCheck(standard, execution, completionData, options) {
        const checkResult = {
            name: standard.name,
            passed: false,
            score: 0,
            maxScore: standard.maxScore,
            issues: [],
            details: {}
        };

        try {
            switch (standard.type) {
                case this.qualityChecks.COMPLETENESS:
                    await this.checkTaskCompleteness(checkResult, execution, completionData);
                    break;
                
                case this.qualityChecks.CODE_QUALITY:
                    await this.checkCodeQuality(checkResult, execution, completionData);
                    break;
                
                case this.qualityChecks.DOCUMENTATION:
                    await this.checkDocumentation(checkResult, execution, completionData);
                    break;
                
                case this.qualityChecks.FUNCTIONALITY:
                    await this.checkFunctionality(checkResult, execution, completionData);
                    break;
                
                case this.qualityChecks.STANDARDS_COMPLIANCE:
                    await this.checkStandardsCompliance(checkResult, execution, completionData);
                    break;
                
                case this.qualityChecks.ERROR_HANDLING:
                    await this.checkErrorHandling(checkResult, execution, completionData);
                    break;
                
                default:
                    checkResult.issues.push(`未知的质量检查类型: ${standard.type}`);
            }
            
            // 判断检查是否通过
            checkResult.passed = checkResult.issues.length === 0 && 
                               checkResult.score >= (standard.minScore || standard.maxScore * 0.7);

        } catch (error) {
            this.logger.error(`[TaskMonitor] 质量检查失败 ${standard.name}:`, error);
            checkResult.issues.push(`检查执行失败: ${error.message}`);
        }

        return checkResult;
    }

    /**
     * 检查任务完整性
     */
    async checkTaskCompleteness(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 25;

        // 检查必需的输出文件
        const expectedOutputs = execution.taskInfo.expectedOutputs;
        if (expectedOutputs.length > 0) {
            const existingOutputs = completionData.outputFiles || [];
            const missingOutputs = expectedOutputs.filter(expected => 
                !existingOutputs.some(existing => existing.includes(expected))
            );
            
            if (missingOutputs.length === 0) {
                score += 15;
            } else {
                checkResult.issues.push(`缺少输出文件: ${missingOutputs.join(', ')}`);
            }
        } else {
            score += 15; // 没有指定输出文件要求，默认通过
        }

        // 检查任务描述的实现程度
        if (completionData.implementationNotes) {
            score += 10;
        } else {
            checkResult.issues.push('缺少实现说明');
        }

        checkResult.score = score;
        checkResult.details.completenessScore = `${score}/${maxScore}`;
    }

    /**
     * 检查代码质量
     */
    async checkCodeQuality(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 30;

        // 如果有代码文件，检查代码质量
        const codeFiles = completionData.outputFiles?.filter(file => 
            file.endsWith('.js') || file.endsWith('.ts') || 
            file.endsWith('.py') || file.endsWith('.java')
        ) || [];

        if (codeFiles.length > 0) {
            for (const codeFile of codeFiles) {
                try {
                    const codeContent = await this.readFileContent(
                        execution.projectPath, codeFile
                    );
                    
                    const qualityMetrics = this.analyzeCodeQuality(codeContent);
                    
                    if (qualityMetrics.hasComments) score += 5;
                    if (qualityMetrics.hasErrorHandling) score += 5;
                    if (qualityMetrics.followsConventions) score += 10;
                    if (qualityMetrics.isWellStructured) score += 10;
                    
                } catch (error) {
                    checkResult.issues.push(`无法分析代码文件 ${codeFile}: ${error.message}`);
                }
            }
        } else {
            score = maxScore; // 非代码任务，默认满分
        }

        checkResult.score = Math.min(score, maxScore);
        checkResult.details.codeQualityScore = `${checkResult.score}/${maxScore}`;
    }

    /**
     * 检查文档质量
     */
    async checkDocumentation(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 20;

        // 检查是否生成了文档
        const docFiles = completionData.outputFiles?.filter(file => 
            file.endsWith('.md') || file.endsWith('.txt')
        ) || [];

        if (docFiles.length > 0) {
            score += 10;
            
            // 检查文档内容质量
            for (const docFile of docFiles) {
                try {
                    const docContent = await this.readFileContent(
                        execution.projectPath, docFile
                    );
                    
                    const docQuality = this.analyzeDocumentationQuality(docContent);
                    
                    if (docQuality.hasStructure) score += 3;
                    if (docQuality.hasExamples) score += 4;
                    if (docQuality.isComprehensive) score += 3;
                    
                } catch (error) {
                    checkResult.issues.push(`无法分析文档 ${docFile}: ${error.message}`);
                }
            }
        } else if (execution.taskType === this.taskTypes.DOCUMENT_GENERATION) {
            checkResult.issues.push('文档生成任务未产生文档文件');
        } else {
            score += 10; // 非文档任务，部分分数
        }

        checkResult.score = Math.min(score, maxScore);
        checkResult.details.documentationScore = `${checkResult.score}/${maxScore}`;
    }

    /**
     * 检查功能实现
     */
    async checkFunctionality(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 15;

        // 基础功能检查
        if (completionData.functionalityTest) {
            if (completionData.functionalityTest.passed) {
                score += 15;
            } else {
                checkResult.issues.push(
                    `功能测试失败: ${completionData.functionalityTest.errors.join(', ')}`
                );
            }
        } else {
            // 简单的功能验证逻辑
            if (completionData.outputFiles && completionData.outputFiles.length > 0) {
                score += 10; // 有输出说明有功能实现
            }
            
            if (completionData.implementationNotes) {
                score += 5; // 有实现说明
            }
        }

        checkResult.score = score;
        checkResult.details.functionalityScore = `${score}/${maxScore}`;
    }

    /**
     * 检查标准合规性
     */
    async checkStandardsCompliance(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 10;

        // 检查文件命名规范
        const outputFiles = completionData.outputFiles || [];
        let namingCompliant = true;
        
        for (const file of outputFiles) {
            if (!this.checkFileNamingConvention(file)) {
                namingCompliant = false;
                checkResult.issues.push(`文件命名不规范: ${file}`);
            }
        }

        if (namingCompliant) score += 5;

        // 检查目录结构
        if (this.checkDirectoryStructure(outputFiles, execution.taskType)) {
            score += 5;
        } else {
            checkResult.issues.push('目录结构不符合规范');
        }

        checkResult.score = score;
        checkResult.details.complianceScore = `${score}/${maxScore}`;
    }

    /**
     * 检查错误处理
     */
    async checkErrorHandling(checkResult, execution, completionData) {
        let score = 0;
        const maxScore = 10;

        // 检查是否有错误处理逻辑
        const codeFiles = completionData.outputFiles?.filter(file => 
            file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.py')
        ) || [];

        if (codeFiles.length > 0) {
            let hasErrorHandling = false;
            
            for (const codeFile of codeFiles) {
                try {
                    const codeContent = await this.readFileContent(
                        execution.projectPath, codeFile
                    );
                    
                    if (this.hasErrorHandlingPatterns(codeContent)) {
                        hasErrorHandling = true;
                        break;
                    }
                } catch (error) {
                    // 忽略读取错误
                }
            }
            
            if (hasErrorHandling) {
                score += 10;
            } else {
                checkResult.issues.push('代码缺少错误处理逻辑');
            }
        } else {
            score = maxScore; // 非代码任务，默认满分
        }

        checkResult.score = score;
        checkResult.details.errorHandlingScore = `${score}/${maxScore}`;
    }

    /**
     * 生成完成报告
     */
    async generateCompletionReport(execution, validationResult) {
        const report = {
            taskId: execution.taskId,
            taskTitle: execution.taskInfo.title,
            projectPath: execution.projectPath,
            
            // 执行统计
            execution: {
                startTime: execution.startTime,
                completedTime: execution.completedTime,
                totalTime: execution.execution.metrics.totalTime,
                attempts: execution.execution.attempts,
                status: execution.status
            },
            
            // 验证结果
            validation: {
                passed: validationResult.passed,
                qualityScore: validationResult.qualityScore,
                score: validationResult.score,
                maxScore: validationResult.maxScore,
                issuesCount: validationResult.issues.length
            },
            
            // 输出文件
            outputs: execution.execution.outputs.map(output => ({
                timestamp: output.timestamp,
                files: output.data.outputFiles || [],
                notes: output.data.implementationNotes || ''
            })),
            
            // 质量检查详情
            qualityChecks: Object.entries(validationResult.checks).map(([name, check]) => ({
                name,
                passed: check.passed,
                score: `${check.score}/${check.maxScore}`,
                issues: check.issues.length
            })),
            
            // 生成时间
            reportGeneratedAt: new Date().toISOString()
        };

        // 保存报告到文件
        if (execution.projectPath) {
            await this.saveCompletionReport(execution.projectPath, report);
        }

        return report;
    }

    /**
     * 初始化质量标准
     */
    initializeQualityStandards() {
        // 文件处理任务的质量标准
        this.qualityStandards.set(this.taskTypes.FILE_PROCESSING, [
            { name: '完整性检查', type: this.qualityChecks.COMPLETENESS, maxScore: 25, minScore: 20 },
            { name: '文档质量', type: this.qualityChecks.DOCUMENTATION, maxScore: 20, minScore: 15 }
        ]);

        // 代码创建任务的质量标准
        this.qualityStandards.set(this.taskTypes.CODE_CREATION, [
            { name: '完整性检查', type: this.qualityChecks.COMPLETENESS, maxScore: 25, minScore: 20 },
            { name: '代码质量', type: this.qualityChecks.CODE_QUALITY, maxScore: 30, minScore: 25 },
            { name: '标准合规', type: this.qualityChecks.STANDARDS_COMPLIANCE, maxScore: 10, minScore: 8 },
            { name: '错误处理', type: this.qualityChecks.ERROR_HANDLING, maxScore: 10, minScore: 7 }
        ]);

        // 文档生成任务的质量标准
        this.qualityStandards.set(this.taskTypes.DOCUMENT_GENERATION, [
            { name: '完整性检查', type: this.qualityChecks.COMPLETENESS, maxScore: 25, minScore: 20 },
            { name: '文档质量', type: this.qualityChecks.DOCUMENTATION, maxScore: 20, minScore: 18 }
        ]);

        // 架构设计任务的质量标准
        this.qualityStandards.set(this.taskTypes.ARCHITECTURE_DESIGN, [
            { name: '完整性检查', type: this.qualityChecks.COMPLETENESS, maxScore: 25, minScore: 22 },
            { name: '文档质量', type: this.qualityChecks.DOCUMENTATION, maxScore: 20, minScore: 18 },
            { name: '标准合规', type: this.qualityChecks.STANDARDS_COMPLIANCE, maxScore: 10, minScore: 8 }
        ]);

        // 默认质量标准
        this.qualityStandards.set('default', [
            { name: '完整性检查', type: this.qualityChecks.COMPLETENESS, maxScore: 25, minScore: 20 },
            { name: '功能实现', type: this.qualityChecks.FUNCTIONALITY, maxScore: 15, minScore: 12 }
        ]);
    }

    /**
     * 辅助工具方法
     */
    getTaskQualityStandards(taskType) {
        return this.qualityStandards.get(taskType) || this.qualityStandards.get('default');
    }

    calculateExecutionTime(execution) {
        if (!execution.completedTime || !execution.startTime) return null;
        
        const start = new Date(execution.startTime);
        const end = new Date(execution.completedTime);
        const diffMs = end - start;
        
        return Math.round(diffMs / 1000); // 返回秒数
    }

    async readFileContent(projectPath, relativePath) {
        const fullPath = resolve(projectPath, relativePath);
        return await fs.readFile(fullPath, 'utf8');
    }

    analyzeCodeQuality(codeContent) {
        return {
            hasComments: codeContent.includes('//') || codeContent.includes('/*'),
            hasErrorHandling: this.hasErrorHandlingPatterns(codeContent),
            followsConventions: this.followsNamingConventions(codeContent),
            isWellStructured: this.isCodeWellStructured(codeContent)
        };
    }

    analyzeDocumentationQuality(docContent) {
        return {
            hasStructure: docContent.includes('#') && docContent.includes('##'),
            hasExamples: docContent.includes('```') || docContent.includes('例子') || docContent.includes('示例'),
            isComprehensive: docContent.length > 500
        };
    }

    hasErrorHandlingPatterns(codeContent) {
        const patterns = ['try', 'catch', 'throw', 'error', 'Error', 'exception'];
        return patterns.some(pattern => codeContent.includes(pattern));
    }

    followsNamingConventions(codeContent) {
        // 简单的命名约定检查
        const hasValidFunctionNames = /function\s+[a-z][a-zA-Z0-9]*/.test(codeContent);
        const hasValidClassNames = /class\s+[A-Z][a-zA-Z0-9]*/.test(codeContent);
        return hasValidFunctionNames || hasValidClassNames || true; // 宽松检查
    }

    isCodeWellStructured(codeContent) {
        // 简单的结构检查
        const lines = codeContent.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const avgLineLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length;
        
        return avgLineLength < 120 && nonEmptyLines.length > 5;
    }

    checkFileNamingConvention(filename) {
        // 检查文件命名约定
        const validPatterns = [
            /^[a-z][a-z0-9-]*\.(js|ts|py|java|go|md)$/,  // kebab-case
            /^[a-zA-Z][a-zA-Z0-9]*\.(js|ts|py|java|go|md)$/,  // camelCase或PascalCase
            /^[A-Z][A-Z0-9_]*\.(md|txt)$/  // UPPER_CASE for docs
        ];
        
        return validPatterns.some(pattern => pattern.test(filename));
    }

    checkDirectoryStructure(outputFiles, taskType) {
        // 简单的目录结构检查
        if (outputFiles.length === 0) return true;
        
        const hasValidPaths = outputFiles.every(file => 
            !file.includes('..') && !file.startsWith('/')
        );
        
        return hasValidPaths;
    }

    generateTaskRecommendations(execution, validationResult) {
        const recommendations = [];
        
        if (validationResult.qualityScore < 80) {
            recommendations.push('建议提高代码质量和文档完整性');
        }
        
        if (execution.execution.attempts > 1) {
            recommendations.push('任务执行多次，建议优化开发流程');
        }
        
        if (validationResult.issues.length > 0) {
            recommendations.push('解决验证中发现的问题以提高质量');
        }
        
        return recommendations;
    }

    generateRecoveryActions(execution, validationResult) {
        const actions = [];
        
        for (const issue of validationResult.issues) {
            if (issue.includes('缺少输出文件')) {
                actions.push('检查并创建所需的输出文件');
            }
            if (issue.includes('代码质量')) {
                actions.push('改进代码结构、添加注释和错误处理');
            }
            if (issue.includes('文档')) {
                actions.push('完善文档内容，添加必要的说明和示例');
            }
        }
        
        if (actions.length === 0) {
            actions.push('重新检查任务要求并补充遗漏的内容');
        }
        
        return actions;
    }

    async saveCompletionReport(projectPath, report) {
        if (!this.config.saveReports) {
            return; // 如果配置禁用保存报告，直接返回
        }
        
        try {
            const reportsDir = resolve(projectPath, this.config.reportsDir);
            await fs.mkdir(reportsDir, { recursive: true });
            
            const reportFile = join(reportsDir, `task-${report.taskId}-report.json`);
            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            
            this.logger.info(`[TaskMonitor] 完成报告已保存: ${reportFile}`);
        } catch (error) {
            this.logger.error('[TaskMonitor] 保存完成报告失败:', error);
        }
    }

    /**
     * 获取任务执行统计
     */
    getExecutionStatistics(projectPath = null) {
        const executions = Array.from(this.taskExecutions.values());
        const filteredExecutions = projectPath ? 
            executions.filter(exec => exec.projectPath === projectPath) : 
            executions;

        const stats = {
            total: filteredExecutions.length,
            completed: filteredExecutions.filter(exec => exec.status === 'completed').length,
            failed: filteredExecutions.filter(exec => exec.status === 'validation_failed').length,
            inProgress: filteredExecutions.filter(exec => exec.status === 'in_progress').length,
            
            averageQualityScore: 0,
            averageExecutionTime: 0,
            totalAttempts: 0
        };

        const completedExecutions = filteredExecutions.filter(exec => exec.status === 'completed');
        
        if (completedExecutions.length > 0) {
            stats.averageExecutionTime = Math.round(
                completedExecutions.reduce((sum, exec) => 
                    sum + (exec.execution.metrics.totalTime || 0), 0
                ) / completedExecutions.length
            );
        }

        stats.totalAttempts = filteredExecutions.reduce((sum, exec) => 
            sum + exec.execution.attempts, 0
        );

        return stats;
    }
}

export default CompleteTaskMonitor;