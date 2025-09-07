import {
  ModeHandler,
  InitModeHandler,
  CreateModeHandler,
  FixModeHandler,
  AnalyzeModeHandler,
  ModeManager
} from '../server/mode-handler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import testRunner from './test-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('模式处理器业务逻辑测试', () => {
  let testDir;

  beforeEach(() => {
    // 创建测试目录
    testDir = join(__dirname, 'fixtures', 'modes-test');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('ModeHandler基类', () => {
    let baseHandler;

    beforeEach(() => {
      baseHandler = new ModeHandler('test-mode', 'Test mode description');
    });

    test('应该正确初始化基础属性', () => {
      expect(baseHandler.name).toBe('test-mode');
      expect(baseHandler.description).toBe('Test mode description');
      expect(baseHandler.active).toBe(false);
      expect(typeof baseHandler.context).toBe('object');
      expect(baseHandler.promptPath).toBe(null);
    });

    test('应该能够激活模式', async () => {
      const context = { test: 'value' };
      const result = await baseHandler.activate(context);

      expect(baseHandler.active).toBe(true);
      expect(baseHandler.context.test).toBe('value');
      expect(result.success).toBe(true);
      expect(result.mode).toBe('test-mode');
    });

    test('应该能够失活模式', async () => {
      await baseHandler.activate();
      const result = await baseHandler.deactivate();

      expect(baseHandler.active).toBe(false);
      expect(result.success).toBe(true);
    });

    test('应该正确返回状态信息', () => {
      const status = baseHandler.getStatus();

      expect(status.name).toBe('test-mode');
      expect(status.description).toBe('Test mode description');
      expect(status.active).toBe(false);
      expect(status.context).toBeDefined();
    });

    test('未激活模式时处理请求应该抛出错误', async () => {
      const request = { action: 'test' };

      await expect(
        baseHandler.process(request)
      ).rejects.toThrow('Mode test-mode is not active');
    });
  });

  describe('InitModeHandler - 初始化模式', () => {
    let initHandler;

    beforeEach(() => {
      initHandler = new InitModeHandler();
    });

    test('应该正确初始化Init模式', () => {
      expect(initHandler.name).toBe('init');
      expect(initHandler.description).toBe('Project initialization and documentation generation');
      expect(Array.isArray(initHandler.templates)).toBe(true);
      expect(initHandler.templates).toContain('system-architecture.md');
    });

    test('激活应该返回正确的响应', async () => {
      const result = await initHandler.activate();

      expect(result.success).toBe(true);
      expect(result.mode).toBe('init');
      expect(result.message).toContain('Init mode activated');
      expect(Array.isArray(result.templates)).toBe(true);
    });

    test('应该处理生成文档请求', async () => {
      await initHandler.activate();
      
      const request = {
        action: 'generate_docs',
        params: {
          projectName: 'Test Project',
          description: 'A test project'
        }
      };

      const result = await initHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('generate_docs');
      expect(result.documents).toBeDefined();
      expect(result.documents.architecture).toContain('Test Project');
      expect(result.message).toContain('successfully');
    });

    test('应该处理扫描项目请求', async () => {
      await initHandler.activate();
      
      const request = {
        action: 'scan_project',
        params: { rootPath: testDir }
      };

      const result = await initHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('scan_project');
      expect(result.structure).toBeDefined();
      expect(result.structure.detected).toBeDefined();
    });

    test('应该处理项目结构设置请求', async () => {
      await initHandler.activate();
      
      const request = {
        action: 'setup_structure',
        params: {}
      };

      const result = await initHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('setup_structure');
      expect(result.created).toBeDefined();
      expect(Array.isArray(result.created.directories)).toBe(true);
      expect(Array.isArray(result.created.files)).toBe(true);
    });

    test('未知操作应该返回错误', async () => {
      await initHandler.activate();
      
      const request = { action: 'unknown_action' };
      const result = await initHandler.process(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('CreateModeHandler - 创建模式', () => {
    let createHandler;

    beforeEach(() => {
      createHandler = new CreateModeHandler();
    });

    test('应该正确初始化Create模式', () => {
      expect(createHandler.name).toBe('create');
      expect(createHandler.description).toBe('New feature and module creation');
    });

    test('激活应该返回创建模式的能力', async () => {
      const result = await createHandler.activate();

      expect(result.success).toBe(true);
      expect(result.mode).toBe('create');
      expect(Array.isArray(result.capabilities)).toBe(true);
      expect(result.capabilities).toContain('module');
      expect(result.capabilities).toContain('component');
    });

    test('应该处理创建模块请求', async () => {
      await createHandler.activate();
      
      const request = {
        action: 'create_module',
        params: {
          moduleName: 'TestModule',
          description: 'A test module',
          dependencies: ['dependency1', 'dependency2']
        }
      };

      const result = await createHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('create_module');
      expect(result.module.name).toBe('TestModule');
      expect(result.module.description).toBe('A test module');
      expect(result.module.dependencies).toContain('dependency1');
      expect(result.module.created).toBeDefined();
    });

    test('应该处理创建组件请求', async () => {
      await createHandler.activate();
      
      const request = {
        action: 'create_component',
        params: {
          componentName: 'TestComponent',
          type: 'class',
          props: { prop1: 'value1' }
        }
      };

      const result = await createHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('create_component');
      expect(result.component.name).toBe('TestComponent');
      expect(result.component.type).toBe('class');
      expect(result.component.template).toContain('class Component');
    });

    test('应该处理创建API请求', async () => {
      await createHandler.activate();
      
      const request = {
        action: 'create_api',
        params: {
          endpoint: '/api/test',
          method: 'POST',
          description: 'Test API endpoint'
        }
      };

      const result = await createHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('create_api');
      expect(result.api.endpoint).toBe('/api/test');
      expect(result.api.method).toBe('POST');
      expect(result.api.authentication).toBe('required');
    });

    test('应该处理功能规划请求', async () => {
      await createHandler.activate();
      
      const request = {
        action: 'plan_feature',
        params: {
          featureName: 'User Authentication',
          requirements: ['Login', 'Registration', 'Password Reset']
        }
      };

      const result = await createHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('plan_feature');
      expect(result.plan.feature).toBe('User Authentication');
      expect(Array.isArray(result.plan.tasks)).toBe(true);
      expect(result.plan.estimatedTime).toBeDefined();
    });
  });

  describe('FixModeHandler - 修复模式', () => {
    let fixHandler;

    beforeEach(() => {
      fixHandler = new FixModeHandler();
    });

    test('应该正确初始化Fix模式', () => {
      expect(fixHandler.name).toBe('fix');
      expect(fixHandler.description).toBe('Bug fixing and issue resolution');
      expect(fixHandler.issues instanceof Map).toBe(true);
    });

    test('激活应该显示当前活跃问题数量', async () => {
      const result = await fixHandler.activate();

      expect(result.success).toBe(true);
      expect(result.mode).toBe('fix');
      expect(result.activeIssues).toBe(0);
    });

    test('应该处理报告问题请求', async () => {
      await fixHandler.activate();
      
      const request = {
        action: 'report_issue',
        params: {
          title: 'Test Bug',
          description: 'This is a test bug',
          severity: 'high',
          stackTrace: 'Error stack trace'
        }
      };

      const result = await fixHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('report_issue');
      expect(result.issue.id).toContain('ISSUE-');
      expect(result.issue.title).toBe('Test Bug');
      expect(result.issue.severity).toBe('high');
      expect(result.issue.status).toBe('open');
      expect(fixHandler.issues.has(result.issue.id)).toBe(true);
    });

    test('应该处理诊断问题请求', async () => {
      await fixHandler.activate();
      
      // 先报告一个问题
      const reportResult = await fixHandler.process({
        action: 'report_issue',
        params: { title: 'Test Issue', description: 'Test description' }
      });

      // 然后诊断这个问题
      const diagnoseRequest = {
        action: 'diagnose',
        params: { issueId: reportResult.issue.id }
      };

      const result = await fixHandler.process(diagnoseRequest);

      expect(result.success).toBe(true);
      expect(result.action).toBe('diagnose');
      expect(result.diagnosis.issueId).toBe(reportResult.issue.id);
      expect(result.diagnosis.rootCause).toBeDefined();
      expect(result.diagnosis.suggestedFix).toBeDefined();

      const issue = fixHandler.issues.get(reportResult.issue.id);
      expect(issue.status).toBe('diagnosed');
      expect(issue.diagnosis).toBeDefined();
    });

    test('应该处理应用修复请求', async () => {
      await fixHandler.activate();
      
      // 先报告并诊断问题
      const reportResult = await fixHandler.process({
        action: 'report_issue',
        params: { title: 'Test Issue', description: 'Test' }
      });

      await fixHandler.process({
        action: 'diagnose',
        params: { issueId: reportResult.issue.id }
      });

      // 应用修复
      const fixRequest = {
        action: 'apply_fix',
        params: {
          issueId: reportResult.issue.id,
          fixCode: 'Fixed code',
          files: ['file1.js', 'file2.js']
        }
      };

      const result = await fixHandler.process(fixRequest);

      expect(result.success).toBe(true);
      expect(result.action).toBe('apply_fix');
      expect(result.fix.issueId).toBe(reportResult.issue.id);
      expect(result.fix.status).toBe('applied');

      const issue = fixHandler.issues.get(reportResult.issue.id);
      expect(issue.status).toBe('fixed');
    });

    test('应该处理验证修复请求', async () => {
      await fixHandler.activate();
      
      // 创建并修复问题
      const reportResult = await fixHandler.process({
        action: 'report_issue',
        params: { title: 'Test Issue', description: 'Test' }
      });

      await fixHandler.process({
        action: 'apply_fix',
        params: { issueId: reportResult.issue.id, fixCode: 'fix' }
      });

      // 验证修复
      const verifyRequest = {
        action: 'verify_fix',
        params: {
          issueId: reportResult.issue.id,
          tests: ['test1', 'test2']
        }
      };

      const result = await fixHandler.process(verifyRequest);

      expect(result.success).toBe(true);
      expect(result.action).toBe('verify_fix');
      expect(result.verification.verified).toBe(true);

      const issue = fixHandler.issues.get(reportResult.issue.id);
      expect(issue.status).toBe('verified');
    });

    test('不存在的问题ID应该返回错误', async () => {
      await fixHandler.activate();
      
      const request = {
        action: 'diagnose',
        params: { issueId: 'NONEXISTENT-ID' }
      };

      const result = await fixHandler.process(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('AnalyzeModeHandler - 分析模式', () => {
    let analyzeHandler;

    beforeEach(() => {
      analyzeHandler = new AnalyzeModeHandler();
    });

    test('应该正确初始化Analyze模式', () => {
      expect(analyzeHandler.name).toBe('analyze');
      expect(analyzeHandler.description).toBe('Code analysis and quality assessment');
      expect(typeof analyzeHandler.metrics).toBe('object');
    });

    test('激活应该显示分析类型', async () => {
      const result = await analyzeHandler.activate();

      expect(result.success).toBe(true);
      expect(result.mode).toBe('analyze');
      expect(Array.isArray(result.analysisTypes)).toBe(true);
      expect(result.analysisTypes).toContain('quality');
      expect(result.analysisTypes).toContain('security');
    });

    test('应该处理质量分析请求', async () => {
      await analyzeHandler.activate();
      
      const request = {
        action: 'analyze_quality',
        params: { targetPath: testDir }
      };

      const result = await analyzeHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('analyze_quality');
      expect(result.metrics).toBeDefined();
      expect(result.metrics.complexity).toBeDefined();
      expect(result.metrics.maintainability).toBeDefined();
      expect(result.metrics.testCoverage).toBeDefined();
      expect(analyzeHandler.metrics.quality).toBeDefined();
    });

    test('应该处理依赖分析请求', async () => {
      await analyzeHandler.activate();
      
      const request = { action: 'analyze_dependencies' };
      const result = await analyzeHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('analyze_dependencies');
      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.total).toBeGreaterThan(0);
      expect(analyzeHandler.metrics.dependencies).toBeDefined();
    });

    test('应该处理安全分析请求', async () => {
      await analyzeHandler.activate();
      
      const request = { action: 'analyze_security' };
      const result = await analyzeHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('analyze_security');
      expect(result.security).toBeDefined();
      expect(result.security.vulnerabilities).toBeDefined();
      expect(result.security.score).toBeGreaterThan(0);
      expect(analyzeHandler.metrics.security).toBeDefined();
    });

    test('应该处理生成报告请求', async () => {
      await analyzeHandler.activate();
      
      // 先运行一些分析来填充metrics
      await analyzeHandler.process({ action: 'analyze_quality', params: {} });
      await analyzeHandler.process({ action: 'analyze_security' });

      const request = {
        action: 'generate_report',
        params: { format: 'markdown' }
      };

      const result = await analyzeHandler.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('generate_report');
      expect(result.report).toBeDefined();
      expect(result.report.title).toBe('Code Analysis Report');
      expect(result.report.summary).toBeDefined();
      expect(result.format).toBe('markdown');
    });
  });

  describe('ModeManager - 模式管理器', () => {
    let modeManager;

    beforeEach(() => {
      modeManager = new ModeManager();
    });

    test('应该正确初始化模式管理器', () => {
      expect(modeManager.modes instanceof Map).toBe(true);
      expect(modeManager.modes.size).toBe(4); // 四种模式
      expect(modeManager.currentMode).toBe(null);
      expect(Array.isArray(modeManager.history)).toBe(true);
    });

    test('应该注册所有四种模式', () => {
      expect(modeManager.modes.has('init')).toBe(true);
      expect(modeManager.modes.has('create')).toBe(true);
      expect(modeManager.modes.has('fix')).toBe(true);
      expect(modeManager.modes.has('analyze')).toBe(true);
    });

    test('应该能够切换到有效模式', async () => {
      const result = await modeManager.switchMode('create');

      expect(result.success).toBe(true);
      expect(result.mode).toBe('create');
      expect(modeManager.currentMode.name).toBe('create');
      expect(modeManager.currentMode.active).toBe(true);
    });

    test('应该记录模式转换历史', async () => {
      await modeManager.switchMode('create');
      await modeManager.switchMode('fix');

      expect(modeManager.history.length).toBe(3); // 2次激活 + 1次失活
      expect(modeManager.history[modeManager.history.length - 1].mode).toBe('fix');
    });

    test('切换到不存在的模式应该抛出错误', async () => {
      await expect(
        modeManager.switchMode('nonexistent')
      ).rejects.toThrow('Unknown mode');
    });

    test('应该验证模式转换规则', () => {
      expect(modeManager.canTransition(null, 'init')).toBe(true); // 初始选择
      expect(modeManager.canTransition('init', 'create')).toBe(true);
      expect(modeManager.canTransition('init', 'analyze')).toBe(true);
      expect(modeManager.canTransition('create', 'fix')).toBe(true);
    });

    test('应该能够处理当前模式的请求', async () => {
      await modeManager.switchMode('init');
      
      const request = {
        action: 'generate_docs',
        params: { projectName: 'Test' }
      };

      const result = await modeManager.process(request);

      expect(result.success).toBe(true);
      expect(result.action).toBe('generate_docs');
    });

    test('没有活跃模式时处理请求应该抛出错误', async () => {
      const request = { action: 'test' };

      await expect(
        modeManager.process(request)
      ).rejects.toThrow('No mode is currently active');
    });

    test('应该正确返回状态信息', async () => {
      await modeManager.switchMode('create');
      const status = modeManager.getStatus();

      expect(status.currentMode).toBeDefined();
      expect(status.currentMode.name).toBe('create');
      expect(Array.isArray(status.availableModes)).toBe(true);
      expect(status.availableModes).toHaveLength(4);
      expect(Array.isArray(status.history)).toBe(true);
      expect(Array.isArray(status.transitions)).toBe(true);
    });

    test('应该返回所有模式信息', () => {
      const allModes = modeManager.getAllModes();

      expect(typeof allModes).toBe('object');
      expect(allModes.init).toBeDefined();
      expect(allModes.init.name).toBe('init');
      expect(allModes.init.description).toBeDefined();
      expect(Array.isArray(allModes.init.allowedTransitions)).toBe(true);
    });

    test('应该能够从一个模式切换到另一个模式', async () => {
      // 初始切换到init模式
      await modeManager.switchMode('init');
      expect(modeManager.currentMode.name).toBe('init');

      // 切换到create模式
      await modeManager.switchMode('create');
      expect(modeManager.currentMode.name).toBe('create');

      // 验证历史记录
      expect(modeManager.history.length).toBeGreaterThan(2);
    });

    test('应该在切换模式时正确处理上下文', async () => {
      const context = { projectName: 'Test Project', userId: '123' };
      await modeManager.switchMode('init', context);

      expect(modeManager.currentMode.context.projectName).toBe('Test Project');
      expect(modeManager.currentMode.context.userId).toBe('123');

      const historyEntry = modeManager.history[modeManager.history.length - 1];
      expect(historyEntry.context.projectName).toBe('Test Project');
    });
  });
});

// 运行测试
testRunner.runTests().catch(console.error);