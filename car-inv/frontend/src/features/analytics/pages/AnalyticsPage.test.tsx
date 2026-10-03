import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAnalyticsOverview } from '../api';
import type { AnalyticsOverview } from '../types';
import { AnalyticsPage } from './AnalyticsPage';

vi.mock('../api', () => ({ fetchAnalyticsOverview: vi.fn() }));

const overview: AnalyticsOverview = {
  range: { from: '2026-09-27', to: '2026-10-03' },
  kpis: {
    visits: 36,
    uniqueVisitors: 32,
    returningVisitors: 4,
    pageViews: 80,
    searches: 1,
    vehicleViews: 76,
    vehicleViewSessions: 30,
    enquiries: 15,
    purchases: 0,
    revenue: 0,
    enquiryConversionRate: 19.7,
    purchaseConversionRate: 0,
    zeroResultSearches: 0,
  },
  trafficTrend: [
    {
      date: '2026-10-02',
      label: 'Oct 2',
      visits: 20,
      uniqueVisitors: 18,
      pageViews: 40,
      searches: 1,
      vehicleViews: 30,
      enquiries: 8,
    },
  ],
  topPages: [],
  topSearches: [{ label: 'Camry', value: 1 }],
  topMakes: [],
  zeroResultSearches: [],
  vehiclePerformance: [
    {
      vehicleId: 'car-1',
      slug: 'bmw-4-series',
      label: '2023 BMW 4 Series',
      views: 75,
      enquiries: 15,
      purchases: 0,
      revenue: 0,
      conversionRate: 20,
    },
  ],
  funnel: [],
  deviceBreakdown: [],
  sourceBreakdown: [
    { label: 'Direct', value: 34 },
    { label: 'Website referral', value: 2 },
  ],
};

const renderPage = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AnalyticsPage />
    </QueryClientProvider>,
  );

describe('AnalyticsPage split analysis', () => {
  beforeEach(() => {
    vi.mocked(fetchAnalyticsOverview).mockResolvedValue(overview);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('shows live trend and source data side by side above the two car tables', async () => {
    const { container } = renderPage();
    await screen.findByRole('img', { name: 'Pie chart of 36 visits by source' });

    const primary = container.querySelector('.analytics-dashboard-primary-grid');
    const secondary = container.querySelector('.analytics-dashboard-secondary-grid');
    expect(primary).not.toBeNull();
    expect(secondary).not.toBeNull();
    expect(primary?.children).toHaveLength(2);
    expect(secondary?.children).toHaveLength(2);
    expect(within(primary as HTMLElement).getByText('Visitors and enquiries')).toBeInTheDocument();
    expect(
      within(primary as HTMLElement).getByText('Where interest comes from'),
    ).toBeInTheDocument();
    expect(within(secondary as HTMLElement).getByText('Best performers')).toBeInTheDocument();
    expect(within(secondary as HTMLElement).getByText('Most wanted cars')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '75' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Camry' })).toBeInTheDocument();
  });

  it('keeps empty sources and car tables readable', async () => {
    vi.mocked(fetchAnalyticsOverview).mockResolvedValue({
      ...overview,
      sourceBreakdown: [],
      topSearches: [],
      vehiclePerformance: [],
    });
    renderPage();

    await screen.findByText('No source data in this date range.');
    expect(screen.getByText('No car activity in this date range.')).toBeInTheDocument();
    expect(screen.getByText('No car searches in this date range.')).toBeInTheDocument();
  });

  it('offers a retry when the analytics request fails', async () => {
    vi.mocked(fetchAnalyticsOverview).mockRejectedValue(new Error('Unavailable'));
    renderPage();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('requests the selected dates and refreshes the comparison range', async () => {
    renderPage();
    await screen.findByRole('img', { name: 'Pie chart of 36 visits by source' });

    fireEvent.click(screen.getByRole('button', { name: /2026/ }));
    fireEvent.change(screen.getByLabelText('Report start date'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Report end date'), {
      target: { value: '2026-10-02' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(fetchAnalyticsOverview).toHaveBeenCalledWith({
        from: '2026-10-01',
        to: '2026-10-02',
      });
      expect(fetchAnalyticsOverview).toHaveBeenCalledWith({
        from: '2026-09-29',
        to: '2026-09-30',
      });
    });
  });

  it('exports the loaded report as a dated CSV download', async () => {
    const createObjectUrl = vi.fn(() => 'blob:analytics-report');
    vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();
    await screen.findByRole('img', { name: 'Pie chart of 36 visits by source' });

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.contexts[0]).toMatchObject({
      download: 'showroom-analytics-2026-09-27-to-2026-10-03.csv',
      href: 'blob:analytics-report',
    });
  });
});
