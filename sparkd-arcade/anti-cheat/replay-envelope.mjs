// SPARKD ELITES anti-cheat: conservative replay-envelope validation.
// This is NOT a gameplay verifier and MUST NOT authorize official scores.
export const MAX_EVENTS = 20000;
export const MAX_RUN_MS = 30 * 60 * 1000;
const TYPES = new Set(['jump','duck','left','right','fire','release','pause','resume']);
export function inspectReplayEnvelope(payload, session, now = Date.now()) {
  const fail = reason => ({ accepted: false, reason });
  if (!session || typeof session !== 'object' || session.consumed) return fail('invalid-session');
  if (typeof session.runId !== 'string' || !/^[0-9a-f-]{36}$/i.test(session.runId)) return fail('invalid-run-id');
  if (!Number.isSafeInteger(session.issuedAt) || session.issuedAt > now + 5000 || now - session.issuedAt > MAX_RUN_MS) return fail('expired-session');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fail('invalid-payload');
  if (payload.runId !== session.runId || payload.seed !== session.seed || payload.rulesVersion !== session.rulesVersion) return fail('session-mismatch');
  if (!Array.isArray(payload.events) || payload.events.length > MAX_EVENTS) return fail('event-limit');
  if (!Number.isSafeInteger(payload.claimedScore) || payload.claimedScore < 0) return fail('invalid-claimed-score');
  let previous = -1;
  for (const event of payload.events) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) return fail('invalid-event');
    if (!TYPES.has(event.type)) return fail('unknown-event');
    if (!Number.isSafeInteger(event.ms) || event.ms < previous || event.ms > MAX_RUN_MS) return fail('event-timing');
    previous = event.ms;
  }
  if (previous > now - session.issuedAt + 5000) return fail('future-event');
  // Intentionally no success/verified result: the gameplay rules engine is not implemented.
  return { accepted: false, reason: 'gameplay-verifier-not-implemented', envelopeValid: true };
}
