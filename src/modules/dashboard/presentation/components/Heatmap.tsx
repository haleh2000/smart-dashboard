import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import type { Heatmap as HeatmapData } from '../../domain/analytics';
import { hourLabel, weekdayLabels } from '../dimensionLabels';
import { useChartTooltip } from './ChartTooltip';
import './Heatmap.css';

interface HeatmapProps {
  data: HeatmapData;
  selectedWeekday?: string;
  selectedHour?: string;
  onSelect: (weekday: string, hour: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** «Heatmap تراکم تماس‌ها بر اساس روز و ساعت». A cell filters by its weekday and hour. */
export function Heatmap({ data, selectedWeekday, selectedHour, onSelect }: HeatmapProps) {
  const { bind, tooltip } = useChartTooltip();
  const total = data.counts.flat().reduce((sum, n) => sum + n, 0);
  const hasSelection = selectedWeekday !== undefined || selectedHour !== undefined;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap" role="group" aria-label="تراکم تماس‌ها بر اساس روز و ساعت">
        <div className="heatmap__row" aria-hidden="true">
          <div className="heatmap__corner" />
          {HOURS.map((hour) => (
            <div key={hour} className="heatmap__hour">
              {hour % 3 === 0 ? formatPersianNumber(hour) : ''}
            </div>
          ))}
        </div>
        {data.counts.map((row, weekday) => (
          <div key={weekday} className="heatmap__row">
            <div className="heatmap__day" aria-hidden="true">
              {weekdayLabels[weekday]}
            </div>
            {HOURS.map((hour) => {
              const count = row[hour] ?? 0;
              const intensity = data.max ? Math.round((count / data.max) * 100) : 0;
              const selected =
                (selectedWeekday === undefined || selectedWeekday === String(weekday)) &&
                (selectedHour === undefined || selectedHour === String(hour));
              return (
                <button
                  key={hour}
                  type="button"
                  className={cn(
                    'heatmap__cell',
                    hasSelection && !selected && 'heatmap__cell--dimmed',
                  )}
                  style={{
                    background: `color-mix(in srgb, var(--chart-series-1) ${intensity}%, var(--chart-track))`,
                  }}
                  aria-label={`${weekdayLabels[weekday]} ساعت ${hourLabel(hour)}: ${formatPersianNumber(count)} تماس`}
                  onClick={() => onSelect(String(weekday), String(hour))}
                  {...bind({
                    title: `${weekdayLabels[weekday]} — ${hourLabel(hour)}`,
                    count,
                    share: total ? count / total : 0,
                  })}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap__scale" aria-hidden="true">
        <span>کم</span>
        <span className="heatmap__scale-bar" />
        <span>زیاد ({formatPersianNumber(data.max)})</span>
      </div>
      {tooltip}
    </div>
  );
}
