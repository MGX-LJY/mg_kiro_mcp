/**
 * 语言服务
 * 管理项目语言检测和语言特定提示词生成
 */

import LanguageDetector from '../language/detector.js';
import { EnhancedLanguageDetector } from '../analyzers/enhanced-language-detector.js';
import LanguagePromptGenerator from '../language/language-prompt-generator.js';

class LanguageService {
    constructor() {
        this.detector = new LanguageDetector();
        this.enhancedDetector = new EnhancedLanguageDetector({
            enableDeepAnalysis: true,
            maxFilesToAnalyze: 15,
            confidenceThreshold: 60
        });
        this.promptGenerator = new LanguagePromptGenerator();
    }

    /**
     * 基础语言检测
     * @param {string} projectPath - 项目路径
     * @returns {Promise<Object>} 检测结果
     */
    async detectLanguage(projectPath) {
        try {
            return await this.detector.detectLanguage(projectPath);
        } catch (error) {
            console.error('[LanguageService] 基础语言检测失败:', error);
            throw error;
        }
    }

    /**
     * 增强语言检测 (用于工作流第2步)
     * @param {string} projectPath - 项目路径
     * @param {Object} step1Results - 第1步项目扫描结果
     * @param {Object} context - 上下文信息
     * @returns {Promise<Object>} 增强检测结果
     */
    async detectLanguageEnhanced(projectPath, step1Results, context = {}) {
        try {
            return await this.enhancedDetector.detectLanguageEnhanced(
                projectPath,
                step1Results,
                context
            );
        } catch (error) {
            console.error('[LanguageService] 增强语言检测失败:', error);
            throw error;
        }
    }

    /**
     * 生成语言特定提示词 (用于工作流第6步)
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} 提示词生成结果
     */
    async generatePrompts(projectPath, options = {}) {
        try {
            return await this.promptGenerator.generatePrompts(projectPath, options);
        } catch (error) {
            console.error('[LanguageService] 提示词生成失败:', error);
            throw error;
        }
    }

    /**
     * 获取静态语言特定提示词
     * @param {string} language - 语言类型
     * @returns {Object} 语言特定提示词
     */
    getLanguageSpecificPrompts(language) {
        try {
            return this.promptGenerator.getLanguageSpecificPrompts(language);
        } catch (error) {
            console.error('[LanguageService] 获取语言提示词失败:', error);
            throw error;
        }
    }

    /**
     * 获取支持的语言列表
     * @returns {Array} 支持的语言
     */
    getSupportedLanguages() {
        return ['javascript', 'python', 'java', 'go', 'rust', 'csharp'];
    }

    /**
     * 验证语言是否支持
     * @param {string} language - 语言类型
     * @returns {boolean} 是否支持
     */
    isLanguageSupported(language) {
        return this.getSupportedLanguages().includes(language.toLowerCase());
    }

    /**
     * 获取语言显示名称
     * @param {string} language - 语言类型
     * @returns {string} 显示名称
     */
    getLanguageDisplayName(language) {
        const names = {
            javascript: 'JavaScript/Node.js',
            python: 'Python',
            java: 'Java',
            go: 'Go',
            rust: 'Rust',
            csharp: 'C#/.NET'
        };
        return names[language] || language;
    }

    /**
     * 从工作流结果中提取语言信息
     * @param {Object} workflowResults - 工作流结果
     * @param {number} step - 步骤号
     * @returns {Object|null} 语言信息
     */
    extractLanguageFromWorkflow(workflowResults, step = 2) {
        const stepKey = `step_${step}`;
        const stepResult = workflowResults[stepKey];
        
        if (!stepResult || !stepResult.detection) {
            return null;
        }

        return {
            language: stepResult.detection.primaryLanguage,
            confidence: stepResult.workflowIntegration?.confidenceScore || 0,
            frameworks: stepResult.detection.techStack?.frameworks || [],
            timestamp: stepResult.timestamp
        };
    }

    /**
     * 生成语言检测摘要报告
     * @param {Object} detectionResult - 检测结果
     * @returns {Object} 摘要报告
     */
    generateLanguageReport(detectionResult) {
        if (!detectionResult || !detectionResult.detection) {
            return null;
        }

        return {
            detection: {
                primaryLanguage: detectionResult.detection.primaryLanguage,
                secondaryLanguages: detectionResult.detection.secondaryLanguages,
                confidence: detectionResult.workflowIntegration?.confidenceScore || 0
            },
            
            techStack: {
                frameworks: detectionResult.detection.techStack?.frameworks || [],
                buildTools: detectionResult.detection.techStack?.buildTools || [],
                packageManagers: detectionResult.detection.techStack?.packageManagers || [],
                testing: detectionResult.detection.techStack?.testing || []
            },
            
            projectProfile: {
                type: detectionResult.detection.projectCharacteristics?.type || 'unknown',
                scale: detectionResult.detection.projectCharacteristics?.scale || 'unknown',
                maturity: detectionResult.detection.projectCharacteristics?.maturity || 'unknown',
                complexity: detectionResult.detection.projectCharacteristics?.complexity || 'unknown'
            },
            
            environment: {
                recommended: detectionResult.detection.developmentEnvironment?.recommended || [],
                currentSetup: detectionResult.detection.developmentEnvironment?.currentSetup || [],
                missingComponents: detectionResult.detection.developmentEnvironment?.missingComponents || []
            },
            
            analysisQuality: {
                dataQuality: detectionResult.workflowIntegration?.dataQuality || 'unknown',
                enhancementGain: detectionResult.workflowIntegration?.enhancementGain || 0,
                step1Integration: detectionResult.workflowIntegration?.step1Integration || 'unknown'
            },
            
            recommendations: detectionResult.detection.nextStepRecommendations || [],
            
            metadata: {
                analysisId: detectionResult.analysisId,
                analysisDuration: detectionResult.analysisDuration,
                timestamp: detectionResult.timestamp,
                step3Readiness: detectionResult.workflowIntegration?.readinessForStep3 || false
            }
        };
    }
}

export default LanguageService;