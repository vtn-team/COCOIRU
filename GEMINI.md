# Project Overview

This project, "COCOIRU," is a client-server application with a Unity-based client and a Node.js backend. The application is designed to run on both PC and smartphone browsers, with notifications enabled through Progressive Web Apps (PWA).

## Architecture

*   **Client:** The client is a Unity application developed with version 2021.3.23f1. The main project files are located in the `Unity/` directory.
*   **Backend:** The backend is a Node.js application. The source code is located in the `Server/` directory. It uses a variety of technologies, including:
    *   **Web Server:** Express
    *   **Databases:** MariaDB, Neo4j, Redis, and SQLite
    *   **AI:** Integration with Anthropic, Google Gemini, and OpenAI APIs.
    *   **Real-time Communication:** WebSockets
    *   **Cloud Services:** AWS SDK

## Building and Running

### Backend (Node.js Server)

1.  **Navigate to the `Server` directory:**
    ```bash
    cd Server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure the environment:**
    *   Create a `config.ts` file in `ts/config/` by copying `config.ts.sample`.
    *   Fill in the necessary configuration details.
4.  **Build the server:**
    ```bash
    npx tsc
    ```
5.  **Run the server:**
    ```bash
    node js/main.js
    ```
    *   You can use the `--useCache` flag to speed up subsequent launches.

### Frontend (Unity Client)

1.  **Open the Unity Hub.**
2.  **Add the `Unity/` directory as a project.**
3.  **Open the project in Unity.**
4.  **Configure the API target to "Local"** in `VTNTools > VantanConnectControlPanel`.
5.  **Run the client** by pressing the "Play" button.

## Development Conventions

*   The backend code is written in TypeScript and needs to be compiled to JavaScript before running.
*   The project uses a variety of databases, suggesting a complex data model.
*   The backend is integrated with multiple AI services, indicating a focus on AI-powered features.
*   The `Client` and `Server` directories appear to be duplicates. For clarity, all backend development should be done in the `Server` directory.
