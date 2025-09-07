/**
 * 多语言兼容性测试套件
 * 重点测试: Python, Vue.js, React, TypeScript, Node.js等现代技术栈
 * 
 * 测试场景:
 * 1. Python项目 (Django/Flask/FastAPI)
 * 2. Vue.js项目 (Vue3 + TypeScript + Vite)
 * 3. React项目 (Next.js + TypeScript)
 * 4. Node.js项目 (Express + TypeScript)
 * 5. 混合技术栈项目
 */

import { promises as fs } from 'fs';
import path from 'path';
import { MCPServer } from '../server/mcp-server.js';
import { EnhancedLanguageDetector } from '../server/language/enhanced-language-detector.js';
import { FileContentAnalyzer } from '../server/analyzers/file-content-analyzer.js';
import { ProjectScanner } from '../server/analyzers/project-scanner.js';

class MultiLanguageTestRunner {
  constructor() {
    this.testResults = [];
    this.tempProjectsPath = path.join(process.cwd(), 'temp_test_projects');
    this.languageDetector = new EnhancedLanguageDetector();
    this.fileContentAnalyzer = new FileContentAnalyzer();
    this.projectScanner = new ProjectScanner();
  }

  /**
   * 运行所有多语言测试
   */
  async runAllTests() {
    console.log('🚀 开始多语言兼容性测试...\n');
    
    try {
      // 准备测试环境
      await this.setupTestEnvironment();
      
      // 运行各种语言测试
      await this.testPythonProjects();
      await this.testVueJSProjects();
      await this.testReactProjects();
      await this.testNodeJSProjects();
      await this.testMixedTechStackProjects();
      
      // 生成测试报告
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error);
    } finally {
      // 清理测试环境
      await this.cleanupTestEnvironment();
    }
  }

  /**
   * 设置测试环境
   */
  async setupTestEnvironment() {
    console.log('📁 设置测试环境...');
    
    // 创建临时项目目录
    try {
      await fs.mkdir(this.tempProjectsPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Python项目测试
   */
  async testPythonProjects() {
    console.log('🐍 测试Python项目兼容性...');
    
    // 测试场景1: Django项目
    const djangoProject = await this.createDjangoTestProject();
    await this.runLanguageDetectionTest(djangoProject, 'Django项目', {
      expectedLanguage: 'python',
      expectedFrameworks: ['django'],
      minConfidence: 85
    });
    
    // 测试场景2: Flask项目  
    const flaskProject = await this.createFlaskTestProject();
    await this.runLanguageDetectionTest(flaskProject, 'Flask项目', {
      expectedLanguage: 'python',
      expectedFrameworks: ['flask'],
      minConfidence: 80
    });
    
    // 测试场景3: FastAPI项目
    const fastapiProject = await this.createFastAPITestProject();
    await this.runLanguageDetectionTest(fastapiProject, 'FastAPI项目', {
      expectedLanguage: 'python',
      expectedFrameworks: ['fastapi'],
      minConfidence: 80
    });
    
    // 测试场景4: 数据科学项目 (Jupyter + pandas)
    const dataScienceProject = await this.createDataScienceTestProject();
    await this.runLanguageDetectionTest(dataScienceProject, 'Python数据科学项目', {
      expectedLanguage: 'python',
      expectedFrameworks: ['jupyter', 'pandas'],
      minConfidence: 75
    });
  }

  /**
   * Vue.js项目测试
   */
  async testVueJSProjects() {
    console.log('🖖 测试Vue.js项目兼容性...');
    
    // 测试场景1: Vue 3 + TypeScript + Vite
    const vue3Project = await this.createVue3TypeScriptProject();
    await this.runLanguageDetectionTest(vue3Project, 'Vue 3 + TypeScript项目', {
      expectedLanguage: 'javascript', // 可能是typescript
      expectedFrameworks: ['vue', 'vite'],
      minConfidence: 80
    });
    
    // 测试场景2: Vue 3 + Composition API
    const vueCompositionProject = await this.createVueCompositionAPIProject();
    await this.runLanguageDetectionTest(vueCompositionProject, 'Vue 3 Composition API项目', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['vue'],
      minConfidence: 85
    });
    
    // 测试场景3: Nuxt.js项目
    const nuxtProject = await this.createNuxtTestProject();
    await this.runLanguageDetectionTest(nuxtProject, 'Nuxt.js项目', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['vue', 'nuxt'],
      minConfidence: 80
    });
  }

  /**
   * React项目测试
   */
  async testReactProjects() {
    console.log('⚛️ 测试React项目兼容性...');
    
    // 测试场景1: Next.js + TypeScript
    const nextjsProject = await this.createNextJSTestProject();
    await this.runLanguageDetectionTest(nextjsProject, 'Next.js + TypeScript项目', {
      expectedLanguage: 'javascript', // 可能是typescript
      expectedFrameworks: ['react', 'nextjs'],
      minConfidence: 85
    });
    
    // 测试场景2: Create React App + TypeScript
    const craProject = await this.createCRATestProject();
    await this.runLanguageDetectionTest(craProject, 'Create React App项目', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['react'],
      minConfidence: 80
    });
    
    // 测试场景3: Vite + React + TypeScript
    const viteReactProject = await this.createViteReactProject();
    await this.runLanguageDetectionTest(viteReactProject, 'Vite + React项目', {
      expectedLanguage: 'javascript',
      expectedFrameworks: ['react', 'vite'],
      minConfidence: 80
    });
  }

  /**
   * Node.js项目测试
   */
  async testNodeJSProjects() {
    console.log('🟢 测试Node.js项目兼容性...');
    
    // 测试场景1: Express + TypeScript
    const expressProject = await this.createExpressTypeScriptProject();
    await this.runLanguageDetectionTest(expressProject, 'Express + TypeScript项目', {
      expectedLanguage: 'javascript', // 可能是typescript
      expectedFrameworks: ['express'],
      minConfidence: 85
    });
    
    // 测试场景2: Nest.js项目
    const nestjsProject = await this.createNestJSTestProject();
    await this.runLanguageDetectionTest(nestjsProject, 'NestJS项目', {
      expectedLanguage: 'javascript', // 应该是typescript
      expectedFrameworks: ['nestjs'],
      minConfidence: 80
    });
  }

  /**
   * 混合技术栈项目测试
   */
  async testMixedTechStackProjects() {
    console.log('🔄 测试混合技术栈项目...');
    
    // 测试场景1: 全栈项目 (Python后端 + Vue前端)
    const fullStackProject = await this.createFullStackTestProject();
    await this.runLanguageDetectionTest(fullStackProject, '全栈项目 (Python + Vue)', {
      expectedLanguage: 'python', // 主要语言应该根据代码量确定
      expectedFrameworks: ['django', 'vue'],
      minConfidence: 70
    });
    
    // 测试场景2: 微服务项目 (多语言)
    const microservicesProject = await this.createMicroservicesProject();
    await this.runLanguageDetectionTest(microservicesProject, '微服务项目 (多语言)', {
      expectedLanguage: 'javascript', // 取决于实现
      expectedFrameworks: [],
      minConfidence: 60
    });
  }

  /**
   * 运行语言检测测试
   */
  async runLanguageDetectionTest(projectPath, projectName, expectations) {
    console.log(`  📋 测试: ${projectName}`);
    
    try {
      // 1. 项目结构扫描
      const structureResult = await this.projectScanner.scanProject(projectPath);
      
      // 2. 语言检测
      const languageResult = await this.languageDetector.detectLanguage(projectPath);
      
      // 3. 文件内容分析
      const contentResult = await this.fileContentAnalyzer.analyzeFiles({
        projectPath,
        structure: structureResult,
        languageData: languageResult
      });
      
      // 4. 验证结果
      const testResult = this.validateTestResult({
        projectName,
        projectPath,
        expectations,
        structureResult,
        languageResult,
        contentResult
      });
      
      this.testResults.push(testResult);
      
      // 5. 输出测试结果
      if (testResult.passed) {
        console.log(`    ✅ ${projectName} 测试通过`);
        console.log(`       语言: ${languageResult.primaryLanguage} (${languageResult.confidence}%)`);
        console.log(`       框架: ${languageResult.techStack?.frameworks?.map(f => f.name).join(', ') || '无'}`);
      } else {
        console.log(`    ❌ ${projectName} 测试失败`);
        console.log(`       期望语言: ${expectations.expectedLanguage}, 实际: ${languageResult.primaryLanguage}`);
        console.log(`       置信度: ${languageResult.confidence}% (最低要求: ${expectations.minConfidence}%)`);
        console.log(`       失败原因: ${testResult.failures.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`    💥 ${projectName} 测试错误:`, error.message);
      
      this.testResults.push({
        projectName,
        projectPath,
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 验证测试结果
   */
  validateTestResult({ projectName, expectations, languageResult, contentResult }) {
    const failures = [];
    
    // 验证语言检测
    if (languageResult.primaryLanguage !== expectations.expectedLanguage) {
      // 允许一些合理的变化，如javascript/typescript
      const acceptableAlternatives = {
        'javascript': ['typescript'],
        'typescript': ['javascript']
      };
      
      const alternatives = acceptableAlternatives[expectations.expectedLanguage] || [];
      if (!alternatives.includes(languageResult.primaryLanguage)) {
        failures.push(`语言检测错误: 期望${expectations.expectedLanguage}, 实际${languageResult.primaryLanguage}`);
      }
    }
    
    // 验证置信度
    if (languageResult.confidence < expectations.minConfidence) {
      failures.push(`置信度过低: ${languageResult.confidence}% < ${expectations.minConfidence}%`);
    }
    
    // 验证框架检测 (如果指定了期望框架)
    if (expectations.expectedFrameworks && expectations.expectedFrameworks.length > 0) {
      const detectedFrameworks = languageResult.techStack?.frameworks?.map(f => f.name.toLowerCase()) || [];
      const missingFrameworks = expectations.expectedFrameworks.filter(
        expected => !detectedFrameworks.some(detected => detected.includes(expected.toLowerCase()))
      );
      
      if (missingFrameworks.length > 0) {
        failures.push(`缺少框架检测: ${missingFrameworks.join(', ')}`);
      }
    }
    
    // 验证文件分析结果
    if (!contentResult || !contentResult.success) {
      failures.push('文件内容分析失败');
    } else if (contentResult.analysis?.totalFilesAnalyzed === 0) {
      failures.push('没有分析到任何文件');
    }
    
    return {
      projectName,
      passed: failures.length === 0,
      failures,
      results: {
        language: languageResult,
        content: contentResult
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成测试报告
   */
  generateTestReport() {
    console.log('\n📊 多语言兼容性测试报告');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${successRate}%`);
    console.log('');
    
    // 按语言分组显示结果
    const resultsByLanguage = this.groupResultsByLanguage();
    
    Object.entries(resultsByLanguage).forEach(([language, results]) => {
      console.log(`📋 ${language.toUpperCase()} 项目测试结果:`);
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${result.projectName}`);
        if (!result.passed && result.failures) {
          result.failures.forEach(failure => {
            console.log(`     - ${failure}`);
          });
        }
      });
      console.log('');
    });
    
    // 问题汇总
    if (failedTests > 0) {
      console.log('🔍 需要改进的问题:');
      const allFailures = this.testResults
        .filter(r => !r.passed)
        .flatMap(r => r.failures || []);
      
      const failureCounts = {};
      allFailures.forEach(failure => {
        failureCounts[failure] = (failureCounts[failure] || 0) + 1;
      });
      
      Object.entries(failureCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([failure, count]) => {
          console.log(`  • ${failure} (${count}次)`);
        });
    }
    
    console.log('\n✨ 测试完成!');
  }

  /**
   * 按语言分组结果
   */
  groupResultsByLanguage() {
    const groups = {
      python: [],
      vue: [],
      react: [],
      nodejs: [],
      mixed: []
    };
    
    this.testResults.forEach(result => {
      if (result.projectName.toLowerCase().includes('python') || 
          result.projectName.toLowerCase().includes('django') ||
          result.projectName.toLowerCase().includes('flask') ||
          result.projectName.toLowerCase().includes('fastapi')) {
        groups.python.push(result);
      } else if (result.projectName.toLowerCase().includes('vue') ||
                 result.projectName.toLowerCase().includes('nuxt')) {
        groups.vue.push(result);
      } else if (result.projectName.toLowerCase().includes('react') ||
                 result.projectName.toLowerCase().includes('next')) {
        groups.react.push(result);
      } else if (result.projectName.toLowerCase().includes('node') ||
                 result.projectName.toLowerCase().includes('express') ||
                 result.projectName.toLowerCase().includes('nest')) {
        groups.nodejs.push(result);
      } else {
        groups.mixed.push(result);
      }
    });
    
    return groups;
  }

  // ==================== 测试项目创建方法 ====================

  /**
   * 创建Django测试项目
   */
  async createDjangoTestProject() {
    const projectPath = path.join(this.tempProjectsPath, 'django_test_project');
    
    await fs.mkdir(projectPath, { recursive: true });
    
    // 创建Django项目结构
    const files = {
      'manage.py': `#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django.")
    execute_from_command_line(sys.argv)`,
      
      'requirements.txt': `Django>=4.0.0
djangorestframework>=3.14.0
psycopg2-binary>=2.9.0
celery>=5.2.0`,
      
      'myproject/settings.py': `import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-test-secret-key'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'rest_framework',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'myproject_db',
    }
}`,
      
      'myproject/urls.py': `from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]`,
      
      'api/models.py': `from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name`,
      
      'api/views.py': `from rest_framework import generics
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer`
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
    
    return projectPath;
  }

  /**
   * 创建Flask测试项目
   */
  async createFlaskTestProject() {
    const projectPath = path.join(this.tempProjectsPath, 'flask_test_project');
    
    await fs.mkdir(projectPath, { recursive: true });
    
    const files = {
      'app.py': `from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{'id': u.id, 'name': u.name, 'email': u.email} for u in users])

