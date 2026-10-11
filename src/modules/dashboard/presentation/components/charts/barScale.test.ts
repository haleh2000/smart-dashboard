import { resolveBarScale } from './barScale';

describe('resolveBarScale', () => {
  it('paints breakdown bars from share on a 0..1 domain, so the fill matches the printed percent', () => {
    expect(resolveBarScale('share')).toEqual({ dataKey: 'share', domain: [0, 1] });
  });

  it('paints normalized rates (e.g. FCR) on a fixed 0..1 domain', () => {
    expect(resolveBarScale('unit')).toEqual({ dataKey: 'value', domain: [0, 1] });
  });

  it('keeps absolute rankings (durations) relative to the largest value', () => {
    expect(resolveBarScale('max')).toEqual({ dataKey: 'value', domain: [0, 'dataMax'] });
  });
});
