import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildDatabaseUrl } from '../../src/config/database-url.js';
import { parseEnvironment } from '../../src/config/env.js';

const environment = parseEnvironment(process.env);
const prisma = new PrismaClient({ datasourceUrl: buildDatabaseUrl(environment) });
const app = createApp({ environment, prisma });

describe('admin authentication end-to-end', () => {
  beforeAll(async () => prisma.$connect());
  afterAll(async () => prisma.$disconnect());

  it('logs in, persists a secure session, accesses protected content, and logs out', async () => {
    if (!environment.ADMIN_INITIAL_EMAIL || !environment.ADMIN_INITIAL_PASSWORD) {
      throw new Error(
        'ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD are required for E2E auth tests.',
      );
    }

    const agent = request.agent(app);
    const login = await agent
      .post('/api/v1/admin/auth/login')
      .send({
        email: environment.ADMIN_INITIAL_EMAIL,
        password: environment.ADMIN_INITIAL_PASSWORD,
      })
      .expect(200);
    const rawSetCookie = login.headers['set-cookie'];
    const setCookie = Array.isArray(rawSetCookie) ? rawSetCookie.join(';') : (rawSetCookie ?? '');

    expect(setCookie).toContain(`${environment.ADMIN_SESSION_COOKIE}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect((login.body as { data: { user: { email: string } } }).data.user.email).toBe(
      environment.ADMIN_INITIAL_EMAIL.toLowerCase(),
    );

    await agent.get('/api/v1/admin/auth/me').expect(200);
    await agent.get('/api/v1/admin/homepage').expect(200);
    await agent.post('/api/v1/admin/auth/logout').expect(200);
    await agent.get('/api/v1/admin/auth/me').expect(401);
  });

  it('rejects invalid credentials and unauthenticated protected requests', async () => {
    await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: environment.ADMIN_INITIAL_EMAIL ?? 'admin@example.com',
        password: 'wrong-password',
      })
      .expect(401);
    await request(app).get('/api/v1/admin/homepage').expect(401);
    await request(app).post('/api/v1/admin/auth/logout').expect(401);
  });
});
