import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { formatDate, formatPersianNumber, formatTime } from '@/shared/lib/format';
import './JalaliDatePicker.css';

interface JalaliDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** شنبه تا جمعه — the Iranian week starts on Saturday. */
const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

const DAY_MS = 86_400_000;

type Panel = 'days' | 'months' | 'years';

const monthName = (index: number) => JALALI_MONTHS[index] ?? '';
const persian = formatPersianNumber;

/* ── Jalali <-> Gregorian ──────────────────────────────────────────────
   `Intl` can read a Gregorian date as Jalali but cannot convert back, so the
   reverse walk is done here: a Jalali year opens on 20/21 March of
   `year + 621`, and every month is measured by asking the browser's own
   Persian calendar when it rolls over. Dates are kept at local noon so the
   walk never trips over a daylight-saving shift.

   Building an `Intl.DateTimeFormat` costs far more than formatting with one,
   and the grid asks for ~30 conversions per render — so the formatter and the
   month boundaries are both built once and kept. */

const jalaliFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const toJalali = (date: Date) => {
  const parts = jalaliFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  // 1-based month and day; everything downstream is 0-based.
  return { year: read('year'), month: read('month') - 1, day: read('day') };
};

const startOfJalaliMonth = (date: Date) =>
  new Date(date.getTime() - (toJalali(date).day - 1) * DAY_MS);

const jalaliMonthLength = (firstOfMonth: Date) => {
  const start = toJalali(firstOfMonth);
  let length = 1;
  for (
    let next = toJalali(new Date(firstOfMonth.getTime() + DAY_MS));
    next.year === start.year && next.month === start.month;
    next = toJalali(new Date(firstOfMonth.getTime() + length * DAY_MS))
  ) {
    length += 1;
  }
  return length;
};

const firstDayCache = new Map<string, Date>();

/** Midnight-anchored first of a Jalali month — the grid's stepping stone. */
const firstOfJalaliMonth = (year: number, month: number) => {
  const key = `${year}-${month}`;
  const cached = firstDayCache.get(key);
  if (cached) return cached;
  let cursor = startOfJalaliMonth(new Date(year + 621, 2, 21, 12));
  for (let index = 0; index < month; index += 1) {
    cursor = new Date(cursor.getTime() + jalaliMonthLength(cursor) * DAY_MS);
  }
  cursor.setHours(0, 0, 0, 0);
  firstDayCache.set(key, cursor);
  return cursor;
};

const fromJalali = (year: number, month: number, day: number) =>
  new Date(firstOfJalaliMonth(year, month).getTime() + (day - 1) * DAY_MS);

/** 0 = Saturday … 6 = Friday, to line up with `WEEK_DAYS`. */
const weekDayIndex = (date: Date) => (date.getDay() + 1) % 7;

const Caret = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="jdp-caret">
    <path
      d="m6 9 6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Jalali date + time picker.
 *
 * The trigger reads as a normal form field; the modal that opens on click
 * mirrors the Day date-picker design — a teal gradient header with the
 * month/year dropdowns and the month arrows, a Saturday-first day grid and a
 * three-button footer («تأیید» / «اکنون» / «امروز»). The hour/minute row keeps
 * the range filter's hour precision.
 */
