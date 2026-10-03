import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { buildDatabaseUrl } from '../../src/config/database-url.js';
import { parseEnvironment } from '../../src/config/env.js';

interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  data: T;
}

interface Overview {
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
    enquiryConversionRate: number;
    zeroResultSearches: number;
  };
  trafficTrend: Array<{
    date: string;
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
    conversionRate: number;
  }>;
  funnel: Array<{ key: string; value: number }>;
  deviceBreakdown: Array<{ label: string; value: number }>;
  sourceBreakdown: Array<{ label: string; value: number }>;
}

const environment = parseEnvironment(process.env);
const prisma = new PrismaClient({ datasourceUrl: buildDatabaseUrl(environment) });
const api = request(createApp({ environment, prisma }));
const adminHeaders = { 'x-admin-api-key': environment.ADMIN_API_KEY };
const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
const visitorId = `e2e-visitor-${suffix}`;
const firstSessionId = `e2e-session-a-${suffix}`;
const secondSessionId = `e2e-session-b-${suffix}`;
const vehicleId = `e2e-vehicle-${suffix}`;
const vehicleSlug = `e2e-car-${suffix}`;
const vehicleLabel = `E2E Test Car ${suffix}`;
const searchTerm = `e2e-search-${suffix}`;
const makeSlug = `e2e-make-${suffix}`;
const route = `/e2e-analytics/${suffix}`;
const today = new Date().toISOString().slice(0, 10);
const overlongRangeStart = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const readOverview = async (from = today, to = today): Promise<Overview> => {
  const response = await api
    .get('/api/v1/admin/analytics/overview')
    .set(adminHeaders)
    .query({ from, to })
    .expect(200);
  return (response.body as ApiSuccess<Overview>).data;
};

const valueFor = (items: Array<{ label: string; value: number }>, label: string): number =>
  items.find((item) => item.label === label)?.value ?? 0;

