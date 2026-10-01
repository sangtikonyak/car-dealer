import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultDistDirectory = path.join(frontendDirectory, 'dist');
const defaultInventoryApiUrl = `http://127.0.0.1:${process.env.DRIVA_API_PORT ?? '3001'}/api/v1`;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const trimTrailingSlashes = (value) => value.replace(/\/+$/u, '');

const isPathInsideDirectory = (directory, candidate) => {
  const relative = path.relative(directory, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const getSafeFilePath = (distDirectory, pathname) => {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const candidate = path.resolve(distDirectory, `.${decodedPathname}`);
  return isPathInsideDirectory(distDirectory, candidate) ? candidate : null;
};

const parseRequestUrl = (request) => {
  try {
    return new URL(request.url ?? '/', 'http://frontend.local');
  } catch {
    return null;
  }
};

const isAdminPath = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/');

const isKnownSpaPath = (pathname) =>
  pathname === '/' ||
  pathname === '/inventory' ||
  pathname === '/inventory/' ||
  pathname === '/terms' ||
  pathname === '/privacy' ||
  isAdminPath(pathname);

const getVehicleSlug = (pathname) => {
  const match = pathname.match(/^\/inventory\/([^/]+)$/u);
  return match?.[1] ?? null;
};

const isValidVehicleSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug);

const getStaticHeaders = (contentType, contentLength) => ({
  'Cache-Control': 'public, max-age=3600',
  'Content-Length': contentLength,
  'Content-Type': contentType,
  'X-Content-Type-Options': 'nosniff',
});

const getDocumentHeaders = (statusCode, noIndex = false) => ({
  'Cache-Control': 'no-store',
  'Content-Type': 'text/html; charset=utf-8',
  ...(noIndex ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
  'X-Content-Type-Options': 'nosniff',
  ...(statusCode >= 500 ? { 'Retry-After': '60' } : {}),
});

const sendBody = (request, response, statusCode, headers, body) => {
  response.writeHead(statusCode, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  response.end(body);
};

const sendStaticFile = async (request, response, filePath) => {
  const fileInfo = await stat(filePath);
  if (!fileInfo.isFile()) return false;

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(
    200,
    getStaticHeaders(contentTypes[extension] ?? 'application/octet-stream', fileInfo.size),
  );
  if (request.method === 'HEAD') {
    response.end();
    return true;
  }

  createReadStream(filePath).pipe(response);
  return true;
};

const checkVehicleAvailability = async (inventoryApiUrl, slug) => {
  try {
    const response = await fetch(
      `${trimTrailingSlashes(inventoryApiUrl)}/${encodeURIComponent(slug)}`,
      {
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (response.status === 404) return false;
    if (!response.ok) return null;
    return true;
  } catch {
    return null;
  }
};

export const createFrontendServer = ({
  distDirectory = defaultDistDirectory,
  inventoryApiUrl = process.env.DRIVA_INVENTORY_API_URL ?? defaultInventoryApiUrl,
} = {}) => {
  const indexPath = path.join(distDirectory, 'index.html');

  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendBody(request, response, 405, { Allow: 'GET, HEAD' }, 'Method not allowed.');
      return;
    }

    const requestUrl = parseRequestUrl(request);
    if (!requestUrl) {
      sendBody(
        request,
        response,
        400,
        { 'Content-Type': 'text/plain; charset=utf-8' },
        'Bad request.',
      );
      return;
    }

    const vehicleSlug = getVehicleSlug(requestUrl.pathname);
    const validVehicleRoute = Boolean(vehicleSlug && isValidVehicleSlug(vehicleSlug));
    const vehicleAvailability = validVehicleRoute
      ? await checkVehicleAvailability(inventoryApiUrl, vehicleSlug)
      : undefined;
    const filePath = getSafeFilePath(distDirectory, requestUrl.pathname);
    if (filePath) {
      try {
        const mayServeStaticRoute = !validVehicleRoute || vehicleAvailability === true;
        if (mayServeStaticRoute && (await sendStaticFile(request, response, filePath))) return;
        if (
          mayServeStaticRoute &&
          (await sendStaticFile(request, response, path.join(filePath, 'index.html')))
        )
          return;
      } catch (error) {
        if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error;
      }
    }

    let statusCode = 404;
    let noIndex = false;

    if (isKnownSpaPath(requestUrl.pathname)) {
      statusCode = 200;
      noIndex = isAdminPath(requestUrl.pathname);
    } else {
      if (validVehicleRoute && vehicleAvailability === true) statusCode = 200;
      if (validVehicleRoute && vehicleAvailability === null) statusCode = 503;
    }

    let indexHtml;
    try {
      indexHtml = await readFile(indexPath);
    } catch {
      sendBody(request, response, 500, getDocumentHeaders(500), 'Frontend build is unavailable.');
      return;
    }

    sendBody(request, response, statusCode, getDocumentHeaders(statusCode, noIndex), indexHtml);
  });
};

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? '8083');
  const server = createFrontendServer();

  server.listen(port, host, () => {
    console.log(`Frontend server listening on http://${host}:${port}`);
  });
}
