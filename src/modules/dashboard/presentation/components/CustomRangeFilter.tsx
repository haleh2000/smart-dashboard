import { RangeFilterControl } from '@/shared/ui';
import { useDashboardFilterStore } from '../dashboardFilterStore';

const lastWeek = () => {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from, to: new Date() };
};

/** The dashboard time switch: the period presets live in the page, the custom range here. */
export function CustomRangeFilter() {
  const customRange = useDashboardFilterStore((state) => state.customRange);
  const setCustomRange = useDashboardFilterStore((state) => state.setCustomRange);
  const clearCustomRange = useDashboardFilterStore((state) => state.clearCustomRange);

  return (
    <RangeFilterControl
      value={customRange}
      onChange={(range) => (range ? setCustomRange(range) : clearCustomRange())}
      defaultRange={lastWeek}
    />
  );
}