if __name__ == '__main__':
    app.run(debug=True)`,
    
      'requirements.txt': `Flask>=2.0.0
Flask-SQLAlchemy>=3.0.0
Flask-Migrate>=3.1.0`,
      
      'config.py': `import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'flask-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False`
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      await fs.writeFile(path.join(projectPath, filePath), content);
    }
    
    return projectPath;
  }

  /**
   * 创建FastAPI测试项目
   */
  async createFastAPITestProject() {
    const projectPath = path.join(this.tempProjectsPath, 'fastapi_test_project');
    
    await fs.mkdir(projectPath, { recursive: true });
    
    const files = {
      'main.py': `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="FastAPI Test Project")

class User(BaseModel):
    id: int
    name: str
    email: str

users_db = []

@app.get("/users", response_model=List[User])
async def get_users():
    return users_db

@app.post("/users", response_model=User)
async def create_user(user: User):
    users_db.append(user)
    return user

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
    
      'requirements.txt': `fastapi>=0.95.0
uvicorn>=0.20.0
pydantic>=1.10.0`,
      
      'models.py': `from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime`
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      await fs.writeFile(path.join(projectPath, filePath), content);
    }
    
    return projectPath;
  }

  /**
   * 创建Vue 3 + TypeScript项目
   */
  async createVue3TypeScriptProject() {
    const projectPath = path.join(this.tempProjectsPath, 'vue3_typescript_project');
    
    await fs.mkdir(projectPath, { recursive: true });
    
    const files = {
      'package.json': JSON.stringify({
        name: "vue3-typescript-project",
        version: "0.0.0",
        private: true,
        scripts: {
          build: "vue-tsc && vite build",
          dev: "vite",
          preview: "vite preview"
        },
        dependencies: {
          vue: "^3.3.0"
        },
        devDependencies: {
          "@vitejs/plugin-vue": "^4.4.0",
          typescript: "^5.0.0",
          "vue-tsc": "^1.8.0",
          vite: "^4.4.5"
        }
      }, null, 2),
      
      'vite.config.ts': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})`,
      
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ["src/**/*.ts", "src/**/*.vue"],
        references: [{ path: "./tsconfig.node.json" }]
      }, null, 2),
      
      'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')`,
      
      'src/App.vue': `<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const message = ref<string>('Hello Vue 3 + TypeScript!')

