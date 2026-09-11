import './NavIcon.css';

export type NavIconName =
  'dashboard' | 'tickets' | 'calls' | 'customers' | 'users' | 'roles' | 'settings';

const common = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Central inline-SVG icon set for navigation (side rail + bottom bar); inherits currentColor. */
export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'dashboard' && (
        <>
          <rect x="4" y="4" width="7" height="8" rx="1.5" {...common} />
          <rect x="13" y="4" width="7" height="5" rx="1.5" {...common} />
          <rect x="4" y="14" width="7" height="6" rx="1.5" {...common} />
          <rect x="13" y="11" width="7" height="9" rx="1.5" {...common} />
        </>
      )}
      {name === 'tickets' && (
        <>
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" {...common} />
          <path d="M13 3v6h6M9 13h6M9 17h4" {...common} />
        </>
      )}
      {name === 'calls' && (
        <path
          d="M5 4h3.2l1.6 4-2 1.3a10 10 0 0 0 4.9 4.9l1.3-2 4 1.6V17a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z"
          {...common}
        />
      )}
      {name === 'customers' && (
        <>
          <circle cx="9" cy="8" r="3.5" {...common} />
          <path
            d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.6.8 2.7 2.6 3 5.2"
            {...common}
          />
        </>
      )}
      {name === 'users' && (
        <>
          <circle cx="12" cy="8" r="4" {...common} />
          <path d="M4.5 20.5c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5" {...common} />
        </>
      )}
      {name === 'roles' && (
        <>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" {...common} />
          <path d="M9 12l2 2 4-4" {...common} />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle cx="12" cy="12" r="3" {...common} />
          <path
            d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.6a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
            {...common}
          />
        </>
      )}
    </svg>
  );
}
