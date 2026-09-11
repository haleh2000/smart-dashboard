import { isWithinRange, periodRange } from './period';

describe('periodRange', () => {
  const now = new Date(2026, 8, 11, 15, 30);

  it('returns whole-day bounds that include today', () => {
    const range = periodRange('7d', now)!;

    expect(range.to).toEqual(new Date(2026, 8, 12));
    expect(range.from).toEqual(new Date(2026, 8, 5));
    expect(isWithinRange(now, range)).toBe(true);
    expect(isWithinRange(new Date(2026, 8, 4, 23, 59), range)).toBe(false);
  });

  it('is stable during the day so query keys do not churn', () => {
    expect(periodRange('30d', new Date(2026, 8, 11, 1))).toEqual(
      periodRange('30d', new Date(2026, 8, 11, 23)),
    );
  });

  it('has no range for "all"', () => {
    expect(periodRange('all', now)).toBeUndefined();
    expect(isWithinRange(new Date(2000, 0, 1), undefined)).toBe(true);
  });
});
