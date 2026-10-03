import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnalyticsSourcePieChart } from './AnalyticsCharts';

describe('AnalyticsSourcePieChart', () => {
  afterEach(cleanup);

  it('renders source shares and visit counts from live data', () => {
    render(
      <AnalyticsSourcePieChart
        points={[
          { label: 'Direct', value: 30 },
          { label: 'Website referral', value: 2 },
        ]}
      />,
    );

    const pie = screen.getByRole('img', { name: 'Pie chart of 32 visits by source' });
    expect(pie.getAttribute('style')).toContain('93.75%');
    expect(pie.getAttribute('style')).toContain('100%');

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Direct')).toBeInTheDocument();
    expect(within(rows[0]).getByText('94%')).toBeInTheDocument();
    expect(within(rows[0]).getByText('· 30 visits')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Website referral')).toBeInTheDocument();
    expect(within(rows[1]).getByText('6%')).toBeInTheDocument();
    expect(within(rows[1]).getByText('· 2 visits')).toBeInTheDocument();
  });

  it('shows an empty state when no visits were recorded', () => {
    render(<AnalyticsSourcePieChart points={[{ label: 'Direct', value: 0 }]} />);

    expect(screen.getByText('No source data in this date range.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
