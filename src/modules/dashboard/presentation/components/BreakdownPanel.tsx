import type { ReactNode } from 'react';
import { Panel } from '@/shared/ui';
import { scopeForChart, type Dimension } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useBreakdown } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { ColumnChart } from './charts/ColumnChart';
import { HorizontalBarChart } from './charts/HorizontalBarChart';

interface BreakdownPanelProps {
  title: ReactNode;
  dimension: Dimension;
  series: number;
  variant?: 'columns' | 'bars';
  className?: string;
  maxVisible?: number;
}

export function BreakdownPanel({
  title,
  dimension,
  series,
  variant = 'bars',
  className,
  maxVisible,
}: BreakdownPanelProps) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown(
    dimension,
    scopeForChart(scope, dimension),
  );

  const label = typeof title === 'string' ? title : dimension;

  return (
    <Panel title={title} className={className}>
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => {
          const props = {
            label,
            items: data.map((item) => ({
              label: item.value,
              value: item.count,
              share: item.share,
            })),
            series,
            selected: scope.filters[dimension],
            onSelect: (value: string) => toggle(dimension, value),
            ...(maxVisible !== undefined && { maxVisible }),
          };
          return variant === 'columns' ? (
            <ColumnChart {...props} />
          ) : (
            <HorizontalBarChart {...props} scale="share" />
          );
        }}
      </ChartState>
    </Panel>
  );
}