onMounted(() => {
  console.log('Component mounted')
})
</script>`,
      
      'src/components/HelloWorld.vue': `<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="count++">count is {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: string
}>()

const count = ref(0)
</script>`
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
    
    return projectPath;
  }

  /**
   * 创建数据科学测试项目
   */
  async createDataScienceTestProject() {
    const projectPath = path.join(this.tempProjectsPath, 'data_science_project');
    
    await fs.mkdir(projectPath, { recursive: true });
    
    const files = {
      'requirements.txt': `pandas>=1.5.0
numpy>=1.24.0
matplotlib>=3.6.0
seaborn>=0.12.0
scikit-learn>=1.3.0
jupyter>=1.0.0
jupyterlab>=4.0.0`,
      
      'analysis.py': `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

class DataAnalyzer:
    def __init__(self, data_path: str):
        self.data = pd.read_csv(data_path)
        self.model = None
    
    def explore_data(self):
        print(f"数据形状: {self.data.shape}")
        print(f"数据类型:\n{self.data.dtypes}")
        return self.data.describe()
    
    def visualize_data(self):
        plt.figure(figsize=(12, 8))
        correlation_matrix = self.data.corr()
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm')
        plt.title('特征相关性热图')
        plt.show()
    
    def train_model(self, target_column: str):
        features = self.data.drop(columns=[target_column])
        target = self.data[target_column]
        
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )
        
        self.model = LinearRegression()
        self.model.fit(X_train, y_train)
        
        score = self.model.score(X_test, y_test)
        print(f"模型R²得分: {score:.4f}")
        
        return score`,
      
      'data_processing.py': `import pandas as pd
