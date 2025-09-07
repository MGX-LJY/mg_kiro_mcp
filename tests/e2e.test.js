/**
 * End-to-End Tests for mg_kiro MCP Server
 * 
 * Tests complete user workflows and real-world scenarios:
 * - Complete project initialization workflow
 * - Full documentation generation process
 * - Multi-mode project development lifecycle
 * - Real client-server communication patterns
 * - Performance under realistic load
 * - Error recovery and resilience
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from './test-runner.js';
import { MCPServer } from '../server/mcp-server.js';
import fs from 'fs/promises';
import path from 'path';
import { WebSocket } from 'ws';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class E2ETestHelper {
    constructor() {
        this.testDir = path.join(process.cwd(), 'test-temp-e2e');
        this.server = null;
        this.testPort = 3005;
        this.clients = [];
    }

    async setup() {
        // Clean and create test directory
        await this.cleanup();
        await fs.mkdir(this.testDir, { recursive: true });
        
        // Create realistic test projects
        await this.createReactProject();
        await this.createPythonProject();
        await this.createGoProject();
        await this.createMixedProject();
        
        // Start server
        this.server = new MCPServer({ port: this.testPort });
        await this.server.start();
        
        // Wait for server to be fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async cleanup() {
        // Close all clients
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        this.clients = [];

        // Stop server
        if (this.server) {
            await this.server.stop();
        }
        
        // Clean test directory
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    async createReactProject() {
        const projectPath = path.join(this.testDir, 'react-app');
        await fs.mkdir(projectPath, { recursive: true });
        
        const files = {
            'package.json': JSON.stringify({
                name: 'react-app',
                version: '1.0.0',
                scripts: {
                    'start': 'react-scripts start',
                    'build': 'react-scripts build',
                    'test': 'react-scripts test'
                },
                dependencies: {
                    'react': '^18.0.0',
                    'react-dom': '^18.0.0',
                    'react-scripts': '5.0.1'
                }
            }, null, 2),
            'src/App.js': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React App</h1>
      </header>
    </div>
  );
}

export default App;`,
            'src/App.css': `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}`,
            'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
            'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
            'README.md': '# React App\n\nA sample React application.',
            '.gitignore': 'node_modules/\nbuild/\n.env.local'
        };

        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(projectPath, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }
    }

    async createPythonProject() {
        const projectPath = path.join(this.testDir, 'python-api');
        await fs.mkdir(projectPath, { recursive: true });
        
        const files = {
            'requirements.txt': 'flask==2.3.2\nrequests==2.31.0\npytest==7.4.0',
            'setup.py': `from setuptools import setup, find_packages

setup(
    name="python-api",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "flask>=2.3.0",
        "requests>=2.31.0"
    ]
)`,
            'src/app.py': `from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/api/users', methods=['GET', 'POST'])
def users():
    if request.method == 'GET':
        return jsonify({"users": []})
    return jsonify({"message": "User created"})

if __name__ == '__main__':
    app.run(debug=True)`,
            'src/models.py': `class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
    
    def to_dict(self):
        return {
            "name": self.name,
            "email": self.email
        }`,
            'tests/test_app.py': `import pytest
from src.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    rv = client.get('/api/health')
    assert rv.status_code == 200
    assert b'healthy' in rv.data`,
            'README.md': '# Python API\n\nA Flask REST API server.',
            '.gitignore': '__pycache__/\n*.pyc\n.pytest_cache/\nvenv/'
        };

        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(projectPath, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }
    }

    async createGoProject() {
        const projectPath = path.join(this.testDir, 'go-service');
        await fs.mkdir(projectPath, { recursive: true });
        
        const files = {
            'go.mod': `module go-service

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/stretchr/testify v1.8.4
)`,
            'main.go': `package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
        })
    })
    
    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "data": []string{"item1", "item2"},
        })
    })
    
    r.Run(":8080")
}`,
            'handlers/user.go': `package handlers

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func GetUsers(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "users": []string{},
    })
}

func CreateUser(c *gin.Context) {
    c.JSON(http.StatusCreated, gin.H{
        "message": "User created",
    })
}`,
            'models/user.go': `package models

type User struct {
    ID    int    \`json:"id"\`
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
}

func NewUser(name, email string) *User {
    return &User{
        Name:  name,
        Email: email,
    }
}`,
            'main_test.go': `package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestHealthEndpoint(t *testing.T) {
    gin.SetMode(gin.TestMode)
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/health", nil)
    
    // Test would require proper router setup
    assert.Equal(t, 200, w.Code)
}`,
            'README.md': '# Go Service\n\nA Gin-based HTTP service.',
            '.gitignore': 'vendor/\n*.exe\n*.log'
        };

        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(projectPath, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }
    }

    async createMixedProject() {
        const projectPath = path.join(this.testDir, 'mixed-stack');
        await fs.mkdir(projectPath, { recursive: true });
        
        const files = {
            'package.json': JSON.stringify({
                name: 'mixed-stack',
                version: '1.0.0',
                scripts: {
                    'start': 'node server.js',
                    'dev': 'concurrently "npm run server" "npm run client"',
                    'server': 'node server.js',
                    'client': 'cd client && npm start'
                }
            }, null, 2),
            'server.js': `const express = require('express');
const app = express();

app.get('/api/status', (req, res) => {
    res.json({ status: 'running' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});`,
            'client/package.json': JSON.stringify({
                name: 'client',
                version: '1.0.0',
                scripts: {
                    'start': 'react-scripts start'
                },
                dependencies: {
                    'react': '^18.0.0'
                }
            }, null, 2),
            'client/src/App.js': `import React from 'react';

function App() {
    return <div>Mixed Stack Client</div>;
}

export default App;`,
            'scripts/build.py': `#!/usr/bin/env python3
import subprocess
import sys

def build_client():
    subprocess.run(['npm', 'run', 'build'], cwd='client')

def build_server():
    print("Server build complete")

if __name__ == '__main__':
    build_client()
    build_server()`,
            'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: mixed_stack`,
            'Dockerfile': `FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
            'README.md': '# Mixed Stack\n\nA full-stack application with Node.js, React, and Python scripts.'
        };

        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(projectPath, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }
    }

    async createMCPClient() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.testPort}`);
            
            ws.on('open', () => {
                this.clients.push(ws);
                resolve(ws);
            });
            
            ws.on('error', reject);
            
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
    }

    async sendMCPMessage(client, message) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Message timeout'));
            }, 10000);

            const handler = (data) => {
                clearTimeout(timeout);
                client.removeListener('message', handler);
                
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };

            client.on('message', handler);
            client.send(JSON.stringify(message));
        });
    }

    async performMCPHandshake(client) {
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    roots: {
                        listChanged: true
                    }
                },
                clientInfo: {
                    name: 'e2e-test-client',
                    version: '1.0.0'
                }
            }
        };

        const initResponse = await this.sendMCPMessage(client, initRequest);
        expect(initResponse.result).toBeDefined();

        const readyRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'notifications/initialized'
        };

        await this.sendMCPMessage(client, readyRequest);
        return true;
    }
}

describe('End-to-End Tests', () => {
    let helper;

    beforeAll(async () => {
        helper = new E2ETestHelper();
        await helper.setup();
    }, 30000);

    afterAll(async () => {
        if (helper) {
            await helper.cleanup();
        }
    });

    describe('Complete Project Initialization Workflow', () => {
        it('should initialize a React project from scratch', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'react-app');

            // 1. Switch to init mode
            const switchResponse = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/switch',
                params: {
                    mode: 'init',
                    context: { projectPath }
                }
            });
            expect(switchResponse.result.success).toBe(true);

            // 2. Analyze project structure
            const analyzeResponse = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 4,
                method: 'modes/execute',
                params: {
                    action: 'analyze-project',
                    projectPath
                }
            });
            expect(analyzeResponse.result.languages).toContain('javascript');
            expect(analyzeResponse.result.framework).toBe('react');

            // 3. Generate documentation
            const generateResponse = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 5,
                method: 'modes/execute',
                params: {
                    action: 'generate-docs',
                    options: {
                        includeAPI: true,
                        includeSetup: true,
                        includeArchitecture: true
                    }
                }
            });
            expect(generateResponse.result.documents).toBeDefined();
            expect(generateResponse.result.documents.length).toBeGreaterThan(0);

            client.close();
        }, 15000);

        it('should handle Python project initialization with virtual environment', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'python-api');

            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'full-init',
                    projectPath,
                    options: {
                        setupVirtualEnv: true,
                        generateTests: true,
                        includeDependencies: true
                    }
                }
            });

            expect(response.result.success).toBe(true);
            expect(response.result.setupSteps).toContain('virtualenv');
            expect(response.result.documentation.setup).toContain('pip install');

            client.close();
        }, 15000);

        it('should handle Go project with modules and dependencies', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'go-service');

            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'analyze-and-document',
                    projectPath,
                    language: 'go'
                }
            });

            expect(response.result.success).toBe(true);
            expect(response.result.modules).toContain('main');
            expect(response.result.dependencies).toContain('gin-gonic');

            client.close();
        }, 15000);
    });

    describe('Full Development Lifecycle Workflow', () => {
        it('should handle complete init -> create -> fix -> analyze cycle', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'mixed-stack');
            const workflow = ['init', 'create', 'fix', 'analyze'];
            const results = {};

            for (const mode of workflow) {
                const response = await helper.sendMCPMessage(client, {
                    jsonrpc: '2.0',
                    id: Math.random(),
                    method: 'modes/switch',
                    params: {
                        mode,
                        context: { projectPath, workflow: true }
                    }
                });

                expect(response.result.success).toBe(true);
                results[mode] = response.result;
            }

            // Verify workflow continuity
            expect(results.init.context.projectPath).toBe(projectPath);
            expect(results.create.context.workflow).toBe(true);
            expect(results.fix.previousMode).toBe('create');
            expect(results.analyze.workflowComplete).toBe(true);

            client.close();
        }, 20000);

        it('should generate comprehensive documentation across all modes', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'mixed-stack');
            const modes = ['init', 'create', 'analyze'];
            const documents = [];

            for (const mode of modes) {
                await helper.sendMCPMessage(client, {
                    jsonrpc: '2.0',
                    id: Math.random(),
                    method: 'modes/switch',
                    params: { mode, context: { projectPath } }
                });

                const docResponse = await helper.sendMCPMessage(client, {
                    jsonrpc: '2.0',
                    id: Math.random(),
                    method: 'modes/execute',
                    params: {
                        action: 'generate-docs',
                        scope: mode
                    }
                });

                documents.push(...docResponse.result.documents);
            }

            // Verify comprehensive documentation
            const docTypes = documents.map(doc => doc.type);
            expect(docTypes).toContain('architecture');
            expect(docTypes).toContain('api');
            expect(docTypes).toContain('setup');
            expect(docTypes).toContain('analysis');
            expect(documents.length).toBeGreaterThan(5);

            client.close();
        }, 20000);

        it('should handle feature creation workflow in create mode', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'react-app');

            // Switch to create mode
            await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/switch',
                params: {
                    mode: 'create',
                    context: { projectPath }
                }
            });

            // Create a new feature
            const createResponse = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 4,
                method: 'modes/execute',
                params: {
                    action: 'create-feature',
                    featureName: 'UserProfile',
                    featureType: 'component',
                    options: {
                        includeTests: true,
                        includeStyles: true,
                        includeStories: true
                    }
                }
            });

            expect(createResponse.result.success).toBe(true);
            expect(createResponse.result.files.created).toContain('UserProfile.js');
            expect(createResponse.result.files.created).toContain('UserProfile.test.js');
            expect(createResponse.result.documentation.updated).toBe(true);

            client.close();
        }, 15000);
    });

    describe('Multi-Client Collaboration Scenarios', () => {
        it('should handle multiple developers working on the same project', async () => {
            const clients = await Promise.all([
                helper.createMCPClient(),
                helper.createMCPClient(),
                helper.createMCPClient()
            ]);

            // Perform handshake for all clients
            await Promise.all(clients.map(client => helper.performMCPHandshake(client)));

            const projectPath = path.join(helper.testDir, 'mixed-stack');

            // Each client works in different mode
            const clientModes = [
                { client: clients[0], mode: 'init', role: 'architect' },
                { client: clients[1], mode: 'create', role: 'developer' },
                { client: clients[2], mode: 'analyze', role: 'reviewer' }
            ];

            const results = await Promise.all(
                clientModes.map(async ({ client, mode, role }) => {
                    return helper.sendMCPMessage(client, {
                        jsonrpc: '2.0',
                        id: Math.random(),
                        method: 'modes/switch',
                        params: {
                            mode,
                            context: { projectPath, role, collaborative: true }
                        }
                    });
                })
            );

            results.forEach((result, index) => {
                expect(result.result.success).toBe(true);
                expect(result.result.context.role).toBe(clientModes[index].role);
                expect(result.result.context.collaborative).toBe(true);
            });

            clients.forEach(client => client.close());
        }, 20000);

        it('should synchronize state changes across multiple clients', async () => {
            const clients = await Promise.all([
                helper.createMCPClient(),
                helper.createMCPClient()
            ]);

            await Promise.all(clients.map(client => helper.performMCPHandshake(client)));

            const projectPath = path.join(helper.testDir, 'react-app');

            // Client 1 switches to init mode
            const client1Response = await helper.sendMCPMessage(clients[0], {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/switch',
                params: {
                    mode: 'init',
                    context: { projectPath, sync: true }
                }
            });

            // Client 2 should see the state change
            const client2StatusResponse = await helper.sendMCPMessage(clients[1], {
                jsonrpc: '2.0',
                id: 4,
                method: 'modes/get-status',
                params: { projectPath }
            });

            expect(client1Response.result.success).toBe(true);
            expect(client2StatusResponse.result.activeMode).toBe('init');
            expect(client2StatusResponse.result.context.sync).toBe(true);

            clients.forEach(client => client.close());
        }, 15000);
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from network interruptions gracefully', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'python-api');

            // Start a long-running operation
            const operationPromise = helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'comprehensive-analysis',
                    projectPath,
                    options: { timeout: 30000 }
                }
            });

            // Simulate network interruption
            setTimeout(() => {
                client.close();
            }, 1000);

            // Reconnect and check operation status
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const newClient = await helper.createMCPClient();
            await helper.performMCPHandshake(newClient);

            const statusResponse = await helper.sendMCPMessage(newClient, {
                jsonrpc: '2.0',
                id: 4,
                method: 'operations/status',
                params: { projectPath }
            });

            // Operation should either be completed or recoverable
            expect(['completed', 'recoverable', 'failed']).toContain(statusResponse.result.status);

            newClient.close();
        }, 20000);

        it('should handle invalid project structures gracefully', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const invalidPath = path.join(helper.testDir, 'nonexistent-project');

            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/switch',
                params: {
                    mode: 'init',
                    context: { projectPath: invalidPath }
                }
            });

            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32602);
            expect(response.error.message).toContain('Invalid project path');

            client.close();
        }, 10000);

        it('should handle malformed MCP messages', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            // Send malformed request
            const malformedResponse = await helper.sendMCPMessage(client, {
                // Missing required fields
                id: 3,
                method: 'invalid/method'
            });

            expect(malformedResponse.error).toBeDefined();
            expect(malformedResponse.error.code).toBe(-32600);

            // Send request with invalid parameters
            const invalidParamsResponse = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 4,
                method: 'modes/switch',
                params: {
                    mode: 123, // Should be string
                    context: 'invalid' // Should be object
                }
            });

            expect(invalidParamsResponse.error).toBeDefined();
            expect(invalidParamsResponse.error.code).toBe(-32602);

            client.close();
        }, 10000);
    });

    describe('Performance and Load Testing', () => {
        it('should handle rapid-fire requests efficiently', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'react-app');
            const startTime = Date.now();
            const requests = [];

            // Send 50 rapid requests
            for (let i = 0; i < 50; i++) {
                requests.push(
                    helper.sendMCPMessage(client, {
                        jsonrpc: '2.0',
                        id: i + 100,
                        method: 'modes/get-status',
                        params: { projectPath }
                    })
                );
            }

            const responses = await Promise.all(requests);
            const endTime = Date.now();

            expect(responses.length).toBe(50);
            expect(endTime - startTime).toBeLessThan(5000);
            
            responses.forEach((response, index) => {
                expect(response.id).toBe(index + 100);
                expect(response.result).toBeDefined();
            });

            client.close();
        }, 15000);

        it('should handle large project analysis efficiently', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            // Create a larger project structure for testing
            const largeProjectPath = path.join(helper.testDir, 'large-project');
            await fs.mkdir(largeProjectPath, { recursive: true });

            // Create many files to simulate a large project
            const createFilePromises = [];
            for (let i = 0; i < 100; i++) {
                const filePath = path.join(largeProjectPath, `file-${i}.js`);
                createFilePromises.push(
                    fs.writeFile(filePath, `// File ${i}\nconsole.log('File ${i}');`)
                );
            }
            await Promise.all(createFilePromises);

            const startTime = Date.now();
            
            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'analyze-project',
                    projectPath: largeProjectPath,
                    options: { 
                        deep: true,
                        includeMetrics: true 
                    }
                }
            });

            const endTime = Date.now();
            const analysisTime = endTime - startTime;

            expect(response.result.success).toBe(true);
            expect(response.result.fileCount).toBe(100);
            expect(analysisTime).toBeLessThan(10000); // Should complete in under 10 seconds

            client.close();
        }, 20000);

        it('should maintain performance under concurrent load', async () => {
            const concurrentClients = 5;
            const requestsPerClient = 10;
            
            const clients = await Promise.all(
                Array(concurrentClients).fill().map(() => helper.createMCPClient())
            );

            await Promise.all(clients.map(client => helper.performMCPHandshake(client)));

            const startTime = Date.now();
            const allRequests = [];

            clients.forEach((client, clientIndex) => {
                for (let reqIndex = 0; reqIndex < requestsPerClient; reqIndex++) {
                    allRequests.push(
                        helper.sendMCPMessage(client, {
                            jsonrpc: '2.0',
                            id: clientIndex * requestsPerClient + reqIndex,
                            method: 'modes/switch',
                            params: {
                                mode: ['init', 'create', 'fix', 'analyze'][reqIndex % 4],
                                context: { 
                                    projectPath: helper.testDir,
                                    clientId: clientIndex,
                                    requestId: reqIndex
                                }
                            }
                        })
                    );
                }
            });

            const responses = await Promise.all(allRequests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            expect(responses.length).toBe(concurrentClients * requestsPerClient);
            expect(totalTime).toBeLessThan(15000);
            
            // Verify all responses are successful
            responses.forEach(response => {
                expect(response.result).toBeDefined();
                expect(response.result.success).toBe(true);
            });

            clients.forEach(client => client.close());
        }, 25000);
    });

    describe('Real-World Integration Scenarios', () => {
        it('should integrate with version control workflows', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'react-app');

            // Initialize git repository
            await execAsync('git init', { cwd: projectPath });
            await execAsync('git config user.name "Test User"', { cwd: projectPath });
            await execAsync('git config user.email "test@example.com"', { cwd: projectPath });

            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'analyze-with-vcs',
                    projectPath,
                    vcs: {
                        type: 'git',
                        analyzeHistory: true,
                        suggestCommits: true
                    }
                }
            });

            expect(response.result.success).toBe(true);
            expect(response.result.vcs.initialized).toBe(true);
            expect(response.result.vcs.suggestions).toBeDefined();

            client.close();
        }, 15000);

        it('should handle CI/CD configuration detection and documentation', async () => {
            const client = await helper.createMCPClient();
            await helper.performMCPHandshake(client);

            const projectPath = path.join(helper.testDir, 'python-api');

            // Create CI/CD files
            const cicdFiles = {
                '.github/workflows/test.yml': `name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest`,
                'Dockerfile': `FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "src/app.py"]`,
                'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"`
            };

            for (const [filePath, content] of Object.entries(cicdFiles)) {
                const fullPath = path.join(projectPath, filePath);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content);
            }

            const response = await helper.sendMCPMessage(client, {
                jsonrpc: '2.0',
                id: 3,
                method: 'modes/execute',
                params: {
                    action: 'analyze-deployment',
                    projectPath,
                    includeCI: true,
                    includeDocker: true
                }
            });

            expect(response.result.success).toBe(true);
            expect(response.result.cicd.detected).toBe(true);
            expect(response.result.cicd.platforms).toContain('github-actions');
            expect(response.result.deployment.containerized).toBe(true);

            client.close();
        }, 15000);
    });
});