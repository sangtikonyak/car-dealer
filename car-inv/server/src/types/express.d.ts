import type { AdminUserDto } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUserDto;
      adminSessionId?: string;
    }
  }
}

export {};
