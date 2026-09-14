import { useId, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { seriesColor } from '../chartColors';
import { ChartFrame } from './ChartFrame';
import { ChartTooltipBox } from './ChartTooltipBox';
import { axisTick, cursorFill, markOpacity } from './chartKit';
import type { ColumnItem } from './ColumnChart';

interface HorizontalBarChartProps {
  label: string;
  items: readonly ColumnItem[];
  series?: number;
  selected?: string;
  onSelect?: (label: string) => void;
  format?: (value: number) => string;
  maxVisible?: number;
}

const ROW_HEIGHT = 38;
const DEFAULT_MAX_VISIBLE = 5;

/**
 * A ranking as real bars: category names on the right, bars growing leftwards, the value and
 * share at the bar's end. Clicking a bar cross-filters the dashboard.
 */
export function HorizontalBarChart({
  label,
  items,
  series = 0,
  selected,
  onSelect,
  format = formatPersianNumber,
  maxVisible = DEFAULT_MAX_VISIBLE,
}: HorizontalBarChartProps) {
  const gradientId = `bar-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const color = seriesColor(series);
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = items.length > maxVisible;
  const visibleItems = hasOverflow && !expanded ? items.slice(0, maxVisible) : items;

  const chartHeight = visibleItems.length * ROW_HEIGHT + 16;

  return (
    <>
      <ChartFrame height={chartHeight} label={label}>
        <BarChart
          data={visibleItems}
          layout="vertical"
          margin={{ top: 4, right: 4, left: 156, bottom: 4 }}
          barCategoryGap="22%"
        >
          <defs>
            <linearGradient id={gradientId} x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis type="number" reversed hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="label"
            orientation="right"
            width={156}
            interval={0}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
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
            radius={6}
            background={{ fill: 'var(--chart-track)', radius: 6 }}
            animationDuration={600}
            onClick={(_, index) => {
              const item = visibleItems[index];
              if (item) onSelect?.(item.label);
            }}
          >
            {visibleItems.map((item) => (
              <Cell
                key={item.label}
                fill={`url(#${gradientId})`}
                opacity={markOpacity(item.label, selected)}
              />
            ))}
            <LabelList
              dataKey="value"
              position="left"
              content={({ x, y, width, height, index }) => {
                const item = index === undefined ? undefined : visibleItems[index];
                if (!item) return null;
                const end = Math.min(Number(x), Number(x) + Number(width));
                return (
                  <text
                    x={end - 6}
                    y={Number(y) + Number(height) / 2}
                    dominantBaseline="central"
                    textAnchor="end"
                    fill="var(--color-muted)"
                    fontSize={12}
                  >
                    {format(item.value)}
                    {item.share !== undefined && ` · ${formatPercent(item.share)}`}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ChartFrame>
      {hasOverflow && (
        <div className="bar-chart__toggle-row">
          <button
            type="button"
            className="bar-chart__toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'کمتر' : 'بیشتر'}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
