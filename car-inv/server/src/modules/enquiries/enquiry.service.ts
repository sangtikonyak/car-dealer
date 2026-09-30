import { NotFoundAppError, ValidationAppError } from '../../errors/app-error.js';
import { toVehicleEnquiryDto, type VehicleEnquirySummaryDto } from './enquiry.dto.js';
import type { EnquiryRepository } from './enquiry.repository.js';
import type {
  EnquiryCreateInput,
  EnquiryListQuery,
  EnquirySummaryQuery,
  EnquiryUpdateInput,
} from './enquiry.schema.js';

const enquiryStatuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'PURCHASED', 'LOST', 'CLOSED'] as const;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const parseUtcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const endOfUtcDayExclusive = (value: string): Date =>
  new Date(parseUtcDate(value).getTime() + millisecondsPerDay);

const formatDate = (value: Date): string => value.toISOString().slice(0, 10);

const formatTimelineLabel = (value: Date, monthly: boolean): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    ...(monthly ? { year: 'numeric' } : { day: 'numeric' }),
    timeZone: 'UTC',
  }).format(value);

const getDateRange = (query: EnquirySummaryQuery, records: Array<{ createdAt: Date }>) => {
  const earliestRecord = records[0]?.createdAt;
  const latestRecord = records.at(-1)?.createdAt;
  const from = query.from
    ? parseUtcDate(query.from)
    : earliestRecord
      ? startOfUtcDay(earliestRecord)
      : null;
  const to = query.to ? parseUtcDate(query.to) : latestRecord ? startOfUtcDay(latestRecord) : from;

  return from && to ? { from, to } : null;
};

const buildTimeline = (
  records: Array<{ status: string; purchasePrice: unknown; createdAt: Date }>,
  query: EnquirySummaryQuery,
) => {
  const range = getDateRange(query, records);
  if (!range) return [];

  const daySpan = Math.max(
    1,
    Math.floor((range.to.getTime() - range.from.getTime()) / millisecondsPerDay) + 1,
  );
  const bucketSize = daySpan <= 31 ? 'day' : daySpan <= 180 ? 'week' : 'month';
  const monthly = bucketSize === 'month';
  const buckets = new Map<
    string,
    { date: Date; label: string; enquiryCount: number; purchaseValue: number }
  >();

  const addBucket = (date: Date) => {
    const key = formatDate(date);
    if (!buckets.has(key)) {
      buckets.set(key, {
        date,
        label: formatTimelineLabel(date, monthly),
        enquiryCount: 0,
        purchaseValue: 0,
      });
    }
  };

  if (bucketSize === 'month') {
    let cursor = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1));
    const lastMonth = new Date(Date.UTC(range.to.getUTCFullYear(), range.to.getUTCMonth(), 1));
    while (cursor <= lastMonth) {
      addBucket(new Date(cursor));
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  } else {
    for (let offset = 0; offset < daySpan; offset += bucketSize === 'week' ? 7 : 1) {
      addBucket(new Date(range.from.getTime() + offset * millisecondsPerDay));
    }
  }

  for (const record of records) {
    const recordDay = startOfUtcDay(record.createdAt);
    let bucketDate = recordDay;
    if (bucketSize === 'week') {
      const offset = Math.floor(
        (recordDay.getTime() - range.from.getTime()) / millisecondsPerDay / 7,
      );
      bucketDate = new Date(range.from.getTime() + Math.max(0, offset) * 7 * millisecondsPerDay);
    } else if (bucketSize === 'month') {
      bucketDate = new Date(Date.UTC(recordDay.getUTCFullYear(), recordDay.getUTCMonth(), 1));
    }

    const bucket = buckets.get(formatDate(bucketDate));
    if (!bucket) continue;
    bucket.enquiryCount += 1;
    if (record.status === 'PURCHASED' && record.purchasePrice !== null) {
      bucket.purchaseValue += Number(record.purchasePrice);
    }
  }

  return [...buckets.values()].map(({ date, label, enquiryCount, purchaseValue }) => ({
    date: formatDate(date),
    label,
    enquiryCount,
    purchaseValue,
  }));
};

const buildLabel = (vehicle: {
  year: number;
  make: { name: string };
  model: string;
  trim: string;
}): string => `${vehicle.year} ${vehicle.make.name} ${vehicle.model} ${vehicle.trim}`;

export class EnquiryService {
  public constructor(private readonly repository: EnquiryRepository) {}

  public async create(input: EnquiryCreateInput) {
    const vehicle = await this.repository.findVehicleBySlug(input.vehicleSlug);
    if (!vehicle || !vehicle.isPublished) throw new NotFoundAppError('Vehicle was not found.');

    const photo = vehicle.photos[0];
    const record = await this.repository.create({
      vehicle: { connect: { id: vehicle.id } },
      vehicleSlug: vehicle.slug,
      vehicleLabel: buildLabel(vehicle),
      vehicleImageUrl: photo?.url ?? null,
      vehicleImageAlt: photo?.alt ?? null,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      fullAddress: input.fullAddress,
    });

    return toVehicleEnquiryDto(record);
  }

  public async listAdmin(query: EnquiryListQuery) {
    const search = query.search?.trim();
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { vehicleLabel: { contains: search } },
              { vehicleSlug: { contains: search } },
            ],
          }
        : {}),
    };
    const [records, total] = await this.repository.list(
      where,
      (query.page - 1) * query.pageSize,
      query.pageSize,
    );

    return {
      items: records.map(toVehicleEnquiryDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  public async summary(query: EnquirySummaryQuery): Promise<VehicleEnquirySummaryDto> {
    const where = {
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: parseUtcDate(query.from) } : {}),
              ...(query.to ? { lt: endOfUtcDayExclusive(query.to) } : {}),
            },
          }
        : {}),
    };
    const [totalVehicleEnquiries, purchasedSummary, groupedStatuses, records] =
      await this.repository.summary(where);
    const statusCounts = Object.fromEntries(
      enquiryStatuses.map((status) => [
        status,
        groupedStatuses.find((item) => item.status === status)?._count._all ?? 0,
      ]),
    ) as Record<(typeof enquiryStatuses)[number], number>;

    return {
      totalVehicleEnquiries,
      purchasedEnquiries: statusCounts.PURCHASED,
      totalPurchasePrice: Number(purchasedSummary._sum.purchasePrice ?? 0),
      statusCounts,
      timeline: buildTimeline(records, query),
    };
  }

  public async update(id: string, input: EnquiryUpdateInput) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundAppError('Enquiry was not found.');

    if (input.status === 'PURCHASED' && (input.purchasePrice === null || !input.purchaseDate)) {
      throw new ValidationAppError(
        'Purchase price and purchase date are required for purchased enquiries.',
      );
    }

    const normalizedRemark = input.remarks?.trim() ?? '';
    const previousRemark = existing.remarks?.trim() ?? '';
    const record = await this.repository.updateWithRemark(
      id,
      {
        status: input.status,
        remarks: normalizedRemark || existing.remarks || null,
        purchasePrice: input.purchasePrice,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      },
      normalizedRemark && normalizedRemark !== previousRemark ? normalizedRemark : undefined,
    );

    return toVehicleEnquiryDto(record);
  }

  public async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundAppError('Enquiry was not found.');

    await this.repository.delete(id);
  }
}
