#!/usr/bin/env node

/**
 * mg_kiro MCP Server Entry Point
 * Smart Project Documentation Management System
 */

import { MCPServer } from './server/mcp-server.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load configuration file
 */
function loadConfig() {
  const configPath = join(__dirname, 'config', 'mcp.config.json');
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('⚠️  Failed to load config file, using defaults:', error.message);
    }
  } else {
    console.log('ℹ️  Config file not found, using default configuration');
  }
  
  // Default configuration
  return {
    server: {
      port: 3000,
      host: 'localhost',
      cors: {
        enabled: true,
        origins: ['http://localhost:*']
      }
    },
    modes: {
      default: 'init',
      available: ['init', 'create', 'fix', 'analyze'],
      auto_switch: true
    },
    cache: {
      enabled: true,
      ttl: 3600
    }
  };
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}, gracefully shutting down...`);
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🤖 mg_kiro MCP Server Starting...\n');
  
  try {
    // Load configuration
    const config = loadConfig();
    console.log('📋 Configuration loaded');
    
    // Create and start server
    const server = new MCPServer(config.server);
    setupGracefulShutdown(server);
    
    await server.start();
    
    console.log('\n✅ Server is ready and accepting connections!');
    console.log('📖 Available endpoints:');
    console.log(`   🏥 Health: http://${config.server.host}:${config.server.port}/health`);
    console.log(`   📊 Status: http://${config.server.host}:${config.server.port}/status`);
    console.log(`   🤝 Handshake: POST http://${config.server.host}:${config.server.port}/mcp/handshake`);
    console.log(`   💬 WebSocket: ws://${config.server.host}:${config.server.port}/ws`);
    console.log('\n🎯 Press Ctrl+C to stop the server\n');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { loadConfig, setupGracefulShutdown, main };