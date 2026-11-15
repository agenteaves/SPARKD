(()=>{'use strict';
const tracks={
 runner:'https://opengameart.org/sites/default/files/a_flawless_getaway_loop.mp3',
 boss:'https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Epic%20Boss%20Battle%20%5BSeamlessly%20Looping%5D.wav'
};
let current=null,enabled=true;
const player=new Audio();player.loop=true;player.preload='none';player.volume=.075;
player.addEventListener('error',()=>console.warn('SPARKD music could not load:',player.src));
function sync(mode,active,on){
 enabled=!!on;
 const wanted=active&&enabled&&(mode==='runner'||mode==='boss')?mode:null;
 if(!wanted){player.pause();return}
 if(current!==wanted){current=wanted;player.pause();player.src=tracks[wanted];player.load()}
 if(player.paused){const attempt=player.play();if(attempt&&attempt.catch)attempt.catch(()=>{});}
}
window.SPARKDMusic={sync,stop(){player.pause();current=null;player.removeAttribute('src');player.load()}};
})();