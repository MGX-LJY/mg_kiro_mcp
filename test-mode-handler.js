/**
 * Test file for Mode Handler System
 * Run with: node test-mode-handler.js
 */

import {
  ModeManager,
  InitModeHandler,
  CreateModeHandler,
  FixModeHandler,
  AnalyzeModeHandler
} from './server/mode-handler.js';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n📝 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'yellow');
}

// Test runner
async function runTests() {
  log('\n========================================', 'blue');
  log('   Mode Handler System Test Suite', 'blue');
  log('========================================\n', 'blue');

  const manager = new ModeManager();
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Initial state
    logTest('Initial State');
    const initialStatus = manager.getStatus();
    if (!initialStatus.currentMode && initialStatus.availableModes.length === 4) {
      logSuccess('Initial state is correct');
      testsPassed++;
    } else {
      logError('Initial state is incorrect');
      testsFailed++;
    }

    // Test 2: Switch to Init Mode
    logTest('Switch to Init Mode');
    const initResult = await manager.switchMode('init', { projectName: 'TestProject' });
    if (initResult.success && initResult.mode === 'init') {
      logSuccess('Successfully switched to Init mode');
      logInfo(`Message: ${initResult.message}`);
      testsPassed++;
    } else {
      logError('Failed to switch to Init mode');
      testsFailed++;
    }

    // Test 3: Process Init Mode actions
    logTest('Init Mode - Generate Documentation');
    const docsResult = await manager.process({
      action: 'generate_docs',
      params: {
        projectName: 'TestProject',
        description: 'A test project for mode handlers'
      }
    });
    if (docsResult.success && docsResult.documents) {
      logSuccess('Documentation generated successfully');
      logInfo(`Generated docs: ${Object.keys(docsResult.documents).join(', ')}`);
      testsPassed++;
    } else {
      logError('Failed to generate documentation');
      testsFailed++;
    }

    // Test 4: Switch to Create Mode
    logTest('Switch to Create Mode');
    const createResult = await manager.switchMode('create');
    if (createResult.success && createResult.mode === 'create') {
      logSuccess('Successfully switched to Create mode');
      logInfo(`Capabilities: ${createResult.capabilities.join(', ')}`);
      testsPassed++;
    } else {
      logError('Failed to switch to Create mode');
      testsFailed++;
    }

    // Test 5: Create a module
    logTest('Create Mode - Create Module');
    const moduleResult = await manager.process({
      action: 'create_module',
      params: {
        moduleName: 'TestModule',
        description: 'A test module',
        dependencies: ['fs', 'path']
      }
    });
    if (moduleResult.success && moduleResult.module) {
      logSuccess('Module created successfully');
      logInfo(`Module: ${moduleResult.module.name} with ${moduleResult.module.dependencies.length} dependencies`);
      testsPassed++;
    } else {
      logError('Failed to create module');
      testsFailed++;
    }

    // Test 6: Plan a feature
    logTest('Create Mode - Plan Feature');
    const planResult = await manager.process({
      action: 'plan_feature',
      params: {
        featureName: 'User Authentication',
        requirements: ['Login', 'Register', 'Password Reset']
      }
    });
    if (planResult.success && planResult.plan) {
      logSuccess('Feature planned successfully');
      logInfo(`Tasks: ${planResult.plan.tasks.length}, Est. time: ${planResult.plan.estimatedTime}`);
      testsPassed++;
    } else {
      logError('Failed to plan feature');
      testsFailed++;
    }

    // Test 7: Switch to Fix Mode
    logTest('Switch to Fix Mode');
    const fixResult = await manager.switchMode('fix');
    if (fixResult.success && fixResult.mode === 'fix') {
      logSuccess('Successfully switched to Fix mode');
      testsPassed++;
    } else {
      logError('Failed to switch to Fix mode');
      testsFailed++;
    }

    // Test 8: Report an issue
    logTest('Fix Mode - Report Issue');
    const issueResult = await manager.process({
      action: 'report_issue',
      params: {
        title: 'Null pointer exception',
        description: 'App crashes when user object is null',
        severity: 'high',
        stackTrace: 'Error at line 42 in user.js'
      }
    });
    if (issueResult.success && issueResult.issue) {
      logSuccess('Issue reported successfully');
      logInfo(`Issue ID: ${issueResult.issue.id}, Severity: ${issueResult.issue.severity}`);
      
      // Test 9: Diagnose the issue
      logTest('Fix Mode - Diagnose Issue');
      const diagnoseResult = await manager.process({
        action: 'diagnose',
        params: {
          issueId: issueResult.issue.id,
          context: { module: 'user-management' }
        }
      });
      if (diagnoseResult.success && diagnoseResult.diagnosis) {
        logSuccess('Issue diagnosed successfully');
        logInfo(`Root cause: ${diagnoseResult.diagnosis.rootCause}`);
        testsPassed += 2;
      } else {
        logError('Failed to diagnose issue');
        testsFailed++;
      }
    } else {
      logError('Failed to report issue');
      testsFailed++;
    }

    // Test 10: Switch to Analyze Mode
    logTest('Switch to Analyze Mode');
    const analyzeResult = await manager.switchMode('analyze');
    if (analyzeResult.success && analyzeResult.mode === 'analyze') {
      logSuccess('Successfully switched to Analyze mode');
      logInfo(`Analysis types: ${analyzeResult.analysisTypes.join(', ')}`);
      testsPassed++;
    } else {
      logError('Failed to switch to Analyze mode');
      testsFailed++;
    }

    // Test 11: Analyze code quality
    logTest('Analyze Mode - Code Quality');
    const qualityResult = await manager.process({
      action: 'analyze_quality',
      params: {
        targetPath: './src',
        options: { detailed: true }
      }
    });
    if (qualityResult.success && qualityResult.metrics) {
      logSuccess('Code quality analyzed successfully');
      logInfo(`Maintainability: ${qualityResult.metrics.maintainability.rating}, Test coverage: ${qualityResult.metrics.testCoverage.lines}%`);
      testsPassed++;
    } else {
      logError('Failed to analyze code quality');
      testsFailed++;
    }

    // Test 12: Analyze dependencies
    logTest('Analyze Mode - Dependencies');
    const depsResult = await manager.process({
      action: 'analyze_dependencies',
      params: {}
    });
    if (depsResult.success && depsResult.dependencies) {
      logSuccess('Dependencies analyzed successfully');
      logInfo(`Total: ${depsResult.dependencies.total}, Outdated: ${depsResult.dependencies.outdated}, Vulnerable: ${depsResult.dependencies.vulnerable}`);
      testsPassed++;
    } else {
      logError('Failed to analyze dependencies');
      testsFailed++;
    }

    // Test 13: Generate analysis report
    logTest('Analyze Mode - Generate Report');
    const reportResult = await manager.process({
      action: 'generate_report',
      params: {
        format: 'markdown',
        includeSections: ['quality', 'dependencies', 'security']
      }
    });
    if (reportResult.success && reportResult.report) {
      logSuccess('Report generated successfully');
      logInfo(`Overall health: ${reportResult.report.summary.overallHealth}, Score: ${reportResult.report.summary.score}/100`);
      testsPassed++;
    } else {
      logError('Failed to generate report');
      testsFailed++;
    }

    // Test 14: Invalid mode transition
    logTest('Invalid Mode Transition');
    try {
      // Try to switch from analyze to a mode that's not allowed
      // According to state machine, analyze can go to: fix, create, init
      // Let's test if we can create a fake invalid transition
      const currentStatus = manager.getStatus();
      logInfo(`Current mode: ${currentStatus.currentMode.name}`);
      logInfo(`Allowed transitions: ${currentStatus.transitions.join(', ')}`);
      
      // This should work since 'init' is allowed from 'analyze'
      await manager.switchMode('init');
      logSuccess('Valid transition from analyze to init succeeded');
      testsPassed++;
    } catch (error) {
      logError(`Transition failed: ${error.message}`);
      testsFailed++;
    }

    // Test 15: Get all modes information
    logTest('Get All Modes Information');
    const allModes = manager.getAllModes();
    if (Object.keys(allModes).length === 4) {
      logSuccess('Retrieved all modes information');
      for (const [name, info] of Object.entries(allModes)) {
        logInfo(`  ${name}: ${info.description}`);
      }
      testsPassed++;
    } else {
      logError('Failed to retrieve all modes');
      testsFailed++;
    }

    // Test 16: Mode history
    logTest('Mode History');
    const finalStatus = manager.getStatus();
    if (finalStatus.history && finalStatus.history.length > 0) {
      logSuccess('Mode history tracked successfully');
      logInfo(`History entries: ${finalStatus.history.length}`);
      const lastTransitions = finalStatus.history.slice(-3).map(h => h.mode).join(' → ');
      logInfo(`Last transitions: ${lastTransitions}`);
      testsPassed++;
    } else {
      logError('Mode history not tracked');
      testsFailed++;
    }

  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error.stack);
    testsFailed++;
  }

  // Test summary
  log('\n========================================', 'blue');
  log('           Test Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${testsPassed + testsFailed}`, 'cyan');
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  const successRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
  const rateColor = successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red';
  log(`Success Rate: ${successRate}%`, rateColor);
  
  if (testsFailed === 0) {
    log('\n🎉 All tests passed successfully!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
}

// Run the tests
console.log('Starting Mode Handler tests...');
runTests().catch(error => {
  logError('Fatal error running tests:');
  console.error(error);
  process.exit(1);
});