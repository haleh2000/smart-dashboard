import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel, StatCard } from '@/shared/ui';
import { TICKET_TYPES } from '@/modules/tickets';
import { scopeForChart, SUBJECT_DIMENSIONS } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { channelOrder } from '../dimensionLabels';
import {
  useBreakdown,
  useCrossBreakdown,
  useSubjectLineTable,
  useSubjectTable,
  useTrend,
} from '../hooks/analyticsQueries';
import { BreakdownPanel } from './BreakdownPanel';
import { ChartState } from './ChartState';
import { CrossHeatmap } from './CrossHeatmap';
import { DonutChart } from './DonutChart';
import { StackedBars } from './StackedBars';
import { SubjectLineTable } from './SubjectLineTable';
import { SubjectTree } from './SubjectTree';
import { AreaTrendChart } from './charts/AreaTrendChart';


function AllTypesPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('type', scopeForChart(scope, 'type'));
  const selected = scope.filters.type;
  return (
    <Panel title=" همه موضوعات">
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(items) => {
          const byType = new Map(items.map((item) => [item.value, item]));
          const total = items.reduce((sum, item) => sum + item.count, 0);
          return (
            <div className="cards">
              {TICKET_TYPES.map((type) => {
                const item = byType.get(type);
                const count = item?.count ?? 0;
                const share = total ? count / total : 0;
                return (
                  <StatCard
                    key={type}
                    label={type}
                    value={`${formatPersianNumber(count)} (${formatPercent(share)})`}
                    hint={total ? `از ${formatPersianNumber(total)} کل` : undefined}
                    onClick={() => toggle('type', type)}
                    selected={selected === type}
                    dimmed={selected !== undefined && selected !== type}
                  />
                );
              })}
            </div>
          );
        }}
      </ChartState>
    </Panel>
  );
}

function TypeDonut() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('type', scopeForChart(scope, 'type'));
  return (
    <Panel title="پراکندگی موضوعات">
      <ChartState query={query} isEmpty={(data) => data.length === 0}>
        {(data) => (
          <DonutChart
            label="سهم ماژول"
            items={data}
            selected={scope.filters.type}
            onSelect={(value) => toggle('type', value)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function TypeTrend() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useTrend('type', scopeForChart(scope, 'type'));
  return (
    <Panel title="روند هفتگی ارتباطات">
      <ChartState query={query} isEmpty={(data) => data.buckets.length === 0}>
        {(data) => (
          <AreaTrendChart
            label="روند هفتگی نوع تیکت"
            data={data}
            selected={scope.filters.type}
            onSelect={(v) => toggle('type', v)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function TypeChannelPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const togglePair = useDashboardFilterStore((state) => state.togglePair);
  const query = useCrossBreakdown('subject1', 'type', scopeForChart(scope, ...SUBJECT_DIMENSIONS, 'type'));
  return (
    <Panel title="موضوع اصلی به تفکیک نوع درخواست">
      <ChartState query={query} isEmpty={(data) => data.rows.length === 0}>
        {(data) => (
          <StackedBars
            data={data}
            selectedRow={scope.filters.subject1}
            selectedColumn={scope.filters.type}
            onSelectRow={(value) => toggle('subject1', value)}
            onSelectSegment={(r, c) => togglePair(['subject1', r], ['type', c])}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function ChannelTypeHeatmap() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const togglePair = useDashboardFilterStore((state) => state.togglePair);
  const query = useCrossBreakdown('channel', 'type', scopeForChart(scope, 'channel', 'type'));
  return (
    <Panel title="کانال های ورودی ">
      <ChartState query={query} isEmpty={(data) => data.rows.length === 0}>
        {(data) => (
          <CrossHeatmap
            data={data}
            selectedRow={scope.filters.channel}
            selectedColumn={scope.filters.type}
            onSelectRow={(value) => toggle('channel', value)}
            onSelectSegment={(r, c) => togglePair(['channel', r], ['type', c])}
            rowOrder={channelOrder}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function CorporatePanel() {
  return <BreakdownPanel title="مشتری سازمانی" dimension="corporate" series={4} />;
}

function SubjectTreePanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useSubjectTable(scopeForChart(scope, ...SUBJECT_DIMENSIONS));
  return (
    <Panel title="جدول سلسله‌مراتبی موضوعات">
      <ChartState query={query} isEmpty={(data) => data.length === 0} skeletonRows={6}>
        {(data) => <SubjectTree rows={data} filters={scope.filters} onSelect={selectSubject} />}
      </ChartState>
    </Panel>
  );
}

function SubjectLinePanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useSubjectLineTable(scopeForChart(scope, ...SUBJECT_DIMENSIONS, 'insuranceLine'));
  return (
    <Panel title="درصد سهم هر علت به تفکیک رشته بیمه">
      <ChartState query={query} isEmpty={(data) => data.rows.length === 0} skeletonRows={6}>
        {(data) => (
          <SubjectLineTable data={data} filters={scope.filters} onSelect={selectSubject} />
        )}
      </ChartState>
    </Panel>
  );
}

export function OverviewTab() {
  return (
    <div className="dashboard__section">
      <AllTypesPanel />
      <div className="dashboard__grid dashboard__grid--wide">
        <TypeDonut />
        <CorporatePanel />
      </div>
      <div className="dashboard__grid dashboard__grid--wide">
        <TypeChannelPanel />
        <ChannelTypeHeatmap />
      </div>
      <TypeTrend />
      <BreakdownPanel
        title="توزیع تماس‌ها و تیکت‌ها بین شعب (ارجاع)"
        dimension="branch"
        series={0}
        variant="columns"
      />
      <div className="dashboard__grid dashboard__grid--wide">
        <BreakdownPanel title="رشته بیمه" dimension="insuranceLine" series={3} />
      </div>
      <SubjectTreePanel />
      <SubjectLinePanel />
    </div>
  );
}
