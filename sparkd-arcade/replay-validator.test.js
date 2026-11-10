'use strict';
const assert=require('node:assert/strict');
const {verify}=require('./replay-validator.js');
const base={format:'sparkd-practice-run-v1',seed:12345,steps:1,events:[],score:0,orbs:0,lives:3};
function rejected(data,reason){const r=verify(data);assert.equal(r.ok,false,JSON.stringify(r));if(reason)assert.equal(r.reason,reason)}
rejected({...base,format:'unknown'},'unsupported format');
rejected({...base,seed:0},'invalid seed or duration');
rejected({...base,steps:-1},'invalid seed or duration');
rejected({...base,steps:54001},'invalid seed or duration');
rejected({...base,events:[{step:1,action:'jump'}]},'invalid input sequence');
rejected({...base,events:[{step:0,action:'fly'}]},'invalid input sequence');
rejected({...base,events:[{step:0,action:'duck_up'}]},'duplicate duck up');
rejected({...base,events:[{step:0,action:'duck_down'},{step:0,action:'duck_down'}]},'duplicate duck down');
rejected({...base,events:Array.from({length:12001},()=>({step:0,action:'jump'}))},'invalid payload');
rejected({...base,score:Infinity},'invalid payload');
rejected({...base,score:100000},'run does not end at reported step');
// Find a naturally completed run, then verify score/orb/lives exactly.
let candidate=null;
for(let seed=1;seed<=30&&!candidate;seed++){
  const probe=verify({...base,seed,steps:54000});
  // A completed run with an intentionally wrong result returns expected.
  if(probe.reason==='run does not end at reported step'&&probe.finishedAt){const result=verify({...base,seed,steps:probe.finishedAt});if(result.expected&&result.expected.lives===0)candidate={...base,seed,steps:probe.finishedAt,...result.expected}}
}
assert.ok(candidate,'expected a completed deterministic run');
const valid=verify(candidate);assert.equal(valid.ok,true,JSON.stringify(valid));
rejected({...candidate,score:candidate.score+75},'result mismatch');
rejected({...candidate,orbs:candidate.orbs+1},'result mismatch');
rejected({...candidate,lives:1},'result mismatch');
rejected({...candidate,steps:candidate.steps+1},'run does not end at reported step');
console.log('SPARKD replay-validator tests passed');
