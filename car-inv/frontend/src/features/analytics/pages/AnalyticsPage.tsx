import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  Heart,
  MessageSquareText,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsChartCard,
  AnalyticsLineChart,
  AnalyticsSourcePieChart,
} from '../components/AnalyticsCharts';
import { fetchAnalyticsOverview } from '../api';
import type { AnalyticsOverview } from '../types';

type DateRange = { from: string; to: string };

const dayMilliseconds = 24 * 60 * 60 * 1000;
const toInputDate = (value: Date): string => value.toISOString().slice(0, 10);
const initialRange = (): DateRange => {
  const today = new Date();
  return {
    from: toInputDate(new Date(today.getTime() - 6 * dayMilliseconds)),
    to: toInputDate(today),
  };
};

const previousRange = ({ from, to }: DateRange): DateRange => {
  const currentFrom = new Date(`${from}T00:00:00.000Z`);
  const currentTo = new Date(`${to}T00:00:00.000Z`);
  const days = Math.max(
    1,
    Math.round((currentTo.getTime() - currentFrom.getTime()) / dayMilliseconds) + 1,
  );
  const previousTo = new Date(currentFrom.getTime() - dayMilliseconds);
  return {
    from: toInputDate(new Date(previousTo.getTime() - (days - 1) * dayMilliseconds)),
    to: toInputDate(previousTo),
  };
};

const number = new Intl.NumberFormat('en-US');
const displayDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const formatDateRange = ({ from, to }: DateRange): string =>
  `${displayDate.format(new Date(`${from}T00:00:00.000Z`))} — ${displayDate.format(
    new Date(`${to}T00:00:00.000Z`),
  )}`;

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>(initialRange);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const comparison = previousRange(range);
  const analytics = useQuery({
    queryKey: ['admin-analytics', range],
    queryFn: () => fetchAnalyticsOverview(range),
  });
  const previousAnalytics = useQuery({
    queryKey: ['admin-analytics-previous', comparison],
    queryFn: () => fetchAnalyticsOverview(comparison),
    enabled: Boolean(analytics.data),
  });

  const updateRange = (field: keyof DateRange, value: string) => {
    const next = { ...range, [field]: value };
    if (next.from && next.to && next.from <= next.to) setRange(next);
  };
  const data = analytics.data;
  const previous = previousAnalytics.data;

  return (
    <div className="analytics-dashboard">
      <main className="analytics-dashboard-main" id="analytics-overview">
        <header className="analytics-dashboard-topbar">
          <h1>Analytics</h1>
          <div className="analytics-dashboard-actions">
            <div className="analytics-date-control-shell">
              <button
                className="analytics-date-control"
                type="button"
                aria-expanded={datePickerOpen}
                onClick={() => setDatePickerOpen((current) => !current)}
              >
                <CalendarDays size={13} aria-hidden="true" />
                <span>{formatDateRange(range)}</span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>
              {datePickerOpen ? (
                <div className="analytics-date-popover">
                  <label>
                    From
                    <input
                      aria-label="Report start date"
                      type="date"
                      value={range.from}
                      onChange={(event) => updateRange('from', event.target.value)}
                    />
                  </label>
                  <label>
                    To
                    <input
                      aria-label="Report end date"
                      type="date"
                      value={range.to}
                      onChange={(event) => updateRange('to', event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => setDatePickerOpen(false)}>
                    Done
                  </button>
                </div>
              ) : null}
            </div>
            <button
              className="analytics-export-button"
              type="button"
              onClick={() => data && downloadAnalyticsReport(data)}
              disabled={!data}
            >
              <Download size={14} aria-hidden="true" />
              Export
            </button>
          </div>
        </header>
        <div className="analytics-dashboard-header">
          <h2>This week in your showroom</h2>
          <p>A snapshot of your visitors, interest and enquiries for the last 7 days.</p>
        </div>

        {analytics.isError ? (
          <div className="analytics-dashboard-empty" role="alert">
            <p>We couldn’t load your showroom report for these dates.</p>
            <button type="button" onClick={() => void analytics.refetch()}>
              Try again
            </button>
          </div>
        ) : null}
        {analytics.isLoading ? (
          <div className="analytics-dashboard-empty">Preparing your showroom report…</div>
        ) : null}
        {data ? <AnalyticsContent data={data} previous={previous} /> : null}
      </main>
    </div>
  );
}

