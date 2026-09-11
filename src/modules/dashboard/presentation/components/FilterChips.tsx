import { cn } from '@/shared/lib/cn';
import type { Dimension } from '../../domain/filters';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { dimensionLabels, dimensionValueLabel } from '../dimensionLabels';
import './FilterChips.css';

export function FilterChips() {
  const { filters, remove, clear } = useDashboardFilterStore();
  const active = Object.entries(filters) as [Dimension, string][];

  return (
    <section className="filters" aria-label="فیلترهای فعال">
      {active.length === 0 ? (
        <p className="filters__hint">
          برای فیلتر کردن کل داشبورد، روی هر ردیف، برش یا ستون از نمودارها کلیک کنید.
        </p>
      ) : (
        <div className="filters__chips">
          {active.map(([dimension, value]) => (
            <button
              key={dimension}
              type="button"
              className={cn('chip', 'chip--active')}
              onClick={() => remove(dimension)}
              aria-label={`حذف فیلتر ${dimensionLabels[dimension]}: ${dimensionValueLabel(dimension, value)}`}
            >
              {dimensionLabels[dimension]}: {dimensionValueLabel(dimension, value)}
              <span className="chip__remove" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
          <button type="button" className="chip" onClick={clear}>
            پاک کردن همه (Clear)
          </button>
        </div>
      )}
    </section>
  );
}
