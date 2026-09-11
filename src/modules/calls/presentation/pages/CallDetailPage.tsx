import { Link, useParams } from 'react-router';
import { useCan } from '@/modules/auth';
import { formatDateTime, formatDuration, formatPersianNumber } from '@/shared/lib/format';
import {
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
  Transcript,
  VoicePlayer,
} from '@/shared/ui';
import type { Call } from '../../domain/call';
import { UNCATEGORIZED, UNKNOWN_CALLER } from '../callLabels';
import { callPaths } from '../callPaths';
import { CallDirectionBadge, CallStatusBadge } from '../components/CallBadges';
import { CallCategorization } from '../components/CallCategorization';
import { SentimentDuelCard, SubjectDetectionCard } from '../components/CallInsights';
import { useCall } from '../hooks/callQueries';
import './CallDetailPage.css';

function CallerCard({ call }: { call: Call }) {
  const { caller } = call;
  return (
    <InfoCard
      title="تماس‌گیرنده"
      actions={
        caller.nationalId && (
          <Link
            className="btn btn--ghost btn--small"
            to={callPaths.customerProfile(caller.nationalId)}
          >
            پروفایل مشتری
          </Link>
        )
      }
    >
      <InfoGrid>
        <InfoRow label="نام">{caller.fullName ?? UNKNOWN_CALLER}</InfoRow>
        <InfoRow label="موبایل">{formatPersianNumber(caller.mobile)}</InfoRow>
        <InfoRow label="کدملی">
          {caller.nationalId && formatPersianNumber(caller.nationalId)}
        </InfoRow>
      </InfoGrid>
    </InfoCard>
  );
}

function CallInfoCard({ call }: { call: Call }) {
  return (
    <InfoCard title="اطلاعات تماس">
      <InfoGrid>
        <InfoRow label="زمان شروع">{formatDateTime(call.startedAt)}</InfoRow>
        <InfoRow label="مدت مکالمه">{formatDuration(call.durationSec)}</InfoRow>
        <InfoRow label="زمان انتظار">{formatDuration(call.waitSec)}</InfoRow>
        <InfoRow label="صف">{call.queue}</InfoRow>
        <InfoRow label="اپراتور">{call.agent}</InfoRow>
        <InfoRow label="حل در اولین تماس (FCR)">
          {call.resolvedOnFirstCall !== undefined && (
            <StatusBadge tone={call.resolvedOnFirstCall ? 'success' : 'warning'}>
              {call.resolvedOnFirstCall ? 'بله' : 'خیر'}
            </StatusBadge>
          )}
        </InfoRow>
        <InfoRow label="تیکت مرتبط">
          {call.ticketId && (
            <Link to={callPaths.ticket(call.ticketId)}>
              تیکت {formatPersianNumber(call.ticketId)}
            </Link>
          )}
        </InfoRow>
        <InfoRow label="موضوع (سه‌سطحی)" wide>
          {call.subject ? (
            `${call.subject.level1} › ${call.subject.level2} › ${call.subject.level3}`
          ) : (
            <StatusBadge tone="warning">{UNCATEGORIZED}</StatusBadge>
          )}
        </InfoRow>
      </InfoGrid>
    </InfoCard>
  );
}

function AnalysisCard({ analysis }: { analysis: Call['analysis'] }) {
  if (!analysis) return <EmptyState message="تحلیل هوشمندی برای این تماس ثبت نشده است." />;
  return (
    <InfoCard title="تحلیل هوشمند">
      <InfoGrid>
        <InfoRow label="احساس مشتری">
          <SentimentBadge sentiment={analysis.sentiment} />
        </InfoRow>
        <InfoRow label="احساس اپراتور">
          <SentimentBadge sentiment={analysis.agentSentiment} />
        </InfoRow>
        <InfoRow label="اولویت">
          <PriorityBadge priority={analysis.priority} />
        </InfoRow>
        <InfoRow label="برچسب خودکار" wide>
          {analysis.autoLabel}
        </InfoRow>
        <InfoRow label="موضوع تشخیص‌داده‌شده">{analysis.topic}</InfoRow>
        <InfoRow label="سناریوی پیشنهادی">{analysis.suggestedScenario}</InfoRow>
        <InfoRow label="برچسب‌ها" wide>
          <TagList tags={analysis.tags} />
        </InfoRow>
      </InfoGrid>
      <p className="call-detail__summary">{analysis.summary}</p>
    </InfoCard>
  );
}

function CategorizationCard({ call }: { call: Call }) {
  const can = useCan();
  if (!can('calls.receive')) return null;
  return (
    <InfoCard title="دسته‌بندی سه‌سطحی">
      <CallCategorization callId={call.id} current={call.subject} />
    </InfoCard>
  );
}

export function CallDetailPage() {
  const { callId = '' } = useParams();
  const { data: call, isPending, isError, refetch } = useCall(callId);

  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت تماس با خطا مواجه شد." onRetry={() => refetch()} />;
  if (!call)
    return (
      <EmptyState mascot message="تماسی با این شناسه پیدا نشد.">
        <Link className="btn btn--ghost" to={callPaths.list}>
          بازگشت به تماس‌ها
        </Link>
      </EmptyState>
    );

  return (
    <section>
      <PageHeader
        title={
          <span className="call-detail__id">
            تماس <bdi>{formatPersianNumber(call.id)}</bdi>
          </span>
        }
        subtitle={
          <span className="call-detail__badges">
            <CallDirectionBadge direction={call.direction} />
            <CallStatusBadge status={call.status} />
          </span>
        }
        actions={
          <Link className="btn btn--ghost" to={callPaths.list}>
            بازگشت به تماس‌ها
          </Link>
        }
      />
      <div className="call-detail">
        <div className="call-detail__column">
          <CallerCard call={call} />
          <CallInfoCard call={call} />
          {call.analysis && (
            <SentimentDuelCard analysis={call.analysis} transcript={call.transcript} />
          )}
          <InfoCard title="مکالمه (تبدیل گفتار به متن)">
            <div className="call-detail__conversation">
              {call.voice ? (
                <VoicePlayer recording={call.voice} />
              ) : (
                <p className="call-detail__muted">فایل صوتی برای این تماس ثبت نشده است.</p>
              )}
              <Transcript lines={call.transcript} />
            </div>
          </InfoCard>
        </div>
        <div className="call-detail__column">
          <SubjectDetectionCard call={call} />
          <CategorizationCard call={call} />
          <AnalysisCard analysis={call.analysis} />
        </div>
      </div>
    </section>
  );
}
