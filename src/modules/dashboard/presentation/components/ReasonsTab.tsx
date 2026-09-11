import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel, StatusBadge } from '@/shared/ui';
import type { CallReasons, ReasonNode, SubjectDetectionStats } from '../../domain/analytics';
import { scopeForChart, SUBJECT_DIMENSIONS } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useCallReasons, useSubjectDetection } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { ColumnChart } from './charts/ColumnChart';
import { Legend } from './StackedBars';
import { Sunburst } from './Sunburst';
import './ReasonsTab.css';

interface RootCause extends ReasonNode {
  path: string[];
}

const leaves = (nodes: readonly ReasonNode[], parent: string[] = []): RootCause[] =>
  nodes.flatMap((node) =>
    node.children.length
      ? leaves(node.children, [...parent, node.label])
      : [{ ...node, path: [...parent, node.label] }],
  );

/** Weighted mean of a node measure across the whole tree. */
const overall = (nodes: readonly ReasonNode[], pick: (n: ReasonNode) => number) => {
  const total = nodes.reduce((sum, n) => sum + n.count, 0);
  return total ? nodes.reduce((sum, n) => sum + pick(n) * n.count, 0) / total : 0;
};

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="root-causes__meter">
      <span className="root-causes__meter-label">{label}</span>
      <span className="root-causes__meter-track">
        <span style={{ width: `${Math.min(1, value) * 100}%`, background: tone }} />
      </span>
      <span className="root-causes__meter-value">{formatPercent(value)}</span>
    </span>
  );
}

