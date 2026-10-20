import {
  closedDetailStatusesForType,
  openDetailStatusesForType,
} from '@/modules/tickets';
import {
  formatPercent,
  formatPersianNumber,
} from '@/shared/lib/format';
import { Panel } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import {
  useDashboardFilterStore,
  useDashboardScope,
} from '../dashboardFilterStore';
import { useCrossBreakdown } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { useChartTooltip } from './ChartTooltip';
import './BranchStatusRingsPanel.css';

interface Props {
  type: string;
}

const SERIES = [
  { key: 'open', label: 'باز' },
  { key: 'closed', label: 'بسته‌شده' },
] as const;

const CHART_WIDTH = 600;
const BAR_HEIGHT = 28;

export function BranchStatusRingsPanel({ type }: Props) {
  const { bind, tooltip } = useChartTooltip();
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);

  const selectedBranch = scope.filters.branch;
  const hasSelection =
    selectedBranch !== undefined && selectedBranch !== null;

  function isBranchDisabled(branch: string) {
    return hasSelection && selectedBranch !== branch;
  }

  function selectBranch(branch: string) {
    if (!isBranchDisabled(branch)) {
      toggle('branch', branch);
    }
  }

  function clearSelection() {
    if (selectedBranch !== undefined && selectedBranch !== null) {
      toggle('branch', selectedBranch);
    }
  }

  const query = useCrossBreakdown(
    'branch',
    'detailStatus',
    scopeForChart(
      {
        ...scope,
        filters: {
          ...scope.filters,
          type,
        },
      },
      'branch',
    ),
  );

  return (
    <Panel title="توزیع تیکت‌های باز و بسته بین شعب">
      <ChartState
        query={query}
        isEmpty={(data) =>
          !data.rows.some((row) =>
            row.cells.some((cell) => cell.count > 0),
          )
        }
        skeletonRows={6}
      >
        {(data) => {
          const openStatuses = new Set(
            openDetailStatusesForType(type),
          );
          const closedStatuses = new Set(
            closedDetailStatusesForType(type),
          );

          const rows = data.rows
            .map((row) => {
              let open = 0;
              let closed = 0;
              let other = 0;

              for (const cell of row.cells) {
                if (openStatuses.has(cell.value)) {
                  open += cell.count;
                } else if (closedStatuses.has(cell.value)) {
                  closed += cell.count;
                } else {
                  other += cell.count;
                }
              }

              return {
                label: row.value,
                open,
                closed,
                other,
                total: open + closed,
              };
            })
            .sort(
              (a, b) =>
                b.total - a.total ||
                a.label.localeCompare(b.label, 'fa'),
            );

          const totals = rows.reduce(
            (result, row) => ({
              open: result.open + row.open,
              closed: result.closed + row.closed,
              other: result.other + row.other,
              total: result.total + row.total,
            }),
            { open: 0, closed: 0, other: 0, total: 0 },
          );

          const selectedRow = rows.find(
            (row) => row.label === selectedBranch,
          );

          const summary = hasSelection
            ? selectedRow ?? { open: 0, closed: 0, total: 0 }
            : totals;

          // مقیاس برای همه شعب مشترک است و با انتخاب تغییر نمی‌کند.
          const maxTotal = rows.reduce(
            (max, row) => Math.max(max, row.total),
            0,
          );
          const scaleMax = Math.max(1, maxTotal);

          return (
            <div className="branch-bars" dir="rtl">
              <div className="branch-bars__toolbar">
                <div>
                  <p className="branch-bars__description">
                    برای فیلتر داشبورد، یک شعبه را انتخاب کنید.
                  </p>

                  <span className="branch-bars__hint">
                    مرتب‌شده بر اساس مجموع تیکت‌ها
                  </span>
                </div>

                {hasSelection && (
                  <button
                    type="button"
                    className="branch-bars__clear"
                    onClick={clearSelection}
                  >
                    پاک‌کردن انتخاب
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>

              <div
                className="branch-bars__summary"
                aria-live="polite"
              >
                <div className="branch-bars__summary-total">
                  <span>
                    {hasSelection
                      ? selectedBranch || 'بدون شعبه'
                      : 'همه شعب'}
                  </span>

                  <strong>
                    {formatPersianNumber(summary.total)}
                    <small>تیکت</small>
                  </strong>
                </div>

                {SERIES.map((series) => (
                  <div
                    key={series.key}
                    className="branch-bars__summary-item"
                  >
                    <span className="branch-bars__status">
                      <i
                        className={`branch-bars__dot branch-bars__dot--${series.key}`}
                        aria-hidden="true"
                      />
                      {series.label}
                    </span>

                    <strong>
                      {formatPersianNumber(summary[series.key])}
                    </strong>
                  </div>
                ))}
              </div>

              <section
                className="branch-bars__chart"
                aria-label="نمودار میله‌ای انباشته تیکت‌های شعب"
              >
                <div className="branch-bars__heading">
                  <span>شعبه</span>
                  <span>تعداد تیکت‌ها</span>
                  <span>مجموع</span>
                </div>

                <div className="branch-bars__rows">
                  {rows.map((row) => {
                    const branchName = row.label || 'بدون شعبه';
                    const selected = selectedBranch === row.label;
                    const disabled = isBranchDisabled(row.label);

                    const openWidth =
                      (row.open / scaleMax) * CHART_WIDTH;
                    const closedWidth =
                      (row.closed / scaleMax) * CHART_WIDTH;

                    return (
                      <div
                        key={row.label}
                        className={[
                          'branch-bars__row',
                          selected ? 'is-selected' : '',
                          disabled ? 'is-disabled' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="branch-bars__branch"
                          disabled={disabled}
                          aria-pressed={selected}
                          aria-label={
                            `${branchName}؛ ` +
                            `${formatPersianNumber(row.open)} باز، ` +
                            `${formatPersianNumber(row.closed)} بسته‌شده`
                          }
                          onClick={() => selectBranch(row.label)}
                        >
                          <span>{branchName}</span>
                          {selected && (
                            <span aria-hidden="true">✓</span>
                          )}
                        </button>

                        <div className="branch-bars__plot">
                          <svg
                            viewBox={`0 0 ${CHART_WIDTH} ${BAR_HEIGHT}`}
                            preserveAspectRatio="none"
                            role="group"
                            aria-label={`تیکت‌های ${branchName}`}
                          >
                            {SERIES.map((series) => {
                              const count = row[series.key];

                              if (count <= 0) return null;

                              const share = row.total
                                ? count / row.total
                                : 0;

                              const width =
                                series.key === 'open'
                                  ? openWidth
                                  : closedWidth;

                              // شروع میله از سمت راست در رابط فارسی.
                              const x =
                                series.key === 'open'
                                  ? CHART_WIDTH - openWidth
                                  : CHART_WIDTH -
                                    openWidth -
                                    closedWidth;

                              return (
                                <rect
                                  key={series.key}
                                  x={x}
                                  y={0}
                                  width={width}
                                  height={BAR_HEIGHT}
                                  className={`branch-bars__segment branch-bars__segment--${series.key}`}
                                  role="button"
                                  tabIndex={disabled ? -1 : 0}
                                  aria-pressed={selected}
                                  aria-disabled={disabled}
                                  aria-label={
                                    `${branchName}؛ ${series.label}: ` +
                                    `${formatPersianNumber(count)}؛ ` +
                                    `${formatPercent(share)} از تیکت‌های این شعبه`
                                  }
                                  {...bind({
                                    title: branchName,
                                    subtitle:
                                      `تیکت‌های ${series.label}؛ سهم از تیکت‌های همین شعبه`,
                                    count,
                                    share,
                                  })}
                                  onClick={() =>
                                    selectBranch(row.label)
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault();
                                      selectBranch(row.label);
                                    }
                                  }}
                                />
                              );
                            })}
                          </svg>

                          <div className="branch-bars__counts">
                            <span>
                              باز: {formatPersianNumber(row.open)}
                            </span>
                            <span>
                              بسته: {formatPersianNumber(row.closed)}
                            </span>
                          </div>
                        </div>

                        <strong className="branch-bars__total">
                          {formatPersianNumber(row.total)}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                {maxTotal > 0 && (
                  <div className="branch-bars__axis" aria-hidden="true">
                    <span />
                    <div>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                        <span key={ratio}>
                          {formatPersianNumber(
                            Math.round(maxTotal * ratio),
                          )}
                        </span>
                      ))}
                    </div>
                    <span />
                  </div>
                )}

                <div className="branch-bars__footer">
                  <span>مجموع همه شعب</span>

                  <div>
                    <span>
                      باز: {formatPersianNumber(totals.open)}
                    </span>
                    <span>
                      بسته: {formatPersianNumber(totals.closed)}
                    </span>
                  </div>

                  <strong>
                    {formatPersianNumber(totals.total)}
                  </strong>
                </div>
              </section>

              <p className="branch-bars__note">
                طول هر میله بر اساس مجموع تیکت‌های شعبه و با مقیاس
                مشترک است. درصد tooltip نسبت به مجموع تیکت‌های همان
                شعبه محاسبه می‌شود.
              </p>

              {totals.other > 0 && (
                <p className="branch-bars__notice">
                  {formatPersianNumber(totals.other)} تیکت با وضعیت
                  خارج از تعریف باز/بسته، در نمودار و مجموع‌ها
                  محاسبه نشده است.
                </p>
              )}
            </div>
          );
        }}
      </ChartState>

      {tooltip}
    </Panel>
  );
}
