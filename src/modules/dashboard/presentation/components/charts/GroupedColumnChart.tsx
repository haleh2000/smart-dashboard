import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { seriesColor } from '../chartColors';
import { ChartFrame } from './ChartFrame';
import { ChartTooltipBox } from './ChartTooltipBox';
import { axisNumber, axisTick, cursorFill, gridStroke, markOpacity, shortLabel } from './chartKit';
import { SeriesLegend } from './SeriesLegend';

export interface GroupedSeries {
  key: string;
  name: string;
  /** Index into the `--chart-series-*` tokens. */
  series: number;
}

interface GroupedColumnChartProps<T extends { label: string }> {
  label: string;
  rows: readonly T[];
  series: readonly GroupedSeries[];
  value: (row: T, key: string) => number;
  selected?: string;
  onSelect?: (label: string) => void;
  height?: number;
}

/** Side-by-side columns per category (e.g. tickets vs. calls per operator). One shared axis. */
export function GroupedColumnChart<T extends { label: string }>({
  label,
  rows,
  series,
  value,
  selected,
  onSelect,
  height = 300,
}: GroupedColumnChartProps<T>) {
  const data = rows.map((row) => ({
    label: row.label,
    ...Object.fromEntries(series.map((s) => [s.key, value(row, s.key)])),
  }));

  return (
    <>
      <ChartFrame height={height} label={label}>
        <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 36 }} barGap={3}>
          <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            reversed
            interval={0}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            tickFormatter={(v: string) => shortLabel(v, 10)}
            angle={-30}
            textAnchor="end"
            height={50}
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
            cursor={{ fill: cursorFill, radius: 6 }}
            content={({ active, payload, label: category }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={String(category)}
                  rows={series.map((s) => {
                    const entry = payload.find((p) => p.dataKey === s.key);
                    return {
                      name: s.name,
                      value: Number(entry?.value ?? 0),
                      color: seriesColor(s.series),
                    };
                  })}
                />
              ) : null
            }
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={seriesColor(s.series)}
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
              animationDuration={600}
              onClick={(_, index) => {
                const row = rows[index];
                if (row) onSelect?.(row.label);
              }}
            >
              {rows.map((row) => (
                <Cell key={row.label} opacity={markOpacity(row.label, selected)} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ChartFrame>
      <SeriesLegend items={series.map((s) => ({ label: s.name, color: seriesColor(s.series) }))} />
    </>
  );
}
