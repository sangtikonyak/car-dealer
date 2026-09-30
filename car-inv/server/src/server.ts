import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { createApp } from './app.js';
import { getPrismaClient, disconnectPrisma } from './config/database.js';
import { parseEnvironment } from './config/env.js';
import { logger } from './utils/logger.js';

const start = async (): Promise<void> => {
  const environment = parseEnvironment(process.env);
  await mkdir(environment.UPLOAD_DIR, { recursive: true });
  const prisma = getPrismaClient();
  await prisma.$connect();
  const app = createApp({ environment, prisma });
  const server = app.listen(environment.PORT, () => {
    logger.info('HTTP server started', {
      port: environment.PORT,
      environment: environment.NODE_ENV,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Shutdown requested', { signal });
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
};

start().catch(async (error: unknown) => {
  logger.error('Server failed to start', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  await disconnectPrisma();
  process.exitCode = 1;
});
