export interface ApiResponse<T, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

export function apiResponse<T, M = unknown>(
  data: T,
  message: string,
  meta?: M,
): ApiResponse<T, M> {
  return {
    success: true,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  };
}