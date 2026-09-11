import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPersianNumber } from '@/shared/lib/format';
import { seriesColor } from '../chartColors';
import { ChartFrame } from './ChartFrame';
import { ChartTooltipBox } from './ChartTooltipBox';
import { axisNumber, axisTick, cursorFill, gridStroke, markOpacity, shortLabel } from './chartKit';

export interface ColumnItem {
  label: string;
  value: number;
  /** Between 0 and 1; shown in the tooltip. */
  share?: number;
}

interface ColumnChartProps {
  label: string;
  items: readonly ColumnItem[];
  /** Series index (0-based) into the `--chart-series-*` tokens. */
  series?: number;
  selected?: string;
  onSelect?: (label: string) => void;
  height?: number;
  format?: (value: number) => string;
  /** Value labels above each column (off automatically when crowded). */
  showValues?: boolean;
}

/**
 * Vertical columns, largest on the right (RTL). Power BI «%GT Count of Branch by Branch».
 * Clicking a column cross-filters the dashboard; the others fade.
 */
export function ColumnChart({
  label,
  items,
  series = 0,
  selected,
  onSelect,
  height = 280,
  format = formatPersianNumber,
  showValues = true,
}: ColumnChartProps) {
  const gradientId = `col-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const color = seriesColor(series);
  const crowded = items.length > 8;

  return (
    <ChartFrame height={height} label={label}>
      <BarChart data={[...items]} margin={{ top: 24, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          reversed
          interval={0}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
          tickFormatter={(value: string) => shortLabel(value, crowded ? 8 : 14)}
          angle={crowded ? -40 : 0}
          textAnchor={crowded ? 'end' : 'middle'}
          height={crowded ? 56 : 30}
        />
        <YAxis
          orientation="right"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={axisNumber}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: cursorFill, radius: 6 }}
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as ColumnItem | undefined;
            return active && item ? (
              <ChartTooltipBox
                title={item.label}
                format={format}
                rows={[{ name: label, value: item.value, share: item.share, color }]}
              />
            ) : null;
          }}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          maxBarSize={46}
          animationDuration={600}
          onClick={(_, index) => {
            const item = items[index];
            if (item) onSelect?.(item.label);
          }}
        >
          {items.map((item) => (
            <Cell
              key={item.label}
              fill={`url(#${gradientId})`}
              opacity={markOpacity(item.label, selected)}
            />
          ))}
          {showValues && !crowded && (
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value) => format(Number(value))}
              style={{ fill: 'var(--color-muted)', fontSize: 12 }}
            />
          )}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
