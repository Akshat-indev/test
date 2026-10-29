import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:5173'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').default('https://placeholder.supabase.co'),
  SUPABASE_SECRET_KEY: z.string().default('placeholder-key-for-testing'),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.errors.forEach((err) => {
    console.error(`  ${err.path.join('.')}: ${err.message}`);
  });
  // Only exit in non-test environments to allow unit tests to run
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : {
  PORT: '5000',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:5173',
  SUPABASE_URL: 'https://placeholder.supabase.co',
  SUPABASE_SECRET_KEY: 'placeholder',
  ADZUNA_APP_ID: undefined,
  ADZUNA_APP_KEY: undefined,
};
