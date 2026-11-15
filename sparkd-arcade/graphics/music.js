(()=>{'use strict';
const tracks={
 runner:'https://opengameart.org/sites/default/files/plains_stage_bpm125.mp3',
 boss:'https://opengameart.org/sites/default/files/8bit_action_boss_battle_bpm145.mp3'
};
let current=null,enabled=true;
const player=new Audio();player.loop=true;player.preload='none';player.volume=.27;
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