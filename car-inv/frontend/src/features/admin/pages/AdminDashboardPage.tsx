import {
  ArrowUpRight,
  CalendarDays,
  CarFront,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { frontendEnvironment } from '../../../config/env';
import {
  deleteMediaAsset,
  fetchAdminEnquirySummary,
  fetchAdminHomepage,
  fetchMediaAssets,
  uploadMediaAsset,
} from '../api';
import { useAdminLogout, useAdminSession } from '../hooks/useAdminSession';
import type { AdminEnquirySummary, MediaAsset, VehicleEnquiryStatus } from '../types';
import {
  AdminHomepageWorkspace,
  getHomepageSection,
  homepageSectionLabels,
  type HomepageSection,
} from '../components/AdminHomepageWorkspace';
import { AdminInventoryPanel } from '../components/AdminInventoryPanel';
import { AdminEnquiriesPanel } from '../components/AdminEnquiriesPanel';
import { useSnackbar } from '../../../components/Snackbar';
import { DocumentMetadata } from '../../../app/DocumentMetadata';

type DashboardSection = 'overview' | 'homepage' | 'inventory' | 'media' | 'enquiries';
type EnquiryDateRange = { from: string; to: string };

const homepageNavigationSections = (Object.keys(homepageSectionLabels) as HomepageSection[]).filter(
  (item) => item !== 'overview',
);

const toInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialEnquiryDateRange = (): EnquiryDateRange => {
  const today = new Date();
  return {
    from: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toInputDate(today),
  };
};

const formatHumanDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );

const mediaOrigin = (): string => {
  const apiUrl = new URL(frontendEnvironment.VITE_API_BASE_URL);
  return `${apiUrl.protocol}//${apiUrl.host}`;
};

