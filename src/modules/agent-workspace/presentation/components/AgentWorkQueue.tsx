import { Link } from 'react-router';
import { DataTable, StatCard, StatusBadge, PriorityBadge, SentimentBadge } from '@/shared/ui';
import { formatPersianNumber } from '@/shared/lib/format';
import { ticketPaths, ticketStatusMeta } from '@/modules/tickets';
import { useAgentWorkspaceData } from '../hooks/agentWorkspaceQueries';
import type { AgentWorkQueueItem } from '../../domain';
import './AgentWorkQueue.css';

const COLUMNS = [
  {
    header: 'شناسه',
    cell: (item: AgentWorkQueueItem) => (
      <Link to={ticketPaths.detail(item.ticket.id)} className="work-queue__ticket-link">
        {formatPersianNumber(item.ticket.id)}
      </Link>
    ),
    interactive: true,
  },
  {
    header: 'مشتری',
    cell: (item: AgentWorkQueueItem) => (
      <div className="work-queue__customer">
        <span className="work-queue__customer-name">{item.ticket.customer.fullName}</span>
        <span className="work-queue__customer-id">
          {formatPersianNumber(item.ticket.customer.nationalId)}
        </span>
      </div>
    ),
  },
  {
    header: 'موضوع',
    cell: (item: AgentWorkQueueItem) => (
      <span className="work-queue__subject">
        {item.ticket.subject.level1} / {item.ticket.subject.level2}
      </span>
    ),
  },
  {
    header: 'وضعیت',
    cell: (item: AgentWorkQueueItem) => {
      const meta = ticketStatusMeta[item.ticket.status];
      return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
    },
  },
  {
    header: 'اولویت',
    cell: (item: AgentWorkQueueItem) => {
      const priority = item.ticket.enrichment?.priority;
      if (!priority) return <span className="work-queue__na">—</span>;
      return <PriorityBadge priority={priority} />;
    },
  },
  {
    header: 'احساسات',
    cell: (item: AgentWorkQueueItem) => {
      const sentiment = item.ticket.enrichment?.sentiment;
      if (!sentiment) return <span className="work-queue__na">—</span>;
      return <SentimentBadge sentiment={sentiment} />;
    },
  },
  {
    header: 'SLA',
    cell: (item: AgentWorkQueueItem) => (
      <div className={`work-queue__sla ${item.isOverdue ? 'work-queue__sla--overdue' : ''} ${item.slaRemainingDays <= 1 ? 'work-queue__sla--critical' : ''}`}>
        <span className="work-queue__sla-value">{formatPersianNumber(item.slaRemainingDays)}</span>
        <span className="work-queue__sla-unit">روز</span>
        {item.isOverdue && <span className="work-queue__sla-badge">معوق</span>}
        {item.slaRemainingDays === 0 && !item.isOverdue && <span className="work-queue__sla-badge work-queue__sla-badge--today">امروز</span>}
      </div>
    ),
  },
  {
    header: '',
    cell: (item: AgentWorkQueueItem) => (
      <Link to={ticketPaths.detail(item.ticket.id)} className="work-queue__action-link">
        <button type="button" className="btn btn--primary btn--sm work-queue__action-btn">
          رسیدگی
        </button>
      </Link>
    ),
    interactive: true,
  },
] as const;

export function AgentWorkQueue() {
  const { data, isLoading, isError } = useAgentWorkspaceData();

  const overdueCount = data?.workQueue.filter((i) => i.isOverdue).length ?? 0;
  const criticalCount = data?.workQueue.filter((i) => i.slaRemainingDays <= 1 && !i.isOverdue).length ?? 0;

  if (isLoading) {
    return (
      <section className="agent-work-queue" aria-label="صف کار کارشناس">
        <div className="agent-work-queue__header">
          <h3 className="agent-work-queue__title">صف کار من</h3>
          <StatCard label="تیکت‌های باز" value="—" />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={[]}
          rowKey={(r: AgentWorkQueueItem) => r.ticket.id}
          caption="در حال بارگذاری صف کار..."
        />
      </section>
    );
  }
  if (isError) {
    return (
      <section className="agent-work-queue" aria-label="صف کار کارشناس">
        <div className="agent-work-queue__header">
          <h3 className="agent-work-queue__title">صف کار من</h3>
          <StatCard label="تیکت‌های باز" value="—" tone="error" />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={[]}
          rowKey={(r: AgentWorkQueueItem) => r.ticket.id}
          caption="خطا در بارگذاری صف کار"
        />
      </section>
    );
  }

  const workQueue = data?.workQueue ?? [];

  return (
    <section className="agent-work-queue" aria-label="صف کار کارشناس">
      <div className="agent-work-queue__header">
        <h3 className="agent-work-queue__title">صف کار من</h3>
        <div className="agent-work-queue__stats">
          <StatCard
            label="تیکت‌های باز"
            value={formatPersianNumber(workQueue.length)}
            tone="primary"
          />
          {overdueCount > 0 && (
            <StatCard
              label="معوق"
              value={formatPersianNumber(overdueCount)}
              tone="error"
              hint="نیاز به اقدام فوری"
            />
          )}
          {criticalCount > 0 && overdueCount === 0 && (
            <StatCard
              label="حرج (≤۱ روز)"
              value={formatPersianNumber(criticalCount)}
              tone="warning"
              hint="در آستانه معوقی"
            />
          )}
        </div>
      </div>

      {workQueue.length === 0 ? (
        <div className="agent-work-queue__empty">
          <div className="agent-work-queue__empty-icon" aria-hidden="true">✓</div>
          <p className="agent-work-queue__empty-text">صف کار شما خالی است</p>
          <span className="agent-work-queue__empty-hint">هیچ تیکت بازی به شما تخصیص نیافته است</span>
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={workQueue}
          rowKey={(item) => item.ticket.id}
        />
      )}
    </section>
  );
}