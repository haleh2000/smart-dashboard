import { useSyncExternalStore } from 'react';

/**
 * Color-theme controller: light / dark / follow-system, persisted across sessions and
 * applied to <html data-theme> which tokens.css keys off. Theme swaps run inside the
 * View Transitions API so the new palette sweeps in behind a hard 45° edge.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'smart-theme';
const CYCLE: readonly ThemePreference[] = ['system', 'light', 'dark'];
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const REVEAL_DURATION_MS = 700;
const REVEAL_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
/** Top-left → bottom-right wipe. The 200% legs overshoot any aspect ratio. */
const REVEAL_CLIP_PATH = ['polygon(0% 0%, 0% 0%, 0% 0%)', 'polygon(0% 0%, 200% 0%, 0% 200%)'];

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

let preference: ThemePreference = 'system';
let systemPrefersDark = false;
let revealIsRunning = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const resolve = (value: ThemePreference): ResolvedTheme =>
  value === 'system' ? (systemPrefersDark ? 'dark' : 'light') : value;

const applyPreference = (value: ThemePreference) => {
  if (value === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', value);
};

const readStoredPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return CYCLE.find((value) => value === stored) ?? 'system';
  } catch {
    return 'system';
  }
};

/** Call once before the first render so the page never flashes the wrong palette. */
export function initializeColorTheme() {
  const darkMedia = window.matchMedia(DARK_MEDIA_QUERY);
  systemPrefersDark = darkMedia.matches;
  preference = readStoredPreference();
  applyPreference(preference);
  darkMedia.addEventListener('change', (event) => {
    systemPrefersDark = event.matches;
    notify();
  });
}

function setPreference(next: ThemePreference) {
  const previousResolved = resolve(preference);
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // storage unavailable — the choice lasts for this session only
  }
  notify();

  const doc = document as ViewTransitionCapableDocument;
  const skipReveal =
    resolve(next) === previousResolved ||
    window.matchMedia(REDUCED_MOTION_QUERY).matches ||
    revealIsRunning ||
    typeof doc.startViewTransition !== 'function';
  if (skipReveal) {
    applyPreference(next);
    return;
  }

  revealIsRunning = true;
  const transition = doc.startViewTransition!(() => applyPreference(next));
  void transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: REVEAL_CLIP_PATH },
        {
          duration: REVEAL_DURATION_MS,
          easing: REVEAL_EASING,
          pseudoElement: '::view-transition-new(root)',
        },
      ),
    )
    .catch(() => {});
  void transition.finished.finally(() => {
    revealIsRunning = false;
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useColorTheme() {
  const current = useSyncExternalStore(subscribe, () => preference);
  const resolvedTheme = useSyncExternalStore(subscribe, () => resolve(preference));
  const cyclePreference = () => setPreference(CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]!);
  return { preference: current, resolvedTheme, cyclePreference };
}
