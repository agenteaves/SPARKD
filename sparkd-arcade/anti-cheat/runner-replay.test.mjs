import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRunnerReplay} from './runner-replay.mjs';
import {makeRunner,runnerStep} from './runner-simulator.mjs';

const now=2000000;
const session={runId:'11111111-1111-4111-8111-111111111111',seed:42,
  rulesVersion:'runner-diagnostic-v1',issuedAt:now-10000,consumed:false};
function run(steps=300) {
  const s=makeRunner(session.seed);
  for(let i=0;i<steps;i++)runnerStep(s);
  return {runId:session.runId,seed:session.seed,rulesVersion:session.rulesVersion,
    steps,events:[],claimedScore:Math.floor(s.score)};
}
test('matching runner diagnostic never authorizes official scoring',()=>{
 const result=inspectRunnerReplay(run(),session,now);
 assert.equal(result.diagnosticMatch,true);
 assert.equal(result.accepted,false);
 assert.equal(result.reason,'full-game-verifier-not-implemented');
});
test('forged score is rejected with independently computed score',()=>{
 const payload=run();
 const result=inspectRunnerReplay({...payload,claimedScore:payload.claimedScore+1000},session,now);
 assert.equal(result.accepted,false);
 assert.equal(result.reason,'score-mismatch');
});
test('reject boss-stage replay without a complete boss simulator',()=>{
 assert.equal(inspectRunnerReplay({...run(),steps:1501},session,now).reason,'boss-replay-not-implemented');
});
test('reject unsupported rules versions',()=>{
 const other={...session,rulesVersion:'v1'};
 assert.equal(inspectRunnerReplay({...run(),rulesVersion:'v1'},other,now).reason,'unsupported-runner-rules');
});
test('reject malformed event before replay',()=>{
 assert.equal(inspectRunnerReplay({...run(),events:[{step:-1,action:'jump'}]},session,now).reason,'event-timing');
});
