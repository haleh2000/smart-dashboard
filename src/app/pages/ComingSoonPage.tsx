import { EmptyState, PageHeader } from '@/shared/ui';

/** Placeholder for sidebar sections that are specified in README but not implemented yet. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <section>
      <PageHeader title={title} />
      <EmptyState mascot message="این بخش به‌زودی راه‌اندازی می‌شود." />
    </section>
  );
}
