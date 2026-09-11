import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCan } from '@/modules/auth';
import { formatDuration, formatPersianNumber } from '@/shared/lib/format';
import { Button, Dialog, InfoGrid, InfoRow, SentimentBadge, StatusBadge } from '@/shared/ui';
import type { IncomingCall } from '../../domain/call';
import { UNKNOWN_CALLER } from '../callLabels';
import { callPaths } from '../callPaths';
import { useCallRepository } from '../callServices';
import { CallCategorization } from './CallCategorization';
import './IncomingCallPopup.css';

/** Seconds since the call started ringing, refreshed every second. */
function useRingingSeconds(startedAt: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt ? Math.max(0, (now - startedAt.getTime()) / 1000) : 0;
}

/**
 * README → «Popup تماس ورودی»: when a call rings for this agent, show who is calling with their
 * Customer 360 highlights and let the agent categorize the call on the spot.
 */
function IncomingCallPanel() {
  const repository = useCallRepository();
  const [queue, setQueue] = useState<IncomingCall[]>([]);

  useEffect(
    () => repository.subscribeIncoming((call) => setQueue((current) => [...current, call])),
    [repository],
  );

  const current = queue.at(-1);
  const ringing = useRingingSeconds(current?.startedAt);
  const dismiss = () => setQueue((items) => items.slice(0, -1));

  if (!current) return null;
  const { caller, customer } = current;
  const repeatCaller = (customer?.recentCallCount ?? 0) >= 2;

  return (
    <Dialog
      open
      variant="aside"
      title={
        <span className="incoming-call__title">
          <span className="incoming-call__pulse" aria-hidden="true" />
          تماس ورودی
          {queue.length > 1 && (
            <StatusBadge tone="warning">
              {formatPersianNumber(queue.length - 1)} تماس در انتظار
            </StatusBadge>
          )}
        </span>
      }
      onClose={dismiss}
      actions={
        <>
          {customer && (
            <Link
              className="btn btn--ghost btn--small"
              to={callPaths.customerProfile(customer.nationalId)}
            >
              پروفایل مشتری
            </Link>
          )}
          <Link className="btn btn--ghost btn--small" to={callPaths.detail(current.callId)}>
            مشاهده تماس
          </Link>
          <Button variant="ghost" className="btn--small" onClick={dismiss}>
            بستن
          </Button>
        </>
      }
    >
      <div className="incoming-call__caller">
        <strong className="incoming-call__name">
          {customer?.fullName ?? caller.fullName ?? UNKNOWN_CALLER}
        </strong>
        {customer?.isVip && <StatusBadge tone="warning">VIP</StatusBadge>}
        {repeatCaller && <StatusBadge tone="error">تماس تکراری</StatusBadge>}
      </div>

      <InfoGrid>
        <InfoRow label="موبایل">{formatPersianNumber(caller.mobile)}</InfoRow>
        <InfoRow label="کدملی">
          {caller.nationalId && formatPersianNumber(caller.nationalId)}
        </InfoRow>
        <InfoRow label="صف">{current.queue}</InfoRow>
        <InfoRow label="زمان زنگ">{formatDuration(ringing)}</InfoRow>
        {customer && (
          <>
            <InfoRow label="تیکت‌های باز">{formatPersianNumber(customer.openTicketCount)}</InfoRow>
            <InfoRow label="تماس‌های ۷ روز اخیر">
              {formatPersianNumber(customer.recentCallCount)}
            </InfoRow>
            <InfoRow label="آخرین احساس">
              {customer.lastSentiment && <SentimentBadge sentiment={customer.lastSentiment} />}
            </InfoRow>
          </>
        )}
      </InfoGrid>
      {!customer && (
        <p className="incoming-call__unknown">
          این شماره در CRM به مشتری شناخته‌شده‌ای تعلق ندارد.
        </p>
      )}

      <section className="incoming-call__categorize" aria-label="دسته‌بندی سه‌سطحی">
        <h3 className="incoming-call__section-title">دسته‌بندی سه‌سطحی</h3>
        <CallCategorization key={current.callId} callId={current.callId} />
      </section>
    </Dialog>
  );
}

/** Mounted once in the app shell; renders only for roles that take calls. */
export function IncomingCallPopup() {
  const can = useCan();
  return can('calls.receive') ? <IncomingCallPanel /> : null;
}
