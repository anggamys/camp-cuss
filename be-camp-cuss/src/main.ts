import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VersioningType,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestContextService } from './common/contexts/request-context.service';
import { AppLoggerService } from './common/loggers/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const config = app.get(ConfigService);
  const logger = app.get(AppLoggerService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: config.get<string>('REDIS_HOST') ?? 'localhost',
      port: config.get<number>('REDIS_PORT') ?? 6379,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });
  await app.startAllMicroservices();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formatted = Object.fromEntries(
          validationErrors.map((e) => [
            e.property,
            Object.values(e.constraints ?? {}),
          ]),
        );
        throw new BadRequestException({
          message: 'Validasi gagal',
          errors: formatted,
        });
      },
    }),
  );

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new UserContextInterceptor(app.get(RequestContextService)),
  );

  app.useGlobalFilters(app.get(HttpExceptionFilter));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? '*',
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`Server berjalan di port ${port}`, 'Bootstrap');
}

void bootstrap();
