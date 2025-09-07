import LanguageTemplateGenerator from '../server/language/template-generator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import testRunner from './test-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('模板生成器功能测试', () => {
  let generator;
  let testProjectsDir;
  let testTemplatesDir;

  beforeEach(() => {
    generator = new LanguageTemplateGenerator();
    testProjectsDir = join(__dirname, 'fixtures', 'template-test-projects');
    testTemplatesDir = join(__dirname, 'fixtures', 'test-templates');
    
    cleanupTestDirectories();
    createTestTemplatesStructure();
  });

  afterEach(() => {
    cleanupTestDirectories();
  });

  describe('基础功能测试', () => {
    test('应该正确初始化模板生成器', () => {
      expect(generator.detector).toBeDefined();
      expect(generator.templatesPath).toBeDefined();
      expect(generator.languagesPath).toBeDefined();
    });

    test('应该能够访问语言检测器', () => {
      expect(generator.detector.languages).toBeDefined();
      expect(generator.detector.detectLanguage).toBeDefined();
    });

    test('模板路径应该指向正确位置', () => {
      expect(generator.templatesPath).toContain('templates');
      expect(generator.languagesPath).toContain('languages');
    });
  });

  describe('JavaScript项目模板生成', () => {
    test('应该为基础Node.js项目生成正确模板', async () => {
      createNodeJsProject('node-basic');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'node-basic'), 
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.template).toBeDefined();
      expect(result.template).toContain('Node.js');
      expect(result.metadata.language).toBe('javascript');
      expect(result.metadata.hasLanguageVariant).toBeDefined();
    });

    test('应该为React项目生成特定模板', async () => {
      createReactProject('react-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'react-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('javascript');
      expect(result.frameworks.some(f => f.name === 'react')).toBe(true);
      expect(result.template).toContain('React');
      expect(result.metadata.generatedAt).toBeDefined();
    });

    test('应该正确注入框架特定变量', async () => {
      createVueProject('vue-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'vue-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('Vue');
      expect(result.frameworks.some(f => f.name === 'vue')).toBe(true);
    });

    test('应该处理TypeScript项目', async () => {
      createTypeScriptProject('ts-project');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'ts-project'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('javascript');
      expect(result.template).toContain('TypeScript');
    });
  });

  describe('Python项目模板生成', () => {
    test('应该为基础Python项目生成模板', async () => {
      createPythonProject('python-basic');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'python-basic'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('python');
      expect(result.template).toContain('Python');
      expect(result.metadata.language).toBe('python');
    });

    test('应该为Django项目生成特定模板', async () => {
      createDjangoProject('django-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'django-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('python');
      expect(result.frameworks.some(f => f.name === 'django')).toBe(true);
      expect(result.template).toContain('Django');
    });

    test('应该为Flask项目生成特定模板', async () => {
      createFlaskProject('flask-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'flask-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('python');
      expect(result.frameworks.some(f => f.name === 'flask')).toBe(true);
      expect(result.template).toContain('Flask');
    });
  });

  describe('多语言项目支持', () => {
    test('应该支持Java项目模板生成', async () => {
      createJavaProject('java-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'java-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('java');
      expect(result.template).toContain('Java');
    });

    test('应该支持Go项目模板生成', async () => {
      createGoProject('go-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'go-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('go');
      expect(result.template).toContain('Go');
    });

    test('应该支持Rust项目模板生成', async () => {
      createRustProject('rust-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'rust-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('rust');
      expect(result.template).toContain('Rust');
    });

    test('应该支持C#项目模板生成', async () => {
      createCSharpProject('csharp-app');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'csharp-app'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.language).toBe('csharp');
      expect(result.template).toContain('C#');
    });
  });

  describe('模板变量注入', () => {
    test('应该正确注入基础项目信息', async () => {
      createNodeJsProject('variable-test');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'variable-test'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('variable-test'); // project_name
      expect(result.template).toContain('javascript'); // language
      expect(result.template).toContain('mg_kiro'); // author
    });

    test('应该注入框架特定变量', async () => {
      createReactProject('framework-vars');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'framework-vars'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('react'); // primary_framework
      // 应该包含前端技术栈变量
    });

    test('应该处理语言置信度变量', async () => {
      createMixedProject('confidence-test');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'confidence-test'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('%'); // confidence percentage
    });

    test('应该支持嵌套变量替换', async () => {
      createNodeJsProject('nested-vars');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'nested-vars'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      // 验证嵌套变量被正确处理（如果模板中有嵌套变量）
    });
  });

  describe('语言特定模板变体', () => {
    test('应该使用JavaScript特定模板变体（如果存在）', async () => {
      createNodeJsProject('js-variant');
      
      // 创建JavaScript特定的模板变体
      createLanguageSpecificTemplate('javascript', 'system-architecture');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'js-variant'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.hasLanguageVariant).toBe(true);
      expect(result.template).toContain('JavaScript特定内容');
    });

    test('不存在语言变体时应该使用基础模板', async () => {
      createGoProject('go-fallback');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'go-fallback'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.hasLanguageVariant).toBe(false);
      // 应该使用通用模板内容
    });
  });

  describe('模板加载和处理', () => {
    test('应该能够加载基础模板', async () => {
      const template = await generator.loadBaseTemplate('system-architecture');
      
      expect(template).toBeDefined();
      expect(template.length).toBeGreaterThan(0);
      expect(template).toContain('{{project_name}}');
    });

    test('加载不存在的模板应该抛出错误', async () => {
      await expect(
        generator.loadBaseTemplate('nonexistent-template')
      ).rejects.toThrow('模板不存在');
    });

    test('应该能够加载语言配置', async () => {
      const config = await generator.loadLanguageConfig('javascript');
      
      expect(config).toBeDefined();
      // 如果配置文件存在，应该有内容
    });

    test('应该能够加载语言默认值', async () => {
      const defaults = await generator.loadLanguageDefaults('javascript');
      
      expect(defaults).toBeDefined();
      expect(defaults.template_variables).toBeDefined();
    });
  });

  describe('错误处理和回退机制', () => {
    test('项目路径不存在时应该返回错误', async () => {
      const result = await generator.generateTemplate(
        '/nonexistent/path',
        'system-architecture'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.fallback).toBeDefined();
    });

    test('语言检测失败时应该使用回退模板', async () => {
      createEmptyProject('empty-project');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'empty-project'),
        'system-architecture'
      );

      // 即使检测失败，也应该生成回退模板
      expect(result.success || result.fallback).toBeTruthy();
      if (result.fallback) {
        expect(result.fallback).toContain('system-architecture');
      }
    });

    test('模板文件不存在时应该生成错误回退', async () => {
      createNodeJsProject('template-missing');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'template-missing'),
        'nonexistent-template'
      );

      expect(result.success).toBe(false);
      expect(result.fallback).toBeDefined();
      expect(result.fallback).toContain('模板生成失败');
    });
  });

  describe('批量模板生成', () => {
    test('应该能够批量生成多个模板', async () => {
      createNodeJsProject('batch-test');

      const templates = ['system-architecture', 'modules-catalog', 'user-stories'];
      const result = await generator.generateMultipleTemplates(
        join(testProjectsDir, 'batch-test'),
        templates
      );

      expect(result.language).toBe('javascript');
      expect(result.templates).toBeDefined();
      expect(Object.keys(result.templates)).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.success).toBeGreaterThan(0);
    });

    test('批量生成时部分失败应该正确统计', async () => {
      createNodeJsProject('batch-partial');

      const templates = ['system-architecture', 'nonexistent-template'];
      const result = await generator.generateMultipleTemplates(
        join(testProjectsDir, 'batch-partial'),
        templates
      );

      expect(result.summary.total).toBe(2);
      expect(result.summary.success).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.templates['nonexistent-template'].success).toBe(false);
    });
  });

  describe('语言特定注释和说明', () => {
    test('应该为JavaScript项目添加特定注释', async () => {
      createNodeJsProject('js-notes');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'js-notes'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('javascript项目特定说明');
      expect(result.template).toContain('检测时间');
      expect(result.template).toContain('mg_kiro MCP 语言模块');
    });

    test('应该包含语言相关资源链接', async () => {
      createPythonProject('python-links');

      const result = await generator.generateTemplate(
        join(testProjectsDir, 'python-links'),
        'system-architecture'
      );

      expect(result.success).toBe(true);
      expect(result.template).toContain('Python官方文档');
      expect(result.template).toContain('最佳实践指南');
      expect(result.template).toContain('社区资源');
    });
  });

  describe('性能和缓存', () => {
    test('生成过程应该在合理时间内完成', async () => {
      createNodeJsProject('performance-test');

      const startTime = Date.now();
      const result = await generator.generateTemplate(
        join(testProjectsDir, 'performance-test'),
        'system-architecture'
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // 3秒内完成
    });

    test('相同项目的重复生成应该更快', async () => {
      createNodeJsProject('cache-test');
      const projectPath = join(testProjectsDir, 'cache-test');

      // 第一次生成
      const start1 = Date.now();
      await generator.generateTemplate(projectPath, 'system-architecture');
      const time1 = Date.now() - start1;

      // 第二次生成（可能有缓存）
      const start2 = Date.now();
      await generator.generateTemplate(projectPath, 'system-architecture');
      const time2 = Date.now() - start2;

      // 验证结果存在且第二次可能更快（允许一些误差）
      expect(time2).toBeLessThanOrEqual(time1 + 500);
    });
  });

  // 辅助函数 - 创建测试项目和模板
  function cleanupTestDirectories() {
    [testProjectsDir, testTemplatesDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  function createTestTemplatesStructure() {
    // 创建基础模板目录
    const templatesDir = join(testTemplatesDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    // 创建基础模板文件
    fs.writeFileSync(join(templatesDir, 'system-architecture.md'), `
# 系统架构 - {{project_name}}

## 项目信息
- 项目名称: {{project_name}}
- 语言: {{language}}
- 检测置信度: {{confidence}}%
- 主要框架: {{primary_framework}}

## 技术栈
- 前端: {{frontend_stack}}
- 后端: {{backend_stack}}
- 检测到的语言: {{detected_language}}

## 架构概述
基于{{language}}技术栈的项目架构设计。
`);

    fs.writeFileSync(join(templatesDir, 'modules-catalog.md'), `
# 模块目录 - {{project_name}}

项目基于{{language}}开发，使用{{primary_framework}}框架。
`);

    fs.writeFileSync(join(templatesDir, 'user-stories.md'), `
# 用户故事 - {{project_name}}

基于{{language}}项目的用户需求分析。
`);

    // 创建语言配置目录
    const languagesDir = join(testTemplatesDir, 'languages');
    ['javascript', 'python', 'java', 'go', 'rust', 'csharp', 'common'].forEach(lang => {
      const langDir = join(languagesDir, lang);
      fs.mkdirSync(langDir, { recursive: true });

      // 创建配置文件
      fs.writeFileSync(join(langDir, 'config.json'), JSON.stringify({
        frameworks: [
          { name: 'react', category: 'frontend' },
          { name: 'vue', category: 'frontend' },
          { name: 'express', category: 'backend' }
        ]
      }));

      // 创建默认值文件
      fs.writeFileSync(join(langDir, 'defaults.json'), JSON.stringify({
        template_variables: {
          tech_stack: lang,
          framework_type: 'web',
          default_port: '3000'
        }
      }));
    });

    // 更新generator的路径
    generator.templatesPath = templatesDir;
    generator.languagesPath = languagesDir;
  }

  function createLanguageSpecificTemplate(language, templateName) {
    const variantsDir = join(testTemplatesDir, 'templates', 'language-variants', language);
    fs.mkdirSync(variantsDir, { recursive: true });

    fs.writeFileSync(join(variantsDir, `${templateName}.md`), `
# ${language}特定的系统架构

这是${language}特定内容，包含了针对${language}的优化建议。

{{project_name}} - ${language}项目架构
`);
  }

  // 项目创建辅助函数
  function createNodeJsProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(join(projectDir, 'src'));
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      version: '1.0.0',
      dependencies: { express: '^4.18.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'src', 'index.js'), 'console.log("Hello Node.js");');
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
      'import React from "react"; export default function App() { return <div>React</div>; }'
    );
    fs.writeFileSync(join(projectDir, 'public', 'index.html'), '<div id="root"></div>');
  }

  function createVueProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      dependencies: { vue: '^3.0.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'vue.config.js'), 'module.exports = {};');
  }

  function createTypeScriptProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: name,
      devDependencies: { typescript: '^4.8.0' }
    }));
    
    fs.writeFileSync(join(projectDir, 'tsconfig.json'), '{"compilerOptions": {}}');
    fs.writeFileSync(join(projectDir, 'src', 'index.ts'), 'interface User {}');
  }

  function createPythonProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'django==4.0.0');
    fs.writeFileSync(join(projectDir, 'main.py'), 'print("Python")');
  }

  function createDjangoProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'manage.py'), '#!/usr/bin/env python');
    fs.writeFileSync(join(projectDir, 'settings.py'), 'DEBUG = True');
  }

  function createFlaskProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'app.py'), 'from flask import Flask');
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'Flask==2.0.0');
  }

  function createJavaProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'pom.xml'), '<project></project>');
    fs.writeFileSync(join(projectDir, 'Main.java'), 'public class Main {}');
  }

  function createGoProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'go.mod'), `module ${name}`);
    fs.writeFileSync(join(projectDir, 'main.go'), 'package main');
  }

  function createRustProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'Cargo.toml'), '[package]\\nname = "test"');
    fs.writeFileSync(join(projectDir, 'src', 'main.rs'), 'fn main() {}');
  }

  function createCSharpProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'Program.cs'), 'Console.WriteLine("C#");');
    fs.writeFileSync(join(projectDir, 'project.csproj'), '<Project Sdk="Microsoft.NET.Sdk">');
  }

  function createMixedProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    
    fs.writeFileSync(join(projectDir, 'package.json'), '{"name": "test"}');
    fs.writeFileSync(join(projectDir, 'requirements.txt'), 'django==4.0.0');
    fs.writeFileSync(join(projectDir, 'main.js'), 'console.log("test");');
    fs.writeFileSync(join(projectDir, 'main.py'), 'print("test")');
  }

  function createEmptyProject(name) {
    const projectDir = join(testProjectsDir, name);
    fs.mkdirSync(projectDir, { recursive: true });
    // 完全空的项目
  }
});

// 运行测试
testRunner.runTests().catch(console.error);