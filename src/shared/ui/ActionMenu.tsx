import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';
import './ActionMenu.css';

export type ActionMenuItem =
  | { label: string; to: string; danger?: boolean }
  | { label: string; onSelect: () => void; danger?: boolean };

interface ActionMenuProps {
  /** Accessible name of the trigger, e.g. «بیشتر». */
  label: string;
  items: readonly ActionMenuItem[];
}

/** «منوی بیشتر (More)»: a ⋯ button opening a short list of row actions. */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) =>
      !rootRef.current?.contains(event.target as Node) && setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="19" cy="12" r="1.8" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <ul id={menuId} className="action-menu__list" role="menu">
          {items.map((item) => (
            <li key={item.label} role="none">
              {'to' in item ? (
                <Link
                  role="menuitem"
                  to={item.to}
                  className={cn('action-menu__item', item.danger && 'action-menu__item--danger')}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={cn('action-menu__item', item.danger && 'action-menu__item--danger')}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
