import LanguageDetector from '../server/language/detector.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import testRunner from './test-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('语言检测系统准确性测试', () => {
  let detector;
  let testProjectsDir;

  beforeEach(() => {
    detector = new LanguageDetector();
    testProjectsDir = join(__dirname, 'fixtures', 'test-projects');
    cleanupTestProjects();
  });

  afterEach(() => {
    cleanupTestProjects();
  });

  describe('基础功能测试', () => {
    test('应该正确初始化语言配置', () => {
      expect(detector.languages).toBeDefined();
      expect(detector.languages.javascript).toBeDefined();
      expect(detector.languages.python).toBeDefined();
      expect(detector.languages.java).toBeDefined();
      expect(detector.languages.go).toBeDefined();
      expect(detector.languages.rust).toBeDefined();
      expect(detector.languages.csharp).toBeDefined();
    });

    test('每种语言应该包含必要的配置', () => {
      Object.keys(detector.languages).forEach(lang => {
        const config = detector.languages[lang];
        expect(config.name).toBeDefined();
        expect(config.weight).toBe(0); // 初始权重为0
        expect(Array.isArray(config.extensions)).toBe(true);
        expect(Array.isArray(config.configFiles)).toBe(true);
        expect(Array.isArray(config.directories)).toBe(true);
        expect(typeof config.frameworks).toBe('object');
      });
    });

    test('应该能重置所有语言权重', () => {
      // 设置一些权重
      detector.languages.javascript.weight = 50;
      detector.languages.python.weight = 30;

      detector.resetWeights();

      Object.keys(detector.languages).forEach(lang => {
        expect(detector.languages[lang].weight).toBe(0);
      });
    });

    test('不存在的项目路径应该抛出错误', async () => {
      await expect(
        detector.detectLanguage('/nonexistent/path')
      ).rejects.toThrow('项目路径不存在');
    });
  });

  describe('JavaScript项目检测', () => {
    test('应该正确识别基础Node.js项目', async () => {
      createJavaScriptProject('basic-node');

      const result = await detector.detectLanguage(join(testProjectsDir, 'basic-node'));

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('考虑使用 TypeScript 提升代码质量');
    });

    test('应该正确识别React项目', async () => {
      createReactProject('react-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'react-app'));

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.frameworks).toBeDefined();
      expect(result.frameworks.some(f => f.name === 'react')).toBe(true);
    });

    test('应该识别TypeScript文件', async () => {
      createTypeScriptProject('ts-project');

      const result = await detector.detectLanguage(join(testProjectsDir, 'ts-project'));

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(60);
      // TypeScript应该获得额外权重
    });

    test('应该识别Vue.js项目', async () => {
      createVueProject('vue-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'vue-app'));

      expect(result.language).toBe('javascript');
      expect(result.frameworks.some(f => f.name === 'vue')).toBe(true);
    });
  });

  describe('Python项目检测', () => {
    test('应该正确识别基础Python项目', async () => {
      createPythonProject('basic-python');

      const result = await detector.detectLanguage(join(testProjectsDir, 'basic-python'));

      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.suggestions).toContain('建议使用虚拟环境管理依赖');
    });

    test('应该识别Django项目', async () => {
      createDjangoProject('django-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'django-app'));

      expect(result.language).toBe('python');
      expect(result.frameworks.some(f => f.name === 'django')).toBe(true);
    });

    test('应该识别Flask项目', async () => {
      createFlaskProject('flask-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'flask-app'));

      expect(result.language).toBe('python');
      expect(result.frameworks.some(f => f.name === 'flask')).toBe(true);
    });
  });

  describe('Java项目检测', () => {
    test('应该正确识别Maven项目', async () => {
      createMavenProject('java-maven');

      const result = await detector.detectLanguage(join(testProjectsDir, 'java-maven'));

      expect(result.language).toBe('java');
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.frameworks.some(f => f.name === 'maven')).toBe(true);
    });

    test('应该识别Gradle项目', async () => {
      createGradleProject('java-gradle');

      const result = await detector.detectLanguage(join(testProjectsDir, 'java-gradle'));

      expect(result.language).toBe('java');
      expect(result.frameworks.some(f => f.name === 'gradle')).toBe(true);
    });

    test('应该识别Spring项目', async () => {
      createSpringProject('spring-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'spring-app'));

      expect(result.language).toBe('java');
      expect(result.frameworks.some(f => f.name === 'spring')).toBe(true);
    });
  });

  describe('Go项目检测', () => {
    test('应该正确识别Go模块项目', async () => {
      createGoProject('go-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'go-app'));

      expect(result.language).toBe('go');
      expect(result.confidence).toBeGreaterThan(60);
      expect(result.suggestions).toContain('确保使用 go.mod 管理模块');
    });

    test('应该识别Gin框架项目', async () => {
      createGinProject('gin-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'gin-app'));

      expect(result.language).toBe('go');
      expect(result.frameworks.some(f => f.name === 'gin')).toBe(true);
    });
  });

  describe('Rust项目检测', () => {
    test('应该正确识别Cargo项目', async () => {
      createRustProject('rust-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'rust-app'));

      expect(result.language).toBe('rust');
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.suggestions).toContain('使用 cargo fmt 格式化代码');
    });

    test('应该识别Actix框架项目', async () => {
      createActixProject('actix-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'actix-app'));

      expect(result.language).toBe('rust');
      expect(result.frameworks.some(f => f.name === 'actix')).toBe(true);
    });
  });

  describe('C#项目检测', () => {
    test('应该正确识别.NET项目', async () => {
      createCSharpProject('dotnet-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'dotnet-app'));

      expect(result.language).toBe('csharp');
      expect(result.confidence).toBeGreaterThan(60);
      expect(result.suggestions).toContain('建议使用最新 .NET 版本');
    });

    test('应该识别ASP.NET项目', async () => {
      createAspNetProject('aspnet-app');

      const result = await detector.detectLanguage(join(testProjectsDir, 'aspnet-app'));

      expect(result.language).toBe('csharp');
      expect(result.frameworks.some(f => f.name === 'aspnet')).toBe(true);
    });
  });

  describe('混合项目检测', () => {
    test('应该选择权重最高的语言', async () => {
      createMixedProject('mixed-project');

      const result = await detector.detectLanguage(join(testProjectsDir, 'mixed-project'));

      expect(result.language).toBe('javascript'); // package.json权重更高
      expect(result.confidence).toBeGreaterThan(40);
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    test('应该返回置信度低于100%的结果', async () => {
      createWeakSignalProject('weak-project');

      const result = await detector.detectLanguage(join(testProjectsDir, 'weak-project'));

      expect(result.confidence).toBeLessThan(100);
    });
  });

  describe('框架检测准确性', () => {
    test('React项目应该有高置信度的React检测', async () => {
      createReactProject('react-complex');

      const result = await detector.detectLanguage(join(testProjectsDir, 'react-complex'));

      const reactFramework = result.frameworks.find(f => f.name === 'react');
      expect(reactFramework).toBeDefined();
      expect(reactFramework.confidence).toBeGreaterThan(50);
    });

    test('Django项目应该被正确识别', async () => {
      createDjangoProject('django-complex');

      const result = await detector.detectLanguage(join(testProjectsDir, 'django-complex'));

      const djangoFramework = result.frameworks.find(f => f.name === 'django');
      expect(djangoFramework).toBeDefined();
      expect(djangoFramework.confidence).toBeGreaterThan(30);
    });

    test('Spring项目应该被正确识别', async () => {
      createSpringProject('spring-complex');

      const result = await detector.detectLanguage(join(testProjectsDir, 'spring-complex'));

      const springFramework = result.frameworks.find(f => f.name === 'spring');
      expect(springFramework).toBeDefined();
    });
  });

  describe('边界情况测试', () => {
    test('空项目应该返回unknown', async () => {
      createEmptyProject('empty-project');

      const result = await detector.detectLanguage(join(testProjectsDir, 'empty-project'));

      expect(result.language).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    test('只有隐藏文件的项目应该处理正确', async () => {
      createHiddenFilesProject('hidden-files');

      const result = await detector.detectLanguage(join(testProjectsDir, 'hidden-files'));

      // 应该能处理.gitignore等重要隐藏文件
      expect(result).toBeDefined();
    });

    test('深层目录结构应该被正确扫描', async () => {
      createDeepStructureProject('deep-project');

      const result = await detector.detectLanguage(join(testProjectsDir, 'deep-project'));

      expect(result.language).toBe('javascript');
    });

    test('大量文件的项目应该在合理时间内完成', async () => {
      createLargeProject('large-project');

      const startTime = Date.now();
      const result = await detector.detectLanguage(join(testProjectsDir, 'large-project'));
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    });
  });

  describe('权重算法测试', () => {
    test('配置文件应该比普通文件有更高权重', async () => {
      // 创建只有配置文件的项目
      const projectDir = join(testProjectsDir, 'config-only');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(join(projectDir, 'package.json'), '{"name": "test"}');

      const result = await detector.detectLanguage(projectDir);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(50);
    });

    test('特征目录应该增加语言权重', async () => {
      const projectDir = join(testProjectsDir, 'directory-test');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(join(projectDir, 'node_modules'), { recursive: true });
      fs.mkdirSync(join(projectDir, 'src'), { recursive: true });
      fs.writeFileSync(join(projectDir, 'src', 'index.js'), 'console.log("test");');

      const result = await detector.detectLanguage(projectDir);

      expect(result.language).toBe('javascript');
    });

    test('文件扩展名应该按权重计算', async () => {
      const projectDir = join(testProjectsDir, 'extension-test');
      fs.mkdirSync(projectDir, { recursive: true });
      
      // 创建多个.js文件
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(join(projectDir, `file${i}.js`), 'console.log("test");');
      }

      const result = await detector.detectLanguage(projectDir);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(30);
    });
  });

  describe('工具函数测试', () => {
    test('模式匹配应该正确工作', () => {
      expect(detector.matchPattern('test.config.js', '*.config.*')).toBe(true);
      expect(detector.matchPattern('package.json', 'package.json')).toBe(true);
      expect(detector.matchPattern('App.tsx', '*.tsx')).toBe(true);
      expect(detector.matchPattern('test.py', '*.js')).toBe(false);
    });

    test('应该正确识别重要的隐藏文件', () => {
      expect(detector.isImportantHiddenFile('.env')).toBe(true);
      expect(detector.isImportantHiddenFile('.gitignore')).toBe(true);
      expect(detector.isImportantHiddenFile('.DS_Store')).toBe(false);
    });

    test('应该正确识别需要忽略的目录', () => {
      expect(detector.shouldIgnoreDirectory('node_modules')).toBe(true);
      expect(detector.shouldIgnoreDirectory('.git')).toBe(true);
      expect(detector.shouldIgnoreDirectory('src')).toBe(false);
      expect(detector.shouldIgnoreDirectory('tests')).toBe(false);
    });
  });

  // 辅助函数 - 创建各种类型的测试项目
  function cleanupTestProjects() {
    if (fs.existsSync(testProjectsDir)) {
      fs.rmSync(testProjectsDir, { recursive: true, force: true });
    }
  }

  function createJavaScriptProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    fs.mkdirSync(join(projectDir, 'node_modules'));
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      version: '1.0.0',
      dependencies: { express: '^4.18.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'src', 'index.js'), 
      'const express = require("express");\\nconst app = express();'
    );
  }

  function createReactProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    fs.mkdirSync(join(projectDir, 'public'));
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'src', 'App.jsx'),
      'import React from "react";\\nexport default function App() { return <div>Hello</div>; }'
    );
    
    fs.writeFileSync(join(projectDir, 'public', 'index.html'),
      '<html><body><div id="root"></div></body></html>'
    );
  }

  function createTypeScriptProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      devDependencies: { typescript: '^4.8.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'tsconfig.json'), '{"compilerOptions": {}}');
    
    fs.writeFileSync(join(projectDir, 'src', 'index.ts'),
      'interface User { name: string; }\\nconst user: User = { name: "test" };'
    );
  }

  function createVueProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      dependencies: { vue: '^3.0.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'vue.config.js'), 'module.exports = {};');
    
    fs.writeFileSync(join(projectDir, 'src', 'App.vue'),
      '<template><div>Hello Vue</div></template>\\n<script>export default { name: "App" };</script>'
    );
  }

  function createPythonProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'django==4.0.0\\nrequests==2.28.0');
    fs.writeFileSync(join(projectDir, 'setup.py'), 'from setuptools import setup');
    fs.writeFileSync(join(projectDir, 'src', 'main.py'), 'print("Hello Python")');
  }

  function createDjangoProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'manage.py'), '#!/usr/bin/env python');
    fs.writeFileSync(join(projectDir, 'settings.py'), 'DEBUG = True');
    fs.writeFileSync(join(projectDir, 'urls.py'), 'urlpatterns = []');
  }

  function createFlaskProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'app.py'), 'from flask import Flask');
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'Flask==2.0.0');
  }

  function createMavenProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src', 'main', 'java'), { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'pom.xml'), '<project></project>');
    fs.writeFileSync(join(projectDir, 'src', 'main', 'java', 'Main.java'),
      'public class Main { public static void main(String[] args) {} }'
    );
  }

  function createGradleProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src', 'main'), { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'build.gradle'), 'plugins { id "java" }');
    fs.writeFileSync(join(projectDir, 'src', 'main', 'App.java'),
      'public class App { }'
    );
  }

  function createSpringProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src', 'main', 'java'), { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'pom.xml'), '<project></project>');
    fs.writeFileSync(join(projectDir, 'application.properties'), 'server.port=8080');
    fs.writeFileSync(join(projectDir, 'src', 'main', 'java', 'Application.java'),
      '@SpringBootApplication\\npublic class Application {}'
    );
  }

  function createGoProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'cmd'));
    
    fs.writeFileSync(join(projectDir, 'go.mod'), `module ${name}\\ngo 1.19`);
    fs.writeFileSync(join(projectDir, 'main.go'), 'package main\\nfunc main() {}');
  }

  function createGinProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'go.mod'), `module ${name}`);
    fs.writeFileSync(join(projectDir, 'main.go'),
      'package main\\nimport "github.com/gin-gonic/gin"\\nfunc main() { r := gin.Default() }'
    );
  }

  function createRustProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'Cargo.toml'), '[package]\\nname = "test"');
    fs.writeFileSync(join(projectDir, 'src', 'main.rs'), 'fn main() { println!("Hello"); }');
  }

  function createActixProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'Cargo.toml'),
      '[package]\\nname = "test"\\n[dependencies]\\nactix-web = "4.0"'
    );
    fs.writeFileSync(join(projectDir, 'src', 'main.rs'), 'use actix_web::*;');
  }

  function createCSharpProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'Program.cs'), 'Console.WriteLine("Hello");');
    fs.writeFileSync(join(projectDir, 'project.csproj'), '<Project Sdk="Microsoft.NET.Sdk">');
  }

  function createAspNetProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'Program.cs'), 'using Microsoft.AspNetCore;');
    fs.writeFileSync(join(projectDir, 'Startup.cs'), 'public class Startup {}');
    fs.writeFileSync(join(projectDir, 'project.csproj'), '<Project Sdk="Microsoft.NET.Sdk.Web">');
  }

  function createMixedProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    // 包含多种语言的文件
    fs.writeFileSync(join(projectDir, 'package.json'), '{"name": "test"}');
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'django==4.0.0');
    fs.writeFileSync(join(projectDir, 'script.js'), 'console.log("test");');
    fs.writeFileSync(join(projectDir, 'script.py'), 'print("test")');
  }

  function createWeakSignalProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    // 只创建一些弱信号文件
    fs.writeFileSync(join(projectDir, 'README.md'), '# Test project');
    fs.writeFileSync(join(projectDir, 'data.txt'), 'some data');
  }

  function createEmptyProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    // 完全空的目录
  }

  function createHiddenFilesProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, '.gitignore'), 'node_modules/');
    fs.writeFileSync(join(projectDir, '.env'), 'NODE_ENV=development');
    fs.writeFileSync(join(projectDir, '.nvmrc'), '16.0.0');
  }

  function createDeepStructureProject(name) {
    const projectDir = join(testProjectsDir, name);
    const deepDir = join(projectDir, 'level1', 'level2', 'level3');
    fs.mkdirSync(deepDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'package.json'), '{"name": "test"}');
    fs.writeFileSync(join(deepDir, 'deep.js'), 'console.log("deep");');
  }

  function createLargeProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'), { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'package.json'), '{"name": "large"}');
    
    // 创建多个文件模拟大项目
    for (let i = 0; i < 20; i++) {
      fs.writeFileSync(join(projectDir, 'src', `file${i}.js`), 
        `// File ${i}\\nconsole.log("File ${i}");`
      );
    }
  }
});

// 运行测试
testRunner.runTests().catch(console.error);