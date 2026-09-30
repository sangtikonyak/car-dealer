import { afterEach, describe, expect, it, vi } from 'vitest';
import { frontendEnvironment } from '../../config/env';
import { apiClient } from '../../lib/apiClient';
import { homepageDefaults } from './homepageDefaults';
import { fetchHomepageContent } from './api';

describe('homepage API boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes backend upload URLs for browser rendering', async () => {
    const content = {
      ...homepageDefaults,
      site: { ...homepageDefaults.site, brandMark: '/uploads/logo.webp' },
      hero: { ...homepageDefaults.hero, imageUrl: '/uploads/hero.webp' },
      about: {
        ...homepageDefaults.about,
        preview: { ...homepageDefaults.about.preview, imageUrl: '/uploads/about.webp' },
      },
    };
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: content } });

    const result = await fetchHomepageContent();
    const mediaOrigin = new URL(frontendEnvironment.VITE_API_BASE_URL).origin;

    expect(result.site.brandMark).toBe(`${mediaOrigin}/uploads/logo.webp`);
    expect(result.hero.imageUrl).toBe(`${mediaOrigin}/uploads/hero.webp`);
    expect(result.about.preview.imageUrl).toBe(`${mediaOrigin}/uploads/about.webp`);
  });

  it('returns the safe static defaults when the API is unavailable', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API unavailable'));

    await expect(fetchHomepageContent()).resolves.toEqual(homepageDefaults);
  });
});
