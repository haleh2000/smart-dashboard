import { parseKeywords, validateSettings, type SystemSettings } from './settings';

const settings: SystemSettings = {
  slaDays: 7,
  defaultPageSize: 20,
  negativeSentimentAlert: 0.3,
  repeatCallThreshold: 3,
  incomingCallPopup: true,
  autoTagging: true,
  transcription: true,
  voiceRetentionDays: 365,
};

describe('validateSettings', () => {
  it('accepts values inside their ranges', () => {
    expect(validateSettings(settings)).toEqual({});
  });

  it('flags values outside their ranges', () => {
    expect(validateSettings({ ...settings, slaDays: 0, defaultPageSize: Number.NaN })).toEqual({
      slaDays: 'outOfRange',
      defaultPageSize: 'outOfRange',
    });
  });
});

describe('parseKeywords', () => {
  it('splits on Latin and Persian commas, trims and dedupes', () => {
    expect(parseKeywords('خسارت، تاخیر , پرداخت,خسارت,')).toEqual(['خسارت', 'تاخیر', 'پرداخت']);
  });
});
