#!/usr/bin/env node

/**
 * 多语言兼容性测试执行器
 * 简化版测试，直接使用当前项目作为测试对象
 */

import { promises as fs } from 'fs';
import path from 'path';
import LanguageDetector from './server/language/detector.js';
import { FileContentAnalyzer } from './server/analyzers/file-content-analyzer.js';
import { ProjectScanner } from './server/analyzers/project-scanner.js';

class QuickMultiLanguageTest {
  constructor() {
    this.languageDetector = new LanguageDetector();
    this.fileContentAnalyzer = new FileContentAnalyzer({
      maxFilesToAnalyze: 20, // 限制文件数量以加快测试
      maxFileSize: 500 * 1024 // 500KB
    });
    this.projectScanner = new ProjectScanner();
    this.testResults = [];
  }

  async runQuickTest() {
    console.log('🚀 开始多语言兼容性快速测试...\n');

    // 测试1: 当前项目 (Node.js项目)
    await this.testProject('.', 'mg_kiro MCP Server (Node.js项目)', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['express'],
      minConfidence: 70
    });

    // 测试2: 创建简单Python项目测试
    const pythonProject = await this.createSimplePythonProject();
    await this.testProject(pythonProject, 'Python Flask项目', {
      expectedLanguage: 'python',
      expectedFrameworks: ['flask'],
      minConfidence: 80
    });

