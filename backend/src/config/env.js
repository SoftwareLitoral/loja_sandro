import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Variaveis de ambiente ausentes no .env: ${missing.join(', ')}`);
}

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: toInt(process.env.PORT, 3333),
  apiUrl: process.env.API_URL || `http://localhost:${toInt(process.env.PORT, 3333)}`,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
  shipping: {
    freeThresholdCents: toInt(process.env.FREE_SHIPPING_THRESHOLD_CENTS, 19900),
    standardCents: toInt(process.env.STANDARD_SHIPPING_CENTS, 1990),
    expressCents: toInt(process.env.EXPRESS_SHIPPING_CENTS, 3490),
    pickupCents: toInt(process.env.PICKUP_SHIPPING_CENTS, 0),
  },
};
