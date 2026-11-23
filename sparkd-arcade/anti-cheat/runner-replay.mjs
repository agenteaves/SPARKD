// Offline diagnostic replay only. Never authorize leaderboard writes with this module.
// Full-game verification requires boss/space replay and server-issued sessions.
import {inspectReplayEnvelope} from './replay-envelope.mjs';
import {makeRunner,runnerStep} from './runner-simulator.mjs';

export function inspectRunnerReplay(payload, session, now = Date.now()) {
  const envelope = inspectReplayEnvelope(payload, session, now);
  if (!envelope.envelopeValid) return envelope;
  if (session.rulesVersion !== 'runner-diagnostic-v1') {
    return {accepted:false, reason:'unsupported-runner-rules'};
  }
  // The runner prototype covers only level 1, and cannot validate boss outcomes.
  if (payload.steps > 1500) return {accepted:false,reason:'boss-replay-not-implemented'};
  const state = makeRunner(session.seed, 0);
  let cursor = 0;
  try {
    for (let tick = 0; tick < payload.steps; tick++) {
      const actions = [];
      while (cursor < payload.events.length && payload.events[cursor].step === tick) {
        actions.push(payload.events[cursor++].action);
      }
      if (state.lives <= 0 || state.elapsed >= 25) {
        return {accepted:false,reason:'inputs-after-run-ended'};
      }
      runnerStep(state, actions);
    }
  } catch {
    return {accepted:false,reason:'invalid-runner-action'};
  }
  const computedScore = Math.floor(state.score);
  if (computedScore !== payload.claimedScore) {
    return {accepted:false,reason:'score-mismatch',computedScore};
  }
  // Even matching replay is diagnostic-only; never a verified competitive score.
  return {accepted:false,reason:'full-game-verifier-not-implemented',computedScore,
    diagnosticMatch:true,runnerLives:state.lives,runnerOrbs:state.orbs};
}
