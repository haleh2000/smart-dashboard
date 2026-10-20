import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PERIODS } from '@/shared/domain/period';
import {
  Button,
  FilterBar,
  FilterField,
  RangeFilterControl,
  periodLabels,
} from '@/shared/ui';
import { ticketSearchTokens } from '../../domain/ticket';
import {
  isFiltered,
  ticketCustomRange,
  type TicketListState,
} from '../hooks/ticketListParams';
import type { TicketListChanges } from '../hooks/useTicketListParams';

interface TicketFiltersProps {
  state: TicketListState;
  onChange: (changes: TicketListChanges) => void;
  onReset: () => void;
  /** Counter + export buttons. */
  meta: ReactNode;
}

/** How long the search box stays quiet before the list follows it. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Above the table there is only the unified search box and the creation period. Every other
 * filter is a dropdown on the column header it filters (وضعیت، احساس، اولویت، موضوع ۱ و ۲).
 */
export function TicketFilters({ state, onChange, onReset, meta }: TicketFiltersProps) {
  const [draft, setDraft] = useState(state.search ?? '');
  /** The term the URL already carries, so we can tell our own commits from outside changes. */
  const committed = useRef(state.search ?? '');
  /** `onChange` is a fresh closure every render; a ref keeps it out of the debounce effect. */
  const change = useRef(onChange);
  change.current = onChange;
  /** The custom «از/تا» range of the URL; while it is set the presets stand down. */
  const customRange = ticketCustomRange(state.from, state.to);

  // «حذف فیلترها», a back/forward navigation or a shared link replaces the text in the box.
  useEffect(() => {
    if ((state.search ?? '') !== committed.current) {
      committed.current = state.search ?? '';
      setDraft(committed.current);
    }
  }, [state.search]);

  // Live search: the list follows the text shortly after typing stops.
  useEffect(() => {
    const term = ticketSearchTokens(draft).join(' ');
    if (term === (state.search ?? '')) return;
    const timer = setTimeout(() => {
      committed.current = term;
      change.current({ search: term || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, state.search]);

  /** Clearing the box also cancels a search that has not reached the URL yet. */
  const resetAll = () => {
    committed.current = '';
    setDraft('');
    onReset();
  };

  return (
    <FilterBar
      onSubmit={() => {
        const term = ticketSearchTokens(draft).join(' ');
        if (term === (state.search ?? '')) return;
        committed.current = term;
        onChange({ search: term || undefined });
      }}
      meta={
        <>
          {meta}
          {isFiltered(state) && (
            <Button variant="ghost" onClick={resetAll}>
              حذف فیلترها
            </Button>
          )}
        </>
      }
    >
      <FilterField label="جستجو" wide>
        <span className="filter-bar__search">
          <input
            type="search"
            className="form-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            // The previous term is still in the box after a search; typing replaces it.
            onFocus={(event) => event.currentTarget.select()}
            placeholder="شماره تیکت، کدملی، موبایل یا نام مشتری"
          />
          <Button type="submit">جستجو</Button>
        </span>
      </FilterField>

      <FilterField label="تاریخ ایجاد">
        <span className="filter-bar__inline">
          <select
            className="form-select"
            value={state.period}
            disabled={customRange !== null}
            onChange={(event) =>
              onChange({ period: PERIODS.find((p) => p === event.target.value) ?? 'all' })
            }
          >
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {periodLabels[period]}
              </option>
            ))}
          </select>
          <RangeFilterControl
            value={customRange}
            onChange={(range) =>
              onChange({
                from: range?.from.toISOString(),
                to: range?.to.toISOString(),
                period: 'all',
              })
            }
          />
        </span>
      </FilterField>
    </FilterBar>
  );
}