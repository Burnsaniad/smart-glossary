/**
 * Shared API response envelope types and helpers.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    /** Field-level validation issues */
    issues?: { path: string; message: string }[];
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function errorResponse(
  message: string,
  options?: { code?: string; issues?: { path: string; message: string }[] },
): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      ...(options?.code !== undefined && { code: options.code }),
      ...(options?.issues !== undefined && { issues: options.issues }),
    },
  };
}
