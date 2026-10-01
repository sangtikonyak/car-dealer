import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(frontendDirectory, 'dist');
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

try {
  new URL(siteUrl);
} catch {
  throw new Error('VITE_SITE_URL must be a valid absolute URL.');
}

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const fetchPublishedVehicleUrls = async () => {
  const urls = [];
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
        if (typeof vehicle.slug !== 'string' || vehicle.slug.length === 0) continue;
        urls.push({
          loc: `${siteUrl}/inventory/${encodeURIComponent(vehicle.slug)}`,
          lastmod: typeof vehicle.updatedAt === 'string' ? vehicle.updatedAt : undefined,
        });
      }

      totalPages = Number.isInteger(inventory.totalPages) ? inventory.totalPages : page;
      page += 1;
    }
  } catch (error) {
    console.warn(
      `Could not load published inventory for the sitemap from ${apiUrl}. Static routes will still be generated.`,
      error,
    );
  }

  return urls;
};

const publicRoutes = ['/', '/inventory', '/terms', '/privacy'].map((route) => ({
  loc: `${siteUrl}${route}`,
}));
const vehicleRoutes = await fetchPublishedVehicleUrls();
const sitemapEntries = [...publicRoutes, ...vehicleRoutes]
  .map(({ loc, lastmod }) => {
    const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(outputDirectory, 'robots.txt'), robots, 'utf8'),
]);
