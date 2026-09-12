import type { ReactNode } from 'react';
import './StatCard.css';

interface StatCardProps {
  label: ReactNode;
  /** Already formatted (Persian digits). */
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
}

/** One headline figure. Dumb by construction: it never computes anything itself. */
export function StatCard({ label, value, hint, tone = 'neutral', icon }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      {icon && <span className="stat-card__icon" aria-hidden="true">{icon}</span>}
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {hint && <span className="stat-card__hint">{hint}</span>}
      </div>
    </div>
  );
}
