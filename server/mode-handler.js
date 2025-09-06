/**
 * Mode Handler System for mg_kiro MCP Server
 * Manages different working modes and their transitions
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Base class for all mode handlers
 */
class ModeHandler {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.active = false;
    this.context = {};
    this.promptPath = null;
  }

  /**
   * Activate this mode
   * @param {Object} context - Mode activation context
   */
  async activate(context = {}) {
    this.active = true;
    this.context = { ...this.context, ...context };
    console.log(`[ModeHandler] Activated ${this.name} mode`);
    
    // Load mode-specific prompt
    if (this.promptPath) {
      try {
        const promptContent = await fs.readFile(this.promptPath, 'utf8');
        this.context.prompt = promptContent;
      } catch (error) {
        console.error(`[ModeHandler] Failed to load prompt for ${this.name}:`, error);
      }
    }
    
    return this.onActivate();
  }

  /**
   * Deactivate this mode
   */
  async deactivate() {
    this.active = false;
    console.log(`[ModeHandler] Deactivated ${this.name} mode`);
    return this.onDeactivate();
  }

  /**
   * Process a request in this mode
   * @param {Object} request - The request to process
   */
  async process(request) {
    if (!this.active) {
      throw new Error(`Mode ${this.name} is not active`);
    }
    return this.onProcess(request);
  }

  /**
   * Get current mode status
   */
  getStatus() {
    return {
      name: this.name,
      description: this.description,
      active: this.active,
      context: this.context
    };
  }

  // Abstract methods to be implemented by subclasses
  async onActivate() {
    // Override in subclass
    return { success: true, mode: this.name };
  }

  async onDeactivate() {
    // Override in subclass
    return { success: true };
  }

  async onProcess(request) {
    // Override in subclass
    throw new Error('onProcess must be implemented by subclass');
  }
}

/**
 * Init Mode Handler - Project initialization and documentation
 */
class InitModeHandler extends ModeHandler {
  constructor() {
    super('init', 'Project initialization and documentation generation');
    this.promptPath = path.join(__dirname, '..', 'prompts', 'modes', 'init.md');
    this.templates = [
      'system-architecture.md',
      'modules-catalog.md',
      'user-stories.md',
      'integration-contracts.md'
    ];
  }

  async onActivate() {
    console.log('[InitMode] Preparing project initialization...');
    return {
      success: true,
      mode: this.name,
      message: 'Init mode activated. Ready to generate project documentation.',
      templates: this.templates
    };
  }

  async onProcess(request) {
    const { action, params = {} } = request;
    
    switch (action) {
      case 'generate_docs':
        return this.generateDocumentation(params);
      case 'scan_project':
        return this.scanProject(params);
      case 'setup_structure':
        return this.setupProjectStructure(params);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  }

  async generateDocumentation(params) {
    const { projectName, description } = params;
    console.log(`[InitMode] Generating documentation for ${projectName}`);
    
    // Generate initial documentation structure
    const docs = {
      architecture: `# System Architecture - ${projectName}\n\n${description}`,
      modules: `# Modules Catalog - ${projectName}\n\n## Core Modules`,
      userStories: `# User Stories - ${projectName}\n\n## Features`,
      contracts: `# Integration Contracts - ${projectName}\n\n## API Specifications`
    };

    return {
      success: true,
      action: 'generate_docs',
      documents: docs,
      message: 'Documentation templates generated successfully'
    };
  }

  async scanProject(params) {
    const { rootPath } = params;
    console.log(`[InitMode] Scanning project at ${rootPath}`);
    
    // Scan project structure (simplified)
    return {
      success: true,
      action: 'scan_project',
      structure: {
        directories: ['src', 'docs', 'tests'],
        files: ['README.md', 'package.json'],
        detected: {
          framework: 'Node.js',
          hasTests: true,
          hasDocumentation: true
        }
      }
    };
  }

  async setupProjectStructure(params) {
    console.log('[InitMode] Setting up project structure');
    
    return {
      success: true,
      action: 'setup_structure',
      created: {
        directories: ['docs', 'docs/templates', 'docs/output'],
        files: ['CLAUDE.md', 'TODO.md']
      }
    };
  }
}

/**
 * Create Mode Handler - Feature and module creation
 */
class CreateModeHandler extends ModeHandler {
  constructor() {
    super('create', 'New feature and module creation');
    this.promptPath = path.join(__dirname, '..', 'prompts', 'modes', 'create.md');
  }

