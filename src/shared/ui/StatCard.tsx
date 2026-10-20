import { useId, useState, type ReactNode } from 'react';
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
  info?: {
    description: string;
    calculation?: string;
  };
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
  info,
}: StatCardProps) {
  const infoId = useId();

  const [infoOpen, setInfoOpen] = useState(false);


  const className = cn(
    'stat-card',
    `stat-card--${tone}`,
    selected && 'stat-card--selected',
    dimmed && 'stat-card--dimmed',
    info && 'stat-card--has-info',
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

  const card = onClick ? (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={selected}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );

  if (!info) return card;

  return (
    <div className="stat-card-wrapper">
      {card}

  <div
  className={cn(
    'stat-card-info',
    infoOpen && 'stat-card-info--open',
  )}
  onKeyDown={(event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setInfoOpen(false);
      event.currentTarget.querySelector('button')?.focus();
    }
  }}
  onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setInfoOpen(false);
    }
  }}
>
  <button
    type="button"
    className="stat-card-info__trigger"
    title="برای دیدن توضیح شاخص کلیک کنید"
    aria-label={`راهنمای ${typeof label === 'string' ? label : 'شاخص'}`}
    aria-expanded={infoOpen}
    aria-controls={infoId}
    onClick={(event) => {
      event.stopPropagation();
      setInfoOpen((previous) => !previous);
    }}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </svg>
  </button>

  <div
    id={infoId}
    className="stat-card-info__popover"
    dir="rtl"
    hidden={!infoOpen}
  >
    <strong className="stat-card-info__title">{label}</strong>

    <p className="stat-card-info__text">
      {info.description}
    </p>

    {info.calculation && (
      <div className="stat-card-info__calculation">
        <strong>نحوه محاسبه</strong>
        <p>{info.calculation}</p>
      </div>
    )}
  </div>
</div>

    </div>
  );
}
