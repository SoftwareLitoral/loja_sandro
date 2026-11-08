import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { routes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { apiLimiter } from './middlewares/rate-limit.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  app.use('/api', apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