    // 测试3: 创建简单Vue项目测试
    const vueProject = await this.createSimpleVueProject();
    await this.testProject(vueProject, 'Vue.js项目', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['vue'],
      minConfidence: 70 // Vue项目通常包含JS配置文件，所以置信度会较低
    });

    // 生成报告
    this.generateReport();

    // 清理临时项目
    await this.cleanup();
  }

  async testProject(projectPath, projectName, expectations) {
    console.log(`📋 测试项目: ${projectName}`);
    console.log(`   路径: ${projectPath}`);

    try {
      // 1. 项目扫描
      console.log('   🔍 扫描项目结构...');
      const structureResult = await this.projectScanner.scanProject(projectPath);
      console.log(`   📁 发现 ${structureResult.structure?.totalFiles || 0} 个文件（根目录: ${structureResult.structure?.files?.length || 0}）`);

      // 2. 语言检测
      console.log('   🧠 检测项目语言...');
      const languageResult = await this.languageDetector.detectLanguage(projectPath);
      console.log(`   🎯 检测结果: ${languageResult.language} (${languageResult.confidence}%)`);

      // 3. 文件内容分析
      console.log('   📖 分析文件内容...');
      const contentResult = await this.fileContentAnalyzer.analyzeFiles({
        projectPath: path.resolve(projectPath),
        structure: structureResult.structure, // 传递结构对象而不是整个结果
        languageData: {
          primaryLanguage: languageResult.language,
          confidence: languageResult.confidence,
          frameworks: languageResult.frameworks,
          techStack: languageResult
        }
      });

      if (contentResult.success) {
        console.log(`   ✅ 成功分析 ${contentResult.analysis.totalFilesAnalyzed} 个文件`);
      } else {
        console.log(`   ❌ 文件分析失败: ${contentResult.error}`);
      }

      // 4. 验证结果
      const testResult = this.validateResult(projectName, expectations, languageResult, contentResult);
      this.testResults.push(testResult);

      // 5. 显示详细结果
      if (testResult.passed) {
        console.log(`   🎉 ${projectName} 测试通过!\n`);
      } else {
        console.log(`   💥 ${projectName} 测试失败:`);
        testResult.failures.forEach(failure => {
          console.log(`      - ${failure}`);
        });
        console.log('');
      }

      // 显示检测到的框架
      if (languageResult.frameworks?.length > 0) {
        console.log(`   📚 检测到的框架:`);
        languageResult.frameworks.forEach(framework => {
          const name = framework.name || framework;
          const confidence = framework.confidence ? ` (${framework.confidence.toFixed(1)}%)` : '';
          console.log(`      - ${name}${confidence}`);
        });
        console.log('');
      }

    } catch (error) {
      console.error(`   💥 测试项目时发生错误: ${error.message}\n`);
      this.testResults.push({
        projectName,
        passed: false,
        error: error.message
      });
    }
  }

  validateResult(projectName, expectations, languageResult, contentResult) {
    const failures = [];

    // 检查语言检测
    if (languageResult.language !== expectations.expectedLanguage) {
      // 允许javascript/typescript互换
      const allowedAlternatives = {
        'javascript': ['typescript'],
        'typescript': ['javascript']
      };
      const alternatives = allowedAlternatives[expectations.expectedLanguage] || [];
      
      if (!alternatives.includes(languageResult.language)) {
        failures.push(`语言检测错误: 期望 ${expectations.expectedLanguage}, 实际 ${languageResult.language}`);
      }
    }

    // 检查置信度
    if (languageResult.confidence < expectations.minConfidence) {
      failures.push(`置信度过低: ${languageResult.confidence}% < ${expectations.minConfidence}%`);
    }

    // 检查框架检测 (简化版)
    if (expectations.expectedFrameworks && expectations.expectedFrameworks.length > 0) {
      const detectedFrameworks = languageResult.frameworks || [];
      
      const hasExpectedFramework = expectations.expectedFrameworks.some(expected => 
        detectedFrameworks.some(detected => {
          const frameworkName = detected.name || detected;
          return frameworkName.toLowerCase().includes(expected.toLowerCase());
        })
      );
      
      if (!hasExpectedFramework) {
        const detectedNames = detectedFrameworks.map(f => f.name || f).join(', ');
        failures.push(`未检测到期望的框架: ${expectations.expectedFrameworks.join(', ')}，实际检测到: ${detectedNames}`);
      }
    }

    // 检查文件分析
    if (!contentResult || !contentResult.success) {
      failures.push(`文件内容分析失败: ${contentResult?.error || '未知错误'}`);
    }

    return {
      projectName,
      passed: failures.length === 0,
      failures,
      languageResult,
      contentResult
    };
  }

  async createSimplePythonProject() {
    const projectPath = './temp_python_test';
    await fs.mkdir(projectPath, { recursive: true });

    // 创建简单的Flask项目文件
    const files = {
      'app.py': `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({"message": "Hello from Flask!"})

@app.route('/users')
def users():
    return jsonify({"users": ["Alice", "Bob", "Charlie"]})

if __name__ == '__main__':
    app.run(debug=True)`,

      'requirements.txt': `Flask==2.3.3
requests==2.31.0`,

      'config.py': `class Config:
    SECRET_KEY = 'your-secret-key'
    DEBUG = True`,

      'models.py': `from dataclasses import dataclass
from typing import List

@dataclass
class User:
    id: int
    name: str
    email: str

class UserRepository:
    def __init__(self):
        self.users: List[User] = []
    
    def add_user(self, user: User) -> User:
        self.users.append(user)
        return user`
    };

    for (const [fileName, content] of Object.entries(files)) {
      await fs.writeFile(path.join(projectPath, fileName), content);
    }

    return projectPath;
  }

  async createSimpleVueProject() {
    const projectPath = './temp_vue_test';
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'src/components'), { recursive: true });

    // 创建简单的Vue 3项目文件
    const files = {
      'package.json': JSON.stringify({
        name: "simple-vue-test",
        version: "0.1.0",
        private: true,
        scripts: {
          serve: "vue-cli-service serve",
          build: "vue-cli-service build"
        },
        dependencies: {
          "core-js": "^3.8.3",
          "vue": "^3.2.13"
        },
        devDependencies: {
          "@vue/cli-service": "~5.0.0"
        }
      }, null, 2),

      'src/main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,

      'src/App.vue': `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  }
}
</script>`,

      'src/components/HelloWorld.vue': `<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      For a guide and recipes on how to configure / customize this project,<br>
      check out the
      <a href="https://cli.vuejs.org" target="_blank" rel="noopener">vue-cli documentation</a>.
    </p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  setup() {
    const count = ref(0)
    
    const increment = () => {
      count.value++
    }
    
    return {
      count,
      increment
    }
  }
}
</script>`,

      'vue.config.js': `const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})`
    };

    for (const [fileName, content] of Object.entries(files)) {
      await fs.writeFile(path.join(projectPath, fileName), content);
    }

    return projectPath;
  }

  generateReport() {
    console.log('\n📊 多语言兼容性测试报告');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    console.log(`总测试项目数: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${successRate}%\n`);

    // 详细结果
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.projectName}`);
      
      if (result.languageResult) {
        console.log(`   语言: ${result.languageResult.language} (${result.languageResult.confidence}%)`);
        
        if (result.languageResult.frameworks?.length > 0) {
          const frameworks = result.languageResult.frameworks
            .map(f => f.name || f)
            .join(', ');
          console.log(`   框架: ${frameworks}`);
        }
      }
      
      if (result.contentResult && result.contentResult.success) {
        console.log(`   文件分析: ${result.contentResult.analysis.totalFilesAnalyzed} 个文件`);
      }
      
      if (!result.passed) {
        result.failures?.forEach(failure => {
          console.log(`   ⚠️  ${failure}`);
        });
        if (result.error) {
          console.log(`   💥 错误: ${result.error}`);
        }
      }
      console.log('');
    });

    if (failedTests > 0) {
      console.log('🔧 需要改进的问题:');
      const allFailures = this.testResults.filter(r => !r.passed)
        .flatMap(r => r.failures || []);
      
      const uniqueFailures = [...new Set(allFailures)];
      uniqueFailures.forEach(failure => {
        console.log(`  • ${failure}`);
      });
    }

    console.log('\n✨ 测试完成!');
  }

  async cleanup() {
    console.log('\n🧹 清理临时文件...');
    try {
      await fs.rm('./temp_python_test', { recursive: true, force: true });
      await fs.rm('./temp_vue_test', { recursive: true, force: true });
      console.log('✅ 清理完成');
    } catch (error) {
      console.log('⚠️ 清理时出现警告:', error.message);
    }
  }
}

// 运行测试
const testRunner = new QuickMultiLanguageTest();
testRunner.runQuickTest().catch(console.error);