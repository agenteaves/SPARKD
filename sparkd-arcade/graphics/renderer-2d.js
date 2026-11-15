/* Visuals-only 2D fallback renderer. All game state is read from a snapshot. */
(()=>{'use strict';
let ctx,W,H,ground,particles,mode,arenaFrame,bossAttack,bossTier,weapons,boss,bossFlash,bossProjectiles,bossShots,arenaX,bossInvuln,invincibleTime,invulnerable,duckHeld,hero,state,elapsed,speed,items;
function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.45);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,Math.max(2,p.life*12),Math.max(2,p.life*12))}ctx.globalAlpha=1}

function drawBoss(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#071b24');sky.addColorStop(1,'#17402b');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
for(let i=0;i<13;i++){const x=i*70;ctx.fillStyle=i%2?'#0a302c':'#103c36';ctx.fillRect(x,90+(i%3)*23,60,245)}
ctx.fillStyle='#19352d';ctx.beginPath();ctx.moveTo(260,165);ctx.lineTo(540,165);ctx.lineTo(800,420);ctx.lineTo(0,420);ctx.closePath();ctx.fill();
ctx.strokeStyle='#2f9862';ctx.lineWidth=2;for(let i=0;i<7;i++){const y=190+i*i*6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke()}for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(400,165);ctx.lineTo(400+i*130,420);ctx.stroke()}
if(bossAttack){ctx.fillStyle='#ff4d5a55';ctx.fillRect(bossAttack.x-65-bossTier*10,185,130+bossTier*20,235);ctx.strokeStyle='#ffb1a9';ctx.lineWidth=4;ctx.strokeRect(bossAttack.x-65-bossTier*10,185,130+bossTier*20,235);ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.fillText('DODGE!',bossAttack.x-35,210)}
for(const w of weapons){ctx.fillStyle=['#7dff9d','#ffce4e','#ff6c55'][Math.min(2,w.tier)];ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(w.x-17,325,34+w.tier*8,13+w.tier*6);ctx.shadowBlur=0;ctx.font='bold 14px system-ui';ctx.fillText('PICK UP',w.x-32,315)}
const bx=boss.x;ctx.fillStyle=bossFlash>0?'#fff3b4':'#8e304d';ctx.beginPath();ctx.ellipse(bx,155,65+bossTier*12,76+bossTier*10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd966';ctx.fillRect(bx-35,128,22,12);ctx.fillRect(bx+13,128,22,12);ctx.fillStyle='#1c0912';ctx.fillRect(bx-20,166,40,10);
ctx.fillStyle='#263a31';ctx.fillRect(240,23,320,18);ctx.fillStyle='#ff5673';ctx.fillRect(240,23,320*Math.max(0,boss.hp/boss.maxHp),18);ctx.strokeStyle='#ffe4e4';ctx.strokeRect(240,23,320,18);ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.fillText('BOSS PHASE '+boss.phase+' / 3',300,65);ctx.fillText('WEAPON: '+(['NONE','BLASTER','CANNON','MEGA CANNON'][boss.weapon]||'NONE'),15,65);
for(const p of bossProjectiles){ctx.shadowColor='#ff645a';ctx.shadowBlur=15;ctx.fillStyle='#ff6a4c';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}for(const s of bossShots){ctx.fillStyle=['','#7affaa','#ffd84a','#ff654a'][Math.min(3,s.power)];ctx.fillRect(s.x-5-s.power*2,s.y-13,10+s.power*4,25+s.power*4)}
ctx.save();ctx.translate(arenaX,315);ctx.fillStyle=bossInvuln>0?'#a6c4b2':'#22df75';ctx.beginPath();ctx.moveTo(0,-58);ctx.lineTo(27,2);ctx.lineTo(-27,2);ctx.closePath();ctx.fill();ctx.fillStyle='#e9b847';ctx.fillRect(-12,-57,24,12);ctx.fillStyle='#13231b';ctx.fillRect(-17,-35,34,30);if(boss.weapon){ctx.fillStyle='#ffd65e';ctx.fillRect(17,-32,18+boss.weapon*11,8+boss.weapon*5)}ctx.restore();
ctx.fillStyle='#fff';ctx.font='bold 15px system-ui';ctx.fillText('SPARKD 3D-STYLE BOSS ARENA • MOVE • COLLECT • FIRE',15,398)}


