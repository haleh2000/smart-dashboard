import { useId, useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Tooltip } from 'recharts';
import { formatPersianNumber } from '@/shared/lib/format';
import type { OperatorStats } from '../../domain/analytics';
import { ChartFrame } from './charts/ChartFrame';
import { ChartTooltipBox } from './charts/ChartTooltipBox';
import { axisTick, gridStroke } from './charts/chartKit';
import { SeriesLegend } from './charts/SeriesLegend';
import './OperatorRadar.css';

interface OperatorRadarProps {
  stats: readonly OperatorStats[];
  /** The dashboard's operator filter; shown by default. */
  selected?: string;
}

const AXES = [
  { key: 'fcr', label: 'حل در اولین تماس' },
  { key: 'speed', label: 'سرعت پاسخ' },
  { key: 'volume', label: 'حجم کار' },
  { key: 'satisfaction', label: 'رضایت' },
  { key: 'talk', label: 'کوتاهی مکالمه' },
] as const;
type Axis = (typeof AXES)[number]['key'];

const higher = (value: number, best: number) => (best ? value / best : 0);
const lower = (value: number, best: number) => (value ? Math.min(1, best / value) : 0);

/** Each operator scored 0..100 per axis against the best operator («بهتر» is always outward). */
const normalize = (stats: readonly OperatorStats[]): Map<string, Record<Axis, number>> => {
  const max = (pick: (s: OperatorStats) => number) => Math.max(0, ...stats.map(pick));
  const min = (pick: (s: OperatorStats) => number) =>
    Math.min(...stats.map(pick).filter((v) => v > 0));
  const bestFcr = max((s) => s.fcrRate);
  const bestVolume = max((s) => s.ticketCount + s.callCount);
  const bestPositive = max((s) => s.positiveShare);
  const fastest = min((s) => s.avgFirstResponseSec);
  const shortest = min((s) => s.avgHandlingSec);
  return new Map(
    stats.map((s) => [
      s.operator,
      {
        fcr: higher(s.fcrRate, bestFcr) * 100,
        speed: lower(s.avgFirstResponseSec, fastest) * 100,
        volume: higher(s.ticketCount + s.callCount, bestVolume) * 100,
        satisfaction: higher(s.positiveShare, bestPositive) * 100,
        talk: lower(s.avgHandlingSec, shortest) * 100,
      },
    ]),
  );
};

/** Operator profile vs. team average on five normalized axes. */
export function OperatorRadar({ stats, selected }: OperatorRadarProps) {
  const selectId = useId();
  const [picked, setPicked] = useState<string>();
  const scores = normalize(stats);
  const operator =
    (picked && scores.has(picked) ? picked : undefined) ??
    (selected && scores.has(selected) ? selected : undefined) ??
    stats[0]?.operator ??
    '';
  const own = scores.get(operator);
  const rows = AXES.map((axis) => ({
    axis: axis.label,
    operator: Math.round(own?.[axis.key] ?? 0),
    team: Math.round(
      [...scores.values()].reduce((sum, s) => sum + s[axis.key], 0) / Math.max(1, scores.size),
    ),
  }));

  return (
    <>
      <div className="dashboard__toolbar">
        <label className="form-field operator-radar__picker" htmlFor={selectId}>
          <span className="form-field__label">اپراتور</span>
          <select
            id={selectId}
            className="form-select"
            value={operator}
            onChange={(event) => setPicked(event.target.value)}
          >
            {stats.map((s) => (
              <option key={s.operator} value={s.operator}>
                {s.operator}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ChartFrame height={320} label={`پروفایل عملکرد ${operator} در برابر میانگین تیم`}>
        <RadarChart data={rows} outerRadius="72%">
          <PolarGrid stroke={gridStroke} />
          <PolarAngleAxis dataKey="axis" tick={axisTick} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBox
                  title={row.axis}
                  rows={[
                    { name: operator, value: row.operator, color: 'var(--chart-series-1)' },
                    { name: 'میانگین تیم', value: row.team, color: 'var(--chart-series-3)' },
                  ]}
                  format={(v) => `${formatPersianNumber(v)} از ۱۰۰`}
                />
              );
            }}
          />
          <Radar
            name="میانگین تیم"
            dataKey="team"
            stroke="var(--chart-series-3)"
            fill="var(--chart-series-3)"
            fillOpacity={0.12}
            strokeDasharray="5 4"
            animationDuration={700}
          />
          <Radar
            name={operator}
            dataKey="operator"
            stroke="var(--chart-series-1)"
            fill="var(--chart-series-1)"
            fillOpacity={0.35}
            strokeWidth={2}
            animationDuration={900}
          />
        </RadarChart>
      </ChartFrame>
      <SeriesLegend
        items={[
          { label: operator, color: 'var(--chart-series-1)' },
          { label: 'میانگین تیم', color: 'var(--chart-series-3)' },
        ]}
        onSelect={(label) => label !== 'میانگین تیم' && setPicked(label)}
      />
    </>
  );
}
