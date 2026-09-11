import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { Sort } from '@/shared/domain/pagination';
import type { CsvCell } from '@/shared/lib/csv';
import { cn } from '@/shared/lib/cn';
import './DataTable.css';

export interface DataColumn<T, S extends string = string> {
  /** Stable key; also used as the `data-label` on the mobile card layout. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Makes the header a sort toggle. */
  sortField?: S;
  /** Plain value for the Excel export; columns without it are left out of the file. */
  exportValue?: (row: T) => CsvCell;
  /** Cells that must never trigger the row click (e.g. action buttons). */
  interactive?: boolean;
}

interface DataTableProps<T, S extends string> {
  rows: readonly T[];
  columns: readonly DataColumn<T, S>[];
  rowKey: (row: T) => string;
  sort?: Sort<S>;
  onSortChange?: (sort: Sort<S>) => void;
  onRowClick?: (row: T) => void;
  /** Checkbox column (README → «چک‌باکس انتخاب»). */
  selection?: { selected: ReadonlySet<string>; onChange: (selected: Set<string>) => void };
  caption?: string;
}

const stop = (event: MouseEvent | KeyboardEvent) => event.stopPropagation();

/**
 * The desk queue table: config-driven columns, click-to-sort headers, clickable rows,
 * optional row selection. Collapses to cards ≤720px.
 */
export function DataTable<T, S extends string = string>({
  rows,
  columns,
  rowKey,
  sort,
  onSortChange,
  onRowClick,
  selection,
  caption,
}: DataTableProps<T, S>) {
  const keys = rows.map(rowKey);
  const allSelected =
    selection !== undefined && keys.length > 0 && keys.every((k) => selection.selected.has(k));

  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    for (const key of keys) {
      if (allSelected) next.delete(key);
      else next.add(key);
    }
    selection.onChange(next);
  };

  const toggleOne = (key: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selection.onChange(next);
  };

  const toggleSort = (field: S) =>
    sort &&
    onSortChange?.({
      field,
      direction: sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc',
    });

  return (
    <div className="queue-table-wrap">
      <table className="queue-table">
        {caption && <caption className="queue-table__caption">{caption}</caption>}
        <thead>
          <tr>
            {selection && (
              <th scope="col" className="queue-table__select">
                <input
                  type="checkbox"
                  aria-label="انتخاب همه ردیف‌ها"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((column) => {
              const active = sort && column.sortField === sort.field;
              return (
                <th
                  key={column.header}
                  scope="col"
                  aria-sort={
                    active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {column.sortField && onSortChange ? (
                    <button
                      type="button"
                      className="queue-table__sort"
                      onClick={() => toggleSort(column.sortField!)}
                    >
                      {column.header}
                      <span className="queue-table__sort-mark" aria-hidden="true">
                        {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const selected = selection?.selected.has(key) ?? false;
            return (
              <tr
                key={key}
                className={cn(
                  onRowClick && 'queue-table__row',
                  selected && 'queue-table__row--selected',
                )}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick && (() => onRowClick(row))}
                onKeyDown={
                  onRowClick &&
                  ((event) =>
                    event.key === 'Enter' &&
                    event.target === event.currentTarget &&
                    onRowClick(row))
                }
              >
                {selection && (
                  <td className="queue-table__select" data-label="انتخاب" onClick={stop}>
                    <input
                      type="checkbox"
                      aria-label={`انتخاب ردیف ${key}`}
                      checked={selected}
                      onChange={() => toggleOne(key)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.header}
                    data-label={column.header}
                    onClick={column.interactive ? stop : undefined}
                    onKeyDown={column.interactive ? stop : undefined}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
