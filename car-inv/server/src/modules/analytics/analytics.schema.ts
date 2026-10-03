import { z } from 'zod';

export const analyticsEventTypes = [
  'SESSION_STARTED',
  'PAGE_VIEWED',
  'INVENTORY_SEARCHED',
  'VEHICLE_CARD_VIEWED',
  'VEHICLE_DETAIL_VIEWED',
  'ENQUIRY_STARTED',
  'ENQUIRY_SUBMITTED',
  'NEWSLETTER_SUBMITTED',
  'CTA_CLICKED',
  '404_VIEWED',
  'API_ERROR',
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(16)
  .max(80)
  .regex(/^[A-Za-z0-9_-]+$/u);

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const analyticsEventSchema = z
  .object({
    eventType: z.enum(analyticsEventTypes),
    visitorId: identifierSchema,
    sessionId: identifierSchema,
    route: z.string().trim().min(1).max(255),
    vehicleId: optionalText(191),
    vehicleSlug: optionalText(180),
    vehicleLabel: optionalText(240),
    searchTerm: optionalText(180),
    makeSlug: optionalText(120),
    fuelTypeSlug: optionalText(120),
    sort: optionalText(32),
    resultCount: z.number().int().min(0).max(10_000).optional(),
    referrer: optionalText(500),
    utmSource: optionalText(120),
    utmMedium: optionalText(120),
    utmCampaign: optionalText(160),
    deviceType: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional(),
    metadata: z
      .record(
        z.string().trim().min(1).max(40),
        z.union([z.string().trim().max(160), z.number().finite(), z.boolean()]),
      )
      .optional(),
  })
  .strict();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Date must use YYYY-MM-DD format.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    const [year, month, day] = value.split('-').map(Number);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() + 1 === month &&
      parsed.getUTCDate() === day
    );
  }, 'Date must be valid.');

export const analyticsQuerySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'The end date must be on or after the start date.',
      });
    }
  });

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
