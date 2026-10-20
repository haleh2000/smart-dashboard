import { useEffect, useRef, useState } from 'react';
import type { DateRange } from '@/shared/domain/period';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from './Button';
import { DateTimePicker } from './DateTimePicker';
import './RangeFilterControl.css';

interface RangeFilterControlProps {
  /** The applied range, or null while the module falls back to its period presets. */
  value: DateRange | null;
  /** Called with the new range, or null when the user clears it. */
  onChange: (range: DateRange | null) => void;
  /** Trigger text. */
  label?: string;
  /** Dialog label, read out for screen readers. */
  dialogLabel?: string;
  /** Range the panel opens with when nothing is applied yet. */
  defaultRange?: () => DateRange;
}

const lastWeek = (): DateRange => {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from, to: new Date() };
};

/**
 * A «از / تا» picker with a date and an hour, shown next to a period switch. Both modules
 * that filter by time (dashboard, ticket list) keep their presets and share this control.
 */
export function RangeFilterControl({
  value,
  onChange,
  label = 'انتخاب محدوده زمانی',
  dialogLabel = 'بازه زمانی سفارشی',
  defaultRange = lastWeek,
}: RangeFilterControlProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | null>(null);

  const active = value !== null;

  const openPanel = () => {
    setDraft(value ?? defaultRange());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

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

  const { from, to } = draft ?? {};
  const missing = !from || !to;
  const inverted = !missing && from >= to;
  const canApply = !missing && !inverted;

  const apply = () => {
    if (!canApply || !from || !to) return;
    onChange({ from, to });
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
          {label}
        </Button>
        {active && value && (
          <span className="custom-range__summary">
            {formatDateTime(value.from)} — {formatDateTime(value.to)}
          </span>
        )}
      </div>

      {open && (
        <div
          className="custom-range__panel"
          role="dialog"
          aria-label={dialogLabel}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          <div className="custom-range__fields">
            <DateTimePicker
              label="از (تاریخ و ساعت)"
              value={from ?? null}
              onChange={(date) => setDraft((state) => ({ ...(state ?? lastWeek()), from: date }))}
            />
            <DateTimePicker
              label="تا (تاریخ و ساعت)"
              value={to ?? null}
              onChange={(date) => setDraft((state) => ({ ...(state ?? lastWeek()), to: date }))}
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
                  onChange(null);
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