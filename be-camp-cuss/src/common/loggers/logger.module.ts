import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './logger.config';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  imports: [WinstonModule.forRoot(createWinstonConfig())],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
