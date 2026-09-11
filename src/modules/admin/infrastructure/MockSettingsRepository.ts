import { delay } from '@/mocks/delay';
import { scenarioNames } from '@/mocks/reference';
import type { SettingsRepository } from '../domain/AdminRepositories';
import type {
  Integration,
  IntegrationId,
  Scenario,
  ScenarioInput,
  SystemSettings,
} from '../domain/settings';

const MINUTE = 60 * 1000;

const defaultSettings: SystemSettings = {
  slaDays: 7,
  defaultPageSize: 20,
  negativeSentimentAlert: 0.3,
  repeatCallThreshold: 3,
  incomingCallPopup: true,
  autoTagging: true,
  transcription: true,
  voiceRetentionDays: 365,
};

const seedIntegrations = (now: number): Integration[] => [
  {
    id: 'crm',
    status: 'connected',
    endpoint: 'https://crm.dayins.local/api',
    lastSyncAt: new Date(now - 2 * MINUTE),
    latencyMs: 120,
    enabled: true,
  },
  {
    id: 'coreInsurance',
    status: 'connected',
    endpoint: 'https://core.dayins.local/api/v2',
    lastSyncAt: new Date(now - 6 * MINUTE),
    latencyMs: 240,
    enabled: true,
  },
  {
    id: 'callCenter',
    status: 'connected',
    endpoint: 'https://sitak.dayins.local/cti',
    lastSyncAt: new Date(now - 1 * MINUTE),
    latencyMs: 85,
    enabled: true,
  },
  {
    id: 'voices',
    status: 'degraded',
    endpoint: 'https://voices.dayins.local/recordings',
    lastSyncAt: new Date(now - 45 * MINUTE),
    latencyMs: 1350,
    enabled: true,
  },
  {
    id: 'ai',
    status: 'connected',
    endpoint: 'https://ai.dayins.local/v1',
    lastSyncAt: new Date(now - 4 * MINUTE),
    latencyMs: 410,
    enabled: true,
  },
];

const scenarioDetails: Omit<Scenario, 'id' | 'name'>[] = [
  {
    description:
      'پرونده خسارتی که بیش از SLA معطل مانده، با اولویت بالا به کارشناس خسارت ارجاع شود.',
    triggerSubject: 'پس از صدور',
    keywords: ['خسارت', 'تاخیر', 'پرداخت'],
    active: true,
    suggestionCount: 412,
  },
  {
    description: 'درخواست ارزیابی مجدد خودرو به نزدیک‌ترین ارزیاب شعبه ارسال شود.',
    triggerSubject: 'پس از صدور',
    keywords: ['ارزیاب', 'ارزیابی', 'عودت'],
    active: true,
    suggestionCount: 188,
  },
  {
    description: 'برای مکالمات با احساس منفی، ابتدا دلجویی و سپس ارجاع به سرپرست انجام شود.',
    keywords: ['شکایت', 'نارضایتی', 'عصبانیت'],
    active: true,
    suggestionCount: 264,
  },
  {
    description: 'فهرست مدارک لازم برای پرونده‌های درمان از طریق پیامک برای مشتری ارسال شود.',
    triggerSubject: 'اطلاع‌رسانی',
    keywords: ['مدارک', 'درمان', 'نسخه'],
    active: true,
    suggestionCount: 97,
  },
  {
    description: 'وضعیت صدور بیمه‌نامه از سامانه‌های بیمه‌ای استعلام و به مشتری اعلام شود.',
    triggerSubject: 'صدور',
    keywords: ['صدور', 'بیمه‌نامه', 'حواله'],
    active: false,
    suggestionCount: 41,
  },
];

/** In-memory adapter for settings, integrations and scenarios. */
export class MockSettingsRepository implements SettingsRepository {
  private settings: SystemSettings = { ...defaultSettings };
  private integrations: Integration[];
  private scenarios: Scenario[];
  private checks = 0;

  constructor(now: number = Date.now()) {
    this.integrations = seedIntegrations(now);
    this.scenarios = scenarioNames.map((name, index) => ({
      id: `sc-${index + 1}`,
      name,
      ...(scenarioDetails[index] ?? {
        description: '',
        keywords: [],
        active: true,
        suggestionCount: 0,
      }),
    }));
  }

  async getSettings() {
    await delay(150);
    return { ...this.settings };
  }

  async updateSettings(settings: SystemSettings) {
    await delay();
    this.settings = { ...settings };
    return { ...this.settings };
  }

  async getIntegrations() {
    await delay(150);
    return this.integrations.map((integration) => ({ ...integration }));
  }

  private replaceIntegration(id: IntegrationId, change: (current: Integration) => Integration) {
    const current = this.integrations.find((integration) => integration.id === id);
    if (!current) throw new Error(`Integration ${id} not found`);
    const next = change(current);
    this.integrations = this.integrations.map((integration) =>
      integration.id === id ? next : integration,
    );
    return { ...next };
  }

  async checkIntegration(id: IntegrationId) {
    await delay(600);
    this.checks += 1;
    // Deterministic "recovery": every other check of a degraded system succeeds.
    const recovers = this.checks % 2 === 1;
    return this.replaceIntegration(id, (current) => {
      if (!current.enabled) return { ...current, status: 'disconnected' };
      const status = current.status === 'connected' || recovers ? 'connected' : current.status;
      const base = status === 'connected' ? 90 : 1200;
      return {
        ...current,
        status,
        lastSyncAt: new Date(),
        latencyMs: base + ((this.checks * 37) % 160),
      };
    });
  }

  async setIntegrationEnabled(id: IntegrationId, enabled: boolean) {
    await delay(200);
    return this.replaceIntegration(id, (current) => ({
      ...current,
      enabled,
      status: enabled ? 'connected' : 'disconnected',
    }));
  }

  async getScenarios() {
    await delay(150);
    return this.scenarios.map((scenario) => ({ ...scenario }));
  }

  async createScenario(input: ScenarioInput) {
    await delay();
    const scenario: Scenario = {
      ...input,
      triggerSubject: input.triggerSubject || undefined,
      id: `sc-${this.scenarios.length + 1}`,
      active: true,
      suggestionCount: 0,
    };
    this.scenarios = [...this.scenarios, scenario];
    return { ...scenario };
  }

  async setScenarioActive(id: string, active: boolean) {
    await delay(150);
    const current = this.scenarios.find((scenario) => scenario.id === id);
    if (!current) throw new Error(`Scenario ${id} not found`);
    const next = { ...current, active };
    this.scenarios = this.scenarios.map((scenario) => (scenario.id === id ? next : scenario));
    return { ...next };
  }
}
