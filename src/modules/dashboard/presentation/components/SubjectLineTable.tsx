import { useState } from 'react';
import { downloadCsv } from '@/shared/lib/csv';
import { cn } from '@/shared/lib/cn';
import { formatPercent } from '@/shared/lib/format';
import { Button } from '@/shared/ui';
import type { SubjectLineTable as SubjectLineData } from '../../domain/analytics';
import type { DashboardFilters } from '../../domain/filters';
import './SubjectTree.css';

/** `share` sorts by Percent_Subject3, any other key by that line's column. */
type SortKey = 'share' | string;

interface SubjectLineTableProps {
  data: SubjectLineData;
  filters: DashboardFilters;
  onSelect: (path: readonly string[]) => void;
}

/** «جدول تفصیلی درصد سهم هر Subject3 به تفکیک نوع بیمه» with a Total row. */
export function SubjectLineTable({ data, filters, onSelect }: SubjectLineTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'share', desc: true });
  const valueOf = (row: SubjectLineData['rows'][number], key: SortKey) =>
    key === 'share' ? row.share : (row.lineShares[key] ?? 0);
  const rows = [...data.rows].sort(
    (a, b) => (valueOf(a, sort.key) - valueOf(b, sort.key)) * (sort.desc ? -1 : 1),
  );

  const toggleSort = (key: SortKey) =>
    setSort((current) => ({ key, desc: current.key === key ? !current.desc : true }));

  const header = (key: SortKey, label: string) => (
    <th
      key={key}
      scope="col"
      aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : undefined}
    >
      <button type="button" className="subject-tree__sort" onClick={() => toggleSort(key)}>
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.desc ? '▼' : '▲') : '↕'}</span>
      </button>
    </th>
  );

  const exportRows = () =>
    downloadCsv(
      'subject-by-insurance-line',
      ['Subject1', 'Subject2', 'Subject3', 'Percent_Subject3', ...data.lines],
      [
        ...rows.map((row) => [
          row.subject1,
          row.subject2,
          row.subject3,
          (row.share * 100).toFixed(2),
          ...data.lines.map((line) => ((row.lineShares[line] ?? 0) * 100).toFixed(2)),
        ]),
        [
          'Total',
          '',
          '',
          '100.00',
          ...data.lines.map((line) => ((data.totals[line] ?? 0) * 100).toFixed(2)),
        ],
      ],
    );

  return (
    <div>
      <div className="subject-tree__toolbar">
        <span className="panel__empty">
          درصد هر رشته بیمه از سوابق همان علت (هر ردیف جمعاً ۱۰۰٪).
        </span>
        <Button variant="ghost" className="btn--small" onClick={exportRows}>
          خروجی Excel
        </Button>
      </div>
      <div className="subject-tree__scroll">
        <table className="subject-tree__table">
          <thead>
            <tr>
              <th scope="col">موضوع اصلی</th>
              <th scope="col"> موضوع فرعی</th>
              <th scope="col">ریزموضوع</th>
              {header('share', 'درصد از کل تیکت‌ها')}
              {data.lines.map((line) => header(line, line))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const path = [row.subject1, row.subject2, row.subject3];
              const selected =
                filters.subject1 === row.subject1 &&
                filters.subject2 === row.subject2 &&
                filters.subject3 === row.subject3;
              return (
                <tr
                  key={path.join('›')}
                  className={cn('subject-tree__row', selected && 'subject-tree__row--selected')}
                >
                  <td>{row.subject1}</td>
                  <td>{row.subject2}</td>
                  <td>
                    <button
                      type="button"
                      className="subject-tree__label"
                      aria-pressed={selected}
                      onClick={() => onSelect(path)}
                    >
                      {row.subject3}
                    </button>
                  </td>
                  <td className="subject-tree__number">{formatPercent(row.share)}</td>
                  {data.lines.map((line) => (
                    <td key={line} className="subject-tree__number">
                      {formatPercent(row.lineShares[line] ?? 0)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                جمع (Total)
              </th>
              <td className="subject-tree__number">{formatPercent(rows.length ? 1 : 0)}</td>
              {data.lines.map((line) => (
                <td key={line} className="subject-tree__number">
                  {formatPercent(data.totals[line] ?? 0)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
