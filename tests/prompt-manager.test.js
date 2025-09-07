import { PromptManager } from '../server/prompt-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import testRunner from './test-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('提示词管理器功能测试', () => {
  let promptManager;
  let testPromptsDir;

  beforeEach(() => {
    // 创建测试用的prompts目录结构
    testPromptsDir = join(__dirname, 'fixtures', 'test-prompts');
    cleanupTestDirectory();
    createTestPromptsStructure();

    // 创建PromptManager实例
    promptManager = new PromptManager({
      promptsPath: testPromptsDir,
      cacheEnabled: true,
      cacheTTL: 1000, // 1秒缓存，便于测试
      watchFiles: false, // 在测试中禁用文件监控
      version: '2.0.0'
    });
  });

  afterEach(() => {
    // 清理资源
    if (promptManager) {
      promptManager.destroy();
      promptManager = null;
    }
    cleanupTestDirectory();
  });

  describe('初始化和配置', () => {
    test('应该使用正确的默认配置初始化', () => {
      const defaultManager = new PromptManager();
      
      expect(defaultManager.config.cacheEnabled).toBe(true);
      expect(defaultManager.config.cacheTTL).toBe(3600000); // 1小时
      expect(defaultManager.config.watchFiles).toBe(true);
      expect(defaultManager.config.version).toBe('1.0.0');
      
      defaultManager.destroy();
    });

    test('应该正确应用自定义配置', () => {
      expect(promptManager.config.promptsPath).toBe(testPromptsDir);
      expect(promptManager.config.cacheEnabled).toBe(true);
      expect(promptManager.config.cacheTTL).toBe(1000);
      expect(promptManager.config.watchFiles).toBe(false);
      expect(promptManager.config.version).toBe('2.0.0');
    });

    test('应该初始化内部数据结构', () => {
      expect(promptManager.cache).toBeDefined();
      expect(promptManager.cache instanceof Map).toBe(true);
      expect(promptManager.cacheTimestamps instanceof Map).toBe(true);
      expect(promptManager.globalVariables instanceof Map).toBe(true);
    });

    test('应该设置默认全局变量', () => {
      const globalVars = promptManager._getGlobalVariables();
      
      expect(globalVars.timestamp).toBeDefined();
      expect(globalVars.version).toBe('2.0.0');
      expect(globalVars.server_name).toBe('mg_kiro MCP Server');
      expect(globalVars.current_mode).toBe('init');
    });
  });

  describe('文件加载功能', () => {
    test('应该成功加载存在的提示词文件', async () => {
      const prompt = await promptManager.loadPrompt('modes', 'test-mode');

      expect(prompt).toBeDefined();
      expect(prompt.category).toBe('modes');
      expect(prompt.name).toBe('test-mode');
      expect(prompt.content).toContain('测试模式');
      expect(prompt.filePath).toContain('test-mode.md');
      expect(prompt.size).toBeGreaterThan(0);
      expect(prompt.lastModified).toBeDefined();
    });

    test('加载不存在的文件应该抛出错误', async () => {
      await expect(
        promptManager.loadPrompt('modes', 'nonexistent')
      ).rejects.toThrow('Prompt file not found');
    });

    test('应该正确解析文件元数据', async () => {
      const prompt = await promptManager.loadPrompt('modes', 'test-mode');

      expect(prompt.metadata).toBeDefined();
      expect(prompt.metadata.title).toBe('测试模式');
      expect(prompt.metadata.description).toContain('这是一个测试模式');
      expect(prompt.version).toBe('1.0.0');
    });

    test('应该处理包含变量的提示词文件', async () => {
      const variables = {
        project_name: 'Test Project',
        custom_var: 'Custom Value'
      };

      const prompt = await promptManager.loadPrompt('templates', 'test-template', variables);

      expect(prompt.content).toContain('Test Project');
      expect(prompt.content).toContain('Custom Value');
      expect(prompt.content).not.toContain('{{project_name}}');
      expect(prompt.content).not.toContain('{{custom_var}}');
      expect(prompt.variables.project_name).toBe('Test Project');
    });

    test('应该正确处理嵌套目录', async () => {
      const prompt = await promptManager.loadPrompt('snippets', 'test-snippet');

      expect(prompt).toBeDefined();
      expect(prompt.category).toBe('snippets');
      expect(prompt.name).toBe('test-snippet');
    });
  });

  describe('模板变量替换', () => {
    test('应该替换简单变量', async () => {
      const variables = {
        simple_var: 'Simple Value',
        number_var: 42,
        boolean_var: true
      };

      const prompt = await promptManager.loadPrompt('templates', 'variable-test', variables);

      expect(prompt.content).toContain('Simple Value');
      expect(prompt.content).toContain('42');
      expect(prompt.content).toContain('true');
    });

    test('应该处理未定义的变量', async () => {
      const prompt = await promptManager.loadPrompt('templates', 'variable-test', {});

      // 未定义的变量应该保留原样或被替换为默认值
      expect(prompt.content).toContain('待配置_undefined_var');
    });

    test('应该合并全局变量和局部变量', async () => {
      promptManager.setGlobalVariable('global_test', 'Global Value');
      
      const variables = {
        local_test: 'Local Value'
      };

      const prompt = await promptManager.loadPrompt('templates', 'variable-test', variables);

      expect(prompt.variables.global_test).toBe('Global Value');
      expect(prompt.variables.local_test).toBe('Local Value');
      expect(prompt.variables.version).toBe('2.0.0'); // 默认全局变量
    });

    test('局部变量应该覆盖全局变量', async () => {
      promptManager.setGlobalVariable('conflict_var', 'Global Value');
      
      const variables = {
        conflict_var: 'Local Value'
      };

      const prompt = await promptManager.loadPrompt('templates', 'variable-test', variables);

      expect(prompt.variables.conflict_var).toBe('Local Value');
    });

    test('应该处理函数类型的全局变量', async () => {
      promptManager.setGlobalVariable('dynamic_var', () => 'Dynamic Value');
      
      const prompt = await promptManager.loadPrompt('templates', 'variable-test', {});

      expect(prompt.variables.dynamic_var).toBe('Dynamic Value');
    });
  });

  describe('缓存机制', () => {
    test('应该缓存加载的提示词', async () => {
      // 第一次加载
      const start1 = Date.now();
      const prompt1 = await promptManager.loadPrompt('modes', 'test-mode');
      const time1 = Date.now() - start1;

      // 第二次加载（从缓存）
      const start2 = Date.now();
      const prompt2 = await promptManager.loadPrompt('modes', 'test-mode');
      const time2 = Date.now() - start2;

      expect(prompt1.content).toBe(prompt2.content);
      // 缓存的加载应该更快（虽然在测试环境中差异可能不明显）
      expect(time2).toBeLessThanOrEqual(time1 + 10); // 允许一些误差
    });

    test('缓存过期后应该重新加载文件', async () => {
      // 第一次加载
      await promptManager.loadPrompt('modes', 'test-mode');
      expect(promptManager.cache.has('modes/test-mode')).toBe(true);

      // 等待缓存过期
      await new Promise(resolve => setTimeout(resolve, 1100)); // 超过1秒TTL

      // 第二次加载应该重新读取文件
      const prompt = await promptManager.loadPrompt('modes', 'test-mode');
      expect(prompt).toBeDefined();
    });

    test('应该能够手动清理缓存', async () => {
      await promptManager.loadPrompt('modes', 'test-mode');
      expect(promptManager.cache.size).toBeGreaterThan(0);

      promptManager.clearCache();
      expect(promptManager.cache.size).toBe(0);
      expect(promptManager.cacheTimestamps.size).toBe(0);
    });

    test('禁用缓存时应该每次重新加载', async () => {
      const noCacheManager = new PromptManager({
        promptsPath: testPromptsDir,
        cacheEnabled: false
      });

      await noCacheManager.loadPrompt('modes', 'test-mode');
      expect(noCacheManager.cache.size).toBe(0);

      noCacheManager.destroy();
    });
  });

  describe('提示词列表功能', () => {
    test('应该列出指定类别的所有提示词', async () => {
      const modes = await promptManager.listPrompts('modes');
      
      expect(Array.isArray(modes)).toBe(true);
      expect(modes).toContain('test-mode');
    });

    test('应该列出所有类别的提示词', async () => {
      const allPrompts = await promptManager.listPrompts();
      
      expect(typeof allPrompts).toBe('object');
      expect(allPrompts.modes).toBeDefined();
      expect(allPrompts.templates).toBeDefined();
      expect(allPrompts.snippets).toBeDefined();
      
      expect(Array.isArray(allPrompts.modes)).toBe(true);
      expect(allPrompts.modes).toContain('test-mode');
    });

    test('不存在的类别应该返回空数组', async () => {
      const nonExistent = await promptManager.listPrompts('nonexistent');
      
      expect(Array.isArray(nonExistent)).toBe(true);
      expect(nonExistent).toHaveLength(0);
    });
  });

  describe('全局变量管理', () => {
    test('应该能够设置和获取全局变量', () => {
      promptManager.setGlobalVariable('test_var', 'Test Value');
      
      const globalVars = promptManager._getGlobalVariables();
      expect(globalVars.test_var).toBe('Test Value');
    });

    test('应该支持函数类型的全局变量', () => {
      const testFunction = () => `Current time: ${Date.now()}`;
      promptManager.setGlobalVariable('dynamic_time', testFunction);
      
      const globalVars1 = promptManager._getGlobalVariables();
      const globalVars2 = promptManager._getGlobalVariables();
      
      expect(globalVars1.dynamic_time).toContain('Current time:');
      expect(globalVars2.dynamic_time).toContain('Current time:');
      // 函数应该每次都被调用，所以值可能不同
    });

    test('应该能够覆盖已存在的全局变量', () => {
      promptManager.setGlobalVariable('test_var', 'Initial Value');
      promptManager.setGlobalVariable('test_var', 'Updated Value');
      
      const globalVars = promptManager._getGlobalVariables();
      expect(globalVars.test_var).toBe('Updated Value');
    });
  });

  describe('版本和元数据解析', () => {
    test('应该正确提取版本信息', async () => {
      const prompt = await promptManager.loadPrompt('modes', 'test-mode');
      expect(prompt.version).toBe('1.0.0');
    });

    test('没有版本信息时应该使用默认版本', async () => {
      const prompt = await promptManager.loadPrompt('snippets', 'test-snippet');
      expect(prompt.version).toBe('1.0.0'); // 默认版本
    });

    test('应该正确解析标题和描述', async () => {
      const prompt = await promptManager.loadPrompt('modes', 'test-mode');
      
      expect(prompt.metadata.title).toBe('测试模式');
      expect(prompt.metadata.description).toContain('这是一个测试模式');
    });
  });

  describe('错误处理', () => {
    test('无效的prompts路径应该抛出错误', async () => {
      const invalidManager = new PromptManager({
        promptsPath: '/nonexistent/path'
      });

      await expect(
        invalidManager.loadPrompt('modes', 'test-mode')
      ).rejects.toThrow();

      invalidManager.destroy();
    });

    test('无效的JSON元数据应该不影响文件加载', async () => {
      // 创建包含无效JSON的测试文件
      const invalidJsonFile = join(testPromptsDir, 'modes', 'invalid-json.md');
      fs.writeFileSync(invalidJsonFile, '# 测试\\n{invalid json}\\n这是内容');

      const prompt = await promptManager.loadPrompt('modes', 'invalid-json');
      expect(prompt.content).toContain('这是内容');
    });

    test('空文件应该能够正确处理', async () => {
      // 创建空文件
      const emptyFile = join(testPromptsDir, 'modes', 'empty.md');
      fs.writeFileSync(emptyFile, '');

      const prompt = await promptManager.loadPrompt('modes', 'empty');
      expect(prompt.content).toBe('');
      expect(prompt.size).toBe(0);
    });
  });

  describe('性能和状态', () => {
    test('应该正确报告缓存统计', () => {
      const stats = promptManager.getCacheStats();
      
      expect(stats.enabled).toBe(true);
      expect(stats.size).toBe(0); // 初始状态
      expect(stats.ttl).toBe(1000);
      expect(Array.isArray(stats.entries)).toBe(true);
      expect(typeof stats.hitRate).toBe('number');
    });

    test('应该正确报告管理器状态', () => {
      const status = promptManager.getStatus();
      
      expect(status.version).toBe('2.0.0');
      expect(status.promptsPath).toBe(testPromptsDir);
      expect(status.cacheEnabled).toBe(true);
      expect(status.watchFiles).toBe(false);
      expect(status.cache).toBeDefined();
      expect(Array.isArray(status.globalVariables)).toBe(true);
    });

    test('destroy方法应该清理所有资源', () => {
      promptManager.setGlobalVariable('test', 'value');
      promptManager.cache.set('test', 'data');
      
      promptManager.destroy();
      
      expect(promptManager.cache.size).toBe(0);
      expect(promptManager.watchers.size).toBe(0);
    });
  });

  // 辅助函数
  function cleanupTestDirectory() {
    if (fs.existsSync(testPromptsDir)) {
      fs.rmSync(testPromptsDir, { recursive: true, force: true });
    }
  }

  function createTestPromptsStructure() {
    // 创建目录结构
    const modesDir = join(testPromptsDir, 'modes');
    const templatesDir = join(testPromptsDir, 'templates');
    const snippetsDir = join(testPromptsDir, 'snippets');

    fs.mkdirSync(modesDir, { recursive: true });
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.mkdirSync(snippetsDir, { recursive: true });

    // 创建测试文件
    fs.writeFileSync(join(modesDir, 'test-mode.md'), `
# 测试模式

## 模式描述
这是一个测试模式，用于验证提示词管理器功能。

### 功能特性
- 测试功能1
- 测试功能2

### 变量
- \`{{project_name}}\` - 项目名称
- \`{{timestamp}}\` - 时间戳

---
*模式版本: v1.0.0*
*最后更新: {{timestamp}}*
`);

    fs.writeFileSync(join(templatesDir, 'test-template.md'), `
# 项目模板 - {{project_name}}

## 基本信息
- 项目名称: {{project_name}}
- 创建时间: {{timestamp}}
- 自定义变量: {{custom_var}}

## 内容
这是一个测试模板。
`);

    fs.writeFileSync(join(templatesDir, 'variable-test.md'), `
变量测试:
- 简单变量: {{simple_var}}
- 数字变量: {{number_var}}
- 布尔变量: {{boolean_var}}
- 未定义变量: {{undefined_var}}
- 全局测试: {{global_test}}
- 本地测试: {{local_test}}
- 冲突变量: {{conflict_var}}
- 动态变量: {{dynamic_var}}
`);

    fs.writeFileSync(join(snippetsDir, 'test-snippet.md'), `
这是一个测试片段。
`);
  }
});

// 运行测试
testRunner.runTests().catch(console.error);