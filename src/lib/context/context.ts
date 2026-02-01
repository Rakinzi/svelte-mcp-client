import type { McpClient } from '../core/client.js';
import type { McpStores } from '../stores/createMcpStores.js';

export type McpContext = {
  client: McpClient;
  stores: McpStores;
};

export const MCP_CONTEXT_KEY = Symbol('mcp-context');
