import fs from 'fs';
import path from 'path';

/**
 * 简单的测试运行器
 * 为了避免依赖外部测试框架，实现基本的测试功能
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.beforeEachCallbacks = [];
    this.afterEachCallbacks = [];
    this.currentSuite = '';
    this.stats = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  describe(suiteName, callback) {
    this.currentSuite = suiteName;
    console.log(`\n📁 ${suiteName}`);
    callback();
    this.currentSuite = '';
  }

  test(testName, testFunction) {
    this.tests.push({
      suite: this.currentSuite,
      name: testName,
      fn: testFunction
    });
  }

  beforeEach(callback) {
    this.beforeEachCallbacks.push(callback);
  }

  afterEach(callback) {
    this.afterEachCallbacks.push(callback);
  }

  expect(actual) {
    return new Expectation(actual);
  }

  async runTests() {
    console.log('🧪 开始运行测试...\n');
    
    for (const test of this.tests) {
      this.stats.total++;
      
      try {
        // 运行 beforeEach 回调
        for (const callback of this.beforeEachCallbacks) {
          await callback();
        }

        // 运行测试
        await test.fn();
        
        // 运行 afterEach 回调
        for (const callback of this.afterEachCallbacks) {
          await callback();
        }

        console.log(`  ✅ ${test.name}`);
        this.stats.passed++;
        
      } catch (error) {
        console.log(`  ❌ ${test.name}`);
        console.log(`     💭 ${error.message}`);
        this.stats.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`✅ 通过: ${this.stats.passed}`);
    console.log(`❌ 失败: ${this.stats.failed}`);
    console.log(`📊 总计: ${this.stats.total}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.passed / this.stats.total) * 100).toFixed(1);
      console.log(`📈 成功率: ${successRate}%`);
    }

    if (this.stats.failed > 0) {
      console.log(`\n⚠️  有 ${this.stats.failed} 个测试失败`);
      process.exit(1);
    } else {
      console.log('\n🎉 所有测试通过！');
    }
  }
}

/**
 * 期望值断言类
 */
class Expectation {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`期望 ${JSON.stringify(expected)}，但得到 ${JSON.stringify(this.actual)}`);
    }
    return this;
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error('期望值已定义，但得到 undefined');
    }
    return this;
  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`期望 null，但得到 ${JSON.stringify(this.actual)}`);
    }
    return this;
  }

  toThrow(expectedMessage) {
    if (typeof this.actual !== 'function') {
      throw new Error('期望一个函数');
    }

    try {
      this.actual();
      throw new Error('期望抛出异常，但没有抛出');
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`期望异常包含 "${expectedMessage}"，但得到 "${error.message}"`);
      }
    }
    return this;
  }

  toHaveLength(length) {
    if (!this.actual || typeof this.actual.length !== 'number') {
      throw new Error('期望有 length 属性的对象');
    }
    if (this.actual.length !== length) {
      throw new Error(`期望长度为 ${length}，但得到 ${this.actual.length}`);
    }
    return this;
  }

  toBeGreaterThan(value) {
    if (this.actual <= value) {
      throw new Error(`期望 ${this.actual} 大于 ${value}`);
    }
    return this;
  }

  get not() {
    return new NotExpectation(this.actual);
  }

  get rejects() {
    return new RejectionExpectation(this.actual);
  }
}

/**
 * 否定期望
 */
class NotExpectation {
  constructor(actual) {
    this.actual = actual;
  }

  toThrow() {
    if (typeof this.actual !== 'function') {
      throw new Error('期望一个函数');
    }

    try {
      this.actual();
    } catch (error) {
      throw new Error(`期望不抛出异常，但抛出了: ${error.message}`);
    }
    return this;
  }
}

/**
 * Promise 拒绝期望
 */
class RejectionExpectation {
  constructor(actual) {
    this.actual = actual;
  }

  async toThrow(expectedMessage) {
    try {
      await this.actual;
      throw new Error('期望Promise被拒绝，但它被解决了');
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`期望异常包含 "${expectedMessage}"，但得到 "${error.message}"`);
      }
    }
    return this;
  }
}

// 创建全局测试运行器实例
const testRunner = new TestRunner();

// 导出全局函数
global.describe = (name, fn) => testRunner.describe(name, fn);
global.test = (name, fn) => testRunner.test(name, fn);
global.beforeEach = (fn) => testRunner.beforeEach(fn);
global.afterEach = (fn) => testRunner.afterEach(fn);
global.expect = (actual) => testRunner.expect(actual);

export default testRunner;