import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { EmptyState, ErrorState, PageHeader, SkeletonTable, StatusBadge } from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import { PriorityBadge, SentimentBadge, TicketStatusBadge } from '../components/TicketBadges';
import { useTicket } from '../hooks/ticketQueries';
import { ticketPaths } from '../ticketPaths';
import './TicketDetailPage.css';

function Row({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn('summary__row', wide && 'summary__row--wide')}>
      <dt>{label}</dt>
      <dd>{children || <span className="summary__muted">—</span>}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="summary__group">
      <h3 className="summary__title">{title}</h3>
      <dl className="summary__grid">{children}</dl>
    </section>
  );
}

/** «فیلدهای کلیدی», mirroring the CRM detail page (CRM is the source of truth). */
function CrmFields({ ticket }: { ticket: Ticket }) {
  return (
    <>
      <Group title="اطلاعات مشتری">
        <Row label="نام مشتری">{ticket.customer.fullName}</Row>
        <Row label="کدملی">{formatPersianNumber(ticket.customer.nationalId)}</Row>
        <Row label="موبایل">{formatPersianNumber(ticket.customer.mobile)}</Row>
        <Row label="مشتری سازمانی">{ticket.customer.corporateName}</Row>
      </Group>
      <Group title="فیلدهای کلیدی">
        <Row label="زمان ایجاد">{formatDateTime(ticket.createdAt)}</Row>
        <Row label="کانال">{ticket.channel}</Row>
        <Row label="رشته بیمه">{ticket.insuranceLine}</Row>
        <Row label="نام شعبه">{ticket.branch}</Row>
        <Row label="نوع اصلی شکایت">{ticket.subject.level1}</Row>
        <Row label="نوع شکایت">{ticket.subject.level2}</Row>
        <Row label="علت شکایت">{ticket.subject.level3}</Row>
        <Row label="مالک شکایت">{ticket.complaintOwner}</Row>
        <Row label="مالک پیگیری">{ticket.followUpOwner}</Row>
        <Row label="متن شکایت" wide>
          {ticket.complaintText}
        </Row>
        <Row label="پاسخ نهایی" wide>
          {ticket.finalResponse}
        </Row>
      </Group>
    </>
  );
}

/** SMART-only data (AI + voice) attached to the CRM ticket. */
function Enrichment({ enrichment }: { enrichment: Ticket['enrichment'] }) {
  if (!enrichment) return <EmptyState message="تحلیل هوشمندی برای این تیکت ثبت نشده است." />;

  return (
    <>
      <Group title="تحلیل هوشمند">
        <Row label="احساس مشتری">
          <SentimentBadge sentiment={enrichment.sentiment} />
        </Row>
        <Row label="اولویت">
          <PriorityBadge priority={enrichment.priority} />
        </Row>
        <Row label="برچسب‌های AI" wide>
          <span className="summary__tags">
            {enrichment.aiTags.map((tag) => (
              <StatusBadge key={tag} tone="info">
                {tag}
              </StatusBadge>
            ))}
          </span>
        </Row>
      </Group>
      <section className="summary__group">
        <h3 className="summary__title">مکالمه</h3>
        <dl className="summary__grid">
          <Row label="Voice ID">
            <bdi>{enrichment.voiceId && formatPersianNumber(enrichment.voiceId)}</bdi>
          </Row>
        </dl>
        <p className="transcript">{enrichment.transcript ?? 'متن مکالمه موجود نیست.'}</p>
      </section>
    </>
  );
}

export function TicketDetailPage() {
  const { ticketId = '' } = useParams();
  const { data: ticket, isPending, isError, refetch } = useTicket(ticketId);

  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت تیکت با خطا مواجه شد." onRetry={() => refetch()} />;
  if (!ticket)
    return (
      <EmptyState mascot message="تیکتی با این شماره پیدا نشد.">
        <Link className="btn btn--ghost" to={ticketPaths.list}>
          بازگشت به تیکت‌ها
        </Link>
      </EmptyState>
    );

  return (
    <section>
      <PageHeader
        title={<span className="summary__tracking">تیکت {formatPersianNumber(ticket.id)}</span>}
        subtitle={
          <span className="ticket-heading-meta">
            <StatusBadge tone="info">{ticket.type}</StatusBadge>
            <TicketStatusBadge status={ticket.status} />
          </span>
        }
        actions={
          <Link className="btn btn--ghost" to={ticketPaths.list}>
            بازگشت به تیکت‌ها
          </Link>
        }
      />
      <div className="ticket-detail">
        <div className="summary">
          <CrmFields ticket={ticket} />
        </div>
        <div className="summary summary--side">
          <Enrichment enrichment={ticket.enrichment} />
        </div>
      </div>
    </section>
  );
}
