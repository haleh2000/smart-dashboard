import { useState, type FormEvent } from 'react';
import { formatPersianNumber, toLatinDigits } from '@/shared/lib/format';
import { Button } from '@/shared/ui';
import { TICKET_STATUSES, type TicketStatus } from '../../domain/ticket';
import { statusMeta } from '../ticketLabels';
import './TicketFilters.css';

interface TicketFiltersProps {
  search?: string;
  status?: TicketStatus;
  resultCount?: number;
  onSearch: (search: string) => void;
  onStatusChange: (status: TicketStatus | undefined) => void;
  onReset: () => void;
}

export function TicketFilters({
  search = '',
  status,
  resultCount,
  onSearch,
  onStatusChange,
  onReset,
}: TicketFiltersProps) {
  const [draft, setDraft] = useState(search);
  const isFiltered = Boolean(search || status);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(toLatinDigits(draft.trim()));
  };

  return (
    <form className="filter-bar" onSubmit={submit}>
      <label className="filter-bar__field filter-bar__field--wide">
        <span className="filter-bar__label">جستجو</span>
        <span className="filter-bar__search">
          <input
            type="search"
            className="form-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="شماره تیکت، موبایل یا کدملی"
          />
          <Button type="submit">جستجو</Button>
        </span>
      </label>

      <label className="filter-bar__field">
        <span className="filter-bar__label">وضعیت</span>
        <select
          className="form-select"
          value={status ?? ''}
          onChange={(event) =>
            onStatusChange((event.target.value || undefined) as TicketStatus | undefined)
          }
        >
          <option value="">همه وضعیت‌ها</option>
          {TICKET_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusMeta[value].label}
            </option>
          ))}
        </select>
      </label>

      <div className="filter-bar__meta">
        {resultCount !== undefined && (
          <span className="filter-bar__count">{formatPersianNumber(resultCount)} تیکت</span>
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={onReset}>
            حذف فیلترها
          </Button>
        )}
      </div>
    </form>
  );
}
