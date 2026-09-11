import {
  sentimentShift,
  talkShare,
  type Sentiment,
  type SubjectPath,
  type TranscriptLine,
} from '@/shared/domain/insights';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatPercent } from '@/shared/lib/format';
import {
  Button,
  InfoCard,
  SentimentBadge,
  StatusBadge,
  sentimentMeta,
  speakerLabels,
} from '@/shared/ui';
import { subjectAgreement, type Call, type CallAnalysis } from '../../domain/call';
import { agreementMeta, shiftMeta } from '../callLabels';
import { useCategorizeCall } from '../hooks/callQueries';
import './CallInsights.css';

const LEVELS = ['level1', 'level2', 'level3'] as const;
const levelLabels = ['موضوع اصلی', 'موضوع فرعی', 'علت'];

function SubjectColumn({
  title,
  subject,
  other,
}: {
  title: string;
  subject?: SubjectPath;
  other?: SubjectPath;
}) {
  return (
    <div className="subject-detection__column">
      <h4 className="subject-detection__title">{title}</h4>
      {subject ? (
        <ol className="subject-detection__path">
          {LEVELS.map((level, i) => (
            <li
              key={level}
              className={cn(
                'subject-detection__level',
                other && other[level] !== subject[level] && 'subject-detection__level--diff',
              )}
            >
              <span className="subject-detection__level-name">{levelLabels[i]}</span>
              {subject[level]}
            </li>
          ))}
        </ol>
      ) : (
        <p className="subject-detection__empty">هنوز دسته‌بندی نشده است.</p>
      )}
    </div>
  );
}

/** «تشخیص موضوع تماس توسط اپراتور و AI»: both paths side by side, with their agreement. */
export function SubjectDetectionCard({ call }: { call: Call }) {
  const categorize = useCategorizeCall();
  const { analysis } = call;
  if (!analysis) return null;
  const agreement = subjectAgreement(call.subject, analysis.detectedSubject);
  const confidence = analysis.detectionConfidence;
  const canAccept = agreement === 'pending' || agreement === 'mismatch';

  return (
    <InfoCard
      title="تشخیص موضوع (اپراتور و AI)"
      actions={
        <StatusBadge tone={agreementMeta[agreement].tone}>{agreementMeta[agreement].label}</StatusBadge>
      }
    >
      <div className="subject-detection">
        <SubjectColumn title="دسته‌بندی اپراتور" subject={call.subject} other={analysis.detectedSubject} />
        <SubjectColumn
          title="تشخیص هوش مصنوعی"
          subject={analysis.detectedSubject}
          other={call.subject}
        />
      </div>
      <div className="confidence">
        <span className="confidence__label">اطمینان مدل</span>
        <span
          className="confidence__track"
          role="meter"
          aria-label="اطمینان مدل"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(confidence * 100)}
        >
          <span
            className={cn(
              'confidence__fill',
              confidence >= 0.85
                ? 'confidence__fill--high'
                : confidence >= 0.65
                  ? 'confidence__fill--medium'
                  : 'confidence__fill--low',
            )}
            style={{ inlineSize: `${Math.round(confidence * 100)}%` }}
          />
        </span>
        <strong className="confidence__value">{formatPercent(confidence)}</strong>
      </div>
      {canAccept && (
        <div className="subject-detection__actions">
          <Button
            variant="accent"
            disabled={categorize.isPending}
            onClick={() => categorize.mutate({ id: call.id, subject: analysis.detectedSubject })}
          >
            {categorize.isPending ? 'در حال ثبت…' : 'پذیرش پیشنهاد AI'}
          </Button>
          {categorize.isError && (
            <span className="subject-detection__error" role="alert">
              ثبت با خطا مواجه شد.
            </span>
          )}
        </div>
      )}
    </InfoCard>
  );
}

const sentimentY: Record<Sentiment, number> = { positive: 0, neutral: 1, negative: 2 };
const ROW_HEIGHT = 30;
const ROW_GAP = 16;
const BAND = ROW_HEIGHT * 3;

