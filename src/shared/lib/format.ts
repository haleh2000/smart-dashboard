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

/** Signed ratio for period deltas: «+۲٫۵٪» / «−۳٫۰٪»; 0 renders without a sign. */
export const formatSignedPercent = (ratio: number) =>
  `${ratio > 0 ? '+' : ratio < 0 ? '−' : ''}${formatPercent(Math.abs(ratio))}`;

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

/** «۱۴۰۵/۰۴/۱۱» — Jalali date only. */
export const formatDate = (date: Date) => formatDateTime(date).split(' ')[0]!;

const pad = (n: number) => String(n).padStart(2, '0');

/** Call length: «۰۳:۲۵», or «۱:۰۳:۲۵» past an hour. */
export const formatDuration = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return formatPersianNumber(h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`);
};

/** Human-sized elapsed time for SLA-like figures: «۴۵ ثانیه»، «۱۲ دقیقه»، «۳٫۵ ساعت»، «۲٫۱ روز». */
export const formatElapsed = (totalSeconds: number) => {
  const one = (value: number) => formatPersianNumber(value.toFixed(1)).replace('.', '٫');
  if (totalSeconds < 60) return `${formatPersianNumber(Math.round(totalSeconds))} ثانیه`;
  if (totalSeconds < 3600) return `${formatPersianNumber(Math.round(totalSeconds / 60))} دقیقه`;
  if (totalSeconds < 86_400) return `${one(totalSeconds / 3600)} ساعت`;
  return `${one(totalSeconds / 86_400)} روز`;
};

/** Money and other large amounts, grouped: «۱۲٬۵۰۰٬۰۰۰». */
export const formatAmount = (value: number) =>
  formatPersianNumber(Math.round(value).toLocaleString('en-US')).replace(/,/g, '٬');

/** «۱۲ کیلوبایت» / «۱٫۴ مگابایت». */
export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${formatPersianNumber(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`
    : `${formatPersianNumber((bytes / (1024 * 1024)).toFixed(1)).replace('.', '٫')} مگابایت`;

/** Persian/Arabic-Indic digits typed by users → Latin digits, before validation or API calls. */
export const toLatinDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) % 16));
