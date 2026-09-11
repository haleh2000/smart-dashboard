import { formatPersianNumber } from '@/shared/lib/format';

/** Recharts styling pulled from the design tokens, so light and dark themes follow for free. */
export const axisTick = { fill: 'var(--color-muted)', fontSize: 12 } as const;
export const gridStroke = 'var(--chart-grid)';
export const cursorFill = 'var(--color-primary-soft)';

/** Compact Persian axis numbers: «۱٫۲ هزار» past a thousand. */
export const axisNumber = (value: number) =>
  Math.abs(value) >= 1000
    ? `${formatPersianNumber((value / 1000).toFixed(1).replace(/\.0$/, '')).replace('.', '٫')} هزار`
    : formatPersianNumber(value);

/** Long category names are cut on the axis; the tooltip shows them in full. */
export const shortLabel = (value: string, max = 14) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Opacity of a mark when another value of the same chart is selected. */
export const markOpacity = (value: string, selected: string | undefined) =>
  selected === undefined || selected === value ? 1 : 0.3;
