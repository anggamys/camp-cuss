import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Base App Config
  APP_PORT: z.coerce.number().default(3000),
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  APP_LOG_TO_FILE: z.enum(['true', 'false']).default('false'),
  APP_URL: z.string().url(),

  // CORS Config
  APP_CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(',').map((origin) => origin.trim()) : [],
    ),

  // Database Config
  DATABASE_URL: z.string().url(),

  // Redis Config
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),

  // JWT Config
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES: z.string().default('3600'),
  JWT_REFRESH_EXPIRES: z.string().default('604800'),

  // Supabase Config
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Storage Supabase Config (S3 Compatible)
  S3_BUCKET_PUBLIC: z.string(),
  S3_BUCKET_PRIVATE: z.string(),
  S3_REGION: z.string(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),

  // Midtrans Config
  MIDTRANS_ENV: z.string(),
  MIDTRANS_BASE_URL: z.string().url(),
  MIDTRANS_MERCHANT_ID: z.string(),
  MIDTRANS_CLIENT_KEY: z.string(),
  MIDTRANS_SERVER_KEY: z.string(),
});

const Env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      interface EnvValidationErrorDetail {
        path: string;
        message: string;
        expected?: string;
        received?: string;
      }
      const zodError = error as z.ZodError<any>;
      const details: EnvValidationErrorDetail[] = (zodError.issues ?? []).map(
        (e): EnvValidationErrorDetail => ({
          path: e.path.map((p) => String(p)).join('.'),
          message: e.message,
          expected:
            typeof (e as unknown as Record<string, unknown>).expected !==
            'undefined'
              ? ((e as unknown as Record<string, unknown>).expected as string)
              : undefined,
          received:
            typeof (e as unknown as Record<string, unknown>).received !==
            'undefined'
              ? ((e as unknown as Record<string, unknown>).received as string)
              : undefined,
        }),
      );
      console.error(
        '[EnvValidation] Gagal memvalidasi environment variable:',
        JSON.stringify(details, null, 2),
      );
    } else {
      console.error(
        '[EnvValidation] Kesalahan tak terduga saat memuat environment variable:',
        (error as Error)?.stack,
      );
    }
    process.exit(1);
  }
})();

export { Env };
