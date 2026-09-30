import { createHash, randomBytes } from 'node:crypto';
import { UnauthorizedAppError } from '../../errors/app-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { LoginInput } from './auth.schema.js';
import { AuthRepository } from './auth.repository.js';
import type { AdminUserDto, AuthSessionResult } from './auth.types.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export class AuthService {
  public constructor(
    private readonly repository: AuthRepository,
    private readonly sessionTtlHours: number,
  ) {}

  public async login(input: LoginInput): Promise<AuthSessionResult> {
    const user = await this.repository.findUserByEmail(input.email.toLowerCase());
    if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedAppError('Invalid email or password.');
    }

    await this.repository.deleteExpiredSessions();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.sessionTtlHours * 60 * 60 * 1000);
    const session = await this.repository.createSession({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    return {
      user: this.repository.toUserDto(user),
      token,
      expiresAt: session.expiresAt,
      sessionId: session.id,
    };
  }

  public async authenticate(token: string): Promise<{
    user: AdminUserDto;
    sessionId: string;
    expiresAt: Date;
  }> {
    const session = await this.repository.findSession(hashToken(token));
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedAppError();
    }
    return {
      user: this.repository.toUserDto(session.user),
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  public logout(sessionId: string): Promise<void> {
    return this.repository.revokeSession(sessionId);
  }

  public hashInitialPassword(password: string): Promise<string> {
    return hashPassword(password);
  }
}
