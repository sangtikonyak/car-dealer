import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFrontendServer } from './server.mjs';

const listen = (server) =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Test server did not expose a TCP address.'));
        return;
      }
      resolve(address.port);
    });
  });

const close = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

describe('production frontend server', () => {
  let distDirectory;
  let frontendServer;
  let inventoryServer;
  let frontendPort;
  let inventoryPort;

  beforeEach(async () => {
    distDirectory = await mkdtemp(path.join(os.tmpdir(), 'driva-frontend-'));
    await mkdir(path.join(distDirectory, 'assets'));
    await mkdir(path.join(distDirectory, 'inventory', 'missing-car'), { recursive: true });
    await writeFile(
      path.join(distDirectory, 'index.html'),
      '<html><body><div id="root"></div></body></html>',
    );
    await writeFile(path.join(distDirectory, 'assets', 'app.js'), 'console.log("ok");');
    await writeFile(
      path.join(distDirectory, 'inventory', 'missing-car', 'index.html'),
      '<html><body>stale vehicle</body></html>',
    );

    inventoryServer = createServer((request, response) => {
      if (request.url === '/inventory/available-car') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: true }));
        return;
      }
      response.writeHead(404);
      response.end();
    });
    inventoryPort = await listen(inventoryServer);

    frontendServer = createFrontendServer({
      distDirectory,
      inventoryApiUrl: `http://127.0.0.1:${inventoryPort}/inventory`,
    });
    frontendPort = await listen(frontendServer);
  });

  afterEach(async () => {
    await close(frontendServer);
    await close(inventoryServer);
    await rm(distDirectory, { recursive: true, force: true });
  });

  it('serves a valid vehicle route with HTTP 200', async () => {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/inventory/available-car`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBeNull();
    expect(await response.text()).toContain('<div id="root"></div>');
  });

  it('returns HTTP 404 for an unavailable vehicle route', async () => {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/inventory/missing-car`);

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('<div id="root"></div>');
  });

  it('returns HTTP 404 for an unknown route', async () => {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/does-not-exist`);

    expect(response.status).toBe(404);
  });

  it('serves admin routes with a server-level noindex header', async () => {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/admin/login`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('serves built static assets without SPA fallback', async () => {
    const response = await fetch(`http://127.0.0.1:${frontendPort}/assets/app.js`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
    expect(await response.text()).toContain('console.log');
  });
});
