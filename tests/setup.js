/**
 * Jest测试环境设置
 * 全局配置和Mock设置
 */

import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';

// 设置测试超时
jest.setTimeout(30000);

// Mock文件系统操作 (避免实际文件操作)
global.mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(), 
  access: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn()
};

// Mock console.log (避免测试输出噪音)
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 测试数据工厂
global.createMockWorkflowResults = () => ({
  step_1: {
    projectPath: '/test/project',
    structure: {
      totalFiles: 10,
      totalDirectories: 5
    },
    configs: {
      detected: ['package.json']
    }
  },
  step_2: {
    detection: {
      primaryLanguage: 'javascript',
      techStack: {
        frameworks: ['Express']
      },
      projectCharacteristics: {
        type: 'backend',
        scale: 'small',
        maturity: 'development'
      }
    }
  },
  step_3: {
    files: [
      {
        relativePath: 'index.js',
        category: 'core',
        analysis: {
          type: 'main',
          complexity: { score: 5, rating: 'low' },
          dependencies: ['express']
        },
        content: { lines: 100 }
      },
      {
        relativePath: 'server/service.js', 
        category: 'service',
        analysis: {
          type: 'service',
          complexity: { score: 8, rating: 'medium' },
          dependencies: ['fs', 'path']
        },
        content: { lines: 200 }
      }
    ],
    dependencies: {
      nodes: ['index.js', 'server/service.js'],
      edges: [
        { from: 'index.js', to: 'server/service.js', type: 'import' }
      ]
    }
  },
  step_5: {
    analysis: {
      modules: [
        {
          id: 'index_js',
          name: 'index',
          relativePath: 'index.js',
          category: 'core',
          type: 'main',
          metrics: { lines: 100, functions: 5, classes: 1, complexity: 5 },
          dependencies: { imports: ['express'], exports: [] }
        },
        {
          id: 'service_js', 
          name: 'service',
          relativePath: 'server/service.js',
          category: 'service',
          type: 'service',
          metrics: { lines: 200, functions: 10, classes: 2, complexity: 8 },
          dependencies: { imports: ['fs', 'path'], exports: ['ServiceManager'] }
        }
      ]
    }
  }
});

// Mock HTTP请求
global.mockRequest = (overrides = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  ...overrides
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// 清理函数
global.cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
};

// 错误断言助手
global.expectError = async (asyncFn, expectedMessage) => {
  let error;
  try {
    await asyncFn();
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage);
  }
  return error;
};

// 性能测试助手
global.measureTime = async (asyncFn) => {
  const start = Date.now();
  const result = await asyncFn();
  const duration = Date.now() - start;
  return { result, duration };
};

console.log('🧪 Jest测试环境初始化完成');