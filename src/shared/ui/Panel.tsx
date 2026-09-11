import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './Panel.css';

interface PanelProps {
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Flat bordered surface used by dashboard sections. */
export function Panel({ title, className, children }: PanelProps) {
  return (
    <section className={cn('panel', className)}>
      {title && <h3 className="panel__title">{title}</h3>}
      {children}
    </section>
  );
}
