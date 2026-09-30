import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vehicles } from '../../../data/vehicles';
import { AdminVehicleDetails } from './AdminVehicleDetails';

describe('AdminVehicleDetails', () => {
  afterEach(cleanup);

  it('renders the sample-style read-only details layout', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AdminVehicleDetails vehicle={vehicles[0]} onEdit={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/BMW 4 Series/i);
    expect(screen.getByRole('button', { name: /edit vehicle/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inventory \/ vehicles/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /documentation/i })).toBeInTheDocument();
    expect(screen.getByText('5 of 6 available')).toBeInTheDocument();
    expect(screen.queryByText(/view/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checked/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /highlights/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /basic information/i })).toHaveAttribute(
      'href',
      '#basic-information',
    );
  });
});
