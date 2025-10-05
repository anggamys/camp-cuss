import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T | null;
    errors: Record<string, unknown> | null;
    meta: Record<string, unknown> | null;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>>;
}
export {};
