/**
 * Step5 固定文件验证器 - 检查模块关联文档
 * 
 * 验证策略：
 * - 检查 mg_kiro/relations.md 文件是否存在
 * - 这是Step5步骤的核心输出文件
 * - 只验证文件存在性，不验证内容
 * - 提供明确的错误信息和修复建议
 * 
 * 验证逻辑：
 * - 如果 relations.md 文件不存在 -> 验证失败，提示需要运行Step5
 * - 如果 relations.md 文件存在 -> 验证通过
 * - 可选：检查文件大小和基本可读性
 * 
 * 设计理念：
 * - 精确验证：专门针对Step5的固定输出文件
 * - 简单明确：只检查特定文件的存在性
 * - 友好提示：清晰的错误信息和修复建议
 * - 快速验证：不读取文件内容，提升性能
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class Step5FixedFileValidator {
    constructor(config = {}) {
        this.config = {
            mgKiroFolderName: 'mg_kiro',        // 主文档文件夹名
            requiredFileName: 'relations.md',   // 必需的文件名
            minFileSize: 50,                    // 最小文件大小（字节）
            maxFileSize: 10 * 1024 * 1024,     // 最大文件大小（10MB）
            checkReadability: true,             // 检查文件可读性
            timeoutMs: 3000,                    // 验证超时时间（较短，因为只检查单个文件）
            ...config
        };
        
        // 错误代码映射
        this.errorCodes = {
            BASE_FOLDER_NOT_FOUND: 'STEP5_BASE_FOLDER_NOT_FOUND',
            FILE_NOT_FOUND: 'STEP5_RELATIONS_FILE_NOT_FOUND',
            FILE_EMPTY: 'STEP5_RELATIONS_FILE_EMPTY',
            FILE_TOO_LARGE: 'STEP5_RELATIONS_FILE_TOO_LARGE',
            FILE_NOT_READABLE: 'STEP5_RELATIONS_FILE_NOT_READABLE',
            ACCESS_DENIED: 'STEP5_ACCESS_DENIED',
            TIMEOUT: 'STEP5_VALIDATION_TIMEOUT'
        };

        // 可选的替代文件名
        this.alternativeFileNames = [
            'relations.md',
            'module-relations.md',
            'connections.md',
            'dependencies.md'
        ];
    }

    /**
     * 验证Step5固定文件
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 验证选项
     * @returns {Promise<Object>} 验证结果
     */
    async validate(taskId, projectPath, options = {}) {
        console.log(`[Step5FixedFileValidator] 开始验证: ${taskId} 项目: ${projectPath}`);

        const startTime = Date.now();
        const finalOptions = { ...this.config, ...options };

        try {
            // 构建期望的文件路径
            const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
            const relationsFilePath = join(docsBasePath, this.config.requiredFileName);

            // 执行分层验证
            const validationSteps = [
                () => this._checkBaseFolderExists(docsBasePath, projectPath),
                () => this._checkRelationsFileExists(relationsFilePath, docsBasePath),
                () => this._validateFileProperties(relationsFilePath, finalOptions)
            ];

            let validationResult = null;
            
            for (const step of validationSteps) {
                validationResult = await Promise.race([
                    step(),
                    this._createTimeoutPromise(finalOptions.timeoutMs)
                ]);

                if (!validationResult.isValid) {
                    break;
                }
            }

            const processingTime = Date.now() - startTime;

            // 添加通用元数据
            validationResult.metadata = {
                ...validationResult.metadata,
                taskId,
                projectPath,
                validator: 'Step5FixedFileValidator',
                processingTime,
                timestamp: new Date().toISOString()
            };

            console.log(`[Step5FixedFileValidator] 验证完成: ${validationResult.isValid ? '通过' : '失败'}`);
            
            return validationResult;

        } catch (error) {
            console.error(`[Step5FixedFileValidator] 验证异常: ${taskId}`, error);
            
            return this._createErrorResult(
                this.errorCodes.ACCESS_DENIED,
                `验证过程异常: ${error.message}`,
                { taskId, projectPath, error: error.message }
            );
        }
    }

    /**
     * 检查主文档文件夹是否存在
     * @private
     */
    async _checkBaseFolderExists(docsBasePath, projectPath) {
        try {
            const stats = await fs.stat(docsBasePath);
            
            if (!stats.isDirectory()) {
                return this._createErrorResult(
                    this.errorCodes.BASE_FOLDER_NOT_FOUND,
                    `${this.config.mgKiroFolderName} 不是一个文件夹`,
                    {
                        expectedPath: docsBasePath,
                        actualType: 'file',
                        suggestions: [`请确保 ${this.config.mgKiroFolderName} 是一个目录`]
                    }
                );
            }

            return {
                isValid: true,
                step: 'base_folder_check',
                foundPath: docsBasePath
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.BASE_FOLDER_NOT_FOUND,
                    `主文档文件夹不存在: ${this.config.mgKiroFolderName}`,
                    {
                        expectedPath: docsBasePath,
                        projectPath,
                        suggestions: [
                            '请确保已经运行过项目初始化流程',
                            `检查项目根目录是否包含 ${this.config.mgKiroFolderName} 文件夹`,
                            '如果文件夹不存在，请先运行Step1-Step4创建基础结构'
                        ],
                        missingFiles: [docsBasePath]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 检查relations.md文件是否存在
     * @private
     */
    async _checkRelationsFileExists(relationsFilePath, docsBasePath) {
        try {
            const stats = await fs.stat(relationsFilePath);
            
            if (!stats.isFile()) {
                return this._createErrorResult(
                    this.errorCodes.FILE_NOT_FOUND,
                    `${this.config.requiredFileName} 不是一个文件`,
                    {
                        expectedPath: relationsFilePath,
                        actualType: stats.isDirectory() ? 'directory' : 'unknown',
                        suggestions: [`请确保 ${relationsFilePath} 是一个文件，而不是目录`]
                    }
                );
            }

            return {
                isValid: true,
                step: 'relations_file_check',
                foundPath: relationsFilePath,
                fileStats: {
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.ctime.toISOString()
                }
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                // 尝试查找替代文件名
                const alternativeFile = await this._findAlternativeFile(docsBasePath);
                
                if (alternativeFile) {
                    console.log(`[Step5FixedFileValidator] 找到替代文件: ${alternativeFile.name}`);
                    
                    return {
                        isValid: true,
                        step: 'relations_file_check',
                        foundPath: alternativeFile.path,
                        alternativeFile: true,
                        originalFileName: this.config.requiredFileName,
                        foundFileName: alternativeFile.name,
                        fileStats: alternativeFile.stats
                    };
                }

                return this._createErrorResult(
                    this.errorCodes.FILE_NOT_FOUND,
                    `模块关联文档不存在: ${this.config.requiredFileName}`,
                    {
                        expectedPath: relationsFilePath,
                        basePath: docsBasePath,
                        suggestions: [
                            '请运行Step5模块关联分析流程来生成relations.md文件',
                            '使用 init_step5_module_relations 开始模块关联分析',
                            '确认Step5已经完成，应该生成模块之间的关联分析文档',
                            '检查Step3和Step4是否已完成，Step5依赖前面步骤的结果'
                        ],
                        missingFiles: [relationsFilePath],
                        alternativeFiles: this.alternativeFileNames,
                        requiredActions: [
                            {
                                action: 'run_step5',
                                description: '运行Step5模块关联分析流程',
                                tools: ['init_step5_module_relations'],
                                expectedResult: `生成 ${this.config.requiredFileName} 模块关联分析文档`,
                                prerequisites: ['Step3和Step4必须完成']
                            }
                        ]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 查找替代文件
     * @private
     */
    async _findAlternativeFile(basePath) {
        for (const fileName of this.alternativeFileNames) {
            if (fileName === this.config.requiredFileName) continue; // 跳过主文件名
            
            try {
                const filePath = join(basePath, fileName);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile()) {
                    return {
                        name: fileName,
                        path: filePath,
                        stats: {
                            size: stats.size,
                            modified: stats.mtime.toISOString(),
                            created: stats.ctime.toISOString()
                        }
                    };
                }
            } catch (error) {
                // 忽略不存在的替代文件
                continue;
            }
        }
        
        return null;
    }

    /**
     * 验证文件属性
     * @private
     */
    async _validateFileProperties(filePath, options) {
        try {
            const stats = await fs.stat(filePath);

            // 检查文件大小
            if (stats.size < this.config.minFileSize) {
                return this._createErrorResult(
                    this.errorCodes.FILE_EMPTY,
                    `${this.config.requiredFileName} 文件太小，可能是空文件`,
                    {
                        filePath,
                        actualSize: stats.size,
                        minRequiredSize: this.config.minFileSize,
                        suggestions: [
                            '请检查Step5是否正确完成',
                            'relations.md应该包含模块之间的详细关联分析',
                            '重新运行Step5以生成完整的关联文档'
                        ]
                    }
                );
            }

            if (stats.size > this.config.maxFileSize) {
                return this._createErrorResult(
                    this.errorCodes.FILE_TOO_LARGE,
                    `${this.config.requiredFileName} 文件过大`,
                    {
                        filePath,
                        actualSize: stats.size,
                        maxAllowedSize: this.config.maxFileSize,
                        suggestions: [
                            '检查文件是否包含异常内容',
                            '可能需要优化文档生成过程'
                        ]
                    }
                );
            }

            // 检查文件可读性
            if (options.checkReadability) {
                const isReadable = await this._checkFileReadability(filePath);
                
                if (!isReadable) {
                    return this._createErrorResult(
                        this.errorCodes.FILE_NOT_READABLE,
                        `${this.config.requiredFileName} 文件无法读取`,
                        {
                            filePath,
                            suggestions: [
                                '检查文件权限',
                                '确认文件没有被其他程序占用',
                                '重新生成文件'
                            ]
                        }
                    );
                }
            }

            // 验证通过
            return {
                isValid: true,
                step: 'file_properties_check',
                filePath,
                properties: {
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.ctime.toISOString(),
                    isReadable: options.checkReadability
                },
                validationChecks: {
                    sizeCheck: 'passed',
                    readabilityCheck: options.checkReadability ? 'passed' : 'skipped'
                }
            };

        } catch (error) {
            console.error('[Step5FixedFileValidator] 验证文件属性失败:', error);
            
            return this._createErrorResult(
                this.errorCodes.ACCESS_DENIED,
                `验证文件属性失败: ${error.message}`,
                {
                    filePath,
                    error: error.message,
                    suggestions: [
                        '检查文件访问权限',
                        '确认文件路径正确',
                        '重试验证过程'
                    ]
                }
            );
        }
    }

    /**
     * 检查文件可读性
     * @private
     */
    async _checkFileReadability(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            
            // 尝试读取文件前几个字节以确认可读性
            const fd = await fs.open(filePath, 'r');
            const buffer = Buffer.alloc(100);
            await fd.read(buffer, 0, 100, 0);
            await fd.close();
            
            return true;
        } catch (error) {
            console.warn(`[Step5FixedFileValidator] 文件可读性检查失败: ${filePath}`, error.message);
            return false;
        }
    }

    /**
     * 创建超时Promise
     * @private
     */
    _createTimeoutPromise(timeoutMs) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`验证超时 (${timeoutMs}ms)`));
            }, timeoutMs);
        });
    }

    /**
     * 创建错误结果
     * @private
     */
    _createErrorResult(errorCode, message, details = {}) {
        return {
            isValid: false,
            errorCode,
            message,
            ...details,
            metadata: {
                validator: 'Step5FixedFileValidator',
                errorType: 'validation_failed',
                ...details.metadata
            }
        };
    }

    /**
     * 批量验证多个项目
     * @param {Array} projects - 项目列表 [{taskId, projectPath}]
     * @returns {Promise<Array>} 批量验证结果
     */
    async batchValidate(projects) {
        console.log(`[Step5FixedFileValidator] 开始批量验证: ${projects.length} 个项目`);

        const results = [];
        
        for (const project of projects) {
            try {
                const result = await this.validate(project.taskId, project.projectPath);
                results.push({
                    projectPath: project.projectPath,
                    taskId: project.taskId,
                    ...result
                });
            } catch (error) {
                results.push({
                    projectPath: project.projectPath,
                    taskId: project.taskId,
                    isValid: false,
                    error: error.message,
                    errorCode: this.errorCodes.ACCESS_DENIED
                });
            }
        }

        return results;
    }

    /**
     * 获取验证器状态
     */
    getValidatorStatus() {
        return {
            name: 'Step5FixedFileValidator',
            version: '1.0.0',
            stepType: 'step5',
            description: '检查Step5模块关联分析结果，验证relations.md文件是否存在',
            config: this.config,
            requiredFile: this.config.requiredFileName,
            alternativeFiles: this.alternativeFileNames,
            errorCodes: this.errorCodes,
            validationChecks: [
                'file_existence',
                'file_size',
                'file_readability'
            ],
            isReady: true
        };
    }

    /**
     * 获取预期的文件路径
     * @param {string} projectPath - 项目路径
     * @returns {Object} 路径信息
     */
    getExpectedPaths(projectPath) {
        const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
        const relationsFilePath = join(docsBasePath, this.config.requiredFileName);
        
        return {
            docsBasePath,
            relationsFilePath,
            relativePaths: {
                docsBase: this.config.mgKiroFolderName,
                relationsFile: `${this.config.mgKiroFolderName}/${this.config.requiredFileName}`
            }
        };
    }

    /**
     * 设置文件大小限制
     * @param {number} minSize - 最小文件大小（字节）
     * @param {number} maxSize - 最大文件大小（字节）
     */
    setFileSizeLimits(minSize, maxSize) {
        this.config.minFileSize = minSize;
        this.config.maxFileSize = maxSize;
        console.log(`[Step5FixedFileValidator] 文件大小限制更新: ${minSize} - ${maxSize} 字节`);
    }

    /**
     * 重置验证器状态
     */
    reset() {
        console.log('[Step5FixedFileValidator] 验证器状态已重置');
    }
}

export default Step5FixedFileValidator;