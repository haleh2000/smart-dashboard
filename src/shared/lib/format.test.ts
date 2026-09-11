import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDuration,
  formatElapsed,
  formatPercent,
  formatPersianNumber,
  toLatinDigits,
} from './format';

describe('durations and amounts', () => {
  it('formats call durations as clock time', () => {
    expect(formatDuration(205)).toBe('۰۳:۲۵');
    expect(formatDuration(3805)).toBe('۱:۰۳:۲۵');
  });

  it('picks a readable unit for elapsed time', () => {
    expect(formatElapsed(40)).toBe('۴۰ ثانیه');
    expect(formatElapsed(720)).toBe('۱۲ دقیقه');
    expect(formatElapsed(3 * 3600 + 1800)).toBe('۳٫۵ ساعت');
  });

  it('groups large amounts with the Persian separator', () => {
    expect(formatAmount(12_500_000)).toBe('۱۲٬۵۰۰٬۰۰۰');
  });

  it('formats a Jalali date without time', () => {
    expect(formatDate(new Date(2026, 8, 1, 9, 5))).toBe('۱۴۰۵/۰۶/۱۰');
  });
});

describe('format', () => {
  it('localizes every digit without grouping', () => {
    expect(formatPersianNumber('09121234567')).toBe('۰۹۱۲۱۲۳۴۵۶۷');
    expect(formatPersianNumber(480)).toBe('۴۸۰');
  });

  it('formats ratios as Persian percentages', () => {
    expect(formatPercent(0.452)).toBe('۴۵٫۲٪');
  });

  it('renders Jalali date and time in a fixed order', () => {
    expect(formatDateTime(new Date(2026, 8, 1, 9, 5))).toBe('۱۴۰۵/۰۶/۱۰ ۰۹:۰۵');
  });
});

describe('toLatinDigits', () => {
  it('normalizes Persian and Arabic-Indic digits', () => {
    expect(toLatinDigits('۰۹۱۲٣٤')).toBe('091234');
  });
});
