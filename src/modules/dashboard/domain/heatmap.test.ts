import { heatmapPeaks } from './heatmap';

const empty = () => Array.from({ length: 7 }, () => Array<number>(24).fill(0));

describe('heatmapPeaks', () => {
  it('finds the busiest slot, day and hour and ranks the top slots', () => {
    const counts = empty();
    counts[2]![10] = 9; // Monday 10:00
    counts[2]![16] = 4;
    counts[0]![10] = 5; // Saturday 10:00
    counts[6]![20] = 1;

    const peaks = heatmapPeaks({ counts, max: 9 }, 3);

    expect(peaks.total).toBe(19);
    expect(peaks.peak).toEqual({ weekday: 2, hour: 10, count: 9 });
    expect(peaks.busiestDay).toEqual({ weekday: 2, count: 13 });
    expect(peaks.busiestHour).toEqual({ hour: 10, count: 14 });
    expect(peaks.quietestHour).toEqual({ hour: 20, count: 1 });
    expect(peaks.topSlots.map((s) => s.count)).toEqual([9, 5, 4]);
    expect(peaks.hourTotals).toHaveLength(24);
  });

  it('handles an empty week', () => {
    const peaks = heatmapPeaks({ counts: empty(), max: 0 });

    expect(peaks.total).toBe(0);
    expect(peaks.topSlots).toEqual([]);
    expect(peaks.quietestHour).toBeUndefined();
  });
});
