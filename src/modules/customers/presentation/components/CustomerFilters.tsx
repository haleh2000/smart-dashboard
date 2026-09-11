import { useState, type ReactNode } from 'react';
import { toLatinDigits } from '@/shared/lib/format';
import { Button, FilterBar, FilterField, FilterSelect } from '@/shared/ui';
import {
  CUSTOMER_KINDS,
  CUSTOMER_STATUSES,
  type CustomerKind,
  type CustomerStatus,
} from '../../domain/customer';
import { customerKindLabels, customerStatusMeta } from '../customerLabels';

interface CustomerFiltersProps {
  search?: string;
  status?: CustomerStatus;
  kind?: CustomerKind;
  vipOnly?: boolean;
  meta?: ReactNode;
  onSearch: (search: string) => void;
  onStatusChange: (status: CustomerStatus | undefined) => void;
  onKindChange: (kind: CustomerKind | undefined) => void;
  onVipOnlyChange: (vipOnly: boolean) => void;
}

const statusOptions = CUSTOMER_STATUSES.map((value) => ({
  value,
  label: customerStatusMeta[value].label,
}));
const kindOptions = CUSTOMER_KINDS.map((value) => ({ value, label: customerKindLabels[value] }));

export function CustomerFilters({
  search = '',
  status,
  kind,
  vipOnly = false,
  meta,
  onSearch,
  onStatusChange,
  onKindChange,
  onVipOnlyChange,
}: CustomerFiltersProps) {
  const [draft, setDraft] = useState(search);

  return (
    <FilterBar onSubmit={() => onSearch(toLatinDigits(draft.trim()))} meta={meta}>
      <FilterField label="جستجو" wide>
        <span className="filter-bar__search">
          <input
            type="search"
            className="form-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="نام، موبایل یا کدملی"
          />
          <Button type="submit">جستجو</Button>
        </span>
      </FilterField>
      <FilterSelect
        label="وضعیت"
        value={status}
        options={statusOptions}
        allLabel="همه وضعیت‌ها"
        onChange={onStatusChange}
      />
      <FilterSelect
        label="نوع مشتری"
        value={kind}
        options={kindOptions}
        allLabel="فردی و سازمانی"
        onChange={onKindChange}
      />
      <label className="form-checkbox filter-bar__checkbox">
        <input
          type="checkbox"
          checked={vipOnly}
          onChange={(event) => onVipOnlyChange(event.target.checked)}
        />
        فقط مشتریان VIP
      </label>
    </FilterBar>
  );
}
