import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VersioningType,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './common/loggers/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: WinstonModule.createLogger(createWinstonConfig()),
  });
  const configService = app.get(ConfigService);

  // Prefix global agar semua endpoint diawali dengan /api/v1 misal
  app.setGlobalPrefix('api');

  // Validasi DTO global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // konversi otomatis tipe dari query/body
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formattedErrors = validationErrors.reduce(
          (acc: Record<string, string[]>, err: ValidationError) => {
            if (err.constraints) {
              acc[err.property] = Object.values(err.constraints);
            }
            return acc;
          },
          {},
        );

        throw new BadRequestException({
          message: 'Validasi gagal',
          errors: formattedErrors,
        });
      },
    }),
  );

  // Global Interceptor dan Filter
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Versioning berbasis URI
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Konfigurasi CORS (bisa disesuaikan domain FE)
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') ?? '*',
    credentials: true,
  });

  // Port dari .env
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
}

void bootstrap();
