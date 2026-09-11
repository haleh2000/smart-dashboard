import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { ReasonNode } from '../../domain/analytics';
import type { DashboardFilters } from '../../domain/filters';
import { seriesColor } from './chartColors';
import { useChartTooltip } from './ChartTooltip';
import { Legend } from './StackedBars';
import './Sunburst.css';

interface SunburstProps {
  nodes: readonly ReasonNode[];
  total: number;
  filters: DashboardFilters;
  /** Clicking a segment selects its subject path (Subject1 → 2 → 3). */
  onSelect: (path: string[]) => void;
}

interface Segment {
  node: ReasonNode;
  path: string[];
  depth: number;
  start: number;
  end: number;
  color: string;
}

/** Inner / outer radius of each ring (Subject1, Subject2, Subject3). */
const RINGS = [
  [34, 58],
  [60, 80],
  [82, 98],
] as const;
const TINT = [100, 68, 42];
const LEVEL_KEYS = ['subject1', 'subject2', 'subject3'] as const;

const polar = (radius: number, angle: number) =>
  `${(radius * Math.sin(angle)).toFixed(3)} ${(-radius * Math.cos(angle)).toFixed(3)}`;

const arc = (inner: number, outer: number, start: number, end: number) => {
  // A full circle can't be one arc: stop just short of it.
  const stop = end - start >= Math.PI * 2 ? end - 0.0001 : end;
  const large = stop - start > Math.PI ? 1 : 0;
  return [
    `M ${polar(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${polar(outer, stop)}`,
    `L ${polar(inner, stop)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${polar(inner, start)}`,
    'Z',
  ].join(' ');
};

const layout = (nodes: readonly ReasonNode[], total: number): Segment[] => {
  const segments: Segment[] = [];
  const walk = (
    level: readonly ReasonNode[],
    parentPath: string[],
    depth: number,
    from: number,
    color: (index: number) => string,
  ) => {
    let cursor = from;
    level.forEach((node, index) => {
      const sweep = total ? (node.count / total) * Math.PI * 2 : 0;
      const path = [...parentPath, node.label];
      const base = color(index);
      segments.push({ node, path, depth, start: cursor, end: cursor + sweep, color: base });
      walk(node.children, path, depth + 1, cursor, () => base);
      cursor += sweep;
    });
  };
  walk(nodes, [], 0, 0, seriesColor);
  return segments;
};

const onSelectedPath = (path: readonly string[], filters: DashboardFilters) =>
  path.every((value, i) => {
    const filter = filters[LEVEL_KEYS[i]!];
    return filter === undefined || filter === value;
  });

/**
 * «تحلیل دلایل اصلی تماس (چند لایه‌ای)»: Subject1 → Subject2 → Subject3 as concentric rings.
 * Clicking a segment drills down and cross-filters; the centre shows the focused reason.
 */
export function Sunburst({ nodes, total, filters, onSelect }: SunburstProps) {
  const { bind, tooltip } = useChartTooltip();
  const [hovered, setHovered] = useState<Segment | null>(null);
  const segments = layout(nodes, total);
  const hasSelection = LEVEL_KEYS.some((key) => filters[key] !== undefined);
  const selectedPath = LEVEL_KEYS.map((key) => filters[key]).filter(
    (v): v is string => v !== undefined,
  );
  const selected = segments.find(
    (s) => s.path.length === selectedPath.length && s.path.every((v, i) => v === selectedPath[i]),
  );
  const focus = hovered ?? selected;

  return (
    <div className="sunburst">
      <div className="sunburst__figure">
        <svg
          viewBox="-100 -100 200 200"
          className="sunburst__svg"
          role="group"
          aria-label="دلایل تماس در سه سطح"
        >
          {segments.map((segment) => {
            const [inner, outer] = RINGS[segment.depth] ?? RINGS[2];
            const active = onSelectedPath(segment.path, filters);
            const label = segment.path.join(' › ');
            if (segment.end - segment.start < 0.002) return null;
            return (
              <path
                key={label}
                d={arc(inner, outer, segment.start, segment.end)}
                className={cn(
                  'sunburst__segment',
                  hasSelection && !active && 'sunburst__segment--dimmed',
                  segment === selected && 'sunburst__segment--selected',
                )}
                style={{
                  fill: `color-mix(in srgb, ${segment.color} ${TINT[segment.depth] ?? 40}%, var(--color-surface))`,
                  animationDelay: `${segment.depth * 120}ms`,
                }}
                role="button"
                tabIndex={0}
                aria-label={`${label}: ${formatPersianNumber(segment.node.count)} (${formatPercent(segment.node.share)})`}
                aria-pressed={segment === selected}
                onClick={() => onSelect(segment.path)}
                onKeyDown={(event) => event.key === 'Enter' && onSelect(segment.path)}
                onMouseEnter={() => setHovered(segment)}
                {...(() => {
                  const handlers = bind({
                    title: segment.node.label,
                    subtitle: segment.path.slice(0, -1).join(' › ') || undefined,
                    count: segment.node.count,
                    share: segment.node.share,
                  });
                  return {
                    ...handlers,
                    onMouseLeave: () => {
                      handlers.onMouseLeave();
                      setHovered(null);
                    },
                  };
                })()}
              />
            );
          })}
        </svg>
        <div className="sunburst__center" aria-live="polite">
          {focus ? (
            <>
              <span className="sunburst__center-level">
                سطح {formatPersianNumber(focus.depth + 1)}
              </span>
              <strong className="sunburst__center-label">{focus.node.label}</strong>
              <span className="sunburst__center-value">
                {formatPersianNumber(focus.node.count)} · {formatPercent(focus.node.share)}
              </span>
            </>
          ) : (
            <>
              <strong className="sunburst__center-total">{formatPersianNumber(total)}</strong>
              <span className="sunburst__center-level">تماس</span>
            </>
          )}
        </div>
      </div>
      <Legend items={nodes.map((node, i) => ({ label: node.label, color: seriesColor(i) }))} />
      <p className="sunburst__hint">
        حلقه داخلی موضوع اصلی، حلقه میانی موضوع فرعی و حلقه بیرونی علت است؛ روی هر بخش کلیک کنید تا
        کل داشبورد فیلتر شود.
      </p>
      {tooltip}
    </div>
  );
}
