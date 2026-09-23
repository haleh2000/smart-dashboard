import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { CustomerInsuranceCard, customerPaths } from '@/modules/customers';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import {
  ActionMenu,
  EmptyState,
  ErrorState,
  InfoCard,
  InfoGrid,
  InfoRow,
  PageHeader,
  PriorityBadge,
  SentimentBadge,
  SkeletonTable,
  StatusBadge,
  TagList,
  Tabs,
  Transcript,
  VoicePlayer,
} from '@/shared/ui';
import { isOverdue, type Ticket } from '../../domain/ticket';
import { TicketStatusBadge } from '../components/TicketBadges';
import { TicketDocuments } from '../components/TicketDocuments';
import { TicketNotes } from '../components/TicketNotes';
import { TicketTimeline, TicketUpdates } from '../components/TicketHistory';
import { parseTicketListParams, toTicketFilter } from '../hooks/ticketListParams';
import { useAdjacentTickets, useTicket } from '../hooks/ticketQueries';
import { ticketPaths } from '../ticketPaths';
import './TicketDetailPage.css';

const genderLabels = { male: 'مرد', female: 'زن' } as const;

/** «فیلدهای کلیدی», mirroring the CRM detail page (CRM is the source of truth). */
function KeyFields({ ticket }: { ticket: Ticket }) {
  return (
    <InfoCard title="اطلاعات پرونده">
      <InfoGrid>
        <InfoRow label="کدملی">{formatPersianNumber(ticket.customer.nationalId)}</InfoRow>
        <InfoRow label="نام مشتری">
          <Link to={customerPaths.profile(ticket.customer.nationalId)}>
            {ticket.customer.fullName}
          </Link>
        </InfoRow>
        <InfoRow label="مشتری سازمانی">{ticket.customer.corporateName ? 'بله' : 'خیر'}</InfoRow>
        <InfoRow label="نام مشتری سازمانی">{ticket.customer.corporateName}</InfoRow>
        <InfoRow label="جنسیت">
          {ticket.customer.gender && genderLabels[ticket.customer.gender]}
        </InfoRow>
        <InfoRow label="نوع بیمه‌نامه">{ticket.insuranceLine}</InfoRow>
        <InfoRow label="موبایل">{formatPersianNumber(ticket.customer.mobile)}</InfoRow>
        <InfoRow label="نام شعبه">{ticket.branch}</InfoRow>
        <InfoRow label="کانال ورودی">{ticket.channel}</InfoRow>
        <InfoRow label="وضعیت">
          <TicketStatusBadge status={ticket.status} />
        </InfoRow>
        <InfoRow label="نوع اصلی شکایت">{ticket.subject.level1}</InfoRow>
        <InfoRow label="نوع شکایت">{ticket.subject.level2}</InfoRow>
        <InfoRow label="علت شکایت">{ticket.subject.level3}</InfoRow>
        <InfoRow label="شماره پرونده">
          {ticket.fileNumber && <bdi>{formatPersianNumber(ticket.fileNumber)}</bdi>}
        </InfoRow>
        <InfoRow label="مالک شکایت">{ticket.complaintOwner}</InfoRow>
        <InfoRow label="مالک پیگیری شکایت">{ticket.followUpOwner}</InfoRow>
        <InfoRow label="متن شکایت" wide>
          {ticket.complaintText}
        </InfoRow>
        <InfoRow label="پاسخ نهایی" wide>
          {ticket.finalResponse}
        </InfoRow>
        <InfoRow label="ریشه‌یابی" wide>
          {ticket.rootCause}
        </InfoRow>
        <InfoRow label="توضیحات" wide>
          {ticket.description}
        </InfoRow>
        <InfoRow label="درخواست مالک پیگیری تیکت" wide>
          {ticket.followUpRequest}
        </InfoRow>
        <InfoRow label="نظر امور مشتریان در خصوص SLA" wide>
          {ticket.slaOpinion}
        </InfoRow>
      </InfoGrid>
    </InfoCard>
  );
}

/** «مشخصات و زمانبندی تیکت». */
function Timing({ ticket }: { ticket: Ticket }) {
  const overdue = isOverdue(ticket);
  return (
    <InfoCard title="مشخصات و زمانبندی">
      <InfoGrid>
        <InfoRow label="زمان ایجاد">{formatDateTime(ticket.createdAt)}</InfoRow>
        <InfoRow label="اولین پاسخ">
          {ticket.firstResponseAt && formatDateTime(ticket.firstResponseAt)}
        </InfoRow>
        <InfoRow label="زمان بسته شدن">
          {ticket.closedAt && formatDateTime(ticket.closedAt)}
        </InfoRow>
        <InfoRow label="SLA باقی‌مانده (روز کاری)">
          {ticket.status === 'closed' ? (
            '—'
          ) : (
            <StatusBadge
              tone={overdue ? 'error' : ticket.slaRemainingDays <= 1 ? 'warning' : 'success'}
            >
              {overdue
                ? `${formatPersianNumber(-ticket.slaRemainingDays)} روز تاخیر`
                : `${formatPersianNumber(ticket.slaRemainingDays)} روز`}
            </StatusBadge>
          )}
        </InfoRow>
        <InfoRow label="تعداد ارجاع">{formatPersianNumber(ticket.referralCount)}</InfoRow>
        <InfoRow label="آخرین مالک">{ticket.followUpOwner}</InfoRow>
      </InfoGrid>
    </InfoCard>
  );
}

