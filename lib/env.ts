export interface EnvConfig {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM: string;
  CRON_SECRET?: string;
  NEXT_PUBLIC_APP_URL: string;
  BILLING_PROVIDER?: string;
  BILLING_SECRET_KEY?: string;
  BILLING_WEBHOOK_SECRET?: string;
  IS_PRODUCTION: boolean;
}

function getEnv(): EnvConfig {
  const isProd = process.env.NODE_ENV === 'production';

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && isProd) {
    throw new Error('[FATAL] DATABASE_URL is missing in environment variables');
  }

  return {
    DATABASE_URL: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/meetlio',
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev_secret_session_key_min_32_chars_long',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@meetlio.com',
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    BILLING_PROVIDER: process.env.BILLING_PROVIDER || 'DEV_SIMULATOR',
    BILLING_SECRET_KEY: process.env.BILLING_SECRET_KEY,
    BILLING_WEBHOOK_SECRET: process.env.BILLING_WEBHOOK_SECRET,
    IS_PRODUCTION: isProd,
  };
}

export const env = getEnv();
