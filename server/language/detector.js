/**
 * 语言识别引擎
 * 通过文件扩展名、配置文件、目录结构等自动识别项目语言
 */

const fs = require('fs');
const path = require('path');

class LanguageDetector {
    constructor() {
        this.languages = {
            javascript: {
                name: 'JavaScript/Node.js',
                weight: 0,
                extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
                configFiles: ['package.json', 'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'],
                directories: ['node_modules', 'src', 'lib', 'dist', 'public'],
                frameworks: {
                    'react': ['src/App.jsx', 'src/App.tsx', 'public/index.html'],
                    'vue': ['src/App.vue', 'vue.config.js'],
                    'angular': ['angular.json', 'src/app/app.module.ts'],
                    'express': ['app.js', 'server.js', 'index.js'],
                    'nextjs': ['next.config.js', 'pages', 'app']
                }
            },
            python: {
                name: 'Python',
                weight: 0,
                extensions: ['.py', '.pyw', '.pyx', '.pyi'],
                configFiles: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile', 'environment.yml'],
                directories: ['venv', '.env', '__pycache__', 'site-packages'],
                frameworks: {
                    'django': ['manage.py', 'settings.py', 'urls.py'],
                    'flask': ['app.py', 'wsgi.py', 'requirements.txt'],
                    'fastapi': ['main.py', 'app.py', 'requirements.txt']
                }
            },
            java: {
                name: 'Java',
                weight: 0,
                extensions: ['.java', '.jar', '.war'],
                configFiles: ['pom.xml', 'build.gradle', 'gradle.properties', 'settings.gradle'],
                directories: ['src/main/java', 'src/test/java', 'target', 'build', '.gradle'],
                frameworks: {
                    'spring': ['src/main/java', 'application.properties', 'application.yml'],
                    'maven': ['pom.xml', 'src/main'],
                    'gradle': ['build.gradle', 'src/main']
                }
            },
            go: {
                name: 'Go',
                weight: 0,
                extensions: ['.go'],
                configFiles: ['go.mod', 'go.sum', 'Gopkg.toml', 'Gopkg.lock'],
                directories: ['vendor', 'cmd', 'pkg', 'internal'],
                frameworks: {
                    'gin': ['main.go', 'go.mod'],
                    'echo': ['main.go', 'go.mod'],
                    'fiber': ['main.go', 'go.mod']
                }
            },
            rust: {
                name: 'Rust',
                weight: 0,
                extensions: ['.rs'],
                configFiles: ['Cargo.toml', 'Cargo.lock'],
                directories: ['src', 'target', 'tests'],
                frameworks: {
                    'actix': ['Cargo.toml', 'src/main.rs'],
                    'rocket': ['Cargo.toml', 'src/main.rs'],
                    'warp': ['Cargo.toml', 'src/main.rs']
                }
            },
            csharp: {
                name: 'C#/.NET',
                weight: 0,
                extensions: ['.cs', '.csproj', '.sln', '.vb'],
                configFiles: ['*.csproj', '*.sln', 'Directory.Build.props', 'global.json'],
                directories: ['bin', 'obj', 'Properties', 'Controllers', 'Models'],
                frameworks: {
                    'aspnet': ['*.csproj', 'Program.cs', 'Startup.cs'],
                    'blazor': ['*.csproj', 'App.razor', 'MainLayout.razor'],
                    'wpf': ['*.csproj', 'App.xaml', 'MainWindow.xaml']
                }
            }
        };
    }

    /**
     * 检测项目语言
     * @param {string} projectPath - 项目根目录路径
     * @returns {Object} 检测结果
     */
    async detectLanguage(projectPath) {
        if (!fs.existsSync(projectPath)) {
            throw new Error(`项目路径不存在: ${projectPath}`);
        }

        // 重置权重
        this.resetWeights();

        try {
            // 扫描项目文件
            await this.scanProject(projectPath);
            
            // 计算最终结果
            const result = this.calculateResult();
            
            // 检测框架
            const frameworks = await this.detectFrameworks(projectPath, result.language);
            
            return {
                language: result.language,
                confidence: result.confidence,
                frameworks: frameworks,
                suggestions: this.getSuggestions(result.language),
                details: this.getLanguageDetails(result.language)
            };
        } catch (error) {
            return {
                language: 'unknown',
                confidence: 0,
                error: error.message,
                fallback: 'common'
            };
        }
    }

    /**
     * 重置所有语言权重
     */
    resetWeights() {
        Object.keys(this.languages).forEach(lang => {
            this.languages[lang].weight = 0;
        });
    }

    /**
     * 扫描项目文件和目录
     * @param {string} projectPath - 项目路径
     */
    async scanProject(projectPath) {
        const files = await this.getProjectFiles(projectPath);
        
        for (const file of files) {
            this.analyzeFile(file);
        }
    }

    /**
     * 获取项目文件列表
     * @param {string} projectPath - 项目路径
     * @returns {Array} 文件列表
     */
    async getProjectFiles(projectPath, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth) return [];
        
