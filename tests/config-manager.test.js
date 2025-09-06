const fs = require('fs');
const path = require('path');
const ConfigManager = require('../server/config-manager');

// 测试辅助函数
function createTestConfig(configName, content) {
  const testConfigDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(testConfigDir)) {
    fs.mkdirSync(testConfigDir, { recursive: true });
  }
  fs.writeFileSync(path.join(testConfigDir, configName), JSON.stringify(content, null, 2));
}

function cleanupTestConfigs() {
  const testConfigDir = path.join(__dirname, 'fixtures');
  if (fs.existsSync(testConfigDir)) {
    fs.rmSync(testConfigDir, { recursive: true, force: true });
  }
}

describe('ConfigManager', () => {
  let configManager;
  const testConfigDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    // 清理之前的测试文件
    cleanupTestConfigs();
    
    // 创建测试配置文件
    createTestConfig('mcp.config.json', {
      server: { port: 3000, host: 'localhost' },
      mcp: { protocol_version: '2024-11-05' },
      auth: { enabled: false },
      logging: { level: 'info' },
      features: { hot_reload: true, metrics: true }
    });

    createTestConfig('modes.config.json', {
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

    createTestConfig('templates.config.json', {
      templates: {
        'system-architecture': {
          id: 'system-architecture',
          name: '系统架构',
          path: './prompts/templates/system-architecture.md',
          category: 'architecture'
        }
      }
    });

    configManager = new ConfigManager(testConfigDir);
  });

  afterEach(() => {
    configManager.disableHotReload();
    cleanupTestConfigs();
  });

  describe('配置加载', () => {
    test('应该成功加载所有配置文件', async () => {
      const configs = await configManager.loadConfigs();
      
      expect(configs).toBeDefined();
      expect(configs.mcp).toBeDefined();
      expect(configs.modes).toBeDefined();
      expect(configs.templates).toBeDefined();
    });

    test('应该正确解析MCP配置', async () => {
      await configManager.loadConfigs();
      
      expect(configManager.get('mcp.server.port')).toBe(3000);
      expect(configManager.get('mcp.server.host')).toBe('localhost');
      expect(configManager.get('mcp.mcp.protocol_version')).toBe('2024-11-05');
    });

    test('配置文件不存在时应该抛出错误', async () => {
      fs.unlinkSync(path.join(testConfigDir, 'mcp.config.json'));
      
      await expect(configManager.loadConfigs()).rejects.toThrow('配置文件不存在');
    });

    test('JSON格式错误时应该抛出错误', async () => {
      fs.writeFileSync(path.join(testConfigDir, 'mcp.config.json'), '{ invalid json }');
      
      await expect(configManager.loadConfigs()).rejects.toThrow('解析配置文件失败');
    });
  });

  describe('环境变量覆盖', () => {
    test('应该正确应用端口覆盖', async () => {
      process.env.MCP_PORT = '4000';
      await configManager.loadConfigs();
      
      expect(configManager.get('mcp.server.port')).toBe(4000);
      delete process.env.MCP_PORT;
    });

    test('应该正确应用主机覆盖', async () => {
      process.env.MCP_HOST = '0.0.0.0';
      await configManager.loadConfigs();
      
      expect(configManager.get('mcp.server.host')).toBe('0.0.0.0');
      delete process.env.MCP_HOST;
    });

    test('应该正确应用API密钥覆盖', async () => {
      process.env.MCP_API_KEY = 'test-api-key';
      await configManager.loadConfigs();
      
      expect(configManager.get('mcp.auth.enabled')).toBe(true);
      expect(configManager.get('mcp.auth.api_key')).toBe('test-api-key');
      delete process.env.MCP_API_KEY;
    });

    test('应该正确应用默认模式覆盖', async () => {
      process.env.MCP_DEFAULT_MODE = 'create';
      await configManager.loadConfigs();
      
      expect(configManager.get('modes.default_mode')).toBe('create');
      delete process.env.MCP_DEFAULT_MODE;
    });
  });

  describe('配置验证', () => {
    test('有效配置应该通过验证', async () => {
      await configManager.loadConfigs();
      expect(() => configManager.validate()).not.toThrow();
    });

    test('缺少MCP端口应该验证失败', async () => {
      createTestConfig('mcp.config.json', {
        server: { host: 'localhost' },
        mcp: { protocol_version: '2024-11-05' }
      });
      
      await configManager.loadConfigs();
      expect(() => configManager.validate()).toThrow('MCP服务器端口未配置');
    });

    test('缺少协议版本应该验证失败', async () => {
      createTestConfig('mcp.config.json', {
        server: { port: 3000, host: 'localhost' },
        mcp: {}
      });
      
      await configManager.loadConfigs();
      expect(() => configManager.validate()).toThrow('MCP协议版本未配置');
    });

    test('默认模式不存在应该验证失败', async () => {
      createTestConfig('modes.config.json', {
        modes: { init: { id: 'init', name: '初始化模式' } },
        default_mode: 'nonexistent'
      });
      
      await configManager.loadConfigs();
      expect(() => configManager.validate()).toThrow("默认模式 'nonexistent' 不存在");
    });
  });

  describe('配置访问', () => {
    beforeEach(async () => {
      await configManager.loadConfigs();
    });

    test('get方法应该返回正确的配置值', () => {
      expect(configManager.get('mcp.server.port')).toBe(3000);
      expect(configManager.get('modes.default_mode')).toBe('init');
    });

    test('get方法对不存在的键应该返回默认值', () => {
      expect(configManager.get('nonexistent.key')).toBeNull();
      expect(configManager.get('nonexistent.key', 'default')).toBe('default');
    });

    test('set方法应该正确设置配置值', () => {
      configManager.set('mcp.server.port', 5000);
      expect(configManager.get('mcp.server.port')).toBe(5000);
    });

    test('getMode应该返回正确的模式配置', () => {
      const initMode = configManager.getMode('init');
      expect(initMode).toBeDefined();
      expect(initMode.name).toBe('初始化模式');
    });

    test('getTemplate应该返回正确的模板配置', () => {
      const template = configManager.getTemplate('system-architecture');
      expect(template).toBeDefined();
      expect(template.name).toBe('系统架构');
    });

    test('getEnabledModes应该只返回启用的模式', () => {
      const enabledModes = configManager.getEnabledModes();
      expect(Object.keys(enabledModes)).toHaveLength(2);
      expect(enabledModes.init).toBeDefined();
      expect(enabledModes.create).toBeDefined();
    });
  });

  describe('热重载功能', () => {
    beforeEach(async () => {
      await configManager.loadConfigs();
    });

    test('enableHotReload应该启动文件监听器', () => {
      configManager.enableHotReload();
      expect(configManager.watchers.size).toBeGreaterThan(0);
    });

    test('disableHotReload应该停止所有监听器', () => {
      configManager.enableHotReload();
      configManager.disableHotReload();
      expect(configManager.watchers.size).toBe(0);
    });

    test('配置文件变更应该触发重载', (done) => {
      configManager.enableHotReload();
      
      // 监听配置变更事件
      const originalEmit = configManager.emit;
      configManager.emit = (event, data) => {
        if (event === 'configChanged') {
          expect(data.type).toBe('mcp');
          done();
        }
      };

      // 修改配置文件
      setTimeout(() => {
        createTestConfig('mcp.config.json', {
          server: { port: 8000, host: 'localhost' },
          mcp: { protocol_version: '2024-11-05' }
        });
      }, 100);
    }, 5000);
  });
});

