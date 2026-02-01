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
  <main>
    <h1>MCP Client</h1>
    <McpConnectButton />
    <McpToolRunner />
    <McpLogPanel />
  </main>
</McpProvider>

<style>
  main {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
  }
</style>
