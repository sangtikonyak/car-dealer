import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { frontendEnvironment } from '../config/env';
import { fetchVehicle } from '../features/inventory/api';
import { useHomepageContent } from '../features/homepage/hooks/useHomepageContent';
import { homepageDefaults } from '../features/homepage/homepageDefaults';
import type { HomepageContent } from '../features/homepage/types';
import type { Vehicle } from '../types/vehicle';

const getCanonicalUrl = (siteUrl: string, pathname: string): string => {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/u, '');
  return new URL(pathname, `${normalizedSiteUrl}/`).toString();
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

export const getAbsoluteUrl = (value: string, siteUrl: string): string => {
  if (value.startsWith('/uploads/')) return `${getMediaOrigin()}${value}`;
  return new URL(value, `${siteUrl.replace(/\/+$/u, '')}/`).toString();
};

const setMetaContent = (selector: string, content: string): void => {
  const meta = document.querySelector<HTMLMetaElement>(selector);
  meta?.setAttribute('content', content);
};

const upsertJsonLd = (value: Record<string, unknown> | null): void => {
  const existing = document.querySelector<HTMLScriptElement>('script[data-seo-json-ld]');
  if (!value) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seoJsonLd = 'true';
  script.textContent = JSON.stringify(value);
  if (!existing) document.head.appendChild(script);
};

