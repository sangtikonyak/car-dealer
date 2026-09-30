import { z } from 'zod';

const vehicleSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const enquiryCreateSchema = z
  .object({
    vehicleSlug: vehicleSlugSchema,
    name: z.string().trim().min(1).max(160),
    phone: z.string().trim().max(80).optional().or(z.literal('')),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    fullAddress: z.string().trim().min(1).max(2000),
  })
  .strict();

export const enquiryListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'PURCHASED', 'LOST', 'CLOSED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(20).default(20),
  })
  .strict();

const summaryDateSchema = z
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

export const enquirySummaryQuerySchema = z
  .object({
    from: summaryDateSchema.optional(),
    to: summaryDateSchema.optional(),
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

export const enquiryUpdateSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'PURCHASED', 'LOST', 'CLOSED']),
    remarks: z.string().trim().max(5000).optional().or(z.literal('')),
    purchasePrice: z.number().finite().nonnegative().max(100_000_000).nullable(),
    purchaseDate: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .nullable()
      .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
        message: 'Purchase date must be a valid date.',
      }),
  })
  .strict();

export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;
export type EnquiryListQuery = z.infer<typeof enquiryListQuerySchema>;
export type EnquirySummaryQuery = z.infer<typeof enquirySummaryQuerySchema>;
export type EnquiryUpdateInput = z.infer<typeof enquiryUpdateSchema>;
