/**
 * Jest Configuration for mg_kiro MCP Server
 * ES模块和异步测试支持
 */

export default {
  // 测试环境配置
  testEnvironment: 'node',
  
  // 模块解析
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // 忽略的测试目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/'
  ],
  
  // 变换配置 - 使用babel处理ES模块
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },
  
  // 变换忽略模式
  transformIgnorePatterns: [
    'node_modules/(?!(@jest/globals|supertest)/)'
  ],
  
  // 覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'server/**/*.js',
    'index.js',
    '!server/**/*.test.js',
    '!server/**/*.spec.js',
    '!**/node_modules/**'
  ],
  
  // 设置和清理
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 测试超时 (30秒)
  testTimeout: 30000,
  
  // 最大并发测试数
  maxConcurrency: 5,
  
  // 详细输出
  verbose: true
};