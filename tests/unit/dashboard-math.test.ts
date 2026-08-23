import { describe, expect, it } from "vitest";

import {
  MS_PER_DAY,
  averagePesewas,
  dashboardWindow,
  percentChange,
  utcDayKey,
} from "@/lib/admin/dashboard-math";

describe("percentChange", () => {
  it("returns null when there is no baseline, rather than a fabricated +100%", () => {
    expect(percentChange(500, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });

  it("reports growth and decline against the previous period", () => {
    expect(percentChange(150, 100)).toBeCloseTo(50);
    expect(percentChange(50, 100)).toBeCloseTo(-50);
    expect(percentChange(100, 100)).toBe(0);
  });

  it("reports a full decline when the current period is empty", () => {
    expect(percentChange(0, 250)).toBe(-100);
  });
});

describe("averagePesewas", () => {
  it("is zero when there is nothing to average", () => {
    expect(averagePesewas(0, 0)).toBe(0);
    expect(averagePesewas(1000, 0)).toBe(0);
  });

  it("stays an integer number of subunits", () => {
    expect(averagePesewas(1000, 3)).toBe(333);
    expect(Number.isInteger(averagePesewas(24900, 7))).toBe(true);
  });
});

describe("dashboardWindow", () => {
  const now = new Date("2026-08-23T18:42:00Z");

  it("covers `range` days inclusive of today", () => {
    const { currentStart } = dashboardWindow(30, now);
    expect(utcDayKey(currentStart)).toBe("2026-07-25");

    const days =
      (Date.UTC(2026, 7, 23) - currentStart.getTime()) / MS_PER_DAY + 1;
    expect(days).toBe(30);
  });

  it("places the comparison window immediately before, with no overlap or gap", () => {
    const { currentStart, previousStart } = dashboardWindow(30, now);
    expect(utcDayKey(previousStart)).toBe("2026-06-25");
    expect((currentStart.getTime() - previousStart.getTime()) / MS_PER_DAY).toBe(30);
  });

  it("ignores the time of day so buckets align to UTC midnight", () => {
    const early = dashboardWindow(7, new Date("2026-08-23T00:00:01Z"));
    const late = dashboardWindow(7, new Date("2026-08-23T23:59:59Z"));
    expect(early.currentStart.toISOString()).toBe(late.currentStart.toISOString());
    expect(early.currentStart.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });
});
