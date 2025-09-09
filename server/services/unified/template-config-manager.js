/**
 * TemplateConfigManager - 统一模板配置管理系统
 * 整合分散的配置文件，提供统一的配置接口
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateConfigManager {
    constructor(options = {}) {
        this.basePath = options.basePath || path.join(__dirname, '../../..');
        this.configCache = new Map();
        this.cacheEnabled = options.cacheEnabled !== false;
        this.version = '3.0.0';
        
        // 配置文件路径
        this.configPaths = {
            main: path.join(this.basePath, 'config', 'template-system.config.json'),
            templates: path.join(this.basePath, 'config', 'templates.config.json'),
            languages: path.join(this.basePath, 'prompts', 'languages'),
            legacy: path.join(this.basePath, 'config', 'mcp.config.json')
        };

        this.defaultConfig = this._getDefaultConfig();
        this.mergedConfig = null;
        
        this._initialize();
    }

    /**
     * 初始化配置管理器
     * @private
     */
    _initialize() {
        try {
            this.mergedConfig = this._loadAndMergeConfigs();
            console.log('[TemplateConfigManager] Initialized successfully');
        } catch (error) {
            console.warn('[TemplateConfigManager] Initialize failed, using defaults:', error.message);
            this.mergedConfig = this.defaultConfig;
        }
    }

    /**
     * 获取默认配置
     * @private
     */
    _getDefaultConfig() {
        return {
            templateSystem: {
                version: this.version,
                enableCache: true,
                cacheSettings: {
                    enabled: true,
                    ttl: 3600000, // 1 hour
                    maxSize: 200
                },
                intelligence: {
                    enabled: true,
                    languageDetection: true,
                    confidenceThresholds: {
                        high: 0.8,
                        medium: 0.6,
                        low: 0.4
                    },
                    languageWeights: {
                        'javascript': 0.95,
                        'typescript': 0.92,
                        'python': 0.90,
                        'java': 0.85,
                        'go': 0.80,
                        'rust': 0.75,
                        'csharp': 0.80,
                        'general': 0.50
                    },
                    modeWeights: {
                        'create': 0.95,
                        'fix': 0.90,
                        'init': 0.85,
                        'analyze': 0.75
                    },
                    strategies: {
                        default: 'intelligent',
                        fallback: 'direct',
                        available: ['direct', 'intelligent', 'language-specific', 'fallback']
                    }
                },
                paths: {
                    templates: './prompts/templates',
                    languages: './prompts/languages',
                    modes: './prompts/modes',
                    snippets: './prompts/snippets'
                },
                categoryMapping: {
                    'modes': 'modes',
                    'analysis': 'templates/analysis',
                    'generation': 'templates',
                    'snippets': 'snippets',
                    'languages': 'languages',
                    // 向后兼容映射
                    'analysis-templates': 'templates/analysis',
                    'document-templates': 'templates',
                    'templates': 'templates'
                },
                defaultVariables: {
                    'timestamp': () => new Date().toISOString(),
                    'version': () => this.version,
                    'server_name': () => 'mg_kiro MCP Server',
                    'project_name': () => path.basename(process.cwd())
                }
            },
            supportedLanguages: {
                javascript: {
                    extensions: ['.js', '.mjs', '.jsx'],
                    configFiles: ['package.json', 'node_modules'],
                    frameworks: ['react', 'vue', 'angular', 'express', 'nestjs'],
                    weight: 0.95
                },
                typescript: {
                    extensions: ['.ts', '.tsx'],
                    configFiles: ['tsconfig.json', 'package.json'],
                    frameworks: ['react', 'vue', 'angular', 'express', 'nestjs'],
                    weight: 0.92
                },
                python: {
                    extensions: ['.py', '.pyw'],
                    configFiles: ['requirements.txt', 'setup.py', 'pyproject.toml'],
                    frameworks: ['django', 'flask', 'fastapi', 'pyramid'],
                    weight: 0.90
                },
                java: {
                    extensions: ['.java'],
                    configFiles: ['pom.xml', 'build.gradle', 'gradle.properties'],
                    frameworks: ['spring', 'springboot', 'struts', 'hibernate'],
                    weight: 0.85
                },
                go: {
                    extensions: ['.go'],
                    configFiles: ['go.mod', 'go.sum'],
                    frameworks: ['gin', 'echo', 'fiber', 'beego'],
                    weight: 0.80
                },
                rust: {
                    extensions: ['.rs'],
                    configFiles: ['Cargo.toml', 'Cargo.lock'],
                    frameworks: ['axum', 'actix-web', 'warp', 'rocket'],
                    weight: 0.75
                },
                csharp: {
                    extensions: ['.cs'],
                    configFiles: ['.csproj', '.sln'],
                    frameworks: ['aspnet', 'blazor', 'unity', 'xamarin'],
                    weight: 0.80
                }
            },
            modes: {
                init: {
                    description: '项目初始化模式',
                    defaultTemplates: {
                        'scan_structure': 'system-architecture-analysis',
                        'generate_architecture': 'system-architecture-generation',
                        'analyze_modules': 'module-analysis'
                    },
                    weight: 0.85
                },
                create: {
                    description: '功能创建模式',
                    defaultTemplates: {
                        'plan_feature': 'feasibility-analysis',
                        'create_module': 'module-documentation-generation'
                    },
                    weight: 0.95
                },
                fix: {
                    description: '问题修复模式',
                    defaultTemplates: {
                        'report_issue': 'impact-assessment-analysis',
                        'diagnose_issue': 'dependency-analysis'
                    },
                    weight: 0.90
                },
                analyze: {
                    description: '代码分析模式',
                    defaultTemplates: {
                        'analyze_quality': 'code-quality-analysis',
                        'analyze_security': 'security-analysis'
                    },
                    weight: 0.75
                }
            }
        };
    }

    /**
     * 加载并合并所有配置文件
     * @private
     */
    _loadAndMergeConfigs() {
        let mergedConfig = JSON.parse(JSON.stringify(this.defaultConfig));

        // 加载主配置文件
        const mainConfig = this._loadJsonConfig(this.configPaths.main);
        if (mainConfig) {
            mergedConfig = this._mergeDeep(mergedConfig, mainConfig);
        }

        // 加载模板配置文件
        const templatesConfig = this._loadJsonConfig(this.configPaths.templates);
        if (templatesConfig) {
            mergedConfig.templateSystem.templates = templatesConfig;
        }

        // 加载语言配置
        const languageConfigs = this._loadLanguageConfigs();
        if (languageConfigs && Object.keys(languageConfigs).length > 0) {
            mergedConfig.supportedLanguages = this._mergeDeep(
                mergedConfig.supportedLanguages, 
                languageConfigs
            );
        }

        // 加载旧配置以保持兼容性
        const legacyConfig = this._loadJsonConfig(this.configPaths.legacy);
        if (legacyConfig) {
            mergedConfig = this._mergeLegacyConfig(mergedConfig, legacyConfig);
        }

        return mergedConfig;
    }

    /**
     * 加载JSON配置文件
     * @private
     */
    _loadJsonConfig(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.warn(`[TemplateConfigManager] Failed to load config ${filePath}:`, error.message);
        }
        return null;
    }

    /**
     * 加载语言特定配置
     * @private
     */
    _loadLanguageConfigs() {
        const languageConfigs = {};
        
        try {
            if (!fs.existsSync(this.configPaths.languages)) {
                return languageConfigs;
            }

            const languageDirs = fs.readdirSync(this.configPaths.languages, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const langDir of languageDirs) {
                if (langDir === 'common') continue; // 跳过common目录
                
                const configPath = path.join(this.configPaths.languages, langDir, 'config.json');
                const defaultsPath = path.join(this.configPaths.languages, langDir, 'defaults.json');
                
                const config = this._loadJsonConfig(configPath);
                const defaults = this._loadJsonConfig(defaultsPath);
                
                if (config || defaults) {
                    languageConfigs[langDir] = {
                        ...(config || {}),
                        defaults: defaults?.template_variables || {}
                    };
                }
            }
        } catch (error) {
            console.warn('[TemplateConfigManager] Failed to load language configs:', error.message);
        }

        return languageConfigs;
    }

    /**
     * 合并旧配置以保持兼容性
     * @private
     */
    _mergeLegacyConfig(mergedConfig, legacyConfig) {
        // 从旧的MCP配置中提取相关设置
        if (legacyConfig.templates) {
            mergedConfig.templateSystem.templates = {
                ...mergedConfig.templateSystem.templates,
                ...legacyConfig.templates
            };
        }

        if (legacyConfig.cache) {
            mergedConfig.templateSystem.cacheSettings = {
                ...mergedConfig.templateSystem.cacheSettings,
                ...legacyConfig.cache
            };
        }

        return mergedConfig;
    }

    /**
     * 深度合并对象
     * @private
     */
    _mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._mergeDeep(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 公共API方法
     */

    /**
     * 获取完整配置
     */
    getConfig() {
        return this.mergedConfig;
    }

    /**
     * 获取模板系统配置
     */
    getTemplateSystemConfig() {
        return this.mergedConfig?.templateSystem || this.defaultConfig.templateSystem;
    }

    /**
     * 获取语言配置
     */
    getLanguageConfig(language = null) {
        if (language) {
            return this.mergedConfig?.supportedLanguages?.[language] || null;
        }
        return this.mergedConfig?.supportedLanguages || this.defaultConfig.supportedLanguages;
    }

    /**
     * 获取模式配置
     */
    getModeConfig(mode = null) {
        if (mode) {
            return this.mergedConfig?.modes?.[mode] || null;
        }
        return this.mergedConfig?.modes || this.defaultConfig.modes;
    }

    /**
     * 获取缓存配置
     */
    getCacheConfig() {
        return this.mergedConfig?.templateSystem?.cacheSettings || this.defaultConfig.templateSystem.cacheSettings;
    }

    /**
     * 获取智能配置
     */
    getIntelligenceConfig() {
        return this.mergedConfig?.templateSystem?.intelligence || this.defaultConfig.templateSystem.intelligence;
    }

    /**
     * 获取路径配置
     */
    getPathConfig() {
        return this.mergedConfig?.templateSystem?.paths || this.defaultConfig.templateSystem.paths;
    }

    /**
     * 获取类别映射配置
     */
    getCategoryMapping() {
        return this.mergedConfig?.templateSystem?.categoryMapping || this.defaultConfig.templateSystem.categoryMapping;
    }

    /**
     * 获取默认变量配置
     */
    getDefaultVariables() {
        return this.mergedConfig?.templateSystem?.defaultVariables || this.defaultConfig.templateSystem.defaultVariables;
    }

    /**
     * 获取特定配置值
     */
    get(path, defaultValue = null) {
        try {
            const keys = path.split('.');
            let current = this.mergedConfig;
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    return defaultValue;
                }
            }
            
            return current;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * 设置配置值（仅内存中）
     */
    set(path, value) {
        try {
            const keys = path.split('.');
            let current = this.mergedConfig;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[keys[keys.length - 1]] = value;
            return true;
        } catch (error) {
            console.error('[TemplateConfigManager] Set config failed:', error.message);
            return false;
        }
    }

    /**
     * 验证配置完整性
     */
    validateConfig() {
        const issues = [];
        const config = this.mergedConfig;

        // 验证必需的配置项
        if (!config.templateSystem) {
            issues.push('Missing templateSystem configuration');
        }

        if (!config.supportedLanguages || Object.keys(config.supportedLanguages).length === 0) {
            issues.push('No supported languages configured');
        }

        if (!config.modes || Object.keys(config.modes).length === 0) {
            issues.push('No modes configured');
        }

        // 验证路径配置
        const paths = config.templateSystem?.paths;
        if (paths) {
            for (const [key, relativePath] of Object.entries(paths)) {
                const fullPath = path.resolve(this.basePath, relativePath);
                if (!fs.existsSync(fullPath)) {
                    issues.push(`Path does not exist: ${key} -> ${fullPath}`);
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * 保存配置到文件
     */
    async saveConfig(configPath = null) {
        const savePath = configPath || this.configPaths.main;
        
        try {
            // 确保目录存在
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 保存配置
            fs.writeFileSync(savePath, JSON.stringify(this.mergedConfig, null, 2), 'utf8');
            console.log(`[TemplateConfigManager] Config saved to ${savePath}`);
            return true;
        } catch (error) {
            console.error('[TemplateConfigManager] Save config failed:', error.message);
            return false;
        }
    }

    /**
     * 重新加载配置
     */
    reload() {
        try {
            this.configCache.clear();
            this.mergedConfig = this._loadAndMergeConfigs();
            console.log('[TemplateConfigManager] Configuration reloaded');
            return true;
        } catch (error) {
            console.error('[TemplateConfigManager] Reload failed:', error.message);
            return false;
        }
    }

    /**
     * 获取配置状态
     */
    getStatus() {
        const validation = this.validateConfig();
        
        return {
            version: this.version,
            initialized: !!this.mergedConfig,
            configFiles: {
                main: fs.existsSync(this.configPaths.main),
                templates: fs.existsSync(this.configPaths.templates),
                languages: fs.existsSync(this.configPaths.languages),
                legacy: fs.existsSync(this.configPaths.legacy)
            },
            validation: validation,
            stats: {
                supportedLanguages: Object.keys(this.mergedConfig?.supportedLanguages || {}).length,
                modes: Object.keys(this.mergedConfig?.modes || {}).length,
                cacheEnabled: this.mergedConfig?.templateSystem?.cacheSettings?.enabled || false,
                intelligenceEnabled: this.mergedConfig?.templateSystem?.intelligence?.enabled || false
            }
        };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.configCache.clear();
        console.log('[TemplateConfigManager] Cache cleared');
    }

    /**
     * 生成配置模板文件
     */
    generateConfigTemplate() {
        const template = {
            templateSystem: {
                version: "3.0.0",
                enableCache: true,
                cacheSettings: {
                    enabled: true,
                    ttl: 3600000,
                    maxSize: 200
                },
                intelligence: {
                    enabled: true,
                    languageDetection: true,
                    strategies: {
                        default: "intelligent",
                        fallback: "direct"
                    }
                },
                paths: {
                    templates: "./prompts/templates",
                    languages: "./prompts/languages",
                    modes: "./prompts/modes"
                }
            }
        };

        return JSON.stringify(template, null, 2);
    }
}

export default TemplateConfigManager;