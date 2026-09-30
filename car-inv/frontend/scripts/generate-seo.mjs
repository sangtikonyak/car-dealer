import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(frontendDirectory, 'dist');
const developmentSiteUrl = 'http://127.0.0.1:5173';

const readSiteUrlFromEnvFiles = async () => {
  for (const fileName of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    try {
      const contents = await readFile(path.join(frontendDirectory, fileName), 'utf8');
      const match = contents.match(/^VITE_SITE_URL=(.+)$/mu);
      if (match?.[1]?.trim()) return match[1].trim();
    } catch {
      // An absent optional environment file is expected during local builds.
    }
  }
  return undefined;
};

const siteUrl = (
  process.env.VITE_SITE_URL ??
  (await readSiteUrlFromEnvFiles()) ??
  developmentSiteUrl
).replace(/\/+$/u, '');

try {
  new URL(siteUrl);
} catch {
  throw new Error('VITE_SITE_URL must be a valid absolute URL.');
}

const publicRoutes = ['/', '/inventory', '/terms', '/privacy'];
const sitemapEntries = publicRoutes
  .map((route) => `  <url>\n    <loc>${siteUrl}${route}</loc>\n  </url>`)
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(outputDirectory, 'robots.txt'), robots, 'utf8'),
]);
