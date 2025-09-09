/**
 * 统一配置服务
 * 管理系统配置、环境变量、JSON文件和配置验证
 */

import fs from 'fs';
import path from 'path';

class ConfigService {
    constructor(configDir = './config') {
        this.configDir = configDir;
        this.config = this._loadDefaultConfig();
        this._loadConfigFiles();
        this._applyEnvironmentOverrides();
    }

    /**
     * 加载默认配置
     * @returns {Object} 默认配置
     */
    _loadDefaultConfig() {
        return {
            server: {
                port: 3000,
                host: 'localhost',
                version: '2.0.0'
            },
            cors: {
                enabled: true,
                origins: ['http://localhost:*']
            },
            rateLimit: {
                windowMs: 60000, // 1分钟
                max: 100 // 最大请求数
            },
            mcp: {
                version: '1.0.0',
                supportedVersions: ['1.0.0', '1.1.0']
            },
            prompt: {
                version: '2.0.0',
                cacheEnabled: true,
                watchFiles: true,
                cacheTTL: 3600000 // 1小时
            },
            workflow: {
                maxWorkflows: 100,
                cleanupInterval: 3600000, // 1小时
                maxAge: 86400000 // 24小时
            },
            analyzers: {
                languageDetector: {
                    enableDeepAnalysis: true,
                    maxFilesToAnalyze: 15,
                    confidenceThreshold: 60
                }
            }
        };
    }

    /**
     * 加载JSON配置文件
     */
    _loadConfigFiles() {
        try {
            // 加载主配置文件
            const mainConfigPath = path.join(this.configDir, 'mcp.config.json');
            if (fs.existsSync(mainConfigPath)) {
                const mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf-8'));
                this._mergeConfig(this.config, mainConfig);
                console.log('✅ 主配置文件已加载');
            }

            // 加载模式配置文件
            const modesConfigPath = path.join(this.configDir, 'modes.config.json');
            if (fs.existsSync(modesConfigPath)) {
                const modesConfig = JSON.parse(fs.readFileSync(modesConfigPath, 'utf-8'));
                this.config.modes = modesConfig;
                console.log('✅ 模式配置文件已加载');
            }

            // 加载模板配置文件
            const templatesConfigPath = path.join(this.configDir, 'templates.config.json');
            if (fs.existsSync(templatesConfigPath)) {
                const templatesConfig = JSON.parse(fs.readFileSync(templatesConfigPath, 'utf-8'));
                this.config.templates = templatesConfig;
                console.log('✅ 模板配置文件已加载');
            }

        } catch (error) {
            console.warn('⚠️ 配置文件加载失败，使用默认配置:', error.message);
        }
    }

    /**
     * 深度合并配置对象
     * @param {Object} target - 目标配置
     * @param {Object} source - 源配置
     */
    _mergeConfig(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this._mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    /**
     * 应用环境变量覆盖
     */
    _applyEnvironmentOverrides() {
        // 服务器配置
        if (process.env.MCP_PORT) {
            this.config.server.port = parseInt(process.env.MCP_PORT, 10);
        }
        if (process.env.MCP_HOST) {
            this.config.server.host = process.env.MCP_HOST;
        }

        // 日志级别
        if (process.env.MCP_LOG_LEVEL) {
            this.config.logLevel = process.env.MCP_LOG_LEVEL;
        }

        // API密钥 (可选)
        if (process.env.MCP_API_KEY) {
            this.config.apiKey = process.env.MCP_API_KEY;
        }

        // 开发模式
        if (process.env.NODE_ENV) {
            this.config.environment = process.env.NODE_ENV;
            this.config.isDevelopment = process.env.NODE_ENV === 'development';
            this.config.isProduction = process.env.NODE_ENV === 'production';
        }
    }

    /**
     * 获取配置值
     * @param {string} path - 配置路径 (用点分隔，如 'server.port')
     * @param {*} defaultValue - 默认值
     * @returns {*} 配置值
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * 设置配置值
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
    }

    /**
     * 获取服务器配置
     * @returns {Object} 服务器配置
     */
    getServerConfig() {
        return {
            port: this.get('server.port'),
            host: this.get('server.host'),
            cors: this.get('cors'),
            rateLimit: this.get('rateLimit')
        };
    }

    /**
     * 获取MCP配置
     * @returns {Object} MCP配置
     */
    getMCPConfig() {
        return {
            version: this.get('mcp.version'),
            supportedVersions: this.get('mcp.supportedVersions')
        };
    }

    /**
     * 获取提示词管理器配置
     * @returns {Object} 提示词管理器配置
     */
    getPromptConfig() {
        return {
            version: this.get('prompt.version'),
            cacheEnabled: this.get('prompt.cacheEnabled'),
            watchFiles: this.get('prompt.watchFiles'),
            cacheTTL: this.get('prompt.cacheTTL')
        };
    }

    /**
     * 获取分析器配置
     * @returns {Object} 分析器配置
     */
    getAnalyzersConfig() {
        return this.get('analyzers');
    }

    /**
     * 获取工作流配置
     * @returns {Object} 工作流配置
     */
    getWorkflowConfig() {
        return this.get('workflow');
    }

    /**
     * 验证配置
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];
        const warnings = [];

        // 验证端口号
        const port = this.get('server.port');
        if (!port || port < 1 || port > 65535) {
            errors.push('服务器端口必须在1-65535范围内');
        }

        // 验证主机地址
        const host = this.get('server.host');
        if (!host || typeof host !== 'string') {
            errors.push('服务器主机地址必须是字符串');
        }

        // 验证速率限制配置
        const rateLimit = this.get('rateLimit');
        if (rateLimit.windowMs < 1000) {
            warnings.push('速率限制窗口时间过短，建议至少1秒');
        }
        if (rateLimit.max < 1) {
            errors.push('速率限制最大请求数必须大于0');
        }

        // 验证缓存TTL
        const cacheTTL = this.get('prompt.cacheTTL');
        if (cacheTTL < 60000) {
            warnings.push('缓存TTL过短，建议至少1分钟');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 获取环境信息
     * @returns {Object} 环境信息
     */
    getEnvironmentInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            environment: this.get('environment', 'development'),
            isDevelopment: this.get('isDevelopment', true),
            isProduction: this.get('isProduction', false)
        };
    }

    /**
     * 获取完整配置
     * @returns {Object} 完整配置对象
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * 重载配置 (从环境变量)
     */
    reload() {
        this._applyEnvironmentOverrides();
    }

    /**
     * 检查是否启用了API密钥认证
     * @returns {boolean} 是否启用认证
     */
    isAuthEnabled() {
        return !!this.get('apiKey');
    }

    /**
     * 验证API密钥
     * @param {string} providedKey - 提供的密钥
     * @returns {boolean} 是否有效
     */
    validateApiKey(providedKey) {
        const configuredKey = this.get('apiKey');
        return configuredKey && providedKey === configuredKey;
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        const validation = this.validate();
        const envInfo = this.getEnvironmentInfo();
        
        return {
            validation,
            environment: envInfo,
            configSources: {
                defaults: true,
                environment: true,
                file: false // 暂未实现文件配置
            },
            timestamp: new Date().toISOString()
        };
    }
}

export default ConfigService;