import type { HttpStatusCode } from 'axios';

export type ApiError = {
  code: HttpStatusCode;
  errorCode: string;
  message: string;
  trace_id: string;
  details: string;
};

export type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  error?: ApiError;
};

export type ApiResponseWithCount<K extends string, T> = ApiResponse<
  {
    count: number;
  } & {
    [P in K]: T[];
  }
>;

export type RpcPayload<
  T extends Record<string, unknown> | Record<string, unknown>[],
> = {
  method: string;
  jsonrpc: '2.0';
  id: string;
  params: T;
};

export type RpcResponse<T> = {
  jsonrpc: '2.0';
  id: string;
  result: T;
};
