import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button, FilterBar, FilterField, Panel } from '@/shared/ui';
import { toLatinDigits } from '@/shared/lib/format';
import { customerPaths } from '@/modules/customers';
import './QuickSearchCard.css';

type SearchType = 'nationalId' | 'phone' | 'policy';

const SEARCH_TYPES: readonly { value: SearchType; label: string; placeholder: string; icon: string }[] = [
  { value: 'nationalId', label: 'کد ملی', placeholder: 'مثال: ۰۰۱۲۳۴۵۶۷۸', icon: '🆔' },
  { value: 'phone', label: 'شماره موبایل', placeholder: 'مثال: ۰۹۱۲۳۴۵۶۷۸۹', icon: '📱' },
  { value: 'policy', label: 'شماره پالیسی', placeholder: 'مثال: ۱۲۳۴۵۶۷۸۹۰', icon: '📄' },
];

export function QuickSearchCard() {
  const [searchType, setSearchType] = useState<SearchType>('nationalId');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = toLatinDigits(query.trim());
    if (!normalized) return;

    if (searchType === 'nationalId') {
      navigate(customerPaths.profile(normalized), { state: { listSearch: searchParams.toString() } });
    } else if (searchType === 'phone') {
      navigate(`/customers?phone=${normalized}`, { state: { listSearch: searchParams.toString() } });
    } else if (searchType === 'policy') {
      navigate(`/tickets?policy=${normalized}`, { state: { listSearch: searchParams.toString() } });
    }
    setQuery('');
  };

  const currentType = SEARCH_TYPES.find((t) => t.value === searchType)!;

  return (
    <Panel title="جستجوی سریع" className="quick-search-card">
      <FilterBar onSubmit={handleSubmit}>
        <FilterField label="نوع جستجو" wide>
          <select
            className="form-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as SearchType)}
            aria-label="انتخاب نوع جستجو"
          >
            {SEARCH_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label={currentType.label} wide>
          <div className="quick-search-card__input-wrapper">
            <span className="quick-search-card__input-icon" aria-hidden="true">{currentType.icon}</span>
            <input
              type="text"
              className="form-input quick-search-card__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentType.placeholder}
              aria-label={currentType.label}
              dir="ltr"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(e as unknown as React.FormEvent);
              }}
            />
          </div>
        </FilterField>
        <div className="filter-bar__meta">
          <Button type="submit" variant="primary" disabled={!query.trim()} className="quick-search-card__submit">
            <span aria-hidden="true">🔍</span>
            جستجو
          </Button>
        </div>
      </FilterBar>
      <p className="quick-search-card__hint">
        کد ملی، موبایل یا شماره پالیسی را وارد کنید. اعداد فارسی پشتیبانی می‌شوند.
      </p>
    </Panel>
  );
}