import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryList, InventoryOptions } from '../api';
import { fetchInventory, fetchInventoryOptions } from '../api';
import { InventoryPage } from './InventoryPage';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return {
    ...actual,
    fetchInventory: vi.fn(),
    fetchInventoryOptions: vi.fn(),
  };
});

const inventoryOptions: InventoryOptions = { makes: [], fuelTypes: [] };

const inventoryResponse = (page: number, total = 13): InventoryList => ({
  items: Array.from({ length: Math.min(12, total - (page - 1) * 12) }, (_, index) => ({
    id: `vehicle-${page}-${index}`,
    slug: `vehicle-${page}-${index}`,
    makeId: 'make-1',
    fuelTypeId: 'fuel-1',
    make: 'Make',
    model: `Model ${page}-${index}`,
    trim: 'Trim',
    category: 'Sedan',
    year: 2024,
    price: 30_000,
    mileage: 1_000,
    fuel: 'Petrol',
    priceNegotiable: false,
    photos: [],
    documents: [],
    exterior: 'Black',
    interior: 'Black',
    vin: `VIN-${page}-${index}`,
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
  })),
  page,
  pageSize: 12,
  total,
  totalPages: Math.ceil(total / 12),
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('InventoryPage pagination', () => {
  beforeEach(() => {
    vi.mocked(fetchInventoryOptions).mockResolvedValue(inventoryOptions);
    vi.mocked(fetchInventory).mockImplementation(async (params = {}) =>
      inventoryResponse(params.page ?? 1),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('requests twelve vehicles by default and navigates to the next page', async () => {
    renderPage();

    await waitFor(() =>
      expect(fetchInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 12,
        }),
      ),
    );

    fireEvent.click(await screen.findByRole('button', { name: /next inventory page/i }));

    await waitFor(() =>
      expect(fetchInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 12,
        }),
      ),
    );
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
  });

  it('returns to the first page when a filter changes', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /next inventory page/i }));
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('searchbox', { name: /search cars/i }), {
      target: { value: 'BMW' },
    });

    await waitFor(() =>
      expect(fetchInventory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'BMW',
          page: 1,
          pageSize: 12,
        }),
      ),
    );
  });
});
