import type { DataColumn } from './DataTable';

/** Headers + plain rows of the exportable columns, ready for `downloadCsv`. */
export const tableExport = <T>(columns: readonly DataColumn<T, string>[], rows: readonly T[]) => {
  const exportable = columns.filter((column) => column.exportValue);
  return {
    headers: exportable.map((column) => column.header),
    rows: rows.map((row) => exportable.map((column) => column.exportValue!(row))),
  };
};
