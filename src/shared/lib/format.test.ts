import { formatDateTime, formatPercent, formatPersianNumber, toLatinDigits } from './format';

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
