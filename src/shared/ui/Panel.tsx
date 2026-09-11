import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './Panel.css';

interface PanelProps {
  title?: ReactNode;
  /** Small controls at the end of the title row (export, view switch). */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Flat bordered surface used by dashboard sections. */
export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <section className={cn('panel', className)}>
      {(title || actions) && (
        <header className="panel__header">
          {title && <h3 className="panel__title">{title}</h3>}
          {actions && <div className="panel__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