/** SMART-only data (AI + voice) attached to the CRM ticket. */
function Enrichment({ enrichment }: { enrichment: Ticket['enrichment'] }) {
  if (!enrichment) return <EmptyState message="تحلیل هوشمندی برای این تیکت ثبت نشده است." />;

  return (
    <>
      <InfoCard title="تحلیل هوشمند (AI)">
        <InfoGrid>
          <InfoRow label="احساس مشتری">
            <SentimentBadge sentiment={enrichment.sentiment} />
          </InfoRow>
          <InfoRow label="اولویت">
            <PriorityBadge priority={enrichment.priority} />
          </InfoRow>
          <InfoRow label="Auto Label" wide>
            {enrichment.autoLabel}
          </InfoRow>
          <InfoRow label="موضوع تشخیصی">{enrichment.topic}</InfoRow>
          <InfoRow label="تگ‌های AI" wide>
            <TagList tags={enrichment.aiTags} />
          </InfoRow>
        </InfoGrid>
        {enrichment.suggestedScenario && (
          <p className="ticket-scenario">
            <span className="ticket-scenario__label">سناریوی پیشنهادی</span>
            {enrichment.suggestedScenario}
          </p>
        )}
      </InfoCard>
      <InfoCard title="مکالمه">
        <div className="ticket-conversation">
          {enrichment.voice ? (
            <VoicePlayer recording={enrichment.voice} />
          ) : (
            <p className="info-card__muted">فایل صوتی برای این تیکت ثبت نشده است.</p>
          )}
          <Transcript lines={enrichment.transcript} />
        </div>
      </InfoCard>
    </>
  );
}

type TabId = 'summary' | 'timeline' | 'updates' | 'notes';

function PrevNext({ ticketId, listSearch }: { ticketId: string; listSearch: string }) {
  const listState = parseTicketListParams(new URLSearchParams(listSearch));
  const { data } = useAdjacentTickets(ticketId, toTicketFilter(listState), listState.sort);
  const link = (id: string | null | undefined, label: string, glyph: string) =>
    id ? (
      <Link
        className="btn btn--ghost ticket-nav__btn"
        to={ticketPaths.detail(id)}
        state={{ listSearch }}
        aria-label={label}
        title={label}
      >
        {glyph}
      </Link>
    ) : (
      <span className="btn btn--ghost ticket-nav__btn" aria-disabled="true" title={label}>
        {glyph}
      </span>
    );
  return (
    <span className="ticket-nav">
      {link(data?.previousId, 'تیکت قبلی', '›')}
      {link(data?.nextId, 'تیکت بعدی', '‹')}
    </span>
  );
}

export function TicketDetailPage() {
  const { ticketId = '' } = useParams();
  const location = useLocation();
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch ?? '';
  const [tab, setTab] = useState<TabId>('summary');
  const { data: ticket, isPending, isError, refetch } = useTicket(ticketId);
  const backTo = `${ticketPaths.list}${listSearch}`;

  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت تیکت با خطا مواجه شد." onRetry={() => refetch()} />;
  if (!ticket)
    return (
      <EmptyState mascot message="تیکتی با این شماره پیدا نشد.">
        <Link className="btn btn--ghost" to={backTo}>
          بازگشت به تیکت‌ها
        </Link>
      </EmptyState>
    );

  return (
    <section key={ticket.id}>
      <PageHeader
        title={<span className="ticket-heading">تیکت T-{formatPersianNumber(ticket.id)}</span>}
        subtitle={
          <span className="ticket-heading-meta">
            <StatusBadge tone="info">{ticket.type}</StatusBadge>
            <TicketStatusBadge status={ticket.status} />
            {ticket.enrichment && <PriorityBadge priority={ticket.enrichment.priority} />}
          </span>
        }
        actions={
          <>
            <PrevNext ticketId={ticket.id} listSearch={listSearch} />
            <Link
              className="btn btn--primary"
              to={ticketPaths.ofCustomer(ticket.customer.nationalId)}
            >
              تیکت‌های دیگر این مشتری
            </Link>
            <Link className="btn btn--ghost" to={backTo}>
              بازگشت
            </Link>
            <ActionMenu
              label="بیشتر"
              items={[
                {
                  label: 'پروفایل مشتری (Customer 360)',
                  to: customerPaths.profile(ticket.customer.nationalId),
                },
                { label: 'افزودن یادداشت', onSelect: () => setTab('notes') },
                {
                  label: 'کپی شماره تیکت',
                  onSelect: () => void navigator.clipboard?.writeText(ticket.id),
                },
              ]}
            />
          </>
        }
      />

      <Tabs
        label="بخش‌های تیکت"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'summary', label: 'خلاصه' },
          { id: 'timeline', label: 'جریان‌ها' },
          { id: 'updates', label: 'آپدیت‌ها' },
          { id: 'notes', label: 'یادداشت‌ها' },
        ]}
      >
        {tab === 'summary' && (
          <div className="ticket-detail">
            <div className="ticket-detail__column">
              <KeyFields ticket={ticket} />
              <TicketDocuments ticketId={ticket.id} />
            </div>
            <div className="ticket-detail__column">
              <Enrichment enrichment={ticket.enrichment} />
              <Timing ticket={ticket} />
              <CustomerInsuranceCard nationalId={ticket.customer.nationalId} />
              <TicketNotes ticketId={ticket.id} compact onShowAll={() => setTab('notes')} />
            </div>
          </div>
        )}
        {tab === 'timeline' && <TicketTimeline ticketId={ticket.id} />}
        {tab === 'updates' && <TicketUpdates ticketId={ticket.id} />}
        {tab === 'notes' && <TicketNotes ticketId={ticket.id} />}
      </Tabs>
    </section>
  );
}
