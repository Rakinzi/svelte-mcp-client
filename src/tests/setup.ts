import { vi } from 'vitest';

// Provide a default fetch mock in case tests rely on global fetch.
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}
