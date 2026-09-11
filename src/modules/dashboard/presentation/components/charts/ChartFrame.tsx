import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import './charts.css';

interface ChartFrameProps {
  /** Plot height in CSS pixels. */
  height: number;
  label: string;
  children: ReactElement;
}

/**
 * Sizes a Recharts chart to its panel. The plot itself is laid out LTR (SVG text anchors
 * flip under RTL), while axes are mirrored per chart so the reading order stays right-to-left.
 */
export function ChartFrame({ height, label, children }: ChartFrameProps) {
  return (
    <figure className="chart-frame" aria-label={label}>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 560, height }}>
        {children}
      </ResponsiveContainer>
    </figure>
  );
}
