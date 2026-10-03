import type { ReactNode } from 'react';

interface Point {
  label: string;
  value: number;
}

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export function AnalyticsLineChart({
  points,
  series,
  ariaLabel = 'Analytics trend chart',
}: {
  points: Array<{ label: string; values: number[] }>;
  series: Array<{ label: string; color: string }>;
  ariaLabel?: string;
}) {
  const width = 720;
  const height = 250;
  const padding = { top: 20, right: 24, bottom: 38, left: 42 };
  const max = Math.max(...points.flatMap((point) => point.values), 1);
  const x = (index: number) =>
    points.length <= 1
      ? width / 2
      : padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top + (height - padding.top - padding.bottom) * (1 - value / max);
  return (
    <svg
      className="admin-analytics-svg analytics-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {[0, 0.33, 0.66, 1].map((ratio) => (
        <g key={ratio}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(max * ratio)}
            y2={y(max * ratio)}
          />
          <text x={padding.left - 8} y={y(max * ratio) + 4} textAnchor="end">
            {formatNumber(Math.round(max * ratio))}
          </text>
        </g>
      ))}
      {points.map((point, index) => (
        <line
          className="analytics-chart-vertical-grid"
          key={`vertical-grid-${point.label}-${index}`}
          x1={x(index)}
          x2={x(index)}
          y1={padding.top}
          y2={height - padding.bottom}
        />
      ))}
      {series.map((item, seriesIndex) => {
        const linePoints = points
          .map((point, index) => `${x(index)},${y(point.values[seriesIndex] ?? 0)}`)
          .join(' ');
        const areaPoints = points.length
          ? `${linePoints} ${x(points.length - 1)},${height - padding.bottom} ${x(0)},${
              height - padding.bottom
            }`
          : '';
        return (
          <g key={item.label}>
            {areaPoints ? (
              <polygon
                className="analytics-chart-area"
                points={areaPoints}
                style={{ fill: item.color }}
              />
            ) : null}
            <polyline
              className="admin-analytics-line"
              style={{ stroke: item.color }}
              points={linePoints}
            />
            {points.map((point, index) => (
              <circle
                key={`${item.label}-${point.label}-${index}`}
                cx={x(index)}
                cy={y(point.values[seriesIndex] ?? 0)}
                r="2.4"
                style={{ fill: item.color }}
              />
            ))}
          </g>
        );
      })}
      {points.map((point, index) =>
        index === 0 ||
        index === points.length - 1 ||
        points.length <= 8 ||
        index % Math.max(1, Math.ceil(points.length / 6)) === 0 ? (
          <text key={`${point.label}-${index}`} x={x(index)} y={height - 12} textAnchor="middle">
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function AnalyticsBarChart({
  points,
  color = '#4052ff',
}: {
  points: Point[];
  color?: string;
}) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  const visualMaximum = maximum / 0.9;
  return (
    <div className="admin-analytics-bars" role="list">
      {points.length === 0 ? (
        <p className="admin-chart-empty">No data in this date range.</p>
      ) : null}
      {points.map((point) => (
        <div className="admin-analytics-bar-row" key={point.label} role="listitem">
          <span title={point.label}>{point.label}</span>
          <span className="admin-analytics-bar-track">
            <span
              style={{
                width: `${Math.min(100, (point.value / visualMaximum) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </span>
          <strong>{formatNumber(point.value)}</strong>
        </div>
      ))}
    </div>
  );
}

const sourcePieColors = [
  '#4052ff',
  '#25b77a',
  '#a987f5',
  '#8ab7ff',
  '#efa963',
  '#9daac4',
  '#2a43ad',
  '#287f83',
];

export function AnalyticsSourcePieChart({ points }: { points: Point[] }) {
  const visiblePoints = points.filter((point) => point.value > 0);
  const total = visiblePoints.reduce((sum, point) => sum + point.value, 0);

  if (total === 0) return <p className="admin-chart-empty">No source data in this date range.</p>;

  let cursor = 0;
  const segments = visiblePoints.map((point, index) => {
    const start = cursor;
    cursor += (point.value / total) * 100;
    return `${sourcePieColors[index % sourcePieColors.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="analytics-source-pie-layout">
      <div
        className="analytics-source-pie"
        role="img"
        aria-label={`Pie chart of ${formatNumber(total)} visits by source`}
        style={{ background: `conic-gradient(${segments.join(', ')})` }}
      >
        {visiblePoints[0].value / total >= 0.5 ? (
          <span aria-hidden="true">{Math.round((visiblePoints[0].value / total) * 100)}%</span>
        ) : null}
      </div>
      <div className="analytics-source-pie-legend" role="list" aria-label="Source breakdown">
        {visiblePoints.map((point, index) => (
          <div className="analytics-source-pie-legend-row" key={point.label} role="listitem">
            <span className="analytics-source-pie-label">
              <i
                aria-hidden="true"
                style={{ backgroundColor: sourcePieColors[index % sourcePieColors.length] }}
              />
              <span>{point.label}</span>
            </span>
            <span className="analytics-source-pie-values">
              <strong>{Math.round((point.value / total) * 100)}%</strong>
              <span>· {formatNumber(point.value)} visits</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsColumnChart({
  points,
  color = '#1823d7',
}: {
  points: Point[];
  color?: string;
}) {
  const width = 720;
  const height = 220;
  const padding = { top: 18, right: 20, bottom: 38, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(...points.map((point) => point.value), 1);
  const slotWidth = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.max(4, Math.min(26, slotWidth * 0.58));
  const labelStep = Math.max(1, Math.ceil(points.length / 7));

  if (points.length === 0) return <p className="admin-chart-empty">No data in this date range.</p>;

  return (
    <svg
      className="admin-analytics-svg admin-analytics-column-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Car detail views by day"
    >
      {[0, 0.5, 1].map((ratio) => {
        const y = padding.top + plotHeight * (1 - ratio);
        return (
          <g key={ratio}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end">
              {formatNumber(Math.round(maximum * ratio))}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const x = padding.left + slotWidth * index + (slotWidth - barWidth) / 2;
        const barHeight = (point.value / maximum) * plotHeight;
        return (
          <g key={`${point.label}-${index}`}>
            <rect
              className="admin-analytics-column"
              x={x}
              y={padding.top + plotHeight - barHeight}
              width={barWidth}
              height={Math.max(2, barHeight)}
              rx="4"
              style={{ fill: color }}
            />
            {index % labelStep === 0 || index === points.length - 1 ? (
              <text x={x + barWidth / 2} y={height - 12} textAnchor="middle">
                {point.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function AnalyticsGroupedBarChart({
  points,
  series,
}: {
  points: Array<{ label: string; values: number[] }>;
  series: Array<{ label: string; color: string }>;
}) {
  const maximum = Math.max(...points.flatMap((point) => point.values), 1);
  return (
    <div className="admin-analytics-grouped-bars" role="list">
      <div className="admin-chart-legend">
        {series.map((item) => (
          <span key={item.label}>
            <i className="admin-legend-bar" style={{ backgroundColor: item.color }} /> {item.label}
          </span>
        ))}
      </div>
      {points.length === 0 ? (
        <p className="admin-chart-empty">No data in this date range.</p>
      ) : null}
      {points.map((point) => (
        <div className="admin-analytics-grouped-row" key={point.label} role="listitem">
          <span title={point.label}>{point.label}</span>
          <div>
            {point.values.map((value, index) => (
              <span
                key={`${point.label}-${series[index]?.label ?? index}`}
                style={{
                  width: `${Math.max(value ? 2 : 0, (value / maximum) * 100)}%`,
                  backgroundColor: series[index]?.color,
                }}
                title={`${series[index]?.label ?? 'Value'}: ${formatNumber(value)}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsFunnel({ points }: { points: Point[] }) {
  const maximum = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="admin-analytics-funnel">
      {points.map((point) => (
        <div className="admin-analytics-funnel-step" key={point.label}>
          <span style={{ width: `${Math.max(8, (point.value / maximum) * 100)}%` }} />
          <div>
            <strong>{point.label}</strong>
            <b>{formatNumber(point.value)}</b>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChartCard({
  title,
  eyebrow,
  subtitle,
  headerAside,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  headerAside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`admin-analytics-chart-card${className ? ` ${className}` : ''}`}>
      <div className="admin-card-heading">
        <div>
          {eyebrow ? <p className="admin-kicker">{eyebrow}</p> : null}
          <h3>{title}</h3>
          {subtitle ? <p className="admin-analytics-card-subtitle">{subtitle}</p> : null}
        </div>
        {headerAside}
      </div>
      {children}
    </section>
  );
}
