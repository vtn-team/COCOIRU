# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This is a multi-platform educational project called COCOIRU (VantanConnect) consisting of:
- **NodeJSServer**: TypeScript-based server with WebSocket support, AI integration (Claude, GPT, Gemini), and database connectivity
- **Unity**: Unity3D client application with custom VantanConnect SDK
- **Web**: Frontend web components and assets
- **Server**: Docker infrastructure for MariaDB, Redis, and phpMyAdmin

## Essential Commands

### Database Setup
```bash
# In Server folder
docker-compose up
# Access phpMyAdmin at http://localhost:8080
# Execute vtn-connect.sql content in SQL tab
```

### NodeJS Server Development
```bash
# In NodeJSServer folder
npm install
npx tsc                    # Compile TypeScript (run after each code change)
node js/main.js            # Start server
node js/main.js --useCache # Start with cache (faster subsequent starts)

# Alternative batch files
./run.bat                  # Build and run with cache
./tscwatch.bat            # TypeScript watch mode
```

### Testing
```bash
# In NodeJSServer folder
npm test                   # Run test suite
npx jest                   # Run Jest tests directly
```

## Architecture Overview

### Server Architecture (NodeJSServer)
- **Entry Point**: `ts/main.ts` - Server initialization with flag processing
- **Core Systems**:
  - `ts/server/` - HTTP API routes (auth, classroom, AI, tools, etc.)
  - `ts/gameserver/` - WebSocket game server and real-time communication
  - `ts/lib/` - Core libraries (database, cache, AI clients, S3, Neo4j)
  - `ts/vclogic/` - VantanConnect business logic (search, messaging, user management)

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

- `NodeJSServer/ts/config/config.ts` - Server configuration (copy from .sample)
- `NodeJSServer/tsconfig.json` - TypeScript compilation settings
- `Server/docker-compose.yml` - Database infrastructure
- `NodeJSServer/jest.config.js` - Test configuration

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

1. Start database: `docker-compose up` in Server folder
2. Configure server: Copy and edit `config.ts.sample` (include Google OAuth credentials)
3. Install dependencies: `npm install` in NodeJSServer
4. Compile TypeScript: `npx tsc`
5. Start server: `node js/main.js --useCache`
6. For Unity development: Set environment target to Local in VantanConnectControlPanel