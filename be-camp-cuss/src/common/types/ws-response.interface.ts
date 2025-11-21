export interface WsTransformResult<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  meta: {
    event: string;
    clientId: string;
    timestamp: string;
  };
}

export interface WsResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  meta: {
    event: string;
    context: string;
    timestamp: string;
    requestId?: string;
    durationMs?: number;
    clientId?: string;
  };
}
