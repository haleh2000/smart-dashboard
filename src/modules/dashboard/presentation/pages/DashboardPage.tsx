import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { PERIODS } from '@/shared/domain/period';
import {
  Button,
  PageHeader,
  periodLabels,
  SegmentedControl,
  Tabs,
  type TabItem,
} from '@/shared/ui';
import { CallsTab } from '../components/CallsTab';
import { CustomRangeFilter } from '../components/CustomRangeFilter';
import { FilterChips } from '../components/FilterChips';
import { KpiCards } from '../components/KpiCards';
import { OverviewTab } from '../components/OverviewTab';
import { TypeAnalyticsTab } from '../components/TypeAnalyticsTab';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { analyticsKeys } from '../hooks/analyticsQueries';
import { AgentWorkspaceView } from '@/modules/agent-workspace';
import { useCurrentUser } from '@/modules/auth';
import './DashboardPage.css';


const TABS = [
  { id: 'overview', label: 'کلی' },
  { id: 'calls', label: 'تماس‌ها' },
  { id: 'complaints', label: 'شکایات' },
  { id: 'followups', label: 'پیگیری‌ها' },
  { id: 'requests', label: 'درخواست‌ها' },
  { id: 'suggestions', label: 'پیشنهادها' },
] as const satisfies readonly TabItem<string>[];
type TabId = (typeof TABS)[number]['id'];

const TAB_TYPE: Partial<Record<TabId, string>> = {
  complaints: 'شکایت',
  followups: 'پیگیری',
  requests: 'درخواست',
  suggestions: 'پیشنهاد',
};

const periodOptions = PERIODS.map((value) => ({ value, label: periodLabels[value] }));


export function DashboardPage() {
  const { role } = useCurrentUser();
  const isAgent = role === 'agent';

  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const period = useDashboardFilterStore((state) => state.period);
  const setPeriod = useDashboardFilterStore((state) => state.setPeriod);
  const customRange = useDashboardFilterStore((state) => state.customRange);
  const setDimension = useDashboardFilterStore((state) => state.setDimension);
  const tab: TabId = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'overview';

  useEffect(() => {
    setDimension('type', TAB_TYPE[tab]);
  }, [tab, setDimension]);

  const changeTab = (id: TabId) =>
    setParams(id === 'overview' ? {} : { tab: id }, { replace: true });

  if (isAgent) {
    return <AgentWorkspaceView />;
  }

  const ticketType = TAB_TYPE[tab];

  return (
    <section className="dashboard">
      <PageHeader
        title="داشبورد"
        subtitle="عملکرد پشتیبانی بر اساس تیکت‌ها و تماس‌ها؛ هر نمودار کل صفحه را فیلتر می‌کند."
        actions={
          <>
            <SegmentedControl
              label="فیلتر زمانی"
              options={periodOptions}
              value={customRange ? null : period}
              onChange={setPeriod}
            />
            <CustomRangeFilter />
            <Button
              variant="ghost"
              onClick={() => queryClient.invalidateQueries({ queryKey: analyticsKeys.all })}
            >
              به‌روزرسانی
            </Button>
          </>
        }
      />

      <FilterChips />
      {tab === 'calls' ? (
        <KpiCards ticketType="calls" />
      ) : ticketType ? (
        <KpiCards ticketType={ticketType} />
      ) : (
        <KpiCards />
      )}

      <Tabs tabs={TABS} active={tab} onChange={changeTab} label="بخش‌های داشبورد">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'calls' && <CallsTab />}
        {tab === 'complaints' && <TypeAnalyticsTab type="شکایت" />}
        {tab === 'followups' && <TypeAnalyticsTab type="پیگیری" />}
        {tab === 'requests' && <TypeAnalyticsTab type="درخواست" />}
        {tab === 'suggestions' && <TypeAnalyticsTab type="پیشنهاد" />}
      </Tabs>
    </section>
  );
}
