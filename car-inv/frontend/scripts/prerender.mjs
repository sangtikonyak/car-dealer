import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(frontendDirectory, 'dist');
const serverBundlePath = path.join(frontendDirectory, 'dist-server', 'entry-server.js');
const developmentSiteUrl = 'http://127.0.0.1:5173';
const developmentApiUrl = 'http://127.0.0.1:8000/api/v1';

const readEnvValueFromFiles = async (key) => {
  for (const fileName of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    try {
      const contents = await readFile(path.join(frontendDirectory, fileName), 'utf8');
      const match = contents.match(new RegExp(`^${key}=(.+)$`, 'mu'));
      if (match?.[1]?.trim()) return match[1].trim();
    } catch {
      // An absent optional environment file is expected during local builds.
    }
  }
  return undefined;
};

const siteUrl = (
  process.env.VITE_SITE_URL ??
  (await readEnvValueFromFiles('VITE_SITE_URL')) ??
  developmentSiteUrl
).replace(/\/+$/u, '');
const apiUrl = (
  process.env.VITE_API_BASE_URL ??
  (await readEnvValueFromFiles('VITE_API_BASE_URL')) ??
  developmentApiUrl
).replace(/\/+$/u, '');

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const escapeJsonForHtml = (value) =>
  JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');

const fetchPublishedVehicleSlugs = async () => {
  const slugs = [];
  let page = 1;
  let totalPages = 1;

  try {
    while (page <= totalPages) {
      const response = await fetch(`${apiUrl}/inventory?page=${page}&pageSize=100&sort=latest`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Inventory API returned HTTP ${response.status}.`);

      const payload = await response.json();
      const inventory = payload?.data;
      if (!inventory || !Array.isArray(inventory.items)) {
        throw new Error('Inventory API returned an unexpected response.');
      }

      for (const vehicle of inventory.items) {
        if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(vehicle.slug ?? '')) slugs.push(vehicle.slug);
      }

      totalPages = Number.isInteger(inventory.totalPages) ? inventory.totalPages : page;
      page += 1;
    }
  } catch (error) {
    console.warn(
      `Could not load published inventory for prerendering from ${apiUrl}. Static pages will still be generated.`,
      error,
    );
  }

  return slugs;
};

const replaceMetaTag = (html, selector, replacement) => {
  const pattern = new RegExp(`<meta\\s+${selector}[^>]*>`, 'u');
  return html.replace(pattern, replacement);
};

const applyMetadata = (html, route, result) => {
  const canonicalUrl = new URL(route, `${siteUrl}/`).toString();
  const { metadata } = result;
  let document = html.replace(
    /<title>[\s\S]*?<\/title>/u,
    `<title>${escapeHtml(metadata.title)}</title>`,
  );
  document = replaceMetaTag(
    document,
    'name="description"',
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
  );
  document = replaceMetaTag(
    document,
    'name="robots"',
    `<meta name="robots" content="${metadata.noIndex ? 'noindex,nofollow' : 'index,follow'}" />`,
  );
  document = replaceMetaTag(
    document,
    'property="og:url"',
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  document = replaceMetaTag(
    document,
    'property="og:type"',
    `<meta property="og:type" content="${escapeHtml(metadata.type)}" />`,
  );
  document = replaceMetaTag(
    document,
    'property="og:title"',
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
  );
  document = replaceMetaTag(
    document,
    'property="og:description"',
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
  );
  document = replaceMetaTag(
    document,
    'property="og:image"',
    `<meta property="og:image" content="${escapeHtml(result.imageUrl)}" />`,
  );
  document = replaceMetaTag(
    document,
    'name="twitter:title"',
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
  );
  document = replaceMetaTag(
    document,
    'name="twitter:description"',
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
  );
  document = replaceMetaTag(
    document,
    'name="twitter:image"',
    `<meta name="twitter:image" content="${escapeHtml(result.imageUrl)}" />`,
  );
  document = replaceMetaTag(
    document,
    'name="twitter:url"',
    `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`,
  );

  document = document.replace(/\s*<link rel="canonical"[^>]*>/u, '');
  document = document.replace(
    /<\/head>/u,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n</head>`,
  );
  document = document.replace(/\s*<script data-seo-json-ld[^>]*>[\s\S]*?<\/script>/u, '');
  if (result.jsonLd) {
    document = document.replace(
      /<\/head>/u,
      `<script type="application/ld+json" data-seo-json-ld>${escapeJsonForHtml(result.jsonLd)}</script>\n</head>`,
    );
  }

  return document;
};

const renderRoute = async (renderPage, template, route) => {
  const result = await renderPage(route);
  if (result.metadata.noIndex) return false;

  const document = applyMetadata(
    template.replace('<div id="root"></div>', `<div id="root">${result.markup}</div>`),
    route,
    result,
  );
  const routeDirectory =
    route === '/' ? outputDirectory : path.join(outputDirectory, ...route.slice(1).split('/'));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, 'index.html'), document, 'utf8');
  return true;
};

const template = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
const { renderPage } = await import(pathToFileURL(serverBundlePath).href);
const routes = ['/', '/inventory', '/terms', '/privacy'];
const vehicleSlugs = await fetchPublishedVehicleSlugs();
routes.push(...vehicleSlugs.map((slug) => `/inventory/${slug}`));

for (const route of routes) {
  try {
    await renderRoute(renderPage, template, route);
  } catch (error) {
    throw new Error(`Could not prerender ${route}.`, { cause: error });
  }
}

console.log(`Prerendered ${routes.length} public routes.`);
