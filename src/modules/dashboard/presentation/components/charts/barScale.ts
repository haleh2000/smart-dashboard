export type BarScale =
  /**
   * Breakdowns (count + share of the filtered total): the track is 100%, so the bar
   * length comes from `item.share` and always matches the printed percent — no matter
   * which row is the largest. The repository contract (`BreakdownItem.share`) is what
   * the future HTTP adapter must return; the chart needs no other change.
   */
  | 'share'
  /**
   * Rates already normalized to 0..1 (e.g. FCR): the track is 100% and the bar length
   * comes from `item.value` on a fixed 0..1 domain.
   */
  | 'unit'
  /**
   * Absolute rankings (durations, response minutes): no share exists, so bars stay
   * relative to the largest value.
   */
  | 'max';

/** Pure mapping: which field paints the bar and on which domain. */
export const resolveBarScale = (
  scale: BarScale,
): { dataKey: 'value' | 'share'; domain: [number, number] | [number, 'dataMax'] } =>
  scale === 'share'
    ? { dataKey: 'share', domain: [0, 1] }
    : scale === 'unit'
      ? { dataKey: 'value', domain: [0, 1] }
      : { dataKey: 'value', domain: [0, 'dataMax'] };
