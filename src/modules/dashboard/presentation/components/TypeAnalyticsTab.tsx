import { detailStatusesForType, hasSla } from '@/modules/tickets';
import { formatElapsed, formatPersianNumber } from '@/shared/lib/format';
import { Panel } from '@/shared/ui';
import { scopeForChart, SUBJECT_DIMENSIONS } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import {
  useBranchSla,
  useBreakdown,
  useSubjectLineTable,
  useSubjectTable,
} from '../hooks/analyticsQueries';
import { BreakdownPanel } from './BreakdownPanel';
import { ChartState } from './ChartState';
import { ColumnChart } from './charts/ColumnChart';
import { ResponseTimeChart } from './ResponseTimeChart';
import { SubjectLineTable } from './SubjectLineTable';
import { SubjectTree } from './SubjectTree';


function DetailStatusPanel({ type }: { type: string }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('detailStatus', scopeForChart(scope, 'detailStatus'));
  return (
    <Panel title={`وضعیت تیکت‌های ${type} (باز / بسته‌شده)`}>
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => {
          const order = detailStatusesForType(type);
          const countOf = new Map(data.map((item) => [item.value, item.count]));
          const total = order.reduce((sum, status) => sum + (countOf.get(status) ?? 0), 0);
          const items = order.map((status) => {
            const count = countOf.get(status) ?? 0;
            return { label: status, value: count, share: total ? count / total : 0 };
          });
          return (
            <ColumnChart
              label={`وضعیت ${type}`}
              series={1}
              items={items}
              selected={scope.filters.detailStatus}
              onSelect={(label) => toggle('detailStatus', label)}
            />
          );
        }}
      </ChartState>
    </Panel>
  );
}

function BranchSlaPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBranchSla(scopeForChart(scope, 'branch', 'type'));
  return (
    <Panel title="ارجاع به شعب و SLA پاسخ‌گویی شعبه">
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => (
          <ul className="repeat-reasons">
            {data.map((row) => (
              <li key={row.branch}>
                <button
                  type="button"
                  className="repeat-reasons__row"
                  onClick={() => toggle('branch', row.branch)}
                  aria-pressed={scope.filters.branch === row.branch}
                >
                  <span className="repeat-reasons__name">{row.branch}</span>
                  <span className="repeat-reasons__meta">
                    {formatPersianNumber(row.referred)} ارجاع · میانگین{' '}
                    {row.avgResolveDays ? formatElapsed(row.avgResolveDays * 86400) : '—'} ·{' '}
                    {formatPersianNumber(row.overdue)} خارج از SLA
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ChartState>
    </Panel>
  );
}

function SubjectPanels() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const tableQuery = useSubjectTable(scopeForChart(scope, ...SUBJECT_DIMENSIONS, 'type'));
  const lineQuery = useSubjectLineTable(
    scopeForChart(scope, ...SUBJECT_DIMENSIONS, 'insuranceLine', 'type'),
  );
  return (
    <>
      <Panel title="جدول سلسله‌مراتبی موضوعات این ماژول">
        <ChartState query={tableQuery} isEmpty={(data) => data.length === 0} skeletonRows={6}>
          {(data) => <SubjectTree rows={data} filters={scope.filters} onSelect={selectSubject} />}
        </ChartState>
      </Panel>
      <Panel title="سهم هر علت به تفکیک رشته بیمه">
        <ChartState query={lineQuery} isEmpty={(data) => data.rows.length === 0} skeletonRows={6}>
          {(data) => (
            <SubjectLineTable data={data} filters={scope.filters} onSelect={selectSubject} />
          )}
        </ChartState>
      </Panel>
    </>
  );
}

export function TypeAnalyticsTab({ type }: { type: string }) {
  const sla = hasSla(type);
  return (
    <div className="dashboard__section">
      <DetailStatusPanel type={type} />
      <div className="dashboard__grid dashboard__grid--wide">
        <BreakdownPanel title="رشته بیمه" dimension="insuranceLine" series={3} />
        <BreakdownPanel
          title="مشتری سازمانی (درمان؛ بقیه «بدون مقدار»)"
          dimension="corporate"
          series={4}
        />
      </div>
      <BreakdownPanel
        title="توزیع بین شعب (ارجاع)"
        dimension="branch"
        series={0}
        variant="columns"
      />
      {sla && <BranchSlaPanel />}
      <div className="dashboard__grid dashboard__grid--wide">
        <ResponseTimeChart title="میانگین پاسخ‌دهی (شعب)" series={2} />
        <BreakdownPanel title="کانال ورود" dimension="channel" series={1} />
      </div>
      <SubjectPanels />
    </div>
  );
}
