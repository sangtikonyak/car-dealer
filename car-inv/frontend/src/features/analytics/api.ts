import { apiClient } from '../../lib/apiClient';
import type { AnalyticsEventRequest, AnalyticsOverview } from './types';

interface ApiSuccess<T> {
  data: T;
}

export const fetchAnalyticsOverview = async (params: {
  from: string;
  to: string;
}): Promise<AnalyticsOverview> => {
  const response = await apiClient.get<ApiSuccess<AnalyticsOverview>>('/admin/analytics/overview', {
    params,
  });
  return response.data.data;
};

export const sendAnalyticsEvent = async (payload: AnalyticsEventRequest): Promise<void> => {
  await apiClient.post('/analytics/events', payload);
};
