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
