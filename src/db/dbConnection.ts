import mongoose from 'mongoose';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

export async function connectDatabase() {
  try {

    await mongoose.connect(env.MONGO_URI);
    logger.info('🗄️ Połączono z MongoDB');

  } catch (error) {

    logger.error('❌ Błąd połączenia z MongoDB: %s', error instanceof Error ? error.message : String(error));
    await mongoose.disconnect();

    process.exit(1);
  }
}