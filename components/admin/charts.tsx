import { cn } from "@/lib/utils";
import { formatPesewas } from "@/lib/money";
import type { RevenuePoint } from "@/lib/admin/queries";

/**
 * Server-rendered SVG charts. No chart library and no client JS: every value is
 * reachable from axis ticks, a direct endpoint label, or the native <title>
 * tooltip, so nothing is gated behind hover.
 *
 * The palette is deliberately achromatic (see globals.css) -- these are all
 * single-series charts, so color carries no identity and the mark uses the
 * one --chart-series step that clears contrast on the card surface in each
 * theme. Status meaning is never carried by the mark; it lives in the labelled,
 * icon-bearing deltas beside it.
 */

const SERIES = "var(--chart-series)";
const GRID = "var(--border)";
const SURFACE = "var(--card)";

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatDayLabel(isoDay: string): string {
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Compact cedi label for axis ticks -- full precision lives in the tooltip. */
function compactCedis(pesewas: number): string {
  const cedis = pesewas / 100;
  if (cedis >= 1000) return `${Math.round(cedis / 100) / 10}k`;
  return String(Math.round(cedis));
}

export function RevenueAreaChart({ series }: { series: RevenuePoint[] }) {
  const hasRevenue = series.some((point) => point.revenuePesewas > 0);

  if (!hasRevenue) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        No paid revenue in this period yet.
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padding = { top: 16, right: 64, bottom: 28, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = niceCeiling(Math.max(...series.map((p) => p.revenuePesewas)));
  const stepX = series.length > 1 ? plotWidth / (series.length - 1) : 0;

  const x = (index: number) => padding.left + index * stepX;
  const y = (value: number) => padding.top + plotHeight * (1 - value / maxValue);

  const linePath = series
    .map((point, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(point.revenuePesewas)}`)
    .join(" ");
  const areaPath = `${linePath} L${x(series.length - 1)} ${padding.top + plotHeight} L${padding.left} ${padding.top + plotHeight} Z`;

  const last = series[series.length - 1];
  const ticks = [0, maxValue / 2, maxValue];

  // Label the peak rather than the endpoint: the latest day is frequently zero
  // (no sales yet today), and a "0" label pinned to the baseline is noise. The
  // peak is always the informative single label, and per-day values stay
  // reachable from the axis ticks and the hover titles below.
  const peakIndex = series.reduce(
    (best, point, i) => (point.revenuePesewas > series[best].revenuePesewas ? i : best),
    0,
  );
  const peak = series[peakIndex];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Revenue per day over the last ${series.length} days`}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={padding.left + plotWidth}
            y1={y(tick)}
            y2={y(tick)}
            stroke={GRID}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={padding.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px] tabular-nums"
          >
            {compactCedis(tick)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill={SERIES} fillOpacity={0.1} />
      <path
        d={linePath}
        fill="none"
        stroke={SERIES}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Peak marker: 8px dot ringed in the surface color so it stays legible
          where it sits on the line. */}
      <circle cx={x(peakIndex)} cy={y(peak.revenuePesewas)} r={6} fill={SURFACE} />
      <circle cx={x(peakIndex)} cy={y(peak.revenuePesewas)} r={4} fill={SERIES} />
      <text
        x={x(peakIndex) + 10}
        y={y(peak.revenuePesewas) + 4}
        className="fill-foreground text-[11px] font-medium"
      >
        {compactCedis(peak.revenuePesewas)}
      </text>

      {series.map((point, i) => (
        <rect
          key={point.date}
          x={x(i) - stepX / 2}
          y={padding.top}
          width={Math.max(stepX, 1)}
          height={plotHeight}
          fill="transparent"
        >
          <title>{`${formatDayLabel(point.date)} — ${formatPesewas(point.revenuePesewas)} · ${point.orders} order${point.orders === 1 ? "" : "s"}`}</title>
        </rect>
      ))}

      <text
        x={padding.left}
        y={height - 8}
        className="fill-muted-foreground text-[11px]"
      >
        {formatDayLabel(series[0].date)}
      </text>
      <text
        x={padding.left + plotWidth}
        y={height - 8}
        textAnchor="end"
        className="fill-muted-foreground text-[11px]"
      >
        {formatDayLabel(last.date)}
      </text>
    </svg>
  );
}

/**
 * Trend line for a stat tile: the run is de-emphasised, the current value is
 * the accent, matching the tile's own label/value/delta hierarchy.
 */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((v) => v === 0)) {
    return <div className="h-8" aria-hidden="true" />;
  }

  const width = 120;
  const height = 32;
  const max = Math.max(...values);
  const stepX = width / (values.length - 1);
  const y = (value: number) => height - 3 - (height - 6) * (max === 0 ? 0 : value / max);

  const path = values
    .map((value, i) => `${i === 0 ? "M" : "L"}${i * stepX} ${y(value)}`)
    .join(" ");
  const lastX = width;
  const lastY = y(values[values.length - 1]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={path}
        fill="none"
        stroke={SERIES}
        strokeOpacity={0.45}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX - 1} cy={lastY} r={4} fill={SURFACE} />
      <circle cx={lastX - 1} cy={lastY} r={2.5} fill={SERIES} />
    </svg>
  );
}

/**
 * Order-status breakdown. One measure across labelled categories, so every bar
 * is the same hue -- coloring bars by size would double-encode length as color.
 */
export function StatusBars({
  data,
  className,
}: {
  data: { status: string; count: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {data.map((row) => (
        <div key={row.status} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3">
          <span className="text-sm text-muted-foreground capitalize">{row.status}</span>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-r-[4px] bg-chart-series"
              style={{ width: `${Math.max((row.count / max) * 100, row.count > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-right text-sm font-medium tabular-nums">{row.count}</span>
        </div>
      ))}
    </div>
  );
}
