/* SPARKD Runner practice replay validator v0.1
 * Pure, dependency-free simulation matching index.html v1.1 mechanics.
 * SECURITY: This checks internal consistency only. The browser supplies its own
 * seed and inputs. Do NOT use for prizes or official leaderboards.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SparkdReplay=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STEP=1/60,GROUND=345,W=800,MAX_STEPS=60*60*15,MAX_EVENTS=12000;
function verify(record){
  if(!record||record.format!=='sparkd-practice-run-v1')return {ok:false,reason:'unsupported format'};
  const {seed,steps,events,score,orbs,lives}=record;
  if(!Number.isSafeInteger(seed)||seed<1||seed>0xffffffff||!Number.isSafeInteger(steps)||steps<1||steps>MAX_STEPS)return {ok:false,reason:'invalid seed or duration'};
  if(!Array.isArray(events)||events.length>MAX_EVENTS||!Number.isSafeInteger(score)||score<0||!Number.isSafeInteger(orbs)||orbs<0||!Number.isSafeInteger(lives)||lives<0||lives>3)return {ok:false,reason:'invalid payload'};
  let lastStep=-1;for(const e of events){
    if(!e||!Number.isSafeInteger(e.step)||e.step<0||e.step>=steps||e.step<lastStep||!['jump','duck_down','duck_up'].includes(e.action))return {ok:false,reason:'invalid input sequence'};
    lastStep=e.step;
  }
  let rng=seed>>>0;
  function random(){rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return (rng>>>0)/4294967296}
  const rand=(a,b)=>a+random()*(b-a);
  let hero={x:105,y:GROUND-70,w:46,vy:0,onGround:true};
  let elapsed=0,points=0,life=3,orbCount=0,spawn=.9,orbSpawn=.65,speed=280,invulnerable=0,duck=false,items=[],eventIndex=0,finishedAt=null;
  function intersects(a,b){return a.x+7<b.x+b.w-5&&a.x+a.w-7>b.x+5&&a.y+7<b.y+b.h-5&&a.y+a.h-5>b.y+5}
  for(let step=0;step<steps;step++){
    while(eventIndex<events.length&&events[eventIndex].step===step){
      const action=events[eventIndex++].action;
      if(action==='jump'){if(!hero.onGround)return {ok:false,reason:'impossible jump'};hero.vy=-690;hero.onGround=false}
      else if(action==='duck_down'){if(duck)return {ok:false,reason:'duplicate duck down'};duck=true}
      else {if(!duck)return {ok:false,reason:'duplicate duck up'};duck=false}
    }
    elapsed=(step+1)*STEP;speed=Math.min(510,280+elapsed*4);points+=STEP*12;invulnerable=Math.max(0,invulnerable-STEP);
    hero.vy+=1800*STEP;hero.y+=hero.vy*STEP;
    const h=duck&&hero.onGround?43:70;
    if(hero.y+h>=GROUND){hero.y=GROUND-h;hero.vy=0;hero.onGround=true}else hero.onGround=false;
    if(hero.onGround)hero.y=GROUND-h;
    spawn-=STEP;orbSpawn-=STEP;
    if(spawn<=0){const drone=random()<.38;items.push({type:drone?'drone':'barrier',x:W+30,y:drone?GROUND-91:GROUND-41,w:drone?48:34,h:drone?32:41,hit:false});spawn=rand(1.05,1.65)*280/speed}
    if(orbSpawn<=0){items.push({type:'orb',x:W+25,y:GROUND-rand(105,155),w:25,h:25,hit:false});orbSpawn=rand(.85,1.4)}
    const box={x:hero.x,y:hero.y,w:hero.w,h};
    for(const it of items){
      it.x-=speed*STEP;
      if(!it.hit&&intersects(box,it)){
        if(it.type==='orb'){it.hit=true;orbCount++;points+=75}
        else if(invulnerable<=0){it.hit=true;life--;invulnerable=1.2;if(life<=0){finishedAt=step+1;break}}
      }
    }
    items=items.filter(it=>it.x+it.w>-30&&!it.hit);
    if(finishedAt!==null)break;
  }
  if(eventIndex!==events.length)return {ok:false,reason:'unused inputs'};
  if(finishedAt!==steps)return {ok:false,reason:'run does not end at reported step'};
  const expected={score:Math.floor(points),orbs:orbCount,lives:life,steps};
  return {ok:score===expected.score&&orbs===orbCount&&lives===life,reason:score===expected.score&&orbs===orbCount&&lives===life?'consistent local replay':'result mismatch',expected};
}
return {verify};
});
