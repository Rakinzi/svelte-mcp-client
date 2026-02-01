import { Emitter } from './emitter.js';
import type {
  JsonValue,
  McpLog,
  McpMessage,
  McpResource,
  McpStatus,
  McpTool,
  McpToolResult
} from './types.js';
import type { McpTransport } from './transport.js';

/**
 * Configuration options for the MCP client.
 */
export type McpClientOptions = {
  /** Request timeout in milliseconds (default: 15000) */
  requestTimeoutMs?: number;
  /** Custom logger function to handle log entries */
  logger?: (log: McpLog) => void;
};

type PendingRequest = {
  resolve: (value: JsonValue) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

/**
 * MCP client for managing connections, sending requests, and handling events.
 *
 * The client handles request/response correlation, timeouts, reconnection,
 * and provides a high-level API for MCP operations.
 *
 * @example
 * ```ts
 * const transport = new SseTransport({ sseUrl: '/mcp/sse', postUrl: '/mcp' });
 * const client = createMcpClient(transport, { requestTimeoutMs: 10000 });
 *
 * await client.connect();
 * const tools = await client.listTools();
 * const result = await client.callTool('my-tool', { param: 'value' });
 * await client.disconnect();
 * ```
 */
export class McpClient {
  private transport: McpTransport;
  private options: Required<McpClientOptions>;
  private pending = new Map<string, PendingRequest>();
  private status: McpStatus = 'disconnected';
  private statusEmitter = new Emitter<McpStatus>();
  private messageEmitter = new Emitter<McpMessage>();
  private errorEmitter = new Emitter<Error>();
  private logEmitter = new Emitter<McpLog>();
  private unsubs: Array<() => void> = [];

  constructor(transport: McpTransport, options: McpClientOptions = {}) {
    this.transport = transport;
    this.options = {
      requestTimeoutMs: options.requestTimeoutMs ?? 15000,
      logger: options.logger ?? (() => {})
    };

    this.unsubs.push(
      this.transport.onMessage((message) => this.handleMessage(message)),
      this.transport.onStatus((status) => this.setStatus(status)),
      this.transport.onError((error) => this.handleError(error))
    );

    if (this.transport.onLog) {
      this.unsubs.push(
        this.transport.onLog((log) => {
          this.logEmitter.emit(log);
          this.options.logger(log);
        })
      );
    }
  }

  /** Establish connection to the MCP server */
  async connect(): Promise<void> {
    this.setStatus('connecting');
    await this.transport.connect();
  }

  /** Disconnect from the MCP server and reject all pending requests */
  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.setStatus('disconnected');
    this.rejectAllPending(new Error('Disconnected'));
  }

  /** Check if currently connected to the server */
  isConnected(): boolean {
    return this.transport.isConnected();
  }

  /**
   * Subscribe to connection status changes.
   * @returns Unsubscribe function
   */
  onStatus(handler: (status: McpStatus) => void): () => void {
    return this.statusEmitter.on(handler);
  }

  /**
   * Subscribe to all incoming MCP messages.
   * @returns Unsubscribe function
   */
  onMessage(handler: (message: McpMessage) => void): () => void {
    return this.messageEmitter.on(handler);
  }

  /**
   * Subscribe to client-level errors.
   * @returns Unsubscribe function
   */
  onError(handler: (error: Error) => void): () => void {
    return this.errorEmitter.on(handler);
  }

  /**
   * Subscribe to client logs for debugging.
   * @returns Unsubscribe function
   */
  onLog(handler: (log: McpLog) => void): () => void {
    return this.logEmitter.on(handler);
  }

  /**
   * List all available tools from the MCP server.
   * @returns Array of tool definitions
   */
  async listTools(): Promise<McpTool[]> {
    const result = await this.request('mcp.listTools');
    return (result as McpTool[]) ?? [];
  }

  /**
   * List all available resources from the MCP server.
   * @returns Array of resource definitions
   */
  async listResources(): Promise<McpResource[]> {
    const result = await this.request('mcp.listResources');
    return (result as McpResource[]) ?? [];
  }

  /**
   * Invoke a tool on the MCP server.
   * @param name - Tool name to call
   * @param args - Tool arguments as JSON value
   * @returns Tool result with content or error
   */
  async callTool(name: string, args?: JsonValue): Promise<McpToolResult> {
    const result = await this.request('mcp.callTool', { name, args } as JsonValue);
    return result as McpToolResult;
  }

  /**
   * Clean up all subscriptions and reject pending requests.
   * Call this when you're done with the client.
   */
  destroy(): void {
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
    this.rejectAllPending(new Error('Client destroyed'));
  }

  private async request(method: string, params?: JsonValue): Promise<JsonValue> {
    const id = this.generateId();
    const message: McpMessage = { id, method, params };

    const promise = new Promise<JsonValue>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timed out: ${method}`));
      }, this.options.requestTimeoutMs);

      this.pending.set(id, { resolve, reject, timeoutId });
    });

    this.log('debug', `send ${method}`, { id, params } as JsonValue);
    await this.transport.send(message);

    return promise;
  }

  private handleMessage(message: McpMessage): void {
    this.messageEmitter.emit(message);

    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timeoutId);
      this.pending.delete(message.id);

      if (message.error) {
        const err = new Error(message.error.message);
        pending.reject(err);
        return;
      }

      pending.resolve(message.result ?? null);
      return;
    }

    this.log('info', 'message', message as unknown as JsonValue);
  }

  private handleError(error: Error): void {
    this.errorEmitter.emit(error);
    this.log('error', error.message);
  }

  private setStatus(status: McpStatus): void {
    this.status = status;
    this.statusEmitter.emit(status);
    this.log('info', `status ${status}`);
  }

  private log(level: McpLog['level'], message: string, data?: JsonValue): void {
    const log: McpLog = { level, message, time: Date.now(), data };
    this.logEmitter.emit(log);
    this.options.logger(log);
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
      this.pending.delete(id);
    }
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Factory function to create an MCP client instance.
 *
 * @param transport - Transport implementation (SSE, WebSocket, etc.)
 * @param options - Optional client configuration
 * @returns Configured MCP client instance
 *
 * @example
 * ```ts
 * const transport = new SseTransport({ sseUrl: '/mcp/sse', postUrl: '/mcp' });
 * const client = createMcpClient(transport, { requestTimeoutMs: 20000 });
 * ```
 */
export const createMcpClient = (transport: McpTransport, options?: McpClientOptions) =>
  new McpClient(transport, options);