import numpy as np
from typing import List, Dict, Optional

def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """加载并清理数据"""
    df = pd.read_csv(file_path)
    
    # 处理缺失值
    df = df.dropna()
    
    # 处理异常值
    for column in df.select_dtypes(include=[np.number]).columns:
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df = df[(df[column] >= lower) & (df[column] <= upper)]
    
    return df

def generate_features(df: pd.DataFrame) -> pd.DataFrame:
    """生成新特征"""
    # 这里可以添加特征工程逻辑
    return df`,
      
      'notebooks/exploratory_analysis.ipynb': JSON.stringify({
        cells: [
          {
            cell_type: "markdown",
            metadata: {},
            source: ["# 数据探索性分析\n\n这是一个Jupyter笔记本示例。"]
          },
          {
            cell_type: "code",
            execution_count: 1,
            metadata: {},
            outputs: [],
            source: [
              "import pandas as pd\n",
              "import numpy as np\n",
              "import matplotlib.pyplot as plt\n",
              "\n",
              "# 加载数据\n",
              "data = pd.read_csv('../data/sample.csv')\n",
              "data.head()"
            ]
          }
        ],
        metadata: {
          kernelspec: {
            display_name: "Python 3",
            language: "python",
            name: "python3"
          }
        },
        nbformat: 4,
        nbformat_minor: 4
      }, null, 2)
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
    
    return projectPath;
  }

  /**
   * 更多项目创建方法会在这里实现...
   * (为了代码长度考虑，这里只展示了核心的几个方法)
   */
  
  async createVueCompositionAPIProject() {
    // Vue Composition API项目创建逻辑
    const projectPath = path.join(this.tempProjectsPath, 'vue_composition_project');
    await fs.mkdir(projectPath, { recursive: true });
    // ... 实现细节
    return projectPath;
  }

  async createNuxtTestProject() {
    // Nuxt.js项目创建逻辑
    return path.join(this.tempProjectsPath, 'nuxt_project');
  }

  async createNextJSTestProject() {
    // Next.js项目创建逻辑
    return path.join(this.tempProjectsPath, 'nextjs_project');
  }

  async createCRATestProject() {
    // Create React App项目创建逻辑
    return path.join(this.tempProjectsPath, 'cra_project');
  }

  async createViteReactProject() {
    // Vite React项目创建逻辑
    return path.join(this.tempProjectsPath, 'vite_react_project');
  }

  async createExpressTypeScriptProject() {
    // Express TypeScript项目创建逻辑
    return path.join(this.tempProjectsPath, 'express_ts_project');
  }

  async createNestJSTestProject() {
    // NestJS项目创建逻辑
    return path.join(this.tempProjectsPath, 'nestjs_project');
  }

  async createFullStackTestProject() {
    // 全栈项目创建逻辑
    return path.join(this.tempProjectsPath, 'fullstack_project');
  }

  async createMicroservicesProject() {
    // 微服务项目创建逻辑
    return path.join(this.tempProjectsPath, 'microservices_project');
  }

  /**
   * 清理测试环境
   */
  async cleanupTestEnvironment() {
    console.log('🧹 清理测试环境...');
    try {
      await fs.rm(this.tempProjectsPath, { recursive: true, force: true });
    } catch (error) {
      console.warn('清理测试环境时出现警告:', error.message);
    }
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new MultiLanguageTestRunner();
  testRunner.runAllTests().catch(console.error);
}

export { MultiLanguageTestRunner };