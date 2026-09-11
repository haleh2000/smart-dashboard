import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { seriesColor } from '../chartColors';
import { ChartFrame } from './ChartFrame';
import { ChartTooltipBox } from './ChartTooltipBox';
import { axisNumber, axisTick, gridStroke } from './chartKit';
import type { ColumnItem } from './ColumnChart';

interface VolumeAreaChartProps {
  label: string;
  /** In display order (e.g. hour 0 → 23). */
  items: readonly (ColumnItem & { key: string })[];
  series?: number;
  selectedKey?: string;
  /** Clicking the plot selects the hovered point. */
  onSelect?: (key: string) => void;
  height?: number;
}

/** One series over an ordered axis (calls per hour of day), as a soft gradient area. */
export function VolumeAreaChart({
  label,
  items,
  series = 0,
  selectedKey,
  onSelect,
  height = 260,
}: VolumeAreaChartProps) {
  const gradientId = `area-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const color = seriesColor(series);
  const selectedLabel = items.find((item) => item.key === selectedKey)?.label;

  return (
    <ChartFrame height={height} label={label}>
      <AreaChart
        data={[...items]}
        margin={{ top: 12, right: 8, left: 8, bottom: 4 }}
        onClick={(state) => {
          const item = items[Number(state?.activeTooltipIndex)];
          if (item) onSelect?.(item.key);
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          reversed
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
          interval={2}
        />
        <YAxis
          orientation="right"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={axisNumber}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: color, strokeDasharray: '4 4' }}
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as ColumnItem | undefined;
            return active && item ? (
              <ChartTooltipBox
                title={item.label}
                rows={[{ name: label, value: item.value, share: item.share, color }]}
              />
            ) : null;
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface)', cursor: 'pointer' }}
          dot={(props) => {
            const { cx, cy, payload, index } = props as {
              cx: number;
              cy: number;
              payload: ColumnItem;
              index: number;
            };
            return payload.label === selectedLabel ? (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={6}
                fill={color}
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            ) : (
              <g key={index} />
            );
          }}
          animationDuration={700}
        />
      </AreaChart>
    </ChartFrame>
  );
}
