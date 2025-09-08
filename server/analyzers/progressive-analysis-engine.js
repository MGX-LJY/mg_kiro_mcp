/**
 * 渐进式分析引擎
 * 实现"先概览后深入"的分析策略，智能协调各种分析器
 * 
 * 核心策略：
 * 1. Level 1: 快速概览 - 项目结构和基础信息
 * 2. Level 2: 架构分析 - 关键组件和设计模式
 * 3. Level 3: 模块深入 - 完整代码分析
 * 4. Level 4: 集成分析 - 跨模块关系和系统性洞察
 * 5. 根据用户需求和项目规模动态调整分析深度
 */

import ArchitectureKeyExtractor from './architecture-key-extractor.js';
import ModuleCompleteAnalyzer from './module-complete-analyzer.js';
import IntelligentLayeredAnalyzer from './intelligent-layered-analyzer.js';
import fs from 'fs/promises';
import path from 'path';

export class ProgressiveAnalysisEngine {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.currentAnalysisLevel = 0;
        this.analysisResults = {};
        this.analysisCache = new Map();
        this.projectMetrics = {};
        
        // 初始化各个分析器
        this.architectureExtractor = new ArchitectureKeyExtractor(projectPath);
        this.moduleAnalyzer = new ModuleCompleteAnalyzer(projectPath);
        this.layeredAnalyzer = new IntelligentLayeredAnalyzer(projectPath);
        
