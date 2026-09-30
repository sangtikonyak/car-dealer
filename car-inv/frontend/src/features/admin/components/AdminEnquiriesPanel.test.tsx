import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAdminEnquiry, fetchAdminEnquiries, updateAdminEnquiry } from '../api';
import { AdminEnquiriesPanel } from './AdminEnquiriesPanel';

vi.mock('../api', () => ({
  deleteAdminEnquiry: vi.fn(),
  fetchAdminEnquiries: vi.fn(),
  updateAdminEnquiry: vi.fn(),
}));

vi.mock('../../../components/Snackbar', () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));

describe('AdminEnquiriesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.mocked(fetchAdminEnquiries).mockResolvedValue({
      items: [
        {
          id: 'enquiry-1',
          customer: {
            name: 'Priya Nair',
            email: 'priya@example.com',
            fullAddress: 'Chennai, Tamil Nadu',
          },
          vehicle: {
            id: 'vehicle-1',
            slug: 'audi-a4',
            label: '2022 Audi A4 45 TFSI quattro',
            imageUrl: '/uploads/inventory/audi-a4.webp',
            imageAlt: 'White Audi A4',
          },
          status: 'NEW',
          remarks: 'Initial contact completed.',
          remarksHistory: [
            {
              id: 'remark-1',
              text: 'Initial contact completed.',
              createdAt: '2026-09-27T10:30:00.000Z',
            },
          ],
          createdAt: '2026-09-27T00:00:00.000Z',
          updatedAt: '2026-09-27T00:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(updateAdminEnquiry).mockResolvedValue({
      id: 'enquiry-1',
      customer: { name: 'Priya Nair', fullAddress: 'Chennai, Tamil Nadu' },
      vehicle: { label: '2022 Audi A4 45 TFSI quattro' },
      status: 'PURCHASED',
      remarksHistory: [],
      createdAt: '2026-09-27T00:00:00.000Z',
      updatedAt: '2026-09-27T00:00:00.000Z',
    });
    vi.mocked(deleteAdminEnquiry).mockResolvedValue();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
  });

  const renderPanel = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <AdminEnquiriesPanel />
        </QueryClientProvider>
      </MemoryRouter>,
    );

  it('renders a listing with customer details and vehicle navigation targets', async () => {
    renderPanel();

    expect(await screen.findByRole('heading', { name: /vehicle enquiries/i })).toBeInTheDocument();
    expect(await screen.findByAltText('White Audi A4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Priya Nair' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /2022 Audi A4 45 TFSI quattro/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /more actions for priya nair/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Priya Nair' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Chennai, Tamil Nadu')).toBeInTheDocument();
    expect(screen.getByText('Initial contact completed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close details/i })).toBeInTheDocument();
  });

  it('opens edit mode and saves enquiry changes from the actions menu', async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: /more actions for priya nair/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /edit enquiry/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Purchased' }));
    fireEvent.change(screen.getByLabelText('Add remark'), {
      target: { value: 'Vehicle purchase completed.' },
    });
    fireEvent.change(screen.getByLabelText('Purchase price'), { target: { value: '31750' } });
    fireEvent.change(screen.getByLabelText('Purchase date'), { target: { value: '2026-09-27' } });
    fireEvent.click(screen.getByRole('button', { name: /save enquiry/i }));

    await waitFor(() =>
      expect(updateAdminEnquiry).toHaveBeenCalledWith('enquiry-1', {
        status: 'PURCHASED',
        remarks: 'Vehicle purchase completed.',
        purchasePrice: 31750,
        purchaseDate: '2026-09-27',
      }),
    );
  });

  it('confirms and deletes an enquiry from the actions menu', async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: /more actions for priya nair/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete enquiry/i }));

    await waitFor(() =>
      expect(deleteAdminEnquiry).toHaveBeenCalledWith('enquiry-1', expect.anything()),
    );
    expect(window.confirm).toHaveBeenCalledWith('Delete the enquiry from Priya Nair?');
  });
});
