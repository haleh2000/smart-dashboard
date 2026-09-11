import { BarList, Panel } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useOperatorStats } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { OperatorTable } from './OperatorTable';

const ranking = (values: readonly { operator: string; value: number }[]) => {
  const total = values.reduce((sum, v) => sum + v.value, 0);
  return [...values]
    .sort((a, b) => b.value - a.value)
    .map((v) => ({ label: v.operator, count: v.value, share: total ? v.value / total : 0 }));
};

/** README → «عملکرد اپراتورها»: calls and tickets per operator, response and handling time. */
export function OperatorsTab() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useOperatorStats(scopeForChart(scope, 'operator'));
  const selected = scope.filters.operator;
  const select = (operator: string) => toggle('operator', operator);

  return (
    <ChartState query={query} isEmpty={(data) => data.length === 0} skeletonRows={8}>
      {(stats) => (
        <div className="dashboard__section">
          <Panel title="عملکرد اپراتورها">
            <OperatorTable stats={stats} selected={selected} onSelect={select} />
          </Panel>
          <div className="dashboard__grid dashboard__grid--wide">
            <Panel title="تعداد تیکت هر اپراتور">
              <BarList
                rows={ranking(stats.map((s) => ({ operator: s.operator, value: s.ticketCount })))}
                series={1}
                selected={selected}
                onSelect={select}
              />
            </Panel>
            <Panel title="تعداد تماس هر اپراتور">
              <BarList
                rows={ranking(stats.map((s) => ({ operator: s.operator, value: s.callCount })))}
                series={3}
                selected={selected}
                onSelect={select}
              />
            </Panel>
          </div>
        </div>
      )}
    </ChartState>
  );
}
