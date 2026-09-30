import { z } from 'zod';
import type { VehiclePayload } from '../../inventory/api';

const currentYear = new Date().getFullYear();

const requiredText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maximum, `${label} must be ${maximum} characters or fewer.`);

const numericInput = (label: string, minimum: number, maximum: number, integer = false) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(
      (value) => {
        const number = Number(value);
        return Number.isFinite(number) && (!integer || Number.isInteger(number));
      },
      `${label} must be a valid ${integer ? 'whole number' : 'number'}.`,
    )
    .refine((value) => Number(value) >= minimum, `${label} must be at least ${minimum}.`)
    .refine((value) => Number(value) <= maximum, `${label} must be ${maximum} or less.`)
    .transform(Number);

const optionalUrl = z
  .string()
  .trim()
  .max(500, 'Document URL must be 500 characters or fewer.')
  .refine((value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, 'Document URL must be a valid URL.');

const documentSchema = z
  .object({
    name: requiredText('Document name', 160),
    status: requiredText('Document status', 40),
    url: optionalUrl,
    order: z.number().int().min(0).max(200),
  })
  .strict();

const highlightSchema = z
  .object({
    text: requiredText('Highlight', 500),
    order: z.number().int().min(0).max(200),
  })
  .strict();

const customFieldSchema = z
  .object({
    label: requiredText('Custom field label', 120),
    value: z.string().max(2000, 'Custom field value must be 2,000 characters or fewer.'),
    order: z.number().int().min(0).max(200),
  })
  .strict();

export const vehicleFormSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required.')
      .max(180, 'Slug must be 180 characters or fewer.')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Use lowercase letters, numbers, and hyphens only.'),
    makeId: z.string().trim().min(1, 'Make is required.'),
    fuelTypeId: z.string().trim().min(1, 'Fuel type is required.'),
    model: requiredText('Model', 120),
    trim: requiredText('Trim', 120),
    category: requiredText('Category', 80),
    year: numericInput('Year', 1886, currentYear + 2, true),
    price: numericInput('Price', 0, 100_000_000),
    mileage: numericInput('Mileage', 0, 10_000_000, true),
    priceNegotiable: z.boolean(),
    exterior: requiredText('Exterior', 120),
    interior: requiredText('Interior', 120),
    vin: requiredText('VIN / reference', 80).refine(
      (value) => value.length >= 3,
      'VIN / reference must be at least 3 characters.',
    ),
    engine: requiredText('Engine', 120),
    power: requiredText('Power', 80),
    torque: requiredText('Torque', 80),
    transmission: requiredText('Transmission', 80),
    drivetrain: requiredText('Drivetrain', 80),
    range: z.string().trim().max(80, 'Range must be 80 characters or fewer.'),
    description: requiredText('Description', 10_000),
    isPublished: z.boolean(),
    documents: z.array(documentSchema).max(100, 'You can add at most 100 documents.'),
    highlights: z.array(highlightSchema).max(100, 'You can add at most 100 highlights.'),
    customFields: z.array(customFieldSchema).max(50, 'You can add at most 50 custom fields.'),
  })
  .strict();

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;
export type VehicleFormErrors = Record<string, string>;

export const emptyVehicleForm = (makeId = '', fuelTypeId = ''): VehicleFormValues => ({
  slug: '',
  makeId,
  fuelTypeId,
  model: '',
  trim: '',
  category: 'Sedan',
  year: String(currentYear),
  price: '0',
  mileage: '0',
  priceNegotiable: false,
  exterior: '',
  interior: '',
  vin: '',
  engine: '',
  power: '',
  torque: '',
  transmission: '',
  drivetrain: '',
  range: '',
  description: '',
  isPublished: true,
  documents: [],
  highlights: [],
  customFields: [],
});

export const vehicleToForm = (vehicle: VehiclePayload): VehicleFormValues => ({
  ...vehicle,
  year: String(vehicle.year),
  price: String(vehicle.price),
  mileage: String(vehicle.mileage),
  range: vehicle.range ?? '',
  documents: vehicle.documents.map((document) => ({
    ...document,
    url: document.url ?? '',
  })),
});

export const formatVehicleValidationErrors = (error: z.ZodError): VehicleFormErrors => {
  const errors: VehicleFormErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
};

export const validateVehicleForm = (
  values: VehicleFormValues,
): { success: true; data: VehiclePayload } | { success: false; errors: VehicleFormErrors } => {
  const result = vehicleFormSchema.safeParse(values);
  return result.success
    ? { success: true, data: result.data as VehiclePayload }
    : { success: false, errors: formatVehicleValidationErrors(result.error) };
};

export const getServerVehicleError = (
  error: unknown,
): { message: string; fieldErrors: VehicleFormErrors } => {
  if (!error || typeof error !== 'object') {
    return { message: 'Unable to save this vehicle. Try again.', fieldErrors: {} };
  }

  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== 'object') {
    return { message: 'Unable to save this vehicle. Try again.', fieldErrors: {} };
  }

  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return { message: 'Unable to save this vehicle. Try again.', fieldErrors: {} };
  }

  const body = data as {
    message?: unknown;
    error?: { code?: unknown; details?: unknown };
  };
  const fieldErrors: VehicleFormErrors = {};
  if (Array.isArray(body.error?.details)) {
    for (const detail of body.error.details) {
      if (!detail || typeof detail !== 'object') continue;
      const item = detail as { path?: unknown; message?: unknown };
      if (Array.isArray(item.path) && typeof item.message === 'string') {
        const path = item.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = item.message;
      }
    }
  }

  if (body.error?.code === 'CONFLICT') {
    fieldErrors.slug = 'A vehicle with this slug already exists.';
  }

  return {
    message: typeof body.message === 'string' ? body.message : 'Unable to save this vehicle.',
    fieldErrors,
  };
};

export const validationSection = (
  path: string,
): 'basic' | 'specifications' | 'documents' | 'custom' => {
  if (path === 'documents' || path.startsWith('documents.')) return 'documents';
  if (path === 'highlights' || path.startsWith('highlights.')) return 'specifications';
  if (path === 'customFields' || path.startsWith('customFields.')) return 'custom';
  if (
    [
      'price',
      'mileage',
      'exterior',
      'interior',
      'engine',
      'power',
      'torque',
      'transmission',
      'drivetrain',
      'range',
      'description',
    ].includes(path)
  ) {
    return 'specifications';
  }
  return 'basic';
};