function AnalyticsContent({
  data,
  previous,
}: {
  data: AnalyticsOverview;
  previous: AnalyticsOverview | undefined;
}) {
  const trafficPoints = data.trafficTrend.map((point) => ({
    label: point.label,
    values: [point.uniqueVisitors, point.enquiries],
  }));
  const sourcePoints = friendlySourceBreakdown(data.sourceBreakdown);

  return (
    <div className="analytics-dashboard-content">
      <section className="analytics-dashboard-kpis" aria-label="Showroom summary">
        <Metric
          icon={<Users size={16} />}
          label="Showroom visitors"
          value={number.format(data.kpis.uniqueVisitors)}
          current={data.kpis.uniqueVisitors}
          previous={previous?.kpis.uniqueVisitors}
        />
        <Metric
          icon={<Heart size={16} />}
          label="Car page views"
          value={number.format(data.kpis.vehicleViews)}
          current={data.kpis.vehicleViews}
          previous={previous?.kpis.vehicleViews}
        />
        <Metric
          icon={<MessageSquareText size={16} />}
          label="Enquiries"
          value={number.format(data.kpis.enquiries)}
          current={data.kpis.enquiries}
          previous={previous?.kpis.enquiries}
        />
        <Metric
          icon={<BarChart3 size={16} />}
          label="Enquiry conversion rate"
          value={`${data.kpis.enquiryConversionRate}%`}
          current={data.kpis.enquiryConversionRate}
          previous={previous?.kpis.enquiryConversionRate}
          percentagePoints
        />
      </section>

      <div className="analytics-dashboard-primary-grid">
        <AnalyticsChartCard
          className="analytics-card analytics-trend-card"
          title="Visitors and enquiries"
        >
          <div className="analytics-card-header-row">
            <p className="analytics-card-subtitle">
              How many people are browsing and starting a conversation.
            </p>
            <div className="analytics-card-legend">
              <span>
                <i className="analytics-legend-dot analytics-legend-blue" /> Visitors
              </span>
              <span>
                <i className="analytics-legend-dot analytics-legend-green" /> Enquiries
              </span>
            </div>
          </div>
          <div id="analytics-trend">
            <AnalyticsLineChart
              points={trafficPoints}
              series={[
                { label: 'Visitors', color: '#4052ff' },
                { label: 'Enquiries', color: '#25b77a' },
              ]}
              ariaLabel="Visitors and enquiries over the last 7 days"
            />
          </div>
        </AnalyticsChartCard>
        <AnalyticsChartCard
          className="analytics-card analytics-source-card"
          title="Where interest comes from"
          headerAside={
            <span className="analytics-source-total">
              <strong>
                {number.format(sourcePoints.reduce((sum, point) => sum + point.value, 0))}
              </strong>{' '}
              visits
            </span>
          }
        >
          <p className="analytics-card-subtitle">Share of visits by source.</p>
          <AnalyticsSourcePieChart points={sourcePoints} />
        </AnalyticsChartCard>
      </div>

      <div className="analytics-dashboard-secondary-grid" id="analytics-interest">
        <section className="analytics-card analytics-performers-card" id="analytics-performers">
          <div className="analytics-card-heading">
            <div>
              <h3>Best performers</h3>
              <p className="analytics-card-subtitle">Cars with the most enquiries this week.</p>
            </div>
          </div>
          <BestPerformersTable vehicles={data.vehiclePerformance.slice(0, 5)} />
        </section>
        <AnalyticsChartCard
          className="analytics-card analytics-most-wanted-card"
          title="Most wanted cars"
        >
          <p className="analytics-card-subtitle">Based on car searches this week.</p>
          <MostWantedTable searches={data.topSearches.slice(0, 6)} />
        </AnalyticsChartCard>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  current,
  previous,
  percentagePoints = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  current: number;
  previous: number | undefined;
  percentagePoints?: boolean;
}) {
  const change = formatChange(current, previous, percentagePoints);
  return (
    <article className="analytics-dashboard-kpi">
      <div className="analytics-kpi-topline">
        <span>{label}</span>
        <i aria-hidden="true">{icon}</i>
      </div>
      <strong>{value}</strong>
      <small className={`analytics-kpi-change ${change.tone}`}>
        {change.label} <span>vs. previous week</span>
      </small>
    </article>
  );
}

