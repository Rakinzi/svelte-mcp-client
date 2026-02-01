/** JSON primitive value types */
export type JsonPrimitive = string | number | boolean | null;

/** Recursive JSON value type supporting primitives, arrays, and objects */
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/**
 * JSON Schema definition following the JSON Schema specification.
 * Used to describe tool input/output schemas and validation rules.
 */
export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  enum?: JsonValue[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  default?: JsonValue;
};

/**
 * MCP tool definition describing a callable tool/function.
 * Tools can be listed via `client.listTools()` and invoked via `client.callTool()`.
 */
export type McpTool = {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description of what the tool does */
  description?: string;
  /** JSON Schema describing the expected input parameters */
  inputSchema?: JsonSchema;
  /** JSON Schema describing the output format */
  outputSchema?: JsonSchema;
};

/**
 * MCP resource definition representing a data source or endpoint.
 * Resources can be listed via `client.listResources()`.
 */
export type McpResource = {
  /** Unique resource URI */
  uri: string;
  /** Human-readable resource name */
  name?: string;
  /** Description of what the resource provides */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
};

/**
 * Tool invocation request with arguments.
 * Used internally when calling `client.callTool()`.
 */
export type McpToolCall = {
  /** Unique call identifier for correlation */
  id: string;
  /** Name of the tool to invoke */
  name: string;
  /** Tool arguments as JSON value */
  args?: JsonValue;
};

/**
 * Tool invocation result containing output or error.
 * Returned from `client.callTool()` after the tool completes.
 */
export type McpToolResult = {
  /** Call identifier matching the request */
  id: string;
  /** Tool output on success */
  content?: JsonValue;
  /** Error details if the tool failed */
  error?: { message: string; code?: number; data?: JsonValue };
};

/**
 * MCP protocol message format for client-server communication.
 * Can represent requests, responses, or notifications.
 */
export type McpMessage = {
  /** Message identifier for request/response correlation */
  id?: string;
  /** RPC method name for requests */
  method?: string;
  /** Method parameters or notification payload */
  params?: JsonValue;
  /** Response result data */
  result?: JsonValue;
  /** Error information if the operation failed */
  error?: { message: string; code?: number; data?: JsonValue };
};

/**
 * Connection status states for the MCP client.
 * Emitted via `client.onStatus()` when the connection state changes.
 */
export type McpStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/** Log severity levels */
export type McpLogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured log entry with timestamp and optional metadata.
 * Emitted via `client.onLog()` for debugging and monitoring.
 */
export type McpLog = {
  /** Severity level of the log entry */
  level: McpLogLevel;
  /** Log message text */
  message: string;
  /** Unix timestamp in milliseconds */
  time: number;
  /** Optional structured data */
  data?: JsonValue;
};
