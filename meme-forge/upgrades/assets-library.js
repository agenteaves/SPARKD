////////////////////////////////////////////////////
// SPARKD MEME FORGE - ORIGINAL MEME ASSET LIBRARY v3
// 50 built-in polished original SVG assets.
// Focus: funny situations, reactions, props and captionable scenes.
////////////////////////////////////////////////////

(function () {
"use strict";

const assets = [];
const add = (category,name,svg) => assets.push({category,name,svg});
const E = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const svg = body => '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700">'+body+'</svg>';
const defs = '<defs>'+
'<radialGradient id="fire"><stop stop-color="#fff7a8"/><stop offset=".28" stop-color="#ffd34d"/><stop offset=".62" stop-color="#ff6a00"/><stop offset="1" stop-color="#6d1200"/></radialGradient>'+
'<linearGradient id="night" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#05111d"/><stop offset=".5" stop-color="#101722"/><stop offset="1" stop-color="#220800"/></linearGradient>'+
'<linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#333"/><stop offset=".5" stop-color="#0e1116"/><stop offset="1" stop-color="#000"/></linearGradient>'+
'<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0a0"/><stop offset=".35" stop-color="#ffc43d"/><stop offset=".7" stop-color="#ff6a00"/><stop offset="1" stop-color="#8b2a00"/></linearGradient>'+
'<radialGradient id="glow"><stop stop-color="#ffb347" stop-opacity=".55"/><stop offset=".55" stop-color="#ff6a00" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'+
'<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".65"/></filter>'+
'<filter id="neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
'</defs>';

function mascot(face,pose,label,extra=""){
  const eyes = face==="panic"
    ? '<ellipse cx="292" cy="286" rx="29" ry="34" fill="#fff"/><ellipse cx="408" cy="286" rx="29" ry="34" fill="#fff"/><circle cx="292" cy="293" r="12" fill="#111"/><circle cx="408" cy="293" r="12" fill="#111"/>'
    : face==="love"
    ? '<text x="350" y="320" text-anchor="middle" font-size="112">😍</text>'
    : face==="sleep"
    ? '<path d="M258 286q34 24 68 0M374 286q34 24 68 0" fill="none" stroke="#d7f8ff" stroke-width="15" stroke-linecap="round"/>'
    : '<ellipse cx="294" cy="286" rx="50" ry="34" fill="#06131b" stroke="#35dfff" stroke-width="8"/><ellipse cx="406" cy="286" rx="50" ry="34" fill="#06131b" stroke="#35dfff" stroke-width="8"/><path d="M252 276q42-34 84 0M364 276q42-34 84 0" fill="none" stroke="#baf6ff" stroke-width="4" opacity=".8"/>';

  const mouth = face==="panic"
    ? '<ellipse cx="350" cy="370" rx="36" ry="42" fill="#050505" stroke="#fff" stroke-width="9"/>'
    : '<path d="M310 365 Q350 410 390 365" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>';

  const arms = pose==="hands"
    ? '<path d="M282 474Q215 470 152 405" stroke="#ff8a22" stroke-width="34" stroke-linecap="round"/><path d="M418 474Q485 470 548 405" stroke="#ff8a22" stroke-width="34" stroke-linecap="round"/><circle cx="145" cy="398" r="27" fill="url(#gold)"/><circle cx="555" cy="398" r="27" fill="url(#gold)"/>'
    : '<path d="M285 470Q210 438 145 460" stroke="#ff8a22" stroke-width="34" stroke-linecap="round"/><path d="M415 470Q490 438 555 460" stroke="#ff8a22" stroke-width="34" stroke-linecap="round"/><circle cx="140" cy="461" r="27" fill="url(#gold)"/><circle cx="560" cy="461" r="27" fill="url(#gold)"/>';

  return svg(defs+
    '<rect width="700" height="700" rx="52" fill="url(#night)"/>'+
    '<circle cx="350" cy="315" r="275" fill="url(#glow)"/>'+
    '<g opacity=".55"><circle cx="86" cy="96" r="3" fill="#fff"/><circle cx="602" cy="128" r="4" fill="#fff"/><circle cx="570" cy="300" r="3" fill="#fff"/><circle cx="125" cy="348" r="4" fill="#fff"/></g>'+
    '<g filter="url(#shadow)">'+
      '<path d="M250 200Q278 87 350 45Q422 87 450 200L420 235Q350 188 280 235Z" fill="url(#fire)" stroke="#ff9d2f" stroke-width="8"/>'+
      '<path d="M285 145Q350 80 415 145" fill="none" stroke="#fff6bc" stroke-width="11" opacity=".55"/>'+
      '<circle cx="350" cy="315" r="160" fill="url(#armor)" stroke="url(#gold)" stroke-width="18"/>'+
      '<ellipse cx="350" cy="238" rx="118" ry="46" fill="#2b3139" opacity=".9"/>'+
      eyes+mouth+
      '<rect x="273" y="438" width="154" height="112" rx="38" fill="url(#armor)" stroke="url(#gold)" stroke-width="13"/>'+
      '<path d="M300 458H400" stroke="#ffe391" stroke-width="5" opacity=".45"/>'+
      '<text x="350" y="507" text-anchor="middle" font-family="Arial Black,Arial" font-size="35" fill="#ff9d2f" stroke="#5c1800" stroke-width="2" paint-order="stroke">SPARKD</text>'+
      arms+extra+
    '</g>'+
    '<text x="350" y="640" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="'+(label.length>18?41:54)+'" fill="#fff" stroke="#000" stroke-width="11" paint-order="stroke" filter="url(#shadow)">'+E(label)+'</text>');
}

function scene(label,body){
 return svg(defs+
 '<rect width="700" height="700" rx="48" fill="url(#night)"/>'+
 '<circle cx="350" cy="300" r="300" fill="url(#glow)"/>'+
 '<g opacity=".45"><circle cx="95" cy="95" r="4" fill="#fff"/><circle cx="610" cy="120" r="3" fill="#fff"/><circle cx="535" cy="395" r="4" fill="#fff"/><circle cx="160" cy="420" r="3" fill="#fff"/></g>'+
 '<g filter="url(#shadow)">'+body+'</g>'+
 '<rect y="572" width="700" height="128" fill="#05070a" opacity=".92"/>'+
 '<path d="M0 574H700" stroke="#ff6a00" stroke-width="4" opacity=".8"/>'+
 '<text x="350" y="650" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="'+(label.length>20?38:50)+'" fill="#fff" stroke="#000" stroke-width="10" paint-order="stroke">'+E(label)+'</text>');
}

function prop(label,body){
 return svg(defs+
 '<rect width="700" height="700" rx="48" fill="#07101a"/>'+
 '<circle cx="350" cy="310" r="265" fill="url(#glow)"/>'+
 '<g filter="url(#shadow)">'+body+'</g>'+
 '<text x="350" y="650" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="48" fill="#fff" stroke="#000" stroke-width="10" paint-order="stroke">'+E(label)+'</text>');
}

function template(name,layout){
 return svg(defs+
 '<rect width="700" height="700" rx="38" fill="#f7f7f7" stroke="#111" stroke-width="14"/>'+
 '<rect x="20" y="20" width="660" height="660" rx="24" fill="#fff" stroke="#d7d7d7" stroke-width="4"/>'+
 (layout==="split"?'<line x1="350" y1="95" x2="350" y2="670" stroke="#111" stroke-width="9"/>':'')+
 (layout==="four"?'<line x1="350" y1="95" x2="350" y2="670" stroke="#111" stroke-width="8"/><line x1="25" y1="382" x2="675" y2="382" stroke="#111" stroke-width="8"/>':'')+
 '<rect x="25" y="25" width="650" height="80" rx="14" fill="#111"/>'+
 '<text x="350" y="82" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="46" fill="#fff">'+E(name)+'</text>');
}

// 20 funny/captionable SPARKD characters
add("Characters","SPARKD Panic",mascot("panic","hands","WHEN THE CHART TURNS RED"));
add("Characters","SPARKD Chill",mascot("cool","shrug","JUST A DIP"));
add("Characters","SPARKD Sleeping",mascot("sleep","shrug","SLEPT THROUGH THE PUMP"));
add("Characters","SPARKD In Love",mascot("love","hands","I LOVE GREEN CANDLES"));
add("Characters","SPARKD Confused",mascot("panic","shrug","WEN MOON?"));
add("Characters","SPARKD No Fear",mascot("cool","hands","NO FEAR"));
add("Characters","SPARKD Still Early",mascot("cool","shrug","STILL EARLY"));
add("Characters","SPARKD Bag Guard",mascot("cool","hands","MY BAG. MY RULES.",'<text x="525" y="430" font-size="110">💰</text>'));
add("Characters","SPARKD Coffee Trader",mascot("sleep","hands","CHECKING CHARTS AT 3AM",'<text x="515" y="430" font-size="100">☕</text>'));
add("Characters","SPARKD Winner",mascot("cool","hands","BUILT DIFFERENT",'<text x="510" y="410" font-size="110">🏆</text>'));
add("Characters","SPARKD Diamond Hands",mascot("cool","hands","DIAMOND HANDS",'<text x="100" y="430" font-size="90">💎</text><text x="520" y="430" font-size="90">💎</text>'));
add("Characters","SPARKD Money Rain",mascot("panic","hands","WAIT... I'M UP?",'<text x="90" y="170" font-size="80">💵</text><text x="520" y="180" font-size="80">💵</text>'));
add("Characters","SPARKD Rocket Rider",mascot("panic","hands","SEND IT",'<text x="485" y="470" font-size="150">🚀</text>'));
add("Characters","SPARKD Rug Escape",mascot("panic","hands","NOT TODAY, RUG",'<path d="M70 520L230 470L250 560L80 600Z" fill="#c21d1d"/>'));
add("Characters","SPARKD Bull Friend",mascot("cool","hands","BULLISH",'<text x="500" y="420" font-size="125">🐂</text>'));
add("Characters","SPARKD Bear Watch",mascot("panic","shrug","I SEE YOU, BEAR",'<text x="500" y="420" font-size="125">🐻</text>'));
add("Characters","SPARKD Tiny Gain",mascot("love","hands","PROFIT IS PROFIT",'<text x="520" y="430" font-size="90">🪙</text>'));
add("Characters","SPARKD Empty Wallet",mascot("panic","shrug","WHERE DID IT GO?",'<path d="M500 410h130v85H500z" fill="#8b552e" stroke="#fff" stroke-width="5"/>'));
add("Characters","SPARKD Meme Lord",mascot("cool","hands","MEME LORD",'<text x="300" y="175" font-size="110">👑</text>'));
add("Characters","SPARKD Patient",mascot("sleep","shrug","PATIENCE LEVEL: 100"));

// 15 situational scenes
add("Scenes","Bull vs Bear",scene("CHOOSE YOUR FIGHTER",'<text x="90" y="350" font-size="210">🐂</text><text x="430" y="350" font-size="210">🐻</text><text x="315" y="340" font-size="85">VS</text>'));
add("Scenes","Green Candle Party",scene("ONE GREEN CANDLE LATER...",'<polyline points="50,500 160,470 230,400 300,440 390,280 470,320 610,100" fill="none" stroke="#35ff77" stroke-width="24"/><text x="220" y="260" font-size="150">🥳</text>'));
add("Scenes","Red Candle Panic",scene("EVERYONE STAY CALM",'<polyline points="50,100 160,170 250,150 340,300 440,260 610,520" fill="none" stroke="#ff3939" stroke-width="24"/><text x="230" y="390" font-size="150">😱</text>'));
add("Scenes","Moon Fishing",scene("WEN MOON?",'<circle cx="520" cy="130" r="90" fill="#ddd"/><text x="120" y="500" font-size="150">🎣</text>'));
add("Scenes","Rocket Launch",scene("NEXT STOP: WHO KNOWS?",'<text x="250" y="430" font-size="270">🚀</text><path d="M300 500l50 90 50-90" fill="#ff6a00"/>'));
add("Scenes","Treasure Bag",scene("FOUND THE BAG",'<text x="230" y="470" font-size="270">💰</text><text x="90" y="200" font-size="110">✨</text><text x="500" y="260" font-size="110">✨</text>'));
add("Scenes","Tiny Candle Celebration",scene("GAINS ARE GAINS",'<rect x="330" y="320" width="35" height="70" fill="#39ff75"/><text x="190" y="500" font-size="180">🎉</text>'));
add("Scenes","Chart Rollercoaster",scene("I'M FINE.",'<polyline points="40,330 130,100 220,500 310,140 400,520 500,120 650,410" fill="none" stroke="#ff6a00" stroke-width="20"/><text x="260" y="380" font-size="140">😵‍💫</text>'));
add("Scenes","Two Traders",scene("SAME CHART. DIFFERENT PLAN.",'<text x="80" y="440" font-size="190">😎</text><text x="420" y="440" font-size="190">😱</text>'));
add("Scenes","Meme Lab",scene("COOKING SOMETHING",'<text x="110" y="440" font-size="200">🧪</text><text x="390" y="430" font-size="190">🔥</text>'));
add("Scenes","Launchpad",scene("READY WHEN YOU ARE",'<rect x="80" y="500" width="540" height="30" fill="#555"/><text x="240" y="490" font-size="240">🚀</text>'));
add("Scenes","Moon Camp",scene("WE LIVE HERE NOW",'<circle cx="520" cy="130" r="85" fill="#eee"/><text x="130" y="500" font-size="190">⛺</text><text x="370" y="470" font-size="140">🔥</text>'));
add("Scenes","Money Printer Joke",scene("TOTALLY SCIENTIFIC",'<text x="130" y="430" font-size="210">🖨️</text><text x="410" y="390" font-size="140">💵</text>'));
add("Scenes","SPARKD Lab Rat",scene("ME CHECKING THE PRICE AGAIN",'<text x="100" y="430" font-size="220">🔬</text><text x="420" y="430" font-size="180">🐭</text>'));
add("Scenes","Victory Podium",scene("MEME OF THE WEEK",'<rect x="120" y="420" width="150" height="130" fill="#9b6b2c"/><rect x="275" y="340" width="150" height="210" fill="#d7a928"/><rect x="430" y="460" width="150" height="90" fill="#9b6b2c"/><text x="300" y="290" font-size="100">🏆</text>'));

// 10 useful props/reactions
add("Props","Fire",prop("FIRE",'<text x="190" y="500" font-size="330">🔥</text>'));
add("Props","Rocket",prop("ROCKET",'<text x="190" y="500" font-size="330">🚀</text>'));
add("Props","Moon",prop("MOON",'<circle cx="350" cy="300" r="190" fill="#ddd"/><circle cx="285" cy="240" r="38" fill="#bbb"/><circle cx="420" cy="350" r="55" fill="#bbb"/>'));
add("Props","Money Bag",prop("BAG",'<text x="190" y="500" font-size="330">💰</text>'));
add("Props","Diamond",prop("DIAMOND",'<text x="190" y="500" font-size="330">💎</text>'));
add("Props","Up Arrow",prop("UP",'<path d="M120 480L440 160l-80-80h220v220l-80-80-320 320z" fill="#35ff77"/>'));
add("Props","Down Arrow",prop("DOWN",'<path d="M120 160l320 320-80 80h220V340l-80 80L180 100z" fill="#ff3939"/>'));
add("Props","Speech Bubble",prop("SAY SOMETHING",'<path d="M80 100h540v350H330l-130 120 35-120H80z" fill="#fff" stroke="#111" stroke-width="16"/>'));
add("Props","Explosion",prop("BOOM",'<path d="M350 40l65 140 145-65-65 145 145 65-145 65 65 145-145-65-65 145-65-145-145 65 65-145-145-65 145-65-65-145 145 65z" fill="#ff6a00" stroke="#ffd34d" stroke-width="18"/>'));
add("Props","Crown",prop("KING MODE",'<text x="170" y="490" font-size="340">👑</text>'));

// 5 blank templates
add("Templates","Top / Bottom Caption",template("TOP TEXT / BOTTOM TEXT","single"));
add("Templates","Expectation / Reality",template("EXPECTATION / REALITY","split"));
add("Templates","Before / After",template("BEFORE / AFTER","split"));
add("Templates","Four Panel",template("4-PANEL","four"));
add("Templates","Caption This",template("CAPTION THIS","single"));

if(assets.length!==50) console.warn("SPARKD asset count:",assets.length);

function dataUrl(source){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);}
function addToCanvas(asset){
 if(!window.canvas||!window.fabric)return;
 fabric.loadSVGFromString(asset.svg,function(objects,options){
   const obj=fabric.util.groupSVGElements(objects,options);
   const max=650, scale=Math.min(max/(obj.width||max),max/(obj.height||max),1);
   obj.set({left:215,top:215,selectable:true,evented:true});
   obj.scale(scale); canvas.add(obj); canvas.setActiveObject(obj); canvas.renderAll();
 });
}

window.addEventListener("load",function(){
 const btn=document.getElementById("assetsBtn"),panel=document.getElementById("assetsPanel"),grid=document.getElementById("assetsGrid"),cats=document.getElementById("assetsCategories"),close=document.getElementById("assetsClose");
 if(!btn||!panel||!grid||!cats)return;
 const categories=["All",...new Set(assets.map(a=>a.category))]; let active="All";
 function render(){
   grid.innerHTML="";
   assets.filter(a=>active==="All"||a.category===active).forEach(asset=>{
     const item=document.createElement("button"); item.type="button"; item.className="assetItem"; item.title=asset.name;
     const img=document.createElement("img"); img.src=dataUrl(asset.svg); img.alt=asset.name;
     const span=document.createElement("span"); span.textContent=asset.name; item.append(img,span);
     item.onclick=()=>addToCanvas(asset); grid.appendChild(item);
   });
   [...cats.children].forEach(b=>b.classList.toggle("active",b.dataset.category===active));
 }
 categories.forEach(cat=>{const b=document.createElement("button");b.type="button";b.textContent=cat;b.dataset.category=cat;b.onclick=()=>{active=cat;render();};cats.appendChild(b);});
 btn.onclick=()=>{const open=panel.hidden;panel.hidden=!open;btn.setAttribute("aria-expanded",String(open));};
 if(close)close.onclick=()=>{panel.hidden=true;btn.setAttribute("aria-expanded","false");};
 render();
});
})();