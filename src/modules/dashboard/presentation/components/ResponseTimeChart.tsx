import type { ReactNode } from 'react';
import { Panel } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useBranchResponseTime } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { HorizontalBarChart } from './charts/HorizontalBarChart';
import type { ColumnItem } from './charts/ColumnChart';

interface ResponseTimeChartProps {
  title: ReactNode;
  series?: number;
  className?: string;
}

/** «میانگین پاسخ‌دهی تیکت به تفکیک شعب» — horizontal bar chart, slowest branches first. */
export function ResponseTimeChart({ title, series = 2, className }: ResponseTimeChartProps) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBranchResponseTime(scopeForChart(scope, 'branch'));

  return (
    <Panel title={title} className={className}>
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => {
          const items: readonly ColumnItem[] = data.map((item) => ({
            label: item.branch,
            value: Math.round(item.avgResponseMinutes),
            share: undefined,
          }));
          return (
            <HorizontalBarChart
              label="میانگین پاسخ‌دهی (دقیقه)"
              items={items}
              series={series}
              selected={scope.filters.branch}
              onSelect={(value) => toggle('branch', value)}
              format={(v) => `${v} دقیقه`}
            />
          );
        }}
      </ChartState>
    </Panel>
  );
}
