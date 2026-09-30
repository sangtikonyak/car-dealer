import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { loginSchema } from './auth.schema.js';
import { clearAdminSessionCookie, setAdminSessionCookie } from './auth.cookies.js';
import type { Environment } from '../../config/env.js';
import { AuthService } from './auth.service.js';
import { UnauthorizedAppError } from '../../errors/app-error.js';

export class AuthController {
  public constructor(
    private readonly service: AuthService,
    private readonly environment: Environment,
  ) {}

  public login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.login(loginSchema.parse(request.body));
    setAdminSessionCookie(response, this.environment, result.token);
    sendSuccess(response, 200, 'Signed in successfully.', { user: result.user });
  };

  public me = async (request: Request, response: Response): Promise<void> => {
    if (!request.adminUser) throw new UnauthorizedAppError();
    sendSuccess(response, 200, 'Admin session loaded.', { user: request.adminUser });
  };

  public logout = async (request: Request, response: Response): Promise<void> => {
    if (request.adminSessionId) await this.service.logout(request.adminSessionId);
    clearAdminSessionCookie(response, this.environment);
    sendSuccess(response, 200, 'Signed out successfully.', null);
  };
}
