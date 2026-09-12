import { StatCard, Panel } from '@/shared/ui';
import { formatPersianNumber, formatDuration } from '@/shared/lib/format';
import { useAgentWorkspaceData } from '../hooks/agentWorkspaceQueries';
import './PersonalShiftSummary.css';

export function PersonalShiftSummary() {
  const { data, isLoading, isError } = useAgentWorkspaceData();

  if (isLoading) {
    return (
      <Panel title="خلاصه شیفت من" className="shift-summary loading">
        <div className="shift-summary__skeleton">
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      </Panel>
    );
  }
  if (isError) {
    return (
      <Panel title="خلاصه شیفت من" className="shift-summary error">
        <div className="shift-summary__error">خطا در بارگذاری آمار</div>
      </Panel>
    );
  }

  const summary = data?.shiftSummary;

  return (
    <Panel title="خلاصه شیفت من" className="shift-summary">
      <div className="shift-summary__grid">
        <StatCard
          label="تماس‌های امروز"
          value={formatPersianNumber(summary?.callsHandledToday ?? 0)}
          tone="primary"
          icon="📞"
        />
        <StatCard
          label="تیکت‌های حل شده"
          value={formatPersianNumber(summary?.ticketsResolvedToday ?? 0)}
          tone="success"
          icon="✅"
        />
        <StatCard
          label="متوسط زمان رسیدگی"
          value={summary?.avgHandleTimeSec ? formatDuration(summary.avgHandleTimeSec) : '—'}
          tone="neutral"
          icon="⏱️"
        />
        <StatCard
          label="مدت وضعیت فعلی"
          value={summary?.currentStatusDurationSec ? formatDuration(summary.currentStatusDurationSec) : '—'}
          tone="neutral"
          icon="🕐"
        />
      </div>
    </Panel>
  );
}