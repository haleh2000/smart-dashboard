import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { Heatmap } from '../../domain/analytics';
import type { HeatmapPeaks } from '../../domain/heatmap';
import { hourLabel, weekdayLabels } from '../dimensionLabels';
import './ClockHeatmap.css';

interface ClockHeatmapProps {
  data: Heatmap;
  peaks: HeatmapPeaks;
  selectedWeekday?: string;
  selectedHour?: string;
  onSelect: (weekday: string, hour: string) => void;
}

const SIZE = 480;
const C = SIZE / 2;
const HUB = 64;
const RING = 16;
const RING_GAP = 1.6;
const BEZEL_FROM = HUB + 7 * RING + 8;
const BEZEL_DEPTH = 30;
const LABEL_RADIUS = BEZEL_FROM + BEZEL_DEPTH + 16;
const SECTOR_GAP = 0.7;

/** Clock angle (degrees, 0 = top, clockwise) → SVG point. */
const point = (radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return [C + radius * Math.sin(radians), C - radius * Math.cos(radians)] as const;
};

/** An annular sector between two radii and two clock angles. */
const sector = (inner: number, outer: number, from: number, to: number) => {
  const [x1, y1] = point(outer, from);
  const [x2, y2] = point(outer, to);
  const [x3, y3] = point(inner, to);
  const [x4, y4] = point(inner, from);
  const large = to - from > 180 ? 1 : 0;
  return `M${x1} ${y1}A${outer} ${outer} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${inner} ${inner} 0 ${large} 0 ${x4} ${y4}Z`;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface Focus {
  weekday?: number;
  hour: number;
  count: number;
}

/**
 * «ساعت پیک تماس»: the week drawn as a 24-hour clock. Each ring is a weekday (Saturday inside),
 * each sector an hour; the bezel shows the week's volume per hour and the hand points at the peak.
 * Clicking a sector filters the dashboard by that weekday and hour.
 */
export function ClockHeatmap({
  data,
  peaks,
  selectedWeekday,
  selectedHour,
  onSelect,
}: ClockHeatmapProps) {
  const [focus, setFocus] = useState<Focus | null>(null);
  const hasSelection = selectedWeekday !== undefined || selectedHour !== undefined;
  const maxHour = Math.max(1, ...peaks.hourTotals);
  const topKeys = new Set(peaks.topSlots.slice(0, 3).map((s) => `${s.weekday}-${s.hour}`));
  const handAngle = peaks.peak.hour * 15 + 7.5;
  const shown: Focus = focus ?? peaks.peak;

  return (
    <div className="clock-heatmap">
      <svg
        className="clock-heatmap__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="group"
        aria-label="ساعت تراکم تماس‌ها بر اساس روز هفته و ساعت"
        onMouseLeave={() => setFocus(null)}
      >
        <circle className="clock-heatmap__face" cx={C} cy={C} r={BEZEL_FROM + BEZEL_DEPTH + 4} />

        {/* Bezel: calls per hour across the week. */}
        {HOURS.map((hour) => {
          const total = peaks.hourTotals[hour] ?? 0;
          const depth = 3 + (total / maxHour) * (BEZEL_DEPTH - 3);
          const heat = Math.round((total / maxHour) * 100);
          return (
            <path
              key={`bezel-${hour}`}
              className={cn(
                'clock-heatmap__bezel',
                selectedHour !== undefined &&
                  selectedHour !== String(hour) &&
                  'clock-heatmap__bezel--dimmed',
              )}
              d={sector(BEZEL_FROM, BEZEL_FROM + depth, hour * 15 + 1.2, (hour + 1) * 15 - 1.2)}
              style={{
                // oklch keeps the teal → coral ramp vivid instead of passing through grey.
                fill: `color-mix(in oklch, var(--chart-series-2) ${heat}%, var(--chart-series-1))`,
              }}
              onMouseEnter={() => setFocus({ hour, count: total })}
            />
          );
        })}

        {/* Rings: one per weekday, one sector per hour. */}
        {data.counts.map((row, weekday) =>
          HOURS.map((hour) => {
            const count = row[hour] ?? 0;
            const intensity = data.max ? Math.round((count / data.max) * 100) : 0;
            const inner = HUB + weekday * RING;
            const selected =
              (selectedWeekday === undefined || selectedWeekday === String(weekday)) &&
              (selectedHour === undefined || selectedHour === String(hour));
            const label = `${weekdayLabels[weekday]} ساعت ${hourLabel(hour)}: ${formatPersianNumber(count)} تماس`;
            return (
              <path
                key={`${weekday}-${hour}`}
                className={cn(
                  'clock-heatmap__cell',
                  hasSelection && !selected && 'clock-heatmap__cell--dimmed',
                  topKeys.has(`${weekday}-${hour}`) && 'clock-heatmap__cell--hot',
                  focus?.weekday === weekday && focus.hour === hour && 'clock-heatmap__cell--focus',
                )}
                style={{
                  fill: `color-mix(in srgb, var(--chart-series-1) ${intensity}%, var(--chart-track))`,
                  animationDelay: `${(weekday * 24 + hour) * 4}ms`,
                }}
                d={sector(
                  inner,
                  inner + RING - RING_GAP,
                  hour * 15 + SECTOR_GAP,
                  (hour + 1) * 15 - SECTOR_GAP,
                )}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={
                  selectedWeekday === String(weekday) && selectedHour === String(hour)
                }
                onMouseEnter={() => setFocus({ weekday, hour, count })}
                onFocus={() => setFocus({ weekday, hour, count })}
                onBlur={() => setFocus(null)}
                onClick={() => onSelect(String(weekday), String(hour))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(String(weekday), String(hour));
                  }
                }}
              >
                <title>{label}</title>
              </path>
            );
          }),
        )}

        {/* Hour numerals and ticks, like a clock face. */}
        {HOURS.map((hour) => {
          const major = hour % 6 === 0;
          const [x, y] = point(LABEL_RADIUS, hour * 15);
          const [tx1, ty1] = point(BEZEL_FROM - 4, hour * 15);
          const [tx2, ty2] = point(BEZEL_FROM - (major ? 9 : 6), hour * 15);
          return (
            <g key={`label-${hour}`} aria-hidden="true">
              <line className="clock-heatmap__tick" x1={tx1} y1={ty1} x2={tx2} y2={ty2} />
              <text
                className={cn('clock-heatmap__numeral', major && 'clock-heatmap__numeral--major')}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {formatPersianNumber(hour)}
              </text>
            </g>
          );
        })}

        {/* The hand points at the busiest hour of the week. */}
        {peaks.total > 0 && (
          <g
            className="clock-heatmap__hand"
            style={{ transform: `rotate(${handAngle}deg)` }}
            aria-hidden="true"
          >
            <line x1={C} y1={C} x2={C} y2={C - (BEZEL_FROM - 12)} />
            <circle cx={C} cy={C - (BEZEL_FROM - 12)} r={4.5} />
          </g>
        )}

        <circle className="clock-heatmap__hub" cx={C} cy={C} r={HUB - 6} />
        <g className="clock-heatmap__readout" aria-live="polite">
          <text x={C} y={C - 22} textAnchor="middle" className="clock-heatmap__readout-label">
            {focus ? 'انتخاب' : 'پیک هفته'}
          </text>
          <text x={C} y={C + 2} textAnchor="middle" className="clock-heatmap__readout-value">
            {formatPersianNumber(shown.count)}
          </text>
          <text x={C} y={C + 24} textAnchor="middle" className="clock-heatmap__readout-sub">
            {shown.weekday !== undefined ? `${weekdayLabels[shown.weekday]} ` : 'کل هفته '}
            {hourLabel(shown.hour)}
          </text>
          <text x={C} y={C + 40} textAnchor="middle" className="clock-heatmap__readout-share">
            {peaks.total ? formatPercent(shown.count / peaks.total) : ''}
          </text>
        </g>
      </svg>

      <ol className="clock-heatmap__rings" aria-label="ترتیب حلقه‌ها از داخل به بیرون">
        {weekdayLabels.map((day, weekday) => (
          <li key={day} className="clock-heatmap__ring-label">
            <span className="clock-heatmap__ring-index">{formatPersianNumber(weekday + 1)}</span>
            {day}
          </li>
        ))}
      </ol>
      <p className="clock-heatmap__hint">
        حلقه‌ها از داخل به بیرون: شنبه تا جمعه · قاب بیرونی: حجم هر ساعت در کل هفته · عقربه: ساعت
        پیک
      </p>
    </div>
  );
}
