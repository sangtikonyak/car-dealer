import type { Response } from 'express';
import type { Environment } from '../../config/env.js';

const cookieValue = (value: string): string => encodeURIComponent(value);

const shouldUseSecureCookie = (
  environment: Pick<Environment, 'ADMIN_SESSION_COOKIE_SECURE' | 'NODE_ENV'>,
): boolean => environment.ADMIN_SESSION_COOKIE_SECURE ?? environment.NODE_ENV === 'production';

export const setAdminSessionCookie = (
  response: Response,
  environment: Pick<
    Environment,
    | 'ADMIN_SESSION_COOKIE'
    | 'ADMIN_SESSION_TTL_HOURS'
    | 'ADMIN_SESSION_COOKIE_SECURE'
    | 'NODE_ENV'
  >,
  token: string,
): void => {
  const maxAge = environment.ADMIN_SESSION_TTL_HOURS * 60 * 60;
  response.setHeader(
    'Set-Cookie',
    `${environment.ADMIN_SESSION_COOKIE}=${cookieValue(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${shouldUseSecureCookie(environment) ? '; Secure' : ''}`,
  );
};

export const clearAdminSessionCookie = (
  response: Response,
  environment: Pick<
    Environment,
    'ADMIN_SESSION_COOKIE' | 'ADMIN_SESSION_COOKIE_SECURE' | 'NODE_ENV'
  >,
): void => {
  response.setHeader(
    'Set-Cookie',
    `${environment.ADMIN_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${shouldUseSecureCookie(environment) ? '; Secure' : ''}`,
  );
};

export const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined;
  const prefix = `${name}=`;
  const entry = header.split(';').find((part) => part.trim().startsWith(prefix));
  if (!entry) return undefined;
  const value = entry.trim().slice(prefix.length);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};
