import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { authPaths, roleLabels, useCan, useCurrentUser, useSignOut } from '@/modules/auth';
import { env } from '@/shared/config/env';
import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import { NavIcon, ThemeToggle } from '@/shared/ui';
import { activeNavPath, navigation } from '../navigation';
import { DevRoleSwitcher } from './DevRoleSwitcher';
import './AppShell.css';

/**
 * RTL-first Daydar-style shell. Desktop: the viewport is the brand teal field with a
 * fixed navigation rail on the RIGHT and the page floating inside a rounded light panel.
 * ≤1024px: the rail disappears and navigation drops to a glass bottom bar (thumb reach).
 */
export function AppShell() {
  const user = useCurrentUser();
  const can = useCan();
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const items = navigation.filter((item) => can(item.permission));
  const activePath = activeNavPath(items, location.pathname);

  const handleSignOut = () =>
    signOut.mutate(undefined, { onSuccess: () => navigate(authPaths.login, { replace: true }) });

  return (
    <div className="app-shell">
      <aside className="side-nav" aria-label="منوی اصلی">
        <div className="side-nav__profile">
          <span className="side-nav__name">{user.fullName}</span>
          <span className="side-nav__meta">موبایل: {formatPersianNumber(user.mobile)}</span>
          <span className="side-nav__role">{roleLabels[user.role]}</span>
        </div>

        <nav className="side-nav__menu">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn('side-nav__item', item.path === activePath && 'side-nav__item--active')}
              aria-current={item.path === activePath ? 'page' : undefined}
            >
              <span className="side-nav__item-icon">
                <NavIcon name={item.icon} />
              </span>
              <span className="side-nav__item-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="side-nav__mascot">
          <img className="side-nav__didi" src="/brand/didi.png" alt="دی‌دی" />
        </div>
      </aside>

      <div className="app-frame">
        <header className="app-header">
          <Link className="app-brand" to="/">
            <span className="app-brand__lockup">
              <img className="app-brand__didi" src="/brand/didi.png" alt="" aria-hidden="true" />
              <img
                className="app-brand__logo"
                src="/brand/daydar-logo.png"
                alt="دی‌دار — بیمه دی"
              />
            </span>
            <span className="app-brand__divider" aria-hidden="true" />
            <span className="app-brand__text">
              <span className="app-brand__title">SMART</span>
              <span className="app-brand__subtitle">داشبورد پشتیبانی هوشمند — بیمه دی</span>
            </span>
          </Link>

          <div className="app-header__actions">
            {env.isDev && <DevRoleSwitcher />}
            <ThemeToggle />
            <button
              className="app-header__logout"
              type="button"
              title="خروج"
              aria-label="خروج"
              disabled={signOut.isPending}
              onClick={handleSignOut}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="منوی اصلی">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'bottom-nav__item',
              item.path === activePath && 'bottom-nav__item--active',
            )}
          >
            <span className="bottom-nav__icon">
              <NavIcon name={item.icon} />
            </span>
            <span className="bottom-nav__label">{item.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