// 运行测试的辅助函数
if (require.main === module) {
  console.log('🧪 开始运行配置管理器测试...\n');
  
  // 简单的测试运行器
  async function runTests() {
    const testSuite = new (require('events').EventEmitter)();
    let passedTests = 0;
    let failedTests = 0;
    
    // 模拟测试函数
    global.describe = (name, fn) => {
      console.log(`📁 ${name}`);
      fn();
    };
    
    global.test = async (name, testFn) => {
      try {
        await testFn();
        console.log(`  ✅ ${name}`);
        passedTests++;
      } catch (error) {
        console.log(`  ❌ ${name}`);
        console.log(`     ${error.message}`);
        failedTests++;
      }
    };
    
    global.beforeEach = (fn) => fn();
    global.afterEach = (fn) => fn();
    global.expect = (actual) => ({
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`期望 ${expected}，但得到 ${actual}`);
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
      },
      toHaveLength: (length) => {
        if (actual.length !== length) {
          throw new Error(`期望长度为 ${length}，但得到 ${actual.length}`);
        }
      },
      toBeGreaterThan: (value) => {
        if (actual <= value) {
          throw new Error(`期望 ${actual} 大于 ${value}`);
        }
      },
      rejects: {
        toThrow: async (message) => {
          try {
            await actual;
            throw new Error('期望Promise被拒绝，但它被解决了');
          } catch (error) {
            if (message && !error.message.includes(message)) {
              throw new Error(`期望异常包含 "${message}"，但得到 "${error.message}"`);
            }
          }
        }
      }
    });
    
    // 运行所有测试
    try {
      // 这里需要重新执行测试逻辑，因为我们在同一个文件中
      console.log('\n📊 测试总结:');
      console.log(`✅ 通过: ${passedTests}`);
      console.log(`❌ 失败: ${failedTests}`);
      console.log(`📈 成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error.message);
    }
  }
  
  runTests();
}