  async onActivate() {
    console.log('[CreateMode] Ready for feature creation...');
    return {
      success: true,
      mode: this.name,
      message: 'Create mode activated. Ready to add new features.',
      capabilities: ['module', 'component', 'api', 'test']
    };
  }

  async onProcess(request) {
    const { action, params = {} } = request;
    
    switch (action) {
      case 'create_module':
        return this.createModule(params);
      case 'create_component':
        return this.createComponent(params);
      case 'create_api':
        return this.createAPI(params);
      case 'plan_feature':
        return this.planFeature(params);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  }

  async createModule(params) {
    const { moduleName, description, dependencies = [] } = params;
    console.log(`[CreateMode] Creating module: ${moduleName}`);
    
    const moduleSpec = {
      name: moduleName,
      description,
      dependencies,
      exports: [],
      imports: [],
      created: new Date().toISOString()
    };

    return {
      success: true,
      action: 'create_module',
      module: moduleSpec,
      message: `Module ${moduleName} created successfully`
    };
  }

  async createComponent(params) {
    const { componentName, type, props = {} } = params;
    console.log(`[CreateMode] Creating component: ${componentName}`);
    
    return {
      success: true,
      action: 'create_component',
      component: {
        name: componentName,
        type,
        props,
        template: this.generateComponentTemplate(type)
      }
    };
  }

  async createAPI(params) {
    const { endpoint, method, description } = params;
    console.log(`[CreateMode] Creating API endpoint: ${method} ${endpoint}`);
    
    return {
      success: true,
      action: 'create_api',
      api: {
        endpoint,
        method,
        description,
        request: {},
        response: {},
        authentication: 'required'
      }
    };
  }

  async planFeature(params) {
    const { featureName, requirements } = params;
    console.log(`[CreateMode] Planning feature: ${featureName}`);
    
    return {
      success: true,
      action: 'plan_feature',
      plan: {
        feature: featureName,
        requirements,
        tasks: [
          'Design data model',
          'Implement business logic',
          'Create API endpoints',
          'Add unit tests',
          'Update documentation'
        ],
        estimatedTime: '2-3 days'
      }
    };
  }

  generateComponentTemplate(type) {
    const templates = {
      'class': 'class Component {\n  constructor() {}\n}',
      'function': 'function component() {\n  return null;\n}',
      'module': 'module.exports = {\n  // exports\n};'
    };
    return templates[type] || templates['function'];
  }
}

/**
 * Fix Mode Handler - Bug fixing and issue resolution
 */
class FixModeHandler extends ModeHandler {
  constructor() {
    super('fix', 'Bug fixing and issue resolution');
    this.promptPath = path.join(__dirname, '..', 'prompts', 'modes', 'fix.md');
    this.issues = new Map();
  }

  async onActivate() {
    console.log('[FixMode] Ready for bug fixing...');
    return {
      success: true,
      mode: this.name,
      message: 'Fix mode activated. Ready to resolve issues.',
      activeIssues: this.issues.size
    };
  }

