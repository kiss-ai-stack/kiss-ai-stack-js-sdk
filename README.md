
<div style="text-align: left; margin-bottom: 20px;">
  <img src="https://kiss-ai-stack.github.io/kissaistack.svg" alt="KISS AI Stack Banner" style="max-width: auto; height: 250px">
</div>

# KISS AI Stack - JS Client SDK

The KISS AI Stack Client provides an easy-to-use interface for interacting with the KISS AI Stack Server,
supporting RESTful and WebSocket APIs to manage Stack session lifecycle and execute tasks.

---

## Features

- REST client for session management, query execution, and document storage.
- WebSocket client for real-time interactions with the Stack.

---

## Getting Started

<span style="color: red; font-weight: bold;">Nota Bene:</span>  
_It is recommended to use this client in a proxy service for better security._

### Requirements

- Node.js (>= 14.x)

### Installation

1. Install the `kiss-ai-stack-client` package:
```bash
npm install kiss-ai-stack-client@0.1.0-a1
```

2. Initialize the client:

- REST API client

```javascript
const { RestEvent } = require('kiss-ai-stack-client');

// host name without mentioning protocol, i.e. example.com, localhost:8080
// secure_protocol, whether to use https or http
const client = new RestEvent({
  hostname: "your-server-hostname",
  secureProtocol: true,
});
```

- WebSocket based client

```javascript
const { WebSocketEvent } = require('kiss-ai-stack-client');

// host name without mentioning protocol, i.e. example.com, localhost:8080
// secure_protocol, whether to use wss or ws
const client = new WebSocketEvent({
  hostname: "your-server-hostname",
  secureProtocol: true,
});
```

---

## Usage

### 1. Authorize a Stack Session
Create or refresh a Stack session:

To authorize the session, if you have saved a previous `client_id` and `client_secret`, send them to get a new access token. Only the `persistent` scope supports this. The `temporary` scope will deactivate the client upon lifecycle ending.  
Just send the `scope` only to generate a new client and keep it saved for `persistent` sessions.

```javascript
let session = await client.authorizeStack({ scope: "temporary" });  // scopes - 'temporary', 'persistent'

// or, get a new access token for a previous 'persistent session'
session = await client.authorizeStack({ clientId: "your-client-id", clientSecret: "your-client-secret" });
```

### 2. Bootstrap the Stack
Initialize the Stack session for task execution:

This step is a **must** to start the Stack session.

```javascript
const response = await client.bootstrapStack({ data: "Hello, Stack!" });
```

### 3. Generate an Answer
Send a query and receive the Stack's response:

```javascript
const response = await client.generateAnswer({ data: "What is the weather today?" });
```

### 4. Store Documents
Upload files with optional metadata for storage:

```javascript
const files = ["path/to/document1.txt", "path/to/document2.pdf"];
const metadata = { category: "example" };
const response = await client.storeData({ files, metadata });
const answer = await client.generateAnswer({ data: 'Give me a summary of example documents' });
```

### 5. Destroy the Stack Session
Close the current session (will clean up stored documents in temporary session if it has):

```javascript
const response = await client.destroyStack({ data: "Goodbye!" });
```

---

## License

This project is licensed under the MIT License.
