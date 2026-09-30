import { describe, expect, it } from 'vitest';
import {
  emptyVehicleForm,
  getServerVehicleError,
  validateVehicleForm,
  type VehicleFormValues,
} from './vehicle-form';

const validForm = (): VehicleFormValues => ({
  ...emptyVehicleForm('make-audi', 'fuel-electric'),
  slug: 'audi-a4-2026',
  model: 'A4',
  trim: '45 TFSI',
  vin: 'REFERENCE-123',
  exterior: 'White',
  interior: 'Black',
  engine: '2.0L turbocharged inline-four',
  power: '245 PS',
  torque: '370 Nm',
  transmission: 'Automatic',
  drivetrain: 'Quattro',
  description: 'A carefully inspected vehicle.',
});

describe('vehicle form validation', () => {
  it('accepts valid values and converts numeric input strings for the API', () => {
    const result = validateVehicleForm(validForm());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(new Date().getFullYear());
      expect(result.data.price).toBe(0);
      expect(result.data.mileage).toBe(0);
    }
  });

  it('rejects empty numeric values instead of silently converting them to zero', () => {
    const form = validForm();
    form.year = '';
    form.price = '';
    form.mileage = '';

    const result = validateVehicleForm(form);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.year).toBe('Year is required.');
      expect(result.errors.price).toBe('Price is required.');
      expect(result.errors.mileage).toBe('Mileage is required.');
    }
  });

  it('rejects unsafe slugs and invalid custom fields', () => {
    const form = validForm();
    form.slug = 'Audi A4/2026';
    form.customFields = [{ label: ' ', value: 'Value', order: 0 }];

    const result = validateVehicleForm(form);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.slug).toBe('Use lowercase letters, numbers, and hyphens only.');
      expect(result.errors['customFields.0.label']).toBe('Custom field label is required.');
    }
  });

  it('maps backend conflict and validation details to editor fields', () => {
    const result = getServerVehicleError({
      response: {
        data: {
          message: 'A resource with the same unique value already exists.',
          error: { code: 'CONFLICT', details: [] },
        },
      },
    });

    expect(result.fieldErrors.slug).toBe('A vehicle with this slug already exists.');
    expect(result.message).toContain('same unique value');
  });
});
