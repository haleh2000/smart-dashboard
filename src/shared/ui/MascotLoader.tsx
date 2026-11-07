import { Didi } from './Didi';
import './MascotLoader.css';

/** Full-screen loading moment (session bootstrap): the floating «دی‌دی». */
export function MascotLoader() {
  return (
    <div className="mascot-loader" role="status" aria-label="در حال بارگذاری">
      <Didi className="mascot-loader__didi" />
    </div>
  );
}
