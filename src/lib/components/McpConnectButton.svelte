<script lang="ts">
  import { useMcp } from '../context/useMcp.js';

  export let connectLabel = 'Connect';
  export let disconnectLabel = 'Disconnect';

  const { client, stores } = useMcp();
  const { connection } = stores;
</script>

<button
  type="button"
  on:click={() => (client.isConnected() ? client.disconnect() : client.connect())}
>
  {#if $connection.isConnected}
    {disconnectLabel}
  {:else}
    {connectLabel}
  {/if}
</button>
