<script lang="ts">
  import { onMount } from 'svelte';
  import { useMcp } from '../context/useMcp.js';
  import type { JsonValue, McpTool } from '../core/types.js';

  const { client, stores } = useMcp();
  const { tools } = stores;

  let selected: McpTool | null = null;
  let selectedName = '';
  let argsJson = '{}';
  let result: JsonValue | null = null;
  let error: string | null = null;

  onMount(async () => {
    try {
      const list = await client.listTools();
      tools.set(list);
      selected = list[0] ?? null;
      selectedName = selected?.name ?? '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tools';
    }
  });

  const runTool = async () => {
    error = null;
    result = null;
    if (!selected) return;

    let args: JsonValue | undefined;
    try {
      args = argsJson ? (JSON.parse(argsJson) as JsonValue) : undefined;
    } catch {
      error = 'Invalid JSON args';
      return;
    }

    try {
      const res = await client.callTool(selected.name, args);
      result = res;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Tool call failed';
    }
  };
</script>

<div class="mcp-tool-runner">
  <label>
    Tool
    <select
      bind:value={selectedName}
      on:change={() => {
        selected = $tools.find((tool) => tool.name === selectedName) ?? null;
      }}
    >
      {#each $tools as tool}
        <option value={tool.name}>{tool.name}</option>
      {/each}
    </select>
  </label>

  <label>
    Args (JSON)
    <textarea rows="4" bind:value={argsJson} />
  </label>

  <button type="button" on:click={runTool} disabled={!selected}>Run</button>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if result}
    <pre>{JSON.stringify(result, null, 2)}</pre>
  {/if}
</div>

<style>
  .mcp-tool-runner {
    display: grid;
    gap: 0.75rem;
  }

  .error {
    color: #b91c1c;
  }
</style>
