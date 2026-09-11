const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/**
 * The single digit-localization utility: every user-facing number (ids, counts,
 * mobiles, national codes) renders through this — Latin digits never reach the UI.
 */
export const formatPersianNumber = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]!);

/** @param ratio a value between 0 and 1 → «۴۵٫۲٪» */
export const formatPercent = (ratio: number) =>
  `${formatPersianNumber((ratio * 100).toFixed(1)).replace('.', '٫')}٪`;

// Latin digits here so the parts can be re-assembled in a fixed order, then localized once.
const jalaliParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** «۱۴۰۵/۰۴/۱۱ ۱۰:۳۰» — Jalali date + hour:minute, used by tables and logs. */
export const formatDateTime = (date: Date) => {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    jalaliParts.formatToParts(date).find((p) => p.type === type)?.value ?? '';
  return formatPersianNumber(
    `${part('year')}/${part('month')}/${part('day')} ${part('hour')}:${part('minute')}`,
  );
};

/** Persian/Arabic-Indic digits typed by users → Latin digits, before validation or API calls. */
export const toLatinDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) % 16));
