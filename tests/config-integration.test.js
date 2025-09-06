import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigManager from '../server/config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的测试运行器
class SimpleTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   💭 ${error.message}`);
      this.failed++;
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`期望 ${JSON.stringify(expected)}，但得到 ${JSON.stringify(actual)}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('期望值已定义，但得到 undefined');
        }
      },
      toThrow: (message) => {
        try {
          if (typeof actual === 'function') {
            actual();
          }
          throw new Error('期望抛出异常，但没有抛出');
        } catch (error) {
          if (message && !error.message.includes(message)) {
            throw new Error(`期望异常包含 "${message}"，但得到 "${error.message}"`);
          }
        }
      },
      not: {
        toThrow: () => {
          try {
            if (typeof actual === 'function') {
              actual();
            }
          } catch (error) {
            throw new Error(`期望不抛出异常，但抛出了: ${error.message}`);
          }
        }
      }
    };
  }

  summary() {
    console.log('\n📊 测试总结:');
    console.log(`✅ 通过: ${this.passed}`);
    console.log(`❌ 失败: ${this.failed}`);
    console.log(`📊 总计: ${this.passed + this.failed}`);
    
    if (this.passed + this.failed > 0) {
      const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
      console.log(`📈 成功率: ${successRate}%`);
    }

    return this.failed === 0;
  }
}

// 测试辅助函数
function createTestConfig(testDir, configName, content) {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  fs.writeFileSync(path.join(testDir, configName), JSON.stringify(content, null, 2));
}

function cleanupTestConfigs(testDir) {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// 主要测试函数
async function runConfigTests() {
  console.log('🧪 开始运行配置系统集成测试...\n');
  
  const test = new SimpleTest();
  const testConfigDir = path.join(__dirname, 'test-configs');

  // 清理并创建测试目录
  cleanupTestConfigs(testConfigDir);

  // 创建测试配置文件
  createTestConfig(testConfigDir, 'mcp.config.json', {
    server: { port: 3000, host: 'localhost' },
    mcp: { protocol_version: '2024-11-05' },
    auth: { enabled: false, rate_limit: { max_requests: 100 } },
    logging: { level: 'info' },
    features: { hot_reload: true, metrics: true }
  });

  createTestConfig(testConfigDir, 'modes.config.json', {
    modes: {
      init: {
        id: 'init',
        name: '初始化模式',
        enabled: true,
        prompt_path: './prompts/modes/init.md'
      },
      create: {
        id: 'create',
        name: '创建模式',
        enabled: true,
        prompt_path: './prompts/modes/create.md'
      }
    },
    default_mode: 'init'
  });

  createTestConfig(testConfigDir, 'templates.config.json', {
    templates: {
      'system-architecture': {
        id: 'system-architecture',
        name: '系统架构',
        path: './prompts/templates/system-architecture.md',
        category: 'architecture'
      }
    }
  });

  const configManager = new ConfigManager(testConfigDir);

  console.log('📁 测试配置加载');
  await test.test('应该成功加载所有配置文件', async () => {
    const configs = await configManager.loadConfigs();
    test.expect(configs).toBeDefined();
    test.expect(configs.mcp).toBeDefined();
    test.expect(configs.modes).toBeDefined();
    test.expect(configs.templates).toBeDefined();
  });

  await test.test('应该正确解析MCP配置', async () => {
    test.expect(configManager.get('mcp.server.port')).toBe(3000);
    test.expect(configManager.get('mcp.server.host')).toBe('localhost');
    test.expect(configManager.get('mcp.mcp.protocol_version')).toBe('2024-11-05');
  });

  console.log('\n📁 测试环境变量覆盖');
  await test.test('应该正确应用端口覆盖', async () => {
    process.env.MCP_PORT = '4000';
    await configManager.loadConfigs();
    test.expect(configManager.get('mcp.server.port')).toBe(4000);
    delete process.env.MCP_PORT;
  });

  await test.test('应该正确应用API密钥覆盖', async () => {
    process.env.MCP_API_KEY = 'test-api-key';
    await configManager.loadConfigs();
    test.expect(configManager.get('mcp.auth.enabled')).toBe(true);
    test.expect(configManager.get('mcp.auth.api_key')).toBe('test-api-key');
    delete process.env.MCP_API_KEY;
  });

  console.log('\n📁 测试配置验证');
  await test.test('有效配置应该通过验证', async () => {
    await configManager.loadConfigs();
    test.expect(() => configManager.validate()).not.toThrow();
  });

  await test.test('缺少MCP端口应该验证失败', async () => {
    createTestConfig(testConfigDir, 'mcp.config.json', {
      server: { host: 'localhost' },
      mcp: { protocol_version: '2024-11-05' }
    });
    
    await configManager.loadConfigs();
    test.expect(() => configManager.validate()).toThrow('MCP服务器端口未配置');
    
    // 恢复正确配置
    createTestConfig(testConfigDir, 'mcp.config.json', {
      server: { port: 3000, host: 'localhost' },
      mcp: { protocol_version: '2024-11-05' },
      auth: { enabled: false },
      logging: { level: 'info' },
      features: { hot_reload: true }
    });
  });

  console.log('\n📁 测试配置访问');
  await test.test('get方法应该返回正确的配置值', async () => {
    await configManager.loadConfigs();
    test.expect(configManager.get('mcp.server.port')).toBe(3000);
    test.expect(configManager.get('modes.default_mode')).toBe('init');
  });

  await test.test('getMode应该返回正确的模式配置', async () => {
    const initMode = configManager.getMode('init');
    test.expect(initMode).toBeDefined();
    test.expect(initMode.name).toBe('初始化模式');
  });

  await test.test('getTemplate应该返回正确的模板配置', async () => {
    const template = configManager.getTemplate('system-architecture');
    test.expect(template).toBeDefined();
    test.expect(template.name).toBe('系统架构');
  });

  console.log('\n📁 测试热重载功能');
  await test.test('enableHotReload应该启动文件监听器', async () => {
    configManager.enableHotReload();
    test.expect(configManager.watchers.size > 0).toBe(true);
    configManager.disableHotReload();
  });

  // 清理测试文件
  cleanupTestConfigs(testConfigDir);

  const success = test.summary();
  
  if (success) {
    console.log('\n🎉 配置系统测试全部通过！');
  } else {
    console.log('\n⚠️  配置系统测试有失败项');
    process.exit(1);
  }
}

// 运行测试
runConfigTests().catch(error => {
  console.error('❌ 测试运行失败:', error);
  process.exit(1);
});