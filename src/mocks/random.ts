/** Deterministic PRNG (mulberry32) so mock data is identical on every reload and in tests. */
export const createRandom = (seed: number) => {
  let state = seed;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  const digits = (length: number) => Array.from({ length }, () => Math.floor(next() * 10)).join('');
  return { next, pick, digits };
};
