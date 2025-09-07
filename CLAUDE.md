# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mg_kiro MCP Server** - Fully implemented MCP server (85% complete, ~3000 lines) with document-driven development approach. Four working modes: Init/Create/Fix/Analyze.

## Development Commands

```bash
# Start server
npm start                # Production
npm run dev             # Development (hot reload)
npm run daemon          # Background process

# Testing  
npm run test:config     # Config system tests (100% coverage)
npm test               # All tests

# Health check
curl http://localhost:3000/health
```

## Architecture

**Core Components** (all functional):
- `server/mcp-server.js` (800 lines) - HTTP + WebSocket MCP server
- `server/prompt-manager.js` (400 lines) - Template caching, variables
- `server/mode-handler.js` (600 lines) - Four working modes
- `server/config-manager.js` (300 lines) - Configuration with hot reload
- `server/language/` (900 lines) - Multi-language detection & templates

**Key APIs**:
- `GET /health` - Server status
- `POST /mcp/handshake` - MCP protocol init
- `POST /mode/switch` - Change modes (init→create→fix→analyze)
- `GET /template/:name` - Get templates
- `ws://localhost:3000/ws` - WebSocket

## Configuration

**Environment Variables**:
```bash
MCP_PORT=3000          # Server port
MCP_HOST=localhost     # Host binding  
MCP_API_KEY=secret     # Enable auth
MCP_LOG_LEVEL=debug    # Logging
```

**Config Files**: `config/mcp.config.json`, `config/modes.config.json`

## Development Notes

1. **ES6 Modules** - Requires Node.js >= 16
2. **MCP 2024-11-05** compliant 
3. **Multi-language** - Auto-detects JS/Python/Java/Go/Rust/C#
4. **Template Variables** - `{{project_name}}`, `{{tech_stack}}`, etc.
5. **Test Coverage** - Config: 100%, Server/Modes: needs implementation

## Common Tasks

**Add Template**: Create in `prompts/templates/`, test with `GET /template/name`

**Add Mode**: Extend `ModeHandler` class, update `config/modes.config.json`

**Debug**: `MCP_LOG_LEVEL=debug npm run dev`, `tail -f logs/mcp-server.log`

**Test Integration**:
```bash
curl -X POST http://localhost:3000/mcp/handshake -H "Content-Type: application/json" -d '{"version":"1.0.0","clientId":"test"}'
```