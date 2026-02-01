import type { McpLog, McpMessage, McpStatus } from './types.js';

/** Unsubscribe function returned by event listeners */
export type TransportUnsubscribe = () => void;

/**
 * Transport abstraction for MCP client-server communication.
 * Implement this interface to add support for different transport mechanisms (SSE, WebSocket, etc.).
 *
 * The client uses this interface to send messages and subscribe to events,
 * making it transport-agnostic and extensible.
 *
 * @example
 * ```ts
 * const transport = new SseTransport({ sseUrl: '/mcp/sse', postUrl: '/mcp' });
 * const client = createMcpClient(transport);
 * await client.connect();
 * ```
 */
export interface McpTransport {
  /** Establish the connection to the MCP server */
  connect(): Promise<void>;

  /** Close the connection gracefully */
  disconnect(): Promise<void>;

  /** Check if currently connected */
  isConnected(): boolean;

  /** Send an MCP message to the server */
  send(message: McpMessage): Promise<void>;

  /** Subscribe to incoming messages. Returns unsubscribe function. */
  onMessage(handler: (message: McpMessage) => void): TransportUnsubscribe;

  /** Subscribe to connection status changes. Returns unsubscribe function. */
  onStatus(handler: (status: McpStatus) => void): TransportUnsubscribe;

  /** Subscribe to transport-level errors. Returns unsubscribe function. */
  onError(handler: (error: Error) => void): TransportUnsubscribe;

  /** Optional: Subscribe to transport-level logs. Returns unsubscribe function. */
  onLog?(handler: (log: McpLog) => void): TransportUnsubscribe;
}
