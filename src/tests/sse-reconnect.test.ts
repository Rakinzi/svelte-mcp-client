import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SseTransport } from '../lib/transports/sse.js';

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

describe('SseTransport reconnect backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('uses exponential backoff', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const transport = new SseTransport({
      EventSourceImpl: FakeEventSource as unknown as typeof EventSource,
      fetchImpl: vi.fn() as unknown as typeof fetch,
      reconnect: { baseDelayMs: 100, maxDelayMs: 1000, jitter: 0 }
    });

    await transport.connect();

    FakeEventSource.lastInstance?.onerror?.();
    FakeEventSource.lastInstance?.onerror?.();
    FakeEventSource.lastInstance?.onerror?.();

    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 400);
  });
});
