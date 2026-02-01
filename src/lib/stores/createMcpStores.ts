import { writable } from 'svelte/store';
import type { McpClient } from '../core/client.js';
import type { McpLog, McpResource, McpStatus, McpTool } from '../core/types.js';

/** Connection state tracked in the connection store */
export type ConnectionState = {
  status: McpStatus;
  isConnected: boolean;
  lastError?: string;
};

/** Collection of Svelte stores for MCP client state */
export type McpStores = {
  /** Connection status and error state */
  connection: ReturnType<typeof writable<ConnectionState>>;
  /** Available tools from the server */
  tools: ReturnType<typeof writable<McpTool[]>>;
  /** Available resources from the server */
  resources: ReturnType<typeof writable<McpResource[]>>;
  /** Log entries (limited to last 200) */
  logs: ReturnType<typeof writable<McpLog[]>>;
  /** Cleanup function to unsubscribe from client events */
  destroy: () => void;
};

/**
 * Create reactive Svelte stores for an MCP client.
 *
 * The stores automatically sync with client events and provide
 * reactive state for Svelte components.
 *
 * @param client - MCP client instance
 * @returns Collection of Svelte stores
 *
 * @example
 * ```ts
 * const client = createMcpClient(transport);
 * const stores = createMcpStores(client);
 *
 * // Use in Svelte components
 * $: isConnected = $stores.connection.isConnected;
 * $: availableTools = $stores.tools;
 * ```
 */
export const createMcpStores = (client: McpClient): McpStores => {
  const connection = writable<ConnectionState>({
    status: 'disconnected',
    isConnected: false
  });
  const tools = writable<McpTool[]>([]);
  const resources = writable<McpResource[]>([]);
  const logs = writable<McpLog[]>([]);

  const unsubs: Array<() => void> = [];

  unsubs.push(
    client.onStatus((status) => {
      connection.set({ status, isConnected: status === 'connected' });
    })
  );

  unsubs.push(
    client.onError((error) => {
      connection.update((state) => ({
        ...state,
        lastError: error.message
      }));
    })
  );

  unsubs.push(
    client.onLog((log) => {
      logs.update((items) => [...items, log].slice(-200));
    })
  );

  const destroy = () => {
    unsubs.forEach((fn) => fn());
  };

  return { connection, tools, resources, logs, destroy };
};
