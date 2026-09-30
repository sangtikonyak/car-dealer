import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from '../../../components/Snackbar';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../hooks/useAdminSession', () => ({
  useAdminLogout: () => ({ mutate: vi.fn(), isPending: false }),
  useAdminSession: () => ({
    data: { email: 'admin@driva.example' },
    isLoading: false,
  }),
}));

vi.mock('../api', () => ({
  fetchAdminHomepage: vi.fn().mockResolvedValue({ benefits: [], faqs: [] }),
  fetchMediaAssets: vi.fn().mockResolvedValue([]),
  fetchAdminEnquirySummary: vi.fn().mockResolvedValue({
    totalVehicleEnquiries: 12,
    purchasedEnquiries: 7,
    totalPurchasePrice: 31750,
    statusCounts: {
      NEW: 4,
      CONTACTED: 2,
      FOLLOW_UP: 1,
      PURCHASED: 7,
      LOST: 1,
      CLOSED: 0,
    },
    timeline: [
      { date: '2026-09-01', label: 'Sep 1', enquiryCount: 3, purchaseValue: 12000 },
      { date: '2026-09-15', label: 'Sep 15', enquiryCount: 9, purchaseValue: 19750 },
    ],
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderDashboard = (initialEntry = '/admin') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <SnackbarProvider>
          <AdminDashboardPage />
        </SnackbarProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AdminDashboardPage navigation', () => {
  it('shows enquiry and completed purchase metrics on the overview', async () => {
    renderDashboard();

    expect(await screen.findByText('Vehicle enquiries')).toBeInTheDocument();
    expect(await screen.findAllByText('12')).toHaveLength(2);
    expect(await screen.findAllByText('$31,750')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Enquiries by status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enquiries & purchase value' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('does not render Newsletter in the desktop or mobile navigation', async () => {
    renderDashboard();

    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument();
    expect(screen.queryByText('Newsletter')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Open admin navigation' }).click();

    expect(screen.queryByText('Newsletter')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Enquiries' })).not.toHaveLength(0);
  });

  it('falls back to the overview for the removed newsletter route', () => {
    renderDashboard('/admin/newsletter');

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.queryByText('Newsletter')).not.toBeInTheDocument();
  });
});
