import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { RepeatCallStats, ResolutionStep } from '../../domain/analytics';
import './ResolutionFunnel.css';

const stepLabels: Record<ResolutionStep, string> = {
  '1': 'تماس اول',
  '2': 'تماس دوم',
  '3': 'تماس سوم',
  '4+': 'تماس چهارم به بعد',
  open: 'هنوز حل‌نشده',
};

/**
 * «آیا مشکل در تماس اول حل شد؟ اگر نه، طی چند تماس؟» — a staircase of cumulative resolution:
 * the bar shows the share solved so far, the figures below the issues solved by that call.
 */
export function ResolutionFunnel({ resolution }: Pick<RepeatCallStats, 'resolution'>) {
  const total = resolution.reduce((sum, step) => sum + step.issues, 0);
  // Issues solved by each step, counting every earlier call too.
  const solvedBy = resolution.map((_, i) =>
    resolution
      .slice(0, i + 1)
      .filter((s) => s.step !== 'open')
      .reduce((sum, s) => sum + s.issues, 0),
  );

  return (
    <ol className="resolution-funnel" aria-label="مرحله حل مسئله مشتری">
      {resolution.map(({ step, issues }, index) => {
        const open = step === 'open';
        const cumulative = solvedBy[index] ?? 0;
        const share = total ? issues / total : 0;
        const fill = open ? share : total ? cumulative / total : 0;
        return (
          <li
            key={step}
            className={cn('resolution-funnel__step', open && 'resolution-funnel__step--open')}
            style={{ '--fill': `${Math.round(fill * 100)}%` } as CSSProperties}
          >
            <span className="resolution-funnel__label">
              {open ? stepLabels[step] : `حل در ${stepLabels[step]}`}
            </span>
            <div className="resolution-funnel__track" aria-hidden="true">
              <div className="resolution-funnel__fill">
                <span className="resolution-funnel__fill-value">{formatPercent(fill)}</span>
              </div>
            </div>
            <strong className="resolution-funnel__value">{formatPersianNumber(issues)}</strong>
            <span className="resolution-funnel__hint">{formatPercent(share)} از مسائل</span>
          </li>
        );
      })}
    </ol>
  );
}
