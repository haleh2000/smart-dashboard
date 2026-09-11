import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel } from '@/shared/ui';
import type { SentimentOverview } from '../../domain/analytics';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useSentimentOverview } from '../hooks/analyticsQueries';
import { ChartFrame } from './charts/ChartFrame';
import { ChartTooltipBox } from './charts/ChartTooltipBox';
import { axisTick, gridStroke } from './charts/chartKit';
import { SeriesLegend } from './charts/SeriesLegend';
import { ChartState } from './ChartState';
import { SentimentGauge } from './SentimentGauge';
import { SentimentMatrix } from './SentimentMatrix';
import { formatScore, sideColor } from './sentimentKit';
import './SentimentTab.css';

const isEmpty = (data: SentimentOverview) => data.analyzed === 0;

/** −1..1 as a bar growing from the centre line: right for positive, left for negative. */
function DivergingBar({ score, color, label }: { score: number; color: string; label: string }) {
  const width = `${Math.min(1, Math.abs(score)) * 50}%`;
  return (
    <span className="diverging" role="img" aria-label={`${label}: ${formatScore(score)}`}>
      <span className="diverging__track">
        <span
          className="diverging__bar"
          style={{
            width,
            background: color,
            insetInlineStart: score >= 0 ? '50%' : `calc(50% - ${width})`,
          }}
        />
      </span>
      <span className="diverging__value">{formatScore(score)}</span>
    </span>
  );
}

function GaugesPanel({ data }: { data: SentimentOverview }) {
  return (
    <div className="sentiment-tab__gauges">
      <Panel>
        <SentimentGauge title="احساس مشتریان" split={data.customer} color={sideColor.customer} />
      </Panel>
      <Panel>
        <SentimentGauge title="احساس اپراتورها" split={data.agent} color={sideColor.agent} />
      </Panel>
    </div>
  );
}

