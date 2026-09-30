import type { PrismaClient } from '@prisma/client';
import type { AdminUserDto } from './auth.types.js';

interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}

interface AdminSessionRecord {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export class AuthRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public findUserByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }

  public findUserById(id: string): Promise<AdminUserRecord | null> {
    return this.prisma.adminUser.findUnique({ where: { id } });
  }

  public createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string; expiresAt: Date }> {
    return this.prisma.adminSession.create({
      data: input,
      select: { id: true, expiresAt: true },
    });
  }

  public findSession(tokenHash: string): Promise<AdminSessionRecord | null> {
    return this.prisma.adminSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });
  }

  public revokeSession(id: string): Promise<void> {
    return this.prisma.adminSession
      .updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } })
      .then(() => undefined);
  }

  public deleteExpiredSessions(): Promise<void> {
    return this.prisma.adminSession
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .then(() => undefined);
  }

  public toUserDto(user: Pick<AdminUserRecord, 'id' | 'email' | 'role'>): AdminUserDto {
    return { id: user.id, email: user.email, role: user.role };
  }
}
