import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { frontendEnvironment } from './config/env';
import { getAbsoluteUrl, getJsonLd, getPageMetadata } from './app/DocumentMetadata';
import { routeObjects } from './app/routeObjects';
import { fetchHomepageContent } from './features/homepage/api';
import { fetchInventory, fetchInventoryOptions, fetchVehicle } from './features/inventory/api';
import type { HomepageContent } from './features/homepage/types';
import type { Vehicle } from './types/vehicle';

const getVehicleSlug = (pathname: string): string | undefined => {
  const match = pathname.match(/^\/inventory\/([^/]+)$/u);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const getQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

const setHomepageContent = async (queryClient: QueryClient): Promise<HomepageContent> => {
  const content = await fetchHomepageContent();
  queryClient.setQueryData(['homepage-content'], content);
  return content;
};

const seedInventoryQueries = async (queryClient: QueryClient, pathname: string): Promise<void> => {
  if (pathname === '/') {
    try {
      const latest = await fetchInventory({ sort: 'latest', page: 1, pageSize: 6 });
      queryClient.setQueryData(['inventory', 'latest', 6], latest);
    } catch {
      // The homepage keeps its existing API fallback UI when inventory is unavailable.
    }
    return;
  }

  if (pathname !== '/inventory') return;

  try {
    const [options, inventory] = await Promise.all([
      fetchInventoryOptions(),
      fetchInventory({
        search: '',
        make: 'all',
        fuelType: 'all',
        sort: 'featured',
        page: 1,
        pageSize: 12,
      }),
    ]);
    queryClient.setQueryData(['inventory-options'], options);
    queryClient.setQueryData(['inventory', '', 'all', 'all', 'featured', 1], inventory);
  } catch {
    // The inventory page still renders its heading and client-side error state after hydration.
  }
};

export interface ServerRenderResult {
  markup: string;
  metadata: ReturnType<typeof getPageMetadata>;
  jsonLd: Record<string, unknown> | null;
  imageUrl: string;
}

export const renderPage = async (url: string): Promise<ServerRenderResult> => {
  const requestUrl = new URL(url, frontendEnvironment.VITE_SITE_URL);
  const queryClient = getQueryClient();
  const homepageContent = await setHomepageContent(queryClient);
  await seedInventoryQueries(queryClient, requestUrl.pathname);

  const vehicleSlug = getVehicleSlug(requestUrl.pathname);
  let vehicle: Vehicle | undefined;
  let vehicleError = false;
  if (vehicleSlug) {
    try {
      vehicle = await fetchVehicle(vehicleSlug);
      queryClient.setQueryData(['vehicle', vehicleSlug], vehicle);
    } catch {
      vehicleError = true;
    }
  }

  const router = createMemoryRouter(routeObjects, {
    initialEntries: [`${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`],
  });
  const markup = renderToString(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const metadata = getPageMetadata(requestUrl.pathname, homepageContent, vehicle, vehicleError);

  return {
    markup,
    metadata,
    jsonLd: metadata.noIndex
      ? null
      : getJsonLd(requestUrl.pathname, homepageContent, vehicle, frontendEnvironment.VITE_SITE_URL),
    imageUrl: getAbsoluteUrl(metadata.image, frontendEnvironment.VITE_SITE_URL),
  };
};
