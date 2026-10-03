import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service.js';
import type { AnalyticsRepository } from '../../src/modules/analytics/analytics.repository.js';
import type { AnalyticsEventRecord } from '../../src/modules/analytics/analytics.types.js';

const event = (overrides: Partial<AnalyticsEventRecord>): AnalyticsEventRecord => ({
  eventType: 'PAGE_VIEWED',
  visitorId: 'visitor-123456789',
  sessionId: 'session-123456789',
  route: '/',
  vehicleId: null,
  vehicleSlug: null,
  vehicleLabel: null,
  searchTerm: null,
  makeSlug: null,
  fuelTypeSlug: null,
  sort: null,
  resultCount: null,
  referrer: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  deviceType: 'desktop',
  createdAt: new Date('2026-10-02T10:00:00.000Z'),
  ...overrides,
});

describe('AnalyticsService', () => {
  it('aggregates traffic, searches, funnel metrics and vehicle performance', async () => {
    const repository = {
      listEvents: vi.fn().mockResolvedValue([
        event({
          eventType: 'SESSION_STARTED',
          visitorId: 'visitor-123456789',
          sessionId: 'session-123456789',
        }),
        event({
          eventType: 'SESSION_STARTED',
          visitorId: 'visitor-223456789',
          sessionId: 'session-223456789',
        }),
        event({ eventType: 'PAGE_VIEWED', route: '/inventory' }),
        event({
          eventType: 'INVENTORY_SEARCHED',
          searchTerm: 'camry',
          makeSlug: 'toyota',
          resultCount: 2,
        }),
        event({ eventType: 'INVENTORY_SEARCHED', searchTerm: 'rare car', resultCount: 0 }),
        event({
          eventType: 'VEHICLE_DETAIL_VIEWED',
          vehicleId: 'vehicle-1',
          vehicleSlug: 'toyota-camry',
          vehicleLabel: '2022 Toyota Camry SE',
        }),
        event({
          eventType: 'ENQUIRY_SUBMITTED',
          vehicleId: 'vehicle-1',
          vehicleSlug: 'toyota-camry',
          vehicleLabel: '2022 Toyota Camry SE',
        }),
      ]),
      listPurchasedEnquiries: vi.fn().mockResolvedValue([
        {
          vehicleId: 'vehicle-1',
          vehicleSlug: 'toyota-camry',
          vehicleLabel: '2022 Toyota Camry SE',
          purchasePrice: 25_000,
        },
      ]),
      create: vi.fn(),
    } as unknown as AnalyticsRepository;

    const result = await new AnalyticsService(repository).overview({
      from: '2026-10-01',
      to: '2026-10-02',
    });

    expect(result.kpis).toMatchObject({
      visits: 2,
      uniqueVisitors: 2,
      pageViews: 1,
      searches: 2,
      vehicleViews: 1,
      vehicleViewSessions: 1,
      enquiries: 1,
      purchases: 1,
      revenue: 25_000,
      zeroResultSearches: 1,
    });
    expect(result.topSearches[0]).toEqual({ label: 'camry', value: 1 });
    expect(result.trafficTrend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ searches: 2, vehicleViews: 1, enquiries: 1 }),
      ]),
    );
    expect(result.vehiclePerformance[0]).toMatchObject({
      slug: 'toyota-camry',
      views: 1,
      enquiries: 1,
      purchases: 1,
      revenue: 25_000,
      conversionRate: 100,
    });
    expect(result.funnel.map((item) => item.value)).toEqual([2, 2, 1, 1, 1]);
  });

  it('rejects ranges longer than one year', async () => {
    const repository = {
      listEvents: vi.fn(),
      listPurchasedEnquiries: vi.fn(),
      create: vi.fn(),
    } as unknown as AnalyticsRepository;

    await expect(
      new AnalyticsService(repository).overview({ from: '2024-01-01', to: '2026-10-02' }),
    ).rejects.toThrow('cannot exceed 366 days');
    expect(repository.listEvents).not.toHaveBeenCalled();
  });
});
