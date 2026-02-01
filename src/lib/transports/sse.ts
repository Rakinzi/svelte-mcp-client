import { Emitter } from '../core/emitter.js';
import type { McpLog, McpMessage, McpStatus } from '../core/types.js';
import type { McpTransport } from '../core/transport.js';

type BackoffConfig = {
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: number;
};

type SseTransportOptions = {
  sseUrl?: string;
  postUrl?: string;
  fetchImpl?: typeof fetch;
  EventSourceImpl?: typeof EventSource;
  reconnect?: Partial<BackoffConfig>;
};

const defaultBackoff: BackoffConfig = {
  baseDelayMs: 500,
  maxDelayMs: 15000,
  jitter: 0.25
};

/**
 * Server-Sent Events (SSE) transport implementation for MCP.
 *
 * Uses EventSource for receiving server messages (SSE stream) and
 * fetch POST for sending client messages. Includes automatic reconnection
 * with exponential backoff.
 *
 * @example
 * ```ts
 * const transport = new SseTransport({
 *   sseUrl: '/api/mcp/sse',
 *   postUrl: '/api/mcp',
 *   reconnect: { baseDelayMs: 1000, maxDelayMs: 30000 }
 * });
 * ```
 */
export class SseTransport implements McpTransport {
  private sseUrl: string;
  private postUrl: string;
  private fetchImpl: typeof fetch;
  private EventSourceImpl: typeof EventSource;
  private status: McpStatus = 'disconnected';
  private manualClose = false;
  private retryAttempt = 0;
  private reconnectConfig: BackoffConfig;
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private messageEmitter = new Emitter<McpMessage>();
  private statusEmitter = new Emitter<McpStatus>();
  private errorEmitter = new Emitter<Error>();
  private logEmitter = new Emitter<McpLog>();

  constructor(options: SseTransportOptions = {}) {
    this.sseUrl = options.sseUrl ?? '/mcp/sse';
    this.postUrl = options.postUrl ?? '/mcp';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.EventSourceImpl = options.EventSourceImpl ?? EventSource;
    this.reconnectConfig = { ...defaultBackoff, ...(options.reconnect ?? {}) };
  }

  async connect(): Promise<void> {
    this.manualClose = false;
    this.clearReconnectTimer();
    this.openEventSource();
  }

  async disconnect(): Promise<void> {
    this.manualClose = true;
    this.clearReconnectTimer();
    this.closeEventSource();
    this.setStatus('disconnected');
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  async send(message: McpMessage): Promise<void> {
    const res = await this.fetchImpl(this.postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!res.ok) {
      throw new Error(`POST failed: ${res.status}`);
    }
  }

  onMessage(handler: (message: McpMessage) => void): () => void {
    return this.messageEmitter.on(handler);
  }

  onStatus(handler: (status: McpStatus) => void): () => void {
    return this.statusEmitter.on(handler);
  }

  onError(handler: (error: Error) => void): () => void {
    return this.errorEmitter.on(handler);
  }

  onLog(handler: (log: McpLog) => void): () => void {
    return this.logEmitter.on(handler);
  }

  private openEventSource(): void {
    this.setStatus(this.status === 'connected' ? 'connected' : 'connecting');
    this.eventSource = new this.EventSourceImpl(this.sseUrl);

    this.eventSource.onopen = () => {
      this.retryAttempt = 0;
      this.setStatus('connected');
      this.log('info', 'sse connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as McpMessage;
        this.messageEmitter.emit(parsed);
      } catch (error) {
        this.emitError(error instanceof Error ? error : new Error('Invalid SSE payload'));
      }
    };

    this.eventSource.onerror = () => {
      if (this.manualClose) return;
      this.emitError(new Error('SSE connection error'));
      this.setStatus('reconnecting');
      this.scheduleReconnect();
    };
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = this.nextBackoffDelay();
    this.log('warn', `reconnect in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      if (this.manualClose) return;
      this.closeEventSource();
      this.openEventSource();
    }, delay);
  }

  private nextBackoffDelay(): number {
    const { baseDelayMs, maxDelayMs, jitter } = this.reconnectConfig;
    const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** this.retryAttempt);
    this.retryAttempt += 1;
    const spread = exp * jitter;
    return Math.round(exp - spread + Math.random() * spread * 2);
  }

  private setStatus(status: McpStatus): void {
    this.status = status;
    this.statusEmitter.emit(status);
  }

  private emitError(error: Error): void {
    this.errorEmitter.emit(error);
    this.log('error', error.message);
  }

  private log(level: McpLog['level'], message: string): void {
    this.logEmitter.emit({ level, message, time: Date.now() });
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
