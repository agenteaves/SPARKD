import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRunner,nextRandom,runnerStep} from './runner-simulator.mjs';
test('same seed produces same RNG sequence',()=>{
 const a=makeRunner(123),b=makeRunner(123);
 assert.deepEqual(Array.from({length:20},()=>nextRandom(a)),Array.from({length:20},()=>nextRandom(b)));
});
test('no-input simulation is deterministic for all runner levels',()=>{
 for(let level=0;level<5;level++){
  const a=makeRunner(777,level),b=makeRunner(777,level);
  for(let i=0;i<600;i++){runnerStep(a);runnerStep(b);}
  assert.deepEqual(a,b);
 }
});
test('score increments 12 points per second before bonuses',()=>{
 const s=makeRunner(1);
 for(let i=0;i<30;i++)runnerStep(s);
 assert.equal(Math.round(s.score*1000)/1000,6);
});
test('invalid seed and unsupported action fail closed',()=>{
 assert.throws(()=>makeRunner(0),RangeError);
 assert.throws(()=>runnerStep(makeRunner(1),['fire']),RangeError);
});
test('runner stops at 25 seconds',()=>{
 const s=makeRunner(9);
 for(let i=0;i<1600;i++)runnerStep(s);
 assert.ok(s.elapsed>=25);
 const count=s.step;
 assert.equal(runnerStep(s).stopped,true);
 assert.equal(s.step,count);
});
