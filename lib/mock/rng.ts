// Mulberry32, small, fast, deterministic 32-bit PRNG.
// Same seed = same numbers, every run. Foundation of the demo's reproducibility.

export type Rng = {
  next: () => number;
  int: (min: number, max: number) => number;
  float: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  weighted: <T>(entries: readonly [T, number][]) => T;
  bool: (probability?: number) => boolean;
  gaussian: (mean: number, stdDev: number) => number;
  uuid: () => string;
};

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;

  const float = (min: number, max: number) => next() * (max - min) + min;

  const pick = <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)];

  const weighted = <T>(entries: readonly [T, number][]): T => {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = next() * total;
    for (const [value, w] of entries) {
      r -= w;
      if (r <= 0) return value;
    }
    return entries[entries.length - 1][0];
  };

  const bool = (probability = 0.5) => next() < probability;

  // Box–Muller transform.
  const gaussian = (mean: number, stdDev: number) => {
    const u = 1 - next();
    const v = next();
    return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const uuid = () => {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    let s = "";
    for (let i = 0; i < 16; i++) s += hex(int(0, 255));
    return s;
  };

  return { next, int, float, pick, weighted, bool, gaussian, uuid };
}
