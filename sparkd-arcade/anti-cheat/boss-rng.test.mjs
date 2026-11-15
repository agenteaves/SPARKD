import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossRandom, BOSS_RNG_VERSION} from './boss-rng.mjs';
test('same session seed and level produce identical boss pickups',()=>{
 const a=createBossRandom(123456,3),b=createBossRandom(123456,3);
 assert.equal(a.version,BOSS_RNG_VERSION);
 for(let i=0;i<100;i++){
  assert.deepEqual(a.weaponPedestal(),b.weaponPedestal());
  assert.deepEqual(a.energyOrb(),b.energyOrb());
 }
 assert.equal(a.snapshot(),b.snapshot());
});
test('coordinates stay inside arena placement bounds',()=>{
 const r=createBossRandom(17,0);
 for(let i=0;i<500;i++){
  for(const p of [r.weaponPedestal(),r.energyOrb()]){
   assert.ok(p.x>=-6&&p.x<6);
   assert.ok(p.z>=1&&p.z<6.5);
  }
 }
});
test('different levels use independent streams',()=>{
 const a=createBossRandom(77,0),b=createBossRandom(77,1);
 assert.notDeepEqual(a.weaponPedestal(),b.weaponPedestal());
});
test('invalid seeds and levels are rejected',()=>{
 assert.throws(()=>createBossRandom(0,0),RangeError);
 assert.throws(()=>createBossRandom(1,5),RangeError);
 assert.throws(()=>createBossRandom(2**32,0),RangeError);
});
