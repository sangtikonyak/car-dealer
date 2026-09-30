import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/apiClient';
import { fetchAdminVehicle, fetchAdminVehicles, fetchInventory, fetchVehicle } from './api';

const vehicle = {
  id: 'vehicle-1',
  slug: 'vehicle-1',
  makeId: 'make-1',
  fuelTypeId: 'fuel-1',
  make: 'Make',
  model: 'Model',
  trim: 'Trim',
  category: 'Sedan',
  year: 2024,
  price: 100,
  mileage: 1000,
  fuel: 'Petrol',
  priceNegotiable: false,
  photos: [
    { id: 'photo-1', src: '/images/stock.jpg', label: 'Stock', alt: 'Stock' },
    { id: 'photo-2', src: '/uploads/inventory/photo.webp', label: 'Uploaded', alt: 'Uploaded' },
  ],
  documents: [
    { id: 'document-1', name: 'History', status: 'Online', url: '/uploads/docs/history.pdf' },
  ],
  exterior: 'Black',
  interior: 'Black',
  vin: 'VIN-1',
  engine: 'Engine',
  power: 'Power',
  torque: 'Torque',
  transmission: 'Automatic',
  drivetrain: 'AWD',
  description: 'Description',
  highlights: [],
  customFields: [],
  isPublished: true,
  createdAt: '',
  updatedAt: '',
};

describe('inventory media URL normalization', () => {
  afterEach(() => vi.restoreAllMocks());

  it('normalizes uploaded media for public vehicle details', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: vehicle } });

    const result = await fetchVehicle('vehicle-1');

    expect(result.photos[0]?.src).toBe('/images/stock.jpg');
    expect(result.photos[1]?.src).toBe('http://127.0.0.1:8000/uploads/inventory/photo.webp');
    expect(result.documents[0]?.url).toBe('http://127.0.0.1:8000/uploads/docs/history.pdf');
  });

  it('normalizes uploaded media in public and admin collections', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { items: [vehicle], page: 1, pageSize: 6, total: 1, totalPages: 1 } },
    });

    const publicResult = await fetchInventory({ sort: 'latest', page: 1, pageSize: 6 });
    expect(publicResult.items[0]?.photos[1]?.src).toContain('http://127.0.0.1:8000/uploads/');
    expect(get).toHaveBeenCalledWith('/inventory', {
      params: { sort: 'latest', page: 1, pageSize: 6 },
    });

    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: vehicle } });
    const adminResult = await fetchAdminVehicle('vehicle-1');
    expect(adminResult.photos[1]?.src).toContain('http://127.0.0.1:8000/uploads/');
  });

  it('passes admin filters and the fixed page size to the listing endpoint', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { items: [], page: 2, pageSize: 20, total: 20, totalPages: 2 } },
    });

    await fetchAdminVehicles({
      status: 'draft',
      fuelType: 'electric',
      year: 2024,
      page: 2,
      pageSize: 20,
      includeUnpublished: true,
    });

    expect(get).toHaveBeenCalledWith('/admin/inventory/vehicles', {
      params: {
        status: 'draft',
        fuelType: 'electric',
        year: 2024,
        page: 2,
        pageSize: 20,
        includeUnpublished: true,
      },
    });
  });
});
