import { INTEGRATION_IDS } from '../domain/settings';
import { MockSettingsRepository } from './MockSettingsRepository';

describe('MockSettingsRepository', () => {
  it('exposes every integration from the README', async () => {
    const integrations = await new MockSettingsRepository().getIntegrations();

    expect(integrations.map((i) => i.id)).toEqual([...INTEGRATION_IDS]);
  });

  it('refreshes an integration when it is checked', async () => {
    const repository = new MockSettingsRepository(0);
    const checked = await repository.checkIntegration('voices');

    expect(checked.status).toBe('connected');
    expect(checked.lastSyncAt!.getTime()).toBeGreaterThan(0);
  });

  it('persists settings and scenario changes', async () => {
    const repository = new MockSettingsRepository();
    const settings = await repository.getSettings();
    await repository.updateSettings({ ...settings, slaDays: 10 });
    const scenario = await repository.createScenario({
      name: 'تست',
      description: '',
      keywords: ['الف'],
    });
    await repository.setScenarioActive(scenario.id, false);

    expect((await repository.getSettings()).slaDays).toBe(10);
    expect((await repository.getScenarios()).find((s) => s.id === scenario.id)?.active).toBe(false);
  });
});
