/**
 * Step6 架构文档验证器 - 检查架构相关文档
 * 
 * 验证策略：
 * - 检查 mg_kiro/README.md 文件是否存在
 * - 检查 mg_kiro/architecture.md 文件是否存在
 * - 这两个文件是Step6步骤的核心输出文件
 * - 只验证文件存在性，不验证内容
 * - 提供明确的错误信息和修复建议
 * 
 * 验证逻辑：
 * - 两个文件都存在 -> 验证通过
 * - 任何文件缺失 -> 验证失败，明确指出缺少哪个文件
 * - 可选：检查文件大小和基本可读性
 * 
 * 设计理念：
 * - 多文件验证：同时检查多个必需文件
 * - 精确报告：明确指出哪些文件缺失
 * - 简单明确：只检查特定文件的存在性
 * - 友好提示：清晰的错误信息和修复建议
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class Step6ArchitectureValidator {
    constructor(config = {}) {
        this.config = {
            mgKiroFolderName: 'mg_kiro',        // 主文档文件夹名
            requiredFiles: [                    // 必需的文件列表
                'README.md',
                'architecture.md'
            ],
            minFileSize: 100,                   // 最小文件大小（字节）
            maxFileSize: 10 * 1024 * 1024,     // 最大文件大小（10MB）
            checkReadability: true,             // 检查文件可读性
            allowPartialSuccess: false,         // 是否允许部分成功（某些文件存在）
            timeoutMs: 5000,                    // 验证超时时间
            ...config
        };
        
        // 错误代码映射
        this.errorCodes = {
            BASE_FOLDER_NOT_FOUND: 'STEP6_BASE_FOLDER_NOT_FOUND',
            README_NOT_FOUND: 'STEP6_README_NOT_FOUND',
            ARCHITECTURE_NOT_FOUND: 'STEP6_ARCHITECTURE_NOT_FOUND',
            MULTIPLE_FILES_MISSING: 'STEP6_MULTIPLE_FILES_MISSING',
            FILE_EMPTY: 'STEP6_FILE_EMPTY',
            FILE_TOO_LARGE: 'STEP6_FILE_TOO_LARGE',
            FILE_NOT_READABLE: 'STEP6_FILE_NOT_READABLE',
            ACCESS_DENIED: 'STEP6_ACCESS_DENIED',
            TIMEOUT: 'STEP6_VALIDATION_TIMEOUT'
        };

        // 可选的替代文件名映射
        this.alternativeFileNames = {
            'README.md': ['readme.md', 'README.txt', 'readme.txt', 'project-readme.md'],
            'architecture.md': ['Architecture.md', 'ARCHITECTURE.md', 'system-architecture.md', 'project-architecture.md']
        };
    }

    /**
     * 验证Step6架构文档
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 验证选项
     * @returns {Promise<Object>} 验证结果
     */
    async validate(taskId, projectPath, options = {}) {
        console.log(`[Step6ArchitectureValidator] 开始验证: ${taskId} 项目: ${projectPath}`);

        const startTime = Date.now();
        const finalOptions = { ...this.config, ...options };

        try {
            // 构建期望的文件路径
            const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
            
            // 执行分层验证
            const validationSteps = [
                () => this._checkBaseFolderExists(docsBasePath, projectPath),
                () => this._checkRequiredFiles(docsBasePath, finalOptions),
                () => this._validateFileProperties(docsBasePath, finalOptions)
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
                validator: 'Step6ArchitectureValidator',
                processingTime,
                timestamp: new Date().toISOString()
            };

            console.log(`[Step6ArchitectureValidator] 验证完成: ${validationResult.isValid ? '通过' : '失败'}`);
            
            return validationResult;

        } catch (error) {
            console.error(`[Step6ArchitectureValidator] 验证异常: ${taskId}`, error);
            
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
                            '请确保已经运行过完整的项目初始化流程',
                            `检查项目根目录是否包含 ${this.config.mgKiroFolderName} 文件夹`,
                            '如果文件夹不存在，请先运行Step1-Step5创建基础结构'
                        ],
                        missingFiles: [docsBasePath]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 检查必需文件
     * @private
     */
    async _checkRequiredFiles(docsBasePath, options) {
        const fileCheckResults = [];
        const missingFiles = [];
        const foundFiles = [];
        
        // 逐个检查必需文件
        for (const fileName of this.config.requiredFiles) {
            const filePath = join(docsBasePath, fileName);
            const checkResult = await this._checkSingleFile(filePath, fileName, docsBasePath);
            
            fileCheckResults.push({
                fileName,
                ...checkResult
            });

            if (checkResult.exists) {
                foundFiles.push(checkResult.foundFile);
            } else {
                missingFiles.push({
                    fileName,
                    expectedPath: filePath,
                    alternatives: checkResult.alternativeFile || null
                });
            }
        }

        // 判断验证结果
        if (missingFiles.length === 0) {
            // 所有文件都存在
            return {
                isValid: true,
                step: 'required_files_check',
                foundFiles,
                fileCheckResults,
                allFilesFound: true
            };
        } else if (foundFiles.length > 0 && options.allowPartialSuccess) {
            // 部分文件存在，且允许部分成功
            return {
                isValid: true,
                step: 'required_files_check',
                foundFiles,
                missingFiles,
                fileCheckResults,
                partialSuccess: true,
                warning: `部分文件缺失，但允许部分成功：缺少 ${missingFiles.map(f => f.fileName).join(', ')}`
            };
        } else {
            // 验证失败
            const errorCode = missingFiles.length === this.config.requiredFiles.length ? 
                this.errorCodes.MULTIPLE_FILES_MISSING :
                (missingFiles.some(f => f.fileName === 'README.md') ? 
                    this.errorCodes.README_NOT_FOUND : 
                    this.errorCodes.ARCHITECTURE_NOT_FOUND);

            return this._createErrorResult(
                errorCode,
                `架构文档缺失: ${missingFiles.map(f => f.fileName).join(', ')}`,
                {
                    missingFiles,
                    foundFiles,
                    fileCheckResults,
                    basePath: docsBasePath,
                    suggestions: [
                        '请运行Step6架构文档生成流程',
                        '使用 init_step6_architecture_docs 开始架构文档生成',
                        '确认Step6已经完成，应该生成项目架构总览文档',
                        '检查Step1-Step5是否都已完成，Step6是最终步骤'
                    ],
                    requiredActions: [
                        {
                            action: 'run_step6',
                            description: '运行Step6架构文档生成流程',
                            tools: ['init_step6_architecture_docs'],
                            expectedResult: `生成 ${this.config.requiredFiles.join(' 和 ')} 架构文档`,
                            prerequisites: ['Step1-Step5必须全部完成']
                        }
                    ]
                }
            );
        }
    }

    /**
     * 检查单个文件
     * @private
     */
    async _checkSingleFile(filePath, fileName, basePath) {
        try {
            const stats = await fs.stat(filePath);
            
            if (!stats.isFile()) {
                return {
                    exists: false,
                    reason: 'not_a_file',
                    actualType: stats.isDirectory() ? 'directory' : 'unknown'
                };
            }

            return {
                exists: true,
                foundFile: {
                    name: fileName,
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.ctime.toISOString()
                }
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                // 尝试查找替代文件
                const alternativeFile = await this._findAlternativeFile(basePath, fileName);
                
                return {
                    exists: false,
                    reason: 'file_not_found',
                    alternativeFile
                };
            }

            return {
                exists: false,
                reason: 'access_error',
                error: error.message
            };
        }
    }

    /**
     * 查找替代文件
     * @private
     */
    async _findAlternativeFile(basePath, targetFileName) {
        const alternatives = this.alternativeFileNames[targetFileName] || [];
        
        for (const altFileName of alternatives) {
            try {
                const altFilePath = join(basePath, altFileName);
                const stats = await fs.stat(altFilePath);
                
                if (stats.isFile()) {
                    console.log(`[Step6ArchitectureValidator] 找到替代文件: ${altFileName} for ${targetFileName}`);
                    
                    return {
                        name: altFileName,
                        path: altFilePath,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        originalTarget: targetFileName
                    };
                }
            } catch (error) {
                // 继续查找下一个替代文件
                continue;
            }
        }
        
        return null;
    }

    /**
     * 验证文件属性
     * @private
     */
    async _validateFileProperties(docsBasePath, options) {
        // 获取所有存在的文件
        const existingFiles = [];
        
        for (const fileName of this.config.requiredFiles) {
            const filePath = join(docsBasePath, fileName);
            
            try {
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    existingFiles.push({ name: fileName, path: filePath, stats });
                }
            } catch (error) {
                // 文件不存在，跳过属性验证
                continue;
            }
        }

        const propertyCheckResults = [];
        
        for (const file of existingFiles) {
            const propertyResult = await this._validateSingleFileProperties(file, options);
            propertyCheckResults.push({
                fileName: file.name,
                ...propertyResult
            });

            // 如果有严重的属性问题，返回错误
            if (!propertyResult.isValid && propertyResult.severity === 'error') {
                return this._createErrorResult(
                    propertyResult.errorCode,
                    `文件属性验证失败: ${file.name} - ${propertyResult.message}`,
                    {
                        fileName: file.name,
                        filePath: file.path,
                        propertyCheckResults,
                        ...propertyResult.details
                    }
                );
            }
        }

        return {
            isValid: true,
            step: 'file_properties_check',
            propertyCheckResults,
            validatedFiles: existingFiles.map(f => f.name)
        };
    }

    /**
     * 验证单个文件属性
     * @private
     */
    async _validateSingleFileProperties(file, options) {
        const results = {
            isValid: true,
            checks: {},
            warnings: []
        };

        // 文件大小检查
        if (file.stats.size < this.config.minFileSize) {
            results.checks.sizeCheck = 'warning';
            results.warnings.push(`文件 ${file.name} 可能太小 (${file.stats.size} 字节)`);
        } else if (file.stats.size > this.config.maxFileSize) {
            results.isValid = false;
            results.errorCode = this.errorCodes.FILE_TOO_LARGE;
            results.severity = 'error';
            results.message = `文件过大 (${file.stats.size} 字节)`;
            results.details = {
                actualSize: file.stats.size,
                maxAllowedSize: this.config.maxFileSize
            };
            return results;
        } else {
            results.checks.sizeCheck = 'passed';
        }

        // 可读性检查
        if (options.checkReadability) {
            const isReadable = await this._checkFileReadability(file.path);
            
            if (!isReadable) {
                results.isValid = false;
                results.errorCode = this.errorCodes.FILE_NOT_READABLE;
                results.severity = 'error';
                results.message = `文件无法读取`;
                results.details = {
                    suggestions: [
                        '检查文件权限',
                        '确认文件没有被其他程序占用',
                        '重新生成文件'
                    ]
                };
                return results;
            } else {
                results.checks.readabilityCheck = 'passed';
            }
        }

        return results;
    }

    /**
     * 检查文件可读性
     * @private
     */
    async _checkFileReadability(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            
            // 尝试读取文件前几个字节
            const fd = await fs.open(filePath, 'r');
            const buffer = Buffer.alloc(200);
            await fd.read(buffer, 0, 200, 0);
            await fd.close();
            
            return true;
        } catch (error) {
            console.warn(`[Step6ArchitectureValidator] 文件可读性检查失败: ${filePath}`, error.message);
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
                validator: 'Step6ArchitectureValidator',
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
        console.log(`[Step6ArchitectureValidator] 开始批量验证: ${projects.length} 个项目`);

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
            name: 'Step6ArchitectureValidator',
            version: '1.0.0',
            stepType: 'step6',
            description: '检查Step6架构文档生成结果，验证README.md和architecture.md文件是否存在',
            config: this.config,
            requiredFiles: this.config.requiredFiles,
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
        const filePaths = {};
        
        this.config.requiredFiles.forEach(fileName => {
            const key = fileName.replace('.md', 'File');
            filePaths[key] = join(docsBasePath, fileName);
        });
        
        return {
            docsBasePath,
            ...filePaths,
            relativePaths: {
                docsBase: this.config.mgKiroFolderName,
                ...Object.fromEntries(
                    this.config.requiredFiles.map(fileName => [
                        fileName.replace('.md', ''),
                        `${this.config.mgKiroFolderName}/${fileName}`
                    ])
                )
            }
        };
    }

    /**
     * 设置部分成功模式
     * @param {boolean} allow - 是否允许部分成功
     */
    setPartialSuccessMode(allow) {
        this.config.allowPartialSuccess = allow;
        console.log(`[Step6ArchitectureValidator] 部分成功模式: ${allow ? '启用' : '禁用'}`);
    }

    /**
     * 添加替代文件名
     * @param {string} targetFile - 目标文件名
     * @param {string} alternativeFile - 替代文件名
     */
    addAlternativeFile(targetFile, alternativeFile) {
        if (!this.alternativeFileNames[targetFile]) {
            this.alternativeFileNames[targetFile] = [];
        }
        this.alternativeFileNames[targetFile].push(alternativeFile);
        console.log(`[Step6ArchitectureValidator] 为 ${targetFile} 添加替代文件: ${alternativeFile}`);
    }

    /**
     * 重置验证器状态
     */
    reset() {
        console.log('[Step6ArchitectureValidator] 验证器状态已重置');
    }
}

export default Step6ArchitectureValidator;