import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function createDevnetSponsorBudgetStore({ filePath, clock = () => new Date() }) {
  let state;
  let queue = Promise.resolve();

  const exclusive = async (action) => {
    let release;
    const previous = queue;
    queue = new Promise(resolve => { release = resolve; });
    await previous;
    try { return await action(); }
    finally { release(); }
  };

  const day = () => clock().toISOString().slice(0, 10);
  const emptyState = () => ({ version: 1, day: day(), spentLamports: 0, reservedLamports: 0, reservations: {} });
  const assertAmount = amount => {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Sponsor budget amount must be a non-negative safe integer.');
  };

  async function persist() {
    await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(tempPath, `${JSON.stringify(state)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      await rename(tempPath, filePath);
    } finally {
      await rm(tempPath, { force: true }).catch(() => {});
    }
  }

  async function initialize() {
    if (state) return;
    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8'));
      if (parsed.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.day) || !Number.isSafeInteger(parsed.spentLamports) || parsed.spentLamports < 0) {
        throw new Error('The Devnet sponsor budget file has an invalid format.');
      }
      state = parsed.day === day()
        ? { version: 1, day: parsed.day, spentLamports: parsed.spentLamports, reservedLamports: 0, reservations: {} }
        : emptyState();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      state = emptyState();
    }
    // Proposals are intentionally memory-only. A restart invalidates them and releases their reservations.
    await persist();
  }

  async function rollDayIfNeeded() {
    await initialize();
    if (state.day !== day()) {
      state = emptyState();
      await persist();
    }
  }

  return {
    async reserve(id, amount, limits) {
      assertAmount(amount);
      return exclusive(async () => {
        await rollDayIfNeeded();
        const maxTx = BigInt(limits.perTransaction);
        const daily = BigInt(limits.daily);
        if (BigInt(amount) > maxTx) throw new Error('Estimated sponsor cost exceeds the per-swap Devnet limit.');
        if (BigInt(state.spentLamports) + BigInt(state.reservedLamports) + BigInt(amount) > daily) {
          throw new Error('The Devnet sponsor daily budget is reserved or exhausted. Wait for previews to expire or try after the UTC daily reset.');
        }
        if (state.reservations[id]) throw new Error('This sponsor budget reservation already exists.');
        state.reservations[id] = amount;
        state.reservedLamports += amount;
        await persist();
      });
    },
    async update(id, amount, limits) {
      assertAmount(amount);
      return exclusive(async () => {
        await rollDayIfNeeded();
        const previous = state.reservations[id];
        if (previous === undefined) throw new Error('The sponsor budget reservation expired. Prepare a fresh transaction.');
        if (BigInt(amount) > BigInt(limits.perTransaction)) throw new Error('Updated sponsor cost exceeds the per-swap Devnet limit.');
        const nextReserved = state.reservedLamports - previous + amount;
        if (BigInt(state.spentLamports) + BigInt(nextReserved) > BigInt(limits.daily)) {
          throw new Error('The Devnet sponsor daily budget is reserved or exhausted. The signed transaction was not submitted.');
        }
        state.reservedLamports = nextReserved;
        state.reservations[id] = amount;
        await persist();
      });
    },
    async release(id) {
      return exclusive(async () => {
        await rollDayIfNeeded();
        const amount = state.reservations[id];
        if (amount === undefined) return;
        state.reservedLamports -= amount;
        delete state.reservations[id];
        await persist();
      });
    },
    async settle(id, actualAmount) {
      assertAmount(actualAmount);
      return exclusive(async () => {
        await rollDayIfNeeded();
        const reserved = state.reservations[id] ?? 0;
        state.reservedLamports = Math.max(0, state.reservedLamports - reserved);
        delete state.reservations[id];
        state.spentLamports += actualAmount;
        await persist();
        return this.snapshotUnlocked();
      });
    },
    async remaining(dailyCap) {
      return exclusive(async () => {
        await rollDayIfNeeded();
        return Math.max(0, Number(dailyCap) - state.spentLamports - state.reservedLamports);
      });
    },
    async snapshot() {
      return exclusive(async () => {
        await rollDayIfNeeded();
        return { day: state.day, spentLamports: state.spentLamports, reservedLamports: state.reservedLamports };
      });
    },
    async snapshotUnlocked() {
      await rollDayIfNeeded();
      return { day: state.day, spentLamports: state.spentLamports, reservedLamports: state.reservedLamports };
    },
  };
}

