import { Injectable, LoggerService } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(private readonly winston: WinstonLogger) {}

  log(message: string, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.winston.log('info', msg);
  }

  error(message: string, trace?: string, context?: string) {
    const metaParts: string[] = [];
    if (context) metaParts.push(`context=${context}`);
    if (trace) metaParts.push(`trace=${trace}`);
    const meta = metaParts.length ? ` (${metaParts.join('; ')})` : '';
    this.winston.error(`${message}${meta}`);
  }

  warn(message: string, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.winston.warn(msg);
  }

  debug(message: string, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.winston.debug?.(msg);
  }

  verbose(message: string, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.winston.verbose?.(msg);
  }
}
