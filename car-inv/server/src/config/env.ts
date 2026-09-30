import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverDirectory = path.resolve(configDirectory, '..', '..');
const defaultUploadDirectory = path.resolve(serverDirectory, '..', 'uploads');

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8000),
    DB_HOST: z
      .string()
      .trim()
      .min(1, 'DB_HOST is required')
      .refine((host) => !host.includes('://') && !/[\\/\s]/u.test(host), {
        message: 'DB_HOST must be a hostname or IP address without a protocol or path',
      }),
    DB_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
    DB_USERNAME: z.string().trim().min(1, 'DB_USERNAME is required'),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().trim().min(1, 'DB_NAME is required'),
    CLIENT_URL: z.string().url().default('http://127.0.0.1:5173'),
    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
      .default('info'),
    ADMIN_API_KEY: z
      .string()
      .trim()
      .min(16, 'ADMIN_API_KEY must be at least 16 characters')
      .default('development-admin-key-change-me'),
    ADMIN_INITIAL_EMAIL: z.string().trim().email().optional(),
    ADMIN_INITIAL_PASSWORD: z.string().min(12).optional(),
    ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(24),
    ADMIN_SESSION_COOKIE: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]+$/u)
      .default('driva_admin_session'),
    UPLOAD_DIR: z
      .string()
      .trim()
      .min(1)
      .default(defaultUploadDirectory)
      .transform((directory) =>
        path.isAbsolute(directory) ? directory : path.resolve(serverDirectory, directory),
      ),
    MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .max(50 * 1024 * 1024)
      .default(10 * 1024 * 1024),
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === 'production' &&
      environment.ADMIN_API_KEY === 'development-admin-key-change-me'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_API_KEY'],
        message: 'ADMIN_API_KEY must be configured in production.',
      });
    }
    if (
      environment.NODE_ENV === 'production' &&
      (!environment.ADMIN_INITIAL_EMAIL || !environment.ADMIN_INITIAL_PASSWORD)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_INITIAL_PASSWORD'],
        message: 'Initial admin credentials must be configured in production.',
      });
    }
  })
  .readonly();

export type Environment = z.infer<typeof environmentSchema>;

export const parseEnvironment = (input: NodeJS.ProcessEnv): Environment =>
  environmentSchema.parse(input);
