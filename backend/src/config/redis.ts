import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redis.on('connect', () => logger.info('Redis connected'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
