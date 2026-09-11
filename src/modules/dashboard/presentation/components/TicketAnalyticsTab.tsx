import { Panel } from '@/shared/ui';
import { scopeForChart, SUBJECT_DIMENSIONS, type Dimension } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { dimensionLabels } from '../dimensionLabels';
import {
  useBreakdown,
  useCrossBreakdown,
  useSubjectLineTable,
  useSubjectTable,
  useTrend,
} from '../hooks/analyticsQueries';
import { BreakdownPanel } from './BreakdownPanel';
import { ChartState } from './ChartState';
import { DonutChart } from './DonutChart';
import { SentimentBar } from './SentimentBar';
import { StackedBars } from './StackedBars';
import { SubjectLineTable } from './SubjectLineTable';
import { SubjectTree } from './SubjectTree';
import { TrendChart } from './TrendChart';

function SubjectDonut() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('subject1', scopeForChart(scope, ...SUBJECT_DIMENSIONS));
  return (
    <Panel title="پراکندگی موضوع اصلی تماس">
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => (
          <DonutChart
            label="پراکندگی موضوع اصلی"
            items={data}
            selected={scope.filters.subject1}
            onSelect={(value) => toggle('subject1', value)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function CrossPanel({ title, row, column }: { title: string; row: Dimension; column: Dimension }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const togglePair = useDashboardFilterStore((state) => state.togglePair);
  // A subject row also resets deeper levels, so the row dimension drops its children too.
  const own: Dimension[] = row === 'subject1' ? [...SUBJECT_DIMENSIONS, column] : [row, column];
  const query = useCrossBreakdown(row, column, scopeForChart(scope, ...own));
  return (
    <Panel title={title}>
      <ChartState query={query} isEmpty={(data) => data.rows.length === 0}>
        {(data) => (
          <StackedBars
            data={data}
            selectedRow={scope.filters[row]}
            selectedColumn={scope.filters[column]}
            onSelectRow={(value) => toggle(row, value)}
            onSelectSegment={(r, c) => togglePair([row, r], [column, c])}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function SubjectTreePanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useSubjectTable(scopeForChart(scope, ...SUBJECT_DIMENSIONS));
  return (
    <Panel title="Subject1، Subject2، Subject3 — جدول سلسله‌مراتبی موضوعات">
      <ChartState query={query} isEmpty={(data) => data.length === 0} skeletonRows={6}>
        {(data) => <SubjectTree rows={data} filters={scope.filters} onSelect={selectSubject} />}
      </ChartState>
    </Panel>
  );
}

function SentimentPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('sentiment', scopeForChart(scope, 'sentiment'));
  return (
    <Panel title="تحلیل احساسات مشتریان">
      <ChartState query={query} isEmpty={(data) => data.length === 0} skeletonRows={2}>
        {(data) => (
          <SentimentBar
            items={data}
            selected={scope.filters.sentiment}
            onSelect={(value) => toggle('sentiment', value)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function TrendPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useTrend('type', scopeForChart(scope, 'type'));
  return (
    <Panel title="روند هفتگی کانال‌های ارتباطی (نوع کانال)">
      <ChartState query={query} isEmpty={(data) => data.buckets.length === 0}>
        {(data) => (
          <TrendChart
            data={data}
            selected={scope.filters.type}
            onSelect={(v) => toggle('type', v)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function SubjectLinePanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useSubjectLineTable(scopeForChart(scope, ...SUBJECT_DIMENSIONS, 'insuranceLine'));
  return (
    <Panel title="درصد سهم هر علت (Subject3) به تفکیک رشته بیمه">
      <ChartState query={query} isEmpty={(data) => data.rows.length === 0} skeletonRows={6}>
        {(data) => (
          <SubjectLineTable data={data} filters={scope.filters} onSelect={selectSubject} />
        )}
      </ChartState>
    </Panel>
  );
}

/** Power BI «Analysis Reports» parity: every chart cross-filters the whole dashboard. */
export function TicketAnalyticsTab() {
  return (
    <div className="dashboard__section">
      <div className="dashboard__grid dashboard__grid--wide">
        <SubjectDonut />
        <SentimentPanel />
      </div>
      <div className="dashboard__grid dashboard__grid--wide">
        <CrossPanel
          title={`${dimensionLabels.subject1} به تفکیک ${dimensionLabels.type} (٪ از کل ردیف)`}
          row="subject1"
          column="type"
        />
        <CrossPanel
          title={`${dimensionLabels.channel} به تفکیک ${dimensionLabels.type} (٪ از کل ردیف)`}
          row="channel"
          column="type"
        />
      </div>
      <SubjectTreePanel />
      <TrendPanel />
      <div className="dashboard__grid">
        <BreakdownPanel title="توزیع بین شعب" dimension="branch" series={1} />
        <BreakdownPanel title="رشته بیمه" dimension="insuranceLine" series={4} />
        <BreakdownPanel title="کانال ورودی" dimension="channel" series={3} />
      </div>
      <SubjectLinePanel />
    </div>
  );
}
