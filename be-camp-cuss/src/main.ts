import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationError,
  ValidationPipe,
  VersioningType,
  BadRequestException,
} from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
