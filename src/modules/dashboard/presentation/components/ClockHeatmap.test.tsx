import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { heatmapPeaks } from '../../domain/heatmap';
import { ClockHeatmap } from './ClockHeatmap';

const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(1));
counts[3]![11] = 12; // سه‌شنبه 11:00
const data = { counts, max: 12 };

describe('ClockHeatmap', () => {
  it('draws one sector per weekday × hour and reads out the weekly peak', () => {
    render(<ClockHeatmap data={data} peaks={heatmapPeaks(data)} onSelect={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(7 * 24);
    expect(screen.getByText('پیک هفته')).toBeInTheDocument();
    expect(screen.getAllByText('سه‌شنبه ۱۱:۰۰').length).toBeGreaterThan(0);
    expect(screen.getByRole('tooltip')).toHaveTextContent('سه‌شنبه ۱۱:۰۰');
  });

  it('filters by the clicked weekday and hour', async () => {
    const onSelect = vi.fn();
    render(<ClockHeatmap data={data} peaks={heatmapPeaks(data)} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'سه‌شنبه ساعت ۱۱:۰۰: ۱۲ تماس' }));

    expect(onSelect).toHaveBeenCalledWith('3', '11');
  });
});
