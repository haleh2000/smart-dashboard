import { sentimentScore, sentimentShift, talkShare, type TranscriptLine } from './insights';

const line = (
  speaker: TranscriptLine['speaker'],
  sentiment?: TranscriptLine['sentiment'],
  text = 'یک دو',
): TranscriptLine => ({ speaker, text, atSec: 0, sentiment });

describe('sentimentScore', () => {
  it('scores from -1 to 1', () => {
    expect(sentimentScore(['positive', 'positive'])).toBe(1);
    expect(sentimentScore(['positive', 'negative', 'neutral', 'neutral'])).toBe(0);
    expect(sentimentScore(['negative'])).toBe(-1);
    expect(sentimentScore([])).toBe(0);
  });
});

describe('sentimentShift', () => {
  it("compares one side's first and last scored utterance", () => {
    const lines = [
      line('customer', 'negative'),
      line('agent', 'positive'),
      line('customer'),
      line('customer', 'neutral'),
    ];
    expect(sentimentShift(lines, 'customer')).toBe('improved');
    expect(sentimentShift([line('agent', 'positive'), line('agent', 'neutral')], 'agent')).toBe(
      'worsened',
    );
  });

  it('is undefined with fewer than two scored utterances', () => {
    expect(sentimentShift([line('customer', 'negative')])).toBeUndefined();
  });
});

describe('talkShare', () => {
  it("splits the words between the two sides", () => {
    const share = talkShare([line('agent', undefined, 'a b c'), line('customer', undefined, 'd')]);
    expect(share.agent).toBeCloseTo(0.75);
    expect(share.customer).toBeCloseTo(0.25);
  });
});
