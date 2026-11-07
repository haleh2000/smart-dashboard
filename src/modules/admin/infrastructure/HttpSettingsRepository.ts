import type { HttpClient } from '@/shared/http';
import type { SettingsRepository } from '../domain/AdminRepositories';
import type {
  Integration,
  IntegrationId,
  Scenario,
  ScenarioInput,
  SystemSettings,
} from '../domain/settings';

type IntegrationDto = Omit<Integration, 'lastSyncAt'> & { lastSyncAt?: string };

const parseIntegration = (raw: IntegrationDto): Integration => ({
  ...raw,
  lastSyncAt: raw.lastSyncAt ? new Date(raw.lastSyncAt) : undefined,
});

/** Talks to VOC Panel Nest `/settings` endpoints (صفحه تنظیمات). */
export class HttpSettingsRepository implements SettingsRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  getSettings() {
    return this.#http.get<SystemSettings>('/settings');
  }

  updateSettings(settings: SystemSettings) {
    return this.#http.put<SystemSettings>('/settings', { body: settings });
  }

  async getIntegrations() {
    const rows = await this.#http.get<IntegrationDto[]>('/settings/integrations');
    return rows.map(parseIntegration);
  }

  async checkIntegration(id: IntegrationId) {
    const raw = await this.#http.post<IntegrationDto>(`/settings/integrations/${id}/check`);
    return parseIntegration(raw);
  }

  async setIntegrationEnabled(id: IntegrationId, enabled: boolean) {
    const raw = await this.#http.patch<IntegrationDto>(
      `/settings/integrations/${id}/enabled`,
      { body: { enabled } },
    );
    return parseIntegration(raw);
  }

  getScenarios() {
    return this.#http.get<Scenario[]>('/settings/scenarios');
  }

  createScenario(input: ScenarioInput) {
    return this.#http.post<Scenario>('/settings/scenarios', { body: input });
  }

  setScenarioActive(id: string, active: boolean) {
    return this.#http.patch<Scenario>(`/settings/scenarios/${id}/active`, {
      body: { active },
    });
  }
}
