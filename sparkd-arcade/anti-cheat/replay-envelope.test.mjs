import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectReplayEnvelope } from './replay-envelope.mjs';
const now = 2000000;
const session = {runId:'11111111-1111-4111-8111-111111111111',seed:42,rulesVersion:'v1',issuedAt:now-10000,consumed:false};
const payload = {runId:session.runId,seed:42,rulesVersion:'v1',claimedScore:100,steps:300,events:[{action:'jump',step:100},{action:'duck_down',step:200}]};
test('valid envelope never grants verified score',()=>assert.deepEqual(inspectReplayEnvelope(payload,session,now),{accepted:false,reason:'gameplay-verifier-not-implemented',envelopeValid:true}));
test('reject altered seed',()=>assert.equal(inspectReplayEnvelope({...payload,seed:43},session,now).reason,'session-mismatch'));
test('reject negative score',()=>assert.equal(inspectReplayEnvelope({...payload,claimedScore:-1},session,now).reason,'invalid-claimed-score'));
test('reject reversed event time',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:'jump',step:200},{action:'duck_up',step:100}]},session,now).reason,'event-timing'));
test('reject consumed session',()=>assert.equal(inspectReplayEnvelope(payload,{...session,consumed:true},now).reason,'invalid-session'));
test('reject expired session',()=>assert.equal(inspectReplayEnvelope(payload,{...session,issuedAt:now-1800001},now).reason,'expired-session'));

test('reject unsupported event',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:'fire',step:100}]},session,now).reason,'unknown-event'));
test('reject step count beyond session time',()=>assert.equal(inspectReplayEnvelope({...payload,steps:100000},session,now).reason,'future-event'));

test('reject event past claimed step count',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:'jump',step:301}]},session,now).reason,'event-timing'));
test('reject invalid event objects',()=>assert.equal(inspectReplayEnvelope({...payload,events:[null]},session,now).reason,'invalid-event'));
test('reject run ID swap',()=>assert.equal(inspectReplayEnvelope({...payload,runId:'22222222-2222-4222-8222-222222222222'},session,now).reason,'session-mismatch'));
test('reject missing session',()=>assert.equal(inspectReplayEnvelope(payload,null,now).reason,'invalid-session'));

test('reject future-issued session',()=>assert.equal(inspectReplayEnvelope(payload,{...session,issuedAt:now+1},now).reason,'expired-session'));
test('reject invalid session seed',()=>assert.equal(inspectReplayEnvelope(payload,{...session,seed:0},now).reason,'invalid-session-seed'));
test('reject malformed rules version',()=>assert.equal(inspectReplayEnvelope(payload,{...session,rulesVersion:'../../v1'},now).reason,'invalid-rules-version'));

test('reject negative event step',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:'jump',step:-1}]},session,now).reason,'event-timing'));
test('reject input on the terminal tick',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:'jump',step:300}]},session,now).reason,'post-run-input'));
test('reject non-string event actions',()=>assert.equal(inspectReplayEnvelope({...payload,events:[{action:null,step:100}]},session,now).reason,'unknown-event'));
