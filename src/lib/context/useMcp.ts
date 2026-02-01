import { getContext } from 'svelte';
import type { McpContext } from './context.js';
import { MCP_CONTEXT_KEY } from './context.js';

export const useMcp = (): McpContext => {
  const ctx = getContext<McpContext>(MCP_CONTEXT_KEY);
  if (!ctx) {
    throw new Error('McpProvider is missing in the component tree');
  }
  return ctx;
};
