import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  /** Footer buttons. */
  actions?: ReactNode;
  /** `aside` floats in the corner without a scrim (e.g. the incoming-call popup). */
  variant?: 'modal' | 'aside';
  children: ReactNode;
}

/** Accessible dialog: Escape closes, focus moves inside on open and returns on close. */
export function Dialog({
  open,
  title,
  onClose,
  actions,
  variant = 'modal',
  children,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'input, select, textarea, button:not(.dialog__close), [href]',
    );
    (focusable ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const panel = (
    <div
      ref={panelRef}
      className={cn('dialog', `dialog--${variant}`)}
      role="dialog"
      aria-modal={variant === 'modal'}
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <header className="dialog__header">
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        <button type="button" className="dialog__close" aria-label="بستن" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="dialog__body">{children}</div>
      {actions && <footer className="dialog__actions">{actions}</footer>}
    </div>
  );

  return createPortal(
    variant === 'modal' ? (
      <div className="dialog-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        {panel}
      </div>
    ) : (
      panel
    ),
    document.body,
  );
}
