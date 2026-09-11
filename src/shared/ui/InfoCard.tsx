import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './InfoCard.css';

/** A titled card of label/value rows, ported from the Day desk RequestSummaryCard. */
export function InfoCard({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  /** Small controls at the end of the title row. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="info-card">
      <header className="info-card__header">
        <h3 className="info-card__title">{title}</h3>
        {actions}
      </header>
      {children}
    </section>
  );
}

/** Wraps InfoRows in the description-list grid. */
export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="info-card__grid">{children}</dl>;
}

export function InfoRow({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn('info-card__row', wide && 'info-card__row--wide')}>
      <dt>{label}</dt>
      <dd>{children || <span className="info-card__muted">—</span>}</dd>
    </div>
  );
}