function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawHero(){
ctx.save();if(invincibleTime>0){ctx.shadowColor='#35ff6b';ctx.shadowBlur=36;ctx.filter='drop-shadow(0 0 14px #39ff6e) brightness(1.35)'}else if(invulnerable>0&&Math.floor(invulnerable*12)%2===0)ctx.globalAlpha=.38;
const duck=duckHeld&&hero.onGround,air=!hero.onGround;
const stride=state==='playing'&&!duck&&!air?Math.sin(elapsed*15):0;
const x=hero.x+hero.w/2,y=hero.y+(duck?8:0);
ctx.translate(x,y);if(duck)ctx.scale(1,.61);
const limb=(ax,ay,bx,by,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()};
ctx.fillStyle='#087a3b';ctx.beginPath();ctx.moveTo(-13,20);ctx.lineTo(-29-stride*3,58);ctx.lineTo(5,61);ctx.lineTo(14,20);ctx.closePath();ctx.fill();ctx.strokeStyle='#e9b846';ctx.lineWidth=2;ctx.stroke();
for(const side of [-1,1]){const swing=duck?side*10:air?side*7:stride*side*12;limb(side*9,43,side*9+swing,59,10,'#18231d');limb(side*9+swing,59,side*9+swing*.6,70,10,'#dba52d')}
ctx.fillStyle='#101718';ctx.fillRect(-16,19,32,32);ctx.fillStyle='#18b95c';ctx.fillRect(-16,19,32,7);ctx.fillStyle='#e8bd48';ctx.fillRect(-16,45,32,5);
for(const side of [-1,1]){const swing=duck?-13:air?-12:-stride*side*12;limb(side*18,24,side*20+swing,44,9,'#159b53');limb(side*20+swing,44,side*20+swing,49,10,'#dba52d')}
ctx.fillStyle='#e6b785';ctx.fillRect(-11,0,22,22);ctx.fillStyle='#e8bf4d';ctx.fillRect(-13,-3,26,9);ctx.fillStyle='#20e779';ctx.fillRect(-12,10,24,7);ctx.fillStyle='#101718';ctx.fillRect(-7,12,4,2);ctx.fillRect(4,12,4,2);
ctx.restore()}
function draw(t){if(mode==='boss'){if(arenaFrame.hidden){drawBoss();drawParticles()}return}const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0c1b1b');sky.addColorStop(1,'#143d25');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
const off=(t*25)%130;for(let i=-1;i<9;i++){const x=i*130-off;rounded(x,135+(i%3)*22,100,210,2,'#0a211b');for(let j=0;j<4;j++)for(let k=0;k<3;k++)rounded(x+15+k*26,160+(i%3)*22+j*35,10,14,1,'#245d42')}
ctx.fillStyle='#0b1411';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#35ba69';ctx.fillRect(0,ground,W,4);ctx.fillStyle='#3a6848';for(let x=-((t*speed*.5)%75);x<W;x+=75)ctx.fillRect(x,383,38,4);
for(const it of items){if(it.type==='swooper'||it.type==='roller'){ctx.save();ctx.shadowColor='#ff4b79';ctx.shadowBlur=14;ctx.fillStyle=it.type==='swooper'?'#b42b68':'#c75d23';ctx.beginPath();ctx.ellipse(it.x+it.w/2,it.y+it.h/2,it.w/2,it.h/2,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffedb0';ctx.fillRect(it.x+it.w*.28,it.y+it.h*.36,it.w*.45,5);ctx.restore();continue}if(it.type==='orb'){ctx.shadowBlur=18;ctx.shadowColor='#5aff8e';ctx.fillStyle='#8affb1';ctx.beginPath();ctx.arc(it.x+12,it.y+12,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#104923';ctx.font='bold 17px sans-serif';ctx.fillText('⚡',it.x+3,it.y+19)}else if(it.type==='drone'){rounded(it.x,it.y,it.w,it.h,10,'#a83445');rounded(it.x+12,it.y+9,24,8,3,'#ffdb69');ctx.fillStyle='#d04d5a';ctx.fillRect(it.x-7,it.y+7,8,4);ctx.fillRect(it.x+it.w,it.y+7,8,4)}else{rounded(it.x,it.y,it.w,it.h,5,'#e1a331');ctx.fillStyle='#25190b';ctx.fillRect(it.x+7,it.y+6,8,29);ctx.fillRect(it.x+23,it.y+6,5,29)}}
drawHero();drawParticles();ctx.fillStyle='#c8ffdc';ctx.font='bold 15px system-ui';ctx.fillText('SPARKD CITY • HERO TRAINING',18,28)}


window.SPARKDGraphics={draw(snapshot,t){({ctx,W,H,ground,particles,mode,arenaFrame,bossAttack,bossTier,weapons,boss,bossFlash,bossProjectiles,bossShots,arenaX,bossInvuln,invincibleTime,invulnerable,duckHeld,hero,state,elapsed,speed,items}=snapshot);draw(t)}};
})();