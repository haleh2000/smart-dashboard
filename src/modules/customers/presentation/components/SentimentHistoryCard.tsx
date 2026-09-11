import type { Sentiment } from '@/shared/domain/insights';
import { formatDate, formatPersianNumber } from '@/shared/lib/format';
import { ErrorState, InfoCard, SentimentBadge, SkeletonTable, sentimentMeta } from '@/shared/ui';
import { summarizeSentiment } from '../../domain/customer';
import { useSentimentHistory } from '../hooks/customerQueries';
import './SentimentHistoryCard.css';

const ORDER: Sentiment[] = ['positive', 'neutral', 'negative'];
const sourceLabels = { call: 'تماس', ticket: 'تیکت' } as const;

/** «سابقه تحلیل احساسات»: counts plus one mark per analyzed conversation, oldest → newest. */
export function SentimentHistoryCard({ nationalId }: { nationalId: string }) {
  const { data, isPending, isError, refetch } = useSentimentHistory(nationalId);

  return (
    <InfoCard title="سابقه تحلیل احساسات">
      {isPending ? (
        <SkeletonTable rows={2} />
      ) : isError ? (
        <ErrorState message="دریافت سابقه احساسات ممکن نشد." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <p className="sentiment-history__empty">هنوز گفت‌وگوی تحلیل‌شده‌ای برای این مشتری نیست.</p>
      ) : (
        <>
          <div className="sentiment-history__counts">
            {ORDER.map((sentiment) => (
              <span key={sentiment} className="sentiment-history__count">
                <SentimentBadge sentiment={sentiment} />
                {formatPersianNumber(summarizeSentiment(data)[sentiment])}
              </span>
            ))}
          </div>
          <ol className="sentiment-history__strip" aria-label="روند احساسات از قدیم به جدید">
            {data.map((point, index) => {
              const label = `${formatDate(point.at)} — ${sourceLabels[point.source]}: ${sentimentMeta[point.sentiment].label}`;
              return (
                <li
                  key={index}
                  className={`sentiment-history__mark sentiment-history__mark--${point.sentiment}`}
                  title={label}
                  aria-label={label}
                />
              );
            })}
          </ol>
          <div className="sentiment-history__axis" aria-hidden="true">
            <span>{formatDate(data[0]!.at)}</span>
            <span>{formatDate(data[data.length - 1]!.at)}</span>
          </div>
        </>
      )}
    </InfoCard>
  );
}
