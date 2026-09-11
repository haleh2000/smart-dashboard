import { useQueryClient } from '@tanstack/react-query';
import { Button, PageHeader } from '@/shared/ui';
import { subjectDrillLevel } from '../../domain/filters';
import { BreakdownPanel } from '../components/BreakdownPanel';
import { FilterChips } from '../components/FilterChips';
import { KpiCards } from '../components/KpiCards';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { dimensionLabels } from '../dimensionLabels';
import { analyticsKeys } from '../hooks/analyticsQueries';
import './DashboardPage.css';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const filters = useDashboardFilterStore((state) => state.filters);
  const subjectDimension = subjectDrillLevel(filters);
  const subjectPath = [filters.subject1, filters.subject2].filter(Boolean).join(' › ');

  return (
    <section className="dashboard">
      <PageHeader
        title="داشبورد"
        subtitle="عملکرد پشتیبانی بر اساس جدول تیکت‌ها؛ هر نمودار کل صفحه را فیلتر می‌کند."
        actions={
          <Button
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: analyticsKeys.all })}
          >
            به‌روزرسانی
          </Button>
        }
      />

      <FilterChips />
      <KpiCards />

      <div className="dashboard__grid dashboard__grid--wide">
        <BreakdownPanel
          title={`پراکندگی ${dimensionLabels[subjectDimension]}${subjectPath ? ` — ${subjectPath}` : ''}`}
          dimension={subjectDimension}
          series={1}
        />
        <BreakdownPanel title="توزیع بین شعب" dimension="branch" series={5} />
      </div>

      <div className="dashboard__grid">
        <BreakdownPanel title="نوع کانال" dimension="type" series={2} />
        <BreakdownPanel title="کانال ورودی" dimension="channel" series={3} />
        <BreakdownPanel title="رشته بیمه" dimension="insuranceLine" series={4} />
      </div>
    </section>
  );
}
