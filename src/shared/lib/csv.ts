/**
 * «خروجی Excel»: a UTF-8 CSV with a byte-order mark, which Excel opens with Persian text intact.
 * Once the backend offers a native .xlsx export, swap the download source and keep the buttons.
 */
export type CsvCell = string | number | null | undefined;

const BOM = '﻿';

const escapeCell = (cell: CsvCell) => {
  const text = cell === null || cell === undefined ? '' : String(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers: readonly string[], rows: readonly (readonly CsvCell[])[]) =>
  BOM + [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');

/** Saves the rows as `<fileName>.csv` through a temporary object URL. */
export const downloadCsv = (
  fileName: string,
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
) => {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
