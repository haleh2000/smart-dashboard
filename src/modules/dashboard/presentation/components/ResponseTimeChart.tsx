import type { ReactNode } from 'react';
import { Panel } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import {
  useDashboardFilterStore,
  useDashboardScope,
} from '../dashboardFilterStore';
import { useBranchResponseTime } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { HorizontalBarChart } from './charts/HorizontalBarChart';
import type { ColumnItem } from './charts/ColumnChart';

interface ResponseTimeChartProps {
  title: ReactNode;
  series?: number;
  className?: string;
  type?: string;
  dimension?: 'branch' | 'operator' | 'corporate';
}

const MINUTES_PER_DAY = 24 * 60;

const dayFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 2,
});

function formatDays(value: number): string {
  if (value > 0 && value < 0.01) {
    return 'کمتر از ۰٫۰۱ روز';
  }

  return `${dayFormatter.format(value)} روز`;
}

export function ResponseTimeChart({
  title,
  series = 2,
  className,
  type,
  dimension = 'branch',
}: ResponseTimeChartProps) {
  const scope = useDashboardScope();

  const toggle = useDashboardFilterStore(
    (state) => state.toggle,
  ); 

  const chartScope = scopeForChart(
    {
      ...scope,
      filters: {
        ...scope.filters,
        ...(type !== undefined ? { type } : {}),
      },
    },
    dimension,
  );

  const query = useBranchResponseTime(
    chartScope,
    dimension,
  );

  return (
    <Panel title={title} className={className}>
      <ChartState
        query={query}
        isEmpty={(data) => data.length === 0}
      >
        {(data) => {
          const items: readonly ColumnItem[] = data.map(
            (item) => ({
              label: item.branch,
              value:
                item.avgResponseMinutes / MINUTES_PER_DAY,
              share: undefined,
            }),
          );

          return (
            <HorizontalBarChart
              label="میانگین پاسخ‌دهی (روز)"
              items={items}
              series={series}
              selected={scope.filters[dimension]}
              onSelect={(value) => toggle(dimension, value)}
              format={formatDays}
            />
          );
        }}
      </ChartState>
    </Panel>
  );
}
