import { ValidationAppError } from '../../errors/app-error.js';
import type { AnalyticsEventInput, AnalyticsQuery } from './analytics.schema.js';
import type { AnalyticsRepository } from './analytics.repository.js';
import type {
  AnalyticsDateRange,
  AnalyticsEventRecord,
  AnalyticsOverviewDto,
} from './analytics.types.js';

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const eventSet = {
  pageViews: 'PAGE_VIEWED',
  searches: 'INVENTORY_SEARCHED',
  vehicleViews: 'VEHICLE_DETAIL_VIEWED',
  enquiries: 'ENQUIRY_SUBMITTED',
} as const;

const parseDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const formatDate = (value: Date): string => value.toISOString().slice(0, 10);

const defaultDateRange = (): AnalyticsDateRange => {
  const to = new Date();
  const start = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() - 29));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1));
  return { from: start, to: end, fromDate: formatDate(start), toDate: formatDate(to) };
};

const resolveDateRange = (query: AnalyticsQuery): AnalyticsDateRange => {
  const defaults = defaultDateRange();
  const from = query.from ? parseDate(query.from) : defaults.from;
  const toDate = query.to ? parseDate(query.to) : parseDate(defaults.toDate);
  const to = new Date(toDate.getTime() + millisecondsPerDay);
  const daySpan = Math.floor((to.getTime() - from.getTime()) / millisecondsPerDay);
  if (daySpan > 366) throw new ValidationAppError('Analytics date ranges cannot exceed 366 days.');
  return { from, to, fromDate: formatDate(from), toDate: formatDate(toDate) };
};

const increment = (map: Map<string, number>, key: string | null | undefined, amount = 1) => {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
};

const topItems = (map: Map<string, number>, limit = 8) =>
  [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));

const bucketLabel = (date: Date, bucket: 'day' | 'week' | 'month') =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    ...(bucket === 'month' ? { year: 'numeric' } : { day: 'numeric' }),
    timeZone: 'UTC',
  }).format(date);