describe('analytics end-to-end', () => {
  beforeAll(async () => prisma.$connect());

  // Analytics events are intentionally retained so the E2E activity remains visible in reports.
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tracks visitor activity end to end and aggregates every dashboard view', async () => {
    const before = await readOverview();

    const events = [
      {
        eventType: 'SESSION_STARTED',
        visitorId,
        sessionId: firstSessionId,
        route,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      {
        eventType: 'PAGE_VIEWED',
        visitorId,
        sessionId: firstSessionId,
        route,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      {
        eventType: 'INVENTORY_SEARCHED',
        visitorId,
        sessionId: firstSessionId,
        route: '/inventory',
        searchTerm,
        makeSlug,
        resultCount: 0,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      {
        eventType: 'INVENTORY_SEARCHED',
        visitorId,
        sessionId: firstSessionId,
        route: '/inventory',
        searchTerm,
        makeSlug,
        resultCount: 2,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      ...[1, 2].map(() => ({
        eventType: 'VEHICLE_DETAIL_VIEWED',
        visitorId,
        sessionId: firstSessionId,
        route: `/inventory/${vehicleSlug}`,
        vehicleId,
        vehicleSlug,
        vehicleLabel,
        deviceType: 'desktop',
        utmSource: 'google',
      })),
      {
        eventType: 'ENQUIRY_STARTED',
        visitorId,
        sessionId: firstSessionId,
        route: `/inventory/${vehicleSlug}`,
        vehicleId,
        vehicleSlug,
        vehicleLabel,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      {
        eventType: 'ENQUIRY_SUBMITTED',
        visitorId,
        sessionId: firstSessionId,
        route: `/inventory/${vehicleSlug}`,
        vehicleId,
        vehicleSlug,
        vehicleLabel,
        deviceType: 'desktop',
        utmSource: 'google',
      },
      {
        eventType: 'SESSION_STARTED',
        visitorId,
        sessionId: secondSessionId,
        route,
        deviceType: 'mobile',
      },
      {
        eventType: 'PAGE_VIEWED',
        visitorId,
        sessionId: secondSessionId,
        route,
        deviceType: 'mobile',
      },
    ];

    for (const event of events) {
      await api.post('/api/v1/analytics/events').send(event).expect(202);
    }

    const after = await readOverview();
    expect(after.kpis.visits - before.kpis.visits).toBe(2);
    expect(after.kpis.uniqueVisitors - before.kpis.uniqueVisitors).toBe(1);
    expect(after.kpis.returningVisitors - before.kpis.returningVisitors).toBe(1);
    expect(after.kpis.pageViews - before.kpis.pageViews).toBe(2);
    expect(after.kpis.searches - before.kpis.searches).toBe(2);
    expect(after.kpis.vehicleViews - before.kpis.vehicleViews).toBe(2);
    expect(after.kpis.vehicleViewSessions - before.kpis.vehicleViewSessions).toBe(1);
    expect(after.kpis.enquiries - before.kpis.enquiries).toBe(1);
    expect(after.kpis.zeroResultSearches - before.kpis.zeroResultSearches).toBe(1);
    expect(after.kpis.enquiryConversionRate).toBeGreaterThan(0);

    expect(after.topPages).toContainEqual({ label: route, value: 2 });
    expect(after.topSearches).toContainEqual({ label: searchTerm, value: 2 });
    expect(after.topMakes).toContainEqual({ label: makeSlug, value: 2 });
    expect(after.zeroResultSearches).toContainEqual({ label: searchTerm, value: 1 });
    expect(after.vehiclePerformance).toContainEqual(
      expect.objectContaining({
        vehicleId,
        slug: vehicleSlug,
        label: vehicleLabel,
        views: 2,
        enquiries: 1,
        conversionRate: 50,
      }),
    );
    expect(after.funnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'visits', value: before.kpis.visits + 2 }),
        expect.objectContaining({ key: 'searches', value: before.kpis.searches + 2 }),
        expect.objectContaining({ key: 'vehicleViews', value: before.kpis.vehicleViews + 2 }),
        expect.objectContaining({ key: 'enquiries', value: before.kpis.enquiries + 1 }),
      ]),
    );
    expect(
      valueFor(after.sourceBreakdown, 'google') - valueFor(before.sourceBreakdown, 'google'),
    ).toBe(1);
    expect(
      valueFor(after.sourceBreakdown, 'Direct') - valueFor(before.sourceBreakdown, 'Direct'),
    ).toBe(1);
    expect(
      valueFor(after.deviceBreakdown, 'desktop') - valueFor(before.deviceBreakdown, 'desktop'),
    ).toBe(1);
    expect(
      valueFor(after.deviceBreakdown, 'mobile') - valueFor(before.deviceBreakdown, 'mobile'),
    ).toBe(1);

    const trend = after.trafficTrend.find((point) => point.date === today);
    expect(trend).toEqual(
      expect.objectContaining({
        visits: expect.any(Number),
        uniqueVisitors: expect.any(Number),
        pageViews: expect.any(Number),
        searches: expect.any(Number),
        vehicleViews: expect.any(Number),
        enquiries: expect.any(Number),
      }),
    );
    const previousTrend = before.trafficTrend.find((point) => point.date === today);
    expect(trend?.visits ?? 0).toBe((previousTrend?.visits ?? 0) + 2);
    expect(trend?.uniqueVisitors ?? 0).toBe((previousTrend?.uniqueVisitors ?? 0) + 1);
    expect(trend?.pageViews ?? 0).toBe((previousTrend?.pageViews ?? 0) + 2);
    expect(trend?.searches ?? 0).toBe((previousTrend?.searches ?? 0) + 2);
    expect(trend?.vehicleViews ?? 0).toBe((previousTrend?.vehicleViews ?? 0) + 2);
    expect(trend?.enquiries ?? 0).toBe((previousTrend?.enquiries ?? 0) + 1);

    const retained = await prisma.analyticsEvent.count({ where: { visitorId } });
    expect(retained).toBe(events.length);
  });

  it('rejects malformed tracking input, invalid ranges, and unauthenticated reports', async () => {
    await api
      .post('/api/v1/analytics/events')
      .send({
        eventType: 'PAGE_VIEWED',
        visitorId,
        sessionId: firstSessionId,
        route: '/',
        deviceType: 'desktop',
        unexpected: true,
      })
      .expect(400);
    await api
      .post('/api/v1/analytics/events')
      .send({
        eventType: 'PAGE_VIEWED',
        visitorId: 'short',
        sessionId: firstSessionId,
        route: '/',
        deviceType: 'desktop',
      })
      .expect(400);

    await api.get('/api/v1/admin/analytics/overview').expect(401);
    await api
      .get('/api/v1/admin/analytics/overview')
      .set(adminHeaders)
      .query({ from: '2026-02-30', to: '2026-03-01' })
      .expect(400);
    await api
      .get('/api/v1/admin/analytics/overview')
      .set(adminHeaders)
      .query({ from: '2026-03-02', to: '2026-03-01' })
      .expect(400);
    await api
      .get('/api/v1/admin/analytics/overview')
      .set(adminHeaders)
      .query({ from: overlongRangeStart, to: today })
      .expect(400);
    await api
      .get('/api/v1/admin/analytics/overview')
      .set(adminHeaders)
      .query({ from: today, to: today, unknown: 'field' })
      .expect(400);
  });

  it('returns empty aggregates for a valid date range with no events', async () => {
    const response = await api
      .get('/api/v1/admin/analytics/overview')
      .set(adminHeaders)
      .query({ from: '2098-04-11', to: '2098-04-11' })
      .expect(200);
    const data = (response.body as ApiSuccess<Overview>).data;

    expect(data.range).toEqual({ from: '2098-04-11', to: '2098-04-11' });
    expect(data.kpis).toMatchObject({
      visits: 0,
      uniqueVisitors: 0,
      returningVisitors: 0,
      pageViews: 0,
      searches: 0,
      vehicleViews: 0,
      vehicleViewSessions: 0,
      enquiries: 0,
      enquiryConversionRate: 0,
      zeroResultSearches: 0,
    });
    expect(data.trafficTrend).toHaveLength(1);
    expect(data.topPages).toEqual([]);
    expect(data.topSearches).toEqual([]);
    expect(data.topMakes).toEqual([]);
    expect(data.zeroResultSearches).toEqual([]);
    expect(data.vehiclePerformance).toEqual([]);
    expect(data.deviceBreakdown).toEqual([]);
    expect(data.sourceBreakdown).toEqual([]);
  });
});
