/**
 * 单文件单批次策略 - 中等文件独立处理
 * 
 * 核心功能：
 * - 为每个中等大小文件（15K-20K tokens）创建独立批次
 * - 保持文件的完整性和独立分析质量
 * - 优化Token使用，避免浪费
 * - 简化处理流程，提升分析精度
 * 
 * 设计理念：
 * - 独立分析：每个文件获得完整的AI分析关注
 * - 质量保证：确保分析深度和准确性
 * - 简洁高效：最简单的批次策略，减少复杂性
 * - 灵活处理：可以独立重试和优化每个文件
 * 
 * @version 2.0.0 - 使用统一BatchResult接口
 */

import { BatchResultFactory } from '../../interfaces/BatchResult.js';

export class SingleFileBatchStrategy {
    constructor(config = {}) {
        this.config = {
            minTokenSize: 15000,        // 最小Token大小
            maxTokenSize: 20000,        // 最大Token大小
            enableContentAnalysis: true, // 启用内容分析
            preserveStructure: true,    // 保持代码结构
            addContextInfo: true,       // 添加上下文信息
            ...config
        };

        // 分析深度配置
        this.analysisDepths = {
            'tiny': 'basic',           // <16K tokens
            'medium': 'comprehensive', // 16K-18K tokens
            'large': 'detailed'        // >18K tokens
        };
    }

    /**
     * 生成批次计划
     * @param {Array} mediumFiles - 中等文件列表（Token分析结果）
     * @param {Object} config - 配置参数
     * @returns {Promise<Array>} 批次计划列表
     */
    async generateBatches(mediumFiles, config = {}) {
        try {
            console.log(`[SingleFileBatchStrategy] 开始生成批次计划，文件数: ${mediumFiles.length}`);

            if (!mediumFiles || mediumFiles.length === 0) {
                return [];
            }

            // 合并配置
            const finalConfig = { ...this.config, ...config };

            // 验证文件大小
            const validFiles = this._validateFiles(mediumFiles, finalConfig);

            // 为每个文件创建独立批次
            const batches = this._createIndividualBatches(validFiles, finalConfig);

            // 优化批次配置
            const optimizedBatches = this._optimizeBatches(batches, finalConfig);

            console.log(`[SingleFileBatchStrategy] 生成 ${optimizedBatches.length} 个独立批次`);

            return optimizedBatches;

        } catch (error) {
            console.error('[SingleFileBatchStrategy] 批次生成失败:', error);
            throw error;
        }
    }

    /**
     * 验证文件是否适合单文件处理
     * @private
     */
    _validateFiles(files, config) {
        const validFiles = [];
        const rejectedFiles = [];

        for (const file of files) {
            const isValidSize = file.tokenCount >= config.minTokenSize && 
                               file.tokenCount <= config.maxTokenSize;
            
            if (isValidSize) {
                validFiles.push(file);
            } else {
                rejectedFiles.push({
                    file,
                    reason: file.tokenCount < config.minTokenSize ? 'too_small' : 'too_large'
                });
            }
        }

        if (rejectedFiles.length > 0) {
            console.warn(`[SingleFileBatchStrategy] ${rejectedFiles.length} 个文件不适合单文件处理:`, 
                        rejectedFiles.map(r => `${r.file.path} (${r.reason})`));
        }

        return validFiles;
    }

    /**
     * 为每个文件创建独立批次
     * @private
     */
    _createIndividualBatches(files, config) {
        return files.map((file, index) => this._createSingleFileBatch(file, index + 1, config));
    }

