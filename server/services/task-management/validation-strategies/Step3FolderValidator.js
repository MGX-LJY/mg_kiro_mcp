/**
 * Step3 精确任务验证器 - 基于FileAnalysisModule的任务定义进行验证
 * 
 * 验证策略：
 * - 基于FileAnalysisModule生成的任务定义验证具体文件
 * - 根据批次策略进行不同的验证逻辑
 * - 验证任务关联的具体文件是否已处理完成
 * - 提供精确的任务状态和文件状态信息
 * 
 * 验证逻辑：
 * - CombinedFileBatch: 验证批次内所有文件是否都有对应的分析文档
 * - SingleFileBatch: 验证单个文件是否有对应的分析文档
 * - LargeFileMultiBatch: 验证多批次文件的所有子任务是否完成
 * 
 * 设计理念：
 * - 精确验证：基于具体任务和文件进行验证
 * - 协作式验证：与FileAnalysisModule紧密配合
 * - 批次感知：根据不同批次策略使用不同验证逻辑
 * - 详细反馈：提供具体的任务进度和文件状态
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class Step3FolderValidator {
    constructor(config = {}) {
        this.config = {
            filesFolderName: 'files',           // 文件文档文件夹名
            mgKiroFolderName: 'mg_kiro',        // 主文档文件夹名
            requiredExtension: '.md',           // 必需的文件扩展名
            minRequiredFiles: 1,                // 最少文件数量
            enableDetailedScan: true,           // 启用详细扫描
            timeoutMs: 5000,                    // 验证超时时间
            ...config
        };

        // 支持的文档文件扩展名
        this.validExtensions = ['.md', '.markdown', '.txt'];
        
        // 错误代码映射
        this.errorCodes = {
            FOLDER_NOT_FOUND: 'STEP3_FOLDER_NOT_FOUND',
            NO_MD_FILES: 'STEP3_NO_MD_FILES',
            ACCESS_DENIED: 'STEP3_ACCESS_DENIED',
            TIMEOUT: 'STEP3_VALIDATION_TIMEOUT'
        };
    }

    /**
     * 验证Step3任务 - 基于FileAnalysisModule的任务定义
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 验证选项，包含taskContext
     * @returns {Promise<Object>} 验证结果
     */
    async validate(taskId, projectPath, options = {}) {
        console.log(`[Step3FolderValidator] 开始精确验证任务: ${taskId}`);

        const startTime = Date.now();
        const finalOptions = { ...this.config, ...options };
        const taskContext = options.taskContext;

        try {
            // 构建期望的文档路径
            const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
            const filesFolderPath = join(docsBasePath, this.config.filesFolderName);

            let validationResult;

            if (taskContext && taskContext.taskDefinition) {
                // 基于任务定义进行精确验证
                validationResult = await this._validateTaskWithContext(
                    taskId, 
                    projectPath, 
                    taskContext, 
                    filesFolderPath,
                    finalOptions
                );
            } else {
                // 降级到传统验证（兼容性）
                console.warn(`[Step3FolderValidator] 无任务上下文，降级到传统验证: ${taskId}`);
                validationResult = await this._validateTraditionalWay(
                    filesFolderPath, 
                    docsBasePath, 
                    projectPath, 
                    finalOptions
                );
            }

            const processingTime = Date.now() - startTime;

            // 添加通用元数据
            validationResult.metadata = {
                ...validationResult.metadata,
                taskId,
                projectPath,
                validator: 'Step3FolderValidator',
                validationMode: taskContext ? 'context-based' : 'traditional',
                processingTime,
                timestamp: new Date().toISOString()
            };

            console.log(`[Step3FolderValidator] 验证完成: ${validationResult.isValid ? '通过' : '失败'}`);
            
            return validationResult;

        } catch (error) {
            console.error(`[Step3FolderValidator] 验证异常: ${taskId}`, error);
            
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
                    this.errorCodes.FOLDER_NOT_FOUND,
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
                    this.errorCodes.FOLDER_NOT_FOUND,
                    `主文档文件夹不存在: ${this.config.mgKiroFolderName}`,
                    {
                        expectedPath: docsBasePath,
                        projectPath,
                        suggestions: [
                            '请确保已经运行过项目初始化流程',
                            `检查项目根目录是否包含 ${this.config.mgKiroFolderName} 文件夹`,
                            '如果文件夹不存在，请先运行Step1和Step2创建基础结构'
                        ],
                        missingFiles: [docsBasePath]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 检查files文件夹是否存在
     * @private
     */
    async _checkFilesFolderExists(filesFolderPath, docsBasePath) {
        try {
            const stats = await fs.stat(filesFolderPath);
            
            if (!stats.isDirectory()) {
                return this._createErrorResult(
                    this.errorCodes.FOLDER_NOT_FOUND,
                    `${this.config.filesFolderName} 文件夹不是目录`,
                    {
                        expectedPath: filesFolderPath,
                        actualType: 'file',
                        suggestions: [`请确保 ${filesFolderPath} 是一个目录`]
                    }
                );
            }

            return {
                isValid: true,
                step: 'files_folder_check',
                foundPath: filesFolderPath
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.FOLDER_NOT_FOUND,
                    `文件文档文件夹不存在: ${this.config.filesFolderName}`,
                    {
                        expectedPath: filesFolderPath,
                        basePath: docsBasePath,
                        suggestions: [
                            '请运行Step3文件处理流程来生成文件文档',
                            '使用 init_step3_get_next_task 开始文件处理',
                            `确认Step3已经完成，应该在 ${filesFolderPath} 生成文档文件`
                        ],
                        missingFiles: [filesFolderPath],
                        requiredActions: [
                            {
                                action: 'run_step3',
                                description: '运行Step3文件处理流程',
                                tools: ['init_step3_get_next_task', 'init_step3_get_file_content', 'init_step3_complete_task']
                            }
                        ]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 基于任务上下文进行精确验证
     * @private
     */
    async _validateTaskWithContext(taskId, projectPath, taskContext, filesFolderPath, options) {
        const { taskDefinition, expectedFiles, batchStrategy, processingType } = taskContext;
        
        console.log(`[Step3FolderValidator] 任务验证 - 批次策略: ${batchStrategy}, 文件数: ${expectedFiles.length}`);

        // 首先检查基础文件夹
        const baseFolderCheck = await this._checkBaseFolderExists(
            resolve(projectPath, this.config.mgKiroFolderName), 
            projectPath
        );
        if (!baseFolderCheck.isValid) {
            return baseFolderCheck;
        }

        const filesFolderCheck = await this._checkFilesFolderExists(
            filesFolderPath,
            resolve(projectPath, this.config.mgKiroFolderName)
        );
        if (!filesFolderCheck.isValid) {
            return filesFolderCheck;
        }

        // 根据批次策略进行不同的验证
        switch (batchStrategy) {
            case 'CombinedFileBatch':
                return await this._validateCombinedFileBatch(
                    taskId, filesFolderPath, expectedFiles, taskDefinition
                );
            case 'SingleFileBatch':
                return await this._validateSingleFileBatch(
                    taskId, filesFolderPath, expectedFiles, taskDefinition
                );
            case 'LargeFileMultiBatch':
                return await this._validateLargeFileMultiBatch(
                    taskId, filesFolderPath, expectedFiles, taskDefinition
                );
            default:
                console.warn(`[Step3FolderValidator] 未知的批次策略: ${batchStrategy}`);
                return await this._validateGenericBatch(
                    taskId, filesFolderPath, expectedFiles, taskDefinition
                );
        }
    }

    /**
     * 验证组合文件批次
     * @private
     */
    async _validateCombinedFileBatch(taskId, filesFolderPath, expectedFiles, taskDefinition) {
        const expectedDocName = `${taskId}_combined_analysis.md`;
        const expectedDocPath = join(filesFolderPath, expectedDocName);

        try {
            const stats = await fs.stat(expectedDocPath);
            
            return {
                isValid: true,
                validationType: 'CombinedFileBatch',
                taskId,
                expectedFiles: expectedFiles.length,
                foundDocument: expectedDocName,
                documentPath: expectedDocPath,
                documentSize: stats.size,
                lastModified: stats.mtime.toISOString(),
                metadata: {
                    batchStrategy: 'CombinedFileBatch',
                    processedFiles: expectedFiles
                }
            };
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.NO_MD_FILES,
                    `组合批次文档不存在: ${expectedDocName}`,
                    {
                        taskId,
                        batchStrategy: 'CombinedFileBatch',
                        expectedDocument: expectedDocName,
                        expectedPath: expectedDocPath,
                        expectedFiles: expectedFiles,
                        suggestions: [
                            `请完成任务 ${taskId} 的文件分析`,
                            '使用 init_step3_generate_analysis 生成组合批次分析文档',
                            `确认在 ${filesFolderPath} 生成 ${expectedDocName}`
                        ],
                        missingFiles: [expectedDocPath]
                    }
                );
            }
            throw error;
        }
    }

    /**
     * 验证单文件批次
     * @private
     */
    async _validateSingleFileBatch(taskId, filesFolderPath, expectedFiles, taskDefinition) {
        if (expectedFiles.length !== 1) {
            return this._createErrorResult(
                'INVALID_BATCH_CONFIG',
                `单文件批次应该只有1个文件，实际有 ${expectedFiles.length} 个`,
                { taskId, expectedFiles, batchStrategy: 'SingleFileBatch' }
            );
        }

        const targetFile = expectedFiles[0];
        const expectedDocName = `${taskId}_${this._getFileBaseName(targetFile)}_analysis.md`;
        const expectedDocPath = join(filesFolderPath, expectedDocName);

        try {
            const stats = await fs.stat(expectedDocPath);
            
            return {
                isValid: true,
                validationType: 'SingleFileBatch',
                taskId,
                targetFile,
                foundDocument: expectedDocName,
                documentPath: expectedDocPath,
                documentSize: stats.size,
                lastModified: stats.mtime.toISOString(),
                metadata: {
                    batchStrategy: 'SingleFileBatch',
                    processedFile: targetFile
                }
            };
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.NO_MD_FILES,
                    `单文件分析文档不存在: ${expectedDocName}`,
                    {
                        taskId,
                        batchStrategy: 'SingleFileBatch',
                        targetFile,
                        expectedDocument: expectedDocName,
                        expectedPath: expectedDocPath,
                        suggestions: [
                            `请完成文件 ${targetFile} 的分析`,
                            `使用 init_step3_generate_analysis 生成 ${targetFile} 的分析文档`,
                            `确认在 ${filesFolderPath} 生成 ${expectedDocName}`
                        ],
                        missingFiles: [expectedDocPath]
                    }
                );
            }
            throw error;
        }
    }

    /**
     * 验证大文件多批次
     * @private
     */
    async _validateLargeFileMultiBatch(taskId, filesFolderPath, expectedFiles, taskDefinition) {
        const sourceFile = expectedFiles[0]; // 大文件多批次通常处理单个大文件
        const baseFileName = this._getFileBaseName(sourceFile);
        const expectedDocs = [];
        const foundDocs = [];
        const missingDocs = [];

        // 根据任务ID模式检测子批次数量 (如task_3_1, task_3_2)
        const subBatchCount = taskDefinition.subBatches || 1;
        
        for (let i = 1; i <= subBatchCount; i++) {
            const expectedDocName = `${taskId}_${i}_${baseFileName}_analysis.md`;
            const expectedDocPath = join(filesFolderPath, expectedDocName);
            expectedDocs.push(expectedDocName);

            try {
                const stats = await fs.stat(expectedDocPath);
                foundDocs.push({
                    name: expectedDocName,
                    path: expectedDocPath,
                    size: stats.size,
                    lastModified: stats.mtime.toISOString()
                });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    missingDocs.push(expectedDocPath);
                }
            }
        }

        if (missingDocs.length > 0) {
            return this._createErrorResult(
                this.errorCodes.NO_MD_FILES,
                `大文件多批次文档不完整: 缺失 ${missingDocs.length}/${expectedDocs.length} 个文档`,
                {
                    taskId,
                    batchStrategy: 'LargeFileMultiBatch',
                    sourceFile,
                    expectedDocs,
                    foundDocs: foundDocs.length,
                    missingDocs,
                    suggestions: [
                        `请完成所有子批次的分析: ${expectedDocs.join(', ')}`,
                        '确认大文件已经完整分割和处理',
                        `在 ${filesFolderPath} 生成所有缺失的分析文档`
                    ],
                    missingFiles: missingDocs
                }
            );
        }

        return {
            isValid: true,
            validationType: 'LargeFileMultiBatch',
            taskId,
            sourceFile,
            expectedDocs,
            foundDocs,
            subBatchCount,
            metadata: {
                batchStrategy: 'LargeFileMultiBatch',
                processedFile: sourceFile,
                completedSubBatches: foundDocs.length
            }
        };
    }

    /**
     * 通用批次验证
     * @private
     */
    async _validateGenericBatch(taskId, filesFolderPath, expectedFiles, taskDefinition) {
        const expectedDocName = `${taskId}_analysis.md`;
        const expectedDocPath = join(filesFolderPath, expectedDocName);

        try {
            const stats = await fs.stat(expectedDocPath);
            
            return {
                isValid: true,
                validationType: 'Generic',
                taskId,
                expectedFiles: expectedFiles.length,
                foundDocument: expectedDocName,
                documentPath: expectedDocPath,
                documentSize: stats.size,
                lastModified: stats.mtime.toISOString(),
                metadata: {
                    batchStrategy: 'Generic',
                    processedFiles: expectedFiles
                }
            };
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.NO_MD_FILES,
                    `任务分析文档不存在: ${expectedDocName}`,
                    {
                        taskId,
                        expectedDocument: expectedDocName,
                        expectedPath: expectedDocPath,
                        expectedFiles,
                        suggestions: [
                            `请完成任务 ${taskId} 的分析`,
                            '使用 init_step3_generate_analysis 生成分析文档'
                        ],
                        missingFiles: [expectedDocPath]
                    }
                );
            }
            throw error;
        }
    }

    /**
     * 获取文件基础名（不含扩展名）
     * @private
     */
    _getFileBaseName(filePath) {
        const fileName = filePath.split('/').pop();
        return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    }

    /**
     * 传统验证方式（降级兼容）
     * @private
     */
    async _validateTraditionalWay(filesFolderPath, docsBasePath, projectPath, options) {
        const baseFolderCheck = await this._checkBaseFolderExists(docsBasePath, projectPath);
        if (!baseFolderCheck.isValid) {
            return baseFolderCheck;
        }

        const filesFolderCheck = await this._checkFilesFolderExists(filesFolderPath, docsBasePath);
        if (!filesFolderCheck.isValid) {
            return filesFolderCheck;
        }

        return await this._scanForMarkdownFiles(filesFolderPath, options);
    }

    /**
     * 扫描Markdown文件（传统方式）
     * @private
     */
    async _scanForMarkdownFiles(filesFolderPath, options) {
        try {
            const files = await fs.readdir(filesFolderPath);
            
            // 筛选Markdown文件
            const markdownFiles = files.filter(file => {
                const fileExt = file.toLowerCase().substring(file.lastIndexOf('.'));
                return this.validExtensions.includes(fileExt);
            });

            if (markdownFiles.length === 0) {
                return this._createErrorResult(
                    this.errorCodes.NO_MD_FILES,
                    `${this.config.filesFolderName} 文件夹中没有找到 .md 文件`,
                    {
                        scannedPath: filesFolderPath,
                        totalFiles: files.length,
                        markdownFiles: 0,
                        foundFiles: files,
                        suggestions: [
                            '请运行完整的Step3文件处理流程',
                            '确认Step3中的文件分析和文档生成步骤已完成',
                            '检查是否有处理错误导致文档未能生成',
                            `确认应该在 ${filesFolderPath} 目录生成 .md 文档文件`
                        ],
                        requiredActions: [
                            {
                                action: 'complete_step3',
                                description: '完成Step3文件处理，生成所有文件的文档',
                                expectedResult: `在 ${filesFolderPath} 生成 .md 文档文件`
                            }
                        ]
                    }
                );
            }

            // 检查文件数量是否符合要求
            if (markdownFiles.length < this.config.minRequiredFiles) {
                return this._createErrorResult(
                    this.errorCodes.NO_MD_FILES,
                    `找到的 .md 文件数量不足 (${markdownFiles.length} < ${this.config.minRequiredFiles})`,
                    {
                        scannedPath: filesFolderPath,
                        foundCount: markdownFiles.length,
                        requiredCount: this.config.minRequiredFiles,
                        foundFiles: markdownFiles,
                        suggestions: [
                            '请确认Step3处理了所有需要的文件',
                            '检查是否有文件处理失败',
                            `至少需要生成 ${this.config.minRequiredFiles} 个文档文件`
                        ]
                    }
                );
            }

            // 详细文件信息扫描
            let fileDetails = [];
            if (options.enableDetailedScan) {
                fileDetails = await this._getFileDetails(filesFolderPath, markdownFiles);
            }

            // 验证通过
            return {
                isValid: true,
                step: 'markdown_scan',
                foundFiles: markdownFiles,
                fileCount: markdownFiles.length,
                details: fileDetails,
                metadata: {
                    scannedPath: filesFolderPath,
                    totalFiles: files.length,
                    validExtensions: this.validExtensions,
                    scanTime: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('[Step3FolderValidator] 扫描文件失败:', error);
            
            return this._createErrorResult(
                this.errorCodes.ACCESS_DENIED,
                `扫描文件夹失败: ${error.message}`,
                {
                    scannedPath: filesFolderPath,
                    error: error.message,
                    suggestions: [
                        '检查文件夹访问权限',
                        '确认文件夹路径正确',
                        '重试验证过程'
                    ]
                }
            );
        }
    }

    /**
     * 获取文件详细信息
     * @private
     */
    async _getFileDetails(folderPath, files) {
        const details = [];
        
        for (const file of files) {
            try {
                const filePath = join(folderPath, file);
                const stats = await fs.stat(filePath);
                
                details.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.ctime.toISOString(),
                    isReadable: await this._checkFileReadable(filePath)
                });
            } catch (error) {
                details.push({
                    name: file,
                    error: error.message,
                    isReadable: false
                });
            }
        }
        
        return details;
    }

    /**
     * 检查文件是否可读
     * @private
     */
    async _checkFileReadable(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            return true;
        } catch (error) {
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
                validator: 'Step3FolderValidator',
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
        console.log(`[Step3FolderValidator] 开始批量验证: ${projects.length} 个项目`);

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
            name: 'Step3FolderValidator',
            version: '1.0.0',
            stepType: 'step3',
            description: '基于FileAnalysisModule的任务定义精确验证Step3文件处理结果',
            config: this.config,
            supportedExtensions: this.validExtensions,
            errorCodes: this.errorCodes,
            isReady: true
        };
    }

    /**
     * 获取预期的文件夹路径
     * @param {string} projectPath - 项目路径
     * @returns {Object} 路径信息
     */
    getExpectedPaths(projectPath) {
        const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
        const filesFolderPath = join(docsBasePath, this.config.filesFolderName);
        
        return {
            docsBasePath,
            filesFolderPath,
            relativePaths: {
                docsBase: this.config.mgKiroFolderName,
                filesFolder: `${this.config.mgKiroFolderName}/${this.config.filesFolderName}`
            }
        };
    }

    /**
     * 重置验证器状态
     */
    reset() {
        console.log('[Step3FolderValidator] 验证器状态已重置');
    }
}

export default Step3FolderValidator;