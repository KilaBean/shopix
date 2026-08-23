import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Sparkline } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

/**
 * Delta direction is carried by an icon and a worded comparison as well as
 * color, so it never reads by color alone. Status hues are intentionally
 * separate from the achromatic series palette used by the charts.
 */
function Delta({
  pct,
  comparisonLabel,
}: {
  pct: number | null;
  comparisonLabel: string;
}) {
  if (pct === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" aria-hidden="true" />
        No {comparisonLabel} to compare
      </p>
    );
  }

  const rounded = Math.round(pct * 10) / 10;
  const flat = rounded === 0;
  const up = rounded > 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        flat
          ? "text-muted-foreground"
          : up
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {flat ? "No change" : `${up ? "+" : ""}${rounded}%`}
      <span className="font-normal text-muted-foreground">vs {comparisonLabel}</span>
    </p>
  );
}

export function StatTile({
  label,
  value,
  deltaPct,
  comparisonLabel,
  trend,
  hero = false,
  className,
}: {
  label: string;
  value: ReactNode;
  deltaPct?: number | null;
  comparisonLabel?: string;
  trend?: number[];
  /** The one lead figure on the page -- proportional figures, 48px. */
  hero?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-xl border bg-card p-5",
        className,
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-semibold tracking-tight",
            hero ? "text-4xl sm:text-5xl" : "text-2xl",
          )}
        >
          {value}
        </p>
        {deltaPct !== undefined && comparisonLabel ? (
          <div className="mt-2">
            <Delta pct={deltaPct} comparisonLabel={comparisonLabel} />
          </div>
        ) : null}
      </div>
      {trend ? <Sparkline values={trend} /> : null}
    </div>
  );
}

/**
 * Compact counter for figures that describe the store right now rather than
 * the selected window -- visually distinct so they aren't misread as windowed.
 */
export function CounterTile({
  label,
  value,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "neutral" | "warning" | "critical";
  href?: string;
}) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : tone === "critical"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
