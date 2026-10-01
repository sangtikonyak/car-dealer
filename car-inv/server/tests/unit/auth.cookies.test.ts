import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { clearAdminSessionCookie, setAdminSessionCookie } from '../../src/modules/auth/auth.cookies.js';

const createResponse = () => {
  const setHeader = vi.fn();
  return { response: { setHeader } as unknown as Response, setHeader };
};

const cookieEnvironment = {
  ADMIN_SESSION_COOKIE: 'test_session',
  ADMIN_SESSION_TTL_HOURS: 24,
  NODE_ENV: 'production' as const,
};

describe('admin session cookies', () => {
  it('defaults to secure cookies in production', () => {
    const { response, setHeader } = createResponse();

    setAdminSessionCookie(response, cookieEnvironment, 'token');

    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('; Secure'));
  });

  it('defaults to non-secure cookies in development', () => {
    const { response, setHeader } = createResponse();

    setAdminSessionCookie(response, { ...cookieEnvironment, NODE_ENV: 'development' }, 'token');

    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.not.stringContaining('; Secure'));
  });

  it('allows secure cookies to be disabled for HTTP deployments', () => {
    const { response, setHeader } = createResponse();

    setAdminSessionCookie(response, { ...cookieEnvironment, ADMIN_SESSION_COOKIE_SECURE: false }, 'token');

    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.not.stringContaining('; Secure'));
  });

  it('uses the same security policy when clearing the cookie', () => {
    const { response, setHeader } = createResponse();

    clearAdminSessionCookie(response, { ...cookieEnvironment, ADMIN_SESSION_COOKIE_SECURE: false });

    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.not.stringContaining('; Secure'));
  });
});
