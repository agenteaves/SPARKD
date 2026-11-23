import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const game = readFileSync(new URL('../controls/game.js', import.meta.url), 'utf8');
const section = (start, end) => game.slice(game.indexOf(start), game.indexOf(end, game.indexOf(start) + start.length));

test('only a fresh game resets the accumulated score', () => {
  const reset = section('function reset()', 'function syncInvincibleButton()');
  const nextLevel = section('function advanceRunnerLevel()', 'function launchSpaceWar()');
  const space = section('function launchSpaceWar()', 'function startBoss()');
  assert.match(reset, /score=0/);
  assert.doesNotMatch(nextLevel, /(?:^|[;{])\s*score\s*=/);
  assert.doesNotMatch(space, /(?:^|[;{])\s*score\s*=/);
});

test('boss and space rewards contribute to the same score', () => {
  assert.match(game, /score\+=1500\+level\*500/);
  for (const reward of ['score+=1500', 'score+=75', 'score+=100', 'score+=3000']) {
    assert.ok(game.includes(reward), 'missing shared score reward: ' + reward);
  }
});

test('final run exports the single combined score, without a second leaderboard', () => {
  const finish = game.slice(game.indexOf('function finish()'), game.indexOf('function finish()') + 1800);
  assert.match(finish, /score:Math\.floor\(score\)/);
  const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((page.match(/id="onlineEntries"/g) || []).length, 1);
  assert.doesNotMatch(page, /id="weeklyEntries"|id="practiceEntries"/);
});