    /**
     * 创建单文件批次
     * @private
     */
    _createSingleFileBatch(file, batchIndex, config) {
        const sizeCategory = this._determineSizeCategory(file.tokenCount);
        const analysisDepth = this.analysisDepths[sizeCategory] || 'comprehensive';
        
        // 创建统一的BatchFile格式
        const batchFile = {
            path: file.path,
            tokenCount: BatchResultFactory._extractTokenCount(file.tokenCount), // 统一提取Token数量
            size: file.size || 0,
            language: file.language || 'javascript',
            originalIndex: file.originalIndex || batchIndex - 1,
            priority: this._calculateFileImportance(file) // 使用重要性作为优先级
        };

        const batchId = `single_batch_${batchIndex}`;
        const estimatedTokens = batchFile.tokenCount;
        const efficiency = this._calculateBatchEfficiency(estimatedTokens);

        // 使用BatchResultFactory创建统一格式的批次结果
        const batchResult = BatchResultFactory.createSingleBatch(
            batchId,
            batchFile,
            estimatedTokens,
            {
                description: this._generateBatchDescription(file),
                efficiency: efficiency
            }
        );

        // 添加额外的处理提示和元数据（保留原有功能）
        batchResult.metadata.sizeCategory = sizeCategory;
        batchResult.metadata.analysisDepth = analysisDepth;
        batchResult.metadata.qualityScore = this._calculateQualityScore(file);
        batchResult.metadata.processingHints = {
            ...batchResult.metadata.processingHints,
            ...this._generateProcessingHints(file, analysisDepth),
            codeStructure: file.codeStructure,
            importance: this._calculateFileImportance(file),
            complexity: this._calculateFileComplexity(file),
            contextInfo: config.addContextInfo ? this._generateContextInfo(file) : null
        };

        console.log(`[SingleFileBatchStrategy] 创建统一格式单文件批次: ${batchId} (${estimatedTokens}tokens, ${sizeCategory})`);
        return batchResult;
    }

    /**
     * 确定文件大小类别
     * @private
     */
    _determineSizeCategory(tokenCount) {
        if (tokenCount < 16000) return 'tiny';
        if (tokenCount < 18000) return 'medium';
        return 'large';
    }

    /**
     * 计算文件重要性
     * @private
     */
    _calculateFileImportance(file) {
        let importance = 50; // 基础重要性

        const path = file.path.toLowerCase();
        const fileName = path.split('/').pop();

        // 基于文件名的重要性
        if (fileName.includes('index.')) importance += 20;
        if (fileName.includes('main.')) importance += 18;
        if (fileName.includes('app.')) importance += 15;
        if (fileName.includes('server.')) importance += 15;
        if (fileName.includes('config')) importance += 12;
        if (fileName.includes('router') || fileName.includes('route')) importance += 10;
        if (fileName.includes('controller')) importance += 10;
        if (fileName.includes('service')) importance += 8;
        if (fileName.includes('util') || fileName.includes('helper')) importance += 5;
        if (fileName.includes('test') || fileName.includes('spec')) importance -= 10;

        // 基于路径的重要性
        if (path.includes('/src/') || path.includes('/lib/')) importance += 8;
        if (path.includes('/server/') || path.includes('/backend/')) importance += 6;
        if (path.includes('/api/')) importance += 6;
        if (path.includes('/components/')) importance += 5;
        if (path.includes('/test/') || path.includes('/tests/')) importance -= 5;

        // 基于代码结构的重要性
        if (file.codeStructure && file.codeStructure.structure) {
            const structure = file.codeStructure.structure;
            importance += structure.exports?.length * 3 || 0;
            importance += structure.classes?.length * 4 || 0;
            importance += structure.functions?.length * 2 || 0;
            importance += structure.interfaces?.length * 3 || 0;
        }

        return Math.min(Math.max(importance, 0), 100);
    }

    /**
     * 计算文件复杂度
     * @private
     */
    _calculateFileComplexity(file) {
        let complexity = 10; // 基础复杂度

        // 基于Token数量的复杂度
        complexity += Math.min(file.tokenCount / 1000, 20);

        // 基于代码结构的复杂度
        if (file.codeStructure && file.codeStructure.structure) {
            const structure = file.codeStructure.structure;
            
            complexity += (structure.functions?.length || 0) * 2;
            complexity += (structure.classes?.length || 0) * 4;
            complexity += (structure.interfaces?.length || 0) * 3;
            
            if (structure.complexity) {
                complexity += (structure.complexity.score || 0) * 0.1;
                complexity += (structure.complexity.maxNesting || 0) * 3;
            }
        }

        return Math.min(complexity, 100);
    }

    /**
     * 计算批次效率
     * @private
     */
    _calculateBatchEfficiency(tokenCount) {
        const idealSize = 18000; // 理想批次大小
        const efficiency = Math.min((tokenCount / idealSize) * 100, 100);
        return Math.round(efficiency);
    }

