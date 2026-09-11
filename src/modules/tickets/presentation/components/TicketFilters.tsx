import { useState, type ReactNode } from 'react';
import { PRIORITIES, SENTIMENTS } from '@/shared/domain/insights';
import { PERIODS } from '@/shared/domain/period';
import { toLatinDigits } from '@/shared/lib/format';
import {
  Button,
  FilterBar,
  FilterField,
  FilterSelect,
  periodLabels,
  priorityMeta,
  sentimentMeta,
} from '@/shared/ui';
import { TICKET_STATUSES } from '../../domain/ticket';
import { useTicketFilterOptions } from '../hooks/ticketQueries';
import { isFiltered, type TicketListState } from '../hooks/ticketListParams';
import type { TicketListChanges } from '../hooks/useTicketListParams';
import { statusMeta } from '../ticketLabels';

interface TicketFiltersProps {
  state: TicketListState;
  onChange: (changes: TicketListChanges) => void;
  onReset: () => void;
  /** Counter + export buttons. */
  meta: ReactNode;
}

const asOptions = (values: readonly string[] = []) =>
  values.map((value) => ({ value, label: value }));

/** README → «فیلتر (وضعیت، اولویت، موضوع، اپراتور، تاریخ)» plus the enrichment filters. */
export function TicketFilters({ state, onChange, onReset, meta }: TicketFiltersProps) {
  const [draft, setDraft] = useState(state.search ?? '');
  const hasAdvanced = Boolean(
    state.sentiment || state.type || state.subject1 || state.branch || state.starredOnly,
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvanced);
  const { data: options } = useTicketFilterOptions();

  return (
    <FilterBar
      onSubmit={() => onChange({ search: toLatinDigits(draft.trim()) || undefined })}
      meta={
        <>
          {meta}
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'فیلترهای کمتر' : 'فیلترهای بیشتر'}
          </Button>
          {isFiltered(state) && (
            <Button variant="ghost" onClick={onReset}>
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
            placeholder="شماره تیکت، موبایل، کدملی یا نام"
          />
          <Button type="submit">جستجو</Button>
        </span>
      </FilterField>

      <FilterSelect
        label="وضعیت"
        allLabel="همه وضعیت‌ها"
        value={state.status}
        options={TICKET_STATUSES.map((value) => ({ value, label: statusMeta[value].label }))}
        onChange={(status) => onChange({ status })}
      />
      <FilterSelect
        label="اولویت"
        allLabel="همه اولویت‌ها"
        value={state.priority}
        options={PRIORITIES.map((value) => ({ value, label: priorityMeta[value].label }))}
        onChange={(priority) => onChange({ priority })}
      />
      <FilterSelect
        label="اپراتور"
        allLabel="همه اپراتورها"
        value={state.operator}
        options={asOptions(options?.operators)}
        onChange={(operator) => onChange({ operator })}
      />
      <FilterField label="تاریخ ایجاد">
        <select
          className="form-select"
          value={state.period}
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
      </FilterField>

      {showAdvanced && (
        <>
          <FilterSelect
            label="موضوع اصلی"
            allLabel="همه موضوع‌ها"
            value={state.subject1}
            options={asOptions(options?.subjects)}
            onChange={(subject1) => onChange({ subject1 })}
          />
          <FilterSelect
            label="نوع تیکت"
            allLabel="همه انواع"
            value={state.type}
            options={asOptions(options?.types)}
            onChange={(type) => onChange({ type })}
          />
          <FilterSelect
            label="شعبه"
            allLabel="همه شعب"
            value={state.branch}
            options={asOptions(options?.branches)}
            onChange={(branch) => onChange({ branch })}
          />
          <FilterSelect
            label="احساس مشتری"
            allLabel="همه"
            value={state.sentiment}
            options={SENTIMENTS.map((value) => ({ value, label: sentimentMeta[value].label }))}
            onChange={(sentiment) => onChange({ sentiment })}
          />
          <label className="form-checkbox filter-bar__checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.starredOnly)}
              onChange={(event) => onChange({ starredOnly: event.target.checked || undefined })}
            />
            فقط ستاره‌دارها
          </label>
        </>
      )}
    </FilterBar>
  );
}
