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
import { FilterChips } from '../components/FilterChips';
import { KpiCards } from '../components/KpiCards';
import { OperatorsTab } from '../components/OperatorsTab';
import { ReasonsTab } from '../components/ReasonsTab';
import { SentimentTab } from '../components/SentimentTab';
import { TicketAnalyticsTab } from '../components/TicketAnalyticsTab';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { analyticsKeys } from '../hooks/analyticsQueries';
import './DashboardPage.css';

const TABS = [
  { id: 'tickets', label: 'تحلیل تیکت‌ها' },
  { id: 'reasons', label: 'دلایل تماس و تشخیص AI' },
  { id: 'sentiment', label: 'تحلیل احساسات' },
  { id: 'operators', label: 'عملکرد اپراتورها' },
  { id: 'calls', label: 'تماس‌ها و ساعات پیک' },
] as const satisfies readonly TabItem<string>[];
type TabId = (typeof TABS)[number]['id'];

const periodOptions = PERIODS.map((value) => ({ value, label: periodLabels[value] }));

/**
 * Main dashboard (README → «داشبورد اصلی»). Analytics and reports live here — there is no
 * separate reports page. Filters and the time range are shared across the three tabs.
 */
export function DashboardPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const period = useDashboardFilterStore((state) => state.period);
  const setPeriod = useDashboardFilterStore((state) => state.setPeriod);
  const tab: TabId = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'tickets';

  const changeTab = (id: TabId) =>
    setParams(id === 'tickets' ? {} : { tab: id }, { replace: true });

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
              value={period}
              onChange={setPeriod}
            />
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
      <KpiCards />

      <Tabs tabs={TABS} active={tab} onChange={changeTab} label="بخش‌های داشبورد">
        {tab === 'tickets' && <TicketAnalyticsTab />}
        {tab === 'reasons' && <ReasonsTab />}
        {tab === 'sentiment' && <SentimentTab />}
        {tab === 'operators' && <OperatorsTab />}
        {tab === 'calls' && <CallsTab />}
      </Tabs>
    </section>
  );
}
