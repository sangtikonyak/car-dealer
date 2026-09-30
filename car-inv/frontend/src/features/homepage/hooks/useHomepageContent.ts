import { useQuery } from '@tanstack/react-query';
import { fetchHomepageContent } from '../api';
import { homepageDefaults } from '../homepageDefaults';
import type { HomepageContent } from '../types';

export const useHomepageContent = (previewContent?: HomepageContent) =>
  useQuery({
    queryKey: previewContent === undefined ? ['homepage-content'] : ['homepage-content-preview'],
    queryFn: fetchHomepageContent,
    initialData: previewContent ?? homepageDefaults,
    initialDataUpdatedAt: 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: previewContent === undefined && import.meta.env.MODE !== 'test',
  });
