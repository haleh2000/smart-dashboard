import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDashboardFilters, useDashboardFilterStore } from '../dashboardFilterStore';
import { CustomerSentimentFaces } from './SentimentFaces';

const split = { positive: 40, neutral: 30, negative: 30, score: 0.1 };

beforeEach(() => resetDashboardFilters());

describe('CustomerSentimentFaces', () => {
  it('renders five illustrated faces with counts and shares', () => {
    render(
      <CustomerSentimentFaces split={split} analyzed={100} onSelect={() => undefined} />,
    );

    for (const label of ['عصبانی', 'ناراضی', 'خنثی', 'راضی', 'کاملا راضی']) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}:`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText('حال غالب مشتریان:')).toBeInTheDocument();
    // No emojis anywhere — faces are hand-drawn SVG.
    expect(document.querySelector('.sentiment-faces')?.textContent).not.toMatch(
      /[\u{1F600}-\u{1F64F}\u{1F620}]/u,
    );
  });

  it('toggles the dashboard sentimentLevel filter through the positive faces', async () => {
    render(
      <CustomerSentimentFaces split={split} analyzed={100} onSelect={(value) => useDashboardFilterStore.getState().toggle('sentimentLevel', value)} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^کاملا راضی:/ }));
    expect(useDashboardFilterStore.getState().filters.sentimentLevel).toBe('verySatisfied');

    await userEvent.click(screen.getByRole('button', { name: /^عصبانی:/ }));
    expect(useDashboardFilterStore.getState().filters.sentimentLevel).toBe('angry');
  });

    it('marks the active filter face as pressed', () => {

    render(
      <CustomerSentimentFaces
        split={split}
        analyzed={100}
        selected="neutral"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: /^خنثی:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^کاملا راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('lights up only the clicked face, never its neighbour in the same group', async () => {
    const toggle = useDashboardFilterStore.getState().toggle;
    const Harness = () => {
      const selected = useDashboardFilterStore((state) => state.filters.sentimentLevel);
      return (
        <CustomerSentimentFaces
          split={split}
          analyzed={100}
          selected={selected}
          onSelect={(value) => toggle('sentimentLevel', value)}
        />
      );
    };
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: /^راضی:/ }));
    expect(screen.getByRole('button', { name: /^راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^کاملا راضی:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(screen.getByRole('button', { name: /^کاملا راضی:/ }));
    expect(useDashboardFilterStore.getState().filters.sentimentLevel).toBe('verySatisfied');
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
