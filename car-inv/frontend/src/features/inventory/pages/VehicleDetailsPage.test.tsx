import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vehicles } from '../../../data/vehicles';
import { fetchVehicle, submitVehicleEnquiry } from '../api';
import { VehicleDetailsPage } from './VehicleDetailsPage';

vi.mock('../api', () => ({
  fetchVehicle: vi.fn(),
  submitVehicleEnquiry: vi.fn(),
}));

describe('VehicleDetailsPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(fetchVehicle).mockResolvedValue(vehicles[0]);
    vi.mocked(submitVehicleEnquiry).mockResolvedValue({ id: 'enquiry-1' });
  });

  it('renders binary documentation availability without document links or extra details', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inventory/bmw-4-series-430i']}>
          <Routes>
            <Route path="/inventory/:vehicleSlug" element={<VehicleDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /documentation/i })).toBeInTheDocument(),
    );

    expect(screen.getAllByText('Available')).toHaveLength(5);
    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.getByText('PUCC').closest('a')).toBeNull();
    expect(screen.getByText('Service records')).toBeInTheDocument();
    expect(screen.queryByText('On file')).not.toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    expect(screen.queryByText('View file')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /key vehicle facts/i })).toBeInTheDocument();
  });

  it('opens the enquiry form in a modal after the enquiry button is clicked', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inventory/bmw-4-series-430i']}>
          <Routes>
            <Route path="/inventory/:vehicleSlug" element={<VehicleDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const enquiryButton = await screen.findByRole('button', { name: /enquire about this car/i });
    expect(
      screen.queryByRole('heading', { name: /enquire about this vehicle/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(enquiryButton);

    expect(
      await screen.findByRole('heading', { name: /enquire about this vehicle/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /enquire about this vehicle/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Selected car')).toHaveValue('2023 BMW 4 Series 430i M Sport');
    expect(screen.getByLabelText('Name *')).toBeRequired();
    expect(screen.getByLabelText('Full Address *')).toBeRequired();
    expect(screen.getByRole('button', { name: /request a callback/i })).toBeInTheDocument();
    expect(enquiryButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the enquiry modal with the close button and Escape', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inventory/bmw-4-series-430i']}>
          <Routes>
            <Route path="/inventory/:vehicleSlug" element={<VehicleDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const enquiryButton = await screen.findByRole('button', { name: /enquire about this car/i });
    fireEvent.click(enquiryButton);
    fireEvent.click(screen.getByRole('button', { name: /close enquiry form/i }));
    expect(
      screen.queryByRole('dialog', { name: /enquire about this vehicle/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(enquiryButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: /enquire about this vehicle/i }),
    ).not.toBeInTheDocument();
  });

  it('shows validation errors when the required enquiry fields are empty', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inventory/bmw-4-series-430i']}>
          <Routes>
            <Route path="/inventory/:vehicleSlug" element={<VehicleDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /enquire about this car/i }));
    fireEvent.submit(await screen.findByRole('button', { name: /request a callback/i }));

    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your full address.')).toBeInTheDocument();
  });

  it('submits the enquiry to the backend and shows confirmation', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/inventory/bmw-4-series-430i']}>
          <Routes>
            <Route path="/inventory/:vehicleSlug" element={<VehicleDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /enquire about this car/i }));
    fireEvent.change(await screen.findByLabelText('Name *'), {
      target: { value: 'Arjun Sharma' },
    });
    fireEvent.change(screen.getByLabelText('Full Address *'), {
      target: { value: 'Chennai, Tamil Nadu' },
    });
    fireEvent.click(screen.getByRole('button', { name: /request a callback/i }));

    await waitFor(() =>
      expect(submitVehicleEnquiry).toHaveBeenCalledWith({
        vehicleSlug: 'bmw-4-series-430i',
        name: 'Arjun Sharma',
        phone: '',
        email: '',
        fullAddress: 'Chennai, Tamil Nadu',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /enquire about this vehicle/i }),
      ).not.toBeInTheDocument(),
    );
  });
});
