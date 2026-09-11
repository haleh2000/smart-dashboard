import { useSearchParams } from 'react-router';
import { ErrorState, PageHeader, SkeletonTable, Tabs } from '@/shared/ui';
import { GeneralSettingsForm } from '../components/GeneralSettingsForm';
import { IntegrationsPanel } from '../components/IntegrationsPanel';
import { ScenariosPanel } from '../components/ScenariosPanel';
import { useSystemSettings } from '../hooks/adminQueries';

const TABS = [
  { id: 'general', label: 'عمومی' },
  { id: 'integrations', label: 'یکپارچه‌سازی‌ها' },
  { id: 'scenarios', label: 'سناریوها و قوانین' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function GeneralTab() {
  const { data, isPending, isError, refetch } = useSystemSettings();
  if (isPending) return <SkeletonTable rows={6} />;
  if (isError)
    return <ErrorState message="دریافت تنظیمات با خطا مواجه شد." onRetry={() => refetch()} />;
  return <GeneralSettingsForm initial={data} />;
}

/** «تنظیمات»: general settings, integrations and scenarios (Admin only). */
export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const active: TabId = TABS.find((tab) => tab.id === requested)?.id ?? 'general';

  return (
    <section>
      <PageHeader title="تنظیمات" subtitle="تنظیمات سیستم، Integrationها و سناریوها" />
      <Tabs
        label="بخش‌های تنظیمات"
        tabs={TABS}
        active={active}
        onChange={(tab) => setParams(tab === 'general' ? {} : { tab }, { replace: true })}
      >
        {active === 'general' ? (
          <GeneralTab />
        ) : active === 'integrations' ? (
          <IntegrationsPanel />
        ) : (
          <ScenariosPanel />
        )}
      </Tabs>
    </section>
  );
}
