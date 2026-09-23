import { describe, expect, it } from 'vitest';
import { kpiHourDeltas, relativeChange, type KpiFigures } from './analytics';

const figures = (overrides: Partial<KpiFigures> = {}): KpiFigures => ({
  total: 100,
  open: 40,
  inReview: 20,
  closed: 60,
  resolutionRate: 0.6,
  overdue: 5,
  fcrRate: 0.7,
  repeatCallRate: 0.2,
  avgResolutionSec: 3600,
  ...overrides,
});

describe('relativeChange', () => {
  it('grows and shrinks as a ratio of the previous value', () => {
    expect(relativeChange(110, 100)).toBeCloseTo(0.1);
    expect(relativeChange(90, 100)).toBeCloseTo(-0.1);
    expect(relativeChange(60, 60)).toBe(0);
  });

  it('stays undefined when rising from zero, zero when both are zero', () => {
    expect(relativeChange(5, 0)).toBeUndefined();
    expect(relativeChange(0, 0)).toBe(0);
  });
});

describe('kpiHourDeltas', () => {
  it('computes one delta per KPI key', () => {
    const deltas = kpiHourDeltas(figures({ total: 105 }), figures());

    expect(Object.keys(deltas).sort()).toEqual(Object.keys(figures()).sort());
    expect(deltas.total).toBeCloseTo(0.05);
    expect(deltas.open).toBe(0);
  });

  it('leaves a key undefined when its previous value was 0 and now is not', () => {
    const deltas = kpiHourDeltas(figures({ overdue: 3 }), figures({ overdue: 0 }));

    expect(deltas.overdue).toBeUndefined();
  });
});
