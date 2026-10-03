import type { AnalyticsEvent } from '@prisma/client';
import type { AnalyticsEventInput } from './analytics.schema.js';

export type AnalyticsEventRecord = Pick<
  AnalyticsEvent,
  | 'eventType'
  | 'visitorId'
  | 'sessionId'
  | 'route'
  | 'vehicleId'
  | 'vehicleSlug'
  | 'vehicleLabel'
  | 'searchTerm'
  | 'makeSlug'
  | 'fuelTypeSlug'
  | 'sort'
  | 'resultCount'
  | 'referrer'
  | 'utmSource'
  | 'utmMedium'
  | 'utmCampaign'
  | 'deviceType'
  | 'createdAt'
>;

export type CreateAnalyticsEvent = Omit<AnalyticsEventInput, 'metadata'> & {
  metadata?: AnalyticsEventInput['metadata'];
};

export interface AnalyticsDateRange {
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
}

export interface AnalyticsOverviewDto {
  range: { from: string; to: string };
  kpis: {
    visits: number;
    uniqueVisitors: number;
    returningVisitors: number;
    pageViews: number;
    searches: number;
    vehicleViews: number;
    vehicleViewSessions: number;
    enquiries: number;
    purchases: number;
    revenue: number;
    enquiryConversionRate: number;
    purchaseConversionRate: number;
    zeroResultSearches: number;
  };
  trafficTrend: Array<{
    date: string;
    label: string;
    visits: number;
    uniqueVisitors: number;
    pageViews: number;
    searches: number;
    vehicleViews: number;
    enquiries: number;
  }>;
  topPages: Array<{ label: string; value: number }>;
  topSearches: Array<{ label: string; value: number }>;
  topMakes: Array<{ label: string; value: number }>;
  zeroResultSearches: Array<{ label: string; value: number }>;
  vehiclePerformance: Array<{
    vehicleId: string;
    slug: string;
    label: string;
    views: number;
    enquiries: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  }>;
  funnel: Array<{ key: string; label: string; value: number }>;
  deviceBreakdown: Array<{ label: string; value: number }>;
  sourceBreakdown: Array<{ label: string; value: number }>;
}
