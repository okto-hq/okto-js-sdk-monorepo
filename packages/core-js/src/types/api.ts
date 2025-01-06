export type ApiResponse<T> = {
  status: 'success' | 'error';
  data: T;
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
