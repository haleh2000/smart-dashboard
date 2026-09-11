import type { ReactNode } from 'react';
import './ErrorState.css';

interface ErrorStateProps {
  message: ReactNode;
  onRetry?: () => void;
}

/** The calm inline error: friendly message and an optional retry — never a dead white screen. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8v5M12 16.5v.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M10.3 4.6 3.6 16a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="error-state__content">
        <p className="error-state__message">{message}</p>
        {onRetry && (
          <button className="error-state__retry" type="button" onClick={onRetry}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12a8 8 0 1 0 2.3-5.6M6 3v4h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            تلاش دوباره
          </button>
        )}
      </div>
    </div>
  );
}
