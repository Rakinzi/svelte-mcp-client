# svelte-mcp-client

A production-ready Svelte MCP (Model Context Protocol) client library with SSE transport, reactive stores, context providers, and minimal UI components.

[![npm version](https://img.shields.io/npm/v/svelte-mcp-client.svg)](https://www.npmjs.com/package/svelte-mcp-client)
[![npm downloads](https://img.shields.io/npm/dm/svelte-mcp-client.svg)](https://www.npmjs.com/package/svelte-mcp-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![GitHub](https://img.shields.io/github/stars/rakinzisilver/svelte-mcp-client?style=social)](https://github.com/rakinzisilver/svelte-mcp-client)

## Features

- **Transport-agnostic** - Clean interface supporting SSE (v1) with WebSocket ready for future releases
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Reactive** - Svelte stores for seamless reactive integration
- **Minimal dependencies** - Lean package focused on core functionality
- **Production-ready** - Includes timeout handling, reconnection, error propagation, and logging
- **SvelteKit compatible** - Works in both Svelte and SvelteKit projects (no SvelteKit-only APIs)

## Installation

```bash
# Using bun
bun add svelte-mcp-client

# Using npm
npm install svelte-mcp-client

# Using pnpm
pnpm add svelte-mcp-client
```

## Quick Start

```svelte
<script lang="ts">
  import {
    createMcpClient,
    SseTransport,
    McpProvider,
    McpConnectButton,
    McpToolRunner,
    McpLogPanel
  } from 'svelte-mcp-client';

  const transport = new SseTransport({
    sseUrl: '/mcp/sse',
    postUrl: '/mcp'
  });
  const client = createMcpClient(transport);
</script>

<McpProvider {client}>
  <h1>MCP Client Demo</h1>
  <McpConnectButton />
  <McpToolRunner />
  <McpLogPanel />
</McpProvider>
```

## Core API

### Creating a Client

```typescript
import { createMcpClient, SseTransport } from 'svelte-mcp-client';

const transport = new SseTransport({
  sseUrl: '/api/mcp/sse', // EventSource endpoint
  postUrl: '/api/mcp', // POST endpoint for outgoing messages
  reconnect: {
    baseDelayMs: 500,
    maxDelayMs: 15000,
    jitter: 0.25
  }
});

const client = createMcpClient(transport, {
  requestTimeoutMs: 15000,
  logger: (log) => console.log(log)
});
```

### Client Methods

```typescript
// Connection management
await client.connect();
await client.disconnect();
const connected = client.isConnected();

// MCP operations
const tools = await client.listTools();
const resources = await client.listResources();
const result = await client.callTool('tool-name', { param: 'value' });

// Event subscriptions (all return unsubscribe functions)
const unsubStatus = client.onStatus((status) => console.log(status));
const unsubMessage = client.onMessage((msg) => console.log(msg));
const unsubError = client.onError((err) => console.error(err));
const unsubLog = client.onLog((log) => console.log(log));

// Cleanup
client.destroy();
```

## Transports

### SSE Transport

The `SseTransport` uses Server-Sent Events for inbound messages and HTTP POST for outbound messages.

```typescript
import { SseTransport } from 'svelte-mcp-client';

const transport = new SseTransport({
  sseUrl: '/mcp/sse', // Required: SSE endpoint
  postUrl: '/mcp', // Required: POST endpoint
  fetchImpl: fetch, // Optional: custom fetch
  EventSourceImpl: EventSource, // Optional: custom EventSource
  reconnect: {
    // Optional: reconnection config
    baseDelayMs: 500,
    maxDelayMs: 15000,
    jitter: 0.25
  }
});
```

Features:

- Automatic reconnection with exponential backoff
- Request/response correlation via request IDs
- Configurable timeouts
- Error propagation

### Future Transports

The `McpTransport` interface is designed to support WebSocket and other transports in future versions without breaking the public API.

## Svelte Integration

### Stores

Create reactive Svelte stores from a client:

```typescript
import { createMcpStores } from 'svelte-mcp-client';

const stores = createMcpStores(client);

// Available stores:
// - stores.connection: { status, isConnected, lastError }
// - stores.tools: McpTool[]
// - stores.resources: McpResource[]
// - stores.logs: McpLog[] (last 200 entries)

// Don't forget to cleanup
onDestroy(() => stores.destroy());
```

Usage in components:

```svelte
<script lang="ts">
  import { createMcpClient, SseTransport, createMcpStores } from 'svelte-mcp-client';

  const transport = new SseTransport({ sseUrl: '/mcp/sse', postUrl: '/mcp' });
  const client = createMcpClient(transport);
  const stores = createMcpStores(client);
</script>

{#if $stores.connection.isConnected}
  <p>Connected</p>
  <ul>
    {#each $stores.tools as tool}
      <li>{tool.name}: {tool.description}</li>
    {/each}
  </ul>
{:else}
  <p>Status: {$stores.connection.status}</p>
{/if}
```

### Context Provider

Use `McpProvider` and `useMcp()` for component tree-wide access:

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { McpProvider, createMcpClient, SseTransport } from 'svelte-mcp-client';

  const transport = new SseTransport({ sseUrl: '/mcp/sse', postUrl: '/mcp' });
  const client = createMcpClient(transport);
</script>

<McpProvider {client}>
  <YourApp />
</McpProvider>
```

```svelte
<!-- YourComponent.svelte -->
<script lang="ts">
  import { useMcp } from 'svelte-mcp-client';

  const { client, stores } = useMcp();
  const { connection, tools } = stores;

  async function handleConnect() {
    await client.connect();
    const toolList = await client.listTools();
    tools.set(toolList);
  }
</script>

<button on:click={handleConnect} disabled={$connection.isConnected}>
  Connect
</button>
```

## UI Components

Three minimal, unstyled components are included for rapid prototyping:

### McpConnectButton

```svelte
<script lang="ts">
  import { McpConnectButton } from 'svelte-mcp-client';
</script>

<McpConnectButton connectLabel="Connect" disconnectLabel="Disconnect" />
```

### McpToolRunner

Interactive tool selector and executor:

```svelte
<script lang="ts">
  import { McpToolRunner } from 'svelte-mcp-client';
</script>

<McpToolRunner />
```

### McpLogPanel

Displays recent log entries:

```svelte
<script lang="ts">
  import { McpLogPanel } from 'svelte-mcp-client';
</script>

<McpLogPanel />
```

## TypeScript Types

All types are exported for use in your code:

```typescript
import type {
  // Core types
  McpClient,
  McpTransport,
  McpClientOptions,

  // Message types
  McpMessage,
  McpTool,
  McpResource,
  McpToolCall,
  McpToolResult,

  // Utility types
  JsonValue,
  JsonSchema,
  McpStatus,
  McpLog,
  McpLogLevel
} from 'svelte-mcp-client';
```

## Development

```bash
# Install dependencies
bun install

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format

# Run tests
bun run test

# Build package
bun run build
```

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. This library provides a Svelte-native implementation of the MCP client specification.

## Examples

Check out the [examples directory](https://github.com/rakinzisilver/svelte-mcp-client/tree/main/examples) for complete working examples demonstrating:

- Client setup and connection
- Listing and calling tools
- Using Svelte stores
- Component integration

## Roadmap

- **v0.1.x** - SSE transport, core client, Svelte integration
- **v0.2.x** - WebSocket transport support
- **v0.3.x** - Advanced features (batching, streaming, etc.)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Links

- **GitHub**: [rakinzisilver/svelte-mcp-client](https://github.com/rakinzisilver/svelte-mcp-client)
- **npm**: [svelte-mcp-client](https://www.npmjs.com/package/svelte-mcp-client)
- **Issues**: [Report bugs or request features](https://github.com/rakinzisilver/svelte-mcp-client/issues)
- **MCP Spec**: [Model Context Protocol](https://modelcontextprotocol.io/)

## Author

Created and maintained by [rakinzisilver](https://github.com/rakinzisilver)

## License

MIT - see [LICENSE](./LICENSE) for details.
