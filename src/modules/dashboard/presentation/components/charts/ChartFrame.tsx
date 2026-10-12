import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import './charts.css';

interface ChartFrameProps {
  /** Plot height in CSS pixels. */
  height: number;
  label: string;
  children: ReactElement;
}


export function ChartFrame({ height, label, children }: ChartFrameProps) {
  return (
    <figure className="chart-frame" aria-label={label}>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 560, height }}>
        {children}
      </ResponsiveContainer>
    </figure>
  );
}
