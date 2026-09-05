////////////////////////////////////////////////////
// SPARKD MEME FORGE - ORIGINAL ASSET LIBRARY
// 50 built-in vector assets, no external media
////////////////////////////////////////////////////

(function () {
"use strict";

const assets = [];
const add = (category, name, svg) => assets.push({category,name,svg});

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const wrap = body => '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">'+body+'</svg>';
const textSvg = (label, sub="") => wrap(
  '<rect width="600" height="600" rx="50" fill="#111"/><circle cx="300" cy="260" r="185" fill="#ff6a00" opacity=".15"/>'+
  '<text x="300" y="290" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="'+(label.length>9?62:86)+'" fill="#fff" stroke="#000" stroke-width="8" paint-order="stroke" font-weight="900">'+esc(label)+'</text>'+
  (sub?'<text x="300" y="370" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" fill="#ff9b42" font-weight="700">'+esc(sub)+'</text>':'')
);
const sticker = (symbol,label) => wrap(
  '<circle cx="300" cy="270" r="205" fill="#ff6a00"/><circle cx="300" cy="270" r="180" fill="#141414"/>'+
  '<text x="300" y="320" text-anchor="middle" font-size="170">'+symbol+'</text>'+
  '<text x="300" y="520" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="58" fill="#fff" stroke="#000" stroke-width="7" paint-order="stroke">'+esc(label)+'</text>'
);
const bg = (kind,a,b,label) => wrap(
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient></defs>'+
  '<rect width="600" height="600" fill="url(#g)"/>'+
  (kind==="space"?'<circle cx="95" cy="100" r="3" fill="#fff"/><circle cx="480" cy="75" r="5" fill="#fff"/><circle cx="520" cy="320" r="3" fill="#fff"/><circle cx="155" cy="420" r="4" fill="#fff"/><circle cx="320" cy="170" r="2" fill="#fff"/>':'')+
  (kind==="chart"?'<polyline points="20,500 110,430 180,455 250,330 325,355 410,190 490,225 580,70" fill="none" stroke="#52ff8a" stroke-width="18"/><polygon points="580,70 535,95 565,120" fill="#52ff8a"/>':'')+
  '<text x="300" y="560" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="34" fill="#fff" opacity=".85">'+esc(label)+'</text>'
);

// 8 SPARKD brand assets
[
["SPARKD","ORIGINAL"],["SPARKD","MEME FORGE"],["SPARKD","ON SOLANA"],["SPARKD","CREATE"],["SPARKD","ENTER"],["SPARKD","VOTE"],["SPARKD","WIN"],["SPARKD","LEGEND"]
].forEach(x=>add("SPARKD",x.join(" "),textSvg(x[0],x[1])));

// 10 crypto/meme stickers
[
["🔥","ON FIRE"],["🚀","LIFTOFF"],["🌙","TO THE MOON"],["⚡","SPARK IT"],["💎","DIAMOND HANDS"],
["👑","KING MODE"],["💰","BAG ALERT"],["📈","UP ONLY"],["🧠","BIG BRAIN"],["🏆","WINNER"]
].forEach(x=>add("Stickers",x[1],sticker(x[0],x[1])));

// 8 backgrounds
[
["space","#050816","#2a124f","DEEP SPACE"],["space","#071b2d","#5a1600","ORBIT"],["chart","#07120b","#101010","GREEN CANDLE"],
["chart","#1a0909","#090909","VOLATILITY"],["space","#180400","#ff6a00","SOLAR FLARE"],["space","#001c24","#001014","NEON NIGHT"],
["space","#151515","#3b2100","GOLD RUSH"],["space","#090018","#20002f","COSMIC PURPLE"]
].forEach(x=>add("Backgrounds",x[3],bg(x[0],x[1],x[2],x[3])));

// 8 original characters
[
["🤖","SPARK BOT"],["🧑‍🚀","MOON PILOT"],["🦊","FORGE FOX"],["🐸","SPARK FROG"],
["🦁","BULL LION"],["🦍","HODL APE"],["🐂","BULL RUN"],["🐻","BEAR WATCH"]
].forEach(x=>add("Characters",x[1],sticker(x[0],x[1])));

// 8 reaction/text tiles
[
["SEND IT",""],["LFG",""],["HODL",""],["BUY?","DYOR"],["WEN MOON?",""],["I'M IN",""],["NO FEAR",""],["SPARKD!",""]
].forEach(x=>add("Reactions",x[0],textSvg(x[0],x[1])));

// 8 blank templates
[
["TOP TEXT","BOTTOM TEXT"],["ME","THE MARKET"],["EXPECTATION","REALITY"],["BEFORE","AFTER"],
["NOBODY:","ME:"],["WHEN YOU",""],["POV:",""],["CHOOSE WISELY",""]
].forEach(x=>add("Templates",x.join(" / "),wrap(
 '<rect width="600" height="600" fill="#e9e9e9"/><rect x="25" y="25" width="550" height="550" rx="25" fill="#fff" stroke="#111" stroke-width="10"/>'+
 '<line x1="300" y1="25" x2="300" y2="575" stroke="#ddd" stroke-width="5"/>'+
 '<text x="300" y="90" text-anchor="middle" font-family="Impact,sans-serif" font-size="48" fill="#111">'+esc(x[0])+'</text>'+
 '<text x="300" y="540" text-anchor="middle" font-family="Impact,sans-serif" font-size="48" fill="#111">'+esc(x[1])+'</text>'
)));

// exactly 50
if (assets.length !== 50) console.warn("SPARKD asset count:", assets.length);

function dataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function addToCanvas(asset) {
  if (!window.canvas || !window.fabric) return;
  fabric.loadSVGFromString(asset.svg, function(objects, options) {
    const obj = fabric.util.groupSVGElements(objects, options);
    const max = 650;
    const scale = Math.min(max / (obj.width || max), max / (obj.height || max), 1);
    obj.set({left:215, top:215, selectable:true, evented:true});
    obj.scale(scale);
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
  });
}

window.addEventListener("load", function () {
  const btn = document.getElementById("assetsBtn");
  const panel = document.getElementById("assetsPanel");
  const grid = document.getElementById("assetsGrid");
  const cats = document.getElementById("assetsCategories");
  const close = document.getElementById("assetsClose");
  if (!btn || !panel || !grid || !cats) return;

  const categories = ["All", ...new Set(assets.map(a=>a.category))];
  let active = "All";

  function render() {
    grid.innerHTML = "";
    assets.filter(a=>active==="All" || a.category===active).forEach(asset=>{
      const item=document.createElement("button");
      item.type="button";
      item.className="assetItem";
      item.title=asset.name;
      const img=document.createElement("img");
      img.src=dataUrl(asset.svg);
      img.alt=asset.name;
      const span=document.createElement("span");
      span.textContent=asset.name;
      item.append(img,span);
      item.onclick=()=>addToCanvas(asset);
      grid.appendChild(item);
    });
    [...cats.children].forEach(b=>b.classList.toggle("active",b.dataset.category===active));
  }

  categories.forEach(cat=>{
    const b=document.createElement("button");
    b.type="button";
    b.textContent=cat;
    b.dataset.category=cat;
    b.onclick=()=>{active=cat;render();};
    cats.appendChild(b);
  });

  btn.onclick=()=>{
    const open=panel.hidden;
    panel.hidden=!open;
    btn.setAttribute("aria-expanded",String(open));
  };
  if(close) close.onclick=()=>{panel.hidden=true;btn.setAttribute("aria-expanded","false");};
  render();
});

})();