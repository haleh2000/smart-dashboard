import './SkeletonTable.css';

/** Loading skeleton for tables and panels — skeletons, not spinners, for tabular data. */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table" role="status" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="skeleton skeleton-table__row" />
      ))}
    </div>
  );
}
