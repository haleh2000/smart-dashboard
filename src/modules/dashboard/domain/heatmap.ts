import type { Heatmap } from './analytics';

export interface HeatmapSlot {
  weekday: number;
  hour: number;
  count: number;
}

export interface HeatmapPeaks {
  total: number;
  /** The single busiest weekday × hour. */
  peak: HeatmapSlot;
  busiestDay: { weekday: number; count: number };
  busiestHour: { hour: number; count: number };
  /** Quietest hour among the hours that had calls at all. */
  quietestHour?: { hour: number; count: number };
  /** Busiest slots, most calls first. */
  topSlots: HeatmapSlot[];
  /** Calls per hour across the week (24 values). */
  hourTotals: number[];
  /** Calls per weekday (7 values, Saturday first). */
  dayTotals: number[];
}

const maxBy = <T>(items: readonly T[], value: (item: T) => number) =>
  items.reduce((best, item) => (value(item) > value(best) ? item : best), items[0]!);

/** «پیک تماس»: where the busiest days, hours and slots of the week are. */
export const heatmapPeaks = ({ counts }: Heatmap, topCount = 5): HeatmapPeaks => {
  const hourTotals = Array.from({ length: 24 }, (_, hour) =>
    counts.reduce((sum, row) => sum + (row[hour] ?? 0), 0),
  );
  const dayTotals = Array.from({ length: 7 }, (_, day) =>
    (counts[day] ?? []).reduce((sum, n) => sum + n, 0),
  );
  const slots = counts.flatMap((row, weekday) =>
    row.map((count, hour) => ({ weekday, hour, count })),
  );
  const sorted = slots
    .filter((slot) => slot.count > 0)
    .sort((a, b) => b.count - a.count || a.weekday - b.weekday || a.hour - b.hour);
  const hours = hourTotals.map((count, hour) => ({ hour, count }));
  const active = hours.filter((h) => h.count > 0);

  return {
    total: dayTotals.reduce((sum, n) => sum + n, 0),
    peak: sorted[0] ?? { weekday: 0, hour: 0, count: 0 },
    busiestDay: maxBy(
      dayTotals.map((count, weekday) => ({ weekday, count })),
      (d) => d.count,
    ),
    busiestHour: maxBy(hours, (h) => h.count),
    quietestHour: active.length
      ? active.reduce((low, h) => (h.count < low.count ? h : low), active[0]!)
      : undefined,
    topSlots: sorted.slice(0, topCount),
    hourTotals,
    dayTotals,
  };
};
