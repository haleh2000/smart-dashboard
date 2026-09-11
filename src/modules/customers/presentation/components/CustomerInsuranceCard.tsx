import { Link } from 'react-router';
import { formatAmount, formatDate, formatPersianNumber } from '@/shared/lib/format';
import { ErrorState, InfoCard, SkeletonTable } from '@/shared/ui';
import type { Claim, Policy } from '../../domain/customer';
import { customerPaths } from '../customerPaths';
import { useCustomerProfile } from '../hooks/customerQueries';
import { ClaimStatusBadge, PolicyStatusBadge } from './CustomerBadges';
import './CustomerInsuranceCard.css';

const RECENT_CLAIMS = 3;
const isOpenClaim = (claim: Claim) => claim.status === 'filed' || claim.status === 'underReview';

/**
 * «اطلاعات بیمه‌ای» for the ticket detail page: active policies and open or recent claims
 * of the ticket's customer, from the Core Insurance Systems.
 */
export function CustomerInsuranceCard({ nationalId }: { nationalId: string }) {
  const { data: customer, isPending, isError, refetch } = useCustomerProfile(nationalId);

  return (
    <InfoCard
      title="اطلاعات بیمه‌ای"
      actions={
        customer && (
          <Link className="insurance-card__link" to={customerPaths.profile(customer.nationalId)}>
            پروفایل کامل مشتری
          </Link>
        )
      }
    >
      {isPending ? (
        <SkeletonTable rows={3} />
      ) : isError ? (
        <ErrorState message="اطلاعات بیمه‌ای دریافت نشد." onRetry={() => refetch()} />
      ) : !customer ? (
        <p className="insurance-card__empty">این مشتری در سامانه‌های بیمه‌ای پیدا نشد.</p>
      ) : (
        <InsuranceSummary
          policies={customer.policies.filter((p) => p.status === 'active')}
          claims={[...customer.claims]
            .sort(
              (a, b) =>
                Number(isOpenClaim(b)) - Number(isOpenClaim(a)) ||
                b.filedAt.getTime() - a.filedAt.getTime(),
            )
            .slice(0, RECENT_CLAIMS)}
        />
      )}
    </InfoCard>
  );
}

function InsuranceSummary({ policies, claims }: { policies: Policy[]; claims: Claim[] }) {
  return (
    <div className="insurance-card">
      <h4 className="insurance-card__heading">بیمه‌نامه‌های فعال</h4>
      {policies.length === 0 ? (
        <p className="insurance-card__empty">بیمه‌نامه فعالی ندارد.</p>
      ) : (
        <ul className="insurance-card__list">
          {policies.map((policy) => (
            <li key={policy.number} className="insurance-card__item">
              <span className="insurance-card__primary">
                {policy.line}
                <PolicyStatusBadge status={policy.status} />
              </span>
              <span className="insurance-card__secondary">
                <bdi>{formatPersianNumber(policy.number)}</bdi> — تا {formatDate(policy.endDate)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h4 className="insurance-card__heading">خسارت‌های باز و اخیر</h4>
      {claims.length === 0 ? (
        <p className="insurance-card__empty">خسارتی ثبت نشده است.</p>
      ) : (
        <ul className="insurance-card__list">
          {claims.map((claim) => (
            <li key={claim.number} className="insurance-card__item">
              <span className="insurance-card__primary">
                <bdi>{formatPersianNumber(claim.number)}</bdi>
                <ClaimStatusBadge status={claim.status} />
              </span>
              <span className="insurance-card__secondary">
                {claim.line} — {formatAmount(claim.amount)} ریال — {formatDate(claim.filedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