/** Two stacked tracks (agent, customer) plotting each scored utterance over the call. */
function EmotionTimeline({ lines }: { lines: readonly TranscriptLine[] }) {
  const scored = lines.filter((line) => line.sentiment);
  const end = Math.max(1, ...lines.map((line) => line.atSec));
  const width = 600;
  // RTL: the call starts on the right edge.
  const x = (sec: number) => width - 12 - (sec / end) * (width - 24);
  const tracks = (['agent', 'customer'] as const).map((speaker, index) => ({
    speaker,
    top: index * (BAND + ROW_GAP),
    points: scored.filter((line) => line.speaker === speaker),
  }));
  const height = tracks.length * BAND + ROW_GAP;
  const y = (top: number, sentiment: Sentiment) => top + sentimentY[sentiment] * ROW_HEIGHT + 15;

  return (
    <figure className="emotion-timeline" aria-label="روند احساسات در طول مکالمه">
      <div className="emotion-timeline__labels" aria-hidden="true">
        {tracks.map((track) => (
          <span key={track.speaker} style={{ blockSize: `${(BAND / height) * 100}%` }}>
            {speakerLabels[track.speaker]}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="emotion-timeline__svg" role="img">
        {tracks.map((track) => (
          <g key={track.speaker}>
            <rect
              className="emotion-timeline__band"
              x={0}
              y={track.top}
              width={width}
              height={BAND}
              rx={10}
            />
            {(['positive', 'neutral', 'negative'] as const).map((s) => (
              <line
                key={s}
                className="emotion-timeline__grid"
                x1={0}
                x2={width}
                y1={y(track.top, s)}
                y2={y(track.top, s)}
              />
            ))}
            <polyline
              className={`emotion-timeline__line emotion-timeline__line--${track.speaker}`}
              points={track.points
                .map((line) => `${x(line.atSec)},${y(track.top, line.sentiment!)}`)
                .join(' ')}
            />
            {track.points.map((line, i) => (
              <circle
                key={i}
                className={`emotion-timeline__dot emotion-timeline__dot--${line.sentiment}`}
                cx={x(line.atSec)}
                cy={y(track.top, line.sentiment!)}
                r={6}
              >
                <title>
                  {`${speakerLabels[track.speaker]} · ${formatDuration(line.atSec)} · ${sentimentMeta[line.sentiment!].label}`}
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="emotion-timeline__legend">
        {(['positive', 'neutral', 'negative'] as const).map((s) => (
          <span key={s} className={`emotion-timeline__key emotion-timeline__key--${s}`}>
            {sentimentMeta[s].label}
          </span>
        ))}
        <span className="emotion-timeline__axis">
          <span>شروع {formatDuration(0)}</span>
          <span>پایان {formatDuration(end)}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** «تحلیل احساسات دو طرف»: customer and operator mood, the customer's journey and talk share. */
export function SentimentDuelCard({
  analysis,
  transcript,
}: {
  analysis: CallAnalysis;
  transcript: readonly TranscriptLine[];
}) {
  const scoredCustomer = transcript.filter((l) => l.speaker === 'customer' && l.sentiment);
  const first = scoredCustomer[0]?.sentiment;
  const last = scoredCustomer.at(-1)?.sentiment;
  const shift = sentimentShift(transcript, 'customer');
  const share = talkShare(transcript);

  return (
    <InfoCard title="تحلیل احساسات دو طرف">
      <div className="sentiment-duel">
        <div className="sentiment-duel__side sentiment-duel__side--customer">
          <span className="sentiment-duel__who">مشتری</span>
          <SentimentBadge sentiment={analysis.sentiment} />
        </div>
        <span className="sentiment-duel__vs" aria-hidden="true">
          در برابر
        </span>
        <div className="sentiment-duel__side sentiment-duel__side--agent">
          <span className="sentiment-duel__who">اپراتور</span>
          <SentimentBadge sentiment={analysis.agentSentiment} />
        </div>
      </div>

      {first && last && shift && (
        <p className="sentiment-duel__journey">
          مسیر احساس مشتری: <strong>{sentimentMeta[first].label}</strong> ←{' '}
          <strong>{sentimentMeta[last].label}</strong>
          <StatusBadge tone={shiftMeta[shift].tone}>{shiftMeta[shift].label}</StatusBadge>
        </p>
      )}

      {transcript.some((line) => line.sentiment) && <EmotionTimeline lines={transcript} />}

      {transcript.length > 0 && (
        <div className="talk-share">
          <span className="talk-share__title">سهم صحبت</span>
          <div className="talk-share__bar" aria-hidden="true">
            <span className="talk-share__agent" style={{ flexGrow: share.agent }} />
            <span className="talk-share__customer" style={{ flexGrow: share.customer }} />
          </div>
          <div className="talk-share__legend">
            <span>اپراتور {formatPercent(share.agent)}</span>
            <span>مشتری {formatPercent(share.customer)}</span>
          </div>
        </div>
      )}
    </InfoCard>
  );
}
