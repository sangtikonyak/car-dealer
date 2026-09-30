import 'dotenv/config';
import { defineConfig } from 'prisma/config';

import { buildDatabaseUrl } from './src/config/database-url.js';
import { parseEnvironment } from './src/config/env.js';

const environment = parseEnvironment(process.env);
const databaseUrl = buildDatabaseUrl(environment);

// Prisma 6 validates schema-level env() references separately from this config.
// Populate the process-local value from the validated discrete connection fields.
process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
});
