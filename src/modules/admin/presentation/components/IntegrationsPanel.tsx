import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { Button, ErrorState, SkeletonTable, StatusBadge } from '@/shared/ui';
import { integrationMeta, integrationStatusMeta } from '../adminLabels';
import {
  useCheckIntegration,
  useIntegrations,
  useSetIntegrationEnabled,
} from '../hooks/adminQueries';
import './SettingsPanels.css';

/** «یکپارچه‌سازی‌ها»: health and on/off switch per external system. */
export function IntegrationsPanel() {
  const { data, isPending, isError, refetch } = useIntegrations();
  const check = useCheckIntegration();
  const setEnabled = useSetIntegrationEnabled();

  if (isPending) return <SkeletonTable rows={5} />;
  if (isError)
    return (
      <ErrorState
        message="دریافت وضعیت یکپارچه‌سازی‌ها با خطا مواجه شد."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="integrations">
      {data.map((integration) => {
        const meta = integrationMeta[integration.id];
        const status = integrationStatusMeta[integration.status];
        const checking = check.isPending && check.variables === integration.id;
        return (
          <article key={integration.id} className="integrations__card">
            <header className="integrations__header">
              <h3 className="integrations__name">{meta.name}</h3>
              <StatusBadge tone={status.tone} pulse={integration.status === 'degraded'}>
                {status.label}
              </StatusBadge>
            </header>
            <p className="integrations__description">{meta.description}</p>
            <dl className="integrations__facts">
              <div>
                <dt>آدرس</dt>
                <dd>
                  <bdi dir="ltr" className="integrations__endpoint">
                    {integration.endpoint}
                  </bdi>
                </dd>
              </div>
              <div>
                <dt>آخرین همگام‌سازی</dt>
                <dd>{integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : '—'}</dd>
              </div>
              <div>
                <dt>تاخیر پاسخ</dt>
                <dd>
                  {integration.latencyMs === undefined
                    ? '—'
                    : `${formatPersianNumber(integration.latencyMs)} میلی‌ثانیه`}
                </dd>
              </div>
            </dl>
            <footer className="integrations__footer">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={integration.enabled}
                  disabled={setEnabled.isPending}
                  onChange={(e) =>
                    setEnabled.mutate({ id: integration.id, enabled: e.target.checked })
                  }
                />
                فعال
              </label>
              <Button
                variant="ghost"
                className="btn--small"
                disabled={checking || !integration.enabled}
                onClick={() => check.mutate(integration.id)}
              >
                {checking ? 'در حال بررسی…' : 'بررسی اتصال'}
              </Button>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
