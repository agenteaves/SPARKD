// Isolated deterministic SPARKD runner simulation prototype.
// Mirrors controls/game.js runner physics and spawn RNG; NOT a score verifier.
// The 3D arena, progression and complete scoring remain unimplemented.
export const STEP = 1 / 60;
export const GROUND = 345;
export function makeRunner(seed, level = 0) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff) throw new RangeError('seed');
  if (!Number.isInteger(level) || level < 0 || level > 4) throw new RangeError('level');
  return { rng: seed >>> 0, level, step: 0, elapsed: 0, speed: 280,
    score: 0, orbs: 0, lives: 5, spawn: 3.1, orbSpawn: .65,
    hero: { x: 105, y: GROUND - 70, w: 46, h: 70, vy: 0, onGround: true },
    duck: false, jumpBuffer: 0, invulnerable: 0, shieldCharge: level > 0, shieldTime: 0, items: [], itemSerial: 0 };
}
export function nextRandom(s) {
  let x = s.rng;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  s.rng = x >>> 0;
  return s.rng / 4294967296;
}
function rand(s, a, b) { return a + nextRandom(s) * (b - a); }
function spawnHazard(s) {
  const drone = s.elapsed > 4 && nextRandom(s) < .24 + s.level * .1;
  const moving = s.level > 0 && nextRandom(s) < .16 + s.level * .13;
  const type = moving ? (drone ? 'swooper' : 'roller') : (drone ? 'drone' : 'barrier');
  s.items.push({ id: ++s.itemSerial, type, x: 830, y: drone ? GROUND-76 : GROUND-41,
    w: drone ? 48 : 34, h: drone ? 32 : 41, hit: false,
    baseY: drone ? GROUND-76 : GROUND-41, osc: nextRandom(s) * Math.PI * 2 });
}
function spawnOrb(s) {
  s.items.push({ id: ++s.itemSerial, type: 'orb', x: 825,
    y: GROUND - rand(s,105,155), w:25, h:25, hit:false });
}
function intersects(a,b) {
  return a.x+7 < b.x+b.w-5 && a.x+a.w-7 > b.x+5 &&
    a.y+7 < b.y+b.h-5 && a.y+a.h-5 > b.y+5;
}
export function runnerStep(s, actions = []) {
  if (s.elapsed >= 25 || s.lives <= 0) return { stopped:true, state:s };
  // Events are applied before the fixed step; this is a prototype ordering.
  for (const action of actions) {
    if (action === 'jump') {
      if (s.hero.onGround) { s.duck=false; s.hero.vy=-735; s.hero.onGround=false; }
      else s.jumpBuffer=.13;
    } else if (action === 'duck_down' || action === 'duck_up') {
      s.duck=action==='duck_down';
      if(s.hero.onGround){s.hero.y=GROUND-(s.duck?43:70);s.hero.vy=0;}
    } else if (action === 'invincible') {
      if (s.level === 0 || !s.shieldCharge || s.shieldTime > 0) throw new RangeError('invalid shield activation');
      s.shieldCharge = false;
      s.shieldTime = 6;
    } else throw new RangeError('unsupported runner action');
  }
  s.step++;s.elapsed+=STEP;
  s.jumpBuffer=Math.max(0,s.jumpBuffer-STEP);
  s.speed=Math.min(750,280+s.level*45+s.elapsed*(4+s.level*.7));
  s.score+=STEP*12;
  s.invulnerable=Math.max(0,s.invulnerable-STEP);
  s.shieldTime=Math.max(0,s.shieldTime-STEP);
  const h=s.duck&&s.hero.onGround?43:70;
  s.hero.vy+=1800*STEP;s.hero.y+=s.hero.vy*STEP;
  if(s.hero.y+h>=GROUND){s.hero.y=GROUND-h;s.hero.vy=0;s.hero.onGround=true;}
  else s.hero.onGround=false;
  if(s.hero.onGround){s.hero.y=GROUND-h;if(s.jumpBuffer>0){s.jumpBuffer=0;s.hero.vy=-735;s.hero.onGround=false;}}
  s.spawn-=STEP;s.orbSpawn-=STEP;
  if(s.spawn<=0){spawnHazard(s);s.spawn=rand(s,Math.max(.8,1.75-s.level*.17),Math.max(1.2,2.3-s.level*.17))*280/s.speed;}
  if(s.orbSpawn<=0){spawnOrb(s);s.orbSpawn=rand(s,.85,1.4);}
  for(const it of s.items){
    it.x-=s.speed*STEP;
    if(it.type==='swooper')it.y=it.baseY+Math.sin(s.elapsed*(3+s.level*.7)+it.osc)*5;
    if(it.type==='roller')it.y=it.baseY+Math.sin(s.elapsed*(4+s.level*.8)+it.osc)*12;
    if(!it.hit&&intersects(s.hero,it)){
      if(it.type==='orb'){it.hit=true;s.orbs++;s.score+=75;if(s.orbs%5===0)s.lives++;}
      else if(s.invulnerable<=0&&s.shieldTime<=0){it.hit=true;s.lives--;s.invulnerable=2.6;if(s.lives<=0)break;}
    }
  }
  s.items=s.items.filter(it=>it.x+it.w>-30&&!it.hit);
  return { stopped:s.lives<=0||s.elapsed>=25, state:s };
}
