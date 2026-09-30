import { PrismaClient } from '@prisma/client';

import { buildDatabaseUrl } from './database-url.js';
import { parseEnvironment } from './env.js';

let prismaClient: PrismaClient | undefined;

export const getPrismaClient = (): PrismaClient => {
  if (prismaClient) return prismaClient;

  const environment = parseEnvironment(process.env);
  prismaClient = new PrismaClient({ datasourceUrl: buildDatabaseUrl(environment) });
  return prismaClient;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (!prismaClient) return;
  await prismaClient.$disconnect();
  prismaClient = undefined;
};
