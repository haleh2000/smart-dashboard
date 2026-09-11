import { Link } from 'react-router';
import { formatDateTime, formatDuration, formatPersianNumber } from '@/shared/lib/format';
import { SentimentBadge, StatusBadge, TagList, sentimentMeta, type DataColumn } from '@/shared/ui';
import type { SubjectPath } from '@/shared/domain/insights';
import { subjectAgreement, type Call } from '../../domain/call';
import type { CallSortField } from '../../domain/CallRepository';
import {
  agreementMeta,
  callDirectionLabels,
  callStatusMeta,
  UNCATEGORIZED,
  UNKNOWN_CALLER,
} from '../callLabels';
import { callPaths } from '../callPaths';
import { CallStatusBadge } from './CallBadges';
import './callColumns.css';

const subjectText = (call: Call) =>
  call.subject ? `${call.subject.level1} › ${call.subject.level3}` : UNCATEGORIZED;

const aiSubjectText = (subject: SubjectPath) => `${subject.level1} › ${subject.level3}`;

/** Call list columns (README → «لیست تماس‌ها: تماس‌گیرنده، زمان، مدت، وضعیت، موضوع» + AI). */
export const callColumns: DataColumn<Call, CallSortField>[] = [
  {
    header: 'شناسه تماس',
    cell: (c) => (
      <Link
        to={callPaths.detail(c.id)}
        className="queue-table__tracking"
        onClick={(e) => e.stopPropagation()}
      >
        <bdi>{formatPersianNumber(c.id)}</bdi>
      </Link>
    ),
    exportValue: (c) => c.id,
  },
  {
    header: 'تماس‌گیرنده',
    cell: (c) => (
      <span className="call-caller">
        <span className={c.caller.fullName ? undefined : 'queue-table__muted'}>
          {c.caller.fullName ?? UNKNOWN_CALLER}
        </span>
        <span className="call-caller__mobile">{formatPersianNumber(c.caller.mobile)}</span>
      </span>
    ),
    exportValue: (c) => c.caller.fullName ?? UNKNOWN_CALLER,
  },
  {
    header: 'زمان',
    sortField: 'startedAt',
    cell: (c) => formatDateTime(c.startedAt),
    exportValue: (c) => formatDateTime(c.startedAt),
  },
  {
    header: 'مدت',
    sortField: 'durationSec',
    cell: (c) => formatDuration(c.durationSec),
    exportValue: (c) => formatDuration(c.durationSec),
  },
  {
    header: 'انتظار',
    sortField: 'waitSec',
    cell: (c) => formatDuration(c.waitSec),
    exportValue: (c) => formatDuration(c.waitSec),
  },
  {
    header: 'جهت',
    cell: (c) => callDirectionLabels[c.direction],
    exportValue: (c) => callDirectionLabels[c.direction],
  },
  {
    header: 'وضعیت',
    sortField: 'status',
    cell: (c) => <CallStatusBadge status={c.status} />,
    exportValue: (c) => callStatusMeta[c.status].label,
  },
  { header: 'صف', cell: (c) => c.queue, exportValue: (c) => c.queue },
  {
    header: 'اپراتور',
    sortField: 'agent',
    cell: (c) => c.agent ?? <span className="queue-table__muted">—</span>,
    exportValue: (c) => c.agent,
  },
  {
    header: 'موضوع',
    cell: (c) =>
      c.subject ? (
        subjectText(c)
      ) : c.status === 'answered' ? (
        <StatusBadge tone="warning">{UNCATEGORIZED}</StatusBadge>
      ) : (
        <span className="queue-table__muted">—</span>
      ),
    exportValue: (c) => (c.subject ? subjectText(c) : undefined),
  },
  {
    header: 'احساس',
    cell: (c) => c.analysis && <SentimentBadge sentiment={c.analysis.sentiment} />,
    exportValue: (c) => c.analysis && sentimentMeta[c.analysis.sentiment].label,
  },
  {
    header: 'احساس اپراتور',
    cell: (c) => c.analysis && <SentimentBadge sentiment={c.analysis.agentSentiment} />,
    exportValue: (c) => c.analysis && sentimentMeta[c.analysis.agentSentiment].label,
  },
  {
    header: 'موضوع AI',
    cell: (c) => {
      if (!c.analysis) return <span className="queue-table__muted">—</span>;
      const agreement = subjectAgreement(c.subject, c.analysis.detectedSubject);
      return (
        <span className="call-ai-subject">
          <span>{aiSubjectText(c.analysis.detectedSubject)}</span>
          <StatusBadge tone={agreementMeta[agreement].tone}>
            {agreementMeta[agreement].label}
          </StatusBadge>
        </span>
      );
    },
    exportValue: (c) => c.analysis && aiSubjectText(c.analysis.detectedSubject),
  },
  {
    header: 'برچسب‌ها',
    cell: (c) => c.analysis && <TagList tags={c.analysis.tags} />,
    exportValue: (c) => c.analysis?.tags.join('، '),
  },
];

/** The export splits the caller cell into name + mobile, so Excel can sort and filter by number. */
export const callExportColumns: DataColumn<Call, CallSortField>[] = callColumns.flatMap((column) =>
  column.header === 'تماس‌گیرنده'
    ? [column, { header: 'موبایل', cell: () => null, exportValue: (c: Call) => c.caller.mobile }]
    : [column],
);
