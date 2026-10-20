import { useState, type FocusEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import './ChartTooltip.css';

export interface TooltipContent {
  title: string;
  subtitle?: string;
  count: number;
  share?: number;
}

interface TooltipState extends TooltipContent {
  x: number;
  y: number;
}

export function useChartTooltip() {
  const [state, setState] = useState<TooltipState | null>(null);

  const bind = (content: TooltipContent) => ({
    onMouseMove: (event: MouseEvent) =>
      setState({ ...content, x: event.clientX, y: event.clientY }),
    onMouseLeave: () => setState(null),
    onFocus: (event: FocusEvent<Element>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setState({ ...content, x: rect.left + rect.width / 2, y: rect.top });
    },
    onBlur: () => setState(null),
  });

  const tooltip =
    state &&
    createPortal(
      <div className="chart-tooltip" role="tooltip" style={{ left: state.x, top: state.y }}>
        <strong className="chart-tooltip__title">{state.title}</strong>
        {state.subtitle && <span className="chart-tooltip__subtitle">{state.subtitle}</span>}
        <span className="chart-tooltip__value">
          {formatPersianNumber(state.count)}
          {state.share !== undefined && ` · ${formatPercent(state.share)}`}
        </span>
      </div>,
      document.body,
    );

  return { bind, tooltip };
}
