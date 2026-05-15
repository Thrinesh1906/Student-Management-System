import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongodbUri);
  logger.info('MongoDB connected', { uri: config.mongodbUri.replace(/\/\/.*@/, '//***@') });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
