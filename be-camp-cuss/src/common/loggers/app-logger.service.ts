import { Injectable, LoggerService } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';
import { RequestContextService } from '../contexts/request-context.service';

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
        ...(process.env.LOG_TO_FILE === 'true'
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

  private enrich(message: string, context?: string): string {
    const ctx = this.context.getAll();
    const prefix = [
      ctx?.requestId ? `[RID:${ctx.requestId}]` : '',
      ctx?.userId ? `[UID:${ctx.userId}]` : '',
      context ? `[${context}]` : '',
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
