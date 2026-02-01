# Svelte MCP Client - Basic Example

This example demonstrates basic usage of `svelte-mcp-client` in a vanilla Svelte + Vite application.

## Features Demonstrated

- Creating an MCP client with SSE transport
- Using the `McpProvider` context
- Pre-built UI components (`McpConnectButton`, `McpToolRunner`, `McpLogPanel`)

## Running the Example

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

## Server Requirements

This example expects an MCP server running at:

- SSE endpoint: `/mcp/sse`
- POST endpoint: `/mcp`

You'll need to set up a compatible backend or proxy these endpoints to your MCP server.

## Code Structure

- `src/main.ts` - Application entry point
- `src/App.svelte` - Main component with MCP client setup
- `index.html` - HTML template

## Next Steps

For a production app, you would:

- Configure actual server endpoints
- Add custom styling to the components
- Implement error handling UI
- Add authentication if needed
