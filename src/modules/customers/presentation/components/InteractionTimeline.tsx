import { Link } from 'react-router';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { EmptyState, ErrorState, SentimentBadge, SkeletonTable, StatusBadge } from '@/shared/ui';
import type { Interaction } from '../../domain/customer';
import { interactionKindMeta } from '../customerLabels';
import { interactionPaths } from '../customerPaths';
import { useCustomerInteractions } from '../hooks/customerQueries';
import './InteractionTimeline.css';

const linkFor = (interaction: Interaction) =>
  interaction.kind === 'call'
    ? interactionPaths.call(interaction.refId)
    : interactionPaths.ticket(interaction.refId);

/** «سوابق تعاملات (تماس، تیکت، شکایت)», newest first. */
export function InteractionTimeline({ nationalId }: { nationalId: string }) {
  const { data, isPending, isError, refetch } = useCustomerInteractions(nationalId);

  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت سوابق تعامل با خطا مواجه شد." onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState message="تعاملی برای این مشتری ثبت نشده است." />;

  return (
    <ol className="interaction-timeline">
      {data.map((interaction) => {
        const kind = interactionKindMeta[interaction.kind];
        return (
          <li
            key={interaction.id}
            className={`interaction-timeline__item interaction-timeline__item--${interaction.kind}`}
          >
            <span className="interaction-timeline__dot" aria-hidden="true" />
            <div className="interaction-timeline__card">
              <div className="interaction-timeline__head">
                <StatusBadge tone={kind.tone}>{kind.label}</StatusBadge>
                <Link className="interaction-timeline__title" to={linkFor(interaction)}>
                  {interaction.title}
                </Link>
                <span className="interaction-timeline__ref">
                  <bdi>{formatPersianNumber(interaction.refId)}</bdi>
                </span>
              </div>
              <div className="interaction-timeline__meta">
                <span>{formatDateTime(interaction.at)}</span>
                <span>کانال: {interaction.channel}</span>
                <StatusBadge
                  tone={interaction.open ? 'warning' : 'neutral'}
                  pulse={interaction.open}
                >
                  {interaction.open ? 'باز' : 'بسته'}
                </StatusBadge>
                {interaction.sentiment && <SentimentBadge sentiment={interaction.sentiment} />}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
