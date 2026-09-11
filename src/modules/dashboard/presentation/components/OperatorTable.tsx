import { useState } from 'react';
import type { Sort } from '@/shared/domain/pagination';
import { downloadCsv } from '@/shared/lib/csv';
import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Button, DataTable, StatusBadge, tableExport, type DataColumn } from '@/shared/ui';
import type { OperatorStats } from '../../domain/analytics';

type OperatorSortField = keyof OperatorStats;

const columns = (selected?: string): DataColumn<OperatorStats, OperatorSortField>[] => [
  {
    header: 'اپراتور',
    sortField: 'operator',
    cell: (s) => (
      <span className="operator-table__name">
        {s.operator}
        {s.operator === selected && <StatusBadge tone="info">فیلتر شده</StatusBadge>}
      </span>
    ),
    exportValue: (s) => s.operator,
  },
  {
    header: 'تیکت‌ها',
    sortField: 'ticketCount',
    cell: (s) => formatPersianNumber(s.ticketCount),
    exportValue: (s) => s.ticketCount,
  },
  {
    header: 'بسته‌شده',
    sortField: 'closedTicketCount',
    cell: (s) => formatPersianNumber(s.closedTicketCount),
    exportValue: (s) => s.closedTicketCount,
  },
  {
    header: 'تماس‌ها',
    sortField: 'callCount',
    cell: (s) => formatPersianNumber(s.callCount),
    exportValue: (s) => s.callCount,
  },
  {
    header: 'زمان پاسخ (اولین پاسخ)',
    sortField: 'avgFirstResponseSec',
    cell: (s) => formatElapsed(s.avgFirstResponseSec),
    exportValue: (s) => Math.round(s.avgFirstResponseSec),
  },
  {
    header: 'زمان رسیدگی (میانگین مکالمه)',
    sortField: 'avgHandlingSec',
    cell: (s) => formatElapsed(s.avgHandlingSec),
    exportValue: (s) => Math.round(s.avgHandlingSec),
  },
  {
    header: 'FCR',
    sortField: 'fcrRate',
    cell: (s) => formatPercent(s.fcrRate),
    exportValue: (s) => (s.fcrRate * 100).toFixed(1),
  },
  {
    header: 'رضایت (احساس مثبت)',
    sortField: 'positiveShare',
    cell: (s) => formatPercent(s.positiveShare),
    exportValue: (s) => (s.positiveShare * 100).toFixed(1),
  },
];

interface OperatorTableProps {
  stats: readonly OperatorStats[];
  selected?: string;
  onSelect: (operator: string) => void;
}

/** «عملکرد اپراتورها»: tickets, calls, response and handling time per operator. Rows filter. */
export function OperatorTable({ stats, selected, onSelect }: OperatorTableProps) {
  const [sort, setSort] = useState<Sort<OperatorSortField>>({
    field: 'ticketCount',
    direction: 'desc',
  });
  const direction = sort.direction === 'asc' ? 1 : -1;
  const rows = [...stats].sort((a, b) => {
    const x = a[sort.field];
    const y = b[sort.field];
    return (typeof x === 'string' ? x.localeCompare(String(y)) : x - Number(y)) * direction;
  });
  const tableColumns = columns(selected);

  const exportRows = () => {
    const { headers, rows: cells } = tableExport(tableColumns, rows);
    downloadCsv('operators', headers, cells);
  };

  return (
    <>
      <div className="dashboard__toolbar">
        <span className="panel__empty">
          روی هر اپراتور کلیک کنید تا کل داشبورد بر اساس او فیلتر شود.
        </span>
        <Button variant="ghost" className="btn--small" onClick={exportRows}>
          خروجی Excel
        </Button>
      </div>
      <DataTable
        rows={rows}
        columns={tableColumns}
        rowKey={(s) => s.operator}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(s) => onSelect(s.operator)}
      />
    </>
  );
}
