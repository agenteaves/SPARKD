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
 for(let i=0;i<1600;i++){s.lives=5;runnerStep(s);}
 assert.ok(s.elapsed>=25);
 const count=s.step;
 assert.equal(runnerStep(s).stopped,true);
 assert.equal(s.step,count);
});

test('drone hazard geometry matches the live runner',()=>{
 const s=makeRunner(123);
 s.elapsed=5;
 s.spawn=0;
 s.orbSpawn=100;
 let found=false;
 for(let i=0;i<1000&&!found;i++){
   s.spawn=0;
   s.elapsed=5;
   s.items=[];
   runnerStep(s);
   for(const item of s.items){
     if(item.type==='drone'||item.type==='swooper'){
       assert.equal(item.baseY,345-76);
       assert.equal(item.h,32);
       found=true;
       break;
     }
   }
   s.lives=5;
 }
 assert.ok(found,'seeded hazards should eventually produce a drone');
});
test('every fifth collected orb awards a life even above five',()=>{
 const s=makeRunner(77);
 s.lives=6;s.orbs=4;s.orbSpawn=100;s.spawn=100;
 s.items=[{type:'orb',x:105,y:275,w:25,h:25,hit:false}];
 runnerStep(s);
 assert.equal(s.orbs,5);
 assert.equal(s.lives,7);
 assert.equal(s.score,75+12/60);
});
test('moving swooper oscillation uses the same amplitude as gameplay',()=>{
 const s=makeRunner(1,1);
 s.spawn=100;s.orbSpawn=100;
 s.items=[{type:'swooper',x:600,y:269,baseY:269,osc:Math.PI/2,w:48,h:32,hit:false}];
 runnerStep(s);
 assert.ok(Math.abs(s.items[0].y-(269+Math.sin(s.elapsed*3.7+Math.PI/2)*5))<1e-9);
});