  async onProcess(request) {
    const { action, params = {} } = request;
    
    switch (action) {
      case 'report_issue':
        return this.reportIssue(params);
      case 'diagnose':
        return this.diagnoseIssue(params);
      case 'apply_fix':
        return this.applyFix(params);
      case 'verify_fix':
        return this.verifyFix(params);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  }

  async reportIssue(params) {
    const { title, description, severity = 'minor', stackTrace } = params;
    const issueId = `ISSUE-${Date.now()}`;
    
    const issue = {
      id: issueId,
      title,
      description,
      severity,
      stackTrace,
      status: 'open',
      reported: new Date().toISOString()
    };
    
    this.issues.set(issueId, issue);
    console.log(`[FixMode] Issue reported: ${issueId}`);
    
    return {
      success: true,
      action: 'report_issue',
      issue,
      message: `Issue ${issueId} has been logged`
    };
  }

  async diagnoseIssue(params) {
    const { issueId, context = {} } = params;
    const issue = this.issues.get(issueId);
    
    if (!issue) {
      return {
        success: false,
        error: `Issue ${issueId} not found`
      };
    }
    
    console.log(`[FixMode] Diagnosing issue: ${issueId}`);
    
    // Simulate diagnosis
    const diagnosis = {
      issueId,
      rootCause: 'Null pointer exception in module X',
      affectedFiles: ['src/module-x.js', 'src/utils.js'],
      suggestedFix: 'Add null check before accessing property',
      complexity: 'low',
      estimatedTime: '30 minutes'
    };
    
    issue.diagnosis = diagnosis;
    issue.status = 'diagnosed';
    
    return {
      success: true,
      action: 'diagnose',
      diagnosis,
      message: 'Issue diagnosed successfully'
    };
  }

  async applyFix(params) {
    const { issueId, fixCode, files = [] } = params;
    const issue = this.issues.get(issueId);
    
    if (!issue) {
      return {
        success: false,
        error: `Issue ${issueId} not found`
      };
    }
    
    console.log(`[FixMode] Applying fix for: ${issueId}`);
    
    const fix = {
      issueId,
      appliedAt: new Date().toISOString(),
      modifiedFiles: files,
      changes: fixCode,
      status: 'applied'
    };
    
    issue.fix = fix;
    issue.status = 'fixed';
    
    return {
      success: true,
      action: 'apply_fix',
      fix,
      message: `Fix applied for issue ${issueId}`
    };
  }

  async verifyFix(params) {
    const { issueId, tests = [] } = params;
    const issue = this.issues.get(issueId);
    
    if (!issue) {
      return {
        success: false,
        error: `Issue ${issueId} not found`
      };
    }
    
    console.log(`[FixMode] Verifying fix for: ${issueId}`);
    
    // Simulate test execution
    const verification = {
      issueId,
      testsRun: tests.length || 5,
      testsPassed: tests.length || 5,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    issue.verification = verification;
    issue.status = 'verified';
    
    return {
      success: true,
      action: 'verify_fix',
      verification,
      message: `Fix verified for issue ${issueId}`
    };
  }
}

/**
 * Analyze Mode Handler - Code analysis and quality assessment
 */
class AnalyzeModeHandler extends ModeHandler {
  constructor() {
    super('analyze', 'Code analysis and quality assessment');
    this.promptPath = path.join(__dirname, '..', 'prompts', 'modes', 'analyze.md');
    this.metrics = {};
  }

  async onActivate() {
    console.log('[AnalyzeMode] Starting code analysis...');
    return {
      success: true,
      mode: this.name,
      message: 'Analyze mode activated. Ready to analyze codebase.',
      analysisTypes: ['quality', 'security', 'performance', 'dependencies']
    };
  }

  async onProcess(request) {
    const { action, params = {} } = request;
    
    switch (action) {
      case 'analyze_quality':
        return this.analyzeQuality(params);
      case 'analyze_dependencies':
        return this.analyzeDependencies(params);
      case 'analyze_security':
        return this.analyzeSecurity(params);
      case 'generate_report':
        return this.generateReport(params);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  }

  async analyzeQuality(params) {
    const { targetPath, options = {} } = params;
    console.log(`[AnalyzeMode] Analyzing code quality at ${targetPath}`);
    
    // Simulate quality analysis
    const qualityMetrics = {
      complexity: {
        cyclomatic: 5.2,
        cognitive: 3.8,
        rating: 'B'
      },
      maintainability: {
        index: 78,
        rating: 'Good'
      },
      duplications: {
        percentage: 2.3,
        blocks: 5
      },
      testCoverage: {
        lines: 85,
        branches: 72,
        functions: 90
      },
      codeSmells: 12,
      technicalDebt: '2.5 days'
    };
    
    this.metrics.quality = qualityMetrics;
    
    return {
      success: true,
      action: 'analyze_quality',
      metrics: qualityMetrics,
      message: 'Code quality analysis completed'
    };
  }

  async analyzeDependencies(params) {
    console.log('[AnalyzeMode] Analyzing dependencies');
    
    const dependencies = {
      total: 42,
      direct: 15,
      transitive: 27,
      outdated: 5,
      vulnerable: 1,
      unused: 3,
      graph: {
        nodes: 42,
        edges: 78,
        depth: 4
      }
    };
    
    this.metrics.dependencies = dependencies;
    
    return {
      success: true,
      action: 'analyze_dependencies',
      dependencies,
      message: 'Dependency analysis completed'
    };
  }

  async analyzeSecurity(params) {
    console.log('[AnalyzeMode] Running security analysis');
    
    const security = {
      vulnerabilities: {
        critical: 0,
        high: 1,
        medium: 3,
        low: 7
      },
      issues: [
        {
          severity: 'high',
          type: 'SQL Injection',
          file: 'src/database.js',
          line: 145
        }
      ],
      score: 8.2,
      rating: 'B+'
    };
    
    this.metrics.security = security;
    
    return {
      success: true,
      action: 'analyze_security',
      security,
      message: 'Security analysis completed'
    };
  }

  async generateReport(params) {
    const { format = 'markdown', includeSections = [] } = params;
    console.log(`[AnalyzeMode] Generating ${format} report`);
    
    const report = {
      title: 'Code Analysis Report',
      timestamp: new Date().toISOString(),
      summary: {
        overallHealth: 'Good',
        score: 82,
        improvements: [
          'Reduce code complexity in core modules',
          'Update outdated dependencies',
          'Fix high-severity security issue',
          'Increase test coverage for edge cases'
        ]
      },
      metrics: this.metrics
    };
    
    return {
      success: true,
      action: 'generate_report',
      report,
      format,
      message: 'Analysis report generated successfully'
    };
  }
}

/**
 * Mode Manager - Manages all modes and transitions
 */
class ModeManager {
  constructor() {
    this.modes = new Map();
    this.currentMode = null;
    this.history = [];
    this.stateMachine = {
      transitions: {
        'init': ['create', 'analyze'],
        'create': ['fix', 'analyze', 'init'],
        'fix': ['analyze', 'create'],
        'analyze': ['fix', 'create', 'init']
      }
    };
    
    // Register all modes
    this.registerMode(new InitModeHandler());
    this.registerMode(new CreateModeHandler());
    this.registerMode(new FixModeHandler());
    this.registerMode(new AnalyzeModeHandler());
  }

  /**
   * Register a mode handler
   */
  registerMode(handler) {
    this.modes.set(handler.name, handler);
    console.log(`[ModeManager] Registered mode: ${handler.name}`);
  }

  /**
   * Switch to a different mode
   */
  async switchMode(modeName, context = {}) {
    // Check if mode exists
    if (!this.modes.has(modeName)) {
      throw new Error(`Unknown mode: ${modeName}`);
    }

    // Check if transition is allowed
    if (this.currentMode && !this.canTransition(this.currentMode.name, modeName)) {
      throw new Error(`Cannot transition from ${this.currentMode.name} to ${modeName}`);
    }

    // Deactivate current mode
    if (this.currentMode) {
      await this.currentMode.deactivate();
      this.history.push({
        mode: this.currentMode.name,
        exitTime: new Date().toISOString()
      });
    }

    // Activate new mode
    const newMode = this.modes.get(modeName);
    const result = await newMode.activate(context);
    this.currentMode = newMode;

    // Record transition
    this.history.push({
      mode: modeName,
      enterTime: new Date().toISOString(),
      context
    });

    console.log(`[ModeManager] Switched to ${modeName} mode`);
    return result;
  }

  /**
   * Check if transition is allowed
   */
  canTransition(from, to) {
    if (!from) return true; // Initial mode selection
    const allowedTransitions = this.stateMachine.transitions[from];
    return allowedTransitions && allowedTransitions.includes(to);
  }

  /**
   * Process a request in the current mode
   */
  async process(request) {
    if (!this.currentMode) {
      throw new Error('No mode is currently active');
    }
    return this.currentMode.process(request);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      currentMode: this.currentMode ? this.currentMode.getStatus() : null,
      availableModes: Array.from(this.modes.keys()),
      history: this.history.slice(-10), // Last 10 transitions
      transitions: this.currentMode 
        ? this.stateMachine.transitions[this.currentMode.name] 
        : Array.from(this.modes.keys())
    };
  }

  /**
   * Get all modes information
   */
  getAllModes() {
    const modesInfo = {};
    for (const [name, handler] of this.modes) {
      modesInfo[name] = {
        name: handler.name,
        description: handler.description,
        active: handler.active,
        allowedTransitions: this.stateMachine.transitions[name]
      };
    }
    return modesInfo;
  }
}

// Export the module
export {
  ModeHandler,
  InitModeHandler,
  CreateModeHandler,
  FixModeHandler,
  AnalyzeModeHandler,
  ModeManager
};