/** Where the customer's mood ended compared with where it started. */
function JourneyPanel({ journey }: { journey: SentimentOverview['journey'] }) {
  const total = journey.improved + journey.unchanged + journey.worsened;
  const steps = [
    { key: 'improved', label: 'بهتر شد', arrow: '↗', count: journey.improved },
    { key: 'unchanged', label: 'تغییری نکرد', arrow: '→', count: journey.unchanged },
    { key: 'worsened', label: 'بدتر شد', arrow: '↘', count: journey.worsened },
  ] as const;
  return (
    <Panel title="سفر احساس مشتری — از ابتدا تا پایان مکالمه">
      <div className="journey">
        <div className="journey__source">
          <strong>{formatPersianNumber(total)}</strong>
          <span>مکالمه تحلیل‌شده</span>
        </div>
        <ul className="journey__flows">
          {steps.map((step) => {
            const share = total ? step.count / total : 0;
            return (
              <li key={step.key} className={`journey__flow journey__flow--${step.key}`}>
                <span
                  className="journey__ribbon"
                  style={{ width: `${Math.max(share, 0.04) * 100}%` }}
                />
                <span className="journey__label">
                  <span className="journey__arrow" aria-hidden="true">
                    {step.arrow}
                  </span>
                  {step.label}
                </span>
                <span className="journey__figure">
                  <strong>{formatPercent(share)}</strong>
                  <small>{formatPersianNumber(step.count)}</small>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}

function MatrixPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useSentimentOverview(scopeForChart(scope, 'sentiment'));
  return (
    <Panel title="ماتریس احساس مشتری × اپراتور">
      <ChartState query={query} isEmpty={isEmpty} skeletonRows={4}>
        {(data) => (
          <SentimentMatrix
            matrix={data.matrix}
            selected={scope.filters.sentiment}
            onSelect={(value) => toggle('sentiment', value)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function TrendPanel({ trend }: { trend: SentimentOverview['trend'] }) {
  const rows = trend.map((bucket) => ({
    label: formatDate(bucket.start).slice(5),
    week: formatDate(bucket.start),
    customer: Math.round(bucket.customerScore * 100),
    agent: Math.round(bucket.agentScore * 100),
    count: bucket.count,
  }));
  return (
    <Panel title="روند هفتگی امتیاز احساس دو طرف">
      <ChartFrame height={260} label="روند امتیاز احساس مشتری و اپراتور">
        <LineChart data={rows} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            reversed
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            orientation="right"
            domain={[-100, 100]}
            ticks={[-100, -50, 0, 50, 100]}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => formatScore(v / 100)}
          />
          <ReferenceLine y={0} stroke="var(--color-outline)" />
          <Tooltip
            cursor={{ stroke: 'var(--color-primary)', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBox
                  title={`هفته ${row.week}`}
                  rows={[
                    { name: 'مشتری', value: row.customer, color: sideColor.customer },
                    { name: 'اپراتور', value: row.agent, color: sideColor.agent },
                  ]}
                  format={(v) => formatScore(v / 100)}
                  footer={`${formatPersianNumber(row.count)} مکالمه`}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="customer"
            stroke={sideColor.customer}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="agent"
            stroke={sideColor.agent}
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 5 }}
            animationDuration={800}
          />
        </LineChart>
      </ChartFrame>
      <SeriesLegend
        items={[
          { label: 'مشتری', color: sideColor.customer },
          { label: 'اپراتور', color: sideColor.agent },
        ]}
      />
    </Panel>
  );
}

function SubjectButterfly({ rows }: { rows: SentimentOverview['bySubject'] }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const selected = scope.filters.subject1;
  return (
    <Panel title="احساس دو طرف به تفکیک موضوع اصلی">
      <div className="butterfly">
        <div className="butterfly__head" aria-hidden="true">
          <span>موضوع</span>
          <span>مشتری</span>
          <span>اپراتور</span>
        </div>
        {rows.map((row) => (
          <button
            key={row.subject}
            type="button"
            className={cn(
              'butterfly__row',
              selected !== undefined && selected !== row.subject && 'butterfly__row--dimmed',
            )}
            aria-pressed={selected === row.subject}
            onClick={() => toggle('subject1', row.subject)}
          >
            <span className="butterfly__label">
              {row.subject}
              <small>{formatPersianNumber(row.count)} تماس</small>
            </span>
            <DivergingBar score={row.customerScore} color={sideColor.customer} label="مشتری" />
            <DivergingBar score={row.agentScore} color={sideColor.agent} label="اپراتور" />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function OperatorSentimentPanel({ rows }: { rows: SentimentOverview['byOperator'] }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const selected = scope.filters.operator;
  return (
    <Panel title="احساس به تفکیک اپراتور">
      <div className="butterfly">
        <div className="butterfly__head butterfly__head--operators" aria-hidden="true">
          <span>اپراتور</span>
          <span>مشتری</span>
          <span>لحن اپراتور</span>
          <span>بهبود حال مشتری</span>
        </div>
        {rows.map((row) => (
          <button
            key={row.operator}
            type="button"
            className={cn(
              'butterfly__row butterfly__row--operators',
              selected !== undefined && selected !== row.operator && 'butterfly__row--dimmed',
            )}
            aria-pressed={selected === row.operator}
            onClick={() => toggle('operator', row.operator)}
          >
            <span className="butterfly__label">
              {row.operator}
              <small>{formatPersianNumber(row.count)} تماس</small>
            </span>
            <DivergingBar score={row.customerScore} color={sideColor.customer} label="مشتری" />
            <DivergingBar score={row.agentScore} color={sideColor.agent} label="اپراتور" />
            <span
              className="butterfly__meter"
              aria-label={`بهبود حال مشتری: ${formatPercent(row.improvedShare)}`}
            >
              <span className="butterfly__meter-track">
                <span style={{ width: `${row.improvedShare * 100}%` }} />
              </span>
              {formatPercent(row.improvedShare)}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** «تحلیل احساسات مشتری و اپراتور»: both sides of every analyzed call. */
export function SentimentTab() {
  const scope = useDashboardScope();
  const query = useSentimentOverview(scope);
  return (
    <ChartState query={query} isEmpty={isEmpty} skeletonRows={8}>
      {(data) => (
        <div className="dashboard__section">
          <GaugesPanel data={data} />
          <div className="dashboard__grid dashboard__grid--wide">
            <JourneyPanel journey={data.journey} />
            <MatrixPanel />
          </div>
          <TrendPanel trend={data.trend} />
          <div className="dashboard__grid dashboard__grid--wide">
            <SubjectButterfly rows={data.bySubject} />
            <OperatorSentimentPanel rows={data.byOperator} />
          </div>
        </div>
      )}
    </ChartState>
  );
}
