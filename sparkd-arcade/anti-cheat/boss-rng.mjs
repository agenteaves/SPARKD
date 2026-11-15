// Versioned, portable deterministic random stream for a future boss rules engine.
// NOT wired into the live arena; no score may be certified with this alone.
export const BOSS_RNG_VERSION = 'boss-rng-v1';
export function createBossRandom(seed, level) {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 0xffffffff) throw new RangeError('seed');
  if (!Number.isInteger(level) || level < 0 || level > 4) throw new RangeError('level');
  let state = (seed ^ Math.imul(level + 1, 0x9e3779b9)) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  const next = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const range = (low, high) => {
    if (!Number.isFinite(low) || !Number.isFinite(high) || low >= high) throw new RangeError('range');
    return low + next() * (high - low);
  };
  return Object.freeze({
    version: BOSS_RNG_VERSION,
    weaponPedestal() { return Object.freeze({ x: range(-6, 6), z: range(1, 6.5) }); },
    energyOrb() { return Object.freeze({ x: range(-6, 6), y: .65, z: range(1, 6.5) }); },
    snapshot() { return state >>> 0; }
  });
}
