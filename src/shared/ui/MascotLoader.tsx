import './MascotLoader.css';

/** Full-screen loading moment (session bootstrap): the floating «دی‌دی». */
export function MascotLoader() {
  return (
    <div className="mascot-loader" role="status" aria-label="در حال بارگذاری">
      <img className="mascot-loader__didi" src="/brand/didi.png" alt="" aria-hidden="true" />
    </div>
  );
}
