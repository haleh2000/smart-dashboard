import { hasSla, hasTicketSubject } from '@/modules/tickets';
import {
  formatElapsed,
  formatPersianNumber,
} from '@/shared/lib/format';
import { Panel } from '@/shared/ui';
import {
  scopeForChart,
  SUBJECT_DIMENSIONS,
} from '../../domain/filters';
import {
  useDashboardFilterStore,
  useDashboardScope,
} from '../dashboardFilterStore';
import {
  useBranchSla,
  useBreakdown,
  useCrossBreakdown,
  useSubjectLineTable,
  useSubjectTable,
} from '../hooks/analyticsQueries';

import { BreakdownPanel } from './BreakdownPanel';
import { BranchStatusRingsPanel } from './BranchStatusRingsPanel';
import { ChartState } from './ChartState';
import { useChartTooltip } from './ChartTooltip';
import { ResponseTimeChart } from './ResponseTimeChart';
import { SubjectLineTable } from './SubjectLineTable';
import { SubjectTree } from './SubjectTree';
import { TicketStatusSunburst } from './TicketStatusSunburst';
import './BranchSlaPanel.css';
import { ChannelTypeSunburst } from './ChannelTypeSunburst';

function DetailStatusPanel({ type }: { type: string }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);

  const chartScope = scopeForChart(
    {
      ...scope,
      filters: {
        ...scope.filters,
        type,
      },
    },
    'detailStatus',
  );

  const query = useBreakdown('detailStatus', chartScope);

  return (
    <Panel title={`وضعیت تیکت‌های ${type} (باز / بسته‌شده)`}>
      <ChartState
        query={query}
        isEmpty={(data) => !data.some((item) => item.count > 0)}
      >
        {(data) => (
          <TicketStatusSunburst
            key={type}
            type={type}
            data={data}
            selected={scope.filters.detailStatus}
            onSelect={(status) => toggle('detailStatus', status)}
          />
        )}
      </ChartState>
    </Panel>
  );
}

