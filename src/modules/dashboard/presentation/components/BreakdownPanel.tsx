import type { ReactNode } from 'react';
import { BarList, ErrorState, Panel, SkeletonTable } from '@/shared/ui';
import { filtersForChart, type Dimension } from '../../domain/filters';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { useBreakdown } from '../hooks/analyticsQueries';

interface BreakdownPanelProps {
  title: ReactNode;
  dimension: Dimension;
  /** Chart-series token index the bars are painted with. */
  series: 1 | 2 | 3 | 4 | 5;
}

/** Wires one dimension to the shared filter store: fetches its breakdown and toggles filters on click. */
export function BreakdownPanel({ title, dimension, series }: BreakdownPanelProps) {
  const filters = useDashboardFilterStore((state) => state.filters);
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const { data, isPending, isError, refetch } = useBreakdown(
    dimension,
    filtersForChart(filters, dimension),
  );

  return (
    <Panel title={title}>
      {isPending ? (
        <SkeletonTable rows={4} />
      ) : isError ? (
        <ErrorState message="دریافت داده با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <p className="panel__empty">داده‌ای برای این فیلترها وجود ندارد.</p>
      ) : (
        <BarList
          rows={data.map((item) => ({ label: item.value, count: item.count, share: item.share }))}
          series={series}
          selected={filters[dimension]}
          onSelect={(value) => toggle(dimension, value)}
        />
      )}
    </Panel>
  );
}
