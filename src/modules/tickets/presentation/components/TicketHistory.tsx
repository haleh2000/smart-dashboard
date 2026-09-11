import { formatDateTime } from '@/shared/lib/format';
import {
  DataTable,
  EmptyState,
  ErrorState,
  InfoCard,
  SkeletonTable,
  StatusBadge,
} from '@/shared/ui';
import { useTicketTimeline, useTicketUpdates } from '../hooks/ticketQueries';
import { eventMeta } from '../ticketLabels';
import './TicketHistory.css';

/** «جریان‌ها»: the ticket's life, oldest first. */
export function TicketTimeline({ ticketId }: { ticketId: string }) {
  const { data: events, isPending, isError, refetch } = useTicketTimeline(ticketId);

  if (isPending) return <SkeletonTable rows={5} />;
  if (isError)
    return <ErrorState message="دریافت جریان‌ها با خطا مواجه شد." onRetry={() => refetch()} />;
  if (events.length === 0) return <EmptyState message="رویدادی برای این تیکت ثبت نشده است." />;

  return (
    <InfoCard title="جریان‌ها">
      <ol className="timeline">
        {events.map((event) => (
          <li key={event.id} className="timeline__item">
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__body">
              <span className="timeline__head">
                <StatusBadge tone={eventMeta[event.kind].tone}>
                  {eventMeta[event.kind].label}
                </StatusBadge>
                <time className="timeline__time">{formatDateTime(event.at)}</time>
              </span>
              <p className="timeline__text">
                {event.description} <span className="timeline__actor">— {event.actor}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

/** «آپدیت‌ها»: CRM field changes. */
export function TicketUpdates({ ticketId }: { ticketId: string }) {
  const { data: updates, isPending, isError, refetch } = useTicketUpdates(ticketId);

  if (isPending) return <SkeletonTable rows={4} />;
  if (isError)
    return <ErrorState message="دریافت آپدیت‌ها با خطا مواجه شد." onRetry={() => refetch()} />;
  if (updates.length === 0) return <EmptyState message="آپدیتی برای این تیکت ثبت نشده است." />;

  return (
    <DataTable
      rows={updates}
      rowKey={(update) => update.id}
      columns={[
        { header: 'زمان', cell: (u) => formatDateTime(u.at) },
        { header: 'فیلد', cell: (u) => u.field },
        {
          header: 'مقدار قبلی',
          cell: (u) => u.from ?? <span className="queue-table__muted">—</span>,
        },
        { header: 'مقدار جدید', cell: (u) => u.to },
        { header: 'توسط', cell: (u) => u.actor },
      ]}
    />
  );
}
