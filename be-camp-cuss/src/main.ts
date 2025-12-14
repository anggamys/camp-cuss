import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VersioningType,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestContextService } from './common/contexts/request-context.service';
import { AppLoggerService } from './common/loggers/app-logger.service';
import { Env } from './common/constants/env.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const logger = app.get(AppLoggerService);

  // Prefix dan versi API
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Pipe global
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

  // Interceptor & Filter
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new UserContextInterceptor(app.get(RequestContextService)),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // CORS
  app.enableCors({
    origin: Env.APP_CORS_ORIGINS.length > 0 ? Env.APP_CORS_ORIGINS : '*',
    credentials: true,
  });

  // Jalankan HTTP server
  const port = Env.APP_PORT;
  await app.listen(port);
  logger.log(`Server berjalan di port ${port}`, 'Bootstrap');
}

void bootstrap();
