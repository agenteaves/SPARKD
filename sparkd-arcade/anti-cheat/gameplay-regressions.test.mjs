import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const game=readFileSync(new URL('../controls/game.js',import.meta.url),'utf8');

test('runner stops updating immediately after the last life is lost',()=>{
  const update=game.slice(game.indexOf('function update(dt)'),game.indexOf("window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==runnerFrame"));
  assert.match(update,/if\(lives<=0\)\{finish\(\);return\}/);
});
test('EXIT behavior remains outside gameplay regression scope',()=>{
  assert.ok(game.includes("function finish()"));
});
