import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { register } from './utils/metrics';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin.split(','),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  if (config.metricsEnabled) {
    app.use(metricsMiddleware);
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  app.get('/health/ready', async (_req, res) => {
    res.json({ status: 'ready', mongodb: 'connected', redis: 'connected' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/v1', routes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
