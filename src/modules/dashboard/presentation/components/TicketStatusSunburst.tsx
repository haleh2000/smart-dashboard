import { useState } from 'react';
import {
  closedDetailStatusesForType,
  openDetailStatusesForType,
} from '@/modules/tickets';
import { cn } from '@/shared/lib/cn';
import {
  formatPercent,
  formatPersianNumber,
} from '@/shared/lib/format';
import { useChartTooltip } from './ChartTooltip';
import './Sunburst.css';
import './TicketStatusSunburst.css';

interface Props {
  type: string;
  data: readonly { value: string; count: number }[];
  selected?: string;
  onSelect: (status: string) => void;
}

interface StatusItem {
  label: string;
  count: number;
}

interface StatusGroup {
  key: string;
  label: string;
  color: string;
  items: StatusItem[];
  count: number;
}

interface Segment {
  id: string;
  label: string;
  count: number;
  group: string;
  color: string;
  depth: number;
  start: number;
  end: number;
  status?: string;
}

const TAU = Math.PI * 2;

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

function buildGroups(
  type: string,
  data: Props['data'],
): StatusGroup[] {
  const counts = new Map<string, number>();

  for (const item of data) {
    counts.set(
      item.value,
      (counts.get(item.value) ?? 0) + item.count,
    );
  }

  const definitions = [
    {
      key: 'open',
      label: 'باز',
      color: '#d97706',
      statuses: openDetailStatusesForType(type),
    },
    {
      key: 'closed',
      label: 'بسته‌شده',
      color: '#0d9488',
      statuses: closedDetailStatusesForType(type),
    },
  ];

  const groups: StatusGroup[] = definitions.map(
    ({ statuses, ...group }) => {
      const items = statuses.map((label) => ({
        label,
        count: counts.get(label) ?? 0,
      }));

      return {
        ...group,
        items,
        count: items.reduce((sum, item) => sum + item.count, 0),
      };
    },
  );

  // وضعیت ناشناخته به‌اشتباه باز یا بسته محاسبه نمی‌شود.
  const known = new Set(
    definitions.flatMap((group) => [...group.statuses]),
  );

  const other = [...counts.entries()]
    .filter(([label, count]) => !known.has(label) && count > 0)
    .map(([label, count]) => ({ label, count }));

  if (other.length > 0) {
    groups.push({
      key: 'other',
      label: 'نامشخص / سایر',
      color: '#64748b',
      items: other,
      count: other.reduce((sum, item) => sum + item.count, 0),
    });
  }

  return groups;
}

function layout(
  groups: StatusGroup[],
  total: number,
): Segment[] {
  if (!total) return [];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const group of groups) {
    const end = cursor + (group.count / total) * TAU;

    if (group.count > 0) {
      segments.push({
        id: group.key,
        label: group.label,
        count: group.count,
        group: group.key,
        color: group.color,
        depth: 0,
        start: cursor,
        end,
      });
    }

    let childCursor = cursor;

    for (const item of group.items) {
      const childEnd =
        childCursor + (item.count / total) * TAU;

      if (item.count > 0) {
        segments.push({
          id: JSON.stringify([group.key, item.label]),
          label: item.label || 'بدون وضعیت',
          count: item.count,
          group: group.key,
          color: group.color,
          depth: 1,
          start: childCursor,
          end: childEnd,
          status: item.label,
        });
      }

      childCursor = childEnd;
    }

    cursor = end;
  }

  return segments;
}

