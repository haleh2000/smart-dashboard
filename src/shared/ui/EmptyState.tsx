import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  message: ReactNode;
  /** Shows the floating «دی‌دی» instead of the tray glyph. */
  mascot?: boolean;
  children?: ReactNode;
}

/** Designed empty state — an intentional screen, not a blank area. */
export function EmptyState({ message, mascot = false, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {mascot ? (
        <img className="empty-state__mascot" src="/brand/didi.png" alt="" aria-hidden="true" />
      ) : (
        <span className="empty-state__glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M4 13c0-1.1.9-2 2-2h2.4a2 2 0 0 0 1.8-1.1l.7-1.4A2 2 0 0 1 12.7 7h-1.4a2 2 0 0 1 1.8 1.5l.7 1.4a2 2 0 0 0 1.8 1.1H18a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M9 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <p className="empty-state__message">{message}</p>
      {children}
    </div>
  );
}
