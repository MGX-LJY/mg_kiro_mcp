/**
 * Jest Configuration for mg_kiro MCP Server
 * ES模块和异步测试支持
 */

export default {
  // 测试环境配置
  testEnvironment: 'node',
  
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