function BestPerformersTable({ vehicles }: { vehicles: AnalyticsOverview['vehiclePerformance'] }) {
  if (vehicles.length === 0)
    return <p className="analytics-dashboard-empty">No car activity in this date range.</p>;
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-performers-table">
        <thead>
          <tr>
            <th>Car</th>
            <th>Page views</th>
            <th>Enquiries</th>
            <th>Enquiry conversion rate</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={`${vehicle.vehicleId}-${vehicle.slug}`}>
              <th scope="row">{vehicle.label}</th>
              <td>{number.format(vehicle.views)}</td>
              <td>{number.format(vehicle.enquiries)}</td>
              <td>{vehicle.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MostWantedTable({ searches }: { searches: AnalyticsOverview['topSearches'] }) {
  if (searches.length === 0)
    return <p className="analytics-dashboard-empty">No car searches in this date range.</p>;
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-wanted-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Car</th>
            <th>Searches</th>
          </tr>
        </thead>
        <tbody>
          {searches.map((search, index) => (
            <tr key={search.label}>
              <td>{index + 1}</td>
              <th scope="row">{search.label}</th>
              <td>{number.format(search.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatChange(
  current: number,
  previous: number | undefined,
  percentagePoints = false,
): { label: string; tone: 'positive' | 'negative' | 'neutral' } {
  if (previous === undefined) return { label: '—', tone: 'neutral' };
  if (previous === 0)
    return current === 0 ? { label: '0%', tone: 'neutral' } : { label: '↑ New', tone: 'positive' };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(percentagePoints ? 1 : 0);
  if (change === 0) return { label: '0%', tone: 'neutral' };
  return {
    label: `${change > 0 ? '↑' : '↓'} ${rounded}${percentagePoints ? 'pp' : '%'}`,
    tone: change > 0 ? 'positive' : 'negative',
  };
}

function friendlySourceBreakdown(
  points: AnalyticsOverview['sourceBreakdown'],
): AnalyticsOverview['sourceBreakdown'] {
  const friendly = new Map<string, number>();
  for (const point of points) {
    const label = point.label.startsWith('http') ? 'Website referral' : point.label;
    friendly.set(label, (friendly.get(label) ?? 0) + point.value);
  }
  return [...friendly.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, value]) => ({ label, value }));
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadAnalyticsReport(data: AnalyticsOverview): void {
  const rows: Array<Array<string | number>> = [
    ['Metric', 'Value'],
    ['Showroom visitors', data.kpis.uniqueVisitors],
    ['Car page views', data.kpis.vehicleViews],
    ['Enquiries', data.kpis.enquiries],
    ['Enquiry conversion rate', `${data.kpis.enquiryConversionRate}%`],
    [],
    ['Car', 'Page views', 'Enquiries', 'Enquiry rate', 'Purchases', 'Revenue'],
    ...data.vehiclePerformance.map((vehicle) => [
      vehicle.label,
      vehicle.views,
      vehicle.enquiries,
      `${vehicle.conversionRate}%`,
      vehicle.purchases,
      vehicle.revenue,
    ]),
  ];
  const content = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `showroom-analytics-${data.range.from}-to-${data.range.to}.csv`;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 1000);
}
