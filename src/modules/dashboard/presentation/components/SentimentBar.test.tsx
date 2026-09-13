import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDashboardFilters, useDashboardFilterStore } from '../dashboardFilterStore';
import { SentimentBar } from './SentimentBar';

const items = [
  { value: 'positive', count: 6, share: 0.6 },
  { value: 'neutral', count: 3, share: 0.3 },
  { value: 'negative', count: 1, share: 0.1 },
];

beforeEach(() => resetDashboardFilters());

describe('SentimentBar', () => {
  it('renders the breakdown as five faces with counts', () => {
    render(<SentimentBar items={items} onSelect={() => undefined} />);

    for (const label of ['عصبانی', 'ناراضی', 'خنثی', 'راضی', 'کاملا راضی']) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}:`) }),
      ).toBeInTheDocument();
    }
  });

  it('forwards face clicks as sentimentLevel filter values', async () => {
    const onSelect = vi.fn();
    render(<SentimentBar items={items} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /^عصبانی:/ }));
    expect(onSelect).toHaveBeenCalledWith('angry');

    await userEvent.click(screen.getByRole('button', { name: /^کاملا راضی:/ }));
    expect(onSelect).toHaveBeenCalledWith('verySatisfied');

    await userEvent.click(screen.getByRole('button', { name: /^خنثی:/ }));
    expect(onSelect).toHaveBeenCalledWith('neutral');
  });

  it('dims the faces that do not match the active filter', () => {
    render(<SentimentBar items={items} selected="satisfied" onSelect={() => undefined} />);

    expect(screen.getByRole('button', { name: /^راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^عصبانی:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('switches the glow when clicking a different face and calls onSelect', async () => {
    const toggle = useDashboardFilterStore.getState().toggle;
    const Harness = () => {
      const selected = useDashboardFilterStore((state) => state.filters.sentimentLevel);
      return (
        <SentimentBar items={items} selected={selected} onSelect={(v) => toggle('sentimentLevel', v)} />
      );
    };
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: /^راضی:/ }));
    expect(screen.getByRole('button', { name: /^راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: /^کاملا راضی:/ }));
    expect(screen.getByRole('button', { name: /^کاملا راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
