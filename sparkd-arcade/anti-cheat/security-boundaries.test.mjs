import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../controls/game.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const envelope=readFileSync(new URL('./replay-envelope.mjs',import.meta.url),'utf8');
test('browser cannot submit a claimed score directly to the public scores table',()=>{
  assert.match(game,/function submitOnlineScore\(/);
  const fn=game.slice(game.indexOf('function submitOnlineScore('),game.indexOf('document.getElementById(\'refreshOnlineScores\')'));
  assert.doesNotMatch(fn,/fetch\s*\(|XMLHttpRequest|sendBeacon|\.insert\s*\(/);
});
test('only one public top-five list is presented',()=>{
  assert.match(page,/id="onlineEntries"/);
  assert.doesNotMatch(page,/id="weeklyEntries"|id="leaderboardEntries"/);
});
test('replay-envelope validator never authorizes scores',()=>{
  assert.match(envelope,/gameplay-verifier-not-implemented/);
  assert.doesNotMatch(envelope,/accepted:\s*true/);
});