export function TicketStatusSunburst({
  type,
  data,
  selected,
  onSelect,
}: Props) {
  const { bind, tooltip } = useChartTooltip();

  const [activeGroup, setActiveGroup] = useState<string | null>(
    null,
  );
  const [hoveredId, setHoveredId] = useState<string | null>(
    null,
  );

  const groups = buildGroups(type, data);
  const total = groups.reduce(
    (sum, group) => sum + group.count,
    0,
  );
  const segments = layout(groups, total);

  const selectedSegment = segments.find(
    (segment) =>
      segment.depth === 1 && segment.status === selected,
  );

  const focus =
    segments.find((segment) => segment.id === hoveredId) ??
    selectedSegment ??
    segments.find(
      (segment) =>
        segment.depth === 0 && segment.group === activeGroup,
    );

  function activate(segment: Segment) {
    if (segment.depth === 0) {
      setActiveGroup((current) =>
        current === segment.group ? null : segment.group,
      );
    } else if (segment.status !== undefined) {
      setActiveGroup(null);
      onSelect(segment.status);
    }
  }

  return (
    <div className="ticket-status-sunburst" dir="rtl">
      <div className="sunburst">
        <div className="sunburst__figure">
          <svg
            viewBox="-100 -100 200 200"
            className="sunburst__svg sunburst-chart"
            role="group"
            aria-label={`وضعیت تیکت‌های ${type} در دو لایه`}
          >
            {segments.map((segment) => {
              const isSelected =
                segment.depth === 0
                  ? activeGroup === segment.group
                  : selected === segment.status;

              const dimmed = activeGroup
                ? activeGroup !== segment.group
                : selectedSegment
                  ? segment.depth === 0
                    ? selectedSegment.group !== segment.group
                    : segment.status !== selected
                  : false;

              const share = total
                ? segment.count / total
                : 0;

              const label = `${
                segment.label
              }: ${formatPersianNumber(
                segment.count,
              )} (${formatPercent(share)})`;

              const groupLabel = groups.find(
                (group) => group.key === segment.group,
              )?.label;

              const tooltipHandlers = bind({
                title: segment.label,
                subtitle:
                  segment.depth === 1
                    ? groupLabel
                    : 'گروه وضعیت',
                count: segment.count,
                share,
              });

              return (
                <path
                  key={segment.id}
                  d={arc(
                    segment.depth === 0 ? 34 : 65,
                    segment.depth === 0 ? 63 : 98,
                    segment.start,
                    segment.end,
                  )}
                  className={cn(
                    'sunburst__segment',
                    dimmed && 'sunburst__segment--dimmed',
                    isSelected &&
                      'sunburst__segment--selected',
                  )}
                  style={{
                    fill:
                      segment.depth === 0
                        ? segment.color
                        : `color-mix(in srgb, ${segment.color} 65%, var(--color-surface))`,
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={isSelected}
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
                {...tooltipHandlers}
                    onFocus={(event) => {
                    tooltipHandlers.onFocus(event);
                    setHoveredId(segment.id);
                    }}
                    onBlur={() => {
                    tooltipHandlers.onBlur();
                    setHoveredId(null);
                    }}
                    onMouseEnter={() => {
                    setHoveredId(segment.id);
                    }}
                    onMouseLeave={() => {
                    tooltipHandlers.onMouseLeave();
                    setHoveredId(null);
                    }}

                />
              );
            })}
          </svg>

          <div
            className="sunburst__center"
            aria-live="polite"
          >
            {focus ? (
              <>
                <strong className="sunburst__center-label">
                  {focus.label}
                </strong>
                <span className="sunburst__center-value">
                  {formatPersianNumber(focus.count)}
                  {' · '}
                  {formatPercent(
                    total ? focus.count / total : 0,
                  )}
                </span>
              </>
            ) : (
              <>
                <strong className="sunburst__center-total">
                  {formatPersianNumber(total)}
                </strong>
                <span className="sunburst__center-level">
                  تیکت
                </span>
              </>
            )}
          </div>
        </div>

        <p className="sunburst__hint">
          حلقه داخلی دسته وضعیت و حلقه بیرونی وضعیت جزئی
          است. برای فیلتر داشبورد روی وضعیت جزئی کلیک کنید.
        </p>
      </div>

      <div className="ticket-status-sunburst__groups">
        {groups.map((group) => (
          <section
            key={group.key}
            className="ticket-status-sunburst__group"
          >
            <button
              type="button"
              className="ticket-status-sunburst__heading"
              aria-pressed={activeGroup === group.key}
              onClick={() =>
                setActiveGroup((current) =>
                  current === group.key ? null : group.key,
                )
              }
            >
              <span>
                <span
                  className="ticket-status-sunburst__dot"
                  style={{
                    backgroundColor: group.color,
                  }}
                />
                {group.label}
              </span>

              <strong>
                {formatPersianNumber(group.count)}
                {' · '}
                {formatPercent(
                  total ? group.count / total : 0,
                )}
              </strong>
            </button>

            <p className="ticket-status-sunburst__description">
              {group.label} شامل:
            </p>

            <ul className="ticket-status-sunburst__list">
              {group.items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="ticket-status-sunburst__item"
                    aria-pressed={selected === item.label}
                    onClick={() => {
                      setActiveGroup(null);
                      onSelect(item.label);
                    }}
                  >
                    <span>
                      {item.label || 'بدون وضعیت'}
                    </span>
                    <strong>
                      {formatPersianNumber(item.count)}
                    </strong>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {tooltip}
    </div>
  );
}
