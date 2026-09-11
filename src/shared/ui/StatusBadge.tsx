import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './StatusBadge.css';

/** Colors come from the status-* tokens: info = teal, warning = amber, error = red, success = green. */
export type BadgeTone = 'info' | 'warning' | 'error' | 'success' | 'neutral';

interface StatusBadgeProps {
  tone: BadgeTone;
  /** Pulses the dot — the item is live in a queue. */
  pulse?: boolean;
  children: ReactNode;
}

export function StatusBadge({ tone, pulse = false, children }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', `status-badge--${tone}`)}>
      <span
        className={cn('status-badge__dot', pulse && 'status-badge__dot--pulse')}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
