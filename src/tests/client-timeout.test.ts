import { describe, expect, it } from 'vitest';
import { createMcpClient } from '../lib/core/client.js';
import type { McpMessage, McpStatus } from '../lib/core/types.js';
import type { McpTransport } from '../lib/core/transport.js';

class SilentTransport implements McpTransport {
  private statusHandlers: Array<(status: McpStatus) => void> = [];

  async connect(): Promise<void> {
    this.statusHandlers.forEach((h) => h('connected'));
  }

  async disconnect(): Promise<void> {
    this.statusHandlers.forEach((h) => h('disconnected'));
  }

  isConnected(): boolean {
    return true;
  }

  async send(_message: McpMessage): Promise<void> {}

  onMessage(): () => void {
    return () => {};
  }

  onStatus(handler: (status: McpStatus) => void): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  onError(): () => void {
    return () => {};
  }
}

describe('McpClient timeouts', () => {
  it('rejects when timeout expires', async () => {
    const client = createMcpClient(new SilentTransport(), { requestTimeoutMs: 10 });

    await expect(client.callTool('slow.tool')).rejects.toThrow('Request timed out');
  });
});
