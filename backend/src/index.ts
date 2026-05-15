import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initMetrics } from './utils/metrics';
import { logger } from './utils/logger';

async function bootstrap() {
  initMetrics();
  await connectDatabase();
  try {
    await connectRedis();
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache', { error: (err as Error).message });
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, { env: config.env });
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
