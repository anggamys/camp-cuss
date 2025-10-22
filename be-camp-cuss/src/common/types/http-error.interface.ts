export interface ErrorResponse<T = null> {
  status: 'error' | 'success';
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
  meta: Record<string, unknown> | null;
}

export interface HttpErrorBody {
  message?: string | string[];
  errors?: Record<string, string[]> | Record<string, string>;
  [key: string]: unknown;
}
