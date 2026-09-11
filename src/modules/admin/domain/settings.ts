/** «تنظیمات و Integrationها» (Admin only). */

export const INTEGRATION_IDS = ['crm', 'coreInsurance', 'callCenter', 'voices', 'ai'] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export const INTEGRATION_STATUSES = ['connected', 'degraded', 'disconnected'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export interface Integration {
  id: IntegrationId;
  status: IntegrationStatus;
  endpoint: string;
  lastSyncAt?: Date;
  /** Average round-trip of the last health checks, in milliseconds. */
  latencyMs?: number;
  enabled: boolean;
}

export interface SystemSettings {
  /** Default SLA for new tickets, in working days. */
  slaDays: number;
  /** Rows per page in lists. */
  defaultPageSize: number;
  /** Alert supervisors when the share of negative conversations exceeds this (0..1). */
  negativeSentimentAlert: number;
  /** A customer calling more than this many times in 7 days counts as a repeat caller. */
  repeatCallThreshold: number;
  incomingCallPopup: boolean;
  autoTagging: boolean;
  transcription: boolean;
  /** How long recordings are kept, in days. */
  voiceRetentionDays: number;
}

export type SettingsField = keyof SystemSettings;
export type SettingsErrors = Partial<Record<SettingsField, 'outOfRange'>>;

const ranges: Partial<Record<SettingsField, [number, number]>> = {
  slaDays: [1, 60],
  defaultPageSize: [10, 200],
  negativeSentimentAlert: [0.05, 0.95],
  repeatCallThreshold: [2, 20],
  voiceRetentionDays: [30, 3650],
};

export const validateSettings = (settings: SystemSettings): SettingsErrors => {
  const errors: SettingsErrors = {};
  for (const [field, [min, max]] of Object.entries(ranges) as [SettingsField, [number, number]][]) {
    const value = settings[field] as number;
    if (!Number.isFinite(value) || value < min || value > max) errors[field] = 'outOfRange';
  }
  return errors;
};

export const settingsRange = (field: SettingsField) => ranges[field];

/** «Scenario و Ruleها»: a handling playbook the AI can suggest when its trigger matches. */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  /** Subject1 that triggers the scenario; undefined = any subject. */
  triggerSubject?: string;
  /** Words in the transcript that trigger the scenario. */
  keywords: string[];
  active: boolean;
  /** How often the AI suggested it in the last 30 days. */
  suggestionCount: number;
}

export interface ScenarioInput {
  name: string;
  description: string;
  triggerSubject?: string;
  keywords: string[];
}

/** «خسارت، تاخیر , پرداخت» → ['خسارت', 'تاخیر', 'پرداخت'] */
export const parseKeywords = (text: string) => [
  ...new Set(
    text
      .split(/[,،\n]/)
      .map((word) => word.trim())
      .filter(Boolean),
  ),
];
