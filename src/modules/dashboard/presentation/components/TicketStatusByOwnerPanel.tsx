import { useState } from 'react';
import { detailStatusesForType } from '@/modules/tickets';
import { formatPersianNumber } from '@/shared/lib/format';
import { Panel } from '@/shared/ui';

import {
  useDashboardFilterStore,
  useDashboardScope,
} from '../dashboardFilterStore';
import { useCrossBreakdown } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import './TicketStatusByOwnerPanel.css';


interface Props {
  type: 'شکایت' | 'پیگیری';
}

const OPEN_STATUSES = new Set([
  'در جریان',
  'ثبت یادداشت توسط امور مشتریان',
  'ثبت شده',
]);

const CONVERTED_STATUS = 'تبدیل به شکایت';

const GROUPS = [
  { key: 'open', label: 'باز', color: '#d97706' },
  { key: 'closed', label: 'بسته‌شده', color: '#0d9488' },
  { key: 'converted', label: 'تبدیل به شکایت', color: '#7c3aed' },
] as const;

export function TicketStatusByOwnerPanel({ type }: Props) {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);

  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const dimension = type === 'شکایت' ? 'branch' : 'operator';
  const ownerLabel = type === 'شکایت' ? 'شعبه' : 'اپراتور';

const query = useCrossBreakdown(
  dimension,
  'detailStatus',
  scope,
);


  const selected = scope.filters[dimension];
  const groups = GROUPS.filter(
    (group) => type === 'پیگیری' || group.key !== 'converted',
  );

  return (
    <Panel title={`تیکت‌های ${type} به تفکیک ${ownerLabel}`}>
      <ChartState
        query={query}
        isEmpty={(data) => data.rows.length === 0}
        skeletonRows={6}
      >
        {(data) => {
          const statuses = detailStatusesForType(type);
          const knownStatuses = new Set(statuses);

          const rows = data.rows
            .map((row) => {
              const counts = new Map(
                row.cells.map((cell) => [cell.value, cell.count]),
              );

              let open = 0;
              let closed = 0;
              let converted = 0;

              for (const status of statuses) {
                const count = counts.get(status) ?? 0;

                if (status === CONVERTED_STATUS) {
                  converted += count;
                } else if (OPEN_STATUSES.has(status)) {
                  open += count;
                } else {
                  closed += count;
                }
              }

              // وضعیت‌های خالی یا ناشناخته حذف نمی‌شوند.
              const other = row.cells.reduce(
                (sum, cell) =>
                  knownStatuses.has(cell.value)
                    ? sum
                    : sum + cell.count,
                0,
              );

              return {
                label: row.value,
                counts,
                open,
                closed,
                converted,
                other,
                total: open + closed + converted + other,
              };
            })
            .sort(
              (a, b) =>
                b.open - a.open ||
                b.total - a.total ||
                a.label.localeCompare(b.label, 'fa'),
            );

          const hasOther = rows.some((row) => row.other > 0);

          const displayGroups = [
            ...groups,
            ...(hasOther
              ? [{
                  key: 'other' as const,
                  label: 'نامشخص / سایر',
                  color: '#94a3b8',
                }]
              : []),
          ];

          const maxTotal = Math.max(
            1,
            ...rows.map((row) => row.total),
          );

          // ردیف انتخاب‌شده حتی خارج از ۸ مورد اول قابل مشاهده است.
          const selectedRow = rows.find(
            (row) => row.label === selected,
          );

          const visibleRows = showAll
            ? rows
            : rows.slice(0, 8);

          if (
            !showAll &&
            selectedRow &&
            !visibleRows.some((row) => row.label === selected)
          ) {
            visibleRows.push(selectedRow);
          }

          return (
            <div className="owner-status" dir="rtl">
              <div className="owner-status__toolbar">
                <p className="owner-status__description">
                  مرتب‌شده بر اساس بیشترین تیکت باز
                </p>

                <div className="owner-status__legend">
                  {displayGroups.map((group) => (
                    <span
                      key={group.key}
                      className="owner-status__legend-item"
                    >
                      <span
                        className="owner-status__dot"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="owner-status__heading">
                <span>{ownerLabel}</span>
                <span>توزیع وضعیت</span>
                <span>کل</span>
                <span className="owner-status__sr-only">
                  جزئیات
                </span>
              </div>

              <ul className="owner-status__list">
                {visibleRows.map((row) => {
                  const isExpanded = expanded === row.label;
                  const isSelected = selected === row.label;

                  const tooltip = displayGroups
                    .map((group) => {
                      const count = row[group.key];
                      const share = row.total
                        ? Math.round((count / row.total) * 100)
                        : 0;

                      return `${group.label}: ${formatPersianNumber(count)} (${formatPersianNumber(share)}٪)`;
                    })
                    .join('\n');

                  const details = [
                    ...statuses.map((status) => ({
                      label: status,
                      count: row.counts.get(status) ?? 0,
                    })),
                    ...Array.from(row.counts.entries())
                      .filter(([status]) => !knownStatuses.has(status))
                      .map(([status, count]) => ({
                        label: status || 'بدون وضعیت',
                        count,
                      })),
                  ];

                  return (
                    <li
                      key={row.label}
                      className={[
                        'owner-status__item',
                        isSelected ? 'is-selected' : '',
                      ].join(' ')}
                    >
                      <div className="owner-status__row">
                        <button
                          type="button"
                          className="owner-status__name"
                          onClick={() =>
                            toggle(dimension, row.label)
                          }
                          aria-pressed={isSelected}
                          title={`فیلتر بر اساس ${row.label}`}
                        >
                          {row.label}
                        </button>

                        <div
                          className="owner-status__track"
                          role="img"
                          aria-label={`${row.label}؛ ${tooltip}`}
                          title={tooltip}
                        >
                          <div
                            className="owner-status__bar"
                            style={{
                              width: `${(row.total / maxTotal) * 100}%`,
                            }}
                          >
                            {displayGroups.map((group) => {
                              const count = row[group.key];

                              if (!count || !row.total) return null;

                              return (
                                <span
                                  key={group.key}
                                  className="owner-status__segment"
                                  style={{
                                    width: `${(count / row.total) * 100}%`,
                                    backgroundColor: group.color,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        <span className="owner-status__total">
                          {formatPersianNumber(row.total)}
                        </span>

                        <button
                          type="button"
                          className="owner-status__details-button"
                          aria-expanded={isExpanded}
                          aria-label={`جزئیات ${row.label}`}
                          onClick={() =>
                            setExpanded(
                              isExpanded ? null : row.label,
                            )
                          }
                        >
                          {isExpanded ? 'بستن' : 'جزئیات'}
                          <span aria-hidden="true">
                            {isExpanded ? '−' : '+'}
                          </span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="owner-status__details">
                          <div className="owner-status__summary">
                            {displayGroups.map((group) => (
                              <span key={group.key}>
                                <span
                                  className="owner-status__dot"
                                  style={{
                                    backgroundColor: group.color,
                                  }}
                                />
                                {group.label}
                                <strong>
                                  {formatPersianNumber(
                                    row[group.key],
                                  )}
                                </strong>
                              </span>
                            ))}
                          </div>

                          <dl className="owner-status__detail-list">
                            {details.map((detail) => (
                              <div key={detail.label}>
                                <dt>{detail.label}</dt>
                                <dd>
                                  {formatPersianNumber(
                                    detail.count,
                                  )}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {rows.length > 8 && (
                <div className="owner-status__footer">
                  <button
                    type="button"
                    className="owner-status__show-all"
                    onClick={() => setShowAll((value) => !value)}
                  >
                    {showAll
                      ? 'نمایش کمتر'
                      : `نمایش همه (${formatPersianNumber(rows.length)} ${ownerLabel})`}
                  </button>
                </div>
              )}
            </div>
          );
        }}
      </ChartState>
    </Panel>
  );
}
