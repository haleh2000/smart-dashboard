import type { ReactNode } from 'react';
import { BarList, Panel } from '@/shared/ui';
import { scopeForChart, type Dimension } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useBreakdown } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';

interface BreakdownPanelProps {
  title: ReactNode;
  dimension: Dimension;
  /** Chart-series token index the bars are painted with. */
  series: 1 | 2 | 3 | 4 | 5;
}

/** Wires one dimension to the shared filter store: fetches its breakdown and toggles filters on click. */
export function BreakdownPanel({ title, dimension, series }: BreakdownPanelProps) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown(dimension, scopeForChart(scope, dimension));

  return (
    <Panel title={title}>
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => (
          <BarList
            rows={data.map((item) => ({ label: item.value, count: item.count, share: item.share }))}
            series={series}
            selected={scope.filters[dimension]}
            onSelect={(value) => toggle(dimension, value)}
          />
        )}
      </ChartState>
    </Panel>
  );
}
