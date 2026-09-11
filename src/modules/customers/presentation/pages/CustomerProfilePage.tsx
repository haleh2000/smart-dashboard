import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatAmount, formatPersianNumber } from '@/shared/lib/format';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonTable,
  StatCard,
  StatusBadge,
  Tabs,
  type TabItem,
} from '@/shared/ui';
import { claimTotals, summarizeSentiment, type CustomerProfile } from '../../domain/customer';
import { CustomerStatusBadge, VipBadge } from '../components/CustomerBadges';
import { CustomerIdentityCard } from '../components/CustomerIdentityCard';
import { ClaimTable, PolicyTable } from '../components/InsuranceTables';
import { InteractionTimeline } from '../components/InteractionTimeline';
import { SentimentHistoryCard } from '../components/SentimentHistoryCard';
import { customerKindLabels } from '../customerLabels';
import { customerPaths, interactionPaths } from '../customerPaths';
import { useCustomerProfile, useSentimentHistory } from '../hooks/customerQueries';
import './CustomerProfilePage.css';

type ProfileTab = 'summary' | 'interactions' | 'policies' | 'claims';

/** «امتیاز احساس» from -1..1 as a signed Persian percentage. */
const formatScore = (score: number) => {
  const value = formatPersianNumber(Math.round(score * 100));
  return score > 0 ? `+${value}` : value.replace('-', '−');
};

function ProfileStats({ customer }: { customer: CustomerProfile }) {
  const { data: history } = useSentimentHistory(customer.nationalId);
  const totals = claimTotals(customer.claims);
  const sentiment = history && summarizeSentiment(history);

  return (
    <div className="customer-profile__stats">
      <StatCard
        label="بیمه‌نامه فعال"
        value={formatPersianNumber(customer.activePolicyCount)}
        hint={`از ${formatPersianNumber(customer.policies.length)} بیمه‌نامه`}
        tone="primary"
      />
      <StatCard
        label="تیکت باز"
        value={formatPersianNumber(customer.openTicketCount)}
        tone={customer.openTicketCount > 0 ? 'warning' : 'neutral'}
      />
      <StatCard
        label="خسارت‌ها"
        value={formatPersianNumber(customer.claims.length)}
        hint={`${formatAmount(totals.claimed)} ریال — پرداختی ${formatAmount(totals.paid)}`}
      />
      <StatCard
        label="امتیاز احساس"
        value={sentiment ? formatScore(sentiment.score) : '…'}
        hint="از −۱۰۰ (منفی) تا +۱۰۰ (مثبت)"
        tone={
          !sentiment
            ? 'neutral'
            : sentiment.score > 0.2
              ? 'success'
              : sentiment.score < -0.2
                ? 'error'
                : 'neutral'
        }
      />
    </div>
  );
}

function ProfileBody({ customer }: { customer: CustomerProfile }) {
  const [tab, setTab] = useState<ProfileTab>('summary');
  const tabs: TabItem<ProfileTab>[] = [
    { id: 'summary', label: 'خلاصه' },
    { id: 'interactions', label: 'تعاملات' },
    { id: 'policies', label: 'بیمه‌نامه‌ها', count: customer.policies.length },
    { id: 'claims', label: 'خسارت‌ها', count: customer.claims.length },
  ];

  return (
    <Tabs label="بخش‌های پروفایل مشتری" tabs={tabs} active={tab} onChange={setTab}>
      {tab === 'summary' && (
        <div className="customer-profile__summary">
          <CustomerIdentityCard customer={customer} />
          <SentimentHistoryCard nationalId={customer.nationalId} />
        </div>
      )}
      {tab === 'interactions' && <InteractionTimeline nationalId={customer.nationalId} />}
      {tab === 'policies' && <PolicyTable policies={customer.policies} />}
      {tab === 'claims' && <ClaimTable claims={customer.claims} />}
    </Tabs>
  );
}

/** Customer 360 (README → «پروفایل مشتری»). */
export function CustomerProfilePage() {
  const { nationalId = '' } = useParams();
  const { data: customer, isPending, isError, refetch } = useCustomerProfile(nationalId);

  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت پروفایل مشتری با خطا مواجه شد." onRetry={() => refetch()} />;
  if (!customer)
    return (
      <EmptyState mascot message="مشتری‌ای با این کدملی پیدا نشد.">
        <Link className="btn btn--ghost" to={customerPaths.list}>
          بازگشت به مشتریان
        </Link>
      </EmptyState>
    );

  return (
    <section className="customer-profile">
      <PageHeader
        title={customer.fullName}
        subtitle={
          <span className="customer-profile__meta">
            {customer.isVip && <VipBadge />}
            <CustomerStatusBadge status={customer.status} />
            <StatusBadge tone="info">{customerKindLabels[customer.kind]}</StatusBadge>
            <span>کدملی {formatPersianNumber(customer.nationalId)}</span>
          </span>
        }
        actions={
          <>
            <Link className="btn btn--ghost" to={interactionPaths.ticketsOf(customer.nationalId)}>
              تیکت‌های این مشتری
            </Link>
            <Link className="btn btn--ghost" to={interactionPaths.callsOf(customer.mobile)}>
              تماس‌های این مشتری
            </Link>
            <Link className="btn btn--ghost" to={customerPaths.list}>
              بازگشت
            </Link>
          </>
        }
      />
      <ProfileStats customer={customer} />
      <ProfileBody customer={customer} />
    </section>
  );
}
