import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatTime } from '@/shared/lib/format';
import type { Trend } from '../../../domain/analytics';
import { seriesColor } from '../chartColors';
import { ChartFrame } from './ChartFrame';
import { ChartTooltipBox } from './ChartTooltipBox';
import { axisNumber, axisTick, gridStroke } from './chartKit';
import { SeriesLegend } from './SeriesLegend';

interface AreaTrendChartProps {
  label: string;
  data: Trend;
  selected?: string;
  onSelect: (series: string) => void;
  height?: number;
}

const FALLBACK_WEEK = 7 * 86_400_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Granularity word for the selected time filter, so the chart reads daily/hourly/weekly. */
const granularityOf = (bucketMs: number) =>
  bucketMs <= HOUR ? 'ساعتی' : bucketMs <= DAY ? 'روزانه' : 'هفتگی';

/**
 * حجم هر بازه برای هر سری به‌صورت خطوط جدا (غیرانباشته) تا هر سری فراز و نشیب خودش را داشته باشد و
 * مرزها با کلِ بازه بالا و پایین نروند؛ پهنای بازه از فیلتر زمانی می‌آید (ساعتی/روزانه/هفتگی)،
 * hover همه سری‌های بازه را نشان می‌دهد و لِجند فیلتر می‌زند.
 */
export function AreaTrendChart({
  label,
  data,
  selected,
  onSelect,
  height = 300,
}: AreaTrendChartProps) {
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const keyOf = (index: number) => `s${index}`;
  const bucketMs = data.bucketMs ?? FALLBACK_WEEK;
  const hourly = bucketMs <= HOUR;
  const title = `${label} (${granularityOf(bucketMs)})`;
  const rows = data.buckets.map((bucket) => {
    const end = new Date(bucket.start.getTime() + bucketMs);
    return {
      label: hourly ? formatTime(bucket.start) : formatDate(bucket.start).slice(5),
      range:
        bucketMs <= DAY
          ? hourly
            ? `${formatDate(bucket.start)} ساعت ${formatTime(bucket.start)}`
            : formatDate(bucket.start)
          : `${formatDate(bucket.start)} تا ${formatDate(end)}`,
      ...Object.fromEntries(data.series.map((s, i) => [keyOf(i), bucket.counts[s] ?? 0])),
    };
  });

  return (
    <>
      <ChartFrame height={height} label={title}>
        <AreaChart data={rows} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
          <defs>
            {data.series.map((s, i) => (
              <linearGradient key={s} id={`${baseId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor(i)} stopOpacity={0.3} />
                <stop offset="100%" stopColor={seriesColor(i)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            reversed
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            minTickGap={16}
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
            cursor={{ stroke: 'var(--color-primary)', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !row) return null;
              const values = data.series.map((s, i) => ({
                name: s,
                value: Number((row as Record<string, unknown>)[keyOf(i)] ?? 0),
                color: seriesColor(i),
              }));
              const total = values.reduce((sum, v) => sum + v.value, 0);
              return (
                <ChartTooltipBox
                  title={row.range}
                  rows={values.map((v) => ({ ...v, share: total ? v.value / total : 0 }))}
                />
              );
            }}
          />
          {data.series.map((s, i) => {
            const dimmed = selected !== undefined && selected !== s;
            return (
              <Area
                key={s}
                type="monotone"
                dataKey={keyOf(i)}
                name={s}
                stroke={seriesColor(i)}
                strokeWidth={2}
                strokeOpacity={dimmed ? 0.25 : 1}
                fill={`url(#${baseId}-${i})`}
                fillOpacity={dimmed ? 0.2 : 1}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                animationDuration={700}
              />
            );
          })}
        </AreaChart>
      </ChartFrame>
      <SeriesLegend
        items={data.series.map((s, i) => ({ label: s, color: seriesColor(i) }))}
        selected={selected}
        onSelect={onSelect}
      />
    </>
  );
}
