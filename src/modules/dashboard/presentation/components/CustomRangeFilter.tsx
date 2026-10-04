import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Button, DateTimePicker } from '@/shared/ui';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import './CustomRangeFilter.css';

interface Draft {
  from: Date | null;
  to: Date | null;
}

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * «بازه دلخواه»: a hand-picked day + hour range next to the preset buttons.
 * While applied it overrides the preset; picking a preset drops it again.
 */
export function CustomRangeFilter() {
  const customRange = useDashboardFilterStore((state) => state.customRange);
  const setCustomRange = useDashboardFilterStore((state) => state.setCustomRange);
  const clearCustomRange = useDashboardFilterStore((state) => state.clearCustomRange);

  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ from: null, to: null });

  const active = customRange !== null;

  const openPanel = () => {
    setDraft({
      from: customRange?.from ?? daysAgo(7),
      to: customRange?.to ?? new Date(),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    // The date pickers render into a portal on <body>, so their clicks land
    // outside this panel and must not dismiss it.
    const isOverlay = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-portal-layer]') !== null;
    const closeIfOutside = (event: PointerEvent) => {
      if (isOverlay(event.target)) return;
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isOverlay(document.activeElement)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const { from, to } = draft;
  const missing = !from || !to;
  const inverted = !missing && from >= to;
  const canApply = !missing && !inverted;

  const apply = () => {
    if (!from || !to) return;
    setCustomRange({ from, to });
    setOpen(false);
  };

  return (
    <div className="custom-range" ref={rootRef}>
      <div className="custom-range__trigger-wrap">
        <Button
          variant="ghost"
          className={cn('custom-range__trigger', active && 'custom-range__trigger--active')}
          aria-pressed={active}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openPanel())}
        >
          انتخاب محدوده زمانی
        </Button>
        {active && customRange && (
          <span className="custom-range__summary">
            {formatDateTime(customRange.from)} — {formatDateTime(customRange.to)}
          </span>
        )}
      </div>

      {open && (
        <div
          className="custom-range__panel"
          role="dialog"
          aria-label="بازه زمانی سفارشی"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          {/* <p className="custom-range__hint">
            شروع و پایان بازه را با تاریخ و ساعت انتخاب کنید؛ کل داشبورد بر اساس آن فیلتر می‌شود.
          </p> */}

          <div className="custom-range__fields">
            {/* No day is blocked in either picker: the pair is validated below,
                where an inverted range is explained and «اعمال» held back. */}
            <DateTimePicker
              label="از (تاریخ و ساعت)"
              value={from}
              onChange={(date) => setDraft((state) => ({ ...state, from: date }))}
            />
            <DateTimePicker
              label="تا (تاریخ و ساعت)"
              value={to}
              onChange={(date) => setDraft((state) => ({ ...state, to: date }))}
            />
          </div>

          {inverted && (
            <p className="custom-range__error" role="alert">
              تاریخ شروع باید قبل از تاریخ پایان باشد.
            </p>
          )}

          <div className="custom-range__actions">
            {active && (
              <Button
                variant="danger"
                onClick={() => {
                  clearCustomRange();
                  setOpen(false);
                }}
              >
                حذف بازه
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpen(false)}>
              لغو
            </Button>
            <Button variant="primary" disabled={!canApply} onClick={apply}>
              اعمال
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
