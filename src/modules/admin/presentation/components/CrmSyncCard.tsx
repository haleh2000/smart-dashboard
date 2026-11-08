import { ApiError } from '@/shared/http';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { Button, ErrorState, SkeletonTable, StatusBadge } from '@/shared/ui';
import type { CrmSyncStream } from '../../domain/CrmSyncRepository';
import { useCrmSyncStatus, useStartCrmSync } from '../hooks/adminQueries';

const stoppedReasonLabel: Record<string, string> = {
  complete: 'کامل شد',
  disabled: 'همگام‌سازی غیرفعال است',
  crm_error: 'خطای CRM',
  empty_chunk: 'داده بیشتری نبود',
};

const copy: Record<
  CrmSyncStream,
  { title: string; description: string; countLabel: string; button: string }
> = {
  tickets: {
    title: 'یکپارچه‌سازی تیکت‌ها',
    description:
      'با فشردن دکمه، جاب بک‌اند API تیکت‌های جدید CRM (`voc_fetch_all`) را با type=new صدا می‌گیرد، next_ticketid را در فایل JSON ریشه ذخیره می‌کند و تا has_more=false ادامه می‌دهد. اجرای بعدی فقط تیکت‌های جدیدتر را می‌آورد.',
    countLabel: 'تیکت ذخیره‌شده',
    button: 'شروع همگام‌سازی تیکت‌ها',
  },
  calls: {
    title: 'یکپارچه‌سازی تماس‌ها',
    description:
      'با فشردن دکمه، جاب بک‌اند API تماس‌های جدید CRM (`voc_fetch_all_calls`) را با type=new می‌گیرد، next_ticketid را در همان فایل JSON ذخیره می‌کند و تا has_more=false ادامه می‌دهد. اجرای بعدی فقط تماس‌های جدید را می‌آورد.',
    countLabel: 'تماس ذخیره‌شده',
    button: 'شروع همگام‌سازی تماس‌ها',
  },
};

type CrmSyncCardProps = {
  stream: CrmSyncStream;
};

/** One integration line: tickets or calls VOC sync job. */
export function CrmSyncCard({ stream }: CrmSyncCardProps) {
  const { data, isPending, isError, refetch } = useCrmSyncStatus();
  const sync = useStartCrmSync();
  const meta = copy[stream];

  if (isPending) return <SkeletonTable rows={4} />;
  if (isError || !data)
    return (
      <ErrorState
        message="وضعیت همگام‌سازی CRM دریافت نشد. با حساب admin وارد شوید و اتصال به بک‌اند را بررسی کنید."
        onRetry={() => refetch()}
      />
    );

  const status = data[stream];
  const starting = sync.isPending && sync.variables === stream;
  const busy = status.running || starting;
  const syncError =
    sync.error instanceof ApiError && sync.variables === stream
      ? sync.error.status === 503
        ? 'CRM در دسترس نیست — به VPN شرکت وصل شوید و دوباره تلاش کنید.'
        : sync.error.status === 409
          ? 'همگام‌سازی این خط در حال اجراست.'
          : 'شروع همگام‌سازی با خطا مواجه شد.'
      : sync.isError && sync.variables === stream
        ? 'شروع همگام‌سازی با خطا مواجه شد.'
        : null;

  return (
    <article className="integrations__card integrations__card--wide">
      <header className="integrations__header">
        <h3 className="integrations__name">{meta.title}</h3>
        <StatusBadge tone={busy ? 'warning' : 'success'} pulse={busy}>
          {busy ? 'در حال دریافت…' : 'آماده'}
        </StatusBadge>
      </header>
      <p className="integrations__description">{meta.description}</p>
      <dl className="integrations__facts">
        <div>
          <dt>آدرس API</dt>
          <dd>
            <bdi dir="ltr" className="integrations__endpoint">
              {status.fetchUrl}
            </bdi>
          </dd>
        </div>
        <div>
          <dt>آخرین ticketid</dt>
          <dd>
            <bdi dir="ltr">{status.lastTicketId || '0'}</bdi>
          </dd>
        </div>
        <div>
          <dt>تعداد chunk</dt>
          <dd>{formatPersianNumber(status.chunksProcessed)}</dd>
        </div>
        <div>
          <dt>{meta.countLabel}</dt>
          <dd>{formatPersianNumber(status.itemsUpserted)}</dd>
        </div>
        <div>
          <dt>آخرین اجرا</dt>
          <dd>
            {status.lastRunAt ? formatDateTime(new Date(status.lastRunAt)) : '—'}
          </dd>
        </div>
        <div>
          <dt>وضعیت آخرین اجرا</dt>
          <dd>
            {status.lastStoppedReason
              ? (stoppedReasonLabel[status.lastStoppedReason] ??
                status.lastStoppedReason)
              : busy
                ? 'در حال اجرا'
                : '—'}
          </dd>
        </div>
      </dl>

      {sync.isSuccess && sync.variables === stream && sync.data.started && (
        <p className="integrations__hint integrations__hint--ok" role="status">
          جاب شروع شد — پیشرفت از روی وضعیت بالا به‌روز می‌شود.
        </p>
      )}
      {status.lastError && (
        <p className="integrations__hint integrations__hint--error" role="alert">
          {status.lastError}
        </p>
      )}
      {syncError && (
        <p className="integrations__hint integrations__hint--error" role="alert">
          {syncError}
        </p>
      )}

      <footer className="integrations__footer">
        <span className="integrations__hint">
          کرسر در <bdi dir="ltr">{data.cursorFile}</bdi>
        </span>
        <Button disabled={busy} onClick={() => sync.mutate(stream)}>
          {busy ? 'در حال همگام‌سازی…' : meta.button}
        </Button>
      </footer>
    </article>
  );
}
