import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vehicles } from '../data/vehicles';
import { fetchInventory } from '../features/inventory/api';
import { LatestListingsSection } from './LatestListingsSection';

vi.mock('../features/inventory/api', () => ({ fetchInventory: vi.fn() }));

const fetchInventoryMock = vi.mocked(fetchInventory);

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LatestListingsSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('LatestListingsSection', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('requests and renders the latest six published inventory records', async () => {
    const latestVehicles = vehicles.slice(0, 6);
    fetchInventoryMock.mockResolvedValue({
      items: latestVehicles,
      page: 1,
      pageSize: 6,
      total: latestVehicles.length,
      totalPages: 1,
    });

    renderSection();

    expect(screen.getByRole('status')).toHaveTextContent('Loading latest vehicles');
    expect(await screen.findAllByRole('link', { name: /view details for/i })).toHaveLength(6);
    expect(fetchInventoryMock).toHaveBeenCalledWith({ sort: 'latest', page: 1, pageSize: 6 });
    expect(screen.getByText('Just added · 6 vehicles')).toBeInTheDocument();
  });

  it('renders a safe placeholder for a published vehicle without photos', async () => {
    fetchInventoryMock.mockResolvedValue({
      items: [{ ...vehicles[0], photos: [] }],
      page: 1,
      pageSize: 6,
      total: 1,
      totalPages: 1,
    });

    renderSection();

    expect(await screen.findByLabelText('Vehicle image unavailable')).toBeInTheDocument();
    expect(screen.getByText('Just added · 1 vehicle')).toBeInTheDocument();
  });

  it('shows deliberate empty and error states', async () => {
    fetchInventoryMock.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 6,
      total: 0,
      totalPages: 0,
    });
    const firstRender = renderSection();

    expect(await screen.findByText('No published vehicles are available yet.')).toBeInTheDocument();
    firstRender.unmount();

    fetchInventoryMock.mockRejectedValue(new Error('API unavailable'));
    renderSection();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Latest vehicles are temporarily unavailable',
      );
    });
  });
});
