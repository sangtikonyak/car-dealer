import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { frontendEnvironment } from '../config/env';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';

const getCanonicalUrl = (siteUrl: string, pathname: string, search: string): string => {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/u, '');
  return new URL(`${pathname}${search}`, `${normalizedSiteUrl}/`).toString();
};

const getMediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

const getBrandMarkUrl = (brandMark: string, brandName: string): string => {
  if (brandMark.startsWith('/uploads/')) return `${getMediaOrigin()}${brandMark}`;
  if (brandMark.startsWith('http://') || brandMark.startsWith('https://')) return brandMark;

  const fallbackLabel = (brandMark || brandName.charAt(0) || 'D').slice(0, 2);
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#111827"/><text x="32" y="43" fill="#ffffff" font-family="Arial,sans-serif" font-size="30" font-weight="700" text-anchor="middle">${fallbackLabel}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(fallbackSvg)}`;
};

export function DocumentMetadata() {
  const location = useLocation();
  const { data } = useHomepageContent();

  useEffect(() => {
    const pageTitle = data.site.title;
    const canonicalUrl = getCanonicalUrl(
      frontendEnvironment.VITE_SITE_URL,
      location.pathname,
      location.search,
    );
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;
    document.title = pageTitle;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = getBrandMarkUrl(data.site.brandMark, data.site.brandName);
    document
      .querySelector<HTMLMetaElement>('meta[property="og:url"]')
      ?.setAttribute('content', canonicalUrl);
    document
      .querySelector<HTMLMetaElement>('meta[property="og:site_name"]')
      ?.setAttribute('content', data.site.brandName);
    document
      .querySelector<HTMLMetaElement>('meta[property="og:title"]')
      ?.setAttribute('content', pageTitle);
    document
      .querySelector<HTMLMetaElement>('meta[name="twitter:title"]')
      ?.setAttribute('content', pageTitle);
  }, [
    data.site.brandMark,
    data.site.brandName,
    data.site.title,
    location.pathname,
    location.search,
  ]);

  return null;
}
