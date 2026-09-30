import { apiClient } from '../../lib/apiClient';
import { frontendEnvironment } from '../../config/env';
import { homepageDefaults } from './homepageDefaults';
import type { HomepageContent } from './types';

interface ApiSuccess<T> {
  data: T;
}

const resolveMediaUrl = (value: string): string => {
  if (!value.startsWith('/uploads/')) return value;
  return new URL(value, frontendMediaOrigin()).toString();
};

const frontendMediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

const normalizeMediaUrls = (content: HomepageContent): HomepageContent => ({
  ...content,
  site: { ...content.site, brandMark: resolveMediaUrl(content.site.brandMark) },
  hero: { ...content.hero, imageUrl: resolveMediaUrl(content.hero.imageUrl) },
  about: {
    ...content.about,
    preview: {
      ...content.about.preview,
      imageUrl: resolveMediaUrl(content.about.preview.imageUrl),
    },
  },
});

export const fetchHomepageContent = async (): Promise<HomepageContent> => {
  try {
    const response = await apiClient.get<ApiSuccess<HomepageContent>>('/homepage');
    return normalizeMediaUrls(response.data.data);
  } catch {
    return homepageDefaults;
  }
};
