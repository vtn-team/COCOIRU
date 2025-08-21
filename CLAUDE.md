# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This is a multi-platform educational project called COCOIRU (VantanConnect) consisting of:
- **Server**: TypeScript-based server with WebSocket support, AI integration (Claude, GPT, Gemini), and database connectivity
- **Client**: Alternative TypeScript client implementation (mirrors Server structure)  
- **Common**: Shared TypeScript modules and utilities
- **Unity**: Unity3D client application with custom VantanConnect SDK
- **Backend**: Docker infrastructure for MariaDB, Redis, and phpMyAdmin

## Essential Commands

### Database Setup
```bash
# In Backend folder
docker-compose up
# Access phpMyAdmin at http://localhost:8080
# Execute cocoiru_tables.sql content in SQL tab
```

### Server Development
```bash
# In Server folder (or Client folder for client development)
npm install
npx tsc                    # Compile TypeScript (run after each code change)
node js/main.js            # Start server
node js/main.js --useCache # Start with cache (faster subsequent starts)

# Alternative batch files
./run.bat                  # Build and run with cache
./tscwatch.bat            # TypeScript watch mode (auto-compile on changes)
```

### Testing
```bash
# In Server/Client/Common folders
npm test                   # Run test suite (currently runs server with --useChace flag)
npx jest                   # Run Jest tests directly (configured with ts-jest)
```

## Architecture Overview

### Server Architecture
- **Entry Point**: `ts/main.ts` - Server initialization with flag processing and master data loading
- **Core Systems**:
  - `ts/server/` - HTTP API routes (auth, classroom, AI, tools, debug, user, etc.)
  - `ts/gameserver/` - WebSocket game server and real-time communication
  - `ts/lib/` - Core libraries (database, cache, AI clients, S3, Neo4j, notifications)
  - `ts/vclogic/` - VantanConnect business logic (search, messaging, user management)
  - `ts/cococore/` - Core page and user functionality

### Database Layer
- **Primary**: MariaDB (port 3306) with connection pooling
- **Cache**: Redis (port 6379) for session and temporary data
- **Graph**: Neo4j integration for relationship data
- **Configuration**: Copy `ts/config/config.ts.sample` to `ts/config/config.ts`

### AI Integration
Multiple AI providers integrated:
- Anthropic Claude (`ts/lib/claude.ts`)
- OpenAI GPT (`ts/lib/chatgpt.ts`)  
- Google Gemini (`ts/lib/gemini.ts`)

### Unity Client
- **SDK Location**: `Unity/Assets/VantanConnect/`
- **Configuration**: Use VTNTools→VantanConnectControlPanel to set environment target
- **Development**: Set target to "Local" to connect to local server

## Key Configuration Files

- `Server/ts/config/config.ts` - Server configuration (copy from .sample)
- `Client/ts/config/config.ts` - Client configuration (copy from .sample) 
- `Server/tsconfig.json` - TypeScript compilation settings
- `Backend/docker-compose.yml` - Database infrastructure
- `Server/jest.config.js` - Test configuration (ts-jest preset)

## Google OAuth Authentication

The system includes Google OAuth2 login functionality:

### OAuth Configuration
- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `config.ts`
- OAuth routes available at `/auth/google` (login), `/auth/google/callback` (callback)
- Login page available at `/login` with both OAuth and token-based options

### Authentication Endpoints
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Handle OAuth callback
- `GET /auth/logout` - Logout and clear session
- `GET /auth/me` - Get current user information
- `GET /login` - Display login page
- `POST /callback` - Legacy ID token verification

### Session Management
- Sessions stored in Redis cache with user data (userId, email, name, picture)
- Session cookies set for `.vtn-game.com` domain
- Authentication middleware checks for valid sessions

## Development Workflow

1. Start database: `docker-compose up` in Backend folder
2. Configure server: Copy and edit `ts/config/config.ts.sample` to `ts/config/config.ts` (include Google OAuth credentials and database settings)
3. Install dependencies: `npm install` in Server folder (or Client/Common folders as needed)
4. Compile TypeScript: `npx tsc` (or use `./tscwatch.bat` for auto-compilation)
5. Start server: `node js/main.js --useCache`
6. For Unity development: Set environment target to Local in VantanConnectControlPanel

## Project Structure Notes

- Server, Client, and Common folders have identical TypeScript project structures
- Each has its own package.json, tsconfig.json, and jest.config.js
- Master data is loaded from `Server/json/` directory (GameInfo.json, Level.json, etc.)
- Both Server and Client compile TypeScript to `js/` directories