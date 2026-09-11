import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import './Tabs.css';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  /** Small counter after the label. */
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
  /** Rendered as the active tab's panel. */
  children: ReactNode;
}

/** Underlined tab strip + one panel. Arrow keys move between tabs (RTL aware). */
export function Tabs<T extends string>({ tabs, active, onChange, label, children }: TabsProps<T>) {
  const baseId = useId();
  const index = tabs.findIndex((tab) => tab.id === active);

  const onKeyDown = (event: KeyboardEvent) => {
    // In RTL the "next" tab sits to the left.
    const step = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (next) {
      onChange(next.id);
      document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
    }
  };

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab.id === active ? 0 : -1}
            className={cn('tabs__tab', tab.id === active && 'tabs__tab--active')}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tabs__count">{formatPersianNumber(tab.count)}</span>
            )}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="tabs__panel"
      >
        {children}
      </div>
    </div>
  );
}
