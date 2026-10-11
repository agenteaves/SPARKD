import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const api = read("mobile-app/app/src/main/java/com/sparkd/community/ContestBurnApi.kt");
const recovery = read("mobile-app/app/src/main/java/com/sparkd/community/BurnRecoveryStore.kt");
const android = read("mobile-app/app/src/main/java/com/sparkd/community/ProductionApp.kt");
const web = read("meme-forge/upgrades/contest-submit.js");
const app = read("meme-of-the-week/app.js");
const rules = read("meme-of-the-week/contest-rules.js");
const guide = read("meme-of-the-week/contest-guide.html");
const index = read("meme-of-the-week/index.html");
const iphone = read("iphone-web-app/index.html");
const burnTest = read("meme-of-the-week/burn-test.html");

assert.doesNotMatch(api + android + web + app + rules + guide + index + iphone + burnTest, /2,000\s+SPARKD|2000000000/);
assert.doesNotMatch(app, /\\)\\s*\\*\\s*2000/, "contest totals must never use the retired fixed entry amount");
assert(!fs.existsSync(path.join(root, "meme-of-the-week/voting.js")));
assert(!fs.existsSync(path.join(root, "meme-of-the-week/voter-reward.js")));
assert.match(api, /rawBurnAmount\.matches\(Regex\("\[1-9\]\[0-9\]\*"/);
assert.match(api, /p\.getString\("quoteToken"\)/);
assert.match(api, /put\("quoteToken",quoteToken\)/);
assert.match(recovery, /json\.put\("quoteToken", it\)/);
assert.match(android, /burnAmountLabel/);
assert.match(android, /Each entry burns \$3 worth of SPARKD/);
assert.match(web, /ENTRY_USD:\s*3/);
assert.match(app, /data\.totalBurned/);
assert.match(rules, /verified burn of \$3 worth of SPARKD/i);
assert.match(guide, /Each entry burns \$3 worth of SPARKD/);
assert.match(index, /Each entry burns \$3 worth of SPARKD/);
assert.match(iphone, /Each entry burns \$3 worth of SPARKD/);
assert.doesNotMatch(index + rules + guide, /voting\.js|voter-reward\.js|Voting Rules|voting phase/i);

console.log("SPARKD dynamic contest pricing checks passed for web, iPhone, and Android clients.");