export function JalaliDatePicker({ label, value, onChange }: JalaliDatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('days');
  // The month on screen — independent of the committed `value`, so browsing
  // around never rewrites the field.
  const [cursor, setCursor] = useState<Date>(() => value ?? new Date());
  const [draft, setDraft] = useState<Date | null>(value);
  const [hours, setHours] = useState(() => value?.getHours() ?? 0);
  const [minutes, setMinutes] = useState(() => value?.getMinutes() ?? 0);

  const view = toJalali(cursor);
  const today = useMemo(() => toJalali(new Date()), []);
  // Only the day matters for highlighting, and the grid compares against it 31
  // times per render.
  const selected = useMemo(() => (draft ? toJalali(draft) : null), [draft]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openModal = () => {
    const base = value ?? new Date();
    setCursor(base);
    setDraft(value);
    setHours(base.getHours());
    setMinutes(base.getMinutes());
    setPanel('days');
    setOpen(true);
  };

  // The modal lives in a portal at the end of <body>, so Tab would otherwise
  // walk the whole dashboard before reaching it — and Escape would reach the
  // range panel behind it as well. Both are handled here.
  useEffect(() => {
    if (!open) return;
    modalRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const shiftMonth = (delta: number) => {
    const total = view.year * 12 + view.month + delta;
    setCursor(fromJalali(Math.floor(total / 12), ((total % 12) + 12) % 12, 1));
  };

  const chooseDay = (day: number) => {
    const date = fromJalali(view.year, view.month, day);
    date.setHours(
      draft?.getHours() ?? cursor.getHours(),
      draft?.getMinutes() ?? cursor.getMinutes(),
      0,
      0,
    );
    setCursor(date);
    setDraft(date);
    setHours(date.getHours());
    setMinutes(date.getMinutes());
  };

  const commit = (date: Date) => {
    onChange(date);
    close();
  };

  const confirm = () => {
    if (!draft) return;
    const date = new Date(draft);
    date.setHours(hours, minutes, 0, 0);
    commit(date);
  };

  // The month on screen drives a 31-cell grid, so its shape is measured once
  // per month rather than on every render.
  const grid = useMemo(() => {
    const first = firstOfJalaliMonth(view.year, view.month);
    const total = jalaliMonthLength(first);
    return {
      leading: weekDayIndex(first),
      days: Array.from({ length: total }, (_, index) => index + 1),
    };
  }, [view.year, view.month]);

  const years = useMemo(
    () => Array.from({ length: 24 }, (_, index) => today.year - 20 + index),
    [today.year],
  );

  const modal = (body: ReactNode) =>
    createPortal(
      <div
        className="jdp-backdrop"
        // Marks the layer as an overlay: the range panel behind it listens for
        // outside pointer-downs and must not read clicks here as such.
        data-portal-layer
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div
          className="jdp-modal"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
        >
          <header className="jdp-header">
            <div className="jdp-header-selectors">
              <button
                type="button"
                className={
                  panel === 'months' ? 'jdp-header-btn jdp-header-btn--on' : 'jdp-header-btn'
                }
                aria-label="انتخاب ماه"
                aria-expanded={panel === 'months'}
                onClick={() => setPanel(panel === 'months' ? 'days' : 'months')}
              >
                {monthName(view.month)}
                <Caret />
              </button>
              <button
                type="button"
                className={
                  panel === 'years' ? 'jdp-header-btn jdp-header-btn--on' : 'jdp-header-btn'
                }
                aria-label="انتخاب سال"
                aria-expanded={panel === 'years'}
                onClick={() => setPanel(panel === 'years' ? 'days' : 'years')}
              >
                {persian(view.year)}
                <Caret />
              </button>
            </div>

            {/* RTL: the right-hand arrow walks back, the left-hand one forward. */}
            <div className="jdp-header-nav">
              <button
                type="button"
                className="jdp-nav-arrow"
                aria-label="ماه قبل"
                onClick={() => shiftMonth(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="m9 5 7 7-7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <h2 className="jdp-header-title">
                {monthName(view.month)} {persian(view.year)}
              </h2>
              <button
                type="button"
                className="jdp-nav-arrow"
                aria-label="ماه بعد"
                onClick={() => shiftMonth(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="m15 5-7 7 7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          <div className="jdp-body">{body}</div>

          {/* Its own zone between the grid and the actions, so the clock never
              reads as part of the day grid. */}
          <div className="jdp-time">
            <span className="jdp-time-label">ساعت</span>
            <div className="jdp-time-fields">
              <select
                className="jdp-time-select"
                aria-label="ساعت"
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {persian(String(hour).padStart(2, '0'))}
                  </option>
                ))}
              </select>
              <span className="jdp-time-sep">:</span>
              <select
                className="jdp-time-select"
                aria-label="دقیقه"
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
              >
                {MINUTES.map((minute) => (
                  <option key={minute} value={minute}>
                    {persian(String(minute).padStart(2, '0'))}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <footer className="jdp-footer">
            <button
              type="button"
              className="jdp-btn jdp-btn--primary"
              disabled={!draft}
              onClick={confirm}
            >
              تأیید
            </button>
            <button
              type="button"
              className="jdp-btn jdp-btn--accent"
              onClick={() => commit(new Date())}
            >
              اکنون
            </button>
            <button
              type="button"
              className="jdp-btn"
              onClick={() => {
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                commit(date);
              }}
            >
              امروز
            </button>
          </footer>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="form-field jdp">
      <span className="form-field__label">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="form-input jdp__trigger"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openModal}
      >
        {/* Clock and date read as two parts, not one run-on number: the clock
            leads at the field's start edge and the date sits behind a thin rule
            in the muted tone, so which is which is obvious at a glance. */}
        {value ? (
          <span className="jdp__trigger-value">
            <span className="jdp__trigger-time">{formatTime(value)}</span>
            <span>{formatDate(value)}</span>
          </span>
        ) : (
          <span className="jdp__placeholder">انتخاب تاریخ</span>
        )}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="jdp__trigger-icon">
          <path
            d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open &&
        modal(
          <>
            {panel === 'days' && (
              <>
                <div className="jdp-weekdays" aria-hidden="true">
                  {WEEK_DAYS.map((day) => (
                    <span key={day} className="jdp-weekday">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="jdp-days-grid">
                  {Array.from({ length: grid.leading }, (_, index) => (
                    <span key={`pad-${index}`} className="jdp-day-cell jdp-day-cell--pad" />
                  ))}
                  {grid.days.map((day) => {
                    // Every day is selectable — including one that sits outside
                    // the other end of the range. Marking those dimmed read as
                    // "disabled" while they still worked, and disabling them
                    // outright left whole months unreachable. The range panel
                    // owns validity: it shows the error and holds back «اعمال».
                    const isSelected =
                      selected?.year === view.year &&
                      selected?.month === view.month &&
                      selected.day === day;
                    const isToday =
                      view.year === today.year && view.month === today.month && day === today.day;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={
                          [
                            'jdp-day-cell',
                            isSelected && 'jdp-day-cell--selected',
                            !isSelected && isToday && 'jdp-day-cell--today',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                        aria-label={`${persian(day)} ${monthName(view.month)} ${persian(view.year)}`}
                        aria-pressed={isSelected}
                        onClick={() => chooseDay(day)}
                      >
                        {persian(day)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {panel === 'months' && (
              <div className="jdp-options-grid">
                {JALALI_MONTHS.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    className={
                      index === view.month
                        ? 'jdp-option-btn jdp-option-btn--selected'
                        : 'jdp-option-btn'
                    }
                    onClick={() => {
                      setCursor(fromJalali(view.year, index, 1));
                      setPanel('days');
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {panel === 'years' && (
              <div className="jdp-options-grid jdp-years-scroll">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={
                      year === view.year
                        ? 'jdp-option-btn jdp-option-btn--selected'
                        : 'jdp-option-btn'
                    }
                    onClick={() => {
                      setCursor(fromJalali(year, view.month, 1));
                      setPanel('months');
                    }}
                  >
                    {persian(year)}
                  </button>
                ))}
              </div>
            )}
          </>,
        )}
    </div>
  );
}
