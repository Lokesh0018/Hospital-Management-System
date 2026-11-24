import dotenv from 'dotenv';

dotenv.config();

export const ENV = Object.freeze({
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'hms_default_dev_access_secret_key_123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'hms_default_dev_refresh_secret_key_456',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
});
