import {
  isCategorized,
  isCompleteSubject,
  reportedSubject,
  subjectAgreement,
  type CallAnalysis,
} from './call';

const path = (level1: string, level2 = 'ب', level3 = 'ج') => ({ level1, level2, level3 });

describe('operator vs. AI subject detection', () => {
  it('grades the agreement level by level', () => {
    expect(subjectAgreement(path('الف'), path('الف'))).toBe('match');
    expect(subjectAgreement(path('الف', 'ب', 'د'), path('الف'))).toBe('partial');
    expect(subjectAgreement(path('الف'), path('ه'))).toBe('mismatch');
    expect(subjectAgreement(undefined, path('الف'))).toBe('pending');
  });

  it("reports the operator's subject, falling back to the AI's", () => {
    const ai = path('ه');
    const analysis: CallAnalysis = {
      sentiment: 'neutral',
      agentSentiment: 'positive',
      detectedSubject: ai,
      detectionConfidence: 0.9,
      priority: 'low',
      autoLabel: '',
      topic: '',
      tags: [],
      summary: '',
    };
    expect(reportedSubject({ subject: path('الف'), analysis })).toEqual(path('الف'));
    expect(reportedSubject({ analysis })).toEqual(ai);
    expect(reportedSubject({})).toBeUndefined();
  });
});

describe('call categorization', () => {
  it('requires all three levels', () => {
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب' })).toBe(false);
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب', level3: '' })).toBe(false);
    expect(isCompleteSubject({ level1: 'الف', level2: 'ب', level3: 'ج' })).toBe(true);
  });

  it('treats a call without a subject as uncategorized', () => {
    expect(isCategorized({})).toBe(false);
    expect(isCategorized({ subject: { level1: 'الف', level2: 'ب', level3: 'ج' } })).toBe(true);
  });
});
