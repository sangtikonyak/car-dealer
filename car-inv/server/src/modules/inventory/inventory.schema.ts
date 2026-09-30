import { z } from 'zod';

const orderedTextSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(160),
    status: z.string().trim().min(1).max(40),
    url: z.string().trim().url().max(500).optional().or(z.literal('')),
    order: z.number().int().min(0).max(200),
  })
  .strict();

const customFieldSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    label: z.string().trim().min(1).max(120),
    value: z.string().max(2000),
    order: z.number().int().min(0).max(200),
  })
  .strict();

const vehicleFields = {
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  makeId: z.string().trim().min(1),
  fuelTypeId: z.string().trim().min(1),
  model: z.string().trim().min(1).max(120),
  trim: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  year: z
    .number()
    .int()
    .min(1886)
    .max(new Date().getFullYear() + 2),
  price: z.number().finite().nonnegative().max(100_000_000),
  mileage: z.number().int().nonnegative().max(10_000_000),
  priceNegotiable: z.boolean(),
  exterior: z.string().trim().min(1).max(120),
  interior: z.string().trim().min(1).max(120),
  vin: z.string().trim().min(3).max(80),
  engine: z.string().trim().min(1).max(120),
  power: z.string().trim().min(1).max(80),
  torque: z.string().trim().min(1).max(80),
  transmission: z.string().trim().min(1).max(80),
  drivetrain: z.string().trim().min(1).max(80),
  range: z.string().trim().max(80).optional().or(z.literal('')),
  description: z.string().trim().min(1).max(10_000),
  isPublished: z.boolean(),
  documents: z.array(orderedTextSchema).max(100),
  highlights: z
    .array(
      z
        .object({
          id: z.string().trim().min(1).optional(),
          text: z.string().trim().min(1).max(500),
          order: z.number().int().min(0).max(200),
        })
        .strict(),
    )
    .max(100),
  customFields: z.array(customFieldSchema).max(50),
};

export const vehicleCreateSchema = z.object(vehicleFields).strict();
export const vehicleUpdateSchema = vehicleCreateSchema;

export const inventoryListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    make: z.string().trim().optional(),
    fuelType: z.string().trim().optional(),
    status: z.enum(['all', 'published', 'draft']).default('all'),
    year: z.coerce
      .number()
      .int()
      .min(1886)
      .max(new Date().getFullYear() + 2)
      .optional(),
    sort: z
      .enum(['featured', 'latest', 'price-low', 'price-high', 'newest', 'mileage'])
      .default('featured'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
    includeUnpublished: z.coerce.boolean().default(false),
  })
  .strict();

export const adminInventoryListQuerySchema = inventoryListQuerySchema.extend({
  pageSize: z.coerce.number().int().min(1).max(20).default(20),
  includeUnpublished: z.coerce.boolean().default(true),
});

export const makeSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    isActive: z.boolean().default(true),
  })
  .strict();

export const fuelTypeSchema = makeSchema;

export const photoOrderSchema = z
  .object({
    photoIds: z.array(z.string().trim().min(1)).min(1).max(100),
  })
  .strict();

export const photoAltSchema = z
  .object({
    alt: z.string().trim().min(1).max(240),
  })
  .strict();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
export type AdminInventoryListQuery = z.infer<typeof adminInventoryListQuerySchema>;
export type MakeInput = z.infer<typeof makeSchema>;
export type FuelTypeInput = z.infer<typeof fuelTypeSchema>;
export type PhotoOrderInput = z.infer<typeof photoOrderSchema>;
