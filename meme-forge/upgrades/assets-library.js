////////////////////////////////////////////////////
// SPARKD MEME FORGE - ORIGINAL MEME ASSET LIBRARY v2
// 50 built-in original SVG assets.
// Focus: funny situations, reactions, props and captionable scenes.
////////////////////////////////////////////////////

(function () {
"use strict";

const assets = [];
const add = (category,name,svg) => assets.push({category,name,svg});
const E = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const svg = body => '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700">'+body+'</svg>';
const defs = '<defs><radialGradient id="fire"><stop stop-color="#ffd34d"/><stop offset=".55" stop-color="#ff6a00"/><stop offset="1" stop-color="#7d1800"/></radialGradient><linearGradient id="night" x2="1" y2="1"><stop stop-color="#07121e"/><stop offset="1" stop-color="#220800"/></linearGradient></defs>';

function mascot(face,pose,label,extra=""){
  const eyes = face==="panic" ? '<circle cx="285" cy="280" r="25" fill="#fff"/><circle cx="415" cy="280" r="25" fill="#fff"/><circle cx="285" cy="282" r="10"/><circle cx="415" cy="282" r="10"/>' :
    face==="love" ? '<text x="350" y="305" text-anchor="middle" font-size="95">😍</text>' :
    face==="sleep" ? '<path d="M260 280q30 25 60 0M380 280q30 25 60 0" fill="none" stroke="#fff" stroke-width="15"/>' :
    '<ellipse cx="295" cy="280" rx="42" ry="30" fill="#101820" stroke="#42dfff" stroke-width="8"/><ellipse cx="405" cy="280" rx="42" ry="30" fill="#101820" stroke="#42dfff" stroke-width="8"/>';
  return svg(defs+
    '<rect width="700" height="700" rx="55" fill="url(#night)"/>'+
    '<path d="M260 180 Q350 35 440 180 L420 230 Q350 185 280 230Z" fill="url(#fire)"/>'+
    '<circle cx="350" cy="310" r="150" fill="#171717" stroke="#ff6a00" stroke-width="16"/>'+eyes+
    '<path d="M310 360 Q350 '+(face==="panic"?'330':'395')+' 390 360" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>'+
    '<rect x="275" y="430" width="150" height="105" rx="35" fill="#202020" stroke="#ff6a00" stroke-width="12"/>'+
    '<text x="350" y="500" text-anchor="middle" font-family="Arial Black" font-size="34" fill="#ff8b25">SPARKD</text>'+
    (pose==="hands"?'<path d="M270 465L170 400M430 465L530 400" stroke="#ff8b25" stroke-width="30" stroke-linecap="round"/>':'')+
    (pose==="shrug"?'<path d="M275 460L150 455M425 460L550 455" stroke="#ff8b25" stroke-width="30" stroke-linecap="round"/>':'')+
    extra+
    '<text x="350" y="635" text-anchor="middle" font-family="Impact,Arial Black" font-size="'+(label.length>18?43:55)+'" fill="#fff" stroke="#000" stroke-width="9" paint-order="stroke">'+E(label)+'</text>');
}
function scene(label,body){
 return svg(defs+'<rect width="700" height="700" rx="45" fill="url(#night)"/>'+body+
 '<rect y="590" width="700" height="110" fill="#080808" opacity=".9"/><text x="350" y="660" text-anchor="middle" font-family="Impact,Arial Black" font-size="'+(label.length>20?39:52)+'" fill="#fff" stroke="#000" stroke-width="8" paint-order="stroke">'+E(label)+'</text>');
}
function prop(label,body){
 return svg('<rect width="700" height="700" fill="none"/>'+body+
 '<text x="350" y="650" text-anchor="middle" font-family="Impact,Arial Black" font-size="48" fill="#fff" stroke="#000" stroke-width="9" paint-order="stroke">'+E(label)+'</text>');
}
function template(name,layout){
 return svg('<rect width="700" height="700" fill="#fff" stroke="#111" stroke-width="14"/>'+
 (layout==="split"?'<line x1="350" y1="0" x2="350" y2="700" stroke="#111" stroke-width="10"/>':'')+
 (layout==="four"?'<line x1="350" y1="0" x2="350" y2="700" stroke="#111" stroke-width="8"/><line x1="0" y1="350" x2="700" y2="350" stroke="#111" stroke-width="8"/>':'')+
 '<text x="350" y="75" text-anchor="middle" font-family="Impact" font-size="52" fill="#111">'+E(name)+'</text>');
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