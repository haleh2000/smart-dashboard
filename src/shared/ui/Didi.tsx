import './Didi.css';

type DidiProps = {
  className?: string;
  /** Accessible label; omit (or pass empty) for decorative use. */
  alt?: string;
};

/**
 * Floating «دی‌دی» with an eye-blink that rides along with the hover motion.
 * Eye lid positions are calibrated against `public/brand/didi.png`.
 */
export function Didi({ className, alt }: DidiProps) {
  const decorative = !alt;
  return (
    <span
      className={['didi', className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative ? true : undefined}
    >
      <img className="didi__img" src="/brand/didi.png" alt="" draggable={false} />
      <span className="didi__lids" aria-hidden="true">
        <span className="didi__lid didi__lid--l" />
        <span className="didi__lid didi__lid--r" />
      </span>
    </span>
  );
}
