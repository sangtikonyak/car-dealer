import type { Prisma, PrismaClient } from '@prisma/client';
import type { AnalyticsEventRecord, CreateAnalyticsEvent } from './analytics.types.js';

const analyticsEventSelect = {
  eventType: true,
  visitorId: true,
  sessionId: true,
  route: true,
  vehicleId: true,
  vehicleSlug: true,
  vehicleLabel: true,
  searchTerm: true,
  makeSlug: true,
  fuelTypeSlug: true,
  sort: true,
  resultCount: true,
  referrer: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  deviceType: true,
  createdAt: true,
} satisfies Prisma.AnalyticsEventSelect;

export class AnalyticsRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public create(input: CreateAnalyticsEvent) {
    return this.prisma.analyticsEvent.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  public listEvents(from: Date, to: Date): Promise<AnalyticsEventRecord[]> {
    return this.prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: analyticsEventSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  public listPurchasedEnquiries(from: Date, to: Date) {
    return this.prisma.vehicleEnquiry.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        status: 'PURCHASED',
      },
      select: {
        vehicleId: true,
        vehicleSlug: true,
        vehicleLabel: true,
        purchasePrice: true,
      },
    });
  }
}
