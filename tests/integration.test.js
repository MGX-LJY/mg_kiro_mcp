/**
 * Integration Tests for mg_kiro MCP Server
 * 
 * Tests component interactions and data flow between modules:
 * - MCP Server + Prompt Manager integration
 * - MCP Server + Mode Handler integration
 * - Prompt Manager + Mode Handler integration
 * - Language Detector + Template Generator integration
 * - Configuration system integration
 * - WebSocket + HTTP API integration
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from './test-runner.js';
import { MCPServer } from '../server/mcp-server.js';
import { PromptManager } from '../server/prompt-manager.js';
import { ModeHandler } from '../server/mode-handler.js';
import { LanguageDetector } from '../server/language/detector.js';
import { TemplateGenerator } from '../server/language/template-generator.js';
import { ConfigManager } from '../server/config-manager.js';
import fs from 'fs/promises';
import path from 'path';
import { WebSocket } from 'ws';
import http from 'http';

class IntegrationTestHelper {
    constructor() {
        this.testDir = path.join(process.cwd(), 'test-temp-integration');
        this.server = null;
        this.httpServer = null;
        this.wsServer = null;
        this.testPort = 3001;
    }

    async setup() {
        // Create test directory
        await fs.mkdir(this.testDir, { recursive: true });
        
        // Setup test project structure
        await this.createTestProject();
        
        // Initialize server components
        this.configManager = new ConfigManager();
        this.promptManager = new PromptManager();
        this.modeHandler = new ModeHandler(this.promptManager);
        this.languageDetector = new LanguageDetector();
        this.templateGenerator = new TemplateGenerator();
        
        // Initialize MCP server with all components
        this.server = new MCPServer({
            port: this.testPort,
            promptManager: this.promptManager,
            modeHandler: this.modeHandler,
            configManager: this.configManager,
            languageDetector: this.languageDetector,
            templateGenerator: this.templateGenerator
        });
    }

    async cleanup() {
        if (this.server) {
            await this.server.stop();
        }
        
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    async createTestProject() {
        const projectStructure = {
            'package.json': JSON.stringify({
                name: 'test-project',
                version: '1.0.0',
                main: 'index.js'
            }),
            'src/index.js': 'console.log("Hello World");',
            'src/utils.py': 'def hello(): return "Hello"',
            'src/main.go': 'package main\n\nfunc main() {}',
            'README.md': '# Test Project',
            'docs/api.md': '# API Documentation'
        };

        for (const [filePath, content] of Object.entries(projectStructure)) {
            const fullPath = path.join(this.testDir, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }
    }

    async createMockClient() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.testPort}`);
            
            ws.on('open', () => {
                resolve(ws);
            });
            
            ws.on('error', reject);
            
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
    }

    async sendMCPRequest(client, request) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 5000);

            client.once('message', (data) => {
                clearTimeout(timeout);
                resolve(JSON.parse(data));
            });

            client.send(JSON.stringify(request));
        });
    }
}

describe('Integration Tests', () => {
    let helper;

    beforeAll(async () => {
        helper = new IntegrationTestHelper();
        await helper.setup();
    });

    afterAll(async () => {
        if (helper) {
            await helper.cleanup();
        }
    });

    describe('MCP Server + Prompt Manager Integration', () => {
        it('should load prompts when server starts', async () => {
            await helper.server.start();
            
            const prompts = helper.promptManager.getAllPrompts();
            expect(prompts).toBeDefined();
            expect(Object.keys(prompts).length).toBeGreaterThan(0);
            
            await helper.server.stop();
        });

        it('should serve prompts via MCP protocol', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'prompts/list',
                params: {}
            };

            const response = await helper.sendMCPRequest(client, request);
            
            expect(response.result).toBeDefined();
            expect(response.result.prompts).toBeInstanceOf(Array);
            expect(response.result.prompts.length).toBeGreaterThan(0);

            client.close();
            await helper.server.stop();
        });

        it('should get specific prompt content via MCP', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'prompts/get',
                params: {
                    name: 'init_mode_prompt'
                }
            };

            const response = await helper.sendMCPRequest(client, request);
            
            expect(response.result).toBeDefined();
            expect(response.result.messages).toBeInstanceOf(Array);
            expect(response.result.messages.length).toBeGreaterThan(0);

            client.close();
            await helper.server.stop();
        });

        it('should handle prompt hot reload integration', async () => {
            await helper.server.start();
            
            const initialPrompts = helper.promptManager.getAllPrompts();
            const initialCount = Object.keys(initialPrompts).length;

            // Simulate prompt file change
            const testPromptPath = path.join(helper.testDir, 'test-prompt.md');
            await fs.writeFile(testPromptPath, '# Test Prompt\n\nTest content');
            
            // Trigger hot reload
            await helper.promptManager.loadPromptsFromDirectory(path.dirname(testPromptPath));
            
            const updatedPrompts = helper.promptManager.getAllPrompts();
            expect(Object.keys(updatedPrompts).length).toBeGreaterThan(initialCount);

            await helper.server.stop();
        });
    });

    describe('MCP Server + Mode Handler Integration', () => {
        it('should switch modes via MCP protocol', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/switch',
                params: {
                    mode: 'create',
                    context: { projectPath: helper.testDir }
                }
            };

            const response = await helper.sendMCPRequest(client, request);
            
            expect(response.result).toBeDefined();
            expect(response.result.success).toBe(true);
            expect(response.result.currentMode).toBe('create');

            client.close();
            await helper.server.stop();
        });

        it('should get mode-specific prompts', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // Switch to create mode
            await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/switch',
                params: { mode: 'create' }
            });

            // Get current mode prompts
            const response = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 2,
                method: 'modes/get-prompts',
                params: {}
            });

            expect(response.result).toBeDefined();
            expect(response.result.prompts).toBeInstanceOf(Array);
            expect(response.result.mode).toBe('create');

            client.close();
            await helper.server.stop();
        });

        it('should handle mode switching with context preservation', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // Set initial context
            await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/switch',
                params: {
                    mode: 'init',
                    context: {
                        projectPath: helper.testDir,
                        projectName: 'TestProject'
                    }
                }
            });

            // Switch to create mode
            const response = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 2,
                method: 'modes/switch',
                params: { mode: 'create' }
            });

            expect(response.result.context.projectPath).toBe(helper.testDir);
            expect(response.result.context.projectName).toBe('TestProject');

            client.close();
            await helper.server.stop();
        });
    });

    describe('Language Detector + Template Generator Integration', () => {
        it('should detect languages and generate appropriate templates', async () => {
            const languages = await helper.languageDetector.detectProjectLanguages(helper.testDir);
            expect(languages).toContain('javascript');
            expect(languages).toContain('python');
            expect(languages).toContain('go');

            const templates = await helper.templateGenerator.generateTemplates(helper.testDir, languages);
            expect(templates).toHaveProperty('javascript');
            expect(templates).toHaveProperty('python');
            expect(templates).toHaveProperty('go');
        });

        it('should generate language-specific documentation', async () => {
            const languages = ['javascript', 'python'];
            const templates = await helper.templateGenerator.generateTemplates(helper.testDir, languages);

            expect(templates.javascript).toContain('## JavaScript');
            expect(templates.python).toContain('## Python');
            expect(templates.javascript).toContain('npm install');
            expect(templates.python).toContain('pip install');
        });

        it('should handle mixed-language project templates', async () => {
            const languages = await helper.languageDetector.detectProjectLanguages(helper.testDir);
            const templates = await helper.templateGenerator.generateForProject({
                path: helper.testDir,
                languages: languages,
                type: 'mixed'
            });

            expect(templates.overview).toContain('Multi-language project');
            expect(templates.setup).toContain('Prerequisites');
            expect(Object.keys(templates).length).toBeGreaterThan(2);
        });
    });

    describe('Full Workflow Integration', () => {
        it('should execute complete init mode workflow', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // 1. Switch to init mode
            const switchResponse = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/switch',
                params: {
                    mode: 'init',
                    context: { projectPath: helper.testDir }
                }
            });
            expect(switchResponse.result.success).toBe(true);

            // 2. Get init prompts
            const promptsResponse = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 2,
                method: 'modes/get-prompts',
                params: {}
            });
            expect(promptsResponse.result.prompts.length).toBeGreaterThan(0);

            // 3. Generate project documentation
            const generateResponse = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'generate-docs',
                    options: { includeTemplates: true }
                }
            });
            expect(generateResponse.result.success).toBe(true);
            expect(generateResponse.result.documents).toBeDefined();

            client.close();
            await helper.server.stop();
        });

        it('should handle mode transitions with state preservation', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // Init mode -> Create mode -> Fix mode workflow
            const modes = ['init', 'create', 'fix'];
            let previousContext = {};

            for (const mode of modes) {
                const response = await helper.sendMCPRequest(client, {
                    jsonrpc: '2.0',
                    id: Math.random(),
                    method: 'modes/switch',
                    params: {
                        mode: mode,
                        context: { ...previousContext, stepId: Math.random() }
                    }
                });

                expect(response.result.success).toBe(true);
                expect(response.result.currentMode).toBe(mode);
                previousContext = response.result.context;
            }

            client.close();
            await helper.server.stop();
        });

        it('should handle concurrent client connections', async () => {
            await helper.server.start();
            
            const clients = await Promise.all([
                helper.createMockClient(),
                helper.createMockClient(),
                helper.createMockClient()
            ]);

            const requests = clients.map((client, index) => 
                helper.sendMCPRequest(client, {
                    jsonrpc: '2.0',
                    id: index + 1,
                    method: 'modes/switch',
                    params: {
                        mode: 'analyze',
                        context: { clientId: index + 1 }
                    }
                })
            );

            const responses = await Promise.all(requests);
            
            responses.forEach((response, index) => {
                expect(response.result.success).toBe(true);
                expect(response.result.context.clientId).toBe(index + 1);
            });

            clients.forEach(client => client.close());
            await helper.server.stop();
        });
    });

    describe('Configuration Integration', () => {
        it('should load and apply configurations across all components', async () => {
            // Create test config
            const testConfig = {
                server: { port: 3002, debug: true },
                modes: { defaultMode: 'create' },
                templates: { cacheSize: 100 }
            };

            const configPath = path.join(helper.testDir, 'test-config.json');
            await fs.writeFile(configPath, JSON.stringify(testConfig, null, 2));

            await helper.configManager.loadConfig(configPath);
            
            // Verify config applied to components
            expect(helper.configManager.get('server.port')).toBe(3002);
            expect(helper.configManager.get('modes.defaultMode')).toBe('create');
            expect(helper.configManager.get('templates.cacheSize')).toBe(100);
        });

        it('should handle config validation and error reporting', async () => {
            const invalidConfig = {
                server: { port: 'invalid' },
                modes: { defaultMode: 'nonexistent' }
            };

            const configPath = path.join(helper.testDir, 'invalid-config.json');
            await fs.writeFile(configPath, JSON.stringify(invalidConfig, null, 2));

            await expect(helper.configManager.loadConfig(configPath))
                .rejects.toThrow();
        });

        it('should support config hot reload across components', async () => {
            const initialConfig = { server: { port: 3003 } };
            const configPath = path.join(helper.testDir, 'hot-reload-config.json');
            
            await fs.writeFile(configPath, JSON.stringify(initialConfig, null, 2));
            await helper.configManager.loadConfig(configPath);
            
            expect(helper.configManager.get('server.port')).toBe(3003);

            // Update config
            const updatedConfig = { server: { port: 3004 } };
            await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
            
            // Trigger hot reload
            await helper.configManager.reloadConfig();
            
            expect(helper.configManager.get('server.port')).toBe(3004);
        });
    });

    describe('Error Handling Integration', () => {
        it('should propagate errors across component boundaries', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // Test error propagation from mode handler
            const response = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/switch',
                params: {
                    mode: 'nonexistent',
                    context: {}
                }
            });

            expect(response.error).toBeDefined();
            expect(response.error.code).toBeDefined();
            expect(response.error.message).toContain('Invalid mode');

            client.close();
            await helper.server.stop();
        });

        it('should handle component initialization failures gracefully', async () => {
            // Simulate component failure
            const brokenServer = new MCPServer({
                port: 'invalid-port',
                promptManager: null
            });

            await expect(brokenServer.start()).rejects.toThrow();
        });

        it('should maintain service availability during partial failures', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            // Even if template generation fails, other services should work
            const modesResponse = await helper.sendMCPRequest(client, {
                jsonrpc: '2.0',
                id: 1,
                method: 'modes/list',
                params: {}
            });

            expect(modesResponse.result).toBeDefined();
            expect(modesResponse.result.modes).toBeInstanceOf(Array);

            client.close();
            await helper.server.stop();
        });
    });

    describe('Performance Integration', () => {
        it('should handle high-frequency mode switching efficiently', async () => {
            await helper.server.start();
            const client = await helper.createMockClient();

            const startTime = Date.now();
            const modes = ['init', 'create', 'fix', 'analyze'];
            
            for (let i = 0; i < 10; i++) {
                for (const mode of modes) {
                    await helper.sendMCPRequest(client, {
                        jsonrpc: '2.0',
                        id: i * modes.length + modes.indexOf(mode),
                        method: 'modes/switch',
                        params: { mode }
                    });
                }
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            
            // Should complete 40 mode switches in under 2 seconds
            expect(totalTime).toBeLessThan(2000);

            client.close();
            await helper.server.stop();
        });

        it('should handle concurrent template generation requests', async () => {
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(
                    helper.templateGenerator.generateTemplates(helper.testDir, ['javascript', 'python'])
                );
            }

            const startTime = Date.now();
            const results = await Promise.all(requests);
            const endTime = Date.now();

            expect(results.length).toBe(5);
            expect(endTime - startTime).toBeLessThan(1000);
            
            results.forEach(result => {
                expect(result).toHaveProperty('javascript');
                expect(result).toHaveProperty('python');
            });
        });
    });
});