function RootCauseList({ data }: { data: CallReasons }) {
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const top = leaves(data.nodes)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const negative = overall(data.nodes, (n) => n.negativeShare);
  const repeat = overall(data.nodes, (n) => n.repeatShare);
  const max = Math.max(1, ...top.map((cause) => cause.count));

  return (
    <ol className="root-causes">
      {top.map((cause, index) => {
        const alerts = [
          cause.negativeShare > negative * 1.25 && 'نارضایتی بالا',
          cause.repeatShare > repeat * 1.2 && 'تکرار تماس بالا',
        ].filter((a): a is string => Boolean(a));
        return (
          <li key={cause.path.join('/')}>
            <button
              type="button"
              className="root-causes__item"
              onClick={() => selectSubject(cause.path)}
            >
              <span className="root-causes__rank">{formatPersianNumber(index + 1)}</span>
              <span className="root-causes__body">
                <span className="root-causes__title">
                  <strong>{cause.label}</strong>
                  {alerts.map((alert) => (
                    <StatusBadge key={alert} tone="error">
                      هشدار: {alert}
                    </StatusBadge>
                  ))}
                </span>
                <span className="root-causes__path">{cause.path.slice(0, -1).join(' › ')}</span>
                <span className="root-causes__volume">
                  <span
                    className="root-causes__volume-bar"
                    style={{ width: `${(cause.count / max) * 100}%` }}
                  />
                  <span>
                    {formatPersianNumber(cause.count)} تماس · {formatPercent(cause.share)}
                  </span>
                </span>
                <span className="root-causes__meters">
                  <Meter
                    label="احساس منفی"
                    value={cause.negativeShare}
                    tone="var(--chart-series-2)"
                  />
                  <Meter
                    label="حل در اولین تماس"
                    value={cause.fcrRate}
                    tone="var(--chart-series-1)"
                  />
                  <Meter
                    label="تکرار تماس"
                    value={cause.repeatShare}
                    tone="var(--chart-series-4)"
                  />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ReasonsPanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useCallReasons(scopeForChart(scope, ...SUBJECT_DIMENSIONS));
  return (
    <ChartState query={query} isEmpty={(data) => data.total === 0} skeletonRows={8}>
      {(data) => (
        <div className="reasons__grid">
          <Panel title="دلایل تماس در سه لایه (Subject1 › Subject2 › Subject3)">
            <Sunburst
              nodes={data.nodes}
              total={data.total}
              filters={scope.filters}
              onSelect={selectSubject}
            />
          </Panel>
          <Panel title="ریشه‌های اصلی تماس">
            <RootCauseList data={data} />
            <p className="reasons__note">
              {formatPersianNumber(data.aiOnly)} تماس هنوز توسط اپراتور دسته‌بندی نشده و با موضوع
              تشخیص‌داده‌شده توسط AI شمرده شده است.
            </p>
          </Panel>
        </div>
      )}
    </ChartState>
  );
}

const agreementParts = [
  { key: 'match', label: 'تطابق کامل', color: 'var(--chart-series-1)' },
  { key: 'partial', label: 'فقط موضوع اصلی', color: 'var(--chart-series-4)' },
  { key: 'mismatch', label: 'مغایرت', color: 'var(--chart-series-2)' },
  { key: 'pending', label: 'در انتظار دسته‌بندی اپراتور', color: 'var(--chart-series-5)' },
] as const;

const bandLabels = {
  low: 'زیر ۶۰٪',
  medium: '۶۰ تا ۷۵٪',
  high: '۷۵ تا ۹۰٪',
  veryHigh: '۹۰٪ به بالا',
} as const;

function AgreementRing({ value }: { value: number }) {
  const radius = 42;
  return (
    <div
      className="agreement-ring"
      role="img"
      aria-label={`نرخ تطابق اپراتور و AI: ${formatPercent(value)}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} className="agreement-ring__track" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          pathLength={100}
          className="agreement-ring__value"
          strokeDasharray={`${value * 100} 100`}
        />
      </svg>
      <div className="agreement-ring__center">
        <strong>{formatPercent(value)}</strong>
        <span>تطابق</span>
      </div>
    </div>
  );
}

function DetectionPanels({ stats }: { stats: SubjectDetectionStats }) {
  const reviewed = stats.match + stats.partial + stats.mismatch;
  const bandTotal = stats.confidenceBands.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className="dashboard__section">
      <Panel title="تشخیص موضوع تماس: اپراتور در برابر هوش مصنوعی">
        <div className="detection">
          <AgreementRing value={reviewed ? stats.match / reviewed : 0} />
          <div className="detection__body">
            <dl className="detection__facts">
              <div>
                <dt>تماس تحلیل‌شده</dt>
                <dd>{formatPersianNumber(stats.analyzed)}</dd>
              </div>
              <div>
                <dt>میانگین اطمینان AI</dt>
                <dd>{formatPercent(stats.avgConfidence)}</dd>
              </div>
              <div>
                <dt>پیشنهاد AI برای دسته‌بندی‌نشده‌ها</dt>
                <dd>{formatPersianNumber(stats.pending)}</dd>
              </div>
            </dl>
            <div className="detection__bar" role="img" aria-label="توزیع تطابق موضوع">
              {agreementParts.map((part) =>
                stats[part.key] > 0 ? (
                  <span
                    key={part.key}
                    style={{ flexGrow: stats[part.key], background: part.color }}
                    title={`${part.label}: ${formatPersianNumber(stats[part.key])}`}
                  />
                ) : null,
              )}
            </div>
            <Legend
              items={agreementParts.map((part) => ({
                label: `${part.label} (${formatPercent(stats.analyzed ? stats[part.key] / stats.analyzed : 0)})`,
                color: part.color,
              }))}
            />
          </div>
        </div>
      </Panel>
      <div className="dashboard__grid">
        <Panel title="تطابق به تفکیک موضوع اصلی">
          <ul className="detection__subjects">
            {stats.bySubject.map((row) => (
              <li key={row.subject}>
                <span className="detection__subject-name">
                  {row.subject}
                  <small>{formatPersianNumber(row.count)} تماس</small>
                </span>
                <span className="root-causes__meter-track">
                  <span
                    style={{
                      width: `${row.agreement * 100}%`,
                      background: 'var(--chart-series-1)',
                    }}
                  />
                </span>
                <span className="detection__subject-value">{formatPercent(row.agreement)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="بیشترین اختلاف‌ها (اپراتور ← AI)">
          {stats.confusions.length === 0 ? (
            <p className="panel__empty">اختلافی ثبت نشده است.</p>
          ) : (
            <ul className="detection__confusions">
              {stats.confusions.map((c) => (
                <li key={`${c.agent}/${c.ai}`}>
                  <span className="detection__chip detection__chip--agent">{c.agent}</span>
                  <span className="detection__arrow" aria-label="در برابر">
                    ⇄
                  </span>
                  <span className="detection__chip detection__chip--ai">{c.ai}</span>
                  <strong>{formatPersianNumber(c.count)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="توزیع اطمینان تشخیص AI">
          <ColumnChart
            label="تعداد تماس"
            series={2}
            height={220}
            items={stats.confidenceBands.map((b) => ({
              label: bandLabels[b.band],
              value: b.count,
              share: bandTotal ? b.count / bandTotal : 0,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function DetectionSection() {
  const scope = useDashboardScope();
  const query = useSubjectDetection(scope);
  return (
    <ChartState query={query} isEmpty={(data) => data.analyzed === 0} skeletonRows={5}>
      {(stats) => <DetectionPanels stats={stats} />}
    </ChartState>
  );
}

/** «تحلیل دلایل اصلی تماس» + «تشخیص موضوع تماس توسط اپراتور و AI». */
export function ReasonsTab() {
  return (
    <div className="dashboard__section">
      <ReasonsPanel />
      <DetectionSection />
    </div>
  );
}
