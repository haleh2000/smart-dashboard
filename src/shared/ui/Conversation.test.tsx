import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TranscriptLine } from '@/shared/domain/insights';
import { Transcript } from './Conversation';

const lines: TranscriptLine[] = [
  { speaker: 'agent', atSec: 0, text: 'سلام، بیمه دی', sentiment: 'positive' },
  { speaker: 'customer', atSec: 5, text: 'پرداخت خسارت تاخیر دارد', sentiment: 'negative' },
  { speaker: 'agent', atSec: 12, text: 'پرداخت را پیگیری می‌کنم' },
];

describe('Transcript', () => {
  it('highlights search matches and filters by speaker', async () => {
    const { container } = render(<Transcript lines={lines} />);
    expect(screen.getByText('منفی')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('جستجو در متن مکالمه'), 'پرداخت');
    expect(container.querySelectorAll('mark')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('۲ از ۳ جمله');

    await userEvent.click(screen.getByRole('radio', { name: 'مشتری' }));
    expect(screen.getByRole('status')).toHaveTextContent('۱ از ۳ جمله');
    expect(screen.queryByText(/پیگیری/)).not.toBeInTheDocument();
  });
});
