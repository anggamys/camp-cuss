import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Base App Config
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_TO_FILE: z.enum(['true', 'false']).default('false'),

  // CORS Config
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(',').map((origin) => origin.trim()) : [],
    ),

  // Database Config
  DATABASE_URL: z.string().url(),

  // Redis Config
  REDIS_URL: z.string().url().optional(),

  // JWT Config
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES: z.string().default('3600'), // in seconds
  JWT_REFRESH_EXPIRES: z.string().default('604800'), // in seconds (7 days)

  // Storage Config
  S3_BUCKET_PUBLIC: z.string(),
  S3_BUCKET_PRIVATE: z.string(),
  S3_REGION: z.string(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  SUPABASE_PUBLIC_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Midtrans Payment Gateway Config
  MIDTRANS_IS_PRODUCTION: z.enum(['true', 'false']).default('false'),
  ENDPOINT_URL: z.string().url(),
  MERCHANT_ID: z.string(),
  CLIENT_KEY: z.string(),
  SERVER_KEY: z.string(),
});

export const Env = envSchema.parse(process.env);
