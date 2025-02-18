import { BaseError } from './base.js';

// const unknownErrorCode = -1;

export type RpcErrorCode =
  | -1
  | -32700 // Parse error
  | -32600 // Invalid request
  | -32601 // Method not found
  | -32602 // Invalid params
  | -32603 // Internal error
  | -32000 // Invalid input
  | -32001 // Resource not found
  | -32002 // Resource unavailable
  | -32003 // Transaction rejected
  | -32004 // Method not supported
  | -32005 // Limit exceeded
  | -32006 // JSON-RPC version not supported
  | -32042; // Method not found

export type RpcErrorType = RpcError & { name: 'RpcError' };

export class RpcError<code_ extends number = RpcErrorCode> extends BaseError {
  code: code_;
  data: string;

  override name = 'RpcError';

  constructor(code: code_, message?: string, data?: string) {
    message = message || 'An error occurred.';
    data = data || '';

    super(message, { details: data });
    this.code = code;
    this.data = data;
  }
}