    /**
     * 生成批次描述
     * @private
     */
    _generateBatchDescription(file) {
        const fileName = file.path.split('/').pop();
        const tokenInfo = `${file.tokenCount.toLocaleString()} tokens`;
        
        let description = `单文件批次 - ${fileName} (${tokenInfo})`;
        
        if (file.codeStructure && file.codeStructure.structure) {
            const structure = file.codeStructure.structure;
            const elements = [];
            
            if (structure.classes?.length) elements.push(`${structure.classes.length} 类`);
            if (structure.functions?.length) elements.push(`${structure.functions.length} 函数`);
            if (structure.interfaces?.length) elements.push(`${structure.interfaces.length} 接口`);
            
            if (elements.length > 0) {
                description += ` - 包含 ${elements.join(', ')}`;
            }
        }

        return description;
    }

    /**
     * 生成批次元数据
     * @private
     */
    _generateBatchMetadata(file) {
        const path = file.path;
        const pathParts = path.split('/');
        
        const metadata = {
            fileName: pathParts.pop(),
            directory: pathParts.length > 0 ? pathParts[pathParts.length - 1] : '',
            fullDirectory: pathParts.join('/'),
            extension: this._getFileExtension(path),
            language: this._detectLanguage(path),
            lineCount: file.codeStructure?.structure?.totalLines || 0,
            isEntryPoint: this._isEntryPoint(path),
            hasExports: this._hasExports(file),
            hasImports: this._hasImports(file)
        };

        return metadata;
    }

    /**
     * 生成处理提示
     * @private
     */
    _generateProcessingHints(file, analysisDepth) {
        const hints = {
            analysisDepth,
            focusAreas: this._identifyFocusAreas(file),
            specialHandling: this._identifySpecialHandling(file),
            contextAware: true,
            preserveStructure: this.config.preserveStructure,
            documentationStyle: this._recommendDocumentationStyle(file)
        };

        return hints;
    }

    /**
     * 识别分析重点
     * @private
     */
    _identifyFocusAreas(file) {
        const focusAreas = [];
        const path = file.path.toLowerCase();

        if (path.includes('api') || path.includes('router') || path.includes('controller')) {
            focusAreas.push('api_design', 'endpoint_documentation');
        }
        if (path.includes('service') || path.includes('business')) {
            focusAreas.push('business_logic', 'service_patterns');
        }
        if (path.includes('model') || path.includes('entity')) {
            focusAreas.push('data_structures', 'relationships');
        }
        if (path.includes('util') || path.includes('helper')) {
            focusAreas.push('utility_functions', 'reusability');
        }
        if (path.includes('config')) {
            focusAreas.push('configuration', 'environment_settings');
        }
        if (path.includes('test')) {
            focusAreas.push('test_coverage', 'test_patterns');
        }

        return focusAreas.length > 0 ? focusAreas : ['general_analysis'];
    }

    /**
     * 识别特殊处理需求
     * @private
     */
    _identifySpecialHandling(file) {
        const specialHandling = [];

        if (file.codeStructure && file.codeStructure.structure) {
            const structure = file.codeStructure.structure;
            
            if (structure.complexity?.score > 15) {
                specialHandling.push('high_complexity');
            }
            if ((structure.functions?.length || 0) > 20) {
                specialHandling.push('many_functions');
            }
            if ((structure.classes?.length || 0) > 5) {
                specialHandling.push('many_classes');
            }
            if (structure.dependencies?.external?.length > 10) {
                specialHandling.push('many_dependencies');
            }
        }

        if (file.tokenCount > 19000) {
            specialHandling.push('large_file');
        }

        return specialHandling;
    }

    /**
     * 推荐文档风格
     * @private
     */
    _recommendDocumentationStyle(file) {
        const path = file.path.toLowerCase();
        
        if (path.includes('api') || path.includes('swagger')) return 'api_focused';
        if (path.includes('test')) return 'test_focused';
        if (path.includes('config')) return 'configuration_focused';
        if (path.includes('util') || path.includes('helper')) return 'utility_focused';
        
        return 'comprehensive';
    }

    /**
     * 生成上下文信息
     * @private
     */
    _generateContextInfo(file) {
        const contextInfo = {
            projectContext: this._inferProjectContext(file.path),
            moduleContext: this._inferModuleContext(file.path),
            dependencies: this._extractDependencies(file),
            relatedFiles: this._suggestRelatedFiles(file),
            architecturalRole: this._identifyArchitecturalRole(file.path)
        };

        return contextInfo;
    }

