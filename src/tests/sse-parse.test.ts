import { describe, expect, it } from 'vitest';
import { SseTransport } from '../lib/transports/sse.js';
import type { McpMessage } from '../lib/core/types.js';

class FakeEventSource {
  static lastInstance: FakeEventSource | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(_url: string) {
    FakeEventSource.lastInstance = this;
  }

  close(): void {}
}

describe('SseTransport message parsing', () => {
  it('parses and dispatches messages', async () => {
    const transport = new SseTransport({
      EventSourceImpl: FakeEventSource as unknown as typeof EventSource,
      fetchImpl: async () => new Response(null, { status: 200 })
    });

    const received: McpMessage[] = [];
    transport.onMessage((message) => received.push(message));

    await transport.connect();

    FakeEventSource.lastInstance?.onmessage?.({
      data: JSON.stringify({ id: '1', result: { ok: true } })
    });

    expect(received).toEqual([{ id: '1', result: { ok: true } }]);
  });
});
