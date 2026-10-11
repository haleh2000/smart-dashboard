import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import './StatCard.css';

interface StatCardProps {
  label: ReactNode;
  subtitle?: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
}

export function StatCard({
  label,
  subtitle,
  value,
  hint,
  tone = 'neutral',
  icon,
  onClick,
  selected,
  dimmed,
}: StatCardProps) {
  const className = cn(
    'stat-card',
    `stat-card--${tone}`,
    selected && 'stat-card--selected',
    dimmed && 'stat-card--dimmed',
  );
  const content = (
    <>
      {icon && (
        <span className="stat-card__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
        {hint && <span className="stat-card__hint">{hint}</span>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}
