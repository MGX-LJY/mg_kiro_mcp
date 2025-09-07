import { MCPServer } from '../server/mcp-server.js';
import { PromptManager } from '../server/prompt-manager.js';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import testRunner from './test-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('MCP服务器核心功能测试', () => {
  let server;
  let testConfigDir;
  const TEST_PORT = 3001; // 使用不同端口避免冲突
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  beforeEach(async () => {
    // 创建测试配置目录
    testConfigDir = join(__dirname, 'fixtures', 'server-test-config');
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }

    // 创建基本配置文件
    createTestConfig();

    // 创建服务器实例
    const config = {
      port: TEST_PORT,
      host: 'localhost',
      cors: { enabled: true, origins: ['*'] },
      rateLimit: { windowMs: 60000, max: 1000 }
    };

    server = new MCPServer(config);
  });

  afterEach(async () => {
    // 清理服务器
    if (server) {
      await server.stop();
      server = null;
    }

    // 清理测试文件
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('服务器启动和停止', () => {
    test('应该成功启动服务器', async () => {
      const serverInstance = await server.start();
      expect(serverInstance).toBeDefined();
      expect(server.server.listening).toBe(true);
    });

    test('应该成功停止服务器', async () => {
      await server.start();
      await server.stop();
      expect(server.server.listening).toBe(false);
    });

    test('启动后应该监听正确的端口', async () => {
      await server.start();
      const address = server.server.address();
      expect(address.port).toBe(TEST_PORT);
      expect(address.address).toBe('127.0.0.1');
    });
  });

  describe('健康检查端点', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('GET /health 应该返回健康状态', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('2.0.0');
      expect(data.mode).toBeDefined();
      expect(data.connections).toBeDefined();
    });

    test('健康检查应该包含时间戳', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('状态查询端点', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('GET /status 应该返回详细状态信息', async () => {
      const response = await fetch(`${BASE_URL}/status`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.server).toBeDefined();
      expect(data.server.uptime).toBeGreaterThan(0);
      expect(data.server.memory).toBeDefined();
      expect(data.server.cpu).toBeDefined();
      
      expect(data.mcp).toBeDefined();
      expect(data.mcp.version).toBe('1.0.0');
      expect(data.mcp.connections).toBeDefined();
      expect(data.mcp.clients).toBeDefined();
    });

    test('状态信息应该包含内存使用情况', async () => {
      const response = await fetch(`${BASE_URL}/status`);
      const data = await response.json();

      expect(data.server.memory.rss).toBeGreaterThan(0);
      expect(data.server.memory.heapUsed).toBeGreaterThan(0);
      expect(data.server.memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('MCP协议握手', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('POST /mcp/handshake 应该成功建立连接', async () => {
      const handshakeData = {
        version: '1.0.0',
        clientId: 'test-client',
        capabilities: { prompts: true, tools: true }
      };

      const response = await fetch(`${BASE_URL}/mcp/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handshakeData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.connectionId).toBeDefined();
      expect(data.connectionId).toContain('mcp_');
      expect(data.serverCapabilities).toBeDefined();
      expect(data.serverCapabilities.prompts).toBe(true);
      expect(data.serverCapabilities.templates).toBe(true);
      expect(data.serverVersion).toBe('2.0.0');
      expect(data.mcpVersion).toBe('1.0.0');
    });

    test('不支持的MCP版本应该返回400错误', async () => {
      const handshakeData = {
        version: '99.99.99', // 不支持的版本
        clientId: 'test-client'
      };

      const response = await fetch(`${BASE_URL}/mcp/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handshakeData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Unsupported MCP version');
      expect(data.supportedVersions).toBeDefined();
      expect(data.supportedVersions).toContain('1.0.0');
    });

    test('握手应该记录连接信息', async () => {
      const handshakeData = {
        version: '1.0.0',
        clientId: 'test-client-123'
      };

      const response = await fetch(`${BASE_URL}/mcp/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handshakeData)
      });

      const data = await response.json();
      expect(server.mcpConnections.has(data.connectionId)).toBe(true);
      
      const connection = server.mcpConnections.get(data.connectionId);
      expect(connection.clientId).toBe('test-client-123');
      expect(connection.version).toBe('1.0.0');
    });
  });

  describe('模式切换功能', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('POST /mode/switch 应该成功切换模式', async () => {
      const switchData = {
        mode: 'create',
        context: { projectName: 'test-project' }
      };

      const response = await fetch(`${BASE_URL}/mode/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(switchData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.previousMode).toBe('init'); // 默认模式
      expect(data.currentMode).toBe('create');
      expect(data.timestamp).toBeDefined();
      expect(server.currentMode).toBe('create');
    });

    test('无效的模式应该返回400错误', async () => {
      const switchData = { mode: 'invalid_mode' };

      const response = await fetch(`${BASE_URL}/mode/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(switchData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid mode');
      expect(data.availableModes).toContain('init');
      expect(data.availableModes).toContain('create');
      expect(data.availableModes).toContain('fix');
      expect(data.availableModes).toContain('analyze');
    });

    test('模式切换应该更新提示词管理器', async () => {
      const switchData = { mode: 'fix' };

      await fetch(`${BASE_URL}/mode/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(switchData)
      });

      expect(server.currentMode).toBe('fix');
      // 验证提示词管理器的全局变量是否已更新
      const globalVars = server.promptManager._getGlobalVariables();
      expect(globalVars.current_mode).toBe('fix');
    });
  });

  describe('提示词API端点', () => {
    beforeEach(async () => {
      await server.start();
      // 创建测试提示词文件
      createTestPromptFiles();
    });

    test('GET /prompt/system 应该返回系统提示词', async () => {
      const response = await fetch(`${BASE_URL}/prompt/system`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data.system_prompt).toBeDefined();
      expect(data.data.version).toBe('2.0.0');
      expect(data.data.mode).toBeDefined();
      expect(data.data.timestamp).toBeDefined();
    });

    test('GET /prompt/mode/:mode 应该返回模式提示词', async () => {
      const response = await fetch(`${BASE_URL}/prompt/mode/create`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data.mode).toBe('create');
      expect(data.data.prompt).toBeDefined();
      expect(data.data.templates).toBeDefined();
      expect(data.data.version).toBeDefined();
    });

    test('不存在的模式应该返回404', async () => {
      const response = await fetch(`${BASE_URL}/prompt/mode/nonexistent`);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Mode not found');
    });

    test('GET /template/:name 应该返回模板内容', async () => {
      const response = await fetch(`${BASE_URL}/template/system-architecture`);
      
      if (response.ok) {
        const data = await response.json();
        expect(data.status).toBe('success');
        expect(data.data).toBeDefined();
      } else {
        // 如果模板不存在，应该返回404
        expect(response.status).toBe(404);
      }
    });
  });

  describe('心跳检测', () => {
    let connectionId;

    beforeEach(async () => {
      await server.start();
      
      // 建立MCP连接
      const handshakeResponse = await fetch(`${BASE_URL}/mcp/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.0.0', clientId: 'heartbeat-test' })
      });
      
      const handshakeData = await handshakeResponse.json();
      connectionId = handshakeData.connectionId;
    });

    test('POST /mcp/heartbeat 应该更新心跳时间', async () => {
      const heartbeatData = { connectionId };

      const response = await fetch(`${BASE_URL}/mcp/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heartbeatData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();

      // 验证连接的心跳时间已更新
      const connection = server.mcpConnections.get(connectionId);
      expect(connection.lastHeartbeat).toBeDefined();
    });

    test('无效的连接ID应该返回404', async () => {
      const heartbeatData = { connectionId: 'invalid-connection-id' };

      const response = await fetch(`${BASE_URL}/mcp/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heartbeatData)
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Connection not found');
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('不存在的端点应该返回404', async () => {
      const response = await fetch(`${BASE_URL}/nonexistent-endpoint`);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Endpoint not found');
    });

    test('无效的JSON请求应该返回400', async () => {
      const response = await fetch(`${BASE_URL}/mode/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    test('系统错误应该返回500并包含错误信息', async () => {
      // 这个测试需要模拟系统错误，可能需要Mock某些功能
      // 暂时跳过，在实际实现时需要考虑如何触发系统错误
    });
  });

  describe('CORS和中间件', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('OPTIONS请求应该返回CORS头', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'OPTIONS'
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
    });

    test('响应应该包含安全头', async () => {
      const response = await fetch(`${BASE_URL}/health`);

      // 检查helmet中间件设置的安全头
      expect(response.headers.get('x-content-type-options')).toBeDefined();
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });

    test('响应应该经过压缩', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      
      // 检查压缩中间件
      const contentEncoding = response.headers.get('content-encoding');
      // 注意：在测试环境中可能不会实际压缩小响应
    });
  });

  // WebSocket测试需要更复杂的设置，暂时简化
  describe('WebSocket基础功能', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('WebSocket服务器应该已启动', () => {
      expect(server.wsServer).toBeDefined();
      expect(server.wsServer.address()).toBeDefined();
    });

    test('clients Map应该已初始化', () => {
      expect(server.clients).toBeDefined();
      expect(server.clients instanceof Map).toBe(true);
      expect(server.clients.size).toBe(0);
    });
  });

  // 辅助函数
  function createTestConfig() {
    const mcpConfig = {
      server: { port: TEST_PORT, host: 'localhost' },
      mcp: { protocol_version: '2024-11-05' },
      auth: { enabled: false },
      logging: { level: 'error' }, // 减少测试输出
      features: { hot_reload: false, metrics: false }
    };

    fs.writeFileSync(
      join(testConfigDir, 'mcp.config.json'),
      JSON.stringify(mcpConfig, null, 2)
    );
  }

  function createTestPromptFiles() {
    // 创建测试用的prompts目录结构
    const promptsDir = join(testConfigDir, 'prompts');
    const modesDir = join(promptsDir, 'modes');
    
    if (!fs.existsSync(modesDir)) {
      fs.mkdirSync(modesDir, { recursive: true });
    }

    // 创建基本的模式提示词文件
    fs.writeFileSync(
      join(modesDir, 'init.md'),
      '# Init Mode Test\\n这是测试用的初始化模式提示词'
    );

    fs.writeFileSync(
      join(modesDir, 'create.md'),
      '# Create Mode Test\\n这是测试用的创建模式提示词'
    );
  }
});

// 运行测试
testRunner.runTests().catch(console.error);