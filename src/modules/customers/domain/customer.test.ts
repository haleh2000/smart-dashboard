import { claimTotals, summarizeSentiment, type Claim } from './customer';

describe('summarizeSentiment', () => {
  it('counts each sentiment and scores the balance', () => {
    const at = new Date();
    const summary = summarizeSentiment([
      { at, sentiment: 'positive', source: 'call' },
      { at, sentiment: 'positive', source: 'ticket' },
      { at, sentiment: 'negative', source: 'call' },
      { at, sentiment: 'neutral', source: 'call' },
    ]);

    expect(summary).toEqual({ positive: 2, neutral: 1, negative: 1, score: 0.25 });
  });

  it('scores an empty history as neutral', () => {
    expect(summarizeSentiment([]).score).toBe(0);
  });
});

describe('claimTotals', () => {
  it('sums claimed and paid amounts', () => {
    const claim = (amount: number, paidAmount?: number): Claim => ({
      number: '1',
      policyNumber: 'p',
      line: 'ثالث',
      filedAt: new Date(),
      status: paidAmount ? 'paid' : 'filed',
      amount,
      paidAmount,
    });

    expect(claimTotals([claim(100, 80), claim(50)])).toEqual({ claimed: 150, paid: 80 });
  });
});
