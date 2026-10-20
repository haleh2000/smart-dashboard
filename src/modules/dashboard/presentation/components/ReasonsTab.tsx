// import { useState } from 'react';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel, StatusBadge } from '@/shared/ui';
import type { CallReasons, ReasonNode, SubjectDetectionStats } from '../../domain/analytics';
import { scopeForChart, SUBJECT_DIMENSIONS } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useCallReasons, useSubjectDetection } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
// import { ColumnChart } from './charts/ColumnChart';
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

function buildTopCauseTree(
  nodes: readonly ReasonNode[],
  limit = 8,
): ReasonNode[] {
  const selectedPaths = new Set(
    leaves(nodes)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((cause) => JSON.stringify(cause.path)),
  );

  const prune = (
    items: readonly ReasonNode[],
    parent: string[] = [],
  ): ReasonNode[] =>
    items.flatMap((node): ReasonNode[] => {
      const path = [...parent, node.label];

      if (node.children.length === 0) {
        return selectedPaths.has(JSON.stringify(path))
          ? [{ ...node }]
          : [];
      }

      const children = prune(node.children, path);
      if (children.length === 0) return [];

      return [
        {
          ...node,
          children,
          count: children.reduce((sum, child) => sum + child.count, 0),
        },
      ];
    });

  const tree = prune(nodes);
  const total = tree.reduce((sum, node) => sum + node.count, 0);

  const updateShares = (items: readonly ReasonNode[]): ReasonNode[] =>
    items.map((node) => ({
      ...node,
      share: total ? node.count / total : 0,
      children: updateShares(node.children),
    }));

  return updateShares(tree);
}

function ReasonsPanel() {
  const scope = useDashboardScope();
  const selectSubject = useDashboardFilterStore((state) => state.selectSubject);
  const query = useCallReasons(scopeForChart(scope, ...SUBJECT_DIMENSIONS));

  return (
    <ChartState
      query={query}
      isEmpty={(data) => data.total === 0}
      skeletonRows={8}
    >
      {(data) => {
        const topCauseNodes = buildTopCauseTree(data.nodes);
        const topCauseTotal = topCauseNodes.reduce(
          (sum, node) => sum + node.count,
          0,
        );

        return (
          <div className="reasons__grid">
            <Panel title="دلایل تماس در سه لایه">
              <Sunburst
                nodes={data.nodes}
                total={data.total}
                filters={scope.filters}
                onSelect={selectSubject}
              />
            </Panel>

            <Panel title="علت‌های اصلی تماس">
              <Sunburst
                nodes={topCauseNodes}
                total={topCauseTotal}
                filters={scope.filters}
                onSelect={selectSubject}
              />

              <p className="reasons__note">
                نمایش ۸ علت پرتکرار در مسیر موضوع اصلی ← موضوع فرعی ← علت تماس.
                اندازه هر بخش متناسب با تعداد تماس‌هاست؛ درصدها سهم هر بخش
                از تماس‌های علت‌های منتخب را نشان می‌دهند.
              </p>

              <p className="reasons__note">
                {formatPersianNumber(data.aiOnly)} تماس در کل این مجموعه هنوز
                توسط اپراتور دسته‌بندی نشده و بر اساس موضوع تشخیص‌داده‌شده
                توسط هوش مصنوعی شمرده شده است.
              </p>
            </Panel>
          </div>
        );
      }}
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
              {/* <div>
                <dt>پیشنهاد AI برای دسته‌بندی‌نشده‌ها</dt>
                <dd>{formatPersianNumber(stats.pending)}</dd>
              </div> */}
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
      {/* <div className="dashboard__grid">
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
      </div> */}
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

export function ReasonsTab() {
  return (
    <div className="dashboard__section">
      <ReasonsPanel />
      <DetectionSection />
    </div>
  );
}
