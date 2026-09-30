import { z } from 'zod';

const developmentApiBaseUrl = 'http://127.0.0.1:8000/api/v1';
const developmentSiteUrl = 'http://127.0.0.1:5173';
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.MODE === 'production' ? undefined : developmentApiBaseUrl);
const siteUrl =
  import.meta.env.VITE_SITE_URL ??
  (typeof window === 'undefined' ? developmentSiteUrl : window.location.origin);

const environment = z
  .object({
    VITE_API_BASE_URL: z
      .string({ error: 'VITE_API_BASE_URL is required for production builds.' })
      .url('VITE_API_BASE_URL must be a valid URL.'),
    VITE_SITE_URL: z.string().url('VITE_SITE_URL must be a valid URL.'),
  })
  .parse({ VITE_API_BASE_URL: apiBaseUrl, VITE_SITE_URL: siteUrl });

export const frontendEnvironment = environment;