    /**
     * 计算质量评分
     * @private
     */
    _calculateQualityScore(file) {
        let score = 70; // 基础分数

        // Token数量适中加分
        if (file.tokenCount >= 16000 && file.tokenCount <= 18000) {
            score += 10;
        }

        // 代码结构质量
        if (file.codeStructure && file.codeStructure.structure) {
            const structure = file.codeStructure.structure;
            
            if (structure.functions && structure.functions.length > 0) score += 5;
            if (structure.classes && structure.classes.length > 0) score += 5;
            if (structure.exports && structure.exports.length > 0) score += 5;
            if (structure.imports && structure.imports.length > 0) score += 3;
        }

        return Math.min(score, 100);
    }

    /**
     * 优化批次配置
     * @private
     */
    _optimizeBatches(batches, config) {
        // 按重要性排序
        const sortedBatches = batches.sort((a, b) => b.file.importance - a.file.importance);

        // 重新分配批次ID
        sortedBatches.forEach((batch, index) => {
            batch.batchId = `single_batch_${index + 1}`;
            batch.batchIndex = index + 1;
            batch.totalBatches = batches.length;
            batch.processingOrder = index + 1;
        });

        return sortedBatches;
    }

    /**
     * 辅助方法
     */

    _getFileExtension(path) {
        const fileName = path.split('/').pop();
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    _detectLanguage(path) {
        const ext = this._getFileExtension(path).toLowerCase();
        const extMap = {
            js: 'javascript', jsx: 'javascript', mjs: 'javascript',
            ts: 'typescript', tsx: 'typescript',
            py: 'python', java: 'java', go: 'go', rs: 'rust', cs: 'c#'
        };
        return extMap[ext] || 'unknown';
    }

    _isEntryPoint(path) {
        const fileName = path.split('/').pop().toLowerCase();
        return fileName === 'index.js' || fileName === 'main.js' || 
               fileName === 'app.js' || fileName === 'server.js' ||
               fileName === 'index.ts' || fileName === 'main.ts';
    }

    _hasExports(file) {
        return file.codeStructure?.structure?.exports?.length > 0;
    }

    _hasImports(file) {
        return file.codeStructure?.structure?.imports?.length > 0;
    }

    _inferProjectContext(path) {
        if (path.includes('/api/')) return 'API服务';
        if (path.includes('/frontend/') || path.includes('/client/')) return '前端应用';
        if (path.includes('/backend/') || path.includes('/server/')) return '后端服务';
        if (path.includes('/shared/') || path.includes('/common/')) return '共享模块';
        return '通用项目';
    }

    _inferModuleContext(path) {
        const parts = path.split('/');
        if (parts.length > 2) {
            return parts[parts.length - 2];
        }
        return 'root';
    }

    _extractDependencies(file) {
        if (file.codeStructure?.structure?.dependencies) {
            return file.codeStructure.structure.dependencies;
        }
        return { internal: [], external: [] };
    }

    _suggestRelatedFiles(file) {
        // 基于文件名和路径推测相关文件
        const baseName = file.path.split('/').pop().split('.')[0];
        const directory = file.path.split('/').slice(0, -1).join('/');
        
        const suggestions = [
            `${directory}/${baseName}.test.js`,
            `${directory}/${baseName}.spec.js`,
            `${directory}/index.js`,
            `${directory}/../${baseName}/index.js`
        ];

        return suggestions;
    }

    _identifyArchitecturalRole(path) {
        const pathLower = path.toLowerCase();
        
        if (pathLower.includes('controller')) return '控制器';
        if (pathLower.includes('service')) return '服务层';
        if (pathLower.includes('model')) return '数据模型';
        if (pathLower.includes('router') || pathLower.includes('route')) return '路由';
        if (pathLower.includes('middleware')) return '中间件';
        if (pathLower.includes('util') || pathLower.includes('helper')) return '工具函数';
        if (pathLower.includes('config')) return '配置';
        if (pathLower.includes('test')) return '测试';
        
        return '业务模块';
    }

    /**
     * 获取策略状态
     */
    getStrategyStatus() {
        return {
            name: 'SingleFileBatchStrategy',
            version: '1.0.0',
            config: this.config,
            targetFiles: '中等文件 (15K-20K tokens)',
            isReady: true
        };
    }
}

export default SingleFileBatchStrategy;