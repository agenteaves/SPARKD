////////////////////////////////////////////////////
// SPARKD MEME FORGE - POLISHED BRANDED ASSET LIBRARY v4
// 50 original built-in SVG assets.
// Visual direction: SPARKD coin, diamond hands, neon crypto scenes.
////////////////////////////////////////////////////

(function(){
"use strict";

const assets=[];
const add=(category,name,svg)=>assets.push({category,name,svg});
const E=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const wrap=body=>'<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700">'+body+'</svg>';

const defs=`
<defs>
 <radialGradient id="bg"><stop stop-color="#19311f"/><stop offset=".48" stop-color="#08120c"/><stop offset="1" stop-color="#020504"/></radialGradient>
 <linearGradient id="green" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9ffc2"/><stop offset=".2" stop-color="#8bd06f"/><stop offset=".55" stop-color="#315f38"/><stop offset="1" stop-color="#0a2112"/></linearGradient>
 <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef8d8"/><stop offset=".28" stop-color="#9fcf83"/><stop offset=".58" stop-color="#356341"/><stop offset="1" stop-color="#122319"/></linearGradient>
 <linearGradient id="diamond" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".18" stop-color="#d7ecff"/><stop offset=".42" stop-color="#ffffff"/><stop offset=".65" stop-color="#b5d1ff"/><stop offset=".82" stop-color="#f9ddff"/><stop offset="1" stop-color="#a9c5ff"/></linearGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0a2"/><stop offset=".25" stop-color="#ffc736"/><stop offset=".6" stop-color="#ff7a00"/><stop offset="1" stop-color="#7b2600"/></linearGradient>
 <radialGradient id="fire"><stop stop-color="#fff1a0"/><stop offset=".3" stop-color="#ffbd2f"/><stop offset=".68" stop-color="#ff5d00"/><stop offset="1" stop-color="#761000"/></radialGradient>
 <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="15" stdDeviation="16" flood-color="#000" flood-opacity=".72"/></filter>
 <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

function logo(cx=350,cy=300,s=1){
 return `
 <g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="#9bd781" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
   <path d="M-82 -12C-82-70-12-89 28-45L62-10C81 10 81 38 61 57L5 112"/>
   <path d="M82 -12C82-70 12-89-28-45L-62-10C-81 10-81 38-61 57L-5 112"/>
   <path d="M-36 -1L0 34L36-1"/>
 </g>`;
}

function coin(scale=1,cx=350,cy=300){
 return `
 <g transform="translate(${cx} ${cy}) scale(${scale})" filter="url(#shadow)">
   <circle r="170" fill="#15251a" stroke="url(#rim)" stroke-width="18"/>
   <circle r="147" fill="url(#green)" stroke="#1c3421" stroke-width="8"/>
   <circle r="126" fill="#18331f" stroke="#4c7855" stroke-width="5"/>
   <circle r="114" fill="#13291a"/>
   <path d="M-110-42A120 120 0 0 1 100-70" fill="none" stroke="#d4f9b4" stroke-width="8" opacity=".38"/>
   ${logo(0,-10,.72)}
   <text x="0" y="93" text-anchor="middle" font-family="Arial Black,Arial" font-size="39" fill="#fff" stroke="#1a1a1a" stroke-width="3" paint-order="stroke">SPARKD</text>
 </g>`;
}

function diamondHand(side="left"){
 const flip=side==="left"?1:-1;
 const tx=side==="left"?70:630;
 return `
 <g transform="translate(${tx} 340) scale(${flip} 1)" filter="url(#shadow)">
   <path d="M0 20L40-70L88-125L132-150L166-136L170-104L145-78L185-92L216-70L210-38L170-12L215-18L233 7L220 40L165 55L205 67L210 100L180 124L118 110L72 82L25 78Z" fill="url(#diamond)" stroke="#fff" stroke-width="8"/>
   <path d="M35-67L72 80M88-124L118 108M132-149L165 55M168-105L72 82M215-18L118 110M40-70L170-12M25 20L220 40" stroke="#b8d6ff" stroke-width="5" opacity=".8"/>
   <path d="M35-67L88-124L132-149L168-105L215-18L220 40L180 124L118 110L72 82Z" fill="none" stroke="#eef8ff" stroke-width="4"/>
 </g>`;
}

function caption(label,size=52){
 return `<text x="350" y="650" text-anchor="middle" font-family="Impact,Arial Black,Arial" font-size="${size}" fill="#fff" stroke="#000" stroke-width="11" paint-order="stroke">${E(label)}</text>`;
}

function frame(body,label=""){
 return wrap(defs+`
 <rect width="700" height="700" rx="50" fill="url(#bg)"/>
 <circle cx="350" cy="305" r="285" fill="#45b35c" opacity=".08"/>
 <g opacity=".55"><circle cx="85" cy="95" r="3" fill="#fff"/><circle cx="590" cy="110" r="4" fill="#fff"/><circle cx="610" cy="410" r="3" fill="#fff"/><circle cx="120" cy="430" r="4" fill="#fff"/></g>
 ${body}
 ${label?caption(label,label.length>20?39:52):""}`);
}

function hero(label,extra="",hands=false){
 return frame((hands?diamondHand("left")+diamondHand("right"):"")+coin(1,350,300)+extra,label);
}

function prop(label,body){
 return wrap(defs+'<rect width="700" height="700" rx="50" fill="#06100a"/><circle cx="350" cy="315" r="270" fill="#45b35c" opacity=".08"/>'+body+caption(label,label.length>14?42:52));
}

function template(name,layout){
 return wrap(defs+'<rect width="700" height="700" rx="38" fill="#fafafa" stroke="#111" stroke-width="14"/>'+
 '<rect x="24" y="24" width="652" height="652" rx="24" fill="#fff" stroke="#d8d8d8" stroke-width="4"/>'+
 (layout==="split"?'<line x1="350" y1="105" x2="350" y2="675" stroke="#111" stroke-width="9"/>':'')+
 (layout==="four"?'<line x1="350" y1="105" x2="350" y2="675" stroke="#111" stroke-width="8"/><line x1="25" y1="390" x2="675" y2="390" stroke="#111" stroke-width="8"/>':'')+
 '<rect x="25" y="25" width="650" height="82" rx="14" fill="#111"/><text x="350" y="82" text-anchor="middle" font-family="Impact,Arial Black" font-size="45" fill="#fff">'+E(name)+'</text>');
}

// 15 polished SPARKD coin heroes
add("SPARKD","Diamond Hands",hero("DIAMOND HANDS","",true));
add("SPARKD","SPARKD Crown",hero("KING SPARKD",'<text x="260" y="150" font-size="170">👑</text>'));
add("SPARKD","SPARKD Fire",hero("ON FIRE",'<path d="M190 490Q160 390 220 330Q205 430 275 455Q265 345 350 250Q330 405 410 450Q420 350 500 305Q515 410 475 490Z" fill="url(#fire)" opacity=".9"/>'));
add("SPARKD","SPARKD Rocket",hero("TO THE MOON",'<text x="445" y="190" font-size="150">🚀</text>'));
add("SPARKD","SPARKD Moon",hero("MOON MODE",'<circle cx="545" cy="150" r="75" fill="#e9e9e9"/><circle cx="520" cy="132" r="18" fill="#c9c9c9"/><circle cx="570" cy="170" r="25" fill="#c9c9c9"/>'));
add("SPARKD","SPARKD Treasure",hero("FOUND THE BAG",'<text x="475" y="470" font-size="125">💰</text>'));
add("SPARKD","SPARKD Bull",hero("BULLISH",'<text x="460" y="470" font-size="135">🐂</text>'));
add("SPARKD","SPARKD Bear",hero("BEAR WATCH",'<text x="460" y="470" font-size="135">🐻</text>'));
add("SPARKD","SPARKD Victory",hero("MEME CHAMPION",'<text x="465" y="185" font-size="135">🏆</text>'));
add("SPARKD","SPARKD Galaxy",hero("SPARKD FOREVER",'<circle cx="120" cy="140" r="5" fill="#fff"/><circle cx="570" cy="230" r="7" fill="#9fdcff"/><circle cx="560" cy="85" r="4" fill="#fff"/>'));
add("SPARKD","SPARKD Community",hero("TOGETHER WE RISE",'<circle cx="145" cy="500" r="45" fill="#315f38"/><circle cx="555" cy="500" r="45" fill="#315f38"/>'));
add("SPARKD","SPARKD Forge",hero("FORGED, NOT FOUND",'<path d="M120 500H580L525 560H175Z" fill="#3b2615" stroke="#ff7a00" stroke-width="10"/>'));
add("SPARKD","SPARKD Neon",hero("IGNITE REAL-WORLD GOOD",'<circle cx="350" cy="300" r="205" fill="none" stroke="#67ff85" stroke-width="8" filter="url(#glow)" opacity=".7"/>'));
add("SPARKD","SPARKD Gains",hero("GAINS",'<polyline points="455,465 500,410 535,430 590,320" fill="none" stroke="#39ff75" stroke-width="22"/><polygon points="590,320 548,330 578,362" fill="#39ff75"/>'));
add("SPARKD","SPARKD Legend",hero("LEGEND",'<text x="505" y="180" font-size="120">⭐</text>'));

// 10 reactions
add("Reactions","HODL",hero("HODL","",true));
add("Reactions","LFG",hero("LFG!",'<text x="490" y="470" font-size="120">🔥</text>'));
add("Reactions","BUY",hero("BUY?",'<text x="485" y="470" font-size="120">💵</text>'));
add("Reactions","WTF",hero("WTF?!",'<text x="490" y="180" font-size="125">❓</text>'));
add("Reactions","Just a Dip",hero("JUST A DIP",'<polyline points="80,180 180,220 280,260 380,355 500,405 620,470" fill="none" stroke="#ff3d3d" stroke-width="20"/>'));
add("Reactions","Green Candle",hero("ONE GREEN CANDLE...",'<rect x="520" y="315" width="34" height="125" fill="#39ff75"/><line x1="537" y1="280" x2="537" y2="470" stroke="#39ff75" stroke-width="9"/>'));
add("Reactions","No Fear",hero("NO FEAR",'<text x="495" y="470" font-size="120">😎</text>'));
add("Reactions","Still Early",hero("STILL EARLY",'<text x="475" y="470" font-size="120">⏳</text>'));
add("Reactions","Profit",hero("PROFIT IS PROFIT",'<text x="485" y="470" font-size="120">🪙</text>'));
add("Reactions","Patience",hero("PATIENCE",'<text x="485" y="470" font-size="120">⌛</text>'));

// 10 scenes
add("Scenes","Bull vs Bear",frame('<text x="65" y="440" font-size="210">🐂</text>'+coin(.55,350,315)+'<text x="455" y="440" font-size="210">🐻</text>',"CHOOSE YOUR FIGHTER"));
add("Scenes","Rocket Launch",frame('<text x="225" y="430" font-size="260">🚀</text>'+coin(.38,205,420),"SEND IT"));
add("Scenes","Green Chart",frame('<polyline points="45,500 130,460 210,490 290,370 360,395 445,260 520,285 640,105" fill="none" stroke="#39ff75" stroke-width="23"/>'+coin(.42,210,320),"GAINS ARE GAINS"));
add("Scenes","Red Chart",frame('<polyline points="45,120 130,180 210,160 290,300 380,270 470,400 640,515" fill="none" stroke="#ff3d3d" stroke-width="23"/>'+coin(.42,500,330),"EVERYONE STAY CALM"));
add("Scenes","Moon Landing",frame('<circle cx="540" cy="135" r="90" fill="#eee"/><path d="M0 535Q200 450 350 520Q520 575 700 500V700H0Z" fill="#7b7b7b"/>'+coin(.5,255,380),"WE MADE IT"));
add("Scenes","Treasure Chest",frame('<rect x="105" y="370" width="490" height="180" rx="28" fill="#6b3c11" stroke="#ffba31" stroke-width="14"/><path d="M105 390Q350 220 595 390" fill="#854b18" stroke="#ffba31" stroke-width="14"/>'+coin(.48,350,360),"TREASURE"));
add("Scenes","Forge Anvil",frame('<path d="M130 470H570L520 555H180Z" fill="#333" stroke="#aaa" stroke-width="10"/><path d="M245 360H455L505 410H195Z" fill="#555" stroke="#aaa" stroke-width="8"/>'+coin(.42,350,290),"FORGED SPARKD"));
add("Scenes","Community",frame(coin(.38,350,270)+'<circle cx="170" cy="465" r="70" fill="#315f38"/><circle cx="350" cy="485" r="70" fill="#315f38"/><circle cx="530" cy="465" r="70" fill="#315f38"/>',"TOGETHER WE RISE"));
add("Scenes","Brighter Tomorrow",frame('<circle cx="350" cy="240" r="125" fill="#ffc95c" opacity=".8"/><path d="M0 510L110 390L220 500L335 330L455 480L570 350L700 510V700H0Z" fill="#183b28"/>'+coin(.35,350,430),"A BRIGHTER TOMORROW"));
add("Scenes","SPARKD City",frame('<rect x="70" y="270" width="85" height="280" fill="#122638"/><rect x="170" y="220" width="95" height="330" fill="#17304a"/><rect x="285" y="300" width="90" height="250" fill="#102438"/><rect x="390" y="185" width="105" height="365" fill="#19354c"/><rect x="515" y="255" width="105" height="295" fill="#122638"/>'+coin(.34,350,380),"SPARKD CITY"));

// 10 props
add("Props","Coin",prop("SPARKD COIN",coin(.78,350,315)));
add("Props","Diamond Hands",prop("DIAMOND HANDS",diamondHand("left")+diamondHand("right")+coin(.58,350,310)));
add("Props","Fire",prop("FIRE",'<path d="M205 500Q150 360 240 270Q220 420 310 455Q285 315 380 195Q350 380 445 445Q455 315 545 270Q560 410 500 510Z" fill="url(#fire)"/>'));
add("Props","Rocket",prop("ROCKET",'<text x="185" y="500" font-size="340">🚀</text>'));
add("Props","Moon",prop("MOON",'<circle cx="350" cy="315" r="190" fill="#e9e9e9"/><circle cx="290" cy="245" r="40" fill="#c7c7c7"/><circle cx="430" cy="360" r="55" fill="#c7c7c7"/>'));
add("Props","Crown",prop("CROWN",'<text x="175" y="500" font-size="340">👑</text>'));
add("Props","Money Bag",prop("BAG",'<text x="175" y="500" font-size="340">💰</text>'));
add("Props","Up Arrow",prop("UP",'<path d="M120 500L440 180L360 100H585V325L505 245L185 565Z" fill="#39ff75"/>'));
add("Props","Down Arrow",prop("DOWN",'<path d="M120 180L440 500L360 580H585V355L505 435L185 115Z" fill="#ff3d3d"/>'));
add("Props","Speech Bubble",prop("SAY IT",'<path d="M80 105H620V450H350L205 575L242 450H80Z" fill="#fff" stroke="#111" stroke-width="16"/>'));

// 5 templates
add("Templates","Top Bottom",template("TOP TEXT / BOTTOM TEXT","single"));
add("Templates","Expectation Reality",template("EXPECTATION / REALITY","split"));
add("Templates","Before After",template("BEFORE / AFTER","split"));
add("Templates","Four Panel",template("4-PANEL","four"));
add("Templates","Caption This",template("CAPTION THIS","single"));

if(assets.length!==50) console.warn("SPARKD asset count:",assets.length);

function dataUrl(source){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);}
function addToCanvas(asset){
 if(!window.canvas||!window.fabric)return;
 fabric.loadSVGFromString(asset.svg,function(objects,options){
  const obj=fabric.util.groupSVGElements(objects,options);
  const max=650,scale=Math.min(max/(obj.width||max),max/(obj.height||max),1);
  obj.set({left:215,top:215,selectable:true,evented:true});
  obj.scale(scale);
  canvas.add(obj);canvas.setActiveObject(obj);canvas.renderAll();
 });
}

window.addEventListener("load",function(){
 const btn=document.getElementById("assetsBtn"),panel=document.getElementById("assetsPanel"),grid=document.getElementById("assetsGrid"),cats=document.getElementById("assetsCategories"),close=document.getElementById("assetsClose");
 if(!btn||!panel||!grid||!cats)return;
 const categories=["All",...new Set(assets.map(a=>a.category))];let active="All";
 function render(){
  grid.innerHTML="";
  assets.filter(a=>active==="All"||a.category===active).forEach(asset=>{
   const item=document.createElement("button");item.type="button";item.className="assetItem";item.title=asset.name;
   const img=document.createElement("img");img.src=dataUrl(asset.svg);img.alt=asset.name;
   const span=document.createElement("span");span.textContent=asset.name;item.append(img,span);
   item.onclick=()=>addToCanvas(asset);grid.appendChild(item);
  });
  [...cats.children].forEach(b=>b.classList.toggle("active",b.dataset.category===active));
 }
 categories.forEach(cat=>{const b=document.createElement("button");b.type="button";b.textContent=cat;b.dataset.category=cat;b.onclick=()=>{active=cat;render();};cats.appendChild(b);});
 btn.onclick=()=>{const open=panel.hidden;panel.hidden=!open;btn.setAttribute("aria-expanded",String(open));};
 if(close)close.onclick=()=>{panel.hidden=true;btn.setAttribute("aria-expanded","false");};
 render();
});
})();