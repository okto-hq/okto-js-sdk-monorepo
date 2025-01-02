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