const getVehicleSlug = (pathname: string): string | undefined => {
  const match = pathname.match(/^\/inventory\/([^/]+)$/u);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const isPublicRoute = (pathname: string): boolean =>
  pathname === '/' ||
  pathname === '/inventory' ||
  pathname === '/terms' ||
  pathname === '/privacy' ||
  /^\/inventory\/[^/]+$/u.test(pathname);

export const getPageMetadata = (
  pathname: string,
  content: HomepageContent,
  vehicle: Vehicle | undefined,
  vehicleError: boolean,
): {
  title: string;
  description: string;
  image: string;
  type: string;
  noIndex: boolean;
} => {
  const brandName = content.site.brandName;
  const location = content.showroom.mapArea;
  const vehicleRoute = /^\/inventory\/[^/]+$/u.test(pathname);

  if (pathname.startsWith('/admin')) {
    return {
      title: `Admin | ${brandName}`,
      description: 'Private administration area.',
      image: content.hero.imageUrl,
      type: 'website',
      noIndex: true,
    };
  }

  if (vehicleRoute && vehicle) {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
    return {
      title: `${vehicleName} for sale | ${brandName}`,
      description: vehicle.description,
      image: vehicle.photos[0]?.src ?? content.hero.imageUrl,
      type: 'product',
      noIndex: false,
    };
  }

  if (vehicleRoute && vehicleError) {
    return {
      title: `Vehicle not found | ${brandName}`,
      description: 'The requested vehicle listing could not be found.',
      image: content.hero.imageUrl,
      type: 'website',
      noIndex: true,
    };
  }

  if (pathname === '/inventory') {
    return {
      title: `Used cars for sale in ${location} | ${brandName}`,
      description: `Browse inspected pre-owned cars available from ${brandName} in ${location}. Review pricing, mileage, photos and vehicle details.`,
      image: content.hero.imageUrl,
      type: 'website',
      noIndex: false,
    };
  }

  if (pathname === '/terms') {
    return {
      title: `Terms and conditions | ${brandName}`,
      description: `Read the terms and conditions for using the ${brandName} website and browsing vehicle listings.`,
      image: content.hero.imageUrl,
      type: 'article',
      noIndex: false,
    };
  }

  if (pathname === '/privacy') {
    return {
      title: `Privacy policy | ${brandName}`,
      description: `Read the ${brandName} privacy policy and learn how personal information is collected and used.`,
      image: content.hero.imageUrl,
      type: 'article',
      noIndex: false,
    };
  }

  if (!isPublicRoute(pathname)) {
    return {
      title: `Page not found | ${brandName}`,
      description: 'The requested page could not be found.',
      image: content.hero.imageUrl,
      type: 'website',
      noIndex: true,
    };
  }

  return {
    title: content.site.title,
    description: `${content.hero.description} Visit ${brandName} in ${location} to browse inspected pre-owned vehicles.`,
    image: content.hero.imageUrl,
    type: 'website',
    noIndex: false,
  };
};

export const getJsonLd = (
  pathname: string,
  content: HomepageContent,
  vehicle: Vehicle | undefined,
  siteUrl: string,
): Record<string, unknown> | null => {
  const organization = {
    '@type': 'AutoDealer',
    '@id': `${siteUrl}#dealer`,
    name: content.site.brandName,
    url: siteUrl,
    telephone: content.showroom.phone,
    image: getAbsoluteUrl(content.hero.imageUrl, siteUrl),
    address: {
      '@type': 'PostalAddress',
      streetAddress: content.showroom.location,
      addressLocality: content.showroom.mapArea,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: content.showroom.latitude,
      longitude: content.showroom.longitude,
    },
  };

  if (pathname === '/') {
    const faq = content.faqs.length
      ? {
          '@type': 'FAQPage',
          mainEntity: content.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;
    return { '@context': 'https://schema.org', '@graph': [organization, ...(faq ? [faq] : [])] };
  }

  if (vehicle) {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Inventory', item: `${siteUrl}/inventory` },
            { '@type': 'ListItem', position: 3, name: vehicleName },
          ],
        },
        {
          '@type': 'Product',
          name: vehicleName,
          description: vehicle.description,
          sku: vehicle.vin,
          image: vehicle.photos.map((photo) => getAbsoluteUrl(photo.src, siteUrl)),
          brand: { '@type': 'Brand', name: vehicle.make },
          offers: {
            '@type': 'Offer',
            price: vehicle.price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${siteUrl}/inventory/${vehicle.slug}`,
          },
        },
      ],
    };
  }

  return null;
};

export function DocumentMetadata() {
  const location = useLocation();
  const { data } = useHomepageContent();
  const vehicleSlug = getVehicleSlug(location.pathname);
  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleSlug],
    queryFn: () => fetchVehicle(vehicleSlug ?? ''),
    enabled: Boolean(vehicleSlug),
    retry: false,
  });
  const content: HomepageContent = {
    ...homepageDefaults,
    ...data,
    site: { ...homepageDefaults.site, ...data.site },
  };

  useEffect(() => {
    const metadata = getPageMetadata(
      location.pathname,
      content,
      vehicleQuery.data,
      vehicleQuery.isError,
    );
    const canonicalUrl = getCanonicalUrl(frontendEnvironment.VITE_SITE_URL, location.pathname);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;
    document.title = metadata.title;
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = getBrandMarkUrl(content.site.brandMark, content.site.brandName);
    setMetaContent('meta[name="description"]', metadata.description);
    setMetaContent('meta[name="robots"]', metadata.noIndex ? 'noindex,nofollow' : 'index,follow');
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:site_name"]', content.site.brandName);
    setMetaContent('meta[property="og:type"]', metadata.type);
    setMetaContent('meta[property="og:title"]', metadata.title);
    setMetaContent('meta[property="og:description"]', metadata.description);
    setMetaContent(
      'meta[property="og:image"]',
      getAbsoluteUrl(metadata.image, frontendEnvironment.VITE_SITE_URL),
    );
    setMetaContent('meta[name="twitter:title"]', metadata.title);
    setMetaContent('meta[name="twitter:description"]', metadata.description);
    setMetaContent(
      'meta[name="twitter:image"]',
      getAbsoluteUrl(metadata.image, frontendEnvironment.VITE_SITE_URL),
    );
    setMetaContent('meta[name="twitter:url"]', canonicalUrl);
    upsertJsonLd(
      metadata.noIndex
        ? null
        : getJsonLd(
            location.pathname,
            content,
            vehicleQuery.data,
            frontendEnvironment.VITE_SITE_URL,
          ),
    );
  }, [content, location.pathname, vehicleQuery.data, vehicleQuery.isError]);

  return null;
}
