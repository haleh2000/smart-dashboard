import { formatElapsed, formatPercent } from '@/shared/lib/format';
import { Panel } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useOperatorStats } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { GroupedColumnChart } from './charts/GroupedColumnChart';
import { HorizontalBarChart } from './charts/HorizontalBarChart';
import { OperatorRadar } from './OperatorRadar';
import { OperatorTable } from './OperatorTable';

/** README → «عملکرد اپراتورها»: calls and tickets per operator, response and handling time. */
export function OperatorsTab() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useOperatorStats(scopeForChart(scope, 'operator'));
  const selected = scope.filters.operator;
  const select = (operator: string) => toggle('operator', operator);

  return (
    <ChartState query={query} isEmpty={(data) => data.length === 0} skeletonRows={8}>
      {(stats) => {
        const rows = stats.map((s) => ({ ...s, label: s.operator }));
        const ranked = (value: (s: (typeof rows)[number]) => number) =>
          [...rows]
            .sort((a, b) => value(b) - value(a))
            .map((s) => ({ label: s.label, value: value(s) }));
        return (
          <div className="dashboard__section">
            <Panel title="تیکت‌ها و تماس‌های هر اپراتور">
              <GroupedColumnChart
                label="تیکت‌ها و تماس‌های هر اپراتور"
                rows={rows}
                series={[
                  { key: 'tickets', name: 'تیکت‌ها', series: 0 },
                  { key: 'closed', name: 'تیکت‌های بسته‌شده', series: 4 },
                  { key: 'calls', name: 'تماس‌ها', series: 2 },
                ]}
                value={(row, key) =>
                  key === 'tickets'
                    ? row.ticketCount
                    : key === 'closed'
                      ? row.closedTicketCount
                      : row.callCount
                }
                selected={selected}
                onSelect={select}
              />
            </Panel>
            <div className="dashboard__grid dashboard__grid--wide">
              <Panel title="پروفایل عملکرد اپراتور در برابر میانگین تیم">
                <OperatorRadar stats={stats} selected={selected} />
              </Panel>
              <Panel title="نرخ حل در اولین تماس (FCR)">
                <HorizontalBarChart
                  label="FCR"
                  items={ranked((s) => s.fcrRate)}
                  series={0}
                  format={formatPercent}
                  selected={selected}
                  onSelect={select}
                />
              </Panel>
              <Panel title="میانگین زمان رسیدگی (مکالمه)">
                <HorizontalBarChart
                  label="میانگین زمان مکالمه"
                  items={ranked((s) => s.avgHandlingSec)}
                  series={3}
                  format={formatElapsed}
                  selected={selected}
                  onSelect={select}
                />
              </Panel>
            </div>
            <Panel title="جدول عملکرد اپراتورها">
              <OperatorTable stats={stats} selected={selected} onSelect={select} />
            </Panel>
          </div>
        );
      }}
    </ChartState>
  );
}