        const files = [];
        const entries = fs.readdirSync(projectPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(projectPath, entry.name);
            
            // 跳过隐藏文件和常见的忽略目录
            if (entry.name.startsWith('.') && !this.isImportantHiddenFile(entry.name)) {
                continue;
            }
            if (this.shouldIgnoreDirectory(entry.name)) {
                continue;
            }

            if (entry.isDirectory()) {
                // 检查是否是重要目录
                this.analyzeDirectory(entry.name);
                
                // 递归扫描子目录
                const subFiles = await this.getProjectFiles(fullPath, maxDepth, currentDepth + 1);
                files.push(...subFiles);
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * 分析单个文件
     * @param {string} filePath - 文件路径
     */
    analyzeFile(filePath) {
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath);

        // 检查文件扩展名
        Object.keys(this.languages).forEach(lang => {
            const langConfig = this.languages[lang];
            
            if (langConfig.extensions.includes(fileExt)) {
                this.languages[lang].weight += 10;
            }
            
            if (langConfig.configFiles.includes(fileName) || 
                langConfig.configFiles.some(pattern => this.matchPattern(fileName, pattern))) {
                this.languages[lang].weight += 50;
            }
        });
    }

    /**
     * 分析目录名
     * @param {string} dirName - 目录名
     */
    analyzeDirectory(dirName) {
        Object.keys(this.languages).forEach(lang => {
            const langConfig = this.languages[lang];
            
            if (langConfig.directories.includes(dirName)) {
                this.languages[lang].weight += 20;
            }
        });
    }

    /**
     * 检测项目使用的框架
     * @param {string} projectPath - 项目路径
     * @param {string} language - 已检测的语言
     * @returns {Array} 框架列表
     */
    async detectFrameworks(projectPath, language) {
        if (!this.languages[language]) {
            return [];
        }

        const frameworks = [];
        const langConfig = this.languages[language];

        for (const [frameworkName, indicators] of Object.entries(langConfig.frameworks)) {
            let score = 0;
            
            for (const indicator of indicators) {
                const indicatorPath = path.join(projectPath, indicator);
                if (fs.existsSync(indicatorPath)) {
                    score += 1;
                }
            }
            
            if (score > 0) {
                frameworks.push({
                    name: frameworkName,
                    confidence: (score / indicators.length) * 100
                });
            }
        }

        return frameworks.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * 计算最终检测结果
     * @returns {Object} 检测结果
     */
    calculateResult() {
        const results = Object.keys(this.languages)
            .map(lang => ({
                language: lang,
                weight: this.languages[lang].weight,
                name: this.languages[lang].name
            }))
            .filter(result => result.weight > 0)
            .sort((a, b) => b.weight - a.weight);

        if (results.length === 0) {
            return {
                language: 'unknown',
                confidence: 0
            };
        }

        const topResult = results[0];
        const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
        
        return {
            language: topResult.language,
            confidence: Math.round((topResult.weight / totalWeight) * 100),
            alternatives: results.slice(1, 3)
        };
    }

    /**
     * 获取语言建议
     * @param {string} language - 语言类型
     * @returns {Array} 建议列表
     */
    getSuggestions(language) {
        const suggestions = {
            javascript: [
                '考虑使用 TypeScript 提升代码质量',
                '建议配置 ESLint 和 Prettier',
                '使用 package-lock.json 锁定依赖版本'
            ],
            python: [
                '建议使用虚拟环境管理依赖',
                '考虑使用 Poetry 进行包管理',
                '添加类型提示提升代码可读性'
            ],
            java: [
                '建议使用 Maven 或 Gradle 管理构建',
                '考虑使用 Spring Boot 框架',
                '添加单元测试覆盖'
            ],
            go: [
                '确保使用 go.mod 管理模块',
                '建议使用 gofmt 格式化代码',
                '考虑添加 Makefile 简化构建'
            ],
            rust: [
                '使用 cargo fmt 格式化代码',
                '建议添加 clippy 检查',
                '考虑使用 cargo-audit 安全检查'
            ],
            csharp: [
                '建议使用最新 .NET 版本',
                '考虑使用 Entity Framework',
                '添加单元测试项目'
            ]
        };
        
        return suggestions[language] || [];
    }

    /**
     * 获取语言详细信息
     * @param {string} language - 语言类型
     * @returns {Object} 语言详情
     */
    getLanguageDetails(language) {
        return this.languages[language] || null;
    }

    /**
     * 模式匹配工具函数
     * @param {string} str - 待匹配字符串
     * @param {string} pattern - 模式
     * @returns {boolean} 是否匹配
     */
    matchPattern(str, pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'), 'i');
        return regex.test(str);
    }

    /**
     * 检查是否是重要的隐藏文件
     * @param {string} fileName - 文件名
     * @returns {boolean} 是否重要
     */
    isImportantHiddenFile(fileName) {
        const importantFiles = ['.env', '.gitignore', '.dockerignore', '.nvmrc'];
        return importantFiles.includes(fileName);
    }

    /**
     * 检查是否应该忽略的目录
     * @param {string} dirName - 目录名
     * @returns {boolean} 是否忽略
     */
    shouldIgnoreDirectory(dirName) {
        const ignoreList = [
            'node_modules', '.git', '__pycache__', '.pytest_cache',
            'target', 'build', 'dist', '.vscode', '.idea',
            'coverage', '.nyc_output', 'logs'
        ];
        return ignoreList.includes(dirName);
    }
}

module.exports = LanguageDetector;