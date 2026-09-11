/** Relative time windows offered by every «فیلتر زمانی» (dashboard, tickets, calls). */
export const PERIODS = ['today', '7d', '30d', '90d', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export interface DateRange {
  from: Date;
  /** Exclusive upper bound. */
  to: Date;
}

const DAYS: Record<Exclude<Period, 'all'>, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Turns a preset into concrete dates, aligned to whole days so the result (and every query
 * key built from it) stays stable for the whole day. `all` has no range.
 */
export const periodRange = (period: Period, now: Date = new Date()): DateRange | undefined => {
  if (period === 'all') return undefined;
  const to = startOfDay(now);
  to.setDate(to.getDate() + 1);
  const from = new Date(to);
  from.setDate(from.getDate() - DAYS[period]);
  return { from, to };
};

export const isWithinRange = (date: Date, range: DateRange | undefined) =>
  !range || (date >= range.from && date < range.to);

export const isPeriod = (value: unknown): value is Period =>
  (PERIODS as readonly unknown[]).includes(value);