const resolveMediaUrl = (url: string): string =>
  url.startsWith('/uploads/') ? `${mediaOrigin()}${url}` : url;

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const session = useAdminSession();
  const logout = useAdminLogout();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [draftEnquiryDateRange, setDraftEnquiryDateRange] =
    useState<EnquiryDateRange>(initialEnquiryDateRange);
  const [appliedEnquiryDateRange, setAppliedEnquiryDateRange] =
    useState<EnquiryDateRange>(initialEnquiryDateRange);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const adminPath = location.pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  const section: DashboardSection =
    adminPath[0] === 'homepage'
      ? 'homepage'
      : adminPath[0] === 'media'
        ? 'media'
        : adminPath[0] === 'enquiries'
          ? 'enquiries'
          : adminPath[0] === 'inventory'
            ? 'inventory'
            : 'overview';
  const homepageSection = section === 'homepage' ? getHomepageSection(adminPath[1]) : 'overview';

  const homepage = useQuery({
    queryKey: ['admin-homepage'],
    queryFn: fetchAdminHomepage,
    enabled: Boolean(session.data),
  });
  const media = useQuery({
    queryKey: ['admin-media'],
    queryFn: fetchMediaAssets,
    enabled: Boolean(session.data),
  });
  const enquirySummary = useQuery({
    queryKey: ['admin-enquiry-summary', appliedEnquiryDateRange],
    queryFn: () => fetchAdminEnquirySummary(appliedEnquiryDateRange),
    enabled: Boolean(session.data) && section === 'overview',
  });
  useEffect(() => {
    if (!session.isLoading && !session.data) navigate('/admin/login', { replace: true });
  }, [navigate, session.data, session.isLoading]);

  const signOut = () => {
    logout.mutate(undefined, { onSuccess: () => navigate('/admin/login', { replace: true }) });
  };

  if (session.isLoading || !session.data) {
    return <main className="admin-loading-screen">Preparing your workspace…</main>;
  }

  const navigateTo = (nextSection: DashboardSection) => {
    setMobileNavOpen(false);
    navigate(nextSection === 'overview' ? '/admin' : `/admin/${nextSection}`);
  };

  const navigateToHomepageSection = (nextSection: HomepageSection) => {
    setMobileNavOpen(false);
    navigate(`/admin/homepage/${nextSection}`);
  };

  const updateDraftDate = (field: keyof EnquiryDateRange, value: string) => {
    setDraftEnquiryDateRange((current) => ({ ...current, [field]: value }));
    setDateRangeError(null);
  };

  const applyDateRange = () => {
    if (!draftEnquiryDateRange.from || !draftEnquiryDateRange.to) {
      setDateRangeError('Choose both a start date and an end date.');
      return;
    }
    if (draftEnquiryDateRange.from > draftEnquiryDateRange.to) {
      setDateRangeError('The end date must be on or after the start date.');
      return;
    }
    setDateRangeError(null);
    setAppliedEnquiryDateRange(draftEnquiryDateRange);
  };

  return (
    <main className="admin-shell">
      <DocumentMetadata />
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'admin-sidebar-collapsed'}`}>
        <div className="admin-sidebar-top">
          <Link className="admin-sidebar-brand" to="/admin" aria-label="Admin dashboard home">
            <span className="admin-brand-mark">D</span>
            {sidebarOpen ? <span>Driva control room</span> : null}
          </Link>
          <button
            className="admin-sidebar-collapse"
            type="button"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <div className="admin-sidebar-context">
          {sidebarOpen ? (
            <>
              <span>CONTENT OPERATIONS</span>
              <strong>Homepage workspace</strong>
            </>
          ) : null}
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          <AdminNavButton
            active={section === 'overview'}
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            collapsed={!sidebarOpen}
            onClick={() => navigateTo('overview')}
          />
          <AdminNavButton
            active={section === 'enquiries'}
            icon={<MessageSquareText size={18} />}
            label="Enquiries"
            collapsed={!sidebarOpen}
            onClick={() => navigateTo('enquiries')}
          />
          <AdminNavButton
            active={section === 'homepage'}
            icon={<FileText size={18} />}
            label="Homepage"
            collapsed={!sidebarOpen}
            onClick={() => navigateToHomepageSection('overview')}
          />
          {sidebarOpen && section === 'homepage' ? (
            <nav className="admin-homepage-subnav" aria-label="Homepage sections">
              {homepageNavigationSections.map((item) => (
                <button
                  className={homepageSection === item ? 'active' : ''}
                  type="button"
                  key={item}
                  onClick={() => navigateToHomepageSection(item)}
                >
                  <span /> {homepageSectionLabels[item]}
                </button>
              ))}
            </nav>
          ) : null}
          <AdminNavButton
            active={section === 'inventory'}
            icon={<CarFront size={18} />}
            label="Inventory"
            collapsed={!sidebarOpen}
            onClick={() => navigateTo('inventory')}
          />
          {sidebarOpen && section === 'inventory' ? (
            <nav className="admin-homepage-subnav" aria-label="Inventory sections">
              <button
                className={!adminPath[1] ? 'active' : ''}
                type="button"
                onClick={() => navigate('/admin/inventory')}
              >
                <span /> All vehicles
              </button>
              <button
                className={adminPath[1] === 'new' ? 'active' : ''}
                type="button"
                onClick={() => navigate('/admin/inventory/new')}
              >
                <span /> Add vehicle
              </button>
              <button
                className={adminPath[1] === 'makes' ? 'active' : ''}
                type="button"
                onClick={() => navigate('/admin/inventory/makes')}
              >
                <span /> Makes
              </button>
              <button
                className={adminPath[1] === 'fuel-types' ? 'active' : ''}
                type="button"
                onClick={() => navigate('/admin/inventory/fuel-types')}
              >
                <span /> Fuel types
              </button>
            </nav>
          ) : null}
          <AdminNavButton
            active={section === 'media'}
            icon={<ImagePlus size={18} />}
            label="Media library"
            collapsed={!sidebarOpen}
            onClick={() => navigateTo('media')}
          />
        </nav>

        <div className="admin-sidebar-bottom">
          {sidebarOpen ? (
            <div className="admin-sidebar-user">
              <span className="admin-avatar">{session.data.email.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{session.data.email}</strong>
                <small>Administrator</small>
              </span>
            </div>
          ) : null}
          <button className="admin-logout-button" type="button" onClick={signOut}>
            <LogOut size={17} />
            {sidebarOpen ? 'Sign out' : null}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            type="button"
            aria-label="Open admin navigation"
            onClick={() => setMobileNavOpen((current) => !current)}
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="admin-kicker">DRIVA / ADMIN</p>
            <h1>
              {section === 'homepage'
                ? homepageSectionLabels[homepageSection]
                : sectionTitle(section)}
            </h1>
          </div>
          <div className="admin-topbar-actions">
            <Link className="admin-preview-link" to="/" target="_blank" rel="noreferrer">
              Preview site <ArrowUpRight size={15} />
            </Link>
            <span className="admin-live-badge">
              <span /> Live
            </span>
          </div>
        </header>

        {mobileNavOpen ? (
          <div className="admin-mobile-nav">
            {(
              ['overview', 'enquiries', 'homepage', 'inventory', 'media'] as DashboardSection[]
            ).map((item) => (
              <button
                type="button"
                className={section === item ? 'active' : ''}
                key={item}
                onClick={() => navigateTo(item)}
              >
                {sectionTitle(item)}
              </button>
            ))}
            {section === 'homepage' ? (
              <div className="admin-mobile-homepage-nav">
                {homepageNavigationSections.map((item) => (
                  <button
                    type="button"
                    className={homepageSection === item ? 'active' : ''}
                    key={item}
                    onClick={() => navigateToHomepageSection(item)}
                  >
                    {homepageSectionLabels[item]}
                  </button>
                ))}
              </div>
            ) : null}
            {section === 'inventory' ? (
              <div className="admin-mobile-homepage-nav">
                <button type="button" onClick={() => navigate('/admin/inventory')}>
                  All vehicles
                </button>
                <button type="button" onClick={() => navigate('/admin/inventory/new')}>
                  Add vehicle
                </button>
                <button type="button" onClick={() => navigate('/admin/inventory/makes')}>
                  Makes
                </button>
                <button type="button" onClick={() => navigate('/admin/inventory/fuel-types')}>
                  Fuel types
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="admin-content">
          {section === 'overview' ? (
            <OverviewPanel
              homepageCount={homepage.data?.benefits.length ?? 0}
              faqCount={homepage.data?.faqs.length ?? 0}
              mediaCount={media.data?.length ?? 0}
              enquiryCount={enquirySummary.data?.totalVehicleEnquiries ?? 0}
              totalPurchasePrice={enquirySummary.data?.totalPurchasePrice ?? 0}
              enquirySummary={enquirySummary.data}
              enquirySummaryLoading={enquirySummary.isLoading}
              enquirySummaryError={enquirySummary.isError}
              draftDateRange={draftEnquiryDateRange}
              appliedDateRange={appliedEnquiryDateRange}
              dateRangeError={dateRangeError}
              onDateChange={updateDraftDate}
              onApplyDateRange={applyDateRange}
              onNavigate={navigateTo}
            />
          ) : null}
          {section === 'homepage' ? (
            <HomepagePanel
              content={homepage.data}
              mediaAssets={media.data ?? []}
              isLoading={homepage.isLoading}
              isError={homepage.isError}
              onRetry={() => void homepage.refetch()}
              homepageSection={homepageSection}
              onNavigate={navigateToHomepageSection}
              onSaved={(updated) => queryClient.setQueryData(['admin-homepage'], updated)}
            />
          ) : null}
          {section === 'inventory' ? (
            <AdminInventoryPanel
              mode={
                adminPath[1] === 'new'
                  ? 'new'
                  : adminPath[2] === 'details'
                    ? 'details'
                    : adminPath[1] === 'makes'
                      ? 'makes'
                      : adminPath[1] === 'fuel-types'
                        ? 'fuel-types'
                        : adminPath[1]
                          ? 'edit'
                          : 'list'
              }
              vehicleId={
                adminPath[1] && !['new', 'makes', 'fuel-types'].includes(adminPath[1])
                  ? adminPath[1]
                  : undefined
              }
            />
          ) : null}
          {section === 'media' ? (
            <MediaPanel
              queryClient={queryClient}
              media={media.data ?? []}
              showSnackbar={showSnackbar}
            />
          ) : null}
          {section === 'enquiries' ? <AdminEnquiriesPanel /> : null}
        </div>
      </div>
    </main>
  );
}

function sectionTitle(section: DashboardSection): string {
  return {
    overview: 'Overview',
    homepage: 'Homepage editor',
    inventory: 'Inventory',
    media: 'Media library',
    enquiries: 'Enquiries',
  }[section];
}

function AdminNavButton({
  active,
  icon,
  label,
  collapsed,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`admin-nav-button ${active ? 'active' : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      {collapsed ? null : <span>{label}</span>}
    </button>
  );
}

