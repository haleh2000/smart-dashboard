import { cn } from '@/shared/lib/cn';
import type { Dimension } from '../../domain/filters';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { dimensionLabels } from '../dimensionLabels';
import './FilterChips.css';

export function FilterChips() {
  const { filters, remove, clear } = useDashboardFilterStore();
  const active = Object.entries(filters) as [Dimension, string][];

  return (
    <section className="filters">
      {active.length === 0 ? (
        <p className="filters__hint">
          برای فیلتر کردن کل داشبورد، روی هر ردیف از نمودارها کلیک کنید.
        </p>
      ) : (
        <div className="filters__chips">
          {active.map(([dimension, value]) => (
            <button
              key={dimension}
              type="button"
              className={cn('chip', 'chip--active')}
              onClick={() => remove(dimension)}
              aria-label={`حذف فیلتر ${dimensionLabels[dimension]}`}
            >
              {dimensionLabels[dimension]}: {value}
              <span className="chip__remove" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
          <button type="button" className="chip" onClick={clear}>
            پاک کردن همه
          </button>
        </div>
      )}
    </section>
  );
}
