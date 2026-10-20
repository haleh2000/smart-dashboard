import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import {
  formatPercent,
  formatPersianNumber,
} from '@/shared/lib/format';
import type { CrossBreakdown } from '../../domain/analytics';
import { channelOrder } from '../dimensionLabels';
import { useChartTooltip } from './ChartTooltip';
import './Sunburst.css';
import './ChannelTypeSunburst.css';

interface Props {
  data: CrossBreakdown;
  selectedChannel?: string;
  selectedType?: string;
  onSelectChannel: (channel: string) => void;
  onSelectType: (channel: string, type: string) => void;
}

interface Segment {
  id: string;
  channel: string;
  type?: string;
  count: number;
  channelTotal: number;
  color: string;
  start: number;
  end: number;
}

const TAU = Math.PI * 2;

const COLORS = [
  '#0284c7',
  '#0d9488',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#ea580c',
  '#4f46e5',
];

function polar(radius: number, angle: number) {
  return `${radius * Math.sin(angle)} ${-radius * Math.cos(angle)}`;
}

function arc(
  inner: number,
  outer: number,
  start: number,
  end: number,
) {
  const stop = end - start >= TAU ? end - 0.0001 : end;
  const large = stop - start > Math.PI ? 1 : 0;

  return [
    `M ${polar(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${polar(outer, stop)}`,
    `L ${polar(inner, stop)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${polar(inner, start)}`,
    'Z',
  ].join(' ');
}

export function ChannelTypeSunburst({
  data,
  selectedChannel,
  selectedType,
  onSelectChannel,
  onSelectType,
}: Props) {
  const { bind, tooltip } = useChartTooltip();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rows = [...data.rows]
    .map((row) => ({
      ...row,
      // محاسبه مجموع از همان خانه‌هایی که در حلقه بیرونی نمایش داده می‌شوند.
      total: data.columns.reduce(
        (sum, type) =>
          sum +
          (row.cells.find((cell) => cell.value === type)?.count ?? 0),
        0,
      ),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => {
      const ai = channelOrder.indexOf(a.value);
      const bi = channelOrder.indexOf(b.value);

      return (
        (ai < 0 ? channelOrder.length : ai) -
          (bi < 0 ? channelOrder.length : bi) ||
        a.value.localeCompare(b.value, 'fa')
      );
    });

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const segments: Segment[] = [];

  let cursor = 0;

  rows.forEach((row, index) => {
    const color = COLORS[index % COLORS.length]!;
    const end = cursor + (row.total / total) * TAU;

    segments.push({
      id: JSON.stringify([row.value]),
      channel: row.value,
      count: row.total,
      channelTotal: row.total,
      color,
      start: cursor,
      end,
    });

    let childCursor = cursor;

    data.columns.forEach((type) => {
      const count =
        row.cells.find((cell) => cell.value === type)?.count ?? 0;

      if (count <= 0) return;

      const childEnd = childCursor + (count / total) * TAU;

      segments.push({
        id: JSON.stringify([row.value, type]),
        channel: row.value,
        type,
        count,
        channelTotal: row.total,
        color,
        start: childCursor,
        end: childEnd,
      });

      childCursor = childEnd;
    });

    cursor = end;
  });

  function isSelected(segment: Segment) {
    if (segment.type === undefined) {
      return selectedChannel === segment.channel;
    }

    return (
      selectedChannel === segment.channel &&
      selectedType === segment.type
    );
  }

  function isDimmed(segment: Segment) {
    return (
      (selectedChannel !== undefined &&
        selectedChannel !== segment.channel) ||
      (segment.type !== undefined &&
        selectedType !== undefined &&
        selectedType !== segment.type)
    );
  }

  function activate(segment: Segment) {
    if (segment.type === undefined) {
      onSelectChannel(segment.channel);
    } else {
      onSelectType(segment.channel, segment.type);
    }
  }

  const focus =
    segments.find((segment) => segment.id === hoveredId) ??
    segments.find(
      (segment) =>
        segment.type !== undefined && isSelected(segment),
    ) ??
    segments.find(
      (segment) =>
        segment.type === undefined && isSelected(segment),
    );

  return (
    <div className="channel-sunburst" dir="rtl">
      <div className="sunburst">
        <div className="sunburst__figure">
          <svg
            viewBox="-100 -100 200 200"
            className="sunburst__svg sunburst-chart"
            role="group"
            aria-label="کانال‌های ورودی و نوع تیکت در دو لایه"
          >
            {segments.map((segment) => {
              const child = segment.type !== undefined;
              const label = child
                ? `${segment.channel} — ${segment.type}`
                : segment.channel;

              const share = child
                ? segment.count / segment.channelTotal
                : segment.count / total;

              const handlers = bind({
                title: label,
                subtitle: child
                  ? 'سهم از تیکت‌های همین کانال'
                  : 'سهم از کل تیکت‌ها',
                count: segment.count,
                share,
              });

              return (
                <path
                  key={segment.id}
                  d={arc(
                    child ? 65 : 34,
                    child ? 98 : 63,
                    segment.start,
                    segment.end,
                  )}
                  className={cn(
                    'sunburst__segment',
                    isDimmed(segment) &&
                      'sunburst__segment--dimmed',
                    isSelected(segment) &&
                      'sunburst__segment--selected',
                  )}
                  style={{
                    fill: child
                      ? `color-mix(in srgb, ${segment.color} 65%, var(--color-surface))`
                      : segment.color,
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label}؛ ${formatPersianNumber(segment.count)} تیکت؛ ${formatPercent(share)}`}
                  aria-pressed={isSelected(segment)}
                  onClick={() => activate(segment)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      activate(segment);
                    }
                  }}
                  {...handlers}
                  onFocus={(event) => {
                    handlers.onFocus(event);
                    setHoveredId(segment.id);
                  }}
                  onBlur={() => {
                    handlers.onBlur();
                    setHoveredId(null);
                  }}
                  onMouseEnter={() => setHoveredId(segment.id)}
                  onMouseLeave={() => {
                    handlers.onMouseLeave();
                    setHoveredId(null);
                  }}
                />
              );
            })}
          </svg>

          <div className="sunburst__center" aria-live="polite">
            <strong className="sunburst__center-label">
              {focus
                ? focus.type ?? focus.channel
                : 'کل تیکت‌ها'}
            </strong>

            {focus?.type !== undefined && (
              <span className="sunburst__center-value">
                {focus.channel}
              </span>
            )}

            <span className="sunburst__center-value">
              {formatPersianNumber(focus?.count ?? total)}
            </span>
          </div>
        </div>

        <p className="sunburst__hint">
          حلقه داخلی: کانال ورودی؛ حلقه بیرونی: نوع تیکت.
          روی هر بخش کلیک کنید تا داشبورد فیلتر شود.
        </p>
      </div>

   <div className="channel-sunburst__details">
  {rows.map((row, index) => (
    <button
      key={row.value}
      type="button"
      className="channel-sunburst__item"
      aria-pressed={selectedChannel === row.value}
      onClick={() => onSelectChannel(row.value)}
    >
      <span className="channel-sunburst__label">
        <span
          className="channel-sunburst__dot"
          style={{
            background: COLORS[index % COLORS.length],
          }}
        />
        <span>{row.value}</span>
      </span>

      <strong>
        {formatPersianNumber(row.total)}
        {' · '}
        {formatPercent(total > 0 ? row.total / total : 0)}
      </strong>
    </button>
  ))}
</div>


      {tooltip}
    </div>
  );
}
