<script lang="ts">
  import { setContext, onDestroy } from 'svelte';
  import type { McpClient } from '../core/client.js';
  import { createMcpStores } from '../stores/createMcpStores.js';
  import { MCP_CONTEXT_KEY } from './context.js';

  export let client: McpClient;

  const stores = createMcpStores(client);
  setContext(MCP_CONTEXT_KEY, { client, stores });

  onDestroy(() => {
    stores.destroy();
  });
</script>

<slot />
