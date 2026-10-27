import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDevnetSponsorBudgetStore } from './devnet-sponsor-budget.mjs';

const limits = { perTransaction: 100, daily: 250 };

test('persists spent sponsor budget across restarts and drops stale in-flight reservations', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sparkd-budget-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, 'budget.json');
  const firstProcess = createDevnetSponsorBudgetStore({ filePath });
  await firstProcess.reserve('pending-preview', 40, limits);
  await firstProcess.settle('completed-swap', 60);

  const restartedProcess = createDevnetSponsorBudgetStore({ filePath });
  assert.deepEqual(await restartedProcess.snapshot(), { day: new Date().toISOString().slice(0, 10), spentLamports: 60, reservedLamports: 0 });
  await restartedProcess.reserve('new-preview', 100, limits);
  assert.equal(await restartedProcess.remaining(250), 90);
  await assert.rejects(restartedProcess.reserve('over-cap', 100, limits), /daily budget/);
});

test('resets the persisted daily budget on the UTC date rollover', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sparkd-budget-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, 'budget.json');
  let now = new Date('2026-10-27T23:59:59.000Z');
  const store = createDevnetSponsorBudgetStore({ filePath, clock: () => now });
  await store.settle('completed-swap', 80);
  now = new Date('2026-10-28T00:00:01.000Z');
  assert.deepEqual(await store.snapshot(), { day: '2026-10-28', spentLamports: 0, reservedLamports: 0 });
});
