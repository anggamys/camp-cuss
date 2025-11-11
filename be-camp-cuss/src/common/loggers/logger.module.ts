import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { RequestContextService } from '../contexts/request-context.service';

@Global()
@Module({
  providers: [AppLoggerService, RequestContextService],
  exports: [AppLoggerService, RequestContextService],
})
export class LoggerModule {}
