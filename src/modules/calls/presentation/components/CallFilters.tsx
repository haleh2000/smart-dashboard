import { useState, type ReactNode } from 'react';
import { SENTIMENTS } from '@/shared/domain/insights';
import { PERIODS } from '@/shared/domain/period';
import { toLatinDigits } from '@/shared/lib/format';
import {
  Button,
  FilterBar,
  FilterField,
  FilterSelect,
  periodLabels,
  sentimentMeta,
} from '@/shared/ui';
import { CALL_DIRECTIONS, CALL_STATUSES } from '../../domain/call';
import { callDirectionLabels, callStatusMeta } from '../callLabels';
import { useCallFilterOptions } from '../hooks/callQueries';
import type { CallListState } from '../hooks/useCallListParams';

interface CallFiltersProps {
  state: CallListState;
  meta: ReactNode;
  onChange: (changes: Partial<CallListState>) => void;
}

const asOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

export function CallFilters({ state, meta, onChange }: CallFiltersProps) {
  const [draft, setDraft] = useState(state.search ?? '');
  const { data: options } = useCallFilterOptions();

  return (
    <FilterBar
      onSubmit={() => onChange({ search: toLatinDigits(draft.trim()) || undefined })}
      meta={meta}
    >
      <FilterField label="جستجو" wide>
        <span className="filter-bar__search">
          <input
            type="search"
            className="form-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="شناسه تماس، موبایل، کدملی یا نام"
          />
          <Button type="submit">جستجو</Button>
        </span>
      </FilterField>

      <FilterSelect
        label="وضعیت"
        value={state.status}
        allLabel="همه وضعیت‌ها"
        options={CALL_STATUSES.map((value) => ({ value, label: callStatusMeta[value].label }))}
        onChange={(status) => onChange({ status })}
      />
      <FilterSelect
        label="جهت"
        value={state.direction}
        allLabel="ورودی و خروجی"
        options={CALL_DIRECTIONS.map((value) => ({ value, label: callDirectionLabels[value] }))}
        onChange={(direction) => onChange({ direction })}
      />
      <FilterSelect
        label="اپراتور"
        value={state.agent}
        allLabel="همه اپراتورها"
        options={asOptions(options?.agents ?? [])}
        onChange={(agent) => onChange({ agent })}
      />
      <FilterSelect
        label="صف"
        value={state.queue}
        allLabel="همه صف‌ها"
        options={asOptions(options?.queues ?? [])}
        onChange={(queue) => onChange({ queue })}
      />
      <FilterSelect
        label="احساس"
        value={state.sentiment}
        allLabel="همه"
        options={SENTIMENTS.map((value) => ({ value, label: sentimentMeta[value].label }))}
        onChange={(sentiment) => onChange({ sentiment })}
      />
      <FilterField label="بازه زمانی">
        <select
          className="form-select"
          value={state.period}
          onChange={(event) => onChange({ period: event.target.value as CallListState['period'] })}
        >
          {PERIODS.map((period) => (
            <option key={period} value={period}>
              {periodLabels[period]}
            </option>
          ))}
        </select>
      </FilterField>
      <label className="form-checkbox filter-bar__checkbox">
        <input
          type="checkbox"
          checked={state.uncategorizedOnly}
          onChange={(event) => onChange({ uncategorizedOnly: event.target.checked })}
        />
        فقط دسته‌بندی‌نشده
      </label>
    </FilterBar>
  );
}
