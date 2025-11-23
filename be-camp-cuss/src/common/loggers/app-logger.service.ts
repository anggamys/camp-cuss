import { Injectable, LoggerService } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';
import { RequestContextService } from '../contexts/request-context.service';
import { Env } from '../constants/env.constant';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly winston: WinstonLogger;

  constructor(private readonly context: RequestContextService) {
    this.winston = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.printf((info) => {
          const timestamp = info.timestamp as string;
          const level = info.level;
          const message = info.message as string;
          const stack = info.stack as string | undefined;
          return `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}${stack ? '\n' + stack : ''}`;
        }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize({ all: true }),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf((info) => {
              const timestamp = info.timestamp as string;
              const level = info.level;
              const message = info.message as string;
              return `${timestamp} [${level.padEnd(5)}] ${message}`;
            }),
          ),
        }),
        ...(Env.LOG_TO_FILE === 'true'
          ? [
              new transports.File({
                filename: 'logs/app.log',
                maxsize: 5 * 1024 * 1024,
                maxFiles: 5,
                tailable: true,
                format: format.combine(format.uncolorize()),
              }),
            ]
          : []),
      ],
    });
  }

  private getCallerContext(): string | undefined {
    // Try to extract the caller class name from the stack trace
    const err = new Error();
    if (err.stack) {
      const stackLines = err.stack.split('\n');
      // Find the first stack line outside AppLoggerService
      for (const line of stackLines) {
        if (!line.includes('AppLoggerService') && /at (\w+)/.test(line)) {
          const match = line.match(/at (\w+)/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    }
    return undefined;
  }

  private enrich(message: string, context?: string): string {
    const ctx = this.context.getAll();
    // Use provided context, or fallback to caller context
    const label = context || this.getCallerContext();
    const prefix = [
      ctx?.requestId ? `[RID:${ctx.requestId}]` : '',
      ctx?.userId ? `[UID:${ctx.userId}]` : '',
      label ? `[${label}]` : '',
    ]
      .filter((item): item is string => Boolean(item))
      .join(' ');
    return prefix ? `${prefix} ${message}` : message;
  }

  log(message: string, context?: string) {
    this.winston.info(this.enrich(message, context));
  }

  error(message: string, trace?: string, context?: string) {
    const enrichedMessage = this.enrich(message, context);
    if (trace) {
      this.winston.error(`${enrichedMessage}\n${trace}`);
    } else {
      this.winston.error(enrichedMessage);
    }
  }

  warn(message: string, context?: string) {
    this.winston.warn(this.enrich(message, context));
  }

  debug(message: string, context?: string) {
    this.winston.debug(this.enrich(message, context));
  }

  verbose(message: string, context?: string) {
    this.winston.verbose(this.enrich(message, context));
  }
}
