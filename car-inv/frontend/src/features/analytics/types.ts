export interface AnalyticsOverview {
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

export type AnalyticsEventType =
  | 'SESSION_STARTED'
  | 'PAGE_VIEWED'
  | 'INVENTORY_SEARCHED'
  | 'VEHICLE_DETAIL_VIEWED'
  | 'ENQUIRY_STARTED'
  | 'ENQUIRY_SUBMITTED';

export interface AnalyticsEventPayload {
  eventType: AnalyticsEventType;
  route: string;
  vehicleId?: string;
  vehicleSlug?: string;
  vehicleLabel?: string;
  searchTerm?: string;
  makeSlug?: string;
  fuelTypeSlug?: string;
  sort?: string;
  resultCount?: number;
}

export interface AnalyticsEventRequest extends AnalyticsEventPayload {
  visitorId: string;
  sessionId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
