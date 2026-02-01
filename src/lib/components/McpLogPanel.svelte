<script lang="ts">
  import { useMcp } from '../context/useMcp.js';

  const { stores } = useMcp();
  const { logs } = stores;
</script>

<div class="mcp-log-panel">
  {#each $logs as log}
    <div class={`log ${log.level}`}>
      <span class="time">{new Date(log.time).toLocaleTimeString()}</span>
      <span class="level">{log.level}</span>
      <span class="message">{log.message}</span>
    </div>
  {/each}
</div>

<style>
  .mcp-log-panel {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    font-size: 0.85rem;
    display: grid;
    gap: 0.25rem;
    max-height: 240px;
    overflow: auto;
  }

  .log {
    display: grid;
    grid-template-columns: 90px 60px 1fr;
    gap: 0.5rem;
  }

  .log.error {
    color: #b91c1c;
  }

  .log.warn {
    color: #b45309;
  }
</style>
