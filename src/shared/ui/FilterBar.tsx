import type { FormEvent, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './FilterBar.css';

interface FilterBarProps {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Right-aligned counters and reset / export buttons. */
  meta?: ReactNode;
  children: ReactNode;
}

/** The surface above every list: search + filter fields, with a meta slot at the end. */
export function FilterBar({ onSubmit, meta, children }: FilterBarProps) {
  return (
    <form
      className="filter-bar"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(event);
      }}
    >
      {children}
      {meta && <div className="filter-bar__meta">{meta}</div>}
    </form>
  );
}

export function FilterField({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cn('filter-bar__field', wide && 'filter-bar__field--wide')}>
      <span className="filter-bar__label">{label}</span>
      {children}
    </label>
  );
}

/** Controlled `<select>` with an «همه» option standing for "no filter". */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  allLabel: string;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <FilterField label={label}>
      <select
        className="form-select"
        value={value ?? ''}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}