const getBucket = (date: Date, range: AnalyticsDateRange): Date => {
  const daySpan = Math.max(
    1,
    Math.floor((range.to.getTime() - range.from.getTime()) / millisecondsPerDay),
  );
  if (daySpan > 180) return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  if (daySpan > 31) {
    const offset = Math.floor((date.getTime() - range.from.getTime()) / millisecondsPerDay / 7);
    return new Date(range.from.getTime() + Math.max(0, offset) * 7 * millisecondsPerDay);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const buildTrafficTrend = (events: AnalyticsEventRecord[], range: AnalyticsDateRange) => {
  const daySpan = Math.max(
    1,
    Math.floor((range.to.getTime() - range.from.getTime()) / millisecondsPerDay),
  );
  const bucket: 'day' | 'week' | 'month' = daySpan > 180 ? 'month' : daySpan > 31 ? 'week' : 'day';
  const buckets = new Map<
    string,
    {
      date: Date;
      visits: Set<string>;
      visitors: Set<string>;
      pageViews: number;
      searches: number;
      vehicleViews: number;
      enquiries: number;
    }
  >();
  const add = (date: Date) => {
    const key = formatDate(date);
    if (!buckets.has(key))
      buckets.set(key, {
        date,
        visits: new Set(),
        visitors: new Set(),
        pageViews: 0,
        searches: 0,
        vehicleViews: 0,
        enquiries: 0,
      });
  };

  let cursor = getBucket(range.from, range);
  const final = getBucket(new Date(range.to.getTime() - millisecondsPerDay), range);
  while (cursor <= final) {
    add(cursor);
    cursor =
      bucket === 'month'
        ? new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
        : new Date(cursor.getTime() + (bucket === 'week' ? 7 : 1) * millisecondsPerDay);
  }

  for (const event of events) {
    const date = getBucket(event.createdAt, range);
    add(date);
    const item = buckets.get(formatDate(date));
    if (!item) continue;
    if (event.eventType === 'SESSION_STARTED') item.visits.add(event.sessionId);
    item.visitors.add(event.visitorId);
    if (event.eventType === eventSet.pageViews) item.pageViews += 1;
    if (event.eventType === eventSet.searches) item.searches += 1;
    if (event.eventType === eventSet.vehicleViews) item.vehicleViews += 1;
    if (event.eventType === eventSet.enquiries) item.enquiries += 1;
  }

  return [...buckets.values()].map((item) => ({
    date: formatDate(item.date),
    label: bucketLabel(item.date, bucket),
    visits: item.visits.size,
    uniqueVisitors: item.visitors.size,
    pageViews: item.pageViews,
    searches: item.searches,
    vehicleViews: item.vehicleViews,
    enquiries: item.enquiries,
  }));
};

const buildVehiclePerformance = (
  events: AnalyticsEventRecord[],
  purchased: Array<{
    vehicleId: string | null;
    vehicleSlug: string | null;
    vehicleLabel: string;
    purchasePrice: unknown;
  }>,
) => {
  const vehicles = new Map<
    string,
    {
      vehicleId: string;
      slug: string;
      label: string;
      views: number;
      enquiries: number;
      purchases: number;
      revenue: number;
    }
  >();
  const getVehicle = (event: AnalyticsEventRecord) => {
    const key = event.vehicleId ?? event.vehicleSlug;
    if (!key) return null;
    if (!vehicles.has(key)) {
      vehicles.set(key, {
        vehicleId: event.vehicleId ?? key,
        slug: event.vehicleSlug ?? key,
        label: event.vehicleLabel ?? event.vehicleSlug ?? 'Unknown vehicle',
        views: 0,
        enquiries: 0,
        purchases: 0,
        revenue: 0,
      });
    }
    return vehicles.get(key) ?? null;
  };

  for (const event of events) {
    const vehicle = getVehicle(event);
    if (!vehicle) continue;
    if (event.eventType === eventSet.vehicleViews) vehicle.views += 1;
    if (event.eventType === eventSet.enquiries) vehicle.enquiries += 1;
  }
  for (const sale of purchased) {
    const key = sale.vehicleId ?? sale.vehicleSlug;
    if (!key) continue;
    const vehicle = vehicles.get(key) ?? {
      vehicleId: sale.vehicleId ?? key,
      slug: sale.vehicleSlug ?? key,
      label: sale.vehicleLabel,
      views: 0,
      enquiries: 0,
      purchases: 0,
      revenue: 0,
    };
    vehicle.purchases += 1;
    vehicle.revenue += Number(sale.purchasePrice ?? 0);
    vehicles.set(key, vehicle);
  }

  return [...vehicles.values()]
    .map((vehicle) => ({
      ...vehicle,
      conversionRate: vehicle.views
        ? Number(((vehicle.enquiries / vehicle.views) * 100).toFixed(1))
        : 0,
    }))
    .sort((left, right) => right.enquiries - left.enquiries || right.views - left.views)
    .slice(0, 12);
};

export class AnalyticsService {
  public constructor(private readonly repository: AnalyticsRepository) {}

  public async record(input: AnalyticsEventInput) {
    await this.repository.create(input);
  }

  public async overview(query: AnalyticsQuery): Promise<AnalyticsOverviewDto> {
    const range = resolveDateRange(query);
    const [events, purchased] = await Promise.all([
      this.repository.listEvents(range.from, range.to),
      this.repository.listPurchasedEnquiries(range.from, range.to),
    ]);
    const sessions = new Set<string>();
    const visitors = new Map<string, Set<string>>();
    const pages = new Map<string, number>();
    const searches = new Map<string, number>();
    const makes = new Map<string, number>();
    const zeroResults = new Map<string, number>();
    const devices = new Map<string, Set<string>>();
    const sources = new Map<string, Set<string>>();
    let pageViews = 0;
    let searchCount = 0;
    let vehicleViews = 0;
    const vehicleViewSessions = new Set<string>();
    let enquiries = 0;
    let zeroResultSearches = 0;

    for (const event of events) {
      if (event.eventType === 'SESSION_STARTED') sessions.add(event.sessionId);
      if (!visitors.has(event.visitorId)) visitors.set(event.visitorId, new Set());
      visitors.get(event.visitorId)?.add(event.sessionId);
      if (event.eventType === eventSet.pageViews) {
        pageViews += 1;
        increment(pages, event.route);
      }
      if (event.eventType === eventSet.searches) {
        searchCount += 1;
        increment(searches, event.searchTerm || 'All inventory');
        increment(makes, event.makeSlug || undefined);
        if (event.resultCount === 0) {
          zeroResultSearches += 1;
          increment(zeroResults, event.searchTerm || event.makeSlug || 'Filtered search');
        }
      }
      if (event.eventType === eventSet.vehicleViews) {
        vehicleViews += 1;
        vehicleViewSessions.add(event.sessionId);
      }
      if (event.eventType === eventSet.enquiries) enquiries += 1;
      if (event.eventType !== 'SESSION_STARTED') {
        const device = event.deviceType || 'unknown';
        if (!devices.has(device)) devices.set(device, new Set());
        devices.get(device)?.add(event.sessionId);
      }
      const source = event.utmSource || event.referrer || 'Direct';
      if (!sources.has(source)) sources.set(source, new Set());
      sources.get(source)?.add(event.sessionId);
    }

    const uniqueVisitors = visitors.size;
    const returningVisitors = [...visitors.values()].filter(
      (sessionsForVisitor) => sessionsForVisitor.size > 1,
    ).length;
    const revenue = purchased.reduce((sum, item) => sum + Number(item.purchasePrice ?? 0), 0);
    const purchases = purchased.length;
    const rate = (value: number, total: number) =>
      total ? Number(((value / total) * 100).toFixed(1)) : 0;

    return {
      range: { from: range.fromDate, to: range.toDate },
      kpis: {
        visits: sessions.size,
        uniqueVisitors,
        returningVisitors,
        pageViews,
        searches: searchCount,
        vehicleViews,
        vehicleViewSessions: vehicleViewSessions.size,
        enquiries,
        purchases,
        revenue,
        enquiryConversionRate: rate(enquiries, vehicleViews),
        purchaseConversionRate: rate(purchases, enquiries),
        zeroResultSearches,
      },
      trafficTrend: buildTrafficTrend(events, range),
      topPages: topItems(pages),
      topSearches: topItems(searches),
      topMakes: topItems(makes),
      zeroResultSearches: topItems(zeroResults),
      vehiclePerformance: buildVehiclePerformance(events, purchased),
      funnel: [
        { key: 'visits', label: 'Visits', value: sessions.size },
        { key: 'searches', label: 'Searches', value: searchCount },
        { key: 'vehicleViews', label: 'Vehicle views', value: vehicleViews },
        { key: 'enquiries', label: 'Enquiries', value: enquiries },
        { key: 'purchases', label: 'Purchases', value: purchases },
      ],
      deviceBreakdown: topItems(
        new Map(
          [...devices.entries()].map(([label, sessionsForDevice]) => [
            label,
            sessionsForDevice.size,
          ]),
        ),
      ),
      sourceBreakdown: topItems(
        new Map(
          [...sources.entries()].map(([label, sessionsForSource]) => [
            label,
            sessionsForSource.size,
          ]),
        ),
      ),
    };
  }
}
