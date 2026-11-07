import { ApiError } from '@/shared/http';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { Button, ErrorState, SkeletonTable, StatusBadge } from '@/shared/ui';
import { useCrmSyncStatus, useStartCrmSync } from '../hooks/adminQueries';

const stoppedReasonLabel: Record<string, string> = {
  complete: 'کامل شد',
  disabled: 'همگام‌سازی غیرفعال است',
  crm_error: 'خطای CRM',
  empty_chunk: 'داده بیشتری نبود',
};

/** Admin control to pull VOC tickets from company CRM (VPN required). */
export function CrmSyncCard() {
  const { data, isPending, isError, refetch } = useCrmSyncStatus();
  const sync = useStartCrmSync();

  if (isPending) return <SkeletonTable rows={4} />;
  if (isError)
    return (
      <ErrorState
        message="وضعیت همگام‌سازی CRM دریافت نشد. با حساب admin وارد شوید و اتصال به بک‌اند را بررسی کنید."
        onRetry={() => refetch()}
      />
    );

  const busy = data.running || sync.isPending;
  const syncError =
    sync.error instanceof ApiError
      ? sync.error.status === 503
        ? 'CRM در دسترس نیست — به VPN شرکت وصل شوید و دوباره تلاش کنید.'
        : sync.error.status === 409
          ? 'همگام‌سازی در حال اجراست.'
          : 'شروع همگام‌سازی با خطا مواجه شد.'
      : sync.isError
        ? 'شروع همگام‌سازی با خطا مواجه شد.'
        : null;

  return (
    <article className="integrations__card integrations__card--wide">
      <header className="integrations__header">
        <h3 className="integrations__name">همگام‌سازی تیکت‌های CRM</h3>
        <StatusBadge tone={busy ? 'warning' : 'success'} pulse={busy}>
          {busy ? 'در حال دریافت…' : 'آماده'}
        </StatusBadge>
      </header>
      <p className="integrations__description">
        در هر اجرا ابتدا تیکت‌های قدیمی‌تر از ۱ سال حذف می‌شوند، سپس از{' '}
        <bdi dir="ltr">(now - 1 year)</bdi> تا الان از CRM دریافت و در جدول تیکت ذخیره
        می‌شود. برای اجرا باید به شبکه/VPN شرکت متصل باشید.
      </p>
      <dl className="integrations__facts">
        <div>
          <dt>شروع بازه (۱ سال قبل)</dt>
          <dd>
            <bdi dir="ltr">{data.windowStart || data.lastModified || '—'}</bdi>
          </dd>
        </div>
        <div>
          <dt>آخرین modified</dt>
          <dd>
            <bdi dir="ltr">{data.lastModified || '—'}</bdi>
          </dd>
        </div>
        <div>
          <dt>تعداد chunk</dt>
          <dd>{formatPersianNumber(data.chunksProcessed)}</dd>
        </div>
        <div>
          <dt>تیکت ذخیره‌شده</dt>
          <dd>{formatPersianNumber(data.ticketsUpserted)}</dd>
        </div>
        <div>
          <dt>به‌روزرسانی وضعیت</dt>
          <dd>{data.updatedAt ? formatDateTime(new Date(data.updatedAt)) : '—'}</dd>
        </div>
      </dl>

      {sync.isSuccess && (
        <p className="integrations__hint integrations__hint--ok" role="status">
          همگام‌سازی انجام شد: حذف {formatPersianNumber(sync.data.deleted)} تیکت قدیمی، ذخیره{' '}
          {formatPersianNumber(sync.data.upserted)} تیکت در {formatPersianNumber(sync.data.chunks)}{' '}
          chunk — {stoppedReasonLabel[sync.data.stoppedReason] ?? sync.data.stoppedReason}
        </p>
      )}
      {syncError && (
        <p className="integrations__hint integrations__hint--error" role="alert">
          {syncError}
        </p>
      )}

      <footer className="integrations__footer">
        <span className="integrations__hint">بازه فعال: یک سال اخیر</span>
        <Button disabled={busy} onClick={() => sync.mutate({ reset: false })}>
          {busy ? 'در حال همگام‌سازی…' : 'شروع همگام‌سازی ۱ ساله'}
        </Button>
      </footer>
    </article>
  );
}