function BranchSlaPanel({ type }: { type: string }) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore(
    (state) => state.toggle,
  );
  const { bind, tooltip } = useChartTooltip();

  const isFollowUp = type === 'پیگیری';
  const dimension = isFollowUp ? 'operator' : 'branch';
  const entityLabel = isFollowUp ? 'اپراتور' : 'شعبه';

  const selectedValue = scope.filters[dimension];
  const hasSelection = selectedValue != null;

  const chartScope = scopeForChart(
    {
      ...scope,
      filters: {
        ...scope.filters,
        type,
      },
    },
    dimension,
  );

  const query = useBranchSla(chartScope, dimension);

  return (
    <Panel
      title={
        isFollowUp
          ? 'ارجاع به اپراتورها و SLA پاسخ‌گویی اپراتور'
          : 'ارجاع به شعب و SLA پاسخ‌گویی شعبه'
      }
    >
      <ChartState
        query={query}
        isEmpty={(data) => data.length === 0}
        skeletonRows={6}
      >
        {(data) => {
          const rows = [...data].sort(
            (a, b) =>
              b.referred - a.referred ||
              a.branch.localeCompare(b.branch, 'fa'),
          );

          const maxReferred = rows.reduce(
            (max, row) => Math.max(max, row.referred),
            1,
          );

          return (
            <div className="branch-sla" dir="rtl">
              <p className="branch-sla__description">
                طول میله نشان‌دهنده تعداد ارجاع است؛ برای
                فیلتر داشبورد روی {entityLabel} کلیک کنید.
              </p>

              <div className="branch-sla__heading">
                <span>{entityLabel}</span>
                <span>تعداد ارجاع</span>
              </div>

              <ul className="branch-sla__list">
                {rows.map((row) => {
                  const name =
                    row.branch || `بدون ${entityLabel}`;

                  const selected =
                    selectedValue === row.branch;
                  const disabled =
                    hasSelection && !selected;

                  const average = formatElapsed(
                    row.avgResolveDays * 86400,
                  );

                  const details =
                    `${formatPersianNumber(row.referred)} ارجاع` +
                    ` · میانگین زمان بسته‌شدن ${average}` +
                    ` · ${formatPersianNumber(row.overdue)} خارج از SLA`;

                  return (
                    <li key={row.branch}>
                      <button
                        type="button"
                        className={[
                          'branch-sla__row',
                          selected ? 'is-selected' : '',
                          disabled ? 'is-disabled' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={disabled}
                        aria-pressed={selected}
                        aria-label={`${name}؛ ${details}`}
                        onClick={() => {
                          if (!disabled) {
                            toggle(dimension, row.branch);
                          }
                        }}
                        {...bind({
                          title: name,
                          subtitle: details,
                          count: row.referred,
                        })}
                      >
                        <span className="branch-sla__name">
                          {name}

                          {selected && (
                            <span
                              className="branch-sla__check"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          )}
                        </span>

                        <span className="branch-sla__content">
                          <span
                            className="branch-sla__track"
                            aria-hidden="true"
                          >
                            <span
                              className="branch-sla__bar"
                              style={{
                                width: `${
                                  (row.referred /
                                    maxReferred) *
                                  100
                                }%`,
                              }}
                            />
                          </span>

                          <span className="branch-sla__meta">
                            <span>
                              {formatPersianNumber(
                                row.referred,
                              )}{' '}
                              ارجاع
                            </span>

                            <span>
                              میانگین بسته‌شدن {average}
                            </span>

                            <span
                              className={
                                row.overdue > 0
                                  ? 'branch-sla__overdue'
                                  : undefined
                              }
                            >
                              {formatPersianNumber(
                                row.overdue,
                              )}{' '}
                              خارج از SLA
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }}
      </ChartState>

      {tooltip}
    </Panel>
  );
}


function SubjectPanels({ type }: { type: string }) {

  const scope = useDashboardScope();

  const selectSubject = useDashboardFilterStore(
    (state) => state.selectSubject,
  );

 const typedScope = {
  ...scope,
  filters: {
    ...scope.filters,
    type,
  },
};

const tableQuery = useSubjectTable(
  scopeForChart(typedScope, ...SUBJECT_DIMENSIONS),
);

const lineQuery = useSubjectLineTable(
  scopeForChart(
    typedScope,
    ...SUBJECT_DIMENSIONS,
    'insuranceLine',
  ),
);


  return (
    <>
      <Panel title="جدول سلسله‌مراتبی موضوعات این ماژول">
        <ChartState
          query={tableQuery}
          isEmpty={(data) => data.length === 0}
          skeletonRows={6}
        >
          {(data) => (
            <SubjectTree
              rows={data}
              filters={scope.filters}
              onSelect={selectSubject}
            />
          )}
        </ChartState>
      </Panel>

      <Panel title="سهم هر علت به تفکیک رشته بیمه">
        <ChartState
          query={lineQuery}
          isEmpty={(data) => data.rows.length === 0}
          skeletonRows={6}
        >
          {(data) => (
            <SubjectLineTable
              data={data}
              filters={scope.filters}
              onSelect={selectSubject}
            />
          )}
        </ChartState>
      </Panel>
    </>
  );
}

function ChannelInputPanel({ type }: { type: string }) {
  const scope = useDashboardScope();

  const toggle = useDashboardFilterStore(
    (state) => state.toggle,
  );

  // نوع تب حفظ می‌شود؛ فقط فیلتر کانال برای دریافت نمودار کنار می‌رود.
  const chartScope = scopeForChart(
    {
      ...scope,
      filters: {
        ...scope.filters,
        type,
      },
    },
    'channel',
  );

  const query = useCrossBreakdown(
    'channel',
    'type',
    chartScope,
  );

  return (
    <Panel title="کانال ورودی">
      <ChartState
        query={query}
        isEmpty={(data) => data.rows.length === 0}
      >
        {(data) => (
          <ChannelTypeSunburst
            key={type}
            data={data}
            selectedChannel={scope.filters.channel}
            selectedType={type}
            onSelectChannel={(channel) =>
              toggle('channel', channel)
            }
            onSelectType={(channel) =>
              toggle('channel', channel)
            }
          />
        )}
      </ChartState>
    </Panel>
  );
}


export function TypeAnalyticsTab({ type }: { type: string }) {
  const sla = hasSla(type);
  const withSubject =
  type === 'شکایت' || hasTicketSubject(type);


  return (
    <div className="dashboard__section">
      <DetailStatusPanel type={type} />

      <div className="dashboard__grid dashboard__grid--wide">
        <BreakdownPanel
          title="رشته بیمه"
          dimension="insuranceLine"
          series={3}
        />

        <BreakdownPanel
          title="مشتری سازمانی"
          dimension="corporate"
          series={4}
        />
      </div>

      {['شکایت', 'درخواست', 'پیشنهاد'].includes(type) && (
      <BranchStatusRingsPanel type={type} />
    )}


      {sla && <BranchSlaPanel type={type} />}


      <div className="dashboard__grid dashboard__grid--wide">
         <ResponseTimeChart
          type={type}
          dimension={type === 'پیگیری' ? 'corporate' : 'branch'}
          title={
            type === 'پیگیری'
              ? 'میانگین پاسخ‌دهی مشتری سازمانی'
              : 'میانگین پاسخ‌دهی شعب به تیکت‌ها'
          }
          series={2}
        />
       <ChannelInputPanel type={type} />

      </div>

     {withSubject && <SubjectPanels type={type} />}

    </div>
  );
}