function OverviewPanel({
  homepageCount,
  faqCount,
  mediaCount,
  enquiryCount,
  totalPurchasePrice,
  enquirySummary,
  enquirySummaryLoading,
  enquirySummaryError,
  draftDateRange,
  appliedDateRange,
  dateRangeError,
  onDateChange,
  onApplyDateRange,
  onNavigate,
}: {
  homepageCount: number;
  faqCount: number;
  mediaCount: number;
  enquiryCount: number;
  totalPurchasePrice: number;
  enquirySummary: AdminEnquirySummary | undefined;
  enquirySummaryLoading: boolean;
  enquirySummaryError: boolean;
  draftDateRange: EnquiryDateRange;
  appliedDateRange: EnquiryDateRange;
  dateRangeError: string | null;
  onDateChange: (field: keyof EnquiryDateRange, value: string) => void;
  onApplyDateRange: () => void;
  onNavigate: (section: DashboardSection) => void;
}) {
  return (
    <div className="admin-panel-stack">
      <section className="admin-welcome-card">
        <div>
          <p className="admin-kicker">GOOD TO SEE YOU</p>
          <h2>Make the next detail count</h2>
          <p>Keep the public Driva experience clear, current and ready for every buyer.</p>
        </div>
        <div className="admin-welcome-orbit" aria-hidden="true">
          <span />
          <span />
          <strong>D</strong>
        </div>
      </section>

      <div className="admin-stats-grid">
        <AdminStat label="Active benefits" value={homepageCount} detail="Homepage trust signals" />
        <AdminStat label="FAQ entries" value={faqCount} detail="Questions answered" />
        <AdminStat label="Media assets" value={mediaCount} detail="WebP-ready library" />
        <AdminStat label="Vehicle enquiries" value={enquiryCount} detail="Customer interest" />
        <AdminStat
          label="Total purchase price"
          value={formatCurrency(totalPurchasePrice)}
          detail="Completed purchases"
        />
      </div>

      <EnquiryOverview
        summary={enquirySummary}
        isLoading={enquirySummaryLoading}
        isError={enquirySummaryError}
        draftDateRange={draftDateRange}
        appliedDateRange={appliedDateRange}
        dateRangeError={dateRangeError}
        onDateChange={onDateChange}
        onApplyDateRange={onApplyDateRange}
      />

      <section className="admin-quick-actions">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">QUICK ACTIONS</p>
            <h2>Keep the storefront moving</h2>
          </div>
        </div>
        <div className="admin-action-grid">
          <button type="button" onClick={() => onNavigate('homepage')}>
            <FileText size={19} />
            <span>Edit homepage content</span>
            <ArrowUpRight size={16} />
          </button>
          <button type="button" onClick={() => onNavigate('media')}>
            <UploadCloud size={19} />
            <span>Upload a new image</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function AdminStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
};

const enquiryStatusDefinitions: Array<{
  key: VehicleEnquiryStatus;
  label: string;
  color: string;
}> = [
  { key: 'NEW', label: 'New', color: '#246fd4' },
  { key: 'CONTACTED', label: 'Contacted', color: '#7195c9' },
  { key: 'FOLLOW_UP', label: 'Follow-up', color: '#9e78cf' },
  { key: 'PURCHASED', label: 'Purchased', color: '#3d9d71' },
  { key: 'LOST', label: 'Lost', color: '#c77b72' },
  { key: 'CLOSED', label: 'Closed', color: '#8e98a4' },
];

function EnquiryOverview({
  summary,
  isLoading,
  isError,
  draftDateRange,
  appliedDateRange,
  dateRangeError,
  onDateChange,
  onApplyDateRange,
}: {
  summary: AdminEnquirySummary | undefined;
  isLoading: boolean;
  isError: boolean;
  draftDateRange: EnquiryDateRange;
  appliedDateRange: EnquiryDateRange;
  dateRangeError: string | null;
  onDateChange: (field: keyof EnquiryDateRange, value: string) => void;
  onApplyDateRange: () => void;
}) {
  const statusCounts = summary?.statusCounts ?? {
    NEW: 0,
    CONTACTED: 0,
    FOLLOW_UP: 0,
    PURCHASED: 0,
    LOST: 0,
    CLOSED: 0,
  };

  return (
    <section className="admin-enquiry-overview">
      <div className="admin-enquiry-overview-heading">
        <div>
          <p className="admin-kicker">ENQUIRY PERFORMANCE</p>
          <h2>Customer interest at a glance</h2>
          <p>
            {`Showing ${formatHumanDate(appliedDateRange.from)} – ${formatHumanDate(appliedDateRange.to)}`}
          </p>
        </div>
        <form
          className="admin-date-range-form"
          onSubmit={(event) => {
            event.preventDefault();
            onApplyDateRange();
          }}
        >
          <label>
            <span>From</span>
            <span className="admin-date-input">
              <CalendarDays size={15} aria-hidden="true" />
              <input
                type="date"
                aria-label="From date"
                value={draftDateRange.from}
                onChange={(event) => onDateChange('from', event.target.value)}
              />
            </span>
          </label>
          <label>
            <span>To</span>
            <span className="admin-date-input">
              <CalendarDays size={15} aria-hidden="true" />
              <input
                type="date"
                aria-label="To date"
                value={draftDateRange.to}
                onChange={(event) => onDateChange('to', event.target.value)}
              />
            </span>
          </label>
          <button className="admin-primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Apply'}
          </button>
        </form>
      </div>

      {dateRangeError ? (
        <p className="admin-form-error" role="alert">
          {dateRangeError}
        </p>
      ) : null}
      {isError ? (
        <p className="admin-form-error" role="alert">
          We couldn’t load enquiry analytics for this date range.
        </p>
      ) : null}

      <div className="admin-enquiry-kpis">
        <AdminAnalyticsMetric label="Total enquiries" value={summary?.totalVehicleEnquiries ?? 0} />
        <AdminAnalyticsMetric label="Purchased" value={summary?.purchasedEnquiries ?? 0} />
        <AdminAnalyticsMetric
          label="Purchase value"
          value={formatCurrency(summary?.totalPurchasePrice ?? 0)}
        />
      </div>

      <div className="admin-enquiry-charts">
        <StatusBars statusCounts={statusCounts} />
        <EnquiryTrendChart points={summary?.timeline ?? []} />
      </div>
    </section>
  );
}

function AdminAnalyticsMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="admin-analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusBars({ statusCounts }: { statusCounts: Record<VehicleEnquiryStatus, number> }) {
  const maximum = Math.max(...enquiryStatusDefinitions.map(({ key }) => statusCounts[key]), 1);

  return (
    <div className="admin-chart-card admin-status-bars" aria-labelledby="status-bars-title">
      <div className="admin-chart-heading">
        <div>
          <p className="admin-kicker">PIPELINE</p>
          <h3 id="status-bars-title">Enquiries by status</h3>
        </div>
      </div>
      <div className="admin-status-bars-list" role="list">
        {enquiryStatusDefinitions.map((definition) => {
          const count = statusCounts[definition.key];
          return (
            <div className="admin-status-bar-row" key={definition.key} role="listitem">
              <span>{definition.label}</span>
              <span className="admin-status-bar-track">
                <span
                  className="admin-status-bar-fill"
                  style={{
                    width: `${(count / maximum) * 100}%`,
                    backgroundColor: definition.color,
                  }}
                />
              </span>
              <strong>{count}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EnquiryTrendChart({ points }: { points: AdminEnquirySummary['timeline'] }) {
  const width = 720;
  const height = 260;
  const padding = { top: 20, right: 56, bottom: 44, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximumEnquiries = Math.max(...points.map((point) => point.enquiryCount), 1);
  const maximumPurchaseValue = Math.max(...points.map((point) => point.purchaseValue), 1);
  const xFor = (index: number) =>
    points.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (index / (points.length - 1)) * plotWidth;
  const yForEnquiries = (value: number) =>
    padding.top + plotHeight - (value / maximumEnquiries) * plotHeight;
  const yForPurchaseValue = (value: number) =>
    padding.top + plotHeight - (value / maximumPurchaseValue) * plotHeight;
  const barWidth = Math.min(28, Math.max(8, plotWidth / Math.max(points.length * 1.8, 1)));
  const linePoints = points
    .map((point, index) => `${xFor(index)},${yForEnquiries(point.enquiryCount)}`)
    .join(' ');
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="admin-chart-card admin-trend-chart" aria-labelledby="trend-chart-title">
      <div className="admin-chart-heading">
        <div>
          <p className="admin-kicker">TREND</p>
          <h3 id="trend-chart-title">Enquiries &amp; purchase value</h3>
        </div>
        <div className="admin-chart-legend" aria-hidden="true">
          <span>
            <i className="admin-legend-line" /> Enquiries
          </span>
          <span>
            <i className="admin-legend-bar" /> Purchase value
          </span>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="admin-chart-empty">No enquiry activity in this date range.</div>
      ) : (
        <svg
          className="admin-trend-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Enquiry count and purchase value over the selected date range"
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = padding.top + plotHeight - ratio * plotHeight;
            return (
              <g key={ratio}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end">
                  {Math.round(maximumEnquiries * ratio)}
                </text>
                <text x={width - padding.right + 8} y={y + 4}>
                  {formatCompactCurrency(maximumPurchaseValue * ratio)}
                </text>
              </g>
            );
          })}
          {points.map((point, index) => {
            const x = xFor(index);
            const purchaseY = yForPurchaseValue(point.purchaseValue);
            return (
              <rect
                className="admin-trend-purchase-bar"
                key={`${point.date}-bar`}
                x={x - barWidth / 2}
                y={purchaseY}
                width={barWidth}
                height={padding.top + plotHeight - purchaseY}
                rx="4"
              />
            );
          })}
          <polyline className="admin-trend-enquiry-line" points={linePoints} />
          {points.map((point, index) =>
            index % labelStep === 0 || index === points.length - 1 ? (
              <text
                className="admin-trend-label"
                key={`${point.date}-label`}
                x={xFor(index)}
                y={height - 15}
                textAnchor="middle"
              >
                {point.label}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}

function HomepagePanel({
  content,
  mediaAssets,
  isLoading,
  isError,
  onRetry,
  homepageSection,
  onNavigate,
  onSaved,
}: {
  content: Awaited<ReturnType<typeof fetchAdminHomepage>> | undefined;
  mediaAssets: MediaAsset[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  homepageSection: HomepageSection;
  onNavigate: (section: HomepageSection) => void;
  onSaved: (updated: Awaited<ReturnType<typeof fetchAdminHomepage>>) => void;
}) {
  if (isLoading) return <div className="admin-empty-state">Loading homepage content…</div>;
  if (isError || !content)
    return (
      <div className="admin-empty-state admin-query-error" role="alert">
        <p>We couldn’t load the homepage content.</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  return (
    <AdminHomepageWorkspace
      key={homepageSection}
      section={homepageSection}
      initialContent={content}
      mediaAssets={mediaAssets}
      onSaved={onSaved}
      onOpenSection={onNavigate}
    />
  );
}

function MediaPanel({
  media,
  queryClient,
  showSnackbar,
}: {
  media: MediaAsset[];
  queryClient: ReturnType<typeof useQueryClient>;
  showSnackbar: (options: { message: string; tone?: 'success' | 'error' | 'info' }) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: uploadMediaAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      showSnackbar({ message: 'Image uploaded successfully', tone: 'success' });
    },
    onError: () => {
      setUploadError('Upload failed. Use a JPEG, PNG or WebP image under 10 MB.');
      showSnackbar({ message: 'Image could not be uploaded.', tone: 'error' });
    },
  });
  const remove = useMutation({
    mutationFn: deleteMediaAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      showSnackbar({ message: 'Image deleted successfully', tone: 'success' });
    },
    onError: () => showSnackbar({ message: 'Image could not be deleted.', tone: 'error' }),
  });

  const handleFile = (file: File | undefined) => {
    setUploadError(null);
    if (file) upload.mutate(file);
  };

  return (
    <div className="admin-panel-stack admin-media-workspace">
      <section className="admin-section-heading admin-media-heading">
        <div>
          <p className="admin-kicker">ASSET LIBRARY</p>
          <h2>Images that make the story tangible.</h2>
          <p>
            Uploads are converted to high-quality WebP and stored in the project media directory.
          </p>
        </div>
        <label className="admin-upload-button">
          <UploadCloud size={17} />
          {upload.isPending ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => handleFile(event.target.files?.[0])}
            disabled={upload.isPending}
          />
        </label>
      </section>
      {uploadError ? (
        <p className="admin-form-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      {media.length === 0 ? (
        <div className="admin-empty-state">No media assets uploaded yet.</div>
      ) : (
        <div className="admin-media-grid admin-media-editorial-grid">
          {media.map((asset) => (
            <article className="admin-media-card admin-media-editorial-card" key={asset.id}>
              <img src={resolveMediaUrl(asset.url)} alt={asset.originalName} />
              <div>
                <strong>{asset.originalName}</strong>
                <small>
                  {asset.width} × {asset.height} · {(asset.bytes / 1024).toFixed(1)} KB
                </small>
              </div>
              <button
                type="button"
                aria-label={`Delete ${asset.originalName}`}
                onClick={() => remove.mutate(asset.id)}
                disabled={remove.isPending}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