        // 分析级别配置
        this.analysisLevels = this.initializeAnalysisLevels();
    }

    /**
     * 执行渐进式分析
     * @param {Object} options - 分析选项
     * @returns {Object} 完整分析结果
     */
    async performProgressiveAnalysis(options = {}) {
        const {
            maxLevel = 4,           // 最大分析深度
            adaptiveDepth = true,   // 根据项目规模自适应调整深度
            timeLimit = 300000,     // 分析时间限制 (5分钟)
            priorityFocus = null,   // 优先关注领域 ('architecture', 'modules', 'quality', 'security')
            skipLevels = []         // 跳过的级别
        } = options;

        const startTime = Date.now();
        console.log('[渐进式分析] 开始分析，目标级别:', maxLevel);

        try {
            // 初始化分析会话
            await this.initializeAnalysisSession();

            // 自适应调整分析策略
            if (adaptiveDepth) {
                await this.adaptAnalysisStrategy();
            }

            // 逐级执行分析
            for (let level = 1; level <= maxLevel; level++) {
                if (skipLevels.includes(level)) {
                    console.log(`[渐进式分析] 跳过 Level ${level}`);
                    continue;
                }

                // 检查时间限制
                if (Date.now() - startTime > timeLimit) {
                    console.log('[渐进式分析] 达到时间限制，停止分析');
                    break;
                }

                console.log(`[渐进式分析] 开始 Level ${level} 分析...`);
                await this.executeAnalysisLevel(level, priorityFocus);
                this.currentAnalysisLevel = level;

                // 提供中间结果反馈
                this.logLevelProgress(level);
            }

            // 生成最终报告
            const finalReport = await this.generateProgressiveReport();
            
            console.log(`[渐进式分析] 完成，用时: ${Date.now() - startTime}ms`);
            return finalReport;

        } catch (error) {
            console.error('[渐进式分析] 分析失败:', error);
            throw new Error(`渐进式分析失败: ${error.message}`);
        }
    }

    /**
     * 初始化分析会话
     */
    async initializeAnalysisSession() {
        console.log('[渐进式分析] 初始化分析会话...');
        
        // 计算项目基础指标
        this.projectMetrics = await this.calculateProjectMetrics();
        
        // 初始化分析结果结构
        this.analysisResults = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            projectPath: this.projectPath,
            projectMetrics: this.projectMetrics,
            levels: {},
            progressiveInsights: {},
            recommendations: [],
            metadata: {
                analysisStrategy: 'progressive-adaptive',
                engineVersion: '1.0.0'
            }
        };

        console.log(`[项目指标] 文件: ${this.projectMetrics.totalFiles}, 代码行: ${this.projectMetrics.totalLines}, 语言: ${this.projectMetrics.primaryLanguage}`);
    }

    /**
     * 自适应调整分析策略
     */
    async adaptAnalysisStrategy() {
        console.log('[自适应策略] 根据项目特征调整分析策略...');

        const metrics = this.projectMetrics;
        
        // 根据项目规模调整
        if (metrics.totalFiles > 100) {
            console.log('[自适应策略] 大型项目，启用高效模式');
            this.analysisLevels[2].chunkSize = 6000; // 减少chunk大小
            this.analysisLevels[3].maxFiles = 50;    // 限制深度分析文件数
        } else if (metrics.totalFiles < 20) {
            console.log('[自适应策略] 小型项目，启用详细模式');
            this.analysisLevels[3].maxFiles = metrics.totalFiles; // 全文件深度分析
        }

        // 根据语言特征调整
        if (metrics.primaryLanguage === 'javascript') {
            this.analysisLevels[2].focusPatterns = ['async/await', 'callback', 'promise', 'mvc'];
        } else if (metrics.primaryLanguage === 'python') {
            this.analysisLevels[2].focusPatterns = ['decorator', 'context-manager', 'generator', 'mvc'];
        }

        // 根据复杂度调整
        if (metrics.estimatedComplexity > 0.7) {
            console.log('[自适应策略] 高复杂度项目，增强质量分析');
            this.analysisLevels[3].enableQualityAnalysis = true;
            this.analysisLevels[4].enableTechnicalDebtAnalysis = true;
        }
    }

    /**
     * 执行指定级别的分析
     */
    async executeAnalysisLevel(level, priorityFocus) {
        const levelConfig = this.analysisLevels[level];
        if (!levelConfig) {
            throw new Error(`不支持的分析级别: ${level}`);
        }

        const startTime = Date.now();
        let levelResults = {};

        switch (level) {
            case 1:
                levelResults = await this.executeLevelOne();
                break;
            case 2:
                levelResults = await this.executeLevelTwo(priorityFocus);
                break;
            case 3:
                levelResults = await this.executeLevelThree(priorityFocus);
                break;
            case 4:
                levelResults = await this.executeLevelFour();
                break;
            default:
                throw new Error(`未实现的分析级别: ${level}`);
        }

        levelResults.processingTime = Date.now() - startTime;
        levelResults.timestamp = new Date().toISOString();
        levelResults.level = level;
        levelResults.description = levelConfig.description;

        this.analysisResults.levels[level] = levelResults;
        
        // 更新渐进式洞察
        await this.updateProgressiveInsights(level, levelResults);
    }

    /**
     * Level 1: 快速概览
     * 项目基础信息、文件结构、技术栈识别
     */
    async executeLevelOne() {
        console.log('[Level 1] 执行快速概览分析...');

        const overview = {
            projectStructure: await this.analyzeProjectStructure(),
            technologyStack: await this.identifyTechnologyStack(),
            codebaseStatistics: await this.calculateCodebaseStatistics(),
            mainEntryPoints: await this.identifyMainEntryPoints(),
            configurationFiles: await this.identifyConfigurationFiles(),
            buildAndDeployment: await this.analyzeBuildSystem(),
            quickHealthCheck: await this.performQuickHealthCheck()
        };

        console.log(`[Level 1] 完成概览，发现 ${overview.mainEntryPoints.length} 个入口点`);
        return overview;
    }

    /**
     * Level 2: 架构分析
     * 系统设计模式、组件关系、架构决策
     */
    async executeLevelTwo(priorityFocus) {
        console.log('[Level 2] 执行架构分析...');

        // 使用架构关键提取器
        const architectureAnalysis = await this.architectureExtractor.extractArchitectureKeys();
        
        const levelTwoResults = {
            architecturePatterns: architectureAnalysis.designPatterns,
            systemComplexity: architectureAnalysis.systemComplexity,
            componentRelationships: await this.analyzeComponentRelationships(),
            dataFlow: await this.analyzeDataFlow(),
            designDecisions: await this.extractDesignDecisions(architectureAnalysis),
            scalabilityAssessment: await this.assessScalability(architectureAnalysis),
            architectureQuality: await this.assessArchitectureQuality(architectureAnalysis),
            refactoringOpportunities: await this.identifyRefactoringOpportunities(architectureAnalysis)
        };

        // 根据优先关注点调整
        if (priorityFocus === 'architecture') {
            levelTwoResults.detailedArchitectureAnalysis = await this.performDetailedArchitectureAnalysis();
        }

        console.log(`[Level 2] 完成架构分析，识别 ${Object.keys(levelTwoResults.architecturePatterns).length} 个设计模式`);
        return levelTwoResults;
    }

    /**
     * Level 3: 模块深入分析
     * 完整代码分析、质量评估、业务逻辑理解
     */
    async executeLevelThree(priorityFocus) {
        console.log('[Level 3] 执行模块深入分析...');

        // 使用模块完整分析器
        const moduleAnalysis = await this.moduleAnalyzer.performCompleteModuleAnalysis();
        
        const levelThreeResults = {
            moduleDetails: moduleAnalysis.moduleAnalyses,
            aggregatedInsights: moduleAnalysis.aggregatedInsights,
            codeQualityMetrics: await this.calculateDetailedQualityMetrics(moduleAnalysis),
            businessLogicAnalysis: await this.analyzeBusinessLogic(moduleAnalysis),
            technicalDebtAssessment: await this.assessTechnicalDebt(moduleAnalysis),
            performanceAnalysis: await this.analyzePerformancePatterns(moduleAnalysis),
            securityAnalysis: await this.analyzeSecurityPatterns(moduleAnalysis),
            maintainabilityScore: await this.calculateMaintainabilityScore(moduleAnalysis)
        };

        // 根据优先关注点调整
        if (priorityFocus === 'quality') {
            levelThreeResults.comprehensiveQualityReport = await this.generateQualityReport(moduleAnalysis);
        } else if (priorityFocus === 'security') {
            levelThreeResults.securityAuditReport = await this.generateSecurityAuditReport(moduleAnalysis);
        }

        console.log(`[Level 3] 完成模块分析，分析 ${moduleAnalysis.successfulAnalyses} 个模块`);
        return levelThreeResults;
    }

    /**
     * Level 4: 集成分析
     * 系统性洞察、优化建议、发展路径
     */
    async executeLevelFour() {
        console.log('[Level 4] 执行集成分析...');

        const integrationResults = {
            systemicInsights: await this.generateSystemicInsights(),
            crossModuleAnalysis: await this.analyzeCrossModuleRelationships(),
            evolutionAnalysis: await this.analyzeCodeEvolution(),
            optimizationRecommendations: await this.generateOptimizationRecommendations(),
            riskAssessment: await this.performRiskAssessment(),
            developmentRoadmap: await this.generateDevelopmentRoadmap(),
            complianceAnalysis: await this.analyzeCompliance(),
            ecosystemAnalysis: await this.analyzeEcosystem()
        };

        console.log('[Level 4] 完成集成分析，生成系统性洞察');
        return integrationResults;
    }

    /**
     * 更新渐进式洞察
     * 每个级别完成后，更新累积的洞察
     */
    async updateProgressiveInsights(level, levelResults) {
        if (!this.analysisResults.progressiveInsights[level]) {
            this.analysisResults.progressiveInsights[level] = {};
        }

        // 根据级别更新不同类型的洞察
        switch (level) {
            case 1:
                this.analysisResults.progressiveInsights[level] = {
                    projectType: this.determineProjectType(levelResults),
                    complexityEstimate: this.estimateComplexityFromOverview(levelResults),
                    primaryConcerns: this.identifyPrimaryConcerns(levelResults),
                    recommendedAnalysisPath: this.recommendAnalysisPath(levelResults)
                };
                break;

            case 2:
                this.analysisResults.progressiveInsights[level] = {
                    architectureHealth: this.assessArchitectureHealth(levelResults),
                    designQuality: this.assessDesignQuality(levelResults),
                    scalabilityLimitations: this.identifyScalabilityLimitations(levelResults),
                    refactoringPriorities: this.prioritizeRefactoring(levelResults)
                };
                break;

            case 3:
                this.analysisResults.progressiveInsights[level] = {
                    codeHealthSummary: this.summarizeCodeHealth(levelResults),
                    technicalDebtHotspots: this.identifyTechnicalDebtHotspots(levelResults),
                    qualityTrends: this.analyzeQualityTrends(levelResults),
                    maintenanceRecommendations: this.generateMaintenanceRecommendations(levelResults)
                };
                break;

            case 4:
                this.analysisResults.progressiveInsights[level] = {
                    strategicRecommendations: this.generateStrategicRecommendations(levelResults),
                    riskMitigation: this.prioritizeRiskMitigation(levelResults),
                    evolutionStrategy: this.recommendEvolutionStrategy(levelResults),
                    investmentPriorities: this.recommendInvestmentPriorities(levelResults)
                };
                break;
        }

        // 生成跨级别洞察
        if (level >= 2) {
            await this.generateCrossLevelInsights();
        }
    }

    /**
     * 生成渐进式分析报告
     */
    async generateProgressiveReport() {
        console.log('[报告生成] 生成渐进式分析报告...');

        const report = {
            ...this.analysisResults,
            completionTime: new Date().toISOString(),
            totalProcessingTime: Date.now() - new Date(this.analysisResults.startTime).getTime(),
            completedLevels: this.currentAnalysisLevel,
            executiveSummary: await this.generateExecutiveSummary(),
            keyFindings: await this.generateKeyFindings(),
            actionableInsights: await this.generateActionableInsights(),
            prioritizedRecommendations: await this.prioritizeAllRecommendations(),
            qualityGates: await this.assessQualityGates(),
            nextSteps: await this.recommendNextSteps()
        };

        // 生成级别对比洞察
        report.levelProgression = await this.analyzeLevelProgression();
        report.confidenceScores = await this.calculateConfidenceScores();

        return report;
    }

    // ====== 辅助分析方法 ======

    async calculateProjectMetrics() {
        const files = await this.scanAllProjectFiles();
        const codeFiles = files.filter(f => this.isCodeFile(f));
        
        let totalLines = 0;
        const languages = new Map();
        
        for (const file of codeFiles.slice(0, 50)) { // 采样计算
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n').length;
                totalLines += lines;
                
                const lang = this.detectLanguage(file);
                languages.set(lang, (languages.get(lang) || 0) + 1);
            } catch (error) {
                // 忽略读取错误
            }
        }

        const primaryLanguage = [...languages.entries()]
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

        return {
            totalFiles: files.length,
            codeFiles: codeFiles.length,
            totalLines: totalLines,
            primaryLanguage: primaryLanguage,
            languages: Object.fromEntries(languages),
            estimatedComplexity: this.estimateProjectComplexity(codeFiles.length, totalLines),
            projectSize: this.categorizeProjectSize(codeFiles.length, totalLines)
        };
    }

    async scanAllProjectFiles() {
        const files = [];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'mg_kiro'];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir);
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory() && !excludeDirs.includes(entry) && !entry.startsWith('.')) {
                        await scanDir(fullPath);
                    } else if (stats.isFile()) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // 忽略访问错误
            }
        }

        await scanDir(this.projectPath);
        return files;
    }

    isCodeFile(filePath) {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cs'];
        return codeExtensions.includes(path.extname(filePath).toLowerCase());
    }

    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const langMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cs': 'csharp'
        };
        return langMap[ext] || 'unknown';
    }

    estimateProjectComplexity(fileCount, lineCount) {
        // 简化的复杂度估算
        const fileComplexity = fileCount > 100 ? 0.8 : fileCount > 50 ? 0.6 : 0.3;
        const lineComplexity = lineCount > 50000 ? 0.9 : lineCount > 20000 ? 0.7 : 0.4;
        return (fileComplexity + lineComplexity) / 2;
    }

    categorizeProjectSize(fileCount, lineCount) {
        if (fileCount > 100 || lineCount > 50000) return 'large';
        if (fileCount > 30 || lineCount > 10000) return 'medium';
        return 'small';
    }

    generateSessionId() {
        return `pa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    initializeAnalysisLevels() {
        return {
            1: {
                name: 'Quick Overview',
                description: '快速概览 - 项目结构和基础信息',
                estimatedTime: '30s',
                outputs: ['project-structure', 'tech-stack', 'statistics']
            },
            2: {
                name: 'Architecture Analysis', 
                description: '架构分析 - 设计模式和组件关系',
                estimatedTime: '2min',
                outputs: ['architecture-patterns', 'component-relationships', 'design-decisions']
            },
            3: {
                name: 'Module Deep Dive',
                description: '模块深入 - 完整代码分析',
                estimatedTime: '5min',
                outputs: ['code-analysis', 'quality-metrics', 'business-logic']
            },
            4: {
                name: 'Integration Analysis',
                description: '集成分析 - 系统性洞察和建议',
                estimatedTime: '3min', 
                outputs: ['systemic-insights', 'recommendations', 'roadmap']
            }
        };
    }

    logLevelProgress(level) {
        const levelConfig = this.analysisLevels[level];
        const levelResults = this.analysisResults.levels[level];
        
        console.log(`[Level ${level}] ${levelConfig.name} 完成`);
        console.log(`[Level ${level}] 处理时间: ${levelResults.processingTime}ms`);
        console.log(`[Level ${level}] 输出数据: ${Object.keys(levelResults).length} 项分析结果`);
    }

    // 占位符方法 - 实际项目中需要根据需求实现
    async analyzeProjectStructure() { return { directories: [], keyFiles: [] }; }
    async identifyTechnologyStack() { return { primary: [], secondary: [] }; }
    async calculateCodebaseStatistics() { return { files: 0, lines: 0, functions: 0 }; }
    async identifyMainEntryPoints() { return []; }
    async identifyConfigurationFiles() { return []; }
    async analyzeBuildSystem() { return { tools: [], scripts: [] }; }
    async performQuickHealthCheck() { return { status: 'healthy', issues: [] }; }
    async analyzeComponentRelationships() { return { relationships: [] }; }
    async analyzeDataFlow() { return { flows: [] }; }
    async extractDesignDecisions(analysis) { return []; }
    async assessScalability(analysis) { return { score: 7, limitations: [] }; }
    async assessArchitectureQuality(analysis) { return { score: 8, strengths: [], weaknesses: [] }; }
    async identifyRefactoringOpportunities(analysis) { return []; }
    async performDetailedArchitectureAnalysis() { return {}; }
    async calculateDetailedQualityMetrics(analysis) { return {}; }
    async analyzeBusinessLogic(analysis) { return {}; }
    async assessTechnicalDebt(analysis) { return {}; }
    async analyzePerformancePatterns(analysis) { return {}; }
    async analyzeSecurityPatterns(analysis) { return {}; }
    async calculateMaintainabilityScore(analysis) { return 7; }
    async generateQualityReport(analysis) { return {}; }
    async generateSecurityAuditReport(analysis) { return {}; }
    async generateSystemicInsights() { return {}; }
    async analyzeCrossModuleRelationships() { return {}; }
    async analyzeCodeEvolution() { return {}; }
    async generateOptimizationRecommendations() { return []; }
    async performRiskAssessment() { return {}; }
    async generateDevelopmentRoadmap() { return {}; }
    async analyzeCompliance() { return {}; }
    async analyzeEcosystem() { return {}; }

    // 渐进式洞察方法
    determineProjectType(results) { return 'web-application'; }
    estimateComplexityFromOverview(results) { return 'medium'; }
    identifyPrimaryConcerns(results) { return []; }
    recommendAnalysisPath(results) { return 'standard'; }
    assessArchitectureHealth(results) { return 'good'; }
    assessDesignQuality(results) { return 'good'; }
    identifyScalabilityLimitations(results) { return []; }
    prioritizeRefactoring(results) { return []; }
    summarizeCodeHealth(results) { return {}; }
    identifyTechnicalDebtHotspots(results) { return []; }
    analyzeQualityTrends(results) { return {}; }
    generateMaintenanceRecommendations(results) { return []; }
    generateStrategicRecommendations(results) { return []; }
    prioritizeRiskMitigation(results) { return []; }
    recommendEvolutionStrategy(results) { return {}; }
    recommendInvestmentPriorities(results) { return []; }

    async generateCrossLevelInsights() { return {}; }
    async generateExecutiveSummary() { return ''; }
    async generateKeyFindings() { return []; }
    async generateActionableInsights() { return []; }
    async prioritizeAllRecommendations() { return []; }
    async assessQualityGates() { return {}; }
    async recommendNextSteps() { return []; }
    async analyzeLevelProgression() { return {}; }
    async calculateConfidenceScores() { return {}; }
}

export default ProgressiveAnalysisEngine;