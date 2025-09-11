/**
 * Step4 模块验证器 - 检查模块文档文件夹内容
 * 
 * 验证策略：
 * - 检查 mg_kiro/modules/ 文件夹是否存在
 * - 检查该文件夹是否包含任何文件（不限制文件类型）
 * - 只要文件夹里边有文件即可，没有文件再提醒生成
 * - 不验证文件内容，只检查文件存在性
 * 
 * 验证逻辑：
 * - 如果modules文件夹不存在 -> 验证失败，提示需要运行Step4
 * - 如果modules文件夹存在但是空的 -> 验证失败，提示没有生成模块文档
 * - 如果modules文件夹存在且有文件 -> 验证通过
 * 
 * 设计理念：
 * - 灵活验证：不限制特定文件名或扩展名
 * - 简单明确：只检查是否有文件存在
 * - 友好提示：清晰的错误信息和修复建议
 * - 快速验证：不读取文件内容，提升性能
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class Step4ModuleValidator {
    constructor(config = {}) {
        this.config = {
            modulesFolderName: 'modules',       // 模块文档文件夹名
            mgKiroFolderName: 'mg_kiro',        // 主文档文件夹名
            minRequiredFiles: 1,                // 最少文件数量
            enableDetailedScan: true,           // 启用详细扫描
            excludeHiddenFiles: true,           // 排除隐藏文件
            timeoutMs: 5000,                    // 验证超时时间
            ...config
        };

        // 需要排除的文件/文件夹
        this.excludePatterns = [
            /^\..*$/,           // 隐藏文件
            /^Thumbs\.db$/i,    // Windows缩略图
            /^\.DS_Store$/,     // macOS系统文件
            /^desktop\.ini$/i   // Windows桌面配置
        ];
        
        // 错误代码映射
        this.errorCodes = {
            FOLDER_NOT_FOUND: 'STEP4_FOLDER_NOT_FOUND',
            NO_FILES: 'STEP4_NO_FILES',
            ACCESS_DENIED: 'STEP4_ACCESS_DENIED',
            TIMEOUT: 'STEP4_VALIDATION_TIMEOUT'
        };
    }

    /**
     * 验证Step4模块文件夹
     * @param {string} taskId - 任务ID
     * @param {string} projectPath - 项目路径
     * @param {Object} options - 验证选项
     * @returns {Promise<Object>} 验证结果
     */
    async validate(taskId, projectPath, options = {}) {
        console.log(`[Step4ModuleValidator] 开始验证: ${taskId} 项目: ${projectPath}`);

        const startTime = Date.now();
        const finalOptions = { ...this.config, ...options };

        try {
            // 构建期望的模块文档路径
            const docsBasePath = resolve(projectPath, this.config.mgKiroFolderName);
            const modulesFolderPath = join(docsBasePath, this.config.modulesFolderName);

            // 执行分层验证
            const validationSteps = [
                () => this._checkBaseFolderExists(docsBasePath, projectPath),
                () => this._checkModulesFolderExists(modulesFolderPath, docsBasePath),
                () => this._scanForFiles(modulesFolderPath, finalOptions)
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
                validator: 'Step4ModuleValidator',
                processingTime,
                timestamp: new Date().toISOString()
            };

            console.log(`[Step4ModuleValidator] 验证完成: ${validationResult.isValid ? '通过' : '失败'}`);
            
            return validationResult;

        } catch (error) {
            console.error(`[Step4ModuleValidator] 验证异常: ${taskId}`, error);
            
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
                            '如果文件夹不存在，请先运行Step1-Step3创建基础结构'
                        ],
                        missingFiles: [docsBasePath]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 检查modules文件夹是否存在
     * @private
     */
    async _checkModulesFolderExists(modulesFolderPath, docsBasePath) {
        try {
            const stats = await fs.stat(modulesFolderPath);
            
            if (!stats.isDirectory()) {
                return this._createErrorResult(
                    this.errorCodes.FOLDER_NOT_FOUND,
                    `${this.config.modulesFolderName} 文件夹不是目录`,
                    {
                        expectedPath: modulesFolderPath,
                        actualType: 'file',
                        suggestions: [`请确保 ${modulesFolderPath} 是一个目录`]
                    }
                );
            }

            return {
                isValid: true,
                step: 'modules_folder_check',
                foundPath: modulesFolderPath
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                return this._createErrorResult(
                    this.errorCodes.FOLDER_NOT_FOUND,
                    `模块文档文件夹不存在: ${this.config.modulesFolderName}`,
                    {
                        expectedPath: modulesFolderPath,
                        basePath: docsBasePath,
                        suggestions: [
                            '请运行Step4模块整合流程来生成模块文档',
                            '使用 init_step4_module_integration 开始模块整合',
                            `确认Step4已经完成，应该在 ${modulesFolderPath} 生成模块文档文件`
                        ],
                        missingFiles: [modulesFolderPath],
                        requiredActions: [
                            {
                                action: 'run_step4',
                                description: '运行Step4模块整合流程',
                                tools: ['init_step4_module_integration'],
                                expectedResult: `在 ${modulesFolderPath} 生成模块文档文件`
                            }
                        ]
                    }
                );
            }

            throw error;
        }
    }

    /**
     * 扫描文件夹中的文件
     * @private
     */
    async _scanForFiles(modulesFolderPath, options) {
        try {
            const allFiles = await fs.readdir(modulesFolderPath);
            
            // 过滤掉系统文件和隐藏文件
            const validFiles = this.config.excludeHiddenFiles ? 
                allFiles.filter(file => !this._shouldExcludeFile(file)) : allFiles;

            if (validFiles.length === 0) {
                return this._createErrorResult(
                    this.errorCodes.NO_FILES,
                    `${this.config.modulesFolderName} 文件夹为空，没有找到任何文件`,
                    {
                        scannedPath: modulesFolderPath,
                        totalFiles: allFiles.length,
                        validFiles: 0,
                        foundFiles: allFiles,
                        excludedFiles: allFiles.filter(file => this._shouldExcludeFile(file)),
                        suggestions: [
                            '请运行完整的Step4模块整合流程',
                            '确认Step4中的模块分析和文档生成步骤已完成',
                            '检查Step3是否已完成，Step4依赖Step3的文件文档',
                            '检查是否有处理错误导致模块文档未能生成',
                            `确认应该在 ${modulesFolderPath} 目录生成模块相关文档`
                        ],
                        requiredActions: [
                            {
                                action: 'complete_step4',
                                description: '完成Step4模块整合，生成模块概览和整合文档',
                                expectedResult: `在 ${modulesFolderPath} 生成模块文档文件`,
                                prerequisites: ['Step3文件处理必须完成']
                            }
                        ]
                    }
                );
            }

            // 检查文件数量是否符合要求
            if (validFiles.length < this.config.minRequiredFiles) {
                return this._createErrorResult(
                    this.errorCodes.NO_FILES,
                    `找到的文件数量不足 (${validFiles.length} < ${this.config.minRequiredFiles})`,
                    {
                        scannedPath: modulesFolderPath,
                        foundCount: validFiles.length,
                        requiredCount: this.config.minRequiredFiles,
                        foundFiles: validFiles,
                        suggestions: [
                            '请确认Step4处理了所有需要的模块',
                            '检查是否有模块整合失败',
                            `至少需要生成 ${this.config.minRequiredFiles} 个模块文档文件`
                        ]
                    }
                );
            }

            // 详细文件信息扫描
            let fileDetails = [];
            if (options.enableDetailedScan) {
                fileDetails = await this._getFileDetails(modulesFolderPath, validFiles);
            }

            // 文件类型统计
            const fileTypeStats = this._analyzeFileTypes(validFiles);

            // 验证通过
            return {
                isValid: true,
                step: 'files_scan',
                foundFiles: validFiles,
                fileCount: validFiles.length,
                fileTypeStats,
                details: fileDetails,
                metadata: {
                    scannedPath: modulesFolderPath,
                    totalFiles: allFiles.length,
                    excludedCount: allFiles.length - validFiles.length,
                    scanTime: new Date().toISOString(),
                    validationCriteria: {
                        minFiles: this.config.minRequiredFiles,
                        excludeHidden: this.config.excludeHiddenFiles
                    }
                }
            };

        } catch (error) {
            console.error('[Step4ModuleValidator] 扫描文件失败:', error);
            
            return this._createErrorResult(
                this.errorCodes.ACCESS_DENIED,
                `扫描文件夹失败: ${error.message}`,
                {
                    scannedPath: modulesFolderPath,
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
     * 检查是否应该排除文件
     * @private
     */
    _shouldExcludeFile(fileName) {
        return this.excludePatterns.some(pattern => pattern.test(fileName));
    }

    /**
     * 分析文件类型
     * @private
     */
    _analyzeFileTypes(files) {
        const typeStats = {};
        
        files.forEach(file => {
            const ext = file.includes('.') ? file.split('.').pop().toLowerCase() : 'no-extension';
            typeStats[ext] = (typeStats[ext] || 0) + 1;
        });

        return typeStats;
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
                    isDirectory: stats.isDirectory(),
                    extension: file.includes('.') ? file.split('.').pop().toLowerCase() : null,
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
                validator: 'Step4ModuleValidator',
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
        console.log(`[Step4ModuleValidator] 开始批量验证: ${projects.length} 个项目`);

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
            name: 'Step4ModuleValidator',
            version: '1.0.0',
            stepType: 'step4',
            description: '检查Step4模块整合结果，验证modules文件夹是否包含模块文档',
            config: this.config,
            excludePatterns: this.excludePatterns.map(p => p.toString()),
            errorCodes: this.errorCodes,
            validationCriteria: {
                minFiles: this.config.minRequiredFiles,
                excludeHidden: this.config.excludeHiddenFiles,
                allowAnyFileType: true
            },
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
        const modulesFolderPath = join(docsBasePath, this.config.modulesFolderName);
        
        return {
            docsBasePath,
            modulesFolderPath,
            relativePaths: {
                docsBase: this.config.mgKiroFolderName,
                modulesFolder: `${this.config.mgKiroFolderName}/${this.config.modulesFolderName}`
            }
        };
    }

    /**
     * 设置排除模式
     * @param {Array} patterns - 正则表达式数组
     */
    setExcludePatterns(patterns) {
        this.excludePatterns = patterns;
        console.log(`[Step4ModuleValidator] 更新排除模式: ${patterns.length} 个规则`);
    }

    /**
     * 添加排除模式
     * @param {RegExp} pattern - 正则表达式
     */
    addExcludePattern(pattern) {
        this.excludePatterns.push(pattern);
        console.log(`[Step4ModuleValidator] 添加排除模式: ${pattern.toString()}`);
    }

    /**
     * 重置验证器状态
     */
    reset() {
        // 重置到默认排除模式
        this.excludePatterns = [
            /^\..*$/,
            /^Thumbs\.db$/i,
            /^\.DS_Store$/,
            /^desktop\.ini$/i
        ];
        console.log('[Step4ModuleValidator] 验证器状态已重置');
    }
}

export default Step4ModuleValidator;