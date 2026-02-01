import { describe, expect, it } from 'vitest';
import { createMcpClient } from '../lib/core/client.js';
import type { McpMessage, McpStatus } from '../lib/core/types.js';
import type { McpTransport } from '../lib/core/transport.js';

class FakeTransport implements McpTransport {
  private messageHandlers: Array<(message: McpMessage) => void> = [];
  private statusHandlers: Array<(status: McpStatus) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private connected = false;
  lastSent: McpMessage | null = null;

  async connect(): Promise<void> {
    this.connected = true;
    this.statusHandlers.forEach((h) => h('connected'));
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.statusHandlers.forEach((h) => h('disconnected'));
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(message: McpMessage): Promise<void> {
    this.lastSent = message;
  }

  onMessage(handler: (message: McpMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onStatus(handler: (status: McpStatus) => void): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }

  emitMessage(message: McpMessage): void {
    this.messageHandlers.forEach((h) => h(message));
  }
}

describe('McpClient correlation map', () => {
  it('resolves promises on matching response id', async () => {
    const transport = new FakeTransport();
    const client = createMcpClient(transport, { requestTimeoutMs: 2000 });

    const promise = client.callTool('test.tool', { ping: true });

    const id = transport.lastSent?.id;
    if (!id) throw new Error('Missing request id');

    transport.emitMessage({ id, result: { id, content: { ok: true } } });

    await expect(promise).resolves.toEqual({ id, content: { ok: true } });
  });
});
