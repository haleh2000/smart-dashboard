import { cn } from '@/shared/lib/cn';
import { useColorTheme, type ThemePreference } from '@/shared/theme/colorTheme';
import './ThemeToggle.css';

const labels: Record<ThemePreference, string> = {
  system: 'پیروی از سیستم',
  light: 'روشن',
  dark: 'تیره',
};

/** Cycles the color theme (system → light → dark). */
export function ThemeToggle() {
  const { preference, resolvedTheme, cyclePreference } = useColorTheme();
  const iconClass = (value: ThemePreference) =>
    cn('theme-toggle__icon', preference === value && 'theme-toggle__icon--visible');

  return (
    <button
      className="theme-toggle"
      type="button"
      title="تغییر پوسته"
      aria-label={`تغییر پوسته — ${labels[preference]}`}
      aria-pressed={resolvedTheme === 'dark'}
      onClick={cyclePreference}
    >
      <span className="theme-toggle__stack">
        <svg className={iconClass('system')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <svg className={iconClass('light')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <svg className={iconClass('dark')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
