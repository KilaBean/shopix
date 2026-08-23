/**
 * Pure helpers behind the admin dashboard's windowed figures. Kept separate
 * from the Supabase query so the period/bucketing arithmetic is unit-testable
 * without a database.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** UTC day key (YYYY-MM-DD) -- buckets and axis labels must agree on the day. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Inclusive window of `range` days ending today (UTC), plus the same-length
 * window immediately before it, used as the comparison baseline.
 */
export function dashboardWindow(
  range: number,
  now: Date,
): { currentStart: Date; previousStart: Date } {
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const currentStart = new Date(startOfToday.getTime() - (range - 1) * MS_PER_DAY);
  const previousStart = new Date(currentStart.getTime() - range * MS_PER_DAY);
  return { currentStart, previousStart };
}

/**
 * Percent change, or null when there is no baseline to compare against.
 *
 * Returning null rather than 0 or 100 matters: a store's first week would
 * otherwise report a fabricated "+100%" against a period in which it had no
 * orders at all.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Integer mean in subunits; 0 when there is nothing to average. */
export function averagePesewas(totalPesewas: number, count: number): number {
  return count === 0 ? 0 : Math.round(totalPesewas / count);
}
