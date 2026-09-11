import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import { visiblePages } from './visiblePages';
import './Pagination.css';

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, pageSize, total, onChange }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      <p className="pagination__summary">
        نمایش {formatPersianNumber(from)} تا {formatPersianNumber(to)} از{' '}
        {formatPersianNumber(total)}
      </p>
      <div className="pagination__pages">
        <button
          className="pagination__btn"
          type="button"
          disabled={page <= 1}
          aria-label="صفحه قبل"
          onClick={() => onChange(page - 1)}
        >
          ›
        </button>
        {visiblePages(page, pageCount).map((p, index) =>
          p === null ? (
            <span key={`gap-${index}`} className="pagination__gap">
              …
            </span>
          ) : (
            <button
              key={p}
              className={cn('pagination__btn', p === page && 'pagination__btn--active')}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {formatPersianNumber(p)}
            </button>
          ),
        )}
        <button
          className="pagination__btn"
          type="button"
          disabled={page >= pageCount}
          aria-label="صفحه بعد"
          onClick={() => onChange(page + 1)}
        >
          ‹
        </button>
      </div>
    </nav>
  );
}
